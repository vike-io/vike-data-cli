---
'@vike-io/cli': patch
---

package.json description and keywords now describe the free Data API (Polymarket L2 Parquet archive, Hyperliquid, labelled wallets, MCP). `vike doctor` / `vike init` no longer assume `/mcp` answers `initialize` without a key: with no key the check fails with the "No API key" message, and `vike init` reports a rejected key instead of printing ok. The postinstall hint links https://vike.io/data/ and the API-keys page instead of the dead https://vike.io/api.
