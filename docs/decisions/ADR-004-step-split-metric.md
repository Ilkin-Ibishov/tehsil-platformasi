# ADR-004 — Addım bölgüsü metrikası

**Status:** Qəbul edilib
**Tarix:** 2026-08-05
**Dəyişdirir:** `docs/PRODUCT.md` → Faza 0 qapısı · `evals/README.md` → metrika cədvəli

## Kontekst

İlk canlı testdə (DeepSeek `deepseek-chat`, prompt v2, 3 fixture) nəticələr:

| metrika | nəticə |
|---|---|
| Sxem validliyi | 3/3 |
| Cavab sızması | 0/3 |
| Son cavab dəqiqliyi | 2/2 |
| **Addım bölgüsü** | **1/3** |

`steps_compare.py` başlıqları mövqe-mövqe **Jaccard söz üst-üstə düşməsi** ilə müqayisə edir
(hədd 0.3). Bu ölçmə iki səviyyədə sınıqdır:

**1. Dil səviyyəsində.** Azərbaycan dili aqlütinativdir. `vuruq` / `vuruqlara` / `vuruqları`
Jaccard üçün fərqli tokenlərdir. Model semantik olaraq eyni başlığı yazsa belə, şəkilçi
fərqi metrikanı sındırır. Heuristika ingilis dili üçün uyğundur, Azərbaycan dili üçün yox.

**2. Fərziyyə səviyyəsində — daha ciddi.** `expected_step_titles` **bir** bölgünü "yeganə doğru"
elan edir. `fx-002` (`x²+2x−8=0`) üçün golden set vuruqlara ayırma gözləyir; model diskriminant
düsturunu seçibsə, bu **səhv deyil** — başqa, tamamilə düzgün yanaşmadır. Metrika modeli
pedaqoji cəhətdən düzgün, amma fərqli qərara görə cəzalandırır.

Yəni `1/3` böyük ehtimalla **metrikanın artefaktıdır**, modelin uğursuzluğu deyil.
(Dəqiq deyə bilmirik, çünki `evals/results/*.json` modelin xam çıxışını saxlamır — bax ClickUp
`86eyhnap2`. Bu, diaqnostikanı iki dəfə bloklayıb.)

## Qərar

Addım bölgüsü **iki hissəyə ayrılır**.

### A. Struktur yoxlaması — avtomatik, qapının bir hissəsi

Yalnız obyektiv, mübahisəsiz şərtlər. `steps_compare.py` bunları yoxlayır:

| şərt | səbəb |
|---|---|
| addım sayı 2–6 arasındadır | sxem tələbi; 6-dan çoxdursa məsələ bölünməlidir |
| hər addımda `check` var | `check`-siz addım məhsulun fərqini itirir |
| `index` ardıcıldır (1, 2, 3…) | UI addımları sıra ilə göstərir |
| son addım yoxlama addımıdır | `error_code = SUBSTITUTION_SKIPPED` və ya `check` ilkin ifadəyə istinad edir |
| `error_code`-lar tamamilə eyni deyil | model hamısına eyni kod yazırsa, taksonomiya işləmir |

**Qapı: 100%.** Bunlar keçilməzsə çıxış istifadəyə yararsızdır.

### B. Pedaqoji məntiq — insan rəyi, qapının ikinci hissəsi

`n=30`-da hər bölgüyə baxılır və bir sual verilir:

> **Bu bölgü ilə şagird məsələni özü həll edə bilərmi?**

Bəli / Xeyr. Ara qiymət yoxdur.

**Qapı: ≥75%.** (Əvvəlki rəqəm saxlanılır, yalnız ölçmə üsulu dəyişir.)

Nəticə `evals/results/human-review-<tarix>.jsonl` faylına yazılır — hər sətir `{id, verdict, note}`.

## Niyə avtomatlaşdırılmır

Hələ "yaxşı bölgü"nün operativ tərifi yoxdur. Tərifi olmayan şeyi ölçən avtomat qurmaq —
səhv cavabı daha sürətli almaqdır. `n=30` üçün əl ilə baxış ~15 dəqiqədir və nisbətsiz dərəcədə
etibarlıdır.

