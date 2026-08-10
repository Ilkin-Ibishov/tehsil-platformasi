-- ADR-017 (answer isolation) + ADR-018 §4d + HANDOFF (71) — YENİDƏN YAZILIB.
--
-- HANDOFF (71): `check_answer`/`check_step` (bu faylın əvvəlki versiyası) SİLİNDİ.
-- Səbəb ADR-009-dur: "eval və istehsalat eyni məntiqi işlətməlidir" — SQL-dəki hərfi
-- `=`/`@>` müqayisəsi, `web/lib/verify/answer.ts`-in ədədi-tolerantlı müqayisəsindən
-- (mathjs, `0.5 = 1/2`, unicode minus) FƏRQLİ, İKİNCİ bir müqayisə nüsxəsi idi.
-- Düzəliş onları düzəltmək DEYİL, silməkdir — DB YALNIZ saxlayır və verir, müqayisə
-- bütövlükdə TypeScript-də qalır.
--
-- ADR-017-nin təminatı bunun üzərinə DƏQİQLƏŞDİRİLİB: cavab CƏDVƏL OXUMAQLA əlçatan
-- deyil (yalnız aşağıdakı 4 adlı, audit olunan funksiya ilə) — "tətbiq prosesi
-- cavabı görə bilmir" DEYİL, çünki müqayisə üçün dəyər labüd olaraq Node-a gəlir.
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
-- app_runtime-a private sxeminə HEÇ BİR GRANT verilmir (qəsdən) — yeganə giriş
-- aşağıdakı 4 `SECURITY DEFINER` funksiyasıdır.

create table if not exists private.question_answers (
  question_id uuid primary key references public.questions (id) on delete cascade,
  answer      jsonb not null,   -- STEP-SCHEMA final_answer tam obyekti: {latex,values,choice}
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

-- Hər OXUMA (`reveal_*`) buraya yazır — `purpose='verify'` sayının qəfil artması
-- sızma/sui-istifadə siqnalıdır. `attempt_item_id` hansı cəhdin oxuduğunu bağlayır.
create table if not exists private.answer_access_log (
  id              bigserial primary key,
  question_id     uuid not null,
  step_index      smallint,
  purpose         text not null,   -- 'verify' | 'reveal' | 'eval'
  attempt_item_id uuid,
  at              timestamptz not null default now()
);
create index if not exists idx_answer_access_log_purpose_at
  on private.answer_access_log (purpose, at);

-- ═══════════════════════════════════════════════════════════════════════
-- OXUMA. Hər çağırış audit jurnalına yazır, `purpose` etibarsızdırsa rədd edir.
-- `answer`/`accept` NƏTİCƏSİ NULL ola bilər (açar yoxdursa) — çağıran (Node) bunu
-- idarə etməlidir, funksiya özü xəta atmır (açarsızlıq normal haldır, məs. hələ
-- `store_answer` çağırılmayıb).
-- ═══════════════════════════════════════════════════════════════════════

create or replace function public.reveal_answer(q uuid, purpose text, ai uuid default null)
returns jsonb language plpgsql security definer
set search_path = private, public as $$
declare r jsonb;
begin
  if purpose not in ('verify','reveal','eval') then
    raise exception 'invalid purpose';
  end if;
  insert into private.answer_access_log (question_id, purpose, attempt_item_id)
  values (q, purpose, ai);
  select jsonb_build_object('answer', answer, 'validator', validator) into r
  from private.question_answers where question_id = q;
  return r;
end; $$;

create or replace function public.reveal_step_answer(q uuid, idx smallint, purpose text,
                                                       ai uuid default null)
returns jsonb language plpgsql security definer
set search_path = private, public as $$
declare r jsonb;
begin
  if purpose not in ('verify','reveal','eval') then
    raise exception 'invalid purpose';
  end if;
  insert into private.answer_access_log (question_id, step_index, purpose, attempt_item_id)
  values (q, idx, purpose, ai);
  select jsonb_build_object('accept', accept, 'input_kind', input_kind) into r
  from private.step_answers where question_id = q and step_index = idx;
  return r;
end; $$;

-- ═══════════════════════════════════════════════════════════════════════
-- YAZMA (G1). `/api/solve` hər yeni foto üçün cavab açarı yazmalıdır —
-- `app_runtime`-in `private`-ə birbaşa INSERT icazəsi YOXDUR, yalnız bu RPC-lər.
-- INSERT-ONLY: mövcud açar ÜZƏRİNƏ YAZILMIR (`ON CONFLICT DO NOTHING`). Səbəb:
-- əks halda istifadəçi açarı öz bildiyi dəyərlə əvəzləyib bankı korlaya bilərdi.
-- Düzəliş yolu yeni `questions` versiyası yaratmaqdır (§5), üzərinə yazma DEYİL.
-- ═══════════════════════════════════════════════════════════════════════

create or replace function public.store_answer(q uuid, a jsonb, v text default 'exact')
returns boolean language plpgsql security definer
set search_path = private, public as $$
begin
  insert into private.question_answers (question_id, answer, validator)
  values (q, a, v)
  on conflict (question_id) do nothing;
  return found;
end; $$;

create or replace function public.store_step_answers(q uuid, rows jsonb)
returns int language plpgsql security definer
set search_path = private, public as $$
declare n int;
begin
  -- rows: [{"step_index":0,"accept":[...],"input_kind":"numeric"}, ...]
  insert into private.step_answers (question_id, step_index, accept, input_kind)
  select q, (e->>'step_index')::smallint, e->'accept', e->>'input_kind'
  from jsonb_array_elements(rows) e
  on conflict (question_id, step_index) do nothing;
  get diagnostics n = row_count;
  return n;
end; $$;

revoke all on function public.reveal_answer, public.reveal_step_answer,
                       public.store_answer, public.store_step_answers from public;
grant execute on function public.reveal_answer, public.reveal_step_answer,
                          public.store_answer, public.store_step_answers to app_runtime;

-- RLS burada PostgREST müdafiəsi ÜÇÜN DEYİL (Supabase `private` sxemini ifşa etmir,
-- `app_runtime`-in artıq HEÇ bir GRANT-ı yoxdur) — CLAUDE.md qayda 6-nın hərfi tələbinə
-- görə əlavə olunur, ikinci deyil, ÜÇÜNCÜ müdafiə qatı kimi.
alter table private.question_answers  enable row level security;
alter table private.step_answers      enable row level security;
alter table private.answer_access_log enable row level security;
