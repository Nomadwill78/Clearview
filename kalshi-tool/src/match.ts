import { PolymarketMarket } from './types';

const STOPWORDS = new Set([
  'will', 'the', 'a', 'an', 'to', 'of', 'in', 'on', 'at', 'be', 'is', 'by',
  'for', 'and', 'or', 'before', 'after', 'this', 'that', 'than', 'with', 'it',
  'from', 'as', 'are', 'was', 'were', 'market', 'resolve', 'above', 'below',
  'end', 'close', 'closes', 'reach', 'hit', 'during', 'per', 'not',
]);

export function tokenize(s: string): Set<string> {
  return new Set(
    s.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1 && !STOPWORDS.has(w)),
  );
}

// Jaccard similarity over content-word sets (0–1)
export function similarity(a: string, b: string): number {
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.size === 0 || tb.size === 0) return 0;

  let intersection = 0;
  for (const t of ta) if (tb.has(t)) intersection++;

  const union = ta.size + tb.size - intersection;
  return intersection / union;
}

export interface RankedCandidate {
  market: PolymarketMarket;
  score: number;
}

export function topMatches(
  kalshiTitle: string,
  polys: PolymarketMarket[],
  n = 5,
  floor = 0.12,
): RankedCandidate[] {
  return polys
    .map((market) => ({ market, score: similarity(kalshiTitle, market.question) }))
    .filter((x) => x.score >= floor)
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}
