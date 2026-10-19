---
name: vike-smart-money-discovery
description: Multi-signal smart money discovery — find wallets currently accumulating a token, ranked by realized PnL track record. Use when the user asks "is smart money buying X" / "find smart money on Y chain" / "any alpha wallets in Z".
allowed-tools: Bash(vike:*)
---

# vike-smart-money-discovery

Composite playbook — combines wallet leaderboards + token-side buyer list + label inspection.

## Workflow

### A. Top realized-PnL wallets on a chain

```bash
vike-data wallet discover --sort pnl --window 90d --chain ethereum --size 20 --json
```

Keep only rows where:
- `realized_pnl_usd > 100_000` (real conviction, not noise)
- `tx_count > 20` (not a single lucky trade)
- `label` is empty OR not a known CEX (these are real wallets, not exchanges)

That set = your "smart money universe" for the next step.

### B. Cross-reference with a specific token

If the user asks about a specific token, resolve it first:

```bash
vike-data token search <symbol> --chain <chain> --limit 3 --json
```

Then list its recent buyers:

```bash
vike-data token transfers <addr> --tab bought --period 7d --chain <chain> --json
```

**Intersect** the buyer addresses with your smart-money universe from step A. Any overlap = a smart-money wallet currently accumulating this token.

### C. Profile each match

For every overlap address, run:

```bash
vike-data wallet summary <addr> --json
```

Report:
- Address
- Known label (if any)
- 90d realized PnL
- 7d net flow on this token
- 30d total volume

## Verdict template

> **Smart-money take on $TOKEN:** N of top-20 90d-PnL wallets (>$100k realized) bought $TOKEN in the last 7 days. Strongest names: `<addr1> (+$X PnL, label?)`, `<addr2> ...`. Aggregate net flow into $TOKEN from this cohort: $Y. **Read: accumulation / churn / no-signal.**

## Anti-patterns

- Don't accept any wallet labeled as a CEX (binance/coinbase/bybit/etc.) as "smart money" — they're aggregators.
- Don't lower the PnL threshold to <$50k just to find more matches; below that, signal-to-noise is poor.
- Single-token wallets (`unique_tokens < 3`) are usually airdrop-flippers, not strategic.

## Cost note

3 calls per discovery: 1× `wallet discover`, 1× `token transfers`, then 1× `wallet summary` per match (cap at 5).

## Pairs well with

- `vike-token-research` for the price/flow context
- `vike-perp-funding-arb` if the token has a perp listing (positioning bias)
