-- SYSTEM-REVIEW-2026-08-07 §A2: `solutions.verified` `not null default false` idi, amma
-- `/api/solve` `verified===null` (sympy yoxlaya bilmədi — söz məsələsi, parametr və s.)
-- halında da hardcode `true` yazırdı, çünki sütun `null`-u qəbul etmirdi. `false` bu sətrə
-- heç vaxt çatmır (yuxarıda rədd edilir) — yəni davranış düzgün idi, sütun YALAN DEYİRDİ.
--
-- İndi `verified` HƏQİQİ üçlü dəyəri (`true`/`null`) yazır — sütun `NULL`-a icazə verməlidir.
-- `false` DEĞƏRİ BU CƏDVƏLDƏ hələ də görünməyəcək (route.ts eyni qaydanı saxlayır), amma
-- sütunun özü indi üç halı DOĞRU təmsil edə bilir.

alter table solutions alter column verified drop not null;
alter table solutions alter column verified drop default;
