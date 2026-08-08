# ADR-015 — Göstərmə müqaviləsi: `latex` göstərilir, `values` yoxlanılır

**Status:** Qəbul edilib
**Tarix:** 2026-08-08
**Səbəb:** Ilkinin telefon testi (3 tapıntı) · `HANDOFF 52`
**Toxunur:** `STEP-SCHEMA.json` · `prompts/solve/core.md` · `SolveView.tsx` · `design/Həll ekranı v5.dc.html`

## Tapıntı 1 və 2 — sxem düzgündür, UI səhv sahəni oxuyur

`STEP-SCHEMA.json` → `final_answer` **iki sahə** tələb edir:

```jsonc
"latex":  "Göstərilən forma: x_1 = 3,\\ x_2 = 2"     ← ŞAGİRDƏ GÖSTƏRİLƏN
"values": ["3/10", "0.3", "0,3"]                     ← MAŞINLA YOXLANAN
```

Addımlarda da `latex` opsional sahə kimi var.

Şagird ekranda `0.3 · 0,3 · 3/10` görürsə, deməli UI **`values`-i göstərir**.
`values` eyni cavabın alternativ yazılışlarıdır — **müqayisə üçün**, göstərmək üçün yox.

Bu, `attempts.completed` ilə **eyni sinif səhvdir** (`SYSTEM-REVIEW §A1`):
bir sahə iki işə qoşulub. Fərq: orada sütun yox idi və miqrasiya lazım oldu,
burada **sahə onsuz da var** — yalnız UI oxuduğu yeri dəyişməlidir.

### Qərar

1. `SolveView` və cavab ekranı **`final_answer.latex`** göstərir. `values` **heç vaxt**
   istifadəçiyə göstərilmir — o, `/api/steps/check` və sympy üçündür.
2. Addımlarda `step.latex` varsa o göstərilir; yoxdursa `explanation` mətni.
3. `latex` boşdursa geri dönüş: `values[0]`. Bu, **son çarədir** və
   `render.latex_missing` telemetriya hadisəsi yazılır — nə qədər tez-tez baş verdiyini
   bilməliyik, səssiz keçməməlidir.

## Tapıntı 3 — notasiya müqaviləsi yoxdur

Modelin çıxışı **qeyri-sabitdir**: bəzən ASCII (`x^3 - 9x^2`, `b^2 - 4ac`),
bəzən LaTeX (`\log_3`, `\sqrt{3+2\sqrt{2}}`, `$...$`), bəzən qarışıq.
UI isə onu **xam** göstərir. Nəticə: şagird `x^3` və `b^2 - 4ac` görür — bu,
proqramlaşdırma notasiyasıdır, riyaziyyat dərsliyinin notasiyası deyil.

Üstəlik onluq ayırıcı: `3.5` göstərilir, Azərbaycan dilində **`3,5`** olmalıdır.

### Cavab dizayn faylındadır — yeni qərar tələb etmir

`design/Həll ekranı v5.dc.html` (təsdiqlənmiş maket) bunu artıq həll edib:

```html
<span data-tex="x^2 - 5x + 6 = 0" style="font-family:'JetBrains Mono'">x² − 5x + 6 = 0</span>
```

Yəni: **LaTeX mənbə atributda saxlanılır, ekranda unicode riyaziyyat göstərilir** —
`x²`, `b²`, `√D`, həqiqi minus `−`, monospace şriftlə.
Maketdə həmçinin `a = 1, b = −5, c = 6` və `25 − 24 = 1` var.

`CLAUDE.md`: *«`design/*.dc.html` — bunlar spesifikasiyadır»*. Deməli müqavilə hazırdır.

### Qərar — render qatı, prompt deyil

`web/lib/math-format.ts`: `formatMath(src: string): string`

| giriş | çıxış |
|---|---|
| `x^2`, `x^{10}` | `x²`, `x¹⁰` |
| `-`, `\cdot`, `*` | `−`, `·`, `·` |
| `\sqrt{D}`, `sqrt(D)` | `√D` |
| `\log_3`, `log_3` | `log₃` |
| `3.5` (onluq) | `3,5` (locale-ə görə) |
| `$…$`, `\left`, `\right`, `\ ` | silinir |
| `\frac{a}{b}` | `(a)/(b)` — **məhdudiyyət, aşağıya bax** |

**Niyə prompt yox, kod:** `ADR-013`-ün nəticəsi — mexaniki qayda işləyir, məna tələb
edən qayda işləmir. «Gözəl yaz» promptda **məna** tələbidir və 5/10 tutulacaq.
Render qatı **deterministikdir, testlənir və bir dəfə yazılır** — üstəlik ru/en/tr və
fizika/kimya gələndə eyni qat işləyir (`ADR-008`).

Normallaşdırma məntiqi onsuz da mövcuddur: `verify/answer.ts` LaTeX artefaktlarını
(`\`, `_`, `\cdot`) artıq təmizləyir (`HANDOFF 44`). `formatMath` onun **əks
istiqamətidir** və eyni cədvəli paylaşmalıdır — **iki ayrı siyahı saxlama.**

### Məhdudiyyət — kəsrlər

`\frac{x-1}{3}` unicode-da yaxşı görünmür. İki mərhələ:

- **İndi:** `(x−1)/3` — oxunaqlıdır, maketin ruhuna uyğundur, sıfır bundle.
- **Sonra, ölçüdən sonra:** `render.latex_missing` və şagird rəyi göstərərsə ki,
  kəsrlər problemdir → KaTeX (~250KB). **İndi əlavə etmirik** — mobil bundle
  bahadır və problem hələ ölçülməyib.

## Tapıntı 3b — addım sayı çətinlikdən asılı deyil

Ölçüldü (DB, n=7): **4, 4, 3, 4, 4, 4, 4** — yeddidən altısı **4 addım**.
`2x + 6 = 20` üçün də 3 addım. Sxem 2–6-ya icazə verir, model isə praktikada seçmir.

Kök səbəb promptun öz tarixçəsində yazılıb:
*«Kök səbəb qaydada deyil, **nümunədə** idi... modellər qaydadan çox nümunəni təqlid edir»*
(v2→v3 dərsi). Promptda **bir** nümunə var və o, 3–4 addımlıdır.

### Qərar — prompt v8, mexaniki forma

1. **İki nümunə** əlavə olunur: biri **2 addımlıq sadə** məsələ, biri **6 addımlıq
   mürəkkəb** məsələ. Nümunə qaydadan güclüdür — bunu iki dəfə ölçmüşük.
2. Mexaniki qayda: model əvvəlcə məsələnin tələb etdiyi **riyazi keçidlərin sayını**
   müəyyən edir, addım sayı **həmin say + yoxlama addımı** olur.
   «Uyğun say seç» kimi məna tələbi yazılmır — sayılan şey verilir.
3. Açıq qadağa: **addım sayını doldurmaq üçün süni addım əlavə etmə.**
   İki keçid kifayətdirsə, cavab 2 addımdır (yoxlama daxil).

Ölçmə: `BULK-EVAL.md` mətn dəstində addım sayının **paylanmasına** bax.
Hədəf: çətinlik üzrə yayılma, tək dəyərdə yığılma yox. Hazırkı vəziyyət
(6/7 → 4) baza xəttidir.
