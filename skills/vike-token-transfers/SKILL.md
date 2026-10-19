---
name: vike-token-transfers
description: Top buyers or top sellers of a specific token over a window, with net token and USD flow per wallet. Use when the user asks "who bought X" / "who sold X" / "is whale Y buying Z".
allowed-tools: Bash(vike-data:*)
---

# vike-token-transfers

## Command

```bash
vike-data token transfers <token_address>
  [--tab bought|sold]            # default sold; ONE side per call
  [--period 1h|24h|7d|30d]       # default 24h
  [--chain ethereum|bsc|base|hyperevm|all]
  [--json]
```

There is no `--limit`: every call returns the top 10 wallets for that side. For both sides, call twice.

## When to use

- "Who's accumulating X?" → `--tab bought --period 24h`, then read `net_tokens`
- "Who's dumping X?" → `--tab sold --period 24h`, then read `net_tokens`
- "Smart money on X this week" → `--tab bought --period 7d`, label the addresses with `vike-data wallet batch`

## Output columns

Each row is one wallet: `address`, `bought`, `sold`, `net_tokens`, `usd_spent`, `usd_received`, `net_usd`, `chains`. Amounts are whole tokens and plain USD. The remaining fields (`addr_short`, the `*_fmt` strings, `net_usd_raw`, `net_bar_pct`) are pre-rendered for a UI: ignore them.

There is no `qty`, `usd_value`, `label` or `tx_count` column. To label an address use `vike-data wallet batch`.

## Reading tips

- **`bought` is every inbound transfer, not purchases.** It includes flash-loan and router round trips. A wallet at the top of `--tab bought` with `bought ≈ sold` and `net_tokens ≈ 0` is a bot or venue passing tokens through, not a buyer. **Rank and judge by `net_tokens`** (bought − sold): positive = net accumulator, negative = net distributor.
- **Signs differ by convention.** `net_usd = usd_received − usd_spent`, so a net buyer has `net_tokens > 0` and `net_usd < 0`, and a net seller has `net_usd > 0`. Do not read a positive `net_usd` as "bought".
- The two sides of the same period are separate top-10 lists. The same wallet in both = market maker / churn, not a signal.
- The window ends at the token's newest PRICED row, not at the current time. For an illiquid token it can be hours behind "now".
- Many small transfers from labeled exchanges = retail flow via that CEX.
- The native coin appears as `0x0000000000000000000000000000000000000000` in the screener and has no buyers here. Pass a contract address.

## Anti-patterns

- Don't call a wallet a buyer or seller from `bought` / `sold` alone. Check `net_tokens`.
- Don't request `--chain all` unless you really need cross-chain: it maps the address to the token's address on each chain and is slower.
- 1h period is sparse for low-liquidity tokens. Use 24h as the default starting window.
- Don't treat the 10 rows as the token's whole market: they are the top 10 by volume on one side.

## Pairs well with

- `vike-data wallet batch <addr...>` to label the rows and drop CEX / router rows
- `vike-data wallet summary <addr>` to profile any interesting buyer/seller
- `vike-token-smart-money-trend` to put the buyers next to the smart-money cohort's flow over time
