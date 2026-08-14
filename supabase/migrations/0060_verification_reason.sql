-- 0060 · verification_reason sütunu (S5, ClickUp 86eymwgkv)
--
-- `verifyFinalAnswer`/`equationCrossCheck` (`web/lib/verify/answer.ts`) `verified===null`
-- olanda NİYƏ yoxlanıla bilmədiyini indi bir kodla qaytarır (`no_equation_extracted` |
-- `no_single_variable_equation`). Additiv sütun — köhnə sətirlərdə `null` qalır (tarixi
-- data, geriyə hesablamaq mənbə mətn olmadan mümkün deyil, `canonical` çoxu vaxt boşdur).

alter table public.question_translations
  add column if not exists verification_reason text
  check (verification_reason in ('no_equation_extracted', 'no_single_variable_equation'));

comment on column public.question_translations.verification_reason is
  'verification_method=''none'' olanda NİYƏ (S5, 0060). NULL = ya verified=true/false idi, ya köhnə (bu sütundan əvvəlki) sətir.';
