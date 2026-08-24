import type {CSSProperties, ReactNode} from "react";
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
  ink: "#171512",
  night: "#0a0b0a",
  cream: "#fbf8f2",
  paper: "#fffefd",
  coral: "#f16d50",
  violet: "#7657da",
  green: "#20b276",
  lime: "#c8f36e",
  muted: "#938c84",
};

const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';
const FPS = 30;
const TOTAL_FRAMES = 300;
const clamp = (value: number) => Math.max(0, Math.min(1, value));

function move(frame: number, start: number, duration = 12, easing = Easing.out(Easing.cubic)) {
  return interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });
}

function bounce(frame: number, start: number, stiffness = 260) {
  return clamp(spring({
    fps: FPS,
    frame: frame - start,
    config: {damping: 14, mass: .55, stiffness},
  }));
}

function sceneOpacity(frame: number, duration: number, fade = 5) {
  return interpolate(frame, [0, fade, duration - fade, duration], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

function BrandMark({size = 58, dark = false}: {size?: number; dark?: boolean}) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="17" fill={dark ? C.ink : C.lime} />
      <circle cx="27" cy="37" r="16" fill="none" stroke={dark ? C.lime : C.ink} strokeWidth="9" />
      <path d="M35 29 51 13M40 13h11v11" fill="none" stroke={C.coral} strokeLinecap="round" strokeLinejoin="round" strokeWidth="7" />
    </svg>
  );
}

function BrandRail({dark = false, label = "DAILY FOUNDER RACE"}: {dark?: boolean; label?: string}) {
  return (
    <div style={{
      position: "absolute",
      zIndex: 30,
      left: 48,
      right: 48,
      top: 38,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      color: dark ? C.ink : C.cream,
      fontFamily: FONT,
    }}>
      <div style={{display: "flex", alignItems: "center", gap: 13}}>
        <BrandMark size={50} dark={dark} />
        <strong style={{fontSize: 25, letterSpacing: "-1.4px"}}>overmcp</strong>
      </div>
      <span style={{fontSize: 12, fontWeight: 950, letterSpacing: "2.5px"}}>{label}</span>
    </div>
  );
}

function Atmosphere({light = false, accent = C.coral}: {light?: boolean; accent?: string}) {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{overflow: "hidden", background: light ? C.cream : C.night}}>
      <div style={{
        position: "absolute",
        width: 900,
        height: 900,
        left: -360 + Math.sin(frame * .021) * 42,
        top: -400 + Math.cos(frame * .018) * 38,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${accent}38 0%, transparent 66%)`,
      }} />
      <div style={{
        position: "absolute",
        width: 820,
        height: 820,
        right: -390 + Math.cos(frame * .018) * 55,
        bottom: -380 + Math.sin(frame * .023) * 40,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${light ? "#7657da22" : "#c8f36e22"} 0%, transparent 68%)`,
      }} />
      <AbsoluteFill style={{
        opacity: light ? .055 : .08,
        backgroundImage: `linear-gradient(${light ? "#171512" : "#fbf8f2"} 1px, transparent 1px), linear-gradient(90deg, ${light ? "#171512" : "#fbf8f2"} 1px, transparent 1px)`,
        backgroundPosition: `${(frame * 1.7) % 90}px ${(frame * .7) % 90}px`,
        backgroundSize: "90px 90px",
        transform: "perspective(700px) rotateX(5deg) scale(1.12)",
      }} />
      {Array.from({length: 22}).map((_, index) => {
        const x = (index * 197 + 83) % 1080;
        const startY = (index * 113 + 41) % 1350;
        const y = (startY + frame * (1.8 + index % 4)) % 1450 - 50;
        const size = 2 + index % 4;
        return <i key={index} style={{position: "absolute", left: x, top: y, width: size, height: size, borderRadius: 99, opacity: .18 + (index % 5) * .06, background: index % 3 ? accent : C.lime, boxShadow: `0 0 12px ${accent}`}} />;
      })}
    </AbsoluteFill>
  );
}

function TextRise({
  children,
  frame,
  start,
  color,
  distance = 130,
  style,
}: {
  children: ReactNode;
  frame: number;
  start: number;
  color?: string;
  distance?: number;
  style?: CSSProperties;
}) {
  const reveal = bounce(frame, start, 310);
  return (
    <div style={{overflow: "hidden", padding: "0 10px 10px", marginLeft: -10}}>
      <div style={{
        ...style,
        color,
        opacity: reveal,
        transform: `translateY(${interpolate(reveal, [0, 1], [distance, 0])}px) skewY(${interpolate(reveal, [0, 1], [6, 0])}deg)`,
      }}>{children}</div>
    </div>
  );
}

