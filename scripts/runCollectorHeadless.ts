/**
 * Headless CLI Collector & GitHub Actions Runner
 * Executes Ranked Multi-Source Data Collection for Nepal Stock Exchange (NEPSE)
 */

import fs from 'fs';
import path from 'path';
import {
  runLiveCollectorAudit,
  fetchLiveHistoricalBars,
  backfillHistoricalData,
  getCachedMarketCapCategories,
} from '../src/server/nepseCollector.ts';
import { getNepalDateString, getNepalTimeString, getNepalDateTimeString } from '../src/utils/nepalTime.ts';

async function main() {
  console.log('='.repeat(70));
  console.log(`[NEPSE EOD SCRAPER] Commencing Headless Run at ${getNepalDateTimeString()}`);
  console.log('='.repeat(70));

  const startTime = Date.now();
  const dataDir = path.resolve(process.cwd(), 'data');
  const eodDir = path.join(dataDir, 'eod');
  const logsDir = path.join(dataDir, 'logs');
  const publicDir = path.resolve(process.cwd(), 'public');
  const publicDataDir = path.join(publicDir, 'data');

  // Ensure directories exist
  fs.mkdirSync(eodDir, { recursive: true });
  fs.mkdirSync(logsDir, { recursive: true });
  fs.mkdirSync(publicDataDir, { recursive: true });

  console.log('[STEP 1/3] Fetching and reconciling quotes from ranked providers...');
  const { report, stocks, sectors, marketSummary } = await runLiveCollectorAudit();

  console.log(`✓ Reconciled ${report.canonicalTotal} canonical instruments.`);
  console.log(`✓ Merolagani: ${report.merolaganiCount} rows | Nepali Paisa: ${report.nepaliPaisaCount} rows | Chukul: ${report.chukulCount} rows.`);
  console.log(`✓ Zero price mismatches (> Rs 0.01 tolerance): ${report.mismatchCountTolerance001}`);
  console.log(`✓ Total Turnover: NPR ${marketSummary.totalTurnover.toLocaleString()}`);

  const sessionDate = report.sessionDate || getNepalDateString();

  console.log('\n[STEP 2/3] Writing Canonical Artifacts (CSV, JSONL & Public JSON)...');

  // 1. Canonical EOD CSV
  const csvHeaders = [
    'symbol',
    'name',
    'sector',
    'ltp',
    'change',
    'pChange',
    'open',
    'high',
    'low',
    'volume',
    'turnover',
    'high52',
    'low52',
    'pe',
    'eps',
    'marketCapBillion',
    'isIndex',
  ];

  const csvRows = stocks.map((s) => [
    s.symbol,
    `"${(s.name || '').replace(/"/g, '""')}"`,
    `"${s.sector}"`,
    s.ltp,
    s.change,
    s.pChange,
    s.open,
    s.high,
    s.low,
    s.volume,
    s.turnover,
    s.high52,
    s.low52,
    s.pe,
    s.eps,
    s.marketCapBillion,
    s.isIndex ? 'true' : 'false',
  ]);

  const csvContent = [csvHeaders.join(','), ...csvRows.map((r) => r.join(','))].join('\n');
  const sessionCsvPath = path.join(eodDir, `nepse_canonical_${sessionDate}.csv`);
  const latestCsvPath = path.join(eodDir, 'nepse_canonical_latest.csv');

  fs.writeFileSync(sessionCsvPath, csvContent, 'utf-8');
  fs.writeFileSync(latestCsvPath, csvContent, 'utf-8');
  console.log(`✓ Saved ${sessionCsvPath}`);

  // 2. Canonical JSONL Partitions
  const jsonlContent = stocks.map((s) => JSON.stringify(s)).join('\n');
  const latestJsonlPath = path.join(eodDir, 'nepse_canonical_latest.jsonl');
  fs.writeFileSync(latestJsonlPath, jsonlContent, 'utf-8');
  console.log(`✓ Saved ${latestJsonlPath}`);

  // 3. Sector CSV
  const sectorHeaders = ['sector', 'indexValue', 'change', 'pChange', 'turnover', 'scripCount', 'advancers', 'decliners', 'unchanged'];
  const sectorRows = sectors.map((sec) => [
    `"${sec.sector}"`,
    sec.indexValue,
    sec.change,
    sec.pChange,
    sec.turnover,
    sec.scripCount,
    sec.advancers,
    sec.decliners,
    sec.unchanged,
  ]);
  const sectorCsvContent = [sectorHeaders.join(','), ...sectorRows.map((r) => r.join(','))].join('\n');
  fs.writeFileSync(path.join(eodDir, 'nepse_sectors_latest.csv'), sectorCsvContent, 'utf-8');

  // 4. Audit Manifest JSON
  const manifest = {
    generatedAt: getNepalDateTimeString(),
    sessionDate,
    executionTimeMs: Date.now() - startTime,
    report,
    marketSummary,
    totalStocks: stocks.length,
    totalSectors: sectors.length,
  };
  fs.writeFileSync(path.join(eodDir, 'audit_report_latest.json'), JSON.stringify(manifest, null, 2), 'utf-8');
  fs.writeFileSync(path.join(publicDataDir, 'audit_report_latest.json'), JSON.stringify(manifest, null, 2), 'utf-8');

  // 5. Public Static JSON Feeds (Used directly by GitHub Pages and static deployments)
  const canonicalJson = JSON.stringify({ stocks }, null, 2);
  fs.writeFileSync(path.join(publicDataDir, 'nepse_canonical_latest.json'), canonicalJson, 'utf-8');
  fs.writeFileSync(path.join(eodDir, 'nepse_canonical_latest.json'), canonicalJson, 'utf-8');

  const sectorsJson = JSON.stringify({ sectors }, null, 2);
  fs.writeFileSync(path.join(publicDataDir, 'nepse_sectors_latest.json'), sectorsJson, 'utf-8');
  fs.writeFileSync(path.join(eodDir, 'nepse_sectors_latest.json'), sectorsJson, 'utf-8');

  const summaryJson = JSON.stringify({ summary: marketSummary }, null, 2);
  fs.writeFileSync(path.join(publicDataDir, 'nepse_summary_latest.json'), summaryJson, 'utf-8');
  fs.writeFileSync(path.join(eodDir, 'nepse_summary_latest.json'), summaryJson, 'utf-8');

  const categoriesJson = JSON.stringify({ categories: getCachedMarketCapCategories() }, null, 2);
  fs.writeFileSync(path.join(publicDataDir, 'nepse_categories_latest.json'), categoriesJson, 'utf-8');
  fs.writeFileSync(path.join(eodDir, 'nepse_categories_latest.json'), categoriesJson, 'utf-8');
  console.log(`✓ Synchronized public static JSON feeds in ${publicDataDir}`);

  console.log('\n[STEP 3/3] Backfilling Benchmark History...');
  try {
    const nepseBars = await fetchLiveHistoricalBars('NEPSE', true);
    console.log(`✓ NEPSE Index benchmark bars: ${nepseBars.length} daily sessions (earliest: ${nepseBars[0]?.time}).`);
    if (nepseBars && nepseBars.length > 0) {
      fs.writeFileSync(
        path.join(publicDataDir, 'nepse_history_benchmark.json'),
        JSON.stringify({ symbol: 'NEPSE', adjusted: true, count: nepseBars.length, bars: nepseBars }, null, 2),
        'utf-8'
      );
      console.log(`✓ Saved NEPSE benchmark history to ${publicDataDir}/nepse_history_benchmark.json`);
    }
  } catch (e: any) {
    console.warn('NEPSE history warning:', e.message);
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('='.repeat(70));
  console.log(`[SUCCESS] EOD Scrape Pipeline completed in ${durationSec}s at ${getNepalTimeString()}`);
  console.log('='.repeat(70));
}

main().catch((err) => {
  console.error('[FATAL] Pipeline failed:', err);
  process.exit(1);
});
