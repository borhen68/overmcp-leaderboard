import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

const siteUrl = "https://www.overmcp.com";
const siteTitle = "OverMCP — The live product rank race";
const siteDescription =
  "Bid from $3, move up the live product leaderboard, and measure the real clicks your position earns.";
const socialImage = "/opengraph-image?v=rank-race-20260823";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s · OverMCP",
  },
  description: siteDescription,
  applicationName: "OverMCP",
  other: {
    "ory-verify": "orynth-ffbc17b235254fb583587ffc7b83621d",
  },
  alternates: { canonical: "/" },
  keywords: [
    "product leaderboard",
    "startup discovery",
    "product launch",
    "sponsored ranking",
    "indie products",
  ],
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    type: "website",
    url: "/",
    siteName: "OverMCP",
    locale: "en_US",
    images: [{
      url: socialImage,
      width: 1200,
      height: 630,
      alt: "OverMCP live product leaderboard",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [socialImage],
  },
  icons: {
    icon: [
      { url: "/icon-64.png", type: "image/png", sizes: "64x64" },
      { url: "/icon.svg", type: "image/svg+xml", sizes: "any" },
    ],
    shortcut: "/icon-64.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f7f6ef",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="datafast-queue" strategy="beforeInteractive">
          {`window.datafast = window.datafast || function() {
            window.datafast.q = window.datafast.q || [];
            window.datafast.q.push(arguments);
          };`}
        </Script>
      </head>
      <body>{children}</body>
      <Script
        src="https://datafa.st/js/script.js"
        data-website-id="dfid_rfF5hDxCOWKuJEoPI2nv4"
        data-domain="overmcp.com"
        strategy="afterInteractive"
      />
    </html>
  );
}
