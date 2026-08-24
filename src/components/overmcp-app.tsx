"use client";

import {
  FormEvent,
  MouseEvent as ReactMouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Logo } from "@/components/brand-logo";
import { BID_INCREMENT_CENTS, PRODUCT_CATEGORIES } from "@/lib/constants";
import type { LeaderboardPayload, LeaderboardProduct, MarketDay, MarketMove } from "@/lib/types";

type SortMode = "Rank" | "Clicks" | "Newest";
type MarketRange = "7D" | "30D" | "ALL";
type MarketView = "value" | "activity";
type Theme = "dark" | "light";
type AutofillStatus = "idle" | "loading" | "success" | "error";
type BidTargetRank = 1 | 2 | 3 | 10;

type WebsiteMetadataResult = {
  name: string;
  description: string;
  iconDataUrl: string | null;
  iconSignature: string | null;
  error?: string;
};

const palettes = [
  ["#f2693f", "#3b1c14"],
  ["#98a5ff", "#1c2044"],
  ["#e8ff65", "#29300d"],
  ["#5de2c2", "#10342e"],
  ["#f5a7dd", "#3c1831"],
  ["#ffbc66", "#3d2910"],
] as const;

const DATAFAST_SHARE_URL = "https://datafa.st/share/6a8891cc9f3926b34adc34d6?realtime=1";

type DataFastWindow = Window & {
  datafast?: (goalName: string, parameters?: Record<string, string>) => void;
};

function trackDataFastGoal(goalName: string, parameters: Record<string, string>) {
  (window as DataFastWindow).datafast?.(goalName, parameters);
}

