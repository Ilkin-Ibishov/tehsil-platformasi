-- ClickUp 86eykj7tu (kaskad) Qat 2 — "numeric_fingerprint bankda var → LLM YOX".
--
-- TAPILAN KÖK PROBLEM: `numeric_fingerprint` sütununda İKİ UYĞUNSUZ FORMAT yaşayır:
--
--   source='generated'    (217 sətir)  →  'FAIZ.OF|300,5'   ← şablon prefiksi + rəqəmlər
--   source='user_capture' (9 sətir)    →  '300,5'           ← YALNIZ rəqəmlər
--
-- `DATA-MODEL.md` (tək mənbə) formatı belə təyin edir: "mətndəki bütün ədədlər sıra ilə:
-- '60,2,3'" — yəni PREFİKSSİZ. `/api/solve`-un `numericFingerprint()` funksiyası da elə bunu
-- istehsal edir. NƏTİCƏ: şagird bankdakı 217 sualdan BİRİNİ çəksə, bərabərlik uyğunluğu
-- HEÇ VAXT tapılmır — bank Qat 2 üçün GÖRÜNMƏZDİR, üstəlik `questions_fingerprint_dedup_idx`
-- unikal olduğu halda eyni məsələ İKİNCİ sətir kimi yazılır (latent dublikat).
--
-- NİYƏ 217 SƏTRİN FORMATI DÜZƏLDİLMİR: seed (`0036`) Cowork-un sahibliyindədir və
-- `questions_fingerprint_dedup_idx` UNİKALDIR — prefiksi silmək `QUAD.MIN|-1,-2` və
-- `QUAD.SUM|-1,-2` sətirlərini EYNİ açara çevirər və miqrasiya unikal indeks pozuntusu ilə
-- çökər (aşağıdaki ambiguity qeydinə bax). Ona görə ADDITIVE yol seçilir: prefiksi soyan
-- GENERATED sütun + öz indeksi. Köhnə sütun, köhnə indeks, köhnə kod TOXUNULMUR
-- (CLAUDE.md miqrasiya dərsi 1 — expand, contract YOX).
--
-- AMBIGUITY (kodda mütləq nəzərə alınmalıdır): rəqəmlər TƏK BAŞINA unikal DEYİL —
-- ölçüldü: `-1,-2` + grade 9 → 2 sətir (`QUAD.MIN` = kiçik kök, `QUAD.SUM` = köklərin cəmi).
-- Fərqli suallar, FƏRQLİ cavablar. Rəqəm-yalnız uyğunluq şagirdə YANLIŞ həlli inamla
-- öyrədərdi — taskın özünün "ən böyük risk mənbəyi" dediyi hal. `(digits, subject, grade,
-- topic_code)` isə ÖLÇÜLDÜ: 225 sətrin hamısında UNİKAL (0 ambiguous qrup). Qat 2 buna görə
-- topic_code-u da açara daxil edir və birdən çox namizəd qalsa uyğunluqdan İMTİNA edir
-- (`web/lib/cascade/bank.ts`).

alter table public.questions
  add column if not exists fingerprint_digits text
  generated always as (
    case
      when numeric_fingerprint like '%|%' then split_part(numeric_fingerprint, '|', 2)
      else numeric_fingerprint
    end
  ) stored;

comment on column public.questions.fingerprint_digits is
  'DATA-MODEL.md formatinda numeric_fingerprint (yalniz reqemler, sablon prefiksi soyulmus). Qat 2 bank uygunlasmasi UCUN. Yazilmir - generated.';

-- Qat 2-nin sorğusu: (fingerprint_digits, subject_id, grade) üzrə namizədləri götürür,
-- `topic_code` ilə dəqiqləşdirir. UNİKAL DEYİL — qəsdən: ambiguity kodda görünməli,
-- miqrasiyada partlamamalıdır.
create index if not exists questions_fingerprint_digits_idx
  on public.questions (fingerprint_digits, subject_id, grade)
  where fingerprint_digits is not null
    and fingerprint_digits <> ''
    and superseded_by is null
    and deleted_at is null;

-- CLAUDE.md icazə dərsi 2: implicit privilege-ə güvənmə. `questions` üzərində `app_runtime`
-- grant-ı CƏDVƏL səviyyəsindədir (yoxlanıldı: SELECT/INSERT/UPDATE, sütun-səviyyəli grant
-- YOX) — yeni GENERATED sütun avtomatik əhatə olunur, əlavə grant TƏLƏB OLUNMUR. Bu sətir
-- qəsdən şərh kimi qalır ki, gələcək audit "grant yazılmayıb" deyə səhv nəticə çıxarmasın.
