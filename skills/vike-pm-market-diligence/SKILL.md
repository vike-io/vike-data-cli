---
name: vike-pm-market-diligence
description: Full due diligence on one Polymarket market - quotes, spread and depth from the order book, recorded activity, large recent prints, who holds each side, on-chain resolution status and smart-money context. Handles the condition id versus token id split. Use when the user asks "is this Polymarket market liquid" / "who is on each side of this market" / "has this market resolved on-chain" / "check this prediction market before I trade" / "diligence on this Polymarket market".
allowed-tools: Bash(vike-data:*)
---

# vike-pm-market-diligence

About 15 credits. Run only the sections the question needs.

**Two ids, never interchangeable.** A market has one `condition_id` (`0x` + 64 hex) and one OUTCOME TOKEN id per outcome (a long decimal number). `polymarket market` and `polymarket settlement` take the condition id; `orderbook`, `stats`, `tape` and `candles polymarket` take a token id and refuse a condition id. Token ids come from `clob_token_ids` in `polymarket market` or `outcomes[].token_id` in `polymarket markets`. **Map outcomes to ids by their label** (`outcomes[].outcome`): `markets` listed `No` before `Yes` and `Down` before `Up`, while `market` listed `Up` first.

## Chain

```bash
vike-data polymarket markets --category Crypto --limit 5 --json        # 1  condition_id, end_date, ended, volume_24h, outcomes[] with token_id, mid, bid, ask
vike-data polymarket market 0xbac62ac581be240787167755692fda4e07b3f42fb24f61a5d73c06731f8ed158 --json   # 2  detail
vike-data polymarket orderbook <token_id> --depth 5 --json             # 1 per outcome: spread and depth
vike-data polymarket stats <token_id> --json                           # 1  what is recorded for this token
vike-data polymarket tape <token_id> --from-ms <now-1h> --to-ms <now> --event-type trade --limit 1000 --json   # 1  large prints
vike-data polymarket settlement <condition_id> --json                  # 1  on-chain resolution
vike-data polymarket wallet <proxy_wallet> --json                      # 2 each: the top 3 holders
vike-data polymarket smart-money --mode flows --hours 24 --json        # 2  is this market in the cohort's flows
```

## Reading

- **`market`**: `question`, `end_date`, `active`, `closed`, `accepting_orders`, `resolution`, `volume_24h`, `liquidity`, `outcomes`, `clob_token_ids`, hourly `yes_series` / `no_series` (first and second outcome), `yes_holders` / `no_holders` (30 each: `proxy_wallet`, `net_shares`, `cost_basis`, `volume_usd`, `trades`), the latest 100 `trades` WITH wallets, and `stats`. It carries no cohort block and no fee rate. `category` can be an empty string.
- **Resolved or not**: `ended: true` only means `end_date` has passed: a market can stay `active`, `resolution: null` and `settlement` = `[]` for weeks (a Brazil-election market ended 2026-10-05 was still unresolved on 2026-10-19). `settlement` returns one row (`winning_index`, `winning_token_id`, `payouts`, `resolved_block`, `resolved_ts_ms`) once the chain resolved it; `[]` means not resolved on chain, not that the market is open (a voided market has none). `market.resolution.resolved_at` repeats `end_date`: take the resolution time from `resolved_ts_ms` (a live market ending 16:00 UTC resolved at 16:12:02).
- **`orderbook`** rows: `as_of_ts` (ms, the snapshot actually used: can be days old for a finished market), `side`, `level` (1 = touch), `price` (a probability), `size` (shares), asks before bids. De-duplicate on (`side`, `level`), take level 1 on each side for the spread (live: ask 0.949, bid 0.929, two cents), sum sizes within 5 cents for depth. A side can be missing: a resolved market answered with asks only, so no spread exists.
- **`stats`**: `trade_volume` is in SHARES, not dollars. `total_events: 0` means never recorded: re-check the token id before calling a market dead.
- **`tape`**: `ts` ms, `price` a probability, `size` shares, `side`. The window is at most 24 hours and `--to-ms` is exclusive; page while `has_more` with `--cursor`. The tape holds NO wallets: size and time only. Wallets come from `market.trades` and the holder lists.
- **Holders**: `polymarket wallet <proxy_wallet>` gives `realized_pnl_usd`, `resolved_markets`, volume-weighted `hit_rate` (a fraction) and `hit_rate_ci`. Quote `hit_rate` only with 10 or more `resolved_markets`. A holder's `cost_basis` against the current mid says whether they are in profit on paper.
- **Smart money** (wallets with $1k+ realized PnL on 5+ resolved markets): look for the `condition_id` in the `flows` / `mispricings` lists. Absence from a top-10 list is not evidence.

## Answer template

> `<question>` ends `<end_date>`; `<open | past end, unresolved | resolved on-chain to X at T>`. `<Yes/Up>` mid `<m>`; spread `<s>`, depth to 5c `<n>` shares each side; 24h volume `$V`, liquidity `$L`. Largest prints last hour: `<size @ price>`. Top holders: `<n>` wallets hold `<outcome>`, cost basis `<c>`; `<k>` have 10+ resolved markets (hit rates `<...>`). Cohort: `<in flows | not in the top 10>`. Quotes are probabilities, not dollars.

## Anti-patterns

- Don't pass a condition id to `orderbook`, `stats` or `tape` and don't call a market "dead" on zero stats.
- Don't say "insider" or "manipulated" from holders and flows: they show who is on a side, not why.
- Don't read the first row of `outcomes[]` as Yes.

## Pairs well with

- `vike-polymarket-market-detail`, `vike-polymarket-trader`, `vike-polymarket-smart-money`, `vike-candles` (probability history), `vike-pm-l2-archive` (bulk history)
