-- ADR-018 §4d. Data-only, `0018`-dən sonra işləyir. Eyni "qazanan həll" seçimi
-- `0017` ilə TƏKRARLANIR (eyni sıralama: `verified` üstünlük, sonra `created_at` DESC,
-- yalnız `status='ok'`/naməlum) — iki fayl fərqli qazanan seçsə, `question_translations`
-- və `private.question_answers` uyğunsuz düşərdi. Eyni CTE şərti budur ki, bu risk
-- olmasın.
--
-- `question_answers.answer` = tam `final_answer` obyekti (`latex`/`values`/`choice`),
-- `validator='exact'`. HANDOFF (71) / G3: bu, SAXLAMA formatıdır və DÜZGÜNDÜR —
-- `web/lib/verify/answer.ts`-in tam obyektə ehtiyacı var (`latex` göstərmək üçün,
-- `values` müqayisə üçün). `check_answer` (hərfi `a = given` müqayisəsi) HANDOFF (71)-də
-- SİLİNDİ — ADR-009-u pozurdu (SQL-də ikinci müqayisə nüsxəsi). Route
-- (`/api/answers/check`) əvəzinə `reveal_answer(q,'verify',attempt_item_id)` RPC-sini
-- çağırıb dəyəri Node-a gətirəcək, müqayisəni `studentAnswerMatches` edəcək — bax
-- `docs/decisions/ADR-019-api-layer-migration.md`.
--
-- Bu miqrasiya (`0019`) DİREKT CƏDVƏL YAZISI işlədir (`store_answer` RPC-si YOX) —
-- bu, QƏSDƏNdir: miqrasiyalar `MIGRATION_DATABASE_URL` (superuser/`postgres` rolu)
-- ilə işləyir, `app_runtime`-in insert-only RPC məhdudiyyəti YALNIZ tətbiq kodunun
-- yazı yoluna aiddir (ADR-017/018). Superuser üçün `on conflict do nothing`
-- (aşağıda) kifayətdir və eyni "insert-only, üzərinə yazma" prinsipini qoruyur.

with winning as (
  select distinct on (problem_id) *
  from solutions
  where payload ? 'canonical'
    and jsonb_typeof(payload -> 'steps') = 'array'
    and jsonb_array_length(payload -> 'steps') > 0
    and (payload ->> 'status' is null or payload ->> 'status' = 'ok')
  order by problem_id, (verified is true) desc, created_at desc
)
insert into private.question_answers (question_id, answer, validator)
select w.problem_id, w.payload -> 'final_answer', 'exact'
from winning w
where w.payload ? 'final_answer'
on conflict (question_id) do nothing;

with winning as (
  select distinct on (problem_id) *
  from solutions
  where payload ? 'canonical'
    and jsonb_typeof(payload -> 'steps') = 'array'
    and jsonb_array_length(payload -> 'steps') > 0
    and (payload ->> 'status' is null or payload ->> 'status' = 'ok')
  order by problem_id, (verified is true) desc, created_at desc
)
insert into private.step_answers (question_id, step_index, accept, input_kind)
select
  w.problem_id,
  (elem ->> 'index')::smallint,
  elem -> 'check' -> 'accept',
  coalesce(elem -> 'check' ->> 'input_kind', 'number')
from winning w, jsonb_array_elements(w.payload -> 'steps') elem
where elem -> 'check' ? 'accept'
on conflict (question_id, step_index) do nothing;

-- Qəbul yoxlaması (əl ilə): hər `question_translations` sətrinin uyğun
-- `private.question_answers` sətri olmalıdır —
--   select count(*) from question_translations qt
--   where not exists (
--     select 1 from private.question_answers qa where qa.question_id = qt.question_id
--   );
-- Sıfır olmalıdır.
