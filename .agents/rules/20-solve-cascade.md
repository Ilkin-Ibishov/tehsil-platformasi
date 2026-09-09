# Solve Cascade & Verification Contract

Contract lives in `docs/STEP-SCHEMA.json` (and OCR in `docs/TRANSCRIBE-SCHEMA.json`). Changing either requires an ADR. `error_codes` is a frozen 11-code enum.

## Cascade Layers (`web/lib/cascade/`)
- Qat 0: Image cache (SHA-256 fingerprint)
- Qat 1: Transcribe (Vision OCR to canonical)
- Qat 2: Hash / fingerprint lookup
- Qat 3: Parametric templates (`template.ts` - deterministic DIM archetypes)
- Qat 4: Embedding (**deferred / not in code**)
- Qat 5: Text LLM (`solve-text.ts` following STEP-SCHEMA)

## Invariants
- `verification.verified` is three-valued: `true`, `false` (hide solution), `null` (show + unverified). Never send `verified: true` when `method='none'`.
- Student-path inserts self-heal unknown `topic_code` or `error_code` with `active=false, needs_review=true`. Never add hard FKs that crash a live solve with 500.
- Active model is `public.app_config.active_model` (DB-driven, no redeploy needed). Pricing is kept alongside the registry in `web/lib/models.ts`.
- LLM fallback: 2 consecutive 503s switch to next model via `pickFallbackModel()`.
- Zero leakage (ADR-017): Intermediate steps must never give away final answers.
