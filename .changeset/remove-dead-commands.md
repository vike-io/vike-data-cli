---
'@vike-io/cli': minor
---

Remove the commands and skills whose MCP tool the server no longer offers: `vike funds` (`fund_holdings`), `vike defi` (`defi_positions`), `vike ohlcv` (`ohlcv`) and `vike token chart` (`token_chart`), plus the `vike-fund-holdings`, `vike-defi-positions` and `vike-ohlcv` skills and every cross-reference to them. These calls already failed with an unknown-tool error.