type ProductKind = "mention" | "chain" | "roast";

function ProductCore({kind, size}: {kind: ProductKind; size: number}) {
  if (kind === "mention") {
    return <Img src={staticFile("video/mentionleads-icon.png")} style={{width: size, height: size, display: "block", borderRadius: size * .23, objectFit: "cover"}} />;
  }
  if (kind === "roast") {
    return <Img src={staticFile("video/roastme-icon.png")} style={{width: size, height: size, display: "block", borderRadius: size * .23, objectFit: "contain", background: "#e5f7ef"}} />;
  }
  return (
    <div style={{
      width: size,
      height: size,
      display: "grid",
      placeItems: "center",
      color: "#fff",
      borderRadius: size * .23,
      background: "#001a37",
      fontSize: size * .34,
      fontWeight: 500,
      letterSpacing: "-2px",
    }}>CL</div>
  );
}

function ProductOrb({
  kind,
  size = 110,
  color,
  rank,
  style,
}: {
  kind: ProductKind;
  size?: number;
  color: string;
  rank?: number;
  style?: CSSProperties;
}) {
  return (
    <div style={{position: "absolute", width: size, height: size, ...style}}>
      <div style={{
        position: "absolute",
        inset: -16,
        border: `3px solid ${color}`,
        borderRadius: "50%",
        boxShadow: `0 0 35px ${color}88, inset 0 0 30px ${color}38`,
      }} />
      <div style={{position: "absolute", inset: 0, padding: 8, borderRadius: size * .28, background: C.paper, boxShadow: "0 18px 45px rgba(0,0,0,.35)"}}>
        <ProductCore kind={kind} size={size - 16} />
      </div>
      {rank !== undefined && (
        <span style={{
          position: "absolute",
          right: -27,
          top: -29,
          width: 57,
          height: 57,
          display: "grid",
          placeItems: "center",
          color: C.ink,
          border: `4px solid ${C.paper}`,
          borderRadius: "50%",
          background: color,
          fontSize: 18,
          fontWeight: 950,
        }}>#{rank}</span>
      )}
    </div>
  );
}

function HookScene() {
  const frame = useCurrentFrame();
  const coin = bounce(frame, 1, 280);
  const slash = move(frame, 16, 9, Easing.inOut(Easing.cubic));
  const impact = move(frame, 20, 4);
  const shake = Math.sin(frame * 5.7) * (1 - move(frame, 24, 8)) * (impact > 0 ? 8 : 0);

  return (
    <AbsoluteFill style={{opacity: sceneOpacity(frame, 45), overflow: "hidden", color: C.cream, background: C.night, fontFamily: FONT}}>
      <Atmosphere accent={C.coral} />
      <BrandRail label="THE RULES JUST CHANGED" />
      <div style={{position: "absolute", left: 55, right: 55, top: 212, transform: `translateX(${shake}px)`}}>
        <TextRise frame={frame} start={0} style={{fontSize: 122, lineHeight: .8, fontWeight: 950, letterSpacing: "-9px"}}>MONEY</TextRise>
        <TextRise frame={frame} start={4} style={{fontSize: 122, lineHeight: .8, fontWeight: 950, letterSpacing: "-9px"}}>CAN’T BUY</TextRise>
        <TextRise frame={frame} start={8} color={C.coral} style={{fontSize: 122, lineHeight: .8, fontWeight: 950, letterSpacing: "-9px"}}>TODAY’S #1.</TextRise>
      </div>

      <div style={{
        position: "absolute",
        right: 76,
        bottom: 155,
        width: 270,
        height: 270,
        display: "grid",
        placeItems: "center",
        opacity: coin,
        color: C.ink,
        border: `9px solid ${C.cream}`,
        borderRadius: "50%",
        background: C.lime,
        boxShadow: `0 0 0 18px ${C.lime}22, 0 35px 90px rgba(0,0,0,.5)`,
        fontSize: 140,
        fontWeight: 950,
        transform: `rotate(${interpolate(coin, [0, 1], [-35, 8])}deg) scale(${interpolate(coin, [0, 1], [.15, 1])})`,
      }}>$</div>
      <div style={{
        position: "absolute",
        zIndex: 20,
        right: -60,
        bottom: 267,
        width: 450,
        height: 30,
        opacity: slash,
        borderRadius: 99,
        background: C.coral,
        boxShadow: `0 0 35px ${C.coral}`,
        transform: `rotate(-42deg) scaleX(${slash})`,
        transformOrigin: "50% 50%",
      }} />
      <div style={{position: "absolute", left: 62, bottom: 121, maxWidth: 565, opacity: move(frame, 17, 11), color: C.muted, fontSize: 23, lineHeight: 1.25, fontWeight: 850}}>
        Founders can enter.<br /><span style={{color: C.cream}}>The crowd decides who leads.</span>
      </div>
    </AbsoluteFill>
  );
}

