---
name: vike
description: "Use this skill whenever the user asks any question about on-chain crypto data, wallet behavior, token transfers, smart money, CEX perpetual futures, Hyperliquid perps, prediction markets (Polymarket), ENS, or on-chain flows — and live data from vike.io would improve the answer. This includes questions like \"who is buying X token\", \"what is wallet 0x... doing\", \"top wallets by PnL\", \"funding rate spread across Binance/Bybit/OKX\", \"largest HL perp traders this week\", \"who is winning on Polymarket\", \"what is the ENS name of this address\", \"label this wallet\", \"trace this transfer\", \"top tokens by smart-money inflow\", \"are whales long or short BTC\", \"who is on each side of this Polymarket market\", \"give me a daily brief\". It is also the entry point that decides which vike-* skill answers a question (tokens, wallets, labels, perps, Hyperliquid, Polymarket, candles, alerts). Always use this skill proactively when the user's query could benefit from real-time or historical on-chain data — don't wait for the user to explicitly ask to \"use vike\". If the user asks a general on-chain question that requires synthesis across wallets/tokens/venues, route to vike first."
---

# vike — on-chain, perps and prediction-market data

This skill is for anyone who asks an AI agent about crypto data: who is buying a token, what a wallet holds, what Hyperliquid or Polymarket traders are doing right now. It tells the agent which vike tool answers which question and how to read the result, so it does not guess or invent numbers. It reads its data from vike.io and needs a free vike API key.

