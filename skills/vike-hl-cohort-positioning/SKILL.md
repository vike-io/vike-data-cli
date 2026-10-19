---
name: vike-hl-cohort-positioning
description: Are whales, profitable wallets or losing wallets net long or short a Hyperliquid symbol right now - long/short notional per wallet cohort on the size, pnl and tier ladders, with the biggest individual positions. Use when the user asks "are whales long or short BTC" / "what are profitable Hyperliquid wallets doing on ETH" / "who is long SOL on Hyperliquid" / "Hyperliquid positioning" / "net long or short by wallet size".
allowed-tools: Bash(vike-data:*)
---

# vike-hl-cohort-positioning

A current read of how each wallet cohort is positioned in ONE symbol. 3-6 credits. For history and any backtest-like question use `vike-hl-cohort-backtest` instead: this skill's default labels are today's.

## Chain

```bash
vike-data hl segments --view cohorts --json                       # 1  the exact labels: size 12, pnl 13, tier 10
vike-data hl cohort-metrics BTC --axis size --hours 1 --json      # 1  whales: one row per size rung
vike-data hl cohort-metrics BTC --axis pnl  --hours 1 --json      # 1  profitable vs losing wallets (today's grading)
vike-data hl segments --view summary --axis pnl --cohort smart --json   # 1  that cohort across ALL symbols
vike-data hl segments --view heatmap --axis pnl --json            # 1  LARGE (every symbol): read only the BTC row's segments[]
vike-data hl market --view positions --symbol BTC --axis size --cohort "4x whale" --json   # 1  the individual positions
```

`--hours 1..24` is a current read; the newest SETTLED hour comes back (the hour in progress never does). Symbols are upper case; a HIP-3 market is `dex:TICKER`. Read `freshness`: `stale: true` means do not call it "now" (`behind_hours` says how far behind).

## Units and the ladders

- `bias` = (long - short) / (long + short) of NOTIONAL, a **fraction** from -1 (all short) to +1 (all long). Long share = (1 + bias) / 2. `total_position_value` and `total_position_value_long` are USD; `position_count` counts positions.
- **Several rungs as one group: sum the notional, never average the biases.** `bias_group = (2 * sum(total_position_value_long) - sum(total_position_value)) / sum(total_position_value)`.
- `size` ladder = account value: `shrimp` under $1k up to `4x whale` at $10M or more (`whale` is $1M-2.5M). `pnl` ladder = percentile of cumulative realized PnL with at least 10 closed trades: `3x smart` is the top 1%, `smart` the 5-10% band, `rekt` the 80-90% band, `3x rekt` the bottom 5%, `unknown` too few trades. `tier` buckets each POSITION by its own size. `pnl_abs` is dollar bands of today's PnL.
- `hl segments --view summary` adds `n_wallets`, `pct_wallets_in_profit` (a fraction), `exposure_ratio` (notional over margin used, the cohort's realized leverage) and `total_equity`.

## Reading

Live BTC on 2026-10-19, size ladder at the 12:00 UTC hour: `4x whale` held 20 positions, $1.02B notional, `bias` -0.37 (net short); `3x whale` $401M, +0.36 (net long). In the pnl heatmap (13:51 snapshot) `3x smart` held 746 positions and 48.7% of BTC's notional (`share_of_symbol`), `bias` -0.15. So check `position_count` and `share_of_symbol` before saying a cohort "is short": 20 wallets, or one wallet, can set a rung's bias.

- Compare rungs, not just totals: whales net short while `smart` is net long is a disagreement worth stating as such.
- `--opened-within 24h|7d|30d` (on `cohort-metrics` and `segments summary`) restricts to recently opened positions: how much of the lean is new.
- **`hl market positions` is ordered by wallet address, not by size** (a `limit` of 100 returned $14 and $350k positions next to each other). For "the biggest positions", filter to the top size cohorts (`4x whale`, `3x whale`) and sort by `size_usd` yourself, then read `liquidation_price`, `leverage`, `unrealized_pnl`, `opened_at`.
- Never run `hl market --view positions` without `--symbol` or `--wallet`: it scans billions of rows.
- `hl market --view symbol_metrics` flags its newest row `provisional: true`: it covers the hour in progress and was far smaller than the settled hour before it (30,342 vs 40,186 BTC positions); do not read it as a position change.

## Answer template

> BTC on Hyperliquid, hour `<ts>` UTC (`freshness.stale: false`): whales (`4x`..`whale`) are `<bias_group>` (`$L` long / `$S` short across `N` positions); `smart` wallets (`3x smart`..`smart`) are `<bias>`; `rekt` wallets `<bias>`. Positioning is notional-weighted on `N` positions, today's cohort labels, Hyperliquid only: a position can be a hedge held elsewhere.

## Anti-patterns

- Don't turn a lean into a price forecast, and don't say "smart money is short" when the group is one rung of 20 positions.
- Don't use these default labels on history: the `pnl` ladder is graded today (look-ahead).
- Don't write `bias` or `pct_wallets_in_profit` as a percent: both are fractions.

## Pairs well with

- `vike-hl-asset-briefing` (adds funding, OI, liquidations), `vike-hl-cohort-backtest` (history), `vike-hl-trader-profile` (one wallet from the positions list)
