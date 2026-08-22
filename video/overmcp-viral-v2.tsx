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

const COLORS = {
  ink: "#11130f",
  paper: "#fffdf6",
  cream: "#f2f0e7",
  lime: "#d9ff3f",
  orange: "#ff4f2e",
  violet: "#9b8cff",
  line: "#292c25",
  muted: "#777b71",
};

const FONT = '"Helvetica Neue", Inter, Arial, sans-serif';
const ROASTME_ICON = "https://www.overmcp.com/api/product-icon/9d6d7d0a-2c30-4d54-b4b4-ebe36f2448cf";

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

function move(frame: number, start: number, duration = 10) {
  return interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
}

function pop(frame: number, start: number, stiffness = 250) {
  return spring({
    fps: 30,
    frame: frame - start,
    config: { damping: 13, mass: 0.55, stiffness },
  });
}

function fadeScene(frame: number, duration: number, fade = 5) {
  return interpolate(frame, [0, fade, duration - fade, duration], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

function rise(frame: number, start: number, y = 70, scale = 0.96): CSSProperties {
  const value = pop(frame, start);
  return {
    opacity: clamp(value),
    transform: `translateY(${interpolate(value, [0, 1], [y, 0])}px) scale(${interpolate(value, [0, 1], [scale, 1])})`,
  };
}

function Brand({ light = false, size = 34 }: { light?: boolean; size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", color: light ? COLORS.paper : COLORS.ink, fontFamily: FONT, fontSize: size, fontWeight: 950, letterSpacing: "-2.2px" }}>
      <svg width={size * 1.25} height={size * 1.25} viewBox="0 0 32 32" style={{ marginRight: 5 }}>
        <circle cx="13.5" cy="18.5" r="8.5" fill="none" stroke="currentColor" strokeWidth="4.5" />
        <path d="M18.5 13.5 27 5m-6.5 0H27v6.5" fill="none" stroke={COLORS.orange} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.6" />
      </svg>
      over<span style={{ color: light ? COLORS.lime : "#657800" }}>mcp</span>
    </div>
  );
}

function Grid({ dark = false }: { dark?: boolean }) {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          opacity: dark ? 0.12 : 0.19,
          backgroundImage: `linear-gradient(${dark ? "rgba(255,255,255,.11)" : "rgba(17,19,15,.12)"} 1px, transparent 1px), linear-gradient(90deg, ${dark ? "rgba(255,255,255,.11)" : "rgba(17,19,15,.12)"} 1px, transparent 1px)`,
          backgroundPosition: `${(frame * 1.4) % 58}px ${(frame * 0.8) % 58}px`,
          backgroundSize: "58px 58px",
        }}
      />
      <AbsoluteFill
        style={{
          opacity: dark ? 0.035 : 0.025,
          transform: `translate(${(frame * 11) % 7}px, ${(frame * 13) % 9}px)`,
          backgroundImage: "radial-gradient(circle, currentColor 0 1px, transparent 1.2px)",
          backgroundSize: "11px 11px",
          color: dark ? COLORS.paper : COLORS.ink,
        }}
      />
    </AbsoluteFill>
  );
}

function Kicker({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 11, color: light ? COLORS.paper : COLORS.ink, fontSize: 20, fontWeight: 900, letterSpacing: "3.1px" }}>
      <span style={{ width: 11, height: 11, borderRadius: 99, background: COLORS.lime, boxShadow: `0 0 22px ${COLORS.lime}` }} />
      {children}
    </div>
  );
}

function MaskLine({ children, frame, start, color }: { children: ReactNode; frame: number; start: number; color: string }) {
  const value = pop(frame, start, 285);
  return (
    <div style={{ overflow: "hidden", padding: "0 0 10px", lineHeight: 0.84 }}>
      <div style={{ color, opacity: clamp(value), transform: `translateY(${interpolate(value, [0, 1], [150, 0])}px) rotate(${interpolate(value, [0, 1], [4, 0])}deg)` }}>
        {children}
      </div>
    </div>
  );
}

