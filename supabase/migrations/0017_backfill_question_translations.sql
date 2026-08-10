-- ADR-018 §2 / HANDOFF (64) #3 (yekun qərar). Data-only.
--
-- "Bir problemin bir neçə həlli" sinif-dərinliyi klonu SAYILMIR (HANDOFF 64 #3) —
-- ən son (`verified` üstünlük, sonra `created_at` DESC) həll qazanır, qalanları eval
-- artefaktı sayılır və KÖÇÜRÜLMÜR. `prompt_version` `solutions`-da hələ sütun kimi
-- yoxdur (HANDOFF 58/0010-0011 gözlənilir) — "ən son prompt_version" tie-break əvəzinə
-- `created_at DESC` işlədilir, çünki mövcud datada bunlar korrelyasiyalıdır (xronoloji
-- sıra = prompt versiyası sırası). `prompt_version` sütunu bu sətirlərdə NULL qalır.
--
-- `status != 'ok'` olan həllər (unreadable/refused/multiple_problems) KEÇİLİR — onlarda
-- nə `canonical`, nə `steps` var, `question_translations.steps NOT NULL` sərhədini
-- keçə bilməzlər və zatən sual DEYİL.
--
-- `stem` sadəcə TAM `canonical` mətnini tək `text` blokuna sarır — STEP-SCHEMA-nın
-- `$...$` daxili LaTeX seqmentlərini `math` blokuna ayırmır (bu, parse tələb edir,
-- miqrasiyanın əhatəsində deyil; UI qatı hazırkı `formatMath()`-a bənzər render tətbiq
-- edə bilər ta ki block-səviyyəli parçalama yazılana qədər).
--
-- HANDOFF (67) yoxlaması işlədildi (production Supabase, `oxjzehxnbumgyoqjonju`),
-- nəticə HANDOFF (69)-da: 1 `problem_id` birdən çox uyğun həll daşıyır. Sətirlərə
-- baxıldı — eyni `grade`(11)/`topic_code`(PROB.BASIC)/`canonical` mətni, ~90 saniyə
-- fərqlə, HƏR İKİSİ `verified=null`. Bu, sinif-dərinliyi VARİANTI DEYİL — eyni sualın
-- TƏKRAR YÜKLƏNMƏSİDİR (iki ardıcıl foto/cəhd). Tapıntı HANDOFF (64) #3-ün fərziyyəsini
-- (çoxluq = eval artefaktı) DƏSTƏKLƏYİR, pozmur — ona görə bu fayl DƏYİŞDİRİLMƏDİ.
-- HANDOFF (70): Cowork bu tapıntını RƏSMİ VƏ DAİMİ QƏRAR kimi bağladı — klonlama
-- YOXDUR, sinif-dərinliyi variantları gələcəkdə `questions`-da AYRI sətir olacaq
-- (eyni `canonical_hash`, fərqli `grade`), `solutions`-da çoxsaylı sətir kimi YOX.
-- `design.md` §5-ə bu qayda əlavə olundu ki, sual bir daha açılmasın.

with winning as (
  select distinct on (problem_id) *
  from solutions
  where payload ? 'canonical'
    and jsonb_typeof(payload -> 'steps') = 'array'
    and jsonb_array_length(payload -> 'steps') > 0
    and (payload ->> 'status' is null or payload ->> 'status' = 'ok')
  order by problem_id, (verified is true) desc, created_at desc
)
insert into question_translations
  (question_id, lang, stem, steps, verified, verification_method, model, cost_usd, prompt_version)
select
  w.problem_id,
  'az',
  jsonb_build_object(
    'blocks', jsonb_build_array(
      jsonb_build_object('t', 'text', 'v', coalesce(w.payload ->> 'canonical', ''))
    )
  ),
  coalesce(
    (
      select jsonb_agg(elem #- '{check,accept}' order by (elem ->> 'index')::int)
      from jsonb_array_elements(w.payload -> 'steps') elem
    ),
    '[]'::jsonb
  ),
  coalesce(w.verified, false),
  w.verification_method,
  w.model,
  w.cost_usd,
  null
from winning w
join questions q on q.id = w.problem_id
on conflict (question_id, lang) do nothing;

-- Qəbul yoxlaması (əl ilə, tətbiqdən sonra): aşağıdakı fərq sual bazasında `steps`/
-- `canonical` olmayan və ya bütün həlləri `status != 'ok'` olan sətirlərin sayıdır —
-- bunlar QƏSDƏN tərcüməsiz qalıb, silinməyib.
--   select count(*) from questions q
--   where not exists (select 1 from question_translations qt where qt.question_id = q.id);
