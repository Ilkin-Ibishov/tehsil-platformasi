# Təhsil Platforması

Azərbaycan şagirdləri (5–11 sinif) üçün addım-addım riyaziyyat köməkçisi.
Rəqiblər cavab verir — biz **harada ilişdiyini** deyirik.

## Haradan başlamalı

| Sən | Oxu |
|---|---|
| Claude Code sessiyası | `CLAUDE.md` → `docs/HANDOFF.md` |
| Məhsulu anlamaq | `docs/PRODUCT.md` |
| Texniki qərarlar | `docs/ARCHITECTURE.md`, `docs/decisions/` |
| Kodlaşdırmağa başlamaq | **Faza 0 qapısı keçilməyib** — `evals/README.md` |

## Struktur

```
CLAUDE.md                 giriş faylı — Claude Code avtomatik oxuyur
docs/
  PRODUCT.md              məhsul briefi, fazalar və qapı metrikaları
  ARCHITECTURE.md         keş-əvvəl boru xətti, stack
  DATA-MODEL.md           Supabase sxemi
  STEP-SCHEMA.json        LLM cavab müqaviləsi + error_code enum-u
  DESIGN-TOKENS.json      dizayn tokenlərinin tək mənbəyi
  HANDOFF.md              Cowork ↔ Claude Code növbə jurnalı
  decisions/              ADR-lər
evals/                    Faza 0 golden set və nəticələr
prompts/                  LLM prompt mətnləri
design/                   9 təsdiqlənmiş ekran maketi (referans)
scripts/                  eval və import skriptləri
```

## Cari vəziyyət

**Faza 0 — Eval.** Kod yazılmır. 30 DİM səhifəsi çəkilib `evals/golden-set.jsonl` doldurulmalı,
sonra iki boru xətti müqayisə edilməlidir.

Qapı: son cavab ≥85% · addım bölgüsü ≥75%
