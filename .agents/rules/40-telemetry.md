# Telemetry, Observability & Event Taxonomy

All analytics, error tracking, and telemetry events must adhere strictly to `docs/TELEMETRY.md` and the multi-tier observability architecture.

## 1. Internal Event Rules
- Event names follow the `domain.action` pattern (e.g. `solve.cascade`, `solve.response`, `step.check`).
- Never invent event names or alter payload key names on the fly.
- When new events are necessary, submit a PR to `docs/TELEMETRY.md` alongside code changes.
- Ensure `model`, `fallback_used`, `fallback_from`, and `cost_usd` are recorded where specified.

## 2. External Observability (PostHog & Sentry)
- **PostHog Dual-Layer**:
  - **Client (`posthog-js`)**: Tracks SPA route navigation (`$pageview`), user engagement (`pageleave`), and autocapture. Always call `posthog.identify(deviceId, traits)` enriching with student profile traits (`grade`, `role`, `goal`, `onboarded`) from local storage.
  - **Server (`posthog-node`)**: Tracks LLM calls (`$ai_generation`) directly inside `web/lib/llm.ts` via `trackAIGeneration()`. Captures `$ai_model`, `$ai_latency`, token metrics, cost, context caching status, and model fallback occurrences.
  - **Ad-Blocker Reverse Proxy Invariant**: `web/next.config.ts` must maintain `/ingest/*` rewrites proxying to PostHog EU (`https://eu-assets.i.posthog.com/static/:path*` and `https://eu.i.posthog.com/:path*`) with `skipTrailingSlashRedirect: true`. In production, client SDK `api_host` must point to `/ingest` so student ad-blockers never silently swallow analytics.
  - **Unified Telemetry Dual-Tracking**: `web/lib/telemetry/index.ts` `trackEvent()` synchronously mirrors all internal domain events into `window.posthog.capture()` with `attempt_id`. Never duplicate manual capture calls across disparate UI components.
- **Sentry Invariants**:
  - Next.js 15+ requires `web/instrumentation.ts` (`onRequestError`) for auto-capturing server/API crashes and `web/app/global-error.tsx` for client-side rendering boundaries.
  - Always import `withSentryConfig` from `@sentry/nextjs/config` (not `@sentry/nextjs`).
  - Keep `tunnelRoute: "/monitoring"` enabled to prevent ad-blockers and privacy extensions on student phones from silently dropping telemetry.
  - Always tag Sentry initialScope with `device_id`, `grade`, and `role` to correlate Sentry issues with Supabase `attempt_items` and `bug_reports`.
- **Persistent Diagnostic Endpoints**:
  - Preserve `/sentry-example-page` and `/api/sentry-example-api` as permanent regression and verification assets for both client/server Sentry capture and PostHog event delivery.

## 3. Skill Integration Runbook
- `student-reviewer`: Query PostHog MCP (`$rageclick`, `$dead_click`, session recordings) and Supabase `bug_reports` to ground ergonomic reviews in real student actions.
- `product-analyst`: Query PostHog MCP (`query-funnel`, `query-retention`) to evaluate Phase 1 gate criteria (20 students, 8 return ≥3 times).
- `backend-developer`: Query PostHog MCP (`query-llm-traces-list`) and Sentry to monitor cascade latency and LLM fallback rates.
- `push-verify`: Audit Sentry for newly introduced unresolved exceptions on the target release after deployment.
