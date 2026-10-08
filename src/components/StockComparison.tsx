import React, { useEffect, useRef, useState } from 'react';
import { StockItem, Candle, BYOKConfig } from '../types/market';
import { createChart, ColorType, LineSeries, CandlestickSeries, HistogramSeries, IChartApi } from 'lightweight-charts';
import { GitCompare, Plus, X, TrendingUp, TrendingDown, RefreshCw, BarChart2, Sparkles, KeyRound, CheckCircle2, Layers, LineChart } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { AIErrorBanner, AIErrorInfo, classifyAIError } from './AIErrorBanner';

interface StockComparisonProps {
  stocks: StockItem[];
  defaultSymbols?: string[];
  onSelectScrip: (scrip: StockItem) => void;
  onNavigateToTerminal: () => void;
  byokConfig?: BYOKConfig | null;
  onOpenVault?: () => void;
}

const COMPARISON_COLORS = ['#38bdf8', '#f59e0b', '#10b981', '#f43f5e', '#a855f7', '#ec4899'];

// Strictly sanitize candles to prevent bad outliers, NaN, or sudden zero spikes on last day
function sanitizeCandles(rawBars: Candle[]): Candle[] {
  if (!rawBars || rawBars.length === 0) return [];

  const valid = rawBars
    .map((c) => {
      if (!c || !c.time) return null;
      const timeStr = typeof c.time === 'string' ? c.time.trim() : String(c.time);
      if (!/^\d{4}-\d{2}-\d{2}/.test(timeStr)) return null;
      const open = Number(c.open);
      const close = Number(c.close);
      if (isNaN(open) || isNaN(close) || open <= 0 || close <= 0) return null;
      const rawHigh = Number(c.high);
      const rawLow = Number(c.low);
      const high = Math.max(open, close, isNaN(rawHigh) ? open : rawHigh);
      const low = Math.min(open, close, isNaN(rawLow) ? close : rawLow);
      const rawVol = Number(c.volume);
      const volume = Number.isFinite(rawVol) ? Math.max(0, rawVol) : 0;
      return {
        time: timeStr.slice(0, 10) as any,
        open,
        high,
        low,
        close,
        volume,
      };
    })
    .filter((b): b is Candle => b !== null)
    .sort((a, b) => (a.time > b.time ? 1 : a.time < b.time ? -1 : 0))
    .filter((item, i, arr) => i === 0 || item.time !== arr[i - 1].time);

  // Clean consecutive extreme outliers (> 35% jump without volume, typically corrupt scrape artifact)
  const cleaned: Candle[] = [];
  for (let i = 0; i < valid.length; i++) {
    const cur = valid[i];
    if (i > 0) {
      const prev = cleaned[cleaned.length - 1];
      const ratio = cur.close / (prev.close || 1);
      // If jump is more than 50% in a single day on NEPSE (circuit limit is 10%), smooth to reasonable band
      if (ratio > 1.6 || ratio < 0.4) {
        cleaned.push({
          ...cur,
          close: Number((prev.close * (ratio > 1 ? 1.099 : 0.901)).toFixed(2)),
          high: Math.max(cur.open, Number((prev.close * (ratio > 1 ? 1.1 : 0.901)).toFixed(2))),
          low: Math.min(cur.open, Number((prev.close * (ratio > 1 ? 1.099 : 0.901)).toFixed(2))),
        });
        continue;
      }
    }
    cleaned.push(cur);
  }

  return cleaned;
}

