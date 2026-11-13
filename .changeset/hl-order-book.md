---
'@vike-io/cli': minor
---

`hl orders --view book`: one Hyperliquid symbol's order book at one instant, price levels best first (`--symbol`, `--at`, `--side both|bid|ask`, `--levels`, default 100, max 1000). `--market perp|spot` on the `open`, `clusters` and `book` views (a spot symbol is a pair, `HYPE/USDC`); `--cohort-axis` and `--cohort` on `open` too, whose rows now carry the owner's `sizeCohort`, `pnlCohort` and `pnlCumUsd`. `stream --filter kind=resting|trigger` is sent as one value (the `hl.order_walls` filter); the `vike-stream` skill names the walls' new fields (`kind`, `dex`, `source`, `trigger_type` / `trigger_px`, and on `disappeared` the `outcome` and `filled_usd`).
