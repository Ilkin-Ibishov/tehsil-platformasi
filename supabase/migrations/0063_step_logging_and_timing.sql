-- 0063 · addım-səviyyəli tam loqlama + server-timestamp əsaslı vaxt ölçməsi
-- (Ilkin-in birbaşa tapşırığı, 2026-08-14, HANDOFF 104)
--
-- İki tələb:
--   1. Şagirdin YAZDIĞI cavab (doğru/səhv fərq etmədən) `step_events`-ə əlavə olunsun —
--      hazırda yalnız `error_code`/`attempts_count` var, XAM mətn YOXDUR.
--   2. Hər addımda sərf olunan vaxt — KLİENT taymerindən YOX, server timestamp-lərinin
--      fərqindən hesablanmalıdır (klient saatına etibar edilmir).

alter table public.step_events
  add column if not exists given_answer text,
  add column if not exists is_correct boolean;

comment on column public.step_events.given_answer is
  'Şagirdin BİRBAŞA yazdığı xam cavab mətni (doğru/səhv fərq etmədən) — S-tapşırığı 2026-08-14.';
comment on column public.step_events.is_correct is
  'error_code null olması ilə QARIŞDIRILMASIN (əvvəllər ikisi arasında fərq yox idi — həm
   doğru cavab, həm "distraktora uyğun gəlməyən səhv cavab" error_code=null verirdi). Bu sütun
   AÇIQ boolean-dır, ikisini AYIRIR.';

-- Server "addım göstərildi" damğası — `/api/steps/shown`, hər addım render olunanda çağırılır.
-- Vaxt hesablaması: addım N-in müddəti = (addım N+1-in `shown_at`-ı) − (addım N-in
-- `shown_at`-ı). Best-effort (telemetriya kimi), amma `events` cədvəlindən FƏRQLİ olaraq
-- BATCH-LANMIR (dərhal yazılır) — `events`-in 10 saniyəlik flush intervalı qısa addımlarda
-- vaxtı təhrif edərdi.
create table if not exists public.step_views (
  id bigint generated always as identity primary key,
  attempt_id uuid not null,
  step_index int not null,
  shown_at timestamptz not null default now()
);

create index if not exists idx_step_views_attempt on public.step_views (attempt_id, shown_at);

alter table public.step_views enable row level security;

drop policy if exists app_runtime_full_access on public.step_views;
create policy app_runtime_full_access on public.step_views
  for all to app_runtime using (true) with check (true);

grant select, insert on public.step_views to app_runtime;

-- Hər addımın müddəti — sonraki `shown_at`-a qədər. SON addımın müddəti bu view-də NULL qalır
-- (növbəti "shown" hadisəsi yoxdur — reveal/bitirmə ayrı bir marker TƏLƏB EDƏR, bu versiyada
-- QURULMUR, açıq qeyd olunur).
create or replace view public.v_step_timing as
select
  attempt_id,
  step_index,
  shown_at,
  lead(shown_at) over (partition by attempt_id order by shown_at) as next_shown_at,
  extract(epoch from (lead(shown_at) over (partition by attempt_id order by shown_at) - shown_at))::int as time_on_step_sec
from public.step_views;

grant select on public.v_step_timing to app_runtime;
