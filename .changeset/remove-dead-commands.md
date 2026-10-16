---
'@vike-io/cli': minor
---

Remove the commands and skills whose MCP tool the server no longer offers: `vike funds` (`fund_holdings`), `vike defi` (`defi_positions`), `vike ohlcv` (`ohlcv`), `vike token chart` (`token_chart`), `vike options flow` (`options_flow`) and `vike web search|fetch` (`web_search`, `web_fetch`), plus the `vike-fund-holdings`, `vike-defi-positions`, `vike-ohlcv`, `vike-options-flow`, `vike-web-search`, `vike-web-fetch` and `vike-web-research` skills and every cross-reference to them.

Add `vike candles hl <symbol>` and `vike candles polymarket <token_id>` (the `hl_ohlcv` and `polymarket_ohlcv` tools) and the `vike-candles` skill.
