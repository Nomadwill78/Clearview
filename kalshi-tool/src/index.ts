import 'dotenv/config';
import { KalshiClient } from './kalshi';
import { findWeatherEdges, WeatherConfig } from './weather';
import { printConsole, saveJson, saveHtml } from './weatherReport';

async function main() {
  const cfg: WeatherConfig = {
    sigma:               parseFloat(process.env.WEATHER_SIGMA         ?? '3'),
    minEdge:             parseFloat(process.env.WEATHER_MIN_EDGE      ?? '0.08'),
    bankrollUsd:         parseFloat(process.env.BANKROLL_USD          ?? '1000'),
    fractionalKelly:     parseFloat(process.env.FRACTIONAL_KELLY      ?? '0.25'),
    maxFractionPerTrade: parseFloat(process.env.MAX_FRACTION_PER_TRADE ?? '0.05'),
    cities: process.env.WEATHER_CITIES
      ? process.env.WEATHER_CITIES.split(',').map((c) => c.trim()).filter(Boolean)
      : undefined,
  };
  const outputDir = process.env.OUTPUT_DIR ?? './reports';

  console.log('🌦  Kalshi Weather Edge');
  console.log(`   Forecast uncertainty: ±${cfg.sigma}°F  |  Min edge: ${(cfg.minEdge * 100).toFixed(0)}%  |  Bankroll: $${cfg.bankrollUsd}`);

  console.log('🔑 Authenticating with Kalshi…');
  const kalshi = new KalshiClient(
    process.env.KALSHI_EMAIL,
    process.env.KALSHI_PASSWORD,
    process.env.KALSHI_API_KEY_ID,
    process.env.KALSHI_PRIVATE_KEY_PATH ?? process.env.KALSHI_PRIVATE_KEY,
  );
  await kalshi.authenticate();

  console.log('📡 Pulling NWS forecasts and Kalshi weather markets…');
  const result = await findWeatherEdges(kalshi, cfg);

  printConsole(result);
  const jsonPath = saveJson(result, outputDir);
  const htmlPath = saveHtml(result, outputDir);
  console.log(`💾 JSON saved to: ${jsonPath}`);
  console.log(`🌐 Open this in your browser:\n   ${htmlPath}\n`);
}

main().catch((err) => {
  console.error('Fatal error:', err.message ?? err);
  process.exit(1);
});