function EntryScene() {
  const frame = useCurrentFrame();
  const portal = bounce(frame, 3, 215);
  const switchProgress = move(frame, 47, 12);
  const orbit = frame * .018;
  const products: Array<{kind: ProductKind; color: string; angle: number; delay: number}> = [
    {kind: "mention", color: C.coral, angle: -2.3, delay: 11},
    {kind: "chain", color: C.violet, angle: -.2, delay: 17},
    {kind: "roast", color: C.green, angle: 1.9, delay: 23},
  ];

  return (
    <AbsoluteFill style={{opacity: sceneOpacity(frame, 90), overflow: "hidden", color: C.ink, background: C.cream, fontFamily: FONT}}>
      <Atmosphere light accent={C.coral} />
      <BrandRail dark label="WELCOME TO THE ARENA" />
      <div style={{position: "absolute", left: 45, right: 45, top: 138, textAlign: "center"}}>
        <TextRise frame={frame} start={0} color={C.ink} style={{fontSize: 76, lineHeight: .9, fontWeight: 950, letterSpacing: "-5.3px"}}>PAY TO ENTER.</TextRise>
        <TextRise frame={frame} start={5} color={C.coral} style={{fontSize: 76, lineHeight: .9, fontWeight: 950, letterSpacing: "-5.3px"}}>NEVER PAY TO WIN.</TextRise>
      </div>

      <div style={{position: "absolute", left: 540, top: 750, width: 1, height: 1, opacity: portal}}>
        {[0, 1, 2].map((index) => (
          <i key={index} style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 360 + index * 135,
            height: 360 + index * 135,
            border: `${index === 0 ? 8 : 2}px ${index === 0 ? "solid" : "dashed"} ${index === 0 ? C.ink : C.coral + "55"}`,
            borderRadius: "50%",
            transform: `translate(-50%,-50%) rotate(${(index % 2 ? -1 : 1) * (frame * (1 + index * .25))}deg) scale(${interpolate(portal, [0, 1], [.4, 1])})`,
          }} />
        ))}
        <div style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 260,
          height: 260,
          display: "grid",
          placeItems: "center",
          color: switchProgress > .5 ? C.cream : C.ink,
          borderRadius: "50%",
          background: switchProgress > .5 ? C.ink : C.lime,
          boxShadow: `0 0 ${45 + switchProgress * 45}px ${switchProgress > .5 ? "#17151255" : "#c8f36e88"}`,
          transform: `translate(-50%,-50%) scale(${.7 + portal * .3})`,
        }}>
          <div style={{textAlign: "center"}}>
            <strong style={{display: "block", fontSize: switchProgress > .5 ? 74 : 94, lineHeight: .82, letterSpacing: "-6px"}}>{switchProgress > .5 ? "YOU" : "$3"}</strong>
            <span style={{display: "block", marginTop: 17, fontSize: 13, fontWeight: 950, letterSpacing: "2px"}}>{switchProgress > .5 ? "DECIDE #1" : "GETS YOU IN"}</span>
          </div>
        </div>
      </div>

      {products.map((product, index) => {
        const arrival = bounce(frame, product.delay, 245);
        const angle = product.angle + orbit;
        const radius = interpolate(arrival, [0, 1], [620, 335]);
        const x = 540 + Math.cos(angle) * radius;
        const y = 750 + Math.sin(angle) * radius * .76;
        return <ProductOrb key={product.kind} kind={product.kind} color={product.color} size={118} rank={index + 1} style={{left: x - 59, top: y - 59, opacity: arrival, transform: `scale(${interpolate(arrival, [0, 1], [.35, 1])}) rotate(${Math.sin(frame * .08 + index) * 4}deg)`}} />;
      })}

      <div style={{position: "absolute", left: 0, right: 0, bottom: 69, opacity: move(frame, 57, 12), textAlign: "center"}}>
        <strong style={{display: "block", fontSize: 28, letterSpacing: "-.8px"}}>THE INTERNET OWNS TODAY’S RANK.</strong>
        <span style={{display: "block", marginTop: 8, color: C.muted, fontSize: 16, fontWeight: 850, letterSpacing: "1.5px"}}>ONE PERSON · ONE BACKING · EVERY DAY</span>
      </div>
    </AbsoluteFill>
  );
}

