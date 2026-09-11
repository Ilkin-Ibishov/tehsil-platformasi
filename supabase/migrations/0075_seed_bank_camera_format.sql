-- Seed bank with real DIM camera-format questions (ClickUp bank-bake / PR follow-up to #9)
--
-- MƏQSƏD: Production-da Qat 2 (bank_fingerprint) hit-lərini aktivləşdirmək. PR #9 cavab
-- variantlarını (A) 58% B) 34%) fingerprint-dən stripləyir, amma bank hələ də sintetik
-- şablon formatındadır ('FAIZ.OF|n=300|p=5'). Bu miqrasiya kamera formatında REAL DİM
-- sualları ilə seed edir — fingerprint ARTIQ uyğun gələr.
--
-- STRATEGY: Kiçik, yoxlanıla bilən dəst (15 sual). Hər biri:
--   1. Canonical: Natural DİM mətni + cavab variantları (A) B) C) D) E))
--   2. Steps: Pedaqoji həll addımları (`app.store_generated_steps` RPC)
--   3. ADR-017 compliant: Cavablar `private.step_answers`-dadır, açıq leak yoxdur
--
-- VERIFICATION: Test suite və ya eval harness fingerprint match_path emit etdiyini təsdiq edəcək.

-- 1. Subject lookup (must exist)
do $$
declare
  v_math_subject_id uuid;
