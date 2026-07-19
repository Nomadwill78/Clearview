# Kalshi Edge Tools

Two ways to find mispriced Kalshi markets:

1. **Weather Edge** (`npm start`) — compares the official National Weather Service forecast to Kalshi's daily temperature markets. Objective, data-backed, no AI needed.
2. **Polymarket Divergence** (`npm run divergence`) — flags events where Kalshi and Polymarket price the same outcome differently.

Both output a clean, browser-readable HTML report to `./reports/`.

---

## Weather Edge (the main tool)

Kalshi runs daily high-temperature markets for several cities, split into temperature bins (e.g. "90° to 91°", "92° or above"). This tool:

1. Pulls the **NWS forecast high** for each city (free, no API key)
2. Turns that single forecast into a probability across every bin (normal distribution around the forecast, ±`WEATHER_SIGMA`°F)
3. Compares the model's probability to Kalshi's price for each bin
4. Reports where they disagree most — after subtracting Kalshi's trading fee — with a suggested Kelly-sized stake

Cities covered: **NYC, Chicago, Miami, LA, Austin, Denver, Philadelphia** (more can be added in `src/weather.ts`).

### Run it

```bash
cd kalshi-tool
npm install
cp .env.example .env      # fill in your Kalshi key + private-key path
npm start
```

Open the `weather-edges-<date>.html` file it prints. Each card shows the forecast high, the model's probability, the market's price, and a **BUY YES/NO @ Xc** suggestion with a stake.

### How to read the edge

> **Denver — 92-93° bin**
> Forecast high: 94°F · Model YES: 23% · Market YES: 10%
> → **BUY YES @ 10¢** · edge 12% · stake $18

The model thinks that bin is more likely (23%) than the market is charging for (10¢). That 13-point gap, minus fees, is the edge.

---

## Polymarket Divergence

Finds the same event priced differently on Kalshi vs Polymarket. Requires `ANTHROPIC_API_KEY` (Claude confirms two markets are truly the same wager).

```bash
npm run divergence
```

---

## Configuration (`.env`)

**Weather:**
| Variable | Default | Meaning |
|---|---|---|
| `WEATHER_SIGMA` | `3` | Forecast uncertainty in °F |
| `WEATHER_MIN_EDGE` | `0.08` | Minimum edge to report (8 pts) |
| `BANKROLL_USD` | `1000` | For Kelly stake sizing |
| `FRACTIONAL_KELLY` | `0.25` | Quarter-Kelly (safer) |
| `MAX_FRACTION_PER_TRADE` | `0.05` | Max 5% of bankroll per bet |
| `WEATHER_CITIES` | (all) | Optional: limit to specific series |

## Important

These tools **surface where your model disagrees with the market — they do not guarantee winning bets.** The weather edge is only as good as the forecast and the uncertainty assumption; the Polymarket match is only as good as the AI's judgment that two markets are identical. Always verify each market's resolution rules yourself. Prediction market trading carries real risk of loss.

## Project structure

```
kalshi-tool/
├── src/
│   ├── index.ts            — WEATHER tool entry (npm start)
│   ├── weather.ts          — stations, bin parsing, probability model, edge calc
│   ├── nws.ts              — National Weather Service client
│   ├── weatherReport.ts    — weather console + HTML report
│   ├── divergenceMain.ts   — POLYMARKET tool entry (npm run divergence)
│   ├── polymarket.ts       — Polymarket API client
│   ├── match.ts            — text-similarity prefilter
│   ├── divergenceReport.ts — divergence console + HTML report
│   ├── kalshi.ts           — Kalshi API client (RSA-signed auth)
│   ├── claude.ts           — AI market-match confirmation
│   ├── weather_probe.ts    — diagnostic: list Kalshi weather series
│   └── types.ts            — shared types
├── kalshi_advisor.py       — standalone Python advisor (separate experiment)
└── .env.example
```
