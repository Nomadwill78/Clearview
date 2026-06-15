# Kalshi Safe Bets

A weekly CLI tool that scans all open Kalshi prediction markets, scores them for "safety", and uses Claude AI to explain why each pick makes sense.

## What "safe" means

A market is considered safe when multiple signals align:

| Signal | Weight | What it measures |
|---|---|---|
| **Probability skew** | 40% | How far the current price is from 50/50. A 90¢ YES = market is 90% confident. |
| **Liquidity** | 30% | Volume + open interest. High-traffic markets have more reliable prices. |
| **Bid-ask spread** | 20% | Tighter spread = more efficient pricing. Wide spreads signal uncertainty. |
| **Time to resolution** | 10% | Prefer markets resolving in 1–30 days — enough time for the outcome to be clear, not so long that things can flip. |

Markets are only surfaced if the dominant outcome has ≥ 65% implied probability (configurable).

## Setup

### 1. Install dependencies

```bash
cd kalshi-tool
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

You need:
- **Kalshi credentials** — either email/password or an API key (create one in Kalshi dashboard → Settings → API Keys)
- **Anthropic API key** — for Claude-powered explanations ([get one here](https://console.anthropic.com))

### 3. Run

```bash
npm start
```

Output is printed to the console **and** saved as a JSON file in `./reports/`.

## Configuration

All settings live in `.env`:

| Variable | Default | Description |
|---|---|---|
| `KALSHI_EMAIL` | — | Your Kalshi account email |
| `KALSHI_PASSWORD` | — | Your Kalshi password |
| `KALSHI_API_KEY_ID` | — | API key ID (alternative to email/password) |
| `ANTHROPIC_API_KEY` | — | Claude API key for explanations |
| `TOP_N_MARKETS` | `10` | How many safe bets to surface |
| `MIN_VOLUME` | `1000` | Minimum volume to consider a market |
| `MIN_PROBABILITY_SKEW` | `0.65` | Minimum dominant probability (e.g., 0.65 = 65¢ YES/NO) |
| `OUTPUT_DIR` | `./reports` | Where to save JSON reports |

## Automate weekly runs

**macOS/Linux cron** — every Monday at 8 AM:
```
0 8 * * 1 cd /path/to/kalshi-tool && npm start >> ~/kalshi-reports.log 2>&1
```

**GitHub Actions** — add `.github/workflows/kalshi-weekly.yml` (see below):
```yaml
on:
  schedule:
    - cron: '0 8 * * 1'  # Every Monday at 8 AM UTC
  workflow_dispatch:       # Manual trigger too

jobs:
  safe-bets:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install
        working-directory: kalshi-tool
      - run: npm start
        working-directory: kalshi-tool
        env:
          KALSHI_EMAIL: ${{ secrets.KALSHI_EMAIL }}
          KALSHI_PASSWORD: ${{ secrets.KALSHI_PASSWORD }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

## Example output

```
╔══════════════════════════════════════════════════════════════════════╗
║            KALSHI SAFE BETS — WEEK OF 2026-06-15                    ║
╚══════════════════════════════════════════════════════════════════════╝

This week's safest markets skew heavily toward near-certain economic
outcomes. Fed rate decisions and monthly jobs numbers dominate the top
picks, with >85% implied probabilities and deep liquidity.

────────────────────────────────────────────────────────────────────────

#1  Will the Fed hold rates at the June meeting?
     Ticker: FED-26JUN-R5.25  |  Category: Economics
     Position: YES @ 91¢  |  Implied prob: 91.5%  |  Resolves: 12 days
     Safety score: 88.3/100  |  Volume: 48,321  |  Spread: 2¢

     Fed futures pricing and recent FOMC minutes strongly suggest no
     move at the June meeting. Deep market liquidity (48k contracts,
     2¢ spread) makes this pricing highly reliable. Main risk: a
     surprise inflation print this week.
```

## Project structure

```
kalshi-tool/
├── src/
│   ├── index.ts    — CLI entry point, orchestrates the full flow
│   ├── kalshi.ts   — Kalshi REST API client (auth + market fetching)
│   ├── scoring.ts  — Safety scoring algorithm (4-factor weighted score)
│   ├── claude.ts   — Claude AI integration (per-market explanations + summary)
│   ├── report.ts   — Report building, file saving, console output
│   └── types.ts    — TypeScript type definitions
├── .env.example    — Config template
├── package.json
└── tsconfig.json
```
