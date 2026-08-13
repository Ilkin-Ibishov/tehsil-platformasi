-- ADR-020 T3 / ClickUp 86eykj7tu davamı — ClickUp tapşırıq sahibinin qərarı (HANDOFF 84-ə cavab):
-- bankın `FAIZ.PERCENT_OF`/`FAIZ.INCREASE` topic_code-ları `ADR-008`-i pozur ("SAHƏ.MÖVZU,
-- hər ikisi İNGİLİSCƏ") — Qat 1 promptu modelə `ARITH.*` domenini öyrədir, `FAIZ` heç vaxt
-- istehsal edilmir. Nəticədə 91 sual (bankın 42%-i) Qat 2b-nin bərabərlik-pozucusundan HEÇ VAXT
-- keçə bilmirdi (ADR-020-də ölçülüb).
--
-- Yeni kodlar: `ARITH.PERCENT_OF` / `ARITH.PERCENT_INCREASE` — `ADR-008`-in nümunə siyahısındakı
-- `ARITH.PERCENTAGE` ilə eyni domendə, amma İKİ AYRI MÖVZU kimi (səbəb QUAD.MIN/QUAD.SUM ilə
-- EYNİDİR — eyni rəqəmlər, fərqli sual, fərqli cavab: "200-ün 15%-i" = 30, "200 + 15% artım" = 230).
--
-- `problem_type` SÜTUNU DA YENİLƏNİR — SEED BUQU İLƏ BAĞLI ARDICILLIQ SAXLAMA: `0036`-nın öz
-- INSERT-i (aşağıda görünən sətirlərə bax) `problem_type` sütununa STEP-SCHEMA enum-u
-- (formula|word_problem|geometry|mixed) YOX, elə `topic_code`-un ÖZÜNÜ yazıb — bu, `0036`-nın
-- BÜTÜN 217 sətrinə aid ümumi bir sxem bugudur, YALNIZ FAIZ-ə aid deyil. Bu miqrasiya onu
-- DÜZƏLTMİR (əhatə xaricində, backlog — real şagird şəkilləri gələnə qədər hansı problem_type
-- semantikasının lazım olduğu bilinmir) — YALNIZ mövcud "iki sütun eyni dəyəri daşıyır" halını
-- YENİ kodlarla da SAXLAYIR ki, gələcəkdə problem_type-a etibar edən kod (hələ yoxdur, amma
-- `topic_code`-un simmetriyası kimi yazıla bilər) köhnə `FAIZ.*` dəyərinə görə səssizcə sınmasın.

update public.questions
   set topic_code = 'ARITH.PERCENT_OF',
       problem_type = 'ARITH.PERCENT_OF'
 where topic_code = 'FAIZ.PERCENT_OF'
   and deleted_at is null;

update public.questions
   set topic_code = 'ARITH.PERCENT_INCREASE',
       problem_type = 'ARITH.PERCENT_INCREASE'
 where topic_code = 'FAIZ.INCREASE'
   and deleted_at is null;

comment on column public.questions.topic_code is
  'SAHƏ.MÖVZU, İNGİLİSCƏ BÖYÜK HƏRFLƏ (ADR-008). FAIZ.* kodları 0048-də ARITH.*-ə köçürüldü — yeni Azərbaycanca/ADR-008-ə zidd kod YAZMA.';
