-- ⚠️ Bu fayl production-da ARTIQ TƏTBİQ OLUNUB (Cowork tərəfindən) — burada YALNIZ repo-nu
-- production ilə sinxron saxlamaq üçün YAZILIB. Yenidən tətbiq ETMƏ.

alter table private.step_answers
  add column if not exists distractors jsonb not null default '[]'::jsonb;

comment on column private.step_answers.distractors is
  'Gözlənilən səhv cavablar: [{match:[...], error_code, message}]. Şagird səhv edəndə LLM çağırışı olmadan izah verilir.';

-- distraktor obyekti qurur
create or replace function private.mk_distr(p_match jsonb, p_ec text, p_msg text)
returns jsonb language sql immutable as $$
  select jsonb_build_object('match', p_match, 'error_code', p_ec, 'message', p_msg);
$$;

-- düzgün cavabla üst-üstə düşən distraktorları atır (məsələn b=0 olanda -b = b)
create or replace function private.distr(p_accept jsonb, p_items jsonb)
returns jsonb language sql immutable as $$
  select coalesce(jsonb_agg(i), '[]'::jsonb)
  from jsonb_array_elements(p_items) i
  where not exists (
    select 1 from jsonb_array_elements_text(i->'match') m
    where p_accept ? m
  );
$$;
