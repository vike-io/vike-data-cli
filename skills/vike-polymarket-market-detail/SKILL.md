---
name: vike-polymarket-market-detail
description: Deep-dive on a single Polymarket market — question, outcomes, current quotes, 24h volume, smart-money flows, top wallets active in it, resolution status. Use after vike-polymarket-markets when the user asks about a specific market.
allowed-tools: Bash(vike-data:*)
---

# vike-polymarket-market-detail

## Command

```bash
vike-data polymarket market <condition_id> [--json]
```

`condition_id` is a hex string (you'll have it from `vike-data polymarket markets` output).

## Example

```bash
vike-data polymarket markets --category Crypto --limit 5 --json
#   → pick a condition_id from the output, then:
vike-data polymarket market 0x1234abcd...
```

## What it returns

- Market metadata: question, slug, category, end_date, fee_rate_bps
- Current quotes for both outcomes (Yes / No mid / bid / ask)
- 24h volume + liquidity
- Smart-money cohort activity on this specific market (recent net flow)
- Top wallets (by trade count or volume) active here
- Resolution status (resolved / open / awaiting resolution)

## Anti-patterns

- Don't claim a market is "manipulated" from cohort flow alone. High cohort buy ≠ insider info — it might just be popular among the cohort.
- Resolution-pending markets can show stale mids. Cross-check with `last_traded` timestamp.

## Pairs well with

- `vike-polymarket-trader` — profile any interesting wallet you find in the top-wallets list
- `vike-polymarket-smart-money mode=mispricings` — markets where cohort bought below current mid
