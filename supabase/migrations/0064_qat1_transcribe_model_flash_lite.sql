-- ClickUp 86eykqb1c: Qat 1 (şəkil→transkripsiya) ucuz/sürətli modelə keçir.
-- Qat 5 / monolit `active_model` TOXUNULMUR.
--
-- Additive data-only. `app_config` 0056-dan mövcuddur, yeni obyekt/grant YOX.
-- Yalnız boş sətri doldurur — əl ilə qoyulmuş dəyəri OVERWRITE ETMİR.
--
-- Geri dönüş: `update public.app_config set value = '' where key = 'active_transcribe_model';`
-- (boş = yenidən `active_model`-ə düşür.)

update public.app_config
   set value = 'gemini-3.1-flash-lite',
       updated_at = now()
 where key = 'active_transcribe_model'
   and value = '';
