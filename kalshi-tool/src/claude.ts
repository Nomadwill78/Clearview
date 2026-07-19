import Anthropic from '@anthropic-ai/sdk';
import { ScoredMarket } from './types';

const client = new Anthropic();

export interface MatchVerdict {
  index: number;                          // chosen candidate index, or -1 for none
  confidence: 'high' | 'medium' | 'low';
  inverted: boolean;                      // true if Polymarket YES = Kalshi NO
}

// Ask Claude to confirm which Polymarket candidate (if any) is the SAME event
// as a Kalshi market, and whether the YES sides point the same direction.
export async function confirmMatch(
  kalshiTitle: string,
  candidateQuestions: string[],
): Promise<MatchVerdict> {
  if (candidateQuestions.length === 0) {
    return { index: -1, confidence: 'low', inverted: false };
  }

  const list = candidateQuestions.map((c, i) => `${i}. ${c}`).join('\n');
  const prompt = `A Kalshi market and several Polymarket markets are below. Pick which Polymarket market, if any, is about the EXACT same real-world event with the same resolution criteria and timeframe as the Kalshi market.

Kalshi market:
"${kalshiTitle}"

Polymarket candidates:
${list}

Rules:
- Only match if a bettor would consider them the same wager. Similar topic is NOT enough.
- "inverted" is true when the Polymarket "Yes" corresponds to the Kalshi "No" (opposite phrasing).
- If nothing truly matches, return index -1.

Respond with ONLY strict JSON, no other text:
{"index": <number or -1>, "confidence": "high"|"medium"|"low", "inverted": <true|false>}`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 80,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') return { index: -1, confidence: 'low', inverted: false };

  try {
    const json = JSON.parse(extractJson(content.text));
    const index = Number.isInteger(json.index) ? json.index : -1;
    const confidence = ['high', 'medium', 'low'].includes(json.confidence) ? json.confidence : 'low';
    return { index, confidence, inverted: Boolean(json.inverted) };
  } catch {
    return { index: -1, confidence: 'low', inverted: false };
  }
}

function extractJson(text: string): string {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return '{}';
  return text.slice(start, end + 1);
}

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
  stats: { total: number; passedGates: number; failedConsensus: number; failedTime: number; failedLiquidity: number },
): Promise<string> {
  const topTitles = markets
    .slice(0, 5)
    .map((m, i) => {
      const prob = Math.max(m.safetyDetails.midPrice, 1 - m.safetyDetails.midPrice);
      return `${i + 1}. ${m.title} — ${m.recommendedPosition} @ ${m.recommendedEntry}¢ (${(prob * 100).toFixed(1)}% implied, resolves in ${(m.safetyDetails.daysToClose * 24).toFixed(0)}h)`;
    })
    .join('\n');

  const prompt = `You are a prediction market analyst. Write a 3-sentence weekly overview of the safest Kalshi bets right now.

Screened ${stats.total} markets through 3 hard gates (≥88% consensus, ≤48h to expiry, ≤2¢ spread + ≥5k 24h volume).
Only ${stats.passedGates} passed. Top picks:
${topTitles}

Be specific about the themes (economic data, sports, politics, etc.) and why these cleared such strict criteria. Keep it punchy.`;

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
