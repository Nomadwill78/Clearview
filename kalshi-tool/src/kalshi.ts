import { KalshiAuthResponse, KalshiMarket, KalshiMarketsResponse } from './types';

const BASE_URL = 'https://api.elections.kalshi.com/trade-api/v2';

export class KalshiClient {
  private token: string | null = null;
  private apiKeyId: string | null = null;

  constructor(
    private readonly email?: string,
    private readonly password?: string,
    apiKeyId?: string,
  ) {
    this.apiKeyId = apiKeyId ?? null;
  }

  async authenticate(): Promise<void> {
    if (this.apiKeyId) {
      // API key auth — token isn't needed; auth header set per-request
      return;
    }

    if (!this.email || !this.password) {
      throw new Error(
        'Provide KALSHI_EMAIL + KALSHI_PASSWORD, or KALSHI_API_KEY_ID in your .env',
      );
    }

    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: this.email, password: this.password }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Kalshi login failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as KalshiAuthResponse;
    this.token = data.token;
    console.log('✓ Authenticated with Kalshi');
  }

  private authHeaders(): Record<string, string> {
    if (this.token) {
      return { Authorization: this.token };
    }
    if (this.apiKeyId) {
      // Basic API-key header — full HMAC signing can be added here if needed
      return { 'KALSHI-ACCESS-KEY': this.apiKeyId };
    }
    throw new Error('Not authenticated. Call authenticate() first.');
  }

  async fetchOpenMarkets(options: {
    limit?: number;
    maxPages?: number;
    minVolume?: number;
  } = {}): Promise<KalshiMarket[]> {
    const { limit = 200, maxPages = 10, minVolume = 0 } = options;
    const markets: KalshiMarket[] = [];
    let cursor: string | undefined;
    let page = 0;

    while (page < maxPages) {
      const params = new URLSearchParams({
        status: 'open',
        limit: String(limit),
        ...(cursor ? { cursor } : {}),
      });

      const res = await fetch(`${BASE_URL}/markets?${params}`, {
        headers: {
          ...this.authHeaders(),
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Kalshi markets fetch failed (${res.status}): ${body}`);
      }

      const data = (await res.json()) as KalshiMarketsResponse;
      const batch = data.markets ?? [];

      for (const m of batch) {
        if (m.volume >= minVolume) {
          markets.push(m);
        }
      }

      cursor = data.cursor;
      page++;

      // Stop if no more pages
      if (!cursor || batch.length === 0) break;

      // Polite rate-limit delay
      await sleep(200);
    }

    return markets;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
