-- SYSTEM-REVIEW-2026-08-07 §A3 (HANDOFF 41): Faza 1 qapısı "20 şagirddən ≥8-i 7 gündə ≥3 dəfə
-- qayıdır" — bu, tamamilə `device_id`-yə (localStorage) söykənir. iOS Safari ITP quraşdırılmamış
-- saytın yaddaşını MƏHZ 7 gün istifadəsizlikdən sonra silir: ölçü aləti ölçmək istədiyi
-- sərhəddə sınır.
--
-- Həll: fərdi dəvət kodu (`ilkin-01`...`ilkin-20`) → server `INVITE_CODES`-də tanıyır, kodun
-- özü `student_ref` kimi yazılır (ayrı `students` cədvəli lazım deyil — kod onsuz da unikaldır).
-- `device_id` texniki qalır (hələ də `attempts`-in əsas açarıdır), retensiya `student_ref`
-- üzrə hesablanmalıdır.

alter table attempts add column if not exists student_ref text;
create index if not exists attempts_student_ref_idx on attempts (student_ref, created_at);
