---
name: vike-wallet-portfolio
description: Composite wallet portfolio view — combines ENS + labels + ERC-20 balances + DeFi positions + recent net flow in one report. Use when the user gives a wallet address and asks for a complete picture ("full report on X" / "everything about this wallet" / "wallet snapshot").
allowed-tools: Bash(vike:*)
---

# vike-wallet-portfolio

Multi-call playbook for a complete wallet snapshot.

## Workflow (run in parallel where possible)

```bash
ADDR=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045

vike wallet ens     $ADDR --json &     # cheap, ~1 credit
vike labels         $ADDR --json &     # cheap, ~1 credit
vike wallet summary $ADDR --json &     # cheap, ~2 credits
vike wallet balances $ADDR --json &    # multi-chain, ~3 credits
vike wallet pnl-history $ADDR --days 30 --json &
wait
```

## Report template

> **`<ENS or 0x...>` — wallet snapshot**
> - **Identity:** `<ens.eth>` · `<entity (from labels)>` · `<wallet_type>` (confidence: `<H/M/L>`)
> - **Total ERC-20:** `$X` across `<chains>`. Top 3 by USD: `<symbol1 $X>`, `<symbol2 $Y>`, ...
> - **DeFi positions:** `$Y` across `<protocols count>` protocols. Top: `<Aave V3 $X>`, ...
> - **30d net flow:** `+/-$Z` (cumulative)
> - **Activity:** `<tx_count>` txns last 30d, `<unique_tokens>` unique tokens traded
> - **Vibe check:** `<saver / trader / farmer / institutional / inactive / fresh>`

## Vibe-check rubric

| Pattern | Label |
|---|---|
| `wallet_type = "cex"` or `"market_maker"` | **Institutional** |
| 80%+ in stablecoins, low tx count | **Saver / dry powder** |
| 50+ unique tokens 30d, low avg holding USD | **Airdrop farmer** |
| High tx count, balanced sent/received | **Active trader** |
| Big DeFi positions, low ERC-20 balance | **DeFi native** |
| Big ERC-20 holdings, no DeFi | **HODLer** |
| Zero activity 30d | **Inactive** |
| First-seen < 30d ago | **Fresh wallet** |

## Cost

~5 parallel calls, ~9 credits total. Use sparingly — only when the user wants the FULL picture, not a single dimension.

## When to use a focused skill instead

- "Just labels for X" → `vike-wallet-label-provenance`
- "What does X hold" → `vike-wallet-balances`
- "Top counterparties of X" → `vike-wallet-counterparties`

## Pairs well with

- `vike-smart-money-discovery` to put the wallet in context vs the broader top-PnL cohort
