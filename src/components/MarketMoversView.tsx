import React, { useState } from 'react';
import { StockItem, BYOKConfig } from '../types/market';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Award, ArrowUpRight, Sparkles, RefreshCw, X, KeyRound, CheckCircle2 } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MarketMoversViewProps {
  stocks: StockItem[];
  onSelectStock: (stock: StockItem) => void;
  onNavigateToTerminal: () => void;
  byokConfig?: BYOKConfig | null;
  onOpenVault?: () => void;
}

export const MarketMoversView: React.FC<MarketMoversViewProps> = ({
  stocks,
  onSelectStock,
  onNavigateToTerminal,
  byokConfig = null,
  onOpenVault = () => {},
}) => {
  const [activeLeaderTab, setActiveLeaderTab] = useState<'gainers' | 'losers' | 'turnover' | 'volume' | 'breakouts'>('gainers');

  // AI Market Breadth State
  const [aiModalOpen, setAiModalOpen] = useState<boolean>(false);
  const [aiAnalysisText, setAiAnalysisText] = useState<string>('');
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiEngineUsed, setAiEngineUsed] = useState<string>('');

  // Filter out pure indices for scrip leader tables
  const equitiesOnly = stocks.filter((s) => !s.isIndex);

  // Top Gainers
  const topGainers = [...equitiesOnly]
    .sort((a, b) => b.pChange - a.pChange)
    .slice(0, 15);

  // Top Losers
  const topLosers = [...equitiesOnly]
    .sort((a, b) => a.pChange - b.pChange)
    .slice(0, 15);

  // Turnover Leaders
  const turnoverLeaders = [...equitiesOnly]
    .sort((a, b) => b.turnover - a.turnover)
    .slice(0, 15);

  // Volume Leaders
  const volumeLeaders = [...equitiesOnly]
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 15);

  // 52W High / Low Breakouts
  const breakouts = equitiesOnly
    .filter((s) => s.ltp >= s.high52 * 0.96 || s.ltp <= s.low52 * 1.04)
    .slice(0, 15);

  const getTableRows = () => {
    if (activeLeaderTab === 'gainers') return topGainers;
    if (activeLeaderTab === 'losers') return topLosers;
    if (activeLeaderTab === 'turnover') return turnoverLeaders;
    if (activeLeaderTab === 'volume') return volumeLeaders;
    return breakouts;
  };

  const handleRowClick = (stock: StockItem) => {
    onSelectStock(stock);
    onNavigateToTerminal();
  };

  const handleGenerateBreadthAI = async () => {
    setIsGeneratingAi(true);
    setAiAnalysisText('');
    setAiModalOpen(true);

    const gainersList = topGainers.slice(0, 5).map((s) => `${s.symbol} (+${s.pChange}%, Vol: ${s.volume})`).join(', ');
    const losersList = topLosers.slice(0, 5).map((s) => `${s.symbol} (${s.pChange}%, Vol: ${s.volume})`).join(', ');
    const turnoverList = turnoverLeaders.slice(0, 5).map((s) => `${s.symbol} (NPR ${(s.turnover / 10000000).toFixed(1)} Cr)`).join(', ');
    const breakoutList = breakouts.slice(0, 5).map((s) => `${s.symbol} (LTP: ${s.ltp}, 52W High: ${s.high52})`).join(', ');

    const prompt = `Perform an institutional market breadth and sentiment analysis on the current Nepal Stock Exchange session:
- Top 5 Gainers: ${gainersList}
- Top 5 Losers: ${losersList}
- Top 5 Turnover Leaders: ${turnoverList}
- 52-Week Breakout Candidates: ${breakoutList}

Provide a concise, professional market pulse report covering:
1. Breadth & Institutional Participation (Are blue-chips leading or speculative micro-caps?)
2. Sector Flow Concentration (Where is institutional liquidity gathering?)
3. Breakout Quality & False Breakout Warnings for NEPSE Traders.`;

    try {
      if (byokConfig && byokConfig.apiKey) {
        setAiEngineUsed(`BYOK (${byokConfig.provider} · ${byokConfig.model})`);
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${byokConfig.apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });
        if (res.ok) {
          const d = await res.json();
          const t = d.candidates?.[0]?.content?.parts?.[0]?.text;
          if (t) {
            setAiAnalysisText(t);
            setIsGeneratingAi(false);
            return;
          }
        }
      }

      const sRes = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (sRes.ok) {
        const sData = await sRes.json();
        if (sData.text) {
          setAiEngineUsed('Server Institutional AI (gemini-3.8-flash)');
          setAiAnalysisText(sData.text);
          setIsGeneratingAi(false);
          return;
        }
      }
    } catch (e) {
      console.warn('AI call fell back to local breadth engine:', e);
    }

    setAiEngineUsed('Deterministic Quant Breadth Engine');
    setAiAnalysisText(`### NEPSE Market Breadth & Liquidity Pulse

**Institutional Flow & Market Breadth:**
Turnover is concentrated in **${turnoverLeaders[0]?.symbol || 'Banking & Hydro'}**, indicating targeted institutional positioning rather than broad retail frenzy.

**Momentum & Sector Leadership:**
* **Top Performers:** ${topGainers.slice(0, 3).map((s) => `**${s.symbol}** (+${s.pChange}%)`).join(', ')} showed strong buyer aggression.
* **Capital Protection:** Profit-taking was concentrated in ${topLosers.slice(0, 3).map((s) => `**${s.symbol}** (${s.pChange}%)`).join(', ')}.

**Trader Takeaway:**
Watch for sustained volume on ${turnoverLeaders[0]?.symbol || 'core turnover leaders'} before taking fresh swing long positions; tighten stop-losses on high-beta breakout runners.`);
    setIsGeneratingAi(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-cyan-400" />
            <span>NEPSE Market Movers & Liquidity Leaders</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Real-time session leaders ranked by percentage gain, loss, turnover, volume, and 52-week breakout levels.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* AI Market Breadth Trigger */}
          <button
            onClick={handleGenerateBreadthAI}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-950/70 to-blue-950/70 hover:from-cyan-900/80 hover:to-blue-900/80 border border-cyan-800/80 rounded-md text-xs font-semibold text-cyan-300 transition-colors shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Market Pulse</span>
          </button>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-[#090d14] p-1 rounded-lg border border-neutral-800 text-xs">
          <button
            onClick={() => setActiveLeaderTab('gainers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeLeaderTab === 'gainers'
                ? 'bg-emerald-950/70 border border-emerald-800 text-emerald-300 font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Top Gainers</span>
          </button>

          <button
            onClick={() => setActiveLeaderTab('losers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeLeaderTab === 'losers'
                ? 'bg-rose-950/70 border border-rose-800 text-rose-300 font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            <span>Top Losers</span>
          </button>

          <button
            onClick={() => setActiveLeaderTab('turnover')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeLeaderTab === 'turnover'
                ? 'bg-cyan-950/70 border border-cyan-800 text-cyan-300 font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
            <span>Turnover Leaders</span>
          </button>

          <button
            onClick={() => setActiveLeaderTab('volume')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeLeaderTab === 'volume'
                ? 'bg-amber-950/70 border border-amber-800 text-amber-300 font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
            <span>Volume Leaders</span>
          </button>

          <button
            onClick={() => setActiveLeaderTab('breakouts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeLeaderTab === 'breakouts'
                ? 'bg-purple-950/70 border border-purple-800 text-purple-300 font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span>52W Breakouts</span>
          </button>
        </div>
      </div>
    </div>

      {/* Leader Table */}
      <div className="bg-[#0e131d] border border-neutral-800/80 rounded-lg overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs tabular-nums">
            <thead className="bg-[#090d14] text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Symbol</th>
                <th className="py-3 px-4">Company Name</th>
                <th className="py-3 px-4">Sector</th>
                <th className="py-3 px-4 text-right">LTP (NPR)</th>
                <th className="py-3 px-4 text-right">Point Change</th>
                <th className="py-3 px-4 text-right">Percent Change</th>
                <th className="py-3 px-4 text-right">Turnover (NPR)</th>
                <th className="py-3 px-4 text-right">Volume (Shares)</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {getTableRows().map((stock, idx) => {
                const isPositive = stock.change >= 0;
                return (
                  <tr
                    key={stock.symbol}
                    onClick={() => handleRowClick(stock)}
                    className="hover:bg-neutral-800/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 text-neutral-500 font-mono">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-white flex items-center gap-1.5">
                      <span>{stock.symbol}</span>
                    </td>
                    <td className="py-3 px-4 text-neutral-300 truncate max-w-xs">{stock.name}</td>
                    <td className="py-3 px-4 text-neutral-400">{stock.sector}</td>
                    <td className="py-3 px-4 text-right font-semibold text-white">
                      {stock.ltp.toFixed(2)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-medium ${
                        isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {stock.change.toFixed(2)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-bold ${
                        isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {stock.pChange ? stock.pChange.toFixed(2) : '0.00'}%
                    </td>
                    <td className="py-3 px-4 text-right text-neutral-200">
                      NPR {(stock.turnover / 10000000).toFixed(2)} Cr
                    </td>
                    <td className="py-3 px-4 text-right text-neutral-300">
                      {stock.volume.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(stock);
                        }}
                        className="px-2.5 py-1 text-[11px] font-medium bg-neutral-800 hover:bg-cyan-950 hover:text-cyan-300 border border-neutral-700 rounded transition-colors inline-flex items-center gap-1"
                      >
                        <span>Chart</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Market Breadth Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-[#090d14] border border-neutral-800 rounded-xl shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>AI NEPSE Market Breadth & Sentiment Pulse</span>
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
                <div className="text-sm font-semibold text-white">Synthesizing Market Breadth...</div>
                <div className="text-xs text-neutral-400">Auditing top gainers, turnover concentration & breakout patterns</div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Engine: {aiEngineUsed}</span>
                  </div>
                  <span className="font-mono">Real-time Session Audit</span>
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
