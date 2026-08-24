"use client";

import {
  FormEvent,
  MouseEvent as ReactMouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties, ReactNode } from "react";
import { Logo } from "@/components/brand-logo";
import { BID_INCREMENT_CENTS, PRODUCT_CATEGORIES } from "@/lib/constants";
import type { CrowdRaceEvent, LeaderboardPayload, LeaderboardProduct } from "@/lib/types";

type BoardView = "today" | "all-time";
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

type SupportResult = {
  ok?: boolean;
  alreadySupported?: boolean;
  selectedProductId?: string;
  currentRaceDay?: string;
  data?: LeaderboardPayload;
  error?: string;
};

const DATAFAST_SHARE_URL = "https://datafa.st/share/6a8891cc9f3926b34adc34d6?realtime=1";

type IconName =
  | "arrow"
  | "check"
  | "clock"
  | "close"
  | "external"
  | "globe"
  | "moon"
  | "share"
  | "shield"
  | "sun"
  | "trophy";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    close: <><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>,
    external: <><path d="M14 4h6v6" /><path d="m10 14 10-10" /><path d="M20 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
    moon: <path d="M20.2 15.2A8.5 8.5 0 0 1 8.8 3.8 8.5 8.5 0 1 0 20.2 15.2Z" />,
    share: <><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5" /></>,
    shield: <><path d="M12 3 5 6v5c0 4.7 2.9 8 7 10 4.1-2 7-5.3 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
    sun: <><circle cx="12" cy="12" r="3.5" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" /></>,
    trophy: <><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" /><path d="M8 6H5v2a3 3 0 0 0 3 3M16 6h3v2a3 3 0 0 1-3 3M12 13v4M8 21h8M9 17h6" /></>,
  };

  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

const productPalettes = [
  ["#ef7658", "#fff0e9"],
  ["#7856d8", "#f1edff"],
  ["#14996a", "#e8f8f1"],
  ["#d69a18", "#fff7df"],
] as const;

function productPalette(value: string) {
  const hash = [...value].reduce((total, letter) => total + letter.charCodeAt(0), 0);
  return productPalettes[hash % productPalettes.length];
}

