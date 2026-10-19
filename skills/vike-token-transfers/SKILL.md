---
name: vike-token-transfers
description: Top buyers or top sellers of a specific token over a window. Use when the user asks "who bought X" / "who sold X" / "is whale Y buying Z".
allowed-tools: Bash(vike-data:*)
---

# vike-token-transfers

## Command

```bash
vike-data token transfers <token_address>
  [--tab bought|sold]
  [--period 1h|24h|7d|30d]
  [--chain ethereum|bsc|base|all]
  [--json]
```

## When to use

- "Who's accumulating X?" → `--tab bought --period 24h`
- "Who's dumping X?" → `--tab sold --period 24h`
- "Smart money on X this week" → `--tab bought --period 7d`, then cross-reference labels

## Output columns

Each row is one wallet: `address`, `qty`, `usd_value`, `label` (if known), `tx_count`.

## Reading tips

- The same wallet appearing in both `bought` and `sold` lists for the same period = market maker / churn (not a signal).
- High `usd_value` with low `tx_count` = a single large discretionary trade. Worth investigating with `vike-data wallet summary <address>`.
- Many small transfers from labeled exchanges = retail flow via that CEX (Binance, Coinbase, etc.).

## Anti-patterns

- Don't request `--chain all` unless you really need cross-chain — it's slower and returns more rows.
- 1h period is sparse for low-liquidity tokens. Use 24h as the default starting window.

## Pairs well with

- `vike-data wallet summary <addr>` to profile any interesting buyer/seller
