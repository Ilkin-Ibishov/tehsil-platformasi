# Known state — don't rediscover this, go past it

Update this file whenever you complete an audit or a fix, so the next run starts from
the actual frontier instead of re-finding what's already known. Keep entries dated.

## Fixed (2026-08-14, live-browser-verified + re-tested against the original repro)

All in `web/components/hell/SolveView.tsx` unless noted. Full detail in
`docs/HANDOFF.md` block 86.

1. **"Növbəti addım" advanced without an answer** — `advance()`'s button had no
   correctness check, only `disabled={revealing}`. A student could clear a 4-step
   problem with zero correct answers and `error_code` was never recorded. Fixed:
   `disabled={revealing || (stepIndex < total-1 && status !== "correct")}`. The
   separate "Bu addımı başa düşmədim" (abandon) path is intentionally untouched — it's
   a real, honestly-labeled escape hatch, not the bug.
2. **Raw `error_code` shown as UI text** (e.g. `PERCENT_TO_FRACTION`). Fixed server-side
   in `/api/steps/check/route.ts` — resolves `public.error_codes.title_az`, gated on
   `needs_review = false` (the self-healing taxonomy trigger writes `title_az = code`
   for un-curated codes; without the gate the fix reproduces the same bug under a
   different field name — verify this gate is still present if you touch this code).
3. **Distractor's specific diagnostic message discarded client-side** —
   `checkStepAnswer`'s return type dropped `distractor`/`error_title`; the UI always
   showed the generic step hint even when a specific pre-authored diagnosis existed.
   Fixed: threaded through, shown in place of the generic hint when present.
4. **Bank topic labels were raw `topic_code`** (`ARITH.PERCENT_INCREASE`). Fixed:
   `/api/bank/questions` LEFT JOINs `public.topic_codes.title_az`.
5. **Bank question lists were an unordered wall of 46-55 near-duplicates.** Fixed:
   sorted by `fingerprint_digits`' leading number, count shown, paginated 12/page.
6. **Numeric-answer input had no `inputMode`**, so mobile always opened a full QWERTY
   keyboard. Fixed: `inputMode="decimal"` when `check.input_kind === "number"` — only on
   the primary step-answer input; the "EYNİSİNİ SƏN HƏLL ET" transfer input was left
   alone (no `input_kind` data available there — don't guess at one).
7. **`\%` (and `\&`/`\_`/`\#`) LaTeX escapes leaked into rendered text** ("1\% = ...").
   Fixed in `web/lib/math-format.ts`. Note: the app's own `findUnformattedLatex` QA
   regex (`\[a-zA-Z]+`) structurally cannot catch this class (`%` isn't a letter) — if
   you find another escaped-punctuation leak, it has the same blind spot.
8. **New home-screen bank button sat flush against the viewport edge** (zero margin,
   `scrollHeight === innerHeight` exactly). Fixed: `paddingBottom: max(16px,
   env(safe-area-inset-bottom))` on `web/app/page.tsx`'s `<main>`.

## Found, NOT yet fixed (2026-08-14, found while validating this skill — report, don't
re-discover)

9. **Invite code is never actually validated at the invite gate.**
   `InviteGate.onCode` (`components/kamera/InviteGate.tsx`) stores whatever string was
   typed and advances immediately — no client or server check at entry. The real check
   only happens later, server-side, on the first API call that needs it:
   - **Kamera flow**: a wrong code survives all the way through camera permission,
     capture, and crop, and only fails at `/api/solve`'s 403 — at which point
     `kamera/page.tsx` does show `t("inviteInvalid")` ("Dəvət kodu düzgün deyil"), but
     only after the student has invested the whole capture flow.
   - **Bank flow**: strictly worse — `bank/page.tsx`'s `useEffect` handles the 403 by
     calling `clearStoredInviteCode()` and `setStage("invite")` with **no error state
     set at all** (confirmed live: submitting a wrong code silently returns to the
     exact same blank invite form, no message, indistinguishable from the button
     having done nothing). There is no `inviteError`-equivalent state in
     `bank/page.tsx` the way there is in `kamera/page.tsx`.
   Heuristics violated: #1 (visibility of system status — the failure is invisible on
   the bank path), #5 (error prevention — should fail fast at entry, not after a whole
   flow). Severity 🟠 Serious on kamera (late but eventually clear), arguably closer to
   🔴 on bank (silent, looks broken, no path forward stated to the student).

## Deliberately not covered (documented decisions, not gaps to re-flag)

- `tone.genc` (grades 5-8 variant) exists in `DESIGN-TOKENS.json` but is never applied
  — `layout.tsx` hardcodes `"yetkin"`. Explicitly deferred per the file's own comment.
  Note as 💭 if relevant to what you're reviewing, don't report as a fresh bug.
- Cascade flow (transcription confirm, Qat 2/5 bank+LLM split) is fully built but
  gated behind `CASCADE_ENABLED`/`NEXT_PUBLIC_CASCADE_ENABLED`, both off in production
  pending `ADR-014`'s measurement gate (10 real cropped photos, accuracy/hallucination/
  cost/latency thresholds). Reviewing it is still useful (it will ship eventually) but
  say explicitly that you tested the not-yet-live path.
- Light theme (`DESIGN-TOKENS.json`'s `theme.light`) has token values defined but
  `layout.tsx` hardcodes `data-theme="dark"` — nobody has live-tested the light theme
  rendering in a real browser, only checked that the token values exist and pass
  contrast math on paper. If asked to review theming, this is a real gap, not a
  deferred decision — flag it.
- Onboarding, subscription/paywall, parent report, feed/streak/quiz ("Test.dc.html")
  are explicitly out of Phase 1 scope per `docs/PHASE-1.md`. Don't flag their absence.

## Not yet audited at all (the actual frontier — start here on the next pass)

- **Invite gate** (`components/kamera/InviteGate.tsx`) — only smoke-tested (code
  entered, submit worked). Never deep-reviewed: error states (wrong code, network
  failure), copy tone, whether the PWA-install hint actually appears at the right
  moment.
- **Crop screen** (`components/kamera/CropView.tsx`) — code-reviewed only (camera-gated,
  can't drive live in this sandbox). The default crop box, drag/resize ergonomics on an
  actual touchscreen, and the ADR-007 "no new photo, ever" invariant's actual
  enforcement have never been checked against running code, only against the ADR's
  stated intent.
- **Candidates screen** (`multiple_problems` state, inline in `kamera/page.tsx`, no
  live test — needs the cascade flag + a way to trigger `multiple_problems` without a
  real camera capture, e.g. mocking the `/api/solve/transcribe` response).
- **Transcript confirm screen** (`TranscriptConfirmView.tsx`) — built this session,
  never live-tested at all (camera-gated). Code-reviewed only.
- **`solution.completed`/final-answer screen and "yeni sual" reset flow** — partially
  exercised via the bank flow's happy path, never stress-tested (reporting wrong,
  revealing without answering all steps, abandoning mid-flow then returning).
- **Full home-screen review** beyond the one layout bug already fixed — copy, first-run
  vs. returning-user state (`app.opened`'s `cold_start` telemetry exists; nothing in the
  UI currently differentiates the two visually).
- **Cross-device/viewport spot-check** — everything so far tested at exactly 375×812
  (iPhone-ish). Never checked a smaller Android viewport (360×640-class) or landscape.
