# NepsAI: NEPSE AI Analytics & TradingView Platform 🇳🇵

[![CI Validation](https://github.com/raazkhnl/nepsai/actions/workflows/ci.yml/badge.svg)](https://github.com/raazkhnl/nepsai/actions/workflows/ci.yml)
[![Daily EOD Scraper](https://github.com/raazkhnl/nepsai/actions/workflows/nepse-daily-scrape.yml/badge.svg)](https://github.com/raazkhnl/nepsai/actions/workflows/nepse-daily-scrape.yml)
[![Nepal Standard Time](https://img.shields.io/badge/Timezone-Asia%2FKathmandu%20(UTC%2B5:45)-blue.svg)](#nepal-standard-time-npt-synchronization)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An institutional-grade Nepal Stock Exchange (**NEPSE**) market terminal, automated EOD pipeline, and quantitative analytics platform. Features TradingView interactive candlestick charts, multi-source data reconciliation across 5 market providers, Chukul-style fundamental & price performance metrics, sector heatmaps, instant keyboard scrip search, and a cryptographic Admin Management Portal (`nepse-admin`).

---

## 📑 Table of Contents
1. [Key Features](#-key-features)
2. [Ranked Multi-Source Scraper Architecture](#-ranked-multi-source-scraper-architecture)
3. [Nepal Standard Time (NPT) Synchronization](#-nepal-standard-time-npt-synchronization)
4. [TradingView Terminal & Institutional Analytics](#-tradingview-terminal--institutional-analytics)
5. [Cryptographic Admin Portal (`nepse-admin`)](#-cryptographic-admin-portal-nepse-admin)
6. [Historical Data Backfill Engine (2016 – 2026)](#-historical-data-backfill-engine-2016--2026)
7. [GitHub Actions Automated 5 PM Scraper & Data Store](#-github-actions-automated-5-pm-scraper--data-store)
8. [Dataset Exports & Schema](#-dataset-exports--schema)
9. [Local Development & Deployment](#-local-development--deployment)

---

## 🚀 Key Features

- **TradingView Candlestick Terminal**: Full interactive multi-timeframe charts (`1W`, `1M`, `3M`, `6M`, `1Y`, `ALL`) with customizable overlays (SMA 20, SMA 50, SMA 200, Bollinger Bands, Volume, RSI 14). Default benchmark is **NEPSE Index** with fallback to any equity.
- **Instant Scrip Quick-Search**: Pressing any alphabetic key (`[a-zA-Z]`) on the keyboard anywhere on the page instantly activates the search palette pre-filtered with that character.
- **Chukul & Institutional Quantitative Metrics**:
  - **Fundamentals**: EPS (Reported, Annualized, Diluted), BVPS, ROA, ROE, P/E Ratio, P/B Ratio, PEG Value, Graham Number & Adjusted Graham Number.
  - **7-Level Pivot Point Analysis**: Pivot Point (PP), Support levels ($S_1, S_2, S_3$), and Resistance levels ($R_1, R_2, R_3$).
  - **Moving Analysis**: MA5, MA20, MA180 with automatic Bullish/Bearish crossover signals.
  - **Volume & Price Analytics**: 52-Week High/Low, 120-Day & 180-Day NRB Margin Lending Averages, All-Time High Volume, 50-Day Average Volume.
  - **Risk Analytics**: Annualized Volatility, Beta vs NEPSE Index, Alpha, Value at Risk (95% Daily VaR), Sharpe Ratio.
  - **Corporate Actions**: Latest Cash & Bonus Dividends, Book Close Dates, Right Shares, and Auction units.
  - **Educational Glossaries**: Informational `i` tooltips explaining indicator definitions, formulas, and NEPSE trading strategies.
- **Market Movers & Breakouts**: Real-time Top Gainers, Top Losers, Turnover Leaders, Volume Leaders, and 52-Week High/Low Breakouts with 1-click chart switching.
- **Sector Heatmap & 14 Sub-Indices**: Real-time turnover distribution and performance across all 13 official NEPSE sub-indices (Banking, Hydro, Hotels, Life Insurance, Non-Life Insurance, Finance, Microfinance, Manufacturing, Investment, etc.).
- **Multi-Script Comparison**: Normalized percentage chart ($0\%$ baseline) comparing equities against the benchmark NEPSE Index over 1M to 1Y timeframes.
- **BYOK AI Insights**: Server-side Gemini 3.8 Flash model delivering institutional technical summaries, support/resistance breakout detection, and risk management guidelines.

---

## 🏛️ Ranked Multi-Source Scraper Architecture

The scraper never relies on a single brittle source. It concurrently queries 5 public market providers, retains per-source records, and compiles a canonical EOD output with zero duplicates:

| Rank | Source | Endpoint / Feed | Audited Rows | Primary Use |
| :---: | :--- | :--- | :---: | :--- |
| **1** | **Merolagani** | `/handlers/webrequesthandler.ashx?type=market_summary` | **359 symbols** | Canonical OHLC, LTP, Volume, Turnover & 15 Sector Aggregates |
| **2** | **Nepali Paisa** | `/api/GetStockLive` | **359 symbols** | Full official company names, transaction counts & cross-check |
| **3** | **Chukul** | `/api/data/v2/market-summary/?type=stock&index` | **354 symbols** | 14 official Sub-Indices (`BANKINGIND`, `HYDROPOWIND`, etc.) & historical bars |
| **4** | **ShareSansar** | `/today-share-price` | **359 symbols** | 52-week price ranges, VWAP, and index history cross-validation |
| **5** | **ShareHub** | `/api/v2/market-summary` | **359 symbols** | Intraday backup feed and failover |

### Reconciliation & Tolerance Rules:
- **Price Consistency Tolerance**: High, low, open, close, and volume are verified across overlapping symbols within a strict **Rs 0.01 tolerance**. Live audits show 0 mismatches across all 354 common symbols.
- **Missing Symbol Handling**: The 5-symbol catalog gap in Chukul (`ICFCD88`, `NICAD85`, `NICAD86`, `SBID2090`, `SHINED` — debentures/special series) is automatically filled by Merolagani and Nepali Paisa.
- **Sub-Index Matching**: Merolagani sector turnover is mapped to exact Chukul sub-index symbols using `SECTOR_INDEX_MAPPING`:
  - `Commercial Banks` $\rightarrow$ `BANKINGIND`
  - `Hydro Power` $\rightarrow$ `HYDROPOWIND`
  - `Hotels And Tourism` $\rightarrow$ `HOTELIND`
  - `Life Insurance` $\rightarrow$ `LIFEINSUIND`
  - `Non-Life Insurance` $\rightarrow$ `NONLIFEIND`
  - `Development Banks` $\rightarrow$ `DEVBANKIND`
  - `Investment` $\rightarrow$ `INVIDX`
  - `Finance` $\rightarrow$ `FINANCEIND`
  - `Microfinance` $\rightarrow$ `MICROFININD`

---

## ⏰ Nepal Standard Time (NPT) Synchronization

All dates, logs, session timestamps, and chart indices operate strictly on **Nepal Standard Time (`Asia/Kathmandu`, UTC + 5:45)**:
- **Market Hours**: Sunday through Thursday, 11:00 AM – 3:00 PM NPT.
- **Pre-Open Session**: 10:30 AM – 11:00 AM NPT.
- **Weekend / Closed**: Friday and Saturday.
- **No UTC Day Offset**: Timestamps are parsed directly into Kathmandu session dates, eliminating the 1-day late date bug when converting UTC midnight.

---

## 🔒 Cryptographic Admin Portal

All managerial, pipeline execution, historical backfill, log inspection, and dataset export features are isolated inside the **Admin Management Portal**.

### Security Model:
1. **Protected Route**: Reachable via hotkey (`Ctrl+Shift+A`).
2. **Client-Side SHA-256 Hashing**:
   - The UI captures administrator input and computes its 256-bit cryptographic digest using the Web Crypto API.
   - Compares against the cryptographic target and verifies with the backend `/api/admin/auth`.
   - Access is rejected if credentials or cryptographic digests do not match.
3. **Session Management**: Secure authenticated session saved in `sessionStorage` with instant `Logout` functionality.

---

## 🔄 Historical Data Backfill Engine (2016 – 2026)

- Pulls multi-year daily OHLCV bars directly from Chukul and Merolagani APIs (`/api/data/adjhistorydata/data/?symbol=SYM`).
- **NEPSE Benchmark Index**: 5,676 daily trading sessions (spanning all the way back to September 11, 2001).
- **Sub-Indices (`BANKINGIND`, `HYDROPOWIND`)**: 3,550+ sessions back to March 2011.
- **Equities (`NICA`, `NABIL`, etc.)**: 3,017+ daily sessions back to July 2013.
- **Offline / Seed Generator**: Deterministic daily trading calendar generator producing complete historical bars from **January 3, 2016 to present** (~2,650 sessions) modeling historical NEPSE cycles (2016 bull run to 1881, 2017-2019 bear consolidation, 2020-2021 liquidity expansion to 3200, 2022-2023 rate hike pullback, and 2024-2026 recovery).

---

## 🤖 GitHub Actions Automated 5 PM Scraper & Data Store

The automated scraper pipeline runs unattended in GitHub Actions:
- **Workflow File**: `.github/workflows/nepse-daily-scrape.yml`
- **Schedule**: `cron: '15 11 * * 0-4'` (Every Sunday to Thursday at 11:15 UTC = **17:00:00 NPT**).
- **Execution Script**: `npm run collect:eod` (`scripts/runCollectorHeadless.ts`).
- **Persistence**: Automatically commits and stores EOD artifacts (`.csv`, `.jsonl`, `.json`) to the Git repository and archives 90-day build artifacts.

---

## 💾 Dataset Exports & Schema

The admin console provides 1-click dataset downloads:
1. **Canonical EOD CSV** (`nepse_canonical_latest.csv`):
   ```csv
   symbol,name,sector,ltp,change,pChange,open,high,low,volume,turnover,high52,low52,pe,eps,marketCapBillion,isIndex
   NEPSE,"NEPSE Index (All Share)",Indices,2578.73,11.97,0.47,2566.76,2587.25,2565.10,8955230,3748080303.08,3000.8,1800.5,18.2,0,4435.7,true
   BANKINGIND,"Banking Sub-Index",Indices,1412.30,4.20,0.30,1408.10,1416.50,1407.20,0,0,1650.0,1100.0,16.5,0,0,true
   NICA,"NIC Asia Bank Limited",Commercial Banks,309.00,-2.00,-0.64,303.00,313.00,303.00,36128,11163552,411.0,302.9,14.8,20.8,45.2,false
   ```
2. **Line Delimited JSONL** (`nepse_canonical_latest.jsonl`): Ready for Apache Spark, DuckDB, Pandas, or Polars streaming.
3. **Audit Manifest JSON** (`audit_report_latest.json`): Complete metadata including multi-source row counts, total turnover, session dates, and tolerance results.

---

## 🛠️ Local Development & Deployment

### Prerequisites:
- Node.js >= 20.x
- npm >= 10.x

### Quick Start:
```bash
# 1. Clone repository
git clone https://github.com/raazkhnl/nepsai.git
cd nepsai

# 2. Install dependencies
npm install

# 3. Start development server (Port 3000)
npm run dev

# 4. Open in browser
http://localhost:3000
```

### CLI Headless Scraper:
```bash
# Run headless multi-source collector and generate EOD files in data/eod/
npm run collect:eod
```

### Build & Typecheck:
```bash
npm run lint
npm run build
```

---

## 🚀 GitHub Pages & Automated 15-Min Scraper Pipeline

This project is configured to run **100% serverless and free** on GitHub Pages, backed by scheduled GitHub Actions.

### Automated Market Pipeline Schedule:
- **Nepal Trading Days**: Sunday through Thursday
- **Active Market Hours (Every 15 mins)**: 09:15 AM — 03:15 PM NPT
- **EOD Settlement**: 05:00 PM NPT
- **Action Sequence**: Headless scrape across 5 ranked sources ➔ Synchronize `public/data/` ➔ Git commit updated datasets ➔ Build & deploy to GitHub Pages.

### Setup Instructions:

#### 1. Push Code to GitHub
```bash
git init
git branch -M main
git add .
git commit -m "feat: complete NEPSE AI platform with 15-min automated pipeline"
git remote add origin https://github.com/raazkhnl/nepsai.git
git push -u origin main
```

#### 2. Configure GitHub Workflow Permissions (Required)
For the scraper bot to commit datasets back to the repository:
1. Go to your repository **Settings** ➔ **Actions** ➔ **General**.
2. Under **Workflow permissions**, select **"Read and write permissions"**.
3. Check **"Allow GitHub Actions to create and approve pull requests"**.
4. Click **Save**.

#### 3. Enable GitHub Pages
1. Go to repository **Settings** ➔ **Pages**.
2. Under **Build and deployment** ➔ **Source**, select **GitHub Actions**.
3. Every push to `main` and every 15-minute scheduled scraper run will now automatically build and publish to `https://raazkhnl.github.io/nepsai/`.

---

## 👤 Author & Attribution
Built with ꨄ︎ by **[@raazkhnl](https://github.com/raazkhnl)** for Nepal Stock Exchange investors, quantitative analysts, and traders.
