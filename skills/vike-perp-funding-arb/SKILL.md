---
name: vike-perp-funding-arb
description: Find cross-venue funding-rate arbitrage opportunities on perpetual futures. Use when the user asks "any funding arb today" / "where to long-short X for funding" / "highest funding rates".
allowed-tools: Bash(vike:*)
---

# vike-perp-funding-arb

Cross-venue funding rates across Binance, Bybit, OKX, Aster, and Hyperliquid.

## Commands

### A. All arb opportunities (default)

```bash
vike-data perp funding --json
```

Returns pre-ranked rows where the spread between the highest-funding venue and the lowest is ≥ 0.3% (daily normalized). Each row already includes:
- `symbol`
- `long_exchange`, `long_daily_pct` (pay funding here)
- `short_exchange`, `short_daily_pct` (receive funding here)
- `spread_daily_pct`

**These are pre-ranked — just cite the top N rows directly. No further sorting needed.**

### B. Single symbol per-venue rates

```bash
vike-data perp funding --symbol BTC --json
```

Returns one row per venue: `{exchange, funding_rate_daily_pct, mark_price, ...}`.

## Reading the arb

```
spread_daily_pct = 0.42%   →  ~$420/day per $100k notional, gross
                              (before fees, slippage, transfer costs)
```

A funding arb at 0.4–1% daily is real. > 3% daily on a liquid pair is almost always a halted-trading / venue-mispricing artifact — verify with `vike-data perp spreads --symbol <sym>` to make sure the underlying spot/perp prices are sane.

## Anti-patterns

- Don't quote a daily funding rate as "annualized" without converting (× 365). Some users expect annual; some daily; be explicit.
- Funding flips every 1–8 hours depending on the venue. The number you see is the current-window rate, not a forecast — don't extrapolate without saying so.
- Spread < 0.3% daily is filtered out at the source (not enough to cover fees + execution). Don't try to lower the filter; below that the trade doesn't work.

## Pairs well with

- `vike-perp-spread-arb` to confirm spot/perp basis is sane
- `vike-cross-venue-perps` for the full per-venue picture on one symbol
