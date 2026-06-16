import { KalshiMarket, SafetyDetails, ScoredMarket } from './types';

// Weights for each safety dimension (must sum to 1.0)
const WEIGHTS = {
  probability: 0.40,
  liquidity:   0.30,
  spread:      0.20,
  time:        0.10,
} as const;

// Scoring parameters
const MAX_VOLUME_REFERENCE  = 500_000;  // volume at which liquidity score saturates to 1.0
const OPTIMAL_DAYS_MIN      = 1;        // prefer markets resolving in this range
const OPTIMAL_DAYS_MAX      = 30;
const MAX_DAYS              = 365;

export function scoreMarket(market: KalshiMarket): ScoredMarket | null {
  const midPrice = calcMidPrice(market);

  // Skip markets without valid pricing
  if (midPrice === null) return null;

  const daysToClose = calcDaysToClose(market.close_time);
  if (daysToClose < 0) return null; // Already closed

  const spread = calcSpread(market);
  const details = buildSafetyDetails(market, midPrice, daysToClose, spread);
  const safetyScore = calcWeightedScore(details);
  const recommendedPosition = midPrice >= 0.5 ? 'YES' : 'NO';

  // Entry price in cents — bid of the more-likely side
  const recommendedEntry =
    recommendedPosition === 'YES' ? market.yes_bid : market.no_bid;

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
    // Only keep markets where the dominant outcome has ≥ minProbabilitySkew confidence
    const dominantProb = Math.max(midPrice, 1 - midPrice);
    if (dominantProb < minProbabilitySkew) continue;

    scored.push(result);
  }

  return scored.sort((a, b) => b.safetyScore - a.safetyScore);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function calcMidPrice(m: KalshiMarket): number | null {
  // Kalshi prices are in cents (0–100); convert to probability (0–1)
  const bid = m.yes_bid;
  const ask = m.yes_ask;
  if (bid == null || ask == null || bid <= 0 || ask <= 0) return null;
  if (ask < bid) return null;
  return ((bid + ask) / 2) / 100;
}

function calcDaysToClose(closeTime: string): number {
  const now = Date.now();
  const close = new Date(closeTime).getTime();
  return (close - now) / (1000 * 60 * 60 * 24);
}

function calcSpread(m: KalshiMarket): number {
  // Spread in cents
  if (!m.yes_ask || !m.yes_bid) return 100;
  return m.yes_ask - m.yes_bid;
}

function buildSafetyDetails(
  market: KalshiMarket,
  midPrice: number,
  daysToClose: number,
  spread: number,
): SafetyDetails {
  // 1. Probability score — distance from 50/50. 1.0 = certain, 0 = coin flip.
  const probabilityScore = Math.abs(midPrice - 0.5) / 0.5;

  // 2. Liquidity score — log-scaled volume; saturates at MAX_VOLUME_REFERENCE.
  const volumeNorm = Math.min(
    Math.log1p(market.volume) / Math.log1p(MAX_VOLUME_REFERENCE),
    1,
  );
  const oiNorm = Math.min(
    Math.log1p(market.open_interest) / Math.log1p(MAX_VOLUME_REFERENCE),
    1,
  );
  const liquidityScore = (volumeNorm * 0.7 + oiNorm * 0.3);

  // 3. Spread score — tighter bid-ask = more reliable price. Max spread = 100¢.
  const spreadScore = Math.max(0, 1 - spread / 30); // penalise >30¢ spreads heavily

  // 4. Time score — prefer markets resolving in 1–30 days.
  //    - Very short (<1 day): fine but can be noisy
  //    - 1–30 days: sweet spot
  //    - >30 days: more time for surprises
  let timeScore: number;
  if (daysToClose <= 0) {
    timeScore = 0;
  } else if (daysToClose <= OPTIMAL_DAYS_MAX) {
    // Linear ramp: 0 days → 0.5, OPTIMAL_DAYS_MAX → 1.0
    timeScore = 0.5 + (daysToClose / OPTIMAL_DAYS_MAX) * 0.5;
    timeScore = Math.min(timeScore, 1.0);
  } else {
    // Decay beyond 30 days
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
    rawVolume: market.volume,
    rawOpenInterest: market.open_interest,
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
