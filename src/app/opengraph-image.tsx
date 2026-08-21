import { ImageResponse } from "next/og";

export const alt = "OverMCP — The internet’s live product leaderboard";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", color: "#171914", background: "#f7f6ef", fontFamily: "Arial, sans-serif", border: "24px solid #dcff45" }}>
      <div style={{ display: "flex", alignItems: "center", fontSize: 34, fontWeight: 800, letterSpacing: "-2px" }}>
        <svg width="48" height="48" viewBox="0 0 32 32" style={{ marginRight: 3 }}>
          <circle cx="13.5" cy="18.5" r="8.5" fill="none" stroke="#171914" strokeWidth="4.5" />
          <path d="M18.5 13.5 27 5m-6.5 0H27v6.5" fill="none" stroke="#6f8500" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        ver<span style={{ color: "#6f8500" }}>mcp</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ color: "#6f8500", fontSize: 19, fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase" }}>The live product leaderboard</div>
        <div style={{ maxWidth: 970, marginTop: 20, fontSize: 88, lineHeight: .95, fontWeight: 800, letterSpacing: "-6px" }}>The internet’s top spot is up for grabs.</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#62675f", fontSize: 20 }}><span>Transparent bids. Tracked clicks. No mystery.</span><span style={{ padding: "13px 20px", color: "#171914", background: "#dcff45", border: "1px solid #171914", borderRadius: 10, fontWeight: 800 }}>overmcp.com</span></div>
    </div>,
    size,
  );
}
