import { useState, useEffect, useRef } from "react";
import { OriginsEntry, ModernEraEntry, ModelBenchmark, NewsUpdate, Prediction } from "@/api/entities";

// SUMM3R x Bloomberg Terminal Design System
const Y = "#FFF176";   // SUMM3R Yellow — primary highlight
const Y2 = "#FFF9C4";  // Lighter yellow
const Y3 = "#FFF17612"; // Yellow tint bg
const BG = "#03060D";   // Near-black terminal bg
const BG2 = "#060912";  // Card bg
const BG3 = "#0C1424";  // Elevated bg
const BORDER = "#1E2E50"; // Default border — slightly lighter
const MUTED = "#5A7A9E"; // Muted text — lightened for contrast
const TEXT = "#C8D8E8";  // Primary text
const TEXT2 = "#A8BED4"; // Secondary text — lightened for contrast

// Bloomberg-style accent palette
const ACCENTS = {
  cyan: "#00E5FF",
  orange: "#FF9800",
  purple: "#B39DDB",
  red: "#FF5252",
  green: "#69F0AE",
  blue: "#64B5F6",
  pink: "#F48FB1",
};

const CATEGORY_COLORS = {
  "Model Release": Y,
  "Research": ACCENTS.purple,
  "Market": ACCENTS.orange,
  "Infrastructure": ACCENTS.pink,
  "Policy": ACCENTS.blue,
  "Safety": ACCENTS.red,
  "Other": MUTED,
};

const IMPACT_COLOR = (score) => {
  if (score >= 10) return ACCENTS.red;
  if (score >= 9) return ACCENTS.orange;
  if (score >= 8) return Y;
  if (score >= 7) return ACCENTS.purple;
  return MUTED;
};

const ERA_ORDER = ["1940s", "1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s"];

const NAV_ITEMS = [
  { key: "home",        label: "OVERVIEW" },
  { key: "origins",     label: "ORIGINS & THEORY" },
  { key: "modern",      label: "MODERN ERA" },
  { key: "feed",        label: "PRESENT DAY" },
  { key: "predictions", label: "FUTURE" },
];

const TIMELINE_HIGHLIGHTS = [
  { year: "1943", title: "McCulloch-Pitts Neuron",     era: "ORIGINS", layer: "origins" },
  { year: "1950", title: "Turing Test",                era: "ORIGINS", layer: "origins" },
  { year: "1956", title: "Dartmouth Conference",        era: "ORIGINS", layer: "origins" },
  { year: "1958", title: "Perceptron",                  era: "ORIGINS", layer: "origins" },
  { year: "1966", title: "ELIZA Chatbot",               era: "ORIGINS", layer: "origins" },
  { year: "1969", title: "First AI Winter",             era: "ORIGINS", layer: "origins" },
  { year: "1974", title: "MYCIN Expert System",         era: "ORIGINS", layer: "origins" },
  { year: "1986", title: "Backpropagation Revival",     era: "ORIGINS", layer: "origins" },
  { year: "1997", title: "Deep Blue vs Kasparov",       era: "ORIGINS", layer: "origins" },
  { year: "1997", title: "LSTM Introduced",             era: "ORIGINS", layer: "origins" },
  { year: "2007", title: "ImageNet Created",            era: "ORIGINS", layer: "origins" },
  { year: "2012", title: "AlexNet Breakthrough",        era: "MODERN",  layer: "modern" },
  { year: "2016", title: "AlphaGo vs Lee Sedol",        era: "MODERN",  layer: "modern" },
  { year: "2017", title: "Transformer Architecture",    era: "MODERN",  layer: "modern" },
  { year: "2018", title: "BERT & GPT-1",                era: "MODERN",  layer: "modern" },
  { year: "2020", title: "GPT-3 / AlphaFold 2",         era: "MODERN",  layer: "modern" },
  { year: "2022", title: "ChatGPT Launch",              era: "MODERN",  layer: "modern" },
  { year: "2023", title: "GPT-4 / Open Source Wars",    era: "MODERN",  layer: "modern" },
  { year: "2024", title: "Multimodal Era",              era: "MODERN",  layer: "modern" },
  { year: "2025", title: "DeepSeek / Stargate",         era: "MODERN",  layer: "modern" },
  { year: "2026", title: "Agentic AI Dominance",        era: "NOW",     layer: "feed" },
];

