-- HANDOFF (68). Additiv, sıfır risk — `0014`/`0020`-dəki RENAME-lərin tətbiqindən
-- ASILI DEYİL, ancaq `attempt_items`/`questions` adları SXEMDƏ mövcud olmalıdır ki,
-- FK-lar yaransın (yəni tətbiq zamanı sıra `0021`-dən SONRA gəlir — "asılı deyil"
-- HANDOFF (68)-də konseptual mənadadır: bu faylın MƏZMUNU `0014`/`0020`-in qərarından
-- asılı deyil, tətbiq SIRASI hələ də `0012..0021`-dən sonra `0022`-dir).
--
-- `question_reports` `user_capture` keyfiyyət döngəsidir: şagird "bu səhvdir" desə,
-- sual DƏRHAL bankdan çıxır (`reported`) — hesabat gözləmək o deməkdir ki, səhv həll
-- digər şagirdlərə göstərilməyə davam edir. Statuslar arası avtomatik keçid (trigger
-- və ya RPC) bu miqrasiyanın ƏHATƏSİNDƏ DEYİL — cədvəl və indeks açılır, keçid
-- məntiqi `/api/reports` route-u yazılanda gəlir (HANDOFF 68 cədvəli, tətbiq kodu).

create table if not exists question_reports (
  id              uuid primary key,          -- client generasiya edir
  question_id     uuid not null references questions (id),
  attempt_item_id uuid references attempt_items (id),
  device_id       uuid not null,
  user_id         uuid,
  reason          text not null check (reason in
    ('wrong_answer','wrong_step','unreadable','not_a_problem','other')),
  step_index      smallint,
  note            text,
  resolved_at     timestamptz,
  resolution      text check (resolution in ('fixed','rejected','duplicate','invalid')),
  created_at      timestamptz not null default now()
);

create index if not exists idx_reports_open
  on question_reports (question_id) where resolved_at is null;

-- Sui-istifadə qapısı: eyni cihaz eyni sualı bir dəfə report edə bilər (açıq report
-- həll olunmayıbsa). Əks halda bir istifadəçi bankı boşalda bilər.
create unique index if not exists question_reports_one_open_per_device
  on question_reports (question_id, device_id) where resolved_at is null;

alter table question_reports enable row level security;
