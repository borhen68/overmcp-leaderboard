import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    const legacyRoutes = [
      "/connect",
      "/connect/:path*",
      "/bulk",
      "/tools",
      "/tools/:path*",
      "/badge",
      "/badge/:path*",
      "/dashboard",
      "/monitor",
      "/report/:path*",
      "/free-website-vulnerability-scanner",
      "/website-security-checker",
      "/ai-app-security-scanner",
      "/vibe-coding-security",
      "/cursor-security-scanner",
      "/nextjs-security-scanner",
      "/api-key-leak-scanner",
      "/answer-engine-optimization",
      "/generative-engine-optimization",
    ];

    return [
      { source: "/blog", destination: "/", permanent: true },
      { source: "/blog/:path*", destination: "/", permanent: true },
      ...legacyRoutes.map((source) => ({ source, destination: "/", permanent: true })),
    ];
  },
  async headers() {
    const scriptPolicy = process.env.NODE_ENV === "development"
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://datafa.st"
      : "script-src 'self' 'unsafe-inline' https://datafa.st";

    return [{
      source: "/(.*)",
      headers: [
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            scriptPolicy,
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:",
            "font-src 'self' data:",
            "connect-src 'self' https://datafa.st",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
            "upgrade-insecure-requests",
          ].join("; "),
        },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    }];
  },
};

export default nextConfig;
