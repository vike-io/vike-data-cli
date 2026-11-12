---
name: vike-predictfun-market-detail
description: Read one Predict.fun market by market_id - its outcomes and token ids, WON/LOST once resolved, last prices, 24h and total USD volume, the newest recorded order book, and its on-chain fills with the wallet behind each. Use after vike-predictfun-markets when the user asks about one specific Predict.fun market, its price, its liquidity or who traded it.
allowed-tools: Bash(vike-data:*)
---

# vike-predictfun-market-detail

## Commands

```bash
vike-data predictfun market <market_id> [--json]                                      # 1 credit
vike-data predictfun orderbook <market_id> [--json]                                   # 1 credit
vike-data predictfun market-trades <market_id> [--limit N] [--cursor C] [--json]      # limit default 100, max 10000; 1 credit
```

`market_id` is a positive integer from `vike-data predictfun markets`. It is NOT the `condition_id`.

## Example

```bash
vike-data predictfun markets --query bitcoin --limit 5 --json
#   → pick a market_id from the output, then:
vike-data predictfun market 1234 --json
vike-data predictfun orderbook 1234 --json
vike-data predictfun market-trades 1234 --limit 1000 --json
```

## What it returns

- `market`: `{market, outcomes, stats, as_of_ts}`.
  - `market`: the list fields (`title`, `question`, `status`, `trading_status`, `category_slug`, `fee_rate_bps`, ...) plus `details`, Predict.fun's own record of the market (description, outcomes, resolution).
  - `outcomes`: `token_id`, `index_set`, `name`, `status` (`WON`, `LOST`, or empty while unresolved), `last_price` and `last_trade_ts` of its newest fill.
  - `stats`: `volume_24h_usd`, `volume_total_usd`, `trades_24h` (matches), `traders_24h`, `last_price` (the first outcome's, Yes).
- `orderbook`: priced on the FIRST outcome (Yes). `bids` highest first and `asks` lowest first as `[price, quantity]`; `pending_bids` / `pending_asks` (matched, not yet settled on chain); `last_settled` (the last settled order Predict.fun reported, or `null`); `order_count`, `version`; `ts` (Predict.fun's time) and `recorded_ts` (ours), epoch ms.
- `market-trades`: `{trades, next_cursor}`, newest first, every outcome. Each row: `ts` (block time, epoch ms), `block_number`, `tx_hash`, `log_index`, `exchange` (the contract), `wallet` (whose order filled), `counterparty`, `role` (`maker` / `taker`), `side` (`BUY` / `SELL` of `token_id`), `token_id`, `outcome`, `size` (shares), `price` (0 to 1), `usd`, `fee`. Page with `--cursor` while `next_cursor` is not `null`; a page boundary neither repeats nor skips a fill.

## Reading the data

- **One trade row is one ORDER's fill, not one match.** A match is one `maker` row per resting order hit plus one `taker` row for the order that took them, whose amounts are theirs added up. Add `usd` over the `taker` rows (what `volume_24h_usd` does) or the `maker` rows, never both.
- Prices are probabilities 0 to 1: `0.42` = "42% chance". USD is BSC USDT.
- The 24h stats are whole fill hours ending with the newest hour built, up to ~1.5 h behind the live tape; `market-trades` reads the tape itself.

## Anti-patterns

- An unknown `market_id` is an error (exit 1), not an empty answer.
- Books are recorded for the ~1,000 most active open markets: `orderbook` on a quiet or closed market is an error ("no order book recorded ... in the last 30 days"). Say so; don't call the market illiquid from that alone.
- `market-trades` has no time filter: it pages back from the newest fill. Stop paging once `ts` is older than the window you need.
- Don't claim manipulation or insiders from trades alone.

## Pairs well with

- `vike-predictfun-markets` — find the `market_id`
- `vike-predictfun-trader` — profile any `wallet` from the fills
- `vike-predictfun-leaderboard` — is that wallet among the top earners
