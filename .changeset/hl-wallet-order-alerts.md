---
'@vike-io/cli': minor
---

`alerts create` and `alerts edit` take the `hl_wallet_orders` type: one wallet's Hyperliquid orders placed in or gone from the book, private to the account (`--wallet`, required; `--min-usd`, the order's size x price, default 10000, at least 1000; `--token`; new `--side buy|sell` and `--events placed gone`, both by default; `--side ''` and `--events ''` clear them on edit). Each check is one `wallet_orders` event whose `data.orders` lists every order with the check's totals, 200 orders an event (`part` of `parts`); the full list is kept 1 hour, then the event carries the totals only (`data.orders_removed: true`). `alerts events` help says a page also ends at about 2 MB: page on with `--cursor` while `has_more` is true. README and the vike, vike-alerts-setup and vike-hl-trader-profile skills name the new type and the paging rule.
