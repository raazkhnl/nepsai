export type SectorName =
  | 'Commercial Banks'
  | 'Development Banks'
  | 'Finance'
  | 'Hotels & Tourism'
  | 'Hotels And Tourism'
  | 'Hydro Power'
  | 'Investment'
  | 'Life Insurance'
  | 'Manufacturing & Processing'
  | 'Manufacturing And Processing'
  | 'Microfinance'
  | 'Mutual Funds'
  | 'Mutual Fund'
  | 'Non-Life Insurance'
  | 'Others'
  | 'Tradings'
  | 'Promotor Share'
  | 'Corporate Debentures'
  | 'Corporate Debenture'
  | string;

export interface Candle {
  time: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CompanyFundamentals {
  quarter: string; // e.g. "Q4 · 082/083"
  epsReported: number;
  epsAnnualized: number;
  dilutedEps: number;
  bvps: number; // Book value / Net worth per share
  roa: number; // Return on assets %
  roe: number; // Return on equity %
  pbRatio: number; // Price to book
  growthRate: number; // %
  pegValue: number; // PEG ratio
  grahamNumber: number; // sqrt(22.5 * EPS * BVPS)
  adjustedGrahamNumber: number;
  paidUpCapitalCrore: number; // NPR Crore
  totalMarketCapBillion: number; // NPR Billion
  floatCapBillion: number; // NPR Billion
  publicSharePct: number; // % e.g. 49%
  promoterSharePct: number; // % e.g. 51%
  shareRegistrar: string; // e.g. "NIC Asia Capital Limited"
  listedDate: string; // e.g. "2013-05-12"
  unlockingDate?: string; // e.g. "2027-02-15"
  capacityMW?: number; // for Hydropower scrips e.g. 456 MW
  costPerMWCrore?: number; // NPR Crore/MW e.g. 18.5
}

export interface AdvancedPriceAnalytics {
  avg120Days: number;
  avg180Days: number;
  high52Week: number;
  low52Week: number;
  ma5: number;
  ma5Signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  ma20: number;
  ma20Signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  ma50: number;
  ma50Signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  ma120: number;
  ma120Signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  ma180: number;
  ma180Signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  ma200: number;
  ma200Signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  s3: number;
  s2: number;
  s1: number;
  pivot: number;
  r1: number;
  r2: number;
  r3: number;
  alpha: number;
  beta: number;
  variance: number;
  standardDeviation: number;
  meanDailyReturn: number;
  sharpeRatio: number;
  var95: number; // Value at Risk 95%
  athVolume: number;
  high52WeekVolume: number;
  low52WeekVolume: number;
  avg50DayVolume: number;
}

export interface CorporateActions {
  latestDividend?: {
    fiscalYear: string;
    bonusSharePct: number;
    cashDividendPct: number;
    totalDividendPct: number;
    bookCloseDate: string;
  };
  rightShare?: {
    ratio: string;
    units: number;
    bookCloseDate: string;
    openingDate: string;
    closingDate: string;
  };
  auction?: {
    totalUnits: number;
    openingDate: string;
    closingDate: string;
  };
}

export interface StockItem {
  symbol: string;
  name: string;
  sector: SectorName;
  ltp: number;
  change: number;
  pChange: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  turnover: number;
  high52: number;
  low52: number;
  pe: number;
  eps: number;
  marketCapBillion: number;
  history: Candle[];
  isIndex?: boolean;
  marketCapCategory?: 'Very High' | 'High' | 'Mid' | 'Low' | 'Ultra-Low' | string;
  provider?: string;
  fundamentals?: CompanyFundamentals;
  advancedAnalytics?: AdvancedPriceAnalytics;
  corporateActions?: CorporateActions;
}

export interface LiveAuditReport {
  timestamp: string;
  sessionDate: string;
  merolaganiCount: number;
  nepaliPaisaCount: number;
  chukulCount: number;
  canonicalTotal: number;
  chukulMissingSymbols: string[];
  mismatchCountTolerance001: number;
  sectorCount: number;
  indicesCount: number;
  marketCapClassificationsCount: number;
  overallTurnoverNpr: number;
  overallVolume: number;
  overallTransactions: number;
  executionTimeMs: number;
}

export interface SectorSummary {
  sector: SectorName;
  indexValue: number;
  change: number;
  pChange: number;
  turnover: number;
  scripCount: number;
  advancers: number;
  decliners: number;
  unchanged: number;
  topGainer: { symbol: string; pChange: number };
}

export interface MarketSummary {
  nepseIndex: number;
  nepseChange: number;
  nepsePChange: number;
  sensitiveIndex: number;
  sensitiveChange: number;
  floatIndex: number;
  floatChange: number;
  totalTurnover: number;
  totalSharesTraded: number;
  totalTransactions: number;
  advancers: number;
  decliners: number;
  unchanged: number;
  marketStatus: 'OPEN' | 'CLOSED';
  lastUpdated: string;
}

export interface TechnicalIndicatorsResult {
  symbol: string;
  ltp: number;
  sma20: number;
  sma50: number;
  sma200: number;
  ema9: number;
  ema21: number;
  rsi14: number;
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  pivotPoints: {
    r2: number;
    r1: number;
    pivot: number;
    s1: number;
    s2: number;
  };
  trendSignal: 'Strong Bullish' | 'Bullish' | 'Neutral' | 'Bearish' | 'Strong Bearish';
  summary: string;
}

export interface FloorSheetItem {
  contractNo: string;
  symbol: string;
  buyerBroker: number;
  sellerBroker: number;
  quantity: number;
  rate: number;
  amount: number;
  time: string;
}

export interface ScraperLog {
  timestamp: string;
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR';
  message: string;
  source?: string;
}

export interface ScraperStatus {
  isRunning: boolean;
  scheduledTime: string; // e.g. "17:00" (5:00 PM NPT)
  lastRunTimestamp: string | null;
  lastRunStatus: 'SUCCESS' | 'FAILED' | 'IDLE';
  nextRunCountdown: string;
  totalScripsScraped: number;
  activeSource: string;
  logs: ScraperLog[];
}

export interface BYOKConfig {
  provider: 'gemini' | 'nvidia' | 'deepseek' | 'groq' | 'openrouter' | 'openai';
  apiKey: string;
  model: string;
  customEndpoint?: string;
}
