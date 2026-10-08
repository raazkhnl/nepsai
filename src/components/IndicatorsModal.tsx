import React, { useState } from 'react';
import { X, Search, Check, SlidersHorizontal, RotateCcw, Info } from 'lucide-react';

export interface IndicatorConfig {
  id: string;
  name: string;
  shortName: string;
  category: 'Trend' | 'Momentum' | 'Volatility' | 'Volume & Levels';
  description: string;
  enabled: boolean;
  color: string;
  pane: 'main' | 'sub';
}

export const DEFAULT_INDICATORS: IndicatorConfig[] = [
  // Trend
  {
    id: 'sma20',
    name: 'Simple Moving Average (20)',
    shortName: 'SMA 20',
    category: 'Trend',
    description: '20-session arithmetic average. Key short-term baseline and mean reversion level.',
    enabled: false,
    color: '#38bdf8', // sky-400
    pane: 'main',
  },
  {
    id: 'sma50',
    name: 'Simple Moving Average (50)',
    shortName: 'SMA 50',
    category: 'Trend',
    description: '50-session institutional intermediate trend baseline.',
    enabled: false,
    color: '#f59e0b', // amber-500
    pane: 'main',
  },
  {
    id: 'sma200',
    name: 'Simple Moving Average (200)',
    shortName: 'SMA 200',
    category: 'Trend',
    description: '200-session long-term institutional trend divider. Triggers Golden / Death Cross.',
    enabled: false,
    color: '#c084fc', // purple-400
    pane: 'main',
  },
  {
    id: 'ema9',
    name: 'Exponential Moving Average (9)',
    shortName: 'EMA 9',
    category: 'Trend',
    description: 'Fast exponential average weighted toward recent candles for quick momentum shifts.',
    enabled: false,
    color: '#34d399', // emerald-400
    pane: 'main',
  },
  {
    id: 'ema21',
    name: 'Exponential Moving Average (21)',
    shortName: 'EMA 21',
    category: 'Trend',
    description: 'Swing trend filter. 9/21 EMA crossover is a staple swing trading strategy in NEPSE.',
    enabled: false,
    color: '#fb7185', // rose-400
    pane: 'main',
  },
  {
    id: 'supertrend',
    name: 'SuperTrend (10, 3)',
    shortName: 'SuperTrend',
    category: 'Trend',
    description: 'ATR-based trailing stop line that turns Green below price in uptrend and Red above in downtrend.',
    enabled: false,
    color: '#10b981', // emerald-500
    pane: 'main',
  },
  {
    id: 'parabolicSar',
    name: 'Parabolic SAR (0.02, 0.2)',
    shortName: 'SAR',
    category: 'Trend',
    description: 'Stop-and-Reverse dots showing dynamic trailing trailing stop targets.',
    enabled: false,
    color: '#f43f5e', // rose-500
    pane: 'main',
  },

  // Volatility
  {
    id: 'bb',
    name: 'Bollinger Bands (20, 2)',
    shortName: 'BB (20, 2)',
    category: 'Volatility',
    description: 'Standard deviation envelopes around a 20 SMA. Identifies squeezes and breakouts.',
    enabled: false,
    color: '#94a3b8', // slate-400
    pane: 'main',
  },
  {
    id: 'donchian',
    name: 'Donchian Channels (20)',
    shortName: 'Donchian',
    category: 'Volatility',
    description: '20-period highest high and lowest low bands. Highlights volatility expansion.',
    enabled: false,
    color: '#06b6d4', // cyan-500
    pane: 'main',
  },
  {
    id: 'atr',
    name: 'Average True Range (14)',
    shortName: 'ATR 14',
    category: 'Volatility',
    description: 'Measures absolute price volatility per session in NPR points.',
    enabled: false,
    color: '#f97316', // orange-500
    pane: 'sub',
  },

  // Momentum
  {
    id: 'rsi',
    name: 'Relative Strength Index (14)',
    shortName: 'RSI 14',
    category: 'Momentum',
    description: 'Measures magnitude of recent price gains vs losses. Overbought > 70, Oversold < 30.',
    enabled: false,
    color: '#a855f7', // purple-500
    pane: 'sub',
  },
  {
    id: 'stochRsi',
    name: 'Stochastic RSI (14, 14, 3, 3)',
    shortName: 'Stoch RSI',
    category: 'Momentum',
    description: 'Oscillator of RSI values for hyper-sensitive overbought/oversold cycle detection.',
    enabled: false,
    color: '#ec4899', // pink-500
    pane: 'sub',
  },
  {
    id: 'macd',
    name: 'MACD (12, 26, 9)',
    shortName: 'MACD',
    category: 'Momentum',
    description: 'Moving Average Convergence Divergence line, 9-EMA Signal line, and zero-axis Histogram.',
    enabled: false,
    color: '#38bdf8', // sky-400
    pane: 'sub',
  },
  {
    id: 'williamsR',
    name: 'Williams %R (14)',
    shortName: '%R (14)',
    category: 'Momentum',
    description: 'Normalized inverse oscillator between 0 and -100 identifying extreme divergences.',
    enabled: false,
    color: '#eab308', // yellow-500
    pane: 'sub',
  },

  // Volume & Levels
  {
    id: 'volume',
    name: 'Volume Histogram',
    shortName: 'Volume',
    category: 'Volume & Levels',
    description: 'Traded share quantity per trading session with bull/bear color coding.',
    enabled: true,
    color: '#10b981', // emerald-500
    pane: 'main',
  },
  {
    id: 'vwap',
    name: 'Volume Weighted Average Price',
    shortName: 'VWAP',
    category: 'Volume & Levels',
    description: 'Volume-weighted benchmark price representing true cumulative institutional liquidity cost.',
    enabled: false,
    color: '#e11d48', // rose-600
    pane: 'main',
  },
  {
    id: 'pivots',
    name: 'Classical Floor Pivot Points',
    shortName: 'Pivots',
    category: 'Volume & Levels',
    description: 'Daily mathematical horizontal price floors: Pivot (PP), S1/S2/S3, and R1/R2/R3.',
    enabled: false,
    color: '#eab308', // yellow-500
    pane: 'main',
  },
  {
    id: 'hlLevels',
    name: '52-Week High & Low Channels',
    shortName: '52W H/L',
    category: 'Volume & Levels',
    description: 'Horizontal benchmark lines for 52-week peak resistance and cyclical baseline trough.',
    enabled: false,
    color: '#ec4899', // pink-500
    pane: 'main',
  },
  {
    id: 'supportResistance',
    name: 'Key Support & Resistance Clusters',
    shortName: 'S/R Zones',
    category: 'Volume & Levels',
    description: 'Algorithmic structural supply (R1, R2) and demand (S1, S2) pivot boundaries.',
    enabled: false,
    color: '#06b6d4', // cyan-500
    pane: 'main',
  },
];

