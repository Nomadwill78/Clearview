// National Weather Service (api.weather.gov) client — free, no auth.
// Two-step: /points/{lat},{lon} → forecast URL → daily periods.

export interface DailyHigh {
  date: string;       // YYYY-MM-DD (local to the forecast point)
  highF: number;
  shortForecast: string;
}

const USER_AGENT = 'kalshi-weather-edge (personal use)';

export async function getForecastHighs(lat: number, lon: number): Promise<Map<string, DailyHigh>> {
  const points = await getJson(
    `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`,
  );
  const forecastUrl = points?.properties?.forecast;
  if (!forecastUrl) throw new Error('NWS points endpoint returned no forecast URL');

  const forecast = await getJson(forecastUrl);
  const periods: any[] = forecast?.properties?.periods ?? [];

  const out = new Map<string, DailyHigh>();
  for (const p of periods) {
    if (!p.isDaytime) continue;                 // daytime period = the day's HIGH
    if (p.temperatureUnit !== 'F') continue;
    const date = String(p.startTime).slice(0, 10);   // local date portion
    out.set(date, {
      date,
      highF: Number(p.temperature),
      shortForecast: String(p.shortForecast ?? ''),
    });
  }
  return out;
}

async function getJson(url: string, retries = 3): Promise<any> {
  let lastErr: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/geo+json' },
      });
      if (res.ok) return res.json();
      if (res.status === 404) throw new Error(`NWS 404: ${url}`);
      lastErr = new Error(`NWS ${res.status}`);
    } catch (e) {
      lastErr = e;
    }
    await sleep(600 * (i + 1));
  }
  throw new Error(`NWS request failed after ${retries} tries (${url}): ${String(lastErr)}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
