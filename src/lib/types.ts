export type LeaderboardProduct = {
  id: string;
  rank: number;
  name: string;
  description: string;
  category: string;
  hasIcon: boolean;
  bidCents: number;
  creditCents: number;
  weeklyClicks: number;
  totalClicks: number;
  latestBidAt: string;
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

export type LeaderboardPayload = {
  configured: boolean;
  available: boolean;
  paymentsConfigured: boolean;
  products: LeaderboardProduct[];
  activity: ActivityItem[];
  categories: CategoryCount[];
  marketHistory: MarketDay[];
  marketMoves: MarketMove[];
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
