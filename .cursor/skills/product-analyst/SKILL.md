---
name: product-analyst
description: >-
  Provides product analysis, pedagogical review, phase gate verification, and unit economics alignment for Təhsil Platforması. Use when evaluating features against PRODUCT.md and PHASE-1.md.
---

# Product Analyst & Pedagogical Review

Guides alignment with the overarching business model, user journeys, and phase criteria.

## 1. Phase Gate Criteria (`docs/PHASE-1.md`)

- **Current Phase**: Phase 1 — Vertical Slice (Camera → Crop → Solve → Step-by-Step).
- **Target Gate**: 15–20 real students · 100+ real solves · ≥8 out of 20 students return ≥3 times within 7 days.
- **Production Status**: No real student invites sent yet (`CLAUDE.md`). Real telemetry currently sourced from automated corpus soaks and eval benchmarks.

## 2. Unit Economics Guardrails (`docs/PRODUCT.md`)

- Monthly subscription: 4.99 ₼ (~$2.94 USD).
- Average LLM cost target: $\le \$0.010$/solve.
- Break-even: ~295–400 solves/month per active subscriber.
- Caching (Layer 0, Layer 2, Layer 3) is a mandatory condition of the unit economics, not merely a performance optimization.

## 3. Pedagogical Integrity

- The product's fundamental differentiator is pointing out **where** the student got stuck rather than handing over the final answer.
- Step breakdown must test intermediate concepts rather than asking for the full solution in step 1.
