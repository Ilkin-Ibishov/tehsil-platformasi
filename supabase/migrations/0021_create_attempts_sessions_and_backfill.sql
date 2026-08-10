-- ADR-018 §3b / §5. Sessiya konteyner cədvəli + data köçürməsi, `0020`-dən sonra.
--
-- `device_id` `uuid` olaraq SAXLANILIR (design.md-nin `TEXT` nümunəsi HANDOFF (65)-də
-- rədd edildi — mövcud tətbiq artıq `uuid` işlədir, dəyişmək lazımsız kod dəyişikliyi
-- yaradardı).

create table if not exists attempts (
  id                 uuid primary key,
  user_id            uuid,
  device_id          uuid not null,
  student_ref        text,
  assessment_id      uuid,               -- Faza 1-də NULL, `assessments` cədvəli yoxdur
  kind               text not null,
  started_at         timestamptz not null,
  finished_at        timestamptz,
  score              numeric(6,2),
  device             text,
  client_created_at  timestamptz not null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz
);

create index if not exists idx_attempts_user on attempts (user_id, started_at desc);
create index if not exists attempts_student_ref_idx on attempts (student_ref, created_at);

-- 1) Köhnə `attempt_items.id` sessiya sətri olaraq köçür — `events.attempt_id` bu
--    dəyərə istinad edir (ADR-018 §6 qəbul testi), zəncir qırılmamalıdır.
insert into attempts
  (id, user_id, device_id, student_ref, kind, started_at, finished_at, client_created_at)
select
  ai.id,
  ai.user_id,
  ai.device_id,
  ai.student_ref,
  'photo_solve',                                             -- HANDOFF (64) #4
  ai.created_at,
  case when ai.duration_sec is not null
       then ai.created_at + (ai.duration_sec || ' seconds')::interval
       else null end,
  ai.created_at
from attempt_items ai
where not exists (select 1 from attempts a where a.id = ai.id);

-- 2) `attempt_items` sətirlərini yeni item-`id`-yə keçir, sessiyaya bağla.
-- İkinci UPDATE-in şərti (`id = attempt_id`) miqrasiyanı idempotent edir: təkrar
-- tətbiqdə birinci UPDATE artıq `attempt_id`-ni doldurduğu üçün, ikinci UPDATE-in
-- şərti (id hələ dəyişməyib) yalnız İLK dəfə tutur.
update attempt_items set attempt_id = id where attempt_id is null;
update attempt_items set id = gen_random_uuid() where id = attempt_id;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'attempt_items_attempt_id_fkey'
  ) then
    alter table attempt_items
      add constraint attempt_items_attempt_id_fkey
      foreign key (attempt_id) references attempts (id) on delete cascade;
  end if;
end
$$;
alter table attempt_items alter column attempt_id set not null;
alter table attempt_items alter column id set not null;

create index if not exists idx_attempt_items_q on attempt_items (question_id);
create index if not exists idx_attempt_items_attempt on attempt_items (attempt_id);

-- 3) steps_total — qazanan tərcümənin addım sayı (`0017`-dən sonra mövcuddur).
--    Tərcüməsi olmayan sətirlər üçün 0 (naməlum, sonradan düzəldilə bilər).
update attempt_items ai
set steps_total = coalesce(
  (select jsonb_array_length(qt.steps) from question_translations qt
   where qt.question_id = ai.question_id and qt.lang = 'az'),
  0
)
where steps_total is null;
alter table attempt_items alter column steps_total set not null;

-- 4) steps_revealed — təxmini bərabərlik (ADR-018 §3d, dəqiq DEYİL, yalnız tarixi
--    sətirlər üçün). `abandoned_at_step` varsa o, yoxdursa (tamamlanıb sayılırdı)
--    `steps_total`.
update attempt_items
set steps_revealed = least(coalesce(abandoned_at_step, steps_total), steps_total)
where steps_revealed = 0;

alter table attempt_items
  add column if not exists self_solved boolean generated always as
    (revealed_answer = false and hints_used = 0) stored;

alter table attempts             enable row level security;
