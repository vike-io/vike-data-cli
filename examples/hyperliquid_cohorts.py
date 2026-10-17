# /// script
# requires-python = ">=3.10"
# dependencies = ["polars>=1.0", "requests>=2.31"]
# ///
"""Hyperliquid long vs short by wallet cohort, hourly, from the free Vike Data API.

Needs a free key from https://vike.io/account?tab=api-keys:

    export VIKE_API_KEY=vk_...
    uv run examples/hyperliquid_cohorts.py
    # or: pip install polars requests && python examples/hyperliquid_cohorts.py

axis=size buckets wallets by account value (shrimp .. 4x whale) and is always
point-in-time, so it is safe for backtests. Other axes: tier, pnl, pnl_abs;
hours can go up to 8,760 (a year) in one request. Reference:
https://vike.io/data/hl-cohorts
"""
import os

import polars as pl
import requests

URL = "https://data.vike.io/v1/hyperliquid/coins/BTC/cohort-metrics"
key = os.environ.get("VIKE_API_KEY")
if not key:
    raise SystemExit("Set VIKE_API_KEY (free key: https://vike.io/account?tab=api-keys)")

r = requests.get(
    URL,
    params={"axis": "size", "hours": 24},
    headers={"X-API-KEY": key},
    timeout=60,
)
r.raise_for_status()
payload = r.json()

# One row per (hour, cohort); every cohort of an hour is in the same page.
df = pl.DataFrame(payload["metrics"]).with_columns(
    pl.col("ts").str.to_datetime(time_zone="UTC")
)
print(f"axis={payload['axis']} label_basis={payload['label_basis']} rows={df.height}")
if payload.get("freshness"):
    print("freshness:", payload["freshness"])

latest = df.filter(pl.col("ts") == pl.col("ts").max())
print(f"\nBTC positioning by account size at {latest['ts'][0]}:")
print(
    latest.select(
        "cohort",
        "position_count",
        (pl.col("total_position_value") / 1e6).round(1).alias("value_musd"),
        (pl.col("total_position_value_long") / pl.col("total_position_value")).round(3).alias("long_share"),
        pl.col("bias").round(3),  # (long - short) / (long + short), by notional
    ).sort("value_musd", descending=True)
)

# Bias per cohort per hour: columns are cohorts, rows are hours.
print("\nBias by hour (rows) and cohort (columns):")
print(df.pivot(on="cohort", index="ts", values="bias").sort("ts"))
