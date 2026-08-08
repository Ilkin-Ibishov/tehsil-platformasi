# DİM korpusu — mənbə araşdırması və plan

> `ADR-016`-nın icra sənədi. Araşdırma: 2026-08-08, Cowork.
> **Status:** mənbə tapıldı, bir naməlum qalıb (aşağıda «Qərar nöqtəsi»).

## Mənbə — `dim.gov.az`, PDF, **mətn qatı VAR**

Yoxladım: `https://dim.gov.az/CkImage/buraxilish_2_03_25_1740979917.pdf`
→ **62 764 simvol təmiz mətn** çıxdı. Skan deyil. Vision LLM **lazım deyil** (şərtlə, aşağıya bax).

İki növ fayl var və ikisi də lazımdır:

| növ | nə var | nümunə |
|---|---|---|
| **«İzahlı test tapşırıqları»** | sual mətni · A–E variantları · `Alt-standart` kodu · **tam izah** · doğru cavab | `buraxilish_2_03_25_*.pdf` |
| **«Etalonlar»** | yalnız cavab açarı, fənn/variant üzrə cədvəl | `Etalon_sinaq_bak_2025_*.pdf` |

İzahlı fayl **daha dəyərlidir** — cavab onsuz da içindədir.

### Çıxarılan strukturun nümunəsi

```
Choose the pair of nouns in the singular.
A) balls, island   B) window, glasses   C) meal, flower
D) umbrella, monkeys   E) tools, gift
Alt-standart: 8-3.1.1. Söz və ifadələri qrammatik-semantik xüsusiyyətlərinə görə fərqləndirir.
Bölmə: İsim
İzah: … doğru cavabı "meal, flower" isimlərinin qeyd olunduğu bənddir.
A variantı 8 saylı test tapşırığı · B variantı 16 saylı …
```

Yəni parse üçün **stabil markerlər** var: `Alt-standart:`, `Bölmə:`, `İzah:`,
`<X> variantı <N> saylı test tapşırığı`.

## Gözlənilməyən qazanc — `Alt-standart` hazır taksonomiyadır

Bizim `topic_code`-larımız **özümüzün uydurduğumuzdur** (`ALG.QUADRATIC_EQUATION`).
DİM-in `Alt-standart` kodu (`8-3.1.1`) **rəsmi kurikulum kodudur** — məktəbin, müəllimin
və valideynin tanıdığı kod.

Bu, valideyn hesabatı üçün əhəmiyyətlidir: *«övladınız 8-3.1.1 alt-standartında
çətinlik çəkir»* məktəb dili ilə danışmaqdır, bizim uydurduğumuz koddan güclüdür.

**Təklif:** `problems`-ə `dim_substandard` sütunu əlavə olunsun. Bizim `topic_code`
qalsın (fənn-neytraldır, `ADR-008`), DİM kodu **paralel** saxlanılsın.
Əvəz etmə — Faza 2-də fizika/kimya və digər mənbələr gələndə bizim kod lazım olacaq.

## Scraping — URL-lər təxmin edilə bilmir

Fayl adlarında **unix timestamp** var (`_1740979917`, `_1742207087`).
Yəni URL qurmaq mümkün deyil — **xəbərlər bölməsi crawl edilməlidir**:

```
dim.gov.az/az/metbuat/xeberler/  → "…test tapşırıqlarının izahı və düzgün cavabları"
                                 → səhifədəki PDF linkləri
```

Hər imtahan tarixi üçün bir elan var. Crawl → link → PDF → parse.

## Qərar nöqtəsi — DÜSTURLAR mətn çıxarışından necə keçir

**Bu, yeganə həll olunmamış naməlumdur və hər şeyi müəyyən edir.**

Yoxladığım fayl **ingilis dili** imtahanı idi — düsturu yoxdur. Riyaziyyat PDF-ində
kəsr, kök və üst indeks mətn çıxarışında adətən **pozulur**: `(x−1)/3` ayrı-ayrı
mətn bloklarına düşür və `x 1 3` kimi çıxır.

**Əvvəlcə bir riyaziyyat faylını sına, sonra boru xətti qur.**

| nəticə | yol | qiymət |
|---|---|---|
| Düsturlar oxunaqlıdır | `pdftotext` + parse | **$0** |
| Düsturlar pozulur | səhifə şəkli → vision LLM | aşağıya bax |

**Vision fallback ucuzdur** və bu, vacib rəqəmdir:
bir səhifədə ~10–15 məsələ var, səhifə başına ~$0.018 →
**məsələ başına ~$0.0015**. 3000 məsələ ≈ 250 səhifə ≈ **~$4.50**.

Yəni ən pis halda da korpus **birrəqəmli dollardır**. Bu qərar büdcə məsələsi deyil,
yalnız keyfiyyət və vaxt məsələsidir.

## Sıra — Ilkinin qərarı: **əvvəlcə şagirdlər**

Korpus **paralel** gedir, şagirdləri bloklamır.

1. S4/S5 telefonda təsdiqlənir → 15–20 şagird dəvət olunur → retensiya ölçülür
2. Paralel: bir riyaziyyat PDF-i sınanır (yuxarıdakı qərar nöqtəsi)
3. Parse boru xətti + 50–100 məsələ yüklənir → **uyğunlaşdırma sınağı**
   (`canonical_hash` vs `numeric_fingerprint` — `ADR-016`)
4. Uyğunlaşdırma işləyirsə tam korpus
5. Dəqiqlik qapısı n≥300 (`ADR-001` ilk dəfə həqiqətən ölçülür)

**Həlləri kütləvi generasiya etmə** — `ADR-016`, pedaqoji ox 4/10-dur.

## Mənbələr

- https://dim.gov.az/az/metbuat/xeberler/2-mart-2025-ci-il-tarixinde-kecirilmis-buraxilis-imtahaninda-istifade-olunan-test-tapsiriqlarinin-izahi-ve-duzgun-cavablari
- https://dim.gov.az/CkImage/buraxilish_2_03_25_1740979917.pdf (izahlı, mətn qatı var)
- https://dim.gov.az/CkImage/Etalon_sinaq_bak_2025__1742207087.pdf (etalonlar)
- https://dim.gov.az/CkImage/Riyaziyyat_11_2026_Az_1758261870.pdf (proqram — `topic_code` uyğunlaşdırması üçün)
