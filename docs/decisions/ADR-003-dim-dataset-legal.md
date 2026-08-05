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
