---
name: vike-token-smart-money-trend
description: Is the smart-money cohort entering, holding or exiting one Ethereum token over time - the cohort's net flow across 24h, 7d, 30d and 90d, differenced into disjoint slices, then the wallets behind the latest move. Use when the user asks "is smart money still buying X" / "did smart money exit X" / "how long has smart money been accumulating X" / "smart money trend for X".
allowed-tools: Bash(vike-data:*)
---

# vike-token-smart-money-trend

Direction over time for ONE token, on **Ethereum only** (`--smart-money-only` and `--sort smart_inflow` are a 400 on bsc, base and hyperevm). For "which tokens is the cohort buying right now" use `vike-smart-money-discovery`. About 20 credits.

## Chain

```bash
vike-data token search ENA --chain ethereum --limit 3 --json            # 0 credits; the address
vike-data token screener --chain ethereum --window 24h --sort smart_inflow --smart-money-only --limit 100 --json   # 3 credits
vike-data token screener --chain ethereum --window 7d  --sort smart_inflow --smart-money-only --limit 100 --json   # likewise 30d, 90d
                                                                        # find the token's row in each
vike-data token transfers <addr> --tab bought --period 7d --chain ethereum --json   # 2 each: top 10 per side
vike-data token transfers <addr> --tab sold   --period 7d --chain ethereum --json
vike-data wallet batch <those addresses> --chain ethereum --json        # 2: drop cex / dex / market_maker rows
```

## Reading

In smart-money mode a row is the COHORT's flow in that token: `net_flow_usd` = `in_usd` - `out_usd`, `unique_holders` = cohort wallets active, `tx_count`. Rows are sorted by `net_flow_usd`. The token absent from the top 100 means its cohort net flow is below the 100th row's, not that the cohort has no flow. Skip `0x000...0` (the native coin).

**The windows overlap, so difference them** into disjoint slices before reading a trend:

| Slice | = |
|---|---|
| last day | 24h |
| days 2-7 | 7d - 24h |
| days 8-30 | 30d - 7d |
| days 31-90 | 90d - 30d |

Live ENA on 2026-10-19: 24h +$14.9M, 7d +$38.3M, 30d +$27.9M, 90d +$54.0M, so last day +$14.9M, days 2-7 +$23.4M, days 8-30 -$10.4M, days 31-90 +$26.1M: the cohort sold for three weeks, then came back in the last week. Windows count UTC calendar days, so "24h" is yesterday plus today, not a rolling 24 hours.

| Last day | Days 2-7 | Days 8-30 | Read |
|---|---|---|---|
| + | + | + | sustained accumulation |
| + | + | - | re-accumulation: turned from seller to buyer |
| + | - | any | a one-day buy after a quiet or selling week: weak until days 2-7 confirm |
| - | + | any | reducing after a build |
| - | - | - | distribution |

Then name the wallets behind the latest slice from the two `token transfers` lists: **rank on `net_tokens`** (bought - sold), not `bought` (every inbound transfer, flash-loan and router round trips included), and drop rows `wallet batch` calls `cex`, `dex` or `market_maker`. In the ENA 7d `bought` list the top row was Binance's 0x28c6...1d60 (net 141M tokens): an exchange, not the cohort.

## Anti-patterns

- No tool lists cohort members, and the `token transfers` lists are the top 10 by volume, not the cohort: say the named wallets are the largest net movers, not proven cohort members.
- Don't read a 1-day sign as a trend, and don't read a screener sign as a price call.
- Don't use it on bsc, base or hyperevm; there the answer is "no cohort data", not "no smart money".

## Pairs well with

- `vike-smart-money-discovery` (which tokens), `vike-token-screener` (columns), `vike-token-holder-diligence` (who holds it)
- `vike-perp-crowding` if the token has a perp listing
