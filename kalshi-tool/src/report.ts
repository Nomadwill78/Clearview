import fs from 'fs';
import path from 'path';
import { ScoredMarket, WeeklyReport } from './types';

export function buildReport(
  markets: ScoredMarket[],
  totalAnalyzed: number,
  summary: string,
): WeeklyReport {
  const now = new Date();
  const weekOf = getWeekOf(now);

  return {
    generatedAt: now.toISOString(),
    weekOf,
    totalMarketsAnalyzed: totalAnalyzed,
    topSafeBets: markets,
    summary,
  };
}

export function saveReport(report: WeeklyReport, outputDir: string): string {
  fs.mkdirSync(outputDir, { recursive: true });
  const filename = `safe-bets-${report.weekOf}.json`;
  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
  return filepath;
}

export function printReport(report: WeeklyReport): void {
  const divider = '─'.repeat(72);

  console.log('\n');
  console.log('╔' + '═'.repeat(70) + '╗');
  console.log('║' + center('KALSHI SAFE BETS — WEEK OF ' + report.weekOf, 70) + '║');
  console.log('╚' + '═'.repeat(70) + '╝');
  console.log(`Generated: ${new Date(report.generatedAt).toLocaleString()}`);
  console.log(`Markets analyzed: ${report.totalMarketsAnalyzed}`);
  console.log(`\n${report.summary}\n`);
  console.log(divider);

  report.topSafeBets.forEach((m, i) => {
    const prob = Math.max(m.safetyDetails.midPrice, 1 - m.safetyDetails.midPrice);
    const daysLabel = m.safetyDetails.daysToClose < 1
      ? 'today'
      : `${m.safetyDetails.daysToClose.toFixed(0)} days`;

    console.log(`\n#${i + 1}  ${m.title}`);
    console.log(`     Ticker: ${m.ticker}  |  Category: ${m.category}`);
    console.log(
      `     Position: ${m.recommendedPosition} @ ${m.recommendedEntry}¢` +
      `  |  Implied prob: ${(prob * 100).toFixed(1)}%` +
      `  |  Resolves: ${daysLabel}`,
    );
    console.log(
      `     Safety score: ${(m.safetyScore * 100).toFixed(1)}/100` +
      `  |  Volume: ${Math.round((m.volume_fp ?? 0) / 100).toLocaleString()} contracts` +
      `  |  Spread: ${m.safetyDetails.spread}¢`,
    );

    if (m.explanation) {
      console.log(`\n     ${wrapText(m.explanation, 68, '     ')}`);
    }

    console.log('\n' + divider);
  });

  console.log('\n');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getWeekOf(date: Date): string {
  // ISO week start (Monday)
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

function center(text: string, width: number): string {
  const pad = Math.max(0, width - text.length);
  const left = Math.floor(pad / 2);
  const right = pad - left;
  return ' '.repeat(left) + text + ' '.repeat(right);
}

function wrapText(text: string, width: number, indent: string): string {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (current.length + word.length + 1 > width) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);

  return lines.join(`\n${indent}`);
}
