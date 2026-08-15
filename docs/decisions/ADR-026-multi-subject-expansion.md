# ADR-026 — Fənn genişlənməsi: riyaziyyatdan fizika/kimyaya (biznes + texniki plan)

**Status:** Təklif edilib — qərar TƏLƏB EDİR (bu, ADR-014 kimi "ölçmə ilə həll olunur" deyil,
sıra/vaxt qərarı Ilkin-dədir)
**Tarix:** 2026-08-15
**Toxunur:** `ADR-008` (format/dil neytrallığı — `subject` sahəsi artıq neytraldır),
`ADR-014` (nüvə+fənn əlavəsi prompt bölgüsü — BURADA icra planına çevrilir),
`ADR-004`/`ADR-005` (addım/sızma metrikaları — yeni fənndə TƏKRARLANMALI),
`docs/STEP-SCHEMA.json`, `prompts/solve/core.md`, CLAUDE.md Qızıl qayda

## Kontekst — Ilkin-in tapşırığı

"Biz indiyədək yalnız riyaziyyat fənni ilə məşğul olmuşuq... Sistemi digər fənnlər üzrə də
uyğunlaşdırmaq lazımdır." Bu sənəd (a) niyə və hansı ardıcıllıqla, (b) texniki olaraq nə
dəyişməli olduğunu bir yerdə cavablandırır (Ilkin-in seçimi: tək sənəd).

## Başlanğıc nöqtəsi — kod artıq QİSMƏN hazırdır, amma YALNIZ görünüşdə

`docs/STEP-SCHEMA.json`-da `subject` sahəsi 2026-08-05-dən bəri (`ADR-008`, v5) artıq
`math | physics | chemistry` enum-udur, dil-neytral. Bu, TƏSADÜFİ genişlik deyil — `ADR-008`
formatı BÜTÜN fənnlər üçün neytrallaşdırıb, sadəcə hələ heç kim `physics`/`chemistry`
göndərmir. Bunun mənası: **giriş qatı hazırdır, çıxış/yoxlama qatları YOXDUR:**

| Qat | Riyaziyyat üçün vəziyyət | Fizika/kimya üçün vəziyyət |
|---|---|---|
| `subject` sahəsi | `math` | **artıq mövcud enum dəyəri**, sadəcə istifadə olunmur |
| Prompt | `core.md` + `math.md` (`ADR-014`-ün TƏKLİF etdiyi bölgü) | `math.md`-in qardaşı **YAZILMAYIB** |
| `error_code` | 11 kodun HAMISI riyazi (`SIGN_LOST`, `FACTOR_PAIR`...) | **SIFIR** kod, sxem bağlıdır (aşağı bax) |
| Yoxlama (S5/sympy) | `equationCrossCheck` — simvolik tənlik həlli | sympy tənlik-mərkəzlidir, fizika/kimyaya birbaşa köçmür |
| Qat 3 şablon (`ADR-021`) | 3 riyazi topic_code (`ALG.LINEAR/QUADRATIC/VIETA`) | əhatə xaricində |
| Golden-set / eval | 99 real DİM sualı (`evals/golden-set-dim-100test-2025.jsonl`) | **SIFIR** nümunə |

Yəni bu, "yeni fənn əlavə et" DEYİL — **4 ayrı alt-sistemi** (prompt, taksonomiya, yoxlama,
ölçmə) riyaziyyata bağlı vəziyyətdən çıxarmaqdır. Aşağıda hər biri üçün konkret plan var.

## Bazar/pedaqoji əsas — niyə fizika BİRİNCİ

