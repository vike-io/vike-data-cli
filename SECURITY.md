# Security policy

## Supported versions

Only the latest minor release receives security fixes. Older versions
should be considered unsupported.

| Version | Supported |
|---------|-----------|
| 0.6.x   | ✅         |
| < 0.6   | ❌         |

## Reporting a vulnerability

**Please do not open a public GitHub issue for security reports.**

Email: **security@vike.io**

What to include:
- Affected version (e.g. `@vike-io/cli@0.6.0`)
- Steps to reproduce
- Impact (what an attacker can do)
- Suggested fix if you have one

We aim to acknowledge within 48 hours and ship a fix within 7 days for
critical issues. For low/medium severity, ship within 30 days.

After a fix lands we will:
1. Publish a new patch version
2. Add a CHANGELOG entry under "Security"
3. Credit the reporter (unless they prefer to stay anonymous)

## Scope

In scope:
- `@vike-io/cli` itself (this repo)
- Skill playbooks under `skills/`
- The CLI's interaction with the MCP endpoint at `https://data.vike.io/mcp`

Out of scope:
- Bugs in user-installed third-party software the CLI invokes (npm, node)
- Issues in the user's environment (compromised laptop, leaked API key)
- Rate-limit bypasses on the public `/mcp` endpoint — these are enforced
  server-side and not within the CLI's purview

## Hardening already in place

- All file I/O uses hardcoded paths inside `~/.vike/` — no user input
  flows into file paths (no path traversal / arbitrary file read).
- Config file written with `chmod 0600`; config dir with `chmod 0700`.
- HTTP request bodies built with `JSON.stringify` (auto-escaping).
- API key sent as `X-API-KEY` header — never in URL, never logged.
- Webhook payloads signed with HMAC-SHA256; recipients verify in
  constant time and reject replays older than ~5 min.
- `npm audit` runs in CI; Dependabot opens weekly PRs for npm + GH Actions.

## Past advisories

None to date.
