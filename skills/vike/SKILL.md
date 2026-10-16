---
name: vike
description: "Use this skill whenever the user asks any question about on-chain crypto data, wallet behavior, token transfers, smart money, CEX perpetual futures, Hyperliquid perps, Deribit options, prediction markets (Polymarket), ENS, or on-chain flows — and live data from vike.io would improve the answer. This includes questions like \"who is buying X token\", \"what is wallet 0x... doing\", \"top wallets by PnL\", \"funding rate spread across Binance/Bybit/OKX\", \"largest HL perp traders this week\", \"Deribit BTC put-call ratio\", \"who is winning on Polymarket\", \"resolve this ENS\", \"label this wallet\", \"trace this transfer\", \"top tokens by smart-money inflow\". Always use this skill proactively when the user's query could benefit from real-time or historical on-chain data — don't wait for the user to explicitly ask to \"use vike\". If the user asks a general on-chain question that requires synthesis across wallets/tokens/venues, route to vike first."
---

# vike — Multi-chain On-chain Analytics

Answer on-chain questions using the vike.io platform: 11 chains (ETH, BSC, Base, Arbitrum, HyperEVM, BTC, Solana, Tron, XMR, ZEC, Dash), full Hyperliquid perps coverage, CEX perps across 5 venues, Deribit options, Polymarket prediction markets, multi-source wallet labels, and a 34-tool MCP server.

**MCP endpoint for all calls:** `https://vike.io/mcp` (JSON-RPC 2.0)
**Or use the CLI:** `npm install -g @vike-io/cli` → `vike <command>`

---

## Critical Rules

Hard rules — agents that violate these produce wrong answers. Read once, apply always.

1. **Addresses are always full 0x-hex (42 chars).** Never truncate when querying. Never display truncated when the user asks for the address — they'll copy-paste it.
2. **Symbols are case-insensitive in queries, but display as the user typed.** `btc` and `BTC` both resolve; echo back what they wrote.
3. **Time windows are UTC, day-boundaries cut at 00:00 UTC.** "Today" = since 00:00 UTC today, not local-time today.
4. **Default page size is 50, max 500.** Don't request `--limit 10000` to "get everything" — paginate or use a screener tool instead.
5. **Refresh cadence varies by tool.** Wallet PnL, HL positions: ≤2 min. Transfer-derived metrics: 5 min. Token price history: 1 min. Always assume <5 min unless a tool says otherwise.
6. **USD amounts are floats in dollars.** `--min-usd 10000` = ten thousand dollars, not micro-USD.
7. **`--json` flag is always available** on CLI commands and gives stable machine-readable output. Default (human) format may change; `--json` will not.
8. **Resolve a token before asking transfer/holder questions.** `token_search` → take the canonical address → pass to `token_transfers` / `token_holders`. Symbol-only queries lose precision on tickers that collide across chains (e.g. FUN, BEAM, USDC).

---

## Step 1: Confirm Authentication

Follow this decision tree **before every session**. Do not skip to Step 2 until auth is confirmed.

```
1. Is the `vike` CLI installed? (`vike --version`)
   ├── YES → continue
   └── NO  → `npm install -g @vike-io/cli`

2. Is $VIKE_API_KEY set OR has the user run `vike init` / `vike login` already?
   ├── YES → run `vike doctor` to verify the key + endpoint reachability. Proceed.
   └── NO  → prompt the user (see Setup below).
```

### Setup

If the user has no API key yet, tell them:

> **To use vike, you'll need a free API key:**
>
> 1. Visit https://vike.io/account?tab=api-keys&utm_source=skill&utm_medium=ai&utm_campaign=cli_skill, sign in, and copy a key (starts with `vk_`).
> 2. Save it: `vike login --api-key vk_...` (or `export VIKE_API_KEY=vk_...`).
> 3. Verify: `vike doctor`.
>
> Per-key default cap: 2000 requests/hour. Most calls return in <500ms.

If using the MCP server directly (without the CLI), send the key as a header:
```
X-API-KEY: vk_...
```

