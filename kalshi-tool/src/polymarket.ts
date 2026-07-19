import { PolymarketMarket } from './types';

const GAMMA_URL = 'https://gamma-api.polymarket.com/markets';

export async function fetchPolymarketMarkets(options: {
  maxPages?: number;
  pageSize?: number;
  minVolume24h?: number;
} = {}): Promise<PolymarketMarket[]> {
  const { maxPages = 6, pageSize = 500, minVolume24h = 0 } = options;
  const out: PolymarketMarket[] = [];

  for (let page = 0; page < maxPages; page++) {
    const offset = page * pageSize;
    const url = `${GAMMA_URL}?active=true&closed=false&limit=${pageSize}&offset=${offset}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Polymarket fetch failed (${res.status}): ${await res.text()}`);
    }

    const arr = (await res.json()) as unknown[];
    if (!Array.isArray(arr) || arr.length === 0) break;

    for (const raw of arr) {
      const m = normalize(raw as Record<string, unknown>);
      if (m && m.volume24h >= minVolume24h) out.push(m);
    }

    if (arr.length < pageSize) break;
    await sleep(150);
  }

  return out;
}

// Polymarket returns `outcomes` and `outcomePrices` as JSON-encoded strings.
// Only keep clean binary Yes/No markets with a valid, non-degenerate price.
function normalize(m: Record<string, unknown>): PolymarketMarket | null {
  let outcomes: string[];
  let prices: string[];
  try {
    outcomes = JSON.parse(String(m['outcomes'] ?? '[]'));
    prices = JSON.parse(String(m['outcomePrices'] ?? '[]'));
  } catch {
    return null;
  }

  if (!Array.isArray(outcomes) || outcomes.length !== 2) return null;

  const lower = outcomes.map((o) => String(o).toLowerCase());
  const yesIdx = lower.indexOf('yes');
  if (yesIdx === -1 || lower.indexOf('no') === -1) return null;

  const yesPrice = parseFloat(prices[yesIdx]);
  if (!isFinite(yesPrice) || yesPrice <= 0 || yesPrice >= 1) return null;

  const slug = String(m['slug'] ?? '');

  return {
    question: String(m['question'] ?? ''),
    yesPrice,
    volume24h: Number(m['volume24hr'] ?? 0),
    liquidity: Number(m['liquidityNum'] ?? m['liquidity'] ?? 0),
    endDate: String(m['endDate'] ?? m['endDateIso'] ?? ''),
    spreadCents: Math.round(Number(m['spread'] ?? 0) * 100),
    slug,
    url: slug ? `https://polymarket.com/market/${slug}` : 'https://polymarket.com',
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
