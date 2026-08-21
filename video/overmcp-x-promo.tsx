import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
} from "remotion";

const C = {
  ink: "#12140f",
  cream: "#f7f6ef",
  paper: "#fffefa",
  lime: "#d9ff3f",
  limeDeep: "#6f8500",
  orange: "#ff4f2e",
  violet: "#9c8cff",
  muted: "#74786f",
  line: "#d5d8cd",
};

const font = '"Helvetica Neue", Inter, Arial, sans-serif';

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

function appear(frame: number, start: number, duration = 12) {
  return interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
}

function sceneOpacity(frame: number, duration: number, fade = 5) {
  return interpolate(frame, [0, fade, duration - fade, duration], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

function bounce(frame: number, start: number, config = { damping: 13, stiffness: 210, mass: 0.62 }) {
  return spring({ frame: frame - start, fps: 30, config });
}

function slide(frame: number, start: number, x = 0, y = 70, scale = 0.96): CSSProperties {
  const progress = bounce(frame, start);
  return {
    opacity: clamp(progress),
    transform: `translate3d(${interpolate(progress, [0, 1], [x, 0])}px, ${interpolate(progress, [0, 1], [y, 0])}px, 0) scale(${interpolate(progress, [0, 1], [scale, 1])})`,
  };
}

function Brand({ light = false, size = 34 }: { light?: boolean; size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", color: light ? C.paper : C.ink, fontFamily: font, fontSize: size, fontWeight: 900, letterSpacing: "-2.2px" }}>
      <svg width={size * 1.22} height={size * 1.22} viewBox="0 0 32 32" style={{ marginRight: 4 }}>
        <circle cx="13.5" cy="18.5" r="8.5" fill="none" stroke="currentColor" strokeWidth="4.5" />
        <path d="M18.5 13.5 27 5m-6.5 0H27v6.5" fill="none" stroke={C.orange} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      over<span style={{ color: light ? C.lime : C.limeDeep }}>mcp</span>
    </div>
  );
}

function Texture({ light = false }: { light?: boolean }) {
  const frame = useCurrentFrame();
  const drift = frame * 1.8;
  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          opacity: light ? 0.28 : 0.16,
          backgroundImage: `linear-gradient(${light ? "rgba(18,20,15,.075)" : "rgba(255,255,255,.075)"} 1px, transparent 1px), linear-gradient(90deg, ${light ? "rgba(18,20,15,.075)" : "rgba(255,255,255,.075)"} 1px, transparent 1px)`,
          backgroundPosition: `${drift % 64}px ${(drift * 0.55) % 64}px`,
          backgroundSize: "64px 64px",
        }}
      />
      <AbsoluteFill
        style={{
          opacity: light ? 0.035 : 0.055,
          transform: `translate(${(frame * 13) % 9}px, ${(frame * 17) % 7}px)`,
          backgroundImage: "radial-gradient(circle, currentColor 0 1px, transparent 1.3px)",
          backgroundSize: "13px 13px",
          color: light ? C.ink : C.paper,
        }}
      />
    </AbsoluteFill>
  );
}

function Hud({ light = false, label = "THE LIVE PRODUCT LEADERBOARD" }: { light?: boolean; label?: string }) {
  const frame = useCurrentFrame();
  const pulse = 0.62 + Math.sin(frame * 0.42) * 0.38;
  return (
    <>
      <div style={{ position: "absolute", top: 48, left: 64, zIndex: 20 }}><Brand light={!light} size={30} /></div>
      <div style={{ position: "absolute", top: 48, right: 52, zIndex: 20, display: "flex", alignItems: "center", gap: 11, padding: "10px 13px", color: light ? C.ink : C.paper, background: light ? "rgba(247,246,239,.78)" : "rgba(18,20,15,.78)", borderRadius: 999, fontFamily: font, fontSize: 13, fontWeight: 850, letterSpacing: "2.6px", backdropFilter: "blur(10px)" }}>
        <span style={{ width: 9, height: 9, borderRadius: 99, background: C.lime, boxShadow: `0 0 ${12 + pulse * 10}px ${C.lime}` }} />
        {label}
      </div>
    </>
  );
}

