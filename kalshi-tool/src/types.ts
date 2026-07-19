export interface KalshiMarket {
  ticker: string;
  event_ticker: string;
  title: string;
  yes_sub_title?: string;
  no_sub_title?: string;
  category?: string;
  event_title?: string;
  status: string;
  // Prices in dollars (0.0–1.0 range = probability)
  yes_bid_dollars: number;
  yes_ask_dollars: number;
  no_bid_dollars: number;
  no_ask_dollars: number;
  last_price_dollars: number;
  previous_yes_bid_dollars?: number;
  previous_yes_ask_dollars?: number;
  // Volume / liquidity (fixed-point integers — divide by 100 for contracts)
  volume_fp: number;
  volume_24h_fp: number;
  open_interest_fp: number;
  liquidity_dollars: number;
  // Timing
  close_time: string;
  open_time: string;
  expected_expiration_time?: string;
  expiration_time?: string;
  // Other
  market_type?: string;
  result?: string;
  notional_value_dollars?: number;
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

// ── Cross-market (Polymarket) comparison ────────────────────────────────────

export interface PolymarketMarket {
  question: string;
  yesPrice: number;     // 0–1 probability
  volume24h: number;
  liquidity: number;
  endDate: string;
  spreadCents: number;
  slug: string;
  url: string;
}

export interface DivergenceRow {
  kalshiTicker: string;
  kalshiTitle: string;
  kalshiYes: number;          // 0–1
  kalshiVol24h: number;       // contracts
  polyQuestion: string;
  polyYes: number;            // 0–1, aligned to the Kalshi YES direction
  polyVol24h: number;
  polyUrl: string;
  gapPoints: number;          // absolute difference in percentage points
  richerSide: 'KALSHI' | 'POLYMARKET';  // which venue prices YES higher
  confidence: 'high' | 'medium' | 'low';
  daysToClose: number;
  rankScore: number;
}

export interface DivergenceReport {
  generatedAt: string;
  weekOf: string;
  kalshiPoolSize: number;
  polyPoolSize: number;
  matchChecks: number;
  matchesFound: number;
  rows: DivergenceRow[];
}