---

## Step 2: Route to the Right Service

| User is asking about... | Service | CLI / Tool |
|---|---|---|
| Token by symbol/name → address, market cap, holders | **Tokens** | `vike token search` / `token_search` |
| Token holders, who bought/sold, top inflows | **Tokens** | `vike token transfers` / `token_transfers` |
| Filter/screen tokens by smart-money flow, liquidity, age | **Tokens** | `vike token screener` / `token_screener` |
| Single wallet's PnL, holdings, recent activity | **Wallets** | `vike wallet summary` / `wallet_summary` |
| Top wallets by PnL on a token / leaderboard | **Wallets** | `vike wallet discover` / `wallet_discover` |
| Recent wallet transactions with USD values | **Wallets** | `vike wallet transactions` / `wallet_transactions` |
| Compare 2+ wallets side by side | **Wallets** | `vike wallet compare` / `wallet_compare` |
| Trace funds N hops from a starting wallet | **Wallets** | `vike wallet trace` / `wallet_trace` |
| Find counterparties (who sends to / receives from) | **Wallets** | `vike wallet counterparties` / `wallet_counterparties` |
| Wallet PnL history (timeseries) | **Wallets** | `vike wallet pnl-history` / `wallet_pnl_history` |
| Token balances for a wallet | **Wallets** | `vike wallet balances` / `wallet_token_balances` |
| ENS name → address or address → ENS | **Wallets** | `vike wallet ens` / `wallet_ens` |
| Bulk-label many wallets at once | **Wallets** | `vike wallet batch` / `wallet_batch_labels` |
| Why is this wallet labeled X? (provenance) | **Labels** | `vike labels provenance` / `wallet_label_provenance` |
| Funding rates across CEX perps (Binance/Bybit/OKX/Aster/HL) | **CEX Perps** | `vike perp funding` / `perp_funding` |
| Price spreads of same symbol across CEX perp venues | **CEX Perps** | `vike perp spreads` / `perp_spreads` |
| Top Hyperliquid perp traders by PnL / volume | **HL Perps** | `vike perp top-traders` / `hl_perp_top_traders` |
| Reverse-lookup an HL share card → which wallet holds it | **HL Perps** | `vike perp find-position` / `hl_position_match` |
| Deribit options flow, put/call ratios, IV | **Options** | `vike options flow` / `options_flow` |
| Active Polymarket markets, volume, odds | **Polymarket** | `vike polymarket markets` / `polymarket_markets` |
| Single Polymarket market detail | **Polymarket** | `vike polymarket detail` / `polymarket_market_detail` |
| Polymarket trader profile / positions | **Polymarket** | `vike polymarket wallet` / `polymarket_wallet` |
| Best-performing Polymarket traders | **Polymarket** | `vike polymarket smart-money` / `polymarket_smart_money` |
| Create / list / edit price-or-flow alerts | **Alerts** | `vike alerts ...` / `alerts_*` |
| General web search or fetch + AI summarize a URL | **Web** | `vike web search` / `web_search`, `vike web fetch` / `web_fetch` |

**When in doubt, start with `vike token search` or `vike wallet summary`** — both are cheap, return instantly, and disambiguate what the user actually meant.

### Example query routing
```
"Top 20 wallets buying PEPE in the last 24h"          → wallet_discover         (token=PEPE, sort=net_inflow_usd)
"What is 0xd8dA6BF...AbA96 holding?"                  → wallet_summary           + wallet_token_balances
"Funding rate for BTC across all perp venues"         → perp_funding             (symbol=BTC)
"Cheapest venue to short ETH right now?"              → perp_spreads             (symbol=ETH)
"Biggest HL perp PnL last week"                       → hl_perp_top_traders      (window=7d, sort=pnl_usd)
"Largest BTC put writes on Deribit today"             → options_flow             (asset=BTC, side=put)
"Show me the largest Polymarket bets on US election"  → polymarket_market_detail + polymarket_smart_money
"Why is 0x28C6... labeled 'Binance hot wallet'?"      → wallet_label_provenance  (addr=0x28C6...)
"Resolve vitalik.eth"                                 → wallet_ens               (name=vitalik.eth)
"Alert me when whale 0xABCD sells over $1M of WBTC"   → alerts_create
"Trace funds from 0xHACKER 3 hops out"                → wallet_trace             (start=0xHACKER, depth=3)
```

