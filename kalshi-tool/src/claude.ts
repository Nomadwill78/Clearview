import Anthropic from '@anthropic-ai/sdk';
import { ScoredMarket } from './types';

const client = new Anthropic();

export async function explainSafeBet(market: ScoredMarket): Promise<string> {
  const { safetyDetails: d, recommendedPosition, recommendedEntry, title } = market;

  const dominantProb = Math.max(d.midPrice, 1 - d.midPrice);
  const outcomeLabel = recommendedPosition === 'YES'
    ? (market.yes_sub_title ?? 'YES')
    : (market.no_sub_title ?? 'NO');

  const prompt = `You are a prediction market analyst. Explain in 2–3 sentences why this Kalshi market is a relatively safe bet this week.

Market: "${title}"
Recommended position: ${recommendedPosition} ("${outcomeLabel}")
Entry price: ${recommendedEntry}¢  (implied probability: ${(dominantProb * 100).toFixed(1)}%)
Days until resolution: ${d.daysToClose.toFixed(1)}
Volume: ${d.rawVolume.toLocaleString()} contracts
Open interest: ${d.rawOpenInterest.toLocaleString()} contracts
Bid-ask spread: ${d.spread}¢
Safety score: ${(market.safetyScore * 100).toFixed(1)}/100

Focus on:
1. Why the outcome is likely (concrete reasoning about the event)
2. What gives this market reliable pricing (liquidity, volume, tight spread)
3. Any caveat or residual risk a bettor should know

Be specific and direct. No preamble like "This market is safe because". Start with the key reason.`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    return 'Explanation unavailable.';
  }
  return content.text.trim();
}

export async function generateWeeklySummary(
  markets: ScoredMarket[],
  totalAnalyzed: number,
): Promise<string> {
  const topTitles = markets
    .slice(0, 5)
    .map((m, i) => `${i + 1}. ${m.title} (${m.recommendedPosition} @ ${m.recommendedEntry}¢)`)
    .join('\n');

  const prompt = `You are a prediction market analyst. Write a 3-sentence weekly overview of the safest Kalshi bets this week.

Analyzed ${totalAnalyzed} open markets and surfaced these top picks:
${topTitles}

Keep it punchy and actionable. Mention the general themes (economic, political, sports, etc.) and risk level.`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    return 'Summary unavailable.';
  }
  return content.text.trim();
}
