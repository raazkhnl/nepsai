import { Candle, TechnicalIndicatorsResult } from '../types/market';

/**
 * Calculates Simple Moving Average (SMA)
 */
export function calculateSMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const sum = slice.reduce((acc, val) => acc + val, 0);
      result.push(Number((sum / period).toFixed(2)));
    }
  }
  return result;
}

/**
 * Calculates Exponential Moving Average (EMA)
 */
export function calculateEMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const k = 2 / (period + 1);

  let prevEma: number | null = null;
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      // First EMA is SMA
      const slice = data.slice(0, period);
      prevEma = slice.reduce((acc, val) => acc + val, 0) / period;
      result.push(Number(prevEma.toFixed(2)));
    } else {
      if (prevEma !== null) {
        prevEma = data[i] * k + prevEma * (1 - k);
        result.push(Number(prevEma.toFixed(2)));
      }
    }
  }
  return result;
}

/**
 * Calculates Relative Strength Index (RSI 14)
 */
export function calculateRSI(closes: number[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = [];
  if (closes.length <= period) {
    return closes.map(() => null);
  }

  const changes: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }

  let avgGain = 0;
  let avgLoss = 0;

  // First period average gain/loss
  for (let i = 0; i < period; i++) {
    const diff = changes[i];
    if (diff > 0) avgGain += diff;
    else avgLoss += Math.abs(diff);
  }

  avgGain /= period;
  avgLoss /= period;

  // Pad nulls for indices before period
  for (let i = 0; i <= period; i++) {
    result.push(null);
  }

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = 100 - 100 / (1 + rs);
  result[period] = Number(rsi.toFixed(2));

  // Wilder's smoothing
  for (let i = period; i < changes.length; i++) {
    const diff = changes[i];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = 100 - 100 / (1 + rs);
    result.push(Number(rsi.toFixed(2)));
  }

  return result;
}

/**
 * Calculates MACD (12, 26, 9)
 */
export function calculateMACD(
  closes: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
) {
  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);

  const macdLine: (number | null)[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (fastEMA[i] !== null && slowEMA[i] !== null) {
      macdLine.push(Number(((fastEMA[i] as number) - (slowEMA[i] as number)).toFixed(2)));
    } else {
      macdLine.push(null);
    }
  }

  // Calculate signal line as 9 EMA of MACD Line
  const validMacdValues: number[] = [];
  const validIndices: number[] = [];
  macdLine.forEach((val, idx) => {
    if (val !== null) {
      validMacdValues.push(val);
      validIndices.push(idx);
    }
  });

  const signalLineValid = calculateEMA(validMacdValues, signalPeriod);
  const signalLine: (number | null)[] = Array(closes.length).fill(null);
  const histogram: (number | null)[] = Array(closes.length).fill(null);

  signalLineValid.forEach((sigVal, idx) => {
    const originalIdx = validIndices[idx];
    signalLine[originalIdx] = sigVal;
    if (sigVal !== null && macdLine[originalIdx] !== null) {
      histogram[originalIdx] = Number(((macdLine[originalIdx] as number) - sigVal).toFixed(2));
    }
  });

  return { macdLine, signalLine, histogram };
}

/**
 * Calculates Bollinger Bands (20, 2)
 */
export function calculateBollingerBands(closes: number[], period: number = 20, multiplier: number = 2) {
  const sma = calculateSMA(closes, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];
  const middle = sma;

  for (let i = 0; i < closes.length; i++) {
    if (sma[i] === null) {
      upper.push(null);
      lower.push(null);
    } else {
      const slice = closes.slice(i - period + 1, i + 1);
      const mean = sma[i] as number;
      const variance = slice.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / period;
      const stdDev = Math.sqrt(variance);
      upper.push(Number((mean + multiplier * stdDev).toFixed(2)));
      lower.push(Number((mean - multiplier * stdDev).toFixed(2)));
    }
  }

  return { upper, middle, lower };
}

/**
 * Calculates Average True Range (ATR)
 */
