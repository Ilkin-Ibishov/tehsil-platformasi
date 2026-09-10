# Taksonomiya Triyaj Hesabatı — 2026-09-10

> Mənbə: `public.v_taxonomy_review` · Cəmi baxış gözləyən kod sayı: **27**

## 1. Domen İcmalı

| Domen | Say | Nümunələr |
|---|---|---|
| **ALG** | 15 | `ALG.INVERSE_PROPORTIONALITY`, `ALG.LINEAR_FUNCTION`, `ALG.FUNCTION_GRAPH`... |
| **ARITH** | 2 | `ARITH.ADDITION`, `ARITH.SQUARE_ROOT` |
| **GEO** | 8 | `GEO.TRIANGLE_ANGLES`, `GEO.VECTORS`, `GEO.INSCRIBED_CIRCLE`... |
| **LOGIC** | 1 | `LOGIC.CIPHER` |
| **VEC** | 1 | `VEC.OPERATIONS` |

## 2. Sinonim və Birləşdirmə Təklifləri (Merges / Aliases)

| Uydurulmuş Kod | Kanonik Hədəf | Səbəb |
|---|---|---|
| `ARITH.SQUARE_ROOT` | **`ALG.RADICALS`** | Kökaltı əməliyyatlar üçün ALG.RADICALS kanonikdir (və ya ARITH.SQUARE_ROOT sadə hesablamalara aid edilir). |
| `VEC.OPERATIONS` | **`GEO.VECTORS`** | DİM proqramında vektorlar həndəsənin tərkib hissəsidir; GEO prefiksi vahidləşdirilməlidir. |
| `GEO.SOLID_CONE_VOLUME` | **`GEO.CONE_VOLUME`** | GEO.CONE_VOLUME qısa və standartdır; təkrardır. |

## 3. Prefiks / Domen Ziddiyyətləri

- **VEC vs GEO domain mismatch**: `VEC.OPERATIONS`, `GEO.VECTORS` ➔ GEO.VECTORS altında birləşdirilsin.

## 4. Təsdiq və Qəbul Planı (Adoptions)

| Kod | Təklif Olunan Azərbaycan Adı | Kateqoriya |
|---|---|---|
| `ALG.INVERSE_PROPORTIONALITY` | **Tərs mütənasiblik** | topic |
| `ALG.LINEAR_FUNCTION` | **Xətti funksiya** | topic |
| `ALG.FUNCTION_GRAPH` | **Funksiyanın qrafiki** | topic |
| `ARITH.ADDITION` | **Sadə toplama** | topic |
| `ALG.FUNCTIONS` | **Funksiyalar və qrafiklər** | topic |
| `ALG.QUADRATIC_FUNCTION` | **Kvadratik funksiya** | topic |
| `ALG.PARABOLA_VERTEX` | **Parabolanın təpə nöqtəsi** | topic |
| `ALG.EXPONENTS` | **Qüvvət və xassələri** | topic |
| `ALG.FUNCTION_RANGE` | **Funksiyanın qiymətlər çoxluğu** | topic |
| `ALG.SEQUENCES` | **Ardıcıllıqlar** | topic |
| `GEO.TRIANGLE_ANGLES` | **Üçbucağın bucaqları** | topic |
| `ALG.QUADRATIC_EXTREMUM` | **Kvadrat üçhədlinin ən böyük/ən kiçik qiyməti** | topic |
| `ALG.FACTORING` | **Vuruqlara ayırma** | topic |
| `ALG.ARITHMETIC_PROGRESSION` | **Ədədi silsilə** | topic |
| `ALG.RADICALS` | **Kökaltı ifadələr** | topic |
| `LOGIC.CIPHER` | **Şifrəli məntiq** | topic |
| `GEO.VECTORS` | **Vektorlar** | topic |
| `GEO.INSCRIBED_CIRCLE` | **Daxilə çəkilmiş çevrə** | topic |
| `ALG.WORD_PROBLEM` | **Mətnli cəbr məsələsi** | topic |
| `GEO.CIRCLE_AREA` | **Dairənin sahəsi** | topic |
| `ALG.COMPLEX_NUMBERS` | **Kompleks ədədlər** | topic |
| `GEO.SOLID_GEOMETRY` | **Fəza fiqurları (Stereometriya)** | topic |
| `GEO.CONE_AREA` | **Konusun səthinin sahəsi** | topic |
| `GEO.CONE_VOLUME` | **Konusun həcmi** | topic |
