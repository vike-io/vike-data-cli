---
name: vike-core
description: Install-first skill — authentication, setup, and CLI conventions for the vike toolkit. Use when you see any `vike-data <cmd>` reference or the user mentions on-chain analytics, Hyperliquid perps, options flow, or prediction markets.
metadata:
  openclaw:
    requires:
      env: [VIKE_API_KEY]
      bins: [vike]
    primaryEnv: VIKE_API_KEY
    install:
      - kind: node
        package: "@vike-io/cli"
        bins: [vike]
allowed-tools: Bash(vike:*)
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
vike-data doctor                        # Node version + API key + endpoint reachability + tool count
vike-data whoami                        # which key is in use (masked)
vike-data schema --pretty               # full command list with flags
```

## Conventions

- All commands accept `--json` for pipe-friendly output. Without it, you get a human-readable table.
- Addresses: pass full 0x-prefixed hex (42 chars). Never truncate when reporting back to the user.
- USD amounts: integers/decimals (e.g. `--min-usd 10000`).
- Chain identifiers: `eth`, `bsc`, `base`, `arb`, `hyper`, `btc`, `sol`, `tron`, `xmr`, `zec`, `dash` (depending on the command — some only support a subset).
- Time windows: `24h`, `7d`, `30d`, `90d`, `all` (per command; check `vike-data <cmd> --help`).

## Errors

- `No API key` → run `vike-data init` or set `VIKE_API_KEY`.
- `MCP error -32000: Hourly rate limit exceeded` → you hit the per-key cap; wait or upgrade your plan.
- `Network error` / timeout → check `vike-data doctor`; the endpoint is `https://vike.io/mcp`.
- `503` from a tool → upstream data source temporarily down; retry in 30s.

## Cost awareness

Each tool call consumes credits against your API key quota. Cheap calls: `token search`, `wallet summary`, `alerts list`. Heavier: `wallet discover`, `hl_perp_top_traders` (large result sets).

## When to use a router skill vs a task skill

- **Router skills** (`vike-router`, topic-level) — when the user is exploring or unsure which command they need.
- **Task skills** (`vike-smart-money-discovery`, `vike-perp-funding-arb`, etc.) — when the user has a specific question that maps to a known workflow.
