# Changelog

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
