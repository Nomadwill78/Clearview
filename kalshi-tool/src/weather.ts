import { KalshiClient } from './kalshi';
import { getEnsembleHighs } from './openmeteo';

// ── Station map ──────────────────────────────────────────────────────────────
export interface Station {
  series: string;
  city: string;
  lat: number;
  lon: number;
}

export const STATIONS: Station[] = [
  { series: 'KXHIGHNY',   city: 'New York City (Central Park)', lat: 40.7789, lon: -73.9692 },
  { series: 'KXHIGHCHI',  city: 'Chicago (Midway)',             lat: 41.7860, lon: -87.7524 },
  { series: 'KXHIGHMIA',  city: 'Miami Intl',                   lat: 25.7932, lon: -80.2906 },
  { series: 'KXHIGHLAX',  city: 'Los Angeles (LAX)',            lat: 33.9416, lon: -118.4085 },
  { series: 'KXHIGHAUS',  city: 'Austin (Camp Mabry)',          lat: 30.3210, lon: -97.7594 },
  { series: 'KXHIGHDEN',  city: 'Denver Intl',                  lat: 39.8561, lon: -104.6737 },
  { series: 'KXHIGHPHIL', city: 'Philadelphia Intl',            lat: 39.8719, lon: -75.2411 },
];

// ── Market bound parsing (pure) ──────────────────────────────────────────────
export type Bound =
  | { kind: 'bin'; low: number; high: number }
  | { kind: 'above'; threshold: number }
  | { kind: 'below'; threshold: number };

export function parseBound(subTitle: string): Bound | null {
  const s = (subTitle ?? '').toLowerCase();
  let m: RegExpMatchArray | null;
  if ((m = s.match(/(\d+)\s*°?\s*to\s*(\d+)/))) {
    return { kind: 'bin', low: Number(m[1]), high: Number(m[2]) };
  }
  if ((m = s.match(/(\d+)\s*°?\s*or\s*above/))) {
    return { kind: 'above', threshold: Number(m[1]) };
  }
  if ((m = s.match(/(\d+)\s*°?\s*or\s*below/))) {
    return { kind: 'below', threshold: Number(m[1]) };
  }
  return null;
}

// Probability a bound resolves YES, from the ensemble members. Each member is
// smoothed by a small kernel (kernelSigma °F) to account for member discreteness
// and station/rounding noise. The result is the average over all members.
export function ensembleYesProb(bound: Bound, members: number[], kernelSigma: number): number {
  if (members.length === 0) return 0;
  const cdf = (x: number, mu: number) => normalCdf((x - mu) / kernelSigma);
  let sum = 0;
  for (const mi of members) {
    switch (bound.kind) {
      case 'bin':   sum += cdf(bound.high + 0.5, mi) - cdf(bound.low - 0.5, mi); break;
      case 'above': sum += 1 - cdf(bound.threshold - 0.5, mi); break;
      case 'below': sum += cdf(bound.threshold + 0.5, mi); break;
    }
  }
  return clamp01(sum / members.length);
}

// ── Ticker date parsing (pure) ───────────────────────────────────────────────
const MONTHS: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
};

export function parseTickerDate(ticker: string): string | null {
  const tok = ticker.split('-')[1];
  const m = tok?.match(/^(\d{2})([A-Z]{3})(\d{2})$/);
  if (!m) return null;
  const month = MONTHS[m[2]];
  if (!month) return null;
  return `20${m[1]}-${String(month).padStart(2, '0')}-${m[3]}`;
}

// ── Edge computation ─────────────────────────────────────────────────────────
export interface WeatherEdge {
  city: string;
  date: string;
  ticker: string;
  title: string;
  boundLabel: string;
  ensembleMedian: number;
  ensembleMin: number;
  ensembleMax: number;
  memberCount: number;
  marketProb: number;
  modelProb: number;
  side: 'YES' | 'NO';
  edge: number;
  entryPrice: number;
  stakeUsd: number;
  availableContracts: number;
  confidence: 'high' | 'medium' | 'low';   // from ensemble agreement (spread)
}

export interface WeatherConfig {
  kernelSigma: number;
  minEdge: number;
  bankrollUsd: number;
  fractionalKelly: number;
  maxFractionPerTrade: number;
  minContracts: number;
  includeToday: boolean;
  cities?: string[];
}

export interface WeatherRunResult {
  edges: WeatherEdge[];
  citiesScanned: string[];
  marketsScored: number;
  forecastErrors: string[];
}