**DİM-in özü fizikanı riyaziyyatla EYNİ çəkidə qoyur.** 1-ci ixtisas qrupunun (STEM
istiqaməti) blok imtahanında əmsallar: **Riyaziyyat 1.5, Fizika 1.5, Kimya/İnformatika 1.0**
([sec.az/dim](https://sec.az/dim)). Bizim hədəf auditoriyamız (5–11 sinif, DİM hazırlığı) elə
bu qrupdursa, fizikasız qalmaq məhsulun öz hədəf bazarının yarısını kəsir — riyaziyyatı həll
edən şagird eyni həftə fizika testi ilə də ilişir, biz orada yox oluruq.

Kimya üçün əmsal aşağıdır (1.0, həm də informatika ilə əvəzlənə bilər) — bu, kimyanın
ƏHƏMİYYƏTSİZ olduğu demək deyil, sadəcə fizikadan sonra gəlməsinin əlavə bir səbəbidir.

**Rəqib mənzərəsi bizim SEQANSİYAMIZI dəyişmir, amma TƏCİLİLİYİ göstərir:** Gauth artıq
riyaziyyat + fizika + kimya + biologiya əhatə edir (cavab-mərkəzli); Photomath isə ŞÜURLU
şəkildə yalnız riyaziyyatda qalır ([tutoraisolver.com](https://tutoraisolver.com/blog/gauth-vs-photomath-2026-best-ai-stem-solver-alternatives),
[aitoolsbakery.com](https://aitoolsbakery.com/blog/photomath-vs-gauth/)). Yəni "yalnız
riyaziyyat" strategiyası TƏK BAŞINA rəqabətdə uduzdurmur (Photomath sübutdur) — bizim əsl
fərqimiz (səhvi ADLANDIRMAQ, cavabı vermək YOX) riyaziyyatda hələ TAM sınanmamışkən
(Faza 1 hələ dəvət dalğasına çatmayıb) enini artırmaq diqqəti yayır. **Tövsiyə: fənn əlavəsi
Faza 1-in riyaziyyatdakı öz qapısından (15–20 şagird · ≥8/20 3 dəfə qayıdır) SONRA,
paralel YOX.**

**Bioloji/humanitar fənlər bu ardıcıllığa daxil deyil** — 1-ci qrupun tərkibində yoxdur,
həm də məhsulun nüvəsi (addım-addım RİYAZİ/HESABLAMA yoxlaması) mətn-əsaslı fənlərə birbaşa
köçmür (sympy-nin əvəzi yoxdur). Bu, gələcək bir ADR-in mövzusudur, bura daxil deyil.

## Texniki miqrasiya planı

### 1. `error_code` taksonomiyası — SAHƏ prefiksli, TƏK sxem

Hazırkı `error_codes` cədvəli (`public.error_codes`) DÜZ, fənn sütunu OLMAYAN 11+ sətirdir
(S3-ün 2026-08-14 birləşdirməsindən sonra). İki yol var:

- **(A) Prefiks konvensiyası** (`PHYS.UNIT_MISMATCH`, `CHEM.STOICH_RATIO`) — `topic_code`-un
  ARTIQ işlətdiyi `SAHƏ.MÖVZU` idiomu ilə eynidir, `error_codes` cədvəlinə sadəcə YENİ SƏTİRLƏR
  əlavə olunur, sxem versiyası (`schema_version`) DƏYİŞMİR, `STEP-SCHEMA.json`-un `error_code`
  enum-u `subject`-ə görə **prompt tərəfində** filtrlənir (core.md-də `{{ERROR_CODES}}`
  yer tutucusu, hər fənn faylı öz siyahısını verir — `{{MATH_EXAMPLE}}`-in EYNİ modelidir).
- **(B) `error_codes`-ə `subject` sütunu + sxemdə fənnə görə şərtli enum** — daha "təmiz",
  amma `schema_version` artırır, BÜTÜN mövcud validasiya/eval kodunu (steps_compare.py,
  leak.py-ın error_code istinadları) toxunur.

**Tövsiyə: (A).** Kod (A)-nı sıfırdan yeni fənn ADR-i kimi YOX, birbaşa `topic_code`-un
sınanmış nümunəsi kimi görür — riski aşağıdır, `S3`-ün blok 95-də etdiyi taksonomiya
birləşdirməsini TƏKRARLAMIR, YALNIZ genişləndirir.

### 2. Prompt memarlığı — `ADR-014`-ün icrası, indi

`ADR-014` artıq `core.md` + `math.md` bölgüsünü ETDİ (2026-08-08) məhz bu gün üçün hazırlıq
olaraq — "fənn/format artdıqca tək prompt nəhəngləşəcək, bölmə İNDİ edilir" (ADR-014, "Digər
faydalar"). Növbəti addım ADR-014-ün ÖZÜNÜN yazdığı formuldur:

```
prompts/solve/core.md      (dəyişməz nüvə: JSON format, ümumi qaydalar 1–17)
prompts/solve/math.md      (mövcud, 2 nümunə)
prompts/solve/physics.md   (YENİ — Qüvvə/Hərəkət/Enerji/Elektrik nümunələri)
prompts/solve/chemistry.md (YENİ — tənlik balanslaşdırma/stexiometriya nümunələri)
```

`web/lib/prompt.ts:30` (`loadPromptTemplates`) `{{MATH_EXAMPLE}}` yer tutucusunu HARDCODE
`math.md`-dən doldurur (`scripts/lib/prompt_loader.py`-də EYNİ məntiqin Python güzgüsü var,
`web/lib/prompt.ts:2`-nin özünün qeyd etdiyi kimi — hər ikisi dəyişməlidir). Bu, `subject`
arqumenti qəbul edib fayl seçən funksiyaya çevrilməlidir — TƏK kod dəyişikliyi budur.
`core.md`-nin `error_code` siyahısı (bölmə 143-157) da eyni
mexanizmlə fənnə görə dəyişən yer tutucuya keçməlidir (yuxarı, 1-ci bənd).

`ADR-014`-ün TƏKLİF etdiyi ikinci-çağırış (triaj → ixtisaslaşmış həll) memarlığı bu ADR-in
HİSSƏSİ DEYİL — o, öz qapısı ilə (aşağı, 108-118-ci sətirlər) AYRI qərardır. Fənn sayı
artdıqca onun dəyəri BÖYÜYÜR (indi 1 fənn üçün 60% ucuzlaşma idi, 3 fənndə keş+marşrutlaşdırma
faydası daha da artır) — bu ADR onu YALNIZ QEYD edir, indi HƏYATA KEÇİRMİR.

### 3. Yoxlama (S5/sympy) — fənnə görə deqradasiya, SÜKUTLA

`equationCrossCheck` simvolik tənlik həllidir — fizika düsturlarının ÇOXU (kinematik
tənliklər, Om qanunu) əslində cəbri tənlikdir, sympy-yə TƏBİİ uzanır. Kimyada isə (tənlik
balanslaşdırma, stexiometriya nisbətləri) fərqli yoxlama məntiqi lazımdır (tam ədəd
nisbətləri, sympy-nin həll etdiyi "simvolu tap" formasında DEYİL).

**Kritik: bu, bloklayıcı DEYİL.** S5 artıq "yoxlanılmadı" halını UI-da AÇIQ göstərir
(`verification.method: "none"` şagirdə YALANDAN əminlik vermir, sükutla keçir). Fizika/kimya
başlanğıcda sadəcə `verified: false` ilə işə düşə bilər — bu, RİSK YOX, S5-in məhz bunun üçün
qurulduğu haldır. Kimyaya xüsusi yoxlayıcı (stoxiometrik nisbət yoxlaması) gələcək bir ayrı
iş paketidir, BİRİNCİ buraxılışın ŞƏRTİ deyil.

### 4. Eval/golden-set — `ADR-004`-ün intizamı TƏKRARLANIR, KEÇİLMİR

Riyaziyyatın 99 sualı fizika/kimya üçün SIFIR sübut gücünə malikdir — fənlər fərqli sxem
sahələri (has_figure tezliyi, düstur sıxlığı), fərqli səhv növləri istehsal edir.
`scripts/pdf_to_golden_set.py` fənn-agnostikdir (mətn-mövqeyi əsaslı, LLM-siz kəsmə) — YENİ
DİM fizika/kimya test toplusu PDF-i tapılarsa TƏKRAR İSTİFADƏ oluna bilər, YALNIZ `--subject`
bayrağı dəyişir. `evals/README.md`-in `n<30` qapı-guard-ı EYNİ QAYDA ilə tətbiq olunmalıdır —
kiçik nümunə üzərində "fizika işləyir" iddiası ölçüsüzdür.

### 5. Xərc/latensiya — struktur dəyişikliyi YOXDUR

Eyni vision LLM, eyni tək-çağırış memarlığı (bölmə 2-yə bax) — fənn artımı ÖZÜ-ÖZLÜYÜNDƏ
$/həll və ya latensiyanı DƏYİŞMİR. `canonical_hash` keşi fənndən ASILI OLMAYARAQ eyni cür
işləyir (hash mətndən çıxır, `subject` sahəsi ayrıca sütun, kolliziya riski yoxdur).

## Qapı — ADR-004/ADR-014 intizamı ilə EYNİ standart

Fizika (və ya kimya) real şagirdə çatmazdan ƏVVƏL:

| meyar | hədəf (riyaziyyatla EYNİ) |
|---|---|
| Sxem validliyi | 100% |
| Struktur (addım sayı, check, error_code fərqliliyi) | 100% |
| Addım bölgüsü — pedaqoji (insan rəyi, `ADR-004`) | ≥75% |
| Cavab sızması | ≤10% |
| n | ≥30 (guard-sız faiz göstərilmir) |

**Riyaziyyatdan AŞAĞI bar YOXDUR** — "yeni fənndir, gözləntini azaldaq" məntiqi qəbul edilmir,
çünki qızıl qayda (`error_code` xəritəsinin doğruluğu) fənndən ASILI DEYİL.

## Qərar verilmədi — Ilkin-in seçməli olduğu

1. **Vaxt:** bu iş Faza 1-in öz qapısından (15–20 şagird, dəvət dalğası) ƏVVƏL, yoxsa SONRA
   başlasın? (Tövsiyə: sonra — bax "Bazar/pedaqoji əsas".)
2. **Prefiks konvensiyası (A) təsdiqlənir, yoxsa `subject` sütunlu (B) seçilir?**
   (Tövsiyə: A — daha ucuz, daha az toxunan səth.)
3. **Fizika golden-set mənbəyi:** riyaziyyatdakı kimi DİM PDF-i tapılacaq, yoxsa başqa mənbə
   (dərslik, əlyazma)? Bu, `scripts/pdf_to_golden_set.py`-in yenidən işlədilə bilməsini
   TƏSDİQLƏYİR, amma mənbənin ÖZÜ Ilkin-in tapmalı olduğu şeydir (`86eyhk10u`-nun presedenti).
4. **`ADR-014`-ün ikinci-çağırış memarlığı BU işlə birlikdə, yoxsa ondan SONRA?** (Tövsiyə:
   sonra — riyaziyyatda hələ ölçülməyib, iki böyük memarlıq dəyişikliyini eyni anda etmək
   hansı dəyişikliyin hansı metrikaya təsir etdiyini qarışdırır.)
