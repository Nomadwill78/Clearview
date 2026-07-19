import 'dotenv/config';
import { KalshiClient } from './kalshi';

// Diagnostic: fetch ALL active Kalshi markets, then (1) show a histogram of
// ticker prefixes so we can spot the weather series, and (2) print any markets
// whose title/ticker looks weather-related.
async function main() {
  const kalshi = new KalshiClient(
    process.env.KALSHI_EMAIL,
    process.env.KALSHI_PASSWORD,
    process.env.KALSHI_API_KEY_ID,
    process.env.KALSHI_PRIVATE_KEY_PATH ?? process.env.KALSHI_PRIVATE_KEY,
  );
  await kalshi.authenticate();

  console.log('Fetching all active markets (this may take ~30s)…');
  const markets = await kalshi.fetchOpenMarkets({ limit: 1000, maxPages: 60 });
  console.log(`Fetched ${markets.length} active markets total.\n`);

  // Histogram of ticker prefixes (token before first '-')
  const counts = new Map<string, number>();
  for (const m of markets) {
    const prefix = m.ticker.split('-')[0];
    counts.set(prefix, (counts.get(prefix) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  console.log(`Distinct series prefixes: ${sorted.length}. Top 60 by market count:\n`);
  for (const [prefix, n] of sorted.slice(0, 60)) {
    console.log(`  ${String(n).padStart(5)}  ${prefix}`);
  }

  // Flag prefixes that look weather-related
  const WEATHER = /HIGH|LOW|TEMP|RAIN|SNOW|WEATHER|CLIMATE|HOT|COLD|PRECIP|WIND|HURR/i;
  const weatherPrefixes = sorted.filter(([p]) => WEATHER.test(p));
  console.log(`\nPrefixes that look weather-related:`);
  if (weatherPrefixes.length === 0) {
    console.log('  (none matched)');
  } else {
    for (const [prefix, n] of weatherPrefixes) console.log(`  ${String(n).padStart(5)}  ${prefix}`);
  }

  // Show a few sample markets from each weather-looking prefix
  console.log(`\nSample weather markets:\n${'─'.repeat(80)}`);
  let shown = 0;
  for (const [prefix] of weatherPrefixes) {
    const sample = markets.filter((m) => m.ticker.split('-')[0] === prefix).slice(0, 3);
    for (const m of sample) {
      const yesProb = (((m.yes_bid_dollars ?? 0) + (m.yes_ask_dollars ?? 0)) / 2 * 100).toFixed(0);
      console.log(`TICKER : ${m.ticker}`);
      console.log(`TITLE  : ${m.title}`);
      console.log(`YES-SUB: ${m.yes_sub_title ?? '(none)'}`);
      console.log(`YES    : ${yesProb}%   |   closes: ${m.close_time}`);
      console.log('─'.repeat(80));
      if (++shown >= 30) break;
    }
    if (shown >= 30) break;
  }
}

main().catch((err) => {
  console.error('Error:', err.message ?? err);
  process.exit(1);
});
