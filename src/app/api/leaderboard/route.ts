import { NextResponse } from "next/server";
import { getLeaderboardData } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getLeaderboardData();
  return NextResponse.json(data, {
    status: data.available ? 200 : 503,
    headers: {
      "Cache-Control": data.available
        ? "public, s-maxage=10, stale-while-revalidate=20"
        : "no-store",
    },
  });
}
