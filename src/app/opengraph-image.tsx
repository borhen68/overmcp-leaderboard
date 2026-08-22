import { ImageResponse } from "next/og";

export const alt = "OverMCP live product leaderboard — bid for the top spot";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", padding: "44px", color: "#171914", background: "#f7f6ef", fontFamily: "Arial, sans-serif" }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", background: "linear-gradient(135deg, rgba(220,255,69,.42) 0%, rgba(247,246,239,0) 42%)" }} />
      <div style={{ width: "100%", height: "100%", display: "flex", overflow: "hidden", border: "2px solid #171914", borderRadius: 30, background: "#fbfaf5", boxShadow: "12px 12px 0 #dcff45" }}>
        <div style={{ width: "66%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "46px 48px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", fontSize: 32, fontWeight: 800, letterSpacing: "-1.8px" }}>
              <svg width="46" height="46" viewBox="0 0 32 32" style={{ marginRight: 5 }}>
                <circle cx="13.5" cy="18.5" r="8.5" fill="none" stroke="#171914" strokeWidth="4.5" />
                <path d="M18.5 13.5 27 5m-6.5 0H27v6.5" fill="none" stroke="#f2693f" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              over<span style={{ color: "#6f8500" }}>mcp</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 14px", border: "1px solid #c8cbc0", borderRadius: 999, color: "#52564d", fontSize: 14, fontWeight: 700, letterSpacing: "1px" }}>
              <span style={{ width: 9, height: 9, display: "flex", borderRadius: 99, background: "#65a30d" }} /> LIVE
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ color: "#6f8500", fontSize: 16, fontWeight: 800, letterSpacing: "2.5px", textTransform: "uppercase" }}>The live product leaderboard</div>
            <div style={{ maxWidth: 650, marginTop: 17, fontSize: 66, lineHeight: .96, fontWeight: 800, letterSpacing: "-4.5px" }}>Discover what’s winning. Claim the top spot.</div>
            <div style={{ marginTop: 22, color: "#62675f", fontSize: 19 }}>Transparent bids · Real clicks · One-time placement</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", fontSize: 19, fontWeight: 800 }}>www.overmcp.com <span style={{ marginLeft: 10, color: "#f2693f" }}>↗</span></div>
        </div>
        <div style={{ width: "34%", display: "flex", alignItems: "center", justifyContent: "center", padding: "36px", background: "#171914" }}>
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#a8aca2", fontSize: 13, fontWeight: 700, letterSpacing: "1.4px" }}><span>LIVE POSITION</span><span>BID</span></div>
            <div style={{ display: "flex", alignItems: "center", padding: "20px", borderRadius: 18, color: "#171914", background: "#dcff45" }}>
              <div style={{ fontSize: 42, fontWeight: 900 }}>#1</div>
              <div style={{ marginLeft: 18, display: "flex", flexDirection: "column" }}><span style={{ fontSize: 13, fontWeight: 700 }}>TOP SPOT</span><strong style={{ marginTop: 3, fontSize: 21 }}>Your product</strong></div>
              <div style={{ marginLeft: "auto", fontSize: 18, fontWeight: 800 }}>$3+</div>
            </div>
            {[2, 3].map((rank) => (
              <div key={rank} style={{ display: "flex", alignItems: "center", padding: "17px 19px", border: "1px solid #3f423b", borderRadius: 16, color: "#f7f6ef" }}>
                <div style={{ display: "flex", fontSize: 25, fontWeight: 800 }}>#{rank}</div>
                <div style={{ height: 9, width: rank === 2 ? 128 : 96, marginLeft: 20, borderRadius: 99, background: "#3f423b" }} />
                <div style={{ height: 9, width: 42, marginLeft: "auto", borderRadius: 99, background: "#3f423b" }} />
              </div>
            ))}
            <div style={{ marginTop: 8, display: "flex", justifyContent: "center", color: "#a8aca2", fontSize: 14 }}>Bids set the rank. Clicks prove the value.</div>
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
