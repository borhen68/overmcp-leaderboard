import { ImageResponse } from "next/og";

export const alt = "OverMCP — the live founder race";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        display: "flex",
        overflow: "hidden",
        padding: "44px 48px",
        color: "#f2f4ee",
        background: "#080d0a",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ width: 470, height: 470, position: "absolute", top: -250, right: -90, display: "flex", borderRadius: 999, background: "rgba(114,213,162,.15)" }} />
      <div style={{ width: 380, height: 380, position: "absolute", bottom: -280, left: 170, display: "flex", borderRadius: 999, background: "rgba(255,117,96,.11)" }} />

      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid rgba(242,244,238,.16)",
          borderRadius: 28,
          background: "rgba(18,24,21,.96)",
          boxShadow: "0 28px 90px rgba(0,0,0,.38)",
        }}
      >
        <div style={{ height: 82, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 34px", borderBottom: "1px solid rgba(242,244,238,.11)" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <svg width="49" height="49" viewBox="0 0 64 64">
              <rect width="64" height="64" rx="17" fill="#c2e978" />
              <circle cx="27" cy="37" r="16" fill="none" stroke="#0e1512" strokeWidth="9" />
              <path d="M35 29 51 13M40 13h11v11" fill="none" stroke="#ff7560" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div style={{ marginLeft: 15, display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-.3px" }}>THE LIVE FOUNDER RACE</span>
              <span style={{ marginTop: 2, color: "#8f9a92", fontSize: 12 }}>One person · one backing · every day</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", padding: "9px 14px", color: "#9ce8bd", border: "1px solid rgba(114,213,162,.25)", borderRadius: 999, background: "rgba(114,213,162,.08)", fontSize: 12, fontWeight: 800, letterSpacing: "1px" }}>
            <span style={{ width: 7, height: 7, marginRight: 8, display: "flex", borderRadius: 99, background: "#72d5a2" }} /> LIVE
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", padding: "35px 34px 31px" }}>
          <div style={{ width: "57%", display: "flex", flexDirection: "column", justifyContent: "center", paddingRight: 34 }}>
            <div style={{ color: "#72d5a2", fontSize: 13, fontWeight: 800, letterSpacing: "2.4px" }}>MONEY GETS YOU ON THE FIELD</div>
            <div style={{ marginTop: 15, display: "flex", flexDirection: "column", fontSize: 61, lineHeight: .94, fontWeight: 800, letterSpacing: "-3.7px" }}>
              <span>Don’t outbid.</span>
              <span style={{ marginTop: 7, color: "#c2e978" }}>Outgrow.</span>
            </div>
            <div style={{ maxWidth: 600, marginTop: 22, color: "#aab3ad", fontSize: 18, lineHeight: 1.35 }}>
              Enter your product, rally real supporters, and race for today’s crowd-chosen #1.
            </div>
            <div style={{ marginTop: 25, display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", padding: "11px 16px", color: "#0e1512", borderRadius: 10, background: "#c2e978", fontSize: 15, fontWeight: 900 }}>
                ENTER THE RACE <span style={{ marginLeft: 9, color: "#ff5f4a" }}>→</span>
              </div>
              <span style={{ marginLeft: 17, color: "#818c84", fontSize: 13 }}>One-time bid · Stripe checkout</span>
            </div>
          </div>

          <div style={{ width: "43%", display: "flex", flexDirection: "column", padding: 20, border: "1px solid rgba(242,244,238,.12)", borderRadius: 19, background: "#0b100d" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ color: "#707a73", fontSize: 10, fontWeight: 800, letterSpacing: "1.8px" }}>TODAY’S MAIN EVENT</span>
                <strong style={{ marginTop: 3, fontSize: 20 }}>The internet decides #1.</strong>
              </div>
              <span style={{ color: "#ff7560", fontSize: 19 }}>↗</span>
            </div>

            <div style={{ marginTop: 19, display: "flex", padding: 4, border: "1px solid rgba(242,244,238,.1)", borderRadius: 10, background: "#121815" }}>
                <div style={{ width: "50%", display: "flex", justifyContent: "center", padding: "9px 6px", color: "#9ba69f", borderRadius: 7, fontSize: 12, fontWeight: 800 }}>ALL-TIME</div>
              <div style={{ width: "50%", display: "flex", justifyContent: "center", padding: "9px 6px", color: "#0e1512", borderRadius: 7, background: "#c2e978", fontSize: 12, fontWeight: 900 }}>TODAY</div>
            </div>

            <div style={{ marginTop: 13, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", padding: "14px 13px", border: "1px solid rgba(242,244,238,.1)", borderRadius: 11, background: "#121815" }}>
                <span style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "#0e1512", borderRadius: 9, background: "#72d5a2", fontSize: 11, fontWeight: 900 }}>01</span>
                <div style={{ marginLeft: 12, display: "flex", flexDirection: "column" }}><strong style={{ fontSize: 14 }}>Rally supporters</strong><span style={{ color: "#7f8a82", fontSize: 11 }}>Every verified backing moves the race.</span></div>
              </div>
              <div style={{ marginTop: 9, display: "flex", alignItems: "center", padding: "14px 13px", border: "1px solid rgba(242,244,238,.1)", borderRadius: 11, background: "#121815" }}>
                <span style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "#0e1512", borderRadius: 9, background: "#ff7560", fontSize: 11, fontWeight: 900 }}>02</span>
                <div style={{ marginLeft: 12, display: "flex", flexDirection: "column" }}><strong style={{ fontSize: 14 }}>Win the spotlight</strong><span style={{ color: "#7f8a82", fontSize: 11 }}>The daily crowd leader owns the stage.</span></div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ height: 49, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 34px", color: "#8f9a92", borderTop: "1px solid rgba(242,244,238,.1)", fontSize: 13 }}>
          <strong style={{ color: "#f2f4ee", fontSize: 15 }}>overmcp.com</strong>
          <span>Verified supporters · Real visits · Daily reset</span>
        </div>
      </div>
    </div>,
    size,
  );
}