function BigWord({
  children,
  frame,
  start,
  color,
  fromX = -180,
}: {
  children: ReactNode;
  frame: number;
  start: number;
  color: string;
  fromX?: number;
}) {
  const progress = bounce(frame, start, { damping: 12, stiffness: 240, mass: 0.55 });
  return (
    <div style={{ overflow: "hidden", lineHeight: 0.83 }}>
      <div style={{ color, opacity: clamp(progress), transform: `translateX(${interpolate(progress, [0, 1], [fromX, 0])}px) skewX(${interpolate(progress, [0, 1], [-9, 0])}deg)` }}>
        {children}
      </div>
    </div>
  );
}

function HookScene() {
  const frame = useCurrentFrame();
  const exit = appear(frame, 44, 12);
  const slash = interpolate(frame, [0, 25], [-42, 132], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
  const shake = frame > 12 && frame < 20 ? Math.sin(frame * 5.7) * 5 : 0;

  return (
    <AbsoluteFill style={{ opacity: interpolate(frame, [50, 56], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), overflow: "hidden", color: C.paper, background: C.ink, fontFamily: font, transform: `translateX(${shake}px) scale(${1 + exit * 0.08})` }}>
      <Texture />
      <Hud />
      <div style={{ position: "absolute", top: -280, left: `${slash}%`, width: 460, height: 1700, background: C.orange, transform: "rotate(17deg)", boxShadow: "0 0 100px rgba(255,79,46,.24)" }} />
      <div style={{ position: "absolute", inset: "185px 64px 80px", display: "flex", flexDirection: "column", justifyContent: "center", fontSize: 182, fontWeight: 950, letterSpacing: "-12px" }}>
        <BigWord frame={frame} start={-4} color={C.paper}>YOUR PRODUCT</BigWord>
        <BigWord frame={frame} start={3} color={C.lime} fromX={230}>IS INVISIBLE.</BigWord>
      </div>
      <div style={{ ...slide(frame, 20, 0, 32), position: "absolute", right: 72, bottom: 75, display: "flex", gap: 12, alignItems: "center", padding: "13px 18px", color: C.ink, background: C.paper, borderRadius: 999, fontSize: 16, fontWeight: 900, letterSpacing: "1.6px" }}>
        FIX THAT IN 10 SECONDS <span style={{ color: C.orange, fontSize: 23 }}>→</span>
      </div>
    </AbsoluteFill>
  );
}

function ProductMark({ mention = false }: { mention?: boolean }) {
  if (mention) {
    return <Img src={staticFile("video/mentionleads-icon.png")} style={{ width: 68, height: 68, borderRadius: 18 }} />;
  }
  return (
    <div style={{ width: 68, height: 68, display: "grid", placeItems: "center", color: C.ink, background: C.lime, border: `2px solid ${C.ink}`, borderRadius: 18, fontSize: 34, fontWeight: 900 }}>+</div>
  );
}

function LeaderRow({
  mention = false,
  rank,
  y,
  accent,
  opacity = 1,
}: {
  mention?: boolean;
  rank: number;
  y: number;
  accent?: boolean;
  opacity?: number;
}) {
  return (
    <div style={{ position: "absolute", top: 50 + y, left: 22, right: 22, height: 168, display: "grid", gridTemplateColumns: "82px 86px 1fr 145px", alignItems: "center", gap: 14, padding: "0 24px", opacity, color: C.ink, background: accent ? C.lime : C.paper, border: `2px solid ${C.ink}`, borderRadius: 22, boxShadow: accent ? "9px 9px 0 #12140f" : "none" }}>
      <strong style={{ fontSize: 49, letterSpacing: "-4px" }}>#{rank}</strong>
      <ProductMark mention={mention} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: "2.1px" }}>{mention ? "CURRENTLY LEADING" : "THIS COULD BE YOU"}</div>
        <div style={{ marginTop: 7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 28, fontWeight: 900, letterSpacing: "-1.4px" }}>{mention ? "MentionLeads" : "YOUR PRODUCT"}</div>
        <div style={{ marginTop: 5, color: "#52574b", fontSize: 14 }}>{mention ? "6 tracked clicks · founder credit" : "Visible first · clicks tracked"}</div>
      </div>
      <div style={{ justifySelf: "end", textAlign: "right" }}>
        <strong style={{ display: "block", fontSize: 36 }}>{mention ? "$5" : "$10"}</strong>
        <span style={{ fontSize: 11, fontWeight: 850, letterSpacing: "1px" }}>{mention ? "TOTAL" : "CLAIM #1"}</span>
      </div>
    </div>
  );
}

