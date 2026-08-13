-- 0055 · pHash overload ambiguity düzəlişi
-- DB-də tətbiq adı: fix_image_hash_cache_overload_ambiguity (20260813210816)
-- ⚠️ Bu fayl production-da ARTIQ TƏTBİQ OLUNUB — YALNIZ repo-nu sinxron saxlamaq üçün.
--
-- `0054`-ün DƏRHAL SONRA (tətbiqdən bir neçə dəqiqə sonra, koda TOXUNULMAZDAN ƏVVƏL)
-- aşkarlanan reqressiyasının düzəlişi — bax `0054`-ün öz sonundaki qeyd.
--
-- `app.reveal_cached_solve`/`app.store_cached_solve`-ə YENİ parametr (`p_phash`, defolt
-- NULL) əlavə etmək niyyəti "köhnə 2-arg çağırış TƏHLÜKƏSİZ qalır" idi. Real nəticə: iki
-- overload (2-arg köhnə, 3-arg yeni) EYNİ ANDA mövcud olanda Postgres 2-arg çağırışın HANSI
-- overload-a aid olduğunu HƏLL EDƏ BİLMİR (`function ... is not unique`) — bu, YALNIZ nəzəri
-- risk deyildi, production-da `select app.reveal_cached_solve('x','y')` ilə TƏSDİQLƏNDİ VƏ
-- HƏMİN AN monolit `/api/solve`-un (hələ 2-arg işlədən) HƏR sorğusunu qırırdı.
--
-- Düzəliş: köhnə 2-arg overload-ları SİL. Yalnız 3-arg (defolt `p_phash=null`) versiya qalır
-- — 2-arg VƏ 3-arg çağırışların İKİSİ DƏ İNDİ birmənalı olaraq HƏMİN funksiyaya həll olunur
-- (ambiguity YOXDUR, çünki namizəd BİRDİR).

drop function if exists app.reveal_cached_solve(text, text);
drop function if exists app.store_cached_solve(text, text, jsonb);

-- Yoxlama (tətbiqdən sonra əl ilə icra edildi, fayla YAZILMIR):
--   select app.reveal_cached_solve('any-hash', 'any-label');  -- artıq xəta VERMİR, null qaytarır
--   pg_proc: hər iki funksiyanın YALNIZ 3-arg versiyası qalıb.
