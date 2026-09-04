# @vike-io/cli

> Repo + package: `@vike-io/cli` (npm) · `vike-io/vike-data-cli` (GitHub) · binary: `vike`

[![npm version](https://img.shields.io/npm/v/@vike-io/cli.svg)](https://www.npmjs.com/package/@vike-io/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org)
[![skills.sh](https://skills.sh/b/vike-io/vike-data-cli)](https://skills.sh/vike-io/vike-data-cli)

> **Command-line interface for the [vike.io](https://vike.io) API.** On-chain analytics, perpetuals, options flow, and prediction-market data across 11 chains — designed to be driven by AI agents (Claude Code, OpenClaw) as well as humans.

## Install

```bash
# Standard install — gives you the `vike` binary
npm install -g @vike-io/cli

# OR install just the skill playbooks into your AI agent (Claude Code, Cursor,
# Codex, Copilot, OpenCode and 50+ more — auto-detected):
npx skills add vike-io/vike-data-cli
```

After `npm install`, you can also drop the skill into AI agents from the CLI itself:

```bash
vike install --all          # writes to ~/.claude/skills/vike/, .cursorrules,
                            # .github/copilot-instructions.md, AGENTS.md
```

## Quick start

```bash
vike init                      # interactive: paste API key, verify connection
vike doctor                    # confirm everything works
vike token search BTC          # your first query
```

Get an API key at [vike.io/account?tab=api-keys](https://vike.io/account?tab=api-keys).

## Commands at a glance

```
vike token   search | transfers | chart
vike ohlcv   <symbol>          # CEX candles, any timeframe (BTC, BTCUSDT)
vike wallet  summary | discover
vike perp    funding | spreads | top-traders
vike options flow
vike alerts  list | channels | create | edit | delete
vike init | doctor | schema | whoami | login | logout
```

Run `vike schema --pretty` for the full command + flag reference.

## What it does

| Domain | What you can ask |
|---|---|
| **Tokens** | Resolve symbols → addresses, see top buyers/sellers, pull OHLCV |
| **Wallets** | Aggregate metrics per wallet, leaderboards by volume / PnL / netflow |
| **Perps** | Funding rates + cross-venue spreads across Binance / Bybit / OKX / Aster / Hyperliquid |
| **Hyperliquid** | Top-trader leaderboard with PnL / ROI / win-rate filters |
| **Options** | Deribit flow for BTC / ETH / SOL with put-call ratios |
| **Alerts** | Create transfer alerts; deliver to email or Discord |

## For AI agents

This package ships **41 skill playbooks** under [`skills/`](skills/) — markdown files designed to be loaded by AI coding agents (Claude Code, Cursor, Codex, Copilot, OpenCode, …) so they know when and how to invoke each command. They are grouped in [`skills.sh.json`](skills.sh.json) by domain (Tokens / Wallets / CEX perps / Hyperliquid / Options / Polymarket / Alerts / Web research).

Three install paths, pick whichever fits your stack:

```bash
# 1. Install just the skill files for your agent (no Node binary needed):
npx skills add vike-io/vike-data-cli                # auto-detects the agent
npx skills add vike-io/vike-data-cli -a claude-code # explicit target
npx skills add vike-io/vike-data-cli --list          # list all 41 first

# 2. Use the CLI itself to install the umbrella skill into multiple agents:
vike install --claude --cursor --copilot --agents

# 3. Manual: point your agent at the skills/ folder of this npm package
#    (lives at node_modules/@vike-io/cli/skills/ after install).
```

Entry-point skill: `vike` (the umbrella) — auto-routes the user's question to the right specialized skill below. Bypass it and pick a specialized one if you know exactly which you need (e.g. `vike-hl-position-match` for reverse-lookup of an HL share card).

## Auth

Three ways to provide your key, in order of precedence:

```bash
export VIKE_API_KEY=vk_...     # env (wins over everything)
vike login --api-key vk_...    # saved to ~/.vike/config.json
vike init                      # interactive
```

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `VIKE_API_KEY` | — | API key (overrides saved config) |
| `VIKE_MCP_URL` | `https://vike.io/mcp` | MCP endpoint (override for staging/local) |

## Output formatting

By default, table output for humans (TTY) and JSON when piped:

```bash
vike token search BTC                  # pretty table
vike token search BTC --json           # JSON
vike token search BTC | jq '.'         # auto-JSON when piped
```

## License

MIT — see [LICENSE](LICENSE).

## Links

- Homepage: [vike.io](https://vike.io)
- Issues: [github.com/vike-io/vike-data-cli/issues](https://github.com/vike-io/vike-data-cli/issues)
- API docs: [vike.io/api](https://vike.io/api)
