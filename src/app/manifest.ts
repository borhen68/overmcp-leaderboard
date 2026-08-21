import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OverMCP",
    short_name: "OverMCP",
    description: "The internet’s live product leaderboard.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f6ef",
    theme_color: "#dcff45",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
