---
"@vike-io/cli": minor
---

Add `vike-data` as a second command name, alongside `vike`.

`vike` collides with the Vike Trader multicall binary, which is also called
`vike` — two different programs, both ours, one name on PATH. Anyone running the
trading platform and this CLI on the same machine gets whichever the shell finds
first.

This is ADDITIVE: `vike` keeps working exactly as before, so nothing installed
today breaks. `vike-data` is the unambiguous name to move to, and the one the
docs should teach from here.
