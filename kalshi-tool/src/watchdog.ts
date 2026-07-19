import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { KalshiClient } from './kalshi';
import { findWeatherEdges } from './weather';
import { findDivergences } from './divergence';

// Quiet-by-default watchdog. Runs the weather + divergence checks with
// conservative alert thresholds and writes reports/alert.md ONLY when something
// real is found. The GitHub Action turns that file into an emailed issue.
async function main() {
  const outputDir = process.env.OUTPUT_DIR ?? './reports';
  const alertPath = path.join(outputDir, 'alert.md');

  // Start clean so a stale alert never re-fires.
  fs.mkdirSync(outputDir, { recursive: true });
  if (fs.existsSync(alertPath)) fs.rmSync(alertPath);

  const kalshi = new KalshiClient(
    process.env.KALSHI_EMAIL,
    process.env.KALSHI_PASSWORD,
    process.env.KALSHI_API_KEY_ID,
    process.env.KALSHI_PRIVATE_KEY_PATH ?? process.env.KALSHI_PRIVATE_KEY,
  );
  await kalshi.authenticate();

  const sections: string[] = [];

  // ── Weather edges ───────────────────────────────────────────────────────
  const weatherMinEdge = parseFloat(process.env.ALERT_WEATHER_MIN_EDGE ?? '0.10');
  try {
    const weather = await findWeatherEdges(kalshi, {
      kernelSigma: parseFloat(process.env.WEATHER_KERNEL ?? '1.5'),
      minEdge: weatherMinEdge,
      bankrollUsd: parseFloat(process.env.BANKROLL_USD ?? '1000'),
      fractionalKelly: parseFloat(process.env.FRACTIONAL_KELLY ?? '0.25'),
      maxFractionPerTrade: parseFloat(process.env.MAX_FRACTION_PER_TRADE ?? '0.05'),
      minContracts: parseInt(process.env.WEATHER_MIN_CONTRACTS ?? '20', 10),
      includeToday: false,
    });
    if (weather.edges.length > 0) {
      const lines = weather.edges.map((e) =>
        `- **${e.city} ${e.date}** — ${e.title}\n` +
        `  Ensemble median ${e.ensembleMedian}°F (${e.ensembleMin}–${e.ensembleMax}) · ` +
        `model ${(e.modelProb * 100).toFixed(0)}% vs market ${(e.marketProb * 100).toFixed(0)}% · ` +
        `**BUY ${e.side} @ ${e.entryPrice}¢** · edge ${(e.edge * 100).toFixed(1)}% · ${e.availableContracts} offered`,
      );
      sections.push(`### 🌦 Weather edges (${weather.edges.length})\n\n${lines.join('\n')}`);
    }
    console.log(`Weather: ${weather.edges.length} edge(s) ≥ ${(weatherMinEdge * 100).toFixed(0)}%`);
  } catch (e: any) {
    console.log(`Weather check failed: ${e.message}`);
  }

  // ── Cross-venue divergences ─────────────────────────────────────────────
  const minGap = parseFloat(process.env.ALERT_MIN_GAP_POINTS ?? '8');
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const div = await findDivergences(kalshi, {
        categories: (process.env.KALSHI_CATEGORIES ?? 'Politics,Elections,Entertainment,World,Social')
          .split(',').map((c) => c.trim()).filter(Boolean),
        polyMinVol24h: parseFloat(process.env.POLY_MIN_VOLUME_24H ?? '150'),
        minGapPoints: minGap,
        maxDaysToClose: parseFloat(process.env.MAX_DAYS_TO_CLOSE ?? '365'),
        maxMatchChecks: parseInt(process.env.MAX_MATCH_CHECKS ?? '80', 10),
        kalshiMinVol24h: parseFloat(process.env.KALSHI_MIN_VOLUME_24H ?? '0'),
        onProgress: (m) => console.log('  ' + m),
      });
      if (div.rows.length > 0) {
        const lines = div.rows.map((r) => {
          const cheaper = r.richerSide === 'KALSHI' ? 'Polymarket' : 'Kalshi';
          return `- **${r.gapPoints.toFixed(1)}pt gap** [${r.confidence}] — ${r.kalshiTitle}\n` +
            `  Kalshi ${(r.kalshiYes * 100).toFixed(0)}% vs Polymarket ${(r.polyYes * 100).toFixed(0)}% · ` +
            `${cheaper} prices YES lower · resolves in ${r.daysToClose.toFixed(0)}d\n  ${r.polyUrl}`;
        });
        sections.push(`### ⚖️ Kalshi ↔ Polymarket divergences (${div.rows.length})\n\n${lines.join('\n')}`);
      }
      console.log(`Divergences: ${div.rows.length} gap(s) ≥ ${minGap}pt`);
    } catch (e: any) {
      console.log(`Divergence check failed: ${e.message}`);
    }
  } else {
    console.log('Divergence check skipped (no ANTHROPIC_API_KEY).');
  }

  // ── Write alert only if something was found ─────────────────────────────
  if (sections.length > 0) {
    const body =
      `Kalshi watchdog found potential edges on ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC.\n\n` +
      sections.join('\n\n') +
      `\n\n---\n*Verify each market's rules and current price before trading. These are candidates, not guarantees.*\n`;
    fs.writeFileSync(alertPath, body);
    console.log(`\n🔔 EDGES FOUND — wrote ${alertPath}`);
  } else {
    console.log('\n✅ Quiet run — no edges above alert thresholds. No alert written.');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err.message ?? err);
  process.exit(1);
});
