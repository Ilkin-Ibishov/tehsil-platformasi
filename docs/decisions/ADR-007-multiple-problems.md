# ADR-007 — Bir kadrda bir neçə məsələ: kəsmə + seçim, imtina yox

**Status:** Qəbul edilib
**Tarix:** 2026-08-05
**Dəyişdirir:** `ADR-006` → `multiple_problems` davranışı · `docs/STEP-SCHEMA.json` ·
`prompts/solve-step.md` · `design/Kamera.dc.html` (yeni ekran)

## Kontekst

Test toplularında məsələlər 1–2 sm aralıdadır. Şagird telefonu kitaba tutanda kadra
**demək olar həmişə 2–4 məsələ düşəcək**. Bu, istisna hal deyil — **normadır**.

`ADR-006` bu hal üçün `status: multiple_problems` → "Bir məsələni çərçivəyə sal" → **yenidən çək**
yazmışdı. **Bu qərar səhvdir:**

- Şagird şəkli çəkib, ~7 saniyə gözləyib, həll əvəzinə "yenidən çək" alır
- Səbəb onun səhvi deyil — UI ona bir məsələni seçmək imkanı verməyib
- Şəkil artıq mövcuddur; yenidən çəkdirmək məntiqsizdir
- Normal haldan ötrü cəza vermək istifadəçini itirir

## Sənaye praktikası

Yoxlanıldı — nümunə birmənalıdır: **seçim UI-da, bahalı çağırışdan ƏVVƏL baş verir.**
Heç bir tanınmış tətbiq tam səhifəni modelə verib "hansını nəzərdə tuturdun?" soruşmur.

| tətbiq | mexanizm |
|---|---|
| Photomath | çəkilişdən əvvəl ölçüsü dəyişən çərçivə; sənəddə açıq xəbərdarlıq: kadrda bir məsələ olmalıdır |
| Gauth | OCR məsələni tapıb özü kəsir |
| Ümumi (bir neçə mənbə) | "20 sualı olan tam səhifə çəksən, AI qarışıq və yararsız cavab verir" |

Photomath-ın çəkilişdən **əvvəlki** çərçivəsinin zəif yeri: telefonu kitab üzərində sabit tutub
çərçivə küncünü dəqiq sürüşdürmək çətindir — xüsusən 12–15 yaşlı istifadəçi üçün.

## Qərar — üç qat

### Qat 0 — çəkiliş çərçivəsi *(mövcuddur)*

`design/Kamera.dc.html`: "Bir tənliyi çərçivənin içinə sal." Saxlanılır, amma kifayət deyil.

### Qat 1 — çəkilişdən SONRA kəsmə *(yeni ekran, əsas mexanizm)*

Şəkil çəkilir və **dondurulur**. Şagird sakit halda kəsmə çərçivəsini sürüşdürür, təsdiqləyir.
Yalnız kəsilmiş hissə serverə gedir.

- klient tərəfdə → **pulsuz, ani, geri qaytarıla bilən**
- kəsilmiş şəkil kiçikdir → **API xərci və latensiya düşür**, dəqiqlik artır
- əl titrəməsi problemi yoxdur (şəkil artıq donub)

Halların böyük əksəriyyətini bu qat həll edir.

### Qat 2 — model seçim siyahısı qaytarır *(imtina deyil)*

Kəsməyə baxmayaraq kadrda bir neçə məsələ qalıbsa, model **həll etmir** — gördüklərinin
qısa siyahısını qaytarır (`status: multiple_problems` + `candidates[]`). UI seçim göstərir,
şagird toxunur, **ikinci çağırış yalnız seçiləni həll edir**.

```
Hansını həll edim?
  Sual 14 · x² − 5x + 6 = 0
  Sual 15 · Bir avtomobil 60 km/saat sürətlə...
  heç biri — yenidən kəs
```

### Qat 3 — `candidates` çıxarıla bilmirsə

Kəsmə ekranına qayıt, şəkil saxlanılır. **Heç bir mərhələdə yeni şəkil istənilmir.**

## Xərc — iki çağırış 2x demək deyil

Aşkarlama və həll **eyni çağırışdadır**:

