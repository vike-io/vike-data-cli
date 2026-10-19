---
name: vike-hl-cohort-backtest
description: Method for testing whether a Hyperliquid wallet cohort's positioning led or lagged price, with point-in-time labels and without look-ahead - which axes are honest, how to align hours, the seams and controls, how to report. Describes a method on this data; it does not claim a tradable edge. Use when the user asks "did whale / smart money positioning predict BTC" / "backtest the cohort signal" / "does the smart-minus-rekt spread lead price" / "lead or lag of Hyperliquid cohorts".
allowed-tools: Bash(vike-data:*)
---

# vike-hl-cohort-backtest

Cohort positioning against price over history. A single `--hours` call returns `hours x rungs` rows (2160 hours of the 13-rung `pnl` axis = 28,080 rows, about 13 MB, 3 s), so **write the pull to a file and analyse it with code; never print it into the conversation.** 2 credits for the two pulls.

## Pull

```bash
vike-data hl cohort-metrics BTC --axis pnl --label-basis point_in_time --hours 2160 --json > tmp/btc_pnl_pit.json
vike-data hl cohort-metrics BTC --axis size --hours 2160 --json > tmp/btc_size.json
vike-data candles hl BTC --interval 1h --start 2026-07-19T00:00:00Z --limit 5000 --json > tmp/btc_1h.json
```

Rows: `ts` (hour, UTC), `cohort`, `total_position_value`, `total_position_value_long` (USD notional), `bias` (fraction -1..+1). Newest hour first; page older data with `nextCursor` -> `--cursor`, which pages by whole hours. Candles: `candles[].ts` is epoch ms, left-aligned.

## Which labels are honest

| Axis / option | Look-ahead? |
|---|---|
| `pnl` with `--label-basis point_in_time` | No. Point-in-time history starts 2026-04-07 (earlier hours return nothing). |
| `size`, `tier` | No by construction: account value or position size at that hour |
| `pnl` default (`current`) | **Yes**: today's grading applied to old hours; a wallet that is smart now labels a period when it was not |
| `pnl_abs` | **Yes** always: dollar bands of today's PnL |
| `pnl_unrealized` | No, but it grades POSITIONING (who is currently onside), not skill; it turns over about 44% of wallets a day against about 2.4% for the realized ladder, and part of it restates the move that just happened |
| `--grading realized-pit` | A frozen control that stops growing: a recent window comes back short, and `freshness.behind_hours` / `stale` say by how much |

Read `label_computed` on every response: it names the source and the seam. **Label resolution changes at 2026-08-06**: daily labels before (rank as of the end of the previous day, constant across that day's 24 hours), hourly after. A turnover count or a difference taken across the seam shows an artefact that looks like a regime change; split the sample there or use `realized-pit` as the control. Older rows also carry `null` in `position_count`, `position_count_long`, `total_unrealized_pnl`, `total_position_size*` (listed in `unavailable_fields`); use only the notional columns and `bias`, and never treat null as 0.

## Signal definitions

- Group several rungs by summing notional: `bias_g = (2*sum(L) - sum(V)) / sum(V)` with `L = total_position_value_long`, `V = total_position_value`. Never average the biases.
- Level (`bias_g`), change (`bias_g[t] - bias_g[t-k]`), or the spread between a top group (`3x smart`, `2x smart`, `smart`) and a bottom group (`rekt`, `2x rekt`, `3x rekt`). Live, BTC newest hour: smart -0.100, rekt +0.071, spread -0.171. Leave `unknown` out.

## Alignment and statistics

1. The in-progress hour is never returned, so a row stamped `T` is only knowable once hour `T` has closed. Measure forward returns from the OPEN of candle `T+1h`, never from candle `T`. Check the alignment on your own sample before trusting a lag of one or two hours.
2. Forward returns at several horizons (1h, 4h, 24h) and lead/lag correlations over lags in both directions. If the cohort follows price (bias changes AFTER the return), that is positioning chasing price, not a lead.
3. Neighbouring hours overlap and positions are autocorrelated: report the number of independent observations, not the number of hours, and a confidence interval. Count the cohorts, lags and horizons you tried and correct for it.
4. Split the sample (before / after 2026-08-06, or first half / second half) and say which half the result lives in.
5. Add a placebo: the same test on the `size` axis, or on a shuffled cohort assignment.

## What to report

> On `<symbol>`, `<axis>` with point-in-time labels, `<start>` to `<end>` (`N` hours, about `M` independent): `<signal>` vs the `<h>`-hour forward return from the next candle's open: correlation `<r>` (CI `<lo, hi>`); first half `<r1>`, second half `<r2>`; placebo `<r0>`. Labels change resolution on 2026-08-06. This describes this sample; it is not an out-of-sample test or a trading rule, and costs, funding and slippage are not included.

## Anti-patterns

- Don't use the default `pnl` labels, `pnl_abs`, or a `pnl` window that is not `point_in_time` for anything backtest-like.
- Don't quote a hit rate without the sample size and the placebo; don't call a lag "alpha".
- Don't extrapolate: history is about six months, one regime.

## Pairs well with

- `vike-hl-cohort-positioning` for the current read, `vike-candles` for the price series, `vike-hl-asset-briefing` for context
