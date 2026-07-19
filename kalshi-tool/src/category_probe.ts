import 'dotenv/config';
import { KalshiClient } from './kalshi';

// Diagnostic: can we reach Kalshi's politics/entertainment markets efficiently
// via the /events endpoint (filtered by category), instead of drowning in the
// 60k auto-generated sports parlay markets?
async function main() {
  const kalshi = new KalshiClient(
    process.env.KALSHI_EMAIL,
    process.env.KALSHI_PASSWORD,
    process.env.KALSHI_API_KEY_ID,
    process.env.KALSHI_PRIVATE_KEY_PATH ?? process.env.KALSHI_PRIVATE_KEY,
  );
  await kalshi.authenticate();

  const TARGET = /politic|election|entertainment|mention|social|world|pop/i;

  // Paginate events, collecting category + ticker + title
  const events: { category: string; ticker: string; title: string }[] = [];
  let cursor: string | undefined;
  let page = 0;
  console.log('Fetching events (status=open)…');
  while (page < 15) {
    const query: Record<string, string> = { status: 'open', limit: '200' };
    if (cursor) query.cursor = cursor;
    let data: any;
    try {
      data = await kalshi.apiGet('events', query);
    } catch (e: any) {
      console.log(`  events fetch error: ${e.message}`);
      break;
    }
    const batch: any[] = data.events ?? [];
    for (const ev of batch) {
      events.push({
        category: String(ev.category ?? 'Unknown'),
        ticker: String(ev.event_ticker ?? ev.ticker ?? ''),
        title: String(ev.title ?? ev.sub_title ?? ''),
      });
    }
    cursor = data.cursor;
    page++;
    if (!cursor || batch.length === 0) break;
  }
  console.log(`Fetched ${events.length} events over ${page} pages.\n`);

  // Category histogram
  const counts = new Map<string, number>();
  for (const e of events) counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
  console.log('Event categories:');
  for (const [cat, n] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)}  ${cat}`);
  }

  // Sample markets from a few target-category events (title + quotes)
  const targetEvents = events.filter((e) => TARGET.test(e.category));
  console.log(`\n${targetEvents.length} events in target categories. Sampling markets:\n${'─'.repeat(80)}`);
  let shown = 0;
  for (const ev of targetEvents) {
    if (shown >= 15) break;
    let data: any;
    try {
      data = await kalshi.apiGet('markets', { event_ticker: ev.ticker, status: 'open', limit: '2' });
    } catch {
      continue;
    }
    const markets: any[] = data.markets ?? [];
    for (const m of markets) {
      const bid = Number(m.yes_bid_dollars) || 0;
      const ask = Number(m.yes_ask_dollars) || 0;
      console.log(`[${ev.category}] ${m.title}`);
      console.log(`   sub: "${m.yes_sub_title ?? ''}"  |  yes bid/ask: ${(bid*100).toFixed(0)}¢/${(ask*100).toFixed(0)}¢  |  vol24h: ${Math.round((Number(m.volume_24h_fp)||0)/100)}`);
      console.log('─'.repeat(80));
      if (++shown >= 15) break;
    }
  }
}

main().catch((err) => {
  console.error('Error:', err.message ?? err);
  process.exit(1);
});
