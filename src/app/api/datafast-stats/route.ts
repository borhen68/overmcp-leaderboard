import { NextResponse } from "next/server";
import { z } from "zod";

const DATAFAST_API = "https://datafa.st/api/v1/analytics";

const metricSchema = z.object({ visitors: z.number().int().nonnegative() });
const analyticsSchema = z.object({
  status: z.literal("success"),
  data: z.union([metricSchema, z.array(metricSchema).min(1)]),
});

function visitorsFrom(response: z.infer<typeof analyticsSchema>) {
  return Array.isArray(response.data) ? response.data[0].visitors : response.data.visitors;
}

export async function GET() {
  const apiKey = process.env.DATAFAST_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "DataFast API access is not configured." }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  try {
    const headers = { Authorization: `Bearer ${apiKey}` };
    const [realtimeResponse, summaryResponse] = await Promise.all([
      fetch(`${DATAFAST_API}/realtime`, {
        headers,
        next: { revalidate: 15 },
        signal: AbortSignal.timeout(4_000),
      }),
      fetch(`${DATAFAST_API}/overview?fields=visitors`, {
        headers,
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(4_000),
      }),
    ]);

    if (!realtimeResponse.ok || !summaryResponse.ok) {
      throw new Error("DataFast public metrics are unavailable.");
    }

    const realtime = analyticsSchema.parse(await realtimeResponse.json());
    const summary = analyticsSchema.parse(await summaryResponse.json());

    return NextResponse.json({
      onlineVisitors: visitorsFrom(realtime),
      totalVisitors: visitorsFrom(summary),
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
