---
'@vike-io/cli': patch
---

Skills for four new live stream channels (the server serves them from stream.vike.io; the CLI keeps no channel list, so `stream`, `stream check` and `stream events` take them as they are): `hl.top_positions` and `hl.closed_trades` (path `hl`), `hl.cohort_leverage` (path `hl-cohorts`) and `pm.positions` (path `polymarket`), and the new `leverage`, `liquidation_px` and `labels.tags` of `hl.positions` with its `min_leverage` and `tag` filters.

- `vike-stream`: the channel table, what each new channel sends, its filters and volume, examples, and when each starts sending.
- `vike-hl-trader-profile` (`hl.closed_trades` by wallet), `vike-hl-cohort-positioning` (`hl.cohort_leverage`, `hl.top_positions`), `vike-hl-liquidation-radar` (`hl.positions` with `min_leverage`), `vike-pm-market-diligence`, `vike-polymarket-trader` and `vike-polymarket-smart-money` (`pm.positions` by market or wallet), the umbrella routing and the README.
- Fix: `vike-data stream ... --filter min_leverage=20` sent a list (`["20"]`), which the server refuses; it is a number now, like `min_usd`.