---

## Step 3: Call the tool

### Two equivalent interfaces

**A) Via CLI (recommended for shell-bound agents).** All commands accept `--json` for machine-readable output:
```bash
vike wallet summary 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 --json
vike perp funding --symbol BTC --window 24h --json
```

**B) Via MCP JSON-RPC (recommended when an MCP connector is available).** All 34 tools live at `https://vike.io/mcp`:
```http
POST https://vike.io/mcp
X-API-KEY: vk_...
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "wallet_summary",
    "arguments": {"address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", "chain": "ethereum"}
  }
}
```

Run `vike schema --pretty` (or call MCP `tools/list`) to see the live arg shape for every tool. Always read the schema before constructing arguments — defaults and enum values change.

---

## Per-service tool reference

For deeper per-tool workflows (multi-step recipes, common pitfalls, output schemas), see the `skills/` directory in this repo. The router lives at [`skills/vike-router/SKILL.md`](skills/vike-router/SKILL.md).

### Tokens
Address resolution, transfers, holder cohorts, screening.

| Tool | Description | Skill |
|---|---|---|
| `token_search` | Symbol/name → contract address + chain + market cap | [vike-token-search](skills/vike-token-search/SKILL.md) |
| `token_transfers` | Recent transfers with USD values; supports `--min-usd`, time windows | [vike-token-transfers](skills/vike-token-transfers/SKILL.md) |
| `token_holders` | Top holders + concentration metrics | [vike-token-holders](skills/vike-token-holders/SKILL.md) |
| `token_screener` | Filter tokens by smart-money inflow, age, liquidity, sector | [vike-token-screener](skills/vike-token-screener/SKILL.md) |

**Key chains:** `ethereum`, `bsc`, `base`, `arbitrum`, `hyperevm` (EVM); `bitcoin`, `solana`, `tron`, `xmr`, `zec`, `dash` (non-EVM, limited tool support).

---

### Wallets
Profile, PnL, transactions, comparison, tracing, counterparty graph.

| Tool | Description | Skill |
|---|---|---|
| `wallet_summary` | One-call profile: PnL, top holdings, recent activity, labels | [vike-wallet-summary](skills/vike-wallet-summary/SKILL.md) |
| `wallet_discover` | Leaderboard of top wallets by PnL/inflow on a token | [vike-wallet-discover](skills/vike-wallet-discover/SKILL.md), [vike-smart-money-discovery](skills/vike-smart-money-discovery/SKILL.md) |
| `wallet_transactions` | Raw recent transactions (tx_hash, ts, from, to, token, usd) | [vike-wallet-transactions](skills/vike-wallet-transactions/SKILL.md) |
| `wallet_compare` | Side-by-side metrics for 2+ wallets | [vike-wallet-compare](skills/vike-wallet-compare/SKILL.md) |
| `wallet_trace` | BFS funds tracing N hops from a starting wallet | [vike-wallet-trace](skills/vike-wallet-trace/SKILL.md) |
| `wallet_counterparties` | Top counterparties (who they send to / receive from) | [vike-wallet-counterparties](skills/vike-wallet-counterparties/SKILL.md) |
| `wallet_pnl_history` | Daily PnL timeseries over `--days N` | [vike-wallet-pnl-history](skills/vike-wallet-pnl-history/SKILL.md) |
| `wallet_token_balances` | Current token balances (Moralis-backed) | [vike-wallet-balances](skills/vike-wallet-balances/SKILL.md) |
| `wallet_ens` | ENS name ↔ address (local cache: 477K wallets pre-resolved) | [vike-wallet-ens](skills/vike-wallet-ens/SKILL.md) |
| `wallet_batch_labels` | Bulk-label up to 100 addresses in one call | [vike-wallet-batch](skills/vike-wallet-batch/SKILL.md) |

