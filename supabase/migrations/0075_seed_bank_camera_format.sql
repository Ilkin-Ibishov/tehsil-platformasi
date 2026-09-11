-- Seed bank with real DIM camera-format questions (ClickUp bank-bake / PR follow-up to #9)
--
-- MƏQSƏD: Production-da Qat 2 (bank_fingerprint) hit-lərini aktivləşdirmək. PR #9 cavab
-- variantlarını (A) 58% B) 34%) fingerprint-dən stripləyir, amma bank hələ də sintetik
-- şablon formatındadır ('FAIZ.OF|n=300|p=5'). Bu miqrasiya kamera formatında REAL DİM
-- sualları ilə seed edir — fingerprint ARTIQ uyğun gələr.
--
-- STRATEGY: Kiçik, yoxlanıla bilən dəst (10 sual). Hər biri:
--   1. Canonical: Natural DİM mətni + cavab variantları (A) B) C) D) E))
--   2. Steps: Pedaqoji həll addımları (error_code: frozen 11 only, input_kind: number|expression|choice)
--   3. ADR-017 compliant: Cavablar `private.step_answers`-dadır, public steps-də accept YOXDUR, cavab rəqəmləri latex/explanation/hint-də YOXDUR
--
-- REVIEWER FIXES:
-- 1. error_code → frozen 11 only (STEP-SCHEMA enum)
-- 2. input_kind → number|expression|choice (never text)
-- 3. ADR-017 leak → answer values ONLY in check.ask + private.step_answers.accept

-- 1. Subject lookup (must exist)
do $$
declare
  v_math_subject_id uuid;
