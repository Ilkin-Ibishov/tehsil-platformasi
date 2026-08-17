-- E1.2 (86eyncj7k): `verification_method='sympy'` yalan idi — kod mathjs işlədir.
-- Expand-contract YOX: yalnız mövcud text dəyərinin yenidən yazılması, obyekt köçürülmür.
-- Kod hər iki etiketi oxuyur (`bank.ts` `sympy` → `mathjs_equation`), ona görə köhnə
-- deploy bu UPDATE-dən sonra da oxuya bilir.
--
-- `schema_version` bump YOX — `verification` LLM müqaviləsi deyil (STEP-SCHEMA:
-- "Serverdə doldurulur, LLM tərəfindən YOX"). Enum STEP-SCHEMA-da yenilənir, `$id` v1 qalır.

update public.question_translations
   set verification_method = 'mathjs_equation'
 where verification_method = 'sympy';

comment on column public.question_translations.verification_method is
  'mathjs_equation | mathjs_unit | human | none. Köçürmə: sympy → mathjs_equation (0070).';