function RankScene() {
  const frame = useCurrentFrame();
  const card = bounce(frame, 2, { damping: 14, stiffness: 190, mass: 0.7 });
  const challenger = bounce(frame, 14, { damping: 11, stiffness: 220, mass: 0.58 });
  const swap = bounce(frame, 38, { damping: 12, stiffness: 200, mass: 0.62 });
  const click = bounce(frame, 28, { damping: 9, stiffness: 300, mass: 0.45 });
  const price = Math.round(interpolate(frame, [25, 39], [5, 10], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) }));

  return (
    <AbsoluteFill style={{ opacity: sceneOpacity(frame, 88, 4), overflow: "hidden", color: C.ink, background: C.cream, fontFamily: font }}>
      <Texture light />
      <Hud light label="RANKED BY CONFIRMED BID" />
      <div style={{ position: "absolute", left: 64, top: 205, width: 630 }}>
        <div style={{ ...slide(frame, 4, -120, 0), color: C.orange, fontSize: 22, fontWeight: 900, letterSpacing: "4px" }}>STOP WAITING FOR TRAFFIC</div>
        <div style={{ marginTop: 24, fontSize: 151, lineHeight: 0.82, fontWeight: 950, letterSpacing: "-11px" }}>
          <BigWord frame={frame} start={6} color={C.ink}>TAKE</BigWord>
          <BigWord frame={frame} start={11} color={C.orange}>#1.</BigWord>
        </div>
        <div style={{ ...slide(frame, 20, 0, 28), marginTop: 38, display: "flex", alignItems: "center", gap: 12, fontSize: 24, fontWeight: 740 }}>
          Current threshold
          <span style={{ padding: "8px 15px", background: C.ink, color: C.paper, borderRadius: 999, fontSize: 27, fontWeight: 950 }}>${price}</span>
        </div>
      </div>

      <div style={{ position: "absolute", right: 75, top: 166, width: 1040, height: 730, perspective: 1600 }}>
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: C.paper, border: `3px solid ${C.ink}`, borderRadius: 30, boxShadow: "22px 22px 0 #9c8cff", transformOrigin: "100% 50%", transform: `translateX(${interpolate(card, [0, 1], [520, 0])}px) rotateY(${interpolate(card, [0, 1], [-26, 0])}deg) rotateZ(${interpolate(card, [0, 1], [4, 0])}deg)` }}>
          <div style={{ height: 94, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 29px", color: C.paper, background: C.ink }}>
            <strong style={{ fontSize: 21, letterSpacing: "-.5px" }}>LIVE LEADERBOARD</strong>
            <span style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, fontWeight: 850, letterSpacing: "1.7px" }}><i style={{ width: 8, height: 8, background: C.lime, borderRadius: 50 }} /> LIVE NOW</span>
          </div>
          <div style={{ position: "relative", height: 530 }}>
            <div style={{ opacity: challenger, transform: `translateX(${interpolate(challenger, [0, 1], [560, 0])}px)` }}>
              <LeaderRow rank={swap > 0.58 ? 2 : 1} mention y={swap * 176} opacity={1 - swap * 0.3} />
              <LeaderRow rank={swap > 0.58 ? 1 : 2} y={(1 - swap) * 176} accent />
            </div>
          </div>
          <div style={{ height: 94, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 30px", borderTop: `2px solid ${C.ink}` }}>
            <span style={{ color: C.muted, fontSize: 16 }}>No subscription · stay until outbid</span>
            <div style={{ position: "relative", minWidth: 260, padding: "19px 26px", color: C.paper, background: C.orange, border: `2px solid ${C.ink}`, borderRadius: 14, boxShadow: `${4 + click * 5}px ${4 + click * 5}px 0 ${C.ink}`, textAlign: "center", fontSize: 18, fontWeight: 900, transform: `scale(${1 - Math.sin(click * Math.PI) * 0.05})` }}>
              CLAIM #1 FOR $10 →
            </div>
          </div>
        </div>
        <div style={{ ...slide(frame, 48, 0, -30), position: "absolute", right: 42, top: 22, zIndex: 6, padding: "13px 18px", color: C.paper, background: C.orange, border: `2px solid ${C.ink}`, borderRadius: 12, boxShadow: `6px 6px 0 ${C.ink}`, fontSize: 16, fontWeight: 950, letterSpacing: "1px", transform: `${slide(frame, 48, 0, -30).transform} rotate(3deg)` }}>NEW #1 ✓</div>
      </div>
    </AbsoluteFill>
  );
}

