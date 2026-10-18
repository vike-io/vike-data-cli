---
name: vike-wallet-balances
description: Current ERC-20 token balances for a wallet across major EVM chains (eth, bsc, base, arbitrum, polygon, optimism). Dust filtered. Use when the user asks "what does this wallet hold" / "current portfolio of X" / "show top holdings".
allowed-tools: Bash(vike:*)
---

# vike-wallet-balances

## Command

```bash
vike-data wallet balances <address>
  [--chains eth,bsc,base,arbitrum,polygon,optimism]  (default = all 6)
  [--min-usd 1]   (filter dust below this)
  [--json]
```

## Example

```bash
vike-data wallet balances 0xd8da6bf26964af9d7eed9e03e53415d37aa96045 --chains eth,arbitrum
```

## Output

```json
{
  "address": "0x...",
  "total_usd": 123456.78,
  "chains_scanned": ["eth", "bsc", "base", "arbitrum", "polygon", "optimism"],
  "holdings": [
    { "chain": "eth", "symbol": "WETH", "name": "Wrapped Ether", "address": "0xc02a...", "balance": "12.34", "usd_value": 26345.67, "usd_price": 2134.94 },
    { "chain": "arbitrum", "symbol": "USDC", "address": "0xaf88...", "balance": "5000.00", "usd_value": 5000.00, "usd_price": 1.0 },
    ...
  ]
}
```

Holdings sorted by `usd_value` descending.

## Reading

- `total_usd` = sum across all chains scanned. Wallet might still hold value on chains not scanned (e.g. zkSync, Linea) — say so when relevant.
- Stablecoin-heavy wallet → likely waiting for a buy / parked dry powder
- WETH/WBTC + LSTs (stETH, wstETH, rETH) → "saver" wallet, low-risk
- 50+ random tokens → airdrop farmer
- Empty `holdings` array → either no balance OR the address hasn't been indexed yet (very new wallets)

## Anti-patterns

- This is ERC-20 only — does NOT include native ETH/BNB/MATIC (would need separate calls; not in our current tool surface). Mention this when reporting "total holdings".
- For wallets with 100+ tokens, the response is large — use `--min-usd 100` or higher to focus on meaningful holdings.

## Pairs well with

- `vike-data wallet pnl-history <addr>` — how the wallet got to its current state
- `vike-data labels <addr>` — institutional context
- `vike-data wallet ens <addr>` — friendly identifier
