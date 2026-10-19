---
name: vike-polymarket-trader
description: Profile a Polymarket wallet — realized PnL across 24h / 7d / 30d / all, hit-rate on resolved markets, total volume, top categories traded, recent positions. Use when the user gives a Polymarket wallet address.
allowed-tools: Bash(vike-data:*)
---

# vike-polymarket-trader

## Command

```bash
vike-data polymarket wallet <address> [--window 24h|7d|30d|all] [--json]
```

## Example

```bash
vike-data polymarket wallet 0xabcdef1234... --window 30d
vike-data pm wallet 0xabcdef1234... --json     # `pm` alias
```

## Output

Per-wallet summary:
- `realized_pnl_usd` (lifetime + windowed)
- `hit_rate_pct` (resolved markets only)
- `resolved_markets` (count — denominator for hit_rate)
- `volume_all_usd`, `volume_<window>_usd`
- `trades_all`, `trades_<window>`
- Category breakdown (Crypto/Sports/Politics/etc.)
- Last seen timestamp

## Reading

| Pattern | Read |
|---|---|
| `hit_rate_pct > 60` with `resolved_markets > 20` | **Skilled** — consistent over a real sample |
| `hit_rate_pct > 80` with `resolved_markets < 10` | **Lucky — too few data points** |
| Positive PnL but `hit_rate_pct < 50` | **Asymmetric bettor** — wins big when right, loses small |
| Negative PnL with high volume | **Volume trader / MM-style** — pays the spread |
| One category dominates >80% of activity | **Specialist** — only trust their reads in that category |

## Hit-rate caveat

`hit_rate_pct` is computed only on **resolved** markets. A wallet with 100 trades but only 5 resolved has a hit_rate based on those 5. Always inspect `resolved_markets` before quoting hit_rate.

## Anti-patterns

- Don't claim "this trader is good at predictions" from <10 resolved markets. Below that, hit_rate is noise.
- Multi-category specialists are rare. If the wallet trades 5+ categories, treat hit_rate as a generic "good at probabilities" signal, not "deep edge".

## Pairs well with

- `vike-polymarket-market-detail` — see which markets they're currently in
- `vike-polymarket-smart-money` — confirm they're in the smart-money cohort
