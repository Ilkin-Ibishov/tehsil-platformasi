# ADR-001 — OCR və həll boru xətti

**Status:** Təklif edilib · Faza 0 nəticəsi ilə təsdiqlənəcək
**Tarix:** 2026-08-05

## Kontekst

Şagird məsələnin şəklini çəkir. Şəkildən istifadə edilə bilən addım sxeminə çatmaq üçün üç ayrı iş var
və onlar tez-tez bir-birinə qarışdırılır:

- **(a)** Düstur → LaTeX
- **(b)** Azərbaycan dilində mətn məsələsi → mətn
- **(c)** Məsələni anlamaq, addımlara bölmək, səhvi adlandırmaq

Xərcin ~95%-i **(c)**-dədir. "Open source OCR ilə AI-ı əvəz etmək" mümkün deyil — open source
yalnız (a)-nı örtür.

## Araşdırma nəticələri

| Seçim | Nəticə | Qərar |
|---|---|---|
| **Texo** — 20M param, ONNX, `transformers.js` ilə brauzerdə | UniMERNet-T ilə eyni dəqiqlik, 80% kiçik, 7x sürətli | ✅ (a) üçün |
| pix2tex / RapidLaTeXOCR | işləyir, amma daha ağır, brauzer üçün uyğun deyil | ⛔ |
| **Tesseract `aze`** | `unicharset`-də **Ə/ə yoxdur** — Azərbaycan dilinin ən çox işlənən hərfi. Praktikada türk traineddata ilə əvəz edilir | ⛔ (b) üçün |
| **Mathpix** `v3/text` | $0.002/sorğu, çox dəqiq | 🟡 ehtiyat variant |
| **Vision LLM** (Flash sinifli) | (a)+(b)+(c) bir çağırışda, ~$0.002–0.005 | ✅ (c) üçün, (b) üçün də |

### Xərc düzəlişi

İlkin təxmin ($0.01–0.03/həll) **şişirdilmiş** idi. Real: Mathpix $0.002/sorğu,
Flash sinifli vision çağırışı ~$0.002–0.005. 4.99 ₼ ($2.94) abunə ilə 300 həll/ay → ~$1–1.5 xərc.

**Nəticə:** Texo-nu xərcə görə seçmirik. Səbəblər: **latensiya** (server gedişi yox) və
**məxfilik** (şəkil telefonu tərk etmir — dizaynda verilən vəd).

## Qərar

1. Klientdə **Texo (ONNX)** — düstur tipli giriş üçün. Etibarlılıq aşağıdırsa şəkil yoluna keç.
2. Serverdə **keş-əvvəl uyğunlaşdırma**: `canonical_hash` → `numeric_fingerprint` → `embedding` → LLM.
3. LLM cavabı **`STEP-SCHEMA.json`-a uyğun JSON** olmalıdır. Sərbəst mətn rədd edilir.
4. `final_answer.values` **sympy ilə maşınla yoxlanılır**. `verified=false` olan həll göstərilmir.
5. Yalnız addımların **izahı** insan nəzarətinə qalır, nümunə əsasında.

## Nəticələr

**Müsbət:** determinizm, latensiya, aşağı xərc, keş böyüdükcə keyfiyyət artır, Test/Lent məzmunu
avtomatik doğulur.

**Mənfi:** iki OCR yolu (Texo + vision) saxlamaq lazımdır — marşrutlaşdırma məntiqi əlavə mürəkkəblikdir.
Texo brauzer bundle-a ~20MB model əlavə edir (lazy load, ilk istifadədə yüklənir).

**Risk:** Texo əl yazısında zəif ola bilər. Amma girişin ~80%-i çap olunmuş DİM test toplusudur —
bu risk qəbul edilə biləndir. Faza 0 golden set-i bu nisbəti əks etdirir (70% test toplusu,
20% dərslik, 10% əl yazısı).

## Faza 0 qapısı

Bu ADR **təsdiqlənmir** — ölçülür. 30 real DİM səhifəsi üzərində:

- son cavab dəqiqliyi ≥85%
- addım bölgüsü ≥75%
- orta xərc/həll ölçülüb

Texo yolu vision LLM-dən pis çıxarsa → Texo silinir, hər şey vision LLM-ə gedir. Bu, sadələşdirmədir,
uğursuzluq deyil.

## Alternativlər və niyə rədd edildi

- **Hər şeyi vision LLM-ə vermək:** ən sadə. Rədd edilmədi — Faza 0 nəticəsindən asılıdır.
  Texo yalnız ölçülmüş fayda verərsə qalır.
- **Mathpix + mətn LLM:** iki server gedişi, əlavə xərc, Texo-nun məxfilik üstünlüyü yoxdur.
- **Öz modelini öyrətmək:** bu mərhələdə absurd. Heç vaxt qayıtma.
