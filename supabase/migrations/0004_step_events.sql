-- `step_events` — DATA-MODEL.md-də sənədləşdirilib, indiyədək HEÇ VAXT tətbiq olunmayıb
-- (S3/S4 client-side yoxlama işlədirdi, server yazısı yox idi). HANDOFF (45) §2:
-- addım yoxlaması indi serverdə olur (`/api/steps/check`), bu cədvəl onun faktını yazır.
--
-- Append-only, hər YOXLAMA çağırışı (düz və ya səhv) bir sətir — DATA-MODEL.md-dəki
-- "TƏKRARLANAN SƏHVLƏR" aqreqasiyası (`group by error_code, count(*)`) sətir-başına-hadisə
-- fərz edir, sütun-daxili sayğac YOX (`attempts_count` DATA-MODEL.md-də sənədləşib, amma
-- append-only modeldə hər sətir onsuz da bir cəhddir — sütun BURADA saxlanılır ki DATA-MODEL
-- ilə uyğun qalsın, dəyəri "bu, addımın neçənci cəhdidir" kimi hesablanıb yazılır).
--
-- `used_why`/`used_token_hint` S4-ün əhatəsində DEYİL (HANDOFF 40: "niyə belədir" və simvol
-- izahı STEP-SCHEMA-da yoxdur) — sütunlar DATA-MODEL uyğunluğu üçün saxlanılır, defolt false,
-- heç bir kod onları hələ true yazmır.

create table if not exists step_events (
  id               bigserial primary key,
  attempt_id       uuid not null references attempts (id),
  step_index       int not null,
  error_code       text,
  attempts_count   int not null default 1,
  used_why         bool not null default false,
  used_token_hint  bool not null default false,
  created_at       timestamptz not null default now()
);

create index if not exists step_events_attempt_idx on step_events (attempt_id);
create index if not exists step_events_error_code_idx on step_events (error_code);
