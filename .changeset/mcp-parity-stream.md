---
'@vike-io/cli': minor
---

Every MCP tool is reachable, and the event streams are too.

- `vike-data call <tool> --args '{json}'` (or `--args-file`, `--timeout`) calls any MCP tool by name and prints its raw result, so integers above 2^53 stay exact.
- A tool that refuses its input now exits 1 in every output mode; before, `--json` and piped output exited 0 with `{"error": ...}` on stdout.
- `vike-data stream <hl|hl-cohorts|onchain|polymarket> --channel ... [--filter key=value] [--cursor c]` reads `wss://stream.vike.io/v1/stream/<path>`: the key goes in the `X-API-KEY` header, every ping is answered, `event` and `gap` frames print as NDJSON, and after any drop it reconnects from the last cursor of each subscription. It exits 1, without reconnecting, on `replaced (4410)` (another program took the key's connection), on `HTTP 401` / `4401`, and on a refused subscription. New dependency: `ws`.
- `vike-data hl`: `cohort-metrics`, `segments`, `wallet`, `wallet-activity`, `leaderboard`, `liquidations`, `market`, `builders`, `vaults`, `vault`, each with `--view`.
- `vike-data polymarket`: `market-trades`, `tape`, `orderbook`, `market-stats`, `settlement`, `settlements`, `archive`, `leaderboard`. `vike-data wallet`: `first-funder`, `exchange-usage`.
- `vike-data alerts`: `events`, `resend`, `rotate-secret`, `test-webhook`; `create` and `edit` take `--type` (transfer and the five Hyperliquid types), `--address` / `--address-role`, `--wallet`, `--actions`, `--pnl-cohorts`, `--size-cohorts`, `--index`, `--threshold`, `--band`, `--direction`. `--chain` takes eth, bsc, base or hyperevm and no longer defaults to eth on the client (a Hyperliquid alert refuses a chain; the server still defaults a transfer alert to eth). Discord is gone from `--channel`: the server refuses it.
- `vike-data whoami` is registered. `doctor` checks Node >= 22.12.0, the `engines` floor. The User-Agent carries the installed version (it said `vike-cli/dev` outside `npm run`) and is sent on `tools/list` and `initialize` too. The `sync-schema` npm script, whose file never existed, is gone.
- Skills: a new `vike-stream` skill (32 in all); the umbrella routes the new commands, streams and `call`, and no longer tells agents to deny WebSockets, per-address alerts or a per-wallet Hyperliquid tool; the alert skills cover the Hyperliquid types, address alerts, four chains and no Discord; the webhook check accepts either signature during a secret rotation.
