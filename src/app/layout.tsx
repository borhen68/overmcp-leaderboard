import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import "./founder-race.css";

const siteUrl = "https://www.overmcp.com";
const siteTitle = "OverMCP — The live founder race";
const siteDescription =
  "Enter your product, rally repeat backings, and race for today’s crowd-chosen #1 spot.";
const socialImage = "/opengraph-image?v=repeat-backings-20260824";

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
    "founder leaderboard",
    "startup competition",
    "startup discovery",
    "product launch",
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
      alt: "OverMCP live founder race",
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
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0f0d" },
    { media: "(prefers-color-scheme: light)", color: "#f4f5ef" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function () {
            try {
              var saved = window.localStorage.getItem("overmcp-theme");
              var theme = saved === "light" || saved === "dark" ? saved : "light";
              document.documentElement.dataset.theme = theme;
              document.documentElement.style.colorScheme = theme;
            } catch (_) {
              document.documentElement.dataset.theme = "light";
            }
          })();`}
        </Script>
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