const racePoints = {
  mention: [[70, 1100], [245, 1100], [425, 850], [600, 850], [790, 560], [985, 330]],
  chain: [[70, 1140], [245, 940], [425, 940], [600, 690], [790, 690], [985, 455]],
  roast: [[70, 1175], [245, 1080], [425, 995], [600, 860], [790, 760], [985, 650]],
} satisfies Record<ProductKind, Array<[number, number]>>;

function smoothPath(points: Array<[number, number]>) {
  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index];
    const middle = (previous[0] + point[0]) / 2;
    return path + ` C ${middle} ${previous[1]}, ${middle} ${point[1]}, ${point[0]} ${point[1]}`;
  }, `M ${points[0][0]} ${points[0][1]}`);
}

function pointOnRace(kind: ProductKind, progress: number) {
  const points = racePoints[kind];
  const segmentFloat = clamp(progress) * (points.length - 1);
  const segment = Math.min(points.length - 2, Math.floor(segmentFloat));
  const local = segmentFloat - segment;
  const eased = Easing.inOut(Easing.cubic)(local);
  return {
    x: interpolate(eased, [0, 1], [points[segment][0], points[segment + 1][0]]),
    y: interpolate(eased, [0, 1], [points[segment][1], points[segment + 1][1]]),
  };
}

function SupportBurst({frame, at, x, y, color}: {frame: number; at: number; x: number; y: number; color: string}) {
  const burst = move(frame, at, 13);
  const visible = frame >= at && frame <= at + 20;
  if (!visible) return null;
  return (
    <div style={{position: "absolute", zIndex: 20, left: x, top: y, pointerEvents: "none"}}>
      <i style={{position: "absolute", width: 150, height: 150, border: `5px solid ${color}`, borderRadius: "50%", opacity: 1 - burst, transform: `translate(-50%,-50%) scale(${.2 + burst * 1.7})`}} />
      <strong style={{position: "absolute", left: 18, top: -75 - burst * 34, width: 260, opacity: Math.sin(burst * Math.PI), color, fontSize: 25, fontWeight: 950, letterSpacing: "-.8px"}}>+1 BACKING</strong>
    </div>
  );
}

