import fs from 'fs';
import path from 'path';
import { DivergenceReport, DivergenceRow } from './types';

export function buildDivergenceReport(
  rows: DivergenceRow[],
  meta: { kalshiPoolSize: number; polyPoolSize: number; matchChecks: number },
): DivergenceReport {
  const now = new Date();
  return {
    generatedAt: now.toISOString(),
    weekOf: getWeekOf(now),
    kalshiPoolSize: meta.kalshiPoolSize,
    polyPoolSize: meta.polyPoolSize,
    matchChecks: meta.matchChecks,
    matchesFound: rows.length,
    rows,
  };
}

export function saveJson(report: DivergenceReport, outputDir: string): string {
  fs.mkdirSync(outputDir, { recursive: true });
  const filepath = path.join(outputDir, `divergences-${report.weekOf}.json`);
  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
  return filepath;
}

export function saveHtml(report: DivergenceReport, outputDir: string): string {
  fs.mkdirSync(outputDir, { recursive: true });
  const filepath = path.join(outputDir, `divergences-${report.weekOf}.html`);
  fs.writeFileSync(filepath, renderHtml(report));
  return filepath;
}

export function printConsole(report: DivergenceReport): void {
  const divider = '─'.repeat(72);
  console.log('\n');
  console.log('╔' + '═'.repeat(70) + '╗');
  console.log('║' + center('KALSHI ↔ POLYMARKET DIVERGENCES', 70) + '║');
  console.log('╚' + '═'.repeat(70) + '╝');
  console.log(`Generated: ${new Date(report.generatedAt).toLocaleString()}`);
  console.log(
    `Kalshi pool: ${report.kalshiPoolSize}  |  Polymarket pool: ${report.polyPoolSize}  |  ` +
    `Matches checked: ${report.matchChecks}  |  Divergences found: ${report.matchesFound}`,
  );

  if (report.rows.length === 0) {
    console.log('\nNo cross-market divergences found this run.');
    console.log('The two markets either agree, or share no comparable events right now.\n');
    return;
  }

  console.log('\n' + divider);
  report.rows.forEach((r, i) => {
    const cheaper = r.richerSide === 'KALSHI' ? 'Polymarket' : 'Kalshi';
    console.log(`\n#${i + 1}  [${r.confidence.toUpperCase()} match]  ${r.gapPoints.toFixed(1)}-pt gap`);
    console.log(`     Kalshi:     ${(r.kalshiYes * 100).toFixed(1)}%  —  ${r.kalshiTitle}`);
    console.log(`     Polymarket: ${(r.polyYes * 100).toFixed(1)}%  —  ${r.polyQuestion}`);
    console.log(`     → ${cheaper} prices YES lower. Resolves in ${r.daysToClose.toFixed(0)}d.`);
    console.log(`     ${r.polyUrl}`);
    console.log('\n' + divider);
  });
  console.log('');
}

// ---------------------------------------------------------------------------

