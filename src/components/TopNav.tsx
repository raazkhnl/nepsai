import React from 'react';
import { KeyRound, Clock, Sparkles, Shield, Search, Flame } from 'lucide-react';

interface TopNavProps {
  activeTab: 'terminal' | 'movers' | 'sectors' | 'compare' | 'ai' | 'admin';
  setActiveTab: (tab: 'terminal' | 'movers' | 'sectors' | 'compare' | 'ai' | 'admin') => void;
  openKeyModal: () => void;
  hasPersonalKey: boolean;
  nepseClock: string;
  onOpenSearch: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  openKeyModal,
  hasPersonalKey,
  nepseClock,
  onOpenSearch,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0B0E14]/95 backdrop-blur-md border-b border-neutral-800/80 px-4 lg:px-6 py-2.5 transition-colors">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Zone 1: Brand wordmark & Nepal Clock */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('terminal')}
            className="text-left group cursor-pointer focus:outline-none"
          >
            <span className="text-base sm:text-lg font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors flex items-center gap-1.5">
              NepsAi
              <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono font-normal">NEPSE</span>
            </span>
          </button>

          {/* Nepal Standard Time */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-400 pl-3 border-l border-neutral-800 tabular-nums">
            <Clock className="w-3.5 h-3.5 text-cyan-500/80" />
            <span>NPT {nepseClock}</span>
          </div>
        </div>

        {/* Zone 2: Main Trader Navigation (High-utility tools) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 text-xs lg:text-sm font-medium">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'terminal'
                ? 'bg-neutral-800/90 text-cyan-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
            }`}
          >
            Terminal
          </button>
          <button
            onClick={() => setActiveTab('movers')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'movers'
                ? 'bg-neutral-800/90 text-cyan-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
            }`}
          >
            Movers
          </button>
          <button
            onClick={() => setActiveTab('sectors')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'sectors'
                ? 'bg-neutral-800/90 text-cyan-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
            }`}
          >
            Sectors & Visuals
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'compare'
                ? 'bg-neutral-800/90 text-cyan-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
            }`}
          >
            Compare
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'ai'
                ? 'bg-neutral-800/90 text-cyan-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Insights</span>
          </button>
        </nav>

        {/* Zone 3: Quick Search & AI Vault */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Search palette trigger */}
          <button
            onClick={onOpenSearch}
            title="Press any letter key [A-Z] anywhere on the keyboard to search"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-md transition-colors cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline-block text-[10px] font-mono bg-neutral-800 px-1 py-0.5 rounded text-neutral-400 border border-neutral-700">
              A-Z
            </kbd>
          </button>

          {/* BYOK AI Vault */}
          <button
            onClick={openKeyModal}
            title="Configure BYOK LLM Keys (Gemini / Groq / OpenRouter)"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap cursor-pointer ${
              hasPersonalKey
                ? 'bg-cyan-950/40 border-cyan-800/60 text-cyan-300 hover:bg-cyan-900/50'
                : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:bg-neutral-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">AI Vault</span>
          </button>
        </div>
      </div>

      {/* Mobile navigation row */}
      <div className="flex md:hidden items-center justify-between gap-1 pt-2 border-t border-neutral-800/60 mt-2 text-xs overflow-x-auto pb-0.5">
        <button
          onClick={() => setActiveTab('terminal')}
          className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${
            activeTab === 'terminal' ? 'bg-neutral-800 text-cyan-400 font-medium' : 'text-neutral-400'
          }`}
        >
          Terminal
        </button>
        <button
          onClick={() => setActiveTab('movers')}
          className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${
            activeTab === 'movers' ? 'bg-neutral-800 text-cyan-400 font-medium' : 'text-neutral-400'
          }`}
        >
          Movers
        </button>
        <button
          onClick={() => setActiveTab('sectors')}
          className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${
            activeTab === 'sectors' ? 'bg-neutral-800 text-cyan-400 font-medium' : 'text-neutral-400'
          }`}
        >
          Sectors & Visuals
        </button>
        <button
          onClick={() => setActiveTab('compare')}
          className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${
            activeTab === 'compare' ? 'bg-neutral-800 text-cyan-400 font-medium' : 'text-neutral-400'
          }`}
        >
          Compare
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${
            activeTab === 'ai' ? 'bg-neutral-800 text-cyan-400 font-medium' : 'text-neutral-400'
          }`}
        >
          AI View
        </button>
      </div>
    </header>
  );
};