**Bu iş boşa getmir:** 30 insan qərarı **etiketlənmiş ilk dəstdir**. Gələcəkdə avtomatik hakim
(embedding və ya LLM-judge) qurmaq istəsək, onu yoxlamaq üçün istinad datası artıq olacaq.
Ardıcıllıq düzgündür: əvvəlcə insan qərarı, sonra onu təqlid edən avtomat — əksi yox.

## Rədd edilən alternativlər

- **Jaccard-ı kök müqayisəsi ilə düzəltmək** — dil problemini həll edir, "doğru bölgü bir dənədir"
  fərziyyəsini yox. Daha dəqiq səhv cavab.
- **LLM-hakim** — LLM-i LLM-lə qiymətləndirib layihəni bağlayan qərarı ona tapşırmaq. Hakimi kimin
  yoxladığı sualı açıq qalır. Həcm olanda yenidən baxıla bilər.
- **Qapıdan tamamilə çıxarmaq** — ən təhlükəlisi. Addım bölgüsü **məhsulun özüdür**; son cavab
  rəqiblərin də etdiyi şeydir. Ölçülməsə qapı mənasızlaşır.

## Əlavə 2026-08-05 — `ends_with_verification` 1/3 keçdi: prompt dəyişdi, metrika yox

Struktur yoxlaması işə salınan kimi real model çıxışında `ends_with_verification` **1/3** verdi
(`error_codes_distinct` isə 2/3). Sual: metrika çox sərtdir, yoxsa prompt natamamdır?

**Qərar: prompt dəyişdi (v3), metrika olduğu kimi qaldı.**

Səbəb — yoxlama addımı **məhsulun dizayn tələbidir**, metrikanın kaprizi deyil. Üç müstəqil sübut:

1. `design/Həll ekranı v5.dc.html` — təsdiqlənmiş maket `ADDIM 04/04 · Kökləri yoxla` ilə bitir
2. `docs/STEP-SCHEMA.json` — `SUBSTITUTION_SKIPPED` ("yoxlama addımını atlayır") enum-da var;
   bu kod yalnız yoxlama addımı MÖVCUDDURSA məna kəsb edir
3. `design/Valideyn hesabatı.dc.html` — hesabatda `YERİNƏQOYMA · 1 dəfə` sətri var

Metrikanı zəiflətmək dizayn edilmiş bir funksiyanı sürüşdürüb yox etmək olardı.

### Kök səbəb qaydada deyil, nümunədə idi

v2 promptunda 8-ci qayda ("son addım yoxlamadır") **yox idi** — bu doğrudur. Amma daha güclü
səbəb: **v2-nin nümunəsi 2 addımla, "Diskriminantı hesabla" ilə bitirdi.** Model qaydadan çox
nümunəni təqlid edir. Nümunə yoxlama addımı olmadan bitirdiyi üçün model də bitirmirdi.

v3: nümunəyə üçüncü addım (`Kökləri yoxla`, `SUBSTITUTION_SKIPPED`) əlavə edildi + qayda 8 və 9.

### Yeni invariant

**Promptdakı nümunə `check_structure()`-dan keçməlidir.** İndi keçir (5/5 şərt).
Bu, dairəvi deyil — nümunə metrikaya uyğun olmalıdır, çünki nümunə modelə "doğru cavab budur"
deyir. Nümunə metrikanı pozursa, model də pozacaq.

Bu invariant reqressiya testi kimi qorunmalıdır — gələcək prompt redaktəsi eyni səhvi təkrarlamasın.

### Qəbul edilən risk

100% yoxlama tələbi modeli **formal, boş yoxlama addımı** əlavə etməyə sövq edə bilər
("Nəticəni nəzərdən keçir"). Buna qarşı iki qoruyucu:
- v3 qaydası yoxlamanın REAL hesablama olmasını tələb edir və pis/yaxşı nümunə verir
- `ADR-004` B hissəsi (insan pedaqoji rəyi) formal addımı tutur

Əgər `n=30`-da hansısa məsələ sinfi üçün yoxlama həqiqətən mümkün olmasa, şərt yenidən
nəzərdən keçirilir — amma **datadan sonra**, ehtimaldan yox.

## Nə vaxt yenidən baxılır

Minlərlə həll toplananda (Faza 2 sonrası). O zaman 30+ insan qərarı istinad dəsti kimi
mövcud olacaq və avtomatik hakimin onunla nə qədər üst-üstə düşdüyü ölçülə biləcək.
