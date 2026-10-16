# AGENTS.md

Repo conventions for AI coding agents working on `vike-cli`.

## Stack

- **Runtime:** Node.js 20+ (ESM only — `"type": "module"` in package.json)
- **CLI parser:** [commander](https://github.com/tj/commander.js) v12+
- **HTTP:** native `fetch` (Node 18+)
- **Testing:** [vitest](https://vitest.dev)
- **Linting:** [ESLint flat config](https://eslint.org/docs/latest/use/configure/configuration-files)
- **Versioning:** [Changesets](https://github.com/changesets/changesets)

## Layout

```
src/
  index.js              # CLI entry, registers commands
  auth.js               # ~/.vike/config.json + VIKE_API_KEY env
  mcp-client.js         # JSON-RPC 2.0 client for https://vike.io/mcp
  format.js             # table/JSON output
  util.js               # small helpers (version read, type coerce)
  commands/             # one file per command group
    auth.js             # login/logout/whoami
    token.js            # token search|transfers|screener|holders
    wallet.js           # wallet summary|discover
    perp.js             # perp funding|spreads|top-traders
    options.js          # options flow
    alerts.js           # alerts CRUD + channels
    init.js             # interactive setup
    doctor.js           # diagnostics
    schema.js           # MCP tools/list dump
scripts/
  postinstall.js        # friendly install hint
skills/
  vike-<name>/SKILL.md  # markdown playbooks for AI agents
```

## When adding a new command

1. Pick or create the right file under `src/commands/`. Group by domain.
2. Use `callTool('<mcp_tool_name>', { ... })` from `mcp-client.js`. Don't write a fresh HTTP client.
3. Wrap user-input arrays/strings — the MCP server already does defensive coercion, but the CLI should be readable.
4. Add `--json` flag (use `emit(result, opts)` from `format.js`). Pipe detection is automatic.
5. Add a `SKILL.md` under `skills/vike-<command>/` describing when to use it. Follow the existing structure: frontmatter → command → examples → reading tips → anti-patterns → pairs-well-with.
6. Add a Changeset: `npx changeset` → pick `patch` or `minor` → describe the change.

## Coding rules

- **ESM only.** `import` / `export`. No `require`.
- **No transpiler.** Source ships as-is to npm — that's why we target Node 20+.
- **Minimum deps.** Default to native fetch / fs / path / os. Only add a dep if it's load-bearing.
- **Errors:** throw from command handlers; `src/index.js` catches and exits 1.
- **Don't log to stdout from libraries** (only command handlers + `format.js` should write).

## Skill file conventions

Every `SKILL.md` has:

```yaml
---
name: vike-<topic-or-task>
description: One sentence ending with "Use when ..."
allowed-tools: Bash(vike:*)
---
```

Plus optional `metadata.openclaw` for the OpenClaw harness. Inside the body:
- Command synopsis
- 1-3 examples
- Reading tips (heuristics)
- Anti-patterns (what not to do)
- Pairs well with (cross-links to other skills)

Keep skills self-contained — agents should be able to act from a single SKILL.md without reading neighbors. Only cross-reference for context, not for required steps.

## Testing

- Unit tests for `util.js`, `format.js`, `auth.js` (no network).
- Integration tests should mock `fetch` — never hit `https://vike.io/mcp` from CI.
- For end-to-end smoke tests against the real endpoint, use `VIKE_LIVE_TEST=1` to opt-in (off by default).

## Don't

- Don't add backwards-compat shims for renamed flags. Bump major if you must rename.
- Don't store secrets anywhere except `~/.vike/config.json` (chmod 600) or the env.
- Don't add competitor names to source, skills, README, or comments. Lead with what we do, not what they don't.
