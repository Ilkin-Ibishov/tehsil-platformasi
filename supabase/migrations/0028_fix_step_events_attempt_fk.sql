-- Staging-də tapılan bug: `step_events.attempt_id` FK-si `0004`-dən `attempts(id)`-ə
-- işarə edirdi. `0020` `attempts`-i `attempt_items`-ə YENİDƏN ADLANDIRDI — Postgres-də
-- FK OID üzrə işləyir, ADA görə YOX: rename-dən sonra bu FK **eyni sətirlərə** (indi
-- `attempt_items` adlanan cədvələ) işarə etməyə davam etdi, `0021`-in YARATDIĞI YENİ
-- `attempts` (sessiya) cədvəlinə YOX.
--
-- Amma `/api/steps/check` (`web/app/api/steps/check/route.ts`) `step_events.attempt_id`-ə
-- KLİENTİN göndərdiyi `attempt_id`-ni yazır — bu, ADR-019 §G6 qərarına görə SESSİYA
-- (`attempts.id`) ID-sidir, `attempt_items.id` YOX (`events.attempt_id` ilə EYNİ semantika,
-- ADR-018 §6). Nəticə: FK həmişə pozulurdu (`step_events_attempt_id_fkey`), `step_events`
-- yazısı SÜKUTLA uğursuz olurdu (dizaynən — bax route-un öz try/catch-i) — şagird cavabı
-- alırdı, AMMA ölçmə (səhv xəritəsi, "harada itiririk") HEÇ vaxt yazılmırdı, xəta yalnız
-- server console-unda görünürdü.
--
-- Düzəliş: FK-ni YENİ `attempts` (sessiya) cədvəlinə yönləndir.

alter table step_events drop constraint step_events_attempt_id_fkey;
alter table step_events add constraint step_events_attempt_id_fkey
  foreign key (attempt_id) references attempts (id);
