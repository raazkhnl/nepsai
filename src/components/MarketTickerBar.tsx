import React from 'react';
import { MarketSummary } from '../types/market';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MarketTickerBarProps {
  summary: MarketSummary;
  nextScraperTime: string;
}

export const MarketTickerBar: React.FC<MarketTickerBarProps> = ({ summary, nextScraperTime }) => {
  const isBullish = summary.nepseChange >= 0;

  return (
    <div className="bg-[#0e131d] border-b border-neutral-800/80 px-4 lg:px-6 py-2">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-2 gap-x-6 text-xs">
        {/* Left: Core Indices */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 tabular-nums">
          {/* Market Status text */}
          <div className="flex items-center gap-1.5 font-medium">
            <span
              className={`w-2 h-2 rounded-full ${
                summary.marketStatus === 'OPEN' ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-500'
              }`}
            />
            <span className="text-neutral-300">
              NEPSE {summary.marketStatus === 'OPEN' ? 'Live' : 'Market Closed'}
            </span>
          </div>

          {/* NEPSE Index */}
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400">NEPSE Index:</span>
            <span className="font-semibold text-white">{summary.nepseIndex.toFixed(2)}</span>
            <span
              className={`flex items-center font-medium ${
                isBullish ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isBullish ? (
                <TrendingUp className="w-3 h-3 mr-0.5 inline" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-0.5 inline" />
              )}
              {isBullish ? '+' : ''}
              {summary.nepseChange.toFixed(2)} ({isBullish ? '+' : ''}
              {summary.nepsePChange.toFixed(2)}%)
            </span>
          </div>

          {/* Sensitive Index */}
          <div className="hidden sm:flex items-center gap-1.5 text-neutral-400">
            <span>Sensitive:</span>
            <span className="text-neutral-200 font-medium">
              {summary.sensitiveIndex.toFixed(2)}
            </span>
            <span className={summary.sensitiveChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {summary.sensitiveChange >= 0 ? '+' : ''}
              {summary.sensitiveChange.toFixed(2)}
            </span>
          </div>

          {/* Float Index */}
          <div className="hidden md:flex items-center gap-1.5 text-neutral-400">
            <span>Float:</span>
            <span className="text-neutral-200 font-medium">{summary.floatIndex.toFixed(2)}</span>
            <span className={summary.floatChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {summary.floatChange >= 0 ? '+' : ''}
              {summary.floatChange.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Right: Turnover & Market Breadth */}
        <div className="flex items-center gap-4 text-neutral-400 tabular-nums">
          <div className="flex items-center gap-1.5">
            <span>Turnover:</span>
            <span className="text-white font-medium">
              NPR {(summary.totalTurnover / 1000000000).toFixed(2)}B
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <span className="text-emerald-400 font-medium">{summary.advancers} Adv</span>
            <span className="text-neutral-600">/</span>
            <span className="text-rose-400 font-medium">{summary.decliners} Dec</span>
            <span className="text-neutral-600">/</span>
            <span className="text-neutral-400">{summary.unchanged} Unch</span>
          </div>

          <div className="hidden xl:flex items-center gap-1 text-neutral-400 pl-3 border-l border-neutral-800">
            <span>Scraper Cron:</span>
            <span className="text-cyan-400 font-medium">{nextScraperTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