function FlowCard({
  number,
  title,
  sub,
  color,
  frame,
  start,
  rotate,
}: {
  number: string;
  title: string;
  sub: string;
  color: string;
  frame: number;
  start: number;
  rotate: number;
}) {
  const progress = bounce(frame, start, { damping: 11, stiffness: 220, mass: 0.62 });
  return (
    <div style={{ height: 250, position: "relative", display: "grid", gridTemplateColumns: "115px 1fr 64px", alignItems: "center", gap: 22, padding: "0 34px", color: C.ink, background: color, border: `3px solid ${C.ink}`, borderRadius: 25, boxShadow: `12px 12px 0 rgba(0,0,0,.32)`, opacity: clamp(progress), transform: `translateX(${interpolate(progress, [0, 1], [760, 0])}px) rotate(${interpolate(progress, [0, 1], [rotate * 3, rotate])}deg)` }}>
      <span style={{ fontSize: 61, fontWeight: 950, letterSpacing: "-4px" }}>{number}</span>
      <div><strong style={{ display: "block", fontSize: 59, lineHeight: 0.94, letterSpacing: "-3.8px" }}>{title}</strong><span style={{ display: "block", marginTop: 13, color: "#43473e", fontSize: 19, fontWeight: 650 }}>{sub}</span></div>
      <span style={{ width: 55, height: 55, display: "grid", placeItems: "center", color: C.paper, background: C.ink, borderRadius: 99, fontSize: 28 }}>→</span>
    </div>
  );
}