What the platform has: wallet and token analytics on Ethereum, BSC, Base and HyperEVM (each tool's chain list is under "What each tool really returns"), multi-source wallet labels, CEX perpetual funding, spreads, open interest and long/short lean, Hyperliquid cohort positioning, wallets, leaderboards, liquidations, market structure and builders, candles, Polymarket markets, traders, smart-money signals, order books, the event tape and on-chain settlements, and transfer alerts. 46 tools in one MCP server.

**MCP endpoint for all calls:** `https://vike.io/mcp` (JSON-RPC 2.0)
**Or use the CLI:** `npm install -g @vike-io/cli` → `vike-data <command>`

## What it does and who it is for

It is for traders, researchers and developers who use an AI agent to look at crypto data. With this skill the agent knows which vike tool to call for wallets, tokens, smart money, Hyperliquid perps, Polymarket markets and alerts. It also knows how to read each answer and what the tools cannot do, so it reports real numbers instead of guesses. The data comes from vike.io and a free vike API key is needed.

---

## Critical Rules

Hard rules — agents that violate these produce wrong answers. Read once, apply always.

1. **Addresses are always full 0x-hex (42 chars).** Never truncate when querying. Never display truncated when the user asks for the address — they'll copy-paste it.
2. **Perp and Hyperliquid symbols are upper-cased by the server.** Echo back what the user wrote.
3. **Windows are counted in UTC calendar days, not a rolling 24 hours.** On the token screener `24h` spans yesterday and today; on Hyperliquid `30d` is today plus the previous 30 days.
4. **Page sizes are small and differ per tool; there is no paging.** Max 20: `wallet_discover` (`size`), `hl_perp_top_traders` (`size`), `polymarket_smart_money`. Max 30: `polymarket_markets`. Max 50: `token_holders`, `wallet_counterparties`, `wallet_compare`, `hl_position_match`. Max 100: `token_screener`, and 100 addresses for `wallet_batch_labels`. Max 500: `wallet_transactions`, `hl_leaderboard`. Max 1,000: `polymarket_tape`. Max 5,000: the `hl_*` activity, positions and liquidation-fill lists. `token_transfers` has no limit: it always returns 10 rows. The `hl_*` tools page with a cursor (`nextCursor` back as `cursor`); the others do not, so narrow the filter or the window instead of asking for more rows.
5. **Refresh differs per tool; never promise "minutes".** `wallet_discover` and `wallet_summary` are rebuilt nightly, so a wallet active an hour ago may not show. Transfers are synced block by block. `hl_position_match` only matches positions seen within 15 minutes of the newest snapshot batch; `hl_cohort_metrics` returns settled hours (the hour in progress never) and carries `freshness.stale`. Perp open interest and long/short are polled every 5 to 8 minutes. Alerts are checked on a cron, not streamed.
6. **USD amounts are floats in dollars.** `--min-usd 10000` = ten thousand dollars, not micro-USD.
7. **`--json` is always available** on CLI commands and gives stable machine-readable output. The default (human) format may change; `--json` will not.
8. **Resolve a token before asking transfer/holder questions.** `token_search` → take the canonical address → pass it to `token_transfers` / `token_holders`. Symbol-only queries lose precision on tickers that collide across chains (e.g. FUN, BEAM, USDC).
9. **`bought` in `token_transfers` is every inbound transfer**, flash-loan round trips included. Read `net_tokens` (bought − sold) before calling a wallet a buyer.
10. **Fractions are not percents.** `bias`, `long_share`, `percent_risk`, `pct_wallets_in_profit` and `hl_leaderboard` / `hl_wallet` `win_rate` are fractions; `hl_perp_top_traders` `win_rate_pct`, `roi_pct` and every `max_drawdown_pct` are percents. Never mix them in one table.
11. **Two kinds of id on Polymarket.** `condition_id` (`0x` + 64 hex) for `polymarket_market_detail` and `polymarket_settlement`; an outcome token id (a long decimal) for `polymarket_tape`, `polymarket_orderbook`, `polymarket_market_stats` and `polymarket_ohlcv`. Never swap them.

---

## Step 1: Confirm Authentication

Follow this decision tree **before every session**. Do not skip to Step 2 until auth is confirmed.

```
1. Is the CLI installed? (`vike-data --version`)
   ├── YES → continue
   └── NO  → `npm install -g @vike-io/cli`

2. Is $VIKE_API_KEY set OR has the user run `vike-data init` / `vike-data login` already?
   ├── YES → run `vike-data doctor` to verify the key + endpoint reachability. Proceed.
   └── NO  → prompt the user (see Setup below).
```

### Setup

If the user has no API key yet, tell them:

> **To use vike, you'll need a free API key:**
>
> 1. Visit https://vike.io/account?tab=api-keys&utm_source=skill&utm_medium=ai&utm_campaign=cli_skill, sign in, and copy a key (starts with `vk_`).
> 2. Save it: `vike-data login --api-key vk_...` (or `export VIKE_API_KEY=vk_...`).
> 3. Verify: `vike-data doctor`.
>
> One key gets 20,000 requests per rolling hour, shared by the MCP server and the REST API.

If using the MCP server directly (without the CLI), authenticate with the key in this header:
```
X-API-KEY: vk_...
```

---

## Step 2: Route the question

Pick by the question, then read the named skill for the recipe and the traps. If two rows fit, prefer the task skill (a multi-call workflow) over the per-tool skill.

| User is asking about... | CLI / MCP tool | Skill |
|---|---|---|
| Token symbol/name → address | `vike-data token search` / `token_search` | `vike-token-search` |
| Who bought / sold a token (top 10, one side per call) | `vike-data token transfers` / `token_transfers` | `vike-token-transfers` |
| "Research token X" end to end | search → transfers (both tabs) | `vike-token-research` |
| Who sits at the top of token X (exchanges, contracts, fresh wallets, risk flags) | search → holders(50) → batch | `vike-token-holder-diligence` |
| Top holders of a token (ranked by net inflow, not balance) | `vike-data token holders` / `token_holders` | `vike-token-holders` |
| Tokens trending / with the biggest inflow / smart-money inflow | `vike-data token screener` / `token_screener` | `vike-token-screener` |
| Which tokens is smart money buying now / alpha wallets | screener `--smart-money-only` → transfers | `vike-smart-money-discovery` |
| Is smart money entering, holding or exiting token X over time (Ethereum) | screener at 24h / 7d / 30d / 90d → transfers → batch | `vike-token-smart-money-trend` |
| One wallet's volume / inflow / outflow / tx count by window | `vike-data wallet summary` / `wallet_summary` | `vike-wallet-summary` |
| "Who is this wallet" / exchange, fund or user / which exchange it uses | labels → ens → summary → counterparties → batch | `vike-wallet-who-is` |
| Full picture of one wallet ("everything about it": holdings + flows) | several calls | `vike-wallet-portfolio` |
| Top wallets by volume / flow / tx count | `vike-data wallet discover` / `wallet_discover` | `vike-wallet-discover` |
| Individual transfers of a wallet | `vike-data wallet transactions` / `wallet_transactions` | `vike-wallet-transactions` |
| Who a wallet trades with | `vike-data wallet counterparties` / `wallet_counterparties` | `vike-wallet-counterparties` |
| Follow funds N hops out | `vike-data wallet trace` / `wallet_trace` | `vike-wallet-trace` |
| "Where did the funds go" / incident trace to an exchange | labels → trace → transactions → batch | `vike-follow-the-money` |
| Are wallets A and B related (exactly two) | `vike-data wallet compare` / `wallet_compare` | `vike-wallet-compare` |
| Evidence of one owner, or siblings of a wallet, with confidence tiers | counterparties → compare → trace | `vike-wallets-related` |
| Daily net-flow series (not PnL) | `vike-data wallet pnl-history` / `wallet_pnl_history` | `vike-wallet-pnl-history` |
| What a wallet holds right now | `vike-data wallet balances` / `wallet_token_balances` | `vike-wallet-balances` |
| ENS name of an address (reverse only) | `vike-data wallet ens` / `wallet_ens` | `vike-wallet-ens` |
| Label many addresses (up to 100) | `vike-data wallet batch` / `wallet_batch_labels` | `vike-wallet-batch` |
| Why is this wallet labelled X (sources) | `vike-data labels <address>` / `wallet_label_provenance` | `vike-wallet-label-provenance` |
| Funding rates, funding arb, one symbol across venues | `vike-data perp funding` / `perp_funding` | `vike-perp-funding` |
| Cross-venue price spread, "perp market overview", open interest or long/short of a symbol | `vike-data perp spreads` / `perp open-interest` / `perp long-short` | `vike-perp-overview` |
| Is a perp symbol crowded (funding + OI net of price + long/short) | several calls | `vike-perp-crowding` |
| Top Hyperliquid traders, the full leaderboard, PnL net of deposits | `vike-data perp top-traders` / `hl leaderboard` | `vike-hl-top-traders` |
| "Is this HL address any good" / one HL wallet's record, funding, deposits | `vike-data hl wallet` + `hl activity` | `vike-hl-trader-profile` |
| Are whales / smart money long or short a Hyperliquid symbol | `vike-data hl cohort-metrics` / `hl segments` | `vike-hl-cohort-positioning` |
| Did cohort positioning lead price (backtest method) | `hl cohort-metrics --label-basis point_in_time` + candles | `vike-hl-cohort-backtest` |
| One Hyperliquid symbol end to end (funding, OI, cohorts, liquidations) | several calls | `vike-hl-asset-briefing` |
| Which HL coins are near liquidation / where liquidations cluster | `vike-data hl liquidations` | `vike-hl-liquidation-radar` |
| HL builder codes: fees, users, series | `vike-data hl builders` | `vike-hl-builder-intel` |
| HL share card → which wallet holds it | `vike-data perp find-position` / `hl_position_match` | `vike-hl-position-match` |
| Candles: Hyperliquid perp/spot, Polymarket outcome token | `vike-data candles hl` / `candles polymarket` | `vike-candles` |
| Trending Polymarket markets (by 24h volume) | `vike-data polymarket markets` / `polymarket_markets` | `vike-polymarket-markets` |
| One Polymarket market | `vike-data polymarket market <condition_id>` / `polymarket_market_detail` | `vike-polymarket-market-detail` |
| Is a Polymarket market liquid / who is on each side / has it resolved on-chain | markets → market → orderbook → tape → settlement | `vike-pm-market-diligence` |
| Bulk Polymarket L2 history (Parquet), BTC 5m up/down for a backtest | `vike-data polymarket archive` | `vike-pm-l2-archive` |
| One Polymarket trader | `vike-data polymarket wallet` / `polymarket_wallet` | `vike-polymarket-trader` |
| Polymarket smart-money flows / mispricings / overview | `vike-data polymarket smart-money` / `polymarket_smart_money` | `vike-polymarket-smart-money` |
| "Daily brief" / what happened across perps, HL, Polymarket and on-chain today | several cheap calls | `vike-daily-brief` |
| Alerts: create / list / edit / delete | `vike-data alerts ...` / `alerts_*` | `vike-alerts-setup` |
| Alert delivery to an HTTPS webhook | `vike-data alerts register-webhook` | `vike-alerts-webhook` |
| Install, auth, errors, conventions | — | `vike-core` |

**When in doubt, start with `vike-data token search` or `vike-data wallet summary`.** Both are cheap and disambiguate what the user actually meant.

### Example query routing
```
"Who bought the most PEPE in the last 24h?"          → token_search, then token_transfers (tab=bought, period=24h; 10 rows; rank by net_tokens)
"What is 0xd8dA6BF...AbA96 holding?"                  → wallet_token_balances   (+ wallet_summary for flows)
"Funding rate for BTC across all perp venues"         → perp_funding            (symbol=BTC; raw per-interval rates)
"Which venue pays the most funding on ETH?"           → perp_funding            (symbol=ETH, normalise to daily yourself)
"Biggest HL perp PnL last week"                       → hl_perp_top_traders     (window=7d, sort=pnl)
"What are the hottest crypto prediction markets?"     → polymarket_markets      (category=Crypto) → polymarket_market_detail
"Why is 0x28C6... labeled 'Binance hot wallet'?"      → wallet_label_provenance (address=0x28C6...)
"Are whales long or short BTC on Hyperliquid?"       → hl_cohort_metrics       (symbol=BTC, axis=size, hours=1) → bias per rung
"Is there a gap between the order book and the mid?" → polymarket_orderbook    (token_id, not condition_id)
"What is the ENS name of 0xd8dA6BF...?"               → wallet_ens              (address=0xd8dA...; name → address is NOT supported)
"Alert me on WBTC transfers over $1M"                 → alerts_create           (token_symbol=WBTC, min_value_usd=1000000; fires on ANY such transfer)
"Trace funds from 0xHACKER 3 hops out"                → wallet_trace            (address=0xHACKER, depth=3)
```

---

## Step 3: Call the tool

### Two equivalent interfaces

**A) Via CLI (recommended for shell-bound agents).** All commands accept `--json` for machine-readable output:
```bash
vike-data wallet summary 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 --json
vike-data perp funding --symbol BTC --json
```