export function calculateATR(candles: Candle[], period: number = 14): (number | null)[] {
  const atr: (number | null)[] = [];
  if (candles.length === 0) return atr;

  const trs: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      trs.push(candles[i].high - candles[i].low);
    } else {
      const h = candles[i].high;
      const l = candles[i].low;
      const prevC = candles[i - 1].close;
      const tr = Math.max(h - l, Math.abs(h - prevC), Math.abs(l - prevC));
      trs.push(tr);
    }
  }

  let currentAtr = 0;
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      atr.push(null);
    } else if (i === period - 1) {
      currentAtr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
      atr.push(Number(currentAtr.toFixed(2)));
    } else {
      currentAtr = (currentAtr * (period - 1) + trs[i]) / period;
      atr.push(Number(currentAtr.toFixed(2)));
    }
  }

  return atr;
}

/**
 * Calculates SuperTrend (10, 3)
 */
export function calculateSuperTrend(candles: Candle[], period: number = 10, multiplier: number = 3) {
  const atr = calculateATR(candles, period);
  const trendLine: (number | null)[] = [];
  const direction: ('up' | 'down' | null)[] = []; // 'up' = green/bullish, 'down' = red/bearish

  let prevUpper = 0;
  let prevLower = 0;
  let prevTrend = 'up';

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const currentAtr = atr[i];

    if (currentAtr === null || i < period) {
      trendLine.push(null);
      direction.push(null);
      continue;
    }

    const hl2 = (c.high + c.low) / 2;
    let basicUpper = hl2 + multiplier * currentAtr;
    let basicLower = hl2 - multiplier * currentAtr;

    let finalUpper = basicUpper;
    let finalLower = basicLower;

    if (i > period) {
      const prevClose = candles[i - 1].close;
      finalUpper = basicUpper < prevUpper || prevClose > prevUpper ? basicUpper : prevUpper;
      finalLower = basicLower > prevLower || prevClose < prevLower ? basicLower : prevLower;
    }

    let currentTrend = prevTrend;
    if (prevTrend === 'up' && c.close < finalLower) {
      currentTrend = 'down';
    } else if (prevTrend === 'down' && c.close > finalUpper) {
      currentTrend = 'up';
    }

    prevUpper = finalUpper;
    prevLower = finalLower;
    prevTrend = currentTrend;

    const val = currentTrend === 'up' ? finalLower : finalUpper;
    trendLine.push(Number(val.toFixed(2)));
    direction.push(currentTrend as any);
  }

  return { trendLine, direction };
}

/**
 * Calculates Volume Weighted Average Price (VWAP)
 */
export function calculateVWAP(candles: Candle[]): (number | null)[] {
  let cumulativeTypicalVol = 0;
  let cumulativeVol = 0;
  const vwap: (number | null)[] = [];

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const typicalPrice = (c.high + c.low + c.close) / 3;
    const vol = c.volume > 0 ? c.volume : 1;

    cumulativeTypicalVol += typicalPrice * vol;
    cumulativeVol += vol;

    if (cumulativeVol > 0) {
      vwap.push(Number((cumulativeTypicalVol / cumulativeVol).toFixed(2)));
    } else {
      vwap.push(c.close);
    }
  }

  return vwap;
}

/**
 * Calculates Stochastic RSI (14, 14, 3, 3)
 */
export function calculateStochasticRSI(
  closes: number[],
  rsiPeriod: number = 14,
  stochPeriod: number = 14,
  kPeriod: number = 3,
  dPeriod: number = 3
) {
  const rsi = calculateRSI(closes, rsiPeriod);
  const rawStoch: (number | null)[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i < rsiPeriod + stochPeriod - 1 || rsi[i] === null) {
      rawStoch.push(null);
      continue;
    }

    const rsiSlice = rsi.slice(i - stochPeriod + 1, i + 1).filter((v): v is number => v !== null);
    if (rsiSlice.length < stochPeriod) {
      rawStoch.push(null);
      continue;
    }

    const minRsi = Math.min(...rsiSlice);
    const maxRsi = Math.max(...rsiSlice);
    const currentRsi = rsi[i] as number;

    if (maxRsi === minRsi) {
      rawStoch.push(50);
    } else {
      const stoch = ((currentRsi - minRsi) / (maxRsi - minRsi)) * 100;
      rawStoch.push(Number(stoch.toFixed(2)));
    }
  }

  // Smooth K line
  const validStoch: number[] = [];
  const validIndices: number[] = [];
  rawStoch.forEach((v, idx) => {
    if (v !== null) {
      validStoch.push(v);
      validIndices.push(idx);
    }
  });

  const kValues = calculateSMA(validStoch, kPeriod);
  const kLine: (number | null)[] = Array(closes.length).fill(null);
  kValues.forEach((val, idx) => {
    kLine[validIndices[idx]] = val;
  });

  // Smooth D line as SMA of K
  const validK: number[] = [];
  const validKIndices: number[] = [];
  kLine.forEach((v, idx) => {
    if (v !== null) {
      validK.push(v);
      validKIndices.push(idx);
    }
  });

  const dValues = calculateSMA(validK, dPeriod);
  const dLine: (number | null)[] = Array(closes.length).fill(null);
  dValues.forEach((val, idx) => {
    dLine[validKIndices[idx]] = val;
  });

  return { kLine, dLine };
}

