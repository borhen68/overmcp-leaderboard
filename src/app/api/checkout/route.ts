import { and, asc, desc, eq, max, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase, isDatabaseConfigured } from "@/db";
import { bids, products } from "@/db/schema";
import {
  BID_INCREMENT_CENTS,
  MAXIMUM_BID_CENTS,
  MINIMUM_BID_CENTS,
  PRODUCT_CATEGORIES,
} from "@/lib/constants";
import { normalizeIdentity } from "@/lib/identity";
import { allowRequest, clientAddress } from "@/lib/rate-limit";
import { readJsonBody, RequestBodyTooLargeError } from "@/lib/request-body";
import { getStripe } from "@/lib/stripe";
import { verifyIconPayload } from "@/lib/website-metadata";

const targetRankSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(10)]);
const checkoutSchema = z.object({
  requestId: z.uuid(),
  identity: z.string().trim().min(2).max(500),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().min(10).max(280),
  category: z.enum(PRODUCT_CATEGORIES),
  email: z.email().max(254),
  targetRank: targetRankSchema,
  amountCents: z.number().int().min(MINIMUM_BID_CENTS).max(MAXIMUM_BID_CENTS),
  iconDataUrl: z.string().max(128_100).optional(),
  iconSignature: z.string().regex(/^[a-f0-9]{64}$/).optional(),
});

function dataFastMetadata(request: NextRequest) {
  const visitorId = request.cookies.get("datafast_visitor_id")?.value;
  const sessionId = request.cookies.get("datafast_session_id")?.value;

  return {
    ...(visitorId && visitorId.length <= 500 ? { datafast_visitor_id: visitorId } : {}),
    ...(sessionId && sessionId.length <= 500 ? { datafast_session_id: sessionId } : {}),
  };
}

function publicOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, "");
  return new URL(request.url).origin;
}

async function requiredTotalForRank(targetRank: 1 | 2 | 3 | 10) {
  const db = getDatabase();
  const paidBidTotals = db
    .select({
      productId: bids.productId,
      bidCents: sql<number>`sum(${bids.amountCents} - ${bids.refundedCents})`.mapWith(Number).as("bid_cents"),
      latestBidAt: max(bids.paidAt).as("latest_bid_at"),
    })
    .from(bids)
    .where(eq(bids.status, "paid"))
    .groupBy(bids.productId)
    .as("paid_bid_totals");

  const rows = await db
    .select({ bidCents: paidBidTotals.bidCents })
    .from(products)
    .innerJoin(paidBidTotals, eq(products.id, paidBidTotals.productId))
    .where(eq(products.status, "active"))
    .orderBy(
      desc(paidBidTotals.bidCents),
      asc(paidBidTotals.latestBidAt),
      asc(products.createdAt),
      asc(products.id),
    )
    .limit(targetRank);

  const positionTotal = rows[targetRank - 1]?.bidCents;
  return positionTotal ? positionTotal + BID_INCREMENT_CENTS : MINIMUM_BID_CENTS;
}

type CheckoutBid = {
  id: string;
  productId: string;
  productIdentityKey: string;
  amountCents: number;
  targetTotalCents: number | null;
  customerEmail: string | null;
  checkoutSessionId: string | null;
  createdAt: Date;
  status: "pending" | "paid" | "expired" | "failed" | "refunded" | "disputed";
};

async function checkoutBidForRequest(requestId: string): Promise<CheckoutBid | undefined> {
  return (await getDatabase()
    .select({
      id: bids.id,
      productId: bids.productId,
      productIdentityKey: products.identityKey,
      amountCents: bids.amountCents,
      targetTotalCents: bids.targetTotalCents,
      customerEmail: bids.customerEmail,
      checkoutSessionId: bids.checkoutSessionId,
      createdAt: bids.createdAt,
      status: bids.status,
    })
    .from(bids)
    .innerJoin(products, eq(products.id, bids.productId))
    .where(eq(bids.checkoutRequestId, requestId))
    .limit(1))[0];
}

async function pendingCheckoutBidForProduct(productId: string): Promise<CheckoutBid | undefined> {
  return (await getDatabase()
    .select({
      id: bids.id,
      productId: bids.productId,
      productIdentityKey: products.identityKey,
      amountCents: bids.amountCents,
      targetTotalCents: bids.targetTotalCents,
      customerEmail: bids.customerEmail,
      checkoutSessionId: bids.checkoutSessionId,
      createdAt: bids.createdAt,
      status: bids.status,
    })
    .from(bids)
    .innerJoin(products, eq(products.id, bids.productId))
    .where(and(eq(bids.productId, productId), eq(bids.status, "pending")))
    .limit(1))[0];
}

