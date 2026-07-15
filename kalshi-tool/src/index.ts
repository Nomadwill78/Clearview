import 'dotenv/config';
import { KalshiClient } from './kalshi';
import { rankMarkets } from './scoring';
import { explainSafeBet, generateWeeklySummary } from './claude';
import { buildReport, printReport, saveReport } from './report';

async function main() {
  // ── Config ──────────────────────────────────────────────────────────────
  const email            = process.env.KALSHI_EMAIL;
  const password         = process.env.KALSHI_PASSWORD;
  const apiKeyId         = process.env.KALSHI_API_KEY_ID;
  const privateKeySource = process.env.KALSHI_PRIVATE_KEY_PATH ?? process.env.KALSHI_PRIVATE_KEY;
  const topN             = parseInt(process.env.TOP_N_MARKETS ?? '10', 10);
  const minVolume   = parseInt(process.env.MIN_VOLUME ?? '1000', 10);
  const minSkew     = parseFloat(process.env.MIN_PROBABILITY_SKEW ?? '0.65');
  const outputDir   = process.env.OUTPUT_DIR ?? './reports';

  const missingAnthropic = !process.env.ANTHROPIC_API_KEY;
  if (missingAnthropic) {
    console.warn(
      '⚠  ANTHROPIC_API_KEY not set — AI explanations will be skipped.\n' +
      '   Add it to your .env file for full reports.',
    );
  }

  // ── Kalshi ───────────────────────────────────────────────────────────────
  console.log('🔍 Fetching open Kalshi markets…');
  const kalshi = new KalshiClient(email, password, apiKeyId, privateKeySource);
  await kalshi.authenticate();

  const allMarkets = await kalshi.fetchOpenMarkets({ minVolume, maxPages: 20 });
  console.log(`   Fetched ${allMarkets.length} markets with volume ≥ ${minVolume}`);

  // ── Scoring ──────────────────────────────────────────────────────────────
  console.log('📊 Scoring markets for safety…');
  const ranked = rankMarkets(allMarkets, minSkew);
  console.log(
    `   ${ranked.length} markets pass the ${(minSkew * 100).toFixed(0)}% probability threshold`,
  );

  const topMarkets = ranked.slice(0, topN);

  // ── AI Explanations ───────────────────────────────────────────────────────
  if (!missingAnthropic) {
    console.log(`🤖 Generating Claude explanations for top ${topMarkets.length} bets…`);
    for (let i = 0; i < topMarkets.length; i++) {
      const m = topMarkets[i];
      process.stdout.write(`   [${i + 1}/${topMarkets.length}] ${m.ticker}… `);
      try {
        m.explanation = await explainSafeBet(m);
        console.log('✓');
      } catch (err) {
        console.log('✗ (skipped)');
        m.explanation = 'AI explanation unavailable.';
      }
      // Small delay to stay within rate limits
      if (i < topMarkets.length - 1) await sleep(300);
    }

    console.log('📝 Generating weekly summary…');
    const summary = await generateWeeklySummary(topMarkets, allMarkets.length);

    const report = buildReport(topMarkets, allMarkets.length, summary);
    const savedPath = saveReport(report, outputDir);
    printReport(report);
    console.log(`💾 Report saved to: ${savedPath}`);
  } else {
    // No Anthropic key — still print the scores
    const report = buildReport(
      topMarkets,
      allMarkets.length,
      `Top ${topN} safest open markets by probability skew + liquidity (no AI summary — set ANTHROPIC_API_KEY).`,
    );
    const savedPath = saveReport(report, outputDir);
    printReport(report);
    console.log(`💾 Report saved to: ${savedPath}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((err) => {
  console.error('Fatal error:', err.message ?? err);
  process.exit(1);
});
