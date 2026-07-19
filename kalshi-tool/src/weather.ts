import { KalshiClient } from './kalshi';
import { getForecastHighs } from './nws';

// ── Station map ──────────────────────────────────────────────────────────────
// Kalshi weather series → the station its market resolves against.
// Coordinates target that station; verify against each market's rules if unsure.
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
  | { kind: 'above'; threshold: number }   // YES if high >= threshold
  | { kind: 'below'; threshold: number };  // YES if high <= threshold

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

// Model probability that a bound resolves YES, given a forecast high and the
// forecast uncertainty (sigma, °F). Uses a normal distribution + continuity
// correction (temps are integer °F).
export function modelYesProb(bound: Bound, forecastHigh: number, sigma: number): number {
  const cdf = (x: number) => normalCdf((x - forecastHigh) / sigma);
  switch (bound.kind) {
    case 'bin':   return clamp01(cdf(bound.high + 0.5) - cdf(bound.low - 0.5));
    case 'above': return clamp01(1 - cdf(bound.threshold - 0.5));
    case 'below': return clamp01(cdf(bound.threshold + 0.5));
  }
}

// ── Ticker date parsing (pure) ───────────────────────────────────────────────
const MONTHS: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
};

// "KXHIGHNY-26JUL20-T84" → "2026-07-20"
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
  forecastHigh: number;
  shortForecast: string;
  marketProb: number;    // implied prob market resolves YES
  modelProb: number;     // our forecast-based prob
  side: 'YES' | 'NO';    // which side to buy
  edge: number;          // net edge after fee, for the chosen side
  entryPrice: number;    // cents to buy the chosen side
  stakeUsd: number;
}

export interface WeatherConfig {
  sigma: number;                 // forecast uncertainty in °F
  minEdge: number;               // minimum net edge to report (0–1)
  bankrollUsd: number;
  fractionalKelly: number;
  maxFractionPerTrade: number;
  cities?: string[];             // optional subset of series tickers
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

  for (const station of stations) {
    // Forecast highs for this station (date → high °F)
    let forecasts;
    try {
      forecasts = await getForecastHighs(station.lat, station.lon);
    } catch (e: any) {
      forecastErrors.push(`${station.city}: ${e.message}`);
      continue;
    }
    citiesScanned.push(station.city);

    // Open markets in this weather series
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
      const forecast = forecasts.get(date);
      if (!forecast) continue;              // only near-term dates have forecasts

      const bound = parseBound(m.yes_sub_title);
      if (!bound) continue;

      const marketProb = impliedProb(m);
      if (marketProb === null) continue;

      marketsScored++;
      const modelProb = modelYesProb(bound, forecast.highF, cfg.sigma);

      const edge = pickSide(marketProb, modelProb);
      if (edge.net < cfg.minEdge) continue;

      const entryPrice = Math.round((edge.side === 'YES' ? marketProb : 1 - marketProb) * 100);
      const stakeUsd = kellyStake(edge.side === 'YES' ? marketProb : 1 - marketProb, edge.winProb, cfg);

      edges.push({
        city: station.city,
        date,
        ticker: m.ticker,
        title: m.title,
        boundLabel: m.yes_sub_title,
        forecastHigh: forecast.highF,
        shortForecast: forecast.shortForecast,
        marketProb,
        modelProb,
        side: edge.side,
        edge: edge.net,
        entryPrice,
        stakeUsd,
      });
    }
  }

  edges.sort((a, b) => b.edge - a.edge);
  return { edges, citiesScanned, marketsScored, forecastErrors };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function impliedProb(m: any): number | null {
  const bid = m.yes_bid_dollars;
  const ask = m.yes_ask_dollars;
  if (bid > 0 && ask > 0 && ask >= bid) return (bid + ask) / 2;
  const last = m.last_price_dollars;
  if (last > 0 && last < 1) return last;
  return null;
}

// Kalshi's per-contract fee ≈ 0.07 * price * (1-price). Decide which side (YES
// or NO) carries the bigger post-fee edge.
function pickSide(marketProb: number, modelProb: number): { side: 'YES' | 'NO'; net: number; winProb: number } {
  const feeYes = 0.07 * marketProb * (1 - marketProb);
  const feeNo = 0.07 * (1 - marketProb) * marketProb;
  const yesEdge = (modelProb - marketProb) - feeYes;
  const noEdge = ((1 - modelProb) - (1 - marketProb)) - feeNo;
  if (yesEdge >= noEdge) return { side: 'YES', net: yesEdge, winProb: modelProb };
  return { side: 'NO', net: noEdge, winProb: 1 - modelProb };
}

// Fractional Kelly with hard cap. price = entry cost of the chosen side (0–1),
// winProb = model probability that side wins.
function kellyStake(price: number, winProb: number, cfg: WeatherConfig): number {
  if (price <= 0 || price >= 1) return 0;
  const b = (1 - price) / price;
  const kelly = (winProb * (1 + b) - 1) / b;
  if (kelly <= 0) return 0;
  const fraction = Math.min(kelly * cfg.fractionalKelly, cfg.maxFractionPerTrade);
  return Math.round(cfg.bankrollUsd * fraction * 100) / 100;
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

// Normal CDF via the Abramowitz-Stegun erf approximation (max error ~1.5e-7)
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
