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

## Fixed (2026-08-15, ClickUp 86eymrm6g — code, not live-browser re-verified)

9. **Invite code never validated at the invite gate.** `InviteGate` now `POST`s
   `/api/invite/check` (`checkInviteCode`, no redemption write) and only stores the
   code on 200. Wrong code shows `invite.invalid` (`role="alert"`) and does not
   advance. `bank/page.tsx` sets `inviteError` on 403 (list and start) and passes
   `invalid` into the gate — the silent blank-form return is gone. Kamera late-403
   still returns to the gate with `invalid={true}` for stale stored codes.

## Found, NOT yet fixed (2026-08-14, found while validating this skill — report, don't
re-discover)

(Item 9 — invite gate — moved to Fixed 2026-08-15.)

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

## Found, NOT yet fixed (2026-08-14, second pass — invite gate + solve-flow stress test,
live-browser-verified)

10. **"Cavabı göstər" ("Show the answer") is available from every step and always jumps
    to the FINAL answer, silently forfeiting all remaining steps' `error_code` data — no
    warning, no confirmation.** `SolveView.tsx`'s `reveal()` (called by the `t("step.showAnswer")`
    button, `messages/az.json`'s `hell.step.showAnswer` = "Cavabı göstər") always calls
    `fetchFinalAnswer`/sets `revealed=true` regardless of `stepIndex`, per the documented
    HANDOFF-49 §3d intent ("ilişmiş şagirdin çıxış yolu" — an intentional stuck-student
    escape hatch). The bug is not that this exists — it's that nothing distinguishes it
    from `t("step.abandon")` = "Bu addımı başa düşmədim →" ("I didn't understand THIS
    step"), which only advances one step. Live repro: on a 2-step question, at step 1/2,
    clicking "Cavabı göstər" jumped straight to the `CAVAB` final-answer screen — step
    2 was never shown or attempted, `reportAttemptProgress` fires with `completed:false,
    abandonedAtStep:0`. A student who taps this expecting "show me how to do this step"
    (a reasonable reading of the label) instead ends the whole problem with fewer steps'
    worth of diagnostic data collected — directly cuts against CLAUDE.md's "Qızıl qayda"
    (the product's whole value is the `error_code` map). Severity 🟠 Serious. Fix
    direction: either (a) reword the button so it's unambiguous it ends the problem
    ("Bütün cavabı göstər" / similar), or (b) gate it behind a one-tap confirm when
    `stepIndex < total - 1`, or (c) add a real per-step reveal that doesn't forfeit
    remaining steps, with THIS button reserved for the true give-up case.

**Re-confirmed still present (live-verified again this pass, not re-fixed):**
- Item 9 was still present on 2026-08-14; it was fixed in code on 2026-08-15
  (ClickUp 86eymrm6g). Do not re-report the silent bank 403 or unvalidated gate
  submit. Live-browser re-verification of the new `/api/invite/check` path is
  still open.

**Confirmed still fixed (re-verified, no regression):** items 1, 6, 8 from the list
above — "Növbəti addım" disabled with no/incorrect answer, `inputMode="decimal"` present
on the step-answer input, home-screen bottom padding present at 360×640.

## Newly checked, no issues found (2026-08-14)

- **Cross-viewport spot-check**: 360×640 (small Android) and 812×375 (landscape) —
  no horizontal overflow, no zero-margin-below-fold on either, home screen renders
  correctly at both.
- **`solution.reported_wrong` and "yeni sual" reset flow**: both work as expected —
  report-wrong swaps to a thank-you message and doesn't re-arm, reset returns cleanly
  to the topic list with no stale state.
- **ADR-007 "always back to crop, never a new photo" invariant**: confirmed enforced
  in code, not just in the ADR text — `TranscriptConfirmView`'s reject path
  (`handleReject` in `kamera/page.tsx`) calls `backToCrop()`, never a camera re-open.
  This is a deliberate, correctly-implemented design decision, not a gap.
- **`CropView.tsx`** (code-review only, still camera-gated in this sandbox): the
  corner-handle event-bubbling bug mentioned in the file's own HANDOFF comment is
  already fixed (`stopPropagation` present on each handle's down-handler). 44px touch
  targets on all four resize handles. No new issues found on read-through.
- **`TranscriptConfirmView.tsx`** (code-review only): confirm button correctly disabled
  on empty/whitespace-only text; reject path is clean. No issues found.

## Not yet audited at all (the actual frontier — start here on the next pass)

- **Invite gate copy/tone and whether the PWA-install hint appears at the right
  moment** — the error-state bug is fixed (item 9, 2026-08-15); nobody has judged
  whether showing the PWA hint immediately on first gate view (before the student
  has gotten any value yet) is the right moment, or whether it should appear later
  (e.g. after a first successful solve).
- **Invite gate accessibility**: input has no `aria-label` (placeholder-only label,
  a known a11y antipattern — text disappears once typing starts) and no `autoFocus`
  (student must tap the field before typing). Neither confirmed as a real problem for
  this audience, both worth a deliberate look rather than assumption either way.
- **Candidates screen** (`multiple_problems` state, inline in `kamera/page.tsx`, no
  live test — needs the cascade flag + a way to trigger `multiple_problems` without a
  real camera capture, e.g. mocking the `/api/solve/transcribe` response).
- **Full home-screen review** beyond the layout bug already fixed and the cross-viewport
  check now done — copy, first-run vs. returning-user state (`app.opened`'s
  `cold_start` telemetry exists; nothing in the UI currently differentiates the two
  visually).
- **Drag/resize ergonomics on an actual touchscreen for `CropView.tsx`** — code read
  clean (see above) but real touch-drag feel has never been observed, only simulated
  via source reading (camera-gated, can't drive live in this sandbox).
