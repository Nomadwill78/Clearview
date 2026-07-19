import 'dotenv/config';
import { KalshiClient } from './kalshi';

// One-off diagnostic: list Kalshi markets that look weather-related, so we can
// see the real ticker + title + sub-title formats before building a parser.
async function main() {
  const kalshi = new KalshiClient(
    process.env.KALSHI_EMAIL,
    process.env.KALSHI_PASSWORD,
    process.env.KALSHI_API_KEY_ID,
    process.env.KALSHI_PRIVATE_KEY_PATH ?? process.env.KALSHI_PRIVATE_KEY,
  );
  await kalshi.authenticate();

  const markets = await kalshi.fetchOpenMarkets({ maxPages: 25 });
  console.log(`Fetched ${markets.length} active markets total.\n`);

  const WEATHER_HINT = /temp|weather|°|degree|high in|low in|rain|snow|precip|hottest|coldest|climate/i;

  const weather = markets.filter((m) => {
    const t = `${m.ticker} ${m.title} ${m.yes_sub_title ?? ''}`;
    return WEATHER_HINT.test(t);
  });

  console.log(`Found ${weather.length} likely weather markets. Showing up to 40:\n`);
  console.log('─'.repeat(80));

  for (const m of weather.slice(0, 40)) {
    const yesProb = (((m.yes_bid_dollars ?? 0) + (m.yes_ask_dollars ?? 0)) / 2 * 100).toFixed(0);
    console.log(`TICKER : ${m.ticker}`);
    console.log(`TITLE  : ${m.title}`);
    console.log(`YES-SUB: ${m.yes_sub_title ?? '(none)'}`);
    console.log(`YES    : ${yesProb}%   |   closes: ${m.close_time}`);
    console.log('─'.repeat(80));
  }

  // Also show the distinct ticker prefixes so we can spot the weather series
  const prefixes = new Set(weather.map((m) => m.ticker.split('-')[0]));
  console.log('\nDistinct weather ticker prefixes:');
  console.log([...prefixes].join(', '));
}

main().catch((err) => {
  console.error('Error:', err.message ?? err);
  process.exit(1);
});
