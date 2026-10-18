---
name: vike-token-research
description: Full token research playbook — search → transfers → chart → flow direction → buyer/seller verdict. Use when the user asks "research <token>" or "what's happening with <token>".
allowed-tools: Bash(vike:*)
---

# vike-token-research

Multi-call token research workflow.

## Steps

1. **Resolve address** (skip if user already gave one)
   ```bash
   vike-data token search <symbol> --chain <chain> --limit 3 --json
   ```
   Pick the highest-volume match; capture the address.

2. **Recent buyers + sellers** (parallel calls)
   ```bash
   vike-data token transfers <addr> --tab bought --period 24h --chain <chain> --json
   vike-data token transfers <addr> --tab sold   --period 24h --chain <chain> --json
   ```

## Verdict heuristics

After step 2, classify direction-of-pressure:

| Buyer count vs seller count (24h) | Verdict |
|---|---|
| Buyers > 2× sellers and net inflow > $1M | **Accumulation** |
| Sellers > 2× buyers and net outflow > $1M | **Distribution** |
| Roughly even (within 1.5×) | **Churn / range-bound** |
| Both very low | **Illiquid — skip the read** |

Cross-check against the chart: distribution + falling price = bearish; accumulation + flat price = stealth bid (interesting).

## Anti-patterns

- Don't run `transfers --period 30d` first — use 24h to see what's happening *now*; 30d for context only if needed.
- Don't quote the first row of `token search` blindly — if the symbol has cross-chain collisions (`FUN`, `BEAM`, `LDO`), inspect `chain` + `address` for each result before picking.

## Cost note

Step 1: cheap. Step 2: 2× cheap. Step 3: cheap. Total ≈ 4 calls.

## Pairs well with

- `vike-smart-money-discovery` to find which smart wallets are involved
- `vike-perp-funding-arb` if the token has a perp listing (BTC/ETH/SOL/major alts)
