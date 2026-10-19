---
name: vike-wallet-batch
description: Bulk label + 30d summary lookup for up to 100 addresses in one call. Use when the user pastes a CSV of addresses, asks "enrich this list with labels", or wants to quickly screen many wallets for entity / risk / activity.
allowed-tools: Bash(vike:*)
---

# vike-wallet-batch

## Command

```bash
vike-data wallet batch <addr1> <addr2> <addr3> ...
  [--chain ethereum|bsc|base]
  [--json]
```

Caps at 100 addresses per call. For larger lists, split into chunks.

## Example

```bash
vike-data wallet batch 0xd8da... 0xabc... 0xdef... --json
```

## Output

One row per INPUT address (preserves input order — useful when joining back to a source CSV):

```json
[
  { "wallet": "0xd8da...", "entity": null,       "wallet_type": "user", "confidence": "Medium", "risk_flag": null,    "net_30d_usd": 12000, "volume_30d_usd": 50000, "tx_30d": 42, "tokens_30d_count": 8, "found": true },
  { "wallet": "0xabc...",  "entity": "Binance",  "wallet_type": "cex",  "confidence": "High",   "risk_flag": null,    "net_30d_usd": -5e9,  "volume_30d_usd": 9e9,   "tx_30d": 2000, "tokens_30d_count": 80, "found": true },
  { "wallet": "0xdef...",  "entity": null,       "wallet_type": null,   "confidence": null,     "risk_flag": null,    "net_30d_usd": 0,     "volume_30d_usd": 0,     "tx_30d": 0,    "tokens_30d_count": 0,  "found": false }
]
```

`found: false` = address has no labels AND no 30d activity in our DB (might be brand-new wallet or one we haven't indexed).

## Reading

- Filter to `wallet_type = "user"` to find real-people addresses worth investigating further
- Any `risk_flag != null` → flag prominently in any user-facing report
- High `volume_30d_usd` but `tx_30d = 0` shouldn't happen — if it does, indicates stale aggregate; recompute
- `entity = "Binance"` + `wallet_type = "cex"` rows in a "smart money" list = false positives (CEX deposits aren't traders)

## Anti-patterns

- Don't run individual `vike-data wallet summary` in a loop for >5 addresses — this batch is ~20× faster
- Don't pass mixed-case addresses inconsistently — they're normalised but cleaner CSVs help readers
- Don't expect lifetime data — this is 30d window. For lifetime use the individual `wallet summary`

## Pairs well with

- `vike-data labels <addr>` — drill into any address showing high-confidence labels
- `vike-data wallet compare <a> <b>` — pick two interesting batch results and diff them