function RaceScene() {
  const frame = useCurrentFrame();
  const draw = move(frame, 6, 78, Easing.inOut(Easing.cubic));
  const racers: Array<{kind: ProductKind; color: string; name: string; delay: number; rank: number}> = [
    {kind: "mention", color: C.coral, name: "MentionLeads", delay: 0, rank: 1},
    {kind: "chain", color: C.violet, name: "ChainList", delay: 5, rank: 2},
    {kind: "roast", color: C.green, name: "roastme.gg", delay: 10, rank: 3},
  ];

  return (
    <AbsoluteFill style={{opacity: sceneOpacity(frame, 102), overflow: "hidden", color: C.cream, background: C.night, fontFamily: FONT}}>
      <Atmosphere accent={C.violet} />
      <BrandRail label="LIVE · TODAY" />
      <div style={{position: "absolute", left: 55, right: 55, top: 125}}>
        <TextRise frame={frame} start={0} color={C.cream} distance={70} style={{fontSize: 71, lineHeight: .9, fontWeight: 950, letterSpacing: "-5px"}}>EVERY BACKING</TextRise>
        <TextRise frame={frame} start={4} color={C.lime} distance={70} style={{fontSize: 71, lineHeight: .9, fontWeight: 950, letterSpacing: "-5px"}}>MOVES THE RACE.</TextRise>
      </div>

      <svg width="1080" height="1350" viewBox="0 0 1080 1350" style={{position: "absolute", inset: 0}}>
        <defs>
          {racers.map((racer) => (
            <linearGradient key={racer.kind} id={`video-fill-${racer.kind}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={racer.color} stopOpacity=".27" />
              <stop offset="100%" stopColor={racer.color} stopOpacity="0" />
            </linearGradient>
          ))}
          <clipPath id="race-reveal"><rect x="0" y="0" width={70 + draw * 940} height="1350" /></clipPath>
        </defs>
        {[0, 1, 2, 3].map((value) => {
          const y = 1170 - value * 235;
          return (
            <g key={value} opacity={move(frame, value * 2, 9)}>
              <line x1="65" x2="1010" y1={y} y2={y} stroke="rgba(251,248,242,.14)" strokeWidth="2" strokeDasharray="7 15" />
              <text x="42" y={y + 6} fill={C.muted} fontFamily={FONT} fontSize="18" fontWeight="800" textAnchor="end">{value}</text>
            </g>
          );
        })}
        <line x1="930" x2="930" y1="330" y2="1190" stroke={C.lime} strokeWidth="3" strokeDasharray="10 14" opacity=".5" />
        <text x="944" y="360" fill={C.lime} fontFamily={FONT} fontSize="14" fontWeight="950" letterSpacing="2">#1 LINE</text>
        {racers.slice().reverse().map((racer) => {
          const points = racePoints[racer.kind];
          const path = smoothPath(points);
          const area = `${path} L ${points[points.length - 1][0]} 1200 L ${points[0][0]} 1200 Z`;
          const localDraw = move(frame, 6 + racer.delay, 72, Easing.inOut(Easing.cubic));
          return (
            <g key={racer.kind} clipPath="url(#race-reveal)">
              <path d={area} fill={`url(#video-fill-${racer.kind})`} opacity={localDraw} />
              <path d={path} fill="none" stroke={racer.color} strokeWidth="30" opacity=".12" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - localDraw} />
              <path d={path} fill="none" stroke={racer.color} strokeWidth="8" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - localDraw} />
            </g>
          );
        })}
      </svg>

      {racers.map((racer) => {
        const local = move(frame, 6 + racer.delay, 72, Easing.inOut(Easing.cubic));
        const position = pointOnRace(racer.kind, local);
        const scale = bounce(frame, 9 + racer.delay, 260);
        return (
          <div key={racer.kind}>
            <ProductOrb kind={racer.kind} color={racer.color} rank={local > .96 ? racer.rank : undefined} size={92} style={{left: position.x - 46, top: position.y - 46, opacity: scale, transform: `scale(${.5 + scale * .5})`, filter: `drop-shadow(0 0 24px ${racer.color}88)`}} />
            <span style={{position: "absolute", left: position.x + 67, top: position.y - 14, opacity: local > .12 ? 1 : 0, color: racer.color, fontSize: 15, fontWeight: 950, letterSpacing: ".3px"}}>{racer.name}</span>
          </div>
        );
      })}

      <SupportBurst frame={frame} at={24} x={430} y={850} color={C.coral} />
      <SupportBurst frame={frame} at={44} x={600} y={690} color={C.violet} />
      <SupportBurst frame={frame} at={64} x={790} y={560} color={C.coral} />

      <div style={{position: "absolute", left: 55, right: 55, bottom: 47, display: "flex", justifyContent: "space-between", opacity: move(frame, 59, 12), fontSize: 16, fontWeight: 900, letterSpacing: "1.2px"}}>
        <span style={{color: C.muted}}>ONE PERSON = ONE MOVE</span>
        <span style={{color: C.lime}}>REAL VISIT SENT ↗</span>
      </div>
    </AbsoluteFill>
  );
}

