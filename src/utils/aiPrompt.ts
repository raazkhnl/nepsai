import { StockItem, TechnicalIndicatorsResult, SectorSummary, BYOKConfig } from '../types/market';

/**
 * Builds standard NEPSE structured prompt for LLMs
 */
export function buildNEPSEPrompt(
  stock: StockItem,
  technicals: TechnicalIndicatorsResult,
  sector: SectorSummary | undefined,
  strategyMode: 'swing' | 'value' | 'scalp' | 'risk' = 'swing'
): string {
  const strategyDirectives: Record<string, string> = {
    swing: 'Focus on short-to-medium swing setups (2-6 weeks), trend momentum, and multi-week breakout levels.',
    value: 'Focus on fundamental valuation (P/E, EPS), dividend consistency, and long-term accumulation zones.',
    scalp: 'Focus on immediate intraday and 1-3 day pivot levels, volume bursts, and tight stop-loss boundaries.',
    risk: 'Conduct a strict downside risk and capital preservation audit, noting liquidity limits and sector risks in NEPSE.',
  };

  return `You are a senior institutional quantitative analyst specializing in the Nepal Stock Exchange (NEPSE).
Your task is to analyze the target scrip: **${stock.symbol} (${stock.name})**. Provide a detailed, objective, well-structured technical analysis report in clean Markdown format specifically for ${stock.symbol}.

### Target Scrip Profile: Symbol: ${stock.symbol} (${stock.name})
- Sector: ${stock.sector}
- Current LTP: NPR ${stock.ltp.toFixed(2)}
- 1-Day Change: ${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)} (${stock.pChange >= 0 ? '+' : ''}${stock.pChange.toFixed(2)}%)
- Day Range: NPR ${stock.low.toFixed(2)} - NPR ${stock.high.toFixed(2)}
- 52-Week Range: NPR ${stock.low52.toFixed(2)} - NPR ${stock.high52.toFixed(2)}
- Daily Volume: ${stock.volume.toLocaleString()} shares (Turnover: NPR ${(stock.turnover / 10000000).toFixed(2)} Crores)
- Fundamentals: P/E Ratio: ${stock.pe}, EPS: NPR ${stock.eps}, MCap: NPR ${stock.marketCapBillion}B

### Technical Indicators
- Relative Strength Index (RSI 14): ${technicals.rsi14} (${technicals.rsi14 > 70 ? 'Overbought' : technicals.rsi14 < 30 ? 'Oversold' : 'Neutral Zone'})
- Trend Moving Averages:
  * SMA 20: NPR ${technicals.sma20.toFixed(2)} (${stock.ltp >= technicals.sma20 ? 'Above / Bullish' : 'Below / Bearish'})
  * SMA 50: NPR ${technicals.sma50.toFixed(2)} (${stock.ltp >= technicals.sma50 ? 'Above / Bullish' : 'Below / Bearish'})
  * SMA 200: NPR ${technicals.sma200.toFixed(2)} (${stock.ltp >= technicals.sma200 ? 'Above / Long-term Bullish' : 'Below / Long-term Bearish'})
  * EMA 9: NPR ${technicals.ema9.toFixed(2)} | EMA 21: NPR ${technicals.ema21.toFixed(2)} (${technicals.ema9 >= technicals.ema21 ? 'Short-term Bullish Crossover' : 'Short-term Bearish Crossover'})
- MACD (12, 26, 9):
  * MACD Line: ${technicals.macd.macdLine} | Signal: ${technicals.macd.signalLine}
  * Histogram: ${technicals.macd.histogram} (${technicals.macd.histogram >= 0 ? 'Expanding Positive Momentum' : 'Negative Momentum'})
- Bollinger Bands (20, 2):
  * Upper Band: NPR ${technicals.bollingerBands.upper.toFixed(2)}
  * Middle Band: NPR ${technicals.bollingerBands.middle.toFixed(2)}
  * Lower Band: NPR ${technicals.bollingerBands.lower.toFixed(2)}
- Classic Pivot Points:
  * Resistance 2 (R2): NPR ${technicals.pivotPoints.r2.toFixed(2)}
  * Resistance 1 (R1): NPR ${technicals.pivotPoints.r1.toFixed(2)}
  * Central Pivot (P): NPR ${technicals.pivotPoints.pivot.toFixed(2)}
  * Support 1 (S1): NPR ${technicals.pivotPoints.s1.toFixed(2)}
  * Support 2 (S2): NPR ${technicals.pivotPoints.s2.toFixed(2)}
- Algorithmic Signal: ${technicals.trendSignal}

### Sector Context
- Sector: ${sector ? sector.sector : stock.sector}
- Sector Index: ${sector ? sector.indexValue.toFixed(2) : 'N/A'} (${sector && sector.pChange >= 0 ? '+' : ''}${sector ? sector.pChange.toFixed(2) : '0'}%)
- Sector Advancers / Decliners: ${sector ? `${sector.advancers} Adv / ${sector.decliners} Dec` : 'N/A'}

### Strategic Perspective
${strategyDirectives[strategyMode]}

### Report Structure Required:
1. **Executive Summary & Trend Signal**: Clear stance (Bullish / Bearish / Consolidating / Reversal watch).
2. **Key Price Levels Matrix**: Table of Immediate Resistance (R1, R2), Immediate Support (S1, S2), and Invalidation / Stop-Loss level in NPR.
3. **Indicator Confluence Analysis**: Synthesis of RSI momentum, Moving Average alignments, MACD histogram, and Bollinger volatility bands.
4. **Sector Tailwinds & NEPSE Market Sentiment**: How the broader sector performance impacts this scrip.
5. **Key Risks & Nepal Regulatory Factors**: NRB/SEBON monetary policy, sector lock-in expiry risks, or liquidity constraints.
6. **Actionable Trading Summary**: Plain, non-hype conclusions for traders and investors.
*(Include clear disclaimer: Not financial advice. Educational analysis only.)*`;
}

