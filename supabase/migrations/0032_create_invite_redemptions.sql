-- S4/S5 şagird dəvət axını (HANDOFF 81) — 15-20 şagirdi login olmadan içəri buraxıb
-- aktivliyini bir-birindən ayırmaq üçün minimal əlavə.
--
-- `invites` kataloq cədvəli QƏSDƏN YARADILMIR: `INVITE_CODES` env dəyişəni (əl ilə
-- idarə olunan, 15-20 tanınan şagird) ARTIQ kataloqdur — `code`/`label`/`max_devices`/
-- `expires_at`/`revoked_at` sahələri olan ayrıca cədvəl bu pilot ölçüsü üçün ADR-012-nin
-- artıq bir dəfə rədd etdiyi "per-user kod cədvəli overengineering-i" nümunəsini təkrar
-- edərdi (bax `docs/decisions/ADR-012-s3-solve-api.md`, "Qərar 3 geri çağırılır").
--
-- `student_ref`-in ARTIQ dəvət kodunun özü olması (0006/ADR-012) DAU/D1 retensiyasını
-- `device_id`-dən ASILI OLMADAN ölçülə bilən edir — bu cədvəl retensiya üçün ŞƏRT DEYİL,
-- yalnız (a) "kod nə vaxt İLK dəfə açıldı" anını (D1 lövbəri, `attempts.started_at`-in
-- MIN-i ilə demək olar eyni, amma solve-a qədər tərk edən şagirdləri də görünən edir) və
-- (b) ilk-açılış telemetriya hadisəsini verir.
--
-- Bilərəkdən "sərt" 1-cihaz-1-kod kilidi QOYULMUR: `ON CONFLICT (code) DO NOTHING` —
-- brauzer datası silinən/telefonu dəyişən şagird eyni kodu YENİDƏN yazsa, RƏDD EDİLMİR,
-- sadəcə `device_id` yenilənmir (ilk sətir qalır). Sərt kilid qoyulsaydı, məhz T5/HANDOFF-79-da
-- sənədləşdirilən ITP-səbəbli data-itkisi real şagirdi HƏMİŞƏLİK kilidləyərdi.

create table if not exists invite_redemptions (
  code         text primary key,
  device_id    uuid not null,
  redeemed_at  timestamptz not null default now()
);

alter table invite_redemptions enable row level security;

create policy app_runtime_full_access on invite_redemptions
  for all to app_runtime using (true) with check (true);

-- `0018`-in `alter default privileges` qaydası yeni public cədvəllərə SELECT/INSERT/UPDATE-i
-- avtomatik verir, amma T1 dərsinə görə (CLAUDE.md, "Miqrasiya və icazə dərsləri") heç vaxt
-- implicit-ə güvənmə — açıq təkrar-təsdiq.
grant select, insert, update on invite_redemptions to app_runtime;
