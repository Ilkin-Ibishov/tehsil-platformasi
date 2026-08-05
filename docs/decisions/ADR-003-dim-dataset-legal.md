# ADR-003 — DİM datasetı və hüquqi mövqe

**Status:** Qəbul edilib (hüquqşünas rəyi ilə yenidən baxılacaq)
**Tarix:** 2026-08-05

## Kontekst

Azərbaycan şagirdləri əsasən DİM (Dövlət İmtahan Mərkəzi) test toplularını işləyirlər.
Bu məsələləri qabaqcadan sistemə yükləmək üç fayda verir:

1. **Determinizm** — təsdiqlənmiş həll hallüsinasiya etmir *(ən dəyərli fayda)*
2. **Latensiya** — 5 saniyə əvəzinə anında
3. **Soyuq start** — Test ekranı və Lent boş doğulmur

Xərc qənaəti dördüncü və ən az əhəmiyyətli faydadır.

## Hüquqi vəziyyət

Azərbaycan Respublikasının "Müəllif hüququ və əlaqəli hüquqlar haqqında" Qanunu (1996,
2021-ə qədər dəyişikliklərlə) qüvvədədir. Müəllif hüququ əsərin yaradılması ilə yaranır və
müəllifin ömrü + 70 il qorunur.

Ayrım:

- Riyazi məsələnin **özü** (fakt, tənlik) — zəif qorunur
- Toplunun **tərtibi** və mətn məsələlərinin **dəqiq ifadəsi** — kolleksiya/ədəbi əsər kimi qorunur

## Qərar

**Qəbul edilən mövqe (təhlükəsiz):**

- Şagird məsələnin şəklini **özü** çəkir
- Sistem daxili indekslə uyğunlaşdırır və **öz həllimizi** qaytarır
- Bazada `canonical` (normallaşdırılmış riyazi ifadə) + `source_ref` (istinad kodu) saxlanılır
- DİM-in **orijinal mətni tətbiqdə göstərilmir** və tam mətn kimi saxlanılmır

**Rədd edilən mövqe (riskli):**

- Test toplusunu tətbiq içində gəzilə bilən məzmun kimi yayımlamaq
- DİM mətnlərini olduğu kimi bazada saxlayıb istifadəçiyə göstərmək

## Nəticələr

- `problems` cədvəlində DİM mətni saxlanılmır — bax `docs/DATA-MODEL.md`
- Import skripti mətni **yalnız hash/fingerprint/embedding çıxarmaq üçün** oxuyur, sonra atır
- Test ekranındakı suallar **öz formulasiyamız** olmalıdır (eyni mövzu, fərqli ifadə)

## Əlavə 2026-08-05 — mətn məsələləri maşınla təsdiqlənə bilmir

`scripts/eval.py` yazılarkən üzə çıxdı: `verify.py` `final_answer.values`-i yalnız `canonical`-da
tənlik olduqda yoxlaya bilir. `word_problem` tipində tənlik yoxdursa `None` (yoxlanıla bilmədi)
qaytarır.

**Eval üçün problem deyil** — golden set-də insanın yazdığı `final_answer_values` var, müqayisə ona
görə aparılır.

**DİM import üçün problemdir.** Orada insan ground truth-u yoxdur. Yəni:

| məsələ tipi | əvvəlcədən hesablanmış həll | mövqe |
|---|---|---|
| `formula` | sympy təsdiqləyir | `verified=true` → göstərilir |
| `word_problem` | **maşınla təsdiqlənə bilmir** | `verified=false` → göstərilmir, canlı LLM-ə gedir |

Nəticələr:

1. DİM toplusunun mətn məsələləri hissəsi **avtomatik import edilə bilməz** — ya nümunə əsasında
   insan yoxlamasından keçməli, ya da keşə düşməməlidir. Bu, import işinin həcmini dəyişir.
2. Alternativ: import zamanı mətn məsələsindən **tənlik çıxarmaq** (LLM ilə), onu `canonical`-a
   `$...$` içində əlavə etmək — onda sympy yoxlaya bilir. Amma tənliyin özü LLM çıxışıdır, yəni
   yoxlama dairəvi olur. **Bu variant seçilərsə, ayrıca ADR tələb edir.**
3. Faza 2-də `solutions.verification_method` sahəsi `sympy` / `human` / `none` ayrımını onsuz da
   saxlayır — sxem hazırdır, qərar yoxdur.

**Qərar verilməyib.** DİM import işinə başlamazdan əvvəl həll edilməlidir.

## Açıq məsələlər

- [ ] Miqyaslanmadan əvvəl 1 saatlıq hüquqşünas rəyi (ucuzdur, gecikdirmə)
- [ ] **DİM ilə rəsmi lisenziya danışığı** — alınsa kopyalana bilməyən üstünlükdür.
      Ən azı bir e-poçt göndərməyə dəyər.

## Pulsuz və təhlükəsiz mənbə

dim.gov.az rəsmi **imtahan proqramlarını** PDF kimi yayımlayır — bunlar rəsmi sənədlərdir və
mövzu taksonomiyası (`topic_code`) üçün ideal mənbədir:

- Riyaziyyat 9: `https://dim.gov.az/CkImage/Riyaziyyat_9_2026_Az_1758261870.pdf`
- Riyaziyyat 11: `https://dim.gov.az/CkImage/Riyaziyyat_11_2026_Az_1758262038.pdf`

Valideyn hesabatındakı `MÖVZULAR` bölməsinin skeleti bunlardan qurulur.
