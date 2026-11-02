---
name: vike-alerts-setup
description: Create, list, edit, and delete alerts - on-chain transfer alerts (a token, one wallet, USD thresholds; eth, bsc, base, hyperevm) and Hyperliquid alerts (a wallet's fills, cohort fills, liquidations, cohort bias, liquidation proximity) - and read the events they produced. Delivered by email or an HTTPS webhook. Use when the user asks "alert me when X" / "watch for big transfers" / "notify on whale moves" / "tell me when this wallet trades".
allowed-tools: Bash(vike-data:*)
---

# vike-alerts-setup

## Pre-check: what channels does the user have set up?

```bash
vike-data alerts channels --json
```

Returns enabled email + webhook channels. **If a user creates an alert with a channel they haven't verified, the alert is saved but won't fire notifications.** Always check first. A Hyperliquid alert is delivered only by a webhook (`vike-alerts-webhook`), or read with `vike-data alerts events`.

## CRUD

### List

```bash
vike-data alerts list --json                    # active alerts
vike-data alerts list --include-inactive --json # also paused/deleted
```

### Create

```bash
vike-data alerts create \
  --label "Big USDC moves" \
  --token USDC \
  --chain eth \
  --min-usd 1000000 \
  --channel email \
  --cooldown 60
```

Required: `--label`. Transfer alerts: `--token`, `--chain eth|bsc|base|hyperevm` (default eth), `--min-usd`, `--max-usd`, `--address 0x...` with `--address-role any|from|to` to watch ONE wallet, `--channel email webhook`.

```bash
# One wallet: every transfer it receives on base (no cooldown, no daily cap)
vike-data alerts create --label "Treasury in" --chain base \
  --address 0x1111111111111111111111111111111111111111 --address-role to --channel email
```

Hyperliquid alerts (`--type`; leave out `--chain`, `--address`, `--max-usd`; delivered by `--channel webhook`, or with no channel read them with `vike-data alerts events`):

| `--type` | Fires on | Flags |
|---|---|---|
| `hl_wallet` | every fill of one wallet | `--wallet` (required), `--actions open close flip increase reduce`, `--token`, `--min-usd` |
| `hl_cohort_fill` | fills by wallets in cohorts | `--pnl-cohorts "3x smart" ...` and/or `--size-cohorts "4x whale" ...` (one required), `--min-usd` >= 10000 (required) |
| `hl_liquidation` | liquidations | optional `--wallet`, cohorts, `--token`, `--min-usd` |
| `hl_cohort_bias` | a cohort index crossing a level | `--token` and `--index smi\|wsi\|smart_bias\|whale_bias\|smi_wsi_gap` (required), `--threshold`, `--band`, `--direction up\|down\|both` |
| `hl_liq_proximity` | a wallet getting close to liquidation | `--wallet` (required), `--threshold` (0-1, default 0.8), `--band` |

```bash
vike-data alerts create --label "BTC smart money flips" --type hl_cohort_bias \
  --token BTC --index smi --threshold 0 --band 0.1 --channel webhook
```

### Edit (partial update — only fields you pass are changed)

```bash
vike-data alerts edit 42 --min-usd 5000000          # raise threshold
vike-data alerts edit 42 --active false             # pause
vike-data alerts edit 42 --channel email webhook    # both channels
vike-data alerts edit 42 --address ''               # drop the wallet condition
```

### Events (what fired, and each delivery's status, kept 15 days)

```bash
vike-data alerts events --limit 50 --json           # page on with --cursor <next_cursor>
vike-data alerts events --rule-id 42 --json
vike-data alerts resend <delivery_id>               # send one delivery again
```

### Delete

```bash
vike-data alerts delete 42                          # soft-delete (pauses, keeps history)
vike-data alerts delete 42 --hard                   # permanently remove
```

## Notes + gotchas

- Transfer chains: **eth**, **bsc**, **base**, **hyperevm**, one per alert. For several, create several alerts.
- **A transfer alert watches a token, one wallet, or both.** Without `--address` it fires on ANY transfer of that token on that chain whose USD value crosses the thresholds. With `--address` it fires on every transfer that wallet sent (`from`), received (`to`) or either (`any`); without `--min-usd` that includes dust and unpriced tokens. "Alert me when whale 0xABCD sells" is `--address 0xABCD --address-role from`; on Hyperliquid it is `--type hl_wallet --wallet 0xABCD --actions close reduce`. There are no price or funding alerts, and delivery is email or an HTTPS webhook (Discord is off; no Telegram).
- Thresholds are in **USD value** of the transfer at fire time, not token quantity.
- `--cooldown` is the minimum gap between notifications of a token-wide transfer alert (default 60 min). Address alerts and Hyperliquid alerts notify on every event and ignore it.
- Tokens are matched by symbol (UPPERCASE). For cross-chain symbols like `USDC` that exist on multiple chains, be explicit with `--chain`.
- Alerts created without a verified channel will be **silently inactive at fire time** — there is no automatic warning. Use `vike-data alerts channels` first.

## Confirmation flow with the user

Before creating an alert, summarize back what will be created:

> Creating alert "**Big USDC moves**": will fire when a USDC transfer on **eth** exceeds **$1M**, delivered via **email**, with a 60-minute cooldown. OK to proceed?

Wait for confirmation, then run `vike-data alerts create`.

## Anti-patterns

- Don't create more than 5 alerts in one batch without confirmation — users almost always over-set on the first try.
- Don't quote thresholds as token amounts ("alert when 1000 ETH moves"). The system thresholds on USD only.
- If `min-usd` is < 10000, warn the user — they'll get spammed.
