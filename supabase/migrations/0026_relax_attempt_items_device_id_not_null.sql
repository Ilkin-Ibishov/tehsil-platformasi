-- Staging-də tapılan bug, `0025`-lə EYNİ SİNİF: `attempt_items.device_id` (köhnə
-- `attempts.device_id`, `0002`-dən, rename-dən sonra da `NOT NULL` qalıb) İNDİ
-- `device_id`-in MƏNTİQİ YERİ DEYİL — `0021`-in yeni sessiya `attempts` cədvəli
-- `device_id`-i daşıyır (design.md §9). Yeni `attempt_items` INSERT-i (`/api/solve`)
-- bu sütunu doldurmur, `null value in column "device_id" violates not-null constraint`
-- ilə sınır.
--
-- Eyni axtarışla `attempt_items`-in digər köhnə (rename-dən qalma) sütunları yoxlanıldı:
-- `student_ref` artıq NULLABLE-dır (problem yoxdur), `completed` `NOT NULL DEFAULT false`
-- olduğu üçün bloklamır (yalnız artıq istifadə OLUNMAYAN ölü sütun kimi qalır — təmizlik
-- ayrı miqrasiyadır, bu ADR-in əhatəsində deyil).

alter table attempt_items alter column device_id drop not null;
