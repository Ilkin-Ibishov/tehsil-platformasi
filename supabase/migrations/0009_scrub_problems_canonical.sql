-- HANDOFF (56) §2 / ADR-003 (2026-08-08 əlavəsi): `problems.canonical` mətn məsələlərində
-- DİM test toplusunun mətnini demək olar HƏRFİ saxlayır (SYSTEM-REVIEW §D1) — ADR-003-ün
-- "DİM mətni saxlanılmır" vədini pozur. Variant (b): `canonical` artıq YAZILMIR, yalnız
-- `canonical_hash` + `numeric_fingerprint` keş açarı kimi qalır.
--
-- `hash` MÖVCUD SƏTİRLƏRDƏ TOXUNULMUR — o, `canonical`-ın SHA-256-sudur, sətirdən asılı deyil,
-- silinsə keş bütün mövcud sətirlər üçün sıfırlanardı (hər foto yeni sətir kimi görünərdi).
-- Sütun SİLİNMİR (məhv edilə bilməyən DDL, kodda hələ referans ehtimalı) — yalnız boşaldılır,
-- gələcək insert-lər boş sətir yazacaq (bax web/app/api/solve/route.ts).

update problems set canonical = '' where canonical != '';
