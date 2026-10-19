---
name: vike-hl-top-traders
description: Rank top Hyperliquid perp traders by PnL / ROI / win rate / volume / trade count / drawdown across a window. Use when the user asks "top HL traders" / "best Hyperliquid wallets" / "HL leaderboard".
allowed-tools: Bash(vike-data:*)
---

# vike-hl-top-traders

## Command

```bash
vike-data perp top-traders
  [--window 1d|7d|30d|all]
  [--sort pnl|roi|win_rate|volume|trade_count|drawdown]
  [--order asc|desc]
  [--min-trades N]      # default 3
  [--min-win-rate P]    # 0-100 percent
  [--min-volume USD]
  [--size N]            # max 20
  [--json]
```

## Common queries

| Question | Flags |
|---|---|
| "Top HL traders this week" | `--window 7d --sort pnl` |
| "Best ROI traders last 30d w/ >=10 trades" | `--sort roi --min-trades 10` |
| "Sharpshooters: win rate >75% min $1M vol" | `--sort win_rate --min-win-rate 75 --min-volume 1000000` |
| "Most active traders today" | `--window 1d --sort trade_count` |
| "Smallest drawdown winners" | `--sort drawdown --order asc --min-trades 20` |

## Output columns

`address`, `pnl_usd`, `roi_pct`, `win_rate_pct`, `volume_usd`, `trade_count`, `max_drawdown_usd`.

## Reading

- `roi_pct` here is **realized + unrealized** (uses live position marks).
- A wallet with 90% win rate on 4 trades is statistical noise. Min trades 10–20 for any "skill" claim.
- Top by PnL ≠ top by ROI. Whales win big in $ but small in % terms; ROI sort surfaces smaller-account discretionary skill.
- `max_drawdown_usd` is peak-to-trough realized — does NOT include unrealized intra-position drawdown.

## Anti-patterns

- Don't claim a wallet is "the best HL trader" from a 1d window. Anything < 30d is short-term.
- The leaderboard rewards survivors — wallets that blew up don't appear, so PnL distribution is right-skewed survivorship bias.

## Pairs well with

- `vike-hl-trader-profile` to drill into a specific address from the leaderboard
- `vike-perp-funding-arb` to see if leaders are positioned against funding
