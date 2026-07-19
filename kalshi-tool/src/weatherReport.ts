import fs from 'fs';
import path from 'path';
import { WeatherEdge, WeatherRunResult } from './weather';

export function printConsole(result: WeatherRunResult): void {
  const divider = '─'.repeat(72);
  console.log('\n');
  console.log('╔' + '═'.repeat(70) + '╗');
  console.log('║' + center('KALSHI WEATHER EDGE — FORECAST vs MARKET', 70) + '║');
  console.log('╚' + '═'.repeat(70) + '╝');
  console.log(`Cities scanned: ${result.citiesScanned.join(', ') || '(none)'}`);
  console.log(`Markets scored: ${result.marketsScored}  |  Edges found: ${result.edges.length}`);
  if (result.forecastErrors.length) {
    console.log(`Forecast issues: ${result.forecastErrors.join(' | ')}`);
  }

  if (result.edges.length === 0) {
    console.log('\nNo edges above the threshold this run. The market agrees with the forecast,');
    console.log('or no near-term weather markets were quoted. Try lowering WEATHER_MIN_EDGE.\n');
    return;
  }

  console.log('\n' + divider);
  result.edges.forEach((e, i) => {
    console.log(`\n#${i + 1}  ${e.city} — ${e.date}`);
    console.log(`     ${e.title}`);
    console.log(`     Market: "${e.boundLabel}"`);
    console.log(`     Forecast high: ${e.forecastHigh}°F (${e.shortForecast})`);
    console.log(
      `     Model says YES ${(e.modelProb * 100).toFixed(0)}%  vs  Market ${(e.marketProb * 100).toFixed(0)}%`,
    );
    console.log(
      `     → BUY ${e.side} @ ${e.entryPrice}¢   |   edge ${(e.edge * 100).toFixed(1)}%` +
      `   |   suggested stake $${e.stakeUsd.toFixed(2)}`,
    );
    console.log('\n' + divider);
  });
  console.log('');
}

export function saveJson(result: WeatherRunResult, outputDir: string): string {
  fs.mkdirSync(outputDir, { recursive: true });
  const filepath = path.join(outputDir, `weather-edges-${today()}.json`);
  fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
  return filepath;
}

export function saveHtml(result: WeatherRunResult, outputDir: string): string {
  fs.mkdirSync(outputDir, { recursive: true });
  const filepath = path.join(outputDir, `weather-edges-${today()}.html`);
  fs.writeFileSync(filepath, renderHtml(result));
  return filepath;
}

// ---------------------------------------------------------------------------

function renderHtml(result: WeatherRunResult): string {
  const cards = result.edges.map((e, i) => cardHtml(e, i)).join('\n');
  const empty = result.edges.length === 0
    ? `<p class="empty">No edges above the threshold this run — the market agrees with the forecast, or no near-term weather markets were quoted.</p>`
    : '';

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Kalshi Weather Edge — ${today()}</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    margin: 0; padding: 2rem 1rem; background: #0f1117; color: #e6e8ee; line-height: 1.5; }
  .wrap { max-width: 880px; margin: 0 auto; }
  h1 { font-size: 1.5rem; margin: 0 0 .25rem; }
  .meta { color: #9aa0ad; font-size: .85rem; margin-bottom: 1.25rem; }
  .legend { background: #1a1d27; border: 1px solid #262a36; border-radius: 10px;
    padding: .9rem 1.1rem; font-size: .85rem; color: #b8bdc9; margin-bottom: 1.5rem; }
  .legend b { color: #e6e8ee; }
  .card { background: #171a23; border: 1px solid #262a36; border-radius: 12px;
    padding: 1.1rem 1.25rem; margin-bottom: 1rem; }
  .top { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; flex-wrap: wrap; }
  .city { font-weight: 700; font-size: 1.05rem; }
  .edge { font-size: 1.3rem; font-weight: 700; }
  .e-big { color: #6fdf9f; } .e-mid { color: #ffce6b; } .e-small { color: #74c0fc; }
  .title { color: #c3c8d4; font-size: .9rem; margin: .4rem 0 .8rem; }
  .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: .6rem; margin-bottom: .8rem; }
  @media (max-width: 560px) { .grid { grid-template-columns: 1fr; } }
  .box { background: #11141c; border: 1px solid #232735; border-radius: 8px; padding: .6rem .75rem; }
  .box .k { font-size: .68rem; text-transform: uppercase; letter-spacing: .05em; color: #8b93a3; }
  .box .v { font-size: 1.15rem; font-weight: 700; margin-top: .15rem; }
  .fc { color: #74c0fc; } .md { color: #6fdf9f; } .mk { color: #ffce6b; }
  .action { font-size: 1rem; font-weight: 600; padding: .6rem .8rem; border-radius: 8px;
    background: #10261a; border: 1px solid #1c5238; color: #8ef0b4; display: flex;
    justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
  .empty { background: #171a23; border: 1px solid #262a36; border-radius: 12px;
    padding: 2rem; text-align: center; color: #9aa0ad; }
  .disclaimer { margin-top: 2rem; font-size: .78rem; color: #6b7280;
    border-top: 1px solid #262a36; padding-top: 1rem; }
</style></head>
<body><div class="wrap">
  <h1>Kalshi Weather Edge</h1>
  <div class="meta">${today()} · ${result.citiesScanned.length} cities scanned ·
    ${result.marketsScored} markets scored · ${result.edges.length} edges found</div>
  <div class="legend">
    Each card compares the <b>official NWS forecast</b> to Kalshi's market price for a daily
    high-temperature market. <b>Edge</b> is how much the forecast-based probability beats the
    market price, after fees. Bigger edge = bigger disagreement. This is only as good as the
    forecast and its uncertainty assumption — treat it as a starting point, not a guarantee.
  </div>
  ${empty}
  ${cards}
  <div class="disclaimer">
    Model = normal distribution around the NWS forecast high. Real outcomes vary; forecasts miss.
    Confirm each market resolves against the station this tool assumes before trading.
    Prediction market trading carries real risk of loss.
  </div>
</div></body></html>`;
}

function cardHtml(e: WeatherEdge, i: number): string {
  const cls = e.edge >= 0.15 ? 'e-big' : e.edge >= 0.08 ? 'e-mid' : 'e-small';
  return `  <div class="card">
    <div class="top">
      <span class="city">#${i + 1} · ${escapeHtml(e.city)} · ${e.date}</span>
      <span class="edge ${cls}">${(e.edge * 100).toFixed(1)}% edge</span>
    </div>
    <div class="title">${escapeHtml(e.title)} &nbsp;—&nbsp; market bin: <b>${escapeHtml(e.boundLabel)}</b></div>
    <div class="grid">
      <div class="box"><div class="k">Forecast high</div><div class="v fc">${e.forecastHigh}°F</div></div>
      <div class="box"><div class="k">Model YES</div><div class="v md">${(e.modelProb * 100).toFixed(0)}%</div></div>
      <div class="box"><div class="k">Market YES</div><div class="v mk">${(e.marketProb * 100).toFixed(0)}%</div></div>
    </div>
    <div class="action">
      <span>BUY ${e.side} @ ${e.entryPrice}¢</span>
      <span>suggested stake $${e.stakeUsd.toFixed(2)}</span>
    </div>
  </div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
  ));
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function center(text: string, width: number): string {
  const pad = Math.max(0, width - text.length);
  const left = Math.floor(pad / 2);
  return ' '.repeat(left) + text + ' '.repeat(pad - left);
}
