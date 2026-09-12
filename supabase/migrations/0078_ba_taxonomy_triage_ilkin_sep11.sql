-- 0078 · BA Taxonomy Triage (İlkin 2026-09-11)
-- Mənbə: docs/reports/taxonomy-triage-2026-09-10.md
-- 27 unreviewed kod: 23 ADOPT, 3 MERGE, 1 REJECT
-- DİQQƏT: Historical questions.topic_code remap OUT OF SCOPE (gələcək PR).

-- 1. Aliası daşımaq üçün sütun əlavə et (FK YOX — student path qorunur)
alter table public.topic_codes add column if not exists alias_of text null;

comment on column public.topic_codes.alias_of is
  'Kanonik kodun koduna istinad (konvensiya ilə); sərt FK yoxdur. Alias qeydləri active=false-dur və v_taxonomy_review-da görünmür.';

-- 2. 23 ADOPT: active=true, needs_review=false, title_az təyin edilir
insert into public.topic_codes (code, title_az, bank_matchable, active, needs_review) values
  ('ALG.INVERSE_PROPORTIONALITY', 'Tərs mütənasiblik', false, true, false),
  ('ALG.LINEAR_FUNCTION', 'Xətti funksiya', false, true, false),
  ('ALG.FUNCTION_GRAPH', 'Funksiyanın qrafiki', false, true, false),
  ('ALG.FUNCTIONS', 'Funksiyalar və qrafiklər', false, true, false),
  ('ALG.QUADRATIC_FUNCTION', 'Kvadratik funksiya', false, true, false),
  ('ALG.PARABOLA_VERTEX', 'Parabolanın təpə nöqtəsi', false, true, false),
  ('ALG.QUADRATIC_EXTREMUM', 'Kvadrat üçhədlinin ən böyük/ən kiçik qiyməti', false, true, false),
  ('ALG.EXPONENTS', 'Qüvvət və xassələri', false, true, false),
  ('ALG.FUNCTION_RANGE', 'Funksiyanın qiymətlər çoxluğu', false, true, false),
  ('ALG.SEQUENCES', 'Ardıcıllıqlar', false, true, false),
  ('ALG.ARITHMETIC_PROGRESSION', 'Ədədi silsilə', false, true, false),
  ('ALG.FACTORING', 'Vuruqlara ayırma', false, true, false),
  ('ALG.RADICALS', 'Kökaltı ifadələr', false, true, false),
  ('ALG.COMPLEX_NUMBERS', 'Kompleks ədədlər', false, true, false),
  ('ARITH.ADDITION', 'Sadə toplama', false, true, false),
  ('GEO.TRIANGLE_ANGLES', 'Üçbucağın bucaqları', false, true, false),
  ('GEO.VECTORS', 'Vektorlar', false, true, false),
  ('GEO.INSCRIBED_CIRCLE', 'Daxilə çəkilmiş çevrə', false, true, false),
  ('GEO.CIRCLE_AREA', 'Dairənin sahəsi', false, true, false),
  ('GEO.SOLID_GEOMETRY', 'Fəza fiqurları (Stereometriya)', false, true, false),
  ('GEO.CONE_AREA', 'Konusun səthinin sahəsi', false, true, false),
  ('GEO.CONE_VOLUME', 'Konusun həcmi', false, true, false),
  ('LOGIC.CIPHER', 'Şifrəli məntiq', false, true, false)
on conflict (code) do update set
  title_az = excluded.title_az,
  active = true,
  needs_review = false,
  alias_of = null;

-- 3. 3 MERGE: active=false, needs_review=false, alias_of=<canonical>
insert into public.topic_codes (code, title_az, bank_matchable, active, needs_review, alias_of) values
  ('VEC.OPERATIONS', 'Vektor əməliyyatları', false, false, false, 'GEO.VECTORS'),
  ('GEO.SOLID_CONE_VOLUME', 'Konusun həcmi', false, false, false, 'GEO.CONE_VOLUME'),
  ('ARITH.SQUARE_ROOT', 'Kvadrat kök', false, false, false, 'ALG.RADICALS')
on conflict (code) do update set
  active = false,
  needs_review = false,
  alias_of = excluded.alias_of;

-- 4. 1 REJECT: active=false, needs_review=false, alias_of=null (not a topic — problem_type only)
insert into public.topic_codes (code, title_az, bank_matchable, active, needs_review, alias_of) values
  ('ALG.WORD_PROBLEM', 'Mətnli cəbr məsələsi', false, false, false, null)
on conflict (code) do update set
  active = false,
  needs_review = false,
  alias_of = null;
