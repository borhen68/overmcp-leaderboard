import { OverMcpApp } from "@/components/overmcp-app";
import { getLeaderboardData } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getLeaderboardData();
  return <OverMcpApp initialData={data} />;
}
