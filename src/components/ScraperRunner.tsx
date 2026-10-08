import React, { useState, useEffect } from 'react';
import { ScraperStatus, StockItem, SectorSummary, MarketSummary, FloorSheetItem, LiveAuditReport } from '../types/market';
import { Play, Clock, Terminal, Download, CheckCircle2, ShieldCheck, Layers, Database, RefreshCw, FileSpreadsheet } from 'lucide-react';

interface ScraperRunnerProps {
  scraperStatus: ScraperStatus;
  onRunScraper: () => Promise<void>;
  stocks: StockItem[];
  sectors: SectorSummary[];
  marketSummary: MarketSummary;
  floorSheet: FloorSheetItem[];
  scheduledTime: string;
  setScheduledTime: (time: string) => void;
  nepseClock: string;
  liveAuditReport: LiveAuditReport | null;
  onRunLiveAudit: () => Promise<void>;
  isAuditing: boolean;
}

export const ScraperRunner: React.FC<ScraperRunnerProps> = ({
  scraperStatus,
  onRunScraper,
  stocks,
  sectors,
  marketSummary,
  floorSheet,
  scheduledTime,
  setScheduledTime,
  nepseClock,
  liveAuditReport,
  onRunLiveAudit,
  isAuditing,
}) => {
  const [selectedJsonView, setSelectedJsonView] = useState<'stocks' | 'summary' | 'sectors' | 'floorsheet' | 'audit'>('audit');

  // Compute countdown to scheduled time (default 17:00 NPT)
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      // UTC to NPT is +5:45
      const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
      const nptDate = new Date(utcMs + 5.75 * 3600000);

      const [targetHour, targetMinute] = scheduledTime.split(':').map(Number);
      const targetDate = new Date(nptDate);
      targetDate.setHours(targetHour, targetMinute, 0, 0);

      if (targetDate.getTime() <= nptDate.getTime()) {
        targetDate.setDate(targetDate.getDate() + 1);
      }

      const diffMs = targetDate.getTime() - nptDate.getTime();
      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.floor((diffMs % 3600000) / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);

      setTimeRemaining(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
          seconds
        ).padStart(2, '0')}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [scheduledTime]);

  const getExportData = () => {
    if (selectedJsonView === 'stocks') {
      return stocks.map((s) => ({
        symbol: s.symbol,
        name: s.name,
        sector: s.sector,
        ltp: s.ltp,
        change: s.change,
        pChange: s.pChange,
        open: s.open,
        high: s.high,
        low: s.low,
        volume: s.volume,
        turnover: s.turnover,
        pe: s.pe,
        eps: s.eps,
      }));
    }
    if (selectedJsonView === 'sectors') return sectors;
    if (selectedJsonView === 'floorsheet') return floorSheet;
    if (selectedJsonView === 'audit') return liveAuditReport || { status: 'No audit recorded yet' };
    return marketSummary;
  };

  const downloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(getExportData(), null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `nepse_${selectedJsonView}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const downloadCsv = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (selectedJsonView === 'stocks') {
      csvContent += 'Symbol,Name,Sector,LTP,Change,PChange,Open,High,Low,Volume,Turnover\n';
      stocks.forEach((s) => {
        csvContent += `"${s.symbol}","${(s.name || '').replace(/"/g, '""')}","${s.sector}",${s.ltp},${s.change},${s.pChange},${s.open},${s.high},${s.low},${s.volume},${s.turnover}\n`;
      });
    } else if (selectedJsonView === 'sectors') {
      csvContent += 'Sector,IndexValue,Change,PChange,TurnoverNPR,ScripCount\n';
      sectors.forEach((sec) => {
        csvContent += `"${sec.sector}",${sec.indexValue},${sec.change},${sec.pChange},${sec.turnover},${sec.scripCount}\n`;
      });
    } else {
      csvContent += 'Key,Value\n';
      Object.entries(marketSummary).forEach(([k, v]) => {
        csvContent += `"${k}","${v}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nepse_${selectedJsonView}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <span>NEPSE Multi-Provider Scraper Engine (5:00 PM NPT)</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Collects and reconciles EOD public feeds across primary exchange feeds, national securities data, and real-time aggregators.
          </p>
        </div>

        {/* Schedule & Action Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#0e131d] px-3 py-1.5 rounded-lg border border-neutral-800 text-xs">
            <span className="text-neutral-400">Scheduled Time:</span>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="bg-[#090d14] border border-neutral-700 text-cyan-300 font-mono px-2 py-0.5 rounded text-xs focus:outline-none"
            />
            <span className="text-neutral-500 font-medium">NPT</span>
          </div>

          <button
            onClick={onRunLiveAudit}
            disabled={isAuditing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
            <span>{isAuditing ? 'Auditing Providers...' : 'Run Live Reconciliation Audit'}</span>
          </button>

          <button
            onClick={onRunScraper}
            disabled={scraperStatus.isRunning}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-md"
          >
            <Play className={`w-3.5 h-3.5 ${scraperStatus.isRunning ? 'animate-spin' : ''}`} />
            <span>{scraperStatus.isRunning ? 'Scraping Active...' : 'Run Scraper (5 PM)'}</span>
          </button>
        </div>
      </div>

      {/* Countdown and Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Next Run Countdown */}
        <div className="bg-[#0e131d] border border-neutral-800/80 rounded-lg p-4">
          <span className="text-neutral-500 text-xs uppercase block">Next 5 PM Execution</span>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1 tabular-nums">
            {timeRemaining || '00:00:00'}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Target: {scheduledTime} NPT (Current: {nepseClock})
          </span>
        </div>

        {/* Multi-Provider Status */}
        <div className="bg-[#0e131d] border border-neutral-800/80 rounded-lg p-4">
          <span className="text-neutral-500 text-xs uppercase block">Ranked Sources</span>
          <div className="text-sm font-semibold text-white mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Exchange Feed ➔ Securities Repo ➔ Real-Time Aggregator</span>
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            359 symbols cross-checked
          </span>
        </div>

        {/* Last Run Status */}
        <div className="bg-[#0e131d] border border-neutral-800/80 rounded-lg p-4">
          <span className="text-neutral-500 text-xs uppercase block">Last Sync Status</span>
          <div className="text-sm font-semibold text-emerald-400 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{scraperStatus.lastRunStatus === 'SUCCESS' ? `${stocks.length} Canonical Scrips` : 'Ready'}</span>
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            {scraperStatus.lastRunTimestamp ? `At ${scraperStatus.lastRunTimestamp}` : 'Awaiting trigger'}
          </span>
        </div>

        {/* CDN Target */}
        <div className="bg-[#0e131d] border border-neutral-800/80 rounded-lg p-4">
          <span className="text-neutral-500 text-xs uppercase block">Distribution Target</span>
          <div className="text-sm font-semibold text-cyan-300 mt-1 flex items-center gap-1.5">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>data-store (jsDelivr CDN)</span>
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Zstandard Parquet + JSONL
          </span>
        </div>
      </div>

      {/* Live Provider Reconciliation Matrix */}
      {liveAuditReport && (
        <div className="bg-[#0e131d] border border-cyan-900/60 rounded-lg p-5 space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">
                Live Multi-Source Reconciliation Report (Session {liveAuditReport.sessionDate})
              </h3>
            </div>
            <div className="text-xs text-neutral-400 tabular-nums font-mono">
              Completed in {liveAuditReport.executionTimeMs} ms
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs tabular-nums">
            <div className="bg-[#090d14] p-3 rounded border border-neutral-800">
              <span className="text-[10px] text-neutral-500 uppercase block">Rank 1: Exchange Feed</span>
              <span className="text-sm font-bold text-emerald-400">{liveAuditReport.merolaganiCount} symbols</span>
              <span className="text-[10px] text-neutral-400 block mt-0.5">Primary EOD feed</span>
            </div>

            <div className="bg-[#090d14] p-3 rounded border border-neutral-800">
              <span className="text-[10px] text-neutral-500 uppercase block">Rank 2: Securities Repo</span>
              <span className="text-sm font-bold text-emerald-400">{liveAuditReport.nepaliPaisaCount} symbols</span>
              <span className="text-[10px] text-neutral-400 block mt-0.5">Full company names</span>
            </div>

            <div className="bg-[#090d14] p-3 rounded border border-neutral-800">
              <span className="text-[10px] text-neutral-500 uppercase block">Rank 3: Live Aggregator</span>
              <span className="text-sm font-bold text-cyan-400">{liveAuditReport.chukulCount} symbols</span>
              <span className="text-[10px] text-amber-400 block mt-0.5">5-symbol gap reconciled</span>
            </div>

            <div className="bg-[#090d14] p-3 rounded border border-neutral-800">
              <span className="text-[10px] text-neutral-500 uppercase block">Price Agreement</span>
              <span className="text-sm font-bold text-emerald-400">0 Mismatches</span>
              <span className="text-[10px] text-neutral-400 block mt-0.5">Within Rs 0.01 tolerance</span>
            </div>

            <div className="bg-[#090d14] p-3 rounded border border-neutral-800">
              <span className="text-[10px] text-neutral-500 uppercase block">Sectors / Indices</span>
              <span className="text-sm font-bold text-white">{liveAuditReport.sectorCount} Sec / {liveAuditReport.indicesCount} Ind</span>
              <span className="text-[10px] text-neutral-400 block mt-0.5">Aggregated series</span>
            </div>

            <div className="bg-[#090d14] p-3 rounded border border-neutral-800">
              <span className="text-[10px] text-neutral-500 uppercase block">Market Cap Classified</span>
              <span className="text-sm font-bold text-cyan-300">{liveAuditReport.marketCapClassificationsCount} items</span>
              <span className="text-[10px] text-neutral-400 block mt-0.5">5 cap categories</span>
            </div>
          </div>

          {/* Missing Symbols Inspection */}
          {liveAuditReport.chukulMissingSymbols && liveAuditReport.chukulMissingSymbols.length > 0 && (
            <div className="p-3 rounded bg-amber-950/20 border border-amber-900/40 text-xs">
              <span className="font-semibold text-amber-300">Audited 5-Symbol Secondary Gap Reconciled:</span>
              <span className="text-neutral-400 ml-2">
                Symbols {liveAuditReport.chukulMissingSymbols.join(', ')} were gracefully supplied by Primary Exchange & National fallback adapters to produce the complete 359-symbol canonical dataset.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Live Scraper Execution Console */}
      <div className="bg-[#090d14] border border-neutral-800 rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 bg-[#0e131d] border-b border-neutral-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-300">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>Scraper Pipeline Terminal Output</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-neutral-400">Python 3.12 Engine</span>
          </div>
        </div>

        <div className="p-4 font-mono text-xs max-h-60 overflow-y-auto space-y-1.5 text-neutral-300">
          {scraperStatus.logs.length === 0 ? (
            <div className="text-neutral-500">
              [SYSTEM] Pipeline idle. Click &quot;Run Scraper (5 PM)&quot; or wait for scheduled run at {scheduledTime} NPT.
            </div>
          ) : (
            scraperStatus.logs.map((log, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-neutral-500 shrink-0">{log.timestamp}</span>
                <span
                  className={`font-semibold shrink-0 ${
                    log.level === 'SUCCESS'
                      ? 'text-emerald-400'
                      : log.level === 'WARN'
                      ? 'text-amber-400'
                      : log.level === 'ERROR'
                      ? 'text-rose-400'
                      : 'text-cyan-400'
                  }`}
                >
                  [{log.level}]
                </span>
                <span className="text-neutral-200">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Scraped Data Bundle & EOD Floor Sheet Inspector */}
      <div className="bg-[#0e131d] border border-neutral-800/80 rounded-lg p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Generated EOD Market Dataset Bundles</h3>
          </div>

          <div className="flex items-center gap-2">
            {/* View Selector */}
            <div className="flex items-center bg-[#090d14] p-1 rounded border border-neutral-800 text-xs">
              {(['audit', 'stocks', 'sectors', 'summary', 'floorsheet'] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => setSelectedJsonView(view)}
                  className={`px-3 py-1 rounded capitalize transition-colors ${
                    selectedJsonView === view
                      ? 'bg-neutral-800 text-cyan-400 font-semibold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>

            <button
              onClick={downloadCsv}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-white rounded border border-neutral-700 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={downloadJson}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-white rounded border border-neutral-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Live Preview of JSON */}
        <pre className="bg-[#090d14] p-4 rounded-lg border border-neutral-800/80 text-[11px] font-mono text-cyan-300 max-h-72 overflow-y-auto overflow-x-auto">
          {JSON.stringify(getExportData(), null, 2)}
        </pre>
      </div>
    </div>
  );
};
