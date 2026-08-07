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

## HÖKM — Faza 0-lite, 2026-08-06

**Boru xətti işləyir. Faza 1-ə keçmək təhlükəsizdir.**

Ölçmə: `gemini-3.6-flash` (vision, tək çağırış), 10 real şagird şəkli + 10 əl ilə kəsilmiş
variant. Şəkillər Telegram sıxılmasından keçib (960×1280) — yəni **pis hala yaxın** test.
Kitab **10–11 sinif** səviyyəsindədir: triqonometrik eynilik və tənliklər, loqarifm, üstlü
tənliklər, tərs funksiya, kompleks ədədlər, ehtimal, statistika.

| metrika | nəticə | qapı |
|---|---|---|
| Son cavab dəqiqliyi (kəsilmiş) | **9/10** | ≥85% ✅ |
| Sxem validliyi | **10/10** | 100% ✅ |
| Addım bölgüsü — struktur | **10/10** | 100% ✅ |
| Hallüsinasiya (xam dəst) | **0/9** | 0% ✅ |
| İmtina səbəbi uyğunluğu | **9/9** | — |
| Cavab sızması | 1/10 | ≤10% ✅ |
| Addım bölgüsü — pedaqoji | **6/10 = 60%** | ≥75% ❌ |

**Yenilənmə (2026-08-07, HANDOFF 35–38):** yuxarıdakı `9/10` 2026-08-06 tarixli ayrı ölçmədir
(v5 promptu). 2026-08-07-də EYNİ `golden-set-cropped.jsonl` üzərində v6 promptu ilə YENİDƏN
işə salınan run (`B-2026-08-07.json`, worktree təmizlənməsi ilə silindi — bax `evals/results/
summary-*.json`, HANDOFF 38) harness-də **7/10** göstərdi. Səbəb model DEYİL, ölçmə: `c03`
(`log_2(...)` vs `log2(...)`) və `c06` (`\pi k` vs `pi*n`, sərbəst dəyişən adı) `scripts/lib/
verify.py`-in o vaxtkı normallaşdırmasından keçmirdi. Düzəlişdən (HANDOFF 37/38) sonra əl
yoxlaması **v6 üçün də son cavab dəqiqliyinin 9/10** olduğunu təsdiqlədi — `c05` isə HƏQİQİ
uyğunsuzluqdur (məsələ konkret kök istəyib, model ailə qaytarıb), normallaşdırma ilə
gizlədilmədi. Xam fayl itdiyi üçün rəqəm yenidən avtomatik hesablana bilmir, bu qeyd əl
yoxlamasının qeydidir (`docs/HANDOFF.md` blok 37/38).

**Pedaqoji ox KEÇMİR** (`ADR-010`, 2026-08-06). Bu, Faza 1-i bloklamır — boru xətti
işləyir, app qurula bilər — amma **şagirdlər istifadə etməzdən əvvəl prompt v6 sınanmalıdır**.
Səbəb: variantlı məsələdə model addımı "hansı variant düzgündür?"-a çevirir və çıxarışı
tanıma ilə əvəz edir. Bu, məhsulun mövcudluq səbəbinə birbaşa ziddir.

`n=10 < 30` olduğu üçün bu, **rəsmi qapı hökmü deyil** — "davam etmək təhlükəsizdirmi"
yoxlamasıdır. Rəsmi qapı Faza 1-də real şagird istifadəsindən toplanan n≥30 ilə ölçüləcək.

### Pipeline A (Texo) silinir

`ADR-001` başlanğıcda yazmışdı: *"B, A-dan pis deyilsə → A silinir (sadələşdirmə)."*
B tək çağırışda OCR + həll + addım bölgüsü edir və 9/10 verir. A yalnız OCR hissəsini
əvəz edərdi, sonra yenə mətn LLM-i lazım olardı — yəni iki çağırış, iki asılılıq,
20MB brauzer modeli. **Şərt yerinə yetdi, A silinir.**

Texo-nun latensiya və məxfilik arqumentləri qüvvədə qalır, amma indi məlumdur ki,
latensiyanın əsas hissəsi OCR-dan yox, **modelin thinking rejimindən** gəlir (16.8 san).
Texo onu həll etmir.

### İki açıq risk — dəqiqlik deyil, iqtisadiyyat və UX

**1. Xərc.** Ölçülmüş: **$0.0167/həll** (giriş 5234 token, çıxış thinking daxil).
`PRODUCT.md`-dəki 4.99 ₼ ($2.94) abunə **200 həlldən sonra zərərə keçir**.

| istifadə | xərc | abunə |
|---|---|---|
| 100 həll/ay | $1.67 | $2.94 ✅ |
| 200 həll/ay | $3.34 | $2.94 ❌ |
| 400 həll/ay | $6.68 | $2.94 ❌❌ |

Bu, `PRODUCT.md`-dəki "marja problem deyil" cümləsini **ləğv edir**. Üç azaldıcı ölçülüb:
məsələ keşi (`ADR-003`), kontekst keşi (prompt sabitdir, $0.15/1M), `gemini-3.5-flash-lite`
($0.30/$2.50). Keş 60% + Flash-Lite → **200 həll/ay = $0.30**.

**Bunlar optimallaşdırma deyil, biznes modelinin şərtidir.**

**2. Latensiya 16.8 saniyə.** Gemini 3-də thinking söndürülə bilmir. `HƏLL QURULUR` ekranı
məcburidir və boş spinner olmamalıdır. `reasoning_effort: low` sınanmalıdır.

### Ölçülməyən

- **Pedaqoji addım bölgüsü** (`ADR-004` B hissəsi) — insan rəyi lazımdır, 10 həll hazırdır.
- **Hallüsinasiya yalnız `multiple_problems` üzərində ölçüldü.** Qəsdən bulanıq/riyaziyyat
  olmayan şəkil dəstdə yoxdur — `unreadable` və `not_a_problem` yolları **sınanmayıb**.
- Əl yazısı: dəstdə yalnız çap var.

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
