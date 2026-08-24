import { FounderRaceApp } from "@/components/founder-race-app";
import { getLeaderboardData } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getLeaderboardData();
  return <FounderRaceApp initialData={data} />;
}
