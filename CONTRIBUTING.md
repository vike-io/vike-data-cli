# Contributing

Thanks for the interest. This package is small on purpose — bugs and skill PRs both welcome.

## Setup

```bash
git clone https://github.com/vike-io/vike-cli
cd vike-cli
npm ci
npm test
```

## What to contribute

- **New skills** (`skills/vike-<name>/SKILL.md`) — playbooks composing existing commands. Highest-leverage contribution.
- **Bug fixes** in `src/`.
- **Better error messages** in `src/commands/` or `src/mcp-client.js`.
- **Improved formatters** in `src/format.js`.

## What to discuss first (open an issue)

- New commands (need a backend MCP tool to exist first).
- Major refactors of `src/`.
- Removing a flag or command.

## Workflow

1. Branch from `main`: `git checkout -b feature/<short-name>`.
2. Make the change. Add tests if it's logic.
3. `npm run lint` and `npm test` — both should pass.
4. Add a Changeset: `npx changeset` (pick patch/minor and describe what changed).
5. Open a PR against `main`. CI runs lint + test on Node 20 and 22.

## Code style

See [AGENTS.md](AGENTS.md) for the full conventions. Short version:

- ESM only, Node 20+
- Single quotes, semicolons, 2-space indent
- Native fetch / fs / path — don't add deps unless load-bearing
- Don't break existing flag names

## Reporting bugs

Include:
- `vike-data --version`
- Node version (`node --version`)
- The exact command you ran
- Full error message
- Output of `vike-data doctor`
