---
name: vike-perp-overview
description: Perp-market snapshot and cross-venue price spreads — the top funding arbs, the widest perp price gaps between venues, and the Hyperliquid leaderboard in one read. Use when the user asks "what's happening in perps today" / "perp market overview" / "any perp arb today" / "price differences across exchanges" / "where's X cheapest".
allowed-tools: Bash(vike-data:*)
---

# vike-perp-overview

One-shot market overview for perpetuals, plus the cross-venue price-gap tool. The overview is exactly what these three tools return: funding arbs, price gaps and the HL leaderboard. There is **no open-interest, market-wide volume or per-venue mark-price tool** in the CLI; say so if asked.

## Price spreads

```bash
vike-data perp spreads --json                 # up to 10 symbols with a cross-venue price gap >= 0.5%
vike-data perp spreads --symbol BTC --json    # the same list, filtered to one symbol
```

Rows: `symbol`, `buy_exchange`, `buy_price`, `sell_exchange`, `sell_price`, `spread_pct`. Pre-ranked: cite the rows directly.

- **"Spread" is perp vs perp across venues, not spot vs perp.** `buy_exchange` is the cheapest venue and `sell_exchange` the dearest for that symbol.
- **`--symbol` only filters the global top 10.** An empty answer means the symbol is not among today's widest gaps, not that its venues agree. Don't answer "where's X cheapest" from an empty result; say the tool only lists the 10 widest gaps.
- Outliers (> 400 bps off the cross-venue median) are filtered upstream — typically unit-mismatch listings like `1000SHIB` vs `SHIB`, or stale prices.
- It reads the latest ticker snapshots: a row is a current snapshot, not a forecast.

`spread_pct = 0.7%` on a liquid pair is an opportunity **before** taker fees, slippage and the time to move inventory between venues. For the funding side of the same trade use `vike-perp-funding`.

## Market snapshot (3 parallel calls)

```bash
vike-data perp funding --json &              # top funding-arb opportunities (max 5)
vike-data perp spreads --json &              # widest cross-venue price gaps (max 10)
vike-data perp top-traders --window 1d --sort pnl --size 10 --json &   # HL leaderboard
wait
```

### Report template

> **Perp market snapshot (HL leaderboard: today and yesterday, UTC)**
>
> **Top funding arbs (>0.3% daily spread)**
> - `BTC`: long Bybit @ -0.5%/d, short Hyperliquid @ +0.8%/d → spread 1.3%/d
> - ...
>
> **Widest cross-venue price gaps (>0.5%)**
> - `SOL`: buy Aster @ 138.20, sell OKX @ 139.05 → 0.61%
> - ...
>
> **Top HL traders, last 1d (by realized PnL)**
> - `0xabc...` +$X (`total_realized_pnl`), ROI Y%, rank #1 — ...
> - ...

## When to skip the 3-call snapshot

- User asked about one symbol's funding or venues → `vike-perp-funding`.
- User asked about one HL trader → `vike-hl-top-traders`.
- User only wants price gaps → run `perp spreads` alone.

## Anti-patterns

- Don't quote funding rates in 8h chunks when the tool returns daily % — be consistent (daily %).
- Don't present a price gap as "free money" without fees / transfer time.
- Trading 1000-token-suffix pairs without normalizing — `1000PEPE` on Binance ≠ `PEPE` on Bybit; if the spread looks insane it's probably this.
- "Top by PnL today" is noise for swing-trader narratives; only useful for "who's hot right now". Use 7d or 30d for skill claims, and remember `1d` covers today plus the previous UTC day, not a rolling 24 hours.
- Don't present the top-traders list as "the best traders": the leaderboard rewards survivors.

## Pairs well with

- `vike-perp-funding` for the funding deep dive and one-symbol venue comparison
- `vike-hl-top-traders` for the leaderboard filters and how to read its columns