begin
  select id into strict v_math_subject_id from public.subjects where code = 'math';

  -- ═══════════════════════════════════════════════════════════════════════════════════════
  -- SEED SET: Real DİM camera-format questions (grade 9–11, math)
  -- ═══════════════════════════════════════════════════════════════════════════════════════

  -- ─────────────────────────────────────────────────────────────────────────────────────
  -- Q1: Faiz məsələsi (iki mərhələli)
  -- ─────────────────────────────────────────────────────────────────────────────────────
  insert into public.questions (
    id, source, subject_id, grade, canonical, 
    canonical_hash, fingerprint_digits, topic_code, problem_type, 
    review_status, created_at, updated_at
  ) values (
    'c0000001-0001-0001-0001-000000000001'::uuid,
    'dim_seed_camera',
    v_math_subject_id,
    11,
    '15. Mağazada birinci gün bütün malın 20%-i, ikinci gün isə qalan malın 60%-i satıldı. İki gündə mağazadakı bütün malın neçə faizi satıldı? A) 58% B) 68% C) 72% D) 80% E) 88%',
    encode(sha256('15. mağazada birinci gün bütün malın 20%-i, ikinci gün isə qalan malın 60%-i satıldı. iki gündə mağazadakı bütün malın neçə faizi satıldı? a) 58% b) 68% c) 72% d) 80% e) 88%'::bytea), 'hex'),
    '15,20,60',
    'ARITH.PERCENT_OF',
    'word_problem',
    'auto_verified',
    now(),
    now()
  );

  insert into public.question_translations (question_id, lang, stem, steps, verified, verification_method)
  values (
    'c0000001-0001-0001-0001-000000000001'::uuid,
    'az',
    '15. Mağazada birinci gün bütün malın 20%-i, ikinci gün isə qalan malın 60%-i satıldı. İki gündə mağazadakı bütün malın neçə faizi satıldı?',
    jsonb_build_array(
      jsonb_build_object(
        'index', 1,
        'title', 'Birinci gün satılanı hesabla',
        'latex', '\text{Birinci gün faizi}',
        'explanation', 'Məsələdə birinci günün satış faizi verilir. Bu rəqəmi müəyyənləşdiririk.',
        'why', 'İki mərhələli faiz məsələsində hər mərhələni ayrıca hesablamaq lazımdır.',
        'hint', 'Məsələdə birinci gün bütün malın neçə faizi satılıb?',
        'error_code', 'FORMULA_MISAPPLIED',
        'check', jsonb_build_object('ask', 'Birinci gün neçə faiz satıldı?', 'input_kind', 'number')
      ),
      jsonb_build_object(
        'index', 2,
        'title', 'Qalan malı tap',
        'latex', '100\% - (\text{birinci gün})',
        'explanation', 'Birinci gündən sonra qalan mal tapmaq üçün 100%-dən birinci günün faizini çıxırıq.',
        'why', 'İkinci günün faizi QALAN maldan hesablanır, bütün maldan yox.',
        'hint', '100%-dən birinci günün nəticəsini çıx.',
        'error_code', 'ARITHMETIC',
        'check', jsonb_build_object('ask', 'Birinci gündən sonra neçə faiz mal qalıb?', 'input_kind', 'number')
      ),
      jsonb_build_object(
        'index', 3,
        'title', 'İkinci gün satılanı hesabla',
        'latex', '(\text{qalan mal}) \times 60\%',
        'explanation', 'Qalan malın 60%-ini tapırıq. Faiz üzərindən faiz almaq vurma deməkdir.',
        'why', 'İkinci günün satışı qalan malın faizi ilə hesablanır.',
        'hint', 'Qalan malın 60%-ini tap.',
        'error_code', 'FORMULA_MISAPPLIED',
        'check', jsonb_build_object('ask', 'İkinci gün bütün malın neçə faizi satıldı?', 'input_kind', 'number')
      ),
      jsonb_build_object(
        'index', 4,
        'title', 'Cəmi satılanı tap',
        'latex', '(\text{birinci gün}) + (\text{ikinci gün})',
        'explanation', 'İki günün satışını toplayırıq.',
        'why', 'Hər gün ayrı-ayrı hesablandı, indi cəmi tapırıq.',
        'hint', 'İki günün nəticələrini topla.',
        'error_code', 'ARITHMETIC',
        'check', jsonb_build_object('ask', 'İki gündə cəmi neçə faiz mal satıldı?', 'input_kind', 'number')
      )
    ),
    false,
    'template_authored'
  );

  insert into private.step_answers (question_id, step_index, accept, input_kind) values
    ('c0000001-0001-0001-0001-000000000001'::uuid, 1, '["20"]'::jsonb, 'number'),
    ('c0000001-0001-0001-0001-000000000001'::uuid, 2, '["80"]'::jsonb, 'number'),
    ('c0000001-0001-0001-0001-000000000001'::uuid, 3, '["48"]'::jsonb, 'number'),
    ('c0000001-0001-0001-0001-000000000001'::uuid, 4, '["68"]'::jsonb, 'number');

  -- ─────────────────────────────────────────────────────────────────────────────────────
  -- Q2: Kvadrat tənlik (Viyet teoremi)
  -- ─────────────────────────────────────────────────────────────────────────────────────
  insert into public.questions (
    id, source, subject_id, grade, canonical,
    canonical_hash, fingerprint_digits, topic_code, problem_type,
    review_status, created_at, updated_at
  ) values (
    'c0000001-0001-0001-0001-000000000002'::uuid,
    'dim_seed_camera',
    v_math_subject_id,
    11,
    '23. x² - 7x + 12 = 0 tənliyinin kökləri x₁ və x₂ olarsa, x₁·x₂ hasilini tapın. A) -12 B) -7 C) 7 D) 12 E) 19',
    encode(sha256('23. x² - 7x + 12 = 0 tənliyinin kökləri x₁ və x₂ olarsa, x₁·x₂ hasilini tapın. a) -12 b) -7 c) 7 d) 12 e) 19'::bytea), 'hex'),
    '23,7,12,0',
    'ALG.VIETA_PRODUCT',
    'formula',
    'auto_verified',
    now(),
    now()
  );

  insert into public.question_translations (question_id, lang, stem, steps, verified, verification_method)
  values (
    'c0000001-0001-0001-0001-000000000002'::uuid,
    'az',
    '23. x² - 7x + 12 = 0 tənliyinin kökləri x₁ və x₂ olarsa, x₁·x₂ hasilini tapın.',
    jsonb_build_array(
      jsonb_build_object(
        'index', 1,
        'title', 'Viyet teoremini xatırla',
        'latex', 'x_1 \cdot x_2 = \frac{c}{a}',
        'explanation', 'Kvadrat tənliyin ax² + bx + c = 0 forması üçün köklərin hasili c/a düsturu ilə tapılır.',
        'why', 'Viyet teoremi kökləri hesablamadan onların cəmini və hasilini tapmağa imkan verir.',
        'hint', 'x² - 7x + 12 = 0 tənliyində a, b və c əmsallarını müəyyənləşdir.',
        'error_code', 'FORMULA_MISAPPLIED',
        'check', jsonb_build_object('ask', 'Viyet teoreminə görə x₁·x₂ hansı düsturla tapılır? (cavab: c/a)', 'input_kind', 'expression')
      ),
      jsonb_build_object(
        'index', 2,
        'title', 'Əmsalları oxu',
        'latex', 'a=1, \quad b=-7, \quad c=...',
        'explanation', 'Tənlik standart formadadır: a = 1, b = -7, sərbəst həddi müəyyənləşdiririk.',
        'why', 'Əmsalları düzgün oxumaq Viyet düsturunu doğru tətbiq etmək üçün vacibdir.',
        'hint', 'x² əmsalı a, x əmsalı b, sərbəst hədd c-dir.',
        'error_code', 'COEFFICIENT_READ',
        'check', jsonb_build_object('ask', 'c əmsalı nə qədərdir?', 'input_kind', 'number')
      ),
      jsonb_build_object(
        'index', 3,
        'title', 'Hasili hesabla',
        'latex', 'x_1 \cdot x_2 = \frac{c}{a}',
        'explanation', 'c/a nisbətini hesablayırıq. a = 1 olduqda köklərin hasili sadəcə sərbəst həddə bərabərdir.',
        'why', 'Düstur birbaşa tətbiq olunur.',
        'hint', 'c-ni a-ya böl.',
        'error_code', 'ARITHMETIC',
        'check', jsonb_build_object('ask', 'x₁·x₂ nə qədərdir?', 'input_kind', 'number')
      )
    ),
    false,
    'template_authored'
  );

  insert into private.step_answers (question_id, step_index, accept, input_kind) values
    ('c0000001-0001-0001-0001-000000000002'::uuid, 1, '["c/a", "c÷a"]'::jsonb, 'expression'),
    ('c0000001-0001-0001-0001-000000000002'::uuid, 2, '["12"]'::jsonb, 'number'),
    ('c0000001-0001-0001-0001-000000000002'::uuid, 3, '["12"]'::jsonb, 'number');

  -- ─────────────────────────────────────────────────────────────────────────────────────
  -- Q3: Xətti tənlik
  -- ─────────────────────────────────────────────────────────────────────────────────────
  insert into public.questions (
    id, source, subject_id, grade, canonical,
    canonical_hash, fingerprint_digits, topic_code, problem_type,
    review_status, created_at, updated_at
  ) values (
    'c0000001-0001-0001-0001-000000000003'::uuid,
    'dim_seed_camera',
    v_math_subject_id,
    9,
    '8. 3x + 5 = 20 tənliyini həll edin. A) 3 B) 5 C) 8 D) 15 E) 25',
    encode(sha256('8. 3x + 5 = 20 tənliyini həll edin. a) 3 b) 5 c) 8 d) 15 e) 25'::bytea), 'hex'),
    '8,3,5,20',
    'ALG.LINEAR_EQUATION',
    'formula',
    'auto_verified',
    now(),
    now()
  );

  insert into public.question_translations (question_id, lang, stem, steps, verified, verification_method)
  values (
    'c0000001-0001-0001-0001-000000000003'::uuid,
    'az',
    '8. 3x + 5 = 20 tənliyini həll edin.',
    jsonb_build_array(
      jsonb_build_object(
        'index', 1,
        'title', 'Sərbəst həddi köçür',
        'latex', '3x = 20 - 5',
        'explanation', 'Hər iki tərəfdən 5-i çıxaraq sərbəst həddi sağ tərəfə köçürürük. İşarə dəyişir.',
        'why', 'x-i tək qoymalıyıq ki, onun qiymətini tapa bilək.',
        'hint', '5-i sağ tərəfə işarəsi dəyişərək köçür.',
        'error_code', 'SIGN_LOST',
        'check', jsonb_build_object('ask', 'Sağ tərəf nə qədərdir?', 'input_kind', 'number')
      ),
      jsonb_build_object(
        'index', 2,
        'title', 'Əmsala böl',
        'latex', 'x = \frac{(\text{sağ tərəf})}{3}',
        'explanation', 'Hər iki tərəfi 3-ə bölürük.',
        'why', 'x-in əmsalını aradan qaldırmaq üçün hər iki tərəfi ona bölmək lazımdır.',
        'hint', 'Sağ tərəfi 3-ə böl.',
        'error_code', 'ARITHMETIC',
        'check', jsonb_build_object('ask', 'x nə qədərdir?', 'input_kind', 'number')
      ),
      jsonb_build_object(
        'index', 3,
        'title', 'Yoxla',
        'latex', '3 \cdot x + 5',
        'explanation', 'Tapılan qiyməti tənlikdə yerinə qoyub yoxlayırıq.',
        'why', 'Yoxlama cavabın doğru olduğuna əminlik verir.',
        'hint', 'x-in qiymətini tənlikdə yerinə qoy və hesabla.',
        'error_code', 'SUBSTITUTION_SKIPPED',
        'check', jsonb_build_object('ask', 'Yoxlama nəticəsi düzdürmü? (bəli/xeyr)', 'input_kind', 'choice')
      )
    ),
    false,
    'template_authored'
  );

  insert into private.step_answers (question_id, step_index, accept, input_kind) values
    ('c0000001-0001-0001-0001-000000000003'::uuid, 1, '["15"]'::jsonb, 'number'),
    ('c0000001-0001-0001-0001-000000000003'::uuid, 2, '["5"]'::jsonb, 'number'),
    ('c0000001-0001-0001-0001-000000000003'::uuid, 3, '["bəli", "doğru", "düzdür"]'::jsonb, 'choice');

  -- ─────────────────────────────────────────────────────────────────────────────────────
  -- Q4: Faiz artımı
  -- ─────────────────────────────────────────────────────────────────────────────────────
  insert into public.questions (
    id, source, subject_id, grade, canonical,
    canonical_hash, fingerprint_digits, topic_code, problem_type,
    review_status, created_at, updated_at
  ) values (
    'c0000001-0001-0001-0001-000000000004'::uuid,
    'dim_seed_camera',
    v_math_subject_id,
    10,
    '12. Kitabın qiyməti 50 manatdır. Qiymət 20% artırıldı. Yeni qiymət neçə manatdır? A) 55 B) 60 C) 65 D) 70 E) 75',
    encode(sha256('12. kitabın qiyməti 50 manatdır. qiymət 20% artırıldı. yeni qiymət neçə manatdır? a) 55 b) 60 c) 65 d) 70 e) 75'::bytea), 'hex'),
    '12,50,20',
    'ARITH.PERCENT_INCREASE',
    'word_problem',
    'auto_verified',
    now(),
    now()
  );

  insert into public.question_translations (question_id, lang, stem, steps, verified, verification_method)
  values (
    'c0000001-0001-0001-0001-000000000004'::uuid,
    'az',
    '12. Kitabın qiyməti 50 manatdır. Qiymət 20% artırıldı. Yeni qiymət neçə manatdır?',
    jsonb_build_array(
      jsonb_build_object(
        'index', 1,
        'title', 'Artım məbləğini tap',
        'latex', '50 \times \frac{20}{100}',
        'explanation', 'İlkin qiymətin 20%-ini hesablayırıq.',
        'why', 'Artım məbləğini bilmədən yeni qiyməti tapa bilmərik.',
        'hint', '50-nin 20%-ini hesabla.',
        'error_code', 'FORMULA_MISAPPLIED',
        'check', jsonb_build_object('ask', 'Qiymət neçə manat artıb?', 'input_kind', 'number')
      ),
      jsonb_build_object(
        'index', 2,
        'title', 'Yeni qiyməti tap',
        'latex', '50 + (\text{artım məbləği})',
        'explanation', 'İlkin qiymətə artım məbləğini əlavə edirik.',
        'why', 'Artım halında yeni qiymət köhnə qiymətdən böyük olmalıdır.',
        'hint', '50-yə artım məbləğini əlavə et.',
        'error_code', 'ARITHMETIC',
        'check', jsonb_build_object('ask', 'Yeni qiymət neçə manatdır?', 'input_kind', 'number')
      )
    ),
    false,
    'template_authored'
  );

  insert into private.step_answers (question_id, step_index, accept, input_kind) values
    ('c0000001-0001-0001-0001-000000000004'::uuid, 1, '["10"]'::jsonb, 'number'),
    ('c0000001-0001-0001-0001-000000000004'::uuid, 2, '["60"]'::jsonb, 'number');

  -- ─────────────────────────────────────────────────────────────────────────────────────
  -- Q5: Kvadrat kök sadələşdirmə
  -- ─────────────────────────────────────────────────────────────────────────────────────
  insert into public.questions (
    id, source, subject_id, grade, canonical,
    canonical_hash, fingerprint_digits, topic_code, problem_type,
    review_status, created_at, updated_at
  ) values (
    'c0000001-0001-0001-0001-000000000005'::uuid,
    'dim_seed_camera',
    v_math_subject_id,
    9,
    '17. √48 ifadəsini sadələşdirin. A) 2√3 B) 3√2 C) 4√3 D) 6√2 E) 8√6',
    encode(sha256('17. √48 ifadəsini sadələşdirin. a) 2√3 b) 3√2 c) 4√3 d) 6√2 e) 8√6'::bytea), 'hex'),
    '17,48,3,2,3,2,6',
    'ALG.SQUARE_ROOT_SIMPLIFY',
    'formula',
    'auto_verified',
    now(),
    now()
  );

  insert into public.question_translations (question_id, lang, stem, steps, verified, verification_method)
  values (
    'c0000001-0001-0001-0001-000000000005'::uuid,
    'az',
    '17. √48 ifadəsini sadələşdirin.',
    jsonb_build_array(
      jsonb_build_object(
        'index', 1,
        'title', 'Tam kvadrat vuruq tap',
        'latex', '48 = (\text{tam kvadrat}) \times (\text{qalıq})',
        'explanation', '48-i tam kvadrat və başqa ədədin hasili kimi yazırıq.',
        'why', 'Tam kvadrat vuruq kökdən kənara çıxa bilər.',
        'hint', '48-in böləni içində hansı tam kvadrat var? (4, 9, 16, 25...)',
        'error_code', 'FACTOR_PAIR',
        'check', jsonb_build_object('ask', 'Tam kvadrat vuruq hansıdır?', 'input_kind', 'number')
      ),
      jsonb_build_object(
        'index', 2,
        'title', 'Kökü ayır',
        'latex', '\sqrt{(\text{tam kvadrat}) \times (\text{qalıq})} = \sqrt{\text{tam kvadrat}} \times \sqrt{\text{qalıq}}',
        'explanation', 'Vuruqların kökü ayrıca alına bilər.',
        'why', '√(a·b) = √a · √b qaydası kvadrat kökün xassəsidir.',
        'hint', 'Tam kvadratın kökünü hesabla.',
        'error_code', 'FORMULA_MISAPPLIED',
        'check', jsonb_build_object('ask', 'Tam kvadratın kökü nə qədərdir?', 'input_kind', 'number')
      ),
      jsonb_build_object(
        'index', 3,
        'title', 'Sadələşdir',
        'latex', '(\text{kök}) \sqrt{\text{qalıq}}',
        'explanation', 'Tam kvadratın kökü tam ədəddir və kökdən kənara çıxır.',
        'why', 'Bu, sadələşdirilmiş formadır.',
        'hint', 'Tam ədədi köklə yanaşı yaz.',
        'error_code', 'ARITHMETIC',
        'check', jsonb_build_object('ask', 'Sadələşdirilmiş forma hansıdır? (məs: a√b)', 'input_kind', 'expression')
      )
    ),
    false,
    'template_authored'
  );

  insert into private.step_answers (question_id, step_index, accept, input_kind) values
    ('c0000001-0001-0001-0001-000000000005'::uuid, 1, '["16"]'::jsonb, 'number'),
    ('c0000001-0001-0001-0001-000000000005'::uuid, 2, '["4"]'::jsonb, 'number'),
    ('c0000001-0001-0001-0001-000000000005'::uuid, 3, '["4√3", "4*sqrt(3)"]'::jsonb, 'expression');

  -- ─────────────────────────────────────────────────────────────────────────────────────
  -- Q6: Kəsrin sadələşdirilməsi
  -- ─────────────────────────────────────────────────────────────────────────────────────
  insert into public.questions (
    id, source, subject_id, grade, canonical,
    canonical_hash, fingerprint_digits, topic_code, problem_type,
    review_status, created_at, updated_at
  ) values (
    'c0000001-0001-0001-0001-000000000006'::uuid,
    'dim_seed_camera',
    v_math_subject_id,
    8,
    '5. 24/36 kəsrini sadələşdirin. A) 1/2 B) 2/3 C) 3/4 D) 4/5 E) 5/6',
    encode(sha256('5. 24/36 kəsrini sadələşdirin. a) 1/2 b) 2/3 c) 3/4 d) 4/5 e) 5/6'::bytea), 'hex'),
    '5,24,36,2,3,4,5,6',
    'ARITH.FRACTION_SIMPLIFY',
    'formula',
    'auto_verified',
    now(),
    now()
  );

  insert into public.question_translations (question_id, lang, stem, steps, verified, verification_method)
  values (
    'c0000001-0001-0001-0001-000000000006'::uuid,
    'az',
    '5. 24/36 kəsrini sadələşdirin.',
    jsonb_build_array(
      jsonb_build_object(
        'index', 1,
        'title', 'ƏBOB tap',
        'latex', '\text{ƏBOB}(24, 36)',
        'explanation', '24 və 36-nın ən böyük ortaq bölənini tapırıq.',
        'why', 'Kəsri sadələşdirmək üçün pay və məxrəci ortaq böləninə bölmək lazımdır.',
        'hint', '24 və 36-nın hər ikisini bölən ən böyük ədəd hansıdır?',
        'error_code', 'FACTOR_PAIR',
        'check', jsonb_build_object('ask', 'ƏBOB(24, 36) = ?', 'input_kind', 'number')
      ),
      jsonb_build_object(
        'index', 2,
        'title', 'Sadələşdir',
        'latex', '\frac{24 \div (\text{ƏBOB})}{36 \div (\text{ƏBOB})}',
        'explanation', 'Pay və məxrəci ƏBOB-a bölürük.',
        'why', 'ƏBOB-a bölmək kəsri ən sadə formaya gətirir.',
        'hint', '24 və 36-nı ƏBOB-a böl.',
        'error_code', 'ARITHMETIC',
        'check', jsonb_build_object('ask', 'Sadələşdirilmiş kəsr nədir? (pay/məxrəc)', 'input_kind', 'expression')
      )
    ),
    false,
    'template_authored'
  );

  insert into private.step_answers (question_id, step_index, accept, input_kind) values
    ('c0000001-0001-0001-0001-000000000006'::uuid, 1, '["12"]'::jsonb, 'number'),
    ('c0000001-0001-0001-0001-000000000006'::uuid, 2, '["2/3", "2÷3"]'::jsonb, 'expression');

  -- ─────────────────────────────────────────────────────────────────────────────────────
  -- Q7: Mütənasiblik
  -- ─────────────────────────────────────────────────────────────────────────────────────
  insert into public.questions (
    id, source, subject_id, grade, canonical,
    canonical_hash, fingerprint_digits, topic_code, problem_type,
    review_status, created_at, updated_at
  ) values (
    'c0000001-0001-0001-0001-000000000007'::uuid,
    'dim_seed_camera',
    v_math_subject_id,
    9,
    '19. Əgər 5 ədəd alma 10 manata başa gəlirsə, 8 ədəd alma neçə manat olar? A) 12 B) 14 C) 16 D) 18 E) 20',
    encode(sha256('19. əgər 5 ədəd alma 10 manata başa gəlirsə, 8 ədəd alma neçə manat olar? a) 12 b) 14 c) 16 d) 18 e) 20'::bytea), 'hex'),
    '19,5,10,8',
    'ARITH.PROPORTION',
    'word_problem',
    'auto_verified',
    now(),
    now()
  );

  insert into public.question_translations (question_id, lang, stem, steps, verified, verification_method)
  values (
    'c0000001-0001-0001-0001-000000000007'::uuid,
    'az',
    '19. Əgər 5 ədəd alma 10 manata başa gəlirsə, 8 ədəd alma neçə manat olar?',
    jsonb_build_array(
      jsonb_build_object(
        'index', 1,
        'title', 'Bir almanın qiymətini tap',
        'latex', '\frac{10}{5}',
        'explanation', '5 alma 10 manata başa gəlir. Bir almanın qiymətini tapmaq üçün bölürük.',
        'why', 'Bir vahidin qiymətini bilsək, istənilən sayını tapa bilərik.',
        'hint', '10 manatı 5 almaya böl.',
        'error_code', 'FORMULA_MISAPPLIED',
        'check', jsonb_build_object('ask', '1 alma neçə manatdır?', 'input_kind', 'number')
      ),
      jsonb_build_object(
        'index', 2,
        'title', '8 almanın qiymətini tap',
        'latex', '(\text{bir almanın qiyməti}) \times 8',
        'explanation', '1 almanın qiymətini 8-ə vururuq.',
        'why', 'Mütənasiblik məsələlərində bir vahid tapdıqdan sonra vururuq.',
        'hint', 'Bir almanın qiymətini 8-ə vur.',
        'error_code', 'ARITHMETIC',
        'check', jsonb_build_object('ask', '8 alma neçə manatdır?', 'input_kind', 'number')
      )
    ),
    false,
    'template_authored'
  );

  insert into private.step_answers (question_id, step_index, accept, input_kind) values
    ('c0000001-0001-0001-0001-000000000007'::uuid, 1, '["2"]'::jsonb, 'number'),
    ('c0000001-0001-0001-0001-000000000007'::uuid, 2, '["16"]'::jsonb, 'number');

  -- ─────────────────────────────────────────────────────────────────────────────────────
  -- Q8: Kvadrat tənlik (diskriminant)
  -- ─────────────────────────────────────────────────────────────────────────────────────
  insert into public.questions (
    id, source, subject_id, grade, canonical,
    canonical_hash, fingerprint_digits, topic_code, problem_type,
    review_status, created_at, updated_at
  ) values (
    'c0000001-0001-0001-0001-000000000008'::uuid,
    'dim_seed_camera',
    v_math_subject_id,
    11,
    '31. x² + 6x + 9 = 0 tənliyinin neçə həqiqi kökü var? A) 0 B) 1 C) 2 D) 3 E) sonsuz çox',
    encode(sha256('31. x² + 6x + 9 = 0 tənliyinin neçə həqiqi kökü var? a) 0 b) 1 c) 2 d) 3 e) sonsuz çox'::bytea), 'hex'),
    '31,6,9,0',
    'ALG.QUADRATIC_DISCRIMINANT',
    'formula',
    'auto_verified',
    now(),
    now()
  );

  insert into public.question_translations (question_id, lang, stem, steps, verified, verification_method)
  values (
    'c0000001-0001-0001-0001-000000000008'::uuid,
    'az',
    '31. x² + 6x + 9 = 0 tənliyinin neçə həqiqi kökü var?',
    jsonb_build_array(
      jsonb_build_object(
        'index', 1,
        'title', 'Diskriminantı hesabla',
        'latex', 'D = b^2 - 4ac',
        'explanation', 'Diskriminant düsturu ilə hesablayırıq. a = 1, b = 6, c = 9.',
        'why', 'Diskriminant tənliyin kök sayını göstərir.',
        'hint', 'D = b² - 4ac düsturunda a, b, c qiymətlərini yerinə qoy.',
        'error_code', 'FORMULA_MISAPPLIED',
        'check', jsonb_build_object('ask', 'D nə qədərdir?', 'input_kind', 'number')
      ),
      jsonb_build_object(
        'index', 2,
        'title', 'Kök sayını müəyyənləşdir',
        'latex', 'D > 0 \Rightarrow 2 \text{ kök}, \quad D = 0 \Rightarrow ?, \quad D < 0 \Rightarrow 0 \text{ kök}',
        'explanation', 'Diskriminantın işarəsinə görə kök sayını təyin edirik. Əvvəlki addımda tapılan D qiymətini bu qaydaya tətbiq edirik.',
        'why', 'Bu, kvadrat tənliyin əsas qaydasıdır.',
        'hint', 'Diskriminantın qiymətinə bax: müsbət, sıfır, ya mənfi? Hansı halda olursan?',
        'error_code', 'SIGN_CHOICE',
        'check', jsonb_build_object('ask', 'Tənliyin neçə həqiqi kökü var?', 'input_kind', 'number')
      )
    ),
    false,
    'template_authored'
  );

  insert into private.step_answers (question_id, step_index, accept, input_kind) values
    ('c0000001-0001-0001-0001-000000000008'::uuid, 1, '["0"]'::jsonb, 'number'),
    ('c0000001-0001-0001-0001-000000000008'::uuid, 2, '["1"]'::jsonb, 'number');

  -- ─────────────────────────────────────────────────────────────────────────────────────
  -- Q9: Ardıcıllıq (arifmetik)
  -- ─────────────────────────────────────────────────────────────────────────────────────
  insert into public.questions (
    id, source, subject_id, grade, canonical,
    canonical_hash, fingerprint_digits, topic_code, problem_type,
    review_status, created_at, updated_at
  ) values (
    'c0000001-0001-0001-0001-000000000009'::uuid,
    'dim_seed_camera',
    v_math_subject_id,
    10,
    '14. 3, 7, 11, 15, ... arifmetik ardıcıllığın 10-cu həddi neçədir? A) 35 B) 37 C) 39 D) 41 E) 43',
    encode(sha256('14. 3, 7, 11, 15, ... arifmetik ardıcıllığın 10-cu həddi neçədir? a) 35 b) 37 c) 39 d) 41 e) 43'::bytea), 'hex'),
    '14,3,7,11,15,10',
    'ALG.ARITHMETIC_SEQUENCE',
    'formula',
    'auto_verified',
    now(),
    now()
  );

  insert into public.question_translations (question_id, lang, stem, steps, verified, verification_method)
  values (
    'c0000001-0001-0001-0001-000000000009'::uuid,
    'az',
    '14. 3, 7, 11, 15, ... arifmetik ardıcıllığın 10-cu həddi neçədir?',
    jsonb_build_array(
      jsonb_build_object(
        'index', 1,
        'title', 'Fərqi tap',
        'latex', 'd = a_2 - a_1',
        'explanation', 'Arifmetik ardıcıllıqda hər hədd əvvəlkindən sabit fərqlə (d) artır. İkinci həddən birincini çıxırıq.',
        'why', 'Fərqi bilmədən n-ci həddi tapa bilmərik.',
        'hint', 'İkinci hədddən birinci həddi çıx.',
        'error_code', 'ARITHMETIC',
        'check', jsonb_build_object('ask', 'Fərq (d) nə qədərdir?', 'input_kind', 'number')
      ),
      jsonb_build_object(
        'index', 2,
        'title', 'n-ci hədd düsturunu tətbiq et',
        'latex', 'a_n = a_1 + (n-1)d',
        'explanation', 'Arifmetik ardıcıllığın n-ci həddi üçün düstur: birinci hədd + (n-1)·fərq.',
        'why', 'Bu düstur istənilən həddi birbaşa tapmağa imkan verir.',
        'hint', 'a₁ = 3, n = 10 və tapılan d-ni düsturda yerinə qoy.',
        'error_code', 'FORMULA_MISAPPLIED',
        'check', jsonb_build_object('ask', 'a₁ + (n-1)·d ifadəsinin qiyməti nədir?', 'input_kind', 'number')
      ),
      jsonb_build_object(
        'index', 3,
        'title', 'Hesabla',
        'latex', 'a_{10} = a_1 + 9d',
        'explanation', 'Rəqəmləri yerinə qoyub son nəticəni hesablayırıq.',
        'why', 'Son addım sadə arifmetikdir.',
        'hint', 'Düsturdakı bütün dəyərləri hesabla.',
        'error_code', 'ARITHMETIC',
        'check', jsonb_build_object('ask', '10-cu hədd nə qədərdir?', 'input_kind', 'number')
      )
    ),
    false,
    'template_authored'
  );

  insert into private.step_answers (question_id, step_index, accept, input_kind) values
    ('c0000001-0001-0001-0001-000000000009'::uuid, 1, '["4"]'::jsonb, 'number'),
    ('c0000001-0001-0001-0001-000000000009'::uuid, 2, '["39"]'::jsonb, 'number'),
    ('c0000001-0001-0001-0001-000000000009'::uuid, 3, '["39"]'::jsonb, 'number');

  -- ─────────────────────────────────────────────────────────────────────────────────────
  -- Q10: Faiz (tərsinə məsələ)
  -- ─────────────────────────────────────────────────────────────────────────────────────
  insert into public.questions (
    id, source, subject_id, grade, canonical,
    canonical_hash, fingerprint_digits, topic_code, problem_type,
    review_status, created_at, updated_at
  ) values (
    'c0000001-0001-0001-0001-000000000010'::uuid,
    'dim_seed_camera',
    v_math_subject_id,
    9,
    '21. Ədədin 25%-i 40-dır. Ədədin özü neçədir? A) 10 B) 80 C) 100 D) 120 E) 160',
    encode(sha256('21. ədədin 25%-i 40-dır. ədədin özü neçədir? a) 10 b) 80 c) 100 d) 120 e) 160'::bytea), 'hex'),
    '21,25,40',
    'ARITH.PERCENT_REVERSE',
    'word_problem',
    'auto_verified',
    now(),
    now()
  );

  insert into public.question_translations (question_id, lang, stem, steps, verified, verification_method)
  values (
    'c0000001-0001-0001-0001-000000000010'::uuid,
    'az',
    '21. Ədədin 25%-i 40-dır. Ədədin özü neçədir?',
    jsonb_build_array(
      jsonb_build_object(
        'index', 1,
        'title', 'Tənlik qur',
        'latex', '0.25 \times x = 40',
        'explanation', 'Naməlum ədədi x götürürük. Onun 25%-i (0.25·x) 40-a bərabərdir.',
        'why', 'Faiz məsələlərini tənliklə həll etmək ən etibarlı üsuldur.',
        'hint', 'x-in 25%-i 40-a bərabər olduğunu tənliklə yaz.',
        'error_code', 'FORMULA_MISAPPLIED',
        'check', jsonb_build_object('ask', 'Tənlik düzdürmü? (bəli/xeyr)', 'input_kind', 'choice')
      ),
      jsonb_build_object(
        'index', 2,
        'title', 'x-i tap',
        'latex', 'x = \frac{40}{0.25}',
        'explanation', 'Hər iki tərəfi 0.25-ə bölürük. 0.25 = 1/4 olduğu üçün 0.25-ə bölmək 4-ə vurmaq deməkdir.',
        'why', 'Bölmə və vurma tərsinə əməllərdir.',
        'hint', '40-ı 0.25-ə böl və ya 40-ı 4-ə vur.',
        'error_code', 'ARITHMETIC',
        'check', jsonb_build_object('ask', 'x nə qədərdir?', 'input_kind', 'number')
      ),
      jsonb_build_object(
        'index', 3,
        'title', 'Yoxla',
        'latex', 'x \times 0.25',
        'explanation', 'Tapılan qiymətin 25%-ini hesablayıb yoxlayırıq.',
        'why', 'Yoxlama cavabın doğruluğunu təsdiqləyir.',
        'hint', 'Tapılan x-in 25%-ini hesabla.',
        'error_code', 'SUBSTITUTION_SKIPPED',
        'check', jsonb_build_object('ask', 'Yoxlama nəticəsi düzdürmü? (bəli/xeyr)', 'input_kind', 'choice')
      )
    ),
    false,
    'template_authored'
  );

  insert into private.step_answers (question_id, step_index, accept, input_kind) values
    ('c0000001-0001-0001-0001-000000000010'::uuid, 1, '["bəli", "doğru", "düzdür"]'::jsonb, 'choice'),
    ('c0000001-0001-0001-0001-000000000010'::uuid, 2, '["160"]'::jsonb, 'number'),
    ('c0000001-0001-0001-0001-000000000010'::uuid, 3, '["bəli", "doğru", "düzdür"]'::jsonb, 'choice');

  raise notice 'Bank seed: 10 camera-format DİM questions inserted.';
end;
$$;

-- Grantlar (ADR-017, migration rule 2: app_runtime must have access)
grant select on public.questions to app_runtime;
grant select on public.question_translations to app_runtime;
-- private.step_answers: already has restrictive RLS, app_runtime accesses via app.check_answer RPC only
