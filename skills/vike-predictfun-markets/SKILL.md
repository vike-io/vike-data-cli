---
name: vike-predictfun-markets
description: Predict.fun (prediction markets on BNB Chain) at a glance and its market list - open markets, 24h USD volume, matches and wallets for the venue and per market, ranked by 24h volume or newest, filterable by status and a title substring. Use when the user asks "what's hot on Predict.fun" / "biggest Predict.fun markets" / "how much volume does Predict.fun do" / "find the Predict.fun market about X".
allowed-tools: Bash(vike-data:*)
---

# vike-predictfun-markets

## Command

```bash
vike-data predictfun overview [--json]                                 # the whole venue, 1 credit
vike-data predictfun markets [--status open|closed|resolved] [--query TEXT] \
  [--sort volume_24h|newest] [--limit N] [--cursor C] [--json]         # limit default 20, max 100; 1 credit
```

`--query` is a case-insensitive substring of the market's title or question. `vike-data search` does not cover Predict.fun: find a market here.

## Examples

```bash
vike-data predictfun overview --json
vike-data predictfun markets --status open --limit 20 --json
vike-data pf markets --query bitcoin --json                    # `pf` alias
vike-data predictfun markets --sort newest --cursor <next_cursor> --json
```

## Output

- `overview`: `markets_open`, `volume_24h_usd`, `trades_24h` (matches), `traders_24h` (wallets on either side), `newest_trade_ts` (epoch ms, the newest fill counted).
- `markets`: `{markets, next_cursor, as_of_ts}`. Each market: `market_id` (an integer: what every other `predictfun` command takes), `condition_id`, `title`, `question`, `status` (`REGISTERED` or `RESOLVED`), `trading_status` (`OPEN` or `CLOSED`), `category_slug`, `is_neg_risk`, `is_yield_bearing`, `fee_rate_bps`, `created_at` (epoch ms), `volume_24h_usd`, `trades_24h`, `traders_24h`.

Page while `next_cursor` is not `null`; a cursor works only with the `--sort` that issued it.

## Reading the data

- **The 24 hours are whole fill hours ending with the newest hour built**, rebuilt hourly, so the figures trail the live tape by up to ~1.5 h. `as_of_ts` / `newest_trade_ts` is the newest fill counted.
- `volume_24h_usd` counts each match once, on the side that took liquidity. USD is BSC USDT.
- `--status open` = trading and not resolved; `closed` = no longer trading, not resolved yet; `resolved` = settled.
- The catalog is refreshed hourly: a market listed in the last hour may be missing.

## Anti-patterns

- Don't pass `condition_id` to the other commands: they take `market_id`.
- Don't quote the 24h figures as "live": they are up to ~1.5 h old.
- Don't call a list of markets "what smart money is doing": there is no smart-money tool for Predict.fun; the closest is `vike-data predictfun leaderboard` (see `vike-predictfun-leaderboard`).

## Pairs well with

- `vike-predictfun-market-detail` — one market's outcomes, order book and fills with wallets
- `vike-predictfun-leaderboard` — who is winning on Predict.fun
- `vike-polymarket-markets` — the same question on Polymarket