function FlowScene() {
  const frame = useCurrentFrame();
  const scroll = interpolate(frame, [0, 68], [50, -395], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const typed = "yourproduct.com".slice(0, Math.max(0, Math.floor((frame - 5) * 1.25)));

  return (
    <AbsoluteFill style={{ opacity: sceneOpacity(frame, 70, 4), overflow: "hidden", color: C.paper, background: C.ink, fontFamily: font }}>
      <Texture />
      <Hud />
      <div style={{ position: "absolute", left: 65, top: 184, width: 610 }}>
        <div style={{ ...slide(frame, 1, -90, 0), color: C.lime, fontSize: 21, fontWeight: 900, letterSpacing: "4px" }}>FROM URL TO #1</div>
        <div style={{ ...slide(frame, 5, 0, 65), marginTop: 21, fontSize: 91, lineHeight: 0.91, fontWeight: 950, letterSpacing: "-7px" }}>Three moves.<br /><span style={{ color: C.orange }}>Ten seconds.</span></div>
        <div style={{ ...slide(frame, 13, 0, 35), width: 560, marginTop: 42, overflow: "hidden", border: "2px solid #44483f", borderRadius: 18, background: "#1d201a" }}>
          <div style={{ height: 44, display: "flex", alignItems: "center", gap: 8, padding: "0 17px", borderBottom: "1px solid #44483f" }}><i style={{ width: 8, height: 8, borderRadius: 50, background: C.orange }} /><i style={{ width: 8, height: 8, borderRadius: 50, background: C.lime }} /><i style={{ width: 8, height: 8, borderRadius: 50, background: C.violet }} /></div>
          <div style={{ height: 76, display: "flex", alignItems: "center", gap: 12, padding: "0 20px", color: "#c7cabf", fontSize: 19 }}><span style={{ color: C.lime }}>↗</span>{typed}<i style={{ width: 2, height: 25, display: "block", background: C.lime, opacity: frame % 8 < 5 ? 1 : 0 }} /></div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 765, right: 75, top: 130, transform: `translateY(${scroll}px)` }}>
        <FlowCard number="01" title="PASTE YOUR URL." sub="We autofill the public name, copy, and icon." color={C.paper} frame={frame} start={2} rotate={-1.5} />
        <div style={{ height: 24 }} />
        <FlowCard number="02" title="PAY ONCE." sub="Secure Stripe checkout. No recurring subscription." color={C.lime} frame={frame} start={13} rotate={1.2} />
        <div style={{ height: 24 }} />
        <FlowCard number="03" title="STAY VISIBLE." sub="Keep the rank until another product outbids you." color={C.violet} frame={frame} start={24} rotate={-1} />
      </div>
    </AbsoluteFill>
  );
}

function ProofScene() {
  const frame = useCurrentFrame();
  const line = appear(frame, 2, 34);
  const cursor = bounce(frame, 12, { damping: 15, stiffness: 145, mass: 0.72 });
  const ping = bounce(frame, 32, { damping: 7, stiffness: 260, mass: 0.48 });
  const badges = ["LIVE RANK", "EVERY CLICK TRACKED", "PUBLIC PROOF"];

  return (
    <AbsoluteFill style={{ opacity: sceneOpacity(frame, 49, 3), overflow: "hidden", color: C.ink, background: C.lime, fontFamily: font }}>
      <Texture light />
      <Hud light label="MEASURE ATTENTION" />
      <div style={{ position: "absolute", left: 61, top: 190, fontSize: 142, lineHeight: 0.84, fontWeight: 950, letterSpacing: "-10px" }}>
        <BigWord frame={frame} start={1} color={C.ink}>EVERY CLICK</BigWord>
        <BigWord frame={frame} start={6} color={C.orange} fromX={180}>IS TRACKED.</BigWord>
      </div>
      <div style={{ position: "absolute", left: 70, right: 70, bottom: 105, display: "flex", gap: 14 }}>
        {badges.map((badge, index) => <div key={badge} style={{ ...slide(frame, 14 + index * 4, 0, 40), padding: "13px 18px", border: `2px solid ${C.ink}`, borderRadius: 999, background: index === 1 ? C.ink : "transparent", color: index === 1 ? C.paper : C.ink, fontSize: 15, fontWeight: 900, letterSpacing: "1.3px" }}>{badge}</div>)}
      </div>
      <svg viewBox="0 0 700 430" style={{ position: "absolute", right: 38, top: 180, width: 760, height: 470, overflow: "visible" }}>
        <path d="M54 338 C145 90 345 402 624 80" fill="none" stroke={C.ink} strokeOpacity=".18" strokeWidth="7" strokeDasharray="18 17" />
        <path d="M54 338 C145 90 345 402 624 80" fill="none" stroke={C.orange} strokeWidth="13" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - line} />
      </svg>
      <div style={{ position: "absolute", right: interpolate(cursor, [0, 1], [680, 135]), top: interpolate(cursor, [0, 1], [665, 236]), transform: `rotate(${interpolate(cursor, [0, 1], [-24, 6])}deg) scale(${1 + Math.sin(ping * Math.PI) * 0.28})`, filter: "drop-shadow(7px 9px 0 rgba(18,20,15,.18))" }}>
        <svg width="100" height="100" viewBox="0 0 24 24" fill={C.paper} stroke={C.ink} strokeWidth="1.8" strokeLinejoin="round"><path d="M5 3l14 9-7 2-3 7L5 3Z" /></svg>
      </div>
      <div style={{ ...slide(frame, 33, 0, -30), position: "absolute", right: 106, top: 165, padding: "14px 20px", color: C.paper, background: C.ink, borderRadius: 12, boxShadow: `7px 7px 0 ${C.orange}`, fontSize: 17, fontWeight: 950, letterSpacing: "1.2px" }}>VISIT CONFIRMED ✓</div>
    </AbsoluteFill>
  );
}

