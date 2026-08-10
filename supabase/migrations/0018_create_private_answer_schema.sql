-- ADR-017 (answer isolation) + ADR-018 §4d (addım-səviyyəli izolyasiya, HANDOFF 65 #2).
--
-- ⚠️ Bu fayl `psql -v app_runtime_pw=...` ilə tətbiq olunmalıdır (parol dəyişəni).
-- Supabase SQL Editor-dən əl ilə tətbiq edilirsə, `:'app_runtime_pw'` sətrini real
-- parolla ƏVƏZLƏ, faylı olduğu kimi commit etmə (parol Vercel env-də saxlanılır,
-- HANDOFF/ADR-də YAZILMIR — bax ADR-018 §4b).
--
-- Rol artıq mövcuddursa (təkrar tətbiq) `CREATE ROLE` xəta verər — DO bloku bunu
-- idempotent edir.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'app_runtime') then
    execute format('create role app_runtime login password %L', :'app_runtime_pw');
  end if;
end
$$;

grant usage on schema public to app_runtime;
grant select, insert, update on all tables in schema public to app_runtime;
-- Gələcək cədvəllər üçün avtomatik — ADR-017-nin öz qeyd etdiyi riski bağlayır
-- (ADR-018 §4a).
alter default privileges in schema public
  grant select, insert, update on tables to app_runtime;

create schema if not exists private;
revoke all on schema private from public;
-- app_runtime-a private sxeminə HEÇ BİR GRANT verilmir (qəsdən).

create table if not exists private.question_answers (
  question_id uuid primary key references public.questions (id) on delete cascade,
  answer      jsonb not null,
  validator   text not null default 'exact'  -- exact | numeric_tolerance | set | ordered
);

-- Addım-səviyyəli cavablar (STEP-SCHEMA steps[].check.accept). Dilə bağlı DEYİL —
-- step_index tərcümələr arasında eynidir (hər dildə eyni addım sırası), cavab dəyəri
-- dil-neytraldır (rəqəm/ifadə).
create table if not exists private.step_answers (
  question_id uuid not null references public.questions (id) on delete cascade,
  step_index  smallint not null,
  accept      jsonb not null,
  input_kind  text not null,
  primary key (question_id, step_index)
);

create or replace function public.check_answer(q uuid, given jsonb)
returns jsonb language plpgsql security definer
set search_path = private, public as $$
declare a jsonb; v text;
begin
  select answer, validator into a, v
  from private.question_answers where question_id = q;
  return jsonb_build_object('is_correct', a = given);
end; $$;

revoke all on function public.check_answer from public;
grant execute on function public.check_answer to app_runtime;

-- Addım yoxlaması. `error_code` `question_translations.steps[].error_code`-dan
-- (public) gəlir, DOĞRU cavab isə burada heç vaxt qaytarılmır.
create or replace function public.check_step(q uuid, idx smallint, given jsonb)
returns jsonb language plpgsql security definer
set search_path = private, public as $$
declare a jsonb; k text;
begin
  select accept, input_kind into a, k
  from private.step_answers where question_id = q and step_index = idx;
  return jsonb_build_object('is_correct', a @> given, 'input_kind', k);
end; $$;

revoke all on function public.check_step from public;
grant execute on function public.check_step to app_runtime;

-- `sympy` yoxlaması (ADR-009) bu funksiyaların yerini tutmur — `/api/steps/check`
-- daxilində qalır, doğru dəyəri `check_step`/`check_answer` vasitəsilə alır. Doğru
-- dəyər Node prosesində açıq saxlanmır (bu, tətbiq kodu dəyişikliyidir, bu ADR-in
-- əhatəsində DEYİL — bax ADR-018 §4, "kod yazılmayıb, plan").

-- RLS burada PostgREST müdafiəsi ÜÇÜN DEYİL (Supabase `private` sxemini ifşa etmir,
-- `app_runtime`-in artıq HEÇ bir GRANT-ı yoxdur) — CLAUDE.md qayda 6-nın hərfi tələbinə
-- görə əlavə olunur, ikinci deyil, ÜÇÜNCÜ müdafiə qatı kimi.
alter table private.question_answers enable row level security;
alter table private.step_answers     enable row level security;
