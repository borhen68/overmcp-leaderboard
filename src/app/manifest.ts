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
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
