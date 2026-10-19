---
name: vike-hl-liquidation-radar
description: Where Hyperliquid liquidations are likely - which liquid symbols have the most open interest near liquidation, where one symbol's liquidation clusters sit around the mark, and which liquidations just happened. Use when the user asks "which coins are closest to a liquidation cascade" / "where are ETH liquidations clustered" / "liquidation heatmap" / "who just got liquidated on Hyperliquid".
allowed-tools: Bash(vike-data:*)
---

# vike-hl-liquidation-radar

Three views of the same idea, 3-4 calls, about 4 credits. Positions come from 5-minute snapshots, so every liquidation figure is inferred from them, not read from the venue.

## Chain

```bash
vike-data hl liquidations --view risk --limit 500 --json            # 1  every symbol, ranked by percent_risk
vike-data hl liquidations --view heatmap --symbol ETH --bins 20 --json   # 1  liquidation value per price bin
vike-data hl liquidations --view fills --symbol ETH --direction long --limit 20 --json   # 1  recent realized
vike-data candles hl ETH --interval 1h --limit 48 --json            # 1  distance from the mark to the clusters
```

## Reading

- **`risk`**: rows `symbol`, `total_value_usd`, `risk_value_usd`, `percent_risk` (a **fraction**, 0.234 = 23.4%), `positions_count`, `at_risk_count`. A position is at risk when it sits within half of its liquidation buffer. The ranking is by `percent_risk`, so thin markets lead: the top live rows were `para:GLW` ($0.86M open) and `xyz:ZHIPU` ($17M). **Filter on `total_value_usd` yourself** (the tool has no minimum): of 341 symbols, 39 had $50M or more open, led by AAVE ($57M, 23.4%), `xyz:CRCL`, `xyz:META` and HYPE ($1.59B, 13.9%, 908 positions at risk), while ETH read 8.4% and BTC 3.8%. Add `--axis size|pnl|pnl_abs --cohort <label>` to ask the same of one cohort.
- **`heatmap`** (`--symbol` required, `--bins` 5-500): bins are equal-width over +-50% of `mark_price` (`window.price_low` / `price_high`), each with `liquidation_value_usd`, `positions_count`, `long_value_usd`, `short_value_usd`, `most_impacted_cohort`. **Long liquidations sit below the mark** (price falling), shorts above. `coverage` says what the map leaves out: positions beyond +-50% and positions with no liquidation price (`in_window_fraction_of_open`: 0.67 for BTC), so a cluster is a floor.
- **`fills`**: `liq_ts`, `wallet`, `symbol`, `side` (the side of the position that was CLOSED: `long` = longs liquidated = price falling), `size_usd`, `mark_price`, and `pnl_cohort` with `pnl_cohort_basis` (`point_in_time` where an hourly label exists, else `current`). `--wallet <addr>` asks whether one wallet was liquidated. History reaches back to 2026-01-01. In a live sample most rows were small ($100-$13k): sort by `size_usd` before quoting.
- Liquidation prices move with margin, price and funding; a cluster is a snapshot, not a level that will be hit.

## Answer template

> Closest to a cascade among symbols with at least $50M open: `<symbol>` `<percent_risk>` (`$risk` of `$total`). `<ETH>`: `$V` of long notional liquidates between `<p1>` and `<p2>` (`<x%>` below the mark), `$W` of shorts above `<p3>`; the map covers `<c>` of open notional. Last hour: `<n>` long liquidations, largest `$M`.

## Anti-patterns

- Don't rank micro-cap or HIP-3 markets next to BTC without the notional filter.
- Don't write `percent_risk` as a percent without multiplying, or treat the heatmap as complete.
- Don't predict a cascade: say where open interest is exposed.

## Pairs well with

- `vike-hl-asset-briefing`, `vike-hl-cohort-positioning` (who holds the exposed side), `vike-candles`
