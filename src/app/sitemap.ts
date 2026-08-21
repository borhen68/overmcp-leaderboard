import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return ["", "/rules", "/privacy", "/terms"].map((path) => ({
    url: `${origin}${path}`,
    changeFrequency: path ? "yearly" : "daily",
    priority: path ? 0.4 : 1,
  }));
}
