import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getDatabase, isDatabaseConfigured } from "@/db";
import { bids, products, stripeEvents } from "@/db/schema";
import { readTextBody, RequestBodyTooLargeError } from "@/lib/request-body";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

const MAX_WEBHOOK_BYTES = 2_000_000;

export async function POST(request: Request) {
  if (!isDatabaseConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });

  let event: Stripe.Event;
  try {
    const rawBody = await readTextBody(request, MAX_WEBHOOK_BYTES);
    event = getStripe().webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: "Webhook is too large." }, { status: 413 });
    }
    console.warn("Stripe webhook signature validation failed.");
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const db = getDatabase();
  let duplicate = false;

  try {
    await db.transaction(async (tx) => {
      const claimed = await tx
        .insert(stripeEvents)
        .values({ id: event.id, eventType: event.type })
        .onConflictDoNothing({ target: stripeEvents.id })
        .returning({ id: stripeEvents.id });

      if (!claimed.length) {
        duplicate = true;
        return;
      }

      if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
        const session = event.data.object as Stripe.Checkout.Session;
        const bidId = session.metadata?.bid_id;
        const productId = session.metadata?.product_id;

        if (bidId && productId && session.payment_status === "paid") {
          const pendingBid = (await tx
            .select({ amountCents: bids.amountCents })
            .from(bids)
            .where(and(eq(bids.id, bidId), eq(bids.productId, productId)))
            .limit(1))[0];

          if (pendingBid) {
            if (session.currency !== "usd" || session.amount_total !== pendingBid.amountCents) {
              throw new Error(`Stripe amount mismatch for bid ${bidId}.`);
            }

            const now = new Date();
            const paid = await tx
              .update(bids)
              .set({
                status: "paid",
                paidAt: now,
                checkoutSessionId: session.id,
                paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
                customerEmail: session.customer_details?.email ?? session.customer_email,
              })
              .where(and(eq(bids.id, bidId), eq(bids.productId, productId)))
              .returning({ id: bids.id });

            if (paid.length) {
              await tx
                .update(products)
                .set({ status: "active", updatedAt: now })
                .where(and(eq(products.id, productId), eq(products.status, "pending")));
            }
          }
        }
      }

      if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const bidId = session.metadata?.bid_id;
        if (bidId) {
          await tx
            .update(bids)
            .set({ status: event.type === "checkout.session.expired" ? "expired" : "failed" })
            .where(and(eq(bids.id, bidId), eq(bids.status, "pending")));
        }
      }

      if (event.type === "charge.refunded") {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
        const bidId = charge.metadata?.bid_id;
        const values = {
          refundedCents: charge.amount_refunded,
          status: (charge.refunded ? "refunded" : "paid") as "refunded" | "paid",
          ...(paymentIntentId ? { paymentIntentId } : {}),
        };

        if (bidId) await tx.update(bids).set(values).where(eq(bids.id, bidId));
        else if (paymentIntentId) await tx.update(bids).set(values).where(eq(bids.paymentIntentId, paymentIntentId));
      }

      if (event.type === "charge.dispute.created" || event.type === "charge.dispute.closed") {
        const dispute = event.data.object as Stripe.Dispute;
        const paymentIntentId = typeof dispute.payment_intent === "string" ? dispute.payment_intent : dispute.payment_intent?.id;
        const bidId = dispute.metadata?.bid_id;
        const status = event.type === "charge.dispute.closed" && dispute.status === "won" ? "paid" : "disputed";

        if (bidId) await tx.update(bids).set({ status }).where(eq(bids.id, bidId));
        else if (paymentIntentId) await tx.update(bids).set({ status }).where(eq(bids.paymentIntentId, paymentIntentId));
      }
    });
  } catch (error) {
    console.error(`Stripe webhook processing failed for ${event.id}`, error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true, ...(duplicate ? { duplicate: true } : {}) });
}
