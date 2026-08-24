---
name: eval-benchmark
description: >-
  Runs evaluation benchmarks using scripts/eval.py across math, physics, and chemistry golden datasets. Measures schema validity, answer accuracy, leak rate, false refusal, and model fallback health. Activate when benchmarking LLM prompts or testing accuracy.
---

# Evaluation & Benchmark Harness

This skill guides running and analyzing evaluation benchmarks for LLM solver pipelines.

## Running Benchmarks

### 1. Vision Golden Sets
```bash
python scripts/eval.py --golden evals/golden-set-math-dim-vB-e24.jsonl
python scripts/eval.py --golden evals/golden-set-physics-30.jsonl
```

### 2. Fast Canonical / Text-Only Replay
Skip Layer 1 vision call and test downstream reasoning against saved transcripts:
```bash
python scripts/eval.py --golden evals/golden-set-math-dim-vB-e24.jsonl --from-canonical
```

### 3. CI Selftest
```bash
python scripts/eval.py --selftest
```

## Key Metrics to Inspect in Results (`evals/results/summary-*.json`)

1. **Schema Validity**: Must be 100% against `STEP-SCHEMA.json` v2.
2. **Answer Accuracy**: `final_answer` matches golden reference via symbolic engine (`sympy`/`mathjs`).
3. **Leak Rate (`leak_rate_by_model`)**: Explanation / step prompts must not leak the final answer or next-step numbers prematurely. Target: 0%.
4. **False Refusal Rate**: Model must not reject solvable curriculum questions as IQ/logic or unreadable.
5. **Model Fallback Distribution**: Track fallback rates from `gemini-3.7-flash` down to `gemini-3.6-flash` and `gemini-3.1-flash-lite`.
