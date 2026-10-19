---
name: vike-token-holder-diligence
description: Due diligence on who sits at the top of a token - how much of the top-50 net inflow is exchanges, contracts, labelled users, unlabelled wallets or fresh wallets, and which holders carry a risk flag. Use when the user asks "is this token held by real wallets" / "are the top holders of X exchanges or contracts" / "holder quality of X" / "any fresh or flagged wallets among X holders".
allowed-tools: Bash(vike-data:*)
---

# vike-token-holder-diligence

Classify the top 50 wallets of one token by what they are. It measures net INFLOW over recorded transfer history, never balances or share of supply. About 4 credits.

## Chain

```bash
vike-data token search ENA --chain ethereum --limit 3 --json                  # 0 credits; take the canonical address
vike-data token holders 0x57e114b691db790c35207b2e685d4a43181e6061 --chain ethereum --limit 50 --json   # 2 credits, SLOW
vike-data wallet batch <the 50 wallets> --chain ethereum --json               # 2 credits, one call (max 100)
vike-data token transfers <addr> --tab sold --period 7d --chain ethereum --json   # 2: are the big holders selling now?
```

`token holders` scans the whole chain for the token: ENA on ethereum took about 26 s at `--limit 50`; the busiest tokens on `base` take about a minute. Use a small token to test, and run it once. `token search` returns addresses without the `0x` prefix on every chain; every other command accepts either form, but show `0x...` to the user. On `--chain hyperevm` the search registry holds about 50 tokens, so no match may only mean it is not in it.

## Reading

Holder rows: `wallet`, `net_flow_usd`, `volume_usd`, `tx_count`, `first_seen`, `last_active`, `entity`, `wallet_type` (`user`, `system`, or empty when unlabelled). `wallet batch` adds `confidence` and `risk_flag`.

Group the 50 rows and sum `net_flow_usd` per group:

| Group | Rule | Meaning |
|---|---|---|
| Exchange / custody | `wallet_type = cex` | aggregates many retail holders |
| Contract / system | `dex`, `system` or any other non-`user` type | pools, routers, vaults: not a holder opinion |
| Labelled users | `user` with an `entity` | a named person or fund |
| Unlabelled | empty | unknown, say so |
| Fresh | `first_seen` within 7 days | new money; a launch-day cluster is a flag |
| Risk-flagged | non-empty `risk_flag` | quote the flag verbatim |

Also read: `tx_count` 1-2 with a large `net_flow_usd` = an airdrop or OTC receiver that may never have sold; `last_active` months old = dormant; a net inflow near `volume_usd` = bought and held, far below = churned most of it.

## Answer template

> Top 50 by net inflow: `X%` of the positive net inflow sits with exchanges/contracts, `Y%` with labelled users, `Z%` unlabelled; `N` wallets first seen in the last 7 days carry `W%`; `K` wallets are risk-flagged (`<flags>`). This is net inflow over recorded history, not a balance or a supply share, so it says who moved the most of this token, not who holds it today.

For what a specific wallet holds now: `vike-data wallet balances <addr> --chains <chain>` (3 credits, cap at 5 wallets).

## Anti-patterns

- Don't compute a "top-10 holds X% of supply" or a concentration index: no supply or balance is returned.
- Don't call a token a rug or safe from this alone. It is one signal.
- Don't count the exchange group as "retail": it is custody for many holders.

## Pairs well with

- `vike-token-transfers` for who is buying or selling now, `vike-wallet-who-is` on any single holder
- `vike-wallets-related` when several unlabelled top holders look like one cluster
