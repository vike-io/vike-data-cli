---
name: vike-polymarket-markets
description: List trending Polymarket prediction markets ranked by 24h volume, filterable by category (Crypto / Sports / Politics / Pop-Culture / Tech). Use when the user asks "what's hot on Polymarket" / "top crypto prediction markets" / "trending markets today".
allowed-tools: Bash(vike:*)
---

# vike-polymarket-markets

## Command

```bash
vike-data polymarket markets [--category C] [--limit N] [--json]
```

`C` is one of: `Crypto`, `Sports`, `Politics`, `Pop-Culture`, `Tech`, `all` (default).

## Examples

```bash
vike-data polymarket markets --category Crypto --limit 10
vike-data polymarket markets --category Politics --limit 20
vike-data pm markets --json                    # `pm` alias
```

## Output columns

`condition_id`, `slug`, `question`, `end_date`, `market_vol_24h` (USD), `liquidity`, plus per-outcome `outcome` / `mid` / `bid` / `ask` for both Yes and No legs.

## Reading the data

- `mid` is the midpoint price as a probability (0.0 to 1.0). `0.42` means "the market thinks 42% chance".
- A bid/ask spread > 0.05 (5 cents) = thin liquidity; the price is noisier.
- `end_date` is when the market resolves. Sort priority for action-oriented users: markets ending in the next 7 days.

## Anti-patterns

- Don't quote `mid` as a percentage without saying so. "Yes is 0.42" is the raw probability; "42% chance" is the user-friendly translation.
- For tiny markets (<$50k 24h volume) the quotes are often stale or one-sided. Skip them unless explicitly asked.

## Pairs well with

- `vike-polymarket-market-detail` — deep-dive on one market once you have its condition_id
- `vike-polymarket-smart-money` — see which markets cohort wallets are buying/selling
- `vike-polymarket-screener` — composite multi-call screener
