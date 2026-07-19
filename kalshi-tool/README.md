# Kalshi ↔ Polymarket Divergence Finder

Finds prediction markets where **Kalshi and Polymarket disagree on the same event**. When the two biggest prediction markets price an identical outcome differently, one side is likely mispriced — and that gap is the closest thing to a real edge a regular bettor can find.

Each run produces a ranked, browser-readable report of these divergences.

## How it works

1. Fetches all liquid **Kalshi** markets (your authenticated API key)
2. Fetches all liquid **Polymarket** markets (free public API — no key needed)
3. Text-matches markets that look like the same event (cheap prefilter)
4. Uses **Claude** to confirm each match is truly the same wager, and flags whether the YES sides are aligned or inverted
5. Compares the two prices and reports the biggest gaps, ranked by size × match-confidence × liquidity

## Setup

```bash
cd kalshi-tool
npm install
cp .env.example .env      # then edit .env with your keys
```

You need:
- **Kalshi API key** — key ID + the private-key `.txt` file (Settings → API Keys in Kalshi)
- **Anthropic API key** — required; it powers the market matching ([console.anthropic.com](https://console.anthropic.com))

## Run

```bash
npm start
```

Outputs to `./reports/`:
- **`divergences-<week>.html`** ← open this in your browser (the main deliverable)
- `divergences-<week>.json` ← raw data

## Reading the report

Each card shows one event both venues cover, with:
- **Gap** — how many percentage points apart the two prices are (bigger = more potential edge)
- **Match confidence** — high / medium / low, how sure the AI is that both rows are the same wager. **Always click through and read both markets' rules on a low-confidence match.**
- Both venues' YES prices, and which one prices it lower
- A direct link to the Polymarket market

## Configuration (`.env`)

| Variable | Default | Meaning |
|---|---|---|
| `KALSHI_MIN_VOLUME_24H` | `200` | Min Kalshi 24h volume (contracts) |
| `POLY_MIN_VOLUME_24H` | `500` | Min Polymarket 24h volume (USD) |
| `MIN_GAP_POINTS` | `5` | Only report gaps at least this wide |
| `MAX_DAYS_TO_CLOSE` | `180` | Ignore markets resolving further out |
| `MAX_MATCH_CHECKS` | `60` | Max AI checks per run (controls cost) |
| `TOP_N_MARKETS` | `15` | How many divergences to show |

## Important

This tool **surfaces price differences — it does not guarantee winning bets.** Two markets can legitimately differ because their rules or resolution dates differ slightly, so the AI match is a helpful filter, not proof. Always read both markets yourself before acting. Prediction market trading carries real risk of loss.

## Project structure

```
kalshi-tool/
├── src/
│   ├── index.ts             — main flow: fetch → match → compare → report
│   ├── kalshi.ts            — Kalshi API client (RSA-signed auth)
│   ├── polymarket.ts        — Polymarket public API client
│   ├── match.ts             — text-similarity prefilter
│   ├── claude.ts            — AI match confirmation
│   ├── divergenceReport.ts  — console + HTML + JSON output
│   └── types.ts             — shared types
├── kalshi_advisor.py        — standalone Python advisor (Kelly sizing, separate tool)
└── .env.example
```
