import { KalshiMarket, SafetyDetails, ScoredMarket } from './types';

export interface SafetyGates {
  minConsensus: number;    // e.g. 0.88 — dominant side must be ≥ this probability
  maxHoursToExpiry: number; // e.g. 48 — discard markets resolving further out
  maxSpreadCents: number;  // e.g. 2 — bid-ask spread ceiling in cents
  minVolume24h: number;    // e.g. 5000 — minimum 24h contract volume
}

export const DEFAULT_GATES: SafetyGates = {
  minConsensus:    0.88,
  maxHoursToExpiry: 48,
  maxSpreadCents:   2,
  minVolume24h:     5000,
};

// ---------------------------------------------------------------------------
// Hard-gate filter — all three must pass or market is rejected
// ---------------------------------------------------------------------------

interface GateResult {
  passed: boolean;
  failReason?: string;
  midPrice: number;
  spreadCents: number;
  hoursToExpiry: number;
  volume24h: number;
}

function applyGates(market: KalshiMarket, gates: SafetyGates): GateResult {
  const bid = market.yes_bid_dollars ?? 0;
  const ask = market.yes_ask_dollars ?? 0;

  if (bid <= 0 || ask <= 0 || ask < bid) {
    return { passed: false, failReason: 'no valid price', midPrice: 0, spreadCents: 0, hoursToExpiry: 0, volume24h: 0 };
  }

  const midPrice      = (bid + ask) / 2;
  const spreadCents   = Math.round((ask - bid) * 100);
  const dominantProb  = Math.max(midPrice, 1 - midPrice);
  const hoursToExpiry = calcHoursToClose(market.close_time);
  const volume24h     = (market.volume_24h_fp ?? 0) / 100;

  // Gate 1: Extreme consensus
  if (dominantProb < gates.minConsensus) {
    return { passed: false, failReason: `consensus ${(dominantProb * 100).toFixed(1)}% < ${(gates.minConsensus * 100).toFixed(0)}%`, midPrice, spreadCents, hoursToExpiry, volume24h };
  }

  // Gate 2: Time decay protection
  if (hoursToExpiry > gates.maxHoursToExpiry) {
    return { passed: false, failReason: `${hoursToExpiry.toFixed(0)}h until expiry > ${gates.maxHoursToExpiry}h limit`, midPrice, spreadCents, hoursToExpiry, volume24h };
  }

  // Gate 3: Liquidity validation
  if (spreadCents > gates.maxSpreadCents) {
    return { passed: false, failReason: `spread ${spreadCents}¢ > ${gates.maxSpreadCents}¢ limit`, midPrice, spreadCents, hoursToExpiry, volume24h };
  }
  if (volume24h < gates.minVolume24h) {
    return { passed: false, failReason: `24h volume ${volume24h.toFixed(0)} < ${gates.minVolume24h} limit`, midPrice, spreadCents, hoursToExpiry, volume24h };
  }

  return { passed: true, midPrice, spreadCents, hoursToExpiry, volume24h };
}

// ---------------------------------------------------------------------------
// Rank among markets that pass all gates
// ---------------------------------------------------------------------------

export function rankMarkets(
  markets: KalshiMarket[],
  gates: SafetyGates = DEFAULT_GATES,
): { ranked: ScoredMarket[]; stats: FilterStats } {
  const ranked: ScoredMarket[] = [];
  const stats: FilterStats = { total: markets.length, passedGates: 0, failedConsensus: 0, failedTime: 0, failedLiquidity: 0 };

  for (const m of markets) {
    const gate = applyGates(m, gates);

    if (!gate.passed) {
      if (gate.failReason?.startsWith('consensus')) stats.failedConsensus++;
      else if (gate.failReason?.includes('expiry')) stats.failedTime++;
      else stats.failedLiquidity++;
      continue;
    }

    stats.passedGates++;
    const details = buildSafetyDetails(m, gate);
    const safetyScore = calcScore(details);
    const recommendedPosition: 'YES' | 'NO' = gate.midPrice >= 0.5 ? 'YES' : 'NO';
    const recommendedEntry = recommendedPosition === 'YES'
      ? Math.round((m.yes_bid_dollars ?? 0) * 100)
      : Math.round((m.no_bid_dollars ?? 0) * 100);

    ranked.push({ ...m, safetyScore, safetyDetails: details, recommendedPosition, recommendedEntry });
  }

  // Sort: highest safety score first (among gate survivors)
  ranked.sort((a, b) => b.safetyScore - a.safetyScore);
  return { ranked, stats };
}

export interface FilterStats {
  total: number;
  passedGates: number;
  failedConsensus: number;
  failedTime: number;
  failedLiquidity: number;
}

// ---------------------------------------------------------------------------
// Safety score for ranking survivors (not used as a gate)
// ---------------------------------------------------------------------------

function buildSafetyDetails(m: KalshiMarket, gate: GateResult): SafetyDetails {
  const dominantProb = Math.max(gate.midPrice, 1 - gate.midPrice);

  // Probability score: how close to certainty (0.88→0, 1.0→1)
  const probabilityScore = (dominantProb - 0.88) / 0.12;

  // Liquidity score: log-scaled 24h volume
  const liquidityScore = Math.min(Math.log1p(gate.volume24h) / Math.log1p(50_000), 1);

  // Spread score: 0¢ = 1.0, 2¢ = 0.0 (linear within the allowed range)
  const spreadScore = Math.max(0, 1 - gate.spreadCents / 2);

  // Time score: closer expiry = higher score (0h = 1.0, 48h = 0.0)
  const timeScore = Math.max(0, 1 - gate.hoursToExpiry / 48);

  return {
    probabilityScore,
    liquidityScore,
    spreadScore,
    timeScore,
    midPrice: gate.midPrice,
    daysToClose: gate.hoursToExpiry / 24,
    spread: gate.spreadCents,
    rawVolume: (m.volume_fp ?? 0) / 100,
    rawOpenInterest: (m.open_interest_fp ?? 0) / 100,
  };
}

function calcScore(d: SafetyDetails): number {
  return (
    d.probabilityScore * 0.40 +
    d.liquidityScore   * 0.30 +
    d.spreadScore      * 0.20 +
    d.timeScore        * 0.10
  );
}

function calcHoursToClose(closeTime: string): number {
  const now = Date.now();
  const close = new Date(closeTime).getTime();
  return (close - now) / (1000 * 60 * 60);
}
