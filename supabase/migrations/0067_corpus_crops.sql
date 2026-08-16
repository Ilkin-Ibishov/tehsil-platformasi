-- Faza 2 S1: korpus kəsikləri. PHASE-2 diaqramı `private.corpus_stems` deyirdi —
-- DİM mətni sütunu YOXDUR (ADR-016). Metadata `public.corpus_crops`-dadır; bucket `corpus`
-- 90 günlük `captures`-dən AYRI, silinmir.
--
-- Student path bu cədvəli çağırmır. RLS aktiv, anon/authenticated policy YOX.
-- Yazı: lokal skript service-role REST (storage.ts eyni cüt). app_runtime SELECT/INSERT
-- gələcək S2/S3 üçün AÇIQ (gate-78).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('corpus', 'corpus', false, 8388608, array['image/jpeg', 'image/png'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.corpus_crops (
  id            uuid primary key default gen_random_uuid(),
  pdf_ref       text not null,
  page          int not null check (page >= 0),
  label         text not null,
  bbox          jsonb not null,
  storage_path  text,
  image_sha256  text not null,
  width         int,
  height        int,
  bytes         int,
  qa_ok         boolean,
  created_at    timestamptz not null default now(),
  unique (pdf_ref, page, label)
);

create index if not exists idx_corpus_crops_pdf on public.corpus_crops (pdf_ref, page);
create index if not exists idx_corpus_crops_sha on public.corpus_crops (image_sha256);

alter table public.corpus_crops enable row level security;

drop policy if exists corpus_crops_app_runtime on public.corpus_crops;
create policy corpus_crops_app_runtime on public.corpus_crops
  for all to app_runtime using (true) with check (true);

revoke all on public.corpus_crops from public, anon, authenticated;
grant select, insert, update on public.corpus_crops to app_runtime;
grant select, insert, update on public.corpus_crops to service_role;

comment on table public.corpus_crops is
  'Faza 2 soak kəsikləri. DİM mətni yoxdur — yalnız bbox/hash/storage_path (ADR-016).';
