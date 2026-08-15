# ADR-022 — Model registrisi: qiymət modeldən ayrıla bilməz

**Status:** Qəbul edilib — env override hissəsi `ADR-027` ilə ləğv edilib
**Tarix:** 2026-08-14
**Toxunur:** `web/lib/llm.ts`, `web/lib/cost.ts` (dəyişir) · `ADR-020` (`TRANSCRIBE_MODEL`
override-i ilk dəfə buraya gətirdi)
**Motivasiya:** Ilkin-in birbaşa tapşırığı — LLM axınlarını model-agnostik etmək ki, model/
provayder arasında rahatlıqla keçid edilib xərc/effektivlik müqayisə oluna bilsin.

## Kontekst

`86eymrm8j` auditində (cost_usd niyə production-da 9/10 sətirdə boşdur) aşkarlandı ki,
kod artıq düzgündür — problem `GEMINI_PRICE_*` env-lərinin production-a əvvəlcə
qoyulmaması idi. Amma bu axtarış zamanı AYRI, DAHA TƏHLÜKƏLİ bir struktur riski üzə çıxdı:

`web/lib/cost.ts`-in `computeCostUsd(usage, prefix)` funksiyası qiyməti **qatın
MƏQSƏDİNƏ** görə axtarır (`prefix` — "TRANSCRIBE" və ya defolt), **modelin KİMLİYİNƏ** görə
YOX. `web/lib/llm.ts`-in `callVisionLLM`-i isə modeli sərbəst dəyişməyə icazə verir
(`opts.model`, `TRANSCRIBE_MODEL`/`GEMINI_MODEL` env-ləri).

**Nəticə:** kimsə `GEMINI_MODEL`-i başqa bir modelə (fərqli qiymətli) dəyişsə, `GEMINI_
PRICE_INPUT_PER_1M`/`GEMINI_PRICE_OUTPUT_PER_1M`-i YENİLƏMƏSƏ, xərc **səssizcə YANLIŞ**
hesablanır — `null` deyil, `86eymrm8j`-dəki bug-dan da pisi, çünki nəticə DOLU görünür,
sadəcə səhvdir. Bu, məhz Ilkin-in istədiyi "modelləri rahat müqayisə et" iş axınının
ƏN BİRİNCİ addımında partlayacaq tələdir.

## Qərar

Qiymət modelin ÖZÜ ilə eyni obyektdə yaşasın — iki fərqli yerdə saxlanılan iki dəyərin
sinxronizasiyasına GÜVƏNMƏK əvəzinə, struktur olaraq AYRILA BİLMƏSİNLƏR.

`web/lib/models.ts` (yeni) — kiçik registri:

```ts
type ModelConfig = {
  id: string;
  provider: "gemini";
  baseUrlEnv: string;   // provayderin bağlantı env-i (paylaşılır)
  apiKeyEnv: string;
  defaultPriceInputPer1M: number;   // KODDA yaşayır — modeldən ayrıla bilməz
  defaultPriceOutputPer1M: number;
};
```

**Tanınan modellər üçün** (`gemini-3.6-flash`) qiymət registridə hardcode-dur — env
unutmaqla yanlışlaşa bilməz, çünki heç bir env-ə güvənmir.

**Naməlum/yeni model üçün** (kimsə `GEMINI_MODEL=gemini-3.7-flash` yazsa, registridə YOX)
qiymət `MODEL_<SLUG>_PRICE_INPUT_PER_1M`/`_OUTPUT_PER_1M` env açarından oxunur — açar
**modelin ÖZ ID-sindən DETERMİNİSTİK hesablanır** (`envKeyFor`), yəni yanlış modelin
qiymətini "təsadüfən" oxumaq STRUKTUR OLARAQ mümkün deyil. Təyin edilməyibsə `null`
(bilinmir — `86eymrm8j`-dəki eyni "0 yazma, sükutla düz sayma" prinsipi).

**Model seçimi ÖZÜ AZAD qalır** — `GEMINI_MODEL`/`TRANSCRIBE_MODEL` istənilən sətir ola
bilər, registridə olmasa belə çağırış keçir (yalnız xərci naməlum qalır, təyin edilməyincə).
Bu, Ilkin-in "rahatlıqla əvəzləyim" tələbinin BİRİNCİ hissəsidir — registri məcburiyyət
deyil, TANINAN modellər üçün rahatlıqdır.

## Həcm — nə DAXİLDİR, nə YOX

**Daxildir:** eyni provayder (Gemini-nin OpenAI-uyğun endpoint-i) daxilində model
versiyaları arasında keçid (məs. `gemini-3.6-flash` ↔ `gemini-3.7-flash`) — bu, real,
indi mövcud olan ehtiyacdır (bax ADR-021-in bu sessiyada aşkarladığı 3.7 Flash endirimi).

**DAXİL DEYİL (qəsdən, ayrı qərar tələb edir):** fərqli PROVAYDERLƏR arasında keçid
(Gemini ↔ OpenAI ↔ Claude, fərqli `base_url`/autentifikasiya sxemi). Hazırkı arxitektura
TƏK provayder bağlantısına (`GEMINI_BASE_URL`/`GEMINI_API_KEY`) əsaslanır — bunu
dəyişdirmək provayder-abstraksiya qatı tələb edir, `scripts/lib/llm_client.py`-ın (Faza 0
eval harness-i) artıq etdiyi kimi, amma bu, GENİŞ, ayrı bir işdir. Bu ADR onu HƏLL ETMİR,
yalnız qiymət-model sinxronizasiya bugini bağlayır.

## Nəticələr

**Müsbət:** model dəyişikliyi artıq xərc-hesablamanı səssizcə korlaya bilməz. Tanınan
modellər üçün sıfır-konfiqurasiya (registridə hardcode), yeni model üçün açıq, deterministik
env açarı.

**Mənfi:** `cost.ts`-in "qiymətlər env-dən, hardcode edilmir" öz prinsipi qismən dəyişir —
tanınan modellər üçün indi HƏM hardcode defolt, HƏM env override var. Bu, qəsdən — tam
env-yə güvənmək məhz bu bugin səbəbi idi.

**Ölçüləcək deyil** (bu, ölçmə qapısı tələb edən bir dəyişiklik deyil — məhz köçürmə,
davranış identikdir, yalnız daxili strukturu düzəlir).
