-- ADR-018 §1e / §1b / §6 (final qərarlar HANDOFF 64/65). Data-only, `0014`-dən sonra
-- işləyir. CHECK məhdudiyyətləri BACKFILL-dən SONRA əlavə olunur (əvvəl olsa köhnə
-- dəyərlər onları pozar).

-- §1a — subject_id
update questions q
set subject_id = s.id
from subjects s
where q.subject_id is null and s.code = q.subject;
-- Uyğunsuz sətir qalsa (subject enum-dan kənar dəyərdirsə) NOT NULL aşağıda AÇILMIR —
-- qəsdən: səssiz məlumat itkisi yerinə sətir görünən qalır, `subject_id is null` sorğusu
-- onu tapar. Enum bağlı olduğu üçün (STEP-SCHEMA) praktikada 0 gözlənilir.

-- §1e — source enum xəritəsi (köhnə → yeni)
update questions set source = case source
  when 'user_photo'  then 'user_capture'
  when 'dim_import'  then 'imported'
  when 'textbook'    then 'licensed'
  else source
end
where source in ('user_photo', 'dim_import', 'textbook');

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'questions_source_check') then
    alter table questions add constraint questions_source_check
      check (source in ('generated','teacher','licensed','imported','user_capture'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'questions_license_status_check') then
    alter table questions add constraint questions_license_status_check
      check (license_status in ('owned','licensed','unknown','flagged'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'questions_review_status_check') then
    alter table questions add constraint questions_review_status_check
      -- 'reported' HANDOFF (68)-dən — user_capture keyfiyyət döngəsi (0022-yə bax).
      check (review_status in ('draft','auto_verified','verified','reported','rejected'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'questions_type_check') then
    alter table questions add constraint questions_type_check
      check (type in ('single','multi','numeric','match','order','open'));
  end if;
end
$$;

-- §1b — type: mövcud bütün suallar addım-addım açıq-cavab həllidir (HANDOFF 65,
-- HANDOFF 64-dəki 'numeric' geri götürüldü).
update questions set type = 'open' where type is null;
alter table questions alter column type set not null;

-- payload — 'open' tip üçün format design.md §5-də yazılıb: { input_kind, unit?, tolerance? }.
-- Mövcud sətirlərdə bu detal `solutions.payload.final_answer`-də deyil, ayrıca saxlanmayıb —
-- boş `{}` qalır, `0017`-dəki tərcümə köçürməsi doldurmur (WEB TƏRƏFİ AYRI İŞDİR, bu ADR-in
-- əhatəsində deyil).

-- §6 — review_status: mövcud sətirlər artıq istehsalatda şagirdlərə göstərilib.
-- 'draft' yazmaq onları gizlədər (regres), 'verified' yazmaq yalan siqnaldır (insan
-- baxmayıb). 'auto_verified' hər ikisini həll edir — HANDOFF (65) #5.
update questions set review_status = 'auto_verified' where review_status = 'draft';

-- difficulty_static — özbaşına orta dəyər. ADR-018 §6-da RİSK kimi işarələnib: bu,
-- kalibrasiya EDİLMƏYİB, sadəcə NOT NULL sərhədini doldurur. `difficulty_calibrated`
-- (Req 12) 50+ cəhddən sonra bunu əvəz edəcək.
update questions set difficulty_static = 3 where difficulty_static is null;
alter table questions alter column difficulty_static set not null;
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'questions_difficulty_static_check'
  ) then
    alter table questions add constraint questions_difficulty_static_check
      check (difficulty_static between 1 and 5);
  end if;
end
$$;