```
bir çağırış → məsələ tək və aydındır  → HƏLL ET, bitdi        (adi hal: 1 çağırış)
            → bir neçəsi var          → həll etmə, siyahı qaytar
                                          ↓ şagird seçir
                                        2-ci çağırış: yalnız seçilən
```

Adi halda əlavə xərc **sıfırdır**. İkinci çağırış yalnız qeyri-müəyyən şəkillərdə olur və
birinci çağırışın çıxışı qısadır (siyahı, həll deyil) → ümumi ~1.3x, 2x yox.
Qat 1 (kəsmə) isə xərci **azaldır**, çünki daha az piksel göndərilir.

## Məsələ nömrələri — gözlənilməz fayda

Test topluları məsələləri nömrələyir. `candidates[].label` bu nömrəni saxlayır.

1. **UI-da:** "Sual 14" kəsilmiş mətn parçasından qat-qat aydındır — şagird onsuz da hansı
   nömrədə olduğunu bilir.
2. **Keş açarı kimi:** "DİM 2025 · 9-cu sinif · variant 3 · sual 14" bulanıq hash-dan
   **qat-qat güclü açardır**. `ADR-003`-dəki DİM import planı üçün bu, gözləniləndən yaxşı
   xəbərdir — mətn məsələlərinin maşınla təsdiqlənə bilməməsi problemini qismən yumşaldır,
   çünki uyğunlaşdırma nömrə ilə dəqiqləşir.

## Limit qaydası — indi yazılır, yoxsa unudulur

**İmtina, seçim ekranı və kəsmə gündəlik pulsuz həll limitindən SAYILMIR.**
Yalnız şagirdə çatdırılmış həll sayılır.

Şagird oxunmayan şəkilə və ya seçim ekranına görə 5 pulsuz həllindən birini itirsə,
tətbiqi silər. Bu, texniki deyil, məhsul qərarıdır və `DATA-MODEL.md`-dəki
`attempts` cədvəlinə təsir edir: limit sayğacı `completed = true` üzərində işləməlidir.

## Sxem dəyişikliyi

`candidates` massivi əlavə olunur — yalnız `status: multiple_problems` olduqda doldurulur.

```
candidates: [
  { "label": "14", "preview": "x^2-5x+6=0" },
  { "label": "15", "preview": "Bir avtomobil 60 km/saat..." }
]
```

`label` — səhifədə çap olunmuş nömrə; görünmürsə sıra nömrəsi ("1", "2").
`preview` — ≤60 simvol, şagirdin tanıması üçün. **maxItems: 5** — daha çoxu seçim ekranını
oxunmaz edir; 5-dən çox məsələ varsa kəsmə ekranına qaytarılır.

## Rədd edilən alternativlər

- **Modelin bounding box qaytarması, UI-da toxunulan sahələr.** Vision modellər dəqiq
  koordinat verməkdə zəifdir; ayrıca layout aşkarlama modeli isə Faza 1 üçün artıq mürəkkəblikdir.
  Nömrə + mətn parçası koordinatsız işləyir və kifayətdir.
- **Hamısını həll et, şagird baxsın.** Xərci məsələ sayına vurur, limiti yandırır,
  və şagirdə lazım olmayan həlləri göstərir.
- **Heuristik "mərkəzdəkini seç"** (`ADR-006`-nın ilkin variantı). Səhv təxmin = itirilmiş
  həll + çaşqınlıq. Seçim ucuzdur, təxmin bahalıdır.

## Nəticələr

**Müsbət:** normal hal cəzalandırılmır; xərc adi halda artmır, hətta azalır; nömrə ilə
uyğunlaşdırma keşi gücləndirir.

**Mənfi:** yeni ekran (kəsmə) və yeni ekran vəziyyəti (seçim) lazımdır — Faza 1-in həcmi artır.
Bu, qəbul edilən artımdır: kəsmə ekranı olmadan MVP real test toplusunda işləməyəcək.

**Ölçüləcək:** neçə faiz şəkil kəsmədən sonra da `multiple_problems` verir. Yüksəkdirsə
(>20%) kəsmə ekranının defolt çərçivəsi çox genişdir.
