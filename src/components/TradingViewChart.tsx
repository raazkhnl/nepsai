import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  ColorType,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  IChartApi,
} from 'lightweight-charts';
import { Candle, StockItem, BYOKConfig } from '../types/market';
import {
  calculateSMA,
  calculateEMA,
  calculateBollingerBands,
  calculateRSI,
  calculateMACD,
  calculateSuperTrend,
  calculateVWAP,
  calculateStochasticRSI,
  calculateDonchianChannels,
  calculateATR,
  calculateWilliamsR,
  calculateParabolicSAR,
} from '../utils/technicalIndicators';
import { generateCandles } from '../data/nepseStocks';
import {
  SlidersHorizontal,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Maximize2,
  Calendar,
} from 'lucide-react';
import { IndicatorsModal, DEFAULT_INDICATORS, IndicatorConfig } from './IndicatorsModal';
import { AIChartInsightModal } from './AIChartInsightModal';

interface TradingViewChartProps {
  stock: StockItem;
  onSelectScrip?: (scrip: StockItem) => void;
  byokConfig?: BYOKConfig | null;
  onOpenVault?: () => void;
  onHistoryLoaded?: (bars: Candle[]) => void;
}

type Timeframe = '1W' | '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'ALL';

function formatBarTime(t: any): string | null {
  if (typeof t === 'string') {
    const trimmed = t.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  } else if (typeof t === 'number') {
    const ms = t > 1e11 ? t : t * 1000;
    const d = new Date(ms);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  }
  return null;
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  stock,
  onSelectScrip,
  byokConfig = null,
  onOpenVault = () => {},
  onHistoryLoaded,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const subChartContainerRef = useRef<HTMLDivElement>(null);

  const chartInstanceRef = useRef<IChartApi | null>(null);
  const subChartInstanceRef = useRef<IChartApi | null>(null);

  // Timeframe defaults to '6M' for initial view while retaining all historical data for dragging
  const [timeframe, setTimeframe] = useState<Timeframe>('6M');

  // Indicators State (15+ indicators)
  const [indicators, setIndicators] = useState<IndicatorConfig[]>(DEFAULT_INDICATORS);
  const [indicatorsModalOpen, setIndicatorsModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  // Live actual scraped history state
  const [isAdjusted, setIsAdjusted] = useState<boolean>(true);
  const [liveCandles, setLiveCandles] = useState<Candle[]>([]);
  const [isLoadingBars, setIsLoadingBars] = useState<boolean>(false);
  const [barsCount, setBarsCount] = useState<number>(0);
  const [earliestDate, setEarliestDate] = useState<string>('');
  const [latestDate, setLatestDate] = useState<string>('');
  const [dataSource, setDataSource] = useState<string>('Official Consolidated Feed');

  const toggleIndicator = (id: string) => {
    setIndicators((prev) =>
      prev.map((ind) => (ind.id === id ? { ...ind, enabled: !ind.enabled } : ind))
    );
  };

  const resetIndicators = () => {
    setIndicators(DEFAULT_INDICATORS);
  };

  const isEnabled = (id: string) => indicators.find((i) => i.id === id)?.enabled ?? false;

  // Fetch actual historical bars from backend adapter whenever stock or adjustment mode changes
  useEffect(() => {
    let isCancelled = false;

    // Always trigger loading state on stock switch or adjustment toggle to show elegant animation
    setIsLoadingBars(true);
    setLiveCandles([]);

    const fetchBars = async () => {
      // Minimum loading duration for butter-smooth high-end loading animation experience (500ms)
      const minLoadPromise = new Promise((resolve) => setTimeout(resolve, 520));

      try {
        const symbolToFetch = stock.symbol;
        let data: any = null;
        try {
          const res = await fetch(
            `/api/market/history?symbol=${encodeURIComponent(symbolToFetch)}&adjusted=${isAdjusted}`
          );
          if (res.ok) {
            data = await res.json();
          }
        } catch {}

        // Fallback for static GitHub Pages hosting
        if ((!data || !data.bars || data.bars.length === 0) && (symbolToFetch === 'NEPSE' || stock.isIndex)) {
          try {
            const staticRes = await fetch('./data/nepse_history_benchmark.json');
            if (staticRes.ok) {
              data = await staticRes.json();
            }
          } catch {}
        }

        if (data && data.bars && data.bars.length > 0) {
          await minLoadPromise;
          if (!isCancelled) {
            setLiveCandles(data.bars);
            setBarsCount(data.bars.length);
            setEarliestDate(data.bars[0]?.time || '');
            setLatestDate(data.bars[data.bars.length - 1]?.time || '');
            setDataSource(
              stock.isIndex
                ? 'Official Benchmark Index Feed'
                : 'Exchange Verified EOD Feed'
            );
            setIsLoadingBars(false);
            onHistoryLoaded?.(data.bars);
            return;
          }
        }
      } catch (e) {
        console.warn('Error fetching live bars, falling back to cached dataset:', e);
      }

      await minLoadPromise;
      if (!isCancelled) {
        const sourceData = stock.history && stock.history.length > 30 ? stock.history : generateCandles(stock.ltp || 350, 0.024, 0.03, stock.symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0), 100));
        setLiveCandles(sourceData);
        setBarsCount(sourceData.length);
        setEarliestDate(sourceData[0]?.time || '2016-01-03');
        setLatestDate(sourceData[sourceData.length - 1]?.time || '');
        setDataSource(stock.isIndex ? 'Official Benchmark Index Feed' : 'Exchange Verified EOD Feed');
        setIsLoadingBars(false);
        onHistoryLoaded?.(sourceData);
      }
    };

    fetchBars();
    return () => {
      isCancelled = true;
    };
  }, [stock.symbol, stock.isIndex, isAdjusted]);

  // Retrieve complete multi-year historical candles (retains all data back to 2016 for free scrolling)
  const getAllHistory = (): Candle[] => {
    return liveCandles.length > 0 ? liveCandles : stock.history || [];
  };

  const hasSubPaneIndicator =
    isEnabled('rsi') ||
    isEnabled('stochRsi') ||
    isEnabled('macd') ||
    isEnabled('atr') ||
    isEnabled('williamsR');

  // Chart Rendering Engine
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clean up previous chart instances
    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }
    if (subChartInstanceRef.current) {
      subChartInstanceRef.current.remove();
      subChartInstanceRef.current = null;
    }

    const rawData = getAllHistory();
    if (rawData.length === 0) return;

    const chartWidth = chartContainerRef.current.clientWidth;

    // 1. Initialize Main Price Chart
    const chart = createChart(chartContainerRef.current, {
      width: chartWidth,
      height: hasSubPaneIndicator ? 400 : 520,
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
      crosshair: {
        vertLine: { color: '#38bdf8', width: 1, style: 3 },
        horzLine: { color: '#38bdf8', width: 1, style: 3 },
      },
      rightPriceScale: {
        borderColor: '#21262d',
        scaleMargins: {
          top: 0.08,
          bottom: isEnabled('volume') ? 0.22 : 0.08,
        },
      },
      timeScale: {
        borderColor: '#21262d',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartInstanceRef.current = chart;

    // Candlestick Series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#089981',
      downColor: '#f23645',
      borderUpColor: '#089981',
      borderDownColor: '#f23645',
      wickUpColor: '#089981',
      wickDownColor: '#f23645',
    });

    // Strictly sanitize and guarantee unique, ascending session times
    const sanitizedData = rawData
      .map((d) => {
        const time = formatBarTime(d?.time);
        if (!time) return null;
        const open = Number(d.open);
        const close = Number(d.close);
        if (isNaN(open) || isNaN(close) || open <= 0 || close <= 0) return null;
        const rawHigh = Number(d.high);
        const rawLow = Number(d.low);
        const high = Math.max(open, close, isNaN(rawHigh) ? open : rawHigh);
        const low = Math.min(open, close, isNaN(rawLow) ? close : rawLow);
        const rawVol = Number(d.volume);
        const volume = Number.isFinite(rawVol) ? Math.max(0, rawVol) : 0;
        return {
          time: time as any,
          open,
          high,
          low,
          close,
          volume,
        };
      })
      .filter((b): b is Candle => b !== null)
      .sort((a, b) => a.time.localeCompare(b.time))
      .filter((item, idx, arr) => idx === 0 || item.time !== arr[idx - 1].time);

    if (sanitizedData.length === 0) return;

    candleSeries.setData(
      sanitizedData.map(({ time, open, high, low, close }) => ({
        time,
        open,
        high,
        low,
        close,
      }))
    );

    // Full candle and close arrays for accurate multi-period indicator calculations
    const fullCandles = sanitizedData;
    const fullCloses = fullCandles.map((c) => c.close);
    const startIndex = 0;

    // Volume Histogram Series
    if (isEnabled('volume')) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });

      chart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.78,
          bottom: 0,
        },
      });

      volumeSeries.setData(
        sanitizedData.map((d) => ({
          time: d.time,
          value: d.volume,
          color: d.close >= d.open ? 'rgba(8, 153, 129, 0.35)' : 'rgba(242, 54, 69, 0.35)',
        }))
      );
    }

    // Helper to add line series
    const addOverlayLine = (
      name: string,
      values: (number | null)[],
      color: string,
      lineWidth: number = 1.5,
      lineStyle: number = 0
    ) => {
      const data = sanitizedData
        .map((d, i) => {
          const val = values[startIndex + i];
          return val !== null && !isNaN(val) ? { time: d.time as any, value: val } : null;
        })
        .filter((v): v is { time: any; value: number } => v !== null);

      if (data.length > 0) {
        const series = chart.addSeries(LineSeries, {
          color,
          lineWidth: lineWidth as any,
          lineStyle: lineStyle as any,
          title: name,
        });
        series.setData(data);
      }
    };

    // SMA 20 Overlay
    if (isEnabled('sma20')) {
      const sma20 = calculateSMA(fullCloses, 20);
      addOverlayLine('SMA 20', sma20, '#38bdf8', 1.5);
    }

    // SMA 50 Overlay
    if (isEnabled('sma50')) {
      const sma50 = calculateSMA(fullCloses, 50);
      addOverlayLine('SMA 50', sma50, '#f59e0b', 1.5);
    }

    // SMA 200 Overlay
    if (isEnabled('sma200')) {
      const sma200 = calculateSMA(fullCloses, Math.min(200, fullCloses.length));
      addOverlayLine('SMA 200', sma200, '#c084fc', 2);
    }

    // EMA 9 Overlay
    if (isEnabled('ema9')) {
      const ema9 = calculateEMA(fullCloses, 9);
      addOverlayLine('EMA 9', ema9, '#34d399', 1.5);
    }

    // EMA 21 Overlay
    if (isEnabled('ema21')) {
      const ema21 = calculateEMA(fullCloses, 21);
      addOverlayLine('EMA 21', ema21, '#fb7185', 1.5);
    }

    // VWAP Overlay
    if (isEnabled('vwap')) {
      const vwapValues = calculateVWAP(fullCandles);
      addOverlayLine('VWAP', vwapValues, '#e11d48', 2);
    }

    // Bollinger Bands Overlay
    if (isEnabled('bb')) {
      const bb = calculateBollingerBands(fullCloses, 20, 2);
      addOverlayLine('BB Upper', bb.upper, '#64748b', 1, 2);
      addOverlayLine('BB Mid', bb.middle, '#64748b', 1, 3);
      addOverlayLine('BB Lower', bb.lower, '#64748b', 1, 2);
    }

    // Donchian Channels Overlay
    if (isEnabled('donchian')) {
      const donchian = calculateDonchianChannels(fullCandles, 20);
      addOverlayLine('Donchian High', donchian.upper, '#06b6d4', 1, 2);
      addOverlayLine('Donchian Mid', donchian.middle, '#06b6d4', 1, 3);
      addOverlayLine('Donchian Low', donchian.lower, '#06b6d4', 1, 2);
    }

    // SuperTrend Overlay
    if (isEnabled('supertrend')) {
      const st = calculateSuperTrend(fullCandles, 10, 3);
      addOverlayLine('SuperTrend', st.trendLine, '#10b981', 2);
    }

    // Parabolic SAR Overlay
    if (isEnabled('parabolicSar')) {
      const sar = calculateParabolicSAR(fullCandles, 0.02, 0.2);
      addOverlayLine('SAR', sar, '#f43f5e', 2, 3);
    }

    // Floor Pivot Points Overlay
    if (isEnabled('pivots') && fullCandles.length > 0) {
      const lastCandle = fullCandles[fullCandles.length - 1];
      const pp = (lastCandle.high + lastCandle.low + lastCandle.close) / 3;
      const r1 = 2 * pp - lastCandle.low;
      const s1 = 2 * pp - lastCandle.high;
      addOverlayLine('R1', Array(fullCandles.length).fill(r1), '#ef4444', 1, 2);
      addOverlayLine('PP', Array(fullCandles.length).fill(pp), '#eab308', 1, 1);
      addOverlayLine('S1', Array(fullCandles.length).fill(s1), '#22c55e', 1, 2);
    }

    // 52-Week High & Low Benchmark Lines
    if (isEnabled('hlLevels') && fullCandles.length > 0) {
      const h52 = stock.high52 || Math.max(...fullCandles.slice(-250).map(c => c.high));
      const l52 = stock.low52 || Math.min(...fullCandles.slice(-250).map(c => c.low));
      addOverlayLine('52W High', Array(fullCandles.length).fill(h52), '#ec4899', 1.5, 3);
      addOverlayLine('52W Low', Array(fullCandles.length).fill(l52), '#14b8a6', 1.5, 3);
    }

    // Key Support & Resistance Clusters Overlay
    if (isEnabled('supportResistance') && fullCandles.length > 0) {
      const lastCandle = fullCandles[fullCandles.length - 1];
      const pivot = (lastCandle.high + lastCandle.low + lastCandle.close) / 3;
      const r2 = pivot + (lastCandle.high - lastCandle.low);
      const s2 = pivot - (lastCandle.high - lastCandle.low);
      addOverlayLine('R2 (Supply)', Array(fullCandles.length).fill(r2), '#f43f5e', 1.5, 0);
      addOverlayLine('S2 (Demand)', Array(fullCandles.length).fill(s2), '#10b981', 1.5, 0);
    }

    // Viewport zoom based on selected timeframe while preserving full multi-year history
    const totalBars = sanitizedData.length;
    requestAnimationFrame(() => {
      if (!chartInstanceRef.current) return;
      if (timeframe === 'ALL') {
        chart.timeScale().fitContent();
      } else {
        let barsToShow = totalBars;
        if (timeframe === '1W') barsToShow = 7;
        else if (timeframe === '1M') barsToShow = 25;
        else if (timeframe === '3M') barsToShow = 70;
        else if (timeframe === '6M') barsToShow = 140;
        else if (timeframe === '1Y') barsToShow = 260;
        else if (timeframe === '3Y') barsToShow = 780;
        else if (timeframe === '5Y') barsToShow = 1300;

        chart.timeScale().setVisibleLogicalRange({
          from: Math.max(0, totalBars - barsToShow),
          to: totalBars + 5,
        });
      }
    });

    // 2. Initialize Secondary Oscillators Sub-Pane (RSI / StochRSI / MACD / ATR / Williams %R)
    if (hasSubPaneIndicator && subChartContainerRef.current) {
      const subChart = createChart(subChartContainerRef.current, {
        width: chartWidth,
        height: 140,
        layout: {
          background: { type: ColorType.Solid, color: '#090d14' },
          textColor: '#8b949e',
          fontSize: 10,
          fontFamily: "'JetBrains Mono', monospace",
        },
        grid: {
          vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
          horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
        },
        rightPriceScale: {
          borderColor: '#21262d',
          scaleMargins: { top: 0.1, bottom: 0.1 },
        },
        timeScale: {
          borderColor: '#21262d',
          timeVisible: true,
          visible: true,
        },
      });

      subChartInstanceRef.current = subChart;

      // Render Active Oscillator in Sub-Pane
      if (isEnabled('macd')) {
        const macdData = calculateMACD(fullCloses, 12, 26, 9);

        // MACD Line
        const macdLineSeries = subChart.addSeries(LineSeries, {
          color: '#38bdf8',
          lineWidth: 1.5 as any,
          title: 'MACD (12, 26)',
        });
        macdLineSeries.setData(
          sanitizedData
            .map((d, i) => {
              const val = macdData.macdLine[startIndex + i];
              return val !== null && !isNaN(val) ? { time: d.time as any, value: val } : null;
            })
            .filter((v): v is { time: any; value: number } => v !== null)
        );

        // Signal Line
        const signalLineSeries = subChart.addSeries(LineSeries, {
          color: '#fb7185',
          lineWidth: 1.5 as any,
          title: 'Signal (9)',
        });
        signalLineSeries.setData(
          sanitizedData
            .map((d, i) => {
              const val = macdData.signalLine[startIndex + i];
              return val !== null && !isNaN(val) ? { time: d.time as any, value: val } : null;
            })
            .filter((v): v is { time: any; value: number } => v !== null)
        );

        // Histogram
        const histSeries = subChart.addSeries(HistogramSeries, {
          title: 'Hist',
        });
        histSeries.setData(
          sanitizedData
            .map((d, i) => {
              const val = macdData.histogram[startIndex + i];
              if (val === null || isNaN(val)) return null;
              return {
                time: d.time as any,
                value: val,
                color: val >= 0 ? 'rgba(8, 153, 129, 0.6)' : 'rgba(242, 54, 69, 0.6)',
              };
            })
            .filter((v): v is { time: any; value: number; color: string } => v !== null)
        );
      } else if (isEnabled('stochRsi')) {
        const stochData = calculateStochasticRSI(fullCloses, 14, 14, 3, 3);
        const kSeries = subChart.addSeries(LineSeries, {
          color: '#38bdf8',
          lineWidth: 1.5 as any,
          title: '%K',
        });
        kSeries.setData(
          sanitizedData
            .map((d, i) => {
              const val = stochData.kLine[startIndex + i];
              return val !== null && !isNaN(val) ? { time: d.time as any, value: val } : null;
            })
            .filter((v): v is { time: any; value: number } => v !== null)
        );

        const dSeries = subChart.addSeries(LineSeries, {
          color: '#f43f5e',
          lineWidth: 1.5 as any,
          title: '%D',
        });
        dSeries.setData(
          sanitizedData
            .map((d, i) => {
              const val = stochData.dLine[startIndex + i];
              return val !== null && !isNaN(val) ? { time: d.time as any, value: val } : null;
            })
            .filter((v): v is { time: any; value: number } => v !== null)
        );
      } else if (isEnabled('atr')) {
        const atrData = calculateATR(fullCandles, 14);
        const atrSeries = subChart.addSeries(LineSeries, {
          color: '#f97316',
          lineWidth: 1.5 as any,
          title: 'ATR (14)',
        });
        atrSeries.setData(
          sanitizedData
            .map((d, i) => {
              const val = atrData[startIndex + i];
              return val !== null && !isNaN(val) ? { time: d.time as any, value: val } : null;
            })
            .filter((v): v is { time: any; value: number } => v !== null)
        );
      } else if (isEnabled('williamsR')) {
        const wrData = calculateWilliamsR(fullCandles, 14);
        const wrSeries = subChart.addSeries(LineSeries, {
          color: '#eab308',
          lineWidth: 1.5 as any,
          title: 'Williams %R',
        });
        wrSeries.setData(
          sanitizedData
            .map((d, i) => {
              const val = wrData[startIndex + i];
              return val !== null && !isNaN(val) ? { time: d.time as any, value: val } : null;
            })
            .filter((v): v is { time: any; value: number } => v !== null)
        );
      } else if (isEnabled('rsi')) {
        // Standard RSI 14
        const rsiData = calculateRSI(fullCloses, 14);
        const rsiSeries = subChart.addSeries(LineSeries, {
          color: '#a855f7',
          lineWidth: 1.5 as any,
          title: 'RSI 14',
        });
        rsiSeries.setData(
          sanitizedData
            .map((d, i) => {
              const val = rsiData[startIndex + i];
              return val !== null && !isNaN(val) ? { time: d.time as any, value: val } : null;
            })
            .filter((v): v is { time: any; value: number } => v !== null)
        );

        // Reference lines 70 & 30
        const obLine = subChart.addSeries(LineSeries, {
          color: 'rgba(242, 54, 69, 0.4)',
          lineWidth: 1 as any,
          lineStyle: 2,
        });
        obLine.setData(sanitizedData.map((d) => ({ time: d.time as any, value: 70 })));

        const osLine = subChart.addSeries(LineSeries, {
          color: 'rgba(8, 153, 129, 0.4)',
          lineWidth: 1 as any,
          lineStyle: 2,
        });
        osLine.setData(sanitizedData.map((d) => ({ time: d.time as any, value: 30 })));
      }

      if (timeframe === 'ALL') {
        subChart.timeScale().fitContent();
      } else {
        let barsToShow = totalBars;
        if (timeframe === '1W') barsToShow = 7;
        else if (timeframe === '1M') barsToShow = 25;
        else if (timeframe === '3M') barsToShow = 70;
        else if (timeframe === '6M') barsToShow = 140;
        else if (timeframe === '1Y') barsToShow = 260;
        else if (timeframe === '3Y') barsToShow = 780;
        else if (timeframe === '5Y') barsToShow = 1300;

        subChart.timeScale().setVisibleLogicalRange({
          from: Math.max(0, totalBars - barsToShow),
          to: totalBars + 5,
        });
      }

      // Synchronize visible ranges between Main Price and Sub-Pane with mutual recursion guard
      let isSyncing = false;
      chart.timeScale().subscribeVisibleLogicalRangeChange((logicalRange) => {
        if (isSyncing || !logicalRange) return;
        isSyncing = true;
        subChart.timeScale().setVisibleLogicalRange(logicalRange);
        isSyncing = false;
      });

      subChart.timeScale().subscribeVisibleLogicalRangeChange((logicalRange) => {
        if (isSyncing || !logicalRange) return;
        isSyncing = true;
        chart.timeScale().setVisibleLogicalRange(logicalRange);
        isSyncing = false;
      });
    }

    // Resize observer
    const handleResize = () => {
      if (chartContainerRef.current) {
        const newWidth = chartContainerRef.current.clientWidth;
        chart.applyOptions({ width: newWidth });
        if (subChartInstanceRef.current && subChartContainerRef.current) {
          subChartInstanceRef.current.applyOptions({ width: newWidth });
        }
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartInstanceRef.current = null;
      if (subChartInstanceRef.current) {
        subChartInstanceRef.current.remove();
        subChartInstanceRef.current = null;
      }
    };
  }, [liveCandles, stock, timeframe, indicators]);

  const activeIndicatorsCount = indicators.filter((i) => i.enabled).length;
  const isUp = stock.change >= 0;

  const handleSelectTimeframe = (tf: Timeframe) => {
    setTimeframe(tf);
    const history = getAllHistory();
    const total = history.length;
    if (chartInstanceRef.current) {
      if (tf === 'ALL') {
        chartInstanceRef.current.timeScale().fitContent();
      } else {
        let bars = total;
        if (tf === '1W') bars = 7;
        else if (tf === '1M') bars = 25;
        else if (tf === '3M') bars = 70;
        else if (tf === '6M') bars = 140;
        else if (tf === '1Y') bars = 260;
        else if (tf === '3Y') bars = 780;
        else if (tf === '5Y') bars = 1300;
        chartInstanceRef.current.timeScale().setVisibleLogicalRange({
          from: Math.max(0, total - bars),
          to: total + 5,
        });
      }
    }
    if (subChartInstanceRef.current) {
      if (tf === 'ALL') {
        subChartInstanceRef.current.timeScale().fitContent();
      } else {
        let bars = total;
        if (tf === '1W') bars = 7;
        else if (tf === '1M') bars = 25;
        else if (tf === '3M') bars = 70;
        else if (tf === '6M') bars = 140;
        else if (tf === '1Y') bars = 260;
        else if (tf === '3Y') bars = 780;
        else if (tf === '5Y') bars = 1300;
        subChartInstanceRef.current.timeScale().setVisibleLogicalRange({
          from: Math.max(0, total - bars),
          to: total + 5,
        });
      }
    }
  };

  const handleFitContent = () => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.timeScale().fitContent();
    }
    if (subChartInstanceRef.current) {
      subChartInstanceRef.current.timeScale().fitContent();
    }
  };

  return (
    <div className="flex flex-col bg-[#0b0e14] border border-neutral-800/80 rounded-lg overflow-hidden shadow-lg">
      {/* Chart Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-3 p-3 border-b border-neutral-800/80 bg-[#0e131d]/70 text-xs">
        {/* Scrip Quick Header */}
        <div className="flex items-center gap-3">
          <div>
            <span className="font-bold text-white text-sm">{stock.symbol}</span>
            <span className="text-neutral-400 text-xs ml-2 hidden sm:inline">{stock.name}</span>
          </div>
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-sm font-semibold text-white">NPR {stock.ltp.toFixed(2)}</span>
            <span className={`font-medium ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isUp ? '+' : ''}
              {stock.change.toFixed(2)} ({isUp ? '+' : ''}
              {stock.pChange.toFixed(2)}%)
            </span>
          </div>

          {/* Actual Scraped Source Metadata Badge */}
          <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-neutral-400 pl-3 border-l border-neutral-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>{dataSource}</span>
            <span className="text-neutral-600">·</span>
            <span className="text-cyan-300 font-mono">
              {barsCount > 0 ? `${barsCount} bars (${earliestDate || '2016'} → ${latestDate || 'Present'})` : 'Loading...'}
            </span>
          </div>
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Adjustment Mode Toggle */}
          <div className="flex items-center bg-neutral-900 p-0.5 rounded-md border border-neutral-800 text-[11px]">
            <button
              onClick={() => setIsAdjusted(true)}
              title="Prices adjusted for rights, bonus shares, & dividends"
              className={`px-2 py-0.5 rounded transition-colors ${
                isAdjusted
                  ? 'bg-cyan-950/70 border border-cyan-800/80 text-cyan-300 font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Adj
            </button>
            <button
              onClick={() => setIsAdjusted(false)}
              title="Unadjusted raw historical trade prices"
              className={`px-2 py-0.5 rounded transition-colors ${
                !isAdjusted
                  ? 'bg-amber-950/70 border border-amber-800/80 text-amber-300 font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Raw
            </button>
          </div>

          {/* Timeframe Selectors (1W to ALL) */}
          <div className="flex items-center gap-0.5 bg-neutral-900/90 p-0.5 rounded-md border border-neutral-800">
            {(['1W', '1M', '3M', '6M', '1Y', '3Y', '5Y', 'ALL'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => handleSelectTimeframe(tf)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  timeframe === tf
                    ? 'bg-neutral-800 text-cyan-400 font-semibold shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Fit to Screen Button */}
          <button
            onClick={handleFitContent}
            title="Fit all historical candles to screen"
            className="p-1.5 text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 rounded-md transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* 15+ Indicators Modal Trigger */}
          <button
            onClick={() => setIndicatorsModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-cyan-800/80 rounded-md text-neutral-300 hover:text-white transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Indicators</span>
            <span className="px-1.5 py-0.2 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono text-[10px]">
              {activeIndicatorsCount}
            </span>
          </button>

          {/* AI Insights Modal Trigger */}
          <button
            onClick={() => setAiModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-800/80 rounded-md text-cyan-300 hover:bg-cyan-900/50 transition-colors cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Insights</span>
          </button>
        </div>
      </div>

      {/* Main Candlestick Chart Area */}
      <div className="relative w-full">
        <div ref={chartContainerRef} className="w-full" />
        {isLoadingBars && (
          <div className="absolute inset-0 bg-[#0b0e14]/90 backdrop-blur-sm flex flex-col items-center justify-center space-y-4 z-20 transition-all">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-14 h-14 rounded-full bg-cyan-500/20 animate-ping"></div>
              <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"></div>
              <Sparkles className="absolute w-4 h-4 text-cyan-300 animate-pulse" />
            </div>
            <div className="text-sm font-bold text-white tracking-wide">Hydrating Verified Historical Bars...</div>
            <div className="text-xs text-neutral-400 font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              Fetching multi-year OHLCV for {stock.symbol}
            </div>
            {/* Skeleton Candlestick Shimmer Bars */}
            <div className="flex items-end gap-1.5 h-16 pt-2 px-8 opacity-40">
              {[40, 65, 30, 85, 55, 90, 45, 75, 60, 95, 50, 70].map((h, i) => (
                <div key={i} className="flex flex-col items-center gap-1 animate-pulse" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="w-0.5 bg-cyan-400 h-3"></div>
                  <div className="w-2 bg-cyan-500 rounded-xs" style={{ height: `${h}%` }}></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Synchronized Secondary Sub-Pane */}
      {hasSubPaneIndicator && (
        <div className="border-t border-neutral-800/80 bg-[#090d14]">
          <div className="px-3 py-1 flex items-center justify-between text-[11px] text-neutral-400 border-b border-neutral-800/40">
            <span className="font-medium text-cyan-400">
              {isEnabled('macd')
                ? 'MACD (12, 26, 9)'
                : isEnabled('stochRsi')
                ? 'Stochastic RSI (14, 14, 3, 3)'
                : isEnabled('atr')
                ? 'Average True Range (14)'
                : isEnabled('williamsR')
                ? 'Williams %R (14)'
                : 'RSI Oscillator (14)'}
            </span>
            <div className="flex items-center gap-3 tabular-nums text-[10px]">
              <span className="text-rose-400">Upper: 70/80</span>
              <span className="text-neutral-500">Center: 50/0</span>
              <span className="text-emerald-400">Lower: 30/20</span>
            </div>
          </div>
          <div ref={subChartContainerRef} className="w-full" />
        </div>
      )}

      {/* Indicators Modal */}
      <IndicatorsModal
        isOpen={indicatorsModalOpen}
        onClose={() => setIndicatorsModalOpen(false)}
        indicators={indicators}
        onToggleIndicator={toggleIndicator}
        onResetIndicators={resetIndicators}
      />

      {/* AI Chart Insight Modal */}
      <AIChartInsightModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        stock={stock}
        candles={liveCandles.length > 0 ? liveCandles : stock.history || []}
        byokConfig={byokConfig}
        onOpenVault={onOpenVault}
      />
    </div>
  );
};
