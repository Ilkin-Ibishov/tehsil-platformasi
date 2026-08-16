# ADR-030 — Qat 5 promptu mövzuya görə seçilir; soak həcmi Gemini

**Status:** Qəbul edilib (sahibin qərarı, 2026-08-16)
**Toxunur:** `ADR-014` (triaj → ixtisaslaşmış həll) · `ADR-013` (böyük promptda qayda itir) ·
`ADR-026` (fənn qovluğu) · `ADR-029` (soak provayderi) · `prompts/solve/` · `web/lib/prompt.ts`
**Motivasiya:** ChatGPT UI-yə 22 KB yazmaq Faza 2 qapısını açmır. Gemini artıq şagird
yoludur. Token isə mövzu nümunəsini daraltmaqla düşür — nüvə qaydaları kəsilmir.

## Qərar

1. **Qat 1** (mövcud `transcribe.md`) şəkildən `subject` + `topic_code` çıxarır.
   Bu, `ADR-014` çağırış-1 triajıdır — yeni vision çağırışı əlavə olunmur.

2. **Qat 5** `loadPromptTemplates({ subject, topicCode, includeImageRules: false })`:
   - nüvə: `prompts/solve/core.md` (JSON müqaviləsi, 11 `error_code`, qayda 1–17)
   - fənn nümunəsi: `prompts/solve/{math,physics,chemistry}.md` (yoxdursa `math.md`)
   - bölmə: `prompts/solve/{subject}/{TOPIC_CODE}.md` varsa onun `Nümunə` bloku
     fənn nümunəsini **əvəz edir**; `Əlavə qaydalar` varsa sistemə əlavə olunur.
   Fayl yoxdursa əvvəlki `core+math` davranışı qalır (reqressiya yox).

3. **Nüvə qaydaları silinmir.** Token qazancı: (a) Qat 5-ə şəkil-girişi blokunu
   göndərməmək (o, Qat 1-dədir), (b) üç ümumi nümunə əvəzinə bir mövzu nümunəsi.
   `error_code` enum-u `core.md`-də qalır (`STEP-SCHEMA.json` tək mənbə).

4. **Fənn qovluqları indi yaradılır; fizika/kimya məzmunu yox.** `ADR-026` qapısı
   (Faza 1 riyaziyyat qapısından sonra, n≥30 golden) dəyişmir. Boş `physics/` və
   `chemistry/` yalnız marşrutun yerini saxlayır.

5. **Soak həcmi Gemini-dir.** `app_config.soak_provider=gemini`. `chatgpt_web`
   ehtiyat olaraq qalır, defolt deyil. n=10 Gemini qızıl ilə həcm eyni provayderdə
   birləşir — `ADR-029` §2-nin «ChatGPT zəif olsa dayanma» maddəsi həcm üçün
   lazımsızdır. Cookie/ToS riski soak həcmində yoxdur.

## Nəticə

Faza 2 100 kəsiyi şagirdin eyni Gemini kaskadı ilə ölçür. Prompt böyüməsi mövzu
faylı əlavə etməklə gedir, `core.md`-yə yapışdırmaqla yox.