function HookScene() {
  const frame = useCurrentFrame();
  const strike = move(frame, 17, 8);
  const buried = pop(frame, 22, 310);
  const impact = move(frame, 22, 5);

  return (
    <AbsoluteFill style={{ opacity: fadeScene(frame, 52), overflow: "hidden", color: COLORS.paper, background: COLORS.ink, fontFamily: FONT }}>
      <Grid dark />
      <div style={{ position: "absolute", width: 920, height: 920, right: -480, top: -440, border: `125px solid ${COLORS.orange}`, borderRadius: "50%", transform: `rotate(${frame * 2}deg) scale(${1 + impact * 0.08})` }} />
      <div style={{ position: "absolute", left: 58, right: 58, top: 54, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Brand light size={30} />
        <Kicker light>FOR BUILDERS</Kicker>
      </div>

      <div style={{ position: "absolute", left: 55, right: 55, top: 260, fontSize: 131, fontWeight: 950, letterSpacing: "-9px" }}>
        <MaskLine frame={frame} start={-4} color={COLORS.paper}>YOUR PRODUCT</MaskLine>
        <MaskLine frame={frame} start={2} color={COLORS.paper}>
          ISN&apos;T <span style={{ position: "relative", display: "inline-block", color: COLORS.orange }}>
            BAD.
            <span style={{ position: "absolute", height: 15, left: -8, top: "50%", width: `${strike * 112}%`, background: COLORS.lime, transform: "rotate(-7deg)", transformOrigin: "0 50%", boxShadow: `0 0 28px rgba(217,255,63,${strike * 0.55})` }} />
          </span>
        </MaskLine>
      </div>

      <div style={{ position: "absolute", left: 52, right: 52, bottom: 155, opacity: clamp(buried), transform: `translateX(${interpolate(buried, [0, 1], [310, 0])}px) skewX(${interpolate(buried, [0, 1], [-8, 0])}deg)`, color: COLORS.ink, background: COLORS.lime, border: `4px solid ${COLORS.paper}`, borderRadius: 24, boxShadow: `16px 16px 0 ${COLORS.orange}`, padding: "29px 36px", fontSize: 105, lineHeight: 0.9, fontWeight: 950, letterSpacing: "-7px" }}>
        IT&apos;S BURIED.
      </div>
      <div style={{ ...rise(frame, 31, 24), position: "absolute", left: 60, bottom: 65, color: "#a8aca1", fontSize: 22, fontWeight: 750 }}>Great products lose when nobody sees them.</div>
    </AbsoluteFill>
  );
}

function ProductIcon({ type }: { type: "mention" | "roast" | "empty" }) {
  if (type === "mention") {
    return <Img src={staticFile("video/mentionleads-icon.png")} style={{ width: 72, height: 72, borderRadius: 17, objectFit: "cover" }} />;
  }
  if (type === "roast") {
    return <Img src={ROASTME_ICON} style={{ width: 72, height: 72, borderRadius: 17, objectFit: "cover" }} />;
  }
  return <div style={{ width: 72, height: 72, display: "grid", placeItems: "center", color: COLORS.ink, background: COLORS.lime, border: `2px solid ${COLORS.ink}`, borderRadius: 17, fontSize: 36, fontWeight: 950 }}>+</div>;
}

function BoardRow({ rank, name, detail, amount, type, active = false }: { rank: number; name: string; detail: string; amount: string; type: "mention" | "roast" | "empty"; active?: boolean }) {
  return (
    <div style={{ height: 132, display: "grid", gridTemplateColumns: "74px 80px 1fr 145px", alignItems: "center", gap: 15, padding: "0 22px", color: COLORS.ink, background: active ? COLORS.lime : COLORS.paper, border: `2px solid ${COLORS.ink}`, borderRadius: 20, boxShadow: active ? `10px 10px 0 ${COLORS.ink}` : "none" }}>
      <strong style={{ fontSize: 42, letterSpacing: "-3px" }}>#{rank}</strong>
      <ProductIcon type={type} />
      <div style={{ minWidth: 0 }}>
        <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 26, letterSpacing: "-1.1px" }}>{name}</strong>
        <span style={{ display: "block", marginTop: 6, color: "#585c53", fontSize: 14, fontWeight: 750 }}>{detail}</span>
      </div>
      <div style={{ textAlign: "right" }}>
        <strong style={{ display: "block", fontSize: 38, letterSpacing: "-2px" }}>{amount}</strong>
        <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: "1.2px" }}>{active ? "TO CLAIM" : "TOTAL"}</span>
      </div>
    </div>
  );
}

