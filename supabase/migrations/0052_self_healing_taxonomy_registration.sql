-- 0052 · 0051-in sərt FK-larının geri alınması + öz-özünü sağaldan qeydiyyat
-- DB-də tətbiq adları: 0050_fix_0049_self_healing_taxonomy (20260813204458)
--                      0051_fingerprint_invariant_correct_source_value (20260813204513)
--
-- SƏBƏB (persist.ts oxunandan sonra tapıldı):
--   1) user_capture sətirləri PREFİKSSİZ fingerprint yazır ('300,5') -> trigger rədd edərdi
--   2) topic_code LLM-dən gəlir (AÇIQ çoxluq) -> sərt FK insert-i dağıdardı
-- Hər ikisi produksiyada 500 verərdi. Şagird axınında sərt rədd yoxdur.

alter table public.questions   drop constraint if exists questions_topic_code_fk;
alter table public.step_events drop constraint if exists step_events_error_code_fk;

alter table public.topic_codes add column if not exists needs_review boolean not null default false;
alter table public.error_codes add column if not exists needs_review boolean not null default false;

create or replace function public.register_topic_code()
returns trigger language plpgsql as $$
begin
  if new.topic_code is null then return new; end if;
  insert into public.topic_codes (code, fingerprint_prefix, title_az, bank_matchable, active, needs_review)
  values (new.topic_code, null, new.topic_code, false, false, true)
  on conflict (code) do nothing;
  return new;
end $$;

drop trigger if exists trg_register_topic_code on public.questions;
create trigger trg_register_topic_code
  before insert or update of topic_code on public.questions
  for each row execute function public.register_topic_code();

create or replace function public.register_error_code()
returns trigger language plpgsql as $$
begin
  if new.error_code is null then return new; end if;
  insert into public.error_codes (code, title_az, description, active, needs_review)
  values (new.error_code, new.error_code, 'Kodda avtomatik qeydə alındı', false, true)
  on conflict (code) do nothing;
  return new;
end $$;

drop trigger if exists trg_register_error_code on public.step_events;
create trigger trg_register_error_code
  before insert on public.step_events
  for each row execute function public.register_error_code();

create or replace view public.v_taxonomy_review as
select 'topic' as nov, code, title_az, needs_review, active from public.topic_codes where needs_review
union all
select 'error', code, title_az, needs_review, active from public.error_codes where needs_review;

grant select on public.v_taxonomy_review to app_runtime;
