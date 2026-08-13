-- 0049 · OCR training korpusu (ADR-003)
-- DB-də tətbiq adı: 0043_ocr_captures_training_corpus (20260813134836)
-- Qeyd: fayl nömrəsi ilə DB adı fərqlidir - tətbiq zamanı nömrə toqquşması olub.

create table if not exists public.ocr_captures (
  id uuid primary key default gen_random_uuid(),
  attempt_item_id uuid references public.attempt_items(id) on delete set null,
  question_id uuid references public.questions(id) on delete set null,

  storage_path text,
  image_sha256 text,
  image_phash text,
  width int,
  height int,
  bytes int,

  model text,
  ocr_raw text not null,
  ocr_final text,
  corrected boolean not null default false,
  correction_kind text check (correction_kind in ('none','minor','major','rejected')),
  edit_distance int,

  source text not null default 'student' check (source in ('student','author','synthetic')),
  capture_condition text,
  train_split text check (train_split in ('train','val','test')),
  usable_for_training boolean not null default true,
  exclusion_reason text,

  latency_ms int,
  cost_usd numeric(10,6),
  created_at timestamptz not null default now()
);

create index if not exists idx_ocr_captures_phash on public.ocr_captures (image_phash);
create index if not exists idx_ocr_captures_sha on public.ocr_captures (image_sha256);
create index if not exists idx_ocr_captures_corrected on public.ocr_captures (corrected, source);
create index if not exists idx_ocr_captures_created on public.ocr_captures (created_at desc);
create index if not exists idx_ocr_captures_question on public.ocr_captures (question_id);

alter table public.ocr_captures enable row level security;

drop policy if exists app_runtime_full_access on public.ocr_captures;
create policy app_runtime_full_access on public.ocr_captures
  for all to app_runtime using (true) with check (true);

grant select, insert, update on public.ocr_captures to app_runtime;

comment on table public.ocr_captures is
  'OCR fine-tune korpusu. ocr_raw = təsdiq ekranından ƏVVƏLki model oxunuşu, ocr_final = sonrakı son mətn.';
