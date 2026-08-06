-- events — xam telemetriya axını (docs/DATA-MODEL.md, docs/TELEMETRY.md)
-- Append-only. Silinmir, yenilənmir. event_id klientdə yaradılır — upsert ilə idempotentlik.
--
-- Portativ SQL: heç bir Supabase-ə xas funksiya/extension işlədilmir (S1a lokal Postgres,
-- S1b eyni miqrasiya Supabase-də). uuid sütunları klient tərəfindən dolur, DEFAULT gen_random_uuid()
-- lazım deyil.

create table if not exists events (
  event_id       uuid primary key,
  device_id      uuid not null,
  session_id     uuid,
  attempt_id     uuid,
  name           text not null,
  ts_client      timestamptz,
  ts_server      timestamptz not null default now(),
  props          jsonb not null default '{}'::jsonb,
  app_version    text,
  schema_version int not null default 1
);

create index if not exists events_device_ts_idx on events (device_id, ts_server);
create index if not exists events_attempt_idx on events (attempt_id);
create index if not exists events_name_ts_idx on events (name, ts_server);
