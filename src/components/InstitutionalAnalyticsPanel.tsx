import React, { useState } from 'react';
import { StockItem, Candle, BYOKConfig } from '../types/market';
import { computeAdvancedAnalytics, INDICATOR_GLOSSARY } from '../utils/nepseAnalytics';
import {
  Info,
  TrendingUp,
  TrendingDown,
  Building2,
  PieChart,
  Activity,
  Layers,
  Calendar,
  Zap,
  Shield,
  HelpCircle,
  X,
  Sparkles,
  KeyRound,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { executeAIAnalysisDetailed } from '../utils/aiPrompt';
import { MarkdownRenderer } from './MarkdownRenderer';
import { AIErrorBanner, AIErrorInfo, classifyAIError } from './AIErrorBanner';

interface InstitutionalAnalyticsPanelProps {
  stock: StockItem;
  candles: Candle[];
  nepseCandles?: Candle[];
  onSelectScrip?: (scrip: StockItem) => void;
  byokConfig?: BYOKConfig | null;
  onOpenVault?: () => void;
}

export const InstitutionalAnalyticsPanel: React.FC<InstitutionalAnalyticsPanelProps> = ({
  stock,
  candles,
  nepseCandles,
  byokConfig = null,
  onOpenVault = () => {},
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'capitalization' | 'valuation' | 'pivots_moving' | 'dividends' | 'risk'>('overview');
  const [selectedGlossaryKey, setSelectedGlossaryKey] = useState<string | null>(null);

  // AI Modal State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiAnalysisText, setAiAnalysisText] = useState('');
  const [aiEngineUsed, setAiEngineUsed] = useState('Server AI Engine');
  const [aiError, setAiError] = useState<AIErrorInfo | null>(null);

  const { fundamentals, analytics, corporateActions } = computeAdvancedAnalytics(
    stock,
    candles,
    nepseCandles
  );

  const handleGenerateFundamentalAI = async () => {
    setIsGeneratingAi(true);
    setAiAnalysisText('');
    setAiModalOpen(true);
    setAiError(null);

    const grahamMargin = ((fundamentals.grahamNumber - stock.ltp) / (stock.ltp || 1)) * 100;
    const floatTurnoverPct = ((stock.turnover / 1000000000) / (fundamentals.floatCapBillion || 1)) * 100;

    const prompt = `Conduct a comprehensive institutional fundamental & Graham Number valuation audit on NEPSE scrip:
- Company: ${stock.symbol} (${stock.name || stock.sector})
- Sector: ${stock.sector} | Current LTP: NPR ${stock.ltp.toFixed(2)}
- Fundamentals: P/E: ${stock.pe}, EPS: NPR ${fundamentals.epsAnnualized}, Book Value (BVPS): NPR ${fundamentals.bvps}
- Graham Number Fair Value: NPR ${fundamentals.grahamNumber.toFixed(2)} (${grahamMargin >= 0 ? `+${grahamMargin.toFixed(1)}% Discount (Margin of Safety)` : `${grahamMargin.toFixed(1)}% Premium`})
- Capitalization: Market Cap NPR ${fundamentals.totalMarketCapBillion}B | Free Float: ${fundamentals.publicSharePct}% (NPR ${fundamentals.floatCapBillion}B)
- Liquidity Absorption: Daily Turnover NPR ${(stock.turnover / 10000000).toFixed(2)} Cr (${floatTurnoverPct.toFixed(2)}% of float traded)
- Risk & Beta: Beta vs NEPSE: ${analytics.beta.toFixed(2)}, Value at Risk (VaR 95%): ${analytics.var95.toFixed(2)}%, Standard Deviation: ${analytics.standardDeviation.toFixed(2)}
- Dividends: Latest Total Dividend: ${corporateActions.latestDividend?.totalDividendPct || 0}%, Cash Dividend: ${corporateActions.latestDividend?.cashDividendPct || 0}%, Bonus Shares: ${corporateActions.latestDividend?.bonusSharePct || 0}%

Deliver an executive institutional Markdown memorandum covering:
1. **Valuation & Margin of Safety:** Is the current LTP justified based on Benjamin Graham's intrinsic value formula and sector peers?
2. **Free-Float Absorption & Liquidity Risk:** Is public supply tightly locked or subject to dumping?
3. **Dividend Payback & Total Return Profile:** Bonus share compounding vs cash dividend sustainability.
4. **Institutional Conviction Rating:** (Strong Accumulate / Accumulate / Hold / Reduce / Avoid) with explicit entry targets and stop-loss boundaries.`;

    try {
      if (byokConfig?.apiKey) {
        setAiEngineUsed(
          byokConfig.provider === 'gemini'
            ? 'BYOK Gemini 3.8 Flash'
            : byokConfig.provider === 'groq'
            ? 'BYOK Groq Llama 3.3'
            : 'BYOK OpenRouter DeepSeek'
        );
      } else {
        setAiEngineUsed('Server Gemini 3.8 Flash / Quantitative Valuation Engine');
      }

      const res = await executeAIAnalysisDetailed(prompt, byokConfig || null);
      if (res.error) {
        setAiError(res.error);
      } else {
        setAiError(null);
      }

      if (res.text) {
        setAiAnalysisText(res.text);
      } else {
        // Fallback memo
        setAiAnalysisText(`### NEPSE Fundamental & Valuation Memo: **${stock.symbol}**

**1. Graham Intrinsic Value & Margin of Safety**
* **Graham Value:** NPR ${fundamentals.grahamNumber.toFixed(2)}
* **Current Market Price:** NPR ${stock.ltp.toFixed(2)}
* **Margin of Safety:** ${grahamMargin >= 0 ? `+${grahamMargin.toFixed(1)}% (Trading at discount to Graham value)` : `${grahamMargin.toFixed(1)}% (Trading at a growth premium)`}

**2. Float Dynamics & Capital Absorption**
* Public free float stands at **${fundamentals.publicSharePct}%** (NPR ${fundamentals.floatCapBillion}B).
* Daily liquidity absorption is estimated at **${floatTurnoverPct.toFixed(2)}%** of float.

**3. Dividend & Yield Profile**
* Latest bonus dividend: **${corporateActions.latestDividend?.bonusSharePct || 0}%**
* Latest cash dividend: **${corporateActions.latestDividend?.cashDividendPct || 0}%**

**4. Institutional Summary**
* Scrip presents a solid profile within the **${stock.sector}** sector. For swing positions, observe key moving average floors before initiating.`);
      }
    } catch (e: any) {
      setAiError(classifyAIError(e));
      setAiAnalysisText(`### NEPSE Fundamental & Valuation Memo: **${stock.symbol}**

**1. Graham Intrinsic Value & Margin of Safety**
* **Graham Value:** NPR ${fundamentals.grahamNumber.toFixed(2)}
* **Current Market Price:** NPR ${stock.ltp.toFixed(2)}
* **Margin of Safety:** ${grahamMargin >= 0 ? `+${grahamMargin.toFixed(1)}% (Trading at discount to Graham value)` : `${grahamMargin.toFixed(1)}% (Trading at a growth premium)`}

**2. Float Dynamics & Capital Absorption**
* Public free float stands at **${fundamentals.publicSharePct}%** (NPR ${fundamentals.floatCapBillion}B).
* Daily liquidity absorption is estimated at **${floatTurnoverPct.toFixed(2)}%** of float.

**3. Dividend & Yield Profile**
* Latest bonus dividend: **${corporateActions.latestDividend?.bonusSharePct || 0}%**
* Latest cash dividend: **${corporateActions.latestDividend?.cashDividendPct || 0}%**

**4. Institutional Summary**
* Scrip presents a solid profile within the **${stock.sector}** sector. For swing positions, observe key moving average floors before initiating.`);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const openGlossary = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedGlossaryKey(key);
  };

  const isUp = stock.change >= 0;

  return (
    <div className="bg-[#0e131d] border border-neutral-800/80 rounded-lg overflow-hidden space-y-4 p-4 text-xs">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-white">{stock.symbol}</span>
            <span className="text-neutral-400">· {stock.name || stock.sector}</span>
            <span className="text-[11px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60 font-mono">
              {fundamentals.quarter}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-[11px] tabular-nums text-neutral-300">
            <span>
              LTP: <strong className="text-white font-semibold">NPR {stock.ltp.toFixed(2)}</strong>
            </span>
            <span className={isUp ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
              {isUp ? '+' : ''}
              {stock.change.toFixed(2)} ({isUp ? '+' : ''}
              {stock.pChange.toFixed(2)}%)
            </span>
            <span className="text-neutral-500">·</span>
            <span>Registrar: <span className="text-neutral-200">{fundamentals.shareRegistrar}</span></span>
          </div>
        </div>

        {/* Sub-tab Navigation and AI Action */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-[#090d14] p-1 rounded-md border border-neutral-800 text-[11px]">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'capitalization', label: 'Cap & Float' },
              { id: 'valuation', label: 'Valuation & Graham' },
              { id: 'pivots_moving', label: 'Pivots & MAs' },
              { id: 'risk', label: 'Risk & Volatility' },
              { id: 'dividends', label: 'Dividends & Actions' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                  activeSubTab === tab.id
                    ? 'bg-neutral-800 text-cyan-400 font-semibold shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerateFundamentalAI}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-950/70 to-blue-950/70 hover:from-cyan-900/80 hover:to-blue-900/80 border border-cyan-800/80 rounded-md text-[11px] font-semibold text-cyan-300 transition-colors shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Valuation Memo</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: Overview Matrix */}
      {activeSubTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 tabular-nums">
            <div className="bg-[#090d14] p-2.5 rounded border border-neutral-800/80">
              <div className="flex items-center justify-between text-[10px] text-neutral-500 uppercase">
                <span>Graham Number</span>
                <button onClick={(e) => openGlossary('grahamNumber', e)} className="text-neutral-400 hover:text-cyan-400 cursor-pointer">
                  <Info className="w-3 h-3" />
                </button>
              </div>
              <div className="text-sm font-bold text-cyan-300 mt-1">NPR {fundamentals.grahamNumber}</div>
              <div className="text-[10px] text-neutral-400 mt-0.5">
                {stock.ltp < fundamentals.grahamNumber ? (
                  <span className="text-emerald-400">Undervalued Margin</span>
                ) : (
                  <span className="text-neutral-400">Premium to Graham</span>
                )}
              </div>
            </div>

            <div className="bg-[#090d14] p-2.5 rounded border border-neutral-800/80">
              <div className="flex items-center justify-between text-[10px] text-neutral-500 uppercase">
                <span>120 Days Average</span>
                <button onClick={(e) => openGlossary('avg120Days', e)} className="text-neutral-400 hover:text-cyan-400 cursor-pointer">
                  <Info className="w-3 h-3" />
                </button>
              </div>
              <div className="text-sm font-bold text-white mt-1">NPR {analytics.avg120Days}</div>
              <div className="text-[10px] text-neutral-400 mt-0.5">180D Avg: NPR {analytics.avg180Days}</div>
            </div>

            <div className="bg-[#090d14] p-2.5 rounded border border-neutral-800/80">
              <div className="flex items-center justify-between text-[10px] text-neutral-500 uppercase">
                <span>Beta (β vs NEPSE)</span>
                <button onClick={(e) => openGlossary('beta', e)} className="text-neutral-400 hover:text-cyan-400 cursor-pointer">
                  <Info className="w-3 h-3" />
                </button>
              </div>
              <div className="text-sm font-bold text-purple-300 mt-1">{analytics.beta}</div>
              <div className="text-[10px] text-neutral-400 mt-0.5">
                {analytics.beta > 1 ? 'High Volatility' : 'Defensive Float'}
              </div>
            </div>

            <div className="bg-[#090d14] p-2.5 rounded border border-neutral-800/80">
              <div className="flex items-center justify-between text-[10px] text-neutral-500 uppercase">
                <span>PEG Ratio</span>
                <button onClick={(e) => openGlossary('pegValue', e)} className="text-neutral-400 hover:text-cyan-400 cursor-pointer">
                  <Info className="w-3 h-3" />
                </button>
              </div>
              <div className="text-sm font-bold text-emerald-300 mt-1">{fundamentals.pegValue}</div>
              <div className="text-[10px] text-neutral-400 mt-0.5">Growth: {fundamentals.growthRate}%</div>
            </div>

            <div className="bg-[#090d14] p-2.5 rounded border border-neutral-800/80">
              <div className="flex items-center justify-between text-[10px] text-neutral-500 uppercase">
                <span>Book Value (BVPS)</span>
              </div>
              <div className="text-sm font-bold text-white mt-1">NPR {fundamentals.bvps}</div>
              <div className="text-[10px] text-neutral-400 mt-0.5">P/B: {fundamentals.pbRatio}x</div>
            </div>

            <div className="bg-[#090d14] p-2.5 rounded border border-neutral-800/80">
              <div className="flex items-center justify-between text-[10px] text-neutral-500 uppercase">
                <span>VaR (95% 1-Day)</span>
                <button onClick={(e) => openGlossary('var95', e)} className="text-neutral-400 hover:text-cyan-400 cursor-pointer">
                  <Info className="w-3 h-3" />
                </button>
              </div>
              <div className="text-sm font-bold text-rose-400 mt-1">{analytics.var95}%</div>
              <div className="text-[10px] text-neutral-400 mt-0.5">Vol (Ann): {analytics.standardDeviation}%</div>
            </div>
          </div>

          {/* Quick Technical Summary Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#090d14] p-3 rounded-lg border border-neutral-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Trend & Moving Average Confluence</span>
                <span className="text-[10px] text-neutral-400">Institutional MA Matrix</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[11px] tabular-nums">
                <div className="bg-[#0e131d] p-1.5 rounded border border-neutral-800">
                  <span className="text-neutral-500 text-[10px] block">MA 5</span>
                  <span className="font-semibold text-white">{analytics.ma5}</span>
                  <span className={`text-[10px] block ${analytics.ma5Signal === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {analytics.ma5Signal}
                  </span>
                </div>
                <div className="bg-[#0e131d] p-1.5 rounded border border-neutral-800">
                  <span className="text-neutral-500 text-[10px] block">MA 20</span>
                  <span className="font-semibold text-white">{analytics.ma20}</span>
                  <span className={`text-[10px] block ${analytics.ma20Signal === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {analytics.ma20Signal}
                  </span>
                </div>
                <div className="bg-[#0e131d] p-1.5 rounded border border-neutral-800">
                  <span className="text-neutral-500 text-[10px] block">MA 180</span>
                  <span className="font-semibold text-white">{analytics.ma180}</span>
                  <span className={`text-[10px] block ${analytics.ma180Signal === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {analytics.ma180Signal}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#090d14] p-3 rounded-lg border border-neutral-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Floor Trader Pivot Levels</span>
                <span className="text-[10px] text-neutral-400">S1/S2/S3 - R1/R2/R3</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[11px] tabular-nums">
                <div className="bg-[#0e131d] p-1.5 rounded border border-neutral-800">
                  <span className="text-neutral-500 text-[10px] block">Support (S1)</span>
                  <span className="font-semibold text-emerald-400">NPR {analytics.s1}</span>
                  <span className="text-[10px] text-neutral-500">S2: {analytics.s2}</span>
                </div>
                <div className="bg-[#0e131d] p-1.5 rounded border border-neutral-800">
                  <span className="text-neutral-500 text-[10px] block">Central Pivot</span>
                  <span className="font-semibold text-cyan-300">NPR {analytics.pivot}</span>
                  <span className="text-[10px] text-neutral-500">Base</span>
                </div>
                <div className="bg-[#0e131d] p-1.5 rounded border border-neutral-800">
                  <span className="text-neutral-500 text-[10px] block">Resistance (R1)</span>
                  <span className="font-semibold text-rose-400">NPR {analytics.r1}</span>
                  <span className="text-[10px] text-neutral-500">R2: {analytics.r2}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Capitalization & Float */}
      {activeSubTab === 'capitalization' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 tabular-nums">
            <div className="bg-[#090d14] p-3 rounded border border-neutral-800">
              <span className="text-neutral-500 text-[10px] uppercase block">Paid-Up Capital</span>
              <span className="text-sm font-bold text-white mt-1 block">NPR {fundamentals.paidUpCapitalCrore} Cr</span>
            </div>

            <div className="bg-[#090d14] p-3 rounded border border-neutral-800">
              <span className="text-neutral-500 text-[10px] uppercase block">Total Market Cap</span>
              <span className="text-sm font-bold text-white mt-1 block">NPR {fundamentals.totalMarketCapBillion}B</span>
            </div>

            <div className="bg-[#090d14] p-3 rounded border border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 text-[10px] uppercase block">Float Cap</span>
                <button onClick={(e) => openGlossary('floatCapBillion', e)} className="text-neutral-400 hover:text-cyan-400 cursor-pointer">
                  <Info className="w-3 h-3" />
                </button>
              </div>
              <span className="text-sm font-bold text-cyan-300 mt-1 block">NPR {fundamentals.floatCapBillion}B</span>
            </div>

            <div className="bg-[#090d14] p-3 rounded border border-neutral-800">
              <span className="text-neutral-500 text-[10px] uppercase block">Shareholding Structure</span>
              <span className="text-xs font-semibold text-white mt-1 block">
                Public: {fundamentals.publicSharePct}% · Promoter: {fundamentals.promoterSharePct}%
              </span>
            </div>

            <div className="bg-[#090d14] p-3 rounded border border-neutral-800">
              <span className="text-neutral-500 text-[10px] uppercase block">Share Registrar</span>
              <span className="text-xs font-semibold text-neutral-200 mt-1 block truncate">
                {fundamentals.shareRegistrar}
              </span>
            </div>

            <div className="bg-[#090d14] p-3 rounded border border-neutral-800">
              <span className="text-neutral-500 text-[10px] uppercase block">Listed Date</span>
              <span className="text-xs font-semibold text-neutral-300 mt-1 block">
                {fundamentals.listedDate}
              </span>
            </div>

            {fundamentals.capacityMW && (
              <div className="bg-[#090d14] p-3 rounded border border-neutral-800">
                <span className="text-neutral-500 text-[10px] uppercase block">Installed Capacity</span>
                <span className="text-sm font-bold text-cyan-300 mt-1 block">{fundamentals.capacityMW} MW</span>
                {fundamentals.costPerMWCrore && (
                  <span className="text-[10px] text-neutral-400">Cost: NPR {fundamentals.costPerMWCrore} Cr/MW</span>
                )}
              </div>
            )}

            {fundamentals.unlockingDate && (
              <div className="bg-[#090d14] p-3 rounded border border-neutral-800">
                <span className="text-neutral-500 text-[10px] uppercase block">Lock-in Expiry</span>
                <span className="text-xs font-semibold text-amber-300 mt-1 block">{fundamentals.unlockingDate}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Valuation & Graham */}
      {activeSubTab === 'valuation' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 tabular-nums">
            <div className="bg-[#090d14] p-3 rounded border border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 text-[10px] uppercase block">Graham Number</span>
                <button onClick={(e) => openGlossary('grahamNumber', e)} className="text-neutral-400 hover:text-cyan-400 cursor-pointer">
                  <Info className="w-3 h-3" />
                </button>
              </div>
              <span className="text-base font-bold text-cyan-400 mt-1 block">NPR {fundamentals.grahamNumber}</span>
              <span className="text-[10px] text-neutral-400">Adj Graham: NPR {fundamentals.adjustedGrahamNumber}</span>
            </div>

            <div className="bg-[#090d14] p-3 rounded border border-neutral-800">
              <span className="text-neutral-500 text-[10px] uppercase block">EPS (Reported / Ann)</span>
              <span className="text-sm font-bold text-white mt-1 block">
                NPR {fundamentals.epsReported} / {fundamentals.epsAnnualized}
              </span>
              <span className="text-[10px] text-neutral-400">Diluted: NPR {fundamentals.dilutedEps}</span>
            </div>

            <div className="bg-[#090d14] p-3 rounded border border-neutral-800">
              <span className="text-neutral-500 text-[10px] uppercase block">Book Value (Net Worth)</span>
              <span className="text-sm font-bold text-white mt-1 block">NPR {fundamentals.bvps}</span>
              <span className="text-[10px] text-neutral-400">P/B Ratio: {fundamentals.pbRatio}</span>
            </div>

            <div className="bg-[#090d14] p-3 rounded border border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 text-[10px] uppercase block">PEG Ratio</span>
                <button onClick={(e) => openGlossary('pegValue', e)} className="text-neutral-400 hover:text-cyan-400 cursor-pointer">
                  <Info className="w-3 h-3" />
                </button>
              </div>
              <span className="text-sm font-bold text-emerald-300 mt-1 block">{fundamentals.pegValue}</span>
              <span className="text-[10px] text-neutral-400">Growth: {fundamentals.growthRate}%</span>
            </div>

            <div className="bg-[#090d14] p-3 rounded border border-neutral-800">
              <span className="text-neutral-500 text-[10px] uppercase block">ROE (Return on Equity)</span>
              <span className="text-sm font-bold text-white mt-1 block">{fundamentals.roe}%</span>
            </div>

            <div className="bg-[#090d14] p-3 rounded border border-neutral-800">
              <span className="text-neutral-500 text-[10px] uppercase block">ROA (Return on Assets)</span>
              <span className="text-sm font-bold text-white mt-1 block">{fundamentals.roa}%</span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: Pivots & Moving Averages */}
      {activeSubTab === 'pivots_moving' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 7-Level Pivot Table */}
            <div className="bg-[#090d14] p-3 rounded-lg border border-neutral-800">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-white">7-Level Floor Trader Pivots</span>
                <button onClick={(e) => openGlossary('pivots', e)} className="text-neutral-400 hover:text-cyan-400 cursor-pointer">
                  <Info className="w-3 h-3" />
                </button>
              </div>
              <table className="w-full text-[11px] tabular-nums divide-y divide-neutral-800">
                <tbody>
                  <tr>
                    <td className="py-1 text-rose-400 font-medium">Resistance 3 (R3)</td>
                    <td className="py-1 text-right font-bold text-white">NPR {analytics.r3}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-rose-400 font-medium">Resistance 2 (R2)</td>
                    <td className="py-1 text-right font-bold text-white">NPR {analytics.r2}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-rose-300 font-medium">Resistance 1 (R1)</td>
                    <td className="py-1 text-right font-bold text-white">NPR {analytics.r1}</td>
                  </tr>
                  <tr className="bg-cyan-950/20">
                    <td className="py-1 text-cyan-300 font-bold">Pivot Point (PP)</td>
                    <td className="py-1 text-right font-bold text-cyan-300">NPR {analytics.pivot}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-emerald-300 font-medium">Support 1 (S1)</td>
                    <td className="py-1 text-right font-bold text-white">NPR {analytics.s1}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-emerald-400 font-medium">Support 2 (S2)</td>
                    <td className="py-1 text-right font-bold text-white">NPR {analytics.s2}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-emerald-500 font-medium">Support 3 (S3)</td>
                    <td className="py-1 text-right font-bold text-white">NPR {analytics.s3}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Moving Averages Matrix */}
            <div className="bg-[#090d14] p-3 rounded-lg border border-neutral-800">
              <span className="font-semibold text-white block mb-2">Institutional Moving Averages</span>
              <table className="w-full text-[11px] tabular-nums divide-y divide-neutral-800">
                <thead>
                  <tr className="text-neutral-500 text-[10px]">
                    <th className="py-1 text-left">Period</th>
                    <th className="py-1 text-right">Value (NPR)</th>
                    <th className="py-1 text-right">Signal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-1 text-neutral-300">MA 5 (Short-term)</td>
                    <td className="py-1 text-right font-medium">{analytics.ma5}</td>
                    <td className={`py-1 text-right font-bold ${analytics.ma5Signal === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {analytics.ma5Signal}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 text-neutral-300">MA 20 (Monthly)</td>
                    <td className="py-1 text-right font-medium">{analytics.ma20}</td>
                    <td className={`py-1 text-right font-bold ${analytics.ma20Signal === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {analytics.ma20Signal}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 text-neutral-300">MA 50 (Quarterly)</td>
                    <td className="py-1 text-right font-medium">{analytics.ma50}</td>
                    <td className={`py-1 text-right font-bold ${analytics.ma50Signal === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {analytics.ma50Signal}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 text-neutral-300">MA 120 (Semi-Annual)</td>
                    <td className="py-1 text-right font-medium">{analytics.ma120}</td>
                    <td className={`py-1 text-right font-bold ${analytics.ma120Signal === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {analytics.ma120Signal}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 text-neutral-300">MA 180 (Margin Lending Base)</td>
                    <td className="py-1 text-right font-medium">{analytics.ma180}</td>
                    <td className={`py-1 text-right font-bold ${analytics.ma180Signal === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {analytics.ma180Signal}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 text-neutral-300">MA 200 (Long-term Bull/Bear)</td>
                    <td className="py-1 text-right font-medium">{analytics.ma200}</td>
                    <td className={`py-1 text-right font-bold ${analytics.ma200Signal === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {analytics.ma200Signal}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: Risk & Quantitative Statistics */}
      {activeSubTab === 'risk' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 tabular-nums">
            <div className="bg-[#090d14] p-3 rounded border border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 text-[10px] uppercase block">Beta (β)</span>
                <button onClick={(e) => openGlossary('beta', e)} className="text-neutral-400 hover:text-cyan-400 cursor-pointer">
                  <Info className="w-3 h-3" />
                </button>
              </div>
              <span className="text-base font-bold text-purple-400 mt-1 block">{analytics.beta}</span>
              <span className="text-[10px] text-neutral-400">Relative to NEPSE</span>
            </div>

            <div className="bg-[#090d14] p-3 rounded border border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 text-[10px] uppercase block">Alpha (α)</span>
                <button onClick={(e) => openGlossary('alpha', e)} className="text-neutral-400 hover:text-cyan-400 cursor-pointer">
                  <Info className="w-3 h-3" />
                </button>
              </div>
              <span className={`text-base font-bold mt-1 block ${analytics.alpha >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {analytics.alpha >= 0 ? '+' : ''}{analytics.alpha}%
              </span>
              <span className="text-[10px] text-neutral-400">Excess Annual Return</span>
            </div>

            <div className="bg-[#090d14] p-3 rounded border border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 text-[10px] uppercase block">VaR 95% (1-Day)</span>
                <button onClick={(e) => openGlossary('var95', e)} className="text-neutral-400 hover:text-cyan-400 cursor-pointer">
                  <Info className="w-3 h-3" />
                </button>
              </div>
              <span className="text-base font-bold text-rose-400 mt-1 block">{analytics.var95}%</span>
              <span className="text-[10px] text-neutral-400">Daily Max Loss (95% Conf)</span>
            </div>

            <div className="bg-[#090d14] p-3 rounded border border-neutral-800">
              <span className="text-neutral-500 text-[10px] uppercase block">Annualized Volatility (σ)</span>
              <span className="text-base font-bold text-white mt-1 block">{analytics.standardDeviation}%</span>
              <span className="text-[10px] text-neutral-400">Variance: {analytics.variance}</span>
            </div>

            <div className="bg-[#090d14] p-3 rounded border border-neutral-800">
              <span className="text-neutral-500 text-[10px] uppercase block">Sharpe Ratio Proxy</span>
              <span className="text-base font-bold text-white mt-1 block">{analytics.sharpeRatio}</span>
              <span className="text-[10px] text-neutral-400">Risk-Adjusted Return</span>
            </div>

            <div className="bg-[#090d14] p-3 rounded border border-neutral-800">
              <span className="text-neutral-500 text-[10px] uppercase block">50D Average Volume</span>
              <span className="text-base font-bold text-white mt-1 block">{analytics.avg50DayVolume.toLocaleString()}</span>
              <span className="text-[10px] text-neutral-400">ATH Vol: {analytics.athVolume.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: Dividends & Corporate Actions */}
      {activeSubTab === 'dividends' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Latest Dividend */}
            <div className="bg-[#090d14] p-3 rounded-lg border border-neutral-800 space-y-1.5 tabular-nums">
              <span className="font-semibold text-white block">Latest Dividend Record</span>
              <div className="flex justify-between text-neutral-300">
                <span>Fiscal Year:</span>
                <span className="font-medium text-white">{corporateActions.latestDividend?.fiscalYear}</span>
              </div>
              <div className="flex justify-between text-neutral-300">
                <span>Bonus Share:</span>
                <span className="font-bold text-emerald-400">{corporateActions.latestDividend?.bonusSharePct}%</span>
              </div>
              <div className="flex justify-between text-neutral-300">
                <span>Cash Dividend:</span>
                <span className="font-bold text-cyan-300">{corporateActions.latestDividend?.cashDividendPct}%</span>
              </div>
              <div className="flex justify-between text-neutral-300 border-t border-neutral-800 pt-1">
                <span>Total Dividend:</span>
                <span className="font-bold text-white">{corporateActions.latestDividend?.totalDividendPct}%</span>
              </div>
              <div className="flex justify-between text-neutral-400 text-[10px]">
                <span>Book Close Date:</span>
                <span>{corporateActions.latestDividend?.bookCloseDate}</span>
              </div>
            </div>

            {/* Right Share */}
            <div className="bg-[#090d14] p-3 rounded-lg border border-neutral-800 space-y-1.5 tabular-nums">
              <span className="font-semibold text-white block">Right Share History</span>
              <div className="flex justify-between text-neutral-300">
                <span>Ratio:</span>
                <span className="font-bold text-white">{corporateActions.rightShare?.ratio}</span>
              </div>
              <div className="flex justify-between text-neutral-300">
                <span>Total Units:</span>
                <span>{corporateActions.rightShare?.units.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-neutral-400 text-[10px]">
                <span>Issue Window:</span>
                <span>{corporateActions.rightShare?.openingDate} to {corporateActions.rightShare?.closingDate}</span>
              </div>
            </div>

            {/* Auction */}
            <div className="bg-[#090d14] p-3 rounded-lg border border-neutral-800 space-y-1.5 tabular-nums">
              <span className="font-semibold text-white block">Promoter / Ordinary Auction</span>
              <div className="flex justify-between text-neutral-300">
                <span>Auction Units:</span>
                <span className="font-bold text-white">{corporateActions.auction?.totalUnits.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-neutral-400 text-[10px]">
                <span>Cutoff Window:</span>
                <span>{corporateActions.auction?.openingDate} to {corporateActions.auction?.closingDate}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Explanation Tooltip Modal */}
      {selectedGlossaryKey && INDICATOR_GLOSSARY[selectedGlossaryKey] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#0e131d] border border-neutral-800 rounded-xl max-w-md w-full p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-bold text-white">
                  {INDICATOR_GLOSSARY[selectedGlossaryKey].title}
                </h4>
              </div>
              <button onClick={() => setSelectedGlossaryKey(null)} className="text-neutral-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              {INDICATOR_GLOSSARY[selectedGlossaryKey].description}
            </p>
            {INDICATOR_GLOSSARY[selectedGlossaryKey].formula && (
              <div className="bg-[#090d14] p-2.5 rounded border border-neutral-800 text-[11px] font-mono text-cyan-300">
                <strong>Formula: </strong>{INDICATOR_GLOSSARY[selectedGlossaryKey].formula}
              </div>
            )}
            <div className="bg-emerald-950/30 p-2.5 rounded border border-emerald-900/50 text-[11px] text-emerald-300">
              <strong>NEPSE Trader Tip: </strong>{INDICATOR_GLOSSARY[selectedGlossaryKey].tip}
            </div>
          </div>
        </div>
      )}

      {/* AI Fundamental Valuation Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-[#090d14] border border-neutral-800 rounded-xl shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>AI NEPSE Institutional Fundamental & Graham Valuation Memo</span>
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
                <div className="text-sm font-semibold text-white">Synthesizing Fundamental & Intrinsic Value Audit...</div>
                <div className="text-xs text-neutral-400">Processing Graham Number, free-float liquidity & dividend sustainability</div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* AI Error Diagnostic Banner */}
                {aiError && (
                  <AIErrorBanner
                    error={aiError}
                    onUpdateKey={onOpenVault}
                    onRetry={handleGenerateFundamentalAI}
                    onDismiss={() => setAiError(null)}
                    compact={Boolean(aiAnalysisText)}
                  />
                )}

                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Engine: {aiEngineUsed}</span>
                  </div>
                  <span className="font-mono">{stock.symbol} ({stock.sector})</span>
                </div>
                <div className="p-4 bg-[#0e131d] border border-neutral-800/80 rounded-lg text-xs leading-relaxed text-neutral-200 font-sans">
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
