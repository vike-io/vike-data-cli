---
name: vike-polymarket-smart-money
description: Smart-money signals on Polymarket. Two modes — flows (markets with largest net cohort inflow) or mispricings (markets where cohort bought meaningfully below current mid). Use when the user asks "what is smart money buying on Polymarket" or "any prediction-market alpha".
allowed-tools: Bash(vike:*)
---

# vike-polymarket-smart-money

The "smart-money cohort" is wallets meeting all three criteria:
- ≥ $1,000 lifetime realized PnL
- ≥ 5 resolved markets (so hit-rate is meaningful)
- ≥ $5,000 lifetime volume

## Command

```bash
vike-data polymarket smart-money --mode flows|mispricings [--hours N] [--category C] [--limit N] [--json]
```

## Mode A — flows (default)

```bash
vike-data polymarket smart-money --mode flows --hours 24 --category all
```

Markets with the largest **net buy** from cohort wallets in the last N hours.
`net_flow = buy_inflow - sell_outflow`. Useful for "where is smart money concentrating today".

Output: `condition_id`, `title`, `slug`, `smart_wallets` (cohort count), `buy_inflow_usd`, `sell_outflow_usd`, `trades`, `latest_yes_mid`.

## Mode B — mispricings

```bash
vike-data polymarket smart-money --mode mispricings --hours 24 --category Crypto
```

Markets where cohort wallets recently bought meaningfully **below** the current mid — i.e. the market has moved away from where cohort got their fills.

Output: `condition_id`, `title`, `slug`, `side` (Yes or No), `smart_avg_buy`, `current_mid`, `delta_pct`, `smart_buy_usd`.

`delta_pct > 5` = cohort got in 5+ cents better than current. Potential edge if you think cohort was right.

## Reading

- **Flows**: high net inflow + low `smart_wallets` count = concentrated bet (few wallets, big size). Higher conviction signal than diffuse inflow across 50 wallets.
- **Mispricings**: high `delta_pct` is interesting only when paired with cohort that has a history in that category. Cross-check with `vike-polymarket-trader` on the top wallets.

## Anti-patterns

- Don't treat "smart-money cohort" as omniscient. They're filtered for past performance — survivorship bias applies, especially in fast-moving political markets.
- Mispricings can be slow-to-resolve. A 5% mispricing on a market resolving in 3 months might be efficient pricing for tail risk, not edge.
- Don't combine the cohort definition with strict ROI filters — the cohort is built on realized PnL, not Sharpe.

## Pairs well with

- `vike-polymarket-market-detail` — drill into a flagged market
- `vike-polymarket-trader` — profile the top wallets active in flagged markets
- `vike-polymarket-screener` — full multi-call market scan
