# ADR-029 — Korpus soak: ChatGPT adapter, Gemini qızıl n, transkripsiya qapısı

**Status:** Qəbul edilib (sahibin qərarı, 2026-08-16)
**Toxunur:** `docs/PHASE-2.md` · `web/lib/llm.ts` (adapter hələ yox) · `ADR-016` (risk modeli)
**Motivasiya:** Faza 2 həcmi Gemini xərcinə yandırılmasın; şagird yolu isə soak-a qarışmasın.

## Qərar

1. **Soak provayderi** Ilkin-in Railway ChatGPT avtomat servisidir (`POST /chat`).
   OpenAI-uyğun deyil — ayrıca adapter. Şagird production yolu Gemini kaskadında qalır
   (`active_model` / `active_transcribe_model`). Soak `cost_usd` 0 yazılmır.

2. **Keyfiyyət Gemini-dən zəif olsa soak dayanmır.** ChatGPT həcmi davam edir.
   Eyni kəsiklərdən **n=10** Gemini qızıl nümunə ayrıca işlədilir və hesabatda
   `kind`/`student_ref` ilə qarışdırılmır. Qızıl n böyüdülmür — bu, etalon üçündür,
   büdcə üçün deyil.

3. **Cookie / ChatGPT ToS / UI selector riski sahibindir** (Ilkin, 2026-08-16).
   `ADR-016` eyni model: icraçı hüquqi qiymətləndirmə yazmır, dayandırmır.
   Cookie bitəndə və ya `selectorFailures` artanda soak dayanır; şagird Gemini-yə
   avtomatik keçid yoxdur.

4. **Avtomatik “Düzdür” qapısı.** Cursor ChatGPT transkripsiyasını **5 kəsik** üzərində
   şəkilə qarşı yoxlayır. **5/5 düzdürsə** qalan soak şəkilləri üçün transkripsiya
   təsdiqi avtomatik qəbul edilir. 5-dən biri səhvdirsə avtomatik “Düzdür” açılmır —
   soak həcmi o qapıdan keçmədən getmir.

   Bu qapı `transcript.corrected` telemetriyasını əvəz etmir. Soak avtomatik təsdiqdə
   o hadisə 0 qalır; insan şagird nümunəsi ilə qarışdırılmır. 5/5 nəticəsi HANDOFF-a
   yazılır.

## Nəticə

Soak ucuz və təkrarlanandır. Gemini kiçik n etalondur. Transkripsiya avtomatlaşması
kor-koranə deyil — bir dəfəlik 5/5 yoxlamadan sonra.
