---
name: vike-polymarket-screener
description: Polymarket market screener combining trending markets + smart-money flows + mispricings in one pass. Use when the user asks "give me a Polymarket overview" / "what's happening in prediction markets today".
allowed-tools: Bash(vike-data:*)
---

# vike-polymarket-screener

Composite playbook — 3 parallel calls for a complete prediction-market snapshot.

## Workflow

```bash
vike-data polymarket markets --category all --limit 10 --json &
vike-data polymarket smart-money --mode flows --hours 24 --json &
vike-data polymarket smart-money --mode mispricings --hours 24 --json &
wait
```

## Report template

> **Polymarket snapshot (last 24h)**
>
> **Top 5 trending markets by volume**
> - `<question>` (`<category>`) — Yes mid `<m>`, 24h vol `$X` — ends `<date>`
> - ...
>
> **Top 5 smart-money inflows**
> - `<title>` (`<slug>`) — `<smart_wallets>` cohort wallets, net inflow `$X`, latest Yes mid `<m>`
> - ...
>
> **Top 5 mispricings**
> - `<title>` (`<side>`) — cohort avg buy `<p>`, current mid `<m>`, delta `<d>%`, cohort buy `$X`
> - ...

## When to use the focused skill instead

| User asked | Use |
|---|---|
| "What's hot on Polymarket" (just lists) | `vike-polymarket-markets` only |
| "Profile this PM wallet" | `vike-polymarket-trader` |
| "Deep-dive market X" | `vike-polymarket-market-detail` |
| "Smart-money signals" | `vike-polymarket-smart-money` |
| "Full overview" or "give me everything" | This skill |

## Cost note

3 parallel tool calls = ~5 credits total.

## Anti-patterns

- Don't report all three sections if the user asked a narrower question. Trim aggressively.
- Trending markets sorted by volume include resolved markets that closed earlier today — verify `end_date` if you're recommending a position.
- `mispricings` mode requires `--hours` to be ≥ 6 for stable signal; below that, intraday noise dominates.

## Pairs well with

- `vike-polymarket-trader` — drill into any interesting wallet
- `vike-polymarket-market-detail` — drill into any flagged market
