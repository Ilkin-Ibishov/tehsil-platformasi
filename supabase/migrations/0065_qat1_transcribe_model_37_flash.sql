-- Qat 1: flash-lite qrafik kəsişmələrini tərs oxudu (ADR-025 n=2, sual 12).
-- Ilkin: image-to-text `gemini-3.7-flash`. Qat 5 `active_model` TOXUNULMUR.
--
-- Additive data-only. Yalnız flash-lite sətrini dəyişir — başqa əl dəyəri qalır.
--
-- Geri dönüş: `update public.app_config set value = 'gemini-3.1-flash-lite'
--   where key = 'active_transcribe_model';`

update public.app_config
   set value = 'gemini-3.7-flash',
       updated_at = now()
 where key = 'active_transcribe_model'
   and value = 'gemini-3.1-flash-lite';
