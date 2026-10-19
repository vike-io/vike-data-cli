---
name: vike-hl-trader-profile
description: Full profile of one Hyperliquid wallet - equity, open positions, cohort labels, lifetime PnL against deposits, win rate and risk metrics, per-symbol trade record with medians, funding paid, deposits and withdrawals, builder routing. Use when the user gives a Hyperliquid address and asks "is this trader any good" / "profile this HL wallet" / "what is this wallet's track record" / "show the fills, funding or deposits of 0x...".
allowed-tools: Bash(vike-data:*)
---

# vike-hl-trader-profile

One address, answered from the wallet's own data (not from scanning the leaderboard). 2-6 credits. Get the address from `vike-hl-top-traders`, `vike-hl-position-match` or `hl market --view positions`.

## Chain

```bash
W=0xfc667adba8d4837586078f4fdcdc29804337ca06
vike-data hl wallet $W --window 30d --json                         # 1  equity, open_positions, cohorts, lifetime, ledger_by_type, metrics
vike-data hl wallet $W --view trades_summary --window 30d --json   # 1  closed/open trades, medians, per-symbol record
vike-data hl activity $W --view funding --symbol BTC --limit 50 --json   # funding paid or received
vike-data hl activity $W --view ledger --limit 50 --json           # deposits, withdrawals, sends
vike-data hl activity $W --view fills --symbol BTC --limit 50 --json     # the fills (add --start / --end)
vike-data hl market --view positions --wallet $W --json            # open positions with liquidation price and opened_at
```

`--window` is `1d|7d|30d|all`; `--limit` max 5000 (builders 500); page with `nextCursor` -> `--cursor`.

## Reading

- **A wallet Hyperliquid has never seen is not an error**: it comes back all zero, with `lifetime.cum_fills: 0`, `last_fill_ts: "1970-01-01..."`, `equity.account_value: null`. Say "no Hyperliquid history for this address", not "a flat trader". `has_metrics: false` on an active wallet means no trades in the window, which is not zero skill.
- `equity.account_value` is the live account; `cash_balance_usd` can be hugely negative on a cross-margin account (-$94.6M next to a $11.9M account in a live example): don't quote it as cash.
- **Money units**: `*_usd`, `account_value` USD. `win_rate`, `long_win_rate`, `pct_wallets_in_profit` are FRACTIONS (0.49 = 49%); `pnl_pct`, `roi`, `max_drawdown_pct` are percents. `hl perp top-traders` returns `win_rate_pct` as a percent: never mix the two in one table.
- **`max_drawdown_pct` is not reliable here**: on the 30-day PnL board it read exactly `100.0` for 381 of the top 500 wallets and above 100 for 40 (up to 1,824), and `calmar_ratio` / `recovery_factor` are derived from it. Do not quote them without saying so; use `current_drawdown_pct` and the trade medians instead.
- **Lifetime vs ledger**: compare `lifetime.cum_realized_pnl` with `net_deposit_usd` before praising PnL. The ledger records `send` one-sided and signed (a live wallet shows `send` = -$1.14B beside $406.9M deposited), so net-flow sums from it lean negative; trust `deposit` and `withdraw` rows, treat `send` as movement to or from other accounts.
- **Mean vs median** (`trades_summary`): live, a 30-day record had `avg_gain` $73.6k against `median_gain` $4.5k and `avg_loss` -$34.9k against `median_loss` -$2.6k. A few large trades drive the mean; report medians beside means and `payoff_ratio`, `profit_factor`, `expectancy`.
- `trade_count` here counts open and closed trades (`closed_trade_count` + `open_trade_count`); the leaderboard counts only completed trades by open day, so the two never match. `by_symbol` lists the symbols traded in the window, with `volume_share_pct` (50 on that wallet): compare `symbol_count` with the list length.
- **Funding**: `payment_usd` signed from the wallet's side, negative = the wallet PAID. **Fees**: a negative `fee` on a fill is a maker rebate. `closed_pnl` is per fill.
- Cohorts (`size`, `pnl`, style tags) are today's labels. `avg_leverage` reads 0 (not populated); ignore it.
- Identity: a Hyperliquid address is an EVM address; `vike-data labels <addr>` may name it. Sub-accounts and vaults are separate addresses with no merge.

## Verdict rubric (rules of thumb, not tool output)

| Pattern | Label |
|---|---|
| positive `lifetime.cum_realized_pnl` AND window `profit_factor` above 1.5 AND 50+ closed trades AND positive median gain | **Consistent** |
| big PnL, `win_rate` near 0.5, mean far above median | **Few large winners** (size matters more than hit rate) |
| high win rate on fewer than 10 closed trades | **Unverified** |
| `net_deposit_usd` much larger than `cum_realized_pnl` | **Equity driven by deposits**, not trading |
| realized PnL positive but `total_unrealized_pnl` very negative on a large open book | **Open risk** |

## Anti-patterns

- Don't call a wallet "the best trader" from a 1d or 7d window, or from one number.
- Don't copy-trade advice. The record is past, one venue, labels as of today.
- Don't print a drawdown of 100% or more as fact.

## Pairs well with

- `vike-hl-top-traders` (rankings), `vike-hl-position-match` (find the wallet), `vike-wallet-who-is` (off-chain identity)
- `vike-hl-cohort-positioning` for how that cohort is positioned
