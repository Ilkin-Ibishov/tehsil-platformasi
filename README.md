# Təhsil Platforması

Azərbaycan şagirdləri (5–11 sinif) üçün addım-addım riyaziyyat köməkçisi.
Rəqiblər cavab verir — biz **harada ilişdiyini** deyirik.

## Haradan başlamalı

| Sən | Oxu |
|---|---|
| Claude Code sessiyası | `CLAUDE.md` → `docs/HANDOFF.md` (son 2 blok) |
| Cursor IDE sessiyası | `AGENTS.md` → `.cursor/` (qayda/skill/agent). Konstitusiya yenə `CLAUDE.md` |
| Məhsulu anlamaq | `docs/PRODUCT.md` |
| Cari sprint planı və API müqaviləsi | `docs/PHASE-1.md` |
| Texniki qərarlar | `docs/ARCHITECTURE.md`, `docs/decisions/` (ADR-001…024) |
| Maşınla yoxlanan qaydalar | `docs/INVARIANTS.md` |
| Test bankı | `.kiro/specs/test-bank/design.md` (SQL sxemi mənbə həqiqətdir) |

## Struktur

```
CLAUDE.md                 konstitusiya — Cowork yeniləyir
AGENTS.md                 Cursor əməliyyat xəritəsi (yaşayan datanı təkrar etmir)
.cursor/                  qaydalar, skill, subagent, hook, layihə MCP
LOG.md                    qısa iş jurnalı (3 sətir/task)
docs/
  PRODUCT.md              məhsul briefi, fazalar və qapı metrikaları
  PHASE-1.md              cari faza: sprintlər, API müqaviləsi, qəbul şərtləri
  ARCHITECTURE.md         kaskad boru xətti, stack
  DATA-MODEL.md           konseptual sxem (⚠️ real sxem üçün miqrasiyalara bax)
  INVARIANTS.md           DB trigger / selftest ilə təmin olunan qaydalar
  TELEMETRY.md            hadisə taksonomiyası (dəyişməz)
  STEP-SCHEMA.json        LLM cavab müqaviləsi + error_code enum-u (11 kod)
  TRANSCRIBE-SCHEMA.json  Qat 1 transkripsiya müqaviləsi
  DESIGN-TOKENS.json      dizayn tokenlərinin tək mənbəyi
  HANDOFF.md              Cowork ↔ Cursor/Claude Code növbə jurnalı
  decisions/              ADR-001…026 (son: ADR-025 qrafik hallüsinasiyası, ADR-026 fənn genişlənməsi)
web/                      Next.js tətbiqi (App Router, TS, Tailwind, PWA)
supabase/migrations/      0001…0062 — DB-yə tətbiq sırası ilə
evals/                    golden set, fixture-lar və nəticələr
prompts/solve/            LLM prompt mətnləri (core.md, math.md, transcribe.md)
design/                   9 təsdiqlənmiş ekran maketi (referans, spesifikasiya)
.kiro/                    test bankı spesifikasiyası və steering qaydaları
scripts/                  eval və import skriptləri
```

## Cari vəziyyət

**Faza 1 — Şaquli dilim.** Tətbiq production-da (Vercel + Supabase), kaskad Qat 0/1/2/3/5
işləyir, miqrasiyalar `0063`-ə qədər tətbiq edilib, ADR-lər `001`–`026`.

Faza 0 qapısı **n=99 tam DİM dataset-i ilə ölçüldü** (HANDOFF 107): sxem validliyi 100%,
cavab dəqiqliyi 94.8%, struktur 100%, orta xərc $0.00997/sual, latensiya 19.2 san.
Sızma 21.9% (hədəf ≤10%, amma əl ilə yoxlanan hallar əsasən detektorun yalan-müsbətidir).
**Qapı NATAMAM:** yalnız insan pedaqoji rəyi (`ADR-004`) qalıb.

Qapı: 15–20 şagird · 100+ real həll · 20 şagirddən ≥8-i 7 gündə ≥3 dəfə qayıdır.