**B) Via an MCP connector (recommended when your client has one).** All 46 tools live at `https://vike.io/mcp`. Connect the client to that address with the `X-API-KEY` header above, then call a tool by name with its arguments, for example `wallet_summary` with `address` set to a full 0x address.

Run `vike-data schema --pretty` (or call MCP `tools/list`) to see the live arg shape for every tool. Always read the schema before constructing arguments — defaults and enum values change.

---

## What each tool really returns

### Tokens
| Tool | Returns | Not |
|---|---|---|
| `token_search` | symbol, name, address (WITHOUT the `0x` prefix: add it for display), logo for a query | no market cap |
| `token_transfers` | 10 wallets, one side (`tab` = `bought` or `sold`) per call, period 1h/24h/7d/30d: `address, bought, sold, net_tokens, usd_spent, usd_received, net_usd, chains` | no `--min-usd`; window ends at the token's newest priced row; a net seller has `net_usd > 0` |
| `token_holders` | wallets ranked by cumulative net inflow USD, with entity/type | not balances, no concentration metric; slow on busy tokens (ENA on ethereum about 26 s, WETH on base about 50 s) |
| `token_screener` | per-token volume, net/in/out USD, `unique_holders` (wallets ACTIVE in the window, not growth), tx count | no age, liquidity or sector filter; no ascending sort; native coin shows as `0x000…000`; `symbol` is often blank |