async function createCheckoutSession(
  request: NextRequest,
  bid: CheckoutBid,
  targetRank: 1 | 2 | 3 | 10,
  requestId: string,
) {
  if (!bid.customerEmail || !bid.targetTotalCents) throw new Error("Checkout details are incomplete.");

  const stripe = getStripe();
  const origin = publicOrigin(request);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: bid.customerEmail,
    success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/?checkout=cancelled`,
    expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
    allow_promotion_codes: false,
    billing_address_collection: "auto",
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: bid.amountCents,
        product_data: {
          name: "OverMCP leaderboard bid",
          description: `Placement on overmcp.com · raises your listing's total bid to $${(bid.targetTotalCents / 100).toLocaleString("en-US")}`,
        },
      },
    }],
    metadata: {
      bid_id: bid.id,
      product_id: bid.productId,
      target_rank: String(targetRank),
      target_total_cents: String(bid.targetTotalCents),
      ...dataFastMetadata(request),
    },
    payment_intent_data: {
      metadata: {
        bid_id: bid.id,
        product_id: bid.productId,
        target_total_cents: String(bid.targetTotalCents),
      },
    },
  }, { idempotencyKey: `overmcp_checkout_${requestId}` });

  await getDatabase()
    .update(bids)
    .set({ checkoutSessionId: session.id, status: "pending" })
    .where(eq(bids.id, bid.id));

  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  return session.url;
}

