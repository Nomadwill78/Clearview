import 'dotenv/config';
import { KalshiClient } from './kalshi';
import { fetchPolymarketMarkets } from './polymarket';
import { topMatches } from './match';
import { confirmMatch } from './claude';
import {
  buildDivergenceReport,
  saveJson,
  saveHtml,
  printConsole,
} from './divergenceReport';
import { DivergenceRow, KalshiMarket, PolymarketMarket } from './types';

async function main() {
  // ── Config ────────────────────────────────────────────────────────────────
  const email            = process.env.KALSHI_EMAIL;
  const password         = process.env.KALSHI_PASSWORD;
  const apiKeyId         = process.env.KALSHI_API_KEY_ID;
  const privateKeySource = process.env.KALSHI_PRIVATE_KEY_PATH ?? process.env.KALSHI_PRIVATE_KEY;

  const kalshiMinVol24h  = parseFloat(process.env.KALSHI_MIN_VOLUME_24H ?? '0');     // contracts
  const polyMinVol24h    = parseFloat(process.env.POLY_MIN_VOLUME_24H   ?? '150');   // USD
  const minGapPoints     = parseFloat(process.env.MIN_GAP_POINTS        ?? '5');
  const maxDaysToClose   = parseFloat(process.env.MAX_DAYS_TO_CLOSE     ?? '365');
  const maxMatchChecks   = parseInt(process.env.MAX_MATCH_CHECKS        ?? '80', 10);
  const topN             = parseInt(process.env.TOP_N_MARKETS           ?? '20', 10);
  const outputDir        = process.env.OUTPUT_DIR ?? './reports';
  const categories = (process.env.KALSHI_CATEGORIES
    ?? 'Politics,Elections,Entertainment,World,Social')
    .split(',').map((c) => c.trim()).filter(Boolean);

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('✗ ANTHROPIC_API_KEY is required — it powers the market matching. Add it to your .env.');
    process.exit(1);
  }

  // ── 1. Kalshi markets (politics/entertainment, by category) ─────────────────
  console.log(`🔍 Fetching Kalshi markets in: ${categories.join(', ')}…`);
  const kalshi = new KalshiClient(email, password, apiKeyId, privateKeySource);
  await kalshi.authenticate();
  const kalshiRaw = await kalshi.fetchMarketsByCategory(categories, { maxPages: 25 });
  const kalshiPool = buildKalshiPool(kalshiRaw, kalshiMinVol24h, maxDaysToClose);
  console.log(`   ${kalshiRaw.length} quoted markets → ${kalshiPool.length} comparable`);

  // ── 2. Polymarket markets ──────────────────────────────────────────────────
  console.log('🔍 Fetching Polymarket markets…');
  const polyPool = await fetchPolymarketMarkets({ minVolume24h: polyMinVol24h });
  console.log(`   ${polyPool.length} liquid Polymarket markets`);

  // ── 3. Prefilter by text similarity (cheap), then AI-confirm overlaps ───────
  console.log('🔗 Finding markets that describe the same event…');
  const withCandidates = kalshiPool
    .map((k) => ({ k, candidates: topMatches(k.title, polyPool, 5, 0.15) }))
    .filter((x) => x.candidates.length > 0)
    // Prioritise the strongest textual overlaps so the AI-check budget is well spent
    .sort((a, b) => (b.candidates[0]?.score ?? 0) - (a.candidates[0]?.score ?? 0))
    .slice(0, maxMatchChecks);

  console.log(`   ${withCandidates.length} Kalshi markets have a plausible Polymarket twin (AI-checking each)…`);

  const rows: DivergenceRow[] = [];
  for (let i = 0; i < withCandidates.length; i++) {
    const { k, candidates } = withCandidates[i];
    process.stdout.write(`   [${i + 1}/${withCandidates.length}] ${k.ticker}… `);

    let verdict;
    try {
      verdict = await confirmMatch(k.title, candidates.map((c) => c.market.question));
    } catch {
      console.log('✗ (AI error)');
      continue;
    }

    if (verdict.index < 0 || verdict.index >= candidates.length) {
      console.log('no match');
      continue;
    }

    const poly = candidates[verdict.index].market;
    const polyYesAligned = verdict.inverted ? 1 - poly.yesPrice : poly.yesPrice;
    const gapPoints = Math.abs(k.yesProb - polyYesAligned) * 100;

    if (gapPoints < minGapPoints) {
      console.log(`agree (${gapPoints.toFixed(1)}pt)`);
      continue;
    }

    console.log(`✓ ${gapPoints.toFixed(1)}pt gap`);
    rows.push(makeRow(k, poly, polyYesAligned, gapPoints, verdict.confidence));

    if (i < withCandidates.length - 1) await sleep(250);
  }

  // ── 4. Rank & report ────────────────────────────────────────────────────────
  rows.sort((a, b) => b.rankScore - a.rankScore);
  const top = rows.slice(0, topN);

  const report = buildDivergenceReport(top, {
    kalshiPoolSize: kalshiPool.length,
    polyPoolSize: polyPool.length,
    matchChecks: withCandidates.length,
  });

  printConsole(report);
  const jsonPath = saveJson(report, outputDir);
  const htmlPath = saveHtml(report, outputDir);
  console.log(`💾 JSON saved to: ${jsonPath}`);
  console.log(`🌐 Open this in your browser:\n   ${htmlPath}\n`);
}

