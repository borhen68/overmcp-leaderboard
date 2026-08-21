import { and, asc, count, desc, eq, gt, max, sql, sum } from "drizzle-orm";
import { getDatabase, isDatabaseConfigured } from "@/db";
import { bids, outboundClicks, products, visitors } from "@/db/schema";
import { BID_INCREMENT_CENTS, MINIMUM_BID_CENTS } from "@/lib/constants";
import { isStripeConfigured } from "@/lib/stripe";
import type { LeaderboardPayload } from "@/lib/types";

const emptyPositionPrices = {
  "1": MINIMUM_BID_CENTS,
  "3": MINIMUM_BID_CENTS,
  "10": MINIMUM_BID_CENTS,
} as const;

export function emptyLeaderboard(
  configured = isDatabaseConfigured(),
  available = configured,
): LeaderboardPayload {
  return {
    configured,
    available,
    paymentsConfigured: isStripeConfigured(),
    products: [],
    activity: [],
    categories: [],
    stats: {
      products: 0,
      totalClicks: 0,
      onlineVisitors: 0,
      totalVisitors: 0,
      minimumBidCents: MINIMUM_BID_CENTS,
    },
    positionPrices: { ...emptyPositionPrices },
    generatedAt: new Date().toISOString(),
  };
}

export async function getLeaderboardData(): Promise<LeaderboardPayload> {
  if (!isDatabaseConfigured()) return emptyLeaderboard(false);

  try {
    const db = getDatabase();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const paidBidTotals = db
      .select({
        productId: bids.productId,
        bidCents: sql<number>`sum(${bids.amountCents} - ${bids.refundedCents})`.mapWith(Number).as("bid_cents"),
        creditCents: sql<number>`sum(case when ${bids.fundingSource} = 'credit' then ${bids.amountCents} - ${bids.refundedCents} else 0 end)`.mapWith(Number).as("credit_cents"),
        latestBidAt: max(bids.paidAt).as("latest_bid_at"),
      })
      .from(bids)
      .where(eq(bids.status, "paid"))
      .groupBy(bids.productId)
      .as("paid_bid_totals");

    const clickTotals = db
      .select({
        productId: outboundClicks.productId,
        weeklyClicks: sql<number>`sum(case when ${outboundClicks.clickedAt} >= ${sevenDaysAgo} then 1 else 0 end)`
          .mapWith(Number)
          .as("weekly_clicks"),
        totalClicks: count().as("total_clicks"),
      })
      .from(outboundClicks)
      .groupBy(outboundClicks.productId)
      .as("click_totals");

    const leaderboardQuery = db
      .select({
        id: products.id,
        name: products.displayName,
        description: products.description,
        category: products.category,
        hasIcon: sql<number>`case when ${products.iconDataUrl} is null then 0 else 1 end`.mapWith(Number),
        createdAt: products.createdAt,
        bidCents: paidBidTotals.bidCents,
        creditCents: paidBidTotals.creditCents,
        latestBidAt: paidBidTotals.latestBidAt,
        weeklyClicks: sql<number>`coalesce(${clickTotals.weeklyClicks}, 0)`.mapWith(Number),
        totalClicks: sql<number>`coalesce(${clickTotals.totalClicks}, 0)`.mapWith(Number),
      })
      .from(products)
      .innerJoin(paidBidTotals, eq(products.id, paidBidTotals.productId))
      .leftJoin(clickTotals, eq(products.id, clickTotals.productId))
      .where(eq(products.status, "active"))
      .orderBy(desc(paidBidTotals.bidCents), asc(paidBidTotals.latestBidAt), asc(products.createdAt), asc(products.id))
      .limit(100);

    const activityQuery = db
      .select({
        id: bids.id,
        productId: products.id,
        productName: products.displayName,
        hasIcon: sql<number>`case when ${products.iconDataUrl} is null then 0 else 1 end`.mapWith(Number),
        amountCents: sql<number>`${bids.amountCents} - ${bids.refundedCents}`.mapWith(Number),
        fundingSource: bids.fundingSource,
        happenedAt: bids.paidAt,
      })
      .from(bids)
      .innerJoin(products, eq(bids.productId, products.id))
      .where(and(eq(bids.status, "paid"), eq(products.status, "active")))
      .orderBy(desc(bids.paidAt))
      .limit(8);

    const categoryQuery = db
      .select({ name: products.category, count: count() })
      .from(products)
      .innerJoin(paidBidTotals, eq(products.id, paidBidTotals.productId))
      .where(eq(products.status, "active"))
      .groupBy(products.category)
      .orderBy(desc(count()));

    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const [
      leaderboardRows,
      activityRows,
      categoryRows,
      productCountRows,
      clickCountRows,
      onlineRows,
      visitorCountRows,
    ] = await Promise.all([
      leaderboardQuery,
      activityQuery,
      categoryQuery,
      db.select({ value: count() }).from(products).innerJoin(paidBidTotals, eq(products.id, paidBidTotals.productId)).where(eq(products.status, "active")),
      db.select({ value: count() }).from(outboundClicks),
      db.select({ value: count() }).from(visitors).where(gt(visitors.lastSeenAt, twoMinutesAgo)),
      db.select({ value: count() }).from(visitors),
    ]);

    const rankedProducts = leaderboardRows.map((row, index) => ({
      id: row.id,
      rank: index + 1,
      name: row.name,
      description: row.description,
      category: row.category,
      hasIcon: Boolean(row.hasIcon),
      bidCents: row.bidCents,
      creditCents: row.creditCents,
      weeklyClicks: row.weeklyClicks,
      totalClicks: row.totalClicks,
      latestBidAt: (row.latestBidAt ?? row.createdAt).toISOString(),
    }));

    const priceForPosition = (position: number) => {
      const threshold = rankedProducts[position - 1]?.bidCents;
      return threshold ? threshold + BID_INCREMENT_CENTS : MINIMUM_BID_CENTS;
    };

    return {
      configured: true,
      available: true,
      paymentsConfigured: isStripeConfigured(),
      products: rankedProducts,
      activity: activityRows.flatMap((row) => row.happenedAt ? [{
        id: row.id,
        productId: row.productId,
        productName: row.productName,
        hasIcon: Boolean(row.hasIcon),
        amountCents: row.amountCents,
        fundingSource: row.fundingSource,
        happenedAt: row.happenedAt.toISOString(),
      }] : []),
      categories: categoryRows.map((row) => ({ name: row.name, count: row.count })),
      stats: {
        products: productCountRows[0]?.value ?? 0,
        totalClicks: clickCountRows[0]?.value ?? 0,
        onlineVisitors: onlineRows[0]?.value ?? 0,
        totalVisitors: visitorCountRows[0]?.value ?? 0,
        minimumBidCents: MINIMUM_BID_CENTS,
      },
      positionPrices: {
        "1": priceForPosition(1),
        "3": priceForPosition(3),
        "10": priceForPosition(10),
      },
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to load leaderboard data", error);
    return emptyLeaderboard(true, false);
  }
}
