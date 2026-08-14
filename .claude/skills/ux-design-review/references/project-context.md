# Project-specific ground truth

Don't guess at any of this — read the actual files. This reference just tells you
where to look and what each source is authoritative for.

## Design system — `docs/DESIGN-TOKENS.json`

The single source of truth for color, radius, spacing, type, motion (per `ADR-002`,
written after the same token existed at 3 different values across 9 files). Any
component hardcoding a color/radius/spacing value instead of reading the CSS custom
property (`var(--acc)`, `var(--rad)`, `var(--tap)`, etc.) is a finding under heuristic
#4, even if the hardcoded value happens to match today.

Two details worth knowing before you review anything:
- `layout.minTapTarget` is **44px** — that's the bar, not 48px (a common default you
  might assume). Some components use `var(--tap)` which resolves to 48px via
  `tone.yetkin.tap` — that's fine, it clears the bar; the point is know the actual
  minimum before flagging something as under it.
- `tone.genc` (larger radius, bigger touch targets, `Nunito` heading font — meant for
  grades 5-8) exists in the token file but `web/app/layout.tsx` hardcodes
  `getThemeVars("dark", "yetkin")` — the "mature" tone — for every user regardless of
  grade. This is a known, explicitly-deferred gap (the layout.tsx comment says so: "S1a:
  tema/ton hələ statikdir... sonrakı sprintin işidir"), not an undiscovered bug. If you
  notice it, note it as 💭, don't report it as a fresh 🟠 finding — but DO flag it if
  you find UI copy or behavior that assumes age-appropriate tone is already applied
  somewhere (that would be a real inconsistency).

## Approved mockups — `design/*.dc.html`

Nine interactive HTML mockups are the actual approved spec for structure and copy (per
`CLAUDE.md`: "Bunlar spesifikasiyadır, kod deyil"). As of this writing, only a fraction
of them have corresponding built screens:

| Mockup | Built? | Where |
|---|---|---|
| `Ana ekran.dc.html` | Yes | `web/app/page.tsx` |
| `Kamera.dc.html` | Yes | `web/app/kamera/page.tsx` + `components/kamera/CaptureView.tsx` |
| `Həll ekranı v5.dc.html` | Yes | `web/components/hell/SolveView.tsx` |
| `Onboarding.dc.html` | No | out of Phase 1 scope |
| `Üslub seçimi.dc.html` | No | out of Phase 1 scope (this is the tone/genc-vs-yetkin picker) |
| `Test.dc.html` | No | multiple-choice quiz UI, different feature (test-bank spec), not this app's step-solve flow |
| `Reels lenti.dc.html` | No | out of Phase 1 scope |
| `Abunəlik.dc.html` | No | out of Phase 1 scope (payment/paywall) |
| `Valideyn hesabatı.dc.html` | No | explicitly out of Phase 1 scope per `PHASE-1.md` |

When reviewing a built screen, open its mockup and diff structure/copy — drift here is
a real finding (heuristic #4) even when the built screen looks fine in isolation. When
asked to review something with no mockup (the bank UI has none — it was built ad hoc
this session, no `.dc.html` exists for it), say so explicitly rather than comparing it
to an unrelated mockup.

## Current screen inventory (as of this writing — re-list if it's been a while)

```
web/app/page.tsx                              — home (2 CTAs: camera, bank)
web/components/kamera/InviteGate.tsx          — invite code entry (shared, camera + bank)
web/app/kamera/page.tsx                       — orchestrates the whole camera flow:
  components/kamera/CaptureView.tsx             — camera permission + capture
  components/kamera/CropView.tsx                — post-capture crop (ADR-007)
  components/hell/TranscriptConfirmView.tsx     — "I read this: ... Correct?" (cascade only,
                                                    behind NEXT_PUBLIC_CASCADE_ENABLED)
  [candidates screen]                           — inline in kamera/page.tsx, no separate file
  [refused screen]                              — inline in kamera/page.tsx, no separate file
  components/hell/LoadingView.tsx               — staged loading copy
  components/hell/SolveView.tsx                 — step-by-step solve (shared with bank)
web/app/bank/page.tsx                         — topic browse → question list → SolveView
```

`SolveView.tsx` is shared between the camera flow (`kind='photo_solve'`) and bank
practice (`kind='bank_practice'`) — a finding there affects both entry points, always
check whether a fix or bug is truly shared or has a flow-specific edge case (the
`resetLabel` prop exists specifically because "Yeni sual çək" was wrong wording in the
bank context — that pattern, an optional prop with a flow-specific override and an
unchanged default, is the established way to specialize shared components here without
duplicating them).

## Telemetry — `docs/TELEMETRY.md`

Immutable event taxonomy (Cowork-owned, per `CLAUDE.md`'s file-ownership table) — full
event list and props are there. Two uses for a UX review:
1. **Verify a claim with data, not guesswork.** If local test data exists (see
   `testing-methodology.md`), query `events`/`step_events`/`attempt_items` instead of
   asserting "students probably struggle here" — this app was built specifically so
   that kind of claim is checkable.
2. **Spot instrumentation gaps.** If you're recommending a UX change, check whether the
   telemetry already exists to prove it worked, or whether shipping the change would be
   flying blind. This is more the product-analyst skill's job than this one, but it's
   worth a 💭 note if you notice it while doing a UX pass.

## What NOT to re-litigate

`docs/HANDOFF.md` (append-only session log, newest entries first) and
`docs/decisions/ADR-*.md` record decisions already made with stated reasoning. Before
flagging something as a bug, check whether it's actually a documented, deliberate
choice — e.g. the missing KaTeX rendering (`math-format.ts` converts LaTeX to unicode
instead) is `ADR-015`'s explicit choice, not an oversight; the crop screen appearing
*after* capture instead of a live viewfinder overlay is `ADR-007`'s explicit choice
("telefonu kitab üzərində sabit tutub çərçivə küncünü tənzimləmək çətindir"). An ADR
doesn't make a decision permanently correct — you can still question it — but say
you're questioning a documented decision, not "discovering" an unexamined bug.
