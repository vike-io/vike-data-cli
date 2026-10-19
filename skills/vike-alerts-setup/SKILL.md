---
name: vike-alerts-setup
description: Create, list, edit, and delete on-chain transfer alerts. Alerts fire when a token transfer crosses USD thresholds you set and deliver to email or Discord. Use when the user asks "alert me when X" / "watch for big transfers" / "notify on whale moves".
allowed-tools: Bash(vike-data:*)
---

# vike-alerts-setup

## Pre-check: what channels does the user have set up?

```bash
vike-data alerts channels --json
```

Returns enabled email + Discord channels. **If a user creates an alert with a channel they haven't verified, the alert is saved but won't fire notifications.** Always check first.

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

Required: `--label`. Common: `--token`, `--chain eth|bsc`, `--min-usd`, `--channel email|discord` (can repeat).

### Edit (partial update — only fields you pass are changed)

```bash
vike-data alerts edit 42 --min-usd 5000000          # raise threshold
vike-data alerts edit 42 --active false             # pause
vike-data alerts edit 42 --channel email --channel discord  # add second channel
```

### Delete

```bash
vike-data alerts delete 42                          # soft-delete (pauses, keeps history)
vike-data alerts delete 42 --hard                   # permanently remove
```

## Notes + gotchas

- Currently chains supported: **eth** and **bsc** only. For both, create two alerts.
- Thresholds are in **USD value** of the transfer at fire time, not token quantity.
- `--cooldown` is per-alert minimum gap between triggers (default 60 min). Useful to avoid spam during high-volume hours.
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
