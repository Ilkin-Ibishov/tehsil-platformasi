---
name: backend-developer
description: >-
  Specialized backend engineering for Təhsil Platforması: Next.js App Router API endpoints, Supabase Postgres & RLS, LLM cascade pipelines (Qat 0..5), NDJSON streaming, SymPy verification, model fallback orchestration, and self-healing telemetry. Use when implementing or refactoring backend routes, database interactions, streaming pipelines, or third-party API integrations.
---

# Backend Developer & Pipeline Engineer

Architectural guide and execution runbook for the server-side infrastructure, database contracts, streaming protocols, and LLM orchestration layers of Təhsil Platforması.

## 1. System Map & Hot Paths
- Entry: `web/app/api/solve/route.ts` (monolith/cascade) & `web/app/api/solve/finish/route.ts` (NDJSON stream).
- Orchestrator: `web/lib/cascade/run.ts`.
- Layers: Qat 0 (Image cache) -> Qat 1 (`transcribe.ts`) -> Qat 2 (Hash) -> Qat 3 (`template.ts`) -> Qat 5 (`solve-text.ts`).
- Resilience: `web/lib/llm.ts` 503 failover with `pickFallbackModel()`.
- DB: `web/lib/cascade/persist.ts` & Supabase Postgres migrations.

## 2. Invariants
- Expand-Contract migrations.
- RLS enabled on all tables + explicit `grant ... to app_runtime`.
- Self-healing inserts on student paths (`active=false, needs_review=true`).
- SymPy three-state verification (`true` / `false` / `null`).
- Whitelisted stream serialization (`onPublicStep`).