function Icon({ name, size = 18, strokeWidth = 1.8 }: { name: string; size?: number; strokeWidth?: number }) {
  const paths: Record<string, React.ReactNode> = {
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    moon: <path d="M20.2 15.2A8.5 8.5 0 0 1 8.8 3.8 8.5 8.5 0 1 0 20.2 15.2Z"/>,
    sun: <><circle cx="12" cy="12" r="3.5"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    bookmark: <path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-4-6 4V4.8Z"/>,
    shield: <><path d="M12 3 5 6v5c0 4.7 2.9 8 7 10 4.1-2 7-5.3 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></>,
    trend: <><path d="m3 17 6-6 4 4 7-8"/><path d="M15 7h5v5"/></>,
    external: <><path d="M14 4h6v6"/><path d="m10 14 10-10"/><path d="M20 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4"/></>,
    close: <><path d="m6 6 12 12"/><path d="m18 6-12 12"/></>,
    menu: <><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>,
    spark: <path d="m12 3 1.2 5.8L19 10l-5.8 1.2L12 17l-1.2-5.8L5 10l5.8-1.2L12 3Z"/>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    bolt: <path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z"/>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
  };

  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function formatDollars(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

function formatDollarAmount(cents: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function elapsedTime(value: string, relativeTo: string) {
  const minutes = Math.max(0, Math.floor((new Date(relativeTo).getTime() - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return "moments";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.floor(hours / 24);
  if (days < 60) return `${days} day${days === 1 ? "" : "s"}`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"}`;
}

function relativeTime(value: string, relativeTo: string) {
  const seconds = Math.max(0, Math.floor((new Date(relativeTo).getTime() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function paletteFor(value: string) {
  const hash = [...value].reduce((total, letter) => total + letter.charCodeAt(0), 0);
  return palettes[hash % palettes.length];
}

function ProductMark({
  id,
  name,
  hasIcon,
  className,
  style,
}: {
  id: string;
  name: string;
  hasIcon: boolean;
  className: string;
  style?: React.CSSProperties;
}) {
  const [iconFailed, setIconFailed] = useState(false);

  return (
    <span className={`${className} product-mark`} style={style} aria-hidden="true">
      {(!hasIcon || iconFailed) && <span>{name.slice(0, 1).toUpperCase()}</span>}
      {hasIcon && !iconFailed && <img src={`/api/product-icon/${id}`} alt="" onError={() => setIconFailed(true)} />}
    </span>
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;

function utcDayStart(value: string) {
  const date = new Date(value);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function utcDayKey(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function dayLabel(date: string, includeYear = false) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "2-digit" } : {}),
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function chartTimeTicks(start: number, end: number, count: number) {
  const ticksByDay = new Map<string, number>();
  Array.from({ length: count }, (_, index) => start + ((end - start) * index) / Math.max(1, count - 1)).forEach((timestamp, index) => {
    const day = utcDayKey(timestamp);
    if (!ticksByDay.has(day) || index === count - 1) ticksByDay.set(day, timestamp);
  });
  return [...ticksByDay.values()];
}

function conciseProductName(name: string) {
  const normalized = name.replace(/\s+/g, " ").trim();
  const dashName = normalized.split(/\s+[—–]\s+/)[0]?.trim();
  if (dashName && dashName !== normalized && dashName.length <= 32) return dashName;
  const domains = normalized.match(/[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z]{2,})+/gi);
  const domain = domains?.at(-1);
  if (domain && (normalized.toLowerCase().endsWith(domain.toLowerCase()) || normalized.length > 32)) return domain;
  return normalized.length > 32 ? `${normalized.slice(0, 31).trim()}…` : normalized;
}

function targetPositionLabel(targetRank: BidTargetRank, productCount: number) {
  if (targetRank === 10 && productCount < 10) return `#${productCount + 1}`;
  return targetRank === 1 ? "#1" : `Top ${targetRank}`;
}

function claimPositionLabel(targetRank: BidTargetRank, productCount: number) {
  const label = targetPositionLabel(targetRank, productCount);
  return label.startsWith("#") ? `Claim the ${label} spot` : `Claim a ${label.toLowerCase()} spot`;
}

function niceChartStep(value: number) {
  if (value <= 0) return 100;
  const power = 10 ** Math.floor(Math.log10(value));
  const fraction = value / power;
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
  return niceFraction * power;
}

function marketRangeStart(range: MarketRange, moves: MarketMove[], generatedAt: string) {
  const now = new Date(generatedAt).getTime();
  if (range === "7D") return now - 7 * DAY_MS;
  if (range === "30D") return now - 30 * DAY_MS;
  if (!moves.length) return now - 7 * DAY_MS;
  const firstMove = new Date(moves[0].happenedAt).getTime();
  const activitySpan = Math.max(60 * 60 * 1000, now - firstMove);
  return Math.max(0, firstMove - Math.min(DAY_MS, activitySpan * 0.14));
}

function marketLinePath(points: Array<{ x: number; y: number }>) {
  if (!points.length) return "";
  return points.slice(1).reduce((path, point) => `${path} H ${point.x} V ${point.y}`, `M ${points[0].x} ${points[0].y}`);
}

function smoothChartLinePath(points: Array<{ x: number; y: number }>) {
  if (!points.length) return "";
  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index];
    const midpoint = previous.x + (point.x - previous.x) * .5;
    return `${path} C ${midpoint} ${previous.y}, ${midpoint} ${point.y}, ${point.x} ${point.y}`;
  }, `M ${points[0].x} ${points[0].y}`);
}

function MarketChart({
  history,
  moves,
  stats,
  generatedAt,
  entryLabel,
  entryPriceCents,
  onlineVisitors,
  totalVisitors,
  onClaim,
}: {
  history: MarketDay[];
  moves: MarketMove[];
  stats: LeaderboardPayload["stats"];
  generatedAt: string;
  entryLabel: string;
  entryPriceCents: number;
  onlineVisitors: number;
  totalVisitors: number;
  onClaim: () => void;
}) {
  const [view, setView] = useState<MarketView>("activity");
  const [range, setRange] = useState<MarketRange>("ALL");
  const [chartWidth, setChartWidth] = useState(900);
  const chartFrame = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = chartFrame.current;
    if (!element) return;
    const updateWidth = () => setChartWidth(Math.max(300, Math.round(element.getBoundingClientRect().width)));
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const compact = chartWidth < 580;
  const height = compact ? 310 : 338;
  const margin = { top: 27, right: compact ? 29 : 26, bottom: compact ? 51 : 41, left: compact ? 43 : 57 };
  const plotBottom = height - margin.bottom;
  const plotWidth = chartWidth - margin.left - margin.right;
  const plotHeight = plotBottom - margin.top;
  const now = new Date(generatedAt).getTime();
  const rangeStart = marketRangeStart(range, moves, generatedAt);
  const visibleMoves = moves.filter((move) => {
    const timestamp = new Date(move.happenedAt).getTime();
    return timestamp >= rangeStart && timestamp <= now;
  });
  const lastBeforeRange = [...moves].reverse().find((move) => new Date(move.happenedAt).getTime() < rangeStart);
  const startingValue = lastBeforeRange?.cumulativeCents
    ?? (visibleMoves[0] ? Math.max(0, visibleMoves[0].cumulativeCents - visibleMoves[0].amountCents) : stats.confirmedBidCents);
  const xForTime = (timestamp: number) => margin.left + ((timestamp - rangeStart) / Math.max(1, now - rangeStart)) * plotWidth;
  const rawMax = Math.max(stats.minimumBidCents, stats.confirmedBidCents, ...visibleMoves.map((move) => move.cumulativeCents));
  const stepValue = niceChartStep(rawMax / 3);
  const maxValue = Math.max(stepValue * 3, Math.ceil(rawMax / stepValue) * stepValue);
  const valueY = (value: number) => plotBottom - (value / Math.max(1, maxValue)) * plotHeight;
  const linePoints = [
    { x: margin.left, y: valueY(startingValue) },
    ...visibleMoves.map((move) => ({ x: xForTime(new Date(move.happenedAt).getTime()), y: valueY(move.cumulativeCents) })),
    { x: chartWidth - margin.right, y: valueY(stats.confirmedBidCents) },
  ];
  const linePath = marketLinePath(linePoints);
  const areaPath = `${linePath} L ${chartWidth - margin.right} ${plotBottom} L ${margin.left} ${plotBottom} Z`;
  const moveLabelWidth = 148;
  const moveLabelHeight = 48;
  const moveLabelLayouts = new Map<string, { x: number; y: number }>();
  if (!compact) {
    const labelGap = 8;
    const minLabelY = margin.top + 5;
    const maxLabelY = plotBottom - moveLabelHeight - 5;
    const labels = visibleMoves.slice(-4).map((move) => {
      const x = xForTime(new Date(move.happenedAt).getTime());
      const y = valueY(move.cumulativeCents);
      return {
        id: move.id,
        x: x > chartWidth - moveLabelWidth - 58 ? x - moveLabelWidth - 24 : x + 24,
        markerY: y,
        y: Math.max(minLabelY, Math.min(maxLabelY, y - moveLabelHeight / 2)),
      };
    }).sort((a, b) => a.markerY - b.markerY);

    let nextLabelY = minLabelY;
    labels.forEach((label) => {
      label.y = Math.max(label.y, nextLabelY);
      nextLabelY = label.y + moveLabelHeight + labelGap;
    });
    const overflow = labels.length ? Math.max(0, labels[labels.length - 1].y - maxLabelY) : 0;
    labels.forEach((label) => moveLabelLayouts.set(label.id, { x: label.x, y: label.y - overflow }));
  }
  const currentValue = stats.confirmedBidCents;
  const change24Hours = currentValue - stats.confirmedBidCents24HoursAgo;
  const percentageChange = stats.confirmedBidCents24HoursAgo > 0
    ? (change24Hours / stats.confirmedBidCents24HoursAgo) * 100
    : null;
  const rangeDayStart = utcDayStart(new Date(rangeStart).toISOString());
  const visibleDays = history.filter((day) => utcDayStart(`${day.date}T00:00:00Z`) >= rangeDayStart);
  const rangeVolume = visibleDays.reduce((total, day) => total + day.volumeCents, 0);
  const rangeBids = visibleDays.reduce((total, day) => total + day.bidCount, 0);
  const rangeChange = currentValue - startingValue;
  const axisTickCount = compact ? 4 : 6;
  const axisTicks = chartTimeTicks(rangeStart, now, axisTickCount);
  const activityMoves = visibleMoves.slice(-12);
  const activityPeakCents = Math.max(stats.minimumBidCents, ...activityMoves.map((move) => move.amountCents));
  const activityStepCents = niceChartStep(activityPeakCents / 3);
  const activityMaxCents = Math.max(activityStepCents * 3, Math.ceil(activityPeakCents / activityStepCents) * activityStepCents);
  const activityY = (value: number) => plotBottom - (value / Math.max(1, activityMaxCents)) * plotHeight;
  const activityPoints = activityMoves.map((move) => ({
    move,
    x: xForTime(new Date(move.happenedAt).getTime()),
    y: activityY(move.amountCents),
  }));
  const activityLinePoints = activityPoints.length
    ? [{ x: margin.left, y: plotBottom }, ...activityPoints.map(({ x, y }) => ({ x, y }))]
    : [];
  const activityLinePath = smoothChartLinePath(activityLinePoints);
  const activityAreaPath = activityLinePoints.length
    ? `${activityLinePath} L ${activityLinePoints.at(-1)!.x} ${plotBottom} L ${margin.left} ${plotBottom} Z`
    : "";
  const latestMove = activityMoves.at(-1);
  const paidVolume = visibleDays.reduce((total, day) => total + day.paidVolumeCents, 0);
  const creditVolume = visibleDays.reduce((total, day) => total + day.creditVolumeCents, 0);

  return (
    <article className="market-chart-card">
      <header className="market-chart-topbar">
        <div className="market-chart-identity">
          <span className="market-chart-logo"><img src="/icon.svg" alt="" /></span>
          <div><strong>OverMCP Market Pulse</strong><small>{view === "value" ? "Confirmed value over time" : "Every confirmed bid, as it lands"}</small></div>
          <span className="market-live-badge"><i /> LIVE</span>
          <a className="market-chart-audience" href={DATAFAST_SHARE_URL} target="_blank" rel="noopener noreferrer"><i /> {formatInteger(onlineVisitors)} online <span>·</span> {formatInteger(totalVisitors)} visitors <b>↗</b></a>
        </div>
        <div className="market-chart-controls">
          <div className="view-switch" role="group" aria-label="Chart type">
            <button className={view === "value" ? "active" : ""} onClick={() => setView("value")} aria-pressed={view === "value"}>Market Value</button>
            <button className={view === "activity" ? "active" : ""} onClick={() => setView("activity")} aria-pressed={view === "activity"}>Bid Activity</button>
          </div>
          <div className="market-range" role="group" aria-label="Chart date range">
            {(["7D", "30D", "ALL"] as MarketRange[]).map((option) => (
              <button key={option} className={range === option ? "active" : ""} onClick={() => setRange(option)} aria-pressed={range === option}>{option}</button>
            ))}
          </div>
          <button className="market-chart-claim" onClick={onClaim}><span>Claim {entryLabel}</span><strong>{formatDollars(entryPriceCents)}</strong><Icon name="arrow" size={15} /></button>
        </div>
      </header>

      {view === "value" ? (
        <div className="market-chart-summary">
          <div className="market-chart-quote">
            <span>Total confirmed value</span>
            <strong>{formatDollars(currentValue)}</strong>
            <small className={change24Hours > 0 ? "is-up" : change24Hours < 0 ? "is-down" : ""}>
              <Icon name="trend" size={14} />
              {change24Hours === 0
                ? "No change in the last 24 hours"
                : `${change24Hours > 0 ? "+" : "−"}${formatDollars(Math.abs(change24Hours))}${percentageChange === null ? "" : ` (${change24Hours > 0 ? "+" : "−"}${Math.abs(percentageChange).toFixed(1)}%)`} vs last 24 hours`}
            </small>
          </div>
          <div className="market-chart-stats">
            <div><span>Added ({range.toLowerCase()})</span><strong>+{formatDollars(rangeVolume)}</strong></div>
            <div><span>Value change</span><strong>+{formatDollars(Math.max(0, rangeChange))}</strong></div>
            <div><span>Confirmed moves</span><strong>{formatInteger(rangeBids)}</strong></div>
            <div><span>Clicks delivered</span><strong>{formatInteger(stats.totalClicks)}</strong></div>
          </div>
        </div>
      ) : (
        <div className="market-chart-summary market-activity-summary">
          <div className="market-chart-quote">
            <span>Latest confirmed move</span>
            <strong>{latestMove ? `+${formatDollars(latestMove.amountCents)}` : "$0"}</strong>
            <small><Icon name="trend" size={14} />{latestMove ? `${conciseProductName(latestMove.productName)} · ${latestMove.fundingSource === "stripe" ? "paid bid" : "founder credit"}` : "The first confirmed bid starts the chart"}</small>
          </div>
          <div className="market-chart-stats">
            <div><span>Paid ({range.toLowerCase()})</span><strong>{formatDollars(paidVolume)}</strong></div>
            <div><span>Founder credits</span><strong>{formatDollars(creditVolume)}</strong></div>
            <div><span>Confirmed moves</span><strong>{formatInteger(rangeBids)}</strong></div>
            <div><span>Entry starts at</span><strong>{formatDollars(stats.minimumBidCents)}</strong></div>
          </div>
        </div>
      )}

      <div className="market-chart-frame" ref={chartFrame}>
        {view === "value" ? (
          <svg
            className="market-chart-svg"
            viewBox={`0 0 ${chartWidth} ${height}`}
            role="img"
            aria-label={`Timeline of OverMCP confirmed placement value over ${range.toLowerCase()}`}
          >
          <title>OverMCP confirmed placement value — real bid history only</title>
          <defs>
            <linearGradient id="marketArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#45c98a" stopOpacity=".28" />
              <stop offset="100%" stopColor="#45c98a" stopOpacity=".015" />
            </linearGradient>
            <filter id="marketGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>
          {[0, 1, 2, 3].map((tick) => {
            const value = maxValue - (maxValue / 3) * tick;
            const y = valueY(value);
            return (
              <g className="market-chart-grid" key={tick}>
                <line x1={margin.left} x2={chartWidth - margin.right} y1={y} y2={y} />
                <text x={margin.left - 9} y={y + 3} textAnchor="end">{formatDollars(value)}</text>
              </g>
            );
          })}
          {axisTicks.map((timestamp) => {
            const x = xForTime(timestamp);
            return (
              <text className="market-date-label" x={x} y={height - 17} textAnchor={x < margin.left + 5 ? "start" : x > chartWidth - margin.right - 5 ? "end" : "middle"} key={timestamp}>{dayLabel(utcDayKey(timestamp), range === "ALL" && !compact)}</text>
            );
          })}
          <path className="market-area" d={areaPath} />
          <path className="market-value-line-glow" d={linePath} />
          <path className="market-value-line" d={linePath} />
          <line className="market-value-baseline" x1={margin.left} x2={chartWidth - margin.right} y1={plotBottom} y2={plotBottom} />

          {visibleMoves.map((move) => {
            const x = xForTime(new Date(move.happenedAt).getTime());
            const y = valueY(move.cumulativeCents);
            const labelLayout = moveLabelLayouts.get(move.id);
            const labelX = labelLayout?.x ?? x;
            const labelY = labelLayout?.y ?? y;
            const showLabel = Boolean(labelLayout);
            const conciseName = conciseProductName(move.productName);
            const shortName = conciseName.length > 20 ? `${conciseName.slice(0, 19)}…` : conciseName;
            return (
              <g className={`market-move-marker${showLabel ? " is-featured" : ""}`} key={move.id}>
                <line className="market-move-guide" x1={x} x2={x} y1={y + 20} y2={plotBottom} />
                {showLabel && <line className="market-move-label-connector" x1={x} y1={y} x2={labelX > x ? labelX : labelX + moveLabelWidth} y2={labelY + moveLabelHeight / 2} />}
                <circle className="market-move-halo" cx={x} cy={y} r={20} />
                <circle className="market-move-disc" cx={x} cy={y} r={16} />
                {move.hasIcon
                  ? <image className="market-move-icon" href={`/api/product-icon/${move.productId}`} x={x - 13} y={y - 13} width="26" height="26" />
                  : <text className="market-move-fallback" x={x} y={y + 4} textAnchor="middle">{move.productName.slice(0, 1).toUpperCase()}</text>}
                <g className="market-move-label" transform={`translate(${labelX} ${labelY})`}>
                  <rect width={moveLabelWidth} height={moveLabelHeight} rx="9" />
                  <text x="10" y="17" className="market-move-name">{shortName}</text>
                  <text x="10" y="34" className="market-move-meta">+{formatDollars(move.amountCents)} · {move.fundingSource === "credit" ? "founder credit" : "paid bid"}</text>
                </g>
              </g>
            );
          })}
          </svg>
        ) : (
          <svg
            className="market-chart-svg bid-activity-svg"
            viewBox={`0 0 ${chartWidth} ${height}`}
            role="img"
            aria-label={`Confirmed bid activity over ${range.toLowerCase()}`}
          >
            <title>OverMCP confirmed bid activity — real bids and disclosed credits only</title>
            <defs>
              <linearGradient id="bidActivityArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--activity-line)" stopOpacity=".3" />
                <stop offset="100%" stopColor="var(--activity-line)" stopOpacity=".012" />
              </linearGradient>
            </defs>
            {[0, 1, 2, 3].map((tick) => {
              const value = activityMaxCents - (activityMaxCents / 3) * tick;
              const y = activityY(value);
              return (
                <g className="market-chart-grid" key={tick}>
                  <line x1={margin.left} x2={chartWidth - margin.right} y1={y} y2={y} />
                  <text x={margin.left - 9} y={y + 3} textAnchor="end">{formatDollars(value)}</text>
                </g>
              );
            })}
            {axisTicks.map((timestamp) => {
              const x = xForTime(timestamp);
              return (
                <text className="market-date-label" x={x} y={height - 17} textAnchor={x < margin.left + 5 ? "start" : x > chartWidth - margin.right - 5 ? "end" : "middle"} key={timestamp}>{dayLabel(utcDayKey(timestamp), range === "ALL" && !compact)}</text>
              );
            })}
            {activityPoints.filter(({ move }) => move.fundingSource === "stripe").map(({ move, x, y }) => (
              <rect className="bid-activity-payment" x={x - (compact ? 5 : 8)} y={y} width={compact ? 10 : 16} height={Math.max(0, plotBottom - y)} rx={compact ? 5 : 8} key={`payment-${move.id}`} />
            ))}
            {activityAreaPath && <path className="bid-activity-area" d={activityAreaPath} />}
            {activityLinePath && <path className="bid-activity-line-glow" d={activityLinePath} />}
            {activityLinePath && <path className="bid-activity-line" d={activityLinePath} />}
            {activityLinePath && <path className="bid-activity-flow" d={activityLinePath} />}
            {activityLinePath && (
              <g className="bid-activity-runner" aria-hidden="true" key={`runner-${activityLinePath}`}>
                <circle className="bid-activity-runner-halo" r={compact ? 7 : 9} />
                <circle className="bid-activity-runner-core" r={compact ? 2.4 : 3} />
                <animateMotion dur={compact ? "3.2s" : "3.8s"} begin="1s" repeatCount="indefinite" path={activityLinePath} />
              </g>
            )}
            {activityPoints.map(({ move, x, y }, eventIndex) => {
              const productLabel = conciseProductName(move.productName);
              const visibleProductLabel = productLabel.length > (compact ? 14 : 20) ? `${productLabel.slice(0, compact ? 13 : 19).trim()}…` : productLabel;
              const labelWidth = Math.min(compact ? 96 : 126, Math.max(compact ? 58 : 66, visibleProductLabel.length * (compact ? 5.5 : 6.1) + 18));
              const labelHeight = compact ? 19 : 21;
              const labelCenterX = Math.max(margin.left + labelWidth / 2, Math.min(chartWidth - margin.right - labelWidth / 2, x));
              const labelCenterY = Math.max(margin.top + labelHeight / 2, y - (compact ? 30 : 38));
              const label = `${productLabel} · +${formatDollars(move.amountCents)} · ${move.fundingSource === "stripe" ? "paid bid" : "founder credit"}`;
              return (
                <g className={`bid-activity-event is-${move.fundingSource}`} transform={`translate(${x} ${y})`} style={{ "--activity-event-delay": `${.5 + eventIndex * .13}s` } as React.CSSProperties} key={move.id}>
                  <title>{label}</title>
                  <g className="bid-activity-marker">
                    <circle className="bid-activity-halo" r={compact ? 15 : 20} />
                    <circle className="bid-activity-disc" r={compact ? 12 : 16} />
                    {move.hasIcon
                      ? <image className="bid-activity-icon" href={`/api/product-icon/${move.productId}`} x={compact ? -10 : -13} y={compact ? -10 : -13} width={compact ? 20 : 26} height={compact ? 20 : 26} />
                      : <text className="bid-activity-fallback" y="4" textAnchor="middle">{move.productName.slice(0, 1).toUpperCase()}</text>}
                  </g>
                  <g className="bid-activity-label" transform={`translate(${labelCenterX - x} ${labelCenterY - y})`}>
                    <rect x={-labelWidth / 2} y={-labelHeight / 2} width={labelWidth} height={labelHeight} rx={labelHeight / 2} />
                    <text y={compact ? 3 : 3.5} textAnchor="middle">{visibleProductLabel}</text>
                  </g>
                </g>
              );
            })}
          </svg>
        )}
        {view === "value" && !moves.length && <div className="market-chart-empty"><strong>The market opens with the first confirmed bid.</strong><span>No movement is simulated.</span></div>}
        {view === "activity" && !activityMoves.length && <div className="market-chart-empty"><strong>Bid activity begins with the first confirmed move.</strong><span>No activity is simulated.</span></div>}
      </div>

      <footer className={`market-chart-footnote${view === "activity" ? " is-activity" : ""}`}><strong>How to read it</strong>{view === "value" ? <><span>The line rises only when confirmed value is added.</span><span>Product logos identify who made each move.</span></> : <><span>The violet line tracks each confirmed bid size.</span><span>Lime bars mark paid Stripe bids.</span></>}<small>Stripe payments + disclosed founder credits · no simulated data</small></footer>
    </article>
  );
}

function getVisitorId() {
  const storageKey = "overmcp-visitor-id";
  const current = window.localStorage.getItem(storageKey);
  if (current) return current;
  const created = window.crypto.randomUUID();
  window.localStorage.setItem(storageKey, created);
  return created;
}

export function OverMcpApp({ initialData }: { initialData: LeaderboardPayload }) {
  const initialTargetRank = ([1, 2, 3, 10] as const)
    .find((rank) => initialData.positionPrices[String(rank) as "1" | "2" | "3" | "10"] <= initialData.stats.minimumBidCents) ?? 10;
  const [data, setData] = useState(initialData);
  const [theme, setTheme] = useState<Theme>("dark");
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sortMode, setSortMode] = useState<SortMode>("Rank");
  const [targetRank, setTargetRank] = useState<BidTargetRank>(initialTargetRank);
  const [bidAmount, setBidAmount] = useState(Math.ceil(initialData.positionPrices[String(initialTargetRank) as "1" | "2" | "3" | "10"] / 100));
  const [modalOpen, setModalOpen] = useState(false);
  const [identity, setIdentity] = useState("");
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [productCategory, setProductCategory] = useState<(typeof PRODUCT_CATEGORIES)[number]>("AI");
  const [email, setEmail] = useState("");
  const [iconDataUrl, setIconDataUrl] = useState<string | null>(null);
  const [iconSignature, setIconSignature] = useState<string | null>(null);
  const [autofillStatus, setAutofillStatus] = useState<AutofillStatus>("idle");
  const [autofillMessage, setAutofillMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [opened, setOpened] = useState<string | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const [publicStats, setPublicStats] = useState({
    onlineVisitors: initialData.stats.onlineVisitors,
    totalVisitors: initialData.stats.totalVisitors,
  });
  const identityInput = useRef<HTMLInputElement>(null);
  const autofillRequest = useRef(0);
  const lastAutofilledIdentity = useRef("");
  const checkoutRequestId = useRef<string | null>(null);
  const trackedCheckoutRequestId = useRef<string | null>(null);
  const submittingRef = useRef(false);

  const products = data.products;
  const bidStepDollars = BID_INCREMENT_CENTS / 100;
  const thresholdDollars = Math.ceil(data.positionPrices[String(targetRank) as "1" | "2" | "3" | "10"] / 100);
  const categoryOptions = useMemo(() => [{ name: "All", count: data.stats.products }, ...data.categories], [data]);
  const marketEntryRank = ([1, 2, 3, 10] as const)
    .find((rank) => data.positionPrices[String(rank) as "1" | "2" | "3" | "10"] <= data.stats.minimumBidCents) ?? 10;
  const marketEntryPriceCents = data.positionPrices[String(marketEntryRank) as "1" | "2" | "3" | "10"];
  const marketEntryLabel = targetPositionLabel(marketEntryRank, data.stats.products);
  const selectedPositionLabel = targetPositionLabel(targetRank, data.stats.products);
  const targetRankOptions = ([1, 2, 3, 10] as const).filter((rank) => (
    rank === 10 ? data.stats.products >= 3 : rank <= data.stats.products + 1
  ));
  const latestMarketMoves = useMemo(
    () => [...data.marketMoves]
      .sort((a, b) => new Date(b.happenedAt).getTime() - new Date(a.happenedAt).getTime())
      .slice(0, 3),
    [data.marketMoves],
  );
  const topMovers = useMemo(() => {
    const cutoff = new Date(data.generatedAt).getTime() - DAY_MS;
    const changeByProduct = new Map<string, number>();
    for (const move of data.marketMoves) {
      if (new Date(move.happenedAt).getTime() < cutoff) continue;
      changeByProduct.set(move.productId, (changeByProduct.get(move.productId) ?? 0) + move.amountCents);
    }

    return products
      .map((product) => ({ product, changeCents: changeByProduct.get(product.id) ?? 0 }))
      .sort((a, b) => b.changeCents - a.changeCents || a.product.rank - b.product.rank)
      .slice(0, 3);
  }, [data.generatedAt, data.marketMoves, products]);

  useEffect(() => {
    const activeTheme = document.documentElement.dataset.theme;
    if (activeTheme === "light" || activeTheme === "dark") setTheme(activeTheme);

    try {
      const storedSaved = JSON.parse(window.localStorage.getItem("overmcp-saved") ?? "[]");
      if (Array.isArray(storedSaved)) setSaved(storedSaved.filter((item) => typeof item === "string"));
    } catch {
      // Ignore malformed local preferences.
    }

    const checkout = new URLSearchParams(window.location.search).get("checkout");
    if (checkout === "success") {
      setToast("Payment received. Your position updates after Stripe confirms it.");
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (checkout === "cancelled") {
      setToast("Checkout cancelled. Nothing was charged.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!data.configured) return;
    let cancelled = false;

    const refresh = async () => {
      try {
        const response = await fetch("/api/leaderboard", { cache: "no-store" });
        if (response.ok && !cancelled) setData(await response.json());
      } catch {
        // Preserve the most recent confirmed state during a transient outage.
      }
    };

    const visitorId = getVisitorId();
    const ping = () => fetch("/api/presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId }),
      keepalive: true,
    }).catch(() => undefined);

    void ping();
    const refreshTimer = window.setInterval(refresh, 15_000);
    const presenceTimer = window.setInterval(ping, 45_000);
    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
      window.clearInterval(presenceTimer);
    };
  }, [data.configured]);

  useEffect(() => {
    let cancelled = false;

    const refreshPublicStats = async () => {
      try {
        const response = await fetch("/api/datafast-stats", { cache: "no-store" });
        if (!response.ok) return;
        const nextStats = await response.json();
        if (
          !cancelled
          && Number.isInteger(nextStats.onlineVisitors)
          && Number.isInteger(nextStats.totalVisitors)
        ) {
          setPublicStats(nextStats);
        }
      } catch {
        // Keep the production database counters as a reliable fallback.
      }
    };

    void refreshPublicStats();
    const timer = window.setInterval(refreshPublicStats, 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModalOpen(false);
    };
    document.body.classList.add("modal-visible");
    window.addEventListener("keydown", handleKey);
    window.setTimeout(() => identityInput.current?.focus(), 80);
    return () => {
      document.body.classList.remove("modal-visible");
      window.removeEventListener("keydown", handleKey);
    };
  }, [modalOpen]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const visibleProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const inCategory = category === "All" || product.category === category;
      const matches = !normalized || `${product.name} ${product.description} ${product.category}`.toLowerCase().includes(normalized);
      return inCategory && matches;
    });

    return [...filtered].sort((a, b) => {
      if (sortMode === "Clicks") return b.weeklyClicks - a.weeklyClicks;
      if (sortMode === "Newest") return new Date(b.latestBidAt).getTime() - new Date(a.latestBidAt).getTime();
      return a.rank - b.rank;
    });
  }, [category, products, query, sortMode]);

  function chooseRank(rank: BidTargetRank) {
    checkoutRequestId.current = null;
    setTargetRank(rank);
    setBidAmount(Math.ceil(data.positionPrices[String(rank) as "1" | "2" | "3" | "10"] / 100));
  }

  function changeBidAmount(nextAmount: number) {
    const normalizedAmount = Math.max(Math.ceil(data.stats.minimumBidCents / 100), nextAmount);
    const amountCents = normalizedAmount * 100;
    checkoutRequestId.current = null;
    setBidAmount(normalizedAmount);

    if (amountCents >= data.positionPrices["1"]) setTargetRank(1);
    else if (amountCents >= data.positionPrices["2"]) setTargetRank(2);
    else if (amountCents >= data.positionPrices["3"]) setTargetRank(3);
    else setTargetRank(10);
  }

  function openBidModal() {
    setFormError("");
    setModalOpen(true);
    if (identity.trim()) void autofillWebsite(identity);
  }

  function openMarketClaim() {
    chooseRank(marketEntryRank);
    openBidModal();
  }

  function changeIdentity(value: string) {
    checkoutRequestId.current = null;
    setIdentity(value);
    if (value.trim() !== lastAutofilledIdentity.current) {
      autofillRequest.current += 1;
      setIconDataUrl(null);
      setIconSignature(null);
      setAutofillStatus("idle");
      setAutofillMessage("");
    }
  }

  async function autofillWebsite(value: string, force = false) {
    const requestedIdentity = value.trim();
    if (requestedIdentity.length < 2 || (!force && requestedIdentity === lastAutofilledIdentity.current)) return;

    const requestId = autofillRequest.current + 1;
    autofillRequest.current = requestId;
    setAutofillStatus("loading");
    setAutofillMessage("Reading the website’s public details…");

    try {
      const response = await fetch("/api/website-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity: requestedIdentity }),
      });
      const result = await response.json() as WebsiteMetadataResult;
      if (!response.ok) throw new Error(result.error ?? "Website details could not be loaded.");
      if (requestId !== autofillRequest.current || identity.trim() !== requestedIdentity) return;

      setProductName(result.name);
      setDescription(result.description);
      setIconDataUrl(result.iconDataUrl);
      setIconSignature(result.iconSignature);
      setAutofillStatus("success");
      setAutofillMessage(result.description
        ? "Name, description, and available icon filled from the website."
        : "Name and available icon filled. Add a short description before checkout.");
      lastAutofilledIdentity.current = requestedIdentity;
    } catch (error) {
      if (requestId !== autofillRequest.current) return;
      setIconDataUrl(null);
      setIconSignature(null);
      setAutofillStatus("error");
      setAutofillMessage(`${error instanceof Error ? error.message : "Website details could not be loaded."} You can enter them manually.`);
    }
  }

  function closeModal(event?: ReactMouseEvent<HTMLElement>) {
    if (event && event.target !== event.currentTarget) return;
    setModalOpen(false);
  }

  async function submitPlacement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;
    if (bidAmount < thresholdDollars) {
      setFormError(`The current ${selectedPositionLabel} threshold is $${formatInteger(thresholdDollars)}.`);
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setFormError("");
    const requestId = checkoutRequestId.current ?? window.crypto.randomUUID();
    checkoutRequestId.current = requestId;
    const isNewCheckoutAttempt = trackedCheckoutRequestId.current !== requestId;

    if (isNewCheckoutAttempt) {
      trackedCheckoutRequestId.current = requestId;
      trackDataFastGoal("initiate_checkout", {
        email,
        product_name: productName,
        product_website: identity.trim().slice(0, 255),
        category: productCategory,
        amount_usd: String(bidAmount),
        target_rank: String(targetRank),
        request_id: requestId,
      });
    }

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          identity,
          name: productName,
          description,
          category: productCategory,
          email,
          targetRank,
          amountCents: bidAmount * 100,
          ...(iconDataUrl && iconSignature ? { iconDataUrl, iconSignature } : {}),
        }),
      });
      const result = await response.json();
      if (typeof result.requiredAmountCents === "number") {
        setBidAmount(Math.ceil(result.requiredAmountCents / 100));
        checkoutRequestId.current = null;
      }
      if (!response.ok || !result.checkoutUrl) throw new Error(result.error ?? "Checkout could not be started.");
      if (isNewCheckoutAttempt) await new Promise((resolve) => window.setTimeout(resolve, 200));
      window.location.assign(result.checkoutUrl);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Checkout could not be started.");
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  function openProduct(product: LeaderboardProduct) {
    window.open(`/go/${product.id}`, "_blank", "noopener,noreferrer");
    setOpened(product.id);
    setToast(`Opening ${product.name}`);
    window.setTimeout(() => setOpened(null), 1800);
  }

  function toggleSaved(product: LeaderboardProduct) {
    setSaved((current) => {
      const next = current.includes(product.id) ? current.filter((id) => id !== product.id) : [...current, product.id];
      window.localStorage.setItem("overmcp-saved", JSON.stringify(next));
      setToast(current.includes(product.id) ? `${product.name} removed` : `${product.name} saved`);
      return next;
    });
  }

  function toggleTheme() {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      document.documentElement.style.colorScheme = next;
      try {
        window.localStorage.setItem("overmcp-theme", next);
      } catch {
        // The active theme still works when browser storage is unavailable.
      }
      return next;
    });
  }

  return (
    <div className="site-shell" id="top">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      {(!data.configured || !data.available || !data.paymentsConfigured) && (
        <div className="setup-banner" role="status">
          {!data.configured
            ? "Database setup is incomplete."
            : !data.available
              ? "The live leaderboard is temporarily unavailable."
              : "Browsing is live; bidding is temporarily unavailable."}
        </div>
      )}

      <header className="site-header">
        <div className="container header-inner">
          <Logo />
          <nav className="desktop-nav" aria-label="Main navigation">
            <a href="#leaderboard">Leaderboard</a>
            <a href="#how-it-works">How it works</a>
            <a href="#builders">For products</a>
          </nav>
          <div className="header-actions">
            <button className="icon-button theme-button" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} aria-pressed={theme === "light"} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
              <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
            </button>
            <button className="button button-small button-primary header-cta" onClick={openBidModal}>List your product <Icon name="arrow" size={15} /></button>
            <button className="icon-button menu-button" onClick={() => setMenuOpen((value) => !value)} aria-label="Toggle navigation" aria-expanded={menuOpen}>
              <Icon name={menuOpen ? "close" : "menu"} size={20} />
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="mobile-nav" aria-label="Mobile navigation">
            <a href="#leaderboard" onClick={() => setMenuOpen(false)}>Leaderboard <Icon name="chevron" size={16} /></a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works <Icon name="chevron" size={16} /></a>
            <a href="#builders" onClick={() => setMenuOpen(false)}>For products <Icon name="chevron" size={16} /></a>
            <button onClick={() => { setMenuOpen(false); openBidModal(); }}>List your product <Icon name="arrow" size={16} /></button>
          </nav>
        )}
      </header>

      <main>
        <section className="leaderboard-section container" id="leaderboard" aria-label="Live product leaderboard">
          {data.available ? (
            <MarketChart
              history={data.marketHistory}
              moves={data.marketMoves}
              stats={data.stats}
              generatedAt={data.generatedAt}
              entryLabel={marketEntryLabel}
              entryPriceCents={marketEntryPriceCents}
              onlineVisitors={publicStats.onlineVisitors}
              totalVisitors={publicStats.totalVisitors}
              onClaim={openMarketClaim}
            />
          ) : (
            <div className="market-unavailable"><Icon name="spark" size={25} /><strong>Market chart temporarily unavailable</strong><span>We couldn’t reach the live database. Please refresh shortly.</span></div>
          )}

          <div className="market-bid-dock" id="builders">
            <div className="market-bid-copy"><span>Get on the board</span><strong>{claimPositionLabel(targetRank, data.stats.products)}</strong><small>Pay once. Stay listed until another product moves ahead.</small></div>
            <div className="market-bid-target">
              <span>Target position</span>
              <div className="position-tabs" role="group" aria-label="Target leaderboard position">
                {targetRankOptions.map((rank) => <button type="button" className={targetRank === rank ? "active" : ""} key={rank} onClick={() => chooseRank(rank)}>{targetPositionLabel(rank, data.stats.products)}</button>)}
              </div>
              <div className="market-bid-stepper">
                <button type="button" aria-label={`Decrease bid by ${formatDollars(BID_INCREMENT_CENTS)}`} onClick={() => changeBidAmount(bidAmount - bidStepDollars)}>−</button>
                <label><span>$</span><input aria-label="Bid amount in dollars" inputMode="numeric" style={{ width: `${Math.max(1, String(bidAmount).length)}ch` }} value={bidAmount} onChange={(event) => changeBidAmount(Number(event.target.value.replace(/\D/g, "")) || Math.ceil(data.stats.minimumBidCents / 100))} /></label>
                <button type="button" aria-label={`Increase bid by ${formatDollars(BID_INCREMENT_CENTS)}`} onClick={() => changeBidAmount(bidAmount + bidStepDollars)}>+</button>
              </div>
            </div>
            <form className="market-bid-form" onSubmit={(event) => { event.preventDefault(); openBidModal(); }}>
              <label><Icon name="globe" size={18} /><input value={identity} onChange={(event) => changeIdentity(event.target.value)} onBlur={() => void autofillWebsite(identity)} placeholder="Your product URL or @handle" aria-label="Product URL or handle" /></label>
              <button type="submit" disabled={bidAmount < thresholdDollars}>{bidAmount >= thresholdDollars ? "Claim this spot" : `Add $${formatInteger(thresholdDollars - bidAmount)}`} <Icon name="arrow" size={16} /></button>
              <small><span><Icon name="check" size={12} /> One-time payment</span><span><Icon name="shield" size={12} /> Stripe checkout</span><span>Website details autofill</span></small>
            </form>
          </div>

          <div className="rankings-header">
            <div><span className="rankings-number">#{formatInteger(data.stats.products)}</span><span><strong>Live leaderboard</strong><small>Products ranked by total confirmed bid</small></span></div>
            <button onClick={openMarketClaim}>Enter the board from {formatDollars(data.stats.minimumBidCents)} <Icon name="arrow" size={15} /></button>
          </div>

          <div className="leaderboard-toolbar">
            <label className="search-control"><Icon name="search" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, websites, categories…" aria-label="Search products" />{query && <button onClick={() => setQuery("")} aria-label="Clear search"><Icon name="close" size={15} /></button>}</label>
            <div className="sort-control" aria-label="Sort leaderboard">{(["Rank", "Clicks", "Newest"] as SortMode[]).map((mode) => <button key={mode} className={sortMode === mode ? "active" : ""} onClick={() => setSortMode(mode)}>{mode}</button>)}</div>
          </div>

          <div className="category-scroll" role="group" aria-label="Filter by category">
            {categoryOptions.map((item) => <button key={item.name} className={category === item.name ? "active" : ""} onClick={() => setCategory(item.name)}>{item.name}<span>{item.count}</span></button>)}
          </div>

          <div className="leaderboard-layout">
            <div className="product-list">
              <div className="list-head" aria-hidden="true"><span>Rank / Product</span><span>Performance</span><span>Placement</span><span>Visit</span></div>
              {visibleProducts.length ? visibleProducts.map((product) => {
                const palette = paletteFor(product.id);
                const isNew = new Date(data.generatedAt).getTime() - new Date(product.latestBidAt).getTime() < 24 * 60 * 60 * 1000;
                return (
                  <article className={`product-row ${product.rank === 1 ? "is-featured" : ""}`} key={product.id}>
                    {product.rank === 1 && <div className="featured-ribbon"><Icon name="spark" size={12} /> Leading the board</div>}
                    <div className="product-identity">
                      <div className="rank-number"><small>#</small>{product.rank}</div>
                      <ProductMark id={product.id} name={product.name} hasIcon={product.hasIcon} className="product-logo" style={{ "--logo-accent": palette[0], "--logo-soft": palette[1] } as React.CSSProperties} />
                      <div className="product-copy">
                        <div className="product-name-line"><h3>{product.name}</h3>{isNew && <span className="new-tag">NEW BID</span>}</div>
                        <p>{product.description}</p>
                        <div className="tag-row"><span>{product.category}</span>{product.creditCents > 0 && <span>FOUNDER CREDIT</span>}</div>
                      </div>
                    </div>
                    <div className="signal-grid">
                      <div><strong>{formatCompact(product.weeklyClicks)}</strong><span>weekly clicks</span></div>
                      <div><strong>{formatCompact(product.totalClicks)}</strong><span>all clicks</span></div>
                      <div><strong>{relativeTime(product.latestBidAt, data.generatedAt)}</strong><span>latest bid</span></div>
                    </div>
                    <div className="placement-cell"><span>TOTAL BID</span><strong>{formatDollars(product.bidCents)}</strong><small>{formatInteger(product.totalClicks)} visits</small></div>
                    <div className="row-actions">
                      <button className={`save-button ${saved.includes(product.id) ? "saved" : ""}`} onClick={() => toggleSaved(product)} aria-label={`${saved.includes(product.id) ? "Remove" : "Save"} ${product.name}`}><Icon name="bookmark" size={17} /></button>
                      <button className="copy-button" onClick={() => openProduct(product)}><Icon name={opened === product.id ? "check" : "external"} size={15} /><span>{opened === product.id ? "Opened" : "Visit"}</span></button>
                    </div>
                  </article>
                );
              }) : (
                <div className="empty-state">
                  <div><Icon name={products.length ? "search" : "spark"} size={25} /></div>
                  <h3>{!data.available ? "Leaderboard temporarily unavailable" : products.length ? "No products found" : "The first spot is open"}</h3>
                  <p>{!data.available ? "We couldn’t reach the live database. Please refresh shortly." : products.length ? "Try another search or clear your category filter." : `Be the first product on OverMCP. New listings start at ${formatDollars(data.stats.minimumBidCents)}.`}</p>
                  {data.available && (products.length ? <button onClick={() => { setQuery(""); setCategory("All"); }}>Reset filters</button> : <button onClick={openBidModal}>Claim #1</button>)}
                </div>
              )}
              {data.stats.products > products.length && <div className="load-more">Showing the top {products.length} of {formatInteger(data.stats.products)} products</div>}
            </div>
          </div>

          <section className="market-intelligence" aria-label="Live market intelligence">
            <article className="market-intel-card market-intel-movers">
              <header><div><h2>Who moved the market</h2><p>Every move is confirmed and attributable.</p></div><span className="market-intel-proof"><Icon name="shield" size={13} /> REAL DATA</span></header>
              {latestMarketMoves.length ? <div className="market-intel-list">{latestMarketMoves.map((move) => (
                <div className="market-intel-move" key={move.id}>
                  <ProductMark id={move.productId} name={move.productName} hasIcon={move.hasIcon} className="market-intel-logo" />
                  <span><strong>{move.productName}</strong><small>{move.fundingSource === "credit" ? "Founder credit" : "Stripe payment"} · <time dateTime={move.happenedAt}>{relativeTime(move.happenedAt, data.generatedAt)}</time></small></span>
                  <b>+{formatDollars(move.amountCents)}</b>
                </div>
              ))}</div> : <div className="market-intel-empty"><strong>No confirmed moves yet</strong><span>The first completed bid will appear here.</span></div>}
            </article>

            <article className="market-intel-card market-intel-activity">
              <header><div><h2>Market activity</h2><p>Latest confirmed events.</p></div><span className="market-intel-live"><i /> LIVE FEED</span></header>
              {data.activity.length ? <div className="market-activity-list">{data.activity.slice(0, 3).map((item) => (
                <div className="market-activity-row" key={item.id}>
                  <ProductMark id={item.productId} name={item.productName} hasIcon={item.hasIcon} className="market-activity-logo" />
                  <span><strong>{item.productName} moved the market</strong><small><time dateTime={item.happenedAt}>{relativeTime(item.happenedAt, data.generatedAt)}</time> · {item.fundingSource === "credit" ? "founder credit" : "paid bid"}</small></span>
                  <b>+{formatDollars(item.amountCents)}</b>
                </div>
              ))}</div> : <div className="market-intel-empty"><strong>No activity yet</strong><span>Confirmed bids will stream here.</span></div>}
            </article>

            <article className="market-intel-card market-intel-top">
              <header><div><h2>Top movers</h2><p>Current leaders and 24-hour movement.</p></div><span className="market-intel-period">24H</span></header>
              {topMovers.length ? <div className="top-movers-list">{topMovers.map(({ product, changeCents }, index) => (
                <div className="top-mover-row" key={product.id}>
                  <span className="top-mover-rank">{index + 1}</span>
                  <ProductMark id={product.id} name={product.name} hasIcon={product.hasIcon} className="top-mover-logo" />
                  <strong>{product.name}</strong>
                  <span className="top-mover-value">{formatDollars(product.bidCents)}</span>
                  <b className={changeCents > 0 ? "is-up" : ""}>{changeCents > 0 ? `+${formatDollars(changeCents)}` : "—"}</b>
                </div>
              ))}</div> : <div className="market-intel-empty"><strong>No movers yet</strong><span>The first listed product will appear here.</span></div>}
              <button className="market-intel-cta" onClick={openMarketClaim}>Claim a spot <Icon name="arrow" size={14} /></button>
            </article>
          </section>
        </section>

        <section className="market-rules container" id="how-it-works" aria-labelledby="how-title">
          <header><div><span>How OverMCP works</span><h2 id="how-title">A public market for product attention.</h2></div><p>Pay once for a position. The board moves only when a confirmed bid changes the order.</p></header>
          <div className="market-rules-grid">
            <article><span>01</span><div><strong>Add your product</strong><p>Paste a URL. OverMCP fills the public name, description, and icon for you.</p></div></article>
            <article><span>02</span><div><strong>Choose a position</strong><p>Bid from {formatDollars(data.stats.minimumBidCents)} and see the exact threshold before Stripe checkout.</p></div></article>
            <article><span>03</span><div><strong>Measure the visits</strong><p>Your rank, confirmed value, and real outbound clicks stay visible on the board.</p></div></article>
          </div>
          <footer><div><span>Paid bids</span><strong>{formatDollars(data.stats.paidBidCents)}</strong></div><div><span>Founder credits</span><strong>{formatDollars(data.stats.creditBidCents)}</strong></div><div><span>Products</span><strong>{formatInteger(data.stats.products)}</strong></div><div><span>Tracked clicks</span><strong>{formatInteger(data.stats.totalClicks)}</strong></div><a href="/rules">Read the ranking rules <Icon name="arrow" size={14} /></a></footer>
        </section>

        <section className="product-hunt-section" aria-labelledby="product-hunt-title">
          <div className="container product-hunt-inner">
            <div className="product-hunt-copy">
              <span>NOW ON PRODUCT HUNT</span>
              <h2 id="product-hunt-title">Support the launch.</h2>
              <p>OverMCP is live. Visit the Product Hunt page, join the conversation, and help more builders discover the leaderboard.</p>
            </div>
            <div className="product-hunt-card">
              <div className="product-hunt-card-head">
                <img alt="OverMCP" src="/producthunt-overmcp.png" width="64" height="64" />
                <div>
                  <h3>OverMCP</h3>
                  <p>The market for builders.</p>
                </div>
              </div>
              <a href="https://www.producthunt.com/products/overmcp?embed=true&amp;utm_source=embed&amp;utm_medium=post_embed" target="_blank" rel="noopener noreferrer">Check it out on Product Hunt <span aria-hidden="true">→</span></a>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-top">
          <div><Logo /><p>The internet’s live leaderboard for products worth discovering.</p></div>
          <div className="footer-links"><span>Discover</span><a href="#leaderboard">Leaderboard</a><a href="#leaderboard">Categories</a><a href="#how-it-works">How it works</a></div>
          <div className="footer-links"><span>For products</span><a href="#builders">List a product</a><a href="/rules">Ranking rules</a><a href="/privacy">Privacy</a></div>
          <div className="footer-newsletter"><span>REAL DATA, ALWAYS</span><p>Listings, bids, visitors, and clicks come directly from the production database.</p><a className="footer-action" href="#leaderboard">Explore the live board <Icon name="arrow" size={15} /></a></div>
        </div>
        <div className="container footer-bottom"><span>© 2026 OverMCP</span><div><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/rules">Rules</a></div><span className="footer-status"><i /> Live leaderboard</span></div>
      </footer>

      {modalOpen && (
        <div className="modal-backdrop" onMouseDown={closeModal}>
          <section className="bid-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <button className="modal-close" onClick={() => setModalOpen(false)} aria-label="Close dialog"><Icon name="close" size={19} /></button>
            <div className="modal-kicker"><span>{selectedPositionLabel.toUpperCase()}</span> Placement checkout</div>
            <h2 id="modal-title">Put your product where<br />people look first.</h2>
            <p className="modal-description">Your position is based on your product’s confirmed bid total, including any promotional credit. For an existing listing, checkout charges only the difference needed to reach this total.</p>
            <div className="modal-summary"><div><span>Target position</span><strong>{selectedPositionLabel}</strong></div><div><span>Target total bid</span><strong>${formatInteger(bidAmount)}</strong></div><div><span>Current threshold</span><strong>${formatInteger(thresholdDollars)}</strong></div></div>
            <form onSubmit={submitPlacement} noValidate>
              <label><span>Product URL or @handle</span><input ref={identityInput} value={identity} onChange={(event) => changeIdentity(event.target.value)} onBlur={() => void autofillWebsite(identity)} placeholder="https://yourproduct.com" required /></label>
              <div className={`autofill-feedback ${autofillStatus}`} aria-live="polite">
                <span className="autofill-icon">{iconDataUrl ? <img src={iconDataUrl} alt="" /> : <Icon name={autofillStatus === "success" ? "check" : "spark"} size={15} />}</span>
                <span>{autofillMessage || "Enter a website and we’ll fill its public name, description, and icon."}</span>
                <button type="button" onClick={() => void autofillWebsite(identity, true)} disabled={autofillStatus === "loading"}>{autofillStatus === "loading" ? "Reading…" : "Autofill"}</button>
              </div>
              <label><span>Product name</span><input value={productName} onChange={(event) => { checkoutRequestId.current = null; setProductName(event.target.value); }} placeholder="Your product" minLength={2} maxLength={100} required /></label>
              <label><span>Short description</span><textarea value={description} onChange={(event) => { checkoutRequestId.current = null; setDescription(event.target.value); }} placeholder="What does your product help people do?" minLength={10} maxLength={280} required /></label>
              <label><span>Category</span><select value={productCategory} onChange={(event) => { checkoutRequestId.current = null; setProductCategory(event.target.value as (typeof PRODUCT_CATEGORIES)[number]); }}>{PRODUCT_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><span>Receipt email</span><input value={email} onChange={(event) => { checkoutRequestId.current = null; setEmail(event.target.value); }} type="email" placeholder="you@company.com" required /></label>
              {formError && <p className="form-error" role="alert">{formError}</p>}
              <button className="button button-primary" type="submit" disabled={submitting || !data.available || !data.paymentsConfigured}>{submitting ? "Opening secure checkout…" : data.paymentsConfigured ? "Continue to Stripe" : "Bidding temporarily unavailable"}<Icon name="arrow" /></button>
            </form>
            <div className="modal-footnote"><Icon name="lock" size={13} /> Secure payment powered by Stripe</div>
          </section>
        </div>
      )}

      {toast && <div className="toast" role="status"><Icon name="check" size={15} /> {toast}</div>}
    </div>
  );
}
