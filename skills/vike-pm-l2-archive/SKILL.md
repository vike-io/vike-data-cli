---
name: vike-pm-l2-archive
description: Find and fetch the free Polymarket L2 archive - daily Parquet files of the full order-book events, the trade tape and top-of-book quotes, whole or cut per market family such as BTC 5-minute up/down. Lists files with their sizes and gives the download URL; says when the API tape is enough instead. Use when the user asks "get me Polymarket order book history" / "BTC 5m up/down L2 data for last week" / "download the Polymarket trades for a day" / "data to backtest a Polymarket strategy".
allowed-tools: Bash(vike-data:*)
---

# vike-pm-l2-archive

The archive is one Parquet file per UTC day and stream, recorded since 2026-07-25, free under CC BY 4.0 (credit "Polymarket L2 archive (c) Vike (vike.io/data), CC BY 4.0"). `vike-data` lists files and resolves URLs; **it never downloads.** 1 credit per call.

## Chain

```bash
vike-data polymarket archive --view datasets --asset btc --tenor 5m --stream trades --date-from 2026-10-15 --date-to 2026-10-17 --json
vike-data polymarket archive --view url --stream trades --date 2026-10-16 --json                    # multi-asset file, one day
vike-data polymarket archive --view url --stream trades --asset btc --tenor 5m --date 2026-10-16 --json   # family file
```

Streams: `book_events` (full L2: snapshots, `price_change` deltas, trades, tick-size and status markers), `trades` (taker tape), `l1_quotes` (derived top of book). A row carries `date`, `stream`, `layout` (`flat` = every market, `family` = one asset and tenor), `bytes`, `rows`, `url`. `datasets` pages with `--limit` (max 200) and `--offset` against `total`.

## Pick the right file

- `asset` and `tenor` go together or not at all (`view=url` refuses one alone). Without them `datasets` mixes both layouts: filter on `layout`, or the same day appears twice.
- **Check `bytes` first.** Live sizes: one day of `trades` was 11.8 MB (922,798 rows); a BTC 5m family `trades` day 3-5 MB; one day of `book_events` was **8.5 GB (532 million rows)**. Tell the user before any `book_events` download, and prefer the family file for one asset.
- Under about 30 days, one token, or a few hours: use the API instead of a bulk file: `vike-data polymarket tape <token_id> --from-ms ... --to-ms ... --event-type trade` (max 24h a page, 1,000 events a page, no wallets) or `vike-data candles polymarket <token_id>`.

## Fetch (outside this skill's tool grant; hand the user the command)

```bash
curl -H "X-API-KEY: $VIKE_API_KEY" -C - -o trades-2026-10-16.parquet "<url from the row>"
```

Needs the free API key. Downloads are authenticated and metered separately from tool calls (they do not spend the 20,000 requests an hour). **Download the file whole and read the local copy** with DuckDB, polars or pyarrow: pointing a reader at the URL turns one file into thousands of range requests. The manifest and a small sample need no key: `https://data.vike.io/archive/manifest.json`, `https://data.vike.io/archive/samples/`.

## Reading the files

- The L2 tape carries no wallet addresses, only size and time. Prices are probabilities, sizes are shares.
- On the API tape (`polymarket tape`) a `0` in `best_bid`, `best_ask`, `price` or `size` on a row type that does not populate it means absent, not zero; check the schema in the manifest before assuming the same of a Parquet column.
- Join across files on the outcome token id, never on the condition id.

## Anti-patterns

- Don't promise a download from the CLI, don't paste the key into a command that gets logged, and don't fetch `book_events` days to answer a question the API tape can.
- Don't redistribute without the attribution above.

## Pairs well with

- `vike-pm-market-diligence` (ids and one market live), `vike-candles` (probability bars), `vike-polymarket-markets`