function PriceScene() {
  const frame = useCurrentFrame();
  const flip = bounce(frame, 14, { damping: 10, stiffness: 260, mass: 0.48 });
  const ring = appear(frame, 4, 20);
  const price = frame < 17 ? "$5" : "$10";

  return (
    <AbsoluteFill style={{ opacity: sceneOpacity(frame, 49, 3), overflow: "hidden", color: C.paper, background: C.orange, fontFamily: font }}>
      <Texture />
      <Hud label="CURRENT TOP-SPOT THRESHOLD" />
      <div style={{ position: "absolute", left: -210, top: -260, width: 1020, height: 1020, border: `120px solid ${C.lime}`, borderRadius: "50%", opacity: ring, transform: `scale(${0.7 + ring * 0.3}) rotate(${frame * 1.2}deg)` }} />
      <div style={{ position: "absolute", left: 70, top: 188, zIndex: 2 }}>
        <div style={{ ...slide(frame, 0, -100, 0), color: C.ink, fontSize: 26, fontWeight: 950, letterSpacing: "5px" }}>RIGHT NOW</div>
        <div style={{ ...slide(frame, 5, 0, 50), marginTop: 18, fontSize: 119, lineHeight: 0.86, fontWeight: 950, letterSpacing: "-9px" }}>THE #1 SPOT<br />COSTS</div>
      </div>
      <div style={{ position: "absolute", right: 63, top: 160, width: 760, height: 630, display: "grid", placeItems: "center", color: C.ink, background: C.paper, border: `5px solid ${C.ink}`, borderRadius: 48, boxShadow: `25px 25px 0 ${C.ink}`, transform: `perspective(1000px) rotateX(${interpolate(flip, [0, 1], [0, 360])}deg) scale(${1 + Math.sin(flip * Math.PI) * 0.08})` }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 245, lineHeight: 0.78, fontWeight: 950, letterSpacing: "-18px" }}>{price}</div>
          <div style={{ marginTop: 48, fontSize: 18, fontWeight: 900, letterSpacing: "3px" }}>ONE PAYMENT · NO SUBSCRIPTION</div>
        </div>
      </div>
      <div style={{ ...slide(frame, 27, 0, 35), position: "absolute", left: 76, bottom: 112, zIndex: 3, width: 870, color: C.ink, fontSize: 29, fontWeight: 780 }}>The price moves when someone else bids.</div>
    </AbsoluteFill>
  );
}

