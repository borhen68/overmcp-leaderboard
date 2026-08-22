import { and, asc, count, desc, eq, gt, isNotNull, max, min, sql } from "drizzle-orm";
import { getDatabase, isDatabaseConfigured } from "@/db";
import { bids, outboundClicks, products, visitors } from "@/db/schema";
import { BID_INCREMENT_CENTS, MINIMUM_BID_CENTS } from "@/lib/constants";
import { isStripeConfigured } from "@/lib/stripe";
import type { LeaderboardPayload } from "@/lib/types";

const emptyPositionPrices = {
  "1": MINIMUM_BID_CENTS,
  "2": MINIMUM_BID_CENTS,
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
    marketHistory: [],
    marketMoves: [],
    rankHistory: [],
    stats: {
      products: 0,
      totalClicks: 0,
      onlineVisitors: 0,
      totalVisitors: 0,
      minimumBidCents: MINIMUM_BID_CENTS,
      confirmedBidCents: 0,
      confirmedBidCents24HoursAgo: 0,
      paidBidCents: 0,
      creditBidCents: 0,
      launchedAt: null,
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
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
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

    const marketDay = sql<string>`strftime('%Y-%m-%d', ${bids.paidAt} / 1000, 'unixepoch')`;
    const marketHistoryQuery = db
      .select({
        date: marketDay.as("market_day"),
        volumeCents: sql<number>`sum(${bids.amountCents} - ${bids.refundedCents})`.mapWith(Number),
        paidVolumeCents: sql<number>`sum(case when ${bids.fundingSource} = 'stripe' then ${bids.amountCents} - ${bids.refundedCents} else 0 end)`.mapWith(Number),
        creditVolumeCents: sql<number>`sum(case when ${bids.fundingSource} = 'credit' then ${bids.amountCents} - ${bids.refundedCents} else 0 end)`.mapWith(Number),
        bidCount: count(bids.id),
      })
      .from(bids)
      .innerJoin(products, eq(bids.productId, products.id))
      .where(and(eq(bids.status, "paid"), eq(products.status, "active"), isNotNull(bids.paidAt)))
      .groupBy(marketDay)
      .orderBy(asc(marketDay));

    const marketMovesQuery = db
      .select({
        id: bids.id,
        productId: products.id,
        productName: products.displayName,
        hasIcon: sql<number>`case when ${products.iconDataUrl} is null then 0 else 1 end`.mapWith(Number),
        amountCents: sql<number>`${bids.amountCents} - ${bids.refundedCents}`.mapWith(Number),
        cumulativeCents: sql<number>`sum(${bids.amountCents} - ${bids.refundedCents}) over (order by ${bids.paidAt} asc, ${bids.id} asc)`.mapWith(Number),
        previousPaidAt: sql<number | null>`lag(${bids.paidAt}) over (partition by ${bids.productId} order by ${bids.paidAt} asc, ${bids.id} asc)`,
        fundingSource: bids.fundingSource,
        happenedAt: bids.paidAt,
      })
      .from(bids)
      .innerJoin(products, eq(bids.productId, products.id))
      .where(and(eq(bids.status, "paid"), eq(products.status, "active"), isNotNull(bids.paidAt)))
      .orderBy(desc(bids.paidAt), desc(bids.id))
      .limit(100);

    const boardTotalsQuery = db
      .select({
        confirmedBidCents: sql<number>`coalesce(sum(${bids.amountCents} - ${bids.refundedCents}), 0)`.mapWith(Number),
        confirmedBidCents24HoursAgo: sql<number>`coalesce(sum(case when ${bids.paidAt} <= ${twentyFourHoursAgo} then ${bids.amountCents} - ${bids.refundedCents} else 0 end), 0)`.mapWith(Number),
        paidBidCents: sql<number>`coalesce(sum(case when ${bids.fundingSource} = 'stripe' then ${bids.amountCents} - ${bids.refundedCents} else 0 end), 0)`.mapWith(Number),
        creditBidCents: sql<number>`coalesce(sum(case when ${bids.fundingSource} = 'credit' then ${bids.amountCents} - ${bids.refundedCents} else 0 end), 0)`.mapWith(Number),
        launchedAt: min(bids.paidAt).as("launched_at"),
      })
      .from(bids)
      .innerJoin(products, eq(bids.productId, products.id))
      .where(and(eq(bids.status, "paid"), eq(products.status, "active")));

    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const [
      leaderboardRows,
      activityRows,
      categoryRows,
      productCountRows,
      clickCountRows,
      onlineRows,
      visitorCountRows,
      boardTotalsRows,
      marketHistoryRows,
      marketMoveRows,
    ] = await Promise.all([
      leaderboardQuery,
      activityQuery,
      categoryQuery,
      db.select({ value: count() }).from(products).innerJoin(paidBidTotals, eq(products.id, paidBidTotals.productId)).where(eq(products.status, "active")),
      db.select({ value: count() }).from(outboundClicks),
      db.select({ value: count() }).from(visitors).where(gt(visitors.lastSeenAt, twoMinutesAgo)),
      db.select({ value: count() }).from(visitors),
      boardTotalsQuery,
      marketHistoryQuery,
      marketMovesQuery,
    ]);

    let marketValueCents = 0;
    const marketHistory = marketHistoryRows.map((row) => {
      const openCents = marketValueCents;
      marketValueCents += row.volumeCents;
      return {
        date: row.date,
        openCents,
        highCents: Math.max(openCents, marketValueCents),
        lowCents: Math.min(openCents, marketValueCents),
        closeCents: marketValueCents,
        volumeCents: row.volumeCents,
        paidVolumeCents: row.paidVolumeCents,
        creditVolumeCents: row.creditVolumeCents,
        bidCount: row.bidCount,
      };
    });

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

    const marketMoves = marketMoveRows.flatMap((row) => row.happenedAt ? [{
      id: row.id,
      productId: row.productId,
      productName: row.productName,
      hasIcon: Boolean(row.hasIcon),
      amountCents: row.amountCents,
      cumulativeCents: row.cumulativeCents,
      fundingSource: row.fundingSource,
      happenedAt: row.happenedAt.toISOString(),
    }] : []).reverse();

    type RaceState = {
      productId: string;
      productName: string;
      hasIcon: boolean;
      bidCents: number;
      createdAt: number;
      latestBidAt: number;
    };

    const raceStates = new Map<string, RaceState>(leaderboardRows.map((row) => [row.id, {
      productId: row.id,
      productName: row.name,
      hasIcon: Boolean(row.hasIcon),
      bidCents: row.bidCents,
      createdAt: row.createdAt.getTime(),
      latestBidAt: (row.latestBidAt ?? row.createdAt).getTime(),
    }]));
    const chronologicalRaceRows = [...marketMoveRows].reverse().filter((row) => row.happenedAt);
    const firstRaceRowByProduct = new Map<string, (typeof chronologicalRaceRows)[number]>();

    for (const row of chronologicalRaceRows) {
      const state = raceStates.get(row.productId);
      if (!state) continue;
      state.bidCents = Math.max(0, state.bidCents - row.amountCents);
      if (!firstRaceRowByProduct.has(row.productId)) firstRaceRowByProduct.set(row.productId, row);
    }

    const timestampValue = (value: unknown) => {
      if (value instanceof Date) return value.getTime();
      if (typeof value === "bigint") return Number(value);
      if (typeof value === "number") return value;
      if (typeof value === "string" && value.trim()) {
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : new Date(value).getTime();
      }
      return Number.NaN;
    };

    for (const [productId, row] of firstRaceRowByProduct) {
      const state = raceStates.get(productId);
      if (!state) continue;
      const previousPaidAt = timestampValue(row.previousPaidAt);
      state.latestBidAt = Number.isFinite(previousPaidAt) ? previousPaidAt : state.createdAt;
    }

    const rankSnapshot = () => [...raceStates.values()]
      .filter((product) => product.bidCents > 0)
      .sort((a, b) => (
        b.bidCents - a.bidCents
        || a.latestBidAt - b.latestBidAt
        || a.createdAt - b.createdAt
        || a.productId.localeCompare(b.productId)
      ))
      .slice(0, 5)
      .map((product, index) => ({
        productId: product.productId,
        productName: product.productName,
        hasIcon: product.hasIcon,
        rank: index + 1,
        bidCents: product.bidCents,
      }));

    const rankHistory: LeaderboardPayload["rankHistory"] = chronologicalRaceRows.length ? [{
      id: `baseline-${chronologicalRaceRows[0].id}`,
      happenedAt: new Date(Math.max(0, chronologicalRaceRows[0].happenedAt!.getTime() - 1)).toISOString(),
      movedProductId: null,
      rankings: rankSnapshot(),
    }] : [];

    for (const row of chronologicalRaceRows) {
      const state = raceStates.get(row.productId);
      if (!state || !row.happenedAt) continue;
      state.bidCents += row.amountCents;
      state.latestBidAt = row.happenedAt.getTime();
      rankHistory.push({
        id: row.id,
        happenedAt: row.happenedAt.toISOString(),
        movedProductId: row.productId,
        rankings: rankSnapshot(),
      });
    }

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
      marketHistory,
      marketMoves,
      rankHistory,
      stats: {
        products: productCountRows[0]?.value ?? 0,
        totalClicks: clickCountRows[0]?.value ?? 0,
        onlineVisitors: onlineRows[0]?.value ?? 0,
        totalVisitors: visitorCountRows[0]?.value ?? 0,
        minimumBidCents: MINIMUM_BID_CENTS,
        confirmedBidCents: boardTotalsRows[0]?.confirmedBidCents ?? 0,
        confirmedBidCents24HoursAgo: boardTotalsRows[0]?.confirmedBidCents24HoursAgo ?? 0,
        paidBidCents: boardTotalsRows[0]?.paidBidCents ?? 0,
        creditBidCents: boardTotalsRows[0]?.creditBidCents ?? 0,
        launchedAt: boardTotalsRows[0]?.launchedAt?.toISOString() ?? null,
      },
      positionPrices: {
        "1": priceForPosition(1),
        "2": priceForPosition(2),
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
