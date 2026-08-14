# ADR-023 — Aktiv model DB-dən oxunur, Vercel redeploy tələb etmir

**Status:** Qəbul edilib
**Tarix:** 2026-08-14
**Toxunur:** `ADR-022` (model registrisi — bu ADR onun ÜSTÜNƏ qurulur, registrini əvəz
etmir) · `0056_active_model_config.sql`
**Motivasiya:** Ilkin-in birbaşa tapşırığı — model dəyişikliyinin Vercel env-dən (manual +
redeploy) asılı olması "çox pis hal"dır. İki tələb: (1) Claude Code/Cowork-un modeli
redeploy-suz dəyişə bilməsi, (2) gələcək admin dashboard-un bunu UI dropdown-undan idarə
edə bilməsi üçün backend-in HAZIR olması.

## Qərar

`public.app_config` (key/value) cədvəli — iki sətir: `active_model`, `active_transcribe_model`.
`web/lib/llm.ts`-i çağıran hər yer (monolit `/api/solve`, kaskadın Qat 1/5-i) artıq
`process.env.GEMINI_MODEL`/`TRANSCRIBE_MODEL`-i BİRBAŞA OXUMUR — `getActiveModel(pool)`/
`getActiveTranscribeModel(pool)` (`web/lib/models.ts`) çağırır, bu da DB-dən oxuyur.

**Env dəyişənləri YOX OLMUR** — bootstrap fallback kimi qalır: DB sorğusu uğursuz olsa
(miqrasiya hələ tətbiq olunmayıb, DB əlçatmazdır) və ya sətir yoxdursa, `GEMINI_MODEL`/
`TRANSCRIBE_MODEL`-ə geri düşülür. Bu, `ADR-022`-nin özünün "naməlum model də işləyir"
prinsipinin eynisidir — DB YALNIZ rahatlıq qatıdır, MƏCBURİYYƏT deyil.

## Yazı yolu — İNDİ vs GƏLƏCƏK

**İndi (admin dashboard yoxdur):** `app_runtime`-a YALNIZ `SELECT` grant-ı var (gate-78
dərsi — implicit-ə güvənmə, yazı yolu AÇIQ olmalıdır). Dəyişiklik birbaşa SQL ilə (Supabase
MCP `execute_sql`, Claude Code və ya Cowork-un əli ilə) — bu, Ilkin-in "sən özün rahatlıqla
edə bilərsən" tələbini TAM ödəyir, kod dəyişikliyi/redeploy TƏLƏB ETMİR.

**Gələcək (admin dashboard qurulanda):** `app.set_active_model(model_id, transcribe_model_id)`
SECURITY DEFINER RPC-si əlavə olunacaq (YENİ miqrasiya, additive) — `image_hash_cache`-in
`reveal_*`/`store_*` naxışının eynisi. Bu ADR bunu QURMUR, yalnız YOLUNU açır (cədvəl artıq
var, RPC əlavəsi sxem dəyişikliyi TƏLƏB ETMİR, yalnız funksiya).

## Niyə `public` sxemi, `private` YOX

Model adı sirr deyil (`error_codes`/`topic_codes` kimi arayış datası) — `private` sxeminin
RPC-only təcridi (ADR-017) CAVAB datası üçündür. `app_config` üçün adi `grant select ...
to app_runtime` kifayətdir, əlavə RPC qatı bu mərhələdə artıq mürəkkəblikdir.

## Nəticələr

**Müsbət:** model dəyişikliyi artıq `UPDATE public.app_config SET value=... WHERE
key='active_model'` qədər sadədir — heç bir deploy, heç bir Vercel dashboard səyahəti.

**Mənfi:** hər LLM çağırışından ƏVVƏL bir əlavə DB sorğusu (~<10ms, pool artıq açıqdır,
əhəmiyyətsiz gecikmə). `makeTextSolveLayer`/`transcribe`-in imzası `pool` tələb etməyə
başladı (transcribe artıq alırdı, `solve-text` YENİ alır).

**Ölçüləcək deyil** — bu, ADR-022 kimi struktur köçürmədir, davranış (hansı model işlədiyi)
DƏYİŞMİR, yalnız HARADAN oxunduğu dəyişir.
