import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "OverMCP — The internet’s live product leaderboard",
    template: "%s · OverMCP",
  },
  description:
    "Discover products worth your attention—or bid to put yours at the top of the internet’s live product leaderboard.",
  applicationName: "OverMCP",
  keywords: [
    "product leaderboard",
    "startup discovery",
    "product launch",
    "sponsored ranking",
    "indie products",
  ],
  openGraph: {
    title: "OverMCP — The internet’s live product leaderboard",
    description:
      "Discover what’s winning, follow live bids, or claim the top spot for your product.",
    type: "website",
    siteName: "OverMCP",
  },
  twitter: {
    card: "summary_large_image",
    title: "OverMCP — The internet’s live product leaderboard",
    description:
      "The transparent, competitive leaderboard for products worth discovering.",
  },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f7f6ef",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