function renderHtml(report: DivergenceReport): string {
  const rowsHtml = report.rows.map((r, i) => rowHtml(r, i)).join('\n');
  const empty = report.rows.length === 0
    ? `<p class="empty">No cross-market divergences found this run. The two venues either agree, or share no comparable events right now.</p>`
    : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Kalshi ↔ Polymarket Divergences — ${report.weekOf}</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    margin: 0; padding: 2rem 1rem; background: #0f1117; color: #e6e8ee; line-height: 1.5; }
  .wrap { max-width: 920px; margin: 0 auto; }
  h1 { font-size: 1.5rem; margin: 0 0 .25rem; }
  .meta { color: #9aa0ad; font-size: .85rem; margin-bottom: 1.5rem; }
  .legend { background: #1a1d27; border: 1px solid #262a36; border-radius: 10px;
    padding: .9rem 1.1rem; font-size: .85rem; color: #b8bdc9; margin-bottom: 1.5rem; }
  .legend b { color: #e6e8ee; }
  .card { background: #171a23; border: 1px solid #262a36; border-radius: 12px;
    padding: 1.1rem 1.25rem; margin-bottom: 1rem; }
  .top { display: flex; justify-content: space-between; align-items: center;
    gap: 1rem; margin-bottom: .8rem; flex-wrap: wrap; }
  .gap { font-size: 1.35rem; font-weight: 700; }
  .g-big { color: #ff6b6b; } .g-mid { color: #ffb454; } .g-small { color: #74c0fc; }
  .conf { font-size: .7rem; text-transform: uppercase; letter-spacing: .05em;
    padding: .2rem .55rem; border-radius: 999px; font-weight: 600; }
  .c-high { background: #14432a; color: #6fdf9f; }
  .c-medium { background: #4a3a12; color: #ffce6b; }
  .c-low { background: #3a2530; color: #ff9db4; }
  .venues { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; margin: .5rem 0 .8rem; }
  @media (max-width: 560px) { .venues { grid-template-columns: 1fr; } }
  .venue { background: #11141c; border: 1px solid #232735; border-radius: 8px; padding: .7rem .85rem; }
  .venue .name { font-size: .72rem; text-transform: uppercase; letter-spacing: .05em; color: #8b93a3; }
  .venue .price { font-size: 1.5rem; font-weight: 700; margin: .1rem 0; }
  .venue .q { font-size: .8rem; color: #c3c8d4; }
  .k .price { color: #74c0fc; } .p .price { color: #b18cff; }
  .foot { font-size: .82rem; color: #9aa0ad; display: flex; justify-content: space-between;
    gap: 1rem; flex-wrap: wrap; align-items: center; }
  a { color: #74c0fc; text-decoration: none; } a:hover { text-decoration: underline; }
  .empty { background: #171a23; border: 1px solid #262a36; border-radius: 12px;
    padding: 2rem; text-align: center; color: #9aa0ad; }
  .disclaimer { margin-top: 2rem; font-size: .78rem; color: #6b7280; border-top: 1px solid #262a36; padding-top: 1rem; }
</style>
</head>
<body>
<div class="wrap">
  <h1>Kalshi ↔ Polymarket Divergences</h1>
  <div class="meta">Week of ${report.weekOf} · Generated ${new Date(report.generatedAt).toLocaleString()} ·
    ${report.kalshiPoolSize} Kalshi × ${report.polyPoolSize} Polymarket markets ·
    ${report.matchesFound} divergences from ${report.matchChecks} checked matches</div>
  <div class="legend">
    A <b>divergence</b> is when the two biggest prediction markets price the same event differently.
    The larger the gap, the more likely one side is mispriced — that gap is your potential edge.
    <b>Match confidence</b> reflects how sure the AI is that both rows describe the exact same wager.
    Always click through and read both markets' rules before acting on a <b>low</b>-confidence match.
  </div>
  ${empty}
  ${rowsHtml}
  <div class="disclaimer">
    This tool surfaces price differences; it does not guarantee a winning bet. Matching two markets by
    meaning is imperfect — verify each one yourself. Prediction market trading carries risk of loss.
  </div>
</div>
</body>
</html>`;
}

function rowHtml(r: DivergenceRow, i: number): string {
  const gapClass = r.gapPoints >= 15 ? 'g-big' : r.gapPoints >= 8 ? 'g-mid' : 'g-small';
  const cheaper = r.richerSide === 'KALSHI' ? 'Polymarket' : 'Kalshi';
  return `  <div class="card">
    <div class="top">
      <span class="gap ${gapClass}">#${i + 1} · ${r.gapPoints.toFixed(1)}-point gap</span>
      <span class="conf c-${r.confidence}">${r.confidence} match</span>
    </div>
    <div class="venues">
      <div class="venue k">
        <div class="name">Kalshi</div>
        <div class="price">${(r.kalshiYes * 100).toFixed(1)}%</div>
        <div class="q">${escapeHtml(r.kalshiTitle)}</div>
      </div>
      <div class="venue p">
        <div class="name">Polymarket</div>
        <div class="price">${(r.polyYes * 100).toFixed(1)}%</div>
        <div class="q">${escapeHtml(r.polyQuestion)}</div>
      </div>
    </div>
    <div class="foot">
      <span>${cheaper} prices YES lower · resolves in ${r.daysToClose.toFixed(0)} days</span>
      <a href="${r.polyUrl}" target="_blank" rel="noopener">Open on Polymarket →</a>
    </div>
  </div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
  ));
}

function getWeekOf(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

function center(text: string, width: number): string {
  const pad = Math.max(0, width - text.length);
  const left = Math.floor(pad / 2);
  return ' '.repeat(left) + text + ' '.repeat(pad - left);
}
