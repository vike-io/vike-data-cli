---
name: vike-follow-the-money
description: Trace where the money of one wallet went - the biggest outflows by direction, the actual transfers, every node labelled, stopping at an exchange. Use when the user asks "where did the funds from 0x... go" / "follow the money" / "trace this exploit or scam wallet" / "did it reach an exchange" / "investigate this address".
allowed-tools: Bash(vike-data:*)
---

# vike-follow-the-money

Incident-style trace from one root wallet. About 10 credits. Per-tool details live in `vike-wallet-trace`; this is the order to run them in and the stop rules.

## Chain

```bash
ADDR=0xeae7380dd4cef6fbd1144f49e4d1e6964258a4f4
vike-data labels $ADDR --json          # 1  is the root itself an exchange, MM or contract?
vike-data wallet trace $ADDR --chain ethereum --depth 2 --width 5 --window 30d --min-usd 100000 --json   # 4 credits, ~10 s
vike-data wallet txs $ADDR --chain ethereum --direction out --min-usd 100000 --days 30 --limit 50 --json # 2  the real transfers
vike-data wallet batch <node addresses with an empty label> --chain ethereum --json                       # 2  label the rest
```

Chains: ethereum, bsc, base, hyperevm for the transfer tools; `labels` is Ethereum only.

## Reading the trace

- **Direction is in each edge's `out_usd` / `in_usd`, not in `from` / `to`**: `from` is the side expanded first. `out_usd` flowed `from -> to`, `in_usd` flowed `to -> from`. Live (Wintermute market maker, 7d, $1M floor): root -> `0x28c6...1d60` carries `out_usd` $1.035B over 260 transfers, while `0xf8191d...` -> root carries `in_usd` $294.5M. The graph is a two-way NEIGHBOURHOOD of top counterparties by volume, so to answer "where did it go" rank the root's edges by `out_usd` and follow only those; to answer "where did it come from" rank by `in_usd`.
- Nodes already carry `label` and `wallet_type`; `wallet batch` is for the empty ones (adds `risk_flag`, 30-day flow).
- **Stop** at a node with `wallet_type: cex` (the trail goes off-chain; report exchange and time), at a `dex` router (a swap, not a destination), after depth 3, or after about 10 wallets. Unlabelled, high-volume nodes at depth 1-2 are the leads.
- Only transfers priced at or above `--min-usd` count, and `usd: 0.0` rows are UNPRICED, not worthless (they are hidden by any `--min-usd`): an unpriced token never shows in the graph. Say so if the loss was in an obscure token.
- `max_depth_reached` below `--depth` = either nothing above the floor beyond that hop or the server's 300-expansion cap cut the graph; you cannot tell which.
- `wallet txs` gives what the graph cannot: `tx_hash`, `time`, `token_address`, `usd`, `block` for each transfer. Quote hashes, not just totals.

## Answer template

> Root `<0x...>` (`<label or unlabelled>`). In the last `<window>` it sent `$X` to `N` counterparties; the largest: `<0x...>` `$A` (`<label>`), `<0x...>` `$B`. Trail: `<root> -> <hop 1> -> <exchange>` (last transfer `<time>`, tx `<hash>`). Unlabelled endpoints: `<list>`. Evidence from on-chain transfers above `$floor`; nothing below it or unpriced is included.

## Anti-patterns

- Don't continue past a CEX or call a deposit address a person.
- Don't read `from` as the sender, and don't trace at `--min-usd` 0: dust edges bury the path.
- Don't promise a watch: alerts fire on ANY transfer of a token above a USD threshold and cannot follow one address.
- Don't present the trace as proof of intent or ownership.

## Pairs well with

- `vike-wallet-who-is` on each endpoint, `vike-wallets-related` to test whether two endpoints are one entity
- `vike-wallet-trace` (parameters), `vike-wallet-transactions` (filters)
