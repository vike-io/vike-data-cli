---
name: vike-cross-venue-perps
description: Compare a single perp symbol across all venues — funding, price, spreads. Use when the user asks "where to trade X" / "compare BTC perp across exchanges" / "best venue for ETH long".
allowed-tools: Bash(vike-data:*)
---

# vike-cross-venue-perps

Per-symbol cross-venue analysis.

## Steps

1. Per-venue funding
   ```bash
   vike-data perp funding --symbol <SYM> --json
   ```
2. Per-venue spread
   ```bash
   vike-data perp spreads --symbol <SYM> --json
   ```

## Report template

> **`<SYM>` perp — venue comparison**
>
> | Venue | Mark price | Funding (daily %) | Bid-ask edge |
> |---|---|---|---|
> | Binance | ... | ... | ... |
> | Bybit | ... | ... | ... |
> | OKX | ... | ... | ... |
> | Aster | ... | ... | ... |
> | Hyperliquid | ... | ... | ... |
>
> **Best venue to long**: `<X>` (lowest funding paid)
> **Best venue to short**: `<Y>` (highest funding received)
> **Arb edge**: long-short spread = X%/day

## Reading

- Negative funding on venue → shorts pay longs (longs receive). Good place to be long.
- Positive funding → longs pay shorts. Good place to be short.
- A wide divergence (>0.5%/day) between two venues with similar liquidity = arb edge worth quantifying.

## Anti-patterns

- Don't blindly pick the venue with lowest funding without checking liquidity — Hyperliquid funding looks great on small alts but the book might be thin.
- Funding flips frequently; the read here is "as of now", not a forecast.

## Pairs well with

- `vike-perp-funding-arb` for the full opportunity list across all symbols
- `vike-perp-screener` for market overview
