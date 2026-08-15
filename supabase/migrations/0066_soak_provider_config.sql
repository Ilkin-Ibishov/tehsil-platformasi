-- Faza 2 S0 / ADR-029: soak bayrağı. Defolt SÖNÜK — şagird Gemini yolu dəyişmir.
-- Additive data-only. `app_config` 0056-dan mövcuddur, yeni obyekt/grant YOX.
--
-- Açmaq: `update public.app_config set value='1' where key='soak_enabled';`
-- Qızıl n=10: `update public.app_config set value='gemini' where key='soak_provider';`
-- Geri: `value='0'` / `value='chatgpt_web'`.

insert into public.app_config (key, value) values
  ('soak_enabled', '0'),
  ('soak_provider', 'chatgpt_web')
on conflict (key) do nothing;
