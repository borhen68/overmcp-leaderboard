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

export type LeaderboardPayload = {
  configured: boolean;
  available: boolean;
  paymentsConfigured: boolean;
  products: LeaderboardProduct[];
  activity: ActivityItem[];
  categories: CategoryCount[];
  stats: {
    products: number;
    totalClicks: number;
    onlineVisitors: number;
    totalVisitors: number;
    minimumBidCents: number;
    confirmedBidCents: number;
    paidBidCents: number;
    creditBidCents: number;
    launchedAt: string | null;
  };
  positionPrices: Record<"1" | "3" | "10", number>;
  generatedAt: string;
};
