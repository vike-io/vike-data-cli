---
name: vike-perp-crowding
description: Is a perpetual-futures symbol crowded one way - funding paid, open interest net of the price move and the long/short lean on each venue, compared with the symbol's own last week, plus the Hyperliquid wallet-cohort lean when it is listed there. Use when the user asks "is BTC long crowded" / "is ETH positioning stretched across exchanges" / "is open interest rising with price" / "are traders over-leveraged long on SOL".
allowed-tools: Bash(vike-data:*)
---

# vike-perp-crowding

Three lenses on one symbol, about 6 credits. No lens has a validated threshold: judge each against the symbol's OWN last week and report what agrees, never a score. Base asset only (`BTC`, not `BTCUSDT`).

## Chain

```bash
S=BTC
vike-data perp funding --symbol $S --json                       # 1  price of carrying a position, now
vike-data perp open-interest $S --hours 168 --json              # 1  hourly oi_usd per venue (hours+1 points)
vike-data candles hl $S --interval 1h --limit 169 --json        # 1  price over the same hours, to net it out of OI
vike-data perp long-short $S --hours 168 --json                 # 1  hourly long_short_ratio per venue, with `basis`
vike-data hl cohort-metrics $S --axis size --hours 1 --json     # 1  optional: whales on Hyperliquid
vike-data hl cohort-metrics $S --axis pnl  --hours 1 --json     # 1  optional: profitable vs losing wallets
```

## Lens 1: funding (now)

Raw `funding_rate` is per interval and `interval_h` differs (Hyperliquid 1h, most CEXs 8h): `daily_pct = funding_rate x 24 / interval_h x 100`. Positive = longs pay. Drop rows with `vol_24h_usd` 0 (live: coinbase, halted). It is a snapshot with no history in this tool, so say "above/below the other venues", not "above its norm".

## Lens 2: open interest net of price

`oi_usd` is USD notional = contracts x mark price, so it rises with price on its own. Over the same hours: `contracts_change% ~ oi_change% - price_change%`. Live BTC over 48h: price +0.5% (Hyperliquid candles), `oi_usd` binance +1.8%, hyperliquid -3.2%, kucoin -11.3%, okx -0.4%, so contracts: binance +1.3%, hyperliquid -3.7%, kucoin -11.8%. OI rising faster than price = new positions; falling while price rises = positions closing. Venues in `stale_venues` are not in `venues` and never in a total (live: coinbase, halted 2026-10-01).

## Lens 3: who leans

`long_share` / `short_share` are fractions of 1; `long_short_ratio` = long / short, above 1 long-heavy. **Each venue counts something different** and the row says so in `basis`: binance = top traders by positions, okx and gate = top traders by accounts, bybit = all accounts. Never average across venues; compare each venue with its own 7-day range. Live BTC: binance 1.78 (48h median 1.77), gate 0.64 (median 0.61, short-heavy) disagreeing on the same day. About 40 major symbols per venue; other symbols return empty lists and a `note`, not zeros. Hyperliquid cohorts (`hl cohort-metrics`, `bias` -1..+1 of notional, sum rungs by notional) are wallets, not accounts counted by a venue.

## Verdict

State which lenses point the same way and which do not. Illustrative wording, not live data: "funding positive on most venues, contracts rising on binance but falling on hyperliquid and kucoin, long ratio at its 7-day high on binance only: mixed, not crowded". Name "crowded long" only when funding, net OI and at least two bases agree and sit at the top of their own week.

## Anti-patterns

- Don't read `oi_usd` growth as new longs, or a long/short ratio as dollars.
- Don't average ratios across venues or compare bases; don't forecast a squeeze.
- Don't leave stale or halted venues in the comparison.

## Pairs well with

- `vike-perp-funding`, `vike-perp-overview`, `vike-hl-cohort-positioning`, `vike-hl-asset-briefing`, `vike-candles`
