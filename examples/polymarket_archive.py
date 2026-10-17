# /// script
# requires-python = ">=3.10"
# dependencies = ["polars>=1.0", "requests>=2.31"]
# ///
"""Polymarket full-L2 order-book archive (CC BY 4.0) from Vike Data.

Steps 1-2 need no API key. Step 3 runs only when VIKE_API_KEY is set.

    uv run examples/polymarket_archive.py
    # or: pip install polars requests && python examples/polymarket_archive.py

Files land in ./vike-archive/. Download a file whole, then read it locally;
pointing a Parquet reader at the URL turns one file into thousands of
HTTP Range requests.
"""
import os
from pathlib import Path

import polars as pl
import requests

ARCHIVE = "https://data.vike.io/archive"
OUT = Path("vike-archive")


def download(url: str, dest: Path, headers: dict | None = None) -> Path:
    """Stream one whole file to disk (one request, never fully in memory)."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    with requests.get(url, headers=headers, stream=True, timeout=600) as r:
        r.raise_for_status()
        with open(dest, "wb") as f:
            for chunk in r.iter_content(chunk_size=1 << 20):
                f.write(chunk)
    return dest


# 1. The manifest: every UTC day with per-stream byte sizes and row counts. No key.
manifest = requests.get(f"{ARCHIVE}/manifest.json", timeout=60).json()
days = sorted(manifest["dates"], key=lambda d: d["date"])
newest = days[-1]
print(f"layout:  {manifest['partitioning']}")
print(f"license: {manifest['license']['name']}")
print(f"days:    {days[0]['date']} .. {newest['date']} ({len(days)} partitions)")
for stream, s in newest["streams"].items():
    print(f"  {newest['date']} {stream:<12} {s['bytes'] / 1e6:>10,.1f} MB  rows={s['rows']}")

# 2. The free sample: one complete 5-minute crypto up/down market, both
#    outcome tokens, open through resolution. Regenerated daily. No key.
for name in ("trades", "l1_quotes"):
    path = download(f"{ARCHIVE}/samples/{name}.parquet", OUT / "samples" / f"{name}.parquet")
    df = pl.read_parquet(path)
    print(f"\nsample {name}: {df.height:,} rows, columns {df.columns}")
    print(df.head(3))

trades = pl.read_parquet(OUT / "samples" / "trades.parquet")
print("\nsample trades per outcome token:")
print(
    trades.group_by("token_id")
    .agg(
        pl.len().alias("trades"),
        pl.col("size").sum().alias("shares"),
        ((pl.col("price") * pl.col("size")).sum() / pl.col("size").sum()).alias("vwap"),
    )
)

# 3. A full day of the whole Polymarket universe. Needs a free key from
#    https://vike.io/account?tab=api-keys (archive downloads do not count
#    against the hourly request limit).
key = os.environ.get("VIKE_API_KEY")
if not key:
    print("\nSet VIKE_API_KEY to download a full day; skipping step 3.")
    raise SystemExit(0)

day, stream = newest["date"], "trades"  # trades is the smallest stream; book_events is GBs
url = f"{ARCHIVE}/venue=polymarket/date={day}/{stream}.parquet"
# One file name per date: every partition's last path segment is the same.
path = download(url, OUT / f"polymarket-{stream}-{day}.parquet", headers={"X-API-Key": key})

expected = newest["streams"][stream]["bytes"]
if path.stat().st_size != expected:
    raise SystemExit(f"{path}: {path.stat().st_size} bytes, manifest says {expected}; re-download")

day_df = pl.read_parquet(path)
print(f"\n{day} {stream}: {day_df.height:,} rows across {day_df['condition_id'].n_unique():,} markets")
print(day_df.group_by("condition_id").len().sort("len", descending=True).head(10))