**Address shape:** always full 0x-prefixed hex (42 chars). Never truncate when reporting back to the user.

---

### Labels
Wallet label provenance.

| Tool | Description | Skill |
|---|---|---|
| `wallet_label_provenance` | Why a wallet got a given label (sources + confidence) | [vike-wallet-label-provenance](skills/vike-wallet-label-provenance/SKILL.md) |

Vike's label cascade is multi-source — when an answer hinges on "is this really a CEX hot wallet?", call `wallet_label_provenance` rather than trusting a single source.

---

### CEX Perps
5 venues: Binance, Bybit, OKX, Aster, Hyperliquid.

| Tool | Description | Skill |
|---|---|---|
| `perp_funding` | Funding rates per symbol per venue + 24h/7d averages | [vike-perp-funding-arb](skills/vike-perp-funding-arb/SKILL.md) |
| `perp_spreads` | Mark-price spreads of the same symbol across venues | [vike-perp-spread-arb](skills/vike-perp-spread-arb/SKILL.md), [vike-cross-venue-perps](skills/vike-cross-venue-perps/SKILL.md) |

---

### Hyperliquid Perps
On-chain perps data: snapshots, fills, ledger, funding, attribution.

| Tool | Description | Skill |
|---|---|---|
| `hl_perp_top_traders` | Top HL traders by PnL/volume over a window | [vike-hl-top-traders](skills/vike-hl-top-traders/SKILL.md), [vike-hl-trader-profile](skills/vike-hl-trader-profile/SKILL.md) |
| `hl_position_match` | Reverse-lookup: share-card details (coin/side/lev/entry) → wallet holding that open position | [vike-hl-position-match](skills/vike-hl-position-match/SKILL.md) |

For per-symbol HL screening / individual trader deep-dive, use [vike-perp-screener](skills/vike-perp-screener/SKILL.md) and [vike-hl-trader-profile](skills/vike-hl-trader-profile/SKILL.md).

---

### Options
Deribit options chain + flow.

| Tool | Description | Skill |
|---|---|---|
| `options_flow` | Recent large trades, put/call ratios, IV by strike/expiry | [vike-options-flow](skills/vike-options-flow/SKILL.md) |

Coverage: BTC + ETH on Deribit. Other venues not currently supported.

---

### Polymarket
Prediction markets — markets, traders, smart-money.

| Tool | Description | Skill |
|---|---|---|
| `polymarket_markets` | Active markets sorted by volume / liquidity / volatility | [vike-polymarket-markets](skills/vike-polymarket-markets/SKILL.md), [vike-polymarket-screener](skills/vike-polymarket-screener/SKILL.md) |
| `polymarket_market_detail` | Single market: outcomes, holders, recent trades, time-to-resolution | [vike-polymarket-market-detail](skills/vike-polymarket-market-detail/SKILL.md) |
| `polymarket_wallet` | One trader's positions, PnL, win rate | [vike-polymarket-trader](skills/vike-polymarket-trader/SKILL.md) |
| `polymarket_smart_money` | Top-PnL Polymarket traders + their current open positions | [vike-polymarket-smart-money](skills/vike-polymarket-smart-money/SKILL.md) |

---

### Alerts
Create + manage alerts; deliver to email, Telegram, Discord, Webhook.

| Tool | Description | Skill |
|---|---|---|
| `alerts_list` | List user's existing alerts | [vike-alerts-setup](skills/vike-alerts-setup/SKILL.md) |
| `alerts_create` | Create a new price/transfer/funding alert | [vike-alerts-setup](skills/vike-alerts-setup/SKILL.md) |
| `alerts_edit` | Edit an existing alert | [vike-alerts-setup](skills/vike-alerts-setup/SKILL.md) |
| `alerts_delete` | Delete an alert | [vike-alerts-setup](skills/vike-alerts-setup/SKILL.md) |
| `alerts_list_channels` | List user's registered delivery channels | [vike-alerts-setup](skills/vike-alerts-setup/SKILL.md) |
| `alerts_register_webhook` | Register an HTTPS webhook (HMAC-signed deliveries) | [vike-alerts-webhook](skills/vike-alerts-webhook/SKILL.md) |