### Wallets
| Tool | Returns | Not |
|---|---|---|
| `wallet_summary` | a dict keyed `all, 90d, 30d, 7d, 24h`, each with `total_volume, total_inflow, total_outflow, net_flow, tx_count, tokens_traded, first_seen, last_active`, plus `chain`: the ONE chain it answers for (default: the more recently active of ethereum and bsc, and base or hyperevm only for a wallet with no priced ethereum/bsc volume; `--chain` asks for one; never summed) | no PnL, holdings or labels |
| `wallet_discover` | `{wallets, total}` ranked by volume / inflow / outflow / net_flow / tx_count / pnl (`size` ≤ 20; ethereum, bsc, base, hyperevm; `base` and `hyperevm` serve `window=all` only) | `realized_pnl` is a ranking key only, not a dollar figure; no labels column |
| `wallet_transactions` | single transfers, newest first | no aggregates |
| `wallet_compare` | shared counterparties + shared tokens of exactly two wallets | not 3+ wallets |
| `wallet_trace` | nodes + edges; direction lives in each edge's `out_usd` / `in_usd` | `from` is the side expanded first, not the sender |
| `wallet_counterparties` | top partners with sent/received USD and labels | |
| `wallet_pnl_history` | daily net inflow USD (a proxy) | not realized PnL |
| `wallet_token_balances` | holdings read from the chain at request time (ethereum, bsc, base, hyperevm; all four take about 30 s, pass `chains`); native coin is a row with `usd_value: null`; on base and hyperevm only mapped and priced tokens carry a symbol and value unless `min_usd=0` (then thousands of spam rows) | not a DeFi-position view; HyperCore accounts not included |
| `wallet_ens` | name for an address (Ethereum mainnet names), or `null` | no name → address |
| `wallet_batch_labels` | entity, type, risk flag + 30-day flow fields per address, in input order; `chain` picks that chain's own label and flow tables | the 30-day fields are `null` on `bsc`, and wherever `found: false`; `hyperevm` has few labels |

