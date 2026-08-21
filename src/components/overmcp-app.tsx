"use client";

import {
  FormEvent,
  MouseEvent as ReactMouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PRODUCT_CATEGORIES } from "@/lib/constants";
import type { LeaderboardPayload, LeaderboardProduct } from "@/lib/types";

type SortMode = "Rank" | "Clicks" | "Newest";
type AutofillStatus = "idle" | "loading" | "success" | "error";

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

export function Logo() {
  return (
    <a className="brand" href="/" aria-label="OverMCP home">
      <span className="brand-glyph" aria-hidden="true">
        <svg viewBox="0 0 32 32" role="presentation">
          <circle cx="13.5" cy="18.5" r="8.5" />
          <path d="M18.5 13.5 27 5m-6.5 0H27v6.5" />
        </svg>
      </span>
      <span className="brand-wordmark" aria-hidden="true">ver<span>mcp</span></span>
    </a>
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
      <span>{name.slice(0, 1).toUpperCase()}</span>
      {hasIcon && !iconFailed && <img src={`/api/product-icon/${id}`} alt="" onError={() => setIconFailed(true)} />}
    </span>
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
  const [data, setData] = useState(initialData);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sortMode, setSortMode] = useState<SortMode>("Rank");
  const [targetRank, setTargetRank] = useState<1 | 3 | 10>(1);
  const [bidAmount, setBidAmount] = useState(Math.ceil(initialData.positionPrices["1"] / 100));
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
  const submittingRef = useRef(false);

  const products = data.products;
  const thresholdDollars = Math.ceil(data.positionPrices[String(targetRank) as "1" | "3" | "10"] / 100);
  const weeklyClicks = products.reduce((total, product) => total + product.weeklyClicks, 0);
  const categoryOptions = useMemo(() => [{ name: "All", count: data.stats.products }, ...data.categories], [data]);
  const trendingProducts = useMemo(
    () => [...products]
      .filter((product) => product.weeklyClicks > 0)
      .sort((a, b) => b.weeklyClicks - a.weeklyClicks || b.totalClicks - a.totalClicks)
      .slice(0, 5),
    [products],
  );

  useEffect(() => {
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

  const tickerItems = data.categories.length > 1
    ? data.categories.map((item) => `${item.name} · ${formatInteger(item.count)}`)
    : [
        `${formatInteger(data.stats.products)} live product${data.stats.products === 1 ? "" : "s"}`,
        `${formatInteger(data.stats.totalClicks)} tracked click${data.stats.totalClicks === 1 ? "" : "s"}`,
        `Placements start at ${formatDollars(data.stats.minimumBidCents)}`,
        "Bids set the rank",
      ];

  function chooseRank(rank: 1 | 3 | 10) {
    checkoutRequestId.current = null;
    setTargetRank(rank);
    setBidAmount(Math.ceil(data.positionPrices[String(rank) as "1" | "3" | "10"] / 100));
  }

  function openBidModal() {
    setFormError("");
    setModalOpen(true);
    if (identity.trim()) void autofillWebsite(identity);
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
      setFormError(`The current #${targetRank} threshold is $${formatInteger(thresholdDollars)}.`);
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setFormError("");
    const requestId = checkoutRequestId.current ?? window.crypto.randomUUID();
    checkoutRequestId.current = requestId;

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
        <section className="hero container" aria-labelledby="hero-title">
          <a className="public-stats-pill" href={DATAFAST_SHARE_URL} target="_blank" rel="noopener noreferrer" aria-label="See live OverMCP analytics on DataFast">
            <span className="public-stats-online"><i /> {formatInteger(publicStats.onlineVisitors)} online</span>
            <span className="public-stats-separator" aria-hidden="true">·</span>
            <span>{formatInteger(publicStats.totalVisitors)} visitors since launch</span>
            <span className="public-stats-separator" aria-hidden="true">·</span>
            <strong>see stats <span aria-hidden="true">→</span></strong>
          </a>
          <div className="hero-copy">
            <div className="eyebrow reveal reveal-one"><span>01</span> The live product leaderboard</div>
            <h1 id="hero-title" className="reveal reveal-two">Claim the internet’s <em>top spot.</em></h1>
            <p className="hero-description reveal reveal-three">Bid for visibility, keep your rank until you’re outbid, and track every visit you earn.</p>
            <div className="hero-actions reveal reveal-four">
              <button className="button button-primary" onClick={openBidModal}>Claim the #1 spot <Icon name="arrow" /></button>
              <a className="button button-ghost" href="#leaderboard">Explore the leaderboard</a>
            </div>
            <div className="hero-proof reveal reveal-five">
              {products.length > 0 && <div className="avatar-stack" aria-hidden="true">
                {products.slice(0, 3).map((product) => <span key={product.id}>{product.name.slice(0, 1).toUpperCase()}</span>)}
                <span>+</span>
              </div>}
              <p><strong>{formatInteger(publicStats.onlineVisitors)} {publicStats.onlineVisitors === 1 ? "person" : "people"}</strong><br />exploring right now</p>
              <div className="proof-divider" />
              <p><strong>{formatCompact(weeklyClicks)} clicks</strong><br />delivered this week</p>
            </div>
          </div>

          <div className="bid-card reveal reveal-three">
            <div className="bid-card-topline"><span><i /> Live position auction</span><span className="round-label">BIDS SET RANK</span></div>
            <div className={`current-leader ${products[0] ? "has-leader" : "is-open"}`}>
              {products[0] ? <>
                <ProductMark id={products[0].id} name={products[0].name} hasIcon={products[0].hasIcon} className="leader-product-mark" style={{ "--leader-accent": paletteFor(products[0].id)[0], "--leader-soft": paletteFor(products[0].id)[1] } as React.CSSProperties} />
                <div className="leader-product-copy"><span>Currently leading</span><strong>{products[0].name}</strong></div>
                <div className="leader-product-stats"><strong>{formatDollars(products[0].bidCents)}</strong><span>{formatCompact(products[0].totalClicks)} tracked clicks</span></div>
              </> : <>
                <div className="leader-product-mark open-mark">#1</div>
                <div className="leader-product-copy"><span>Currently leading</span><strong>No leader yet — be first</strong></div>
                <div className="leader-product-stats"><strong>{formatDollars(data.stats.minimumBidCents)}</strong><span>opening bid</span></div>
              </>}
            </div>
            <div className="auction-claim">
              <div className="claim-line">
                <strong>Claim #{targetRank} for</strong>
                <label className="compact-amount">
                  <span>$</span>
                  <input aria-label="Bid amount in dollars" inputMode="numeric" value={bidAmount} onChange={(event) => { checkoutRequestId.current = null; setBidAmount(Math.max(5, Number(event.target.value.replace(/\D/g, "")) || 5)); }} />
                </label>
                <div className="stepper">
                  <button type="button" aria-label="Decrease bid" onClick={() => { checkoutRequestId.current = null; setBidAmount((amount) => Math.max(5, amount - 5)); }}>−</button>
                  <button type="button" aria-label="Increase bid" onClick={() => { checkoutRequestId.current = null; setBidAmount((amount) => amount + 5); }}>+</button>
                </div>
              </div>
              <div className="claim-meta">
                <span>{bidAmount >= thresholdDollars ? `Clears #${targetRank}` : `$${formatInteger(thresholdDollars - bidAmount)} more needed`} · ${formatInteger(thresholdDollars)} threshold</span>
                <div className="position-tabs" role="group" aria-label="Target leaderboard position">
                  {([1, 3, 10] as const).map((rank) => <button type="button" className={targetRank === rank ? "active" : ""} key={rank} onClick={() => chooseRank(rank)}>#{rank}</button>)}
                </div>
              </div>
            </div>
            <form className="bid-entry-row" onSubmit={(event) => { event.preventDefault(); openBidModal(); }}>
              <label className="url-field"><span className="url-icon">↗</span><input value={identity} onChange={(event) => changeIdentity(event.target.value)} onBlur={() => void autofillWebsite(identity)} placeholder="yourproduct.com or @handle" aria-label="Product URL or handle" /></label>
              <button type="submit" className="button button-primary bid-submit">Preview <Icon name="arrow" /></button>
            </form>
            <div className="bid-assurances"><span><Icon name="check" size={14} /> Pay once</span><span><Icon name="check" size={14} /> Stay until outbid</span><span><Icon name="shield" size={14} /> Clicks tracked</span></div>
          </div>
        </section>

        <section className="market-pulse container" aria-label="Live leaderboard signals">
          <article className="pulse-card">
            <div className="pulse-heading"><strong><span aria-hidden="true">↗</span> Trending right now</strong><small>real clicks · 7 days</small></div>
            {trendingProducts.length ? (
              <div className="pulse-list">
                {trendingProducts.map((product, index) => {
                  const palette = paletteFor(product.id);
                  return (
                    <button className="pulse-row" key={product.id} onClick={() => openProduct(product)}>
                      <span className="pulse-rank">{index + 1}</span>
                      <ProductMark id={product.id} name={product.name} hasIcon={product.hasIcon} className="pulse-avatar" style={{ "--pulse-accent": palette[0], "--pulse-soft": palette[1] } as React.CSSProperties} />
                      <strong>{product.name}</strong>
                      <span>{formatCompact(product.weeklyClicks)} clicks</span>
                    </button>
                  );
                })}
              </div>
            ) : <div className="pulse-empty"><span>↗</span><p><strong>No trend yet</strong>Tracked visits will rank products here.</p></div>}
          </article>

          <article className="pulse-card">
            <div className="pulse-heading"><strong><span className="live-dot" /> Latest activity</strong><small>confirmed bids &amp; credits</small></div>
            {data.activity.length ? (
              <div className="pulse-list">
                {data.activity.slice(0, 5).map((item) => {
                  const palette = paletteFor(item.id);
                  return (
                    <div className="pulse-row" key={item.id}>
                      <ProductMark id={item.productId} name={item.productName} hasIcon={item.hasIcon} className="pulse-avatar" style={{ "--pulse-accent": palette[0], "--pulse-soft": palette[1] } as React.CSSProperties} />
                      <strong>{item.productName}</strong>
                      <span>{item.fundingSource === "credit" ? `${formatDollars(item.amountCents)} founder credit` : `+${formatDollars(item.amountCents)}`} · {relativeTime(item.happenedAt, data.generatedAt)}</span>
                    </div>
                  );
                })}
              </div>
            ) : <div className="pulse-empty"><span>●</span><p><strong>No bid activity yet</strong>Confirmed bids and credits will appear here.</p></div>}
          </article>
        </section>

        <div className="ticker-wrap" aria-label="Leaderboard facts">
          <div className="ticker-track">
            {[...tickerItems, ...tickerItems, ...tickerItems].map((item, index) => <span key={`${item}-${index}`} className={index % tickerItems.length === 0 ? "ticker-title" : ""}>{item}<i>✦</i></span>)}
          </div>
        </div>

        <section className="leaderboard-section container" id="leaderboard" aria-labelledby="leaderboard-title">
          <div className="section-heading">
            <div><div className="eyebrow"><span>02</span> Discover what’s winning</div><h2 id="leaderboard-title">The board, live.</h2></div>
            <p>Every rank is powered by a public bid. Clicks and movement show what people actually care about.</p>
          </div>

          <div className="leaderboard-toolbar">
            <label className="search-control"><Icon name="search" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, websites, categories…" aria-label="Search products" />{query && <button onClick={() => setQuery("")} aria-label="Clear search"><Icon name="close" size={15} /></button>}</label>
            <div className="sort-control" aria-label="Sort leaderboard">
              {(["Rank", "Clicks", "Newest"] as SortMode[]).map((mode) => <button key={mode} className={sortMode === mode ? "active" : ""} onClick={() => setSortMode(mode)}>{mode}</button>)}
            </div>
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
                  <p>{!data.available ? "We couldn’t reach the live database. Please refresh shortly." : products.length ? "Try another search or clear your category filter." : "Be the first product on OverMCP. New listings start at $5."}</p>
                  {data.available && (products.length ? <button onClick={() => { setQuery(""); setCategory("All"); }}>Reset filters</button> : <button onClick={openBidModal}>Claim #1</button>)}
                </div>
              )}
              {data.stats.products > products.length && <div className="load-more">Showing the top {products.length} of {formatInteger(data.stats.products)} products</div>}
            </div>

            <aside className="activity-column">
              <section className="trust-card">
                <div className="trust-icon"><Icon name="shield" size={22} /></div>
                <span className="overline">The OverMCP difference</span>
                <h3>Money buys the spot.<br />Results prove value.</h3>
                <p>Every position has a visible price. Bids and outbound clicks stay public so everyone can judge the value.</p>
                <a href="/rules">See how ranking works <Icon name="arrow" size={14} /></a>
              </section>

              <section className="mini-card">
                <span>Saved products</span><strong>{saved.length}</strong>
                <p>{saved.length ? `${saved.length} product${saved.length === 1 ? "" : "s"} saved on this device.` : "Bookmark products to build your shortlist."}</p>
              </section>
            </aside>
          </div>
        </section>

        <section className="metrics container" aria-label="OverMCP metrics">
          <article><span>Live products</span><strong>{formatInteger(data.stats.products)}</strong><small><Icon name="trend" size={13} /> Confirmed placements</small></article>
          <article><span>Clicks delivered</span><strong>{formatCompact(data.stats.totalClicks)}</strong><small><Icon name="trend" size={13} /> Tracked outbound visits</small></article>
          <article><span>Visitors online</span><strong>{formatInteger(publicStats.onlineVisitors)}</strong><small><Icon name="users" size={13} /> DataFast realtime</small></article>
          <article><span>Entry placement</span><strong>{formatDollars(data.stats.minimumBidCents)}</strong><small><Icon name="bolt" size={13} /> No subscription</small></article>
        </section>

        <section className="how-section" id="how-it-works" aria-labelledby="how-title">
          <div className="container">
            <div className="section-heading inverse-heading"><div><div className="eyebrow"><span>03</span> A clearer way to be discovered</div><h2 id="how-title">Simple by design.<br />Transparent by default.</h2></div><p>One clear transaction, measurable results, and a public board that makes every move easy to understand.</p></div>
            <div className="how-grid">
              <article><span className="step-number">01</span><div className="step-visual visual-list"><i /><i /><i /></div><h3>List your product</h3><p>Submit any product URL or @handle with the name and description you want visitors to see.</p></article>
              <article><span className="step-number">02</span><div className="step-visual visual-bid"><span>$</span><strong>5</strong><i>+</i></div><h3>Choose your reach</h3><p>Bid for the position you want. Start at $5 and see the current threshold before paying.</p></article>
              <article><span className="step-number">03</span><div className="step-visual visual-chart"><i /><i /><i /><i /><i /></div><h3>Measure real intent</h3><p>See tracked outbound clicks and the exact position your confirmed bid total earns.</p></article>
            </div>
          </div>
        </section>

        <section className="builder-cta container" id="builders">
          <div className="cta-grid" aria-hidden="true" /><div className="cta-orbit orbit-one" aria-hidden="true" /><div className="cta-orbit orbit-two" aria-hidden="true" />
          <div className="cta-copy"><div className="eyebrow"><span>04</span> Built something worth seeing?</div><h2>Don’t wait to<br /><em>be discovered.</em></h2><p>Join the live leaderboard where visibility is transparent and every outbound visit is measured.</p><button className="button button-dark" onClick={openBidModal}>List your product <Icon name="arrow" /></button></div>
          <div className="cta-card-stack" aria-hidden="true">
            {products[1] && <div className="float-card card-back"><span>#{products[1].rank}</span><i>{products[1].name.slice(0, 1).toUpperCase()}</i><strong>{products[1].name}</strong><small>{formatDollars(products[1].bidCents)} total bid</small></div>}
            <div className="float-card card-front"><span>#1</span><i>{products[0]?.name.slice(0, 1).toUpperCase() ?? "+"}</i><strong>{products[0]?.name ?? "Position available"}</strong><small>{products[0] ? `${formatInteger(products[0].totalClicks)} tracked visits` : `Starts at ${formatDollars(data.stats.minimumBidCents)}`}</small></div>
          </div>
        </section>

        {data.available && <section className="live-proof-section" aria-labelledby="live-proof-title">
          <div className="live-proof-orbit proof-orbit-one" aria-hidden="true" />
          <div className="live-proof-orbit proof-orbit-two" aria-hidden="true" />
          <div className="container live-proof-inner">
            <div className="live-proof-kicker"><i /> Live production data</div>
            <h2 id="live-proof-title">This tiny leaderboard now has</h2>
            <div className="live-proof-value" aria-label={`${formatDollars(data.stats.confirmedBidCents)} in confirmed placement value`}>
              <span>$</span><strong>{formatDollarAmount(data.stats.confirmedBidCents)}</strong>
            </div>
            <p>in confirmed placement value on the board</p>
            <div className="live-proof-details">
              <span><strong>{formatDollars(data.stats.paidBidCents)}</strong> paid bids</span>
              <i aria-hidden="true" />
              <span><strong>{formatDollars(data.stats.creditBidCents)}</strong> founder credits</span>
              {data.stats.launchedAt && <><i aria-hidden="true" /><span>live for <strong><time dateTime={data.stats.launchedAt}>{elapsedTime(data.stats.launchedAt, data.generatedAt)}</time></strong></span></>}
            </div>
          </div>
        </section>}
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
            <div className="modal-kicker"><span>#{targetRank}</span> Placement checkout</div>
            <h2 id="modal-title">Put your product where<br />people look first.</h2>
            <p className="modal-description">Your position is based on your product’s confirmed bid total, including any promotional credit. For an existing listing, checkout charges only the difference needed to reach this total.</p>
            <div className="modal-summary"><div><span>Target position</span><strong>#{targetRank}</strong></div><div><span>Target total bid</span><strong>${formatInteger(bidAmount)}</strong></div><div><span>Current threshold</span><strong>${formatInteger(thresholdDollars)}</strong></div></div>
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
