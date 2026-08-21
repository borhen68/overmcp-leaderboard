import { NextResponse } from "next/server";
import { z } from "zod";

const DATAFAST_WEBSITE_ID = "6a8891cc9f3926b34adc34d6";
const DATAFAST_API = "https://datafa.st/api/analytics";

const realtimeSchema = z.object({
  count: z.number().int().nonnegative(),
});

const summarySchema = z.object({
  totalVisitors: z.number().int().nonnegative(),
});

export async function GET() {
  try {
    const [realtimeResponse, summaryResponse] = await Promise.all([
      fetch(`${DATAFAST_API}/realtime?websiteId=${DATAFAST_WEBSITE_ID}`, {
        next: { revalidate: 15 },
        signal: AbortSignal.timeout(4_000),
      }),
      fetch(`${DATAFAST_API}/main?websiteId=${DATAFAST_WEBSITE_ID}&period=last12m&granularity=monthly`, {
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(4_000),
      }),
    ]);

    if (!realtimeResponse.ok || !summaryResponse.ok) {
      throw new Error("DataFast public metrics are unavailable.");
    }

    const realtime = realtimeSchema.parse(await realtimeResponse.json());
    const summary = summarySchema.parse(await summaryResponse.json());

    return NextResponse.json({
      onlineVisitors: realtime.count,
      totalVisitors: summary.totalVisitors,
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Failed to load public DataFast metrics", error);
    return NextResponse.json({ error: "Live analytics are temporarily unavailable." }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
