-- 0061 · topic_codes/error_codes RLS aktivləşdirilməsi (S7, ClickUp 86eymwgmk)
--
-- Supabase advisor (critical): hər iki cədvəldə RLS SÖNÜK idi. Yoxlanıldı (gate-78 dərsi
-- 3/4 — advisors YALNIZ "çox açıq"-ı görür, `anon`/`authenticated`-ə HEÇ bir GRANT YOXDUR
-- bu iki cədvəldə (`information_schema.role_table_grants`-dan təsdiqləndi) — yəni HAZIRDA
-- anon giriş yolu YOXDUR, RLS söndürülməsi advisor-un DEFANS-DƏRİNLİYİ tövsiyəsidir (gələcək
-- bir `grant select ... to anon` RLS backstop-suz dərhal HƏR SƏTRİ açardı).
--
-- `app_runtime`-ın mövcud SELECT/INSERT/UPDATE grant-ı (0051/0052) POLICY OLMADAN RLS aktiv
-- olanda BLOKLANARDI — `register_topic_code`/`register_error_code` trigger-ləri (0052) hər
-- şagird sorğusunda BU CƏDVƏLLƏRƏ insert edir, RLS-siz policy bu axını qırardı. Ona görə
-- `app_runtime` üçün TAM (select+insert+update) policy, `anon`/`authenticated` üçün HEÇ BİR
-- policy (kod yolunda istifadə TƏSDİQLƏNMƏYİB — gate-78 dərsi 4, spekulyativ genişləndirmə YOX).

alter table public.topic_codes enable row level security;
alter table public.error_codes enable row level security;

drop policy if exists app_runtime_full_access on public.topic_codes;
create policy app_runtime_full_access on public.topic_codes
  for all to app_runtime using (true) with check (true);

drop policy if exists app_runtime_full_access on public.error_codes;
create policy app_runtime_full_access on public.error_codes
  for all to app_runtime using (true) with check (true);
