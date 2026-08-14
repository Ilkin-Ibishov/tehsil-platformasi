-- 0062 · canonical geriyə doldurulması (S8, ClickUp 86eymwgmv, ADR-003 Ləğv 2026-08-14)
--
-- `2026-08-08 §D1`-in qərarı ilə boşaldılmış `questions.canonical` sətirləri
-- `question_translations.stem.blocks[0].v`-dən bərpa edilir — eyni mətn artıq ORADA idi
-- (ADR-003-ün özünün "məqsədi onsuz da pozulurdu" tapıntısı), bərpa itki YARATMIR.
-- `lang='az'` seçilir (yeganə mövcud dil), `stem`-i olmayan/başqa formatda olan sətirlər
-- toxunulmadan qalır (WHERE şərti onları süzür).

update public.questions q
   set canonical = qt.stem->'blocks'->0->>'v'
  from public.question_translations qt
 where qt.question_id = q.id
   and qt.lang = 'az'
   and q.canonical = ''
   and q.source = 'user_capture'
   and qt.stem->'blocks'->0->>'v' is not null
   and qt.stem->'blocks'->0->>'v' <> '';
