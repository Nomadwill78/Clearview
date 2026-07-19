import 'dotenv/config';
import { KalshiClient } from './kalshi';
import { rankMarkets, DEFAULT_GATES, SafetyGates } from './scoring';
import { explainSafeBet, generateWeeklySummary } from './claude';
import { buildReport, printReport, saveReport } from './report';

async function main() {
  // ── Config ──────────────────────────────────────────────────────────────
  const email            = process.env.KALSHI_EMAIL;
  const password         = process.env.KALSHI_PASSWORD;
  const apiKeyId         = process.env.KALSHI_API_KEY_ID;
  const privateKeySource = process.env.KALSHI_PRIVATE_KEY_PATH ?? process.env.KALSHI_PRIVATE_KEY;
  const topN             = parseInt(process.env.TOP_N_MARKETS ?? '10', 10);
  const outputDir        = process.env.OUTPUT_DIR ?? './reports';

  // ── Safety gates (all configurable via .env) ────────────────────────────
  const gates: SafetyGates = {
    minConsensus:     parseFloat(process.env.MIN_CONSENSUS      ?? String(DEFAULT_GATES.minConsensus)),
    maxHoursToExpiry: parseInt(process.env.MAX_HOURS_TO_EXPIRY  ?? String(DEFAULT_GATES.maxHoursToExpiry), 10),
    maxSpreadCents:   parseInt(process.env.MAX_SPREAD_CENTS     ?? String(DEFAULT_GATES.maxSpreadCents), 10),
    minVolume24h:     parseInt(process.env.MIN_VOLUME_24H       ?? String(DEFAULT_GATES.minVolume24h), 10),
  };

  const missingAnthropic = !process.env.ANTHROPIC_API_KEY;
  if (missingAnthropic) {
    console.warn('⚠  ANTHROPIC_API_KEY not set — AI explanations will be skipped.');
  }

  // ── Fetch markets ────────────────────────────────────────────────────────
  console.log('🔍 Fetching open Kalshi markets…');
  const kalshi = new KalshiClient(email, password, apiKeyId, privateKeySource);
  await kalshi.authenticate();

  const allMarkets = await kalshi.fetchOpenMarkets({ maxPages: 20 });
  console.log(`   Fetched ${allMarkets.length} active markets`);

  // ── Apply hard gates ─────────────────────────────────────────────────────
  console.log('🔒 Applying safety gates…');
  console.log(`   Gate 1 — Consensus     ≥ ${(gates.minConsensus * 100).toFixed(0)}%`);
  console.log(`   Gate 2 — Expiry        ≤ ${gates.maxHoursToExpiry}h`);
  console.log(`   Gate 3 — Spread        ≤ ${gates.maxSpreadCents}¢  AND  24h volume ≥ ${gates.minVolume24h.toLocaleString()}`);

  const { ranked, stats } = rankMarkets(allMarkets, gates);

  console.log(`\n   Results:`);
  console.log(`   ✓ Passed all gates : ${stats.passedGates}`);
  console.log(`   ✗ Failed consensus : ${stats.failedConsensus}`);
  console.log(`   ✗ Failed time gate : ${stats.failedTime}`);
  console.log(`   ✗ Failed liquidity : ${stats.failedLiquidity}`);

  if (ranked.length === 0) {
    console.log('\n⚠  No markets passed all three gates right now.');
    console.log('   Try loosening the thresholds in your .env:');
    console.log('     MIN_CONSENSUS=0.80  MAX_HOURS_TO_EXPIRY=168  MAX_SPREAD_CENTS=5  MIN_VOLUME_24H=1000');
    process.exit(0);
  }

  const topMarkets = ranked.slice(0, topN);

  // ── AI Explanations ───────────────────────────────────────────────────────
  if (!missingAnthropic) {
    console.log(`\n🤖 Generating Claude explanations for top ${topMarkets.length} bets…`);
    for (let i = 0; i < topMarkets.length; i++) {
      const m = topMarkets[i];
      process.stdout.write(`   [${i + 1}/${topMarkets.length}] ${m.ticker}… `);
      try {
        m.explanation = await explainSafeBet(m);
        console.log('✓');
      } catch {
        console.log('✗ (skipped)');
        m.explanation = 'AI explanation unavailable.';
      }
      if (i < topMarkets.length - 1) await sleep(300);
    }

    console.log('📝 Generating weekly summary…');
    const summary = await generateWeeklySummary(topMarkets, stats);
    const report = buildReport(topMarkets, stats.total, summary);
    const savedPath = saveReport(report, outputDir);
    printReport(report);
    console.log(`💾 Report saved to: ${savedPath}`);
  } else {
    const report = buildReport(
      topMarkets,
      stats.total,
      `Top ${topMarkets.length} markets passed all safety gates (set ANTHROPIC_API_KEY for AI explanations).`,
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
