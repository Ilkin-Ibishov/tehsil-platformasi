# ADR-009 — Cavab müqayisəsi: kəsişmə, alt-çoxluq yox

**Status:** Qəbul edilib
**Tarix:** 2026-08-06
**Dəyişdirir:** `docs/STEP-SCHEMA.json` · `prompts/solve-step.md` · `scripts/lib/verify.py`

## Kontekst — model 10/10 həll etdi, harness 3/10 yazdı

İlk tam işlək run (`gemini-3.6-flash`, kəsilmiş dəst, n=10): sxem **10/10**,
struktur **10/10**, son cavab **3/10**.

Xam çıxışa baxanda 3/10-un ölçmə səhvi olduğu göründü:

| id | golden | model | həqiqət |
|---|---|---|---|
| c01 | `["0"]` | `["0", "B", "b"]` | doğru |
| c04 | `["-3"]` | `["-3", "D", "d"]` | doğru |
| c07 | `["12"]` | `["12", "A", "a"]` | doğru |
| c09 | `["2/3"]` | `["D", "d", "2/3"]` | doğru |
| c05 | `["30","pi/6"]` | `["pi/6", "\pi/6", "30°", "30"]` | doğru |
| c06 | `["pi*n"]` | `["C", "c", "\pi n"]` | doğru (LaTeX forma) |
| c03 | `["log2((x-1)/3)+5"]` | `["D"]` | doğru (yalnız hərf) |

**Model on məsələnin onunu da düzgün həll etmişdi.**

## İki ayrı səhv

### 1. Müqayisə alt-çoxluq tələb edirdi

```python
for mv in model_values:
    if not any(_values_equivalent(mv, gv) for gv in golden_values):
        return False      # ← modelin HƏR dəyəri golden-də olmalıdır
return True
```

`"B"` `"0"`-a uyğun gəlmədiyi üçün bütün müqayisə sınırdı. Halbuki hər iki tərəf
**eyni cavabın alternativ formalarının siyahısıdır** — kəsişmə yoxlanmalıdır.

### 2. `final_answer.values` iki fərqli mənanı daşıyırdı

Sxem bunu heç vaxt dəqiqləşdirməmişdi:

- **komponentlər** — `["3","2"]` = iki fərqli kök, hər ikisi lazımdır
- **alternativ formalar** — `["3/10","0.3"]` = eyni cavab, biri kifayətdir

Promptdakı nümunə birinci mənanı göstərirdi (iki kök), amma model ikinci mənada
işlətdi və üstəlik **variant hərfini də ora qatdı** — çünki `check.accept` üçün
"həm etiketi, həm dəyəri yaz" qaydası var və model onu `final_answer`-ə də şamil etdi.

Bu, mənim spesifikasiyamın qüsurudur: iki fərqli anlayış bir sahədə.

## Qərar

### A. `final_answer.choice` ayrıca sahə

Variant hərfi artıq `values`-ə qarışmır:

```json
"final_answer": { "latex": "...", "values": ["0"], "choice": "B" }
```

Promptda pis/yaxşı nümunə ilə açıq yazıldı. Variantsız məsələdə `choice` yazılmır.

### B. Müqayisə kəsişmə əsaslıdır

`direct_compare(golden_values, model_values)`:

- golden `answer_values_are = "alternate_forms"` (defolt) → **hər hansı** golden dəyəri
  **hər hansı** model dəyəri ilə ekvivalentdirsə → doğru
- golden `answer_values_are = "components"` → **hər** golden komponentinin model dəyərləri
  arasında ekvivalenti olmalıdır (iki kök, üç bucaq və s.)

Golden set-də hansı semantikanın işlədiyi **açıq göstərilir**, təxmin edilmir.

### C. Tək-hərfli dəyərlər müqayisədən çıxarılır

Model köhnə formatda cavab versə belə (geriyə uyğunluq), `values`-dəki tək hərf/rəqəm
etiketləri (`"B"`, `"b"`) süzülür və `choice` kimi qiymətləndirilir.

### D. LaTeX normallaşdırması

`"\pi n"` ilə `"pi*n"` eyni cavabdır. `_normalize` LaTeX komandalarını təmizləməlidir:
`\pi`→`pi`, `\frac{a}{b}`→`(a)/(b)`, `\sqrt{x}`→`sqrt(x)`, `°`→ (dərəcə işarəsi silinir,
`answer_is_root`-la birlikdə vahid məsələsi ayrıca həll olunur).

## Nəticələr

**Müsbət:** metrika nəhayət ölçdüyünü ölçür. `final_answer` semantikası birmənalı olur.

**Mənfi:** golden set-lərə bir sahə də əlavə olunur (`answer_values_are`).

**Öyrənilən:** metrika modelə qarşı **ittiham** kimi oxunmamalıdır. 3/10 gördükdə ilk
sual "model pisdir?" deyil, **"ölçü düzgündürmü?"** olmalıdır. Bu dəfə ölçü səhv idi —
və əgər xam çıxışı saxlamasaydıq (`86eyhnap2`), yanlış nəticə ilə model dəyişməyə
başlayacaqdıq.

## Hələ açıq

`c03`-də model yalnız `["D"]` qaytardı, riyazi ifadəni yox. `choice` sahəsi ilə bu,
`expected_choice`-a qarşı yoxlanacaq — amma **`values` boş qalmamalıdır**. Prompt
indi bunu tələb edir; növbəti run-da yoxlanacaq.
