-- ⚠️ Bu fayl production-da ARTIQ TƏTBİQ OLUNUB (Cowork tərəfindən) — burada YALNIZ repo-nu
-- production ilə sinxron saxlamaq üçün YAZILIB. Yenidən tətbiq ETMƏ (idempotent deyil —
-- `gen_random_uuid()` hər işə salınmada YENİ sətirlər yaradar, dublikat bank yaranar).
--
-- 5 şablondan 217 generasiya sualı (bax ClickUp "0034–0038 migrasiyalarını repoya
-- sinxronlaşdır" tapşırığı): faiz (6-cı sinif), xətti tənlik, kvadrat tənliyin kiçik
-- kökü, Vyet cəmi (9-cu sinif). `stem` yaradılır, `steps` NULL qalır (0034-ün lazy
-- generasiya modeli) — addım-addım həll `0038`-də şablonla YAZILIR.

with base as materialized (
  -- 1) Faizin tapılması (6-cı sinif)
  select gen_random_uuid() as id,
         'FAIZ.OF|n=' || n || '|p=' || p as canonical,
         'FAIZ.OF|' || n || ',' || p as fp,
         'FAIZ.PERCENT_OF' as topic, 6 as grade, 1::smallint as diff,
         'faiz_of_v1' as tmpl,
         n || ' ədədinin ' || p || '%-i neçədir?' as stem,
         (n * p / 100)::text as ans
  from generate_series(200, 1200, 100) n,
       unnest(array[5, 10, 15, 20, 25]) p

  union all
  -- 2) Faizlə artım (6-cı sinif)
  select gen_random_uuid(),
         'FAIZ.INC|n=' || n || '|p=' || p,
         'FAIZ.INC|' || n || ',' || p,
         'FAIZ.INCREASE', 6, 2::smallint,
         'faiz_increase_v1',
         'Bir malın qiyməti ' || n || ' manatdır. Qiymət ' || p || '% artırılıb. Malın yeni qiyməti neçə manat olar?',
         (n + n * p / 100)::text
  from generate_series(40, 200, 20) n,
       unnest(array[5, 10, 15, 25]) p

  union all
  -- 3) Xətti tənlik (7-ci sinif)
  select gen_random_uuid(),
         'LIN|a=' || a || '|x=' || x || '|b=' || b,
         'LIN|' || a || ',' || b || ',' || (a * x + b),
         'ALG.LINEAR_EQUATION', 7, 2::smallint,
         'linear_ax_b_v1',
         a || 'x' || case when b > 0 then ' + ' || b else ' - ' || abs(b) end
           || ' = ' || (a * x + b) || ' tənliyini həll edin. x = ?',
         x::text
  from unnest(array[2, 3, 5, 7]) a,
       unnest(array[-3, 2, 3, 4, 5, 6]) x,
       unnest(array[5, -7]) b

  union all
  -- 4) Kvadrat tənliyin kiçik kökü (9-cu sinif)
  select gen_random_uuid(),
         'QUAD.MIN|r1=' || r1 || '|r2=' || r2,
         'QUAD.MIN|' || (-(r1 + r2)) || ',' || (r1 * r2),
         'ALG.QUADRATIC_EQUATION', 9, 3::smallint,
         'quad_smaller_root_v1',
         'x^2' || case when -(r1 + r2) = 0 then ''
                       when -(r1 + r2) > 0 then ' + ' || (-(r1 + r2)) || 'x'
                       else ' - ' || abs(r1 + r2) || 'x' end
              || case when r1 * r2 = 0 then ''
                      when r1 * r2 > 0 then ' + ' || (r1 * r2)
                      else ' - ' || abs(r1 * r2) end
              || ' = 0 tənliyinin kiçik kökünü tapın.',
         r1::text
  from generate_series(-5, 3) r1, generate_series(-4, 6) r2
  where r2 > r1 and r1 * r2 <> 0 and abs(r1 + r2) <= 7

  union all
  -- 5) Vyet teoremi: köklərin cəmi (9-cu sinif)
  select gen_random_uuid(),
         'QUAD.SUM|r1=' || r1 || '|r2=' || r2,
         'QUAD.SUM|' || (-(r1 + r2)) || ',' || (r1 * r2),
         'ALG.VIETA_SUM', 9, 3::smallint,
         'quad_roots_sum_v1',
         'x^2' || case when -(r1 + r2) = 0 then ''
                       when -(r1 + r2) > 0 then ' + ' || (-(r1 + r2)) || 'x'
                       else ' - ' || abs(r1 + r2) || 'x' end
              || case when r1 * r2 = 0 then ''
                      when r1 * r2 > 0 then ' + ' || (r1 * r2)
                      else ' - ' || abs(r1 * r2) end
              || ' = 0 tənliyinin köklərinin cəmini tapın.',
         (r1 + r2)::text
  from generate_series(-4, 3) r1, generate_series(-3, 5) r2
  where r2 > r1 and r1 * r2 <> 0 and abs(r1 + r2) <= 6
),
q as (
  insert into public.questions (
    id, canonical, canonical_hash, numeric_fingerprint, problem_type,
    subject, subject_id, grade, topic_code, source, source_template,
    root_id, version, type, payload, difficulty_static,
    license_status, review_status
  )
  select b.id, b.canonical,
         encode(sha256(convert_to(b.canonical, 'UTF8')), 'hex'),
         b.fp, b.topic,
         'math', '39842f68-c929-4b2c-9cb2-a55f0dec2eec'::uuid,
         b.grade, b.topic, 'generated', b.tmpl,
         b.id, 1, 'open', '{}'::jsonb, b.diff,
         'owned', 'draft'
  from base b
  returning id
),
t as (
  insert into public.question_translations (
    question_id, lang, stem, steps, verified, verification_method
  )
  select b.id, 'az',
         jsonb_build_object('blocks', jsonb_build_array(
           jsonb_build_object('t', 'text', 'v', b.stem))),
         null, false, 'algebraic_construction'
  from base b
  returning question_id
),
a as (
  insert into private.question_answers (question_id, answer, validator)
  select b.id,
         jsonb_build_object('latex', b.ans, 'values', jsonb_build_array(b.ans)),
         'exact'
  from base b
  returning question_id
)
select (select count(*) from q) as questions,
       (select count(*) from t) as translations,
       (select count(*) from a) as answers;