export const StockComparison: React.FC<StockComparisonProps> = ({
  stocks,
  defaultSymbols = ['NEPSE'],
  onSelectScrip,
  onNavigateToTerminal,
  byokConfig = null,
  onOpenVault = () => {},
}) => {
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(defaultSymbols);
  const [timeframeDays, setTimeframeDays] = useState<number>(66); // 3M default
  const [newSymbolSelect, setNewSymbolSelect] = useState<string>('');
  const [historyCache, setHistoryCache] = useState<Record<string, Candle[]>>({});
  const [loadingSymbols, setLoadingSymbols] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'normalized' | 'candlestick'>('candlestick'); // Stacked candlestick as default!

  // AI Comparison state
  const [aiModalOpen, setAiModalOpen] = useState<boolean>(false);
  const [aiAnalysisText, setAiAnalysisText] = useState<string>('');
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiEngineUsed, setAiEngineUsed] = useState<string>('');
  const [aiError, setAiError] = useState<AIErrorInfo | null>(null);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);

  const stackedChartRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const stackedInstancesRef = useRef<Record<string, IChartApi>>({});

  const availableToAdd = stocks.filter((s) => !selectedSymbols.includes(s.symbol));

  // Fetch actual, verified exchange bars from backend for all selected symbols
  useEffect(() => {
    let isCancelled = false;

    const loadHistories = async () => {
      const symbolsToFetch = selectedSymbols.filter(
        (sym) => !historyCache[sym] || historyCache[sym].length === 0
      );

      if (symbolsToFetch.length === 0) return;

      setLoadingSymbols((prev) => {
        const next = { ...prev };
        symbolsToFetch.forEach((sym) => { next[sym] = true; });
        return next;
      });

      const updatedEntries: Record<string, Candle[]> = {};

      await Promise.all(
        symbolsToFetch.map(async (sym) => {
          try {
            const res = await fetch(`/api/market/history?symbol=${encodeURIComponent(sym)}&adjusted=true`);
            if (res.ok) {
              const data = await res.json();
              if (data.bars && data.bars.length > 0) {
                const cleaned = sanitizeCandles(data.bars);
                if (cleaned.length > 0) {
                  updatedEntries[sym] = cleaned;
                }
              }
            }
          } catch (err) {
            console.warn(`Failed to fetch history for comparison symbol ${sym}:`, err);
          } finally {
            if (!isCancelled) {
              setLoadingSymbols((prev) => ({ ...prev, [sym]: false }));
            }
          }
        })
      );

      if (!isCancelled && Object.keys(updatedEntries).length > 0) {
        setHistoryCache((prev) => ({ ...prev, ...updatedEntries }));
      }
    };

    loadHistories();

    return () => {
      isCancelled = true;
    };
  }, [selectedSymbols]);

  const handleAddSymbol = (sym: string) => {
    if (!sym) return;
    if (selectedSymbols.length < 6 && !selectedSymbols.includes(sym)) {
      setSelectedSymbols([...selectedSymbols, sym]);
      setNewSymbolSelect('');
    }
  };

  const handleRemoveSymbol = (sym: string) => {
    if (selectedSymbols.length > 1) {
      setSelectedSymbols(selectedSymbols.filter((s) => s !== sym));
    }
  };

  // Render normalized chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 440,
      layout: {
        background: { type: ColorType.Solid, color: '#090d14' },
        textColor: '#8b949e',
        fontSize: 11,
        fontFamily: "'JetBrains Mono', monospace",
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.04)' },
      },
      rightPriceScale: {
        borderColor: '#21262d',
        mode: 2, // Percentage scale (0% baseline)
      },
      timeScale: {
        borderColor: '#21262d',
        timeVisible: true,
      },
    });

    chartInstanceRef.current = chart;

    // Render normalized percentage line for each selected symbol
    selectedSymbols.forEach((sym, idx) => {
      const history = historyCache[sym] || stocks.find((s) => s.symbol === sym)?.history || [];
      if (history.length === 0) return;

      const slice = history.slice(Math.max(0, history.length - timeframeDays));
      if (slice.length === 0) return;

      const baselineClose = slice[0].close || 1;
      const normalizedData = slice
        .filter((c) => c && c.time && typeof c.time === 'string' && !isNaN(Number(c.close)))
        .map((c) => ({
          time: c.time.trim() as any,
          value: Number((((c.close - baselineClose) / baselineClose) * 100).toFixed(2)),
        }))
        .sort((a, b) => (a.time > b.time ? 1 : a.time < b.time ? -1 : 0))
        .filter((item, i, arr) => i === 0 || item.time !== arr[i - 1].time);

      if (normalizedData.length > 0) {
        const lineSeries = chart.addSeries(LineSeries, {
          color: COMPARISON_COLORS[idx % COMPARISON_COLORS.length],
          lineWidth: sym === 'NEPSE' ? 3 : (2 as any),
          title: sym,
        });

        lineSeries.setData(normalizedData);
      }
    });

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current && chartInstanceRef.current) {
        chartInstanceRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(chartContainerRef.current);

    return () => {
      observer.disconnect();
      chart.remove();
      chartInstanceRef.current = null;
    };
  }, [selectedSymbols, timeframeDays, historyCache, stocks]);

  // Render stacked candlestick charts when viewMode === 'candlestick'
  useEffect(() => {
    if (viewMode !== 'candlestick') {
      Object.values(stackedInstancesRef.current).forEach((chart) => chart.remove());
      stackedInstancesRef.current = {};
      return;
    }

    Object.values(stackedInstancesRef.current).forEach((chart) => chart.remove());
    stackedInstancesRef.current = {};

    selectedSymbols.forEach((sym) => {
      const container = stackedChartRefs.current[sym];
      if (!container) return;

      const chart = createChart(container, {
        width: container.clientWidth,
        height: 280,
        layout: {
          background: { type: ColorType.Solid, color: '#0b0e14' },
          textColor: '#8b949e',
          fontSize: 10,
          fontFamily: "'JetBrains Mono', monospace",
        },
        grid: {
          vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
          horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
        },
        rightPriceScale: { borderColor: '#21262d' },
        timeScale: { borderColor: '#21262d', timeVisible: true },
      });

      stackedInstancesRef.current[sym] = chart;

      const history = historyCache[sym] || stocks.find((s) => s.symbol === sym)?.history || [];
      const slice = history.slice(Math.max(0, history.length - timeframeDays));

      const candles = slice
        .filter((c) => c && c.time && typeof c.time === 'string' && !isNaN(Number(c.close)))
        .map((c) => ({
          time: c.time.trim() as any,
          open: Number(c.open),
          high: Number(c.high),
          low: Number(c.low),
          close: Number(c.close),
        }))
        .sort((a, b) => (a.time > b.time ? 1 : a.time < b.time ? -1 : 0))
        .filter((item, i, arr) => i === 0 || item.time !== arr[i - 1].time);

      if (candles.length > 0) {
        const candleSeries = chart.addSeries(CandlestickSeries, {
          upColor: '#089981',
          downColor: '#f23645',
          borderVisible: false,
          wickUpColor: '#089981',
          wickDownColor: '#f23645',
        });
        candleSeries.setData(candles);

        const volumeData = slice
          .filter((c) => c && c.time && typeof c.time === 'string' && !isNaN(Number(c.volume)))
          .map((c) => ({
            time: c.time.trim() as any,
            value: Number(c.volume || 0),
            color: c.close >= c.open ? 'rgba(8, 153, 129, 0.35)' : 'rgba(242, 54, 69, 0.35)',
          }))
          .sort((a, b) => (a.time > b.time ? 1 : a.time < b.time ? -1 : 0))
          .filter((item, i, arr) => i === 0 || item.time !== arr[i - 1].time);

        if (volumeData.length > 0) {
          const volumeSeries = chart.addSeries(HistogramSeries, {
            priceFormat: { type: 'volume' },
            priceScaleId: '',
          });
          volumeSeries.priceScale().applyOptions({
            scaleMargins: { top: 0.8, bottom: 0 },
          });
          volumeSeries.setData(volumeData);
        }
      }

      chart.timeScale().fitContent();
    });

    const handleResize = () => {
      selectedSymbols.forEach((sym) => {
        const container = stackedChartRefs.current[sym];
        const chart = stackedInstancesRef.current[sym];
        if (container && chart) {
          chart.applyOptions({ width: container.clientWidth });
        }
      });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      Object.values(stackedInstancesRef.current).forEach((chart) => chart.remove());
      stackedInstancesRef.current = {};
    };
  }, [viewMode, selectedSymbols, timeframeDays, historyCache, stocks]);

  // Compute summary stats for each compared stock using verified historyCache
  const statsList = selectedSymbols.map((sym, idx) => {
    const stock = stocks.find((s) => s.symbol === sym);
    const history = historyCache[sym] || [];
    const slice = history.slice(Math.max(0, history.length - timeframeDays));

    let returnPct = 0;
    let highPct = 0;
    let lowPct = 0;
    let volatility = 0;

    if (slice.length > 1) {
      const base = slice[0].close || 1;
      const current = slice[slice.length - 1].close;
      returnPct = Number((((current - base) / base) * 100).toFixed(2));

      const pcts = slice.map((c) => ((c.close - base) / base) * 100);
      highPct = Number(Math.max(...pcts).toFixed(2));
      lowPct = Number(Math.min(...pcts).toFixed(2));

      // Daily return volatility
      const dailyRets: number[] = [];
      for (let i = 1; i < slice.length; i++) {
        dailyRets.push((slice[i].close - slice[i - 1].close) / slice[i - 1].close);
      }
      if (dailyRets.length > 0) {
        const m = dailyRets.reduce((a, b) => a + b, 0) / dailyRets.length;
        const v = dailyRets.reduce((a, b) => a + Math.pow(b - m, 2), 0) / dailyRets.length;
        volatility = Number((Math.sqrt(v) * Math.sqrt(250) * 100).toFixed(1));
      }
    }

    return {
      symbol: sym,
      name: stock?.name || (sym === 'NEPSE' ? 'NEPSE Index (All Share)' : sym),
      ltp: stock?.ltp || (history.length > 0 ? history[history.length - 1].close : 0),
      returnPct,
      highPct,
      lowPct,
      volatility,
      color: COMPARISON_COLORS[idx % COMPARISON_COLORS.length],
      stock,
      hasRealData: history.length > 0,
    };
  });

  const handleGenerateComparisonAI = async () => {
    setIsGeneratingAi(true);
    setAiAnalysisText('');
    setAiModalOpen(true);
    setAiError(null);

    let capturedError: AIErrorInfo | null = null;

    const summaryData = statsList.map((st) => ({
      symbol: st.symbol,
      name: st.name,
      returnPct: st.returnPct,
      volatility: st.volatility,
      ltp: st.ltp,
      pe: st.stock?.pe,
      sector: st.stock?.sector,
    }));

    const isOnlyNepse = selectedSymbols.length === 1 && selectedSymbols[0] === 'NEPSE';

    const prompt = isOnlyNepse
      ? `You are a licensed Senior Quantitative Market Strategist at Nepal Stock Exchange (NEPSE).
Analyze the overall NEPSE Benchmark Index (${selectedSymbols[0]}) market dynamics:
Benchmark Profile:
• Symbol: NEPSE (All Share Index) | Current LTP: NPR ${summaryData[0]?.ltp?.toFixed(2) || '2574.65'} | Period Return: ${summaryData[0]?.returnPct || 0}% | Annualized Volatility: ${summaryData[0]?.volatility || 21}%

Provide a quantitative synthesis covering:
1. Macro Trend & Benchmark Momentum: Overall liquidity regime, index momentum, and trading turnover expansion.
2. Market Breadth & Sector Leadership: Key leading vs lagging sectors driving index movement.
3. Volatility & Key Structural Pivots: Immediate macro support, overhead distribution levels, and drawdown risk.
4. Actionable Market Stance & Trader Allocation: Recommended cash vs equity deployment allocation for NEPSE market participants.`
      : `You are a licensed Senior Quantitative Portfolio Manager and Technical Analyst specializing in the Nepal Stock Exchange (NEPSE).
Perform an in-depth comparative institutional analysis between these specific instruments: ${selectedSymbols.join(' vs ')}.

[COMPARE_SYMBOLS: ${selectedSymbols.join(',')}]

Comparison Universe & Current Market Metrics:
${summaryData.map((d) => `• Scrip: ${d.symbol} (${d.name}) | Sector: ${d.sector || 'General'} | LTP: NPR ${d.ltp.toFixed(2)} | Period Return: ${d.returnPct >= 0 ? '+' : ''}${d.returnPct}% | Annualized Volatility: ${d.volatility}% | P/E Ratio: ${d.pe ?? 'N/A'}`).join('\n')}

Analyze and compare ${selectedSymbols.join(' vs ')} systematically across these distinct analytical dimensions:
1. Relative Momentum & Alpha Generation: Detail head-to-head period return differences, institutional demand volume absorption, and performance relative to the NEPSE benchmark index.
2. Risk Profile, Beta & Drawdown Resilience: Assess standard deviation, beta vs NEPSE index, drawdown tolerance during broader market corrections, and risk-reward asymmetry.
3. Valuation Multiples & Sector Tailwinds: Compare P/E ratios, earnings quality, and sector-specific macro tailwinds (e.g. NRB monetary policy liquidity for Banking, seasonal runoff for Hydro, industrial demand for Manufacturing).
4. Key Structural Technical Pivots & Order Blocks: Identify immediate support floors, overhead resistance zones, and moving average trends (20-day vs 50-day SMA) for each instrument.
5. Actionable Capital Allocation & Swing Execution: Give concrete portfolio weighting recommendations (% split), optimal swing trade entry triggers, and invalidation stop-loss levels aligned with NEPSE 10% circuit limits and T+2 clearing.

Format the output in clean, professional markdown with clear headings, bullet points, and high financial rigor. Avoid generic disclaimers in the main body.`;

    try {
      if (byokConfig && byokConfig.apiKey) {
        setAiEngineUsed(`BYOK (${byokConfig.provider} · ${byokConfig.model})`);
        const modelToUse = byokConfig.model || 'gemini-2.5-flash';
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${encodeURIComponent(byokConfig.apiKey)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });
        if (res.ok) {
          const d = await res.json();
          const t = d.candidates?.[0]?.content?.parts?.[0]?.text;
          if (t) {
            setAiAnalysisText(t);
            setAiError(null);
            setIsGeneratingAi(false);
            return;
          } else {
            capturedError = classifyAIError('No response returned from BYOK AI model.');
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          capturedError = classifyAIError({ message: errData?.error?.message, status: res.status });
        }
      }

      const sRes = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, symbols: selectedSymbols, comparisonData: summaryData }),
      });
      if (sRes.ok) {
        const sData = await sRes.json();
        if (sData.error || sData.warning) {
          capturedError = classifyAIError(sData.error || sData.warning);
        }
        if (sData.text) {
          setAiEngineUsed(sData.engine || 'Server Institutional AI');
          setAiAnalysisText(sData.text);
          setAiError(capturedError);
          setIsGeneratingAi(false);
          return;
        }
      } else {
        const errData = await sRes.json().catch(() => ({}));
        capturedError = classifyAIError({ message: errData?.error, status: sRes.status });
      }
    } catch (e) {
      console.warn('AI call fell back to local synthesis engine:', e);
      capturedError = classifyAIError(e);
    }

    setAiEngineUsed('Deterministic Quant Synthesis Engine');
    setAiError(capturedError);
    const sorted = [...statsList].sort((a, b) => b.returnPct - a.returnPct);
    const leader = sorted[0];
    const laggard = sorted[sorted.length - 1];

    if (isOnlyNepse) {
      setAiAnalysisText(`### NEPSE Quantitative Benchmark Analysis: **${selectedSymbols[0]}**

**1. Macro Trend & Benchmark Momentum:**
* The NEPSE All Share Index is consolidating near LTP **NPR ${leader.ltp.toFixed(2)}** with a period return of **${leader.returnPct >= 0 ? '+' : ''}${leader.returnPct}%**.
* Market turnover is showing steady base consolidation across commercial banks and select hydropower scrips.

**2. Volatility & Risk Profile:**
* Benchmark annualized volatility is measured at **${leader.volatility}%**, reflecting normal cyclical distribution.
* Downside invalidation support lies at prior swing low demand zones.

**3. Actionable Portfolio Allocation:**
* Maintain 60% core diversified allocation with 25% tactical cash reserves to exploit high-probability pullbacks.`);
    } else {
      setAiAnalysisText(`### NEPSE Quantitative Comparative Synthesis: **${selectedSymbols.join(' vs ')}**

**1. Relative Momentum & Alpha Generation (Head-to-Head vs NEPSE Benchmark):**
* **Top Outperformer:** **${leader.symbol}** (${leader.name}) leads with a net period return of **${leader.returnPct >= 0 ? '+' : ''}${leader.returnPct}%**, demonstrating superior relative strength and institutional demand absorption.
* **Secondary Component:** **${laggard.symbol}** recorded a period return of **${laggard.returnPct >= 0 ? '+' : ''}${laggard.returnPct}%**, exhibiting defensive consolidation characteristics.

**2. Volatility, Beta & Drawdown Resilience:**
${statsList.map((s) => `* **${s.symbol}**: Annualized volatility is **${s.volatility}%** at current LTP NPR ${s.ltp.toFixed(2)}. ${s.volatility > 28 ? 'High-beta profile offering wide swing opportunities for disciplined traders.' : 'Defensive consolidation profile with lower drawdown risk.'}`).join('\n')}

**3. Valuation Multiples & Sector Macro Dynamics:**
* Sector-specific liquidity conditions—particularly NRB monetary policy signals, deposit interest rate cycles, and quarterly earnings disclosures—foster differentiated risk premiums across ${selectedSymbols.join(' and ')}.

**4. Key Structural Technical Pivots & Order Blocks:**
* **Primary Accumulation Support:** Watch for price stabilization near the 20-day exponential moving average.
* **Overhead Resistance:** Scale out profits when approaching recent swing highs or upper circuit limits.

**5. Actionable Capital Allocation & Swing Strategy:**
* Retain core benchmark balance while deploying tactical 25%–35% swing liquidity into **${leader.symbol}** on shallow volume-supported pullbacks.
* Place strict invalidation stops below key swing support to safeguard trading capital.`);
    }

    setIsGeneratingAi(false);
  };

  const isAnyLoading = Object.values(loadingSymbols).some(Boolean);
  const popularQuickPills = ['SHIVM', 'NICA', 'NABIL', 'HDL', 'GBIME', 'CHCL'].filter(
    (sym) => !selectedSymbols.includes(sym)
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-cyan-400" />
            <span>Normalized Growth & Relative Benchmark Comparison</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Compare NEPSE against equities with stacked candlesticks or normalized percentage alpha.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* AI Comparative Analysis Trigger */}
          <button
            onClick={handleGenerateComparisonAI}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-950/70 to-blue-950/70 hover:from-cyan-900/80 hover:to-blue-900/80 border border-cyan-800/80 rounded-md text-xs font-semibold text-cyan-300 transition-colors shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Comparison Analysis</span>
          </button>

          {/* Timeframe selector */}
          <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-md border border-neutral-800 text-xs">
          {[
            { label: '1M', days: 22 },
            { label: '3M', days: 66 },
            { label: '6M', days: 132 },
            { label: '1Y', days: 250 },
            { label: '3Y', days: 750 },
            { label: 'ALL', days: 3000 },
          ].map((tf) => (
            <button
              key={tf.label}
              onClick={() => setTimeframeDays(tf.days)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                timeframeDays === tf.days
                  ? 'bg-neutral-800 text-cyan-400 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>
    </div>

      {/* Selected Scrips Bar & Add Scrip Dropdown */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0e131d] p-3 rounded-lg border border-neutral-800/80 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-neutral-400 font-medium">Comparing:</span>
          {selectedSymbols.map((sym, idx) => (
            <span
              key={sym}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-semibold text-xs border"
              style={{
                color: COMPARISON_COLORS[idx % COMPARISON_COLORS.length],
                borderColor: `${COMPARISON_COLORS[idx % COMPARISON_COLORS.length]}55`,
                backgroundColor: `${COMPARISON_COLORS[idx % COMPARISON_COLORS.length]}15`,
              }}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: COMPARISON_COLORS[idx % COMPARISON_COLORS.length] }}
              />
              <span>{sym}</span>
              {loadingSymbols[sym] && (
                <RefreshCw className="w-2.5 h-2.5 animate-spin text-cyan-400 ml-0.5" />
              )}
              {selectedSymbols.length > 1 && (
                <button
                  onClick={() => handleRemoveSymbol(sym)}
                  className="hover:opacity-75 transition-opacity ml-1 cursor-pointer"
                  title="Remove from comparison"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}

          {isAnyLoading && (
            <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 pl-2">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Fetching verified exchange bars...</span>
            </div>
          )}
        </div>

        {/* Quick Add Pills & Full Dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedSymbols.length < 6 && popularQuickPills.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="text-[11px] text-neutral-500">Quick Add:</span>
              {popularQuickPills.slice(0, 4).map((pSym) => (
                <button
                  key={pSym}
                  onClick={() => handleAddSymbol(pSym)}
                  className="px-2 py-0.5 text-[11px] font-mono bg-neutral-900 hover:bg-neutral-800 hover:text-cyan-300 text-neutral-300 rounded border border-neutral-800 transition-colors cursor-pointer"
                  title={`Add ${pSym} to comparison`}
                >
                  + {pSym}
                </button>
              ))}
            </div>
          )}

          {selectedSymbols.length < 6 && (
            <div className="flex items-center gap-2">
              <select
                value={newSymbolSelect}
                onChange={(e) => handleAddSymbol(e.target.value)}
                className="bg-neutral-900 text-neutral-200 text-xs rounded border border-neutral-700 px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="">+ Add Scrip / Index</option>
                {availableToAdd.map((s) => (
                  <option key={s.symbol} value={s.symbol}>
                    {s.symbol} - {s.name || s.sector}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* View Mode Toggle Bar */}
      <div className="flex items-center justify-between bg-[#0e131d] px-4 py-2.5 rounded-lg border border-neutral-800 text-xs">
        <div className="flex items-center gap-2 text-neutral-300 font-medium">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Chart Rendering Mode:</span>
        </div>
        <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-md border border-neutral-800">
          <button
            onClick={() => setViewMode('normalized')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'normalized'
                ? 'bg-neutral-800 text-cyan-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Normalized Growth (%)</span>
          </button>
          <button
            onClick={() => setViewMode('candlestick')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'candlestick'
                ? 'bg-neutral-800 text-cyan-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Stacked Candlesticks (Multi-Pane)</span>
          </button>
        </div>
      </div>

      {/* Chart Display Area */}
      {viewMode === 'normalized' ? (
        <div className="bg-[#0b0e14] border border-neutral-800/80 rounded-lg p-2 overflow-hidden shadow-2xl">
          <div ref={chartContainerRef} className="w-full relative min-h-[440px]" />
        </div>
      ) : (
        <div className="space-y-4">
          {selectedSymbols.map((sym, idx) => {
            const st = statsList.find((s) => s.symbol === sym);
            const isSymLoading = Boolean(loadingSymbols[sym]) || !historyCache[sym] || historyCache[sym].length === 0;

            return (
              <div key={sym} className="bg-[#0b0e14] border border-neutral-800/80 rounded-lg p-3 shadow-xl space-y-2 relative">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-xs">
                  <div className="flex items-center gap-2 font-bold" style={{ color: COMPARISON_COLORS[idx % COMPARISON_COLORS.length] }}>
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COMPARISON_COLORS[idx % COMPARISON_COLORS.length] }} />
                    <span className="text-sm">{sym}</span>
                    <span className="text-neutral-400 font-normal">({st?.name || sym})</span>
                    {st?.stock?.sector && (
                      <span className="text-[10px] text-neutral-500 hidden sm:inline">[{st.stock.sector}]</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 tabular-nums">
                    <span className="text-neutral-300">LTP: NPR {st?.ltp?.toFixed(2) || '-'}</span>
                    <span className={`font-bold ${st && st.returnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {st && st.returnPct >= 0 ? '+' : ''}{st?.returnPct}%
                    </span>
                  </div>
                </div>

                <div className="relative w-full min-h-[280px]">
                  <div
                    ref={(el) => { stackedChartRefs.current[sym] = el; }}
                    className="w-full relative min-h-[280px]"
                  />

                  {isSymLoading && (
                    <div className="absolute inset-0 bg-[#0b0e14]/90 backdrop-blur-xs flex flex-col items-center justify-center space-y-2 z-10 rounded">
                      <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
                      <span className="text-xs font-semibold text-white">Fetching verified OHLCV bars for {sym}...</span>
                      <span className="text-[10px] text-neutral-500 font-mono">Consolidating exchange data across sessions</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {selectedSymbols.length === 1 && (
            <div className="bg-[#0e131d]/70 border border-dashed border-cyan-800/40 rounded-lg p-5 text-center space-y-2.5">
              <div className="text-xs text-neutral-300 font-medium flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Comparing NEPSE Benchmark with 0 additional equities</span>
              </div>
              <p className="text-[11px] text-neutral-400 max-w-md mx-auto">
                Select any stock from the dropdown above or click a quick-add chip to stack multiple candlestick panels and run relative alpha comparison.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {['SHIVM', 'NICA', 'NABIL', 'HDL', 'GBIME', 'CHCL'].map((pSym) => (
                  <button
                    key={pSym}
                    onClick={() => handleAddSymbol(pSym)}
                    className="px-2.5 py-1 text-xs font-mono bg-neutral-900 hover:bg-neutral-800 text-cyan-300 rounded border border-neutral-700/80 transition-colors cursor-pointer"
                  >
                    + Add {pSym}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comparative Performance Table */}
      <div className="bg-[#0e131d] border border-neutral-800/80 rounded-lg overflow-hidden">
        <div className="p-3 border-b border-neutral-800 font-bold text-white text-xs flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-cyan-400" />
          <span>Period Return & Risk Analytics Table</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs tabular-nums">
            <thead className="bg-[#090d14] text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
              <tr>
                <th className="py-2.5 px-4">Symbol</th>
                <th className="py-2.5 px-4">Name</th>
                <th className="py-2.5 px-4 text-right">LTP (NPR)</th>
                <th className="py-2.5 px-4 text-right">Period Return</th>
                <th className="py-2.5 px-4 text-right">Period High</th>
                <th className="py-2.5 px-4 text-right">Period Low</th>
                <th className="py-2.5 px-4 text-right">Volatility (Ann)</th>
                <th className="py-2.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {statsList.map((st) => {
                const isPos = st.returnPct >= 0;
                return (
                  <tr key={st.symbol} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="py-2.5 px-4 font-bold flex items-center gap-2" style={{ color: st.color }}>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: st.color }} />
                      <span>{st.symbol}</span>
                    </td>
                    <td className="py-2.5 px-4 text-neutral-300 truncate max-w-xs">{st.name}</td>
                    <td className="py-2.5 px-4 text-right font-medium text-white">{st.ltp ? st.ltp.toFixed(2) : '-'}</td>
                    <td className={`py-2.5 px-4 text-right font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPos ? '+' : ''}{st.returnPct}%
                    </td>
                    <td className="py-2.5 px-4 text-right text-emerald-400 font-medium">+{st.highPct}%</td>
                    <td className="py-2.5 px-4 text-right text-rose-400 font-medium">{st.lowPct}%</td>
                    <td className="py-2.5 px-4 text-right text-neutral-300">{st.volatility}%</td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => {
                          onSelectScrip(st.stock as StockItem);
                          onNavigateToTerminal();
                        }}
                        className="px-2 py-0.5 text-[11px] bg-neutral-800 hover:bg-cyan-950 text-cyan-300 rounded border border-neutral-700 transition-colors cursor-pointer"
                      >
                        Terminal
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Comparison Synthesis Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-[#090d14] border border-neutral-800 rounded-xl shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>AI Quantitative Comparison Synthesis</span>
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
                <div className="text-sm font-semibold text-white">Synthesizing Comparative Analysis...</div>
                <div className="text-xs text-neutral-400">Processing returns, volatility & institutional money flow</div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* AI Error Diagnostic Banner */}
                {aiError && (
                  <AIErrorBanner
                    error={aiError}
                    onUpdateKey={onOpenVault}
                    onRetry={handleGenerateComparisonAI}
                    onDismiss={() => setAiError(null)}
                    compact={Boolean(aiAnalysisText)}
                  />
                )}

                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Engine: {aiEngineUsed}</span>
                  </div>
                  <span className="font-mono">{selectedSymbols.join(' vs ')}</span>
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
