-- 0077_fix_bank_hint_semantic_leakage.sql
-- AG-016: Sual Bankı Sızan İpuclarının Bərpası və Kurasiyası (ADR-017 & DIM-GLOSSARY §3).
--
-- Düzəlişlər:
-- 1. Question 7082409e-df0c-46ed-aaff-ba6ee242baca (ALG.QUADRATIC_EQUATION):
--    - Step 3: '6.25-dən böyük ilk tam ədədi götür.' -> Sokratik dərslik ipucu.
--    - Step 4: '25 − 4·7 hesabla.' -> Sokratik yoxlama ipucu.
-- 2. Question 4a2fa001-76b9-4024-9869-396dddfd5028 (PROB.BASIC):
--    - Step 2: 'Köklər x = 0, x = 4 və x = 5-dir, yəni cəmi 3 kök var.' -> Vuruqların sıfıra bərabərlik prinsipi.
--    - Step 3: '4 və 5 natural ədədlərdir, 0 isə natural ədəd deyil, yəni 2 natural kök var.' -> Natural ədəd dərslik tərifi.

-- 1. Kvadrat tənlik (7082409e-df0c-46ed-aaff-ba6ee242baca)
UPDATE public.question_translations
SET steps = jsonb_set(
  jsonb_set(
    steps,
    '{2,hint}',
    to_jsonb('Tam ədəd anlayışını (kəsr hissəsi olmayan) və ədədlər oxunda 6,25-dən böyük ilk tam nöqtəni nəzərdən keçir.'::text)
  ),
  '{3,hint}',
  to_jsonb('Tapılmış tam parametri diskriminant ifadəsində yerinə qoyaraq nəticənin həqiqətən mənfi olduğunu yoxla.'::text)
),
updated_at = now()
WHERE question_id = '7082409e-df0c-46ed-aaff-ba6ee242baca'
  AND lang = 'az';

-- 2. Ehtimal və vuruqlara ayırma (4a2fa001-76b9-4024-9869-396dddfd5028)
UPDATE public.question_translations
SET steps = jsonb_set(
  jsonb_set(
    steps,
    '{1,hint}',
    to_jsonb('Hasilin sıfıra bərabər olması üçün vuruqların hər birini ayrı-ayrılıqda sıfıra bərabər et.'::text)
  ),
  '{2,hint}',
  to_jsonb('Natural ədədlər sayma zamanı işlətdiyimiz ədədlərdir (0 natural ədəd deyil).'::text)
),
updated_at = now()
WHERE question_id = '4a2fa001-76b9-4024-9869-396dddfd5028'
  AND lang = 'az';