import { AIErrorInfo, classifyAIError } from '../components/AIErrorBanner';

export interface AIAnalysisResult {
  text: string;
  engine: string;
  error?: AIErrorInfo;
}

/**
 * Executes LLM call via client BYOK or falls back to backend proxy route
 * Returns full result object with error diagnostics
 */
export async function executeAIAnalysisDetailed(
  prompt: string,
  byokConfig: BYOKConfig | null
): Promise<AIAnalysisResult> {
  // If user provided a personal BYOK key, run direct client HTTPS call
  if (byokConfig && byokConfig.apiKey && byokConfig.apiKey.trim().length > 0) {
    if (byokConfig.provider === 'gemini') {
      const model = byokConfig.model || 'gemini-3.8-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
        byokConfig.apiKey.trim()
      )}`;

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errStr = errData?.error?.message || `Gemini API returned HTTP ${res.status}: ${res.statusText}`;
          const errInfo = classifyAIError({ message: errStr, status: res.status });
          return {
            text: '',
            engine: `BYOK (${byokConfig.provider} · ${model})`,
            error: errInfo,
          };
        }

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text || text.trim().length === 0) {
          return {
            text: '',
            engine: `BYOK (${byokConfig.provider} · ${model})`,
            error: classifyAIError('No analysis response returned from Gemini API.'),
          };
        }

        return {
          text,
          engine: `BYOK Gemini (${model})`,
        };
      } catch (networkErr: any) {
        return {
          text: '',
          engine: `BYOK (${byokConfig.provider})`,
          error: classifyAIError(networkErr),
        };
      }
    }

    if (byokConfig.provider === 'groq') {
      const model = byokConfig.model || 'llama-3.3-70b-versatile';
      const url = 'https://api.groq.com/openai/v1/chat/completions';

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${byokConfig.apiKey.trim()}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content:
                  'You are an expert quantitative technical analyst specializing in the Nepal Stock Exchange (NEPSE). Provide sharp, structured markdown reports.',
              },
              { role: 'user', content: prompt },
            ],
            temperature: 0.7,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errStr = errData?.error?.message || `Groq API returned HTTP ${res.status}: ${res.statusText}`;
          return {
            text: '',
            engine: `BYOK Groq (${model})`,
            error: classifyAIError({ message: errStr, status: res.status }),
          };
        }

        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (!text) {
          return {
            text: '',
            engine: `BYOK Groq (${model})`,
            error: classifyAIError('No response returned from Groq API.'),
          };
        }

        return { text, engine: `BYOK Groq (${model})` };
      } catch (err: any) {
        return { text: '', engine: 'BYOK Groq', error: classifyAIError(err) };
      }
    }

    if (byokConfig.provider === 'nvidia') {
      const model = byokConfig.model || 'meta/llama-3.3-70b-instruct';
      const url = 'https://integrate.api.nvidia.com/v1/chat/completions';

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${byokConfig.apiKey.trim()}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content:
                  'You are an expert quantitative technical analyst specializing in the Nepal Stock Exchange (NEPSE). Provide sharp, structured markdown reports.',
              },
              { role: 'user', content: prompt },
            ],
            temperature: 0.6,
            max_tokens: 2048,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errStr = errData?.error?.message || errData?.message || `NVIDIA NIM API returned HTTP ${res.status}: ${res.statusText}`;
          return {
            text: '',
            engine: `BYOK NVIDIA NIM (${model})`,
            error: classifyAIError({ message: errStr, status: res.status }),
          };
        }

        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (!text) {
          return {
            text: '',
            engine: `BYOK NVIDIA NIM (${model})`,
            error: classifyAIError('No response returned from NVIDIA NIM API.'),
          };
        }

        return { text, engine: `BYOK NVIDIA NIM (${model})` };
      } catch (err: any) {
        return { text: '', engine: 'BYOK NVIDIA NIM', error: classifyAIError(err) };
      }
    }

    if (byokConfig.provider === 'deepseek') {
      const model = byokConfig.model || 'deepseek-chat';
      const url = 'https://api.deepseek.com/chat/completions';

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${byokConfig.apiKey.trim()}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content:
                  'You are an expert quantitative technical analyst specializing in the Nepal Stock Exchange (NEPSE). Provide sharp, structured markdown reports.',
              },
              { role: 'user', content: prompt },
            ],
            temperature: 0.6,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errStr = errData?.error?.message || errData?.message || `DeepSeek API returned HTTP ${res.status}: ${res.statusText}`;
          return {
            text: '',
            engine: `BYOK DeepSeek (${model})`,
            error: classifyAIError({ message: errStr, status: res.status }),
          };
        }

        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (!text) {
          return {
            text: '',
            engine: `BYOK DeepSeek (${model})`,
            error: classifyAIError('No response returned from DeepSeek API.'),
          };
        }

        return { text, engine: `BYOK DeepSeek (${model})` };
      } catch (err: any) {
        return { text: '', engine: 'BYOK DeepSeek', error: classifyAIError(err) };
      }
    }

    if (byokConfig.provider === 'openai') {
      const model = byokConfig.model || 'gpt-4o-mini';
      const url = 'https://api.openai.com/v1/chat/completions';

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${byokConfig.apiKey.trim()}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content:
                  'You are an expert quantitative technical analyst specializing in the Nepal Stock Exchange (NEPSE). Provide sharp, structured markdown reports.',
              },
              { role: 'user', content: prompt },
            ],
            temperature: 0.7,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errStr = errData?.error?.message || `OpenAI API returned HTTP ${res.status}: ${res.statusText}`;
          return {
            text: '',
            engine: `BYOK OpenAI (${model})`,
            error: classifyAIError({ message: errStr, status: res.status }),
          };
        }

        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (!text) {
          return {
            text: '',
            engine: `BYOK OpenAI (${model})`,
            error: classifyAIError('No response returned from OpenAI API.'),
          };
        }

        return { text, engine: `BYOK OpenAI (${model})` };
      } catch (err: any) {
        return { text: '', engine: 'BYOK OpenAI', error: classifyAIError(err) };
      }
    }

    if (byokConfig.provider === 'openrouter') {
      const model = byokConfig.model || 'deepseek/deepseek-r1:free';
      const url = 'https://openrouter.ai/api/v1/chat/completions';

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${byokConfig.apiKey.trim()}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'NEPSE AI Analytics',
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content:
                  'You are an expert quantitative technical analyst specializing in the Nepal Stock Exchange (NEPSE). Provide sharp, structured markdown reports.',
              },
              { role: 'user', content: prompt },
            ],
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errStr = errData?.error?.message || `OpenRouter API returned HTTP ${res.status}: ${res.statusText}`;
          return {
            text: '',
            engine: `BYOK OpenRouter (${model})`,
            error: classifyAIError({ message: errStr, status: res.status }),
          };
        }

        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (!text) {
          return {
            text: '',
            engine: `BYOK OpenRouter (${model})`,
            error: classifyAIError('No response returned from OpenRouter API.'),
          };
        }

        return { text, engine: `BYOK OpenRouter (${model})` };
      } catch (err: any) {
        return { text: '', engine: 'BYOK OpenRouter', error: classifyAIError(err) };
      }
    }
  }

  // Fallback: Call application server proxy route (powered by server-side Gemini SDK)
  try {
    const serverRes = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!serverRes.ok) {
      const errorData = await serverRes.json().catch(() => ({}));
      const errStr = errorData?.error || `Server AI endpoint failed with HTTP ${serverRes.status}`;
      return {
        text: '',
        engine: 'Server Institutional AI',
        error: classifyAIError({ message: errStr, status: serverRes.status }),
      };
    }

    const data = await serverRes.json();
    const serverError = data.error || data.warning ? classifyAIError(data.error || data.warning) : undefined;

    return {
      text: data.text || '',
      engine: data.engine || 'Server Institutional AI',
      error: serverError,
    };
  } catch (netErr: any) {
    return {
      text: '',
      engine: 'Server Institutional AI',
      error: classifyAIError(netErr),
    };
  }
}

/**
 * Executes LLM call and returns text, throwing rich classified error if generation fails
 */
export async function executeAIAnalysis(
  prompt: string,
  byokConfig: BYOKConfig | null
): Promise<string> {
  const result = await executeAIAnalysisDetailed(prompt, byokConfig);
  if (result.error && !result.text) {
    const err = new Error(result.error.description || result.error.title);
    (err as any).info = result.error;
    throw err;
  }
  return result.text || 'Analysis completed.';
}
