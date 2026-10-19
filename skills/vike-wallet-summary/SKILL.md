---
name: vike-wallet-summary
description: Aggregate metrics for a single wallet — volume, inflow, outflow, net flow, tx count, tokens traded across 24h / 7d / 30d / 90d / all windows. Use when the user gives an address and asks "what's this wallet doing".
allowed-tools: Bash(vike-data:*)
---

# vike-wallet-summary

## Command

```bash
vike-data wallet summary <address> [--json]
```

## Output

Per-window rows: `window`, `volume_usd`, `inflow_usd`, `outflow_usd`, `net_flow_usd`, `tx_count`, `unique_tokens`.

## Reading tips

- **Net flow >> 0** = accumulator. Inflow heavy → still buying.
- **Net flow << 0** = distributor. Outflow heavy → still selling.
- **Volume high, net flow ≈ 0** = trader/MM (churn). Look at counterparty patterns separately.
- **Unique tokens high (>50)** = farmer / spray-and-pray. Lower signal per token.
- **Unique tokens low (<5), high volume** = concentrated conviction.

## Anti-patterns

- Don't claim a wallet is "smart money" based on summary alone — cross-reference with labels and PnL: `vike-data wallet discover --sort pnl` to see if this address is in the top-PnL set.
- A single big inflow can dominate `net_flow_usd` for a window — eyeball `tx_count` to gauge whether it's one trade or many.

## Pairs well with

- `vike-data wallet discover` to see if this wallet ranks in any leaderboard
- `vike-data token transfers` after identifying which tokens the wallet trades