export async function findWeatherEdges(
  kalshi: KalshiClient,
  cfg: WeatherConfig,
): Promise<WeatherRunResult> {
  const stations = cfg.cities?.length
    ? STATIONS.filter((s) => cfg.cities!.includes(s.series))
    : STATIONS;

  const edges: WeatherEdge[] = [];
  const forecastErrors: string[] = [];
  const citiesScanned: string[] = [];
  let marketsScored = 0;
  const todayStr = localDateString(new Date());

  for (const station of stations) {
    let ensemble;
    try {
      ensemble = await getEnsembleHighs(station.lat, station.lon);
    } catch (e: any) {
      forecastErrors.push(`${station.city}: ${e.message}`);
      continue;
    }
    citiesScanned.push(station.city);

    let markets: any[] = [];
    try {
      const data = await kalshi.apiGet('markets', {
        series_ticker: station.series,
        status: 'open',
        limit: '1000',
      });
      markets = data.markets ?? [];
    } catch (e: any) {
      forecastErrors.push(`${station.city} markets: ${e.message}`);
      continue;
    }

    for (const m of markets) {
      const date = parseTickerDate(m.ticker);
      if (!date) continue;
      if (!cfg.includeToday && date <= todayStr) continue;

      const day = ensemble.get(date);
      if (!day) continue;

      const bound = parseBound(m.yes_sub_title);
      if (!bound) continue;

      const quote = getQuote(m);
      if (!quote) continue;

      marketsScored++;
      const modelProb = ensembleYesProb(bound, day.members, cfg.kernelSigma);

      const decision = evaluate(quote, modelProb, cfg);
      if (!decision || decision.net < cfg.minEdge) continue;
      if (decision.availableContracts < cfg.minContracts) continue;

      const spread = day.max - day.min;
      const confidence: 'high' | 'medium' | 'low' =
        spread <= 5 ? 'high' : spread <= 10 ? 'medium' : 'low';

      edges.push({
        city: station.city,
        date,
        ticker: m.ticker,
        title: m.title,
        boundLabel: m.yes_sub_title,
        ensembleMedian: day.median,
        ensembleMin: day.min,
        ensembleMax: day.max,
        memberCount: day.members.length,
        marketProb: decision.marketProb,
        modelProb,
        side: decision.side,
        edge: decision.net,
        entryPrice: decision.entryPrice,
        stakeUsd: decision.stakeUsd,
        availableContracts: decision.availableContracts,
        confidence,
      });
    }
  }

  edges.sort((a, b) => b.edge - a.edge);
  return { edges, citiesScanned, marketsScored, forecastErrors };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function num(x: any): number {
  const n = Number(x);
  return Number.isFinite(n) ? n : NaN;
}
function isPrice(x: number): boolean {
  return Number.isFinite(x) && x > 0 && x < 1;
}

interface Quote {
  yesAsk: number;
  noAsk: number;
  yesAskSize: number;
  noAskSize: number;
  marketProbYes: number;
}

function getQuote(m: any): Quote | null {
  const yesBid = num(m.yes_bid_dollars);
  const yesAsk = num(m.yes_ask_dollars);
  const noAsk = num(m.no_ask_dollars);
  const last = num(m.last_price_dollars);

  if (!isPrice(yesAsk) && !isPrice(noAsk)) return null;

  let marketProbYes: number;
  if (isPrice(yesBid) && isPrice(yesAsk)) marketProbYes = (yesBid + yesAsk) / 2;
  else if (isPrice(yesAsk)) marketProbYes = yesAsk;
  else if (isPrice(noAsk)) marketProbYes = 1 - noAsk;
  else if (isPrice(last)) marketProbYes = last;
  else return null;

  return {
    yesAsk,
    noAsk,
    yesAskSize: Math.round((num(m.yes_ask_size_fp) || 0) / 100),
    noAskSize: Math.round((num(m.no_ask_size_fp) || 0) / 100),
    marketProbYes,
  };
}

function evaluate(
  q: Quote,
  modelProb: number,
  cfg: WeatherConfig,
): { side: 'YES' | 'NO'; net: number; entryPrice: number; stakeUsd: number; marketProb: number; availableContracts: number } | null {
  const options: { side: 'YES' | 'NO'; ask: number; win: number; size: number }[] = [];
  if (isPrice(q.yesAsk)) options.push({ side: 'YES', ask: q.yesAsk, win: modelProb, size: q.yesAskSize });
  if (isPrice(q.noAsk)) options.push({ side: 'NO', ask: q.noAsk, win: 1 - modelProb, size: q.noAskSize });

  let best: { side: 'YES' | 'NO'; net: number; ask: number; win: number; size: number } | null = null;
  for (const o of options) {
    const fee = 0.07 * o.ask * (1 - o.ask);
    const net = o.win - o.ask - fee;
    if (!best || net > best.net) best = { side: o.side, net, ask: o.ask, win: o.win, size: o.size };
  }
  if (!best) return null;

  const kelly = kellyStake(best.ask, best.win, cfg);
  const fillableUsd = best.size * best.ask;
  const stakeUsd = Math.round(Math.min(kelly, fillableUsd) * 100) / 100;

  return {
    side: best.side,
    net: best.net,
    entryPrice: Math.round(best.ask * 100),
    stakeUsd,
    marketProb: q.marketProbYes,
    availableContracts: best.size,
  };
}

function kellyStake(price: number, winProb: number, cfg: WeatherConfig): number {
  if (price <= 0 || price >= 1) return 0;
  const b = (1 - price) / price;
  const kelly = (winProb * (1 + b) - 1) / b;
  if (kelly <= 0) return 0;
  const fraction = Math.min(kelly * cfg.fractionalKelly, cfg.maxFractionPerTrade);
  return Math.round(cfg.bankrollUsd * fraction * 100) / 100;
}

function localDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-ax * ax);
  return sign * y;
}
