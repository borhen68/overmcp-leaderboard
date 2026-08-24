import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase, isDatabaseConfigured } from "@/db";
import { products, raceSupports } from "@/db/schema";
import { crowdRaceWindow } from "@/lib/crowd-race";
import { getLeaderboardData } from "@/lib/leaderboard";
import { allowRequest, clientAddress } from "@/lib/rate-limit";
import { readJsonBody, RequestBodyTooLargeError } from "@/lib/request-body";

export const runtime = "nodejs";

const supportSchema = z.object({
  visitorId: z.uuid(),
  productId: z.uuid(),
  raceDay: z.iso.date(),
});

const botPattern = /bot|crawler|spider|preview|slurp|facebookexternalhit|discordbot/i;

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "The founder race is temporarily unavailable." }, { status: 503 });
  }

  const address = clientAddress(request);
  if (!allowRequest(`race-support:${address}`, 30, 24 * 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many support attempts from this network." }, { status: 429 });
  }

  const userAgent = request.headers.get("user-agent") ?? "unknown";
  if (botPattern.test(userAgent)) {
    return NextResponse.json({ error: "Automated traffic cannot support a product." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await readJsonBody(request, 2_000);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    }
    throw error;
  }

  const parsed = supportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid race support request." }, { status: 400 });
  }

  const raceWindow = crowdRaceWindow();
  if (parsed.data.raceDay !== raceWindow.day) {
    return NextResponse.json({
      error: "A new daily race has started. Refresh and choose again.",
      currentRaceDay: raceWindow.day,
    }, { status: 409 });
  }

  const salt = process.env.ANALYTICS_SALT
    ?? (process.env.NODE_ENV === "development" ? "overmcp-local-race-support" : null);
  if (!salt) {
    return NextResponse.json({ error: "Support verification is not configured." }, { status: 503 });
  }

  const db = getDatabase();
  const product = (await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.id, parsed.data.productId), eq(products.status, "active")))
    .limit(1))[0];

  if (!product) return NextResponse.json({ error: "This product is not in the race." }, { status: 404 });

  const dedupeKey = createHash("sha256")
    .update(`${salt}:${raceWindow.day}:${address}:${userAgent}`)
    .digest("hex");

  await db
    .insert(raceSupports)
    .values({
      raceDay: raceWindow.day,
      productId: product.id,
      visitorId: parsed.data.visitorId,
      dedupeKey,
      supportedAt: new Date(),
    });

  return NextResponse.json({
    ok: true,
    selectedProductId: product.id,
    data: await getLeaderboardData(),
  });
}
