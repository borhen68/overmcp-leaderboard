import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDatabase, isDatabaseConfigured } from "@/db";
import { outboundClicks, products } from "@/db/schema";

const botPattern = /bot|crawler|spider|preview|slurp|facebookexternalhit|discordbot/i;

export async function GET(request: Request, context: RouteContext<"/go/[id]">) {
  if (!isDatabaseConfigured()) return NextResponse.redirect(new URL("/", request.url), 307);

  const { id } = await context.params;
  const db = getDatabase();
  const product = (await db
    .select({ id: products.id, sourceUrl: products.sourceUrl })
    .from(products)
    .where(and(eq(products.id, id), eq(products.status, "active")))
    .limit(1))[0];

  if (!product) return NextResponse.redirect(new URL("/", request.url), 307);

  const userAgent = request.headers.get("user-agent") ?? "unknown";
  if (!botPattern.test(userAgent) && process.env.ANALYTICS_SALT) {
    const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const tenMinuteBucket = Math.floor(Date.now() / 600_000);
    const dedupeKey = createHash("sha256")
      .update(`${process.env.ANALYTICS_SALT}:${product.id}:${forwardedFor}:${userAgent}:${tenMinuteBucket}`)
      .digest("hex");

    await db
      .insert(outboundClicks)
      .values({ productId: product.id, dedupeKey })
      .onConflictDoNothing({ target: outboundClicks.dedupeKey });
  }

  return NextResponse.redirect(product.sourceUrl, 307);
}
