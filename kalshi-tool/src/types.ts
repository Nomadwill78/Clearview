export interface KalshiMarket {
  ticker: string;
  event_ticker: string;
  title: string;
  yes_sub_title?: string;
  no_sub_title?: string;
  category: string;
  yes_bid: number;
  yes_ask: number;
  no_bid: number;
  no_ask: number;
  volume: number;
  volume_24h: number;
  open_interest: number;
  close_time: string;
  expected_expiration_time?: string;
  status: string;
  liquidity: number;
  last_price: number;
  notional_value?: number;
}

export interface SafetyDetails {
  probabilityScore: number;
  liquidityScore: number;
  spreadScore: number;
  timeScore: number;
  midPrice: number;
  daysToClose: number;
  spread: number;
  rawVolume: number;
  rawOpenInterest: number;
}

export interface ScoredMarket extends KalshiMarket {
  safetyScore: number;
  safetyDetails: SafetyDetails;
  recommendedPosition: 'YES' | 'NO';
  recommendedEntry: number;
  explanation?: string;
}

export interface WeeklyReport {
  generatedAt: string;
  weekOf: string;
  totalMarketsAnalyzed: number;
  topSafeBets: ScoredMarket[];
  summary: string;
}

export interface KalshiAuthResponse {
  token: string;
  member_id: string;
}

export interface KalshiMarketsResponse {
  markets: KalshiMarket[];
  cursor?: string;
}
