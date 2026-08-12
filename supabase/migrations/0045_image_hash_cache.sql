-- ClickUp "Şəkil hash-i üzrə transkripsiya keşi" — CLAUDE.md-in özünün qeyd etdiyi əsas
-- biznes riski (`$0.0167/həll`) üçün: eyni foto (byte-byte) TƏKRAR göndərilsə (şəbəkə
-- xətasından sonra retry, ikiqat toxunma), `/api/solve` bunu HƏR DƏFƏ real LLM çağırışı
-- kimi işləyirdi (`match_path` HƏMİŞƏ "llm" idi — heç bir keş-hit yolu yox idi). Content-
-- səviyyəli dedup (`questions_dedup_idx`, `canonical_hash`) YALNIZ LLM artıq OCR edəndən
-- SONRA işə düşür — bahalı hissəni (vision çağırışının özünü) qorumur.
--
-- DİQQƏT (təhlükəsizlik): keşlənən LLM çıxışı (`parsed`) `final_answer`/`steps[].check.accept`
-- daşıyır — YƏNİ CAVABIN ÖZÜ. Sadə `public` cədvəldə saxlansaydı, `app_runtime`-ın adi
-- `SELECT`-lə bunu oxuya bilməsi gate-78-in bütün `private`/`SECURITY DEFINER` təcridini
-- (`reveal_answer`/`store_answer` niyə RPC arxasındadır) BİRBAŞA KEÇƏRDİ. Ona görə keş
-- `private` sxemindədir, `app_runtime`-ın ora HEÇ BİR birbaşa grant-ı YOXDUR (ADR-017) —
-- yalnız aşağıdakı 2 `SECURITY DEFINER` RPC-lə giriş var, EYNİ naxış `reveal_*`/`store_*`.

create table if not exists private.image_hash_cache (
  image_hash     text not null,
  selected_label text not null default '',
  response       jsonb not null,
  created_at     timestamptz not null default now(),
  primary key (image_hash, selected_label)
);

alter table private.image_hash_cache enable row level security;

create or replace function app.reveal_cached_solve(p_image_hash text, p_selected_label text default '')
returns jsonb
language sql
security definer
set search_path = private, pg_temp
as $$
  select response from private.image_hash_cache
   where image_hash = p_image_hash and selected_label = coalesce(p_selected_label, '');
$$;

create or replace function app.store_cached_solve(p_image_hash text, p_selected_label text, p_response jsonb)
returns boolean
language plpgsql
security definer
set search_path = private, pg_temp
as $$
begin
  insert into private.image_hash_cache (image_hash, selected_label, response)
  values (p_image_hash, coalesce(p_selected_label, ''), p_response)
  on conflict (image_hash, selected_label) do nothing;
  return found;
end;
$$;

revoke all on function app.reveal_cached_solve(text, text) from public, anon, authenticated;
revoke all on function app.store_cached_solve(text, text, jsonb) from public, anon, authenticated;
grant execute on function app.reveal_cached_solve(text, text) to app_runtime;
grant execute on function app.store_cached_solve(text, text, jsonb) to app_runtime;
