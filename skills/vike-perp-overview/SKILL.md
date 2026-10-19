---
name: vike-perp-overview
description: Perp-market snapshot and the venue-level reads of one symbol — the top funding arbs, the widest perp price gaps between venues, the Hyperliquid leaderboard, open interest per venue and each venue's long/short lean. Use when the user asks "what's happening in perps today" / "perp market overview" / "any perp arb today" / "price differences across exchanges" / "where's X cheapest" / "open interest of X" / "long short ratio of X".
allowed-tools: Bash(vike-data:*)
---

# vike-perp-overview

One-shot market overview for perpetuals, plus the cross-venue price-gap, open-interest and long/short tools. The overview is exactly what these tools return: funding arbs, price gaps, the HL leaderboard, and per symbol the open interest and long/short lean of each venue. There is **no market-wide volume or per-venue mark-price tool** in the CLI; say so if asked.

## Open interest and long/short (one symbol, per venue)

```bash
vike-data perp open-interest BTC --json                 # latest print per venue
vike-data perp open-interest BTC --exchange binance --hours 48 --json   # hourly series (1-168)
vike-data perp long-short BTC --json
vike-data perp long-short ETH --exchange okx --hours 24 --json
```

Pass the base asset (`BTC`, not `BTCUSDT`); `--exchange` is lower case.

- **`oi_usd` is USD notional** (open contracts x mark price when polled): not a contract count, so venues add up, and it moves with price even when no position opens or closes. Venues polled: aster, binance, bitget, bybit, hyperliquid, kucoin, okx (each print `ts` UTC and `age_s`, a few minutes is normal). A venue whose newest print is over an hour old is listed under `stale_venues` with its `last_ts` and is NOT in `venues` (live: coinbase, halted since 2026-10-01), so never add it into a total. The series is `{symbol, interval: "1h", hours, series, unit}` with `[hour, oi_usd]` pairs, `hours + 1` points, the first hour partial.
- **`long_share` / `short_share` are fractions of 1** (they sum to 1); `long_short_ratio` = long / short, above 1 = long-heavy. **Each venue counts something different, named in the row's `basis`**: binance `top traders, by positions`; okx and gate `top traders, by accounts`; bybit `all accounts`. Never average across venues; compare a venue with its own history (the series is `[hour, long_short_ratio]`). Hyperliquid and BingX return nothing here.
- About 40 major symbols per venue: any other symbol returns empty lists and a `note`, never zeros.
- Whether a symbol is crowded: `vike-perp-crowding`.

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

Add `perp open-interest BTC` and `perp long-short BTC` (and ETH) when the user wants positioning too: 1 credit each, one short section "OI by venue (`oi_usd`, stale venues named) and long share by venue with its basis".

## When to skip the 3-call snapshot

- User asked about one symbol's funding or venues → `vike-perp-funding`.
- User asked about one HL trader → `vike-hl-trader-profile` (or `vike-hl-top-traders` for a ranking).
- User only wants price gaps → run `perp spreads` alone.

## Anti-patterns

- Don't quote funding rates in 8h chunks when the tool returns daily % — be consistent (daily %).
- Don't present a price gap as "free money" without fees / transfer time.
- Trading 1000-token-suffix pairs without normalizing — `1000PEPE` on Binance ≠ `PEPE` on Bybit; if the spread looks insane it's probably this.
- "Top by PnL today" is noise for swing-trader narratives; only useful for "who's hot right now". Use 7d or 30d for skill claims, and remember `1d` covers today plus the previous UTC day, not a rolling 24 hours.
- Don't present the top-traders list as "the best traders": the leaderboard rewards survivors.

## Pairs well with

- `vike-perp-funding` for the funding deep dive and one-symbol venue comparison
- `vike-perp-crowding` for funding + open interest net of price + long/short on one symbol
- `vike-hl-top-traders` for the leaderboard filters and how to read its columns
- `vike-daily-brief` for the perp section inside a cross-market brief