function CtaScene() {
  const frame = useCurrentFrame();
  const button = bounce(frame, 14, { damping: 10, stiffness: 220, mass: 0.55 });
  const pulse = 1 + Math.max(0, Math.sin((frame - 17) * 0.34)) * 0.035;
  const orbit = frame * 2.2;

  return (
    <AbsoluteFill style={{ overflow: "hidden", color: C.paper, background: C.ink, fontFamily: font }}>
      <Texture />
      <div style={{ position: "absolute", right: -150, top: -700, width: 970, height: 970, border: `120px solid ${C.lime}`, borderRadius: "50%", transform: `rotate(${orbit}deg)`, boxShadow: "0 0 120px rgba(217,255,63,.16)" }}><div style={{ position: "absolute", left: 110, bottom: 34, width: 75, height: 75, background: C.orange, borderRadius: "50%" }} /></div>
      <div style={{ position: "absolute", left: -240, bottom: -450, width: 820, height: 820, border: `80px solid ${C.violet}`, borderRadius: "50%", transform: `rotate(${-orbit}deg)` }} />
      <div style={{ position: "absolute", inset: "72px 90px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div style={{ ...slide(frame, 0, 0, 30) }}><Brand light size={42} /></div>
        <div style={{ ...slide(frame, 4, 0, 95), marginTop: 38, fontSize: 131, lineHeight: 0.84, fontWeight: 950, letterSpacing: "-9px" }}>CLAIM #1.<br /><span style={{ color: C.lime }}>BEFORE THEY DO.</span></div>
        <div style={{ ...slide(frame, 11, 0, 42), marginTop: 37, color: "#b7bbb0", fontSize: 23, fontWeight: 700 }}>Get seen. Get clicked. Stay until you’re outbid.</div>
        <div style={{ marginTop: 42, opacity: clamp(button), transform: `translateY(${interpolate(button, [0, 1], [45, 0])}px) scale(${interpolate(button, [0, 1], [0.78, 1]) * pulse})`, padding: "22px 38px", color: C.ink, background: C.lime, border: `3px solid ${C.paper}`, borderRadius: 18, boxShadow: `0 0 0 8px rgba(217,255,63,.13), 12px 12px 0 ${C.orange}`, fontSize: 29, fontWeight: 950, letterSpacing: "-.6px" }}>OVERMCP.COM&nbsp;&nbsp;→</div>
      </div>
      <div style={{ position: "absolute", left: 70, right: 70, bottom: 45, display: "flex", justifyContent: "space-between", color: "#7e8377", fontSize: 13, fontWeight: 850, letterSpacing: "2.2px" }}><span>THE LIVE PRODUCT LEADERBOARD</span><span>STARTS AT $5 · PAY ONCE</span></div>
    </AbsoluteFill>
  );
}

function CutFlashes() {
  const frame = useCurrentFrame();
  const cuts = [52, 132, 195, 237, 278];
  const flash = cuts.reduce((max, cut) => Math.max(max, interpolate(Math.abs(frame - cut), [0, 1.5, 4], [0.82, 0.35, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })), 0);
  const wipeCut = cuts.find((cut) => frame >= cut - 2 && frame <= cut + 5);
  const wipe = wipeCut === undefined ? 0 : interpolate(frame, [wipeCut - 2, wipeCut + 5], [-35, 135], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: C.paper, opacity: flash, mixBlendMode: "screen" }} />
      {wipeCut !== undefined && <div style={{ position: "absolute", top: -300, left: `${wipe}%`, width: 250, height: 1700, background: C.orange, transform: "rotate(14deg)", opacity: 0.92 }} />}
    </AbsoluteFill>
  );
}

function Progress() {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", zIndex: 60, left: 0, right: 0, bottom: 0, height: 8, background: "rgba(255,255,255,.12)" }}>
      <div style={{ width: `${interpolate(frame, [0, 329], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}%`, height: "100%", background: C.orange, boxShadow: `0 0 22px ${C.orange}` }} />
    </div>
  );
}

export function OverMcpXPromo() {
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Audio src={staticFile("video/overmcp-bed.wav")} volume={0.9} />
      <Sequence from={0} durationInFrames={56}><HookScene /></Sequence>
      <Sequence from={50} durationInFrames={88}><RankScene /></Sequence>
      <Sequence from={130} durationInFrames={70}><FlowScene /></Sequence>
      <Sequence from={192} durationInFrames={49}><ProofScene /></Sequence>
      <Sequence from={234} durationInFrames={49}><PriceScene /></Sequence>
      <Sequence from={276} durationInFrames={54}><CtaScene /></Sequence>
      <CutFlashes />
      <Progress />
    </AbsoluteFill>
  );
}
