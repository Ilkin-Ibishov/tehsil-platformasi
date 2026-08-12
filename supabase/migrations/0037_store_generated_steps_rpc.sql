-- ⚠️ Bu fayl production-da ARTIQ TƏTBİQ OLUNUB (Cowork tərəfindən) — burada YALNIZ repo-nu
-- production ilə sinxron saxlamaq üçün YAZILIB. Yenidən tətbiq ETMƏ.
--
-- DİQQƏT (bax `0043`): bu funksiya `public` sxemində yaradılıb, `gate-78`-in (0030) 4
-- answer-RPC-ni PostgREST-ə görünməyən `app` sxeminə köçürmə qərarına ZİDD. Hazırda
-- `anon`/`authenticated` EXECUTE-u YOXDUR (`0030`-un `alter default privileges` qaydası
-- avtomatik qorudu), ona görə AKTİV zəiflik DEYİL — amma eyni risk sinfini təkrar açır.
-- `0043` bunu `app.store_generated_steps`-ə köçürür, ardıcıllığı qorumaq üçün BURADA
-- olduğu kimi (public) sinxronlaşdırılır, sonra 0043-də köçürülür.

create or replace function public.store_generated_steps(
  p_question_id uuid,
  p_lang text,
  p_steps jsonb,
  p_step_answers jsonb,
  p_model text default null,
  p_cost_usd numeric default null,
  p_prompt_version text default null
) returns boolean
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_n int;
  v_updated int;
begin
  if p_lang not in ('az','ru','en','tr') then
    raise exception 'unsupported lang: %', p_lang;
  end if;

  if jsonb_typeof(p_steps) <> 'array' or jsonb_array_length(p_steps) = 0 then
    raise exception 'steps must be a non-empty array';
  end if;

  v_n := jsonb_array_length(p_steps);

  -- indekslər 1..n ardıcıl olmalıdır (step_answers ilə sürüşməni bloklayır)
  if exists (
    select 1 from jsonb_array_elements(p_steps) with ordinality as e(v, ord)
    where (e.v->>'index')::int is distinct from e.ord::int
  ) then
    raise exception 'steps[].index must be contiguous 1..%', v_n;
  end if;

  if jsonb_typeof(p_step_answers) <> 'array'
     or jsonb_array_length(p_step_answers) <> v_n then
    raise exception 'step_answers length must equal steps length (%)', v_n;
  end if;

  -- yalnız boş olan tərcüməyə yaz; mövcud həlli üzərinə yazmır
  update public.question_translations
     set steps = p_steps,
         model = coalesce(p_model, model),
         cost_usd = coalesce(p_cost_usd, cost_usd),
         prompt_version = coalesce(p_prompt_version, prompt_version),
         verification_method = 'llm_generated',
         updated_at = now()
   where question_id = p_question_id
     and lang = p_lang
     and steps is null;

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    return false;  -- artıq doldurulub və ya tərcümə sətri yoxdur
  end if;

  insert into private.step_answers (question_id, step_index, accept, input_kind)
  select p_question_id, e.ord::smallint,
         coalesce(e.v->'accept', '[]'::jsonb),
         coalesce(e.v->>'input_kind', 'number')
  from jsonb_array_elements(p_step_answers) with ordinality as e(v, ord)
  on conflict (question_id, step_index) do nothing;

  return true;
end;
$$;

revoke all on function public.store_generated_steps(uuid, text, jsonb, jsonb, text, numeric, text) from public, anon, authenticated;
grant execute on function public.store_generated_steps(uuid, text, jsonb, jsonb, text, numeric, text) to app_runtime;