async function resumeCheckout(
  request: NextRequest,
  existingBid: CheckoutBid,
  input: z.infer<typeof checkoutSchema>,
  identityKey: string,
) {
  const normalizedEmail = input.email.toLowerCase();
  if (
    existingBid.productIdentityKey !== identityKey
    || existingBid.customerEmail !== normalizedEmail
    || existingBid.targetTotalCents !== input.amountCents
  ) {
    return NextResponse.json({ error: "This checkout request was already used with different details." }, { status: 409 });
  }

  if (existingBid.status === "paid") {
    return NextResponse.json({ checkoutUrl: `${publicOrigin(request)}/?checkout=success` });
  }
  if (existingBid.status === "expired" || existingBid.status === "refunded" || existingBid.status === "disputed") {
    return NextResponse.json({ error: "This checkout can no longer be reused. Please submit again." }, { status: 409 });
  }

  try {
    if (existingBid.checkoutSessionId) {
      const session = await getStripe().checkout.sessions.retrieve(existingBid.checkoutSessionId);
      if (session.payment_status === "paid") {
        return NextResponse.json({ checkoutUrl: `${publicOrigin(request)}/?checkout=success` });
      }
      if (session.status === "open" && session.url) return NextResponse.json({ checkoutUrl: session.url });
      return NextResponse.json({ error: "This checkout expired. Please submit again." }, { status: 409 });
    }

    const checkoutUrl = await createCheckoutSession(request, existingBid, input.targetRank, input.requestId);
    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    await getDatabase().update(bids).set({ status: "failed" }).where(eq(bids.id, existingBid.id));
    console.error("Stripe checkout resume failed", error);
    return NextResponse.json({ error: "Checkout could not be started. Please try again." }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured() || !process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Checkout is not configured yet." }, { status: 503 });
  }

  if (!allowRequest(`checkout:${clientAddress(request)}`, 8, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Please wait a few minutes." },
      { status: 429, headers: { "Retry-After": "600" } },
    );
  }

  let body: unknown;
  try {
    body = await readJsonBody(request, 150_000);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    }
    throw error;
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid submission." }, { status: 400 });
  }

  let identity;
  try {
    identity = normalizeIdentity(parsed.data.identity);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid URL." }, { status: 400 });
  }

  const previousRequest = await checkoutBidForRequest(parsed.data.requestId);
  if (previousRequest) return resumeCheckout(request, previousRequest, parsed.data, identity.identityKey);

  const db = getDatabase();
  const currentProduct = (await db
    .select({ id: products.id, status: products.status })
    .from(products)
    .where(eq(products.identityKey, identity.identityKey))
    .limit(1))[0];

  if (currentProduct?.status === "hidden") {
    return NextResponse.json({ error: "This product is not eligible for a new placement." }, { status: 403 });
  }

  const requiredTotal = await requiredTotalForRank(parsed.data.targetRank);

  if (parsed.data.amountCents < requiredTotal) {
    return NextResponse.json({
      error: `The current #${parsed.data.targetRank} threshold is $${(requiredTotal / 100).toLocaleString("en-US")}. Refresh your bid and try again.`,
      requiredAmountCents: requiredTotal,
    }, { status: 409 });
  }

  const iconDataUrl = verifyIconPayload(identity.identityKey, parsed.data.iconDataUrl, parsed.data.iconSignature)
    ? parsed.data.iconDataUrl
    : null;
  const now = new Date();
  await db
    .insert(products)
    .values({
      identityKey: identity.identityKey,
      sourceUrl: identity.sourceUrl,
      displayName: parsed.data.name,
      description: parsed.data.description,
      category: parsed.data.category,
      iconDataUrl,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing({ target: products.identityKey });

  const product = (await db
    .select({ id: products.id, status: products.status })
    .from(products)
    .where(eq(products.identityKey, identity.identityKey))
    .limit(1))[0];
  if (!product) return NextResponse.json({ error: "Unable to prepare this listing." }, { status: 500 });
  if (product.status === "hidden") {
    return NextResponse.json({ error: "This product is not eligible for a new placement." }, { status: 403 });
  }

  const pendingBid = await pendingCheckoutBidForProduct(product.id);
  if (pendingBid) {
    const stale = Date.now() - pendingBid.createdAt.getTime() > 35 * 60 * 1000;
    if (stale) {
      await db
        .update(bids)
        .set({ status: "expired" })
        .where(and(eq(bids.id, pendingBid.id), eq(bids.status, "pending")));
    } else if (
      pendingBid.checkoutSessionId
      && pendingBid.customerEmail === parsed.data.email.toLowerCase()
      && pendingBid.targetTotalCents === parsed.data.amountCents
    ) {
      return resumeCheckout(request, pendingBid, parsed.data, identity.identityKey);
    } else {
      return NextResponse.json({
        error: "A checkout for this product is already open. Complete it or try again after it expires.",
      }, { status: 409 });
    }
  }

  const paidTotalRows = await db
    .select({ value: sql<number>`sum(${bids.amountCents} - ${bids.refundedCents})`.mapWith(Number) })
    .from(bids)
    .where(and(eq(bids.productId, product.id), eq(bids.status, "paid")));
  const existingPaidTotal = paidTotalRows[0]?.value ?? 0;
  const chargeCents = parsed.data.amountCents - existingPaidTotal;
  if (chargeCents < MINIMUM_BID_CENTS) {
    return NextResponse.json({
      error: existingPaidTotal
        ? `This product already has a $${(existingPaidTotal / 100).toLocaleString("en-US")} total bid. Increase it by at least $5.`
        : "The minimum bid is $5.",
    }, { status: 400 });
  }

  const insertedBid = (await db
    .insert(bids)
    .values({
      productId: product.id,
      amountCents: chargeCents,
      targetTotalCents: parsed.data.amountCents,
      checkoutRequestId: parsed.data.requestId,
      customerEmail: parsed.data.email.toLowerCase(),
      status: "pending",
    })
    .onConflictDoNothing()
    .returning({ id: bids.id }))[0];

  const checkoutBid = await checkoutBidForRequest(parsed.data.requestId);
  if (!checkoutBid) {
    return NextResponse.json({
      error: "A checkout for this product was just opened. Complete it or try again after it expires.",
    }, { status: 409 });
  }

  if (!insertedBid) return resumeCheckout(request, checkoutBid, parsed.data, identity.identityKey);

  if (product.status === "pending") {
    await db
      .update(products)
      .set({
        displayName: parsed.data.name,
        description: parsed.data.description,
        category: parsed.data.category,
        sourceUrl: identity.sourceUrl,
        ...(iconDataUrl ? { iconDataUrl } : {}),
        updatedAt: now,
      })
      .where(eq(products.id, product.id));
  }

  try {
    const checkoutUrl = await createCheckoutSession(request, checkoutBid, parsed.data.targetRank, parsed.data.requestId);
    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    await db.update(bids).set({ status: "failed" }).where(eq(bids.id, checkoutBid.id));
    console.error("Stripe checkout creation failed", error);
    return NextResponse.json({ error: "Checkout could not be started. Please try again." }, { status: 502 });
  }
}
