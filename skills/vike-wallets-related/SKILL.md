---
name: vike-wallets-related
description: Gather evidence on whether two wallets, or a wallet and its possible siblings, belong to the same entity - labels, shared counterparties and tokens with exchanges and routers removed, direct links, a depth-2 trace - with confidence tiers. Use when the user asks "are these wallets the same person" / "find wallets related to 0x..." / "is this a sybil cluster" / "does B belong to A".
allowed-tools: Bash(vike-data:*)
---

# vike-wallets-related

Evidence, never proof: no tool exposes a first funder, a deposit-address owner or a cluster id. Cap the cluster at 10 wallets and ask before widening. About 15-25 credits.

## Chain

```bash
vike-data labels $A --json                                   # 1  A and B: same entity already?
vike-data labels $B --json
vike-data wallet counterparties $A --window 90d --limit 50 --json    # 2  (siblings mode: A only)
vike-data wallet compare $A $B --window 90d --limit 50 --json        # 3, up to ~20 s on busy wallets
vike-data wallet batch <shared counterparties> --json                # 2  label them, drop exchanges and routers
vike-data wallet trace $A --depth 2 --width 10 --window 90d --min-usd 1000 --json   # 4  is B in A's neighbourhood?
```

Add `--chain bsc|base|hyperevm` to every wallet command when the wallets live there; `labels` is Ethereum only, so on other chains use `wallet batch --chain`.

## Siblings mode (only A is known)

`wallet counterparties $A --window 90d --limit 50`, label them with `wallet batch`, drop `cex`, `dex`, `market_maker` and contract rows, keep the highest-volume unlabelled or `user` wallets, then `wallet compare $A <candidate>` for the top 3-5 and `wallet trace` once. Stop at 10 wallets.

## Reading

`compare` returns `shared_counterparties` (`wallet`, `a_volume_usd`, `b_volume_usd`, `entity`, `wallet_type`) and `shared_tokens` (`token_address`, volumes, tx counts). The big shared rows are almost always an exchange, a router or USDT/USDC/the native coin: in a live Wintermute-to-Wintermute pair the three top shared counterparties were Binance, another Wintermute wallet and Coinbase, the three shared tokens ETH, USDT and USDC. **Remove CEX, router and stablecoin overlap before counting anything.** Direct links: B appearing as a node of A's trace (an edge with `out_usd` or `in_usd` > 0 between them) is stronger than any overlap.

| Tier | Evidence |
|---|---|
| High | the same entity in `labels` / `batch` for both; or a direct transfer between them AND a shared non-CEX counterparty |
| Medium | several shared non-exchange counterparties AND shared niche tokens (not stablecoins/ETH), or one direct link of size |
| Low / none | overlap only through exchanges, routers, stablecoins; matching ENS style; funding from the same CEX |

State the tier and the list of what was removed.

## Anti-patterns

- Don't claim "same person" from a shared CEX hot wallet: everyone who uses that exchange shares it.
- Don't trace through exchanges or past 10 wallets; don't trace at `--min-usd 0`.
- Don't treat an empty Base or HyperEVM answer as "unrelated" without checking the chain actually has the wallets' activity.

## Pairs well with

- `vike-wallet-who-is`, `vike-wallet-compare`, `vike-wallet-counterparties`, `vike-wallet-trace`, `vike-wallet-batch`
