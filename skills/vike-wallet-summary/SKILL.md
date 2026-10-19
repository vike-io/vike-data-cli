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

No chain flag: one call returns every window, for one chain.

## Output

A JSON object keyed by window: `all`, `90d`, `30d`, `7d`, `24h`. Each window holds:

`total_volume`, `total_inflow`, `total_outflow`, `net_flow` (USD), `tx_count`, `tokens_traded`, `first_seen`, `last_active`.

- **One chain only.** The figures are for the chain where the wallet was most recently active, never summed across chains, and the response does not say which. For a specific chain use `wallet transactions --chain` or `wallet pnl-history --chain`.
- **`tokens_traded`, `first_seen` and `last_active` are all-time** and repeat in every window: read them from `all` and ignore the copies. There is no per-window token count.
- A window with no activity is present and zeroed (`24h` often is), not omitted.
- Refreshed nightly: a wallet active in the last hours may not show yet.
- It carries no PnL, no holdings, no labels and no Hyperliquid data. For those: `wallet balances`, `labels` / `wallet batch`, and `perp top-traders`.

## Reading tips

- **`net_flow` >> 0** = accumulator. Inflow heavy → still buying.
- **`net_flow` << 0** = distributor. Outflow heavy → still selling.
- **Volume high, `net_flow` ≈ 0** = trader/MM (churn). Look at counterparty patterns separately.
- **`tokens_traded` high (>50)** = farmer / spray-and-pray. Lower signal per token.
- **`tokens_traded` low (<5), high volume** = concentrated conviction.
- Lifetime `all` against a quiet `30d` (e.g. 900k lifetime transactions, 18 in 30d) = a long-lived wallet that is quiet now. Don't size a wallet up on `all` alone.

## Anti-patterns

- Don't claim a wallet is "smart money" based on summary alone: it has no PnL. Check labels with `vike-data labels <addr>` or `vike-data wallet batch`.
- A single big inflow can dominate `net_flow` for a window — eyeball `tx_count` to gauge whether it's one trade or many.
- Don't describe the result as "across ETH/BSC/Base": it is one chain.

## Pairs well with

- `vike-data labels <addr>` / `vike-data wallet batch` to say who the wallet is
- `vike-data wallet balances <addr>` for current holdings
- `vike-data token transfers` after identifying which tokens the wallet trades
