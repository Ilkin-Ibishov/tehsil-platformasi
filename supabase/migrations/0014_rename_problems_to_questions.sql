-- ADR-018 §1 / §5 (0014). ⚠️ BREAKING — `problems` → `questions` adı dəyişir.
--
-- Bu, tək başına DEPLOY OLUNMAMALIDIR: `web/app/api/**` və `web/lib/**` hələ `problems`
-- adını işlədir. Tətbiq kodu yenilənməyincə bu miqrasiyanın Supabase-ə tətbiqi
-- PRODUKSIYANI DƏRHAL SINDIRAR (CLAUDE.md qayda 5 — "kod sxemdən irəli gedərsə
-- istehsalat dərhal sınır", burada TƏRSİNƏ: sxem koddan irəli gedir, nəticə eynidir).
-- Tətbiq (`apply_migration`) YALNIZ `web/`-in `problems`/`solutions` istinadları
-- `questions`/`question_translations`-a köçürüləndə, EYNİ deploy-da edilməlidir.
--
-- `id` DƏYİŞMİR — bu, RENAME-dir, YENİDƏN YARADILMA deyil. Mövcud `problems.id` dəyərləri
-- `questions.id` olaraq qalır (HANDOFF 64 #3: bir problemin bir neçə həlli "sinif dərinliyi"
-- klonu DEYİL, prompt-təkrarı sayılır — §2-yə bax, `questions` tərəfində klonlama YOXDUR).

alter table problems rename to questions;

alter table questions
  add column if not exists root_id              uuid,
  add column if not exists version               int not null default 1,
  add column if not exists superseded_by         uuid references questions (id),
  add column if not exists group_id              uuid references question_groups (id),
  add column if not exists subject_id            uuid references subjects (id),
  add column if not exists type                  text,
  add column if not exists payload               jsonb not null default '{}'::jsonb,
  add column if not exists difficulty_static     smallint,
  add column if not exists difficulty_calibrated numeric(4,3),
  add column if not exists attempt_count         int not null default 0,
  add column if not exists license_status        text not null default 'unknown',
  add column if not exists review_status         text not null default 'draft',
  add column if not exists reviewed_by           uuid,
  add column if not exists reviewed_at           timestamptz,
  add column if not exists updated_at            timestamptz not null default now(),
  add column if not exists deleted_at            timestamptz;

-- root_id = özü — mövcud sətirlərin hamısı öz versiya zəncirinin kökündədür (0015-də
-- yenidən doldurulmur, birbaşa burada, çünki NOT NULL sərhədi bu addımın daxilindədir).
update questions set root_id = id where root_id is null;
alter table questions alter column root_id set not null;

-- `canonical_hash` UNIQUE götürülür — design.md §5 "Dedup açarları": eyni məsələ fərqli
-- sinif-dərinliyi üçün klonlana bilər (gələcəkdə, `version`/`root_id` YOX, ayrı `questions`
-- sətri kimi — bax ADR-018 §2). Hazırkı data 1:1 rename olduğu üçün bu, İNDİ heç nəyi
-- pozmur, gələcək klonlama üçün yer açır.
alter table questions drop constraint if exists problems_canonical_hash_key;
create unique index if not exists questions_dedup_idx
  on questions (canonical_hash, subject_id, grade)
  where superseded_by is null and deleted_at is null;

create index if not exists idx_questions_active
  on questions (subject_id, grade, review_status)
  where superseded_by is null and deleted_at is null;
create index if not exists idx_questions_source on questions (source, source_ref);
create index if not exists idx_questions_root on questions (root_id);

-- question_standards — `questions` mövcud olandan sonra (bax 0013-ün şərhi).
create table if not exists question_standards (
  question_id uuid not null references questions (id) on delete cascade,
  standard_id uuid not null references standards (id),
  weight      numeric(3,2) not null default 1,
  primary key (question_id, standard_id)
);
alter table question_standards enable row level security;
