import React, { useState } from 'react';
import { StockItem, SectorSummary, MarketSummary, BYOKConfig } from '../types/market';
import {
  PieChart as PieIcon,
  Gauge,
  Flame,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Info,
} from 'lucide-react';

interface VisualAnalyticsViewProps {
  stocks: StockItem[];
  sectors: SectorSummary[];
  marketSummary: MarketSummary | null;
  onSelectScrip: (scrip: StockItem) => void;
  onNavigateToTerminal: () => void;
  byokConfig?: BYOKConfig | null;
}

export const VisualAnalyticsView: React.FC<VisualAnalyticsViewProps> = ({
  stocks,
  sectors,
  marketSummary,
  onSelectScrip,
  onNavigateToTerminal,
}) => {
  const [activeVisualTab, setActiveVisualTab] = useState<'sentiment' | 'piecharts' | 'heatmap' | 'histograms'>('sentiment');
  const [heatmapMode, setHeatmapMode] = useState<'scrip' | 'sector'>('scrip');
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('ALL');

  // Compute Market Breadth & Sentiment Score (0 to 100)
  const advancers = stocks.filter((s) => s.change > 0).length;
  const decliners = stocks.filter((s) => s.change < 0).length;
  const unchanged = stocks.filter((s) => s.change === 0).length;
  const totalTraded = Math.max(1, advancers + decliners + unchanged);

  const advRatio = (advancers / totalTraded) * 100;
  const positiveSectors = sectors.filter((s) => s.pChange > 0).length;
  const sectorRatio = (positiveSectors / Math.max(1, sectors.length)) * 100;

  // Multi-factor sentiment index
  // 45% breadth ratio, 35% sector participation, 20% index trend
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

  // Speedometer Needle Angle (-90 deg to +90 deg)
  const needleAngle = -90 + (sentimentScore / 100) * 180;

  // Sector Turnover Distribution for Pie Chart
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

  // Capitalization Distribution
  const largeCaps = stocks.filter((s) => s.marketCapBillion >= 40);
  const midCaps = stocks.filter((s) => s.marketCapBillion >= 15 && s.marketCapBillion < 40);
  const smallCaps = stocks.filter((s) => s.marketCapBillion < 15);

  const largeCapTurnover = largeCaps.reduce((acc, s) => acc + s.turnover, 0);
  const midCapTurnover = midCaps.reduce((acc, s) => acc + s.turnover, 0);
  const smallCapTurnover = smallCaps.reduce((acc, s) => acc + s.turnover, 0);
  const totalCapTurnover = Math.max(1, largeCapTurnover + midCapTurnover + smallCapTurnover);

  // Price Bands Distribution
  const tierUnder250 = stocks.filter((s) => s.ltp < 250);
  const tier250to500 = stocks.filter((s) => s.ltp >= 250 && s.ltp < 500);
  const tier500to1000 = stocks.filter((s) => s.ltp >= 500 && s.ltp < 1000);
  const tierOver1000 = stocks.filter((s) => s.ltp >= 1000);

  // Filtered stocks for heatmap
  const activeStocksForHeatmap = stocks.filter((s) => {
    if (s.isIndex || s.volume <= 0) return false;
    if (selectedSectorFilter !== 'ALL' && s.sector !== selectedSectorFilter) return false;
    return true;
  });

  // Top 10 Turnover Leaders for Histogram
  const turnoverLeaders = [...stocks]
    .filter((s) => !s.isIndex)
    .sort((a, b) => b.turnover - a.turnover)
    .slice(0, 10);

  const maxLeaderTurnover = Math.max(1, turnoverLeaders[0]?.turnover || 1);

  return (
    <div className="space-y-6">
      {/* Header & Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-cyan-400" />
            <span>NEPSE Visual Analytics, Sentiment & Heatmaps</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Institutional speedometer gauges, volume/turnover pie charts, dynamic heatmaps, and price histograms.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-[#090d14] p-1 rounded-lg border border-neutral-800 text-xs">
          <button
            onClick={() => setActiveVisualTab('sentiment')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors cursor-pointer ${
              activeVisualTab === 'sentiment'
                ? 'bg-neutral-800 text-cyan-400 font-semibold shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Bullish/Bearish Meter</span>
          </button>
          <button
            onClick={() => setActiveVisualTab('piecharts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors cursor-pointer ${
              activeVisualTab === 'piecharts'
                ? 'bg-neutral-800 text-cyan-400 font-semibold shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Sector & Cap Pie Charts</span>
          </button>
          <button
            onClick={() => setActiveVisualTab('heatmap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors cursor-pointer ${
              activeVisualTab === 'heatmap'
                ? 'bg-neutral-800 text-cyan-400 font-semibold shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Market Heatmap</span>
          </button>
          <button
            onClick={() => setActiveVisualTab('histograms')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors cursor-pointer ${
              activeVisualTab === 'histograms'
                ? 'bg-neutral-800 text-cyan-400 font-semibold shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Turnover Histograms</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: BULLISH / BEARISH SPEEDOMETER GAUGE */}
      {activeVisualTab === 'sentiment' && (
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

                  {/* Background Arc Track */}
                  <path
                    d="M 20 120 A 100 100 0 0 1 220 120"
                    fill="none"
                    stroke="#1f293d"
                    strokeWidth="18"
                    strokeLinecap="round"
                  />

                  {/* Colored Spectrum Arc */}
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

                  {/* Center Pivot */}
                  <circle cx="120" cy="120" r="10" fill="#0e131d" stroke="#38bdf8" strokeWidth="4" />

                  {/* Needle Pointer */}
                  <g transform={`rotate(${needleAngle}, 120, 120)`} className="transition-transform duration-1000 ease-out">
                    <line x1="120" y1="120" x2="120" y2="35" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
                    <circle cx="120" cy="35" r="4" fill="#38bdf8" />
                  </g>
                </svg>

                {/* Gauge Labels */}
                <div className="absolute bottom-0 w-full flex justify-between px-3 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  <span className="text-rose-400">0 Bearish</span>
                  <span className="text-amber-400">50 Neutral</span>
                  <span className="text-cyan-400">100 Bullish</span>
                </div>
              </div>

              {/* Status readout */}
              <div className="text-center mt-3">
                <div className={`text-base font-extrabold ${sentiment.color} tracking-wide`}>
                  {sentiment.label}
                </div>
                <div className="text-xs text-neutral-400 mt-1 max-w-md">
                  Calculated using session advancers ({advancers}) vs decliners ({decliners}), sector momentum, and volume absorption across all 15 sectors.
                </div>
              </div>
            </div>

            {/* Factor Breakdown Panel */}
            <div className="lg:col-span-5 bg-[#0e131d] border border-neutral-800/80 rounded-xl p-5 shadow-xl space-y-4">
              <div className="border-b border-neutral-800/60 pb-3">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>Technical & Breadth Sub-Gauges</span>
                </span>
              </div>

              {/* Factor 1: Market Breadth */}
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

              {/* Factor 2: Sector Participation */}
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

              {/* Factor 3: NEPSE Benchmark Trend */}
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

              {/* Factor 4: Circuit Limits Summary */}
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

      {/* VIEW 2: PIE & DONUT CHARTS */}
      {activeVisualTab === 'piecharts' && (
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
                  <span className="text-[11px] text-neutral-400 font-mono">15 Sectors</span>
                </div>

                {/* Donut Visual Representation */}
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

              {/* Legend List */}
              <div className="space-y-1.5 mt-4 pt-3 border-t border-neutral-800 text-xs max-h-48 overflow-y-auto">
                {sectorTurnoverData.slice(0, 6).map((item, i) => (
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

            {/* Donut Chart 2: Market Breadth Participation */}
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
                    {/* Advancers */}
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
                    {/* Decliners */}
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
                    {/* Large Cap */}
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
                    {/* Mid Cap */}
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
                    {/* Small Cap */}
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

      {/* VIEW 3: MARKET HEATMAP (SCRIP-WISE & SECTOR-WISE) */}
      {activeVisualTab === 'heatmap' && (
        <div className="space-y-4">
          {/* Controls toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0e131d] p-3 rounded-lg border border-neutral-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-neutral-400 font-medium">Heatmap Mode:</span>
              <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded border border-neutral-800">
                <button
                  onClick={() => setHeatmapMode('scrip')}
                  className={`px-3 py-1 rounded transition-colors ${
                    heatmapMode === 'scrip' ? 'bg-neutral-800 text-cyan-400 font-bold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Scrip-Wise (Equities)
                </button>
                <button
                  onClick={() => setHeatmapMode('sector')}
                  className={`px-3 py-1 rounded transition-colors ${
                    heatmapMode === 'sector' ? 'bg-neutral-800 text-cyan-400 font-bold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Sector-Wise (15 Sectors)
                </button>
              </div>
            </div>

            {heatmapMode === 'scrip' && (
              <div className="flex items-center gap-2">
                <span className="text-neutral-400">Filter Sector:</span>
                <select
                  value={selectedSectorFilter}
                  onChange={(e) => setSelectedSectorFilter(e.target.value)}
                  className="bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1 text-neutral-200 text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="ALL">All Sectors ({stocks.length})</option>
                  {sectors.map((sec) => (
                    <option key={sec.sector} value={sec.sector}>
                      {sec.sector}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Scrip Grid Heatmap */}
          {heatmapMode === 'scrip' ? (
            <div className="bg-[#0b0e14] border border-neutral-800 rounded-xl p-4 shadow-xl">
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
                {activeStocksForHeatmap.slice(0, 96).map((s) => {
                  const isUp = s.pChange > 0;
                  const isCircuit = Math.abs(s.pChange) >= 9.5;
                  const absPct = Math.min(10, Math.abs(s.pChange));

                  // Dynamic color intensity based on percentage
                  const bgColor = isUp
                    ? absPct >= 6
                      ? 'bg-emerald-600/90 hover:bg-emerald-500'
                      : absPct >= 3
                      ? 'bg-emerald-700/75 hover:bg-emerald-600'
                      : 'bg-emerald-950/70 hover:bg-emerald-900'
                    : s.pChange < 0
                    ? absPct >= 6
                      ? 'bg-rose-600/90 hover:bg-rose-500'
                      : absPct >= 3
                      ? 'bg-rose-700/75 hover:bg-rose-600'
                      : 'bg-rose-950/70 hover:bg-rose-900'
                    : 'bg-neutral-900 hover:bg-neutral-800';

                  return (
                    <button
                      key={s.symbol}
                      onClick={() => {
                        onSelectScrip(s);
                        onNavigateToTerminal();
                      }}
                      className={`${bgColor} p-3 rounded-lg border border-white/5 transition-all flex flex-col justify-between text-left cursor-pointer group shadow-xs`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-extrabold text-white text-xs group-hover:underline">{s.symbol}</span>
                        {isCircuit && (
                          <span className="text-[9px] px-1 rounded bg-black/40 text-yellow-300 font-mono">10%</span>
                        )}
                      </div>
                      <div className="mt-2 text-right">
                        <div className="text-[11px] font-mono text-neutral-300">NPR {s.ltp.toFixed(1)}</div>
                        <div className={`text-xs font-bold ${isUp ? 'text-emerald-300' : s.pChange < 0 ? 'text-rose-300' : 'text-neutral-400'}`}>
                          {isUp ? '+' : ''}{s.pChange.toFixed(2)}%
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Sector Grid Heatmap */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sectors.map((sec) => {
                const isUp = sec.pChange > 0;
                const absPct = Math.abs(sec.pChange);
                const bgColor = isUp
                  ? absPct >= 2
                    ? 'bg-emerald-950/60 border-emerald-800'
                    : 'bg-emerald-950/40 border-emerald-900'
                  : sec.pChange < 0
                  ? absPct >= 2
                    ? 'bg-rose-950/60 border-rose-800'
                    : 'bg-rose-950/40 border-rose-900'
                  : 'bg-[#0e131d] border-neutral-800';

                return (
                  <div key={sec.sector} className={`p-4 rounded-xl border ${bgColor} space-y-3`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{sec.sector}</span>
                      <span className={`text-sm font-extrabold ${isUp ? 'text-emerald-400' : sec.pChange < 0 ? 'text-rose-400' : 'text-neutral-400'}`}>
                        {isUp ? '+' : ''}{sec.pChange.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-neutral-400 tabular-nums">
                      <span>Turnover: NPR {(sec.turnover / 10000000).toFixed(1)} Cr</span>
                      <span className="text-neutral-300">{sec.advancers} Adv / {sec.decliners} Dec</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: TURNOVER HISTOGRAMS */}
      {activeVisualTab === 'histograms' && (
        <div className="space-y-6">
          <div className="bg-[#0e131d] border border-neutral-800/80 rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>Top 10 Institutional Turnover Leaders (NPR Crores)</span>
              </span>
              <span className="text-xs text-neutral-400">Liquidity Concentration</span>
            </div>

            <div className="space-y-3 pt-2">
              {turnoverLeaders.map((s, idx) => {
                const barWidthPct = Math.max(8, (s.turnover / maxLeaderTurnover) * 100);
                const turnoverCr = (s.turnover / 10000000).toFixed(2);
                const isUp = s.change >= 0;

                return (
                  <div key={s.symbol} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-neutral-500 w-4">{idx + 1}.</span>
                        <button
                          onClick={() => {
                            onSelectScrip(s);
                            onNavigateToTerminal();
                          }}
                          className="font-bold text-white hover:text-cyan-400 transition-colors cursor-pointer"
                        >
                          {s.symbol}
                        </button>
                        <span className="text-neutral-400 text-[11px] truncate hidden sm:inline">({s.name})</span>
                      </div>
                      <div className="flex items-center gap-3 tabular-nums">
                        <span className={`font-semibold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isUp ? '+' : ''}{s.pChange.toFixed(2)}%
                        </span>
                        <span className="font-mono font-bold text-cyan-300">NPR {turnoverCr} Cr</span>
                      </div>
                    </div>
                    {/* Horizontal Bar */}
                    <div className="h-2.5 w-full bg-neutral-900 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${barWidthPct}%` }}
                        className="h-full bg-gradient-to-r from-cyan-600 to-blue-500 rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
