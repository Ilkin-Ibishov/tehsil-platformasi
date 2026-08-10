-- design.md §6 (yekun forma, HANDOFF 65). Additiv — boş cədvəl yaradır, `0017` doldurur.
--
-- `steps` mənbə həqiqəti `docs/STEP-SCHEMA.json` → `steps[]`-dir, BURADA TƏKRAR TƏRİF
-- OLUNMUR (ADR-018 §2a). Tək fərq: hər addımın `check` obyekti burada YALNIZ `ask` və
-- `input_kind` saxlayır — `accept` (doğru cavab) `private.step_answers`-dədir (0018/0019).

create table if not exists question_translations (
  question_id           uuid not null references questions (id) on delete cascade,
  lang                  text not null check (lang in ('az','ru','en','tr')),
  stem                  jsonb not null,          -- Content: { blocks: Block[] }
  options               jsonb,                    -- {"A":Content, ...} — çoxseçimli tiplər üçün
  steps                 jsonb not null,           -- STEP-SCHEMA steps[], check.accept ÇIXARILIB
  misconception         jsonb,                    -- {"A":{"error_code":..., "note":...}}
  hint                  jsonb,
  -- ADR-018 §2b additiv sütunlar (Cowork təsdiqi HANDOFF 65-də alındı) — user_capture
  -- axını üçün lazımdır, design.md-nin kuratoriya-fərziyyəli orijinalında yox idi.
  verified              boolean not null default false,
  verification_method   text,                     -- 'sympy' | 'human' | 'none'
  model                 text,
  cost_usd              numeric(8,5),
  prompt_version        text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  primary key (question_id, lang)
);

create index if not exists idx_question_translations_verified
  on question_translations (question_id) where verified;

create function resolve_translation(q uuid, pref text)
returns question_translations language sql stable as $$
  select * from question_translations
  where question_id = q
  order by array_position(array[pref,'az','tr','en']::text[], lang) nulls last
  limit 1;
$$;

alter table question_translations enable row level security;
