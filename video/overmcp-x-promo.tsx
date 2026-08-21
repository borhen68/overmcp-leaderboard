import type { ReactNode } from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
} from "remotion";

const C = {
  ink: "#171914",
  cream: "#f7f6ef",
  paper: "#fffefa",
  lime: "#dcff45",
  limeDark: "#708500",
  orange: "#f35232",
  muted: "#74786f",
  line: "#d6d8ce",
};

const font = "Arial, Helvetica, sans-serif";

function between(frame: number, start: number, end: number, fade = 12) {
  return interpolate(frame, [start, start + fade, end - fade, end], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
}

function enter(frame: number, start: number, distance = 70) {
  const progress = spring({
    frame: frame - start,
    fps: 30,
    config: { damping: 17, stiffness: 150, mass: 0.72 },
  });
  return {
    opacity: interpolate(progress, [0, 1], [0, 1]),
    transform: `translateY(${interpolate(progress, [0, 1], [distance, 0])}px)`,
  };
}

function scaleIn(frame: number, start: number, from = 0.86) {
  const progress = spring({
    frame: frame - start,
    fps: 30,
    config: { damping: 16, stiffness: 180, mass: 0.65 },
  });
  return {
    opacity: progress,
    transform: `scale(${interpolate(progress, [0, 1], [from, 1])})`,
  };
}

function Brand({ inverse = false, compact = false }: { inverse?: boolean; compact?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", color: inverse ? C.paper : C.ink, fontSize: compact ? 31 : 41, fontWeight: 850, letterSpacing: "-2.4px" }}>
      <svg width={compact ? 48 : 60} height={compact ? 48 : 60} viewBox="0 0 32 32" style={{ marginRight: 5 }}>
        <circle cx="13.5" cy="18.5" r="8.5" fill="none" stroke="currentColor" strokeWidth="4.5" />
        <path d="M18.5 13.5 27 5m-6.5 0H27v6.5" fill="none" stroke={C.orange} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      over<span style={{ color: inverse ? C.lime : C.limeDark }}>mcp</span>
    </div>
  );
}

function Grid({ dark = false }: { dark?: boolean }) {
  return (
    <AbsoluteFill
      style={{
        opacity: dark ? 0.12 : 0.34,
        backgroundImage: `linear-gradient(${dark ? "rgba(255,255,255,.09)" : "rgba(23,25,20,.08)"} 1px, transparent 1px), linear-gradient(90deg, ${dark ? "rgba(255,255,255,.09)" : "rgba(23,25,20,.08)"} 1px, transparent 1px)`,
        backgroundSize: "72px 72px",
      }}
    />
  );
}

function Grain() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        opacity: 0.055,
        mixBlendMode: "multiply",
        transform: `translate(${(frame * 17) % 7}px, ${(frame * 11) % 5}px)`,
        backgroundImage: "radial-gradient(circle at 20% 20%, #000 0 1px, transparent 1.2px), radial-gradient(circle at 80% 70%, #000 0 1px, transparent 1.2px)",
        backgroundSize: "11px 13px, 17px 19px",
      }}
    />
  );
}

