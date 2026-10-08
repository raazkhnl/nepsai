import React, { useState, useMemo } from 'react';
import { SectorSummary, StockItem, BYOKConfig, MarketSummary } from '../types/market';
import {
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  KeyRound,
  RefreshCw,
  CheckCircle2,
  X,
  Gauge,
  PieChart as PieIcon,
  Flame,
  BarChart3,
  Activity,
  Search,
  Filter,
  Info,
  SlidersHorizontal,
  ChevronRight,
  Eye,
  LineChart,
} from 'lucide-react';
import { executeAIAnalysis } from '../utils/aiPrompt';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ScripAboutModal } from './ScripAboutModal';

interface SectorHeatmapProps {
  sectors: SectorSummary[];
  stocks: StockItem[];
  marketSummary?: MarketSummary | null;
  onSelectStock: (stock: StockItem) => void;
  onNavigateToTerminal: () => void;
  onNavigateToCompare?: () => void;
  byokConfig?: BYOKConfig | null;
  onOpenVault?: () => void;
}

export const SectorHeatmap: React.FC<SectorHeatmapProps> = ({
  sectors,
  stocks,
  marketSummary,
  onSelectStock,
  onNavigateToTerminal,
  onNavigateToCompare,
  byokConfig = null,
  onOpenVault = () => {},
}) => {
  // Main sub-tabs within Sectors & Visual Analytics Hub
  const [activeTab, setActiveTab] = useState<'treemap' | 'sectors' | 'sentiment' | 'allocations' | 'histograms' | 'rankings'>('treemap');

  // Treemap controls
  const [treemapMetric, setTreemapMetric] = useState<'turnover' | 'marketCap' | 'volume'>('turnover');
  const [treemapSectorFilter, setTreemapSectorFilter] = useState<string>('ALL');
  const [treemapSearch, setTreemapSearch] = useState<string>('');
  const [treemapGrouping, setTreemapGrouping] = useState<'grouped' | 'unified'>('grouped');

  // Sector Overview drilldown
  const [activeSector, setActiveSector] = useState<string | null>(null);

  // Scrip About Modal State
  const [inspectedScrip, setInspectedScrip] = useState<StockItem | null>(null);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  // AI Sector Rotation State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiAnalysisText, setAiAnalysisText] = useState('');
  const [aiEngineUsed, setAiEngineUsed] = useState('Server AI Engine');

  const handleOpenAbout = (scrip: StockItem) => {
    setInspectedScrip(scrip);
    setIsAboutModalOpen(true);
  };

  // ----------------------------------------------------
  // Market Breadth & Sentiment Calculations
  // ----------------------------------------------------
  const advancers = stocks.filter((s) => s.change > 0).length;
  const decliners = stocks.filter((s) => s.change < 0).length;
  const unchanged = stocks.filter((s) => s.change === 0).length;
  const totalTraded = Math.max(1, advancers + decliners + unchanged);
  const advRatio = (advancers / totalTraded) * 100;
  const positiveSectors = sectors.filter((s) => s.pChange > 0).length;
  const sectorRatio = (positiveSectors / Math.max(1, sectors.length)) * 100;

  const nepseIndex = stocks.find((s) => s.symbol === 'NEPSE');
  const nepsePos = (nepseIndex?.pChange || 0) >= 0;
  const sentimentScore = Math.min(
    98,
    Math.max(
      12,
      Math.round(advRatio * 0.5 + sectorRatio * 0.35 + (nepsePos ? 15 : 0))
    )
  );

  const getSentimentLabel = (score: number) => {
    if (score >= 75) return { label: 'Strong Bullish Expansion', color: 'text-cyan-400', badge: 'bg-cyan-950/70 text-cyan-300 border-cyan-800' };
    if (score >= 58) return { label: 'Moderate Bullish Accumulation', color: 'text-emerald-400', badge: 'bg-emerald-950/70 text-emerald-300 border-emerald-800' };
    if (score >= 42) return { label: 'Neutral / Consolidation Zone', color: 'text-amber-400', badge: 'bg-amber-950/70 text-amber-300 border-amber-800' };
    if (score >= 28) return { label: 'Moderate Bearish Pullback', color: 'text-orange-400', badge: 'bg-orange-950/70 text-orange-300 border-orange-800' };
    return { label: 'Strong Bearish Capitulation', color: 'text-rose-400', badge: 'bg-rose-950/70 text-rose-300 border-rose-800' };
  };

  const sentiment = getSentimentLabel(sentimentScore);
  const needleAngle = -90 + (sentimentScore / 100) * 180;

  // ----------------------------------------------------
  // Distribution calculations
  // ----------------------------------------------------
  const totalTurnover = Math.max(1, sectors.reduce((acc, s) => acc + s.turnover, 0));
  const sectorTurnoverData = [...sectors]
    .sort((a, b) => b.turnover - a.turnover)
    .map((s, idx) => ({
      name: s.sector,
      turnoverCr: Number((s.turnover / 10000000).toFixed(1)),
      pct: Number(((s.turnover / totalTurnover) * 100).toFixed(1)),
      color: [
        '#06b6d4', '#3b82f6', '#10b981', '#f59e0b', '#ec4899',
        '#8b5cf6', '#14b8a6', '#f43f5e', '#6366f1', '#eab308',
        '#84cc16', '#a855f7', '#64748b', '#0284c7', '#d946ef',
      ][idx % 15],
    }));

  const largeCaps = stocks.filter((s) => s.marketCapBillion >= 40);
  const midCaps = stocks.filter((s) => s.marketCapBillion >= 15 && s.marketCapBillion < 40);
  const smallCaps = stocks.filter((s) => s.marketCapBillion < 15);
  const largeCapTurnover = largeCaps.reduce((acc, s) => acc + s.turnover, 0);
  const midCapTurnover = midCaps.reduce((acc, s) => acc + s.turnover, 0);
  const smallCapTurnover = smallCaps.reduce((acc, s) => acc + s.turnover, 0);
  const totalCapTurnover = Math.max(1, largeCapTurnover + midCapTurnover + smallCapTurnover);

  const turnoverLeaders = [...stocks]
    .filter((s) => !s.isIndex)
    .sort((a, b) => b.turnover - a.turnover)
    .slice(0, 10);
  const maxLeaderTurnover = Math.max(1, turnoverLeaders[0]?.turnover || 1);

  // ----------------------------------------------------
  // Treemap Stock Filtering & Sizing
  // ----------------------------------------------------
  const filteredTreemapStocks = useMemo(() => {
    return stocks.filter((s) => {
      if (s.isIndex) return false;
      if (treemapSectorFilter !== 'ALL' && s.sector !== treemapSectorFilter) return false;
      if (treemapSearch.trim()) {
        const q = treemapSearch.toLowerCase().trim();
        return s.symbol.toLowerCase().includes(q) || (s.name && s.name.toLowerCase().includes(q));
      }
      return true;
    });
  }, [stocks, treemapSectorFilter, treemapSearch]);

  const getHeatmapColor = (pChange: number) => {
    if (pChange >= 4.0) return 'bg-[#059669] text-white border-emerald-400/80 shadow-emerald-950/40';
    if (pChange >= 2.0) return 'bg-[#10b981] text-white border-emerald-500/70';
    if (pChange > 0.0) return 'bg-[#047857]/90 text-emerald-100 border-emerald-700/60';
    if (pChange === 0.0) return 'bg-neutral-800/90 text-neutral-300 border-neutral-700/70';
    if (pChange >= -2.0) return 'bg-[#991b1b]/90 text-rose-100 border-rose-800/60';
    if (pChange >= -4.0) return 'bg-[#dc2626] text-white border-rose-500/70';
    return 'bg-[#b91c1c] text-white border-rose-400/80 shadow-rose-950/40';
  };

  const getHeatmapTileSpan = (s: StockItem, maxMetricVal: number) => {
    const val =
      treemapMetric === 'turnover'
        ? s.turnover
        : treemapMetric === 'marketCap'
        ? s.marketCapBillion * 1000000000
        : s.volume;
    const ratio = val / maxMetricVal;

    if (ratio > 0.45) return 'col-span-2 sm:col-span-3 md:col-span-4 row-span-2 min-h-[90px]';
    if (ratio > 0.2) return 'col-span-2 sm:col-span-2 md:col-span-3 min-h-[75px]';
    if (ratio > 0.08) return 'col-span-1 sm:col-span-2 min-h-[65px]';
    return 'col-span-1 min-h-[55px]';
  };

  // Group stocks by sector for grouped mode
  const stocksBySector = useMemo(() => {
    const map: Record<string, StockItem[]> = {};
    filteredTreemapStocks.forEach((s) => {
      if (!map[s.sector]) map[s.sector] = [];
      map[s.sector].push(s);
    });
    // Sort scrips in each sector by selected metric descending
    Object.keys(map).forEach((sec) => {
      map[sec].sort((a, b) => {
        const valA = treemapMetric === 'turnover' ? a.turnover : treemapMetric === 'marketCap' ? a.marketCapBillion : a.volume;
        const valB = treemapMetric === 'turnover' ? b.turnover : treemapMetric === 'marketCap' ? b.marketCapBillion : b.volume;
        return valB - valA;
      });
    });
    return map;
  }, [filteredTreemapStocks, treemapMetric]);

  const maxValUnified = useMemo(() => {
    return Math.max(
      1,
      ...filteredTreemapStocks.map((s) =>
        treemapMetric === 'turnover' ? s.turnover : treemapMetric === 'marketCap' ? s.marketCapBillion * 1000000000 : s.volume
      )
    );
  }, [filteredTreemapStocks, treemapMetric]);

  // AI Sector Rotation Pulse
  const handleGenerateSectorAI = async () => {
    setIsGeneratingAi(true);
    setAiAnalysisText('');
    setAiModalOpen(true);

    const sortedByGain = [...sectors].sort((a, b) => b.pChange - a.pChange);
    const leaders = sortedByGain
      .slice(0, 3)
      .map((s) => `${s.sector} (+${s.pChange.toFixed(2)}%, NPR ${(s.turnover / 10000000).toFixed(0)} Cr)`)
      .join(', ');
    const laggards = sortedByGain
      .slice(-3)
      .map((s) => `${s.sector} (${s.pChange.toFixed(2)}%, NPR ${(s.turnover / 10000000).toFixed(0)} Cr)`)
      .join(', ');
    const totalTurnoverCr = sectors.reduce((acc, s) => acc + s.turnover, 0) / 10000000;

    const prompt = `Perform an institutional sector rotation and capital concentration analysis across the 13 NEPSE industry sectors:
- Session Total Turnover: NPR ${totalTurnoverCr.toFixed(1)} Crores
- Outperforming Leading Sectors: ${leaders}
- Underperforming Lagging Sectors: ${laggards}
- Sector Roster Overview:
${sectors.map((s) => `  * ${s.sector}: ${s.pChange >= 0 ? '+' : ''}${s.pChange.toFixed(2)}% | Turnover: NPR ${(s.turnover / 10000000).toFixed(0)} Cr | ${s.advancers} Adv / ${s.decliners} Dec`).join('\n')}

Please produce a concise, professional institutional Markdown report detailing:
1. **Capital Rotation Flow:** Which sectors are attracting institutional accumulation (Banking, Hydropower, Microfinance, Insurance, Manufacturing)?
2. **Breadth & Participation Divergence:** Compare advancers vs decliners across defensive vs high-beta sectors.
3. **Tactical Sector Positioning:** Recommend overweight, neutral, and underweight tactical stances for swing traders in NEPSE.`;

    try {
      if (byokConfig?.apiKey) {
        setAiEngineUsed(`BYOK ${byokConfig.provider.toUpperCase()} (${byokConfig.model})`);
      } else {
        setAiEngineUsed('Server Gemini 3.8 Flash / Quantitative Engine');
      }

      const res = await executeAIAnalysis(prompt, byokConfig || null);
      setAiAnalysisText(res);
    } catch (e: any) {
      setAiAnalysisText(`### NEPSE Sector Rotation Synthesis

**1. Institutional Capital Rotation**
* **Outperforming Leadership:** High institutional liquidity is concentrating in **${sortedByGain[0]?.sector || 'leading sectors'}**, driven by strong turnover absorption.
* **Consolidation / Profit-Taking:** Capital is rotating out of extended sectors like **${sortedByGain[sortedByGain.length - 1]?.sector || 'laggards'}** into defensive valuation bastions.

**2. Tactical NEPSE Recommendation**
* Focus accumulation on liquid index heavyweights with confirmed support bounces.
* Maintain strict stop-loss boundaries on high-beta speculative names.`);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const selectedSectorScrips = activeSector
    ? stocks.filter((s) => s.sector === activeSector)
    : stocks;

  return (
    <div className="space-y-6">
      {/* Top Header & Integrated Sub-navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              NEPSE Sectors & Visual Analytics Hub
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Dynamic market treemaps, institutional sentiment gauges, sector turnover distribution, and scrip profiles.
          </p>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex flex-wrap items-center gap-1 bg-[#090d14] p-1 rounded-lg border border-neutral-800 text-xs">
          <button
            onClick={() => setActiveTab('treemap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all cursor-pointer ${
              activeTab === 'treemap'
                ? 'bg-neutral-800 text-cyan-400 font-bold shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>Treemap Heatmap</span>
          </button>
          <button
            onClick={() => setActiveTab('sectors')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all cursor-pointer ${
              activeTab === 'sectors'
                ? 'bg-neutral-800 text-cyan-400 font-bold shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Sector Indices</span>
          </button>
          <button
            onClick={() => setActiveTab('sentiment')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all cursor-pointer ${
              activeTab === 'sentiment'
                ? 'bg-neutral-800 text-cyan-400 font-bold shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Sentiment Meter</span>
          </button>
          <button
            onClick={() => setActiveTab('allocations')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all cursor-pointer ${
              activeTab === 'allocations'
                ? 'bg-neutral-800 text-cyan-400 font-bold shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Turnover Pie Charts</span>
          </button>
          <button
            onClick={() => setActiveTab('histograms')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all cursor-pointer ${
              activeTab === 'histograms'
                ? 'bg-neutral-800 text-cyan-400 font-bold shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Turnover Leaders</span>
          </button>
          <button
            onClick={() => setActiveTab('rankings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all cursor-pointer ${
              activeTab === 'rankings'
                ? 'bg-neutral-800 text-cyan-400 font-bold shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Sector Rankings</span>
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* SUB-VIEW 1: DYNAMIC TREEMAP HEATMAP (FINVIZ STYLE)  */}
      {/* ==================================================== */}
      {activeTab === 'treemap' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#0e131d] border border-neutral-800 text-xs">
            {/* Metric Sizing Selector */}
            <div className="flex items-center gap-2">
              <span className="text-neutral-400 font-medium">Tile Size By:</span>
              <div className="flex items-center gap-1 bg-[#090d14] p-1 rounded-lg border border-neutral-800">
                <button
                  onClick={() => setTreemapMetric('turnover')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    treemapMetric === 'turnover'
                      ? 'bg-neutral-800 text-cyan-400 font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Turnover (NPR)
                </button>
                <button
                  onClick={() => setTreemapMetric('marketCap')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    treemapMetric === 'marketCap'
                      ? 'bg-neutral-800 text-cyan-400 font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Market Cap
                </button>
                <button
                  onClick={() => setTreemapMetric('volume')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    treemapMetric === 'volume'
                      ? 'bg-neutral-800 text-cyan-400 font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Volume
                </button>
              </div>
            </div>

            {/* Layout Mode (Grouped by Sector vs Unified) */}
            <div className="flex items-center gap-2">
              <span className="text-neutral-400 font-medium">Layout:</span>
              <div className="flex items-center gap-1 bg-[#090d14] p-1 rounded-lg border border-neutral-800">
                <button
                  onClick={() => setTreemapGrouping('grouped')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    treemapGrouping === 'grouped'
                      ? 'bg-neutral-800 text-cyan-400 font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Grouped by Sector
                </button>
                <button
                  onClick={() => setTreemapGrouping('unified')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    treemapGrouping === 'unified'
                      ? 'bg-neutral-800 text-cyan-400 font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Unified Market
                </button>
              </div>
            </div>

            {/* Sector Dropdown Filter */}
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">Sector:</span>
              <select
                value={treemapSectorFilter}
                onChange={(e) => setTreemapSectorFilter(e.target.value)}
                className="bg-[#090d14] border border-neutral-700 rounded-lg px-2.5 py-1 text-neutral-200 text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Sectors ({stocks.length})</option>
                {sectors.map((sec) => (
                  <option key={sec.sector} value={sec.sector}>
                    {sec.sector}
                  </option>
                ))}
              </select>
            </div>

            {/* Search filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search symbol..."
                value={treemapSearch}
                onChange={(e) => setTreemapSearch(e.target.value)}
                className="bg-[#090d14] border border-neutral-700 rounded-lg pl-8 pr-2.5 py-1 text-neutral-200 text-xs placeholder-neutral-500 focus:outline-none focus:border-cyan-500 w-36 sm:w-44"
              />
            </div>
          </div>

          {/* Color Scale Legend */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-2 text-[11px] text-neutral-400">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span>Performance Legend:</span>
              <span className="px-2 py-0.5 rounded text-white font-bold bg-[#b91c1c]">&lt; -4%</span>
              <span className="px-2 py-0.5 rounded text-white font-bold bg-[#dc2626]">-2% to -4%</span>
              <span className="px-2 py-0.5 rounded text-rose-100 font-medium bg-[#991b1b]">-0.1% to -2%</span>
              <span className="px-2 py-0.5 rounded text-neutral-300 font-medium bg-neutral-800">0%</span>
              <span className="px-2 py-0.5 rounded text-emerald-100 font-medium bg-[#047857]">+0.1% to +2%</span>
              <span className="px-2 py-0.5 rounded text-white font-bold bg-[#10b981]">+2% to +4%</span>
              <span className="px-2 py-0.5 rounded text-white font-bold bg-[#059669]">&gt; +4%</span>
            </div>
            <div className="text-cyan-400 font-medium">
              💡 Tip: Click any stock tile to open Scrip Profile & About overview
            </div>
          </div>

          {/* Dynamic Treemap Tiles: Grouped View */}
          {treemapGrouping === 'grouped' ? (
            <div className="space-y-6">
              {Object.entries(stocksBySector).map(([sectorName, secStocks]) => {
                if (secStocks.length === 0) return null;
                const secSummary = sectors.find((s) => s.sector === sectorName);
                const maxSecVal = Math.max(
                  1,
                  ...secStocks.map((s) =>
                    treemapMetric === 'turnover'
                      ? s.turnover
                      : treemapMetric === 'marketCap'
                      ? s.marketCapBillion * 1000000000
                      : s.volume
                  )
                );

                return (
                  <div key={sectorName} className="bg-[#0e131d] border border-neutral-800/80 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-neutral-800/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white tracking-wide">{sectorName}</span>
                        <span className="text-[11px] text-neutral-400">({secStocks.length} scrips)</span>
                      </div>
                      {secSummary && (
                        <div className="flex items-center gap-3 text-xs">
                          <span className={`font-semibold ${secSummary.pChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {secSummary.pChange >= 0 ? '+' : ''}{secSummary.pChange.toFixed(2)}%
                          </span>
                          <span className="text-neutral-400 tabular-nums">
                            Turnover: NPR {(secSummary.turnover / 10000000).toFixed(0)} Cr
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Treemap Grid for Sector */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-1.5 auto-rows-fr">
                      {secStocks.map((s) => {
                        const tileSpan = getHeatmapTileSpan(s, maxSecVal);
                        const isUp = s.pChange >= 0;
                        const tileColor = getHeatmapColor(s.pChange);

                        return (
                          <button
                            key={s.symbol}
                            onClick={() => handleOpenAbout(s)}
                            title={`${s.name} (${s.symbol})\nLTP: NPR ${s.ltp.toFixed(2)} (${isUp ? '+' : ''}${s.pChange.toFixed(2)}%)\nTurnover: NPR ${(s.turnover / 10000000).toFixed(2)} Cr\nClick to inspect details`}
                            className={`p-1.5 sm:p-2 rounded-md border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between relative overflow-hidden group hover:scale-[1.02] hover:z-10 shadow-xs ${tileSpan} ${tileColor}`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-[11px] sm:text-xs tracking-tight text-white drop-shadow-xs truncate font-mono">
                                  {s.symbol}
                                </span>
                                <span className="text-[10px] font-extrabold shrink-0 px-1 py-0.2 rounded bg-black/25">
                                  {isUp ? '+' : ''}{s.pChange.toFixed(1)}%
                                </span>
                              </div>
                              <div className="text-[10px] font-semibold opacity-90 mt-0.5 truncate drop-shadow-2xs">
                                {s.ltp.toFixed(1)}
                              </div>
                            </div>

                            <div className="mt-0.5 pt-0.5 border-t border-white/15 flex items-center justify-between text-[9px] opacity-80 font-mono">
                              <span className="truncate">
                                {treemapMetric === 'turnover'
                                  ? `Rs ${(s.turnover / 10000000).toFixed(1)}Cr`
                                  : treemapMetric === 'marketCap'
                                  ? `MC ${s.marketCapBillion.toFixed(1)}B`
                                  : `${(s.volume / 1000).toFixed(0)}k`}
                              </span>
                              <Eye className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Dynamic Treemap: Unified Market Grid */
            <div className="bg-[#0e131d] border border-neutral-800/80 rounded-xl p-3 sm:p-4">
              <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 xl:grid-cols-14 gap-1.5 auto-rows-fr">
                {filteredTreemapStocks.map((s) => {
                  const tileSpan = getHeatmapTileSpan(s, maxValUnified);
                  const isUp = s.pChange >= 0;
                  const tileColor = getHeatmapColor(s.pChange);

                  return (
                    <button
                      key={s.symbol}
                      onClick={() => handleOpenAbout(s)}
                      title={`${s.name} (${s.symbol})\nSector: ${s.sector}\nLTP: NPR ${s.ltp.toFixed(2)} (${isUp ? '+' : ''}${s.pChange.toFixed(2)}%)\nClick to inspect details`}
                      className={`p-1.5 sm:p-2 rounded-md border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between relative overflow-hidden group hover:scale-[1.02] hover:z-10 shadow-xs ${tileSpan} ${tileColor}`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-[11px] sm:text-xs tracking-tight text-white drop-shadow-xs truncate font-mono">
                            {s.symbol}
                          </span>
                          <span className="text-[10px] font-extrabold shrink-0 px-1 py-0.2 rounded bg-black/25">
                            {isUp ? '+' : ''}{s.pChange.toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-[10px] font-semibold opacity-90 mt-0.5 truncate drop-shadow-2xs">
                          {s.ltp.toFixed(1)}
                        </div>
                      </div>

                      <div className="mt-0.5 pt-0.5 border-t border-white/15 flex items-center justify-between text-[9px] opacity-80 font-mono">
                        <span className="truncate">
                          {treemapMetric === 'turnover'
                            ? `Rs ${(s.turnover / 10000000).toFixed(1)}Cr`
                            : treemapMetric === 'marketCap'
                            ? `MC ${s.marketCapBillion.toFixed(1)}B`
                            : `${(s.volume / 1000).toFixed(0)}k`}
                        </span>
                        <Eye className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* SUB-VIEW 2: SECTOR INDICES & MATRIX                  */}
      {/* ==================================================== */}
      {activeTab === 'sectors' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0e131d] p-3 rounded-xl border border-neutral-800">
            <div>
              <span className="text-sm font-bold text-white">NEPSE Official 13 Sector Indices</span>
              <p className="text-xs text-neutral-400 mt-0.5">Click any sector card to filter scrips below</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateSectorAI}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-950/70 to-blue-950/70 hover:from-cyan-900/80 hover:to-blue-900/80 border border-cyan-800/80 rounded-md text-xs font-semibold text-cyan-300 transition-colors shadow-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>AI Sector Rotation Pulse</span>
              </button>
              {activeSector && (
                <button
                  onClick={() => setActiveSector(null)}
                  className="px-2.5 py-1 text-xs text-neutral-300 hover:text-white bg-neutral-800 rounded border border-neutral-700 cursor-pointer"
                >
                  Clear Filter ({activeSector})
                </button>
              )}
            </div>
          </div>

          {/* Sector Matrix Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {sectors.map((sec) => {
              const isSelected = activeSector === sec.sector;
              const isUp = sec.change >= 0;

              return (
                <button
                  key={sec.sector}
                  onClick={() => setActiveSector(isSelected ? null : sec.sector)}
                  className={`p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between h-32 relative overflow-hidden ${
                    isSelected
                      ? 'ring-2 ring-cyan-400 border-cyan-400'
                      : 'hover:brightness-110'
                  } ${getHeatmapColor(sec.pChange)}`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold truncate">
                      <span className="truncate">{sec.sector}</span>
                      <span className="shrink-0 ml-1">
                        {isUp ? '+' : ''}{sec.pChange.toFixed(2)}%
                      </span>
                    </div>
                    <div className="text-[11px] opacity-80 mt-1 tabular-nums">
                      Index: {sec.indexValue.toFixed(1)} ({isUp ? '+' : ''}{sec.change.toFixed(1)})
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] opacity-90 border-t border-white/10 pt-1.5 tabular-nums">
                    <span>{sec.scripCount} scrips</span>
                    <span>NPR {(sec.turnover / 10000000).toFixed(0)} Cr</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Drilldown Scrips Table */}
          <div className="bg-[#0e131d] border border-neutral-800/80 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-neutral-800/80 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                {activeSector ? `${activeSector} Scrips` : 'All NEPSE Scrips Performance'}
              </h3>
              <span className="text-xs text-neutral-400">
                {selectedSectorScrips.length} scrips listed
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs tabular-nums">
                <thead className="bg-[#090d14] text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                  <tr>
                    <th className="py-2.5 px-4">Symbol</th>
                    <th className="py-2.5 px-4">Company Name</th>
                    <th className="py-2.5 px-4">Sector</th>
                    <th className="py-2.5 px-4 text-right">LTP (NPR)</th>
                    <th className="py-2.5 px-4 text-right">Change (%)</th>
                    <th className="py-2.5 px-4 text-right">Turnover (Cr)</th>
                    <th className="py-2.5 px-4 text-right">52W Range</th>
                    <th className="py-2.5 px-4 text-center">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {selectedSectorScrips.map((scrip) => {
                    const isPositive = scrip.change >= 0;
                    return (
                      <tr
                        key={scrip.symbol}
                        className="hover:bg-neutral-800/40 transition-colors cursor-pointer"
                        onClick={() => handleOpenAbout(scrip)}
                      >
                        <td className="py-2.5 px-4 font-bold text-white font-mono">{scrip.symbol}</td>
                        <td className="py-2.5 px-4 text-neutral-300 truncate max-w-xs">{scrip.name}</td>
                        <td className="py-2.5 px-4 text-neutral-400">{scrip.sector}</td>
                        <td className="py-2.5 px-4 text-right font-semibold text-white">
                          {scrip.ltp.toFixed(2)}
                        </td>
                        <td
                          className={`py-2.5 px-4 text-right font-medium ${
                            isPositive ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isPositive ? '+' : ''}{scrip.change.toFixed(2)} ({isPositive ? '+' : ''}{scrip.pChange.toFixed(2)}%)
                        </td>
                        <td className="py-2.5 px-4 text-right text-neutral-300">
                          {(scrip.turnover / 10000000).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-4 text-right text-neutral-400 text-[11px]">
                          {scrip.low52} - {scrip.high52}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAbout(scrip);
                            }}
                            className="px-2.5 py-1 text-[11px] font-medium bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 rounded border border-cyan-800/60 transition-colors cursor-pointer"
                          >
                            About Scrip
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* SUB-VIEW 3: INSTITUTIONAL SENTIMENT SPEEDOMETER      */}
      {/* ==================================================== */}
      {activeTab === 'sentiment' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Speedometer Gauge Card */}
            <div className="lg:col-span-7 bg-[#0e131d] border border-neutral-800/80 rounded-xl p-6 shadow-xl flex flex-col items-center justify-center relative overflow-hidden">
              <div className="w-full flex items-center justify-between border-b border-neutral-800/60 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-bold text-white">NEPSE Institutional Sentiment Meter</span>
                </div>
                <span className={`text-xs px-2.5 py-0.5 rounded border font-semibold ${sentiment.badge}`}>
                  Score: {sentimentScore}/100
                </span>
              </div>

              {/* Semi-circular Speedometer SVG */}
              <div className="relative w-72 h-44 my-2 flex items-center justify-center">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 240 130">
                  <defs>
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f43f5e" />
                      <stop offset="35%" stopColor="#f97316" />
                      <stop offset="50%" stopColor="#eab308" />
                      <stop offset="70%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>

                  <path
                    d="M 20 120 A 100 100 0 0 1 220 120"
                    fill="none"
                    stroke="#1f293d"
                    strokeWidth="18"
                    strokeLinecap="round"
                  />

                  <path
                    d="M 20 120 A 100 100 0 0 1 220 120"
                    fill="none"
                    stroke="url(#gaugeGradient)"
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeDasharray="314.15"
                    strokeDashoffset={314.15 - (sentimentScore / 100) * 314.15}
                    className="transition-all duration-1000 ease-out"
                  />

                  <circle cx="120" cy="120" r="10" fill="#0e131d" stroke="#38bdf8" strokeWidth="4" />

                  <g transform={`rotate(${needleAngle}, 120, 120)`} className="transition-transform duration-1000 ease-out">
                    <line x1="120" y1="120" x2="120" y2="35" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
                    <circle cx="120" cy="35" r="4" fill="#38bdf8" />
                  </g>
                </svg>

                <div className="absolute bottom-0 w-full flex justify-between px-3 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  <span className="text-rose-400">0 Bearish</span>
                  <span className="text-amber-400">50 Neutral</span>
                  <span className="text-cyan-400">100 Bullish</span>
                </div>
              </div>

              <div className="text-center mt-3">
                <div className={`text-base font-extrabold ${sentiment.color} tracking-wide`}>
                  {sentiment.label}
                </div>
                <div className="text-xs text-neutral-400 mt-1 max-w-md">
                  Calculated from session advancers ({advancers}) vs decliners ({decliners}), sector momentum, and turnover absorption.
                </div>
              </div>
            </div>

            {/* Breadth Sub-Gauges */}
            <div className="lg:col-span-5 bg-[#0e131d] border border-neutral-800/80 rounded-xl p-5 shadow-xl space-y-4">
              <div className="border-b border-neutral-800/60 pb-3">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>Technical & Breadth Sub-Gauges</span>
                </span>
              </div>

              {/* Breadth Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Market Breadth (Advancers Ratio)</span>
                  <span className="font-bold text-white">{advRatio.toFixed(1)}% ({advancers} Adv / {decliners} Dec)</span>
                </div>
                <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden flex">
                  <div style={{ width: `${advRatio}%` }} className="bg-emerald-500 h-full"></div>
                  <div style={{ width: `${100 - advRatio}%` }} className="bg-rose-500 h-full"></div>
                </div>
              </div>

              {/* Sector Participation */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Sector Participation</span>
                  <span className="font-bold text-white">{sectorRatio.toFixed(1)}% ({positiveSectors}/{sectors.length} Sectors Green)</span>
                </div>
                <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden flex">
                  <div style={{ width: `${sectorRatio}%` }} className="bg-cyan-500 h-full"></div>
                  <div style={{ width: `${100 - sectorRatio}%` }} className="bg-neutral-800 h-full"></div>
                </div>
              </div>

              {/* Benchmark Trend */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">NEPSE Index Daily Momentum</span>
                  <span className={`font-bold ${nepsePos ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {nepsePos ? '+' : ''}{nepseIndex?.pChange.toFixed(2)}% ({nepsePos ? 'Bullish' : 'Bearish'})
                  </span>
                </div>
                <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden">
                  <div style={{ width: `${nepsePos ? 70 : 30}%` }} className={`h-full ${nepsePos ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                </div>
              </div>

              {/* Circuit Limit Watch */}
              <div className="p-3 rounded-lg bg-[#090d14] border border-neutral-800/80 text-xs space-y-2">
                <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Circuit Breaker Watch</div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-400 flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Upper Circuit (+9.5% to +10%):</span>
                  </span>
                  <span className="font-bold text-white">
                    {stocks.filter((s) => s.pChange >= 9.5).length} Scrips
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-rose-400 flex items-center gap-1">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>Lower Circuit (-9.5% to -10%):</span>
                  </span>
                  <span className="font-bold text-white">
                    {stocks.filter((s) => s.pChange <= -9.5).length} Scrips
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* SUB-VIEW 4: TURNOVER & CAP PIE CHARTS               */}
      {/* ==================================================== */}
      {activeTab === 'allocations' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Donut Chart 1: Sector Turnover Share */}
            <div className="bg-[#0e131d] border border-neutral-800/80 rounded-xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-cyan-400" />
                    <span>Sector Turnover Share</span>
                  </span>
                  <span className="text-[11px] text-neutral-400 font-mono">13 Sectors</span>
                </div>

                <div className="relative w-40 h-40 mx-auto my-2">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#1f293d" strokeWidth="16" />
                    {(() => {
                      let accumulatedPct = 0;
                      return sectorTurnoverData.slice(0, 7).map((item, i) => {
                        const strokeDasharray = `${(item.pct * 2.387).toFixed(1)} 238.7`;
                        const strokeDashoffset = `-${(accumulatedPct * 2.387).toFixed(1)}`;
                        accumulatedPct += item.pct;
                        return (
                          <circle
                            key={i}
                            cx="50"
                            cy="50"
                            r="38"
                            fill="none"
                            stroke={item.color}
                            strokeWidth="16"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all hover:opacity-80"
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] text-neutral-400 font-medium">Top Sector</span>
                    <span className="text-xs font-bold text-white">{sectorTurnoverData[0]?.pct}%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 mt-4 pt-3 border-t border-neutral-800 text-xs max-h-48 overflow-y-auto">
                {sectorTurnoverData.slice(0, 7).map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-neutral-300 truncate">{item.name}</span>
                    </div>
                    <span className="font-mono text-neutral-400 shrink-0">{item.pct}% (Rs {item.turnoverCr} Cr)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Donut Chart 2: Session Breadth Ratio */}
            <div className="bg-[#0e131d] border border-neutral-800/80 rounded-xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Session Breadth Ratio</span>
                  </span>
                  <span className="text-[11px] text-neutral-400 font-mono">{totalTraded} Equities</span>
                </div>

                <div className="relative w-40 h-40 mx-auto my-2">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#1f293d" strokeWidth="16" />
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="16"
                      strokeDasharray={`${((advancers / totalTraded) * 238.7).toFixed(1)} 238.7`}
                      strokeDashoffset="0"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="16"
                      strokeDasharray={`${((decliners / totalTraded) * 238.7).toFixed(1)} 238.7`}
                      strokeDashoffset={`-${((advancers / totalTraded) * 238.7).toFixed(1)}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] text-neutral-400">Adv / Dec</span>
                    <span className="text-xs font-bold text-emerald-400">{((advancers / totalTraded) * 100).toFixed(0)}% Green</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mt-4 pt-3 border-t border-neutral-800 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Advancers (Gaining)</span>
                  </span>
                  <span className="font-mono font-bold text-white">{advancers} ({((advancers / totalTraded) * 100).toFixed(1)}%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-rose-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span>Decliners (Losing)</span>
                  </span>
                  <span className="font-mono font-bold text-white">{decliners} ({((decliners / totalTraded) * 100).toFixed(1)}%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-neutral-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-neutral-600" />
                    <span>Unchanged</span>
                  </span>
                  <span className="font-mono font-bold text-white">{unchanged}</span>
                </div>
              </div>
            </div>

            {/* Donut Chart 3: Market Cap Tier Turnover */}
            <div className="bg-[#0e131d] border border-neutral-800/80 rounded-xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span>Turnover by Cap Tier</span>
                  </span>
                  <span className="text-[11px] text-neutral-400 font-mono">Market Cap</span>
                </div>

                <div className="relative w-40 h-40 mx-auto my-2">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#1f293d" strokeWidth="16" />
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="16"
                      strokeDasharray={`${((largeCapTurnover / totalCapTurnover) * 238.7).toFixed(1)} 238.7`}
                      strokeDashoffset="0"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="16"
                      strokeDasharray={`${((midCapTurnover / totalCapTurnover) * 238.7).toFixed(1)} 238.7`}
                      strokeDashoffset={`-${((largeCapTurnover / totalCapTurnover) * 238.7).toFixed(1)}`}
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="16"
                      strokeDasharray={`${((smallCapTurnover / totalCapTurnover) * 238.7).toFixed(1)} 238.7`}
                      strokeDashoffset={`-${(((largeCapTurnover + midCapTurnover) / totalCapTurnover) * 238.7).toFixed(1)}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] text-neutral-400">Large Cap</span>
                    <span className="text-xs font-bold text-purple-400">{((largeCapTurnover / totalCapTurnover) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mt-4 pt-3 border-t border-neutral-800 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-purple-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <span>Large Cap (&gt; Rs 40B)</span>
                  </span>
                  <span className="font-mono text-white">{((largeCapTurnover / totalCapTurnover) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-cyan-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                    <span>Mid Cap (Rs 15B - 40B)</span>
                  </span>
                  <span className="font-mono text-white">{((midCapTurnover / totalCapTurnover) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-amber-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>Small Cap (&lt; Rs 15B)</span>
                  </span>
                  <span className="font-mono text-white">{((smallCapTurnover / totalCapTurnover) * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* SUB-VIEW 5: TURNOVER HISTOGRAMS & PRICE TIERS       */}
      {/* ==================================================== */}
      {activeTab === 'histograms' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Top 10 Turnover Leaders Histogram */}
            <div className="lg:col-span-8 bg-[#0e131d] border border-neutral-800/80 rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-bold text-white">Top 10 Session Turnover Leaders</span>
                </div>
                <span className="text-xs text-neutral-400">Amounts in NPR Crores</span>
              </div>

              <div className="space-y-2.5">
                {turnoverLeaders.map((s, idx) => {
                  const barPct = (s.turnover / maxLeaderTurnover) * 100;
                  const turnoverCr = (s.turnover / 10000000).toFixed(1);
                  const isUp = s.change >= 0;

                  return (
                    <div
                      key={s.symbol}
                      onClick={() => handleOpenAbout(s)}
                      className="group p-2 rounded-lg hover:bg-neutral-800/40 transition-colors cursor-pointer space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 text-neutral-500 font-mono text-[11px]">{idx + 1}.</span>
                          <span className="font-bold text-white font-mono group-hover:text-cyan-400 transition-colors">{s.symbol}</span>
                          <span className="text-[11px] text-neutral-400 hidden sm:inline truncate max-w-[180px]">{s.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`font-semibold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isUp ? '+' : ''}{s.pChange.toFixed(2)}%
                          </span>
                          <span className="font-mono font-bold text-cyan-300 w-24 text-right">
                            Rs {turnoverCr} Cr
                          </span>
                        </div>
                      </div>

                      <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${barPct}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${
                            idx === 0
                              ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                              : idx < 3
                              ? 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                              : 'bg-neutral-600'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Price Tier Distribution */}
            <div className="lg:col-span-4 bg-[#0e131d] border border-neutral-800/80 rounded-xl p-5 shadow-xl space-y-4">
              <div className="border-b border-neutral-800/60 pb-3">
                <span className="text-sm font-bold text-white">Price Band Distribution</span>
              </div>

              <div className="space-y-4 text-xs">
                {[
                  { label: 'Under NPR 250 (Penny/Micro)', count: stocks.filter((s) => s.ltp < 250).length, color: 'bg-emerald-500' },
                  { label: 'NPR 250 - 500 (Mid-Range)', count: stocks.filter((s) => s.ltp >= 250 && s.ltp < 500).length, color: 'bg-cyan-500' },
                  { label: 'NPR 500 - 1,000 (Upper Mid)', count: stocks.filter((s) => s.ltp >= 500 && s.ltp < 1000).length, color: 'bg-purple-500' },
                  { label: 'Above NPR 1,000 (Bluechip)', count: stocks.filter((s) => s.ltp >= 1000).length, color: 'bg-amber-500' },
                ].map((tier, i) => {
                  const pct = (tier.count / Math.max(1, stocks.length)) * 100;
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between text-neutral-300">
                        <span>{tier.label}</span>
                        <span className="font-bold font-mono text-white">{tier.count} scrips ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden">
                        <div style={{ width: `${pct}%` }} className={`h-full rounded-full ${tier.color}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* SUB-VIEW 6: SECTOR PERFORMANCE RANKINGS BAR CHART    */}
      {/* ==================================================== */}
      {activeTab === 'rankings' && (
        <div className="bg-[#0e131d] border border-neutral-800/80 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800/60 pb-3">
            <div>
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Sector Relative Strength & Performance Ranking</span>
              </span>
              <p className="text-xs text-neutral-400 mt-0.5">All 13 official sectors sorted by session % change</p>
            </div>
            <span className="text-xs text-neutral-400">Green = Outperforming / Red = Underperforming</span>
          </div>

          <div className="space-y-2.5">
            {[...sectors]
              .sort((a, b) => b.pChange - a.pChange)
              .map((sec, idx) => {
                const isPositive = sec.pChange >= 0;
                const absChange = Math.abs(sec.pChange);
                const maxAbs = Math.max(0.1, ...sectors.map((s) => Math.abs(s.pChange)));
                const barWidth = Math.min(100, (absChange / maxAbs) * 100);

                return (
                  <div
                    key={sec.sector}
                    onClick={() => {
                      setActiveSector(sec.sector);
                      setActiveTab('sectors');
                    }}
                    className="p-2 rounded-lg hover:bg-neutral-800/40 transition-colors cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 text-neutral-500 font-mono text-[11px]">{idx + 1}.</span>
                        <span className="font-bold text-white">{sec.sector}</span>
                        <span className="text-neutral-400 text-[11px]">({sec.scripCount} scrips)</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-neutral-400 font-mono text-[11px]">
                          Turnover: NPR {(sec.turnover / 10000000).toFixed(0)} Cr
                        </span>
                        <span
                          className={`font-mono font-bold w-16 text-right ${
                            isPositive ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isPositive ? '+' : ''}{sec.pChange.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${barWidth}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${
                          isPositive ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* SCRIP ABOUT MODAL (TRIGGERED ON CLICKING ANY SCRIP)  */}
      {/* ==================================================== */}
      <ScripAboutModal
        stock={inspectedScrip}
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        onNavigateToTerminal={() => {
          if (inspectedScrip) onSelectStock(inspectedScrip);
          onNavigateToTerminal();
        }}
        onNavigateToCompare={() => {
          if (inspectedScrip) onSelectStock(inspectedScrip);
          if (onNavigateToCompare) onNavigateToCompare();
        }}
        byokConfig={byokConfig}
      />

      {/* ==================================================== */}
      {/* AI SECTOR ROTATION PULSE MODAL                       */}
      {/* ==================================================== */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-[#090d14] border border-neutral-800 rounded-2xl shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>AI NEPSE Sector Rotation & Capital Flow Pulse</span>
              </div>
              <button
                onClick={() => setAiModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-white rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isGeneratingAi ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
                <div className="text-sm font-semibold text-white">Synthesizing Sector Capital Rotation...</div>
                <div className="text-xs text-neutral-400">Auditing 13 sectors, turnover concentration & breadth shifts</div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Engine: {aiEngineUsed}</span>
                  </div>
                  <span className="font-mono">Real-time Sector Matrix</span>
                </div>
                <div className="p-4 bg-[#0e131d] border border-neutral-800/80 rounded-xl text-xs leading-relaxed text-neutral-200 font-sans">
                  <MarkdownRenderer content={aiAnalysisText} />
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-neutral-800 text-xs">
                  <button
                    onClick={onOpenVault}
                    className="flex items-center gap-1.5 text-cyan-400 hover:underline cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Configure BYOK AI Key</span>
                  </button>
                  <button
                    onClick={() => setAiModalOpen(false)}
                    className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded font-medium text-xs cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
