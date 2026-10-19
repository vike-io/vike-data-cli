---
name: vike-wallet-trace
description: Counterparty graph traversal from a root wallet outward. At each hop, expand to the top N counterparties by USD volume. Use when the user asks "where did funds from X go" / "follow the money 3 hops out" / "trace the network around this wallet" / wallet investigation.
allowed-tools: Bash(vike:*)
---

# vike-wallet-trace

## Command

```bash
vike-data wallet trace <address>
  [--chain ethereum|bsc|base]
  [--depth N]    (1-5, default 2)
  [--width N]    (1-10, default 5)
  [--window 24h|7d|30d|90d|all]
  [--min-usd N]  (default 10000 — prunes noise)
  [--json]
```

## Output

```json
{
  "root": "0xabc...",
  "depth": 2, "width": 5, "window": "30d", "min_usd": 10000,
  "nodes": [
    { "address": "0xabc...", "depth": 0, "total_volume_usd": 0.0 },
    { "address": "0xdef...", "depth": 1, "total_volume_usd": 250000, "label": "Binance", "wallet_type": "cex" },
    { "address": "0x123...", "depth": 2, "total_volume_usd": 45000, "label": null, "wallet_type": null },
    ...
  ],
  "edges": [
    { "from": "0xabc...", "to": "0xdef...", "volume_usd": 200000, "tx_count": 4 },
    ...
  ],
  "stats": { "node_count": 23, "edge_count": 31, "max_depth_reached": 2 }
}
```

## Reading the graph

- **Root (depth 0)** = the wallet you traced from. `total_volume_usd` = 0 because it's where edges originate.
- **Depth 1** = direct counterparties. Most useful layer.
- **Depth 2-3** = "friend-of-friend" — useful for finding where funds end up.
- **Edge volume_usd** = the volume between those two specific addresses, NOT cumulative.
- **`wallet_type = "cex"`** at depth 1 = funds went to / came from an exchange. Often the END of the trail (anonymous from there).
- **Unlabeled wallet with high volume at depth 1-2** = potentially related wallet, investigate with `vike-data labels`.

## Parameter tuning

| Parameter | Effect | Use when |
|---|---|---|
| `--depth 1` | Direct counterparties only | "Who does X trade with" — same as `wallet counterparties` |
| `--depth 2` | One degree of separation | Default. Reveals immediate networks. |
| `--depth 3+` | Wider net | Investigation / OSINT. Returns much more data; graph gets noisy. |
| `--width 3` | Top 3 per hop | Cleaner, focused on biggest flows |
| `--width 10` | Top 10 per hop | Wider scan, more noise |
| `--min-usd 50000` | High-value flows only | Strip out dust/airdrops |

## Cost note

Tool credits = 4 per call (heavier than other graph-less tools). Graph explodes exponentially with depth — depth 3 + width 10 = up to 1000 nodes per scan. Use `--depth 2 --width 5` as default.

## Anti-patterns

- Don't trace through CEX deposits. Once funds enter Binance/Coinbase, the trail goes opaque (CEX internal accounting, not on-chain). Note CEX nodes and stop following.
- Don't depth-5 by default. Graph blows up; results become noise.
- Don't ignore `min_usd` — without it, dust transfers create false-positive edges.

## Visual graph (web UI)

When the user wants to *see* the network rather than read JSON, surface the URL:

```
https://vike.io/spot/wallet/<address>
```

Tell them to click the **Graph** tab. It renders the same trace data as a force-directed graph (nodes coloured by hop depth, sized by USD volume, animated directional particles on edges). Clicking any non-root node navigates to that wallet's graph. Use this in chat replies when the user says "show me", "visualize", or pastes a wallet address asking for an exploration view — JSON is for downstream pipelines, the URL is for humans.

## Pairs well with

- `vike-data labels <addr>` — identify any interesting node
- `vike-data wallet compare <addr_a> <addr_b>` — confirm relatedness once trace surfaces candidates
- `vike-data wallet transactions <addr>` — drill into specific transfers between two nodes
