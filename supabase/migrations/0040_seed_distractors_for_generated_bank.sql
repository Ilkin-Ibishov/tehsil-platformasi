-- ⚠️ Bu fayl production-da ARTIQ TƏTBİQ OLUNUB (Cowork tərəfindən) — burada YALNIZ repo-nu
-- production ilə sinxron saxlamaq üçün YAZILIB. Yenidən tətbiq ETMƏ.

with p as (
  select q.id, q.topic_code,
         split_part(split_part(q.canonical,'|',2),'=',2)::numeric v1,
         split_part(split_part(q.canonical,'|',3),'=',2)::numeric v2
  from public.questions q where q.source='generated'
),
d as (
  -- FAIZ.PERCENT_OF : v1=n, v2=p
  select p.id, 1 si, jsonb_build_array(
    private.mk_distr(private.acc_num(v1/10),'PLACE_VALUE','Bu, 10%-dir. 1% üçün 100-ə bölmək lazımdır, 10-a yox.'),
    private.mk_distr(private.acc_num(v1*100),'OPERATION_CONFUSION','Burada bölmə lazımdır, vurma yox — faiz hissəni kiçildir.')
  ) items from p where topic_code='FAIZ.PERCENT_OF'
  union all
  select p.id, 2, jsonb_build_array(
    private.mk_distr(private.acc_num(v1*v2/10),'PLACE_VALUE','1%-i səhv tapmısan: 100-ə böl, 10-a yox.'),
    private.mk_distr(private.acc_num(v1-v1*v2/100),'SCOPE_CONFUSION','Bu, qalan hissədir. Sual məhz '||v2||'%-in özünü soruşur.'),
    private.mk_distr(private.acc_num(v1/100+v2),'OPERATION_CONFUSION','1%-i faiz sayına vurmaq lazımdır, üstünə gəlmək yox.')
  ) from p where topic_code='FAIZ.PERCENT_OF'

  -- FAIZ.INCREASE : v1=n, v2=p
  union all
  select p.id, 1, jsonb_build_array(
    private.mk_distr(private.acc_num(v1+v1*v2/100),'SCOPE_CONFUSION','Bu, yeni qiymətdir. Bu addımda yalnız artımın özü soruşulur.'),
    private.mk_distr(private.acc_num(v1*v2/10),'PLACE_VALUE','100-ə bölməyi unutma.')
  ) from p where topic_code='FAIZ.INCREASE'
  union all
  select p.id, 2, jsonb_build_array(
    private.mk_distr(private.acc_num(v1*v2/100),'INCOMPLETE_ANSWER','Bu, yalnız artım məbləğidir. Onu ilkin qiymətə əlavə etmək qalıb.'),
    private.mk_distr(private.acc_num(v1-v1*v2/100),'SIGN_CHOICE','Qiymət artıb, azalmayıb — çıxmaq yox, toplamaq lazımdır.')
  ) from p where topic_code='FAIZ.INCREASE'

  -- ALG.LINEAR_EQUATION : v1=a, v2=x, v3=b (v3 üçüncü hissədədir)
  union all
  select p.id, 1, jsonb_build_array(
    private.mk_distr(private.acc_num(v1*v2+2*b),'TRANSPOSE_SIGN','Digər tərəfə keçirəndə işarə dəyişir: çıxmaq lazımdır, toplamaq yox.')
  ) from p, lateral (select split_part(split_part((select canonical from public.questions where id=p.id),'|',4),'=',2)::numeric b) z
  where topic_code='ALG.LINEAR_EQUATION'
  union all
  select p.id, 2, jsonb_build_array(
    private.mk_distr(private.acc_num(v1*v2*v1),'OPERATION_CONFUSION','Əmsala bölmək lazımdır, vurmaq yox.'),
    private.mk_distr(private.acc_num(-v2),'SIGN_CHOICE','İşarəyə diqqət et — bölmədə işarələr saxlanılır.')
  ) from p where topic_code='ALG.LINEAR_EQUATION'

  -- ALG.QUADRATIC_EQUATION : v1=r1, v2=r2
  union all
  select p.id, 1, jsonb_build_array(
    private.mk_distr(private.acc_num(-(v1*v2)),'SIGN_CHOICE','Hasil c-nin özüdür, işarəsi dəyişmir. İşarə yalnız cəmdə dəyişir.')
  ) from p where topic_code='ALG.QUADRATIC_EQUATION'
  union all
  select p.id, 2, jsonb_build_array(
    private.mk_distr(private.acc_num(-(v1+v2)),'SIGN_CHOICE','b əmsalının işarəsini dəyişməyi unutmusan: cəm = -b.')
  ) from p where topic_code='ALG.QUADRATIC_EQUATION'
  union all
  select p.id, 3, jsonb_build_array(
    private.mk_distr(private.acc_num(v2),'ROOT_SELECTION','Bu, böyük kökdür. Sualda kiçik kök istənilir.'),
    private.mk_distr(private.acc_num(-v1),'SIGN_CHOICE','Kökün işarəsi tərsdir — tənlikdə yerinə qoyub yoxla.')
  ) from p where topic_code='ALG.QUADRATIC_EQUATION'

  -- ALG.VIETA_SUM : v1=r1, v2=r2
  union all
  select p.id, 1, jsonb_build_array(
    private.mk_distr(private.acc_num(v1+v2),'SIGN_CHOICE','Bu, artıq köklərin cəmidir. Bu addımda b əmsalının özü soruşulur.')
  ) from p where topic_code='ALG.VIETA_SUM'
  union all
  select p.id, 2, jsonb_build_array(
    private.mk_distr(private.acc_num(-(v1+v2)),'SIGN_CHOICE','Düsturda mənfi işarə var: cəm = -b, b deyil.'),
    private.mk_distr(private.acc_num(v1*v2),'FORMULA_MISAPPLIED','Bu, köklərin hasilidir. Cəm üçün başqa düstur işlədilir.')
  ) from p where topic_code='ALG.VIETA_SUM'
  union all
  select p.id, 3, jsonb_build_array(
    private.mk_distr(private.acc_num(v1*v2),'FORMULA_MISAPPLIED','Kökləri cəmləmək lazımdır, vurmaq yox.')
  ) from p where topic_code='ALG.VIETA_SUM'
)
update private.step_answers sa
   set distractors = private.distr(sa.accept, d.items)
  from d
 where sa.question_id = d.id and sa.step_index = d.si;
