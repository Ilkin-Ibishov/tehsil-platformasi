-- ⚠️ Bu fayl production-da ARTIQ TƏTBİQ OLUNUB (Cowork tərəfindən) — burada YALNIZ repo-nu
-- production ilə sinxron saxlamaq üçün YAZILIB. Yenidən tətbiq ETMƏ.

update public.questions
   set superseded_by = '7082409e-df0c-46ed-aaff-ba6ee242baca',
       updated_at = now()
 where id = '2df7ae67-3266-494f-a12e-d676e5711026'
   and superseded_by is null;

create unique index if not exists questions_fingerprint_dedup_idx
  on public.questions (numeric_fingerprint, subject_id, grade)
  where numeric_fingerprint is not null
    and superseded_by is null
    and deleted_at is null;

comment on column public.questions.numeric_fingerprint is 'Normalized structural signature. Enforced unique per subject+grade. Bulk import MUST populate this; canonical_hash does not catch reworded duplicates.';

alter table private.step_answers
  add constraint step_answers_step_index_check check (step_index >= 1);
