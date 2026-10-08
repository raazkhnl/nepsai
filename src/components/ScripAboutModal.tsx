import React, { useState } from 'react';
import { StockItem, BYOKConfig } from '../types/market';
import { getCompanyProfile } from '../data/companyProfiles';
import {
  X,
  TrendingUp,
  TrendingDown,
  Building2,
  Calendar,
  Layers,
  Activity,
  BarChart3,
  ExternalLink,
  Sparkles,
  Zap,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  LineChart,
} from 'lucide-react';

interface ScripAboutModalProps {
  stock: StockItem | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTerminal: () => void;
  onNavigateToCompare?: () => void;
  byokConfig?: BYOKConfig | null;
}

export const ScripAboutModal: React.FC<ScripAboutModalProps> = ({
  stock,
  isOpen,
  onClose,
  onNavigateToTerminal,
  onNavigateToCompare,
}) => {
  if (!isOpen || !stock) return null;

  const profile = getCompanyProfile(stock);
  const isPositive = stock.change >= 0;

  // Calculate position within Day Range
  const dayRangeSpan = Math.max(0.1, stock.high - stock.low);
  const dayPositionPct = Math.min(
    100,
    Math.max(0, ((stock.ltp - stock.low) / dayRangeSpan) * 100)
  );

  // Calculate position within 52-Week Range
  const span52 = Math.max(0.1, stock.high52 - stock.low52);
  const pos52Pct = Math.min(
    100,
    Math.max(0, ((stock.ltp - stock.low52) / span52) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0b0f19] border border-neutral-800 rounded-2xl max-w-2xl w-full p-5 sm:p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-start justify-between border-b border-neutral-800/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono">
                {stock.symbol}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950/70 text-cyan-300 border border-cyan-800/70">
                {stock.sector}
              </span>
              {stock.marketCapCategory && (
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-800/80 text-neutral-300 border border-neutral-700/60">
                  {stock.marketCapCategory} Cap
                </span>
              )}
            </div>
            <h4 className="text-xs sm:text-sm text-neutral-300 font-medium">
              {stock.name}
            </h4>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Price Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-[#0e1422] border border-neutral-800/90">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-neutral-400 block">
              Last Traded Price
            </span>
            <div className="text-lg sm:text-xl font-bold text-white tabular-nums mt-0.5">
              NPR {stock.ltp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div
              className={`flex items-center gap-1 text-xs font-semibold mt-0.5 ${
                isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>
                {isPositive ? '+' : ''}
                {stock.change.toFixed(2)} ({isPositive ? '+' : ''}
                {stock.pChange.toFixed(2)}%)
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wider text-neutral-400 block">
              Session Volume
            </span>
            <div className="text-sm sm:text-base font-bold text-neutral-200 tabular-nums mt-0.5">
              {stock.volume.toLocaleString()}
            </div>
            <span className="text-[11px] text-neutral-400 block mt-0.5">
              Turnover: NPR {(stock.turnover / 10000000).toFixed(2)} Cr
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wider text-neutral-400 block">
              P/E Ratio & EPS
            </span>
            <div className="text-sm sm:text-base font-bold text-neutral-200 tabular-nums mt-0.5">
              {stock.pe > 0 ? `${stock.pe.toFixed(1)}x` : 'N/A'}
            </div>
            <span className="text-[11px] text-neutral-400 block mt-0.5">
              EPS: NPR {stock.eps.toFixed(2)}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wider text-neutral-400 block">
              Market Capitalization
            </span>
            <div className="text-sm sm:text-base font-bold text-cyan-300 tabular-nums mt-0.5">
              NPR {stock.marketCapBillion.toFixed(1)} B
            </div>
            <span className="text-[11px] text-neutral-400 block mt-0.5">
              {(stock.marketCapBillion * 100).toFixed(0)} Crores
            </span>
          </div>
        </div>

        {/* Range Sliders: Day Range & 52-Week Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#0e1422] border border-neutral-800/90 text-xs">
          {/* Today's Range */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-neutral-400 text-[11px]">
              <span>Day Low: NPR {stock.low.toFixed(2)}</span>
              <span className="font-semibold text-neutral-300">Session Range</span>
              <span>Day High: NPR {stock.high.toFixed(2)}</span>
            </div>
            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden relative">
              <div
                className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full transition-all"
                style={{ width: `${dayPositionPct}%` }}
              />
            </div>
          </div>

          {/* 52-Week Range */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-neutral-400 text-[11px]">
              <span>52W Low: NPR {stock.low52.toFixed(2)}</span>
              <span className="font-semibold text-neutral-300">52-Week Range</span>
              <span>52W High: NPR {stock.high52.toFixed(2)}</span>
            </div>
            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden relative">
              <div
                className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all"
                style={{ width: `${pos52Pct}%` }}
              />
            </div>
          </div>
        </div>

        {/* About The Company Section */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
            <Building2 className="w-4 h-4" />
            <span>About The Company & Operations</span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed bg-[#090d16] p-4 rounded-xl border border-neutral-800/80">
            {profile.description}
          </p>
        </div>

        {/* Corporate Highlights & Governance */}
        <div className="space-y-2 text-xs">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400">
            Institutional Highlights & Profile:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {profile.keyHighlights.map((hl, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2.5 rounded-lg bg-[#0e1422] border border-neutral-800/80 text-neutral-300"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-snug">{hl}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Corporate Registry Details */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-[#090d16] border border-neutral-800/70 text-[11px] text-neutral-300">
          <div>
            <span className="text-neutral-500 block">Headquarters:</span>
            <span className="font-medium text-neutral-200">{profile.headquarters}</span>
          </div>
          <div>
            <span className="text-neutral-500 block">Established / Listed:</span>
            <span className="font-medium text-neutral-200">Year {profile.establishedYear}</span>
          </div>
          <div>
            <span className="text-neutral-500 block">Share Registrar:</span>
            <span className="font-medium text-neutral-200 truncate block">
              {profile.shareRegistrar || 'Authorized Capital Registrar'}
            </span>
          </div>
          {profile.projectCapacityMW && (
            <div>
              <span className="text-neutral-500 block">Hydropower Capacity:</span>
              <span className="font-semibold text-emerald-400">{profile.projectCapacityMW} MW Clean Energy</span>
            </div>
          )}
          {stock.fundamentals?.bvps && (
            <div>
              <span className="text-neutral-500 block">Book Value Per Share:</span>
              <span className="font-semibold text-cyan-300">NPR {stock.fundamentals.bvps.toFixed(2)}</span>
            </div>
          )}
          {stock.fundamentals?.roe && (
            <div>
              <span className="text-neutral-500 block">Return on Equity (ROE):</span>
              <span className="font-semibold text-emerald-300">{stock.fundamentals.roe.toFixed(2)}%</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-800">
          <button
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-neutral-400 hover:text-white rounded-lg border border-neutral-800 hover:bg-neutral-800/50 transition-colors cursor-pointer"
          >
            Close Overview
          </button>

          <div className="flex items-center gap-2">
            {onNavigateToCompare && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToCompare();
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/80 rounded-lg transition-colors cursor-pointer"
              >
                <LineChart className="w-3.5 h-3.5" />
                <span>Compare vs NEPSE</span>
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onNavigateToTerminal();
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-black bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-all shadow-md cursor-pointer"
            >
              <span>Open in TradingView Terminal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
