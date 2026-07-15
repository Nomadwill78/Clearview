import crypto from 'crypto';
import fs from 'fs';
import { KalshiAuthResponse, KalshiMarket, KalshiMarketsResponse } from './types';

const BASE_URL = 'https://api.elections.kalshi.com/trade-api/v2';

export class KalshiClient {
  private token: string | null = null;
  private apiKeyId: string | null = null;
  private privateKeyPem: string | null = null;

  constructor(
    private readonly email?: string,
    private readonly password?: string,
    apiKeyId?: string,
    privateKeyPathOrPem?: string,
  ) {
    this.apiKeyId = apiKeyId ?? null;

    if (privateKeyPathOrPem) {
      // Accept either a file path or a raw PEM string
      if (privateKeyPathOrPem.startsWith('-----BEGIN')) {
        this.privateKeyPem = privateKeyPathOrPem;
      } else {
        this.privateKeyPem = fs.readFileSync(privateKeyPathOrPem, 'utf8');
      }
    }
  }

  async authenticate(): Promise<void> {
    if (this.apiKeyId) {
      if (!this.privateKeyPem) {
        throw new Error(
          'KALSHI_API_KEY_ID is set but KALSHI_PRIVATE_KEY_PATH (or KALSHI_PRIVATE_KEY) is missing.\n' +
          'Set KALSHI_PRIVATE_KEY_PATH to the path of the .txt file Kalshi gave you.',
        );
      }
      console.log('✓ Kalshi API-key auth ready (RSA signing enabled)');
      return;
    }

    if (!this.email || !this.password) {
      throw new Error(
        'Provide KALSHI_EMAIL + KALSHI_PASSWORD, or KALSHI_API_KEY_ID + KALSHI_PRIVATE_KEY_PATH in your .env',
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
    console.log('✓ Authenticated with Kalshi (email/password)');
  }

  private authHeaders(method: string, path: string): Record<string, string> {
    if (this.token) {
      return { Authorization: this.token };
    }

    if (this.apiKeyId && this.privateKeyPem) {
      const timestamp = String(Date.now());
      const signature = this.signRequest(timestamp, method, path);
      return {
        'KALSHI-ACCESS-KEY': this.apiKeyId,
        'KALSHI-ACCESS-TIMESTAMP': timestamp,
        'KALSHI-ACCESS-SIGNATURE': signature,
      };
    }

    throw new Error('Not authenticated. Call authenticate() first.');
  }

  // Kalshi signature: RSA-SHA256 of "<timestamp><METHOD><path>"
  // Path must be the raw path without query string, e.g. "/trade-api/v2/markets"
  private signRequest(timestamp: string, method: string, path: string): string {
    const message = timestamp + method.toUpperCase() + path;
    const sign = crypto.createSign('SHA256');
    sign.update(message);
    sign.end();
    return sign.sign(this.privateKeyPem!, 'base64');
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
    const apiPath = '/trade-api/v2/markets';

    while (page < maxPages) {
      const params = new URLSearchParams({
        status: 'open',
        limit: String(limit),
        ...(cursor ? { cursor } : {}),
      });

      const res = await fetch(`${BASE_URL}/markets?${params}`, {
        headers: {
          ...this.authHeaders('GET', apiPath),
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

      if (!cursor || batch.length === 0) break;

      await sleep(200);
    }

    return markets;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