// ── Reusable terminal-style label ──────────────────────────────────────────
function Tag({ children, color = Y, bg }) {
  return (
    <span style={{
      fontSize: 9, padding: "2px 8px", letterSpacing: 1.5,
      border: `1px solid ${color}55`,
      color,
      background: bg || `${color}10`,
      fontFamily: "inherit",
      whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

// ── Section header ─────────────────────────────────────────────────────────
function SectionHeader({ layer, title, desc }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <Tag color={Y}>{layer}</Tag>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${Y}30, transparent)` }} />
        <span style={{ fontSize: 9, color: MUTED, letterSpacing: 2 }}>
          {new Date().toISOString().slice(0, 10).replace(/-/g, ".")}
        </span>
      </div>
      <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: 3 }}>{title}</h2>
      {desc && <p style={{ color: TEXT2, fontSize: 12, lineHeight: 1.8, margin: 0 }}>{desc}</p>}
    </div>
  );
}

// ── Cross-layer link badge ────────────────────────────────────────────────
function CrossLayerBadge({ label, count, color, onClick }) {
  return (
    <span
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        fontSize: 8, padding: "2px 8px", letterSpacing: 1.2, cursor: onClick ? "pointer" : "default",
        border: `1px solid ${color}66`, color, background: `${color}12`,
        transition: "background 0.15s",
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.background = `${color}22`; }}
      onMouseLeave={e => { if (onClick) e.currentTarget.style.background = `${color}12`; }}
    >
      ⟶ {label}
      {count != null && <span style={{ fontWeight: 700 }}>{count}</span>}
    </span>
  );
}

// ── Stat box (Bloomberg-style data cell) ───────────────────────────────────
function StatBox({ label, value, color = Y, sub }) {
  return (
    <div style={{
      border: `1px solid ${BORDER}`,
      background: BG2,
      padding: "14px 18px",
      minWidth: 120,
    }}>
      <div style={{ fontSize: 9, color: MUTED, letterSpacing: 2, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {sub && <div style={{ fontSize: 9, color: MUTED, marginTop: 4, letterSpacing: 1 }}>{sub}</div>}
    </div>
  );
}

export default function App() {
  const [page, setPage]                   = useState("home");
  const [origins, setOrigins]             = useState([]);
  const [modern, setModern]               = useState([]);
  const [benchmarks, setBenchmarks]       = useState([]);
  const [news, setNews]                   = useState([]);
  const [predictions, setPredictions]     = useState([]);
  const [predFilter, setPredFilter]       = useState("All");
  const [filter, setFilter]               = useState("All");
  const [benchmarkFilter, setBenchmarkFilter] = useState("All");
  const [loading, setLoading]             = useState(true);
  const [pageLoading, setPageLoading]     = useState(false);
  const [loaded, setLoaded]               = useState({ home: false, origins: false, modern: false, feed: false, predictions: false });
  const [expandedId, setExpandedId]       = useState(null);
  const [hoveredTl, setHoveredTl]         = useState(null);
  const [tick, setTick]                   = useState(0);
  const timelineRef                       = useRef(null);
  const isDragging                        = useRef(false);
  const startX                            = useRef(0);
  const scrollLeft                        = useRef(0);

  // Clock tick for terminal feel
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Home page fast load: benchmarks + counts for stat boxes + feed/predictions data
  useEffect(() => {
    Promise.all([
      ModelBenchmark.list(),
      NewsUpdate.list("-published_date"),
      Prediction.list("-volume"),
    ]).then(([b, n, p]) => {
      setBenchmarks(b);
      setNews(n);
      setPredictions(p);
      setLoading(false);
      setLoaded(prev => ({ ...prev, home: true, feed: true, predictions: true }));
    });
  }, []);

  // Lazy-load per page on navigation
  const navigateTo = (key) => {
    setPage(key);
    setFilter("All");
    if (loaded[key]) return;
    setPageLoading(true);
    if (key === "origins") {
      OriginsEntry.list().then(o => {
        setOrigins(o);
        setLoaded(prev => ({ ...prev, origins: true }));
        setPageLoading(false);
      });
    } else if (key === "modern") {
      ModernEraEntry.list().then(m => {
        setModern(m.sort((a, b) => a.year - b.year));
        setLoaded(prev => ({ ...prev, modern: true }));
        setPageLoading(false);
      });
    } else {
      setPageLoading(false);
    }
  };


  const onMouseDown = (e) => {
    isDragging.current = true;
    startX.current = e.pageX - timelineRef.current.offsetLeft;
    scrollLeft.current = timelineRef.current.scrollLeft;
    timelineRef.current.style.cursor = "grabbing";
  };
  const onMouseUp = () => {
    isDragging.current = false;
    if (timelineRef.current) timelineRef.current.style.cursor = "grab";
  };
  const onMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - timelineRef.current.offsetLeft;
    timelineRef.current.scrollLeft = scrollLeft.current - (x - startX.current) * 1.5;
  };

  const categories   = ["All", "Model Release", "Research", "Market", "Infrastructure", "Policy"];
  const benchmarkTypes = ["All", "MMLU", "GPQA", "MATH", "HumanEval", "Arena ELO"];
  const filteredModern = filter === "All" ? modern : modern.filter(e => e.category === filter);
  const filteredBenchmarks = benchmarkFilter === "All" ? benchmarks : benchmarks.filter(b => b.benchmark === benchmarkFilter);

  const groupedOrigins = ERA_ORDER.reduce((acc, era) => {
    const items = origins.filter(o => o.era === era);
    if (items.length) acc[era] = items;
    return acc;
  }, {});

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "'Courier New', 'Lucida Console', monospace" }}>


      {/* ── STICKY HEADER WRAPPER (yellow bar + nav) ───────────────────────── */}
      <div style={{ position: "sticky", top: 0, zIndex: 200 }}>

        {/* Top status bar */}
        <div style={{
          background: Y, color: "#000",
          padding: "3px 16px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          fontSize: 10, fontWeight: 700, letterSpacing: 2,
        }}>
          <span>SUMM3R AI INDEX  ◈  INTELLIGENCE DATABASE  ◈  LIVE</span>
          <span>{dateStr}  {timeStr}</span>
        </div>

        {/* Main nav header */}
        <header style={{
          background: BG3,
          borderBottom: `1px solid ${BORDER}`,
          padding: "0 24px",
          display: "flex", alignItems: "stretch",
          height: 48,
        }}>
          {/* Logo */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            borderRight: `1px solid ${BORDER}`, paddingRight: 20, marginRight: 4,
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: Y, letterSpacing: 4 }}>SUMM3R</div>
              <div style={{ fontSize: 8, color: MUTED, letterSpacing: 3, marginTop: -2 }}>AI INDEX</div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ display: "flex", alignItems: "stretch", flex: 1 }}>
            {NAV_ITEMS.map((item, i) => (
              <button
                key={item.key}
                onClick={() => navigateTo(item.key)}
                style={{
                  background: page === item.key ? `${Y}18` : "transparent",
                  border: "none",
                  borderBottom: page === item.key ? `2px solid ${Y}` : "2px solid transparent",
                  borderRight: `1px solid ${BORDER}`,
                  color: page === item.key ? Y : TEXT2,
                  padding: "0 18px",
                  cursor: "pointer",
                  fontSize: 10,
                  letterSpacing: 1.5,
                  fontFamily: "inherit",
                  fontWeight: page === item.key ? 700 : 400,
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ color: MUTED, marginRight: 6, fontSize: 9 }}>{String(i).padStart(2, "0")}</span>
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right status */}
          <div style={{
            display: "flex", alignItems: "center", gap: 16,
            borderLeft: `1px solid ${BORDER}`, paddingLeft: 16,
            fontSize: 9, color: MUTED, letterSpacing: 1.5,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENTS.green, boxShadow: `0 0 6px ${ACCENTS.green}`, animation: "pulse 2s infinite" }} />
              <span style={{ color: ACCENTS.green }}>ONLINE</span>
            </div>
            <span>HKT</span>
          </div>
        </header>

      </div>{/* end sticky wrapper */}


      {/* ── PAGE CONTENT ───────────────────────────────────────────────────── */}
      <div>
        {loading && (
          <div style={{ textAlign: "center", padding: 80, color: Y, letterSpacing: 4, fontSize: 11 }}>
            &gt;&gt; LOADING INTELLIGENCE DATABASE...
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            HOME / OVERVIEW
        ══════════════════════════════════════════════════════════════════ */}
        {/* Per-page loading skeleton */}
        {pageLoading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 16 }}>
            <div style={{ width: 32, height: 32, border: `2px solid ${BORDER}`, borderTop: `2px solid ${Y}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <div style={{ fontSize: 9, color: MUTED, letterSpacing: 3 }}>LOADING DATA...</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Per-page loading spinner */}
        {pageLoading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 16 }}>
            <div style={{ width: 28, height: 28, border: `2px solid ${BORDER}`, borderTop: `2px solid ${Y}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <div style={{ fontSize: 9, color: MUTED, letterSpacing: 3 }}>LOADING DATA...</div>
            <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
          </div>
        )}

        {!loading && page === "home" && (
          <div>
            {/* Stat bar */}
            <div style={{
              background: BG2, borderBottom: `1px solid ${BORDER}`,
              padding: "12px 24px",
              display: "flex", gap: 0, overflowX: "auto",
            }}>
              {[
                { label: "ORIGINS ENTRIES",  value: origins.length,    color: Y },
                { label: "MODERN ERA",        value: modern.length,     color: ACCENTS.purple },
                { label: "BENCHMARKS",        value: benchmarks.length, color: ACCENTS.pink },
                { label: "PRESENT DAY",         value: news.length,       color: ACCENTS.cyan },
                { label: "YEARS TRACKED",     value: "83",              color: ACCENTS.orange },
                { label: "DATA ORACLES",      value: "9",               color: ACCENTS.blue },
                { label: "FUTURE",            value: predictions.length, color: ACCENTS.cyan },
              ].map(s => (
                <div key={s.label} style={{
                  borderRight: `1px solid ${BORDER}`, padding: "0 24px",
                  minWidth: 120, flexShrink: 0,
                }}>
                  <div style={{ fontSize: 8, color: MUTED, letterSpacing: 2, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Hero */}
            <div style={{
              padding: "48px 24px 32px",
              position: "relative", overflow: "hidden",
              borderBottom: `1px solid ${BORDER}`,
            }}>
              <div style={{
                position: "absolute", inset: 0,
                backgroundImage: `linear-gradient(${Y}06 1px, transparent 1px), linear-gradient(90deg, ${Y}06 1px, transparent 1px)`,
                backgroundSize: "48px 48px",
              }} />
              <div style={{
                position: "absolute", top: "20%", left: "5%",
                width: 500, height: 300,
                background: `radial-gradient(ellipse, ${Y}0A 0%, transparent 70%)`,
                pointerEvents: "none",
              }} />
              <div style={{ position: "relative", maxWidth: 700 }}>
                <div style={{ fontSize: 9, color: Y, letterSpacing: 5, marginBottom: 16 }}>
                  SUMM3R  ◈  AI INTELLIGENCE INDEX  ◈  EST. 2026
                </div>
                <h1 style={{ margin: "0 0 16px", fontSize: "clamp(26px,4vw,46px)", fontWeight: 700, color: "#fff", letterSpacing: 2, lineHeight: 1.15 }}>
                  FROM TURING<br />
                  <span style={{ color: Y }}>TO TOMORROW</span>
                </h1>
                <p style={{ color: TEXT2, fontSize: 13, lineHeight: 1.9, maxWidth: 520, margin: "0 0 28px" }}>
                  The living intelligence database tracking AI's complete evolution — from the first neuron models to frontier reasoning systems. Curated, structured, updated daily.
                </p>
                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={() => navigateTo("origins")} style={{
                    background: Y, border: "none", color: "#000",
                    padding: "10px 22px", cursor: "pointer",
                    fontSize: 10, letterSpacing: 2, fontWeight: 700, fontFamily: "inherit",
                  }}>EXPLORE TIMELINE ›</button>
                  <button onClick={() => navigateTo("feed")} style={{
                    background: "transparent", border: `1px solid ${BORDER}`,
                    color: TEXT2, padding: "10px 22px", cursor: "pointer",
                    fontSize: 10, letterSpacing: 2, fontFamily: "inherit",
                  }}>PRESENT DAY</button>
                </div>
              </div>
            </div>

            {/* ── HORIZONTAL TIMELINE ───────────────────────────────────────── */}
            <div style={{ borderBottom: `1px solid ${BORDER}`, background: BG2 }}>
              <div style={{
                padding: "10px 24px 6px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                borderBottom: `1px solid ${BORDER}`,
              }}>
                <div style={{ fontSize: 9, color: MUTED, letterSpacing: 3 }}>AI HISTORY TIMELINE  —  DRAG TO NAVIGATE  —  CLICK NODE TO EXPLORE</div>
                <div style={{ display: "flex", gap: 16 }}>
                  {[["ORIGINS", Y], ["MODERN ERA", ACCENTS.purple], ["NOW", ACCENTS.cyan]].map(([l, c]) => (
                    <div key={l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: c }} />
                      <span style={{ fontSize: 8, color: MUTED, letterSpacing: 1.5 }}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div
                ref={timelineRef}
                onMouseDown={onMouseDown}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                onMouseMove={onMouseMove}
                style={{
                  overflowX: "auto", overflowY: "visible",
                  cursor: "grab", scrollbarWidth: "none",
                  msOverflowStyle: "none", userSelect: "none",
                }}
              >
                <div style={{
                  display: "flex", alignItems: "center",
                  padding: "64px 80px 48px",
                  minWidth: "max-content",
                  position: "relative",
                }}>
                  {/* Timeline line */}
                  <div style={{
                    position: "absolute",
                    top: "calc(64px + 14px)",
                    left: 0, right: 0, height: 1,
                    background: `linear-gradient(90deg, transparent 0%, ${BORDER} 5%, ${Y}66 40%, ${ACCENTS.purple}66 75%, ${ACCENTS.cyan}66 95%, transparent 100%)`,
                  }} />

                  {TIMELINE_HIGHLIGHTS.map((event, i) => {
                    const isHovered = hoveredTl === i;
                    const isAbove = i % 2 === 0;
                    const eraColor = event.era === "ORIGINS" ? Y : event.era === "NOW" ? ACCENTS.cyan : ACCENTS.purple;

                    return (
                      <div
                        key={i}
                        onClick={() => navigateTo(event.layer)}
                        onMouseEnter={() => setHoveredTl(i)}
                        onMouseLeave={() => setHoveredTl(null)}
                        style={{
                          display: "flex", flexDirection: "column", alignItems: "center",
                          marginRight: 52, position: "relative", cursor: "pointer",
                          zIndex: isHovered ? 10 : 1,
                        }}
                      >
                        {/* Above label */}
                        <div style={{
                          height: 72, display: "flex", flexDirection: "column",
                          justifyContent: "flex-end", alignItems: "center", paddingBottom: 10,
                          transform: isAbove && isHovered ? "translateY(-3px)" : "none",
                          transition: "transform 0.2s",
                        }}>
                          {isAbove && (
                            <div style={{
                              fontSize: 10, fontWeight: isHovered ? 700 : 400,
                              color: isHovered ? eraColor : TEXT2,
                              letterSpacing: 0.5, whiteSpace: "nowrap",
                              maxWidth: 110, textAlign: "center", lineHeight: 1.4,
                              transition: "color 0.15s",
                            }}>{event.title}</div>
                          )}
                        </div>

                        {/* Node */}
                        <div style={{
                          width: isHovered ? 16 : 9, height: isHovered ? 16 : 9,
                          borderRadius: "50%",
                          background: isHovered ? eraColor : BG3,
                          border: `1.5px solid ${eraColor}`,
                          boxShadow: isHovered ? `0 0 14px ${eraColor}99, 0 0 30px ${eraColor}44` : "none",
                          transition: "all 0.15s", position: "relative", zIndex: 2,
                        }} />

                        {/* Year */}
                        <div style={{
                          fontSize: 9, color: isHovered ? eraColor : MUTED,
                          marginTop: 6, marginBottom: 6, letterSpacing: 1,
                          fontWeight: isHovered ? 700 : 400,
                          transition: "color 0.15s",
                          fontVariantNumeric: "tabular-nums",
                        }}>{event.year}</div>

                        {/* Below label */}
                        <div style={{
                          height: 56, display: "flex", flexDirection: "column",
                          alignItems: "center", paddingTop: 4,
                          transform: !isAbove && isHovered ? "translateY(3px)" : "none",
                          transition: "transform 0.2s",
                        }}>
                          {!isAbove && (
                            <div style={{
                              fontSize: 10, fontWeight: isHovered ? 700 : 400,
                              color: isHovered ? eraColor : TEXT2,
                              letterSpacing: 0.5, whiteSpace: "nowrap",
                              maxWidth: 110, textAlign: "center", lineHeight: 1.4,
                              transition: "color 0.15s",
                            }}>{event.title}</div>
                          )}
                        </div>

                        {/* Hover tooltip */}
                        {isHovered && (
                          <div style={{
                            position: "absolute",
                            top: isAbove ? -32 : "auto",
                            bottom: isAbove ? "auto" : -28,
                            left: "50%", transform: "translateX(-50%)",
                            background: BG3, border: `1px solid ${eraColor}`,
                            padding: "4px 10px", fontSize: 9, color: eraColor,
                            letterSpacing: 2, whiteSpace: "nowrap", zIndex: 20,
                          }}>
                            OPEN {event.layer.toUpperCase()} ›
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── LAYER INDEX TABLE (Bloomberg-style) ───────────────────────── */}
            <div style={{ padding: "24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 1, background: BORDER }}>
              {[
                { key: "origins",     code: "L1", label: "ORIGINS & THEORY", desc: "1940s–2017. Philosophical & mathematical foundations.",                    count: origins.length,     color: Y,              change: "FOUNDATIONAL" },
                { key: "modern",      code: "L2", label: "MODERN ERA",        desc: "2017–2025. Transformers, LLMs, and the intelligence explosion.",          count: modern.length,      color: ACCENTS.purple, change: "77 ENTRIES" },
                { key: "feed",        code: "L3", label: "PRESENT DAY",       desc: "2025–2026. Key developments and signals from the AI frontier.",           count: news.length,        color: ACCENTS.cyan,   change: "UPDATED" },
                { key: "predictions", code: "L4", label: "FUTURE",            desc: "Prediction markets & expert forecasts on where AI is heading.",           count: predictions.length, color: ACCENTS.green,  change: "LIVE" },
              ].map(card => (
                <div
                  key={card.key}
                  onClick={() => navigateTo(card.key)}
                  style={{
                    background: BG2, padding: "20px 24px", cursor: "pointer",
                    borderTop: `2px solid ${card.color}`,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = BG3}
                  onMouseLeave={e => e.currentTarget.style.background = BG2}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <Tag color={card.color}>{card.code}</Tag>
                    <span style={{ fontSize: 9, color: card.color, letterSpacing: 2 }}>{card.change}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: 1.5, marginBottom: 6 }}>{card.label}</div>
                  <div style={{ fontSize: 11, color: TEXT2, lineHeight: 1.7, marginBottom: 14 }}>{card.desc}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: `1px solid ${BORDER}`, paddingTop: 10 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: card.color, fontVariantNumeric: "tabular-nums" }}>{card.count}</span>
                    <span style={{ fontSize: 9, color: MUTED, letterSpacing: 1 }}>ENTRIES  ›</span>
                  </div>
                </div>
              ))}
            </div>

            {/* ── BENCHMARK PREVIEW (embedded on home) ─────────────────────── */}
            <div style={{ padding: "24px", borderTop: `1px solid ${BORDER}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Tag color={ACCENTS.pink}>MODEL BENCHMARKS</Tag>
                  <span style={{ fontSize: 9, color: MUTED, letterSpacing: 2 }}>{benchmarks.length} MODELS TRACKED</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {benchmarkTypes.map(b => (
                    <button key={b} onClick={() => setBenchmarkFilter(b)} style={{
                      fontSize: 8, padding: "3px 10px", letterSpacing: 1.5, cursor: "pointer",
                      border: `1px solid ${benchmarkFilter === b ? ACCENTS.pink : BORDER}`,
                      background: benchmarkFilter === b ? `${ACCENTS.pink}18` : "transparent",
                      color: benchmarkFilter === b ? ACCENTS.pink : MUTED,
                      fontFamily: "inherit",
                    }}>{b}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "48px 1fr 150px 110px 80px", gap: 12, padding: "7px 12px", fontSize: 8, color: MUTED, letterSpacing: 2, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, background: BG3 }}>
                <div>RNK</div><div>MODEL</div><div>DEVELOPER</div><div>BENCHMARK</div><div>SCORE</div>
              </div>
              {filteredBenchmarks.sort((a,b) => a.rank - b.rank).slice(0, 12).map((entry, i) => (
                <div key={entry.id} style={{
                  display: "grid", gridTemplateColumns: "48px 1fr 150px 110px 80px",
                  gap: 12, padding: "10px 12px",
                  borderBottom: `1px solid ${BORDER}`,
                  background: i % 2 === 0 ? "transparent" : `${BG3}88`,
                  alignItems: "center",
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: entry.rank === 1 ? Y : entry.rank <= 3 ? ACCENTS.pink : MUTED }}>#{entry.rank}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{entry.model_name}</div>
                    <div style={{ fontSize: 9, color: MUTED, marginTop: 1, fontVariantNumeric: "tabular-nums" }}>{entry.release_date}</div>
                  </div>
                  <div style={{ fontSize: 11, color: TEXT2 }}>{entry.developer}</div>
                  <Tag color={ACCENTS.purple}>{entry.benchmark}</Tag>
                  <div style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: entry.rank === 1 ? Y : ACCENTS.pink }}>{entry.score}</div>
                </div>
              ))}
              {filteredBenchmarks.length > 12 && (
                <div style={{ padding: "10px 12px", fontSize: 9, color: MUTED, borderBottom: `1px solid ${BORDER}` }}>
                  + {filteredBenchmarks.length - 12} more models — use filter tabs above to narrow view
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            ORIGINS & THEORY
        ══════════════════════════════════════════════════════════════════ */}
        {page === "origins" && !pageLoading && (
          <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: "calc(100vh - 90px)" }}>
            {/* Sidebar */}
            <div style={{ borderRight: `1px solid ${BORDER}`, background: BG2, padding: "20px 0" }}>
              <div style={{ padding: "0 16px 12px", fontSize: 8, color: MUTED, letterSpacing: 3, borderBottom: `1px solid ${BORDER}` }}>FILTER BY ERA</div>
              {ERA_ORDER.map(era => {
                const count = origins.filter(o => o.era === era).length;
                if (!count) return null;
                return (
                  <div key={era} style={{
                    padding: "10px 16px", cursor: "default",
                    borderBottom: `1px solid ${BORDER}08`,
                    display: "flex", justifyContent: "space-between",
                  }}>
                    <span style={{ fontSize: 11, color: TEXT2, letterSpacing: 1 }}>{era}</span>
                    <span style={{ fontSize: 10, color: Y, fontVariantNumeric: "tabular-nums" }}>{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Main */}
            <div style={{ padding: "28px 32px" }}>
              <SectionHeader layer="LAYER 01 — ORIGINS & THEORY" title="ORIGINS & THEORY" desc="The philosophical and scientific foundations — from the first neuron models to the transformer revolution." />
              {Object.entries(groupedOrigins).map(([era, items]) => (
                <div key={era} style={{ marginBottom: 40 }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 12, marginBottom: 14,
                    padding: "6px 0", borderBottom: `1px solid ${BORDER}`,
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: Y, letterSpacing: 3 }}>{era.toUpperCase()}</span>
                    <span style={{ fontSize: 9, color: MUTED }}>— {items.length} ENTRIES</span>
                  </div>
                  <div style={{ display: "grid", gap: 6 }}>
                    {items.map(entry => (
                      <div
                        key={entry.id}
                        onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                        style={{
                          border: `1px solid ${expandedId === entry.id ? Y + "66" : BORDER}`,
                          background: expandedId === entry.id ? Y3 : "transparent",
                          padding: "14px 18px", cursor: "pointer", transition: "all 0.15s",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: expandedId === entry.id ? Y : "#fff", marginBottom: 4, letterSpacing: 0.5 }}>
                              {entry.title}
                            </div>
                            <div style={{ fontSize: 10, color: TEXT2, letterSpacing: 0.5 }}>{entry.key_figure}</div>
                          </div>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end", maxWidth: 280 }}>
                            {entry.tags && entry.tags.split(",").map(tag => (
                              <Tag key={tag} color={ACCENTS.purple}>{tag.trim()}</Tag>
                            ))}
                          </div>
                        </div>
                        {expandedId === entry.id && (
                          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${Y}22` }}>
                            <p style={{ fontSize: 12, color: TEXT2, lineHeight: 1.9, margin: "0 0 12px" }}>{entry.significance}</p>
                            {entry.source_url && (
                              <a href={entry.source_url} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: Y, textDecoration: "none", letterSpacing: 1.5 }}>
                                SOURCE ›
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            MODERN ERA
        ══════════════════════════════════════════════════════════════════ */}
        {page === "modern" && !pageLoading && (
          <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: "calc(100vh - 90px)" }}>
            {/* Sidebar */}
            <div style={{ borderRight: `1px solid ${BORDER}`, background: BG2, padding: "20px 0" }}>
              <div style={{ padding: "0 16px 12px", fontSize: 8, color: MUTED, letterSpacing: 3, borderBottom: `1px solid ${BORDER}` }}>FILTER BY CATEGORY</div>
              {categories.map(c => (
                <div
                  key={c}
                  onClick={() => setFilter(c)}
                  style={{
                    padding: "10px 16px", cursor: "pointer",
                    borderBottom: `1px solid ${BORDER}08`,
                    background: filter === c ? `${CATEGORY_COLORS[c] || Y}12` : "transparent",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    borderLeft: filter === c ? `2px solid ${CATEGORY_COLORS[c] || Y}` : "2px solid transparent",
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ fontSize: 11, color: filter === c ? (CATEGORY_COLORS[c] || Y) : TEXT2, letterSpacing: 1 }}>{c}</span>
                  <span style={{ fontSize: 9, color: MUTED, fontVariantNumeric: "tabular-nums" }}>
                    {c === "All" ? modern.length : modern.filter(e => e.category === c).length}
                  </span>
                </div>
              ))}
            </div>

            {/* Main */}
            <div style={{ padding: "28px 32px" }}>
              <SectionHeader layer="LAYER 02 — MODERN ERA" title="MODERN ERA" desc="2017 to present — the transformer era, the LLM explosion, and the race to AGI." />
              {[...new Set(filteredModern.map(e => e.year))].sort().map(year => (
                <div key={year} style={{ marginBottom: 32 }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 12, marginBottom: 10,
                    padding: "6px 0", borderBottom: `1px solid ${BORDER}`,
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: 2, fontVariantNumeric: "tabular-nums" }}>{year}</span>
                    <span style={{ fontSize: 9, color: MUTED }}>— {filteredModern.filter(e => e.year === year).length} ENTRIES</span>
                  </div>
                  <div style={{ display: "grid", gap: 4 }}>
                    {filteredModern.filter(e => e.year === year).map(entry => (
                      <div
                        key={entry.id}
                        onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                        style={{
                          border: `1px solid ${expandedId === entry.id ? (CATEGORY_COLORS[entry.category] || Y) + "66" : BORDER}`,
                          background: expandedId === entry.id ? `${CATEGORY_COLORS[entry.category] || Y}08` : "transparent",
                          padding: "12px 16px", cursor: "pointer", transition: "all 0.15s",
                          display: "flex", gap: 14, alignItems: "flex-start",
                        }}
                      >
                        {/* Impact */}
                        <div style={{
                          minWidth: 32, height: 32, border: `1px solid ${IMPACT_COLOR(entry.impact_score)}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 12, fontWeight: 700, color: IMPACT_COLOR(entry.impact_score), flexShrink: 0,
                          fontVariantNumeric: "tabular-nums",
                        }}>{entry.impact_score}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 12, color: "#fff", marginBottom: 5, letterSpacing: 0.5 }}>{entry.milestone}</div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                            <Tag color={CATEGORY_COLORS[entry.category] || Y}>{entry.category?.toUpperCase()}</Tag>
                            <span style={{ fontSize: 10, color: TEXT2 }}>{entry.model_company}</span>
                          </div>
                          {expandedId === entry.id && entry.source_url && (
                            <div style={{ marginTop: 8 }}>
                              <a href={entry.source_url} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: Y, textDecoration: "none", letterSpacing: 1.5 }}>
                                SOURCE ›
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            MODEL BENCHMARKS
        ══════════════════════════════════════════════════════════════════ */}
        {page === "benchmarks" && (
          <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: "calc(100vh - 90px)" }}>
            {/* Sidebar */}
            <div style={{ borderRight: `1px solid ${BORDER}`, background: BG2, padding: "20px 0" }}>
              <div style={{ padding: "0 16px 12px", fontSize: 8, color: MUTED, letterSpacing: 3, borderBottom: `1px solid ${BORDER}` }}>FILTER BY BENCHMARK</div>
              {benchmarkTypes.map(b => (
                <div
                  key={b}
                  onClick={() => setBenchmarkFilter(b)}
                  style={{
                    padding: "10px 16px", cursor: "pointer",
                    borderBottom: `1px solid ${BORDER}08`,
                    background: benchmarkFilter === b ? `${ACCENTS.pink}12` : "transparent",
                    borderLeft: benchmarkFilter === b ? `2px solid ${ACCENTS.pink}` : "2px solid transparent",
                    display: "flex", justifyContent: "space-between",
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ fontSize: 11, color: benchmarkFilter === b ? ACCENTS.pink : TEXT2, letterSpacing: 1 }}>{b}</span>
                </div>
              ))}
            </div>

            {/* Main */}
            <div style={{ padding: "28px 32px" }}>
              <SectionHeader layer="LAYER 04 — MODEL BENCHMARKS" title="MODEL BENCHMARKS" desc="Frontier model rankings across MMLU, Arena ELO, MATH, HumanEval, and GPQA." />

              {/* Table header */}
              <div style={{
                display: "grid", gridTemplateColumns: "48px 1fr 160px 110px 80px 48px",
                gap: 12, padding: "8px 14px",
                fontSize: 8, color: MUTED, letterSpacing: 2,
                borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`,
                background: BG3,
              }}>
                <div>RNK</div><div>MODEL</div><div>DEVELOPER</div><div>BENCHMARK</div><div>SCORE</div><div>SRC</div>
              </div>

              {filteredBenchmarks.sort((a, b) => a.rank - b.rank).map((entry, i) => (
                <div key={entry.id} style={{
                  display: "grid", gridTemplateColumns: "48px 1fr 160px 110px 80px 48px",
                  gap: 12, padding: "11px 14px",
                  borderBottom: `1px solid ${BORDER}`,
                  background: i % 2 === 0 ? "transparent" : `${BG3}88`,
                  alignItems: "center",
                }}>
                  <div style={{
                    fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums",
                    color: entry.rank === 1 ? Y : entry.rank <= 3 ? ACCENTS.pink : MUTED,
                  }}>#{entry.rank}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{entry.model_name}</div>
                    <div style={{ fontSize: 9, color: MUTED, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{entry.release_date}</div>
                  </div>
                  <div style={{ fontSize: 11, color: TEXT2 }}>{entry.developer}</div>
                  <Tag color={ACCENTS.purple}>{entry.benchmark}</Tag>
                  <div style={{
                    fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums",
                    color: entry.rank === 1 ? Y : ACCENTS.pink,
                  }}>{entry.score}</div>
                  <div>{entry.source_url && <a href={entry.source_url} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: MUTED, textDecoration: "none" }}>›</a>}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            PRESENT DAY
        ══════════════════════════════════════════════════════════════════ */}
        {page === "feed" && (() => {
          const FEED_CAT_COLORS = {
            "Model Release":       Y,
            "Model Update":        ACCENTS.purple,
            "Research":            ACCENTS.blue,
            "Research/Breakthrough": ACCENTS.blue,
            "Business":            ACCENTS.orange,
            "Funding/Research":    ACCENTS.orange,
            "Partnership":         ACCENTS.cyan,
            "M&A":                 ACCENTS.pink,
            "Organization":        "#7986CB",
            "Product Sunset":      ACCENTS.red,
            "Infrastructure":      ACCENTS.green,
            "Framework Release":   ACCENTS.green,
            "Agent Product":       "#26C6DA",
            "Industry Event":      "#9CCC65",
            "Industry Initiative": ACCENTS.cyan,
            "Video/Model":         ACCENTS.purple,
            "Policy":              ACCENTS.blue,
            "Safety":              ACCENTS.red,
            "Market":              ACCENTS.orange,
          };

          const TRENDS = [
            { label: "OpenClaw Standardization",      desc: "OpenClaw hit 233K GitHub stars in 60 days — surpassing React's record. Now the de facto agent framework. Every major Chinese lab (Kimi, MiniMax, Zhipu) released compatible variants within weeks.", color: ACCENTS.green },
            { label: "Chinese Model Proliferation",   desc: "Ernie 5.0, GLM-5, Qwen 3.5, DeepSeek R2, MiniMax M2.5/M2.7 all launched within 8 weeks — many trained on Huawei Ascend chips, bypassing US export restrictions entirely.", color: ACCENTS.cyan },
            { label: "Cybersecurity Arms Race",       desc: "Claude Mythos Preview detects thousands of high-severity bugs — withheld from public. Project Glasswing recruits 50+ tech giants for defensive AI. First frontier model built for offense/defense.", color: ACCENTS.red },
            { label: "Self-Evolution Emerging",       desc: "MiniMax M2.7 claims recursive self-improvement, beating Claude Sonnet 4.6 on hallucination (34% vs 46%). 'Agent-Native Zero Trust' architectures entering production.", color: ACCENTS.purple },
            { label: "Efficiency Over Scale",         desc: "DeepSeek R2: 32B dense model outperforms 671B on reasoning, runs on a single RTX 4090, 70% cheaper. Algorithmic innovation now outpacing raw compute scaling.", color: Y },
            { label: "Infrastructure Consolidation",  desc: "SpaceX/xAI orbital data centers. LillyPod: 9,000+ petaflops for drug discovery. Microsoft MAI team. NVIDIA GTC declares enterprise agentic era officially open.", color: ACCENTS.orange },
          ];

          const allCats = ["All", ...new Set(news.map(n => n.category).filter(Boolean))];
          const filteredNews = (filter === "All" ? [...news] : [...news].filter(n => n.category === filter))
            .sort((a, b) => (b.published_date || "").localeCompare(a.published_date || ""));

          return (
          <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: "calc(100vh - 90px)" }}>
            {/* Sidebar */}
            <div style={{ borderRight: `1px solid ${BORDER}`, background: BG2, padding: "20px 0", overflowY: "auto" }}>
              <div style={{ padding: "0 16px 12px", fontSize: 8, color: MUTED, letterSpacing: 3, borderBottom: `1px solid ${BORDER}` }}>FILTER BY TYPE</div>
              {allCats.map(cat => {
                const catColor = FEED_CAT_COLORS[cat] || MUTED;
                const cnt = cat === "All" ? news.length : news.filter(n => n.category === cat).length;
                return (
                  <div key={cat} onClick={() => setFilter(cat)} style={{
                    padding: "9px 16px", cursor: "pointer",
                    borderBottom: `1px solid ${BORDER}08`,
                    background: filter === cat ? `${catColor}12` : "transparent",
                    borderLeft: filter === cat ? `2px solid ${catColor}` : "2px solid transparent",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    transition: "all 0.15s",
                  }}>
                    <span style={{ fontSize: 10, color: filter === cat ? catColor : TEXT2, letterSpacing: 0.8 }}>{cat}</span>
                    <span style={{ fontSize: 9, color: MUTED }}>{cnt}</span>
                  </div>
                );
              })}
              <div style={{ margin: "16px 0 0", borderTop: `1px solid ${BORDER}`, padding: "12px 16px" }}>
                <div style={{ fontSize: 8, color: MUTED, letterSpacing: 3, marginBottom: 10 }}>Q1–Q2 2026 STATS</div>
                {[
                  { label: "TOTAL ENTRIES",    value: news.length,                                                                   color: ACCENTS.cyan },
                  { label: "MODEL RELEASES",   value: news.filter(n => n.category === "Model Release").length,                       color: Y },
                  { label: "AVG IMPACT",       value: (news.reduce((a,b) => a+(b.significance||0), 0) / news.length).toFixed(1),     color: ACCENTS.orange },
                  { label: "HIGH IMPACT (9+)", value: news.filter(n => (n.significance||0) >= 9).length,                            color: ACCENTS.red },
                ].map(s => (
                  <div key={s.label} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 8, color: MUTED, letterSpacing: 1.5, marginBottom: 3 }}>{s.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: s.color, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Main */}
            <div style={{ padding: "28px 32px", overflowY: "auto" }}>
              <SectionHeader layer="LAYER 03 — PRESENT DAY" title="PRESENT DAY" desc="Jan 2026 onwards — model releases, market moves, infrastructure shifts and emerging patterns from the AI frontier." />

              {/* Trends grid */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 8, color: MUTED, letterSpacing: 3, marginBottom: 12 }}>Q1 2026 — KEY TRENDS</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: BORDER }}>
                  {TRENDS.map(t => (
                    <div key={t.label} style={{ background: BG2, padding: "14px 16px", borderTop: `2px solid ${t.color}` }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: t.color, letterSpacing: 1, marginBottom: 6 }}>{t.label}</div>
                      <div style={{ fontSize: 10, color: TEXT2, lineHeight: 1.75 }}>{t.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Table header */}
              <div style={{
                display: "grid", gridTemplateColumns: "90px 1fr 130px 60px 60px 40px",
                gap: 10, padding: "7px 14px",
                fontSize: 8, color: MUTED, letterSpacing: 2,
                borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`,
                background: BG3,
              }}>
                <div>DATE</div><div>MILESTONE</div><div>COMPANY</div><div>IMPACT</div><div>REL.</div><div>SRC</div>
              </div>

              {filteredNews.map((entry, i) => {
                const catColor = FEED_CAT_COLORS[entry.category] || MUTED;
                const impColor = entry.significance >= 10 ? ACCENTS.red : entry.significance >= 9 ? ACCENTS.orange : entry.significance >= 8 ? Y : TEXT2;
                return (
                  <div key={entry.id}
                    style={{ borderBottom: `1px solid ${BORDER}`, background: i % 2 === 0 ? "transparent" : `${BG3}66`, borderLeft: `2px solid ${catColor}33`, transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = `${BG3}CC`}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "transparent" : `${BG3}66`}
                  >
                    <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 130px 60px 60px 40px", gap: 10, padding: "13px 14px", alignItems: "start" }}>
                      <div style={{ fontSize: 10, color: MUTED, fontVariantNumeric: "tabular-nums", paddingTop: 2 }}>{entry.published_date}</div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 5 }}>{entry.title}</div>
                        <Tag color={catColor}>{entry.category?.toUpperCase()}</Tag>
                        {entry.summary && <p style={{ fontSize: 10, color: TEXT2, lineHeight: 1.75, margin: "7px 0 0" }}>{entry.summary}</p>}
                        {entry.tags && entry.tags.length > 0 && (() => {
                          const related = predictions.filter(p =>
                            p.tags && entry.tags.some(t => p.tags.includes(t))
                          );
                          return related.length > 0 ? (
                            <div style={{ marginTop: 8 }}>
                              <CrossLayerBadge
                                label="RELATED FUTURES"
                                count={related.length}
                                color={ACCENTS.green}
                                onClick={() => navigateTo("predictions")}
                              />
                            </div>
                          ) : null;
                        })()}
                      </div>
                      <div style={{ fontSize: 10, color: TEXT2, paddingTop: 2 }}>{entry.company}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: impColor, fontVariantNumeric: "tabular-nums", paddingTop: 2 }}>{entry.significance}<span style={{ fontSize: 8, color: MUTED }}>/10</span></div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: ACCENTS.cyan, fontVariantNumeric: "tabular-nums", paddingTop: 2 }}>{entry.relevance_score}<span style={{ fontSize: 8, color: MUTED }}>/10</span></div>
                      <div style={{ paddingTop: 2 }}>{entry.source_url && <a href={entry.source_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: MUTED, textDecoration: "none" }}>›</a>}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          );
        })()}
      </div>


        {/* ══════════════════════════════════════════════════════════════════
            FORWARD PREDICTIONS (L5)
        ══════════════════════════════════════════════════════════════════ */}
        {page === "predictions" && (() => {
          const polyPreds = predictions.filter(p => p.source === "Polymarket");
          const metaPreds = predictions.filter(p => p.source === "Metaculus");
          const filteredPreds = (predFilter === "All" ? predictions : predictions.filter(p => p.category === predFilter))
            .sort((a,b) => {
              // Sort by: Polymarket first (by volume), then Expert Aggregate by probability, then Crowd
              const order = { "Polymarket": 0, "Samotsvety": 1, "AI Futures Project": 2, "MIRI": 3, "Metaculus": 4 };
              const ao = order[a.source] ?? 5, bo = order[b.source] ?? 5;
              if (ao !== bo) return ao - bo;
              return (b.volume || b.probability || 0) - (a.volume || a.probability || 0);
            });

          const PRED_CAT_COLORS = {
            "Model Race": Y,
            "Releases": ACCENTS.purple,
            "Long-range": ACCENTS.cyan,
            "Market Events": ACCENTS.orange,
            "Safety": ACCENTS.red,
            "Policy": ACCENTS.blue,
            "Geopolitical": ACCENTS.pink,
            "Existential Risk": "#FF3D00",
          };

          const SOURCE_COLORS = {
            "Polymarket":       ACCENTS.green,
            "Metaculus":        ACCENTS.blue,
            "Samotsvety":       ACCENTS.purple,
            "AI Futures Project": ACCENTS.cyan,
            "MIRI":             ACCENTS.orange,
            "Good Judgment":    Y,
            "INFER":            ACCENTS.pink,
            "Hypermind":        "#7986CB",
          };

          const METHOD_LABELS = {
            "Prediction Market": "MARKET",
            "Crowd":             "CROWD",
            "Expert Collective": "EXPERTS",
            "Superforecaster":   "SUPERF.",
            "Single Expert":     "EXPERT",
            "Model Ensemble":    "MODEL",
          };

          return (
          <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: "calc(100vh - 90px)" }}>
            {/* Sidebar */}
            <div style={{ borderRight: `1px solid ${BORDER}`, background: BG2, padding: "20px 0", overflowY: "auto" }}>
              <div style={{ padding: "0 16px 12px", fontSize: 8, color: MUTED, letterSpacing: 3, borderBottom: `1px solid ${BORDER}` }}>FILTER BY CATEGORY</div>
              {["All", "Model Race", "Long-range", "Existential Risk", "Safety", "Policy", "Geopolitical", "Releases", "Market Events"].map(cat => {
                const catColor = PRED_CAT_COLORS[cat] || Y;
                const count = cat === "All" ? predictions.length : predictions.filter(p => p.category === cat).length;
                return (
                  <div key={cat} onClick={() => setPredFilter(cat)} style={{
                    padding: "10px 16px", cursor: "pointer",
                    borderBottom: `1px solid ${BORDER}08`,
                    background: predFilter === cat ? `${catColor}12` : "transparent",
                    borderLeft: predFilter === cat ? `2px solid ${catColor}` : "2px solid transparent",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    transition: "all 0.15s",
                  }}>
                    <span style={{ fontSize: 11, color: predFilter === cat ? catColor : TEXT2, letterSpacing: 1 }}>{cat}</span>
                    <span style={{ fontSize: 9, color: MUTED }}>{count}</span>
                  </div>
                );
              })}

              {/* Source breakdown */}
              <div style={{ margin: "16px 0 0", borderTop: `1px solid ${BORDER}` }}>
                <div style={{ padding: "12px 16px 8px", fontSize: 8, color: MUTED, letterSpacing: 3 }}>DATA SOURCES</div>
                {Object.entries({
                  "Polymarket":        { color: ACCENTS.green,  desc: "Real-money market. Live probability." },
                  "Metaculus":         { color: ACCENTS.blue,   desc: "Expert crowd forecasting platform." },
                  "Samotsvety":        { color: ACCENTS.purple, desc: "Elite collective. 2× better Brier scores." },
                  "AI Futures Project":{ color: ACCENTS.cyan,   desc: "AI 2027 scenarios. Ex-OpenAI researchers." },
                  "MIRI":              { color: ACCENTS.orange, desc: "Machine Intelligence Research Institute." },
                }).map(([src, meta]) => {
                  const cnt = predictions.filter(p => p.source === src).length;
                  if (!cnt) return null;
                  return (
                    <div key={src} style={{ padding: "7px 16px", borderBottom: `1px solid ${BORDER}08` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: meta.color }} />
                        <span style={{ fontSize: 9, fontWeight: 700, color: meta.color, letterSpacing: 1 }}>{src.toUpperCase()}</span>
                        <span style={{ fontSize: 9, color: MUTED, marginLeft: "auto" }}>{cnt}</span>
                      </div>
                      <div style={{ fontSize: 8, color: MUTED, lineHeight: 1.5, paddingLeft: 13 }}>{meta.desc}</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ padding: "12px 16px", margin: "8px 0 0", borderTop: `1px solid ${BORDER}` }}>
                <div style={{ fontSize: 8, color: MUTED, letterSpacing: 2, marginBottom: 6 }}>LAST SYNC</div>
                <div style={{ fontSize: 10, color: TEXT2 }}>{predictions[0]?.last_updated || "—"}</div>
              </div>
            </div>

            {/* Main content */}
            <div style={{ padding: "28px 32px", overflowY: "auto" }}>
              <SectionHeader
                layer="LAYER 05 — FUTURE"
                title="FUTURE"
                desc="Real-money prediction markets, elite expert aggregates, and scenario forecasts from Polymarket, Metaculus, Samotsvety, AI Futures Project, and MIRI. Updated continuously."
              />

              {/* Summary row */}
              <div style={{ display: "flex", gap: 1, marginBottom: 28, background: BORDER }}>
                {[
                  { label: "TOTAL SIGNALS",      value: predictions.length,                                                             color: ACCENTS.green },
                  { label: "MARKET SIGNALS",      value: polyPreds.length,                                                              color: Y },
                  { label: "EXPERT AGGREGATES",   value: predictions.filter(p => p.aggregation_method === "Expert Collective").length,  color: ACCENTS.purple },
                  { label: "TOTAL VOLUME",        value: "$" + (polyPreds.reduce((a,b) => a + (b.volume||0), 0) / 1000000).toFixed(1) + "M", color: ACCENTS.orange },
                ].map(s => (
                  <div key={s.label} style={{ flex: 1, background: BG2, padding: "14px 18px" }}>
                    <div style={{ fontSize: 8, color: MUTED, letterSpacing: 2, marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: s.color, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Table header */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 110px 130px 90px 70px",
                gap: 10, padding: "8px 14px",
                fontSize: 8, color: MUTED, letterSpacing: 2,
                borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`,
                background: BG3,
              }}>
                <div>QUESTION</div>
                <div>CATEGORY</div>
                <div>SIGNAL</div>
                <div>VOLUME / FORE.</div>
                <div>RESOLVES</div>
              </div>

              {(() => {
                const QUALITATIVE_SOURCES = ["Samotsvety", "AI Futures Project", "MIRI"];
                const quantPreds = filteredPreds.filter(p => !QUALITATIVE_SOURCES.includes(p.source));
                const qualPreds  = filteredPreds.filter(p => QUALITATIVE_SOURCES.includes(p.source));

                const renderRow = (entry, i, isQual) => {
                  const catColor = PRED_CAT_COLORS[entry.category] || MUTED;
                  const isPoly   = entry.source === "Polymarket";
                  const isMeta   = entry.source === "Metaculus";
                  const prob     = entry.probability;
                  const isMulti  = entry.forecast_type === "Multiple Choice";
                  const probColor = prob === null ? MUTED : prob >= 70 ? ACCENTS.green : prob >= 40 ? Y : prob >= 15 ? ACCENTS.orange : ACCENTS.red;
                  const srcColor  = SOURCE_COLORS[entry.source] || MUTED;

                  // Parse notes for multi-outcome breakdown
                  const multiBreakdown = isMulti && entry.notes && entry.notes.startsWith("LEADING:")
                    ? entry.notes.replace(/^LEADING:\s*/, "").split(" | ")
                    : null;

                  // Cross-layer: find related news events by tag
                  const relatedEvents = entry.tags && entry.tags.length > 0
                    ? news.filter(n => n.tags && entry.tags.some(t => n.tags.includes(t)))
                    : [];

                  return (
                    <div key={entry.id} style={{
                      borderBottom: `1px solid ${BORDER}`,
                      background: i % 2 === 0 ? "transparent" : `${BG3}88`,
                      padding: "14px",
                      borderLeft: `2px solid ${isQual ? srcColor + "55" : isPoly ? ACCENTS.green + "44" : ACCENTS.blue + "22"}`,
                    }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 130px 90px 70px", gap: 10, alignItems: "start" }}>
                        {/* Title + badges */}
                        <div>
                          <a href={entry.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", marginBottom: 4, lineHeight: 1.4 }}>{entry.title}</div>
                          </a>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 8, padding: "1px 6px", letterSpacing: 1, border: `1px solid ${srcColor}55`, color: srcColor, background: `${srcColor}10` }}>
                              {entry.source.toUpperCase()}
                            </span>
                            {entry.forecast_type && (
                              <span style={{ fontSize: 8, padding: "1px 6px", letterSpacing: 1,
                                border: `1px solid ${isQual ? srcColor + "44" : MUTED + "44"}`,
                                color: isQual ? srcColor : MUTED, background: "transparent" }}>
                                {entry.forecast_type.toUpperCase()}
                              </span>
                            )}
                            {entry.aggregation_method && (
                              <span style={{ fontSize: 8, padding: "1px 6px", letterSpacing: 1, border: `1px solid ${MUTED}33`, color: MUTED, background: "transparent" }}>
                                {METHOD_LABELS[entry.aggregation_method] || entry.aggregation_method}
                              </span>
                            )}
                            {relatedEvents.length > 0 && (
                              <CrossLayerBadge
                                label="RELATED EVENTS"
                                count={relatedEvents.length}
                                color={ACCENTS.cyan}
                                onClick={() => navigateTo("feed")}
                              />
                            )}
                          </div>
                          {/* Multi-outcome breakdown */}
                          {multiBreakdown && (
                            <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {multiBreakdown.map((item, idx) => (
                                <span key={idx} style={{
                                  fontSize: 8, padding: "2px 7px", letterSpacing: 0.5,
                                  background: idx === 0 ? `${ACCENTS.green}18` : `${BG3}`,
                                  border: `1px solid ${idx === 0 ? ACCENTS.green + "55" : BORDER}`,
                                  color: idx === 0 ? ACCENTS.green : TEXT2,
                                }}>
                                  {idx === 0 ? "▶ " : ""}{item}
                                </span>
                              ))}
                            </div>
                          )}
                          {/* Qualitative notes (non-multi) */}
                          {isQual && !multiBreakdown && entry.notes && (
                            <div style={{ marginTop: 6, fontSize: 9, color: TEXT2, lineHeight: 1.5, maxWidth: 480 }}>
                              {entry.notes}
                            </div>
                          )}
                        </div>

                        {/* Category */}
                        <div><Tag color={catColor}>{entry.category}</Tag></div>

                        {/* Signal */}
                        <div>
                          {isQual ? (
                            <div>
                              {prob != null ? (
                                <>
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                    <span style={{ fontSize: 15, fontWeight: 700, color: probColor, fontVariantNumeric: "tabular-nums" }}>
                                      {(prob * (prob <= 1 ? 100 : 1)).toFixed(0)}%
                                    </span>
                                    <span style={{ fontSize: 8, color: srcColor, alignSelf: "flex-end" }}>EST.</span>
                                  </div>
                                  <div style={{ height: 3, background: `${probColor}22`, borderRadius: 1 }}>
                                    <div style={{ height: "100%", width: `${Math.max(prob <= 1 ? prob*100 : prob, 1)}%`, background: probColor, borderRadius: 1 }} />
                                  </div>
                                </>
                              ) : (
                                <span style={{ fontSize: 9, color: srcColor, letterSpacing: 1 }}>SCENARIO</span>
                              )}
                            </div>
                          ) : isPoly ? (
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <span style={{ fontSize: 15, fontWeight: 700, color: probColor, fontVariantNumeric: "tabular-nums" }}>
                                  {prob != null ? prob + "%" : "—"}
                                </span>
                                <span style={{ fontSize: 8, color: MUTED, alignSelf: "flex-end" }}>{isMulti ? "LEAD" : "YES"}</span>
                              </div>
                              <div style={{ height: 3, background: `${probColor}22`, borderRadius: 1 }}>
                                <div style={{ height: "100%", width: `${Math.max(prob||0,1)}%`, background: probColor, borderRadius: 1 }} />
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <span style={{ fontSize: 15, fontWeight: 700, color: probColor, fontVariantNumeric: "tabular-nums" }}>
                                  {prob != null ? (prob <= 1 ? (prob*100).toFixed(0) : prob) + "%" : "—"}
                                </span>
                                <span style={{ fontSize: 8, color: MUTED, alignSelf: "flex-end" }}>COMM.</span>
                              </div>
                              <div style={{ height: 3, background: `${probColor}22`, borderRadius: 1 }}>
                                <div style={{ height: "100%", width: `${Math.max(prob != null ? (prob <= 1 ? prob*100 : prob) : 0, 1)}%`, background: probColor, borderRadius: 1 }} />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Volume / Forecasters */}
                        <div>
                          {isPoly ? (
                            <div style={{ fontSize: 11, color: TEXT2, fontVariantNumeric: "tabular-nums" }}>
                              ${entry.volume >= 1000000 ? (entry.volume/1000000).toFixed(1) + "M" : entry.volume >= 1000 ? (entry.volume/1000).toFixed(0) + "K" : (entry.volume || "—")}
                            </div>
                          ) : isMeta ? (
                            <>
                              <div style={{ fontSize: 12, fontWeight: 700, color: ACCENTS.blue, fontVariantNumeric: "tabular-nums", marginBottom: 2 }}>
                                {entry.volume ? entry.volume.toLocaleString() : "—"}
                              </div>
                              <div style={{ fontSize: 8, color: MUTED, letterSpacing: 1 }}>FORECASTERS</div>
                            </>
                          ) : (
                            <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1 }}>QUALITATIVE</div>
                          )}
                        </div>

                        {/* Resolve date */}
                        <div style={{ fontSize: 9, color: MUTED, fontVariantNumeric: "tabular-nums" }}>
                          {isMeta && entry.url && entry.url !== "https://www.metaculus.com/questions/" ? (
                            <a href={entry.url} target="_blank" rel="noreferrer" style={{ fontSize: 9, color: ACCENTS.blue, textDecoration: "none", letterSpacing: 1 }}>VIEW ›</a>
                          ) : (
                            entry.end_date && entry.end_date !== "2200-01-01" && entry.end_date !== "2300-01-01" && entry.end_date !== "2101-06-15"
                              ? entry.end_date.slice(0,7)
                              : entry.end_date && entry.end_date > "2050-01-01" ? "OPEN-ENDED" : entry.end_date?.slice(0,7) || "—"
                          )}
                        </div>
                      </div>
                    </div>
                  );
                };

                return (
                  <>
                    {/* ── QUANTITATIVE SECTION ── */}
                    {quantPreds.map((entry, i) => renderRow(entry, i, false))}

                    {/* ── QUALITATIVE DIVIDER ── */}
                    {qualPreds.length > 0 && (
                      <div style={{ margin: "28px 0 0", borderTop: `1px solid ${BORDER}` }}>
                        <div style={{ padding: "12px 0 10px", display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ fontSize: 8, color: ACCENTS.purple, letterSpacing: 3, fontWeight: 700 }}>QUALITATIVE FORECASTS</span>
                          <span style={{ fontSize: 8, color: MUTED }}>— Expert aggregates & scenario models. No crowd market. Probabilities are author estimates.</span>
                        </div>
                        {/* Qualitative table header */}
                        <div style={{
                          display: "grid", gridTemplateColumns: "1fr 110px 130px 90px 70px",
                          gap: 10, padding: "8px 14px",
                          fontSize: 8, color: MUTED, letterSpacing: 2,
                          borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`,
                          background: BG3,
                        }}>
                          <div>QUESTION / SCENARIO</div>
                          <div>CATEGORY</div>
                          <div>SIGNAL</div>
                          <div>TYPE</div>
                          <div>HORIZON</div>
                        </div>
                        {qualPreds.map((entry, i) => renderRow(entry, i, true))}
                      </div>
                    )}
                  </>
                );
              })()}

              <div style={{ marginTop: 20, padding: "14px 0", borderTop: `1px solid ${BORDER}` }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={{ fontSize: 9, color: MUTED, lineHeight: 1.7 }}>
                    <span style={{ color: ACCENTS.green }}>◈ POLYMARKET</span> — Real-money prediction market. Probabilities represent crowd consensus backed by financial stakes. Synced daily at 09:00 HKT.
                  </div>
                  <div style={{ fontSize: 9, color: MUTED, lineHeight: 1.7 }}>
                    <span style={{ color: ACCENTS.blue }}>◈ METACULUS</span> — Expert crowd forecasting platform. Click any question to view live forecasts at metaculus.com. &nbsp;
                    <span style={{ color: ACCENTS.purple }}>◈ SAMOTSVETY / AI FUTURES / MIRI</span> — Expert aggregates & scenario models. Qualitative section below.
                  </div>
                </div>
              </div>
            </div>
          </div>
          );
        })()}

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: `1px solid ${BORDER}`,
        background: BG3,
        padding: "14px 24px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontSize: 9, color: MUTED, letterSpacing: 2,
      }}>
        <div>◈ SUMM3R AI INDEX  —  INTELLIGENCE DATABASE  —  HONGKONG · SWEDEN</div>
        <div>CIPHER  ◈  POWERED BY BASE44  ◈  {new Date().getFullYear()}</div>
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: ${BG}; }
        ::-webkit-scrollbar-thumb { background: ${Y}44; }
        body { margin: 0; }
      `}</style>
    </div>
  );
}
