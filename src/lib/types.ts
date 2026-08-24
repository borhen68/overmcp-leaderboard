export type LeaderboardProduct = {
  id: string;
  rank: number;
  crowdRank: number;
  name: string;
  description: string;
  category: string;
  hasIcon: boolean;
  bidCents: number;
  creditCents: number;
  weeklyClicks: number;
  totalClicks: number;
  supportersToday: number;
  latestBidAt: string;
};

export type CrowdRaceEvent = {
  id: string;
  productId: string;
  happenedAt: string;
};

export type CrowdRace = {
  day: string;
  startsAt: string;
  endsAt: string;
  totalSupporters: number;
  leaderId: string | null;
  contenderIds: string[];
  events: CrowdRaceEvent[];
};

export type ActivityItem = {
  id: string;
  productId: string;
  productName: string;
  hasIcon: boolean;
  amountCents: number;
  fundingSource: "stripe" | "credit";
  happenedAt: string;
};

export type CategoryCount = {
  name: string;
  count: number;
};

export type MarketDay = {
  date: string;
  openCents: number;
  highCents: number;
  lowCents: number;
  closeCents: number;
  volumeCents: number;
  paidVolumeCents: number;
  creditVolumeCents: number;
  bidCount: number;
};

export type MarketMove = {
  id: string;
  productId: string;
  productName: string;
  hasIcon: boolean;
  amountCents: number;
  cumulativeCents: number;
  fundingSource: "stripe" | "credit";
  happenedAt: string;
};

export type RankRaceEntry = {
  productId: string;
  productName: string;
  hasIcon: boolean;
  rank: number;
  bidCents: number;
};

export type RankRacePoint = {
  id: string;
  happenedAt: string;
  movedProductId: string | null;
  rankings: RankRaceEntry[];
};

export type LeaderboardPayload = {
  configured: boolean;
  available: boolean;
  paymentsConfigured: boolean;
  products: LeaderboardProduct[];
  activity: ActivityItem[];
  categories: CategoryCount[];
  marketHistory: MarketDay[];
  marketMoves: MarketMove[];
  rankHistory: RankRacePoint[];
  crowdRace: CrowdRace;
  stats: {
    products: number;
    totalClicks: number;
    onlineVisitors: number;
    totalVisitors: number;
    minimumBidCents: number;
    confirmedBidCents: number;
    confirmedBidCents24HoursAgo: number;
    paidBidCents: number;
    creditBidCents: number;
    launchedAt: string | null;
  };
  positionPrices: Record<"1" | "2" | "3" | "10", number>;
  generatedAt: string;
};
