-- ⚠️ Bu fayl production-da ARTIQ TƏTBİQ OLUNUB (Cowork tərəfindən) — burada YALNIZ repo-nu
-- production ilə sinxron saxlamaq üçün YAZILIB. Yenidən tətbiq ETMƏ.
--
-- ClickUp "0034–0038 migrasiyalarını repoya sinxronlaşdır" tapşırığı bu faylda "Vyet" →
-- "Viyet" / "x^2" → "x²" yazılış səhvi xəbərdarlığı verirdi. Production-da BİRBAŞA
-- yoxlanıldı (`question_translations.stem`/`steps` üzərində `LIKE` axtarışı): 0 sətirdə
-- səhv yazılış, 78-81 sətirdə DÜZGÜN "Viyet"/"x²" var — xəbərdarlıq həqiqətə uyğun
-- gəlmədi, mətn artıq düzgündür, əlavə düzəliş TƏLƏB OLUNMUR.

-- rəqəmi qəbul siyahısına çevirən köməkçi (mənfilər üçün unicode minus variantı da)
create or replace function private.acc_num(v numeric)
returns jsonb language sql immutable as $$
  select case when v < 0
    then jsonb_build_array(trim_scale(v)::text, replace(trim_scale(v)::text, '-', U&'\2212'))
    else jsonb_build_array(trim_scale(v)::text)
  end;
$$;

