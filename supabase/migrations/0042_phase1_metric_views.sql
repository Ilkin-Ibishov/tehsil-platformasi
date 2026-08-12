-- ⚠️ Bu fayl production-da ARTIQ TƏTBİQ OLUNUB (Cowork tərəfindən) — burada YALNIZ repo-nu
-- production ilə sinxron saxlamaq üçün YAZILIB. Yenidən tətbiq ETMƏ.

-- 1) Gündəlik aktivlik
create or replace view public.v_dau as
select ts_server::date as gun,
       count(distinct device_id) as aktiv_cihaz,
       count(*) filter (where name='app.opened') as acilis,
       count(*) filter (where name='solve.requested') as solve_sorgu,
       count(*) filter (where name='solution.completed') as tamamlanan
from public.events group by 1 order by 1 desc;

-- 2) D1 retention
create or replace view public.v_d1_retention as
with ilk as (
  select device_id, min(ts_server::date) as ilk_gun
  from public.events group by 1
),
qayidan as (
  select i.ilk_gun, i.device_id,
         exists (select 1 from public.events e
                 where e.device_id=i.device_id and e.ts_server::date=i.ilk_gun+1) as d1
  from ilk i
)
select ilk_gun, count(*) as kohort,
       count(*) filter (where d1) as qayitdi,
       round(100.0*count(*) filter (where d1)/nullif(count(*),0),1) as d1_faiz
from qayidan group by 1 order by 1 desc;

-- 3) Şagird üzrə aktivlik
create or replace view public.v_student_activity as
select ai.student_ref,
       count(distinct ai.device_id) as cihaz,
       count(*) as hell,
       count(*) filter (where ai.completed) as tamamlanan,
       count(*) filter (where ai.self_solved) as ozu_helletdi,
       count(*) filter (where ai.revealed_answer) as cavaba_baxdi,
       round(avg(ai.duration_sec)) as orta_saniye,
       count(distinct ai.created_at::date) as aktiv_gun,
       max(ai.created_at)::date as son_gun
from public.attempt_items ai
where ai.student_ref is not null
group by 1 order by 3 desc;

-- 4) Kaskad qatları (events)
create or replace view public.v_solve_layers as
select ts_server::date as gun,
       coalesce(props->>'match_path','naməlum') as qat,
       count(*) as sorgu,
       round(avg((props->>'latency_ms')::numeric)) as orta_gecikme_ms,
       round(max((props->>'latency_ms')::numeric)) as maks_gecikme_ms,
       round(sum(coalesce((props->>'cost_usd')::numeric,0)),4) as xerc_usd
from public.events where name='solve.response'
group by 1,2 order by 1 desc, 3 desc;

-- 5) Solve sağlamlığı
create or replace view public.v_solve_health as
select ts_server::date as gun,
       count(*) filter (where name='solve.requested') as sorgu,
       count(*) filter (where name='solve.response')  as cavab,
       count(*) filter (where name='refusal.shown')   as imtina,
       count(*) filter (where name='solve.failed')    as ugursuz,
       round(100.0*count(*) filter (where name='solve.response')
             /nullif(count(*) filter (where name='solve.requested'),0),1) as cavab_faizi
from public.events
where name in ('solve.requested','solve.response','refusal.shown','solve.failed')
group by 1 order by 1 desc;

-- 6) Huni
create or replace view public.v_funnel as
select ts_server::date as gun,
       count(distinct device_id) filter (where name='app.opened') as acdi,
       count(distinct device_id) filter (where name='capture.photo_taken') as sekil_cekdi,
       count(distinct device_id) filter (where name='crop.confirmed') as kesdi,
       count(distinct device_id) filter (where name='solve.requested') as solve_istedi,
       count(distinct device_id) filter (where name='step.shown') as addim_gordu,
       count(distinct device_id) filter (where name='solution.completed') as tamamladi
from public.events group by 1 order by 1 desc;

-- 7) error_code paylanması — pedaqoji siqnal
create or replace view public.v_error_codes as
select coalesce(ai.error_code,'(səhv yoxdur)') as error_code,
       count(*) as say,
       count(distinct ai.student_ref) as sagird,
       round(100.0*count(*)/nullif(sum(count(*)) over (),0),1) as faiz
from public.attempt_items ai
group by 1 order by 2 desc;

-- 8) Faza 1 qapısı
create or replace view public.v_phase1_gate as
select
  (select count(distinct student_ref) from public.attempt_items where student_ref is not null) as sagird,
  (select count(*) from public.attempt_items where completed) as real_hell,
  (select count(*) from public.questions where deleted_at is null and superseded_by is null) as bank,
  (select round(avg(d1_faiz),1) from public.v_d1_retention where kohort>=3) as d1_faiz,
  (select round(coalesce(sum((props->>'cost_usd')::numeric),0),2)
     from public.events where name='solve.response') as llm_xerci_usd,
  (select round(100.0*count(*) filter (where props->>'match_path' is distinct from 'llm')
                /nullif(count(*),0),1)
     from public.events where name='solve.response') as llmsiz_faiz;

grant select on public.v_dau, public.v_d1_retention, public.v_student_activity,
  public.v_solve_layers, public.v_solve_health, public.v_funnel,
  public.v_error_codes, public.v_phase1_gate to app_runtime;
