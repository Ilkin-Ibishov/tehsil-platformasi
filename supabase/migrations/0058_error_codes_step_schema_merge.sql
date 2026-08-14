-- 0058 · error_code taksonomiyasının birləşdirilməsi (ADR bağlanmır, S3, ClickUp 86eymwgju)
--
-- Mənbə həqiqət `docs/STEP-SCHEMA.json`-un DƏYIŞMƏZ enum-u (11 kod, `$defs.error_code_labels_az`
-- Azərbaycanca etiketləri daşıyır). `public.error_codes` (0051) YALNIZ 10 kod içərirdi, 3-ü
-- STEP-SCHEMA ilə üst-üstə düşürdü (ARITHMETIC, FORMULA_MISAPPLIED, SIGN_CHOICE), 7-si YALNIZ
-- DB-də idi (blok 95-in tapıntısı — HANDOFF-a bax). Bu miqrasiya:
--   1) STEP-SCHEMA-nın 8 çatışmayan kodunu əlavə edir (etiketlər/izahlar sxemin öz
--      `error_code_labels_az`-ından KÖÇÜRÜLÜB, uydurulmayıb).
--   2) DB-də olub sxemdə OLMAYAN 7 kodu SİLMİR — `deprecated=true` ilə işarələyir (step_events-də
--      keçmiş sətirlər ola bilər, FK yoxdur amma tarixi data qırılmamalıdır).

alter table public.error_codes add column if not exists deprecated boolean not null default false;

insert into public.error_codes (code, title_az, description) values
  ('SIGN_LOST',           'İşarə itdi',           'Mənfi əmsalı köçürəndə minusu itirir'),
  ('SQUARE_FORGOTTEN',    'Kvadrat unuduldu',     'Kvadrata yüksəltməni atlayır'),
  ('SUBSTITUTION_SKIPPED','Yerinəqoyma',          'Yoxlama addımını atlayır'),
  ('FACTOR_PAIR',         'Vuruq cütü',           'Vuruqlara ayırmada cütü səhv tapır'),
  ('ORDER_OF_OPS',        'Əməl sırası',          'Əməllərin ardıcıllığını pozur'),
  ('COEFFICIENT_READ',    'Əmsal oxunuşu',        'Əmsalı tənlikdən səhv çıxarır'),
  ('UNIT_MISMATCH',       'Vahid uyğunsuzluğu',   'Vahidləri çevirmir'),
  ('TRANSCRIPTION',       'Köçürmə',              'Rəqəmi bir sətirdən digərinə səhv köçürür')
on conflict (code) do update set
  title_az = excluded.title_az,
  description = excluded.description,
  needs_review = false,
  active = true,
  deprecated = false;

update public.error_codes
   set deprecated = true
 where code in (
   'INCOMPLETE_ANSWER', 'OPERATION_CONFUSION', 'PLACE_VALUE',
   'ROOT_SELECTION', 'SCOPE_CONFUSION', 'TRANSPOSE_SIGN', 'UNKNOWN'
 );

comment on column public.error_codes.deprecated is
  'true = docs/STEP-SCHEMA.json-un cari enum-unda YOXDUR (köhnə taksonomiya qalığı) — silinmir, tarixi step_events sətirləri üçün saxlanılır (0058, S3).';
