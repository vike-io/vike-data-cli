---
name: vike-core
description: Install-first skill — authentication, setup, and CLI conventions for the vike toolkit. Use when you see any `vike-data <cmd>` reference or the user mentions on-chain analytics, Hyperliquid perps, or prediction markets.
metadata:
  openclaw:
    requires:
      env: [VIKE_API_KEY]
      bins: [vike-data]
    primaryEnv: VIKE_API_KEY
    install:
      - kind: node
        package: "@vike-io/cli"
        bins: [vike-data]
allowed-tools: Bash(vike-data:*)
---

# vike-core

Install + auth + conventions. Read this first; every other `vike-*` skill assumes it.

## Install

```bash
npm install -g @vike-io/cli
```

## Authenticate (one of these)

```bash
vike-data init                          # interactive: prompt for API key + verify
vike-data login --api-key vk_...        # non-interactive
export VIKE_API_KEY=vk_...         # env (wins over saved config)
```

Get an API key at https://vike.io/account?tab=api-keys

## Verify

```bash
vike-data doctor                        # Node version + API key (masked, with its source) + endpoint reachability + tool count
vike-data schema --pretty               # every MCP tool with its parameters
vike-data --help                        # command list; add --help to any command for its flags
```

## Conventions

- All commands accept `--json` for pipe-friendly output. Without it, you get a human-readable table.
- Addresses: pass full 0x-prefixed hex (42 chars). Never truncate when reporting back to the user.
- USD amounts: integers/decimals (e.g. `--min-usd 10000`).
- Chain identifiers: `ethereum`, `bsc`, `base`, `hyperevm` on the token and wallet commands (`alerts` takes `eth` or `bsc`). Exceptions: `wallet discover` on `base` and `hyperevm` serves `--window all` only; `token screener --smart-money-only` and `--sort smart_inflow` are Ethereum only; `labels` (label provenance) and `wallet ens` are Ethereum only. `wallet summary` has no chain flag: it answers for the one chain the wallet was most recently active on and names it in `chain`. Non-EVM chains and Arbitrum are not served (`wallet balances` lists them under `chain_errors`). Check `vike-data <cmd> --help` for the exact list.
- Time windows: `24h`, `7d`, `30d`, `90d`, `all` (per command; check `vike-data <cmd> --help`). Windows are counted in UTC calendar days.
- Hyperliquid commands live under `vike-data hl ...` (cohorts, wallets, leaderboard, liquidations, market, builders), the older `perp top-traders` / `perp find-position` and `candles hl` stay where they are. Fractions and percents differ by field: `bias`, `win_rate` (on `hl`), `long_share`, `percent_risk` are fractions; `*_pct` fields (`roi_pct`, `win_rate_pct`, `max_drawdown_pct`) are percents.

## Errors

- `No API key` → run `vike-data init` or set `VIKE_API_KEY`.
- `MCP error -32000: Hourly rate limit exceeded` → you hit the per-key cap of 20,000 requests per rolling hour; the window slides, so capacity returns continuously.
- `Network error` / timeout → check `vike-data doctor`; the endpoint is `https://vike.io/mcp`.
- `503` from a tool → upstream data source temporarily down; retry in 30s.

## Cost awareness

Credits are an accounting figure on each call and never block one. The limit is 20,000 requests per rolling hour per key, shared by the MCP server and the REST API. Free (0 credits): `token search`, `alerts list`, `alerts channels`. Every `hl` command, `perp open-interest`, `perp long-short` and every `polymarket` L2 command (`tape`, `orderbook`, `stats`, `settlement`, `archive`) is 1 credit. Heaviest: `wallet trace` (4), then `token screener`, `wallet compare`, `wallet balances` (3).

## Which skill to use

- The umbrella skill `vike` holds the routing table — use it when the user is exploring or unsure which command they need.
- Task skills (`vike-wallet-who-is`, `vike-follow-the-money`, `vike-hl-asset-briefing`, `vike-pm-market-diligence`, `vike-daily-brief`, `vike-smart-money-discovery`, `vike-perp-funding`, etc.) — when the user has a specific question that maps to a known workflow.
- If unsure between two, prefer the task skill (a workflow) over the per-tool skill (one command). For raw data, use the per-tool skill with `--json`.