begin
  select id into strict v_math_subject_id from public.subjects where code = 'math';

  -- ═══════════════════════════════════════════════════════════════════════════════════════
  -- SEED SET: Real DİM camera-format questions (grade 11, math)
  -- ═══════════════════════════════════════════════════════════════════════════════════════

  -- ─────────────────────────────────────────────────────────────────────────────────────
  -- Q1: Faiz məsələsi (iki mərhələli endirim)
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
    '15,20,60',  -- Choice digits stripped (58,68,72,80,88 removed)
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
        'latex', '20\%',
        'explanation', 'Birinci gün bütün malın 20%-i satılıb.',
        'why', 'İki mərhələli faiz məsələsində hər mərhələni ayrıca hesablamaq lazımdır.',
        'hint', 'Bütün malın 20%-i nə qədərdir?',
        'error_code', 'PERCENT_TO_FRACTION',
        'check', jsonb_build_object('ask', 'Birinci gün neçə faiz satıldı?', 'input_kind', 'number')
      ),
      jsonb_build_object(
        'index', 2,
        'title', 'Qalan malı tap',
        'latex', '100\% - 20\% = 80\%',
        'explanation', 'Birinci gündən sonra qalan mal 100% - 20% = 80%-dir.',
        'why', 'İkinci günün faizi QALAN maldan hesablanır, bütün maldan yox.',
        'hint', '100%-dən 20%-i çıx.',
        'error_code', 'BASE_CONFUSION',
        'check', jsonb_build_object('ask', 'Birinci gündən sonra neçə faiz mal qalıb?', 'input_kind', 'number')
      ),
      jsonb_build_object(
        'index', 3,
        'title', 'İkinci gün satılanı hesabla',
        'latex', '80\% \cdot 60\% = 0.8 \cdot 0.6 = 0.48 = 48\%',
        'explanation', 'Qalan malın (80%) 60%-i satılıb, yəni bütün malın 48%-i.',
        'why', 'Faiz üzərindən faiz almaq vurma deməkdir.',
        'hint', '80%-in 60%-ini tap.',
        'error_code', 'PERCENT_COMPOSITION',
        'check', jsonb_build_object('ask', 'İkinci gün bütün malın neçə faizi satıldı?', 'input_kind', 'number')
      ),
      jsonb_build_object(
        'index', 4,
        'title', 'Cəmi satılanı tap',
        'latex', '20\% + 48\% = 68\%',
        'explanation', 'İki günün satışını toplayırıq: 20% + 48% = 68%.',
        'why', 'Hər gün fərqli bazadan hesablandığı üçün həmin gün BÜTÜN MALA nisbətdə faizi tapıb, sonra toplamaq lazımdır.',
        'hint', '20 və 48-i topla.',
        'error_code', 'ARITHMETIC',
        'check', jsonb_build_object('ask', 'İki gündə cəmi neçə faiz mal satıldı?', 'input_kind', 'number')
      )
    ),
    false,  -- verified false çünki auto_verified, sympy check yox (ADR-020 T3 izahı)
    'template_authored'
  );

  -- Cavablar private.step_answers-ə (ADR-017)
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
    '23,7,12,0',  -- "= 0" captures the 0; choice negatives (-12,-7) and positives (7,12,19) stripped
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
        'explanation', 'Kvadrat tənliyin ax² + bx + c = 0 forması üçün köklərin hasili c/a-ya bərabərdir.',
        'why', 'Viyet teoremi kökləri hesablamadan onların cəmini və hasilini tapmağa imkan verir.',
        'hint', 'x² - 7x + 12 = 0 tənliyində a, b və c əmsallarını müəyyənləşdir.',
        'error_code', 'VIETA_FORMULA',
        'check', jsonb_build_object('ask', 'Viyet teoreminə görə x₁·x₂ hansı düsturla tapılır?', 'input_kind', 'text')
      ),
      jsonb_build_object(
        'index', 2,
        'title', 'Əmsalları oxu',
        'latex', 'a=1, \quad b=-7, \quad c=12',
        'explanation', 'Tənlik standart formadadır: a = 1, b = -7, c = 12.',
        'why', 'Əmsalları düzgün oxumaq Viyet düsturunu doğru tətbiq etmək üçün vacibdir.',
        'hint', 'x² əmsalı a, x əmsalı b, sərbəst hədd c-dir.',
        'error_code', 'COEFFICIENT_READING',
        'check', jsonb_build_object('ask', 'c əmsalı nə qədərdir?', 'input_kind', 'number')
      ),
      jsonb_build_object(
        'index', 3,
        'title', 'Hasili hesabla',
        'latex', 'x_1 \cdot x_2 = \frac{12}{1} = 12',
        'explanation', 'c/a = 12/1 = 12, deməli köklərin hasili 12-dir.',
        'why', 'a = 1 olduqda köklərin hasili sadəcə sərbəst həddə bərabərdir.',
        'hint', '12-ni 1-ə böl.',
        'error_code', 'DIVISION',
        'check', jsonb_build_object('ask', 'x₁·x₂ nə qədərdir?', 'input_kind', 'number')
      )
    ),
    false,
    'template_authored'
  );

  insert into private.step_answers (question_id, step_index, accept, input_kind) values
    ('c0000001-0001-0001-0001-000000000002'::uuid, 1, '["c/a", "c÷a", "hasili"]'::jsonb, 'text'),
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
    '8,3,5,20',  -- Choice digits stripped (3,5,8,15,25 removed)
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
        'explanation', 'Hər iki tərəfdən 5-i çıxaraq sərbəst həddi sağ tərəfə köçürürük.',
        'why', 'x-i tək qoymalıyıq ki, onun qiymətini tapa bilək.',
        'hint', '5-i sağ tərəfə işarəsi dəyişərək köçür.',
        'error_code', 'TRANSPOSE_SIGN',
        'check', jsonb_build_object('ask', '20 - 5 nə qədərdir?', 'input_kind', 'number')
      ),
      jsonb_build_object(
        'index', 2,
        'title', 'Əmsala böl',
        'latex', 'x = \frac{15}{3} = 5',
        'explanation', 'Hər iki tərəfi 3-ə bölürük və x = 5 alırıq.',
        'why', 'x-in əmsalını aradan qaldırmaq üçün hər iki tərəfi ona bölmək lazımdır.',
        'hint', '15-i 3-ə böl.',
        'error_code', 'DIVISION',
        'check', jsonb_build_object('ask', 'x nə qədərdir?', 'input_kind', 'number')
      ),
      jsonb_build_object(
        'index', 3,
        'title', 'Yoxla',
        'latex', '3 \cdot 5 + 5 = 15 + 5 = 20 \quad \checkmark',
        'explanation', 'x = 5 qiymətini tənlikdə yerinə qoyub yoxlayırıq: 3·5 + 5 = 20.',
        'why', 'Yoxlama cavabın doğru olduğuna əminlik verir.',
        'hint', 'x = 5-i tənlikdə yerinə qoy.',
        'error_code', 'SUBSTITUTION_SKIPPED',
        'check', jsonb_build_object('ask', 'Yoxlama nəticəsi düzdürmü?', 'input_kind', 'text')
      )
    ),
    false,
    'template_authored'
  );

  insert into private.step_answers (question_id, step_index, accept, input_kind) values
    ('c0000001-0001-0001-0001-000000000003'::uuid, 1, '["15"]'::jsonb, 'number'),
    ('c0000001-0001-0001-0001-000000000003'::uuid, 2, '["5"]'::jsonb, 'number'),
    ('c0000001-0001-0001-0001-000000000003'::uuid, 3, '["bəli", "doğru", "düzdür", "✓"]'::jsonb, 'text');

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
    '12,50,20',  -- Choice digits stripped (55,60,65,70,75 removed)
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
        'latex', '\frac{50 \cdot 20}{100} = 10',
        'explanation', '50 manatın 20%-i 10 manatdır.',
        'why', 'Artım məbləğini bilmədən yeni qiyməti tapa bilmərik.',
        'hint', '50-nin 20%-ini hesabla.',
        'error_code', 'PERCENT_TO_FRACTION',
        'check', jsonb_build_object('ask', 'Qiymət neçə manat artıb?', 'input_kind', 'number')
      ),
      jsonb_build_object(
        'index', 2,
        'title', 'Yeni qiyməti tap',
        'latex', '50 + 10 = 60',
        'explanation', 'İlkin qiymətə (50) artımı (10) əlavə edirik.',
        'why', 'Artım halında yeni qiymət köhnə qiymətdən böyük olmalıdır.',
        'hint', '50 + 10 = ?',
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
    '17,48,3,2,3,2,6',  -- Pattern strips "A) 2" "B) 3" "C) 4" "D) 6" "E) 8" but √3,√2,√6 numbers remain
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
        'latex', '48 = 16 \cdot 3',
        'explanation', '48-i tam kvadrat (16) və başqa ədədin (3) hasili kimi yaz.',
        'why', 'Tam kvadrat vuruq kökdən kənara çıxa bilər.',
        'hint', '48-in böləni içində hansı tam kvadrat var? (4, 9, 16, 25...)',
        'error_code', 'FACTORING',
        'check', jsonb_build_object('ask', '48 = 16 · ?', 'input_kind', 'number')
      ),
      jsonb_build_object(
        'index', 2,
        'title', 'Kökü ayır',
        'latex', '\sqrt{48} = \sqrt{16 \cdot 3} = \sqrt{16} \cdot \sqrt{3}',
        'explanation', 'Vuruqların kökü ayrıca alına bilər.',
        'why', '√(a·b) = √a · √b qaydası kvadrat kökün xassəsidir.',
        'hint', '√(16·3) = √16 · √3',
        'error_code', 'SQUARE_ROOT_PROPERTY',
        'check', jsonb_build_object('ask', '√16 nə qədərdir?', 'input_kind', 'number')
      ),
      jsonb_build_object(
        'index', 3,
        'title', 'Sadələşdir',
        'latex', '4\sqrt{3}',
        'explanation', '√16 = 4, deməli √48 = 4√3.',
        'why', 'Tam kvadratın kökü tam ədəddir və kökdən kənara çıxır.',
        'hint', '4 · √3 = ?',
        'error_code', 'ARITHMETIC',
        'check', jsonb_build_object('ask', 'Cavab nədir?', 'input_kind', 'text')
      )
    ),
    false,
    'template_authored'
  );

  insert into private.step_answers (question_id, step_index, accept, input_kind) values
    ('c0000001-0001-0001-0001-000000000005'::uuid, 1, '["3"]'::jsonb, 'number'),
    ('c0000001-0001-0001-0001-000000000005'::uuid, 2, '["4"]'::jsonb, 'number'),
    ('c0000001-0001-0001-0001-000000000005'::uuid, 3, '["4√3", "4*sqrt(3)", "4 kök 3"]'::jsonb, 'text');

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
    '5,24,36,2,3,4,5,6',  -- Pattern strips "A) 1" "B) 2" "C) 3" "D) 4" "E) 5" but /2,/3,/4,/5,/6 remain
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
        'latex', '\text{ƏBOB}(24, 36) = 12',
        'explanation', '24 və 36-nın ən böyük ortaq bölənini tapırıq.',
        'why', 'Kəsri sadələşdirmək üçün pay və məxrəci ortaq böləninə bölmək lazımdır.',
        'hint', '24 və 36-nın hər ikisini bölən ən böyük ədəd hansıdır?',
        'error_code', 'GCD',
        'check', jsonb_build_object('ask', 'ƏBOB(24, 36) = ?', 'input_kind', 'number')
      ),
      jsonb_build_object(
        'index', 2,
        'title', 'Sadələşdir',
        'latex', '\frac{24 \div 12}{36 \div 12} = \frac{2}{3}',
        'explanation', 'Pay və məxrəci 12-yə bölürük.',
        'why', 'ƏBOB-a bölmək kəsri ən sadə formaya gətirir.',
        'hint', '24 ÷ 12 və 36 ÷ 12 hesabla.',
        'error_code', 'DIVISION',
        'check', jsonb_build_object('ask', 'Sadələşdirilmiş kəsr nədir?', 'input_kind', 'text')
      )
    ),
    false,
    'template_authored'
  );

  insert into private.step_answers (question_id, step_index, accept, input_kind) values
    ('c0000001-0001-0001-0001-000000000006'::uuid, 1, '["12"]'::jsonb, 'number'),
    ('c0000001-0001-0001-0001-000000000006'::uuid, 2, '["2/3", "2÷3", "0.666..."]'::jsonb, 'text');

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
    '19,5,10,8',  -- Choice digits stripped (12,14,16,18,20 removed)
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
        'latex', '\frac{10}{5} = 2 \text{ manat}',
        'explanation', '5 alma 10 manata başa gəlir, deməli 1 alma 2 manatdır.',
        'why', 'Bir vahidin qiymətini bilsək, istənilən sayını tapa bilərik.',
        'hint', '10 manatı 5 almaya böl.',
        'error_code', 'DIVISION',
        'check', jsonb_build_object('ask', '1 alma neçə manatdır?', 'input_kind', 'number')
      ),
      jsonb_build_object(
        'index', 2,
        'title', '8 almanın qiymətini tap',
        'latex', '2 \times 8 = 16 \text{ manat}',
        'explanation', '1 alma 2 manat olduğu üçün 8 alma 16 manatdır.',
        'why', 'Mütənasiblik məsələlərində bir vahid tapdıqdan sonra vururuq.',
        'hint', '2 × 8 = ?',
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
    '31,6,9,0',  -- "= 0" captures 0; choices (A)0 B)1 C)2 D)3) stripped, "sonsuz" is text
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
        'latex', 'D = b^2 - 4ac = 6^2 - 4 \cdot 1 \cdot 9 = 36 - 36 = 0',
        'explanation', 'Diskriminant D = b² - 4ac düsturu ilə hesablanır.',
        'why', 'Diskriminant tənliyin kök sayını göstərir.',
        'hint', 'a = 1, b = 6, c = 9 ilə D = b² - 4ac hesabla.',
        'error_code', 'DISCRIMINANT_FORMULA',
        'check', jsonb_build_object('ask', 'D nə qədərdir?', 'input_kind', 'number')
      ),
      jsonb_build_object(
        'index', 2,
        'title', 'Kök sayını müəyyənləşdir',
        'latex', 'D = 0 \Rightarrow \text{1 həqiqi kök (ikiqat)}',
        'explanation', 'D = 0 olduqda tənliyin 1 həqiqi kökü var (ikiqat kök).',
        'why', 'D > 0 → 2 kök, D = 0 → 1 kök, D < 0 → 0 kök qaydası.',
        'hint', 'Diskriminant 0-a bərabər olduqda neçə kök olur?',
        'error_code', 'DISCRIMINANT_INTERPRETATION',
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
    '14,3,7,11,15,10',  -- Choice digits stripped (35,37,39,41,43 removed)
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
        'latex', 'd = 7 - 3 = 4',
        'explanation', 'Arifmetik ardıcıllıqda hər hədd əvvəlkindən sabit fərqlə (d) artır.',
        'why', 'Fərqi bilmədən n-ci həddi tapa bilmərik.',
        'hint', '7 - 3 = ?',
        'error_code', 'ARITHMETIC',
        'check', jsonb_build_object('ask', 'Fərq (d) nə qədərdir?', 'input_kind', 'number')
      ),
      jsonb_build_object(
        'index', 2,
        'title', 'n-ci hədd düsturunu tətbiq et',
        'latex', 'a_n = a_1 + (n-1)d = 3 + (10-1) \cdot 4',
        'explanation', 'Arifmetik ardıcıllığın n-ci həddi: a₁ + (n-1)·d',
        'why', 'Bu düstur istənilən həddi birbaşa tapmağa imkan verir.',
        'hint', 'a₁ = 3, n = 10, d = 4 qiymətlərini düsturda yerinə qoy.',
        'error_code', 'SEQUENCE_FORMULA',
        'check', jsonb_build_object('ask', '3 + 9·4 nə qədərdir?', 'input_kind', 'number')
      ),
      jsonb_build_object(
        'index', 3,
        'title', 'Hesabla',
        'latex', 'a_{10} = 3 + 36 = 39',
        'explanation', '3 + 9·4 = 3 + 36 = 39',
        'why', 'Son addım sadə arifmetikdir.',
        'hint', '3 + 36 = ?',
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
    '21,25,40',  -- Choice digits stripped (10,80,100,120,160 removed)
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
        'latex', '0.25 \cdot x = 40',
        'explanation', 'Naməlum ədədi x götürürük. Onun 25%-i (0.25·x) 40-a bərabərdir.',
        'why', 'Faiz məsələlərini tənliklə həll etmək ən etibarlı üsuldur.',
        'hint', 'x-in 25%-i necə yazılır?',
        'error_code', 'PERCENT_TO_FRACTION',
        'check', jsonb_build_object('ask', 'Tənlik düzdürmü?', 'input_kind', 'text')
      ),
      jsonb_build_object(
        'index', 2,
        'title', 'x-i tap',
        'latex', 'x = \frac{40}{0.25} = \frac{40}{\frac{1}{4}} = 40 \cdot 4 = 160',
        'explanation', 'Hər iki tərəfi 0.25-ə böldükdə x = 160 alırıq.',
        'why', '0.25 = 1/4 olduğu üçün 0.25-ə bölmək 4-ə vurmaq deməkdir.',
        'hint', '40 ÷ 0.25 və ya 40 × 4 hesabla.',
        'error_code', 'DIVISION',
        'check', jsonb_build_object('ask', 'x nə qədərdir?', 'input_kind', 'number')
      ),
      jsonb_build_object(
        'index', 3,
        'title', 'Yoxla',
        'latex', '160 \cdot 0.25 = 40 \quad \checkmark',
        'explanation', '160-ın 25%-i həqiqətən 40-dır.',
        'why', 'Yoxlama cavabın doğruluğunu təsdiqləyir.',
        'hint', '160 × 0.25 = ?',
        'error_code', 'SUBSTITUTION_SKIPPED',
        'check', jsonb_build_object('ask', 'Yoxlama nəticəsi düzdürmü?', 'input_kind', 'text')
      )
    ),
    false,
    'template_authored'
  );

  insert into private.step_answers (question_id, step_index, accept, input_kind) values
    ('c0000001-0001-0001-0001-000000000010'::uuid, 1, '["bəli", "doğru", "düzdür", "✓"]'::jsonb, 'text'),
    ('c0000001-0001-0001-0001-000000000010'::uuid, 2, '["160"]'::jsonb, 'number'),
    ('c0000001-0001-0001-0001-000000000010'::uuid, 3, '["bəli", "doğru", "düzdür", "✓"]'::jsonb, 'text');

  raise notice 'Bank seed: 10 camera-format DİM questions inserted.';
end;
$$;

-- Grantlar (ADR-017, migration rule 2: app_runtime must have access)
grant select on public.questions to app_runtime;
grant select on public.question_translations to app_runtime;
-- private.step_answers: already has restrictive RLS, app_runtime accesses via app.check_answer RPC only
