---
name: vike-hl-top-traders
description: Rank Hyperliquid perp traders by PnL / ROI / win rate / volume / trade count / drawdown over a window, either the short top-20 list or the full leaderboard with Calmar, profit factor, streaks, cohort filters, deep paging and PnL net of deposits. Use when the user asks "top HL traders" / "best Hyperliquid wallets" / "HL leaderboard" / "who made the most on Hyperliquid this week" / "top traders net of deposits".
allowed-tools: Bash(vike-data:*)
---

# vike-hl-top-traders

Two rankings over the same wallets. Pick by the question:

| Need | Command |
|---|---|
| a quick top 20 | `vike-data perp top-traders` (2 credits) |
| more than 20 rows, paging, Calmar / profit factor / streaks, a cohort filter, a sort on any of 20 keys, PnL that excludes deposits | `vike-data hl leaderboard` (1 credit) |
| one specific address | `vike-hl-trader-profile` |

## `perp top-traders`

```bash
vike-data perp top-traders
  [--window 1d|7d|30d|all] [--sort pnl|roi|win_rate|volume|trade_count|drawdown] [--order asc|desc]
  [--min-trades N]       # default 3; 0-2 are raised to 3
  [--min-win-rate P]     # PERCENT 0-100
  [--min-volume USD] [--size N]   # default 10, max 20, no paging
  [--json]
```

| Question | Flags |
|---|---|
| "Top HL traders this week" | `--window 7d --sort pnl` |
| "Best ROI last 30d with >=10 trades" | `--sort roi --min-trades 10` |
| "Win rate over 75%, min $1M volume" | `--sort win_rate --min-win-rate 75 --min-volume 1000000` |
| "Most active today" | `--window 1d --sort trade_count` |

Output `{ "traders": [...], "total": N }`; each trader: `address`, `total_realized_pnl` (USD), `roi_pct`, `win_rate_pct`, `long_win_rate_pct`, `short_win_rate_pct`, `win_count`, `loss_count`, `trade_count`, `total_volume` (USD), `long_pnl`, `short_pnl`, `max_drawdown_pct`, `account_value` (USD), `avg_leverage`. All `*_pct` are percents (`12.5` = 12.5%). `avg_leverage` reads 0: ignore it. Pass an exact `--sort`: a typo silently falls back to PnL.

## `hl leaderboard`

```bash
vike-data hl leaderboard
  [--view ranking|flow_adjusted] [--window 1d|7d|30d|all]
  [--sort pnl|roi|win_rate|volume|trades|calmar|profit_factor|expectancy|max_drawdown|current_drawdown|win_streak|loss_streak|fees|account_value|...]  # 20 keys; an unknown one is refused
  [--order asc|desc] [--cohort <label> --axis size|pnl|pnl_abs]
  [--min-trades N] [--min-win-rate F] [--min-volume USD]   # win rate is a FRACTION: 0.6 = 60%; 60 is refused
  [--limit N]            # default 25, max 500; page with nextCursor -> --cursor (resend the same window/sort/order/axis/cohort)
  [--json]
```

Output `{ traders, totalCount, nextCursor }`; each trader has `rank`, `wallet`, `account_value`, `total_realized_pnl`, `cum_realized_pnl`, `roi`, `pnl_pct`, `total_volume`, `total_fee`, `trade_count`, `win_rate` (fraction), `long_win_rate`, `short_win_rate`, `long_pnl`, `short_pnl`, `profit_factor`, `expectancy`, `max_drawdown_pct`, `current_drawdown_pct`, `calmar_ratio`, `recovery_factor`, streaks, `avg_duration_seconds`, `size_cohort`, `pnl_cohort`, `pnl_cohort_tag`, `style_cohort_tag`. The key is `wallet` here, `address` on `perp top-traders`.

- Prefer `pnl_pct` to `roi`: `roi` is unguarded (it reaches values like 4.8e10 on a near-empty account) while `pnl_pct` is `null` under $1 of equity.
- `--view flow_adjusted` ranks FILLS-DERIVED trading PnL, which excludes deposits by construction, and adds `attributed`, `flow` and `flow_unbalanced`. It takes only `--window`, `--limit` and `--cursor` (any other flag is refused, not ignored), so there is no `--min-trades` and a wallet with 3 trades can top it: the live #1 for 30d was `account_value: 0`, 3 trades, `total_realized_pnl` +$8.5M while its own `attributed.trading_pnl_total` was -$119.6M. Check that the two agree in sign and size; when `flow_unbalanced` is true (a `send` in the window) the `attributed` and `flow` blocks are unreliable.

## Reading (both)

- **`roi` / `roi_pct` is realized only**: window realized PnL over the wallet's CURRENT account value. A wallet that withdrew looks better than it was; a fresh deposit makes it look worse.
- **Drawdown is not trustworthy here.** `max_drawdown_pct` is account-level and all-time (not per window), and on the live 30-day PnL board (50+ trades) it read exactly `100.0` for 43 of the top 50 and 381 of the top 500, and above 100 (an impossible drawdown) for 4 and 40 (up to 1,824); `calmar_ratio` and `recovery_factor` derive from it. Don't rank or quote on drawdown, Calmar or recovery without that caveat; `current_drawdown_pct` is better behaved.
- **Windows are UTC days**: `1d`, `7d`, `30d` mean today plus the previous 1, 7 or 30 days; `all` is the last 365 days.
- **`trade_count` counts completed trades**, filed under the UTC day the position opened. `vike-hl-trader-profile`'s trade summary also counts open trades, so the two disagree by design.
- A 90% win rate on 4 trades is noise: use 10-20 or more trades for any skill claim. Top by PnL is not top by ROI: whales win big in dollars, small in percent.
- The board rewards survivors; a wallet outside the top rows says nothing about quality.

## Anti-patterns

- Don't claim "the best HL trader" from a 1d window or from win rate alone.
- Don't mix `win_rate_pct` (percent) with `win_rate` (fraction) in one table, or pass `60` where a fraction is expected.
- Don't describe a wallet absent from a top list as bad.

## Pairs well with

- `vike-hl-trader-profile` for one address, `vike-hl-position-match` to find a wallet from a share card
- `vike-hl-cohort-positioning` for how the leaders as a group are positioned, `vike-perp-funding`, `vike-candles`
