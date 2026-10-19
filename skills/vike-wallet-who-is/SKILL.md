---
name: vike-wallet-who-is
description: Say who is behind one EVM address from its label sources, ENS name, the chain it is active on and its biggest counterparties. Tells an exchange, fund, market maker or contract from an ordinary user, and which exchange a wallet uses. Use when the user asks "who is 0x..." / "whose wallet is this" / "is this an exchange or a fund" / "which exchange does this wallet use" / "what kind of wallet is this".
allowed-tools: Bash(vike-data:*)
---

# vike-wallet-who-is

Identity playbook for ONE address: labels, ENS, the chain that matters, who it moves money with. About 8 credits. For holdings and a flow snapshot use `vike-wallet-portfolio`.

## Chain

```bash
ADDR=0x28C6c06298d514Db089934071355E5743bf21d60
vike-data labels $ADDR --json                    # 1 credit  sources + consensus (Ethereum addresses only)
vike-data wallet ens $ADDR --json                # 1         reverse ENS, Ethereum names only; "ens" can be null
vike-data wallet summary $ADDR --json            # 2         READ its `chain` field before anything else
vike-data wallet counterparties $ADDR --chain <summary.chain> --window 90d --limit 20 --json   # 2
vike-data wallet batch <counterparties with an empty entity> --chain <summary.chain> --json    # 2, max 100 addresses
```

## Reading each step

- **`labels`**: `found: false` = not in our label table; it is not proof the wallet is an ordinary user. Otherwise read `consensus` (`entity`, `wallet_type`, `confidence`, `risk_flag`) AND `sources[]`: `source_count` sources, each `label` / `entity` / `category`, with the providers anonymised (`provider_a`...). When sources disagree the consensus type can be wrong: for `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045` the entity is "vitalik buterin" but `wallet_type` reads `dex` because one source says "sushiswap". Report the entity from the agreeing sources, not the type.
- **`summary.chain`** is the more recently active of ethereum and bsc, never a sum; base or hyperevm only for a wallet with no priced ethereum/bsc volume, or when you pass `--chain`. If the figures look tiny next to what the user expects, run `vike-data wallet balances $ADDR` (holdings carry their own `chain`) and repeat summary and counterparties with `--chain` for the chain that holds the value.
- **`counterparties`** rows already carry `entity` and `wallet_type` (empty string when unlabelled); only the empty ones need `wallet batch`, which adds `confidence`, `risk_flag` and 30-day flow. `labels` is Ethereum only; `wallet batch --chain base|bsc|hyperevm` reads that chain's own label table (`hyperevm` has only a few hundred labelled wallets).
- **Top counterparty is a CEX** (`wallet_type: cex`) = the wallet deposits to or withdraws from that exchange (custodian). `received_usd` far above `sent_usd` from it = withdrawals, a funding source. That is evidence of use, never of ownership.
- **The wallet itself is `cex`**: it is the exchange's own wallet, not a person. Live example above (Binance): top counterparties are `wintermute` (market_maker, $6.96B in 30d), more `binance` wallets and `bitmex`.
- `wallet_type: dex` on a counterparty is a router or pool contract. Many of them = an active trader, not a relationship.

## Answer template

> `<ENS or 0x...>` is `<entity>` (`<wallet_type>`, confidence `<c>`, `<source_count>` sources agree). Active on `<chain>`; 90d volume `$X`, last active `<date>`. It mostly deals with `<top labelled counterparties>`; the largest unlabelled counterparty is `<0x...>` ($V). `<Not labelled: say so.>`

## Anti-patterns

- Don't name a real-world person from a label, and don't claim two wallets share an owner: that is `vike-wallets-related`, and it is evidence, not proof.
- Don't read `summary` as the wallet's whole activity: it is one chain.
- Don't call a wallet "clean" because `risk_flag` is empty or `found` is false.
- Name to address is not supported: ENS works from the address to the name only.

## Pairs well with

- `vike-wallet-label-provenance` for the raw per-source labels, `vike-wallet-portfolio` for holdings
- `vike-follow-the-money` to see where its money went, `vike-wallets-related` to test a link between two addresses
