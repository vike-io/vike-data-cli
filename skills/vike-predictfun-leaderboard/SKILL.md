---
name: vike-predictfun-leaderboard
description: Rank every Predict.fun wallet by realized P&L, volume or fills over all time, 1d, 7d or 30d, or by unrealized P&L today, each row with every window's figures, open value and position counts. Use when the user asks "who is winning on Predict.fun" / "top Predict.fun traders" / "biggest Predict.fun wallets by volume".
allowed-tools: Bash(vike-data:*)
---

# vike-predictfun-leaderboard

## Command

```bash
vike-data predictfun leaderboard [--window all|1d|7d|30d] [--sort realized|volume|fills|unrealized] \
  [--limit N] [--offset N] [--json]          # limit default 20, max 50; offset 0-1000; 1 credit
```

`--sort unrealized` is today's open P&L and takes `--window all` only (any other window is an error).

## Examples

```bash
vike-data predictfun leaderboard --json                                  # realized P&L, all time
vike-data predictfun leaderboard --window 7d --sort realized --limit 50 --json
vike-data pf leaderboard --window 30d --sort volume --offset 50 --json  # second page
```

## Output

`{rows, window, sort, label_basis, as_of_ts}`; `label_basis` is `current` (today's standing, not a point in time), `as_of_ts` the board's last rebuild (hourly). Each row:

`rank`, `wallet`, `realized_pnl_usd` and `realized_pnl_1d_usd`, `realized_pnl_7d_usd`, `realized_pnl_30d_usd`, `unrealized_pnl_usd`, `open_value_usd`, `open_positions` (outcome tokens held in markets not resolved yet), `resolved_positions` (outcome tokens traded in resolved markets), `volume_usd`, `volume_1d_usd`, `volume_7d_usd`, `volume_30d_usd`, `fills`, `fills_1d`, `fills_7d`, `fills_30d`, `first_ts`, `last_ts` (epoch ms).

## Reading

- **A market counts in a realized window by when it resolved**, not when it was traded; volume and fills windows are whole fill hours back from the rebuild.
- Rows are ranked largest first; ties break on the wallet address. Page by `--offset` (at most 1000); a rebuild between two pages can move a wallet across them.
- P&L counts exchange fills only (see `vike-predictfun-trader`). USD is BSC USDT.

## Anti-patterns

- Don't rank skill on a handful of `resolved_positions`: a large `realized_pnl_usd` from two positions is one bet.
- Don't read `volume_usd` as profit, or `fills` as matches: one fill is one order's fill.
- An error saying the leaderboard is not built yet means try later, not "no traders".

## Pairs well with

- `vike-predictfun-trader` — open one wallet's positions and fills
- `vike-predictfun-markets` — the venue's volume and markets
