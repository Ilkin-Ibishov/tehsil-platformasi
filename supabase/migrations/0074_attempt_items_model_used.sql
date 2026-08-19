-- 0074: model fallback telemetriyası (ClickUp 86eyp5gt2)
-- Fallback hansı modelə keçdiyini görünən edir. `model_used` jsonb çünki
-- kaskad tək model adı ilə ifadə olunmur (Qat 1 ≠ Qat 5).

alter table attempt_items
  add column if not exists model_used jsonb;

comment on column attempt_items.model_used is
  'JSON: {"qat1":"model-id","qat5":"model-id"} — kaskadda hər qatın istifadə etdiyi model';

-- v_model_health: model üzrə n, orta cost, orta latensiya, fallback nisbəti.
-- `events` + `attempt_items` birləşməsi — fallback_used props-dan gəlir.
create or replace view v_model_health as
select
  ai.model_used->>'qat5' as model,
  count(*) as n,
  avg(ai.cost_usd) as avg_cost_usd,
  avg((e.props->>'layer_latency_ms')::numeric) as avg_latency_ms,
  count(*) filter (where (e.props->>'fallback_used')::boolean = true) as fallback_count,
  round(
    count(*) filter (where (e.props->>'fallback_used')::boolean = true)::numeric
    / nullif(count(*), 0), 4
  ) as fallback_ratio
from attempt_items ai
left join events e
  on e.attempt_id = ai.attempt_id
  and e.name = 'solve.cascade'
where ai.model_used is not null
group by ai.model_used->>'qat5';

grant select on v_model_health to app_runtime;
