-- ClickUp "Yaddaşdakı RPC-lər DB-də yoxdur" araşdırması (bax HANDOFF) bunu üzə çıxardı:
-- Cowork-un `pg_proc` sorğusu YALNIZ `public`/`private` sxemlərini yoxlayıb, `app`-ı
-- (gate-78-in, `0030`, 4 answer-RPC-ni PostgREST-ə görünməyən sxemə köçürdüyü yer)
-- ATLAYIB. Nəticə: RPC-lər "yoxdur" fərziyyəsi ilə iki yeni obyekt yaranıb:
--
-- 1. `public.store_answer` (`0041`) — `app.store_answer`-in TAM DUBLİKATI (fərqli
--    parametr adları, EYNİ məntiq: `private.question_answers`-ə yazır). Heç bir kod bunu
--    çağırmır (`app.store_answer` çağırılır, `web/app/api/solve/route.ts`). SİLİNİR.
--
-- 2. `public.store_generated_steps` (`0037`) — `SECURITY DEFINER`, `public`-də. `anon`/
--    `authenticated`-in EXECUTE-u YOXDUR (`0030`-un `alter default privileges` qaydası
--    avtomatik qorudu) — AKTİV zəiflik deyil, amma gate-78-in bağladığı DƏQİQ risk
--    sinfini (PostgREST-ə görünən sxemdə SECURITY DEFINER funksiya) TƏKRAR açır. `app`
--    sxeminə köçürülür, digər 5 RPC ilə eyni sərhədə.
--
-- Audit jurnalı (`private.answer_access_log`) ARTIQ İŞLƏYİR (`app.reveal_answer`/
-- `app.reveal_step_answer` hər çağırışda ora yazır) — ClickUp tapşırığının ikinci
-- narahatlığı da əsassız çıxdı, əlavə düzəliş tələb olunmur.

drop function if exists public.store_answer(uuid, jsonb, text);

alter function public.store_generated_steps(uuid, text, jsonb, jsonb, text, numeric, text)
  set schema app;

revoke all on function app.store_generated_steps(uuid, text, jsonb, jsonb, text, numeric, text)
  from public, anon, authenticated;
grant execute on function app.store_generated_steps(uuid, text, jsonb, jsonb, text, numeric, text)
  to app_runtime;
