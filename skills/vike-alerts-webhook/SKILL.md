---
name: vike-alerts-webhook
description: Register an HTTPS webhook as an alert delivery channel — get HMAC-signed POST notifications when alerts fire. Use when the user has a server / bot / Slack integration and wants programmatic alert delivery instead of email/Discord.
allowed-tools: Bash(vike:*)
---

# vike-alerts-webhook

## Registration

```bash
vike-data alerts register-webhook <https://your-server.com/vike-hook>
  [--secret <16+ char HMAC secret>]
  [--json]
```

The secret is **optional but strongly recommended** — without it we still POST, but the recipient has no way to verify it came from us.

## Example

```bash
# Generate a strong secret first
openssl rand -hex 32
# → 7f5c8b...  (paste below)

vike-data alerts register-webhook https://api.mycoolbot.com/vike-alert \
  --secret 7f5c8b... \
  --json
# → { "ok": true, "channel_id": 42, "url_preview": "https://api.myc...", "signed": true }
```

Then create an alert and reference the channel — webhooks fire alongside email/discord. (Currently the `alerts create` flow doesn't accept channel IDs directly; webhooks fire if they're the user's enabled channels.)

## What we POST to your URL

```http
POST /vike-hook HTTP/1.1
Content-Type: application/json
User-Agent: vike-alerts/1.0
X-Vike-Timestamp: 1716658923
X-Vike-Signature: t=1716658923,sig=a3f8b2c...

{"alert_id":42,"alert_label":"Big USDC moves","alert_type":"transfer","triggered_at":"2026-05-25T17:42:00+00:00","chain":"eth","token":"USDC","value_usd":1234567.89,"from_address":"0x...","to_address":"0x...","tx_hash":"0x..."}
```

## How to verify the signature (Python)

```python
import hmac, hashlib, time

def verify(secret, headers, body):
    sig_header = headers.get("X-Vike-Signature", "")
    parts = dict(p.split("=", 1) for p in sig_header.split(","))
    ts, sig = parts.get("t"), parts.get("sig")
    if not ts or not sig:
        return False
    # Reject replays older than 5 min
    if abs(time.time() - int(ts)) > 300:
        return False
    expected = hmac.new(
        secret.encode(), f"{ts}.{body.decode()}".encode(), hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, sig)
```

## Anti-patterns

- **Don't** skip the secret. Anyone who knows your webhook URL can spoof alerts without it.
- **Don't** trust the body without verifying the signature. The URL doesn't authenticate the sender; the HMAC does.
- **Don't** use HTTP (only HTTPS) in production — the body is sensitive.
- **Don't** respond slowly — we time out after 10s. If your handler does heavy work, queue it (push to a job queue, return 200 immediately).

## Security checklist for your handler

1. Verify the HMAC signature in constant time (`hmac.compare_digest`, not `==`)
2. Reject if `X-Vike-Timestamp` is more than ~5 min old (replay protection)
3. Return `200` quickly; queue work async
4. Log full body for unsigned-but-suspicious requests
5. Rotate the secret if you suspect compromise — re-register a new channel

## Pairs well with

- `vike-data alerts create` — create the alert that fires to your webhook
- `vike-data alerts list` / `vike-data alerts channels` — confirm registration
