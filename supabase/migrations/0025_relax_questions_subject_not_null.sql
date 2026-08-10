-- Staging-də tapılan bug (`/api/solve` INSERT-i): `questions.subject` (köhnə `problems.subject`
-- text sütunu, `0002`-dən) HƏLƏ `NOT NULL`-dır. `0014`/ADR-018 §1a `subject_id` (uuid FK →
-- `subjects`) əlavə etdi və bunu `subject`-in ƏVƏZİ kimi nəzərdə tutdu, amma köhnə sütunun
-- `NOT NULL` məhdudiyyətini GÖTÜRMƏDİ — yeni INSERT-lər (`web/app/api/solve/route.ts`)
-- `subject_id`-i doldurur, `subject`-i YOX, `null value in column "subject" violates not-null
-- constraint` ilə sınır.
--
-- Mövcud sətirlərin `subject` dəyəri TOXUNULMUR (tarixi məlumat qalır) — yalnız məhdudiyyət
-- götürülür ki, yeni sətirlər `subject_id`-ə etibar edə bilsin.

alter table questions alter column subject drop not null;