// ---------------------------------------------------------------------------

interface KalshiView {
  ticker: string;
  title: string;
  yesProb: number;
  vol24h: number;
  daysToClose: number;
}

function buildKalshiPool(
  markets: KalshiMarket[],
  minVol24h: number,
  maxDays: number,
): KalshiView[] {
  const now = Date.now();
  const pool: KalshiView[] = [];

  for (const m of markets) {
    // Kalshi returns prices as strings — coerce explicitly.
    const bid = Number(m.yes_bid_dollars);
    const ask = Number(m.yes_ask_dollars);
    if (!(bid > 0) || !(ask > 0) || ask < bid) continue;

    const yesProb = (bid + ask) / 2;
    if (yesProb < 0.03 || yesProb > 0.97) continue; // skip near-resolved

    const vol24h = (Number(m.volume_24h_fp) || 0) / 100;
    if (vol24h < minVol24h) continue;

    const daysToClose = (new Date(m.close_time).getTime() - now) / (1000 * 60 * 60 * 24);
    if (daysToClose <= 0 || daysToClose > maxDays) continue;

    pool.push({ ticker: m.ticker, title: m.title, yesProb, vol24h, daysToClose });
  }

  return pool;
}

function makeRow(
  k: KalshiView,
  poly: PolymarketMarket,
  polyYesAligned: number,
  gapPoints: number,
  confidence: 'high' | 'medium' | 'low',
): DivergenceRow {
  const confWeight = confidence === 'high' ? 1.0 : confidence === 'medium' ? 0.6 : 0.3;
  // Reward big gaps on liquid, well-matched, soon-resolving markets
  const liqWeight = Math.min(Math.log1p(Math.min(k.vol24h, poly.volume24h)) / Math.log1p(10_000), 1);
  const timeWeight = Math.max(0.3, 1 - k.daysToClose / 180);
  const rankScore = gapPoints * confWeight * (0.5 + 0.5 * liqWeight) * timeWeight;

  return {
    kalshiTicker: k.ticker,
    kalshiTitle: k.title,
    kalshiYes: k.yesProb,
    kalshiVol24h: k.vol24h,
    polyQuestion: poly.question,
    polyYes: polyYesAligned,
    polyVol24h: poly.volume24h,
    polyUrl: poly.url,
    gapPoints,
    richerSide: k.yesProb >= polyYesAligned ? 'KALSHI' : 'POLYMARKET',
    confidence,
    daysToClose: k.daysToClose,
    rankScore,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((err) => {
  console.error('Fatal error:', err.message ?? err);
  process.exit(1);
});
