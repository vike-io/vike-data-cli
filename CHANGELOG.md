# Changelog

## 0.17.4

### Patch Changes

- `hl archive`: the help and skills name the three new daily datasets `positions_hourly`, `cohorts_hourly` and `wallets_hourly` (from 2026-05-01) beside `fills` and `positions`; `--date latest` stays `positions` only.

## 0.17.3

### Patch Changes

- a35aa92: Data-use text corrected: everything from the API, MCP, CLI and the Parquet files is covered by the Vike Terms of Service (personal use, publishing rules, commercial use by written agreement). README, package description, the archive skill and the example now say so.

## 0.17.2

### Patch Changes

- 217b4e6: Data-use text corrected: everything from the API, MCP, CLI and the Parquet files is covered by the Vike Terms of Service. README, package description, the archive skill and the example now say so.

## 0.17.1

### Patch Changes

- 35213ce: `hl market --view funding_rates`: every perp's latest funding rate, or with `--symbol` one perp's hourly history, HIP-3 markets such as `xyz:CL` included. The view is now listed in the help, `--order desc|asc` is new, and `--sort` takes `oi`, `rate` or `abs_rate` on this view.

## 0.17.0

### Minor Changes

- 17d2b82: `alerts create` / `alerts edit` take the four Polymarket alert types (`--type pm_wallet_trade | pm_market_trade | pm_price_move | pm_resolution`) and the market with `--condition-id`; `--direction` also applies to `pm_price_move`. Every alert type can now be e-mailed (`--channel email`). The `vike-alerts-setup` skill documents the Polymarket alerts, e-mail for Hyperliquid and Polymarket alerts, and the server's cap of 200 active alerts per account.

## 0.16.1

### Patch Changes

- 537b522: Skills for four new live stream channels (the server serves them from stream.vike.io; the CLI keeps no channel list, so `stream`, `stream check` and `stream events` take them as they are): `hl.top_positions` and `hl.closed_trades` (path `hl`), `hl.cohort_leverage` (path `hl-cohorts`) and `pm.positions` (path `polymarket`), and the new `leverage`, `liquidation_px` and `labels.tags` of `hl.positions` with its `min_leverage` and `tag` filters.
  
  - `vike-stream`: the channel table, what each new channel sends, its filters and volume, examples, and when each starts sending.
  - `vike-hl-trader-profile` (`hl.closed_trades` by wallet), `vike-hl-cohort-positioning` (`hl.cohort_leverage`, `hl.top_positions`), `vike-hl-liquidation-radar` (`hl.positions` with `min_leverage`), `vike-pm-market-diligence`, `vike-polymarket-trader` and `vike-polymarket-smart-money` (`pm.positions` by market or wallet), the umbrella routing and the README.
  - Fix: `vike-data stream ... --filter min_leverage=20` sent a list (`["20"]`), which the server refuses; it is a number now, like `min_usd`.

## 0.16.0

### Minor Changes

