-- E1.8: Fizika üçün bank_matchable = true edilməsi
-- Şagirdlərin Sual Bankında fizika testlərini görə bilməsi üçün.

UPDATE public.topic_codes
SET bank_matchable = true
WHERE code LIKE 'MECH.%'
   OR code LIKE 'THERMO.%'
   OR code LIKE 'ELEC.%'
   OR code LIKE 'OPT.%'
   OR code LIKE 'MAG.%'
   OR code LIKE 'EM.%';
