---
'@vike-io/cli': patch
---

`hl market --view funding_rates`: every perp's latest funding rate, or with `--symbol` one perp's hourly history, HIP-3 markets such as `xyz:CL` included. The view is now listed in the help, `--order desc|asc` is new, and `--sort` takes `oi`, `rate` or `abs_rate` on this view.
