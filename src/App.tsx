import { useState, useEffect } from 'react';
import {
  INITIAL_STOCKS,
  INITIAL_SECTORS,
  INITIAL_MARKET_SUMMARY,
  INITIAL_FLOORSHEET,
  generateCandles,
} from './data/nepseStocks';
import { StockItem, Candle, SectorSummary, MarketSummary, FloorSheetItem, BYOKConfig, ScraperStatus, LiveAuditReport } from './types/market';
import { computeTechnicalSnapshot } from './utils/technicalIndicators';
import { TopNav } from './components/TopNav';
import { MarketTickerBar } from './components/MarketTickerBar';
import { TradingViewChart } from './components/TradingViewChart';
import { StockDetailsSidebar } from './components/StockDetailsSidebar';
import { InstitutionalAnalyticsPanel } from './components/InstitutionalAnalyticsPanel';
import { MarketMoversView } from './components/MarketMoversView';
import { QuickSearchModal } from './components/QuickSearchModal';
import { SectorHeatmap } from './components/SectorHeatmap';
import { StockComparison } from './components/StockComparison';
import { AIAnalyticsView } from './components/AIAnalyticsView';
import { NepseAdminPortal } from './components/NepseAdminPortal';
import { ApiKeyModal } from './components/ApiKeyModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'terminal' | 'movers' | 'sectors' | 'compare' | 'ai' | 'admin'>(() => {
    if (typeof window !== 'undefined' && (window.location.hash === '#admin' || window.location.hash === '#nepse-admin')) {
      return 'admin';
    }
    return 'terminal';
  });
  const [stocks, setStocks] = useState<StockItem[]>(INITIAL_STOCKS);
  const [sectors, setSectors] = useState<SectorSummary[]>(INITIAL_SECTORS);
  const [marketSummary, setMarketSummary] = useState<MarketSummary>(INITIAL_MARKET_SUMMARY);
  const [floorSheet, setFloorSheet] = useState<FloorSheetItem[]>(INITIAL_FLOORSHEET);
  const [selectedStock, setSelectedStock] = useState<StockItem>(INITIAL_STOCKS[0]); // Default NEPSE Index
  const [marketCapCategories, setMarketCapCategories] = useState<Record<string, string[]>>({});
  const [liveAuditReport, setLiveAuditReport] = useState<LiveAuditReport | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  // Quick Search Palette triggered by typing any alphabetic key
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);
  const [quickSearchInitialQuery, setQuickSearchInitialQuery] = useState('');

  // BYOK AI Vault configuration from localStorage
  const [byokConfig, setByokConfig] = useState<BYOKConfig | null>(() => {
    try {
      const saved = localStorage.getItem('nepse_byok_vault');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  // Scraper scheduler state (defaults to 17:00 / 5:00 PM NPT)
  const [scheduledTime, setScheduledTime] = useState('17:00');
  const [scraperStatus, setScraperStatus] = useState<ScraperStatus>({
    isRunning: false,
    scheduledTime: '17:00',
    lastRunTimestamp: null,
    lastRunStatus: 'IDLE',
    nextRunCountdown: '',
    totalScripsScraped: 359,
    activeSource: 'Consolidated Institutional Market Feeds (Rank 1 - 3)',
    logs: [],
  });

  // Nepal Standard Time (UTC + 5:45)
  const [nepseClock, setNepseClock] = useState('');

  // Global keyboard shortcuts:
  // - [a-zA-Z] activates Instant Scrip Search
  // - Ctrl+Shift+A opens secret Admin console
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      // Secret Admin hotkey: Ctrl+Shift+A or Cmd+Shift+A
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setActiveTab('admin');
        return;
      }

      if (/^[a-zA-Z]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setQuickSearchInitialQuery(e.key.toUpperCase());
        setQuickSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen to hash changes for direct #admin / #nepse-admin navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#admin' || hash === '#nepse-admin') {
        setActiveTab('admin');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Fetch actual live scraped quotes and sectors on boot (with static fallback for GitHub Pages)
  useEffect(() => {
    const fetchInitialData = async () => {
      const fetchWithFallback = async (apiPath: string, fallbackPath: string) => {
        try {
          const r = await fetch(apiPath);
          if (r.ok) {
            const data = await r.json();
            if (data) return data;
          }
        } catch {}
        try {
          const r2 = await fetch(fallbackPath);
          if (r2.ok) {
            const data = await r2.json();
            if (data) return data;
          }
        } catch {}
        return null;
      };

      try {
        const [qData, sData, sumData, capData, auditData] = await Promise.all([
          fetchWithFallback('/api/market/quotes', './data/nepse_canonical_latest.json'),
          fetchWithFallback('/api/market/sectors', './data/nepse_sectors_latest.json'),
          fetchWithFallback('/api/market/summary', './data/nepse_summary_latest.json'),
          fetchWithFallback('/api/market/categories', './data/nepse_categories_latest.json'),
          fetchWithFallback('/api/scraper/audit-report', './data/audit_report_latest.json'),
        ]);

        if (qData?.stocks?.length > 0) {
          const liveStocks = qData.stocks.map((s: StockItem) => {
            const existing = INITIAL_STOCKS.find((is) => is.symbol === s.symbol);
            if (existing?.history && existing.history.length > 50) {
              return { ...s, history: existing.history };
            }
            if (s.history && s.history.length > 50) return s;
            const seed = s.symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0), 100);
            return {
              ...s,
              history: generateCandles(s.ltp || 350, 0.024, 0.03, seed),
            };
          });
          setStocks(liveStocks);
          // Default index should be NEPSE
          const defaultScrip = liveStocks.find((s: StockItem) => s.symbol === 'NEPSE') || liveStocks[0];
          setSelectedStock(defaultScrip);
        }

        if (sData?.sectors?.length > 0) {
          setSectors(sData.sectors);
        }

        if (sumData?.summary) {
          setMarketSummary(sumData.summary);
        }

        if (capData?.categories) {
          setMarketCapCategories(capData.categories);
        }

        if (auditData?.report) {
          setLiveAuditReport(auditData.report);
        }
      } catch (e) {
        console.warn('Initial live fetch fell back to static dataset:', e);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
      const nptDate = new Date(utcMs + 5.75 * 3600000);
      const hours = String(nptDate.getHours()).padStart(2, '0');
      const minutes = String(nptDate.getMinutes()).padStart(2, '0');
      const seconds = String(nptDate.getSeconds()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}:${seconds}`;
      setNepseClock(timeStr);

      // Auto-trigger scraper if current NPT time matches scheduledTime (e.g. 17:00:00)
      if (hours === scheduledTime.split(':')[0] && minutes === scheduledTime.split(':')[1] && seconds === '00') {
        if (!scraperStatus.isRunning) {
          handleRunScraper();
        }
      }
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [scheduledTime, scraperStatus.isRunning]);

  const handleSaveByok = (config: BYOKConfig | null) => {
    setByokConfig(config);
    if (config) {
      localStorage.setItem('nepse_byok_vault', JSON.stringify(config));
    } else {
      localStorage.removeItem('nepse_byok_vault');
    }
  };

  // Run scraper pipeline
  const handleRunScraper = async () => {
    setScraperStatus((prev) => ({
      ...prev,
      isRunning: true,
      logs: [
        {
          timestamp: new Date().toLocaleTimeString(),
          level: 'INFO',
          message: 'Connecting to Consolidated Ranked Exchange Providers...',
        },
      ],
    }));

    try {
      const res = await fetch('/api/scraper/run', { method: 'POST' });
      let data: any = {};
      if (res.ok) {
        data = await res.json();
      }

      if (data.stocks && data.stocks.length > 0) {
        setStocks(data.stocks);
      }
      if (data.sectors && data.sectors.length > 0) {
        setSectors(data.sectors);
      }
      if (data.marketSummary) {
        setMarketSummary(data.marketSummary);
      }
      if (data.report) {
        setLiveAuditReport(data.report);
      }

      setScraperStatus((prev) => ({
        ...prev,
        isRunning: false,
        lastRunTimestamp: data.timestamp || new Date().toLocaleTimeString(),
        lastRunStatus: 'SUCCESS',
        logs: data.logs || prev.logs,
      }));
    } catch (err: any) {
      setScraperStatus((prev) => ({
        ...prev,
        isRunning: false,
        lastRunStatus: 'FAILED',
        logs: [
          ...prev.logs,
          {
            timestamp: new Date().toLocaleTimeString(),
            level: 'ERROR',
            message: `Pipeline exception: ${err.message}`,
          },
        ],
      }));
    }
  };

  // Run live multi-provider audit
  const handleRunLiveAudit = async () => {
    setIsAuditing(true);
    try {
      const res = await fetch('/api/scraper/live-collect', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.report) setLiveAuditReport(data.report);
        if (data.stocks) setStocks(data.stocks);
        if (data.sectors) setSectors(data.sectors);
        if (data.marketSummary) setMarketSummary(data.marketSummary);
      }
    } catch (err: any) {
      console.error('Audit run failed:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleSelectScrip = (scrip: StockItem) => {
    const existing = stocks.find((s) => s.symbol === scrip.symbol);
    if (existing) {
      setSelectedStock(existing);
    } else {
      setSelectedStock(scrip);
    }
  };

  const handleHistoryLoaded = (bars: Candle[]) => {
    if (!bars || bars.length === 0) return;
    setSelectedStock((prev) => ({
      ...prev,
      history: bars,
    }));
    setStocks((prev) =>
      prev.map((s) => (s.symbol === selectedStock.symbol ? { ...s, history: bars } : s))
    );
  };

  const technicalSnapshot = computeTechnicalSnapshot(
    selectedStock.symbol,
    selectedStock.history && selectedStock.history.length > 0
      ? selectedStock.history
      : generateCandles(selectedStock.ltp || 350, 0.024, 0.03, 101)
  );
  const currentSector = sectors.find((sec) => sec.sector === selectedStock.sector);

  return (
    <div className="min-h-screen bg-[#0B0E14] text-neutral-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* 3-Zone Top Navigation */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (typeof window !== 'undefined') {
            window.location.hash = tab === 'admin' ? '#nepse-admin' : '';
          }
        }}
        openKeyModal={() => setIsKeyModalOpen(true)}
        hasPersonalKey={Boolean(byokConfig && byokConfig.apiKey)}
        nepseClock={nepseClock}
        onOpenSearch={() => {
          setQuickSearchInitialQuery('');
          setQuickSearchOpen(true);
        }}
      />

      {/* Financial Market Ticker Bar */}
      <MarketTickerBar
        summary={marketSummary}
        nextScraperTime={`5:00 PM NPT (${scheduledTime})`}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6">
        {/* TAB 1: TradingView Charting Terminal & Institutional Analytics */}
        {activeTab === 'terminal' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <TradingViewChart
                stock={selectedStock}
                onSelectScrip={handleSelectScrip}
                byokConfig={byokConfig}
                onOpenVault={() => setIsKeyModalOpen(true)}
                onHistoryLoaded={handleHistoryLoaded}
              />
              <InstitutionalAnalyticsPanel
                stock={selectedStock}
                candles={selectedStock.history || []}
                nepseCandles={stocks.find((s) => s.symbol === 'NEPSE')?.history || []}
                onSelectScrip={handleSelectScrip}
                byokConfig={byokConfig}
                onOpenVault={() => setIsKeyModalOpen(true)}
              />
            </div>
            <div className="lg:col-span-1">
              <StockDetailsSidebar
                stocks={stocks}
                selectedStock={selectedStock}
                onSelectStock={handleSelectScrip}
                technicals={technicalSnapshot}
                onNavigateToAI={() => setActiveTab('ai')}
                marketCapCategories={marketCapCategories}
              />
            </div>
          </div>
        )}

        {/* TAB 2: Market Movers (Top Gainers, Losers, Turnover, Volume, 52W Breakouts) */}
        {activeTab === 'movers' && (
          <MarketMoversView
            stocks={stocks}
            onSelectStock={handleSelectScrip}
            onNavigateToTerminal={() => setActiveTab('terminal')}
            byokConfig={byokConfig}
            onOpenVault={() => setIsKeyModalOpen(true)}
          />
        )}

        {/* TAB 3: Sector Heatmap */}
        {activeTab === 'sectors' && (
          <SectorHeatmap
            sectors={sectors}
            stocks={stocks}
            marketSummary={marketSummary}
            onSelectStock={handleSelectScrip}
            onNavigateToTerminal={() => setActiveTab('terminal')}
            onNavigateToCompare={() => setActiveTab('compare')}
            byokConfig={byokConfig}
            onOpenVault={() => setIsKeyModalOpen(true)}
          />
        )}

        {/* TAB 4: Stock Comparison */}
        {activeTab === 'compare' && (
          <StockComparison
            stocks={stocks}
            defaultSymbols={['NEPSE']}
            onSelectScrip={handleSelectScrip}
            onNavigateToTerminal={() => setActiveTab('terminal')}
            byokConfig={byokConfig}
            onOpenVault={() => setIsKeyModalOpen(true)}
          />
        )}

        {/* TAB 6: AI Technical Insights */}
        {activeTab === 'ai' && (
          <AIAnalyticsView
            selectedStock={selectedStock}
            technicals={technicalSnapshot}
            sectorSummary={currentSector}
            byokConfig={byokConfig}
            openKeyModal={() => setIsKeyModalOpen(true)}
          />
        )}

        {/* TAB 7: NEPSE Managerial & Admin Control Center */}
        {activeTab === 'admin' && (
          <NepseAdminPortal
            stocks={stocks}
            sectors={sectors}
            marketSummary={marketSummary}
            scraperStatus={scraperStatus}
            scheduledTime={scheduledTime}
            setScheduledTime={setScheduledTime}
            nepseClock={nepseClock}
            onRunScraper={handleRunScraper}
            liveAuditReport={liveAuditReport}
            onRunLiveAudit={handleRunLiveAudit}
            isAuditing={isAuditing}
            onClose={() => setActiveTab('terminal')}
          />
        )}
      </main>

      {/* BYOK API Key Vault Modal */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        byokConfig={byokConfig}
        onSaveConfig={handleSaveByok}
      />

      {/* Instant Scrip Search Modal (Pressing any [A-Z] key anywhere triggers this) */}
      <QuickSearchModal
        isOpen={quickSearchOpen}
        onClose={() => setQuickSearchOpen(false)}
        stocks={stocks}
        onSelectStock={(scrip) => {
          setSelectedStock(scrip);
          setActiveTab('terminal');
        }}
        initialQuery={quickSearchInitialQuery}
      />

      {/* Global Minimalist Footer */}
      <footer className="border-t border-neutral-800/80 bg-[#090d14] px-4 py-3 mt-10">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500">
          <div>
            NepsAi · Advanced Nepal Stock Exchange (NEPSE) Intelligence & TradingView Analytics
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://khanalrajesh.com.np"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors group"
            >
              <span className="text-xs">
                made with <span className="text-[#800020] font-bold text-sm select-none">ꨄ︎</span> by{' '}
                <span className="text-[#800020] group-hover:text-[#9B111E] font-semibold underline decoration-[#800020]/60 transition-colors">
                  @raazkhnl
                </span>
              </span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