Chains: the token and wallet tools take `chain` = `ethereum` | `bsc` | `base` | `hyperevm` (the per-chain wallet tools label nodes from that chain's own table); `wallet_token_balances` takes a `chains` list of the same four, and anything else lands in `chain_errors`. Exceptions: `wallet_discover` on `base` and `hyperevm` is `window=all` only; `token_screener` smart-money mode and the `smart_inflow` sort are `ethereum` only (a 400 elsewhere); `wallet_label_provenance` and `wallet_ens` are Ethereum only; alerts take `eth` | `bsc`. `wallet_summary` has no chain parameter and names its answer in `chain`. Arbitrum, Bitcoin, Solana, Tron and other non-EVM chains are not served; say so.

### Labels
`wallet_label_provenance` returns the raw source labels (at most 6 sources plus our heuristic classifier) and a consensus entity/type. When an answer hinges on "is this really a CEX hot wallet?", call it rather than trusting one source. `found: false` means the wallet is missing from our labelled-wallet table and no source is consulted at all, so it is not proof that nobody labels it, and it is not proof the wallet is clean.

### CEX perps
| Tool | Returns |
|---|---|
| `perp_funding` | with `symbol`: raw per-venue `funding_rate` + `interval_h` (daily % = rate × 24 / interval_h × 100); without: up to 5 pre-ranked arb rows (`long_exchange`, `short_exchange`, `spread_daily_pct`) |
| `perp_spreads` | up to 10 cross-venue price-gap rows (≥ 0.5%); `symbol` only filters that global top 10, so it is often empty |
| `perp_open_interest` | per venue `oi_usd` (USD notional = contracts × mark price, so it moves with price), `ts`, `age_s`; `stale_venues` listed apart and never in a total; with `hours` (1-168) an hourly `[hour, oi_usd]` series; base asset (`BTC`) only |
| `perp_long_short` | per venue `long_share` / `short_share` (fractions of 1), `long_short_ratio`, and `basis`: what that venue counts (binance top traders by positions, okx and gate top traders by accounts, bybit all accounts); never average across venues; about 40 major symbols |

Funding and spreads return no mark prices or bid/ask per venue. "Spread" here is perp vs perp across venues, not spot vs perp.

### Hyperliquid
| Tool | Returns |
|---|---|
| `hl_perp_top_traders` | up to 20 wallets: `total_realized_pnl`, `roi_pct`, `win_rate_pct`, `max_drawdown_pct` (all percents; 12.5 = 12.5%), `trade_count`, `total_volume`. ROI = window realized PnL / CURRENT account value; drawdown is account-level and all-time |
| `hl_position_match` | wallets whose open position matches a share card (`symbol`, side, leverage, entry) |
| `hl_ohlcv` | perp or spot candles |
| `hl_cohort_metrics` | hourly long/short notional per wallet cohort for ONE symbol (`axis` size / pnl / pnl_abs / tier / pnl_unrealized): `total_position_value`, `total_position_value_long`, `bias` (a fraction -1..+1); `label_basis=point_in_time` for any history; `freshness.stale` |
| `hl_segments` | the cohort vocabulary (`cohorts`, `segments`), one cohort across all symbols (`summary`), or every symbol by cohort (`heatmap`, large) |
| `hl_wallet` | one wallet: equity, open positions, cohort labels, lifetime PnL vs deposits, risk metrics (`summary`) or the trade record with medians (`trades_summary`); an unknown wallet answers zeros, not an error |
| `hl_wallet_activity` | a wallet's `fills`, `funding` (negative = paid), `ledger` (deposits, withdrawals, sends) or `builders` |
| `hl_leaderboard` | `ranking` (20 sort keys, Calmar, profit factor, cursor paging to 500 rows, cohort filter; fractions for win rate) or `flow_adjusted` (excludes deposits) |
| `hl_liquidations` | `fills` (inferred realized liquidations), `risk` (symbols ranked by `percent_risk`, a fraction, thin markets first) or `heatmap` (liquidation value per price bin of one symbol) |
| `hl_market` | `open_interest` per symbol beside the venue's own number, `symbol_metrics` (hourly), `size_breakdown`, or `positions` (ordered by wallet address, not size; always pass `symbol` or `wallet`) |
| `hl_builders` | builder codes: `leaderboard`, `stats`, `profile`, `users`, `fills`, `series` |

`max_drawdown_pct` on the leaderboard, `hl_wallet` and `hl_perp_top_traders` is saturated at exactly 100 for most top-PnL wallets and exceeds 100 for some: don't quote it, Calmar or recovery factor without that caveat. `avg_leverage` is not populated (reads 0).

### Candles
`hl_ohlcv` (Hyperliquid perp or spot, 1m–1d, built from HL's own fills, also HIP-3 builder DEXs) and `polymarket_ohlcv` (ONE outcome token, price = probability 0–1, needs a `token_id`, not a condition_id). There is no candle source for CEX tickers or an arbitrary ERC-20.

### Polymarket
| Tool | Returns |
|---|---|
| `polymarket_markets` | markets ranked by 24h volume only (`volume_24h`, `liquidity`, `ended`, `outcomes[]` with `token_id`, `mid`, `bid`, `ask`) |
| `polymarket_market_detail` | one market by `condition_id`: metadata, `outcomes` + `clob_token_ids`, `resolution`, hourly probability series, the top 30 holders per side, the latest 100 trades WITH wallets, `stats` (no live quote block, no cohort block) |
| `polymarket_wallet` | one trader: realized PnL, volume-weighted `hit_rate`, `resolved_markets`, positions |
| `polymarket_smart_money` | MARKETS where the profitable-wallet cohort is flowing (`flows`) or bought below the mid (`mispricings`); not a list of top traders; unfiltered, the top rows are often already-decided games |
| `polymarket_tape` | the raw event tape of one OUTCOME TOKEN for a window of at most 24h (`from_ms`, `to_ms` exclusive), 1,000 events a page, no wallets; pass `event_type` |
| `polymarket_orderbook` | the book of one token at an instant: `side`, `level`, `price`, `size`, `as_of_ts`; duplicates possible, a side can be missing |
| `polymarket_market_stats` | what is recorded for one token: events, trades, `trade_volume` in SHARES, snapshots; all zeros = never recorded (check the id) |
| `polymarket_settlement` | on-chain resolution by `condition_id`: `winning_index`, `payouts`, `resolved_ts_ms`; `[]` = not resolved on chain |
| `polymarket_archive` | the index of the bulk L2 Parquet files and one file's download URL; never downloads |

Tape, order book, stats and candles take an outcome token id; market detail and settlement take the condition id.

### Alerts
Create + manage on-chain transfer alerts delivered to email, Discord or an HTTPS webhook.

| Tool | Does |
|---|---|
| `alerts_list`, `alerts_list_channels` | list rules / enabled channels |
| `alerts_create`, `alerts_edit`, `alerts_delete` | manage a rule (token symbol + chain `eth`/`bsc` + USD thresholds) |
| `alerts_register_webhook` | register an HTTPS webhook (HMAC-signed deliveries) |

An alert fires on ANY transfer of the token above the USD threshold on that chain. It cannot watch one address, and there is no price or funding alert. There is no Telegram delivery. Alerts are checked on a cron, not streamed; do not suggest WebSockets.

---

## Cost & rate limits

Credits are an accounting figure only; they never block a call. The one limit is 20,000 requests per rolling hour per key, shared by MCP and REST.

- **0 credits:** `token_search`, `alerts_list`, `alerts_list_channels`.
- **1:** `wallet_ens`, `wallet_label_provenance`, `perp_funding`, `perp_spreads`, `perp_open_interest`, `perp_long_short`, `hl_ohlcv`, every other `hl_*` tool except `hl_perp_top_traders` and `hl_position_match`, `polymarket_markets`, `polymarket_ohlcv`, `polymarket_tape`, `polymarket_orderbook`, `polymarket_market_stats`, `polymarket_settlement`, `polymarket_archive`.
- **2:** most others, `wallet_summary`, `hl_perp_top_traders`, `hl_position_match`, `polymarket_market_detail` among them.
- **3:** `token_screener`, `wallet_compare`, `wallet_token_balances`, `alerts_create`.
- **4:** `wallet_trace`.

## What vike does NOT do

- **No NFT data** — out of scope by design.
- **No on-chain trading / signing** — read-only platform, no execution.
- **No WebSocket / push streaming alerts.**
- **No ENS name → address**, no per-address alerts, no candles for CEX tickers or arbitrary ERC-20 contracts.
- **No Hyperliquid order-book, stop or TWAP data, no position lifecycles and no sub-account merge**; HL alerts do not exist. Cohort labels on the default `pnl` ladder are today's, not historical.
- **No Polymarket wallet addresses on the L2 tape or in the archive**, no other prediction-market venue, no Polymarket alerts, and no `neg_risk` or event grouping on the Polymarket tools.
- **No non-EVM chains** (Bitcoin, Solana, Tron, Monero, Zcash, Dash) and no Arbitrum.

If the user asks for any of the above, say so directly rather than proposing a workaround.
