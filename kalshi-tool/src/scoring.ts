import { KalshiMarket, SafetyDetails, ScoredMarket } from './types';

const WEIGHTS = {
  probability: 0.40,
  liquidity:   0.30,
  spread:      0.20,
  time:        0.10,
} as const;

const MAX_VOLUME_REFERENCE  = 5_000;  // contracts at which liquidity saturates
const OPTIMAL_DAYS_MAX      = 30;
const MAX_DAYS              = 365;

export function scoreMarket(market: KalshiMarket): ScoredMarket | null {
  const midPrice = calcMidPrice(market);
  if (midPrice === null) return null;

  const daysToClose = calcDaysToClose(market.close_time);
  if (daysToClose < 0) return null;

  const spread = calcSpread(market);
  const details = buildSafetyDetails(market, midPrice, daysToClose, spread);
  const safetyScore = calcWeightedScore(details);
  const recommendedPosition = midPrice >= 0.5 ? 'YES' : 'NO';

  // Entry price in cents (display convention) — convert from dollars
  const recommendedEntry = recommendedPosition === 'YES'
    ? Math.round((market.yes_bid_dollars ?? 0) * 100)
    : Math.round((market.no_bid_dollars ?? 0) * 100);

  return {
    ...market,
    safetyScore,
    safetyDetails: details,
    recommendedPosition,
    recommendedEntry,
  };
}

export function rankMarkets(
  markets: KalshiMarket[],
  minProbabilitySkew = 0.65,
): ScoredMarket[] {
  const scored: ScoredMarket[] = [];

  for (const m of markets) {
    const result = scoreMarket(m);
    if (!result) continue;

    const { midPrice } = result.safetyDetails;
    const dominantProb = Math.max(midPrice, 1 - midPrice);
    if (dominantProb < minProbabilitySkew) continue;

    scored.push(result);
  }

  return scored.sort((a, b) => b.safetyScore - a.safetyScore);
}

// ---------------------------------------------------------------------------

function calcMidPrice(m: KalshiMarket): number | null {
  // Prices are already in 0–1 dollar range
  const bid = m.yes_bid_dollars;
  const ask = m.yes_ask_dollars;
  if (bid == null || ask == null || bid <= 0 || ask <= 0) return null;
  if (ask < bid) return null;
  return (bid + ask) / 2;
}

function calcDaysToClose(closeTime: string): number {
  const now = Date.now();
  const close = new Date(closeTime).getTime();
  return (close - now) / (1000 * 60 * 60 * 24);
}

function calcSpread(m: KalshiMarket): number {
  // Spread in cents for display
  if (m.yes_ask_dollars == null || m.yes_bid_dollars == null) return 100;
  return Math.round((m.yes_ask_dollars - m.yes_bid_dollars) * 100);
}

function buildSafetyDetails(
  market: KalshiMarket,
  midPrice: number,
  daysToClose: number,
  spread: number,
): SafetyDetails {
  const probabilityScore = Math.abs(midPrice - 0.5) / 0.5;

  const volumeContracts = (market.volume_fp ?? 0) / 100;
  const oiContracts     = (market.open_interest_fp ?? 0) / 100;

  const volumeNorm = Math.min(
    Math.log1p(volumeContracts) / Math.log1p(MAX_VOLUME_REFERENCE),
    1,
  );
  const oiNorm = Math.min(
    Math.log1p(oiContracts) / Math.log1p(MAX_VOLUME_REFERENCE),
    1,
  );
  const liquidityScore = volumeNorm * 0.7 + oiNorm * 0.3;

  // Penalise spreads wider than 10¢
  const spreadScore = Math.max(0, 1 - spread / 10);

  let timeScore: number;
  if (daysToClose <= 0) {
    timeScore = 0;
  } else if (daysToClose <= OPTIMAL_DAYS_MAX) {
    timeScore = 0.5 + (daysToClose / OPTIMAL_DAYS_MAX) * 0.5;
    timeScore = Math.min(timeScore, 1.0);
  } else {
    const excess = daysToClose - OPTIMAL_DAYS_MAX;
    timeScore = Math.max(0, 1 - excess / (MAX_DAYS - OPTIMAL_DAYS_MAX));
  }

  return {
    probabilityScore,
    liquidityScore,
    spreadScore,
    timeScore,
    midPrice,
    daysToClose,
    spread,
    rawVolume: volumeContracts,
    rawOpenInterest: oiContracts,
  };
}

function calcWeightedScore(d: SafetyDetails): number {
  return (
    d.probabilityScore * WEIGHTS.probability +
    d.liquidityScore   * WEIGHTS.liquidity +
    d.spreadScore      * WEIGHTS.spread +
    d.timeScore        * WEIGHTS.time
  );
}
