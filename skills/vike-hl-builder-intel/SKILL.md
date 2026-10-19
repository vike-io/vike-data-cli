---
name: vike-hl-builder-intel
description: Hyperliquid builder codes - which front-ends and bots earn the most fees, how concentrated their users are, their symbols and daily fee series. Use when the user asks "which Hyperliquid builder codes earn the most" / "who runs builder X and how big is it" / "builder fee revenue" / "how much of Hyperliquid volume is routed through builders".
allowed-tools: Bash(vike-data:*)
---

# vike-hl-builder-intel

A builder code lets a front-end or bot attach its address to an order and keep a slice of the taker fee. 4 calls, about 4 credits.

## Chain

```bash
vike-data hl builders --view leaderboard --window 30d --sort fee --limit 10 --json     # who earns
vike-data hl builders --view profile --builder 0x5af1b5f44207784dcb850bbb4143c5dcd1885f71 --window 30d --json
vike-data hl builders --view users --builder 0x5af1b5f44207784dcb850bbb4143c5dcd1885f71 --window 30d --limit 10 --json
vike-data hl builders --view series --builder 0x5af1b5f44207784dcb850bbb4143c5dcd1885f71 --bucket 1d --limit 30 --json
vike-data hl builders --view stats --window 30d --json      # ecosystem totals and the routed share of volume
```

Other views: `fills` (the raw routed fills, `--symbol`, `--side`). `--window` is `1d|7d|30d|all`; page with `nextCursor` -> `--cursor`.

## Reading

- `leaderboard` rows: `rank`, `builder`, `fee_usd`, `volume_usd`, `fills`, `users`, `revenue_per_user`, `fee_rate_bps`, `taker_pct`, `market_share_pct`, `active_days`. `--sort fee` ranks the builder's own cut, not what traders paid; the order differs from `--sort volume`. Live (30d to 2026-10-19): top builder `0x5af1...f71` earned $1.72M on $1.78B of volume (9.7 bps, 12.5k users); #2 `0x2a2b...d17` earned $1.54M on $3.40B (4.5 bps, 24.7k users).
- **Three fee columns are not interchangeable**: `fee_usd` is the builder's revenue, `trader_fee_usd` what traders paid in total, `builder_routed_deployer_fee_usd` the deployer's cut on builder-routed flow only (a lower bound on deployer revenue). Sum `fee_usd` on `fills`; `fee` there is in its own `fee_token`.
- `stats.totals.builder_routed_share_pct` is the share of all fill notional carrying a builder code: 5.7% over the same 30 days ($27.8B of $488B).
- `profile` adds `by_symbol`, `by_dex`, `user_volume_distribution` (users split into volume deciles: separates "19k users" from "one whale plus a tail") and `lifetime`; `profitable_users_pct` is a per-wallet test. In `users`, `closed_pnl_usd` is the TRADERS' realized PnL, not the builder's.
- `series` `users` is a distinct count per bucket and not additive across days; take a period total from `profile` over that period. Builder history starts at different dates: compare `active_days` and the resolved `window` first.

## Anti-patterns

- Don't call a builder profitable or its users winners from `closed_pnl_usd`.
- Don't add daily `users` together, or compare two windows of unequal `active_days`.
- Pass only the flags a view takes: `profile`, `users`, `fills` and `series` require `--builder`, `leaderboard` and `stats` take none, and the tool refuses the rest instead of ignoring them.

## Pairs well with

- `vike-hl-top-traders`, `vike-hl-trader-profile` (`hl activity --view builders` shows which builders one wallet routes through)
