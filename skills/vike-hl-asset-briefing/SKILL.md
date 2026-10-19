---
name: vike-hl-asset-briefing
description: One-page briefing on a single Hyperliquid symbol - recent price, funding across venues, open interest against the venue's own number, how the size and PnL cohorts are positioned, and where liquidations cluster. Use when the user asks "brief me on ETH on Hyperliquid" / "what is going on with SOL perps" / "positioning, funding and liquidations for BTC" / "is HYPE crowded".
allowed-tools: Bash(vike-data:*)
---

# vike-hl-asset-briefing

Seven or eight calls for ONE symbol, about 8 credits. Every section is skippable if the user asked something narrower. Symbols are upper case; a HIP-3 market is `dex:TICKER`.

## Chain

```bash
S=ETH
vike-data candles hl $S --interval 1h --limit 24 --json            # price: open, high, low, close over 24h (candles[])
vike-data perp funding --symbol $S --json                          # funding on every venue (normalise it yourself)
vike-data perp open-interest $S --json                             # OI per venue, USD notional (hyperliquid is one row)
vike-data hl market --view size_breakdown --symbol $S --json       # ten position-size tiers with value_close_to_liquidation
vike-data hl cohort-metrics $S --axis size --hours 1 --json        # whales' long/short
vike-data hl cohort-metrics $S --axis pnl  --hours 1 --json        # profitable vs losing wallets
vike-data hl liquidations --view heatmap --symbol $S --bins 20 --json   # where liquidations would cluster
```

Optional: `vike-data hl liquidations --view fills --symbol $S --limit 20 --json` for the latest realized liquidations; `vike-data hl market --view open_interest --json` is every symbol with `venue_open_interest_usd` beside our own `total_value`: read only your symbol's row.

## Reading each section

- **Price**: `candles[]` of `ts` (epoch ms), `open..close`, `volume_usd`.
- **Funding**: raw `funding_rate` per interval, `interval_h` differs (Hyperliquid 1h, most CEXs 8h): `daily_pct = funding_rate x (24 / interval_h) x 100`. Positive = longs pay shorts. A row with `vol_24h_usd` of 0 and `next_ts` 0 is a halted or stale feed (live: coinbase), leave it out of any comparison.
- **Open interest**: `oi_usd` is USD notional (contracts x mark price), so it moves with price even when nobody opens or closes. Venues in `stale_venues` are not in `venues` and not in any total. `hl market` shows our aggregate (`total_value`, split long and short, `count`) beside the venue's own `venue_open_interest_usd`; they should be close (live BTC: $3.318B vs $3.289B).
- **Cohorts**: `bias` is a fraction -1..+1 of notional; group rungs by summing notional (see `vike-hl-cohort-positioning`); check `position_count` before calling a rung's lean meaningful.
- **Liquidation heatmap**: bins are equal-width over +-50% of `mark_price`; `liquidation_value_usd` is open notional whose liquidation price falls in the bin, with `long_value_usd` / `short_value_usd` and `most_impacted_cohort`. `coverage.in_window_fraction_of_open` is the share of open notional the map covers (0.67 for BTC): positions outside the window or without a liquidation price are dropped, so clusters are a floor. Long liquidations sit BELOW the mark (price falling), short ones above.
- `size_breakdown.value_close_to_liquidation` is notional within half of its liquidation buffer, per tier.

## Answer template

> `<S>` on Hyperliquid: price `<p>` (`<24h change>`). Funding `<daily %>` on Hyperliquid vs `<range>` on `<n>` other venues. OI `$X` on Hyperliquid, `$Y` across `<k>` venues. Whales `<bias_g>`, profitable wallets `<bias>`, losing wallets `<bias>` (labels as of today). Nearest liquidation cluster `<side>` `$V` around `<price range>` (`<coverage>` of open notional mapped).

## Anti-patterns

- Don't call a funding spread "free money" and don't average funding across venues with different intervals.
- Don't read an OI change in USD as new positions without taking out the price move (see `vike-perp-crowding`).
- Don't run `hl market --view positions` here without `--symbol`.

## Pairs well with

- `vike-hl-cohort-positioning`, `vike-hl-liquidation-radar`, `vike-perp-funding`, `vike-perp-crowding`, `vike-candles`
