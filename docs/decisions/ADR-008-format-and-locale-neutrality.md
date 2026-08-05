# ADR-008 — Format və dil neytrallığı

**Status:** Qəbul edilib
**Tarix:** 2026-08-05
**Dəyişdirir:** `docs/STEP-SCHEMA.json` · `prompts/solve-step.md` · `docs/DATA-MODEL.md`
**Düzəldir:** `ADR-006`, `ADR-007` — hər ikisi DİM formatına həddindən artıq bağlanmışdı

## Problem 1 — DİM formatına sürüşmə

İlk 10 real şəkil DİM test toplusundan gəldi və prompt ona uyğunlaşmağa başladı:
"A/B/C/D variantları", "çap olunmuş məsələ nömrəsini mütləq axtar".

**Bu, səhv ümumiləşdirmədir.** Şagird istənilən mənbədən şəkil çəkə bilər:

- variantsız məsələ (açıq cavab)
- 4, 5, 6 və ya başqa sayda variant
- variant etiketləri: `A B C D E` / `А Б В Г Д` (kiril) / `1 2 3 4` / `a) b) c)`
- nömrəsiz məsələ (dərslik mətnində, iş vərəqində)
- "Məsələ 5", "Sual 12", "№ 7" kimi fərqli identifikator formaları

Format qaydası **sayılmamalı, təsvir edilməlidir**: *"variantlar varsa — neçə olursa olsun,
etiketi nə olursa olsun — hamısını oxu."*

## Problem 2 — dil sahə adlarında və enum dəyərlərində

Hazırda riyaziyyat + Azərbaycan dilinə fokuslanırıq, amma rus/ingilis/türk və digər fənlər
gələcək. Sxemdə üç yerdə dil sərtləşdirilib:

| sahə | indiki | problem |
|---|---|---|
| `subject` | `riyaziyyat` \| `fizika` \| `kimya` | enum dəyəri Azərbaycancadır |
| `reason_az` | sahə adının içində dil | türk istifadəçi üçün `reason_tr` yaratmaq absurddur |
| `topic_code` | `ALG.KVADRAT_TENLIK` | kod Azərbaycancadır |

**Halbuki düzgün nümunə sxemin özündə var:** `error_code` ingiliscədir (`SIGN_LOST`),
Azərbaycan etiketi isə `$defs.error_code_labels_az`-dadır. Bu ayrım bütün sahələrə tətbiq
edilməlidir.

Bu, indi ucuzdur. DB-də `subject='riyaziyyat'` sətirləri və `reason_az` sütunu ilə Türkiyəyə
çıxmaq — miqrasiya + keş invalidasiyası deməkdir.

## Qərar A — format neytrallığı

**Variantlar.** Prompt sabit hərf siyahısı saymır. Qayda:

> Məsələnin cavab variantları varsa — sayı və etiket sistemi nə olursa olsun — hamısını oxu.
> Düzgün olanı özün müəyyən et. Son addımın `check.input_kind = "choice"`,
> `accept`-ə **həm etiketi, həm dəyəri** yaz.

Variantlar yoxdursa — adi açıq cavab, `input_kind` `number`/`expression`.

**Nömrələmə.** `candidates[].label`:

> Məsələnin yanında identifikator varsa (nömrə, hərf, "Sual 12", "№ 7") onu yaz.
> Yoxdursa kadrda yuxarıdan aşağıya sıra nömrəsini yaz ("1", "2").

**Keş açarı — `ADR-007` düzəlişi.** Orada məsələ nömrəsini "qat-qat güclü açar" adlandırmışdım.
İki səhv var:

1. Real datada **iki fərqli şəkildə eyni "82" nömrəsi** çıxdı (fərqli kitab bölmələri).
   Nömrə tək başına unikal deyil — ən azı **səhifə + nömrə** lazımdır.
2. Nömrəsiz mənbələrdə bu açar ümumiyyətlə yoxdur.

Ona görə açar iyerarxiyası dəyişmir: `canonical_hash` → `numeric_fingerprint` → `embedding`.
Nömrə **yalnız gücləndirici siqnaldır**, əsas açar deyil.

## Qərar B — dil neytrallığı

### Sxem dəyişiklikləri

| köhnə | yeni |
|---|---|
| `subject: riyaziyyat \| fizika \| kimya` | `subject: math \| physics \| chemistry` |
| `reason_az` | `reason` |
| `topic_code: ALG.KVADRAT_TENLIK` | `topic_code: ALG.QUADRATIC_EQUATION` |
| — | `detected_language` (yeni): məsələnin yazıldığı dil |

Yeni `$defs.subject_labels` — UI etiketləri, i18n faylına köçürülür.
`topic_code` konvensiyası: `SAHƏ.MÖVZU`, hər ikisi **ingiliscə, BÖYÜK HƏRFLƏ**.

### Giriş və çıxış dili ayrılır

- `detected_language` — məsələnin **şəkildə yazıldığı** dil (`az`, `ru`, `en`, `tr`, …)
- `locale` (giriş parametri) — izahların **yazılacağı** dil

İkisi fərqli ola bilər: rus məktəbinin şagirdi Azərbaycan dilində izah istəyə bilər.
`canonical` orijinal dildə saxlanılır; `title`/`explanation`/`why`/`hint` `locale`-a görə yazılır.

### `error_code` dəyişmir

Artıq düzgün qurulub. Yeni fənlər **kod əlavə edir**, mövcudları yenidən adlandırmır.
Fizika üçün `UNIT_MISMATCH` və `FORMULA_MISAPPLIED` onsuz da uyğundur.

## Sonraya saxlanılan, amma indi qeyd edilən üç tələ

Bunlar Faza 1-də kodlaşdırılacaq — indi yazılır ki, unudulmasın.

**1. Kiril/Latın homoqlifləri.** Rus testində variantlar `А Б В Г` ola bilər. Kiril `А` (U+0410)
və Latın `A` (U+0041) **eyni görünür, fərqli koddur**. Şagird Latın `A` yazsa, kiril `А` ilə
uyğunlaşmayacaq. `accept` müqayisəsi normallaşdırma tələb edir.

**2. Onluq ayırıcı.** Azərbaycan/rus/türk vergüldür (`2,5`), ingilis nöqtədir (`2.5`).
Real şəkillərdə `E) 2,5` və `D) 4,5` göründü. `accept` hər iki formanı qəbul etməlidir.

**3. Riyazi işarələmə dilə görə dəyişir — keş açarına təsir edir.**
`tg`/`ctg` (rus və Azərbaycan ənənəsi) ilə `tan`/`cot` (ingilis) **eyni funksiyalardır**.
Real şəkillərdə hər ikisi var. `canonical` normallaşdırması bunları eyni forma gətirməlidir,
yoxsa eyni məsələ iki fərqli keş sətri yaradır.
Eyni problem: `sin²x` vs `sin^2 x`, `≤` vs `<=`, `∅` vs `{}`.

## Nəticələr

**Müsbət:** yeni dil əlavə etmək i18n faylı + prompt parametridir, sxem/DB miqrasiyası deyil.
Yeni fənn `subject` enum-una bir dəyər əlavə etməkdir.

**Mənfi:** indi `fixtures.jsonl`, `golden-set.jsonl` və promptda `subject` dəyərləri yenilənməlidir.
Kiçik, birdəfəlik iş.

**Ölçüləcək:** `detected_language` real şəkillərdə düzgün doldurulurmu — çoxdilli bazara
keçməzdən əvvəl bilmək lazımdır.
