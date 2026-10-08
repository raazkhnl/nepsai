import React, { useState, useEffect, useRef } from 'react';
import { StockItem } from '../types/market';
import { Search, X, TrendingUp, TrendingDown, ArrowRight, CornerDownLeft } from 'lucide-react';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  stocks: StockItem[];
  onSelectStock: (stock: StockItem) => void;
  initialQuery?: string;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  stocks,
  onSelectStock,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setSelectedIndex(0);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length);
        }
      }, 50);
    }
  }, [isOpen, initialQuery]);

  const filtered = stocks.filter((s) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      s.symbol.toLowerCase().includes(q) ||
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.sector && s.sector.toLowerCase().includes(q))
    );
  }).slice(0, 12);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filtered.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        onSelectStock(filtered[selectedIndex]);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-[#0e131d] border border-neutral-700/80 rounded-xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-800 bg-[#090d14]">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type symbol or company name (e.g. NICA, NABIL, NEPSE)..."
            className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                if (inputRef.current) inputRef.current.focus();
              }}
              className="text-neutral-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-700">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto divide-y divide-neutral-800/60 p-1 flex-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500">
              No matching instruments found for "{query}".
            </div>
          ) : (
            filtered.map((stock, idx) => {
              const isSelected = idx === selectedIndex;
              const isUp = stock.change >= 0;
              return (
                <div
                  key={stock.symbol}
                  onClick={() => {
                    onSelectStock(stock);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'bg-neutral-800/80 text-white' : 'hover:bg-neutral-900/60 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-neutral-900 border border-neutral-700/80 flex items-center justify-center font-bold text-xs text-cyan-400 shrink-0">
                      {stock.symbol.slice(0, 3)}
                    </div>
                    <div className="min-w-0 truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{stock.symbol}</span>
                        {stock.isIndex && (
                          <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-800">
                            INDEX
                          </span>
                        )}
                        <span className="text-[11px] text-neutral-400 truncate">{stock.sector}</span>
                      </div>
                      <div className="text-xs text-neutral-400 truncate mt-0.5">{stock.name}</div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 tabular-nums pl-3">
                    <div className="text-sm font-semibold text-white">
                      NPR {stock.ltp.toFixed(2)}
                    </div>
                    <div className={`text-xs font-medium ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isUp ? '+' : ''}{stock.pChange.toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2 bg-[#090d14] border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500">
          <div className="flex items-center gap-2">
            <span>↑↓ Navigate</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <CornerDownLeft className="w-3 h-3" /> Select
            </span>
          </div>
          <span>NEPSE Universe (359 symbols)</span>
        </div>
      </div>
    </div>
  );
};
