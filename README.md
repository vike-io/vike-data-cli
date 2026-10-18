# @vike-io/cli — the Vike Data API from your terminal and your AI agent

> Repo + package: `@vike-io/cli` (npm) · `vike-io/vike-data-cli` (GitHub) · binary: `vike-data`

[![npm version](https://img.shields.io/npm/v/@vike-io/cli.svg)](https://www.npmjs.com/package/@vike-io/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/node-%3E%3D22.12-brightgreen.svg)](https://nodejs.org)
[![skills.sh](https://skills.sh/b/vike-io/vike-data-cli)](https://skills.sh/vike-io/vike-data-cli)

**`@vike-io/cli` is an open-source (MIT) command-line client and agent skill pack for the free
[Vike Data API](https://vike.io/data/).** One free API key covers **Hyperliquid** (traders,
positions, fills, funding, liquidations, candles, and hourly long/short positioning by wallet
cohort), **Polymarket** (markets, the trade and event tape, order-book snapshots, candles and
on-chain settlements, plus a daily Parquet archive of the full L2 order book since 2026-07-25,
licensed CC BY 4.0), and **labelled EVM wallets** on Ethereum and BNB Chain, with Base for token
transfers. The same data is served three ways: an **MCP server** at `https://vike.io/mcp` (the one
this CLI calls), a **REST API** at `https://data.vike.io/v1/`, and the **Parquet archive** at
`https://data.vike.io/archive/`. A key allows 20,000 requests an hour, and an account can hold up
to 5 keys; archive downloads are not counted. The archive manifest and a sample market need no key
at all. Market data from centralised exchanges is not offered through the REST API.

## Install

```bash
# The CLI (Node.js >= 22.12). Installs the `vike-data` binary.
npm install -g @vike-io/cli

# OR install only the skill playbooks into your AI agent (Claude Code, Cursor,
# Codex, Copilot and others; the agent is auto-detected):
npx skills add vike-io/vike-data-cli
```

## Quickstart

Get a free key at [vike.io/account?tab=api-keys](https://vike.io/account?tab=api-keys) (keys start
with `vk_`), then:

```bash
vike-data init                                   # paste the key; saves ~/.vike/config.json, checks vike.io/mcp
vike-data doctor                                 # Node version, key, MCP connectivity, tool list
vike-data token search PEPE                      # first query
vike-data perp top-traders --window 7d           # Hyperliquid wallets ranked by PnL
vike-data candles hl BTC --interval 1h --limit 48
vike-data polymarket markets --category Crypto   # trending markets by 24h volume
```

The key is read from `VIKE_API_KEY` first, then from `~/.vike/config.json`
(`vike-data login --api-key vk_...` writes it, `vike-data logout` removes it).

## Free datasets

| Dataset | What is in it | Access | Page |
|---|---|---|---|
| **Polymarket historical order book** (archive) | `book_events` (full L2: snapshots, `price_change` deltas, trades, tick-size and status markers), `trades` (taker tape), `l1_quotes` (derived top of book). One Parquet file per stream per UTC day since 2026-07-25, every recorded market (crypto up/down, sports, politics). CC BY 4.0. | Manifest + sample: no key. Full days: free key. | [polymarket-historical-data](https://vike.io/data/polymarket-historical-data) |
| **Polymarket up/down families** (archive) | The same archive cut per market family, `asset=btc/tenor=5m` and so on, with an `asset=other/tenor=other` catch-all | free key | [polymarket-updown-markets](https://vike.io/data/polymarket-updown-markets) |
| **Polymarket API** `/v1/polymarket` | Markets, the raw event and trade tape (about 30 days back), order-book snapshots, candles, on-chain settlements | free key | [polymarket](https://vike.io/data/polymarket) |
| **Hyperliquid cohorts** `/v1/hyperliquid/coins/{coin}/cohort-metrics` | Long vs short per cohort, hourly, up to 8,760 hours in one request. Axes: `size` (account value, shrimp to 4x whale), `tier` (position notional), `pnl` (realized-PnL percentile), `pnl_abs` (PnL in dollars). `labelBasis=point_in_time` grades each hour with the label it had then (from 2026-04-07). | free key | [hl-cohorts](https://vike.io/data/hl-cohorts) |
| **Hyperliquid API** `/v1/hyperliquid` | Trader rankings and leaderboards, 5-minute position snapshots kept for a year, wallet fills, funding and ledger, liquidations (inferred from snapshots), builders, candles since the start of 2026; closed bars also stream on `wss://vike.io/v1/stream` | free key | [hyperliquid](https://vike.io/data/hyperliquid) |
| **On-chain API** `/v1/onchain` | Wallet summaries, transactions, counterparties, PnL, address labels with per-source provenance, token holders and transfers. Ethereum on every route, BNB Chain on the wallet and token-flow routes, Base on token transfers. | free key | [onchain](https://vike.io/data/onchain) |

Direct links that need no key:

- Archive manifest (every date, per-stream bytes and row counts, the schema, the license):
  <https://data.vike.io/archive/manifest.json>
- Free sample, one complete 5-minute crypto up/down market (both outcome tokens, open through
  resolution), regenerated daily: <https://data.vike.io/archive/samples/>
  ([README.txt](https://data.vike.io/archive/samples/README.txt),
  [book_events.parquet](https://data.vike.io/archive/samples/book_events.parquet),
  [trades.parquet](https://data.vike.io/archive/samples/trades.parquet),
  [l1_quotes.parquet](https://data.vike.io/archive/samples/l1_quotes.parquet))

Archive layout: `https://data.vike.io/archive/venue=polymarket/date=YYYY-MM-DD/{book_events,trades,l1_quotes}.parquet`.
A full-day `book_events` file is several GB; `trades` is around 12 MB.

```bash
# No key: the newest day in the archive, and the sample tape
curl -s https://data.vike.io/archive/manifest.json | jq '.dates[0]'
curl -O https://data.vike.io/archive/samples/trades.parquet

# Free key: one full day of the Polymarket tape, and a day of BTC cohort positioning
export VIKE_API_KEY=vk_...
curl -H "X-API-KEY: $VIKE_API_KEY" -C - -o polymarket-trades-2026-10-16.parquet \
  "https://data.vike.io/archive/venue=polymarket/date=2026-10-16/trades.parquet"
curl -H "X-API-KEY: $VIKE_API_KEY" \
  "https://data.vike.io/v1/hyperliquid/coins/BTC/cohort-metrics?axis=size&hours=24"
```

Download an archive file whole, then read the local copy. A Parquet reader (DuckDB, polars,
pyarrow) pointed at the URL turns one file into thousands of HTTP Range requests.

Full catalog: [vike.io/data/datasets](https://vike.io/data/datasets) · field reference:
[vike.io/data/schemas](https://vike.io/data/schemas) · keys and limits:
[vike.io/data/api](https://vike.io/data/api).

## MCP server

The crypto data MCP server is `https://vike.io/mcp` (Streamable HTTP, JSON-RPC 2.0), keyed with
the same `X-API-KEY`. MCP and REST calls share one hourly counter.

```bash
# Claude Code
claude mcp add --transport http vike https://vike.io/mcp \
  --header "X-API-KEY: $VIKE_API_KEY"
```

Cursor, in `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "vike": {
      "url": "https://vike.io/mcp",
      "headers": { "X-API-KEY": "YOUR_KEY" }
    }
  }
}
```

**Claude Desktop needs no key:** Settings → Connectors → Add custom connector, URL
`https://vike.io/mcp`, leave the OAuth fields empty, then log in to Vike and click Allow.
Setup for Gemini CLI, VS Code and other clients: [vike.io/docs/ai/data/setup](https://vike.io/docs/ai/data/setup).

```bash
# Raw JSON-RPC: list the tools your key can call
curl https://vike.io/mcp -H "X-API-KEY: $VIKE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

On `/mcp` a bad or missing key comes back as a JSON-RPC `error` in the body, so check the body and
not only the HTTP status. A rate-limited call gets HTTP 429 with `Retry-After: 60`.

## CLI commands

Every data command is one `tools/call` to the MCP server. `vike-data <group> --help` lists the flags;
`vike-data schema --pretty` prints every tool the server exposes, with its parameters.

| Command | Subcommands | MCP tool |
|---|---|---|
| `vike-data token` | `search`, `transfers`, `screener`, `holders` (`--chain ethereum\|bsc\|base`) | `token_search`, `token_transfers`, `token_screener`, `token_holders` |
| `vike-data wallet` | `summary`, `transactions` (`txs`), `compare`, `trace`, `batch`, `counterparties`, `pnl-history`, `balances`, `ens`, `discover` | `wallet_summary`, `wallet_transactions`, `wallet_compare`, `wallet_trace`, `wallet_batch_labels`, `wallet_counterparties`, `wallet_pnl_history`, `wallet_token_balances`, `wallet_ens`, `wallet_discover` |
| `vike-data labels <address>` | multi-source label provenance for one wallet | `wallet_label_provenance` |
| `vike-data perp` | `top-traders`, `find-position` (Hyperliquid); `funding`, `spreads` (cross-venue funding rates and spot-perp spreads) | `hl_perp_top_traders`, `hl_position_match`, `perp_funding`, `perp_spreads` |
| `vike-data candles` | `hl <symbol>` (Hyperliquid perp or spot, from executed fills), `polymarket <token_id>` (one outcome token) | `hl_ohlcv`, `polymarket_ohlcv` |
| `vike-data polymarket` (`pm`) | `markets`, `market <condition_id>`, `wallet <address>`, `smart-money` | `polymarket_markets`, `polymarket_market_detail`, `polymarket_wallet`, `polymarket_smart_money` |
| `vike-data alerts` | `list`, `channels`, `create`, `edit`, `delete`, `register-webhook` (email, Discord, or an HTTPS webhook, HMAC-signed when you set a secret) | `alerts_*` |
| setup | `init`, `login`, `logout`, `doctor`, `schema`, `install` | — |

Output is a table on a terminal and JSON with `--json` or whenever stdout is piped:

```bash
vike-data token search BTC --json | jq '.'
```

## Examples

[`examples/`](examples/) holds three Python scripts. Each declares its dependencies inline, so
`uv run` installs them; plain `pip install polars requests duckdb` works too.

| Script | What it does | Key |
|---|---|---|
| [`polymarket_archive.py`](examples/polymarket_archive.py) | Reads `manifest.json`, downloads the free sample's `trades` and `l1_quotes` and summarises them with polars, then (with `VIKE_API_KEY` set) downloads one full day of `trades.parquet` and checks its size against the manifest | steps 1-2 none, step 3 free key |
| [`hyperliquid_cohorts.py`](examples/hyperliquid_cohorts.py) | `GET /v1/hyperliquid/coins/BTC/cohort-metrics?axis=size&hours=24` into a polars DataFrame: positioning per account-size cohort at the latest hour, and bias per cohort per hour | free key |
| [`duckdb_archive.py`](examples/duckdb_archive.py) | DuckDB over local archive Parquet: trades, shares and VWAP per outcome token, and mid and spread per minute from `l1_quotes`. Uses the free sample unless you pass your own files or globs. | none for the sample |

```bash
uv run examples/polymarket_archive.py
VIKE_API_KEY=vk_... uv run examples/hyperliquid_cohorts.py
uv run examples/duckdb_archive.py
```

Downloads go to `./vike-archive/`.

## For AI agents

This package ships **36 skill playbooks** under [`skills/`](skills/): markdown files an AI coding
agent loads so it knows when and how to call each command. [`skills.sh.json`](skills.sh.json) groups
them by domain (Tokens, Wallets, CEX perps, Hyperliquid perps, Candles, Polymarket, Alerts). The
entry point is the umbrella skill `vike`, which routes a question to the specialised skill.

```bash
npx skills add vike-io/vike-data-cli --list    # see them first
npx skills add vike-io/vike-data-cli           # install

# Or, from the installed CLI, write the umbrella skill into each agent's location:
vike-data install --claude     # ~/.claude/skills/vike/SKILL.md
vike-data install --cursor     # ./.cursorrules
vike-data install --copilot    # ./.github/copilot-instructions.md
vike-data install --agents     # ./AGENTS.md
vike-data install --all        # all four
```

`vike-data install` replaces only its own `<!-- vike-skill:begin -->` ... `<!-- vike-skill:end -->`
block in files it does not own.

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `VIKE_API_KEY` | — | API key; wins over the saved config |
| `VIKE_MCP_URL` | `https://vike.io/mcp` | MCP endpoint override |
| `VIKE_NO_TELEMETRY=1` or `DO_NOT_TRACK=1` | telemetry on | Turns off anonymous usage telemetry |
| `VIKE_NO_UPDATE_CHECK=1` or `NO_UPDATE_NOTIFIER=1` | check on | Turns off the background npm update check |

Telemetry sends the command name, the flag names (never their values), the duration, an error code
and a random device id. It never sends what you queried, and it is off when `CI` is set.

`vike-data` is the Data API client. The Vike Trader platform has its own, separate command line,
`vike-cli` ([docs](https://vike.io/docs/trader/cli)).

## License

The CLI is MIT, see [LICENSE](LICENSE). Archive data files are CC BY 4.0: use them for anything
and credit Vike ("Polymarket L2 archive (c) Vike (vike.io/data), CC BY 4.0"). Details:
[vike.io/data/licensing](https://vike.io/data/licensing).

## Links

- Free Data API: [vike.io/data](https://vike.io/data/)
- Data API docs: [vike.io/docs/data](https://vike.io/docs/data/) · archive: [vike.io/docs/data/archive](https://vike.io/docs/data/archive/) · MCP tools: [vike.io/docs/ai/data](https://vike.io/docs/ai/data)
- For LLMs: [vike.io/llms.txt](https://vike.io/llms.txt) · [vike.io/docs/llms.txt](https://vike.io/docs/llms.txt)
- Issues: [github.com/vike-io/vike-data-cli/issues](https://github.com/vike-io/vike-data-cli/issues)
