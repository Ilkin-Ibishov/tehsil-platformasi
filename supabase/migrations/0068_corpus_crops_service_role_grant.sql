-- 0067 production-a tətbiq olundu; service_role GRANT orada yox idi.
-- --upload REST service_role JWT ilə yazır — BYPASSRLS GRANT-i əvəz etmir.

grant select, insert, update on public.corpus_crops to service_role;
