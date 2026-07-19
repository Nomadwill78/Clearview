import 'dotenv/config';
import { KalshiClient } from './kalshi';
import { findDivergences } from './divergence';
import { buildDivergenceReport, saveJson, saveHtml, printConsole } from './divergenceReport';

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('✗ ANTHROPIC_API_KEY is required — it powers the market matching. Add it to your .env.');
    process.exit(1);
  }

  const topN = parseInt(process.env.TOP_N_MARKETS ?? '20', 10);
  const outputDir = process.env.OUTPUT_DIR ?? './reports';

  const kalshi = new KalshiClient(
    process.env.KALSHI_EMAIL,
    process.env.KALSHI_PASSWORD,
    process.env.KALSHI_API_KEY_ID,
    process.env.KALSHI_PRIVATE_KEY_PATH ?? process.env.KALSHI_PRIVATE_KEY,
  );
  await kalshi.authenticate();

  const result = await findDivergences(kalshi, {
    categories: (process.env.KALSHI_CATEGORIES ?? 'Politics,Elections,Entertainment,World,Social')
      .split(',').map((c) => c.trim()).filter(Boolean),
    polyMinVol24h: parseFloat(process.env.POLY_MIN_VOLUME_24H ?? '150'),
    minGapPoints: parseFloat(process.env.MIN_GAP_POINTS ?? '5'),
    maxDaysToClose: parseFloat(process.env.MAX_DAYS_TO_CLOSE ?? '365'),
    maxMatchChecks: parseInt(process.env.MAX_MATCH_CHECKS ?? '80', 10),
    kalshiMinVol24h: parseFloat(process.env.KALSHI_MIN_VOLUME_24H ?? '0'),
    onProgress: (m) => console.log('   ' + m),
  });

  const report = buildDivergenceReport(result.rows.slice(0, topN), {
    kalshiPoolSize: result.kalshiPoolSize,
    polyPoolSize: result.polyPoolSize,
    matchChecks: result.matchChecks,
  });

  printConsole(report);
  const jsonPath = saveJson(report, outputDir);
  const htmlPath = saveHtml(report, outputDir);
  console.log(`💾 JSON saved to: ${jsonPath}`);
  console.log(`🌐 Open this in your browser:\n   ${htmlPath}\n`);
}

main().catch((err) => {
  console.error('Fatal error:', err.message ?? err);
  process.exit(1);
});
