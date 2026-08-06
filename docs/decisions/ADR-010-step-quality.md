# ADR-010 — Addım keyfiyyəti: variant seçimi çıxarışı əvəz edə bilməz

**Status:** Qəbul edilib
**Tarix:** 2026-08-06
**Dəyişdirir:** `prompts/solve-step.md` (v6) · `ADR-001` HÖKM · `ADR-004` (avtomatik yoxlama zəifliyi)

## Nəticə — pedaqoji qapı KEÇMİR

`ADR-004` B hissəsi (insan rəyi) nəhayət ölçüldü. 10 real həll, sual:
*"Bu bölgü ilə şagird məsələni özü həll edə bilərmi?"*

| | |
|---|---|
| **6/10 = 60%** | qapı **≥75%** ❌ |

Nəticə: `evals/results/human-review-2026-08-06.jsonl`

**Bu, Faza 1-i bloklamır** — boru xətti işləyir, app qurula bilər. Amma **şagirdlər
istifadə etməzdən əvvəl prompt düzəlməlidir**, çünki hazırkı forma məhsulun əleyhinə işləyir.

## İki pozucu nümunə

### 1. Variant seçimi çıxarışı əvəz edir — `c03`, `c06`, `c09`

Məsələdə A–E variantları olanda model addımı **"hansı variant düzgündür?"**-a çevirir:

```
c03 · addım 2: "Alınan tərs funksiya hansı variantdadır?"        → D
c06 · addım 3: "Hansı variant düzgün köklər çoxluğunu göstərir?" → C
c09 · addım 4: "Düzgün cavab variantı hansıdır?"                 → D
```

`c03`-də bu, **məsələnin bütün riyaziyyatını** (loqarifm tətbiqi + dəyişən dəyişməsi)
bir tanıma aktına yığır. Şagird çıxarmır — **variantlara baxıb tanıyır.**

Bu, tam olaraq məhsulun mövcudluq səbəbinə ziddir. `CLAUDE.md` qızıl qaydası:
*rəqiblər cavab verir, biz harada ilişdiyini deyirik.* Variant seçdirən addım
rəqiblərin etdiyi şeydir, üstəlik daha pis formada — çünki biz onu "öyrənmə" adlandırırıq.

### 2. Son addım "yoxlama" adlanır, amma yoxlamır — `c07`, `c09`, `c10`

```
c07 · "İfadənin qiymətini yoxla"  → x−√x nədir?     ← sonuncu hesablama, yoxlama deyil
c09 · "...hesabla və yoxla"       → hansı variant?   ← variant axtarışı
c10 · "Nəticəni yoxla"            → 0,3 neçə faizdir? ← VAHİD ÇEVİRMƏSİ
```

`c10` xüsusilə aydındır: `0.3 → 30%` cavabı **heç nə yoxlamır**. Nəticəni təsdiqləmir,
sadəcə başqa formada yazır.

## Ən vacib nəticə — avtomatik yoxlama YANLIŞ MÜSBƏT verdi

`steps_compare.ends_with_verification` bu üç halın **hamısını keçirdi**. Səbəb:
açar-söz axtarışı (`"yoxla"` başlıqda var) və `error_code == SUBSTITUTION_SKIPPED`.
Model hər ikisini yerinə yetirir — **etiketi düzgün qoyur, işi görmür.**

Struktur **10/10** dedi, pedaqogika **6/10**.

Bu, `ADR-004`-dəki qərarı təsdiqləyir: *"hələ 'yaxşı bölgü'nün operativ tərifi yoxdur,
tərifi olmayan şeyi ölçən avtomat qurmaq səhv cavabı daha sürətli almaqdır."*
Avtomatik yoxlama tək qalsaydı, bu qüsur **görünməz** olardı və şagirdlərə çatardı.

## Qərar — prompt v6

Üç qayda əlavə olunur:

**1. Heç bir addımın `check`-i variant seçimi ola bilməz.**
Hər `check` hesablanmış dəyər istəyir. Variantlar yalnız `final_answer.choice`-dadır
(`ADR-009`) və addım sualı olaraq **heç vaxt** işlədilmir.
Variantlı məsələdə də şagird cavabı **çıxarır**, sonra variantla tutuşdurur — əksi yox.

**2. Yoxlama addımı ilkin şərtə qayıtmalıdır.**
Tapılan nəticə **ilkin məsələyə yerinə qoyulur** və gözlənilən nəticəni verdiyi göstərilir.
Qəbul edilmir: sonuncu hesablama, vahid çevirməsi, cavabın başqa formada yazılışı,
variant axtarışı.
`c08` düzgün nümunədir: `m=7 → D=25−28=−3`, mənfi diskriminant kompleks kökü təsdiqləyir.

**3. Düsturu sualın içində vermə.**
Pis: *"Əlverişli halların sayı (3!×3!) neçədir?"* — məsələnin bütün fikri mötərizədədir.
Yaxşı: *"Neçə əlverişli düzülüş var?"*
`why` sahəsi düsturun səbəbini izah edir; `check.ask` onu **hədiyyə etmir**.

## Ölçmə — növbəti dəfə

v6-dan sonra eyni 10 məsələ yenidən qiymətləndirilir. Hədəf **≥8/10**.
İnsan rəyi `ADR-004`-ə görə avtomatlaşdırılmır.

Əlavə olaraq `steps_compare`-ə **ucuz mənfi yoxlama** əlavə edilə bilər (Claude Code, sonra):
`check.ask` mətnində variant hərfi soruşulursa (`"hansı variant"`, `"variantlardan"`) →
struktur şərti sınır. Bu, insan rəyini əvəz etmir, yalnız ən kobud halı avtomatik tutur.

## Qeyd

Pedaqoji uğursuzluqlar `final_answer.values`-də hərf qaytaran hallarla **üst-üstə düşür**
(`c03`, `c06`, `c09`). Eyni kök: model variant hərfini riyazi cavabla eyni səviyyədə görür.
`ADR-009` bunu çıxışda ayırdı; `ADR-010` addımların içində ayırır.