- 0a84307: Fifteen workflow skills (47 in all): playbooks that chain several commands for one question, each naming only commands and flags that exist in this release.
  
  - Wallets: `vike-wallet-who-is` (search, labels, ENS, the chain it is active on, `wallet exchange-usage`, counterparties), `vike-follow-the-money` (`call wallet_trace` with `direction: out`, the transfers, labels, stop rules, a live `chain.transfers` watch with `contract=false`), `vike-wallets-related` (labels, `wallet first-funder`, shared counterparties with exchanges and routers removed, a trace, confidence tiers).
  - Tokens: `vike-token-holder-diligence` (`call token_holders` with `sort: balance` for `supply_pct`, then labels and `token transfers --hide-contracts`), `vike-token-smart-money-trend` (the Ethereum smart-money screener at 24h / 7d / 30d / 90d, differenced into disjoint slices).
  - Hyperliquid: `vike-hl-cohort-positioning` (cohort metrics, the indices, the biggest positions with `--sort size`, live `hl.cohort_bias`), `vike-hl-cohort-backtest` (point-in-time labels, alignment, seams, controls), `vike-hl-trader-profile` (`hl wallet`, `wallet-trades`, `wallet-activity`, orders, TWAPs, liquidations, a live feed of its fills), `vike-hl-asset-briefing`, `vike-hl-liquidation-radar` (`--min-value-usd`, heatmap, live `hl.liq_risk` and `hl.liquidations`), `vike-hl-builder-intel`.
  - Perps, Polymarket, cross-market: `vike-perp-crowding` (funding, `call perp_open_interest` net of price, `call perp_long_short` per venue), `vike-pm-market-diligence` (search, order book, tape, trades with wallets, settlement, holders, a live feed), `vike-pm-l2-archive` (archive files, link, settlements to join), `vike-daily-brief`.
  - Existing skills: Base and HyperEVM on the token and wallet skills (the "Base not covered" hedges are gone; `wallet discover` on base and hyperevm needs `--window all`; `wallet summary` names its `chain` and `call wallet_summary` asks one); `token transfers` lists net buyers or sellers and takes `--hide-contracts`; `wallet balances` covers four chains and prices the native coin; `vike-polymarket-market-detail` describes what the tool returns (holders, trades with wallets, no quote or cohort block); `vike-perp-overview` reaches open interest and long/short with `call`; `search` resolves an ENS name; the umbrella routes every new playbook; eval questions for each.

## 0.15.0

### Minor Changes

