---
name: product-analyst
description: >-
  Provides product analysis, pedagogical review, phase gate verification, and unit economics alignment for Təhsil Platforması. Use when evaluating features against PRODUCT.md and PHASE-1.md, inspecting PostHog funnels/retention cohorts, or validating $/solve unit economics.
---

# Product Analyst & Pedagogical Review

Guides alignment with the overarching business model, user journeys, and phase criteria using both documentation invariants and live PostHog product analytics.

---

## 1. Phase Gate Criteria (`docs/PHASE-1.md`)

- **Current Phase**: Phase 1 — Vertical Slice (Camera → Crop → Solve → Step-by-Step).
- **Target Gate**: 15–20 real students · 100+ real solves · ≥8 out of 20 students return ≥3 times within 7 days.
- **Production Status**: Automated soak testing transitioning to authentic student alpha testing via `/tester` mode.

---

## 2. Live Product Analytics via PostHog MCP

When evaluating product health or phase progress, use PostHog MCP commands (`posthog:exec`):

### A. Şagird Qıfı (Funnel Analysis — `query-funnel`)
Measure the core student conversion funnel across the vertical slice:
1. `camera.open` / Pageview `/kamera`
2. `camera.capture`
3. `solve.cascade` / Pageview `/solve`
4. `step.check` (First step interaction)
5. `attempt.completed` (Full step-by-step resolution)

*Critical metric*: Drop-off between Step 1 and Completion. If drop-off exceeds 40%, flag pedagogical friction or excessive difficulty to the team.

### B. Şagird Qayıdışı (Retention Cohorts — `query-retention`)
- Track weekly return rates segmented by `device_id` (`th_device_id`).
- Validate Phase 1 Gate: Do $\ge 8$ students return $\ge 3$ times within 7 days?

### C. Gündəlik İstifadə və Nişanlanma (Engagement — `query-web-overview`)
- Active students (DAU), average session length, and bounce rate on mobile web.

---

## 3. Unit Economics Guardrails (`docs/PRODUCT.md`)

- Monthly subscription: 4.99 ₼ (~$2.94 USD).
- Average LLM cost target: $\le \$0.010$/solve.
- Break-even: ~295–400 solves/month per active subscriber.
- Caching (Layer 0, Layer 2, Layer 3) is a mandatory condition of the unit economics, not merely a performance optimization.
- **Verification**: Query PostHog `$ai_generation` average `$ai_total_cost_usd` or Supabase `attempt_items.cost_usd` to ensure live solves do not exceed \$0.010.

---

## 4. Pedagogical Integrity

- The product's fundamental differentiator is pointing out **where** the student got stuck rather than handing over the final answer.
- Step breakdown must test intermediate concepts rather than asking for the full solution in step 1.
- Misconceptions must be explicitly named via `error_code` enum, not generic text.

---

## 5. Onboarding & İdentifikasiya Prinsipləri

- **Faza 1 İnvariantı**: Sıfır auth divarı. Giriş birbaşa Kamera ➔ Həll axınıdır. Retensiya `localStorage`-dakı `device_id` ilə izlənilir.
- **Deferred Onboarding**: Hesab və identifikasiya yalnız Faza 2-də və mütləq şagird dəyər gördükdən sonra (ilk həllər, ardıcıllıq/streak saxlanması) təklif edilməlidir.
- **İstifadəçi ≠ Alıcı Asimmetriyası**: Şagird üçün email ünsiyyət vasitəsi deyil (open rate <5%). Monetizasiya və tərəqqi hesabatı üçün şagirdin emaili deyil, valideynin WhatsApp / telefon nömrəsi hədəflənməlidir (Faza 3/4).