interface IndicatorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicators: IndicatorConfig[];
  onToggleIndicator: (id: string) => void;
  onResetIndicators: () => void;
}

export const IndicatorsModal: React.FC<IndicatorsModalProps> = ({
  isOpen,
  onClose,
  indicators,
  onToggleIndicator,
  onResetIndicators,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen) return null;

  const categories = ['All', 'Trend', 'Momentum', 'Volatility', 'Volume & Levels'];

  const filtered = indicators.filter((ind) => {
    const matchesSearch =
      ind.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ind.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ind.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || ind.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const activeCount = indicators.filter((i) => i.enabled).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl bg-[#090d14] border border-neutral-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-[#0c101a]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/80 text-cyan-400">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Technical Indicators & Overlays</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono font-normal">
                  {activeCount} Active
                </span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Toggle mathematical trend lines, oscillators, and institutional levels on the chart
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="p-3 sm:p-4 border-b border-neutral-800/80 bg-[#090d14] space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 15+ indicators (e.g. SuperTrend, MACD, Bollinger, VWAP, EMA)..."
              className="w-full pl-9 pr-3.5 py-2 bg-[#0e131d] border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500 font-mono transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-neutral-800 text-cyan-400 border border-neutral-700 shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Indicators List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 divide-y divide-neutral-800/60 space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-neutral-500 text-xs">
              No indicators matching "{searchQuery}"
            </div>
          ) : (
            filtered.map((ind) => (
              <div
                key={ind.id}
                onClick={() => onToggleIndicator(ind.id)}
                className={`pt-2.5 pb-2.5 px-3 rounded-lg flex items-start justify-between gap-3 cursor-pointer transition-all ${
                  ind.enabled
                    ? 'bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800/80'
                    : 'hover:bg-neutral-900/30'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: ind.color }}
                    />
                    <span className={`text-xs font-semibold ${ind.enabled ? 'text-white' : 'text-neutral-300'}`}>
                      {ind.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400">
                      {ind.category}
                    </span>
                    {ind.pane === 'sub' && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-950/60 text-purple-300 border border-purple-900/60">
                        Sub-Pane
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-normal pl-4.5">
                    {ind.description}
                  </p>
                </div>

                <div className="shrink-0 pt-0.5">
                  <div
                    className={`w-9 h-5 rounded-full transition-colors p-0.5 flex items-center ${
                      ind.enabled ? 'bg-cyan-600 justify-end' : 'bg-neutral-800 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-neutral-800 bg-[#0c101a] flex items-center justify-between text-xs">
          <button
            onClick={onResetIndicators}
            className="flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Standard Layout</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg text-xs transition-colors cursor-pointer"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
