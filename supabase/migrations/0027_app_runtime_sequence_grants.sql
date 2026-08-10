-- Staging-də tapılan bug: `step_events.id bigserial` — `bigserial`/`serial` sütunlar
-- GİZLİ bir sequence yaradır (`step_events_id_seq`), `insert`-in `nextval()` çağırışı
-- ONA AYRICA icazə tələb edir. Postgres-də sequence CƏDVƏLDƏN AYRI obyektdir —
-- `0018`-dəki `grant select, insert, update on all tables in schema public` sequence-ləri
-- ƏHATƏ ETMİR. Nəticə: `app_runtime` `step_events`-ə yaza bilmirdi
-- (`permission denied for sequence step_events_id_seq`), `/api/steps/check` özü 200
-- qaytarırdı (step_events yazısı sükutla uğursuz olur, dizaynən) — AMMA ölçmə tamamilə
-- itirdi, xəta HEÇ YERDƏ görünmürdü console.error-dan başqa.
--
-- `0018`-dəki cədvəl GRANT-ının EYNİ struktur: həm mövcud sequence-lərə, həm gələcək
-- (`ALTER DEFAULT PRIVILEGES`) sequence-lərə.

grant usage, select on all sequences in schema public to app_runtime;
alter default privileges in schema public
  grant usage, select on sequences to app_runtime;
