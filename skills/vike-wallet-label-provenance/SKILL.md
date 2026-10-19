---
name: vike-wallet-label-provenance
description: Multi-source label cascade for any ETH wallet — shows what every upstream label provider AND our in-house heuristic classifier says about an address, with consensus entity/type and per-source attribution. Use when the user asks "who is this address" / "what do you know about this wallet" / "is this address labeled".
allowed-tools: Bash(vike-data:*)
---

# vike-wallet-label-provenance

The headline differentiator: we don't just show a label, we show **which sources agree** and how confident the consensus is.

## Command

```bash
vike-data labels <address> [--json]
```

## Example

```bash
vike-data labels 0x28C6c06298d514Db089934071355E5743bf21d60     # Binance Hot Wallet 14
```

## Output shape

```json
{
  "address": "0x...",
  "found": true,
  "consensus": {
    "entity": "Binance",
    "wallet_type": "cex",
    "cex_product": "spot",
    "user_subtype": "",
    "risk_flag": "",
    "confidence": "High"
  },
  "sources": [
    { "source": "provider_a", "label": "Binance 14",        "entity": "Binance", "category": "CEX" },
    { "source": "provider_b", "label": "Binance Hot Wallet" },
    { "source": "provider_c", "label": "Binance: Hot Wallet 14" },
    { "source": "provider_d", "label": "Binance" },
    { "source": "heuristic:cold_t1", "confidence": 0.94 }
  ],
  "source_count": 5
}
```

## Reading

- **5+ sources agree** → very high confidence; ship the label without caveats
- **2-3 sources agree on same entity** → high confidence
- **Only 1 source + heuristic** → moderate; mention "labeled by X"
- **0 sources, only heuristic** → low; mention "predicted by heuristic"
- **0 sources, no heuristic** → genuinely unknown wallet (most retail addresses)

## Anti-patterns

- Don't quote any single provider's category field as "the category" — provider taxonomies vary; the `consensus.wallet_type` is the unified field.
- A `risk_flag` of `scam` / `sanctioned` / `phishing` is high-stakes — always mention it explicitly, never bury it.

## Pairs well with

- `vike-data wallet summary <addr>` — for the flow metrics of the labeled wallet
