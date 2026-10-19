---
name: vike-wallet-discover
description: Rank wallets by volume / inflow / outflow / pnl / net_flow / tx_count across a time window. Use when the user asks "top wallets on X" / "best traders by PnL" / "biggest buyers last 7d".
allowed-tools: Bash(vike:*)
---

# vike-wallet-discover

## Command

```bash
vike-data wallet discover
  [--window 24h|7d|30d|90d|all]
  [--sort volume|inflow|outflow|net_flow|tx_count|pnl]
  [--order asc|desc]
  [--chain ethereum|bsc]
  [--size N]      # max 20
  [--json]
```

## When to use

| Question | Flags |
|---|---|
| "Top whales by volume this week" | `--sort volume --window 7d` |
| "Biggest accumulators last 30d" | `--sort net_flow --window 30d --order desc` |
| "Top realized-PnL traders all-time" | `--sort pnl --window all` |
| "Wallets dumping the most this 24h" | `--sort outflow --window 24h` |
| "Most active traders last 7d" | `--sort tx_count --window 7d` |

## Output columns

`address`, `label` (when known), `volume_usd`, `inflow_usd`, `outflow_usd`, `net_flow_usd`, `tx_count`, `realized_pnl_usd`.

## Reading tips

- Labeled wallets first — `label = "binance_cold_t1"` means it's a CEX hot/cold wallet, not a discretionary trader.
- Always filter mentally for unlabeled wallets first if the user wants "real traders" (not exchanges).
- For PnL sort, realized PnL only — open positions are NOT counted. Use `vike-data perp top-traders` for HL perps PnL (which includes unrealized).

## Anti-patterns

- `--size > 20` is silently clamped to 20. Run a second call with offset (not currently supported — limit applies hard) if you need more.
- `--sort pnl` is only meaningful on `--window 30d` or longer; 24h PnL is noise.

## Pairs well with

- `vike-data wallet summary <address>` to drill into any interesting row
- `vike-smart-money-discovery` for a composite multi-signal read
