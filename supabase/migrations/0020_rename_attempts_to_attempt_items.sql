-- ADR-018 §3a. ⚠️ BREAKING — `attempts` → `attempt_items` adı dəyişir, `problem_id`/
-- `solution_id` → `question_id`. Eyni deploy-koordinasiya xəbərdarlığı `0014`-dəki
-- kimi qüvvədədir: tətbiq kodu (`web/app/api/**`) yenilənməyincə tətbiq edilməsin.
--
-- `id` HƏLƏ DƏYİŞMİR bu addımda — köhnə `attempts.id` `0021`-də yeni sessiya
-- `attempts.id`-si olacaq (§3b), YENİ item `id` də `0021`-də generasiya olunur.
-- Bu fayl yalnız struktur dəyişikliyidir, `0021` data köçürməsidir.

alter table attempts rename to attempt_items;

alter table attempt_items rename column problem_id to question_id;

-- solution_id artıq lazım deyil — tərcümə/cavab konteksti `question_id` + `lang='az'`
-- ilə `question_translations`/`private.question_answers`-dən gəlir (§2). Sütun
-- SİLİNMİR (məlumat itkisi riski, ADR-018 §6-dakı "köhnə cədvəllər saxlanılır" qaydası),
-- yalnız artıq FK olaraq işlədilmir — gələcək təmizləmə ayrı miqrasiyadır.

alter table attempt_items
  add column if not exists given_answer      jsonb,
  add column if not exists is_correct        boolean,
  add column if not exists error_code        text,
  add column if not exists time_ms           int,
  add column if not exists steps_revealed    smallint not null default 0,
  add column if not exists steps_total       smallint,
  add column if not exists hints_used        smallint not null default 0;

-- `completed` düşür — `steps_revealed = steps_total` ilə əvəzlənir (§3a). Sütun
-- SİLİNMİR (data itkisi riski), yalnız artıq oxunmur — `0021` onun yerinə
-- `steps_revealed`/`steps_total`-ı doldurur.

alter table attempt_items add column if not exists attempt_id uuid;
-- FK `0021`-dən sonra əlavə olunur (yeni `attempts` cədvəli hələ yaranmayıb).
