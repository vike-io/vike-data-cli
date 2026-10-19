---
name: vike-hl-trader-profile
description: Profile a single Hyperliquid perp trader — leaderboard rank, recent performance, on-chain identity. Use when the user gives an HL wallet address and asks "is this trader any good" / "profile this address" / "what's this wallet's HL track record".
allowed-tools: Bash(vike:*)
---

# vike-hl-trader-profile

Composite profile combining ranking, identity, and trading metrics.

## Steps

### 1. On-chain identity + balance

```bash
vike-data wallet summary <address> --json
```

Captures: total volume, inflow/outflow, tx count, unique tokens across ETH/BSC/Base. Tells you if the address is HL-only or also active on spot chains.

### 2. HL leaderboard rank

```bash
vike-data perp top-traders --window 30d --sort pnl --size 20 --json
vike-data perp top-traders --window 7d  --sort pnl --size 20 --json
```

Search the returned rows for the address. Report rank if found, "outside top 20" otherwise.

### 3. ROI + win rate context

```bash
vike-data perp top-traders --sort roi --window 30d --min-trades 10 --size 20 --json
vike-data perp top-traders --sort win_rate --window 30d --min-trades 10 --size 20 --json
```

Same address-search; report rank or "not in top 20".

## Verdict template

> **`<address>` — Hyperliquid trader profile (30d)**
> - PnL: `$X` (rank #Y of top 20) or (outside top 20)
> - ROI: `Z%` (rank ...) or (outside top 20)
> - Win rate: `W%` over N trades
> - Spot activity: `<volume_usd>` total across ETH/BSC/Base, `<tokens>` unique
> - Classification: **whale / sharp / volume / one-shot / unverified**

## Classification heuristics

| Pattern | Label |
|---|---|
| Top-20 PnL + high ROI + many trades + low DD | **Sharp** |
| Top-20 PnL + low ROI + huge volume | **Whale** (size matters more than skill) |
| Outside leaderboard + high win rate on <10 trades | **Unverified — too few data points** |
| One big trade dominates PnL | **One-shot** (lucky directional bet) |
| Wallet age < 30d | **Too new — re-check in a month** |

## Anti-patterns

- Don't claim "this is one of the best HL traders" from win rate alone — need volume + trade count for context.
- A wallet outside the top 20 isn't bad — only ~0.01% of HL wallets make top 20 in any window.

## Pairs well with

- `vike-hl-top-traders` for the leaderboard context
