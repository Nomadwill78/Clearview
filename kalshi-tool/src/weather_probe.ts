import 'dotenv/config';
import { KalshiClient } from './kalshi';

// Diagnostic: discover Kalshi's weather markets WITHOUT downloading all 100k+
// markets. Strategy:
//   1. List series and print category histogram (find what "weather" is called).
//   2. Print every series ticker in weather-ish categories.
//   3. Pull a few sample markets from the first weather series found.
async function main() {
  const kalshi = new KalshiClient(
    process.env.KALSHI_EMAIL,
    process.env.KALSHI_PASSWORD,
    process.env.KALSHI_API_KEY_ID,
    process.env.KALSHI_PRIVATE_KEY_PATH ?? process.env.KALSHI_PRIVATE_KEY,
  );
  await kalshi.authenticate();

  // ── 1. Try the series listing endpoint ─────────────────────────────────────
  console.log('Attempt 1: GET /series (list all series with categories)…');
  try {
    const data = await kalshi.apiGet('series');
    const series: any[] = data.series ?? data ?? [];
    console.log(`  Got ${series.length} series.`);

    const byCat = new Map<string, string[]>();
    for (const s of series) {
      const cat = String(s.category ?? 'Unknown');
      if (!byCat.has(cat)) byCat.set(cat, []);
      byCat.get(cat)!.push(s.ticker ?? s.series_ticker ?? '?');
    }

    console.log('\n  Categories found:');
    for (const [cat, tickers] of [...byCat.entries()].sort((a, b) => b[1].length - a[1].length)) {
      console.log(`    ${String(tickers.length).padStart(4)}  ${cat}`);
    }

    // Print tickers in weather-ish categories
    const WEATHER_CAT = /climate|weather|temperature/i;
    console.log('\n  Series tickers in weather-related categories:');
    let firstWeatherTicker: string | null = null;
    for (const [cat, tickers] of byCat.entries()) {
      if (WEATHER_CAT.test(cat)) {
        console.log(`    [${cat}] → ${tickers.join(', ')}`);
        if (!firstWeatherTicker) firstWeatherTicker = tickers[0];
      }
    }

    // Also print any ticker that looks weathery regardless of category
    const WEATHER_TICK = /HIGH|LOW|TEMP|RAIN|SNOW|WEATHER|CLIMATE|HOT|COLD|PRECIP/i;
    const weatherTickers = series
      .map((s) => s.ticker ?? s.series_ticker ?? '')
      .filter((t: string) => WEATHER_TICK.test(t));
    if (weatherTickers.length) {
      console.log('\n  Weather-looking series tickers (by name):');
      console.log('    ' + weatherTickers.join(', '));
      if (!firstWeatherTicker) firstWeatherTicker = weatherTickers[0];
    }

    // ── 2. Pull sample markets from the first weather series ──────────────────
    if (firstWeatherTicker) {
      console.log(`\nAttempt 2: sample markets from series "${firstWeatherTicker}"…`);
      await printSeriesMarkets(kalshi, firstWeatherTicker);
    }
  } catch (e: any) {
    console.log(`  /series failed: ${e.message}`);
  }

  // ── 3. Fallback: try common weather series tickers directly ─────────────────
  console.log('\nAttempt 3: probing common weather series tickers directly…');
  const candidates = [
    'KXHIGHNY', 'KXHIGHCHI', 'KXHIGHMIA', 'KXHIGHLAX', 'KXHIGHAUS',
    'KXHIGHDEN', 'KXHIGHPHIL', 'HIGHNY', 'HIGHCHI', 'KXHIGHTEMP',
    'KXRAINNYC', 'KXTEMPNY',
  ];
  for (const t of candidates) {
    try {
      const data = await kalshi.apiGet('markets', { series_ticker: t, limit: '2', status: 'open' });
      const markets: any[] = data.markets ?? [];
      if (markets.length > 0) {
        console.log(`  ✓ ${t} → ${markets.length} markets. Example: "${markets[0].title}" | sub: "${markets[0].yes_sub_title ?? ''}"`);
      }
    } catch {
      // ignore misses
    }
  }

  console.log('\nDone.');
}

async function printSeriesMarkets(kalshi: KalshiClient, seriesTicker: string) {
  const data = await kalshi.apiGet('markets', { series_ticker: seriesTicker, limit: '8', status: 'open' });
  const markets: any[] = data.markets ?? [];
  console.log(`  ${markets.length} markets in ${seriesTicker}:`);
  console.log('  ' + '─'.repeat(78));
  for (const m of markets) {
    const yesProb = (((m.yes_bid_dollars ?? 0) + (m.yes_ask_dollars ?? 0)) / 2 * 100).toFixed(0);
    console.log(`  TICKER : ${m.ticker}`);
    console.log(`  TITLE  : ${m.title}`);
    console.log(`  YES-SUB: ${m.yes_sub_title ?? '(none)'}`);
    console.log(`  YES    : ${yesProb}%   |   closes: ${m.close_time}`);
    console.log('  ' + '─'.repeat(78));
  }
}

main().catch((err) => {
  console.error('Error:', err.message ?? err);
  process.exit(1);
});
