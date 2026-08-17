-- E1.3 (86eyncjdu): fizika topic_codes ağacı.
-- Additive INSERT. 0053 fingerprint invariantı YALNIZ source='generated' AND
-- fingerprint_prefix IS NOT NULL olanda işləyir — burada prefix NULL, bank_matchable=false.
-- 0052 self-healing trigger pozulmur (naməlum kod hələ active=false, needs_review=true).
-- Yeni cədvəl/funksiya/grant YOX — topic_codes 0051-də mövcuddur, RLS 0061.

insert into public.topic_codes (code, fingerprint_prefix, title_az, bank_matchable, active) values
  ('MECH.KINEMATICS',  null, 'Kinematika',        false, true),
  ('MECH.DYNAMICS',    null, 'Dinamika',          false, true),
  ('MECH.WORK_ENERGY', null, 'İş və enerji',      false, true),
  ('MECH.MOMENTUM',    null, 'Impuls',            false, true),
  ('THERMO.HEAT',      null, 'İstilik',           false, true),
  ('THERMO.GAS_LAWS',  null, 'Qaz qanunları',     false, true),
  ('ELEC.OHM',         null, 'Om qanunu',         false, true),
  ('ELEC.CIRCUIT',     null, 'Dövrə',             false, true),
  ('ELEC.FIELD',       null, 'Elektrik sahəsi',   false, true),
  ('OPT.REFRACTION',   null, 'İşığın sınması',    false, true)
on conflict (code) do nothing;
