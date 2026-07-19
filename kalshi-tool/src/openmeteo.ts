// Open-Meteo Ensemble API — free, no auth. Returns ~30 GEFS member forecasts
// of the daily high, so the spread across members IS the real uncertainty.

export interface EnsembleDay {
  date: string;
  members: number[];   // per-member forecast highs (°F)
  median: number;
  min: number;
  max: number;
}

export async function getEnsembleHighs(lat: number, lon: number): Promise<Map<string, EnsembleDay>> {
  const url =
    `https://ensemble-api.open-meteo.com/v1/ensemble` +
    `?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}` +
    `&daily=temperature_2m_max&forecast_days=7` +
    `&temperature_unit=fahrenheit&models=gfs025&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Open-Meteo ${res.status}: ${await res.text()}`);
  }

  const data: any = await res.json();
  const daily = data?.daily ?? {};
  const times: string[] = daily.time ?? [];
  const memberKeys = Object.keys(daily).filter((k) =>
    /^temperature_2m_max_member\d+$/.test(k),
  );

  const out = new Map<string, EnsembleDay>();
  times.forEach((date, i) => {
    const members: number[] = [];
    for (const k of memberKeys) {
      const v = Number(daily[k]?.[i]);
      if (Number.isFinite(v)) members.push(v);
    }
    // Include the deterministic run too, if present
    const det = Number(daily.temperature_2m_max?.[i]);
    if (Number.isFinite(det)) members.push(det);

    if (members.length === 0) return;
    const sorted = [...members].sort((a, b) => a - b);
    out.set(date, {
      date,
      members,
      median: sorted[Math.floor(sorted.length / 2)],
      min: sorted[0],
      max: sorted[sorted.length - 1],
    });
  });

  return out;
}
