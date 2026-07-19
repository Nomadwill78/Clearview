"""
kalshi_advisor.py
─────────────────
Kalshi "safer bets" advisor — filter, score, and size positions.

Drop-in usage:
    from kalshi_advisor import SafeBetConfig, recommend_safer_bets
    cfg = SafeBetConfig()
    recs = recommend_safer_bets(your_markets_list, cfg)

Replace get_subjective_prob() with your own model when you're ready.
No external dependencies beyond the standard library.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any


# ─────────────────────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class SafeBetConfig:
    """All tunable parameters in one place. Edit defaults or pass overrides."""

    # ── Gate filters (hard pass/fail — all must pass) ──────────────────────
    MIN_CONSENSUS: float = 0.65       # implied prob must be ≥ this
    MAX_CONSENSUS: float = 0.90       # implied prob must be ≤ this (avoid over-priced)
    MIN_HOURS_TO_EXPIRY: float = 6.0  # skip markets that resolve too soon
    MAX_HOURS_TO_EXPIRY: float = 240.0
    MAX_SPREAD_CENTS: int = 5
    MIN_VOLUME_24H: int = 300

    # ── Bankroll / risk ────────────────────────────────────────────────────
    BANKROLL_USD: float = 2000.0
    MAX_FRACTION_PER_TRADE: float = 0.05   # hard cap: never risk > 5 % per bet
    FRACTIONAL_KELLY: float = 0.25         # quarter-Kelly dampens Kelly volatility

    # ── Output ─────────────────────────────────────────────────────────────
    TOP_N_RECOMMENDATIONS: int = 10


# ─────────────────────────────────────────────────────────────────────────────
# Market view — normalised representation consumed by the pipeline
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class MarketView:
    """
    Normalised market snapshot.

    Derived fields (implied_p, hours_to_expiry) are populated by
    filter_candidates(); they start at 0.0.
    """

    ticker: str
    title: str
    yes_price: float        # 0–1 (probability). Use from_dict() for auto-normalisation.
    no_price: float         # 0–1
    spread_cents: float
    volume_24h: float
    expiry_ts: float        # Unix timestamp

    # Populated by filter_candidates
    implied_p: float = 0.0
    hours_to_expiry: float = 0.0

    raw: dict = field(default_factory=dict, repr=False)

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> MarketView:
        """
        Build a MarketView from a raw API dict.

        Accepted keys:
            ticker, title or question,
            yes_price (0-1 or 0-100), no_price (0-1 or 0-100),
            spread_cents, volume_24h, expiry_ts (Unix seconds)
        """
        yes_raw = float(d.get("yes_price", 0) or 0)
        no_raw  = float(d.get("no_price",  0) or 0)

        # Auto-normalise cents (e.g. 88) → probability (0.88)
        yes_price = yes_raw / 100 if yes_raw > 1 else yes_raw
        no_price  = no_raw  / 100 if no_raw  > 1 else no_raw

        return cls(
            ticker=str(d.get("ticker", "")),
            title=str(d.get("title") or d.get("question", "")),
            yes_price=yes_price,
            no_price=no_price,
            spread_cents=float(d.get("spread_cents", 0) or 0),
            volume_24h=float(d.get("volume_24h", 0) or 0),
            expiry_ts=float(d.get("expiry_ts", 0) or 0),
            raw=d,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Step 1 — Hard-gate filter
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class FilterStats:
    total: int = 0
    passed: int = 0
    failed_consensus: int = 0
    failed_time: int = 0
    failed_spread: int = 0
    failed_volume: int = 0

    def __str__(self) -> str:
        return (
            f"  {self.total} markets screened → {self.passed} passed\n"
            f"  ✗ consensus gate : {self.failed_consensus}\n"
            f"  ✗ time gate      : {self.failed_time}\n"
            f"  ✗ spread gate    : {self.failed_spread}\n"
            f"  ✗ volume gate    : {self.failed_volume}"
        )


def filter_candidates(
    markets: list[dict[str, Any]],
    cfg: SafeBetConfig,
    _now: float | None = None,
) -> tuple[list[MarketView], FilterStats]:
    """
    Convert raw market dicts to MarketViews and apply all hard gates.

    Returns (candidates, stats). Pass _now (Unix ts) to override the clock
    in tests.
    """
    now = _now if _now is not None else time.time()
    stats = FilterStats(total=len(markets))
    candidates: list[MarketView] = []

    for raw in markets:
        mv = MarketView.from_dict(raw)
        mv.implied_p = mv.yes_price
        mv.hours_to_expiry = max(0.0, (mv.expiry_ts - now) / 3600)

        # Gate 1 — consensus window
        if not (cfg.MIN_CONSENSUS <= mv.implied_p <= cfg.MAX_CONSENSUS):
            stats.failed_consensus += 1
            continue

        # Gate 2 — time window
        if not (cfg.MIN_HOURS_TO_EXPIRY <= mv.hours_to_expiry <= cfg.MAX_HOURS_TO_EXPIRY):
            stats.failed_time += 1
            continue

        # Gate 3 — spread
        if mv.spread_cents > cfg.MAX_SPREAD_CENTS:
            stats.failed_spread += 1
            continue

        # Gate 4 — 24h volume
        if mv.volume_24h < cfg.MIN_VOLUME_24H:
            stats.failed_volume += 1
            continue

        stats.passed += 1
        candidates.append(mv)

    return candidates, stats


# ─────────────────────────────────────────────────────────────────────────────
# Step 2 — Subjective probability  ← REPLACE THIS WITH YOUR MODEL
# ─────────────────────────────────────────────────────────────────────────────

def get_subjective_prob(market: MarketView) -> float:
    """
    Return YOUR probability estimate for the YES outcome (0–1).

    *** REPLACE the body of this function with your own model. ***

    Ideas:
      - NLP on market.title to detect historically mis-priced event types
      - External data feeds (poll averages, economic forecasts, sports models)
      - Historical base rates from resolved Kalshi markets

    Current behaviour: returns implied_p unchanged → edge = 0 for all markets.
    With zero edge, all scores = 0 and all Kelly stakes = 0. That is intentional
    — it forces you to supply real signal before the tool recommends any bet.
    """
    return market.implied_p


# ─────────────────────────────────────────────────────────────────────────────
# Step 3 — Scoring (among gate survivors)
# ─────────────────────────────────────────────────────────────────────────────

def _liquidity_score(market: MarketView) -> float:
    if market.spread_cents <= 3 and market.volume_24h >= 1000:
        return 1.0
    if market.spread_cents <= 5 and market.volume_24h >= 300:
        return 0.7
    return 0.4


def _time_score(market: MarketView) -> float:
    if market.hours_to_expiry <= 72:
        return 1.0
    if market.hours_to_expiry <= 240:
        return 0.7
    return 0.4


def _consensus_bonus(p: float) -> float:
    if 0.70 <= p <= 0.85:
        return 1.0
    if 0.65 <= p <= 0.90:
        return 0.7
    return 0.3


def score_market(market: MarketView, _cfg: SafeBetConfig | None = None) -> float:
    """
    Composite score for a gate-passing market.

        score = max(0, edge) × 100 × liquidity × time × consensus_bonus

    A market with no positive edge scores exactly 0. When get_subjective_prob
    is the default placeholder, every market scores 0 — that is correct and
    expected until you supply a real probability model.
    """
    q    = get_subjective_prob(market)
    edge = q - market.implied_p

    return (
        max(0.0, edge)
        * 100
        * _liquidity_score(market)
        * _time_score(market)
        * _consensus_bonus(market.implied_p)
    )


# ─────────────────────────────────────────────────────────────────────────────
# Step 4 — Position sizing (fractional Kelly)
# ─────────────────────────────────────────────────────────────────────────────

def recommended_stake(market: MarketView, cfg: SafeBetConfig) -> float:
    """
    Fractional Kelly stake in USD.

    Returns 0.0 when:
      - The market price is at 0 or 1 (degenerate case)
      - Kelly fraction is negative (no edge)

    Hard cap: stake is never more than cfg.MAX_FRACTION_PER_TRADE × BANKROLL_USD.

    Diversification note: Kelly is computed independently per market. If you
    hold many positions simultaneously, total exposure can exceed a safe level.
    Consider also capping the sum of all stakes externally.
    """
    p = market.implied_p
    q = get_subjective_prob(market)

    if p <= 0.0 or p >= 1.0:
        return 0.0

    # Decimal odds for $1 YES contract: win (1-p)/p, lose 1
    b = (1.0 - p) / p

    # Full Kelly fraction
    kelly = (q * (1.0 + b) - 1.0) / b

    if kelly <= 0.0:
        return 0.0

    fraction = min(kelly * cfg.FRACTIONAL_KELLY, cfg.MAX_FRACTION_PER_TRADE)
    return round(cfg.BANKROLL_USD * fraction, 2)


# ─────────────────────────────────────────────────────────────────────────────
# Step 5 — Top-level pipeline
# ─────────────────────────────────────────────────────────────────────────────

def recommend_safer_bets(
    markets: list[dict[str, Any]],
    cfg: SafeBetConfig,
    verbose: bool = True,
) -> list[dict[str, Any]]:
    """
    Full pipeline: filter → score → size → sort → top N.

    When scores are tied (e.g. all 0 because get_subjective_prob is default),
    markets are sorted by implied_p descending as a secondary key so the
    highest-confidence markets surface first.

    Args:
        markets: raw list from your Kalshi API client
        cfg:     SafeBetConfig instance
        verbose: print gate stats to stdout

    Returns:
        list of dicts — one per recommendation, ready for display or storage
    """
    candidates, stats = filter_candidates(markets, cfg)

    if verbose:
        print(str(stats))

    if not candidates:
        return []

    scored = [
        (score_market(m, cfg), m)
        for m in candidates
    ]
    # Primary: score desc. Secondary: implied_p desc (tiebreak when all scores = 0)
    scored.sort(key=lambda x: (x[0], x[1].implied_p), reverse=True)

    results = []
    for score, mv in scored[: cfg.TOP_N_RECOMMENDATIONS]:
        q     = get_subjective_prob(mv)
        stake = recommended_stake(mv, cfg)
        results.append({
            "ticker":                mv.ticker,
            "title":                 mv.title,
            "yes_price":             mv.yes_price,
            "implied_p":             round(mv.implied_p, 4),
            "subjective_q":          round(q, 4),
            "edge":                  round(q - mv.implied_p, 4),
            "spread_cents":          mv.spread_cents,
            "volume_24h":            mv.volume_24h,
            "hours_to_expiry":       round(mv.hours_to_expiry, 1),
            "score":                 round(score, 4),
            "recommended_stake_usd": stake,
        })

    return results


# ─────────────────────────────────────────────────────────────────────────────
# Example — replace mock_markets with your Kalshi API call
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    cfg = SafeBetConfig(
        MIN_CONSENSUS=0.65,
        MAX_CONSENSUS=0.90,
        MIN_HOURS_TO_EXPIRY=6,
        MAX_HOURS_TO_EXPIRY=240,
        MAX_SPREAD_CENTS=5,
        MIN_VOLUME_24H=300,
        BANKROLL_USD=2000.0,
        MAX_FRACTION_PER_TRADE=0.05,
        FRACTIONAL_KELLY=0.25,
        TOP_N_RECOMMENDATIONS=10,
    )

    now = time.time()

    # ── Swap this block for: markets = kalshi_client.get_markets(status="active")
    mock_markets: list[dict[str, Any]] = [
        {
            "ticker": "FED-HOLD-JUL",
            "title": "Will the Fed hold rates at the July meeting?",
            "yes_price": 0.87,          # 87 % implied
            "no_price": 0.13,
            "spread_cents": 2,
            "volume_24h": 8200,
            "expiry_ts": now + 36 * 3600,   # 36 h from now ✓
        },
        {
            "ticker": "BTC-ABOVE-60K",
            "title": "Bitcoin closes above $60K today",
            "yes_price": 0.52,           # 52 % — below MIN_CONSENSUS → filtered
            "no_price": 0.48,
            "spread_cents": 4,
            "volume_24h": 15_000,
            "expiry_ts": now + 18 * 3600,
        },
        {
            "ticker": "CPI-BELOW-3",
            "title": "CPI prints below 3.0 % this month",
            "yes_price": 0.78,
            "no_price": 0.22,
            "spread_cents": 3,
            "volume_24h": 4_500,
            "expiry_ts": now + 60 * 3600,   # 60 h ✓
        },
        {
            "ticker": "JOBS-ABOVE-150K",
            "title": "Non-farm payrolls exceed 150 K",
            "yes_price": 0.91,           # above MAX_CONSENSUS → filtered
            "no_price": 0.09,
            "spread_cents": 1,
            "volume_24h": 12_000,
            "expiry_ts": now + 24 * 3600,
        },
        {
            "ticker": "OIL-BELOW-80",
            "title": "WTI crude closes below $80 this week",
            "yes_price": 0.72,
            "no_price": 0.28,
            "spread_cents": 6,           # above MAX_SPREAD_CENTS → filtered
            "volume_24h": 2_200,
            "expiry_ts": now + 120 * 3600,
        },
        {
            "ticker": "SENATE-BUDGET",
            "title": "Senate passes the budget resolution",
            "yes_price": 0.68,
            "no_price": 0.32,
            "spread_cents": 4,
            "volume_24h": 980,
            "expiry_ts": now + 72 * 3600,   # 72 h ✓
        },
    ]
    # ── End mock data ─────────────────────────────────────────────────────────

    print(f"\n{'═' * 68}")
    print(f"  KALSHI SAFER BETS — gate screening")
    print(f"{'═' * 68}")

    recommendations = recommend_safer_bets(mock_markets, cfg, verbose=True)

    if not recommendations:
        print("\n  No markets passed all gates.")
    else:
        print(f"\n{'─' * 68}")
        for i, r in enumerate(recommendations, 1):
            edge_str = f"{r['edge']:+.1%}" if r["edge"] != 0 else "0.0 % (placeholder model)"
            print(f"\n#{i}  {r['title']}")
            print(f"    Ticker   : {r['ticker']}")
            print(f"    Implied  : {r['implied_p']:.1%}  │  Subjective: {r['subjective_q']:.1%}  │  Edge: {edge_str}")
            print(f"    Spread   : {int(r['spread_cents'])}¢  │  24h vol: {int(r['volume_24h']):,}  │  Expires in: {r['hours_to_expiry']}h")
            print(f"    Score    : {r['score']:.4f}  │  Stake: ${r['recommended_stake_usd']:.2f}")

    print(f"\n{'─' * 68}")
    print("  NOTE: Scores and stakes are 0 until you implement get_subjective_prob().")
    print("  Replace that function's body with your probability model.")
    print(f"{'═' * 68}\n")