function WinnerScene() {
  const frame = useCurrentFrame();
  const winner = bounce(frame, 2, 290);
  const crown = bounce(frame, 11, 330);
  const burst = move(frame, 0, 17);
  return (
    <AbsoluteFill style={{opacity: sceneOpacity(frame, 44, 4), overflow: "hidden", color: C.ink, background: C.lime, fontFamily: FONT}}>
      <Atmosphere light accent={C.green} />
      <BrandRail dark label="THE CROWD HAS SPOKEN" />
      <div style={{position: "absolute", right: -75, top: 90, opacity: .07, fontSize: 690, lineHeight: .8, fontWeight: 950, letterSpacing: "-70px"}}>1</div>
      {Array.from({length: 34}).map((_, index) => {
        const angle = index / 34 * Math.PI * 2;
        const distance = 140 + burst * (230 + index % 7 * 32);
        return <i key={index} style={{position: "absolute", left: 355 + Math.cos(angle) * distance, top: 700 + Math.sin(angle) * distance, width: 8 + index % 4 * 3, height: 30 + index % 6 * 8, borderRadius: 99, background: [C.coral, C.violet, C.green, C.cream][index % 4], transform: `rotate(${angle * 57.3 + frame * 4}deg)`, opacity: .85}} />;
      })}
      <div style={{position: "absolute", left: 205, top: 485, opacity: winner, transform: `scale(${interpolate(winner, [0, 1], [.2, 1])}) rotate(${interpolate(winner, [0, 1], [-22, 0])}deg)`}}>
        <ProductOrb kind="mention" color={C.coral} size={300} rank={1} />
        <div style={{position: "absolute", left: 80, top: -135, opacity: crown, fontSize: 150, transform: `rotate(${interpolate(crown, [0, 1], [-28, -7])}deg) scale(${crown})`}}>♛</div>
      </div>
      <div style={{position: "absolute", left: 560, right: 48, top: 345}}>
        <TextRise frame={frame} start={4} color={C.ink} distance={75} style={{fontSize: 84, lineHeight: .84, fontWeight: 950, letterSpacing: "-6px"}}>TODAY’S #1</TextRise>
        <TextRise frame={frame} start={8} color={C.coral} distance={75} style={{fontSize: 84, lineHeight: .84, fontWeight: 950, letterSpacing: "-6px"}}>IS EARNED.</TextRise>
        <div style={{marginTop: 38, opacity: move(frame, 17, 10), fontSize: 18, lineHeight: 1.35, fontWeight: 900}}>NOT BOUGHT.<br />NOT PERMANENT.<br /><span style={{color: C.coral}}>DECIDED AGAIN TOMORROW.</span></div>
      </div>
      <div style={{position: "absolute", left: 50, right: 50, bottom: 73, opacity: move(frame, 22, 9), textAlign: "center", fontSize: 25, fontWeight: 950, letterSpacing: ".5px"}}>EVERY BACKING ALSO SENDS A REAL VISIT ↗</div>
    </AbsoluteFill>
  );
}

