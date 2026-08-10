-- ADR-018 / design.md §3-4. Additiv, sıfır risk. Boş cədvəllər — Faza 1-də real
-- kurikulum məlumatı yoxdur (`topic_code` mətn kimi `questions`-da qalır, bax 0014),
-- standartlaşdırma gələcək işdir. Cədvəllər indi açılır ki, `question_standards`
-- FK-ları və `idx_questions_active` kimi sorğular sxemdə hazır olsun.

create table if not exists standards (
  id               uuid primary key default gen_random_uuid(),
  parent_id        uuid references standards (id),
  subject_id       uuid not null references subjects (id),
  grade            smallint not null check (grade between 1 and 11),
  curriculum_year  smallint not null,
  code             text not null,          -- '2.1.3' və ya DİM alt-standart kodu
  label            jsonb not null,
  sort_order       int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  unique (subject_id, curriculum_year, code)
);

create index if not exists idx_standards_lookup
  on standards (subject_id, grade, curriculum_year) where deleted_at is null;

create table if not exists question_groups (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null check (kind in ('reading','graph','table','audio')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists question_group_translations (
  group_id uuid not null references question_groups (id) on delete cascade,
  lang     text not null check (lang in ('az','ru','en','tr')),
  stimulus jsonb not null,
  primary key (group_id, lang)
);

-- question_standards FK `questions`-a `0014`-də yaradılır, ona görə bu cədvəl `0014`-dən
-- SONRA açılır (aşağıda, ayrı fayl deyil — sıra `0014`-ün öz sonundadır, bax şərh orada).

alter table standards                    enable row level security;
alter table question_groups              enable row level security;
alter table question_group_translations  enable row level security;