/**
 * Calculates Donchian Channels (20)
 */
export function calculateDonchianChannels(candles: Candle[], period: number = 20) {
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];
  const middle: (number | null)[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      upper.push(null);
      lower.push(null);
      middle.push(null);
    } else {
      const slice = candles.slice(i - period + 1, i + 1);
      const highMax = Math.max(...slice.map((c) => c.high));
      const lowMin = Math.min(...slice.map((c) => c.low));
      const mid = (highMax + lowMin) / 2;

      upper.push(Number(highMax.toFixed(2)));
      lower.push(Number(lowMin.toFixed(2)));
      middle.push(Number(mid.toFixed(2)));
    }
  }

  return { upper, lower, middle };
}

/**
 * Calculates Williams %R (14)
 */
export function calculateWilliamsR(candles: Candle[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const slice = candles.slice(i - period + 1, i + 1);
      const highestHigh = Math.max(...slice.map((c) => c.high));
      const lowestLow = Math.min(...slice.map((c) => c.low));
      const close = candles[i].close;

      if (highestHigh === lowestLow) {
        result.push(-50);
      } else {
        const wr = ((highestHigh - close) / (highestHigh - lowestLow)) * -100;
        result.push(Number(wr.toFixed(2)));
      }
    }
  }
  return result;
}

/**
 * Calculates Parabolic SAR
 */
export function calculateParabolicSAR(candles: Candle[], step: number = 0.02, maxStep: number = 0.2): (number | null)[] {
  const sar: (number | null)[] = [];
  if (candles.length < 2) return candles.map(() => null);

  let isBull = candles[1].close >= candles[0].close;
  let ep = isBull ? Math.max(candles[0].high, candles[1].high) : Math.min(candles[0].low, candles[1].low);
  let af = step;
  let curSar = isBull ? Math.min(candles[0].low, candles[1].low) : Math.max(candles[0].high, candles[1].high);

  sar.push(null);
  sar.push(Number(curSar.toFixed(2)));

  for (let i = 2; i < candles.length; i++) {
    const prevC = candles[i - 1];
    const prevPrevC = candles[i - 2];

    let nextSar = curSar + af * (ep - curSar);

    if (isBull) {
      if (prevC.low < nextSar || (prevPrevC && prevPrevC.low < nextSar)) {
        nextSar = Math.min(prevC.low, prevPrevC ? prevPrevC.low : prevC.low);
      }
      if (candles[i].low < nextSar) {
        isBull = false;
        nextSar = ep;
        ep = candles[i].low;
        af = step;
      } else {
        if (candles[i].high > ep) {
          ep = candles[i].high;
          af = Math.min(af + step, maxStep);
        }
      }
    } else {
      if (prevC.high > nextSar || (prevPrevC && prevPrevC.high > nextSar)) {
        nextSar = Math.max(prevC.high, prevPrevC ? prevPrevC.high : prevC.high);
      }
      if (candles[i].high > nextSar) {
        isBull = true;
        nextSar = ep;
        ep = candles[i].high;
        af = step;
      } else {
        if (candles[i].low < ep) {
          ep = candles[i].low;
          af = Math.min(af + step, maxStep);
        }
      }
    }

    curSar = nextSar;
    sar.push(Number(curSar.toFixed(2)));
  }

  return sar;
}

/**
 * Computes complete technical indicators snapshot for a given stock and history
 */
