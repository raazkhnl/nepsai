import React, { useState } from 'react';
import { StockItem, TechnicalIndicatorsResult } from '../types/market';
import { Search, Sparkles, TrendingUp, TrendingDown, Layers, BarChart2 } from 'lucide-react';

interface StockDetailsSidebarProps {
  stocks: StockItem[];
  selectedStock: StockItem;
  onSelectStock: (stock: StockItem) => void;
  technicals: TechnicalIndicatorsResult;
  onNavigateToAI: () => void;
  marketCapCategories?: Record<string, string[]>;
}

export const StockDetailsSidebar: React.FC<StockDetailsSidebarProps> = ({
  stocks,
  selectedStock,
  onSelectStock,
  technicals,
  onNavigateToAI,
  marketCapCategories = {},
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [selectedCapCategory, setSelectedCapCategory] = useState<string>('ALL');

  const sectors = ['ALL', ...Array.from(new Set(stocks.map((s) => s.sector))).filter(Boolean)];

  const filteredStocks = stocks.filter((stock) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === '' ||
      stock.symbol.toLowerCase().includes(q) ||
      (stock.name && stock.name.toLowerCase().includes(q));

    const matchesSector = selectedSector === 'ALL' || stock.sector === selectedSector;

    let matchesCap = true;
    if (selectedCapCategory !== 'ALL' && marketCapCategories[selectedCapCategory]) {
      const allowedSymbols = marketCapCategories[selectedCapCategory] || [];
      matchesCap = allowedSymbols.includes(stock.symbol);
    }

    return matchesSearch && matchesSector && matchesCap;
  });

  const range52Percent = Math.min(
    100,
    Math.max(
      0,
      ((selectedStock.ltp - selectedStock.low52) / (selectedStock.high52 - selectedStock.low52 || 1)) *
        100
    )
  );

  return (
    <div className="flex flex-col gap-4 bg-[#0b0e14]">
      {/* Scrip Search & Filter Card */}
      <div className="bg-[#0e131d] border border-neutral-800/80 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider">
            NEPSE Universe ({stocks.length} Scrips)
          </span>
          <span className="text-[10px] text-cyan-400 font-mono">
            {filteredStocks.length} visible
          </span>
        </div>

        {/* Quick Benchmark shortcuts */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-2 text-[10px]">
          <button
            onClick={() => {
              const nepseItem = stocks.find((s) => s.symbol === 'NEPSE') || {
                symbol: 'NEPSE',
                name: 'NEPSE Index (All Share)',
                sector: 'Index' as any,
                ltp: 2578.73,
                change: 11.97,
                pChange: 0.47,
                open: 2566.76,
                high: 2587.25,
                low: 2565.10,
                volume: 8955230,
                turnover: 3138119528,
                high52: 3000.8,
                low52: 1800.5,
                pe: 0,
                eps: 0,
                marketCapBillion: 4435,
                history: [],
                isIndex: true,
              };
              onSelectStock(nepseItem);
            }}
            className={`px-2 py-0.5 rounded border whitespace-nowrap transition-colors cursor-pointer ${
              selectedStock.symbol === 'NEPSE'
                ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold'
                : 'bg-[#090d14] border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            NEPSE Index
          </button>
          {['NICA', 'NABIL', 'CHCL', 'SHIVM', 'GBIME'].map((bench) => {
            const item = stocks.find((s) => s.symbol === bench);
            if (!item) return null;
            return (
              <button
                key={bench}
                onClick={() => onSelectStock(item)}
                className={`px-1.5 py-0.5 rounded border whitespace-nowrap transition-colors cursor-pointer ${
                  selectedStock.symbol === bench
                    ? 'bg-neutral-800 border-cyan-400 text-cyan-300 font-bold'
                    : 'bg-[#090d14] border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {bench}
              </button>
            );
          })}
        </div>

        <div className="relative mb-2.5">
          <Search className="w-4 h-4 text-neutral-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search 359 scrips (e.g. NICA, NABIL)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#090d14] border border-neutral-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500/80"
          />
        </div>

        {/* Filters: Sector & Market-Cap Category */}
        <div className="grid grid-cols-2 gap-2 mb-2 text-[11px]">
          <div>
            <label className="text-[10px] text-neutral-500 block mb-0.5">Sector:</label>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full bg-[#090d14] border border-neutral-800 rounded px-1.5 py-1 text-xs text-neutral-300 focus:outline-none focus:border-cyan-500/80"
            >
              {sectors.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-neutral-500 block mb-0.5">Cap Category:</label>
            <select
              value={selectedCapCategory}
              onChange={(e) => setSelectedCapCategory(e.target.value)}
              className="w-full bg-[#090d14] border border-neutral-800 rounded px-1.5 py-1 text-xs text-neutral-300 focus:outline-none focus:border-cyan-500/80"
            >
              <option value="ALL">All Caps</option>
              <option value="very_high">Very High Cap</option>
              <option value="high">High Cap</option>
              <option value="mid">Mid Cap</option>
              <option value="low">Low Cap</option>
              <option value="ultra_low">Ultra-Low Cap</option>
            </select>
          </div>
        </div>

        {/* Scrip Scroll List */}
        <div className="max-h-52 overflow-y-auto divide-y divide-neutral-800/50 pr-1">
          {filteredStocks.length === 0 ? (
            <div className="text-center py-4 text-xs text-neutral-500">
              No matching scrip found.
            </div>
          ) : (
            filteredStocks.map((stock) => {
              const isSelected = stock.symbol === selectedStock.symbol;
              const isPositive = stock.change >= 0;
              return (
                <button
                  key={stock.symbol}
                  onClick={() => onSelectStock(stock)}
                  className={`w-full flex items-center justify-between py-1.5 px-2 text-left rounded transition-colors text-xs tabular-nums cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-800/90 text-cyan-400 font-semibold'
                      : 'text-neutral-300 hover:bg-neutral-800/40'
                  }`}
                >
                  <div className="truncate pr-2">
                    <span className="font-bold">{stock.symbol}</span>
                    <span className="text-[10px] text-neutral-400 block truncate max-w-[140px]">
                      {stock.name || stock.sector}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-medium text-white">{stock.ltp.toFixed(1)}</div>
                    <div
                      className={`text-[10px] flex items-center justify-end ${
                        isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {stock.pChange ? stock.pChange.toFixed(2) : '0.00'}%
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Selected Scrip Quick Analytics & Levels */}
      <div className="bg-[#0e131d] border border-neutral-800/80 rounded-lg p-3 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
          <div>
            <div className="font-bold text-white text-sm">{selectedStock.symbol}</div>
            <div className="text-[11px] text-neutral-400 truncate max-w-[180px]">
              {selectedStock.name || selectedStock.sector}
            </div>
          </div>
          <button
            onClick={onNavigateToAI}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-cyan-950/60 border border-cyan-800/80 text-cyan-300 rounded hover:bg-cyan-900/60 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>AI Audit</span>
          </button>
        </div>

        {/* 52-Week Range Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] text-neutral-400 tabular-nums">
            <span>52W Low: NPR {selectedStock.low52}</span>
            <span>52W High: NPR {selectedStock.high52}</span>
          </div>
          <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden mt-1 relative">
            <div
              className="bg-cyan-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${range52Percent}%` }}
            />
          </div>
        </div>

        {/* Fundamental & Trading Stats Grid */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-neutral-800/60 tabular-nums text-[11px]">
          <div>
            <span className="text-neutral-500 block">P/E Ratio</span>
            <span className="font-medium text-white">{selectedStock.pe || 'N/A'}</span>
          </div>
          <div>
            <span className="text-neutral-500 block">EPS (NPR)</span>
            <span className="font-medium text-white">{selectedStock.eps || 'N/A'}</span>
          </div>
          <div>
            <span className="text-neutral-500 block">Day Volume</span>
            <span className="font-medium text-white">{selectedStock.volume.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-neutral-500 block">Turnover</span>
            <span className="font-medium text-white">
              NPR {(selectedStock.turnover / 10000000).toFixed(2)} Cr
            </span>
          </div>
        </div>

        {/* Technical Signals Matrix */}
        <div className="mt-3 pt-3 border-t border-neutral-800/60 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-neutral-400 font-medium">Algorithmic Stance</span>
            <span
              className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                technicals.trendSignal.includes('Bullish')
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                  : technicals.trendSignal.includes('Bearish')
                  ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                  : 'bg-neutral-800 text-neutral-300'
              }`}
            >
              {technicals.trendSignal}
            </span>
          </div>

          <button
            onClick={onNavigateToAI}
            className="w-full mb-2.5 py-1.5 px-2 bg-gradient-to-r from-cyan-950/60 to-blue-950/60 hover:from-cyan-900/70 hover:to-blue-900/70 border border-cyan-800/80 rounded text-cyan-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Generate Deep AI Analysis</span>
          </button>

          <div className="space-y-1.5 text-[11px] tabular-nums">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">RSI (14)</span>
              <span
                className={`font-medium ${
                  technicals.rsi14 > 70
                    ? 'text-rose-400'
                    : technicals.rsi14 < 30
                    ? 'text-emerald-400'
                    : 'text-neutral-200'
                }`}
              >
                {technicals.rsi14}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">SMA 20</span>
              <span className="text-neutral-200">NPR {technicals.sma20.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">SMA 50</span>
              <span className="text-neutral-200">NPR {technicals.sma50.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">SMA 200</span>
              <span className="text-neutral-200">NPR {technicals.sma200.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">MACD Hist</span>
              <span
                className={
                  technicals.macd.histogram >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }
              >
                {technicals.macd.histogram >= 0 ? '+' : ''}
                {technicals.macd.histogram}
              </span>
            </div>
          </div>
        </div>

        {/* Pivot Points Matrix */}
        <div className="mt-3 pt-3 border-t border-neutral-800/60 text-xs">
          <span className="text-neutral-400 font-medium block mb-1.5">Classic Pivot Levels</span>
          <div className="grid grid-cols-2 gap-1.5 text-[10px] tabular-nums">
            <div className="bg-[#090d14] p-1.5 rounded border border-neutral-800/60">
              <span className="text-rose-400 block">R2: {technicals.pivotPoints.r2}</span>
              <span className="text-rose-300 block">R1: {technicals.pivotPoints.r1}</span>
            </div>
            <div className="bg-[#090d14] p-1.5 rounded border border-neutral-800/60">
              <span className="text-cyan-400 block">Pivot: {technicals.pivotPoints.pivot}</span>
              <span className="text-emerald-400 block">S1: {technicals.pivotPoints.s1}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
