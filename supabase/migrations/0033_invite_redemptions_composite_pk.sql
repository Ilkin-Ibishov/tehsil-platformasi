-- ⚠️ Bu fayl production-da ARTIQ TƏTBİQ OLUNUB (Cowork tərəfindən əl ilə) — burada YALNIQ
-- repo-nu production ilə sinxron saxlamaq üçün YAZILIB. Yenidən tətbiq ETMƏ.
--
-- `0032`-nin `code text primary key` seçimi yanlış idi: PK tək `code` olanda, ikinci
-- cihazdan (və ya brauzer datası silinən şagirdin YENİ device_id-i) eyni kodla gələn
-- redemption `ON CONFLICT (code) DO NOTHING` ilə TAM UDULUR — cədvəldə YALNIZ ilk
-- görülən device_id qalır, ikinci/sonrakı cihaz HEÇ YERDƏ görünmür. 15-20 şagirdlik
-- kohortda bu, D1 retensiya rəqəmini BİRBAŞA yalan edir (şagird qayıdıb, amma yeni
-- cihazdan — cədvəl bunu "qayıtmadı" kimi göstərər).
--
-- Düzəliş: PK `(code, device_id)` — hər (kod, cihaz) cütü öz sətrini alır, eyni koddan
-- BİRDƏN ÇOX cihaz TƏBİİ OLARAQ görünən qalır. Kod tərəfi (`web/app/api/solve/route.ts`)
-- `ON CONFLICT (code, device_id) DO NOTHING`-ə uyğunlaşdırılıb — indi YALNIZ eyni cihazdan
-- eyni kodun TƏKRAR göndərilməsi no-op-dur, fərqli cihaz HƏR ZAMAN yeni sətir yaradır.

alter table invite_redemptions drop constraint invite_redemptions_pkey;
alter table invite_redemptions add primary key (code, device_id);
