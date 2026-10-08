# Technical Specifications & System Architecture Documentation

**Project**: NEPSE AI Analytics & TradingView Platform  
**Target Market**: Nepal Stock Exchange (NEPSE)  
**Timezone**: Asia/Kathmandu (UTC + 5:45)  
**Maintainer**: @raazkhnl  

---

## 1. Executive Summary

This application operates as a full-stack, enterprise-grade financial market intelligence platform for the Nepal Stock Exchange. The system combines:
1. Multi-source web scraping across 5 ranked market portals.
2. An automated EOD reconciliation engine enforcing strict cross-provider tolerance checks.
3. Lightweight-Charts v5 interactive charting with multi-indicator mathematical overlays.
4. Chukul-compatible fundamental and quantitative performance evaluation.
5. An isolated Cryptographic Administrative Portal protected by SHA-256 hashed authentication.
6. Continuous headless cron collection through GitHub Actions workflows.

---

## 2. Source Ranking & Data Hierarchy

In public financial web scraping, page accessibility does not equate to data integrity. Different market portals have differing strengths:

### 2.1 Provider Evaluation:
1. **Rank 1: Merolagani (`webrequesthandler.ashx?type=market_summary`)**
   - Serves 359 active traded symbols.
   - Provides individual LTP, Open, High, Low, Close, Traded Quantity, and Turnover.
   - Supplies 15 sector breakdown aggregates and total market turnover.
   - **Role**: Primary authoritative quote data source.

2. **Rank 2: Nepali Paisa (`/api/GetStockLive`)**
   - Serves 359 equities with exact registered legal company names.
   - Provides per-symbol transaction counts and percentage changes.
   - **Role**: Official symbol-to-name resolver and primary cross-check.

3. **Rank 3: Chukul (`/api/data/v2/market-summary/?type=stock&index`)**
   - Serves 354 stocks and 14 index series.
   - Serves adjusted and unadjusted daily candlestick histories back to 2001 (NEPSE) and 2011-2013 (equities).
   - Serves market capitalization categories (Very High, High, Mid, Low, Ultra-Low).
   - **Role**: Sub-indices feed and multi-year historical candlestick provider.

4. **Rank 4: ShareSansar (`/today-share-price`)**
   - Rich 52-week high/low and VWAP data.
   - Backward-paginated NEPSE index candlestick feed.
   - **Role**: 52-week validation and failover.

5. **Rank 5: ShareHub (`/api/v2/market-summary`)**
   - Serves live intraday script quotes and sub-indices.
   - **Role**: Secondary failover.

---

## 3. Reconciliation Logic & Tolerance

The canonical builder executes the following steps:
```
[Merolagani 359]   [Nepali Paisa 359]   [Chukul 354 + 14 Indices]
       │                   │                     │
       ▼                   ▼                     ▼
 ┌────────────────────────────────────────────────────────┐
 │           Cross-Source Tolerance Check                 │
 │  - Symbol keying (e.g. NICA, NABIL, NEPSE)             │
 │  - Absolute price delta tolerance: |P_mero - P_chukul|  │
 │    Threshold: <= Rs 0.01                               │
 └────────────────────────────────────────────────────────┘
                           │
                           ▼
 ┌────────────────────────────────────────────────────────┐
 │               Canonical EOD Generation                 │
 │  - 359 Equities + 14 Sub-Indices = 373 Instruments     │
 │  - Missing symbols gap fill from Rank 2 & Rank 1       │
 │  - Clean JSONL, CSV, and SQLite outputs                │
 └────────────────────────────────────────────────────────┘
```

---

## 4. Quantitative & Technical Indicator Formulations

### 4.1 7-Level Floor Pivot Points
Calculated daily from session High ($H$), Low ($L$), and Close ($C$):
- **Pivot Point (PP)**:
  $$PP = \frac{H + L + C}{3}$$
- **Resistance Levels**:
  $$R_1 = 2 \times PP - L$$
  $$R_2 = PP + (H - L)$$
  $$R_3 = H + 2 \times (PP - L)$$
- **Support Levels**:
  $$S_1 = 2 \times PP - H$$
  $$S_2 = PP - (H - L)$$
  $$S_3 = L - 2 \times (H - PP)$$

### 4.2 Moving Averages & Signals
- **MA5**: Short-term momentum ($\sum_{i=1}^{5} C_i / 5$).
- **MA20**: Institutional monthly trend filter ($\sum_{i=1}^{20} C_i / 20$).
- **MA180**: Half-year institutional baseline and margin lending gauge ($\sum_{i=1}^{180} C_i / 180$).
- **Signal**:
  - `BULLISH`: If $LTP > MA$
  - `BEARISH`: If $LTP < MA$

### 4.3 Risk & Institutional Statistics
- **Beta ($\beta$) vs NEPSE Index**:
  $$\beta = \frac{\text{Covariance}(R_{\text{stock}}, R_{\text{NEPSE}})}{\text{Variance}(R_{\text{NEPSE}})}$$
- **Alpha ($\alpha$)**:
  $$\alpha = R_{\text{stock}} - (\beta \times R_{\text{NEPSE}})$$
- **Value at Risk (95% Daily VaR)**:
  $$\text{VaR}_{95} = 1.645 \times \sigma_{\text{daily}} \times LTP$$
- **Graham Number**:
  $$\text{Graham No.} = \sqrt{22.5 \times \text{EPS} \times \text{BVPS}}$$

---

## 5. Security & Admin Authentication Specification

Managerial operations are separated from trader views:
- **Administrative Access**: Dedicated console for pipeline management, historical backfilling, and raw exports.
- **Client Protocol**: Web Crypto API `crypto.subtle.digest('SHA-256', text)` converts administrator input into a 64-character lowercase hexadecimal digest.
- **Server Verification**: `POST /api/admin/auth` enforces salted cryptographic hashing before issuing an authenticated session token.
- **Zero Exposure**: No credentials, hashes, or administrative links are exposed in public trader interfaces.

---

## 6. GitHub Actions Automation

- **Schedule**: `cron: '15 11 * * 0-4'` (11:15 UTC = 17:00 NPT, Sunday-Thursday)
- **Runner**: `ubuntu-latest`
- **Step Sequence**:
  1. Checkout code
  2. Setup Node.js 20
  3. `npm ci`
  4. `npm run collect:eod` (`scripts/runCollectorHeadless.ts`)
  5. Archive EOD datasets (`data/eod/*.csv`, `data/eod/*.jsonl`)
  6. Git commit and push updated data
