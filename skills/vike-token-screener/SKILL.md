---
name: vike-token-screener
description: Token discovery filter — rank tokens by volume / net inflow / holder count / smart-money inflow within a window, with min-volume and min-holder filters. Use when the user asks "what tokens are trending today" / "find tokens with smart money accumulating" / "rising tokens this week" / token discovery from scratch.
allowed-tools: Bash(vike-data:*)
---

# vike-token-screener

## Command

```bash
vike-data token screener
  [--chain ethereum|bsc|base]
  [--window 24h|7d|30d|90d]
  [--sort volume|net_inflow|holders|smart_inflow]
  [--limit N]              (max 100)
  [--min-volume USD]       (filter dust)
  [--min-holders N]        (require N+ unique holders)
  [--smart-money-only]     (restrict to smart-money cohort flows)
  [--json]
```

## Examples

```bash
# Trending today by volume
vike-data token screener --window 24h --sort volume --limit 20

# Find tokens smart money is accumulating
vike-data token screener --window 7d --sort smart_inflow --smart-money-only

# Rising holders count (organic growth signal)
vike-data token screener --window 30d --sort holders --min-volume 100000

# Mid-cap tokens with real activity
vike-data token screener --min-volume 1000000 --min-holders 100 --sort net_inflow
```

## Output columns

`token_address`, `symbol` (when known), `name`, `volume_usd`, `net_flow_usd`, `in_usd`, `out_usd`, `unique_holders`, `tx_count`.

## Sort modes

| Sort | What it surfaces |
|---|---|
| `volume` | Most-traded tokens (default) — captures attention-driven action |
| `net_inflow` | Tokens with biggest accumulation (in > out) — "what's being bought" |
| `holders` | Tokens gaining unique addresses — organic growth signal |
| `smart_inflow` | Tokens our smart-money cohort is buying — alpha signal |

## Reading

- **High volume + balanced in/out** = churn (DEX MM, arb bots). Low signal.
- **High volume + strong net_inflow** = real demand. Worth investigating.
- **Strong holder growth + flat volume** = small buys, distribution widening. Often early signal.
- **`smart_inflow` mode** + high values + low overall volume = cohort is positioned BEFORE retail. Highest-conviction signal in the tool.

## Filter tips

| Goal | Filters |
|---|---|
| "Rising memecoins" | `--window 24h --sort holders --min-holders 50 --min-volume 50000` |
| "Mid-cap alpha" | `--sort smart_inflow --min-volume 500000 --smart-money-only` |
| "What's getting dumped" | `--sort net_inflow` then reverse — bottom rows have biggest outflows |

## Anti-patterns

- Don't quote the symbol as authoritative if `symbol` is null/blank — token hasn't been mapped, identify by address instead
- Don't use `--window 24h --sort smart_inflow` for hot-new-token discovery — smart money usually positions BEFORE the 24h window; try `--window 7d` for that mode
- Don't omit `--min-holders` when sorting by holders — junk airdrops with 50,000 1-tx addresses dominate the top otherwise
- Don't omit `--min-volume` when sorting by net_inflow — tiny tokens with $100 net flow can rank high in % terms

## Cost note

3 credits per call. Cheaper than `wallet trace` (which is 4) but heavier than per-tool lookups. Use deliberately for discovery, not as a default.

## Pairs well with

- `vike-data token holders <addr>` — drill into the top holders of any flagged token
- `vike-data token transfers <addr>` — see WHO is buying/selling once a token is interesting
- `vike-smart-money-discovery` — composite playbook starting from this screen
