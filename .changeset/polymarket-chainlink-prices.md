---
'@vike-io/cli': minor
---

`polymarket chainlink-prices <symbol>`: the Chainlink Data Streams prices that Polymarket's crypto up/down markets resolve on (btc, eth, sol, xrp, doge, bnb, hype, zec), since 2026-11-06 09:24 UTC. `--series price|twap60`, `--interval 1s|1m|5m|15m|1h|4h|1d` (above `1s`, one row per bucket: the first tick at or after its start), `--from-ms`, `--to-ms`, `--cursor`, `--limit`. Calls the MCP tool `polymarket_chainlink_prices`.
