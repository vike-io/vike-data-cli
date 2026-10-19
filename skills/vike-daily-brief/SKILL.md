---
name: vike-daily-brief
description: One-page cross-market brief of what changed today - perp funding, open interest and long/short lean, Hyperliquid cohort positioning and liquidation risk, trending Polymarket markets with smart-money flows, and Ethereum tokens the smart-money cohort is buying. Cheap calls first, every section skippable. Use when the user asks "daily brief" / "morning brief" / "what is happening across crypto today" / "give me a market rundown across perps, Hyperliquid, Polymarket and on-chain".
allowed-tools: Bash(vike-data:*)
---

# vike-daily-brief

About 14 credits for all four sections; run only the ones the user wants and say which were skipped. Calls inside a section are independent: run them in parallel. If a call fails, omit its bullet and say so.

## 1. Perps (about 5 credits)

```bash
vike-data perp funding --json &                # top 5 cross-venue funding arbs (daily %, spread >= 0.3%)
vike-data perp open-interest BTC --json &      # repeat for ETH; oi_usd is USD notional
vike-data perp long-short BTC --json &         # repeat for ETH; read each venue's `basis`
wait
```

- Funding rows are `long_exchange` / `short_exchange` / `spread_daily_pct`. The top rows are often thin tokens (live: CT, UNITREE, H100): check liquidity with `perp funding --symbol <S>` (`vol_24h_usd`) before presenting one as a trade.
- Report BTC and ETH OI per venue and drop `stale_venues`; report each venue's long share with its basis, never an average.

## 2. Hyperliquid (about 3 credits)

```bash
vike-data hl cohort-metrics BTC --axis pnl --hours 1 --json &      # repeat for ETH
vike-data hl liquidations --view risk --limit 500 --json &         # keep rows with total_value_usd >= 50,000,000
wait
```

- `bias` is a fraction -1..+1 of notional; report the `3x smart`..`smart` group and the `rekt` group (sum notional; see `vike-hl-cohort-positioning`), and check `freshness.stale`. Today's labels, not a history.
- Liquidation risk: `percent_risk` is a fraction; name the top 3 symbols AFTER the notional filter.

## 3. Polymarket (about 3 credits)

```bash
vike-data polymarket markets --category Crypto --limit 5 --json &
vike-data polymarket smart-money --mode flows --hours 24 --category Crypto --limit 5 --json &
wait
```

- Skip rows that are already decided: `yes_mid` of 0.98 or more (or 0.02 or less) is a finished game, and in an unfiltered flows list the top rows are often last night's sports results. Quotes are probabilities.
- Check `ended` on trending markets before presenting one.

## 4. On-chain, Ethereum (3 credits)

```bash
vike-data token screener --chain ethereum --window 24h --sort smart_inflow --smart-money-only --limit 10 --json
```

- Rows are the smart-money cohort's flow per token. Skip `0x0000000000000000000000000000000000000000` (the native coin) and stablecoins unless asked; report `symbol` (or the address when blank), `net_flow_usd`, `unique_holders`. `24h` is yesterday plus today (UTC).
- For one interesting token run `vike-token-smart-money-trend`; do not name buyers from this call.

## Output

Five to ten bullets, each with its number and unit, grouped by section, then one line: what the brief does not cover (no news, no price forecasts, no CEX spot, other chains) and the data time. No advice.

## Anti-patterns

- Don't run section 4 first (it is the most expensive) or repeat a section the user did not ask for.
- Don't mix percents and fractions in one line, and don't call a decided market "smart-money conviction".

## Pairs well with

- `vike-perp-overview`, `vike-hl-asset-briefing`, `vike-polymarket-smart-money`, `vike-token-smart-money-trend`
