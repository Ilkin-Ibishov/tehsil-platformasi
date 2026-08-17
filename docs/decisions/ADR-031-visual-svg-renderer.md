# ADR-031 — Vizual izah: LLM JSON, render deterministik SVG

**Status:** Qəbul edilib (E2.1, parent `86eyncq98`)
**Tarix:** 2026-08-17
**Toxunur:** `ADR-015` (göstərmə qatı, KaTeX yox) · `ADR-025` (qrafik oxuma hallüsinasiyası) ·
`docs/STEP-SCHEMA.json` (`visual` sahəsi — **E2.2**, bu ADR-də yalnız müqavilə) ·
`docs/DESIGN-TOKENS.json` · `web/lib/math-format.ts`

## Kontekst

Faza 3 E2 parentində ölçülən rəqib modeli: Photomath-ın qrafiki **sərbəst LLM şəkli deyil**.
Animasiya şablona bağlıdır; interaktiv qrafik deterministik rendendir. Bizdə eyni risk
`ADR-025`-də artıq yaşanıb: model qrafiki tərs oxuyub, sonra həmin yanlış oxunuşu
«düzgün» riyaziyyatla izah edib. Əgər eyni modelə sərbəst SVG/path çəkdirsək, şagird
səhv şəklə mətndən çox inanacaq — Qızıl qayda (`error_code` xəritəsi) pozulur.

ClickUp E2 parent (2026-08-17) kitabxana cədvəli:

| | Versiya | Lisenziya | React 19 | Əlavə asılılıq |
|---|---|---|---|---|
| JSXGraph | 1.13.1 | MIT / LGPL-3.0 | freymvorkdan asılı deyil | yoxdur |
| Mafs | 0.21.0 | MIT | bəli (`react >=18`) | KaTeX ^0.16, `@use-gesture/react`, `use-resize-observer` |
| Saf SVG | — | — | — | yoxdur |

Mafs KaTeX gətirir (~270 KB). Layihədə KaTeX **yoxdur** (`ADR-015`, HANDOFF 165/170):
LaTeX → Unicode. E3.3 (`/dersler`) də eyni `math-format.ts` yolunu gözləyir.

## Qərar

1. **v1 renderer öz SVG-mizdir.** `jsxgraph` / `mafs` / `katex` npm-ə **gəlmir**.
   Yeni asılılıq yox — latensiya paketi (HANDOFF 153–166) geri çevrilmir.
2. **LLM heç vaxt SVG, path və ya `<img>` vermir.** Yalnız qapalı JSON (`visual`
   obyekti). Naməlum `kind` → sahə atılır, boş şəkil uydurulmur (INV-11).
3. **v1 `kind` dəsti** (DIM intercept / parabola / ədəd oxu):
   `none` | `number_line` | `linear` | `quadratic`. Hər `kind` üçün sahələr E2.2-də
   `STEP-SCHEMA.json`-a yazılır və **`schema_version` 1→2** orada bir dəfə artır.
   Bu ADR sxem faylına toxunmur.
4. Rəng, qalınlıq, radius **yalnız** `DESIGN-TOKENS.json` → CSS custom property.
5. Düstur etiketi vizualda da `formatMath` keçir — xam LaTeX yox.
6. Vizual **izahdır, yoxlama deyil.** `verification` hələ `answer.ts`-dir. Qrafikli
   sualda `verified === null` yolu (`ADR-025`) qalır.

## Nəticələr

**Müsbət:** səhv oxunmuş qrafik səhv şəkilə çevrilmir; paket böyümür; E3 dərslik
KaTeX gözləmir.

**Mənfi:** hiperbola, vektor sahəsi, 3D v1-də yoxdur — `kind` yoxdursa vizual
göstərilmir. JSXGraph-a keçid yalnız v1 `kind` siyahısı partlayanda yenidən ADR
tələb edir (bu faylı silmə).

**Sahədən kənar (E2 parent):** animasiya, 3D, şagirdin sxemi redaktə etməsi.

## E2 ardıcıllığı (dəyişmir)

E2.1 bu ADR → E2.2 `visual` sxemi + `schema_version` bump → E2.3 renderer →
E2.4 prompt → E2.5 telemetriya.