with p as (
  select q.id, q.topic_code,
         split_part(split_part(q.canonical,'|',2),'=',2)::numeric as v1,
         split_part(split_part(q.canonical,'|',3),'=',2)::numeric as v2,
         nullif(split_part(split_part(q.canonical,'|',4),'=',2),'')::numeric as v3
  from public.questions q
  where q.source = 'generated'
),
built as (
  -- FAIZ.PERCENT_OF : v1=n, v2=p
  select id,
    jsonb_build_array(
      jsonb_build_object('index',1,'title','Ədədin 1%-ni tap',
        'latex','1\% = \frac{' || v1 || '}{100}',
        'explanation','Faiz yüzdə bir hissə deməkdir. Əvvəlcə ədədin bir faizini tapmaq məsələni sadələşdirir.',
        'why','1%-i bilsək, istənilən faizi sadə vurma ilə tapa bilərik.',
        'hint',v1 || ' ədədini 100-ə böl.',
        'error_code','PERCENT_TO_FRACTION',
        'check',jsonb_build_object('ask',v1 || ' ədədinin 1%-i neçədir?','input_kind','number')),
      jsonb_build_object('index',2,'title',v2 || '%-i hesabla',
        'latex','\frac{' || v1 || '}{100} \cdot ' || v2,
        'explanation','1%-in qiymətini faiz sayına vurub axtarılan hissəni tapırıq.',
        'why','Faiz xətti kəmiyyətdir: 1%-i bilirsənsə, qalanı vurma ilə alınır.',
        'hint',(v1/100) || ' ədədini ' || v2 || '-ə vur.',
        'error_code','ARITHMETIC',
        'check',jsonb_build_object('ask','1% = ' || trim_scale(v1/100) || ' olduğuna görə ' || v2 || '% neçədir?','input_kind','number'))
    ) as steps,
    jsonb_build_array(
      jsonb_build_object('accept',private.acc_num(v1/100),'input_kind','number'),
      jsonb_build_object('accept',private.acc_num(v1*v2/100),'input_kind','number')
    ) as answers
  from p where topic_code = 'FAIZ.PERCENT_OF'

  union all
  -- FAIZ.INCREASE : v1=n, v2=p
  select id,
    jsonb_build_array(
      jsonb_build_object('index',1,'title','Artım məbləğini tap',
        'latex','\frac{' || v1 || ' \cdot ' || v2 || '}{100}',
        'explanation','Qiymətin neçə manat artdığını tapmaq üçün ilkin qiymətin faizini hesablayırıq.',
        'why','Artım həmişə ilkin qiymətdən hesablanır, yeni qiymətdən yox.',
        'hint',v1 || '-in ' || v2 || '%-ni hesabla.',
        'error_code','BASE_CONFUSION',
        'check',jsonb_build_object('ask','Qiymət neçə manat artıb?','input_kind','number')),
      jsonb_build_object('index',2,'title','Yeni qiyməti tap',
        'latex',v1 || ' + ' || trim_scale(v1*v2/100),
        'explanation','Artım məbləğini ilkin qiymətə əlavə edirik.',
        'why','Artım halında yeni qiymət ilkin qiymətdən böyük olmalıdır — nəticəni bununla yoxlaya bilərsən.',
        'hint','İlkin qiymətə artımı əlavə et.',
        'error_code','ARITHMETIC',
        'check',jsonb_build_object('ask',v1 || ' manata ' || trim_scale(v1*v2/100) || ' manat əlavə etsək neçə olar?','input_kind','number'))
    ),
    jsonb_build_array(
      jsonb_build_object('accept',private.acc_num(v1*v2/100),'input_kind','number'),
      jsonb_build_object('accept',private.acc_num(v1 + v1*v2/100),'input_kind','number')
    )
  from p where topic_code = 'FAIZ.INCREASE'

  union all
  -- ALG.LINEAR_EQUATION : v1=a, v2=x, v3=b
  select id,
    jsonb_build_array(
      jsonb_build_object('index',1,'title','Sərbəst həddi digər tərəfə keçir',
        'latex',v1 || 'x = ' || trim_scale(v1*v2+v3) || case when v3>0 then ' - ' || trim_scale(v3) else ' + ' || trim_scale(abs(v3)) end,
        'explanation','Hər iki tərəfdən eyni ədədi çıxsaq (və ya əlavə etsək) bərabərlik pozulmur.',
        'why','Məqsəd x-i tək qoymaqdır; ona görə əvvəlcə yanındakı sərbəst həddi aradan qaldırırıq.',
        'hint','Hər iki tərəfdən ' || trim_scale(v3) || ' çıx.',
        'error_code','TRANSPOSE_SIGN',
        'check',jsonb_build_object('ask','Sağ tərəf sadələşdikdən sonra ' || v1 || 'x nəyə bərabər olur?','input_kind','number')),
      jsonb_build_object('index',2,'title','Əmsala böl',
        'latex','x = \frac{' || trim_scale(v1*v2) || '}{' || v1 || '}',
        'explanation','x-in əmsalına bölərək x-in özünü tapırıq.',
        'why','Vurma ilə bölmə tərs əməllərdir — əmsalı yalnız bölmə ilə aradan qaldırmaq olar.',
        'hint',trim_scale(v1*v2) || ' ədədini ' || v1 || '-ə böl.',
        'error_code','DIVISION',
        'check',jsonb_build_object('ask','x neçəyə bərabərdir?','input_kind','number')),
      jsonb_build_object('index',3,'title','Yoxla',
        'latex',v1 || ' \cdot (' || v2 || ')' || case when v3>0 then ' + ' || trim_scale(v3) else ' - ' || trim_scale(abs(v3)) end,
        'explanation','Tapılan x-i ilkin tənlikdə yerinə qoyub sol tərəfi hesablayırıq.',
        'why','Yoxlama işarə və hesablama səhvlərini dərhal üzə çıxarır.',
        'hint','x = ' || v2 || ' qiymətini tənlikdə yerinə qoy.',
        'error_code','SUBSTITUTION_SKIPPED',
        'check',jsonb_build_object('ask','x = ' || v2 || ' olduqda sol tərəf neçə olur?','input_kind','number'))
    ),
    jsonb_build_array(
      jsonb_build_object('accept',private.acc_num(v1*v2),'input_kind','number'),
      jsonb_build_object('accept',private.acc_num(v2),'input_kind','number'),
      jsonb_build_object('accept',private.acc_num(v1*v2+v3),'input_kind','number')
    )
  from p where topic_code = 'ALG.LINEAR_EQUATION'

  union all
  -- ALG.QUADRATIC_EQUATION (kiçik kök) : v1=r1, v2=r2
  select id,
    jsonb_build_array(
      jsonb_build_object('index',1,'title','Köklərin hasilini oxu',
        'latex','x_1 \cdot x_2 = c',
        'explanation','Vyet teoreminə görə x^2+bx+c=0 tənliyində köklərin hasili c-yə bərabərdir.',
        'why','Hasil və cəmi bilsək, kökləri diskriminantsız seçmək olar.',
        'hint','Sərbəst həddə bax.',
        'error_code','COEFFICIENT_READ',
        'check',jsonb_build_object('ask','Köklərin hasili neçədir?','input_kind','number')),
      jsonb_build_object('index',2,'title','Köklərin cəmini oxu',
        'latex','x_1 + x_2 = -b',
        'explanation','Vyet teoreminə görə köklərin cəmi b əmsalının əks işarəlisidir.',
        'why','İşarəni unutmaq bu addımda ən çox rast gəlinən səhvdir.',
        'hint','x-in əmsalını götür və işarəsini dəyiş.',
        'error_code','SIGN_CHOICE',
        'check',jsonb_build_object('ask','Köklərin cəmi neçədir?','input_kind','number')),
      jsonb_build_object('index',3,'title','Kökləri tap və kiçiyini seç',
        'latex','x_1 = ' || v1 || ',\ x_2 = ' || v2,
        'explanation','Hasili və cəmi ödəyən iki tam ədədi tapıb kiçiyini seçirik.',
        'why','Məsələdə hər iki kök deyil, konkret olaraq kiçik kök soruşulur.',
        'hint','Hasili ' || trim_scale(v1*v2) || ', cəmi ' || trim_scale(v1+v2) || ' olan iki ədədi tap.',
        'error_code','ROOT_SELECTION',
        'check',jsonb_build_object('ask','Kiçik kök neçədir?','input_kind','number')),
      jsonb_build_object('index',4,'title','Yoxla',
        'latex','x^2 + bx + c = 0',
        'explanation','Tapılan kökü tənlikdə yerinə qoyduqda nəticə sıfır olmalıdır.',
        'why','Sıfır alınmırsa, kök səhvdir — bu, ən etibarlı özünüyoxlamadır.',
        'hint','Kiçik kökü tənlikdə yerinə qoy və hesabla.',
        'error_code','SUBSTITUTION_SKIPPED',
        'check',jsonb_build_object('ask','Kiçik kökü tənlikdə yerinə qoysaq nəticə neçə olar?','input_kind','number'))
    ),
    jsonb_build_array(
      jsonb_build_object('accept',private.acc_num(v1*v2),'input_kind','number'),
      jsonb_build_object('accept',private.acc_num(v1+v2),'input_kind','number'),
      jsonb_build_object('accept',private.acc_num(v1),'input_kind','number'),
      jsonb_build_object('accept',private.acc_num(0),'input_kind','number')
    )
  from p where topic_code = 'ALG.QUADRATIC_EQUATION'

  union all
  -- ALG.VIETA_SUM : v1=r1, v2=r2
  select id,
    jsonb_build_array(
      jsonb_build_object('index',1,'title','x-in əmsalını oxu',
        'latex','b = ' || trim_scale(-(v1+v2)),
        'explanation','Tənliyi x^2+bx+c=0 şəklində yazıb b əmsalını müəyyən edirik.',
        'why','Vyet düsturu birbaşa əmsallarla işləyir, kökləri tapmağa ehtiyac yoxdur.',
        'hint','x-in qarşısındakı ədədi işarəsi ilə birlikdə götür.',
        'error_code','COEFFICIENT_READ',
        'check',jsonb_build_object('ask','b əmsalı neçədir?','input_kind','number')),
      jsonb_build_object('index',2,'title','Vyet düsturunu tətbiq et',
        'latex','x_1 + x_2 = -\frac{b}{a}',
        'explanation','a=1 olduğuna görə köklərin cəmi sadəcə -b-yə bərabərdir.',
        'why','Bu düstur kökləri hesablamadan cəmi tapmağa imkan verir — vaxta qənaətdir.',
        'hint','b-nin işarəsini dəyiş.',
        'error_code','FORMULA_MISAPPLIED',
        'check',jsonb_build_object('ask','Köklərin cəmi neçədir?','input_kind','number')),
      jsonb_build_object('index',3,'title','Kökləri taparaq yoxla',
        'latex','x_1 = ' || v1 || ',\ x_2 = ' || v2,
        'explanation','Kökləri tapıb cəmləyirik və düsturla alınan nəticə ilə müqayisə edirik.',
        'why','İki müxtəlif yolla eyni nəticəni almaq düsturu doğru tətbiq etdiyini təsdiqləyir.',
        'hint','Hasili ' || trim_scale(v1*v2) || ' olan iki ədədi tap və cəmlə.',
        'error_code','SUBSTITUTION_SKIPPED',
        'check',jsonb_build_object('ask','Kökləri tapıb cəmləsən nəticə neçədir?','input_kind','number'))
    ),
    jsonb_build_array(
      jsonb_build_object('accept',private.acc_num(-(v1+v2)),'input_kind','number'),
      jsonb_build_object('accept',private.acc_num(v1+v2),'input_kind','number'),
      jsonb_build_object('accept',private.acc_num(v1+v2),'input_kind','number')
    )
  from p where topic_code = 'ALG.VIETA_SUM'
)
select count(*) filter (where r) as written, count(*) filter (where not r) as skipped
from (
  select public.store_generated_steps(id, 'az', steps, answers, null, 0, 'template-v1') as r
  from built
) z;
