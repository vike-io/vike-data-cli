---
name: vike-wallet-portfolio
description: Composite wallet view — combines ENS + labels + token balances + recent flow + top counterparties in one report. Use when the user gives a wallet address and asks for a complete picture ("full report on X" / "everything about this wallet" / "wallet snapshot" / "who is this wallet").
allowed-tools: Bash(vike-data:*)
---

# vike-wallet-portfolio

Multi-call playbook for a complete wallet snapshot. It reports what the tools return: identity, token balances, flows and counterparties. There is **no DeFi-position data** in any tool, so never report protocol positions.

## Workflow (run in parallel where possible)

```bash
ADDR=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045

vike-data wallet ens     $ADDR --json &     # 1 credit
vike-data labels         $ADDR --json &     # 1 credit
vike-data wallet summary $ADDR --json &     # 2 credits
vike-data wallet balances $ADDR --json &    # 3 credits (Ethereum and BSC)
vike-data wallet counterparties $ADDR --window 30d --limit 10 --json &   # 2 credits
wait
```

Then label the counterparties in one call: `vike-data wallet batch <cp1> <cp2> ... --json` (2 credits). A top counterparty that is a CEX tells you which exchange the wallet uses; an unlabelled high-volume counterparty is worth a `wallet compare` or `wallet trace`.

## Report template

> **`<ENS or 0x...>` — wallet snapshot**
> - **Identity:** `<ens.eth>` · `<entity (from labels)>` · `<wallet_type>` (confidence: `<H/M/L>`). If `labels` says `found: false`, say "not in our label table".
> - **Priced token holdings:** `$X` (floor: unpriced tokens and the native coin are excluded from the total) across `<chains_scanned>`. Top 3 by USD: `<symbol1 $X>`, ... Native balance: `<n ETH/BNB>`.
> - **30d flow:** `+/-$Z` net (`summary["30d"].net_flow`), one chain.
> - **Activity:** `<tx_count>` transfers in 30d, `<tokens_traded>` tokens traded all-time.
> - **Top counterparties:** `<entity or address>` · `$volume`, ...
> - **Vibe check:** `<saver / trader / farmer / institutional / inactive / fresh>`

## Vibe-check rubric

| Pattern | Label |
|---|---|
| `wallet_type = "cex"` or `"market_maker"` | **Institutional** |
| 80%+ of priced holdings in stablecoins, low tx count | **Saver / dry powder** |
| `tokens_traded` 50+, low average holding USD | **Airdrop farmer** |
| High tx count, balanced inflow / outflow | **Active trader** |
| Big priced holdings, low tx count | **HODLer** |
| Zero `tx_count` in `30d` | **Inactive** |
| `first_seen` (from `all`) < 30d ago | **Fresh wallet** |

## Cost

6 calls, about 11 credits. Use sparingly — only when the user wants the FULL picture, not a single dimension.

## When to use a focused skill instead

- "Just labels for X" → `vike-wallet-label-provenance`
- "What does X hold" → `vike-wallet-balances`
- "Top counterparties of X" → `vike-wallet-counterparties`

## Pairs well with

- `vike-wallet-trace` to follow the money out of the wallet
- `vike-smart-money-discovery` to put a token the wallet trades in context
