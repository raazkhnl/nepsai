import React, { useState } from 'react';
import { StockItem, TechnicalIndicatorsResult, SectorSummary, BYOKConfig } from '../types/market';
import { buildNEPSEPrompt, executeAIAnalysisDetailed } from '../utils/aiPrompt';
import { Sparkles, KeyRound, AlertCircle, RefreshCw, Send, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { AIErrorBanner, AIErrorInfo, classifyAIError } from './AIErrorBanner';
import { NepsAiIcon } from './NepsAiLogo';

interface AIAnalyticsViewProps {
  selectedStock: StockItem;
  technicals: TechnicalIndicatorsResult;
  sectorSummary?: SectorSummary;
  byokConfig: BYOKConfig | null;
  openKeyModal: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AIAnalyticsView: React.FC<AIAnalyticsViewProps> = ({
  selectedStock,
  technicals,
  sectorSummary,
  byokConfig,
  openKeyModal,
}) => {
  const [strategyMode, setStrategyMode] = useState<'swing' | 'value' | 'scalp' | 'risk'>('swing');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aiError, setAiError] = useState<AIErrorInfo | null>(null);
  const [customQuestion, setCustomQuestion] = useState('');

  const hasByok = Boolean(byokConfig && byokConfig.apiKey);

  const handleGenerateAnalysis = async (userPrompt?: string) => {
    setIsLoading(true);
    setAiError(null);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (userPrompt) {
      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          role: 'user',
          text: userPrompt,
          timestamp: timeStr,
        },
      ]);
      setCustomQuestion('');
    }

    try {
      let promptToUse: string;
      if (userPrompt) {
        promptToUse = `${buildNEPSEPrompt(selectedStock, technicals, sectorSummary, strategyMode)}

### Specific User Inquiry Regarding ${selectedStock.symbol}:
${userPrompt}

Please directly and specifically answer the user inquiry above in clean Markdown, referencing current LTP NPR ${selectedStock.ltp.toFixed(2)}, technical indicators, and price levels for ${selectedStock.symbol}.`;
      } else {
        promptToUse = buildNEPSEPrompt(selectedStock, technicals, sectorSummary, strategyMode);
      }

      const result = await executeAIAnalysisDetailed(promptToUse, byokConfig);
      const resTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (result.error) {
        setAiError(result.error);
      } else {
        setAiError(null);
      }

      if (result.text && result.text.trim().length > 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            text: result.text,
            timestamp: resTime,
          },
        ]);
      }
    } catch (err: any) {
      setAiError(classifyAIError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunOfflineFallback = () => {
    const resTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isAbove200 = selectedStock.ltp >= technicals.sma200;
    const isAbove50 = selectedStock.ltp >= technicals.sma50;
    const isAbove20 = selectedStock.ltp >= technicals.sma20;
    const rsiState = technicals.rsi14 > 70 ? 'Overbought' : technicals.rsi14 < 30 ? 'Oversold' : 'Neutral Equilibrium';

    const fallbackReport = `### NEPSE Quantitative Institutional Audit: **${selectedStock.symbol} (${selectedStock.name})**

**1. Trend Stance & Moving Average Matrix:**
* **Regime:** **${isAbove200 && isAbove50 ? 'Strong Bullish Expansion' : isAbove20 ? 'Consolidating Above Short-Term Base' : 'Corrective Pullback'}**
* **Price vs Moving Averages:**
  * 20 SMA: NPR ${technicals.sma20.toFixed(2)} (${isAbove20 ? '✅ Above / Immediate Support' : '⚠️ Below / Short-term Resistance'})
  * 50 SMA: NPR ${technicals.sma50.toFixed(2)} (${isAbove50 ? '✅ Above / Medium-term Trend Bullish' : '⚠️ Below / Overhead Supply'})
  * 200 SMA: NPR ${technicals.sma200.toFixed(2)} (${isAbove200 ? '✅ Above / Long-term Secular Bullish' : '⚠️ Below / Long-term Distribution'})

**2. Momentum & Volatility (RSI & MACD):**
* **RSI (14):** **${technicals.rsi14.toFixed(1)}** (${rsiState}).
* **MACD Histogram:** reads **${technicals.macd.histogram >= 0 ? '+' : ''}${technicals.macd.histogram.toFixed(2)}**, confirming ${technicals.macd.histogram >= 0 ? 'expanding accumulation pressure' : 'controlled selling distribution'}.

**3. Classical Support & Resistance Pivots:**
* **R2 (Breakout Target):** NPR ${technicals.pivotPoints.r2.toFixed(2)}
* **R1 (Primary Resistance):** NPR ${technicals.pivotPoints.r1.toFixed(2)}
* **Central Pivot (PP):** NPR ${technicals.pivotPoints.pivot.toFixed(2)}
* **S1 (Immediate Demand Floor):** NPR ${technicals.pivotPoints.s1.toFixed(2)}
* **S2 (Circuit Defensive Cushion):** NPR ${technicals.pivotPoints.s2.toFixed(2)}

**4. Actionable Strategy Guidance:**
* Initiate swing positions on confirmed retests of the 20-day SMA or daily close above R1 with volume expansion.
* Enforce stop-loss invalidation below S1 to manage capital per NEPSE 10% circuit limits and T+2 settlement.

*(Generated via Deterministic Quantitative Engine)*`;

    setMessages((prev) => [
      ...prev,
      {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: fallbackReport,
        timestamp: resTime,
      },
    ]);
    setAiError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header and Engine Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
            <NepsAiIcon size={26} showGlow={true} />
            <span>NEPSE AI Quantitative &amp; Technical Analyst</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Automated technical reports grounded in multi-factor price action, RSI momentum, and Nepal market dynamics.
          </p>
        </div>

        {/* Engine mode badge / button */}
        <div className="flex items-center gap-2">
          {hasByok ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-950/40 border border-cyan-800/80 text-xs text-cyan-300">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>BYOK Active: {byokConfig?.provider.toUpperCase()} ({byokConfig?.model})</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-950/40 border border-emerald-800/80 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Server Gemini 3.8 Flash Ready</span>
            </div>
          )}

          <button
            onClick={openKeyModal}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded text-neutral-300 transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Change Key</span>
          </button>
        </div>
      </div>

      {/* Target Scrip Context Card */}
      <div className="bg-[#0e131d] border border-neutral-800/80 rounded-lg p-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800/60 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white">{selectedStock.symbol}</span>
              <span className="text-xs text-neutral-400">· {selectedStock.name}</span>
              <span className="text-xs text-neutral-500">({selectedStock.sector})</span>
            </div>
            <div className="text-xs text-neutral-300 mt-1 tabular-nums">
              Current LTP: <strong className="text-white">NPR {selectedStock.ltp.toFixed(2)}</strong> (
              <span className={selectedStock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {selectedStock.change >= 0 ? '+' : ''}
                {selectedStock.pChange.toFixed(2)}%
              </span>
              ) · 52W: NPR {selectedStock.low52} - NPR {selectedStock.high52}
            </div>
          </div>

          {/* Strategy Mode Buttons */}
          <div className="flex items-center gap-1.5 bg-[#090d14] p-1 rounded-md border border-neutral-800 text-xs">
            <button
              onClick={() => setStrategyMode('swing')}
              className={`px-3 py-1 rounded transition-colors ${
                strategyMode === 'swing'
                  ? 'bg-neutral-800 text-cyan-400 font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Swing Trading
            </button>
            <button
              onClick={() => setStrategyMode('value')}
              className={`px-3 py-1 rounded transition-colors ${
                strategyMode === 'value'
                  ? 'bg-neutral-800 text-cyan-400 font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Value & Div
            </button>
            <button
              onClick={() => setStrategyMode('scalp')}
              className={`px-3 py-1 rounded transition-colors ${
                strategyMode === 'scalp'
                  ? 'bg-neutral-800 text-cyan-400 font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Support/Res
            </button>
            <button
              onClick={() => setStrategyMode('risk')}
              className={`px-3 py-1 rounded transition-colors ${
                strategyMode === 'risk'
                  ? 'bg-neutral-800 text-cyan-400 font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Risk Audit
            </button>
          </div>
        </div>

        {/* Indicators Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 text-xs tabular-nums">
          <div className="bg-[#090d14] p-2 rounded border border-neutral-800/60">
            <span className="text-[10px] text-neutral-500 uppercase block">RSI (14)</span>
            <span
              className={`font-bold ${
                technicals.rsi14 > 70
                  ? 'text-rose-400'
                  : technicals.rsi14 < 30
                  ? 'text-emerald-400'
                  : 'text-neutral-200'
              }`}
            >
              {technicals.rsi14} ({technicals.rsi14 > 70 ? 'OB' : technicals.rsi14 < 30 ? 'OS' : 'Neutral'})
            </span>
          </div>

          <div className="bg-[#090d14] p-2 rounded border border-neutral-800/60">
            <span className="text-[10px] text-neutral-500 uppercase block">200 SMA</span>
            <span className="font-semibold text-white">NPR {technicals.sma200.toFixed(1)}</span>
          </div>

          <div className="bg-[#090d14] p-2 rounded border border-neutral-800/60">
            <span className="text-[10px] text-neutral-500 uppercase block">MACD Hist</span>
            <span
              className={`font-semibold ${
                technicals.macd.histogram >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {technicals.macd.histogram >= 0 ? '+' : ''}
              {technicals.macd.histogram}
            </span>
          </div>

          <div className="bg-[#090d14] p-2 rounded border border-neutral-800/60">
            <span className="text-[10px] text-neutral-500 uppercase block">Pivot Level</span>
            <span className="font-semibold text-cyan-300">
              NPR {technicals.pivotPoints.pivot.toFixed(1)}
            </span>
          </div>

          <div className="bg-[#090d14] p-2 rounded border border-neutral-800/60">
            <span className="text-[10px] text-neutral-500 uppercase block">Algorithmic Stance</span>
            <span className="font-semibold text-emerald-400 truncate block">
              {technicals.trendSignal}
            </span>
          </div>
        </div>

        {/* Generate Primary Button */}
        <div className="mt-4 flex items-center justify-end">
          <button
            onClick={() => handleGenerateAnalysis()}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-md"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-black" />
            ) : (
              <Sparkles className="w-4 h-4 text-black" />
            )}
            <span>{isLoading ? 'Synthesizing Market Data...' : `Analyze ${selectedStock.symbol} with AI`}</span>
          </button>
        </div>
      </div>

      {/* Elegant AI Error Handling Banner */}
      {aiError && (
        <AIErrorBanner
          error={aiError}
          onUpdateKey={openKeyModal}
          onRetry={() => handleGenerateAnalysis(customQuestion || undefined)}
          onUseFallback={handleRunOfflineFallback}
          onDismiss={() => setAiError(null)}
        />
      )}

      {/* Messages Thread */}
      {messages.length > 0 && (
        <div className="bg-[#0e131d] border border-neutral-800/80 rounded-lg p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">
                Technical Analysis & Intelligence: {selectedStock.symbol}
              </h3>
            </div>
            <button
              onClick={() => handleGenerateAnalysis()}
              disabled={isLoading}
              className="text-xs text-neutral-400 hover:text-cyan-400 flex items-center gap-1 cursor-pointer disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Regenerate Base Analysis</span>
            </button>
          </div>

          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-lg p-4 transition-all ${
                  msg.role === 'user'
                    ? 'bg-cyan-950/30 border border-cyan-800/60 ml-6 text-cyan-200'
                    : 'bg-[#090d14] border border-neutral-800/80 mr-2 text-neutral-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-neutral-800/40 text-[11px]">
                  <span className={`font-semibold ${msg.role === 'user' ? 'text-cyan-400' : 'text-emerald-400 flex items-center gap-1.5'}`}>
                    {msg.role === 'user' ? 'You' : (
                      <>
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span>NEPSE Quantitative Analyst</span>
                      </>
                    )}
                  </span>
                  <span className="text-neutral-500 font-mono">{msg.timestamp}</span>
                </div>
                <div className="text-xs leading-relaxed font-sans">
                  {msg.role === 'assistant' ? (
                    <MarkdownRenderer content={msg.text} />
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Active generating loader */}
            {isLoading && (
              <div className="bg-[#090d14] border border-cyan-800/80 rounded-lg p-5 space-y-3 animate-pulse shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent animate-pulse"></div>
                <div className="flex items-center gap-2.5 text-xs font-bold text-cyan-400">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-5 h-5 rounded-full bg-cyan-500/30 animate-ping"></div>
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                  </div>
                  <span>Synthesizing institutional AI quantitative response for {selectedStock.symbol}...</span>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="h-3 bg-neutral-800/80 rounded w-full"></div>
                  <div className="h-3 bg-neutral-800/60 rounded w-5/6"></div>
                  <div className="h-3 bg-neutral-800/40 rounded w-4/6"></div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Follow-up Question Suggestion Chips */}
          <div className="pt-2">
            <span className="text-[11px] text-neutral-500 block mb-1.5 font-medium">Suggested queries:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                `What is the optimal stop-loss for ${selectedStock.symbol}?`,
                `Explain key resistance R1 & R2 pivots`,
                `How does ${selectedStock.symbol} compare to the ${selectedStock.sector} sector?`,
                `What are the volume absorption signals?`,
              ].map((query, idx) => (
                <button
                  key={idx}
                  onClick={() => handleGenerateAnalysis(query)}
                  disabled={isLoading}
                  className="px-2.5 py-1 text-[11px] rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-neutral-300 hover:text-cyan-300 transition-colors cursor-pointer disabled:opacity-40"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>

          {/* Follow-up Question Input Box */}
          <div className="pt-3 border-t border-neutral-800/80">
            <label className="block text-xs font-medium text-neutral-400 mb-2">
              Ask a specific question regarding {selectedStock.symbol}:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={`Ask anything about ${selectedStock.symbol} price action, indicators, or sector trends...`}
                value={customQuestion}
                disabled={isLoading}
                onChange={(e) => setCustomQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customQuestion.trim() && !isLoading) {
                    handleGenerateAnalysis(customQuestion);
                  }
                }}
                className="flex-1 bg-[#090d14] border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
              />
              <button
                onClick={() => {
                  if (customQuestion.trim() && !isLoading) {
                    handleGenerateAnalysis(customQuestion);
                  }
                }}
                disabled={isLoading || !customQuestion.trim()}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-cyan-400 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
              >
                {isLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