function CtaScene() {
  const frame = useCurrentFrame();
  const logo = bounce(frame, 0, 270);
  const url = bounce(frame, 10, 285);
  const pulse = 1 + Math.max(0, Math.sin((frame - 17) * .32)) * .035;
  const seconds = Math.max(0, 13 * 60 * 60 + 4 * 60 + 16 - Math.floor(frame / FPS));
  const clock = [Math.floor(seconds / 3600), Math.floor(seconds % 3600 / 60), seconds % 60]
    .map((part) => String(part).padStart(2, "0")).join(":");
  const orbit = frame * .045;
  const orbiting: Array<{kind: ProductKind; color: string; phase: number}> = [
    {kind: "mention", color: C.coral, phase: 0},
    {kind: "chain", color: C.violet, phase: Math.PI * 2 / 3},
    {kind: "roast", color: C.green, phase: Math.PI * 4 / 3},
  ];

  return (
    <AbsoluteFill style={{overflow: "hidden", color: C.cream, background: C.night, fontFamily: FONT}}>
      <Atmosphere accent={C.coral} />
      <div style={{position: "absolute", left: 0, right: 0, top: 112, display: "grid", placeItems: "center", opacity: logo, transform: `scale(${interpolate(logo, [0, 1], [.2, 1])})`}}><BrandMark size={108} /></div>
      <div style={{position: "absolute", left: 45, right: 45, top: 275, textAlign: "center"}}>
        <TextRise frame={frame} start={2} color={C.cream} distance={70} style={{fontSize: 92, lineHeight: .84, fontWeight: 950, letterSpacing: "-7px"}}>BACK TODAY’S</TextRise>
        <TextRise frame={frame} start={5} color={C.coral} distance={70} style={{fontSize: 122, lineHeight: .8, fontWeight: 950, letterSpacing: "-9px"}}>NEXT #1.</TextRise>
      </div>
      <div style={{position: "absolute", left: 0, right: 0, top: 575, textAlign: "center", opacity: move(frame, 11, 10)}}>
        <span style={{display: "block", color: C.muted, fontSize: 14, fontWeight: 950, letterSpacing: "2.5px"}}>TODAY’S RACE ENDS IN</span>
        <strong style={{display: "block", marginTop: 9, color: C.lime, fontSize: 50, fontVariantNumeric: "tabular-nums", letterSpacing: "-2px"}}>{clock}</strong>
      </div>

      {orbiting.map((product) => {
        const radius = 350;
        const angle = product.phase + orbit;
        const x = 540 + Math.cos(angle) * radius;
        const y = 1045 + Math.sin(angle) * radius * .18;
        return <ProductOrb key={product.kind} kind={product.kind} color={product.color} size={76} style={{left: x - 38, top: y - 38, opacity: move(frame, 8, 9), transform: `scale(${.86 + Math.sin(angle) * .1})`}} />;
      })}

      <div style={{position: "absolute", zIndex: 10, left: 70, right: 70, top: 795, opacity: url, transform: `scale(${interpolate(url, [0, 1], [.72, 1]) * pulse})`, textAlign: "center"}}>
        <strong style={{display: "block", color: C.cream, fontSize: 72, lineHeight: 1, letterSpacing: "-4px"}}>OVERMCP.COM&nbsp;→</strong>
        <i style={{width: `${move(frame, 13, 20) * 100}%`, height: 8, display: "block", marginTop: 20, borderRadius: 99, background: `linear-gradient(90deg, ${C.coral}, ${C.lime})`, boxShadow: `0 0 28px ${C.coral}`}} />
      </div>
      <div style={{position: "absolute", left: 0, right: 0, bottom: 61, color: C.muted, textAlign: "center", fontSize: 15, fontWeight: 900, letterSpacing: "2px"}}>ONE PERSON · ONE BACKING · EVERY DAY</div>
    </AbsoluteFill>
  );
}

function FlashCuts() {
  const frame = useCurrentFrame();
  const cuts = [38, 120, 214, 250];
  return (
    <AbsoluteFill style={{zIndex: 90, overflow: "hidden", pointerEvents: "none"}}>
      {cuts.map((cut, index) => {
        const local = frame - cut;
        if (local < -3 || local > 7) return null;
        const travel = interpolate(local, [-3, 7], [-65, 165], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic)});
        const color = [C.coral, C.lime, C.violet, C.coral][index];
        return <div key={cut} style={{position: "absolute", left: `${travel}%`, top: -300, width: 300, height: 1950, background: color, transform: "rotate(13deg)", boxShadow: `0 0 100px ${color}`}} />;
      })}
    </AbsoluteFill>
  );
}

function FilmGrain() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{zIndex: 95, overflow: "hidden", opacity: .055, pointerEvents: "none", mixBlendMode: "screen"}}>
      <div style={{position: "absolute", inset: -40, transform: `translate(${frame % 7}px, ${(frame * 3) % 9}px)`, backgroundImage: "radial-gradient(circle, #fff 0 1px, transparent 1.2px)", backgroundSize: "7px 7px"}} />
    </AbsoluteFill>
  );
}

function ProgressBar() {
  const frame = useCurrentFrame();
  return <div style={{position: "absolute", zIndex: 100, left: 0, right: 0, bottom: 0, height: 7, background: "rgba(251,248,242,.1)"}}><div style={{width: `${frame / (TOTAL_FRAMES - 1) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${C.coral}, ${C.violet}, ${C.lime})`, boxShadow: `0 0 18px ${C.coral}`}} /></div>;
}

export function OverMcpFounderRace() {
  return (
    <AbsoluteFill style={{background: C.night}}>
      <Audio src={staticFile("video/overmcp-founder-race.wav")} volume={.96} />
      <Sequence from={0} durationInFrames={45}><HookScene /></Sequence>
      <Sequence from={38} durationInFrames={90}><EntryScene /></Sequence>
      <Sequence from={120} durationInFrames={102}><RaceScene /></Sequence>
      <Sequence from={214} durationInFrames={44}><WinnerScene /></Sequence>
      <Sequence from={250} durationInFrames={50}><CtaScene /></Sequence>
      <FlashCuts />
      <FilmGrain />
      <ProgressBar />
    </AbsoluteFill>
  );
}