- 531c0c8: Every MCP tool is reachable, and the event streams are too.
  
  - `vike-data call <tool> --args '{json}'` (or `--args-file`, `--timeout`) calls any MCP tool by name and prints its raw result, so integers above 2^53 stay exact.
  - A tool that refuses its input now exits 1 in every output mode; before, `--json` and piped output exited 0 with `{"error": ...}` on stdout.
  - `vike-data stream <hl|hl-cohorts|onchain|polymarket> --channel ... [--filter key=value] [--cursor c]` reads `wss://stream.vike.io/v1/stream/<path>`: the key goes in the `X-API-KEY` header, every ping is answered, `event` and `gap` frames print as NDJSON, and after any drop it reconnects from the last cursor of each subscription. It exits 1, without reconnecting, on `replaced (4410)` (another program took the key's connection), on `HTTP 401` / `4401`, and on a refused subscription. The CLI keeps no channel list: the server decides what each path serves, including the live candles (`stream hl --channel hl.candles --filter coin=BTC --filter interval=1m`) that replace `wss://data.vike.io/v1/stream`. `--filter` sends `true` / `false` as a yes/no. A replay the server cannot read (`catchup_unavailable`) is retried after 1, 2, 4, 8 and 15 s, then the subscription continues from now and names the skipped window; a reconnect after an open connection waits 1 s; a full stdout pauses the socket (pings are still answered); a closed pipe (`| head`) ends with exit 0. New dependency: `ws`.
  - `vike-data stream info`, `stream check <channel>` (the server's own validator, exit 1 when it refuses), `stream events <channel>` (stored events, 3 days) and `stream connections` (your recent connections) use the stream's MCP tools and open no socket.
  - `vike-data search <q>`: the vike.io search over tokens, wallets and entities, Hyperliquid traders, vaults and builders, Polymarket wallets and markets.
  - `vike-data hl`: `cohort-metrics`, `segments`, `wallet`, `wallet-activity`, `wallet-trades`, `leaderboard`, `liquidations`, `market` (with the `hourly` panel), `orders`, `twaps`, `ledger`, `leverage-changes`, `stats`, `hype-holders`, `builders`, `vaults`, `vault`, `archive`; a tool with several views takes `--view`.
  - `polymarket markets` takes `--view search --query ...` and `--view market --condition-id ...`; `token transfers` takes `--hide-contracts`; `candles hl` takes `--view export` and `--view latest` (the newest bar of every symbol; no symbol, window or limit is sent with it), and sends only the flags given; `perp top-traders --size` now defaults to 20 (max 100) and `perp find-position --limit` to 50 (max 500), as the server tools do, and `--sort` lists `account_value`, `long_pnl`, `short_pnl`. 68 of the server's 70 MCP tools now have a command; `perp_open_interest` and `perp_long_short` are reached with `call`.
  - `vike-data polymarket`: `market-trades`, `tape`, `orderbook`, `market-stats`, `settlement`, `settlements`, `archive`, `leaderboard`. `vike-data wallet`: `first-funder`, `exchange-usage`.
  - `vike-data alerts`: `events`, `resend`, `rotate-secret`, `test-webhook`; `create` and `edit` take `--type` (transfer and the five Hyperliquid types), `--address` / `--address-role`, `--wallet`, `--actions`, `--pnl-cohorts`, `--size-cohorts`, `--index`, `--threshold`, `--band`, `--direction`. `--chain` takes eth, bsc, base or hyperevm and no longer defaults to eth on the client (a Hyperliquid alert refuses a chain; the server still defaults a transfer alert to eth). Discord is gone from `--channel`: the server refuses it.
  - `vike-data whoami` is registered. `doctor` checks Node >= 22.12.0, the `engines` floor. The User-Agent carries the installed version (it said `vike-cli/dev` outside `npm run`) and is sent on `tools/list` and `initialize` too. The `sync-schema` npm script, whose file never existed, is gone.
  - Skills: a new `vike-stream` skill (32 in all); the umbrella routes the new commands, streams and `call`, and no longer tells agents to deny WebSockets, per-address alerts or a per-wallet Hyperliquid tool; the alert skills cover the Hyperliquid types, address alerts, four chains and no Discord; the webhook check accepts either signature during a secret rotation.

## 0.14.0

### Minor Changes

- 62464b9: Skills audit (2026-10-19). `vike-data perp find-position` now sends `symbol` to `hl_position_match` (the tool renamed `coin` on 2026-10-19; the `--coin` flag is unchanged). Help text no longer claims six balance chains, "10+" label providers or "spot-perp" spreads. 36 skills become 31: `vike-router` folds into the umbrella `vike`; `vike-perp-funding-arb` + `vike-cross-venue-perps` become `vike-perp-funding`; `vike-perp-screener` + `vike-perp-spread-arb` become `vike-perp-overview`; `vike-polymarket-screener` folds into `vike-polymarket-smart-money`; `vike-hl-trader-profile` folds into `vike-hl-top-traders`. Installed copies of the removed skills need `npx skills add vike-io/vike-data-cli` again. The audit's errors are corrected in the skill text: the umbrella (tool and chain lists, page sizes, ENS direction, command names, alert semantics, credits, rate limit of 20,000 requests per hour), token skills (`bought` is every inbound transfer, read `net_tokens`; real columns; fixed 10 rows; native coin as the zero address; screener `holders` counts active wallets; no ascending sort), wallet trace (edge direction is `out_usd` / `in_usd`), label provenance (6 sources plus heuristic, `found: false`), Hyperliquid top traders (percent units, realized-only ROI, no per-wallet HL tool), wallet summary / balances / discover / batch / transactions output shapes, and the Polymarket output keys.

### Patch Changes

- 7aba637: The default MCP endpoint is now `https://data.vike.io/mcp`, the server's published address (same server, tools, key and hourly budget). `VIKE_MCP_URL` still overrides it; the older `https://vike.io/mcp` keeps answering while it is retired.

## 0.13.1

### Patch Changes

- Skills: `allowed-tools` is `Bash(vike-data:*)` and `vike-core` requires the `vike-data` binary. 0.13.0 renamed the command but left all 35 skills granting `Bash(vike:*)`, which does not match `vike-data …`, so an agent was asked to approve, or was refused, every call.

## 0.13.0

### Minor Changes

- The command is `vike-data`. The `vike` binary is removed with no alias: run `vike-data init`, `vike-data token search PEPE` and so on. README, `--help`, error messages and all 36 skill playbooks now name `vike-data`; installed skills that still call `vike` need `npx skills add vike-io/vike-data-cli` again. The skill names, the umbrella skill `vike` and its install path `~/.claude/skills/vike/` are unchanged.

## 0.12.1

### Patch Changes

- e4f4b6c: package.json description and keywords now describe the free Data API (Polymarket L2 Parquet archive, Hyperliquid, labelled wallets, MCP). `vike doctor` / `vike init` no longer assume `/mcp` answers `initialize` without a key: with no key the check fails with the "No API key" message, and `vike init` reports a rejected key instead of printing ok. The postinstall hint links https://vike.io/data/ and the API-keys page instead of the dead https://vike.io/api.
- e4f4b6c: README: answer-first summary of the free Vike Data API, a Free datasets section with direct links, MCP setup, the full command list, and an examples/ folder (Polymarket archive, Hyperliquid cohorts, DuckDB).
- 7f4be01: Umbrella skill: add a plain what-it-is-for paragraph, describe the MCP connector instead of a raw HTTP POST, and fix the tool count (31).
- 31952b5: Umbrella skill: add a 'What it does and who it is for' section (the marketplace check looks for a prose paragraph there).
- ffb25f3: Skills: replace links to sibling skills with their names, so a skill imported on its own (e.g. a marketplace bundle of `skills/vike`) has no dead links.

## 0.12.0

### Minor Changes

- 6a41844: Remove the commands and skills whose MCP tool the server no longer offers: `vike funds` (`fund_holdings`), `vike defi` (`defi_positions`), `vike ohlcv` (`ohlcv`), `vike token chart` (`token_chart`), `vike options flow` (`options_flow`) and `vike web search|fetch` (`web_search`, `web_fetch`), plus the `vike-fund-holdings`, `vike-defi-positions`, `vike-ohlcv`, `vike-options-flow`, `vike-web-search`, `vike-web-fetch` and `vike-web-research` skills and every cross-reference to them.
  
  Add `vike candles hl <symbol>` and `vike candles polymarket <token_id>` (the `hl_ohlcv` and `polymarket_ohlcv` tools) and the `vike-candles` skill.

## 0.11.0

### Minor Changes

- 1082cc5: Add `vike-data` as a second command name, alongside `vike`.

  `vike` collides with the Vike Trader multicall binary, which is also called
  `vike` — two different programs, both ours, one name on PATH. Anyone running the
  trading platform and this CLI on the same machine gets whichever the shell finds
  first.

  This is ADDITIVE: `vike` keeps working exactly as before, so nothing installed
  today breaks. `vike-data` is the unambiguous name to move to, and the one the
  docs should teach from here.

All notable changes are documented here. Entries follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## 0.10.0 — commander 15 + Node 22.12 floor (drops Node 20)

- **Dependency:** `commander` 14 → 15 (via Dependabot #8). Commander 15 is ESM-only and requires Node ≥22.12; the CLI was already ESM (`"type": "module"`) and uses no `--no-*` options, so command behavior is unchanged.
- **Breaking (environment):** minimum supported Node.js is now **22.12.0** (was 20). Node 20 dropped from the CI matrix. Node-20 users should upgrade Node or pin to `0.9.x`.
- Also merged Dependabot #7 (dev-deps: eslint/vitest lockfile bump).

## 0.9.0 — `vike ohlcv` (CEX historical candles)

- **`vike ohlcv <symbol>`** (new command, wraps the new `ohlcv` MCP tool). Historical CEX candles for a canonical ticker (`BTC`) or exchange pair (`BTCUSDT`) across any timeframe (1m–1w), spot or perp. Flags: `--interval`, `--exchange` (binance/bybit/okx/gate/kucoin/coinbase/mexc/pyth, or omit for the merged best-source series), `--market`, `--start`/`--end`, `--limit` (max 5000), and `--cursor` paging. Look-ahead-safe — the in-progress bucket is excluded. Distinct from `vike token chart`, which serves DEX candles by **contract address** at 5/30/120-min only.
- **First live e2e test** (`tests/ohlcv.e2e.test.js`) hitting `vike.io/mcp`; `vitest.e2e.config.js` now auto-loads a gitignored `.env` for `VIKE_API_KEY` (real env vars still win). Coverage + `--help` tests updated.
- New skill playbook `vike-ohlcv` (registered in `skills.sh.json`); routing/command maps updated across root `SKILL.md`, `vike-router`, `README`, and `AGENTS`. Eval questions added for historical-data fetch + an `ohlcv`-vs-`token chart` trap. Total: 41 skills (was 40), 36 MCP tools (was 35).

## 0.8.0 — HL share-card reverse-lookup + multi-IDE installer + SKILL.md hardening

- **`vike perp find-position`** (new command, alias for the new `hl_position_match` MCP tool). Reverse-lookup a Hyperliquid open position from share-card details: paste `coin + side + leverage + entry` and get the wallet(s) holding a matching open position back. Walks widening entry tolerance bands (tight 0.05% → loose 0.5% → fallback 1.0%) with leverage tolerance ±0.5; tie-break by closest mark price. Returns `tolerance_used` so callers can flag low-confidence matches. Backed by `position_snapshots_latest` — near-real-time, no new schema.
- **`vike install`** (new command). One-shot multi-IDE skill drop: `--claude` writes `~/.claude/skills/vike/SKILL.md`; `--cursor` / `--copilot` / `--agents` update marker-fenced blocks in `.cursorrules` / `.github/copilot-instructions.md` / `AGENTS.md` (idempotent — re-running replaces the block, never clobbers surrounding user content). `--all` writes every target at once.
- **Root `SKILL.md` hardening**: added a "Critical Rules" block (8 hard rules agents most often violate), per-service "Historical Data Availability" tables (transfers per chain, prices per venue, HL perps, CEX perps, Polymarket — so agents stop over-promising data we don't have), and UTM-tagged signup links for attribution.
- New skill playbook: `vike-hl-position-match`. Total: 40 skills (was 39), 35 MCP tools (was 34).

## 0.7.3 — agent-discoverable SKILL.md + auto GH releases

- **Root-level `SKILL.md`** — single agent-discoverable entry point covering all 34 MCP tools, auth flow, intent → tool routing table, and per-service tool reference. Ships in the npm package so installing `@vike-io/cli` also installs the skill. Existing per-tool playbooks under `skills/` are unchanged and cross-linked from the root.
- **GH releases now created automatically** on `v*` tag push (release.yml). Previously every tag from v0.5.0 onward was published to npm but never created a corresponding github.com/vike-io/vike-cli/releases entry.

## 0.7.2 — telemetry wired

- **Telemetry skeleton turned on**: Commander `preAction`/`postAction` hooks emit `command_succeeded` (with command name, kebab-cased flag names, duration_ms, cli_version); `parseAsync().catch` emits `command_failed`. Default endpoint is `https://vike.io/api/cli-telemetry`. Honors `DO_NOT_TRACK=1` / `VIKE_NO_TELEMETRY=1` / `CI` / `NODE_ENV=test`.
- **Lint cleanup**: dropped 4 stale unused-vars in `src/telemetry.js` and `src/update-check.js` (the cause of red CI on 0.7.0 + 0.7.1).
- **Dependency bumps** (via Dependabot, all green): `commander ^14`, `eslint ^10`, `vitest ^4`, `actions/checkout v6`, `actions/setup-node v6`.

## 0.7.1 — eval harness v2 + help tweaks + SQL fix

- **Eval schema upgraded** (`evals/questions.yaml`): multi-command list, per-skill tag, multi-step flag, word-boundary forbidden matching. Per-skill scoring breakdown + single-vs-multi-step split in the runner output.
- **10 new multi-step questions** exercising composite playbook skills (smart-money-discovery, wallet-portfolio, polymarket-screener, perp-screener, hl-trader-profile, alerts-setup, etc.) — 32 questions total.
- **Help discoverability tweaks**: `wallet counterparties --limit` and `wallet balances --min-usd` descriptions improved (eval surfaced both as commonly-missed flags).
- **Backend bug fix shipped (server-side)**: `wallet_transactions` returned 0 rows due to ClickHouse SELECT-alias shadowing — fixed in monorepo, deployed to prod.

## 0.7.0 — 5 new commands (transactions, compare, trace, batch, screener)

- **`vike wallet transactions <address>`** (alias `txs`) — raw per-wallet transfer list with `--direction in|out|all`, `--days`, `--min-usd`, `--token` filters.
- **`vike wallet compare <a> <b>`** — diff two wallets (shared counterparties + shared tokens within a window).
- **`vike wallet trace <address>`** — counterparty graph traversal, depth 1-5, width 1-10, with min-USD threshold.
- **`vike wallet batch <addr1> <addr2> ...`** — bulk label + 30d summary lookup for up to 100 addresses, preserves input order.
- **`vike token screener`** — token discovery filter ranked by volume / net inflow / holders / smart-money inflow.
- 5 new SKILL.md playbooks: `vike-wallet-transactions`, `vike-wallet-compare`, `vike-wallet-trace`, `vike-wallet-batch`, `vike-token-screener`.

Total: 38 skills (was 33), 34 MCP tools (was 29).

## 0.6.0 — infra hardening + observability + skill eval harness

Mostly internal-quality improvements; no new commands. Backbone for everything that follows.

**New infra**

- **Background update-check** — silent detached subprocess polls the registry once/day; next-run prints `Update available: X.Y.Z → A.B.C`. Honors `NO_UPDATE_NOTIFIER` / `CI` / `VIKE_NO_UPDATE_CHECK`.
- **First-run-after-upgrade notice** — one-time `Updated to X.Y.Z` print.
- **Telemetry skeleton** — anonymous UUID + 30-min session ID, fire-and-forget. NO sink endpoint wired yet (events drop silently); shape is stable so we can flip it on without refactoring. Opt-out via `DO_NOT_TRACK=1` or `VIKE_NO_TELEMETRY=1`.
- **Centralized chain registry** (`src/chains.js`) — `ALL_CHAINS`, `EVM_CHAINS`, `WALLET_CHAINS`, `CHAIN_ALIASES`, `normaliseChain()`, `isEvmAddress()`.

**Testing + release safety**

- Two-tier vitest config — `npm test` (unit/integration, <30s) vs `npm run test:e2e` (live MCP, up to 2 min).
- Four meta-tests added: shebang, pack-and-install (catches missing `files`), CLI help for every command, command coverage regression.
- Pretest changeset validator — hard-fails on wrong package name in changeset frontmatter; warns on missing changeset.
- Postinstall script hardened — global-install + TTY gates, always `exit 0`.

**Skill quality evals (preview)**

- `evals/` directory with a `uv run`-script harness: A/B-tests every question against `vike --help` only vs `vike --help + SKILL.md`. Scores per question; aggregates a Δ for each skill. If a skill doesn't move the score, it shouldn't ship. Run: `uv run --script evals/runner.py` (needs `ANTHROPIC_API_KEY`).
- 14 starter questions in `evals/questions.yaml`.

**Security**

- `SECURITY.md` published (report at security@vike.io; 48h ack, 7d critical-fix SLA).
- `CODEOWNERS` file (single-maintainer for now; security-sensitive paths called out).
- Dependabot weekly PRs for npm + GitHub Actions deps.
- `npm audit --audit-level=high` added to CI.

## 0.5.0 — initial public release

AI-agent CLI for vike.io on-chain analytics, perpetuals, options flow, and prediction-market data across 11 chains.

**15 command groups, 29 backing MCP tools, 33 SKILL.md playbooks** for Claude Code, OpenClaw, Cursor, GitHub Copilot, and other agent runtimes.

```
vike token   search | transfers | chart | holders
vike wallet  summary | discover | counterparties | pnl-history | balances | ens
vike perp    funding | spreads | top-traders
vike options flow
vike polymarket markets | market | wallet | smart-money
vike funds | labels | defi
vike web     search | fetch
vike alerts  list | channels | create | edit | delete | register-webhook
vike init | doctor | schema | whoami | login | logout
```

Skill discovery: agents auto-discover skills from the `skills/` folder. Manual install: `npx skills add vike-io/vike-cli`.
