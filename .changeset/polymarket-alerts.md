---
"@vike-io/cli": minor
---

`alerts create` / `alerts edit` take the four Polymarket alert types (`--type pm_wallet_trade | pm_market_trade | pm_price_move | pm_resolution`) and the market with `--condition-id`; `--direction` also applies to `pm_price_move`. Every alert type can now be e-mailed (`--channel email`). The `vike-alerts-setup` skill documents the Polymarket alerts, e-mail for Hyperliquid and Polymarket alerts, and the server's cap of 200 active alerts per account.
