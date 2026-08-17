-- E1.1 (86eyncj10): fənn promptu yoxdursa səssiz math.md əvəzinə (default sönük)
-- `status: unsupported` qaytarılsın. ADR-023 — Vercel env YOX, `app_config`.
-- Additive data-only. `app_config` 0056-dan mövcuddur, yeni obyekt/grant YOX.
--
-- Açmaq: `update public.app_config set value='1' where key='prompt_strict_subject';`
-- Geri: `value='0'`.

insert into public.app_config (key, value) values
  ('prompt_strict_subject', '0')
on conflict (key) do nothing;