function ProductMark({
  product,
  className = "",
}: {
  product: Pick<LeaderboardProduct, "id" | "name" | "hasIcon">;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const palette = productPalette(product.id);
  const style = {
    "--product-accent": palette[0],
    "--product-soft": palette[1],
  } as CSSProperties;

  return (
    <span className={"arena-product-mark " + className} style={style} aria-hidden="true">
      {product.hasIcon && !failed
        ? <img src={"/api/product-icon/" + product.id} alt="" onError={() => setFailed(true)} />
        : <span>{product.name.slice(0, 1).toUpperCase()}</span>}
    </span>
  );
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatDollars(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

function shortProductName(name: string) {
  const cleaned = name.replace(/\s+/g, " ").trim();
  const beforeDash = cleaned.split(/\s+[—–|]\s+/)[0]?.trim();
  if (beforeDash && beforeDash.length <= 28) return beforeDash;
  return cleaned.length > 30 ? cleaned.slice(0, 29).trim() + "…" : cleaned;
}

function relativeTime(value: string, relativeTo: string) {
  const seconds = Math.max(0, Math.floor((new Date(relativeTo).getTime() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return String(minutes) + "m ago";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return String(hours) + "h ago";
  return String(Math.floor(hours / 24)) + "d ago";
}

function countdownLabel(endsAt: string, now: number) {
  const remaining = Math.max(0, new Date(endsAt).getTime() - now);
  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

function positionLabel(rank: BidTargetRank, productCount: number) {
  if (rank === 10 && productCount < 10) return "#" + String(productCount + 1);
  return rank === 1 ? "#1" : "Top " + String(rank);
}

function getVisitorId() {
  const key = "overmcp-visitor-id";
  const current = window.localStorage.getItem(key);
  if (current) return current;
  const created = window.crypto.randomUUID();
  window.localStorage.setItem(key, created);
  return created;
}

type DataFastWindow = Window & {
  datafast?: (goalName: string, parameters?: Record<string, string>) => void;
};

function trackDataFastGoal(goalName: string, parameters: Record<string, string>) {
  (window as DataFastWindow).datafast?.(goalName, parameters);
}

function racePath(points: Array<{ x: number; y: number }>) {
  if (!points.length) return "";
  return points.slice(1).reduce((path, point) => path + " H " + String(point.x) + " V " + String(point.y), "M " + String(points[0].x) + " " + String(points[0].y));
}

function CrowdRaceChart({
  data,
  contenders,
}: {
  data: LeaderboardPayload;
  contenders: LeaderboardProduct[];
}) {
  const width = 840;
  const height = 220;
  const margin = { top: 24, right: 34, bottom: 34, left: 34 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const contenderIds = new Set(contenders.map((product) => product.id));
  const events = data.crowdRace.events
    .filter((event) => contenderIds.has(event.productId))
    .sort((a, b) => new Date(a.happenedAt).getTime() - new Date(b.happenedAt).getTime());
  const eventsByProduct = new Map<string, CrowdRaceEvent[]>();
  for (const contender of contenders) eventsByProduct.set(contender.id, []);
  for (const event of events) eventsByProduct.get(event.productId)?.push(event);
  const maximum = Math.max(2, ...contenders.map((product) => product.supportersToday));
  const tickValues = [maximum, Math.ceil(maximum / 2), 0];
  const xForEvent = (index: number) => margin.left + ((index + 1) / (events.length + 1)) * plotWidth;
  const yFor = (supporters: number) => margin.top + plotHeight - (supporters / maximum) * plotHeight;

  const activeContenders = contenders.filter((product) => product.supportersToday > 0);
  const series = activeContenders.map((product, seriesIndex) => {
    const productEvents = eventsByProduct.get(product.id) ?? [];
    let running = Math.max(0, product.supportersToday - productEvents.length);
    const points = [{ x: margin.left, y: yFor(running) }];
    for (const [eventIndex, event] of events.entries()) {
      if (event.productId !== product.id) continue;
      running += 1;
      points.push({
        x: xForEvent(eventIndex),
        y: yFor(running),
      });
    }
    const endX = width - margin.right - seriesIndex * 10;
    points.push({ x: endX, y: yFor(product.supportersToday) });
    return { product, path: racePath(points), endX };
  });

  return (
    <div className="arena-race-chart">
      <svg viewBox={"0 0 " + String(width) + " " + String(height)} role="img" aria-label="Live supporter race today">
        {tickValues.map((value) => {
          const y = yFor(value);
          return (
            <g className="arena-chart-grid" key={value}>
              <line x1={margin.left} x2={width - margin.right} y1={y} y2={y} />
              <text x={margin.left - 10} y={y + 4} textAnchor="end">{value}</text>
            </g>
          );
        })}
        {series.map(({ product, path, endX }, index) => (
          <g className={"arena-chart-series series-" + String(index + 1)} key={product.id}>
            <title>{shortProductName(product.name) + ": " + formatInteger(product.supportersToday) + " today"}</title>
            <path className="arena-chart-glow" d={path} />
            <path className="arena-chart-line" d={path} />
            <circle cx={endX} cy={yFor(product.supportersToday)} r="5" />
          </g>
        ))}
        <text className="arena-chart-time" x={margin.left} y={height - 9}>START</text>
        <text className="arena-chart-time" x={width - margin.right} y={height - 9} textAnchor="end">NOW</text>
      </svg>
      {!series.length && (
        <div className="arena-chart-empty">
          <strong>The race starts with the first supporter.</strong>
          <span>One person. One backing. Every day.</span>
        </div>
      )}
    </div>
  );
}

export function FounderRaceApp({ initialData }: { initialData: LeaderboardPayload }) {
  const [data, setData] = useState(initialData);
  const [boardView, setBoardView] = useState<BoardView>("today");
  const [category, setCategory] = useState("All");
  const [theme, setTheme] = useState<Theme>("light");
  const [identity, setIdentity] = useState("");
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [productCategory, setProductCategory] = useState<(typeof PRODUCT_CATEGORIES)[number]>("AI");
  const [email, setEmail] = useState("");
  const [iconDataUrl, setIconDataUrl] = useState<string | null>(null);
  const [iconSignature, setIconSignature] = useState<string | null>(null);
  const [autofillStatus, setAutofillStatus] = useState<AutofillStatus>("idle");
  const [autofillMessage, setAutofillMessage] = useState("");
  const [targetRank, setTargetRank] = useState<BidTargetRank>(1);
  const [bidAmount, setBidAmount] = useState(Math.ceil(initialData.positionPrices["1"] / 100));
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [supportingId, setSupportingId] = useState<string | null>(null);
  const [supportedProductId, setSupportedProductId] = useState<string | null>(null);
  const [shareProductId, setShareProductId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState("");
  const [clock, setClock] = useState(Date.now());
  const [publicStats, setPublicStats] = useState({
    onlineVisitors: initialData.stats.onlineVisitors,
    totalVisitors: initialData.stats.totalVisitors,
  });

  const identityInput = useRef<HTMLInputElement>(null);
  const autofillRequest = useRef(0);
  const lastAutofilledIdentity = useRef("");
  const checkoutRequestId = useRef<string | null>(null);
  const submittingRef = useRef(false);

  const productsById = useMemo(
    () => new Map(data.products.map((product) => [product.id, product])),
    [data.products],
  );
  const contenders = data.crowdRace.contenderIds
    .map((id) => productsById.get(id))
    .filter((product): product is LeaderboardProduct => Boolean(product));
  const leader = data.crowdRace.leaderId ? productsById.get(data.crowdRace.leaderId) : undefined;
  const categoryOptions = useMemo(
    () => [{ name: "All", count: data.stats.products }, ...data.categories],
    [data.categories, data.stats.products],
  );
  const visibleProducts = useMemo(() => {
    const filtered = data.products.filter((product) => category === "All" || product.category === category);
    return [...filtered].sort((a, b) => boardView === "today"
      ? a.crowdRank - b.crowdRank
      : a.rank - b.rank);
  }, [boardView, category, data.products]);
  const targetRankOptions = ([1, 2, 3, 10] as const).filter((rank) => (
    rank === 10 ? data.stats.products >= 3 : rank <= data.stats.products + 1
  ));
  const selectedPositionLabel = positionLabel(targetRank, data.stats.products);
  const thresholdDollars = Math.ceil(data.positionPrices[String(targetRank) as "1" | "2" | "3" | "10"] / 100);
  const bidStepDollars = BID_INCREMENT_CENTS / 100;

  useEffect(() => {
    const activeTheme = document.documentElement.dataset.theme;
    if (activeTheme === "light" || activeTheme === "dark") setTheme(activeTheme);

    const checkout = new URLSearchParams(window.location.search).get("checkout");
    if (checkout === "success") {
      setToast("Payment received. Your product joins after Stripe confirms it.");
      window.history.replaceState({}, "", window.location.pathname);
    } else if (checkout === "cancelled") {
      setToast("Checkout cancelled. Nothing was charged.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const storageKey = "overmcp-race-support:" + data.crowdRace.day;
    setSupportedProductId(window.localStorage.getItem(storageKey));
  }, [data.crowdRace.day]);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!data.configured) return;
    let cancelled = false;

    const refresh = async () => {
      try {
        const response = await fetch("/api/leaderboard", { cache: "no-store" });
        if (response.ok && !cancelled) setData(await response.json());
      } catch {
        // Keep the last confirmed race state during a transient outage.
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
    const refreshTimer = window.setInterval(refresh, 12_000);
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
        if (!cancelled && Number.isInteger(nextStats.onlineVisitors) && Number.isInteger(nextStats.totalVisitors)) {
          setPublicStats(nextStats);
        }
      } catch {
        // Production database counters remain the fallback.
      }
    };
    void refreshPublicStats();
    const timer = window.setInterval(refreshPublicStats, 20_000);
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
    const timeout = window.setTimeout(() => {
      setToast("");
      setShareProductId(null);
    }, 6_000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function chooseRank(rank: BidTargetRank) {
    checkoutRequestId.current = null;
    setTargetRank(rank);
    setBidAmount(Math.ceil(data.positionPrices[String(rank) as "1" | "2" | "3" | "10"] / 100));
  }

  function changeBidAmount(value: number) {
    const next = Math.max(Math.ceil(data.stats.minimumBidCents / 100), value);
    const cents = next * 100;
    checkoutRequestId.current = null;
    setBidAmount(next);
    if (cents >= data.positionPrices["1"]) setTargetRank(1);
    else if (cents >= data.positionPrices["2"]) setTargetRank(2);
    else if (cents >= data.positionPrices["3"]) setTargetRank(3);
    else setTargetRank(10);
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
      setAutofillMessage("Public product details filled. Review them before checkout.");
      lastAutofilledIdentity.current = requestedIdentity;
    } catch (error) {
      if (requestId !== autofillRequest.current) return;
      setAutofillStatus("error");
      setAutofillMessage((error instanceof Error ? error.message : "Autofill failed.") + " Enter the details manually.");
    }
  }

  function openPlacement(rank: BidTargetRank = 1) {
    chooseRank(rank);
    setFormError("");
    setModalOpen(true);
    if (identity.trim()) void autofillWebsite(identity);
  }

  function closeModal(event?: ReactMouseEvent<HTMLElement>) {
    if (event && event.target !== event.currentTarget) return;
    setModalOpen(false);
  }

  async function submitPlacement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;
    if (bidAmount < thresholdDollars) {
      setFormError("The current " + selectedPositionLabel + " threshold is $" + formatInteger(thresholdDollars) + ".");
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setFormError("");
    const requestId = checkoutRequestId.current ?? window.crypto.randomUUID();
    checkoutRequestId.current = requestId;
    trackDataFastGoal("initiate_checkout", {
      email,
      product_name: productName,
      product_website: identity.trim().slice(0, 255),
      category: productCategory,
      amount_usd: String(bidAmount),
      target_rank: String(targetRank),
      request_id: requestId,
    });

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
      window.location.assign(result.checkoutUrl);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Checkout could not be started.");
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  async function supportProduct(product: LeaderboardProduct) {
    if (supportingId) return;
    window.open("/go/" + product.id, "_blank", "noopener,noreferrer");
    setSupportingId(product.id);

    try {
      const response = await fetch("/api/race/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorId: getVisitorId(),
          productId: product.id,
          raceDay: data.crowdRace.day,
        }),
      });
      const result = await response.json() as SupportResult;
      if (!response.ok) throw new Error(result.error ?? "Support could not be recorded.");
      if (result.data) setData(result.data);
      if (result.selectedProductId) {
        window.localStorage.setItem("overmcp-race-support:" + data.crowdRace.day, result.selectedProductId);
        setSupportedProductId(result.selectedProductId);
      }

      if (result.selectedProductId === product.id) {
        trackDataFastGoal("support_product", {
          product_id: product.id,
          product_name: product.name,
          race_day: data.crowdRace.day,
        });
        setShareProductId(product.id);
        setToast(result.alreadySupported ? "You already backed " + shortProductName(product.name) + " today." : "You backed " + shortProductName(product.name) + ". Their site opened in a new tab.");
      } else {
        setShareProductId(null);
        const selected = result.selectedProductId ? productsById.get(result.selectedProductId) : undefined;
        setToast("Your daily backing already belongs to " + (selected ? shortProductName(selected.name) : "another product") + ".");
      }
    } catch (error) {
      setShareProductId(null);
      setToast(error instanceof Error ? error.message : "Support could not be recorded.");
    } finally {
      setSupportingId(null);
    }
  }

  async function shareRace(product?: LeaderboardProduct) {
    const selected = product ?? leader ?? contenders[0];
    const url = window.location.origin + "/?back=" + encodeURIComponent(selected?.id ?? "") + "#battle";
    const text = selected
      ? "I backed " + shortProductName(selected.name) + " in today’s live founder race. Help them take #1."
      : "The internet is choosing today’s #1 product. Back your favorite.";
    try {
      if (navigator.share) {
        await navigator.share({ title: "Today’s founder race", text, url });
        return;
      }
      await navigator.clipboard.writeText(text + " " + url);
      setToast("Race link copied.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setToast("The race link could not be shared.");
    }
  }

  function toggleTheme() {
    setTheme((current) => {
      const next = current === "light" ? "dark" : "light";
      document.documentElement.dataset.theme = next;
      document.documentElement.style.colorScheme = next;
      window.localStorage.setItem("overmcp-theme", next);
      return next;
    });
  }

  const remaining = countdownLabel(data.crowdRace.endsAt, clock);
  const heroLead = leader ? shortProductName(leader.name) : "today’s winner";

  return (
    <div className="arena-shell">
      {(!data.configured || !data.available || !data.paymentsConfigured) && (
        <div className="arena-setup-banner" role="status">
          {!data.configured
            ? "Database setup is incomplete."
            : !data.available
              ? "The live board is temporarily unavailable."
              : "The race is live; paid entry is temporarily unavailable."}
        </div>
      )}

      <header className="arena-header">
        <div className="arena-container arena-header-inner">
          <div className="arena-brand-lockup"><Logo /><strong>overmcp</strong></div>
          <div className="arena-period-switch" aria-label="Leaderboard period">
            <button className={boardView === "today" ? "active" : ""} onClick={() => setBoardView("today")}>Today</button>
            <button className={boardView === "all-time" ? "active" : ""} onClick={() => setBoardView("all-time")}>All-time</button>
          </div>
          <nav className="arena-nav" aria-label="Main navigation">
            <a href="#leaderboard">Leaderboard</a>
            <a href="#how-it-works">How it works</a>
            <button className="arena-theme" onClick={toggleTheme} aria-label={"Switch to " + (theme === "light" ? "dark" : "light") + " mode"}>
              <Icon name={theme === "light" ? "moon" : "sun"} size={18} />
            </button>
          </nav>
        </div>
      </header>

      <main>
        <section className="arena-hero arena-container" id="battle">
          <a
            className="arena-audience-pill"
            href={DATAFAST_SHARE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open live visitor analytics in DataFast"
          >
            <i />
            <strong>{formatInteger(publicStats.onlineVisitors)} online</strong>
            <span>·</span>
            <span>{formatInteger(publicStats.totalVisitors)} visitors</span>
            <span className="arena-audience-action">view live analytics ↗</span>
          </a>

          <div className="arena-kicker">ONE PERSON · ONE BACKING · EVERY DAY</div>
          <h1>
            Help decide #1
            <span> before {remaining}</span>
          </h1>
          <p className="arena-hero-copy">
            Founders pay to enter. The internet decides who leads today.
            Backing a product also sends it a real visit.
          </p>

          <article className="arena-battle-card">
            <header className="arena-battle-head">
              <div><span className="arena-live-dot" /> LIVE TOP 3 FOUNDER RACE</div>
              <strong><Icon name="clock" size={15} /> {remaining}</strong>
            </header>

            {contenders.length ? (
              <>
                <div className="arena-contenders">
                  {contenders.map((product, index) => {
                    const isBacked = supportedProductId === product.id;
                    const anotherBacked = Boolean(supportedProductId && !isBacked);
                    return (
                      <section className={"arena-contender contender-" + String(index + 1)} key={product.id}>
                        <div className="arena-contender-rank">
                          #{product.crowdRank}{product.supportersToday === 0 ? " · WAITING FOR BACKING" : ""}
                        </div>
                        <ProductMark product={product} className="arena-contender-logo" />
                        <div className="arena-contender-copy">
                          <h2>{shortProductName(product.name)}</h2>
                          <p>{product.description}</p>
                          <div className="arena-contender-signals">
                            <span>{formatInteger(product.weeklyClicks)} clicks this week</span>
                            <span>{formatInteger(product.totalClicks)} all-time</span>
                            <span>{formatDollars(product.bidCents)} confirmed</span>
                          </div>
                        </div>
                        <div className="arena-support-score">
                          <strong>{formatInteger(product.supportersToday)}</strong>
                          <span>{product.supportersToday === 1 ? "supporter" : "supporters"} today</span>
                        </div>
                        <button
                          className={isBacked ? "is-backed" : ""}
                          disabled={supportingId === product.id || anotherBacked}
                          onClick={() => void supportProduct(product)}
                        >
                          {supportingId === product.id
                            ? "Backing…"
                            : isBacked
                              ? <><Icon name="check" size={16} /> Backed today</>
                              : anotherBacked
                                ? "Daily backing used"
                                : <>Back & visit <Icon name="arrow" size={16} /></>}
                        </button>
                      </section>
                    );
                  })}
                </div>
                <CrowdRaceChart data={data} contenders={contenders} />
              </>
            ) : (
              <div className="arena-no-contenders">
                <Icon name="trophy" size={30} />
                <h2>The first contender gets the whole stage.</h2>
                <p>Enter a product below and open today’s founder race.</p>
              </div>
            )}

            <footer className="arena-battle-foot">
              <span><Icon name="shield" size={14} /> Verified once per visitor and network</span>
              <span>Every product can climb from the full board below</span>
              <button onClick={() => void shareRace()}><Icon name="share" size={15} /> Share this race</button>
            </footer>
          </article>

          <form className="arena-entry-form" onSubmit={(event) => { event.preventDefault(); openPlacement(1); }}>
            <label>
              <Icon name="globe" size={19} />
              <input
                value={identity}
                onChange={(event) => changeIdentity(event.target.value)}
                onBlur={() => void autofillWebsite(identity)}
                placeholder="Your product URL or @handle"
                aria-label="Product URL or handle"
              />
            </label>
            <select value={productCategory} onChange={(event) => setProductCategory(event.target.value as (typeof PRODUCT_CATEGORIES)[number])} aria-label="Product category">
              {PRODUCT_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
            </select>
            <button type="submit">Enter the race <Icon name="arrow" size={17} /></button>
          </form>
          <p className="arena-entry-note">
            One-time placement from {formatDollars(data.stats.minimumBidCents)} · Community backing is free · Payments are not refundable
          </p>
        </section>

        <section className="arena-board arena-container" id="leaderboard">
          <header className="arena-board-head">
            <div>
              <span>{boardView === "today" ? "TODAY’S CROWD RANKING" : "ALL-TIME PAID PLACEMENT"}</span>
              <h2>{boardView === "today" ? "The founder leaderboard" : "The permanent leaderboard"}</h2>
            </div>
            <p>{boardView === "today"
              ? "Ranked by verified supporters today. Ties follow all-time position."
              : "Ranked by confirmed bid total. Pay once and stay until another product passes you."}</p>
          </header>

          <div className="arena-categories" role="group" aria-label="Filter by category">
            {categoryOptions.map((item) => (
              <button className={category === item.name ? "active" : ""} onClick={() => setCategory(item.name)} key={item.name}>
                {item.name}<span>{item.count}</span>
              </button>
            ))}
          </div>

          <div className="arena-product-list">
            {visibleProducts.length ? visibleProducts.map((product) => {
              const displayRank = boardView === "today" ? product.crowdRank : product.rank;
              const isBacked = supportedProductId === product.id;
              const anotherBacked = Boolean(supportedProductId && !isBacked);
              return (
                <article className={"arena-product-row " + (displayRank === 1 ? "is-leading" : "")} key={product.id}>
                  <div className="arena-row-rank">#{displayRank}</div>
                  <ProductMark product={product} className="arena-row-logo" />
                  <div className="arena-row-copy">
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                    <div>
                      <span>{product.category}</span>
                      <span>{formatCompact(product.weeklyClicks)} clicks this week</span>
                      <span>{formatCompact(product.totalClicks)} all-time clicks</span>
                      <span>{formatDollars(product.bidCents)} confirmed</span>
                      {product.creditCents > 0 && <span>includes founder credit</span>}
                    </div>
                  </div>
                  <div className="arena-row-metrics">
                    <div className="arena-row-score">
                      <strong>{boardView === "today" ? formatInteger(product.supportersToday) : formatDollars(product.bidCents)}</strong>
                      <span>{boardView === "today" ? "supporters today" : "confirmed total"}</span>
                    </div>
                    <div className="arena-row-clicks">
                      <strong>{formatInteger(product.totalClicks)}</strong>
                      <span>total clicks</span>
                    </div>
                  </div>
                  <div className="arena-row-actions">
                    {boardView === "today" && (
                      <button
                        className={"arena-back-button " + (isBacked ? "is-backed" : "")}
                        disabled={supportingId === product.id || anotherBacked}
                        onClick={() => void supportProduct(product)}
                      >
                        {isBacked ? <><Icon name="check" size={14} /> Backed</> : anotherBacked ? "Visit" : "Back"}
                      </button>
                    )}
                    <a href={"/go/" + product.id} target="_blank" rel="noopener noreferrer" aria-label={"Visit " + product.name}>
                      <Icon name="external" size={16} />
                    </a>
                  </div>
                </article>
              );
            }) : (
              <div className="arena-empty">
                <Icon name="trophy" size={28} />
                <h3>{data.products.length ? "No products in this category yet." : "The first spot is open."}</h3>
                <button onClick={() => openPlacement(1)}>Enter the race</button>
              </div>
            )}
          </div>

          <button className="arena-board-cta" onClick={() => openPlacement(1)}>
            Take an all-time spot from {formatDollars(data.stats.minimumBidCents)} <Icon name="arrow" size={16} />
          </button>

          <div className="arena-proof-strip" aria-label="All-time verified totals">
            <div><span>Products</span><strong>{formatInteger(data.stats.products)}</strong></div>
            <div><span>Tracked clicks</span><strong>{formatInteger(data.stats.totalClicks)}</strong></div>
            <div><span>Total visitors</span><strong>{formatInteger(publicStats.totalVisitors)}</strong></div>
            <div><span>Paid bids</span><strong>{formatDollars(data.stats.paidBidCents)}</strong></div>
            <div><span>Founder credits</span><strong>{formatDollars(data.stats.creditBidCents)}</strong></div>
          </div>
        </section>

        <section className="arena-activity arena-container" aria-label="Latest race activity">
          <div className="arena-activity-title"><i /> Latest activity</div>
          <div className="arena-activity-track">
            {data.crowdRace.events.slice(-5).reverse().map((event) => {
              const product = productsById.get(event.productId);
              if (!product) return null;
              return (
                <div className="arena-activity-item" key={event.id}>
                  <ProductMark product={product} className="arena-activity-logo" />
                  <span><strong>{shortProductName(product.name)}</strong><small>backed · {relativeTime(event.happenedAt, data.generatedAt)}</small></span>
                </div>
              );
            })}
            {!data.crowdRace.events.length && data.activity.slice(0, 5).map((event) => {
              const product = productsById.get(event.productId);
              if (!product) return null;
              return (
                <div className="arena-activity-item" key={event.id}>
                  <ProductMark product={product} className="arena-activity-logo" />
                  <span><strong>{shortProductName(product.name)}</strong><small>entered · {relativeTime(event.happenedAt, data.generatedAt)}</small></span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="arena-how arena-container" id="how-it-works">
          <div className="arena-how-copy">
            <span>HOW IT WORKS</span>
            <h2>Money gets you on the field.<br />People decide today’s winner.</h2>
          </div>
          <div className="arena-how-steps">
            <article><b>01</b><strong>Enter once</strong><p>Paste your product and buy a permanent all-time placement.</p></article>
            <article><b>02</b><strong>Rally supporters</strong><p>Each verified person can back one product per daily race.</p></article>
            <article><b>03</b><strong>Win the spotlight</strong><p>The crowd leader owns the homepage battle and a shareable daily result.</p></article>
          </div>
        </section>
      </main>

      <footer className="arena-footer">
        <div className="arena-container">
          <div className="arena-footer-brand"><div className="arena-brand-lockup"><Logo /><strong>overmcp</strong></div><p>Don’t outbid. Outgrow.</p></div>
          <div><a href="/rules">Rules</a><a href="/terms">Terms</a><a href="/privacy">Privacy</a></div>
          <span><i /> Daily race live</span>
        </div>
      </footer>

      {modalOpen && (
        <div className="arena-modal-backdrop" onMouseDown={closeModal}>
          <section className="arena-modal" role="dialog" aria-modal="true" aria-labelledby="placement-title">
            <button className="arena-modal-close" onClick={() => setModalOpen(false)} aria-label="Close"><Icon name="close" size={19} /></button>
            <div className="arena-modal-kicker">ENTER THE FOUNDER RACE</div>
            <h2 id="placement-title">Put your product<br />where people look.</h2>
            <p>Choose your permanent placement. Every active listing also competes for the free daily crowd championship.</p>

            <div className="arena-position-picker">
              <span>Target position</span>
              <div>{targetRankOptions.map((rank) => (
                <button type="button" className={targetRank === rank ? "active" : ""} onClick={() => chooseRank(rank)} key={rank}>
                  {positionLabel(rank, data.stats.products)}
                </button>
              ))}</div>
              <label>
                <button type="button" onClick={() => changeBidAmount(bidAmount - bidStepDollars)}>−</button>
                <span>$<input inputMode="numeric" value={bidAmount} onChange={(event) => changeBidAmount(Number(event.target.value.replace(/\D/g, "")) || Math.ceil(data.stats.minimumBidCents / 100))} aria-label="Total bid amount" /></span>
                <button type="button" onClick={() => changeBidAmount(bidAmount + bidStepDollars)}>+</button>
              </label>
            </div>

            <form onSubmit={submitPlacement} noValidate>
              <label><span>Product URL or @handle</span><input ref={identityInput} value={identity} onChange={(event) => changeIdentity(event.target.value)} onBlur={() => void autofillWebsite(identity)} placeholder="https://yourproduct.com" required /></label>
              <div className={"arena-autofill " + autofillStatus}>
                <span>{iconDataUrl ? <img src={iconDataUrl} alt="" /> : <Icon name={autofillStatus === "success" ? "check" : "globe"} size={15} />}</span>
                <p>{autofillMessage || "We’ll fill the public product details from your website."}</p>
                <button type="button" onClick={() => void autofillWebsite(identity, true)} disabled={autofillStatus === "loading"}>{autofillStatus === "loading" ? "Reading…" : "Autofill"}</button>
              </div>
              <label><span>Product name</span><input value={productName} onChange={(event) => setProductName(event.target.value)} minLength={2} maxLength={100} required /></label>
              <label><span>Short description</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} minLength={10} maxLength={280} required /></label>
              <label><span>Category</span><select value={productCategory} onChange={(event) => setProductCategory(event.target.value as (typeof PRODUCT_CATEGORIES)[number])}>{PRODUCT_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><span>Receipt email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required /></label>
              {formError && <p className="arena-form-error" role="alert">{formError}</p>}
              <button className="arena-checkout-button" type="submit" disabled={submitting || !data.available || !data.paymentsConfigured}>
                {submitting ? "Opening secure checkout…" : "Continue to Stripe"} <Icon name="arrow" size={17} />
              </button>
            </form>
            <div className="arena-modal-foot"><Icon name="shield" size={13} /> One-time payment · Transparent paid rank · Free daily backing</div>
          </section>
        </div>
      )}

      {toast && (
        <div className="arena-toast" role="status">
          <Icon name="check" size={15} />
          <span>{toast}</span>
          {shareProductId && productsById.get(shareProductId) && (
            <button onClick={() => void shareRace(productsById.get(shareProductId))}>
              <Icon name="share" size={14} /> Share
            </button>
          )}
        </div>
      )}
    </div>
  );
}
