-- 0050 · OCR korpus və distraktor sağlamlıq view-ları
-- DB-də tətbiq adı: 0044_ocr_corpus_and_distractor_health_views (20260813134850)

create or replace view public.v_ocr_corpus as
select
  source,
  count(*)                                             as toplam,
  count(*) filter (where corrected)                    as duzeldilmis,
  count(*) filter (where correction_kind = 'rejected') as tam_sehv,
  round(100.0 * count(*) filter (where not corrected) / nullif(count(*),0), 1) as duzgun_oxuma_faizi,
  count(*) filter (where usable_for_training)          as train_ucun_yararli,
  round(avg(latency_ms))                               as orta_latency_ms,
  round(sum(cost_usd), 4)                              as toplam_xerc_usd
from public.ocr_captures
group by source;

create or replace view public.v_distractor_health as
with seeded as (
  select d->>'error_code' as error_code, count(*) as seeded_count
  from private.step_answers sa
  cross join lateral jsonb_array_elements(coalesce(sa.distractors,'[]'::jsonb)) d
  group by 1
),
fired as (
  select error_code, count(*) as fired_count, count(distinct attempt_id) as unikal_cehd
  from public.step_events
  where error_code is not null
  group by 1
)
select
  coalesce(s.error_code, f.error_code) as error_code,
  coalesce(s.seeded_count, 0)          as seeded_count,
  coalesce(f.fired_count, 0)           as fired_count,
  coalesce(f.unikal_cehd, 0)           as unikal_cehd,
  case
    when coalesce(f.fired_count,0) = 0 and coalesce(s.seeded_count,0) > 0 then 'olu_distraktor'
    when s.error_code is null then 'seedsiz_kod'
    else 'aktiv'
  end as veziyyet
from seeded s
full outer join fired f on f.error_code = s.error_code
order by coalesce(f.fired_count,0) desc, coalesce(s.seeded_count,0) desc;

grant select on public.v_ocr_corpus, public.v_distractor_health to app_runtime;
