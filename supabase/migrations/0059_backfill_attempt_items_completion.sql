-- 0059 · attempt_items.completed/revealed_answer/duration_sec/self_solved — geriyə düzəliş
-- (S4, ClickUp 86eymwgk7). Bu sütunlar sxemdə var idi, YAZAN kod yox idi (blok 95-in
-- tapıntısı) — `web/app/api/attempts/progress/route.ts` bu sessiyada düzəldildi (kod
-- dəyişikliyi, bu fayl DEYİL). Bura YALNIZ mövcud 16 sətrin `events` tarixçəsindən BİR
-- DƏFƏLİK geriyə hesablanmasıdır.
--
-- `self_solved` BURADA yazılmır — `information_schema`-dan aşkarlandı ki, `attempt_items.
-- self_solved` artıq GENERATED ALWAYS sütundur: `(revealed_answer = false) AND
-- (hints_used = 0)` (heç bir sənəddə qeyd olunmayıb, DB-nin özündən oxundu). `revealed_answer`
-- düzgün yazılanda bu sütun AVTOMATIK doğru hesablanır — `hints_used` isə kodda heç yerdə
-- YAZILMIR (defolt 0-da qalır), ona görə hazırkı praktikada düstur `NOT revealed_answer`-ə
-- bərabərdir (S4-ün tələb etdiyi tərif ilə UYĞUNDUR).

update attempt_items ai
   set revealed_answer = true
  from events e
 where e.attempt_id = ai.attempt_id
   and e.name = 'solution.answer_revealed';

update attempt_items ai
   set completed = true,
       duration_sec = coalesce(nullif(e.props->>'duration_sec', '')::int, ai.duration_sec),
       time_ms = coalesce(nullif(e.props->>'duration_sec', '')::int * 1000, ai.time_ms)
  from events e
 where e.attempt_id = ai.attempt_id
   and e.name = 'solution.completed';
