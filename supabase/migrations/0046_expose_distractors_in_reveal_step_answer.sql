-- ClickUp "Distraktor cədvəli — səhv cavab reaksiyası LLM-siz". `private.step_answers.
-- distractors` (0039/0040) 217 generasiya sualının hamısında doludur, amma heç bir kod
-- oxumur — `app.reveal_step_answer` `distractors`-u jsonb cavabına daxil ETMİRDİ. Bu
-- düzəliş YALNIZ RPC-nin qaytardığı sahələri genişləndirir (yeni sütun/cədvəl YOX, əlavə
-- icazə YOX) — `/api/steps/check` (0047-ci addımda, kod tərəfi) bunu şagirdin SƏHV
-- cavabına uyğun diaqnostik mesaj göstərmək üçün işlədəcək, LLM çağırışı OLMADAN.

create or replace function app.reveal_step_answer(q uuid, idx smallint, purpose text, ai uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare r jsonb;
begin
  if purpose not in ('verify','reveal','eval') then
    raise exception 'invalid purpose';
  end if;
  insert into private.answer_access_log (question_id, step_index, purpose, attempt_item_id)
  values (q, idx, purpose, ai);
  select jsonb_build_object('accept', accept, 'input_kind', input_kind, 'distractors', distractors) into r
  from private.step_answers where question_id = q and step_index = idx;
  return r;
end; $$;
