import React, { useState } from 'react';
import { X, Sparkles, RefreshCw, KeyRound, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { StockItem, Candle, BYOKConfig } from '../types/market';
import { computeTechnicalSnapshot } from '../utils/technicalIndicators';
import { MarkdownRenderer } from './MarkdownRenderer';
import { AIErrorBanner, AIErrorInfo, classifyAIError } from './AIErrorBanner';

interface AIChartInsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: StockItem;
  candles: Candle[];
  byokConfig: BYOKConfig | null;
  onOpenVault: () => void;
}

export const AIChartInsightModal: React.FC<AIChartInsightModalProps> = ({
  isOpen,
  onClose,
  stock,
  candles,
  byokConfig,
  onOpenVault,
}) => {
  const [analysisText, setAnalysisText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [usedEngine, setUsedEngine] = useState<string>('');
  const [aiError, setAiError] = useState<AIErrorInfo | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    setAnalysisText('');
    setAiError(null);

    const technicals = computeTechnicalSnapshot(stock.symbol, candles);
    const ltp = stock.ltp;
    const isAbove200 = ltp >= technicals.sma200;
    const isAbove50 = ltp >= technicals.sma50;
    const isAbove20 = ltp >= technicals.sma20;

    const prompt = `### Target Scrip Profile: Symbol: ${stock.symbol} (${stock.name})
Sector: ${stock.sector}
Current LTP: NPR ${ltp.toFixed(2)} (${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)} / ${stock.pChange.toFixed(2)}%).
52-Week Range: NPR ${stock.low52} - NPR ${stock.high52}.
Technical Snapshot:
- SMA 20: NPR ${technicals.sma20.toFixed(2)} (Price is ${isAbove20 ? 'Above / Bullish Support' : 'Below / Overhead Resistance'})
- SMA 50: NPR ${technicals.sma50.toFixed(2)} (Price is ${isAbove50 ? 'Above / Intermediate Trend Positive' : 'Below / Corrective Phase'})
- SMA 200: NPR ${technicals.sma200.toFixed(2)} (Price is ${isAbove200 ? 'Above / Secular Bullish Baseline' : 'Below / Long-Term Bearish'})
- RSI (14): ${technicals.rsi14} (${technicals.rsi14 > 70 ? 'Overbought' : technicals.rsi14 < 30 ? 'Oversold' : 'Neutral Range'})
- MACD Histogram: ${technicals.macd.histogram}
- Classical Pivot Levels: PP=NPR ${technicals.pivotPoints.pivot.toFixed(2)}, R1=NPR ${technicals.pivotPoints.r1.toFixed(2)}, R2=NPR ${technicals.pivotPoints.r2.toFixed(2)}, S1=NPR ${technicals.pivotPoints.s1.toFixed(2)}, S2=NPR ${technicals.pivotPoints.s2.toFixed(2)}.

Deliver a focused quantitative institutional report for ${stock.symbol} (${stock.name}):
1. **Current Trend Regime & Momentum Analysis**
2. **Critical Mathematical Support & Resistance Pivots**
3. **Breakout Targets & Defensive Invalidation Level**
4. **Actionable Trading Guidance for NEPSE Traders**
*(Disclaimer: Educational technical analysis only. Not investment advice.)*`;

    let capturedError: AIErrorInfo | null = null;

    try {
      // 1. Check if user provided BYOK key
      if (byokConfig && byokConfig.apiKey) {
        setUsedEngine(`BYOK (${byokConfig.provider} · ${byokConfig.model})`);
        const modelToUse = byokConfig.model || 'gemini-2.5-flash';
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${encodeURIComponent(byokConfig.apiKey)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            setAnalysisText(text);
            setIsLoading(false);
            setAiError(null);
            return;
          } else {
            capturedError = classifyAIError('No response returned from BYOK AI model.');
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          capturedError = classifyAIError({ message: errData?.error?.message, status: res.status });
        }
      }

      // 2. Try server-side Gemini API proxy
      const serverRes = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (serverRes.ok) {
        const serverData = await serverRes.json();
        if (serverData.error || serverData.warning) {
          capturedError = classifyAIError(serverData.error || serverData.warning);
        }
        if (serverData.text) {
          setUsedEngine(serverData.engine || 'Server Institutional AI');
          setAnalysisText(serverData.text);
          setAiError(capturedError);
          setIsLoading(false);
          return;
        }
      } else {
        const errData = await serverRes.json().catch(() => ({}));
        capturedError = classifyAIError({ message: errData?.error, status: serverRes.status });
      }
    } catch (e) {
      console.warn('AI API fetch fell back to institutional quant engine:', e);
      capturedError = classifyAIError(e);
    }

    // 3. Fallback: Immediate Deterministic Institutional Quantitative Analysis (Free, 0 cost, 100% reliable)
    setUsedEngine('Institutional Quantitative Engine (Fallback)');
    const rsiState = technicals.rsi14 > 70 ? 'Overbought' : technicals.rsi14 < 30 ? 'Oversold' : 'Neutral Range';
    const trendState = isAbove200 && isAbove50 ? 'Strong Bullish Structure' : isAbove20 ? 'Short-Term Upward Consolidation' : 'Corrective Bearish Pullback';

    const fallbackReport = `### 1. Trend & Momentum Assessment
- **Regime**: **${trendState}**
- **Price vs Key Averages**:
  - 20 SMA: NPR ${technicals.sma20.toFixed(2)} (${isAbove20 ? '✅ Above - Bullish Support' : '⚠️ Below - Immediate Overhead Resistance'})
  - 50 SMA: NPR ${technicals.sma50.toFixed(2)} (${isAbove50 ? '✅ Above - Intermediate Trend Positive' : '⚠️ Below - Distribution Zone'})
  - 200 SMA: NPR ${technicals.sma200.toFixed(2)} (${isAbove200 ? '✅ Above - Secular Bullish Baseline' : '⚠️ Below - Secular Resistance'})
- **Momentum (RSI 14)**: **${technicals.rsi14.toFixed(1)}** (${rsiState}).
- **MACD**: Histogram reads **${technicals.macd.histogram >= 0 ? '+' : ''}${technicals.macd.histogram.toFixed(2)}**, signaling ${technicals.macd.histogram >= 0 ? 'expanding upward momentum' : 'bearish deceleration'}.

---

### 2. Critical Mathematical Support & Resistance
- **Primary Resistance 1 (R1)**: **NPR ${technicals.pivotPoints.r1.toFixed(2)}**
- **Secondary Resistance 2 (R2)**: **NPR ${technicals.pivotPoints.r2.toFixed(2)}** (Breakout trigger zone)
- **Daily Pivot Point (PP)**: **NPR ${technicals.pivotPoints.pivot.toFixed(2)}** (Intraday benchmark)
- **Primary Support 1 (S1)**: **NPR ${technicals.pivotPoints.s1.toFixed(2)}**
- **Secondary Support 2 (S2)**: **NPR ${technicals.pivotPoints.s2.toFixed(2)}** (Circuit boundary cushion)

---

### 3. Actionable NEPSE Trading Strategy
- **Bullish Confirmation**: A daily close above **NPR ${technicals.pivotPoints.r1.toFixed(2)}** accompanied by above-average session volume validates a continuation push toward **NPR ${technicals.pivotPoints.r2.toFixed(2)}**.
- **Defensive Invalidation**: If the price breaks down beneath **NPR ${technicals.pivotPoints.s1.toFixed(2)}**, institutional margin lenders and swing traders typically tighten stop-losses down to **NPR ${technicals.pivotPoints.s2.toFixed(2)}**.`;

    setAnalysisText(fallbackReport);
    setAiError(capturedError);
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl bg-[#090d14] border border-neutral-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-[#0c101a]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/80 text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>AI Technical Intelligence: {stock.symbol}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono">
                  NPR {stock.ltp.toFixed(2)}
                </span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Automated multi-timeframe pattern detection, pivot breakout targets, and risk audit
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

        {/* Engine Banner */}
        <div className="px-4 py-2.5 bg-[#06080d] border-b border-neutral-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-neutral-400">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              Engine: <strong className="text-neutral-200">{usedEngine || (byokConfig?.apiKey ? 'BYOK Gemini' : 'Auto Server / Free Quant Engine')}</strong>
            </span>
          </div>

          <button
            onClick={onOpenVault}
            className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors text-[11px] underline cursor-pointer"
          >
            <KeyRound className="w-3 h-3" />
            <span>{byokConfig?.apiKey ? 'Configure Personal BYOK Key' : 'Add Personal BYOK Key (Optional)'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* AI Diagnostic Alert Banner */}
          {aiError && (
            <AIErrorBanner
              error={aiError}
              onUpdateKey={onOpenVault}
              onRetry={handleGenerate}
              onDismiss={() => setAiError(null)}
              compact={Boolean(analysisText)}
            />
          )}

          {!analysisText && !isLoading ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-12 h-12 rounded-full bg-cyan-950/40 border border-cyan-800/60 text-cyan-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">Generate Real-Time Technical Audit</h4>
                <p className="text-xs text-neutral-400 max-w-md mx-auto">
                  Evaluate price action against multi-month moving averages, 7-level pivot points, and momentum indicators for <strong>{stock.symbol}</strong>.
                </p>
              </div>
              <button
                onClick={handleGenerate}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-lg text-xs shadow-lg shadow-cyan-950 transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Run Instant Analysis</span>
              </button>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12 space-y-3">
              <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto" />
              <div className="text-xs text-neutral-300 font-medium">Synthesizing institutional technical signals...</div>
              <div className="text-[11px] text-neutral-500">Cross-referencing SMA 20/50/200, RSI, MACD, and pivot points</div>
            </div>
          ) : (
            <div className="p-4 bg-[#0e131d] border border-neutral-800/80 rounded-lg text-xs leading-relaxed text-neutral-200 font-sans">
              <MarkdownRenderer content={analysisText} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-neutral-800 bg-[#0c101a] flex items-center justify-between text-xs">
          <span className="text-[11px] text-neutral-500">
            For educational & analytical market research only. Not financial advice.
          </span>

          <div className="flex items-center gap-2">
            {analysisText && (
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Re-analyze</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
