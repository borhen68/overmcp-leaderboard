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
  bg: "#080d0b",
  panel: "#111915",
  panel2: "#18231d",
  text: "#f4f7f0",
  muted: "#96a39b",
  dim: "#5f6b64",
  lime: "#c2e978",
  green: "#36d399",
  coral: "#ff7560",
  cream: "#f0f2e9",
  ink: "#0e1512",
  line: "rgba(244,247,240,.13)",
};

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';

const clamp = (value: number) => Math.max(0, Math.min(1, value));

function ease(frame: number, start: number, duration = 12) {
  return interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
}

function pop(frame: number, start: number, stiffness = 235) {
  return spring({
    fps: 30,
    frame: frame - start,
    config: { damping: 14, mass: 0.55, stiffness },
  });
}

function sceneOpacity(frame: number, duration: number, fade = 6) {
  return interpolate(frame, [0, fade, duration - fade, duration], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

function rise(frame: number, start: number, distance = 70): CSSProperties {
  const value = clamp(pop(frame, start));
  return {
    opacity: value,
    transform: `translateY(${interpolate(value, [0, 1], [distance, 0])}px) scale(${interpolate(value, [0, 1], [.96, 1])})`,
  };
}

function LogoMark({ size = 58, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="17" fill={C.lime} />
      <circle cx="27" cy="37" r="16" fill="none" stroke={dark ? C.ink : C.ink} strokeWidth="9" />
      <path d="M35 29 51 13M40 13h11v11" fill="none" stroke={C.coral} strokeLinecap="round" strokeLinejoin="round" strokeWidth="7" />
    </svg>
  );
}

function GrainGrid({ bright = false }: { bright?: boolean }) {
  const frame = useCurrentFrame();
  const line = bright ? "rgba(14,21,18,.10)" : "rgba(244,247,240,.08)";
  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
      <AbsoluteFill style={{
        opacity: .45,
        backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`,
        backgroundPosition: `${(frame * .8) % 64}px ${(frame * .42) % 64}px`,
        backgroundSize: "64px 64px",
      }} />
      <AbsoluteFill style={{
        opacity: .045,
        transform: `translate(${frame % 5}px, ${(frame * 3) % 7}px)`,
        color: bright ? C.ink : C.text,
        backgroundImage: "radial-gradient(circle, currentColor 0 1px, transparent 1.2px)",
        backgroundSize: "9px 9px",
      }} />
    </AbsoluteFill>
  );
}

function TopBar({ label, bright = false }: { label: string; bright?: boolean }) {
  return (
    <div style={{ position: "absolute", zIndex: 8, left: 54, right: 54, top: 48, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <LogoMark size={53} dark={bright} />
      <div style={{ display: "flex", alignItems: "center", gap: 11, color: bright ? C.ink : C.text, fontSize: 16, fontWeight: 900, letterSpacing: "2.8px" }}>
        <i style={{ width: 9, height: 9, borderRadius: 99, background: C.green, boxShadow: `0 0 18px ${C.green}` }} />
        {label}
      </div>
    </div>
  );
}

function MaskLine({ children, frame, start, color = C.text }: { children: ReactNode; frame: number; start: number; color?: string }) {
  const value = clamp(pop(frame, start, 285));
  return (
    <div style={{ overflow: "hidden", paddingBottom: 8, lineHeight: .84 }}>
      <div style={{ color, opacity: value, transform: `translateY(${interpolate(value, [0, 1], [145, 0])}px) rotate(${interpolate(value, [0, 1], [3, 0])}deg)` }}>
        {children}
      </div>
    </div>
  );
}

function MarketStrip({ frame }: { frame: number }) {
  const items = ["ATTENTION", "DISTRIBUTION", "DEMAND", "POSITION"];
  return (
    <div style={{ position: "absolute", left: -120, right: -120, bottom: 95, display: "flex", gap: 13, transform: `translateX(${-((frame * 8) % 300)}px) rotate(-3deg)` }}>
      {[...items, ...items].map((item, index) => (
        <div key={`${item}-${index}`} style={{ flex: "0 0 auto", display: "flex", alignItems: "center", gap: 14, padding: "18px 24px", color: index % 2 ? C.ink : C.text, background: index % 2 ? C.lime : C.panel2, border: `2px solid ${index % 2 ? C.ink : C.line}`, borderRadius: 12, boxShadow: `8px 8px 0 ${index % 2 ? C.coral : "rgba(0,0,0,.3)"}`, fontSize: 20, fontWeight: 900, letterSpacing: "1.4px" }}>
          {item}<span style={{ color: index % 2 ? "#277f58" : C.green }}>↗</span>
        </div>
      ))}
    </div>
  );
}

function CompanyScene() {
  const frame = useCurrentFrame();
  const ring = ease(frame, 15, 22);
  return (
    <AbsoluteFill style={{ opacity: sceneOpacity(frame, 58), overflow: "hidden", color: C.text, background: C.bg, fontFamily: FONT }}>
      <GrainGrid />
      <TopBar label="THEIR MARKETS" />
      <div style={{ position: "absolute", width: 690, height: 690, right: -380, top: 170, border: `92px solid ${C.lime}`, borderRadius: "50%", opacity: .12 + ring * .3, transform: `scale(${.68 + ring * .32}) rotate(${frame * 2}deg)` }} />
      <div style={{ position: "absolute", left: 56, right: 50, top: 235, fontSize: 118, fontWeight: 950, letterSpacing: "-7.5px" }}>
        <MaskLine frame={frame} start={-2}>BIG COMPANIES</MaskLine>
        <MaskLine frame={frame} start={4}>HAVE THEIR OWN</MaskLine>
        <MaskLine frame={frame} start={10} color={C.lime}>MARKETS.</MaskLine>
      </div>
      <div style={{ ...rise(frame, 20, 28), position: "absolute", left: 61, top: 625, color: C.muted, fontSize: 22, fontWeight: 700 }}>Attention gets priced. Position gets traded.</div>
      <MarketStrip frame={frame} />
    </AbsoluteFill>
  );
}

function Token({ x, y, glyph, frame, delay, color }: { x: number; y: number; glyph: string; frame: number; delay: number; color: string }) {
  const value = clamp(pop(frame, delay, 260));
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 104, height: 104, display: "grid", placeItems: "center", opacity: value, color: C.ink, background: color, border: `3px solid ${C.ink}`, borderRadius: 99, boxShadow: `10px 10px 0 rgba(14,21,18,.22)`, fontSize: 43, fontWeight: 950, transform: `translateY(${interpolate(value, [0, 1], [100, Math.sin((frame + delay) * .12) * 9])}px) rotate(${interpolate(value, [0, 1], [-14, 0]) + Math.sin(frame * .04) * 4}deg)` }}>
      {glyph}
    </div>
  );
}

function CryptoScene() {
  const frame = useCurrentFrame();
  const draw = ease(frame, 10, 31);
  return (
    <AbsoluteFill style={{ opacity: sceneOpacity(frame, 65), overflow: "hidden", color: C.ink, background: C.cream, fontFamily: FONT }}>
      <GrainGrid bright />
      <TopBar label="EVERY TOKEN" bright />
      <svg width="1080" height="1350" viewBox="0 0 1080 1350" style={{ position: "absolute", inset: 0 }}>
        <path d="M-40 1085 C 155 1030, 195 1130, 346 935 S 570 910, 640 705 S 795 610, 1125 355" fill="none" stroke="rgba(14,21,18,.12)" strokeWidth="38" />
        <path d="M-40 1085 C 155 1030, 195 1130, 346 935 S 570 910, 640 705 S 795 610, 1125 355" fill="none" stroke={C.green} strokeWidth="11" strokeLinecap="round" strokeDasharray="1900" strokeDashoffset={1900 * (1 - draw)} />
      </svg>
      <Token x={120} y={930} glyph="₿" frame={frame} delay={7} color={C.coral} />
      <Token x={515} y={718} glyph="Ξ" frame={frame} delay={14} color={C.lime} />
      <Token x={835} y={430} glyph="◎" frame={frame} delay={21} color="#8fe1ff" />
      <div style={{ position: "absolute", left: 55, right: 55, top: 190, fontSize: 103, fontWeight: 950, letterSpacing: "-6.6px" }}>
        <MaskLine frame={frame} start={0} color={C.ink}>CRYPTO HAS</MaskLine>
        <MaskLine frame={frame} start={5} color={C.ink}>A CHART FOR</MaskLine>
        <MaskLine frame={frame} start={10} color={C.coral}>EVERYTHING.</MaskLine>
      </div>
      <div style={{ ...rise(frame, 31, 25), position: "absolute", left: 58, bottom: 72, padding: "14px 19px", color: C.text, background: C.ink, borderRadius: 12, fontSize: 17, fontWeight: 900, letterSpacing: "1.7px" }}>PRICE · MOMENTUM · WHO MOVED IT</div>
    </AbsoluteFill>
  );
}

function FeedCard({ frame, delay, y, width }: { frame: number; delay: number; y: number; width: number }) {
  const value = ease(frame, delay, 10);
  return (
    <div style={{ position: "absolute", left: 170, top: y, width, height: 138, opacity: value * .72, padding: 22, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 18, transform: `translateY(${interpolate(value, [0, 1], [85, -frame * 3.4])}px)` }}>
      <div style={{ width: 38, height: 38, borderRadius: 99, background: C.dim }} />
      <div style={{ position: "absolute", left: 74, top: 25, width: "48%", height: 13, borderRadius: 99, background: "rgba(244,247,240,.17)" }} />
      <div style={{ position: "absolute", left: 22, top: 82, width: "76%", height: 10, borderRadius: 99, background: "rgba(244,247,240,.10)" }} />
      <div style={{ position: "absolute", left: 22, top: 104, width: "54%", height: 10, borderRadius: 99, background: "rgba(244,247,240,.08)" }} />
    </div>
  );
}

function XScene() {
  const frame = useCurrentFrame();
  const stamp = clamp(pop(frame, 20, 310));
  return (
    <AbsoluteFill style={{ opacity: sceneOpacity(frame, 59), overflow: "hidden", color: C.text, background: C.bg, fontFamily: FONT }}>
      <GrainGrid />
      <TopBar label="OUR COMMUNITY" />
      <FeedCard frame={frame} delay={0} y={350} width={720} />
      <FeedCard frame={frame} delay={4} y={535} width={650} />
      <FeedCard frame={frame} delay={8} y={720} width={755} />
      <div style={{ position: "absolute", right: -45, top: 108, color: "rgba(244,247,240,.045)", fontSize: 590, lineHeight: 1, fontWeight: 500, letterSpacing: "-55px" }}>𝕏</div>
      <div style={{ position: "absolute", zIndex: 5, left: 55, right: 55, top: 180, fontSize: 110, fontWeight: 950, letterSpacing: "-7px" }}>
        <MaskLine frame={frame} start={0}>BUILDERS ON X?</MaskLine>
        <MaskLine frame={frame} start={7} color={C.muted}>WE DIDN&apos;T.</MaskLine>
      </div>
      <div style={{ position: "absolute", zIndex: 6, left: 77, right: 77, bottom: 190, opacity: stamp, transform: `scale(${interpolate(stamp, [0, 1], [1.8, 1])}) rotate(-3deg)`, padding: "27px 31px", color: C.ink, background: C.coral, border: `4px solid ${C.text}`, borderRadius: 17, boxShadow: `14px 14px 0 ${C.lime}`, textAlign: "center", fontSize: 55, fontWeight: 950, letterSpacing: "-2px" }}>
        JUST A FEED. NO MARKET.
      </div>
      <div style={{ ...rise(frame, 29, 22), position: "absolute", left: 0, right: 0, bottom: 82, color: C.muted, textAlign: "center", fontSize: 19, fontWeight: 800, letterSpacing: "1.4px" }}>NO LIVE RANKING · NO PRICE FOR ATTENTION</div>
    </AbsoluteFill>
  );
}

function MentionIcon({ size = 58 }: { size?: number }) {
  return <Img src={staticFile("video/mentionleads-icon.png")} style={{ width: size, height: size, objectFit: "cover", borderRadius: size * .24 }} />;
}

function RoastIcon({ size = 58 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, display: "grid", placeItems: "center", color: "white", background: "#412019", border: "2px solid #803d2d", borderRadius: size * .24, fontSize: size * .55 }}>🔥</div>
  );
}

function BuilderMarketScene() {
  const frame = useCurrentFrame();
  const card = clamp(pop(frame, 4, 180));
  const draw = ease(frame, 17, 39);
  const first = clamp(pop(frame, 28, 270));
  const second = clamp(pop(frame, 45, 270));
  const dock = clamp(pop(frame, 58, 220));
  const value = frame < 29 ? 0 : frame < 46 ? 5 : 10;
  return (
    <AbsoluteFill style={{ opacity: sceneOpacity(frame, 96), overflow: "hidden", color: C.text, background: C.bg, fontFamily: FONT }}>
      <GrainGrid />
      <TopBar label="OUR MARKET" />
      <div style={{ position: "absolute", left: 54, right: 54, top: 126, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div style={{ ...rise(frame, 0, 45), fontSize: 84, lineHeight: .9, fontWeight: 950, letterSpacing: "-5.5px" }}>SO I BUILT<br /><span style={{ color: C.lime }}>OURS.</span></div>
        <div style={{ ...rise(frame, 9, 35), paddingBottom: 7, color: C.muted, fontSize: 17, fontWeight: 800, letterSpacing: "1.6px", textAlign: "right" }}>REAL BIDS<br />REAL MOVEMENT</div>
      </div>

      <div style={{ position: "absolute", left: 48, right: 48, top: 345, height: 690, overflow: "hidden", opacity: card, transform: `translateY(${interpolate(card, [0, 1], [180, 0])}px) scale(${interpolate(card, [0, 1], [.92, 1])})`, background: C.panel, border: `2px solid ${C.line}`, borderRadius: 27, boxShadow: "0 38px 110px rgba(0,0,0,.46)" }}>
        <div style={{ height: 91, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", borderBottom: `1px solid ${C.line}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}><LogoMark size={48} /><div><strong style={{ display: "block", fontSize: 20 }}>OverMCP Market Pulse</strong><span style={{ color: C.muted, fontSize: 12 }}>Every rise is a confirmed move</span></div></div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, color: C.green, fontSize: 12, fontWeight: 900, letterSpacing: "1.4px" }}><i style={{ width: 8, height: 8, borderRadius: 99, background: C.green, boxShadow: `0 0 15px ${C.green}` }} /> LIVE</div>
        </div>

        <div style={{ height: 126, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", borderBottom: `1px solid ${C.line}` }}>
          <div><span style={{ display: "block", color: C.dim, fontSize: 11, fontWeight: 900, letterSpacing: "1.8px" }}>CONFIRMED VALUE</span><strong style={{ display: "block", marginTop: 5, fontSize: 55, lineHeight: 1, letterSpacing: "-3px" }}>${value}</strong></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 34 }}>
            {[["MOVES", frame < 29 ? "0" : frame < 46 ? "1" : "2"], ["ENTRY", "$3"], ["MODEL", "PAY ONCE"]].map(([label, number]) => <div key={label} style={{ minWidth: 120, paddingLeft: 20, borderLeft: `1px solid ${C.line}` }}><span style={{ color: C.dim, fontSize: 10, fontWeight: 900, letterSpacing: "1.4px" }}>{label}</span><strong style={{ display: "block", marginTop: 7, fontSize: 22 }}>{number}</strong></div>)}
          </div>
        </div>

        <div style={{ position: "relative", height: 350, overflow: "hidden", background: "linear-gradient(180deg, rgba(54,211,153,.035), transparent)" }}>
          {[78, 176, 274].map((y) => <div key={y} style={{ position: "absolute", left: 65, right: 25, top: y, borderTop: "1px dashed rgba(244,247,240,.09)" }} />)}
          <svg width="984" height="350" viewBox="0 0 984 350" style={{ position: "absolute", inset: 0 }}>
            <path d="M64 280 H340 V205 H650 V101 H948" fill="none" stroke="rgba(54,211,153,.18)" strokeWidth="20" strokeLinejoin="round" />
            <path d="M64 280 H340 V205 H650 V101 H948" fill="none" stroke={C.green} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1300" strokeDashoffset={1300 * (1 - draw)} />
            <path d="M64 280 H340 V205 H650 V101 H948 V320 H64 Z" fill="rgba(54,211,153,.08)" opacity={draw} />
          </svg>
          <div style={{ position: "absolute", left: 310, top: 174, opacity: first, transform: `scale(${interpolate(first, [0, 1], [.2, 1])})`, filter: "drop-shadow(0 8px 13px rgba(0,0,0,.5))" }}><MentionIcon size={62} /></div>
          <div style={{ position: "absolute", left: 620, top: 70, opacity: second, transform: `scale(${interpolate(second, [0, 1], [.2, 1])})`, filter: "drop-shadow(0 8px 13px rgba(0,0,0,.5))" }}><RoastIcon size={62} /></div>
          <div style={{ position: "absolute", left: 355, top: 164, opacity: first, padding: "10px 13px", color: C.text, background: "#173a2d", border: `1px solid rgba(54,211,153,.35)`, borderRadius: 10, fontSize: 12, fontWeight: 850 }}>MentionLeads +$5</div>
          <div style={{ position: "absolute", left: 665, top: 60, opacity: second, padding: "10px 13px", color: C.text, background: "#173a2d", border: `1px solid rgba(54,211,153,.35)`, borderRadius: 10, fontSize: 12, fontWeight: 850 }}>roastme.gg +$5</div>
          <span style={{ position: "absolute", left: 22, top: 270, color: C.dim, fontSize: 11 }}>$0</span>
          <span style={{ position: "absolute", left: 22, top: 195, color: C.dim, fontSize: 11 }}>$5</span>
          <span style={{ position: "absolute", left: 16, top: 91, color: C.dim, fontSize: 11 }}>$10</span>
        </div>

        <div style={{ height: 123, display: "grid", gridTemplateColumns: "1fr 290px", alignItems: "center", gap: 18, padding: "0 22px", opacity: dock, transform: `translateY(${interpolate(dock, [0, 1], [80, 0])}px)`, borderTop: `1px solid ${C.line}`, background: "linear-gradient(100deg, rgba(194,233,120,.18), rgba(24,35,29,.9) 48%)" }}>
          <div><span style={{ color: C.lime, fontSize: 11, fontWeight: 900, letterSpacing: "1.5px" }}>CLAIM TOP 3</span><strong style={{ display: "block", marginTop: 5, fontSize: 30 }}>Your product moves the market.</strong></div>
          <div style={{ height: 65, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", color: C.ink, background: C.lime, borderRadius: 14, boxShadow: `7px 7px 0 ${C.coral}`, fontSize: 18, fontWeight: 950 }}><span>START AT $3</span><span>→</span></div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

function CtaScene() {
  const frame = useCurrentFrame();
  const logo = clamp(pop(frame, 0, 250));
  const button = clamp(pop(frame, 20, 260));
  const pulse = 1 + Math.max(0, Math.sin((frame - 24) * .32)) * .035;
  return (
    <AbsoluteFill style={{ overflow: "hidden", color: C.text, background: C.bg, fontFamily: FONT }}>
      <GrainGrid />
      <div style={{ position: "absolute", width: 760, height: 760, left: -470, top: -400, border: `95px solid ${C.coral}`, borderRadius: "50%", opacity: .25, transform: `rotate(${frame * 2}deg)` }} />
      <div style={{ position: "absolute", width: 900, height: 900, right: -590, bottom: -520, border: `120px solid ${C.lime}`, borderRadius: "50%", opacity: .2, transform: `rotate(${-frame * 1.7}deg)` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 145, display: "grid", placeItems: "center", opacity: logo, transform: `scale(${interpolate(logo, [0, 1], [.2, 1])})` }}><LogoMark size={112} /></div>
      <div style={{ position: "absolute", left: 55, right: 55, top: 315, textAlign: "center" }}>
        <div style={{ ...rise(frame, 5, 48), color: C.muted, fontSize: 20, fontWeight: 900, letterSpacing: "4px" }}>THE MARKET FOR X BUILDERS</div>
        <div style={{ ...rise(frame, 10, 70), marginTop: 24, fontSize: 98, lineHeight: .86, fontWeight: 950, letterSpacing: "-6.4px" }}>IS LIVE.</div>
        <div style={{ ...rise(frame, 15, 38), marginTop: 45, color: C.lime, fontSize: 32, fontWeight: 950, letterSpacing: "2px" }}>BID · CLIMB · GET DISCOVERED</div>
        <div style={{ width: 790, margin: "62px auto 0", opacity: button, transform: `translateY(${interpolate(button, [0, 1], [60, 0])}px) scale(${interpolate(button, [0, 1], [.8, 1]) * pulse})`, padding: "28px 34px", color: C.ink, background: C.lime, border: `4px solid ${C.text}`, borderRadius: 22, boxShadow: `15px 15px 0 ${C.coral}`, fontSize: 39, fontWeight: 950, letterSpacing: "-1px" }}>CLAIM TOP 3 FROM $3 →</div>
      </div>
      <div style={{ position: "absolute", left: 55, right: 55, bottom: 74, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <strong style={{ fontSize: 39, letterSpacing: "-1.8px" }}>OVERMCP.COM</strong>
        <span style={{ color: C.muted, fontSize: 15, fontWeight: 900, letterSpacing: "2px" }}>PAY ONCE · STAY UNTIL OUTBID</span>
      </div>
    </AbsoluteFill>
  );
}

function Transitions() {
  const frame = useCurrentFrame();
  const cuts = [50, 107, 156, 242];
  return (
    <AbsoluteFill style={{ zIndex: 50, pointerEvents: "none", overflow: "hidden" }}>
      {cuts.map((cut, index) => {
        const local = frame - cut;
        const visible = local >= -3 && local <= 6;
        if (!visible) return null;
        const travel = interpolate(local, [-3, 6], [-75, 175], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
        return <div key={cut} style={{ position: "absolute", left: `${travel}%`, top: -260, width: 265, height: 1900, background: index % 2 ? C.lime : C.coral, transform: "rotate(11deg)", boxShadow: `0 0 90px ${index % 2 ? C.lime : C.coral}` }} />;
      })}
    </AbsoluteFill>
  );
}

export function OverMcpMarketStory() {
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Audio src={staticFile("video/overmcp-market-story.wav")} volume={.94} />
      <Sequence from={0} durationInFrames={58}><CompanyScene /></Sequence>
      <Sequence from={50} durationInFrames={65}><CryptoScene /></Sequence>
      <Sequence from={107} durationInFrames={59}><XScene /></Sequence>
      <Sequence from={156} durationInFrames={96}><BuilderMarketScene /></Sequence>
      <Sequence from={242} durationInFrames={58}><CtaScene /></Sequence>
      <Transitions />
    </AbsoluteFill>
  );
}
