-- Təhlükəsizlik auditi (gate 78, P1/P2) — KRİTİK.
--
-- P1 tapıntısı: `reveal_answer`/`reveal_step_answer`/`store_answer`/`store_step_answers`
-- `SECURITY DEFINER`-dir (funksiya SAHİBİNİN — `postgres`, RLS-i bypass edən rol —
-- icazələri ilə işləyir), amma `anon`/`authenticated`-in `EXECUTE` icazəsi VAR idi
-- (Supabase-in `public` sxem üçün defolt ACL-i). Bu o deməkdir ki, layihənin ÖZ
-- kodu bu RPC-ləri heç vaxt client-dən çağırmasa da (yoxlanıldı — repo-da
-- `@supabase/supabase-js`, `NEXT_PUBLIC_SUPABASE_*`, ya da birbaşa `/rest/v1/rpc/`
-- çağırışı YOXDUR, hər şey server-only `pg`/`app_runtime` ilədir), İSTƏNİLƏN ADAM
-- layihənin `anon` açarını tapıb (Supabase-in öz REST/GraphQL "kəşf" səthindən) birbaşa
-- `POST https://<ref>.supabase.co/rest/v1/rpc/reveal_answer` ilə istənilən sualın
-- cavabını ala bilərdi — `RLS`-in bu funksiyalarla HEÇ BİR ƏLAQƏSİ YOXDUR (`SECURITY
-- DEFINER` cədvəl girişini funksiya body-si daxilində, sahibinin roluyla edir).
--
-- P2 tapıntısı (kök səbəb): bu, `0018`-in tək-tək unutduğu bir `REVOKE` DEYİL —
-- Supabase `public` sxemində YARADILAN HƏR yeni obyektə avtomatik `anon`/`authenticated`
-- ACL-i verir (defolt privileges, `postgres` rolunun özü qurub). Bir dəfəlik `revoke`
-- YALNIZ mövcud 4 funksiyanı düzəldərdi — GƏLƏCƏK hər `SECURITY DEFINER` funksiya YENİDƏN
-- açıq düşərdi. Struktur həll lazımdır: (A) funksiyaları PostgREST-in görmədiyi sxemə
-- köçür, (B) defolt-privileges-i özü dəyişdir ki, YENİ funksiyalar da avtomatik bağlı olsun.
--
-- ƏLAVƏ TAPINTI (auditdən): eyni "defolt ACL" problemi CƏDVƏLLƏRDƏ DƏ var —
-- `anon`/`authenticated` HƏR `public` cədvəlində tam CRUD (SELECT/INSERT/UPDATE/DELETE/
-- TRUNCATE) GRANT-ına malikdir. Hazırda RLS (`0024`/`0029`, yalnız `app_runtime`-a
-- siyasət) bunu FAKTIKI OLARAQ bloklayır — heç bir cədvəldə anon/authenticated üçün
-- siyasət yoxdur, RLS defolt-rədd edir. AMMA bu, TƏK müdafiə xəttidir: gələcəkdə kimsə
-- test üçün bir cədvələ səhvən icazəli siyasət yazsa, altında YATAN geniş GRANT dərhal
-- tam ifşa yaradar. Cədvəl GRANT-larını da geri çəkirik ki, İKİ müstəqil şey eyni anda
-- səhv olmalı olsun (dərinləşdirilmiş müdafiə).

-- ═══ P2(A) — 4 SECURITY DEFINER funksiyasını PostgREST-ə görünməyən sxemə köçür ═══

create schema if not exists app;
revoke all on schema app from public, anon, authenticated;
grant usage on schema app to app_runtime;

alter function public.reveal_answer(uuid, text, uuid) set schema app;
alter function public.reveal_step_answer(uuid, smallint, text, uuid) set schema app;
alter function public.store_answer(uuid, jsonb, text) set schema app;
alter function public.store_step_answers(uuid, jsonb) set schema app;

-- Sxem köçürməsi ACL-ləri SAXLAYIR — açıq təkrar-təsdiq (idempotent, dəyişməz nəticə).
revoke all on function app.reveal_answer(uuid, text, uuid) from public, anon, authenticated;
revoke all on function app.reveal_step_answer(uuid, smallint, text, uuid) from public, anon, authenticated;
revoke all on function app.store_answer(uuid, jsonb, text) from public, anon, authenticated;
revoke all on function app.store_step_answers(uuid, jsonb) from public, anon, authenticated;

grant execute on function app.reveal_answer(uuid, text, uuid) to app_runtime;
grant execute on function app.reveal_step_answer(uuid, smallint, text, uuid) to app_runtime;
grant execute on function app.store_answer(uuid, jsonb, text) to app_runtime;
grant execute on function app.store_step_answers(uuid, jsonb) to app_runtime;

-- `resolve_translation` (`0016`) `SECURITY DEFINER` DEYİL (advisor-da XƏBƏRDARLIQ
-- YARATMIR) və heç bir tətbiq kodu onu çağırmır (yoxlanıldı) — `public`-də qalır
-- (gələcəkdə PostgREST-dən çağırılması NƏZƏRDƏ TUTULA bilər, dil fallback funksiyasıdır),
-- amma indi lazımsız `anon`/`authenticated` EXECUTE-u geri çəkilir.
revoke execute on function public.resolve_translation(uuid, text) from anon, authenticated, public;

-- ═══ P2(B) — gələcək funksiyalar üçün defolt-privileges dəyişdirilir ═══

alter default privileges in schema public
  revoke execute on functions from anon, authenticated;
alter default privileges in schema app
  revoke execute on functions from anon, authenticated;

-- ═══ Əlavə — cədvəl GRANT-larının geri çəkilməsi (dərinləşdirilmiş müdafiə) ═══

revoke all on all tables in schema public from anon, authenticated;
alter default privileges in schema public
  revoke all on tables from anon, authenticated;

-- `app_runtime`-in GRANT-larına TOXUNULMUR (`0018`/`0027`-dəki cədvəl/sequence GRANT-ları
-- və `alter default privileges ... to app_runtime` dəyişməz qalır). `service_role`-a da
-- TOXUNULMUR — Supabase-in öz "etibarlı server" rolu, açarı client-ə heç vaxt getmir,
-- advisor onu problem kimi göstərmir.
