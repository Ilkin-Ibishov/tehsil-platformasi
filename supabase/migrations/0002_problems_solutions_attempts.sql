-- problems / solutions / attempts (docs/DATA-MODEL.md, S3 — docs/PHASE-1.md).
-- Portativ SQL, Supabase-ə xas heç nə yoxdur (0001 ilə eyni prinsip).
--
-- ADR-012: attempts.device_id əlavə edildi, user_id nullable saxlanıldı — Faza 1-də
-- auth yoxdur (docs/PHASE-1.md → sahə xaricində), gündəlik limit device_id üzrədir.

create table if not exists problems (
  id                 uuid primary key,
  canonical          text not null,
  canonical_hash     text not null unique,
  numeric_fingerprint text,
  problem_type       text,
  subject            text not null,
  grade              int,
  topic_code         text,
  source             text not null default 'user_photo',
  source_ref         text,
  hit_count          int not null default 0,
  created_at         timestamptz not null default now()
);

create index if not exists problems_fingerprint_idx on problems (numeric_fingerprint);

create table if not exists solutions (
  id                  uuid primary key,
  problem_id          uuid not null references problems (id),
  schema_version      int not null default 1,
  payload             jsonb not null,
  verified            bool not null default false,
  verification_method text not null default 'none',
  model               text,
  cost_usd            numeric,
  created_at          timestamptz not null default now()
);

create index if not exists solutions_problem_idx on solutions (problem_id);

create table if not exists attempts (
  id                 uuid primary key,
  user_id            uuid,        -- Faza 1-də NULL — auth yoxdur (ADR-012)
  device_id          uuid not null,
  problem_id         uuid references problems (id),
  solution_id        uuid references solutions (id),
  match_path         text not null default 'llm',
  ocr_source         text not null default 'vision_llm',
  ocr_corrected      bool not null default false,
  revealed_answer    bool not null default false,
  completed          bool not null default false,
  abandoned_at_step  int,
  duration_sec       int,
  transfer_correct   bool,
  created_at         timestamptz not null default now()
);

create index if not exists attempts_device_created_idx on attempts (device_id, created_at);
create index if not exists attempts_problem_idx on attempts (problem_id);
