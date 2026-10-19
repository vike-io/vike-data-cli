---
name: vike-router
description: Entry point — decide which vike skill to use. Read this first when the user asks anything about on-chain analytics, perps, prediction markets, wallets, or tokens.
allowed-tools: Bash(vike-data:*)
---

# vike-router

Route the user's question to the right `vike-*` skill.

## Routing table

| User asks about ... | Use skill |
|---|---|
| Token by symbol/name → address | `vike-token-search` |
| Token holders / who bought / sold | `vike-token-transfers` |
| Token price chart / DEX OHLCV by contract address | `vike-token-research` |
| Generic token research (everything) | `vike-token-research` |
| Single wallet's metrics | `vike-wallet-summary` |
| Top wallets / leaderboard | `vike-wallet-discover` |
| "Find smart money on X" | `vike-smart-money-discovery` |
| Perp funding rates / arb opportunities | `vike-perp-funding-arb` |
| Cross-venue perp price spreads | `vike-perp-spread-arb` |
| Top Hyperliquid perp traders | `vike-hl-top-traders` |
| Match an HL share card → wallet (reverse-lookup) | `vike-hl-position-match` |
| Profile a single HL perp trader | `vike-hl-trader-profile` |
| HL market overview (vol/OI/funding) | `vike-perp-screener` |
| Compare a symbol across all perp venues | `vike-cross-venue-perps` |
| Historical candles (Hyperliquid perp/spot, Polymarket outcome token) | `vike-candles` |
| Create / list / edit alerts | `vike-alerts-setup` |
| Auth / setup / "I just installed it" | `vike-core` |

## Quick command map

```
vike-data token   search | transfers | screener | holders
vike-data wallet  summary | discover
vike-data perp    funding | spreads | top-traders
vike-data candles hl <symbol> | polymarket <token_id>
vike-data alerts  list | channels | create | edit | delete
vike-data init | doctor | schema | whoami | login | logout
```

## Bias

- If unsure between two skills, prefer the **task skill** (specific workflow) over the **per-tool skill** (single command).
- If the user wants raw data, use the per-tool skill with `--json`.
- If the user is exploring, lead with `vike-data schema --pretty` to show what's available.

## Cost note

Cheap (free-tier safe): `token search`, `wallet summary`, `alerts list`, `schema`, `doctor`, `whoami`.

Heavier (count against quota): `wallet discover` (full pages), `perp top-traders` (large filters), `token transfers` (long periods).
