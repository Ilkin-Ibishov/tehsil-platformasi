---
name: run-eval
description: Run and interpret eval harness for Təhsil Platforması — flags, golden sets, acceptance gates, result paths. Use when running leak/false_refusal measurements, adding eval flags, or debugging eval.py selftest in CI.
---

# Run eval

## Quick commands

```bash
# Harness selftest (no API, CI parity)
python scripts/eval.py --selftest

# Full vision run
python scripts/eval.py --pipeline vision --set evals/golden-set-math-dim-vB-e24.jsonl

# Text leak re-run from prior result
python scripts/eval.py --pipeline text --set evals/golden-set-physics-30.jsonl \
  --from-canonical evals/results/<prior>.json --fallback
```

## Flags

| Flag | When |
|---|---|
| `--from-canonical` | Qat 1 skip; reuse `model_canonical` from a saved result JSON |
| `--fallback` | Enable Gemini 503 fallback chain in harness |
| `--text` / `--pipeline text` | Force text path (no vision) |
| `--compare` | Diff two result files |

## Acceptance (ClickUp gates)

| Gate | Metric | Target |
|---|---|---|
| E1.9 | leak rate | 0% on set |
| E1.10 | false_refusal | vision path required |

Read latest HANDOFF head for last measured numbers — do not hardcode pass/fail here.

## Outputs

- Per-run JSON: `evals/results/`
- Summary: `evals/results/summary-<set>-<date>.json`
- Check `leak_rate_by_model`, `model_used_distribution`, `fallback_count`

## CI

`.github/workflows/ci.yml` runs `python scripts/eval.py --selftest`. If you change image-resolve logic, ensure CI stays green without `evals/images/`.

See also: `.cursor/rules/35-eval-harness.mdc`, `evals/README.md`.