function Chrome({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  const frame = useCurrentFrame();
  return (
    <>
      <div style={{ position: "absolute", left: 82, top: 60, zIndex: 20 }}><Brand inverse={dark} compact /></div>
      <div style={{ position: "absolute", right: 82, top: 67, zIndex: 20, display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", color: dark ? C.paper : C.ink, border: `1px solid ${dark ? "#3d4038" : C.line}`, borderRadius: 999, fontSize: 15, fontWeight: 780, letterSpacing: "1.3px" }}>
        <span style={{ width: 9, height: 9, display: "block", background: C.lime, borderRadius: 99, boxShadow: `0 0 18px ${C.lime}` }} /> LIVE
      </div>
      {children}
      <div style={{ position: "absolute", left: 82, right: 82, bottom: 52, height: 2, background: dark ? "#34372f" : C.line }}>
        <div style={{ width: "100%", height: "100%", background: C.orange, transformOrigin: "left", transform: `scaleX(${frame / 329})` }} />
      </div>
    </>
  );
}

function SceneOne() {
  const frame = useCurrentFrame();
  const opacity = between(frame, 0, 78, 11);
  const orangeSweep = interpolate(frame, [5, 27], [-45, 110], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ opacity, background: C.cream, color: C.ink, fontFamily: font }}>
      <Grid />
      <Chrome>
        <div style={{ position: "absolute", inset: "155px 82px 100px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ ...enter(frame, 4, 35), color: C.limeDark, fontSize: 20, fontWeight: 850, letterSpacing: "4.8px" }}>A LIVE LEADERBOARD FOR PRODUCTS</div>
          <div style={{ position: "relative", marginTop: 34, overflow: "hidden" }}>
            <div style={{ ...enter(frame, 9), fontSize: 142, lineHeight: 0.9, fontWeight: 900, letterSpacing: "-9px" }}>THE TOP SPOT</div>
          </div>
          <div style={{ position: "relative", width: "max-content", marginTop: 13, overflow: "hidden" }}>
            <div style={{ ...enter(frame, 18), position: "relative", zIndex: 2, fontSize: 142, lineHeight: 0.9, fontWeight: 900, letterSpacing: "-9px" }}>IS CLAIMED.</div>
            <div style={{ position: "absolute", left: `${orangeSweep}%`, bottom: 0, width: "42%", height: 21, background: C.orange, transform: "translateX(-100%) skewX(-16deg)" }} />
          </div>
          <div style={{ ...enter(frame, 30, 28), display: "flex", alignItems: "center", gap: 17, marginTop: 42, color: C.muted, fontSize: 25 }}>
            Bid for visibility <span style={{ color: C.orange }}>→</span> Keep your rank <span style={{ color: C.orange }}>→</span> Track every click
          </div>
        </div>
        <div style={{ position: "absolute", right: -65, bottom: 70, width: 330, height: 330, border: `46px solid ${C.lime}`, borderRadius: "50%", opacity: 0.72, transform: `rotate(${frame * 0.35}deg)` }} />
      </Chrome>
    </AbsoluteFill>
  );
}

function OpenRow({ rank, frame, delay }: { rank: number; frame: number; delay: number }) {
  return (
    <div style={{ ...enter(frame, delay, 38), height: 104, display: "grid", gridTemplateColumns: "78px 70px 1fr 110px", alignItems: "center", gap: 15, padding: "0 25px", borderTop: `1px solid ${C.line}`, color: C.muted }}>
      <strong style={{ color: C.ink, fontSize: 30 }}>#{rank}</strong>
      <div style={{ width: 54, height: 54, display: "grid", placeItems: "center", border: `1px dashed ${C.line}`, borderRadius: 15, fontSize: 22 }}>+</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}><strong style={{ color: C.ink, fontSize: 22 }}>Open spot</strong><span style={{ fontSize: 15 }}>Ready for the next product</span></div>
      <span style={{ justifySelf: "end", padding: "9px 13px", border: `1px solid ${C.line}`, borderRadius: 999, fontSize: 14 }}>AVAILABLE</span>
    </div>
  );
}

function SceneTwo() {
  const frame = useCurrentFrame();
  const opacity = between(frame, 64, 170, 14);
  const cardRotate = interpolate(frame, [72, 98], [5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const cardX = interpolate(frame, [68, 100], [260, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  return (
    <AbsoluteFill style={{ opacity, background: C.ink, color: C.paper, fontFamily: font }}>
      <Grid dark />
      <Chrome dark>
        <div style={{ position: "absolute", left: 82, top: 245, width: 590 }}>
          <div style={{ ...enter(frame, 69), color: C.lime, fontSize: 19, fontWeight: 850, letterSpacing: "4px" }}>THE BOARD IS LIVE</div>
          <div style={{ ...enter(frame, 76), marginTop: 25, fontSize: 92, lineHeight: 0.94, fontWeight: 900, letterSpacing: "-6px" }}>Real products.<br /><span style={{ color: C.lime }}>Real positions.</span></div>
          <div style={{ ...enter(frame, 89, 30), width: 520, marginTop: 32, color: "#a8aca2", fontSize: 23, lineHeight: 1.45 }}>One transparent total decides the order. No secret algorithm.</div>
        </div>

        <div style={{ position: "absolute", right: 78, top: 178, width: 1030, height: 690, overflow: "hidden", color: C.ink, background: C.paper, border: "1px solid #34372f", borderRadius: 28, boxShadow: `18px 18px 0 ${C.lime}`, transform: `translateX(${cardX}px) rotate(${cardRotate}deg)`, transformOrigin: "80% 80%" }}>
          <div style={{ height: 82, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 27px", borderBottom: `1px solid ${C.line}` }}>
            <strong style={{ fontSize: 20 }}>LIVE LEADERBOARD</strong>
            <span style={{ color: C.muted, fontSize: 15 }}>RANKED BY CONFIRMED BID</span>
          </div>
          <div style={{ ...scaleIn(frame, 83, 0.91), height: 248, display: "grid", gridTemplateColumns: "100px 98px 1fr 170px", alignItems: "center", gap: 18, padding: "0 28px", background: C.lime }}>
            <div style={{ fontSize: 62, fontWeight: 930, letterSpacing: "-4px" }}>#1</div>
            <div style={{ width: 82, height: 82, overflow: "hidden", border: "2px solid rgba(23,25,20,.15)", borderRadius: 23, background: C.orange }}>
              <Img src={staticFile("video/mentionleads-icon.png")} style={{ width: "100%", height: "100%" }} />
            </div>
            <div style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 16, fontWeight: 850, letterSpacing: "2px" }}>NOW LEADING</span>
              <strong style={{ marginTop: 7, fontSize: 40, letterSpacing: "-2px" }}>MentionLeads</strong>
              <span style={{ marginTop: 8, color: "#3c401f", fontSize: 17 }}>Find buyers across Reddit, X &amp; Hacker News</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <strong style={{ fontSize: 38 }}>$5</strong>
              <span style={{ marginTop: 6, padding: "7px 10px", border: "1px solid rgba(23,25,20,.28)", borderRadius: 999, fontSize: 12, fontWeight: 800 }}>FOUNDER CREDIT</span>
            </div>
          </div>
          <OpenRow rank={2} frame={frame} delay={96} />
          <OpenRow rank={3} frame={frame} delay={104} />
          <div style={{ height: 75, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 27px", color: C.muted, borderTop: `1px solid ${C.line}`, fontSize: 15 }}><span>Transparent bid value</span><span>Tracked outbound clicks</span><span>Public ranking</span></div>
        </div>
      </Chrome>
    </AbsoluteFill>
  );
}

function Step({ number, title, subtitle, frame, delay, accent }: { number: string; title: string; subtitle: string; frame: number; delay: number; accent: string }) {
  const movement = enter(frame, delay, 55);
  const progress = spring({ frame: frame - delay - 7, fps: 30, config: { damping: 18, stiffness: 180 } });
  return (
    <div style={{ ...movement, height: 400, position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "30px", overflow: "hidden", border: `2px solid ${C.ink}`, borderRadius: 24, background: C.paper }}>
      <div style={{ position: "absolute", right: -54, top: -54, width: 180, height: 180, borderRadius: "50%", background: accent, transform: `scale(${progress})` }} />
      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: 17, fontWeight: 850, letterSpacing: "2px" }}>STEP {number}</span><span style={{ width: 44, height: 44, display: "grid", placeItems: "center", color: C.paper, background: C.ink, borderRadius: 99, fontSize: 20 }}>↗</span></div>
      <div style={{ position: "relative" }}><strong style={{ display: "block", fontSize: 51, lineHeight: 0.98, letterSpacing: "-3px" }}>{title}</strong><p style={{ margin: "18px 0 0", color: C.muted, fontSize: 19, lineHeight: 1.4 }}>{subtitle}</p></div>
    </div>
  );
}

function SceneThree() {
  const frame = useCurrentFrame();
  const opacity = between(frame, 154, 242, 13);
  return (
    <AbsoluteFill style={{ opacity, background: C.cream, color: C.ink, fontFamily: font }}>
      <Grid />
      <Chrome>
        <div style={{ position: "absolute", left: 82, right: 82, top: 178 }}>
          <div style={{ ...enter(frame, 158), display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div><div style={{ color: C.limeDark, fontSize: 18, fontWeight: 850, letterSpacing: "3.6px" }}>HOW IT WORKS</div><div style={{ marginTop: 12, fontSize: 72, lineHeight: 0.96, fontWeight: 900, letterSpacing: "-5px" }}>Three moves. One clear rank.</div></div>
            <div style={{ color: C.muted, fontSize: 18 }}>No subscription. No mystery.</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22, marginTop: 50 }}>
            <Step number="01" title="Submit your URL." subtitle="Autofill pulls your public name, description, and icon." frame={frame} delay={166} accent={C.orange} />
            <Step number="02" title="Choose your bid." subtitle="See the live threshold before Stripe checkout." frame={frame} delay={174} accent={C.lime} />
            <Step number="03" title="Own your rank." subtitle="Stay visible until another product outbids you." frame={frame} delay={182} accent="#9da9ff" />
          </div>
        </div>
      </Chrome>
    </AbsoluteFill>
  );
}

function SceneFour() {
  const frame = useCurrentFrame();
  const opacity = between(frame, 226, 288, 11);
  const dash = interpolate(frame, [231, 276], [550, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const pulse = 1 + Math.sin((frame - 230) * 0.35) * 0.08;
  return (
    <AbsoluteFill style={{ opacity, background: C.lime, color: C.ink, fontFamily: font }}>
      <Chrome>
        <div style={{ position: "absolute", left: 82, right: 82, top: 205, display: "grid", gridTemplateColumns: "1.05fr .95fr", alignItems: "center", gap: 100 }}>
          <div>
            <div style={{ ...enter(frame, 230), fontSize: 116, lineHeight: 0.9, fontWeight: 930, letterSpacing: "-7px" }}>REAL CLICKS.<br />PUBLIC PROOF.</div>
            <p style={{ ...enter(frame, 241, 30), width: 620, margin: "35px 0 0", color: "#414527", fontSize: 25, lineHeight: 1.45 }}>Every outbound visit is tracked, so the board shows attention—not vanity.</p>
          </div>
          <div style={{ position: "relative", height: 480, display: "grid", placeItems: "center" }}>
            <svg width="700" height="420" viewBox="0 0 700 420" style={{ position: "absolute" }}>
              <path d="M80 225 C205 44 422 376 624 182" fill="none" stroke="#171914" strokeOpacity=".25" strokeWidth="4" strokeDasharray="13 16" />
              <path d="M80 225 C205 44 422 376 624 182" fill="none" stroke="#f35232" strokeWidth="7" strokeLinecap="round" strokeDasharray="550" strokeDashoffset={dash} />
            </svg>
            <div style={{ position: "absolute", left: 40, top: 182, width: 108, height: 108, display: "grid", placeItems: "center", overflow: "hidden", border: `5px solid ${C.ink}`, borderRadius: 30, background: C.orange, transform: `scale(${pulse})` }}><Img src={staticFile("video/mentionleads-icon.png")} style={{ width: "100%", height: "100%" }} /></div>
            <div style={{ position: "absolute", right: 8, top: 136, width: 174, height: 174, display: "grid", placeItems: "center", border: `5px solid ${C.ink}`, borderRadius: "50%", background: C.paper, boxShadow: "11px 11px 0 rgba(23,25,20,.18)" }}>
              <svg width="76" height="76" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3l14 9-7 2-3 7L5 3Z"/><path d="m13 14 5 5"/></svg>
            </div>
            <div style={{ ...scaleIn(frame, 257, 0.7), position: "absolute", right: 180, top: 70, padding: "14px 20px", color: C.paper, background: C.ink, borderRadius: 12, fontSize: 18, fontWeight: 800 }}>VISIT TRACKED ✓</div>
          </div>
        </div>
      </Chrome>
    </AbsoluteFill>
  );
}

function SceneFive() {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [273, 287], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lineWidth = interpolate(frame, [288, 316], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const orb = scaleIn(frame, 281, 0.5);
  return (
    <AbsoluteFill style={{ opacity, background: C.ink, color: C.paper, fontFamily: font }}>
      <Grid dark />
      <div style={{ ...orb, position: "absolute", right: -210, top: -290, width: 820, height: 820, border: `100px solid ${C.lime}`, borderRadius: "50%", opacity: 0.9 }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 30, height: "100%", background: C.orange }} />
      <div style={{ position: "absolute", inset: "110px 105px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div style={{ ...enter(frame, 278, 30) }}><Brand inverse /></div>
        <div style={{ ...enter(frame, 284, 60), marginTop: 44, fontSize: 124, lineHeight: 0.9, fontWeight: 930, letterSpacing: "-8px" }}>YOUR PRODUCT.<br /><span style={{ color: C.lime }}>TOP OF THE BOARD.</span></div>
        <div style={{ ...enter(frame, 294, 30), marginTop: 42, display: "flex", alignItems: "center", gap: 18 }}>
          <span style={{ padding: "14px 22px", color: C.ink, background: C.lime, borderRadius: 999, fontSize: 19, fontWeight: 850, letterSpacing: "1px" }}>STARTS AT $5</span>
          <span style={{ color: "#acb0a6", fontSize: 22 }}>One payment · Stay until outbid</span>
        </div>
        <div style={{ ...enter(frame, 301, 25), position: "relative", marginTop: 48, fontSize: 39, fontWeight: 850, letterSpacing: "-.7px" }}>www.overmcp.com <span style={{ color: C.orange }}>↗</span><div style={{ position: "absolute", left: 0, bottom: -13, width: `${lineWidth}%`, height: 5, background: C.orange, borderRadius: 99 }} /></div>
      </div>
      <div style={{ position: "absolute", left: 82, bottom: 48, color: "#767a70", fontSize: 14, letterSpacing: "2px" }}>THE LIVE PRODUCT LEADERBOARD</div>
      <div style={{ position: "absolute", right: 82, bottom: 48, color: "#767a70", fontSize: 14, letterSpacing: "2px" }}>LAUNCH EDITION · 2026</div>
    </AbsoluteFill>
  );
}

export function OverMcpXPromo() {
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Audio src={staticFile("video/overmcp-bed.wav")} volume={0.78} />
      <SceneOne />
      <SceneTwo />
      <SceneThree />
      <SceneFour />
      <SceneFive />
      <Grain />
    </AbsoluteFill>
  );
}