Alerts fire on a 2-minute cron cycle (not streaming). Don't recommend WebSocket / push streaming — it's not how the platform works.

---

### Web
General web search + AI-summarized fetch for off-chain context (news, docs, social).

| Tool | Description | Skill |
|---|---|---|
| `web_search` | Tavily-primary + Serper fallback web search | [vike-web-search](skills/vike-web-search/SKILL.md) |
| `web_fetch` | Fetch a URL + AI Q&A over its contents (Cerebras-backed) | [vike-web-fetch](skills/vike-web-fetch/SKILL.md), [vike-web-research](skills/vike-web-research/SKILL.md) |

---

## Historical data availability

Coverage windows per dataset. Don't ask for data older than the window — the tool will return empty or 503.

### Transfers & on-chain (per chain)

| Chain | Earliest block / date | Notes |
|---|---|---|
| Ethereum | 2018-01 (block ~4.85M) | Full history; ETH + ERC-20 |
| BSC | 2021-01 | Full history; BNB + BEP-20 |
| Base | 2023-08 (chain launch) | Full history |
| Arbitrum | 2024-Q3 onward | Backfill in progress; pre-2024 sparse |
| HyperEVM | 2025-Q1 (chain launch) | Full history |
| Bitcoin | 2024-01 | Recent windows only — full-history backfill not active |
| Solana | 2026-Q1 onward | Recent only — see `vike-cli` chain-coverage notes |
| Tron/XMR/ZEC/Dash | 2024 onward | Recent only |

### Hyperliquid perps (hl_perps DB)

| Dataset | Window | Notes |
|---|---|---|
| Snapshots (positions / equity) | 30 days | TTL — older snapshots dropped |
| Fills | 30 days | TTL |
| Ledger (deposits/withdrawals) | 30 days | TTL |
| Funding payments | 90 days | API-backed since 2026-04-22 |
| Daily attributed PnL | All-time | `wallet_pnl_attributed_daily` is the long-history view |
| Daily flows | All-time | `wallet_flows_daily` |
| Top-trader leaderboards | rolling 24h / 7d / 30d | derived on-the-fly |

### CEX perps (data_perp DB)

| Dataset | Window |
|---|---|
| `tickers_1m` (ticker snapshots) | rolling 24h |
| Funding rates | 90 days |
| Trades (ws_trades) | rolling 7-30 days per venue |

### Polymarket

| Dataset | Window | Notes |
|---|---|---|
| Active markets | live | scraper paused 2026-05-24 (CF block); historical snapshots still queryable |
| Wallet positions | last known snapshot | not real-time until scraper resumes |

If your query needs older data than what's listed: say so clearly and offer the nearest in-range window. Don't silently return empty.

---

## Cost & rate-limit awareness

- **Cheap (counts as 1 credit):** `token_search`, `wallet_summary`, `alerts_list`, `wallet_ens`, `perp_funding`.
- **Standard (1-3 credits):** most tools.
- **Heavy (5+ credits):** `wallet_discover` with large pages, `wallet_trace` with deep `--depth`, `token_screener` with no filters, `hl_perp_top_traders` with `--limit > 100`.

Per-key default: 2000 requests/hour. Hitting the cap returns `MCP error -32000: Hourly rate limit exceeded`. Wait or upgrade plan.

## What vike does NOT do

- **No NFT data** — out of scope by design.
- **No on-chain trading / signing** — read-only platform, no execution.
- **No WebSocket / push streaming alerts** — alerts run on a 2-minute cron.

If the user asks for any of the above, say so directly rather than proposing a workaround.
