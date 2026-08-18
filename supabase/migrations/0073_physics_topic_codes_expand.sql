-- E1.8 (86eynm9r9): fizika topic_codes genişlənməsi.
-- Additive INSERT. Model 26 kod yazdı; müəllif birləşdirməsi:
--   WAVES.MECHANICAL → MECH.WAVES
--   MECH.FLUIDS → MECH.HYDROSTATICS
--   MECH.MOMENTUM_CONSERVATION → MECH.MOMENTUM (0072, toxunulmur)
--   PHYS.SELF_INDUCTION + MAG.INDUCTANCE → ELEC.INDUCTION
--   PHYS.OSCILLATIONS (LC) → ELEC.AC_CIRCUITS
--   PHYS.ELECTROMAGNETIC_WAVES → EM.WAVES
--   EPHYS.SEMICONDUCTOR → ELEC.SEMICONDUCTOR
--   ELEC.POTENTIAL_ENERGY → ELEC.POTENTIAL
--   ELEC.POWER → ELEC.CIRCUIT (0072, toxunulmur)
-- 0053 fingerprint invariantı YALNIZ source='generated' AND fingerprint_prefix IS NOT NULL
-- olanda işləyir — burada prefix NULL, bank_matchable=false.
-- 0052 self-healing pozulmur. Yeni cədvəl/funksiya/grant YOX.

insert into public.topic_codes (code, fingerprint_prefix, title_az, bank_matchable, active) values
  ('MECH.ROTATIONAL_MOTION', null, 'Fırlanma hərəkəti',           false, true),
  ('MECH.STATICS',           null, 'Statika',                     false, true),
  ('MECH.OSCILLATIONS',      null, 'Rəqslər',                     false, true),
  ('MECH.WAVES',             null, 'Dalğalar',                    false, true),
  ('MECH.HYDROSTATICS',      null, 'Hidrostatika',                false, true),
  ('MECH.ELASTICITY',        null, 'Elastiklik',                  false, true),
  ('THERMO.FIRST_LAW',       null, 'Termodinamikanın I qanunu',   false, true),
  ('THERMO.HUMIDITY',        null, 'Rütubət',                     false, true),
  ('ELEC.POTENTIAL',         null, 'Elektrik potensialı',         false, true),
  ('MAG.LORENTZ_FORCE',      null, 'Lorens qüvvəsi',              false, true),
  ('ELEC.CAPACITANCE',       null, 'Elektrik tutumu',             false, true),
  ('ELEC.INDUCTION',         null, 'Elektromaqnit induksiya',     false, true),
  ('ELEC.AC_CIRCUITS',       null, 'Dəyişən cərəyan dövrəsi',     false, true),
  ('ELEC.SEMICONDUCTOR',     null, 'Yarımkeçirici',               false, true),
  ('EM.WAVES',               null, 'Elektromaqnit dalğaları',     false, true)
on conflict (code) do update
  set title_az = excluded.title_az,
      active = true,
      needs_review = false
  where public.topic_codes.bank_matchable = false;
