---
name: vike-perp-screener
description: Snapshot the current state of perpetual-futures markets — funding rates, cross-venue spreads, and HL leaderboard in one read. Use when the user asks "what's happening in perps today" / "perp market overview".
allowed-tools: Bash(vike:*)
---

# vike-perp-screener

One-shot market overview for perpetuals.

## Workflow (3 parallel calls)

```bash
vike perp funding --json &              # top funding-arb opportunities
vike perp spreads --json &              # top spot-perp price spreads
vike perp top-traders --window 1d --sort pnl --size 10 --json &
wait
```

## Report template

> **Perp market snapshot (last 24h)**
>
> **Top funding arbs (>0.3% daily spread)**
> - `BTC`: long Bybit @ -0.5%/d, short Hyperliquid @ +0.8%/d → spread 1.3%/d
> - ...
>
> **Top cross-venue price spreads (>0.5%)**
> - `SOL`: buy Aster @ 138.20, sell OKX @ 139.05 → 0.61%
> - ...
>
> **Top HL traders last 24h (by PnL)**
> - `0xabc...` +$X, rank #1 — ...
> - ...

## When to skip the 3-call screener

- User asked specifically about one symbol → use `vike-cross-venue-perps` instead.
- User asked about a single trader → use `vike-hl-trader-profile`.

## Anti-patterns

- Don't quote funding rates in 8h chunks when the underlying API returns daily — be consistent (daily %).
- "Top by PnL last 24h" is noise for swing-trader narratives; only useful for "who's hot right now". Use 7d or 30d for skill claims.

## Pairs well with

- `vike-perp-funding-arb` for the funding-only deep dive
