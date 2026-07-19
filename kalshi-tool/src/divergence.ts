import { KalshiClient } from './kalshi';
import { fetchPolymarketMarkets } from './polymarket';
import { topMatches } from './match';
import { confirmMatch } from './claude';
import { DivergenceRow, KalshiMarket, PolymarketMarket } from './types';

export interface DivergenceConfig {
  categories: string[];
  polyMinVol24h: number;
  minGapPoints: number;
  maxDaysToClose: number;
  maxMatchChecks: number;
  kalshiMinVol24h: number;
  onProgress?: (msg: string) => void;
}

export interface DivergenceResult {
  rows: DivergenceRow[];
  kalshiPoolSize: number;
  polyPoolSize: number;
  matchChecks: number;
}

export async function findDivergences(
  kalshi: KalshiClient,
  cfg: DivergenceConfig,
): Promise<DivergenceResult> {
  const log = cfg.onProgress ?? (() => {});

  log(`Fetching Kalshi markets in: ${cfg.categories.join(', ')}…`);
  const kalshiRaw = await kalshi.fetchMarketsByCategory(cfg.categories, { maxPages: 25 });
  const kalshiPool = buildKalshiPool(kalshiRaw, cfg.kalshiMinVol24h, cfg.maxDaysToClose);
  log(`  ${kalshiRaw.length} quoted → ${kalshiPool.length} comparable`);

  log('Fetching Polymarket markets…');
  const polyPool = await fetchPolymarketMarkets({ minVolume24h: cfg.polyMinVol24h });
  log(`  ${polyPool.length} liquid Polymarket markets`);

  const withCandidates = kalshiPool
    .map((k) => ({ k, candidates: topMatches(k.title, polyPool, 5, 0.15) }))
    .filter((x) => x.candidates.length > 0)
    .sort((a, b) => (b.candidates[0]?.score ?? 0) - (a.candidates[0]?.score ?? 0))
    .slice(0, cfg.maxMatchChecks);

  log(`${withCandidates.length} Kalshi markets have a plausible Polymarket twin (AI-checking)…`);

  const rows: DivergenceRow[] = [];
  for (let i = 0; i < withCandidates.length; i++) {
    const { k, candidates } = withCandidates[i];
    let verdict;
    try {
      verdict = await confirmMatch(k.title, candidates.map((c) => c.market.question));
    } catch {
      continue;
    }
    if (verdict.index < 0 || verdict.index >= candidates.length) continue;

    const poly = candidates[verdict.index].market;
    const polyYesAligned = verdict.inverted ? 1 - poly.yesPrice : poly.yesPrice;
    const gapPoints = Math.abs(k.yesProb - polyYesAligned) * 100;
    if (gapPoints < cfg.minGapPoints) continue;

    rows.push(makeRow(k, poly, polyYesAligned, gapPoints, verdict.confidence));
    if (i < withCandidates.length - 1) await sleep(250);
  }

  rows.sort((a, b) => b.rankScore - a.rankScore);
  return {
    rows,
    kalshiPoolSize: kalshiPool.length,
    polyPoolSize: polyPool.length,
    matchChecks: withCandidates.length,
  };
}

// ---------------------------------------------------------------------------

interface KalshiView {
  ticker: string;
  title: string;
  yesProb: number;
  vol24h: number;
  daysToClose: number;
}

function buildKalshiPool(markets: KalshiMarket[], minVol24h: number, maxDays: number): KalshiView[] {
  const now = Date.now();
  const pool: KalshiView[] = [];
  for (const m of markets) {
    const bid = Number(m.yes_bid_dollars);
    const ask = Number(m.yes_ask_dollars);
    if (!(bid > 0) || !(ask > 0) || ask < bid) continue;

    const yesProb = (bid + ask) / 2;
    if (yesProb < 0.03 || yesProb > 0.97) continue;

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
