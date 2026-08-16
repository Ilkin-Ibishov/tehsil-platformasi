-- ADR-030: soak həcmi Gemini. `chatgpt_web` ehtiyat olaraq qalır (kod yolu silinmir).
-- Additive data-only. Şagird dəvəti `soak_provider`-ə baxmır.
-- Geri: `update public.app_config set value='chatgpt_web' where key='soak_provider';`

update public.app_config
   set value = 'gemini'
 where key = 'soak_provider'
   and value is distinct from 'gemini';
