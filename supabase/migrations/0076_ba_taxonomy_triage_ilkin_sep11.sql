-- 0076 · BA Taxonomy Triage (İlkin 2026-09-11)
-- Mənbə: docs/reports/taxonomy-triage-2026-09-10.md
-- 27 unreviewed kod: 23 ADOPT, 3 MERGE, 1 REJECT
-- DİQQƏT: Historical questions.topic_code remap OUT OF SCOPE (gələcək PR).

-- 1. Aliası daşımaq üçün sütun əlavə et (FK YOX — student path qorunur)
alter table public.topic_codes add column if not exists alias_of text null;

comment on column public.topic_codes.alias_of is
  'Kanonik kodun koduna istinad (konvensiya ilə); sərt FK yoxdur. Alias qeydləri active=false-dur və v_taxonomy_review-da görünmür.';

-- 2. 23 ADOPT: active=true, needs_review=false, title_az təyin edilir
update public.topic_codes set active=true, needs_review=false, title_az='Tərs mütənasiblik' where code='ALG.INVERSE_PROPORTIONALITY';
update public.topic_codes set active=true, needs_review=false, title_az='Xətti funksiya' where code='ALG.LINEAR_FUNCTION';
update public.topic_codes set active=true, needs_review=false, title_az='Funksiyanın qrafiki' where code='ALG.FUNCTION_GRAPH';
update public.topic_codes set active=true, needs_review=false, title_az='Funksiyalar və qrafiklər' where code='ALG.FUNCTIONS';
update public.topic_codes set active=true, needs_review=false, title_az='Kvadratik funksiya' where code='ALG.QUADRATIC_FUNCTION';
update public.topic_codes set active=true, needs_review=false, title_az='Parabolanın təpə nöqtəsi' where code='ALG.PARABOLA_VERTEX';
update public.topic_codes set active=true, needs_review=false, title_az='Kvadrat üçhədlinin ən böyük/ən kiçik qiyməti' where code='ALG.QUADRATIC_EXTREMUM';
update public.topic_codes set active=true, needs_review=false, title_az='Qüvvət və xassələri' where code='ALG.EXPONENTS';
update public.topic_codes set active=true, needs_review=false, title_az='Funksiyanın qiymətlər çoxluğu' where code='ALG.FUNCTION_RANGE';
update public.topic_codes set active=true, needs_review=false, title_az='Ardıcıllıqlar' where code='ALG.SEQUENCES';
update public.topic_codes set active=true, needs_review=false, title_az='Ədədi silsilə' where code='ALG.ARITHMETIC_PROGRESSION';
update public.topic_codes set active=true, needs_review=false, title_az='Vuruqlara ayırma' where code='ALG.FACTORING';
update public.topic_codes set active=true, needs_review=false, title_az='Kökaltı ifadələr' where code='ALG.RADICALS';
update public.topic_codes set active=true, needs_review=false, title_az='Kompleks ədədlər' where code='ALG.COMPLEX_NUMBERS';
update public.topic_codes set active=true, needs_review=false, title_az='Sadə toplama' where code='ARITH.ADDITION';
update public.topic_codes set active=true, needs_review=false, title_az='Üçbucağın bucaqları' where code='GEO.TRIANGLE_ANGLES';
update public.topic_codes set active=true, needs_review=false, title_az='Vektorlar' where code='GEO.VECTORS';
update public.topic_codes set active=true, needs_review=false, title_az='Daxilə çəkilmiş çevrə' where code='GEO.INSCRIBED_CIRCLE';
update public.topic_codes set active=true, needs_review=false, title_az='Dairənin sahəsi' where code='GEO.CIRCLE_AREA';
update public.topic_codes set active=true, needs_review=false, title_az='Fəza fiqurları (Stereometriya)' where code='GEO.SOLID_GEOMETRY';
update public.topic_codes set active=true, needs_review=false, title_az='Konusun səthinin sahəsi' where code='GEO.CONE_AREA';
update public.topic_codes set active=true, needs_review=false, title_az='Konusun həcmi' where code='GEO.CONE_VOLUME';
update public.topic_codes set active=true, needs_review=false, title_az='Şifrəli məntiq' where code='LOGIC.CIPHER';

-- 3. 3 MERGE: active=false, needs_review=false, alias_of=<canonical>
update public.topic_codes set active=false, needs_review=false, alias_of='GEO.VECTORS' where code='VEC.OPERATIONS';
update public.topic_codes set active=false, needs_review=false, alias_of='GEO.CONE_VOLUME' where code='GEO.SOLID_CONE_VOLUME';
update public.topic_codes set active=false, needs_review=false, alias_of='ALG.RADICALS' where code='ARITH.SQUARE_ROOT';

-- 4. 1 REJECT: active=false, needs_review=false, alias_of=null (not a topic — problem_type only)
update public.topic_codes set active=false, needs_review=false, alias_of=null where code='ALG.WORD_PROBLEM';
