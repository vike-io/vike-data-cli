# /// script
# requires-python = ">=3.10"
# dependencies = ["duckdb>=1.0", "requests>=2.31"]
# ///
"""Query downloaded Polymarket archive Parquet files with DuckDB.

    uv run examples/duckdb_archive.py                      # free sample, no key
    uv run examples/duckdb_archive.py TRADES [L1_QUOTES]   # your own files or globs, e.g.
    uv run examples/duckdb_archive.py 'vike-archive/polymarket-trades-*.parquet'

With no arguments it fetches the free sample (one full 5-minute crypto up/down
market) into ./vike-archive/samples/. Full days come from polymarket_archive.py
or curl. Always query LOCAL files: DuckDB's httpfs pointed at an archive URL
issues thousands of HTTP Range requests per file.
"""
import sys
from pathlib import Path

import duckdb
import requests

SAMPLES = "https://data.vike.io/archive/samples"
OUT = Path("vike-archive") / "samples"


def sample(name: str) -> str:
    path = OUT / f"{name}.parquet"
    if not path.exists():
        OUT.mkdir(parents=True, exist_ok=True)
        r = requests.get(f"{SAMPLES}/{name}.parquet", timeout=300)
        r.raise_for_status()
        path.write_bytes(r.content)
    return str(path)


trades_path = sys.argv[1] if len(sys.argv) > 1 else sample("trades")
quotes_path = sys.argv[2] if len(sys.argv) > 2 else (None if len(sys.argv) > 1 else sample("l1_quotes"))

con = duckdb.connect()
con.read_parquet(trades_path).create_view("trades")

print("Trades per outcome token (ts is epoch milliseconds, UTC):")
con.sql("""
    SELECT left(token_id, 12) || '...'               AS token,
           any_value(condition_id)                   AS condition_id,
           count(*)                                  AS trades,
           round(sum(size), 2)                       AS shares,
           round(sum(price * size) / sum(size), 4)   AS vwap,
           epoch_ms(min(ts))                         AS first_trade,
           epoch_ms(max(ts))                         AS last_trade
    FROM trades
    GROUP BY token_id
    ORDER BY trades DESC
    LIMIT 20
""").show()

if quotes_path:
    con.read_parquet(quotes_path).create_view("l1")
    print("Top of book per minute for the most-quoted token (simple averages over L1 updates):")
    con.sql("""
        WITH busiest AS (
            SELECT token_id FROM l1 GROUP BY token_id ORDER BY count(*) DESC LIMIT 1
        )
        SELECT time_bucket(INTERVAL 1 minute, epoch_ms(ts)) AS minute,
               round(avg((bid + ask) / 2), 4)              AS mid,
               round(avg(ask - bid), 4)                    AS avg_spread,
               count(*)                                    AS l1_updates
        FROM l1
        WHERE token_id = (SELECT token_id FROM busiest)
          AND bid > 0 AND ask > 0
        GROUP BY minute
        ORDER BY minute
    """).show()
