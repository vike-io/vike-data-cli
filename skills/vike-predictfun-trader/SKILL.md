---
name: vike-predictfun-trader
description: Profile a Predict.fun wallet - its positions per outcome token with cost, proceeds, mark, value and P&L, realized and unrealized totals, and its on-chain fills with market and outcome. Use when the user gives a wallet address and asks about its Predict.fun bets, positions, P&L or trades.
allowed-tools: Bash(vike-data:*)
---

# vike-predictfun-trader

## Commands

```bash
vike-data predictfun wallet <address> [--json]                                      # positions and P&L, 1 credit
vike-data predictfun wallet-trades <address> [--limit N] [--cursor C] [--json]      # fills, limit default 100, max 10000; 1 credit
```

`address` is `0x` + 40 hex digits; anything else is an error.

## Example

```bash
vike-data predictfun wallet 0xabcdef1234... --json
vike-data pf wallet-trades 0xabcdef1234... --limit 500 --json     # `pf` alias
```

## Output

- `wallet`: `{positions, totals, as_of_ts}`. One position per outcome token, most recently traded first: `market_id`, `market_title`, `token_id`, `outcome`, `state` (`open`, `won`, `lost`, or `uncatalogued` for a market not in the catalog yet), `net` (shares bought minus sold minus fees taken in shares), `cost` (USD paid), `proceeds` (USD received, net of fees), `mark` (the token's last price) and `mark_ts`, `value` (`net` x 1 won, x 0 lost, x `mark` while open), `pnl` (`proceeds - cost + value`; `null` for an open token with no price yet), `fills`, `first_ts`, `last_ts`.
  `totals`: `positions`, `open_positions`, `cost`, `proceeds`, `value` (open positions), `pnl`, `realized_pnl` (won and lost positions), `unrealized_pnl` (open ones), `unpriced` (positions with `pnl` `null`). `as_of_ts` is when the positions were last rebuilt.
- `wallet-trades`: `{trades, next_cursor}`, newest first, each with `market_id`, `market_title` and `outcome` (`null` for a market the catalog does not hold yet), otherwise the rows of `predictfun market-trades`. An address with no fills is an empty page.

## Reading

- **Exchange fills only.** Shares split, merged, redeemed or transferred are not seen: a negative `net` means shares that came from outside the exchange, and a won position stays at its `value` after it is redeemed.
- `realized_pnl` is resolved markets only; an open position counts in `unrealized_pnl` at its last price, so it moves with the market.
- **One trade row is one order's fill**: the wallet's own volume is the sum of `usd` over its rows; for a market's volume add one role only (see `vike-predictfun-market-detail`).
- USD is BSC USDT; prices are probabilities 0 to 1.

## Anti-patterns

- Don't call a wallet skilled from a few resolved positions: count `won` + `lost` positions before quoting `realized_pnl` as a track record.
- `pnl` `null` is "no price yet", not zero: read `totals.unpriced`.
- The same address on Polymarket is a different account history: use `vike-polymarket-trader` for that.

## Pairs well with

- `vike-predictfun-leaderboard` — where the wallet ranks, by window
- `vike-predictfun-market-detail` — the markets it holds
