-- ⚠️ Bu fayl production-da ARTIQ TƏTBİQ OLUNUB (Cowork tərəfindən) — burada YALNIZ repo-nu
-- production ilə sinxron saxlamaq üçün YAZILIB. Yenidən tətbiq ETMƏ.
--
-- KÖK SƏBƏB (bax `0043`): bu miqrasiya `store_answer`-in "yoxa çıxdığı" fərziyyəsi ilə
-- yazılıb (ClickUp: "Yaddaşdakı RPC-lər DB-də yoxdur") — amma funksiya HEÇ VAXT itməmişdi,
-- `gate-78`-də (0030, HANDOFF 79) `app` sxeminə köçürülmüşdü. O sorğu `pg_proc`-u yalnız
-- `public`/`private` sxemlərində axtarıb, `app`-ı YOXLAMAYIB — buna görə "yoxdur" nəticəsi
-- YANLIŞ idi. Nəticə: indi EYNİ işi görən İKİ funksiya var (`app.store_answer` —
-- kod bunu çağırır — və bu, `public.store_answer` — heç bir kod çağırmır). `anon`/
-- `authenticated` EXECUTE-u YOXDUR (0030-un defolt-privileges qaydası qorudu), aktiv
-- zəiflik deyil, amma çaşdırıcı dublikatdır. `0043` bunu SİLİR.

create or replace function public.store_answer(
  p_question_id uuid,
  p_answer jsonb,
  p_validator text default 'exact'
) returns boolean
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare v_exists boolean;
begin
  if p_answer is null or jsonb_typeof(p_answer) <> 'object' then
    raise exception 'answer must be a json object';
  end if;

  select exists(select 1 from public.questions where id = p_question_id)
    into v_exists;
  if not v_exists then
    raise exception 'question % does not exist', p_question_id;
  end if;

  insert into private.question_answers (question_id, answer, validator)
  values (p_question_id, p_answer, coalesce(p_validator, 'exact'))
  on conflict (question_id) do nothing;

  return found;
end;
$$;

revoke all on function public.store_answer(uuid, jsonb, text) from public, anon, authenticated;
grant execute on function public.store_answer(uuid, jsonb, text) to app_runtime;
