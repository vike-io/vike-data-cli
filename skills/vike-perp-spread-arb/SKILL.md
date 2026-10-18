---
name: vike-perp-spread-arb
description: Cross-venue perp price spread (buy on venue A, sell on venue B). Use when the user asks "any perp arb today" / "price differences across exchanges" / "where's X cheapest".
allowed-tools: Bash(vike:*)
---

# vike-perp-spread-arb

## Command

```bash
vike-data perp spreads --json                 # full matrix, all symbols with spread >= 0.5%
vike-data perp spreads --symbol BTC --json    # one specific symbol
```

## Output

Pre-ranked rows: `symbol`, `buy_exchange`, `buy_price`, `sell_exchange`, `sell_price`, `spread_pct`.

Outliers (> 400 bps off the cross-venue median) are filtered upstream — typically these are unit-mismatch listings like `1000SHIB` vs `SHIB`, or stale prices.

## Reading

`spread_pct = 0.7%` on a liquid pair = real arb opportunity, **before fees + transfer time**. Realistic net edge:
- 30-60 bps after taker fees
- Cross-venue settlement adds latency — fast inventory rotation matters more than per-trade size
- Always check `vike-perp-funding-arb` for the same symbol — funding can amplify or kill the trade economics

## Anti-patterns

- Quoting a spread as "free money" without mentioning fees / transfer time
- Trading 1000-token-suffix pairs without normalizing — `1000PEPE` on Binance ≠ `PEPE` on Bybit; if the spread looks insane it's probably this
- Treating the buy/sell exchanges as static — the spreads update minute-by-minute; the row you see is current snapshot, not forecast

## Pairs well with

- `vike-perp-funding-arb` (combine for the full carry picture)
- `vike-cross-venue-perps` for one-symbol depth