export function computeTechnicalSnapshot(
  symbol: string,
  history: Candle[]
): TechnicalIndicatorsResult {
  if (!history || history.length === 0) {
    return {
      symbol,
      ltp: 0,
      sma20: 0,
      sma50: 0,
      sma200: 0,
      ema9: 0,
      ema21: 0,
      rsi14: 50,
      macd: { macdLine: 0, signalLine: 0, histogram: 0 },
      bollingerBands: { upper: 0, middle: 0, lower: 0 },
      pivotPoints: { r2: 0, r1: 0, pivot: 0, s1: 0, s2: 0 },
      trendSignal: 'Neutral',
      summary: 'Insufficient historical data',
    };
  }

  const closes = history.map((c) => c.close);
  const lastIndex = history.length - 1;
  const lastCandle = history[lastIndex];
  const ltp = lastCandle.close;

  const sma20Arr = calculateSMA(closes, 20);
  const sma50Arr = calculateSMA(closes, 50);
  const sma200Arr = calculateSMA(closes, Math.min(200, closes.length));
  const ema9Arr = calculateEMA(closes, 9);
  const ema21Arr = calculateEMA(closes, 21);
  const rsiArr = calculateRSI(closes, 14);
  const macdData = calculateMACD(closes);
  const bbData = calculateBollingerBands(closes, 20, 2);

  const sma20 = sma20Arr[lastIndex] ?? ltp;
  const sma50 = sma50Arr[lastIndex] ?? ltp;
  const sma200 = sma200Arr[lastIndex] ?? ltp;
  const ema9 = ema9Arr[lastIndex] ?? ltp;
  const ema21 = ema21Arr[lastIndex] ?? ltp;
  const rsi14 = rsiArr[lastIndex] ?? 50;

  const macdLine = macdData.macdLine[lastIndex] ?? 0;
  const signalLine = macdData.signalLine[lastIndex] ?? 0;
  const histogram = macdData.histogram[lastIndex] ?? 0;

  const bbUpper = bbData.upper[lastIndex] ?? ltp * 1.05;
  const bbMiddle = bbData.middle[lastIndex] ?? ltp;
  const bbLower = bbData.lower[lastIndex] ?? ltp * 0.95;

  // Classic Pivot Points from previous candle
  const prev = history.length > 1 ? history[history.length - 2] : lastCandle;
  const pivot = Number(((prev.high + prev.low + prev.close) / 3).toFixed(2));
  const r1 = Number((2 * pivot - prev.low).toFixed(2));
  const s1 = Number((2 * pivot - prev.high).toFixed(2));
  const r2 = Number((pivot + (prev.high - prev.low)).toFixed(2));
  const s2 = Number((pivot - (prev.high - prev.low)).toFixed(2));

  // Determine trend score
  let bullScore = 0;
  if (ltp > sma20) bullScore += 1;
  if (ltp > sma50) bullScore += 1;
  if (ltp > sma200) bullScore += 1.5;
  if (ema9 > ema21) bullScore += 1;
  if (rsi14 > 50 && rsi14 < 70) bullScore += 1;
  if (macdLine > signalLine) bullScore += 1;

  let trendSignal: TechnicalIndicatorsResult['trendSignal'] = 'Neutral';
  if (bullScore >= 5.5) trendSignal = 'Strong Bullish';
  else if (bullScore >= 4) trendSignal = 'Bullish';
  else if (bullScore <= 1.5) trendSignal = 'Strong Bearish';
  else if (bullScore <= 2.5) trendSignal = 'Bearish';

  const summary = `${symbol} trades at NPR ${ltp}, currently ${
    ltp >= sma200 ? 'above' : 'below'
  } its 200 SMA with RSI at ${rsi14} (${
    rsi14 > 70 ? 'Overbought' : rsi14 < 30 ? 'Oversold' : 'Neutral range'
  }) and MACD histogram at ${histogram >= 0 ? '+' : ''}${histogram}.`;

  return {
    symbol,
    ltp,
    sma20,
    sma50,
    sma200,
    ema9,
    ema21,
    rsi14,
    macd: { macdLine, signalLine, histogram },
    bollingerBands: { upper: bbUpper, middle: bbMiddle, lower: bbLower },
    pivotPoints: { r2, r1, pivot, s1, s2 },
    trendSignal,
    summary,
  };
}
