-- SYSTEM-REVIEW-2026-08-07 §A1: `attempts.completed` daşıyırdı İKİ MƏNA birdən —
-- "/api/solve həlli çatdırdı" (server, dəvət kodu/gündəlik limit bunu sayır) VƏ
-- "şagird son addıma çatdı" (klient, DATA-MODEL.md-in orijinal tərifi). Nəticədə
-- `completed` HƏMİŞƏ 100% olurdu, `abandoned_at_step` heç vaxt dolmurdu — "harada
-- itiririk?" sualı cavabsız qalırdı.
--
-- `delivered`: server /api/solve INSERT-də yazır, dəyişməz (limit sorğusu bunu sayır).
-- `completed`: defolt false, klient son addımdan sonra `/api/attempts/progress`-dən yazır.

alter table attempts add column if not exists delivered bool not null default true;
alter table attempts alter column completed set default false;

-- Bu worktree-də/prod-da hələ real şagird məlumatı yoxdur (S4 şagirdlərə açılmayıb,
-- HANDOFF 41/42) — mövcud sətirlər yalnız çatdırılmanı yazırdı, "son addıma çatdı"
-- mənasında DEYİL. Köhnə mənanı yeni sütuna köçürüb `completed`-i sıfırlayırıq.
update attempts set delivered = completed, completed = false;
