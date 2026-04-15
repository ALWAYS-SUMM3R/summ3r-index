# SUMM3R INDEX

> A public-facing interactive AI history and intelligence database — from philosophical origins to live prediction markets.

**Live site:** [summ3r.io](https://summ3r.io) · **Design:** Dark, data-terminal aesthetic (Bloomberg-inspired)

---

## Overview

SUMM3R INDEX is a chronological, multi-layer reference platform tracking the full arc of artificial intelligence — from foundational theory to live forecasts. It is built for a general but technically literate audience and updated daily via automated data pipelines.

---

## Navigation Structure

| Layer | Description |
|-------|-------------|
| `00 OVERVIEW` | Hero timeline, model benchmarks, live market snapshot |
| `01 ORIGINS & THEORY` | Key milestones from 1950–2012 (Turing, Perceptron, LSTM, etc.) |
| `02 MODERN ERA` | Major events from 2017–present (Transformers, GPT, regulation) |
| `03 PRESENT DAY` | Live AI news feed with relevance scoring |
| `04 FUTURE` | Aggregated predictions from Polymarket, Metaculus, Samotsvety, AI Futures Project, MIRI |

---

## Tech Stack

- **Frontend:** React (JSX), Base44 mini-app platform
- **Backend:** Deno (TypeScript) functions, Base44 entity database
- **Data sync:** Automated daily pull from Polymarket API (Predictions entity)
- **Version control:** GitHub (this repo)

---

## Repository Structure

```
summ3r-index/
├── pages/
│   └── Index.jsx              # Main app — all layers, navigation, UI
├── functions/
│   └── syncPredictions.ts     # Daily Polymarket sync backend function
└── entities/
    ├── OriginsEntry.json      # Layer 1 schema — Origins & Theory
    ├── ModernEraEntry.json    # Layer 2 schema — Modern Era
    ├── NewsUpdate.json        # Layer 3 schema — Present Day news feed
    ├── Prediction.json        # Layer 4 schema — Future predictions
    └── ModelBenchmark.json    # Overview — model benchmark data
```

---

## Data Sources

| Source | Type | Layer |
|--------|------|-------|
| Polymarket | Prediction market (crowd) | Future |
| Metaculus | Aggregated forecasting platform | Future |
| Samotsvety | Expert superforecaster group | Future |
| AI Futures Project | Expert elicitation | Future |
| MIRI | Research institute estimates | Future |
| Stanford HAI AI Index | Annual report | Modern Era / Overview |
| Epoch AI | Compute & scaling research | Overview |
| Papers With Code | Benchmark leaderboards | Overview |

---

## Automations

- **Daily Polymarket Sync** — runs every 24h, pulls live AI-related prediction markets and updates the Prediction entity

---

## Design Principles

- Bloomberg terminal aesthetic — high information density, monospace typography, dark background
- Color system: Yellow (`#FFF176`) for primary accents, green/red/blue/purple for categories
- No unnecessary whitespace — every pixel earns its place
- Chronological navigation — past → present → future

---

*Built by Jay · Powered by Base44 · Updated daily*
