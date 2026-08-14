-- ADR-023: model seçimini Vercel env-dən (redeploy tələb edir) DB-yə köçürür. Bu, gələcək
-- admin dashboard-un backend-i (Ilkin-in tapşırığı — "mən özüm UI-dan dropdown-dan seçim
-- edim") VƏ indi Claude Code/Cowork-un birbaşa SQL ilə redeploy-suz dəyişə bilməsi üçündür.
--
-- İki açar: `active_model` (əsas/Qat5 + monolit yol), `active_transcribe_model` (Qat 1,
-- boş qalarsa `active_model`-ə düşür — `TRANSCRIBE_MODEL || GEMINI_MODEL` köhnə zəncirinin
-- eyni davranışı). Env dəyişənləri (`GEMINI_MODEL`/`TRANSCRIBE_MODEL`) BOOTSTRAP fallback
-- kimi qalır — DB sətri yoxdursa (yeni environment, miqrasiya hələ tətbiq olunmayıb) kod
-- sınmasın deyə.

create table if not exists public.app_config (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_config enable row level security;

-- Yalnız server (`app_runtime`) oxuyur — anon/authenticated-ə HEÇ bir siyasət YOXDUR,
-- yəni default-inkar tətbiq olunur (gate-78 dərsi: implicit-ə güvənmə, AÇIQ yaz).
create policy app_config_app_runtime_select on public.app_config
  for select to app_runtime using (true);

insert into public.app_config (key, value) values
  ('active_model', 'gemini-3.6-flash'),
  ('active_transcribe_model', '')
on conflict (key) do nothing;

revoke all on public.app_config from public, anon, authenticated;
grant select on public.app_config to app_runtime;

comment on table public.app_config is
  'Redeploy-suz dəyişdirilə bilən runtime konfiqurasiya (məs. aktiv LLM modeli, ADR-023). '
  'Yazı YALNIZ birbaşa SQL/gələcək admin RPC ilədir — app_runtime-a UPDATE grant-ı YOXDUR.';