function RevealScene() {
  const frame = useCurrentFrame();
  const card = pop(frame, 10, 195);
  const rowOne = pop(frame, 19);
  const rowTwo = pop(frame, 25);
  const rowThree = pop(frame, 33, 285);

  return (
    <AbsoluteFill style={{ opacity: fadeScene(frame, 70), overflow: "hidden", color: COLORS.ink, background: COLORS.orange, fontFamily: FONT }}>
      <Grid />
      <div style={{ position: "absolute", left: 54, right: 54, top: 60, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Brand size={31} />
        <div style={{ padding: "11px 16px", color: COLORS.paper, background: COLORS.ink, borderRadius: 999, fontSize: 14, fontWeight: 900, letterSpacing: "2px" }}>LIVE PRODUCT LEADERBOARD</div>
      </div>
      <div style={{ position: "absolute", left: 55, top: 164, right: 50, fontSize: 86, lineHeight: 0.89, fontWeight: 950, letterSpacing: "-6px" }}>
        <div style={{ ...rise(frame, 1, 60) }}>SO I BUILT A</div>
        <div style={{ ...rise(frame, 5, 60), color: COLORS.paper }}>WAY OUT.</div>
      </div>
      <div style={{ position: "absolute", left: 46, right: 46, top: 410, height: 755, padding: "22px", opacity: clamp(card), transform: `translateY(${interpolate(card, [0, 1], [510, 0])}px) rotate(${interpolate(card, [0, 1], [6, -1.1])}deg)`, background: COLORS.cream, border: `4px solid ${COLORS.ink}`, borderRadius: 30, boxShadow: `19px 19px 0 ${COLORS.violet}` }}>
        <div style={{ height: 72, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px 17px" }}>
          <strong style={{ fontSize: 25, letterSpacing: "-.8px" }}>RANKED BY CONFIRMED BID</strong>
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 900, letterSpacing: "1.4px" }}><i style={{ width: 9, height: 9, borderRadius: 99, background: "#5dbb36" }} /> LIVE</span>
        </div>
        <div style={{ display: "grid", gap: 15 }}>
          <div style={{ opacity: clamp(rowOne), transform: `translateX(${interpolate(rowOne, [0, 1], [330, 0])}px)` }}><BoardRow rank={1} name="MentionLeads" detail="Founder credit" amount="$5" type="mention" /></div>
          <div style={{ opacity: clamp(rowTwo), transform: `translateX(${interpolate(rowTwo, [0, 1], [390, 0])}px)` }}><BoardRow rank={2} name="roastme.gg" detail="Founder credit" amount="$5" type="roast" /></div>
          <div style={{ opacity: clamp(rowThree), transform: `translateX(${interpolate(rowThree, [0, 1], [470, 0])}px)` }}><BoardRow rank={3} name="YOUR PRODUCT" detail="One payment · every click tracked" amount="$3" type="empty" active /></div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

function Pointer({ frame }: { frame: number }) {
  const fly = move(frame, 15, 15);
  const tap = pop(frame, 31, 360);
  return (
    <div style={{ position: "absolute", zIndex: 8, left: interpolate(fly, [0, 1], [970, 820]), top: interpolate(fly, [0, 1], [930, 430]), transform: `rotate(-13deg) scale(${1 - Math.sin(clamp(tap) * Math.PI) * 0.12})`, filter: "drop-shadow(7px 8px 0 rgba(17,19,15,.18))" }}>
      <svg width="84" height="84" viewBox="0 0 24 24" fill={COLORS.paper} stroke={COLORS.ink} strokeLinejoin="round" strokeWidth="1.8"><path d="M5 3l14 9-7 2-3 7L5 3Z" /></svg>
      <span style={{ position: "absolute", width: 105, height: 105, left: -24, top: -25, border: `5px solid ${COLORS.orange}`, borderRadius: 999, opacity: move(frame, 31, 3) * (1 - move(frame, 34, 10)), transform: `scale(${interpolate(move(frame, 31, 13), [0, 1], [0.25, 1.4])})` }} />
    </div>
  );
}

function AuctionScene() {
  const frame = useCurrentFrame();
  const picked = move(frame, 31, 4);
  const total = Math.round(interpolate(picked, [0, 1], [0, 3]));
  const success = pop(frame, 41, 290);
  const options = ["#1", "TOP 2", "TOP 3"];

  return (
    <AbsoluteFill style={{ opacity: fadeScene(frame, 78), overflow: "hidden", color: COLORS.ink, background: COLORS.cream, fontFamily: FONT }}>
      <Grid />
      <div style={{ position: "absolute", left: 54, right: 54, top: 58, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Brand size={31} />
        <Kicker>CHOOSE YOUR REACH</Kicker>
      </div>
      <div style={{ position: "absolute", left: 54, top: 160, right: 54, fontSize: 91, lineHeight: 0.88, fontWeight: 950, letterSpacing: "-6.5px" }}>
        <div style={{ ...rise(frame, 1, 50) }}>PICK THE SPOT.</div>
        <div style={{ ...rise(frame, 5, 50), color: COLORS.orange }}>SEE THE PRICE.</div>
      </div>

      <div style={{ position: "absolute", left: 50, right: 50, top: 410, padding: "26px", background: COLORS.paper, border: `4px solid ${COLORS.ink}`, borderRadius: 31, boxShadow: `18px 18px 0 ${COLORS.violet}`, ...rise(frame, 8, 120) }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 11 }}>
          {options.map((option, index) => {
            const selected = index === 2 && picked > 0.4;
            return <div key={option} style={{ padding: "22px 8px", color: selected ? COLORS.ink : "#666a61", background: selected ? COLORS.lime : COLORS.cream, border: `2px solid ${selected ? COLORS.ink : "#c9ccc1"}`, borderRadius: 15, boxShadow: selected ? `5px 5px 0 ${COLORS.ink}` : "none", textAlign: "center", fontSize: 21, fontWeight: 950, letterSpacing: ".7px", transform: `scale(${selected ? 1.03 : 1})` }}>{option}</div>;
          })}
        </div>
        <div style={{ height: 345, marginTop: 24, display: "grid", gridTemplateColumns: "1fr 310px", alignItems: "center", gap: 22, padding: "28px", overflow: "hidden", color: COLORS.paper, background: COLORS.ink, borderRadius: 22 }}>
          <div>
            <span style={{ color: COLORS.lime, fontSize: 15, fontWeight: 900, letterSpacing: "2.6px" }}>TOP 3 · CURRENT START</span>
            <strong style={{ display: "block", marginTop: 14, fontSize: 58, lineHeight: 0.94, letterSpacing: "-3.2px" }}>YOUR PRODUCT<br />GOES HERE.</strong>
            <div style={{ marginTop: 23, display: "flex", gap: 8 }}>
              {["PAY ONCE", "TRACK CLICKS"].map((item) => <span key={item} style={{ padding: "9px 11px", border: "1px solid #464a41", borderRadius: 999, color: "#c4c8bd", fontSize: 11, fontWeight: 900, letterSpacing: "1px" }}>{item}</span>)}
            </div>
          </div>
          <div style={{ position: "relative", height: 250, display: "grid", placeItems: "center", color: COLORS.ink, background: picked ? COLORS.lime : COLORS.paper, borderRadius: 20, transform: `scale(${1 + Math.sin(clamp(success) * Math.PI) * 0.06})` }}>
            <div style={{ textAlign: "center" }}>
              <span style={{ display: "block", fontSize: 15, fontWeight: 900, letterSpacing: "2.2px" }}>STARTS AT</span>
              <strong style={{ display: "block", marginTop: 9, fontSize: 117, lineHeight: 0.8, letterSpacing: "-9px" }}>${total}</strong>
              <span style={{ display: "block", marginTop: 24, fontSize: 14, fontWeight: 900 }}>NO SUBSCRIPTION</span>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 22, height: 84, display: "grid", placeItems: "center", color: COLORS.paper, background: COLORS.orange, border: `2px solid ${COLORS.ink}`, borderRadius: 17, boxShadow: `${5 + clamp(success) * 3}px ${5 + clamp(success) * 3}px 0 ${COLORS.ink}`, fontSize: 25, fontWeight: 950, letterSpacing: "-.5px" }}>
          CLAIM TOP 3 FOR $3 →
        </div>
      </div>
      <Pointer frame={frame} />
      <div style={{ ...rise(frame, 48, 24), position: "absolute", right: 67, bottom: 75, padding: "13px 17px", color: COLORS.paper, background: COLORS.ink, border: `2px solid ${COLORS.paper}`, borderRadius: 12, boxShadow: `7px 7px 0 ${COLORS.orange}`, fontSize: 16, fontWeight: 950, letterSpacing: "1px", transform: `${rise(frame, 48, 24).transform} rotate(2deg)` }}>READY TO CLAIM ✓</div>
    </AbsoluteFill>
  );
}

function StepCard({ frame, start, number, title, detail, color, rotate }: { frame: number; start: number; number: string; title: string; detail: string; color: string; rotate: number }) {
  const value = pop(frame, start, 240);
  const settled = clamp(value);
  return (
    <div style={{ height: 205, display: "grid", gridTemplateColumns: "104px 1fr 62px", alignItems: "center", gap: 18, padding: "0 27px", opacity: settled, transform: `translateX(${interpolate(settled, [0, 1], [850, 0])}px) rotate(${interpolate(settled, [0, 1], [rotate * 4, rotate])}deg)`, color: COLORS.ink, background: color, border: `3px solid ${COLORS.ink}`, borderRadius: 24, boxShadow: "11px 11px 0 rgba(17,19,15,.38)" }}>
      <strong style={{ fontSize: 50, letterSpacing: "-3px" }}>{number}</strong>
      <div><strong style={{ display: "block", fontSize: 46, lineHeight: 0.92, letterSpacing: "-2.7px" }}>{title}</strong><span style={{ display: "block", marginTop: 11, color: "#4f534a", fontSize: 16, fontWeight: 750 }}>{detail}</span></div>
      <span style={{ width: 55, height: 55, display: "grid", placeItems: "center", color: COLORS.paper, background: COLORS.ink, borderRadius: 999, fontSize: 27 }}>→</span>
    </div>
  );
}

function MechanicsScene() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: fadeScene(frame, 52, 4), overflow: "hidden", color: COLORS.paper, background: COLORS.orange, fontFamily: FONT }}>
      <Grid />
      <div style={{ position: "absolute", left: 53, right: 53, top: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Brand size={31} />
        <div style={{ color: COLORS.ink, fontSize: 16, fontWeight: 950, letterSpacing: "2.2px" }}>LIVE IN SECONDS</div>
      </div>
      <div style={{ position: "absolute", left: 53, top: 150, fontSize: 82, lineHeight: 0.89, fontWeight: 950, letterSpacing: "-5.8px" }}>
        <div style={{ ...rise(frame, 0, 50) }}>THREE MOVES.</div>
        <div style={{ ...rise(frame, 4, 50), color: COLORS.paper }}>ZERO MYSTERY.</div>
      </div>
      <div style={{ position: "absolute", left: 45, right: 45, top: 390, display: "grid", gap: 18 }}>
        <StepCard frame={frame} start={5} number="01" title="PASTE URL." detail="Name, copy and icon autofill." color={COLORS.paper} rotate={-1.2} />
        <StepCard frame={frame} start={11} number="02" title="PAY ONCE." detail="Secure Stripe checkout." color={COLORS.lime} rotate={1.1} />
        <StepCard frame={frame} start={17} number="03" title="GO LIVE." detail="Stay listed until you are outbid." color={COLORS.violet} rotate={-0.8} />
      </div>
      <div style={{ ...rise(frame, 27, 30), position: "absolute", left: 58, right: 58, bottom: 63, display: "flex", justifyContent: "space-between", color: COLORS.ink, fontSize: 14, fontWeight: 950, letterSpacing: "1.8px" }}><span>EVERY CLICK TRACKED</span><span>NO RECURRING FEE</span></div>
    </AbsoluteFill>
  );
}

function CtaScene() {
  const frame = useCurrentFrame();
  const price = pop(frame, 3, 250);
  const button = pop(frame, 13, 285);
  const pulse = 1 + Math.max(0, Math.sin((frame - 15) * 0.39)) * 0.035;
  const orbit = frame * 2.2;

  return (
    <AbsoluteFill style={{ overflow: "hidden", color: COLORS.paper, background: COLORS.ink, fontFamily: FONT }}>
      <Grid dark />
      <div style={{ position: "absolute", width: 820, height: 820, right: -420, top: -480, border: `100px solid ${COLORS.lime}`, borderRadius: "50%", transform: `rotate(${orbit}deg)` }}><span style={{ position: "absolute", left: 90, bottom: 14, width: 80, height: 80, borderRadius: 99, background: COLORS.orange }} /></div>
      <div style={{ position: "absolute", width: 650, height: 650, left: -390, bottom: -410, border: `70px solid ${COLORS.violet}`, borderRadius: "50%", transform: `rotate(${-orbit}deg)` }} />
      <div style={{ position: "absolute", left: 55, right: 55, top: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Brand light size={34} />
        <Kicker light>LIVE NOW</Kicker>
      </div>
      <div style={{ position: "absolute", left: 55, right: 55, top: 218, textAlign: "center" }}>
        <div style={{ ...rise(frame, 0, 55), color: "#aeb2a6", fontSize: 30, fontWeight: 900, letterSpacing: "5px" }}>TOP 3 STARTS AT</div>
        <div style={{ marginTop: 32, opacity: clamp(price), transform: `scale(${interpolate(price, [0, 1], [0.45, 1])}) rotate(${interpolate(price, [0, 1], [-9, 0])}deg)`, color: COLORS.lime, fontSize: 325, lineHeight: 0.76, fontWeight: 950, letterSpacing: "-26px", textShadow: `13px 13px 0 ${COLORS.orange}` }}>$3</div>
        <div style={{ ...rise(frame, 8, 40), marginTop: 52, fontSize: 58, lineHeight: 0.94, fontWeight: 950, letterSpacing: "-3.5px" }}>THE NEXT BID CAN<br /><span style={{ color: COLORS.orange }}>MOVE THE PRICE.</span></div>
        <div style={{ margin: "58px auto 0", width: 800, opacity: clamp(button), transform: `translateY(${interpolate(button, [0, 1], [55, 0])}px) scale(${interpolate(button, [0, 1], [0.72, 1]) * pulse})`, padding: "27px 34px", color: COLORS.ink, background: COLORS.lime, border: `4px solid ${COLORS.paper}`, borderRadius: 22, boxShadow: `0 0 0 9px rgba(217,255,63,.12), 14px 14px 0 ${COLORS.orange}`, fontSize: 34, fontWeight: 950, letterSpacing: "-.8px" }}>CLAIM YOUR SPOT →</div>
      </div>
      <div style={{ position: "absolute", left: 55, right: 55, bottom: 66, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong style={{ fontSize: 36, letterSpacing: "-1.5px" }}>OVERMCP.COM</strong>
        <span style={{ color: "#8f9388", fontSize: 13, fontWeight: 900, letterSpacing: "1.7px" }}>PAY ONCE · STAY UNTIL OUTBID</span>
      </div>
    </AbsoluteFill>
  );
}

function TransitionFlashes() {
  const frame = useCurrentFrame();
  const cuts = [44, 104, 174, 218];
  const flash = cuts.reduce((highest, cut) => Math.max(highest, interpolate(Math.abs(frame - cut), [0, 1, 4], [0.72, 0.28, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })), 0);
  const activeCut = cuts.find((cut) => frame >= cut - 2 && frame <= cut + 5);
  const wipe = activeCut === undefined ? 0 : interpolate(frame, [activeCut - 2, activeCut + 5], [-45, 140], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  return (
    <AbsoluteFill style={{ zIndex: 50, pointerEvents: "none", overflow: "hidden" }}>
      <AbsoluteFill style={{ opacity: flash, background: COLORS.paper, mixBlendMode: "screen" }} />
      {activeCut !== undefined && <div style={{ position: "absolute", left: `${wipe}%`, top: -250, width: 210, height: 1900, background: COLORS.orange, transform: "rotate(11deg)", boxShadow: `0 0 75px ${COLORS.orange}` }} />}
    </AbsoluteFill>
  );
}

export function OverMcpViralV2() {
  return (
    <AbsoluteFill style={{ background: COLORS.ink }}>
      <Audio src={staticFile("video/overmcp-viral-v2.wav")} volume={0.94} />
      <Sequence from={0} durationInFrames={52}><HookScene /></Sequence>
      <Sequence from={44} durationInFrames={70}><RevealScene /></Sequence>
      <Sequence from={104} durationInFrames={78}><AuctionScene /></Sequence>
      <Sequence from={174} durationInFrames={52}><MechanicsScene /></Sequence>
      <Sequence from={218} durationInFrames={52}><CtaScene /></Sequence>
      <TransitionFlashes />
    </AbsoluteFill>
  );
}
