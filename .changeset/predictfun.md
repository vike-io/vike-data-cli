---
'@vike-io/cli': minor
---

`predictfun` (alias `pf`): Predict.fun prediction markets on BNB Chain. `overview`, `markets` (`--status open|closed|resolved`, `--query`, `--sort volume_24h|newest`, `--limit`, `--cursor`), `market <market_id>`, `orderbook <market_id>`, `market-trades <market_id>` and `wallet-trades <address>` (`--limit`, `--cursor`), `wallet <address>` (positions and P&L) and `leaderboard` (`--window all|1d|7d|30d`, `--sort realized|volume|fills|unrealized`, `--limit`, `--offset`). Calls the MCP tools `predictfun_*`. New skills `vike-predictfun-markets`, `vike-predictfun-market-detail`, `vike-predictfun-trader` and `vike-predictfun-leaderboard`; the `vike` skill routes Predict.fun questions to them.
