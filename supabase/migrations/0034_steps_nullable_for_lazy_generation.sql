-- ⚠️ Bu fayl production-da ARTIQ TƏTBİQ OLUNUB (Cowork tərəfindən) — burada YALNIZ repo-nu
-- production ilə sinxron saxlamaq üçün YAZILIB. Yenidən tətbiq ETMƏ.
--
-- `question_translations.steps` indi NULL ola bilər: NULL = tərcümə (`stem`) idxal
-- olunub, addım-addım həll HƏLƏ generasiya edilməyib. Şagird sualla İLK dəfə qarşılaşanda
-- LAZY generasiya edilib bura keşlənir (bax `0037`-in `store_generated_steps` RPC-si).

alter table public.question_translations alter column steps drop not null;

comment on column public.question_translations.steps is 'NULL = stem imported, step-by-step solution not yet generated. Generated lazily on first student encounter and cached here.';

create index if not exists idx_question_translations_steps_pending
  on public.question_translations (question_id)
  where steps is null;
