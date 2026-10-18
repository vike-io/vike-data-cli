# Evals — does our skill bundle actually help LLMs?

This directory holds an A/B harness that measures whether `SKILL.md` files in `skills/` move an LLM's command picks vs `vike-data --help` alone.

If shipping skills doesn't improve the model's choices, we shouldn't ship them. If it does, we have proof.

## What the runner does

For each question in `questions.yaml`:

1. **Condition A (control):** ask Claude/GPT to answer using only `vike-data --help` output.
2. **Condition B (treatment):** same question, but ALSO include the relevant `SKILL.md` files in the prompt.
3. Score each answer on three dimensions:
   - `command_match` — did the model name the right `vike-data <cmd>`?
   - `fragment_score` — what % of expected flags did it suggest?
   - `rejected_fragments` — if any forbidden fragment appears (made-up flag, wrong command), the score is **zeroed**. No partial credit for hallucinations.

4. Aggregate into a side-by-side table:

   ```
   Question                                  A (--help only)   B (+SKILL)   Delta
   "top SOL holders of token X"              0.30              0.85         +0.55
   "register a webhook for big USDC moves"   0.00              0.90         +0.90
   ...
   ```

5. If `delta < 0` (skill made things worse), flag the skill for revision.

## Run

```bash
# Install uv if you don't have it: https://docs.astral.sh/uv/
uv run --script evals/runner.py
```

The script has inline `# /// script` dependencies — no separate venv needed.

## Configure

- Set `ANTHROPIC_API_KEY` (or `OPENAI_API_KEY` for the OpenAI judge).
- For the live e2e suite (`npm run test:e2e`), set `VIKE_API_KEY` — copy `.env.example` to `.env` and fill it in (auto-loaded; tests skip without it).
- Add / edit questions in `questions.yaml`.
- Each question lists: the user prompt, the expected command, expected flags, and forbidden fragments (common hallucinations).

## Adding questions

Cover every command at least once. Bonus: cover composite playbook skills (e.g. `vike-smart-money-discovery`) with multi-step expected outputs.

A good question:
- Phrases the request in natural language (not "what does `vike-data token holders` do")
- Has ONE clearly-correct command
- Lists 2-5 expected flags
- Lists 2-3 forbidden fragments (made-up flags or wrong commands the model commonly hallucinates)

## What "good enough" looks like

| Metric | Floor we ship at |
|---|---|
| Average delta (B − A) | ≥ +0.30 |
| Per-skill delta (worst case) | ≥ +0.10 |
| Hallucination rate (zeroed answers / total) in B | ≤ 5% |

Anything below = skill needs a revision. Anything above = ship.

## Results

Run output goes to `evals/results/<timestamp>.json` (gitignored). Latest summary printed to stdout.
