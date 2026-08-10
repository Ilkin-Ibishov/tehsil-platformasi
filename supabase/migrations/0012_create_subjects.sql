-- ADR-018 §1a / .kiro/specs/test-bank/design.md §3. Additiv, sıfır risk — mövcud
-- cədvəllərə toxunmur. `subjects` kurikulum taksonomiyasının kökü, `questions.subject_id`
-- (0014) bundan asılıdır.
--
-- 0010/0011 qəsdən boş buraxılıb — HANDOFF (64) #6, HANDOFF (58)/(59)-da gözlənilən
-- `problems.dim_substandard` və `solutions.prompt_version` üçün ayrılıb.

create table if not exists subjects (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,        -- 'math' / 'physics' / 'chemistry' — ADR-008
  label      jsonb not null,               -- {"az":"Riyaziyyat", ...}
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Mövcud `problems.subject`-in üç dəyərindən seedlənir (STEP-SCHEMA.json $defs.subject_labels_az).
insert into subjects (code, label)
values
  ('math',      '{"az":"Riyaziyyat"}'::jsonb),
  ('physics',   '{"az":"Fizika"}'::jsonb),
  ('chemistry', '{"az":"Kimya"}'::jsonb)
on conflict (code) do nothing;

alter table subjects enable row level security;
-- Siyasətsiz — 0007-dəki qayda ilə eyni məntiq (tətbiq DATABASE_URL/app_runtime ilə
-- RLS-i bypass edir, anon tam bağlıdır). CLAUDE.md qayda 6.
