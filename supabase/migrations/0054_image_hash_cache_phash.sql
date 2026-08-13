-- 0054 · pHash keçidi (ClickUp 86eymfgbv)
-- DB-də tətbiq adı: image_hash_cache_phash (20260813210622)
-- Qeyd (INV-10, docs/INVARIANTS.md): bu fayl əvvəlcə "0049" adlanırdı — Cowork EYNİ ANDA
-- öz "0049"-unu (taxonomy_reference_tables, DB adı: 20260813202812) tətbiq edib push etmişdi.
-- Real DB tətbiq sırası: Cowork-un 0049-0053-ü (202812-204513) BU migrasiyadan (210622) ƏVVƏL
-- gəlir — fayl buna görə 0054-ə köçürüldü, DB-yə YENİDƏN TƏTBİQ EDİLMİR.
--
-- "Ən yüksək ROI-li tək dəyişiklik": dəqiq hash (sha256) yalnız EYNİ
-- BAYT faylı tanıyır. Şagird eyni məsələni bir az fərqli bucaqdan/işıqda çəksə, fayl bayt-bayt
-- FƏRQLİDİR — keş boşa çıxır, yeni LLM çağırışı gedir. pHash (`web/lib/phash.ts`, DCT-əsaslı,
-- 64 bit) şəklin VİZUAL məzmununu kodlaşdırır, kiçik fərqlər Hamming məsafəsini AZ dəyişir.
--
-- ADDITIVE: mövcud sha256 dəqiq-uyğunluq yolu TOXUNULMUR (indeks, sətir, davranış — dəyişməz),
-- pHash YALNIZ FALLBACK kimi əlavə olunur. `p_phash` hər iki RPC-də DEFAULT NULL-dur — köhnə
-- çağırışlar (2 arqumentlə) İNDİ DƏ işləyəcək, sadəcə pHash faydasından məhrum qalacaqlar.

alter table private.image_hash_cache add column if not exists phash text;

comment on column private.image_hash_cache.phash is
  '64-bit DCT pHash, 16 hex simvol (web/lib/phash.ts::computePHash). NULL = köhnə sətir və ya deşifrə uğursuz oldu (best-effort, sha256 yolu bundan asılı deyil).';

-- Axtarış ardıcıllığı (task-ın öz sözü): sha256 dəqiq uyğunluq → pHash Hamming ≤ 5 → cache miss.
-- `bit_count()` PG14+-dadır (tətbiq edilməzdən əvvəl `show server_version` — 17.6, kifayətdir).
-- Hamming = XOR-dakı 1-lərin sayı, hex→bit(64) kastı ilə.
--
-- MİQYAS QEYDİ: bu sorğu `image_hash_cache`-in HAMISINI (selected_label süzgəcindən sonra)
-- bit_count ilə skan edir — heç bir indeks Hamming-yaxınlıq axtarışını sürətləndirmir (BK-tree/
-- LSH tələb edərdi, bura QURULMADI). Cari mərhələdə (217 sual, aşağı trafik) əhəmiyyətsizdir;
-- cədvəl minlərlə sətrə çatanda YENİDƏN QİYMƏTLƏNDİRİLMƏLİDİR.
create or replace function app.reveal_cached_solve(
  p_image_hash text,
  p_selected_label text default '',
  p_phash text default null
)
returns jsonb
language plpgsql
security definer
set search_path = private, pg_temp
as $$
declare
  v_response jsonb;
begin
  select response into v_response
    from private.image_hash_cache
   where image_hash = p_image_hash and selected_label = coalesce(p_selected_label, '');
  if v_response is not null then
    return v_response;
  end if;

  if p_phash is not null then
    select response into v_response
      from private.image_hash_cache
     where selected_label = coalesce(p_selected_label, '')
       and phash is not null
       and bit_count(('x' || phash)::bit(64) # ('x' || p_phash)::bit(64)) <= 5
     order by bit_count(('x' || phash)::bit(64) # ('x' || p_phash)::bit(64)) asc
     limit 1;
  end if;

  return v_response;
end;
$$;

-- `on conflict ... do update` — köhnə (pHash-dan ƏVVƏLKİ) sətirlər eyni şəkil TƏKRAR
-- gəlsə pHash-i GERİYƏ DOLDURUR (backfill), `coalesce` mövcud dəyəri QORUYUR (heç vaxt
-- geriyə YAZMIR) — ayrıca backfill skripti YAZILMADI, adi istifadə bunu üzvi şəkildə edir.
create or replace function app.store_cached_solve(
  p_image_hash text,
  p_selected_label text,
  p_response jsonb,
  p_phash text default null
)
returns boolean
language plpgsql
security definer
set search_path = private, pg_temp
as $$
begin
  insert into private.image_hash_cache (image_hash, selected_label, response, phash)
  values (p_image_hash, coalesce(p_selected_label, ''), p_response, p_phash)
  on conflict (image_hash, selected_label)
  do update set phash = coalesce(private.image_hash_cache.phash, excluded.phash);
  return found;
end;
$$;

-- CLAUDE.md icazə dərsi 2: implicit privilege-ə güvənmə. AÇIQ grant — YENİ overload üçün
-- (aşağıdaki qeydə bax, bu, REPLACE deyil, YENİ funksiya identitidir, öz grant-ını tələb edir).
revoke all on function app.reveal_cached_solve(text, text, text) from public, anon, authenticated;
revoke all on function app.store_cached_solve(text, text, jsonb, text) from public, anon, authenticated;
grant execute on function app.reveal_cached_solve(text, text, text) to app_runtime;
grant execute on function app.store_cached_solve(text, text, jsonb, text) to app_runtime;

-- ⚠️ TƏTBİQDƏN SONRA AŞKARLANAN REQRESSİYA — `0055`-də DƏRHAL DÜZƏLDİLDİ, bax o fayl.
-- Təxmin: parametr əlavəsi (2→3 arqument, defolt dəyərlə) `CREATE OR REPLACE`-i "ƏVVƏLKİNİ
-- ƏVƏZ EDƏN" hesab etdim. YANLIŞ ÇIXDI: Postgres funksiya İDENTİTİSİ arqument TİPLƏRİ
-- siyahısı üzərindəndir (defolt dəyərlər ONA DAXİL DEYİL) — 2→3 tip siyahısı DƏYİŞDİYİ üçün
-- bu, REPLACE yox, YENİ OVERLOAD yaratdı. Tətbiqdən DƏRHAL sonra, istehsalatda, real sınaqla
-- (`select app.reveal_cached_solve('x','y')`) aşkarlandı: iki overload (2-arg köhnə, 3-arg
-- yeni) EYNİ ANDA mövcud olanda 2-arg çağırış AMBIGUOUS xətası ilə UĞURSUZ olur — bu, HƏMİN
-- ANDA production-da HƏR `/api/solve` çağırışını (monolit, hələ 2-arg işlədirdi) QIRDI.
-- `0050` köhnə overload-ları DƏRHAL sildi (~1 dəqiqəlik pəncərə). Dərs: parametr əlavəsi
-- "təhlükəsiz" hesab edilmədən ƏVVƏL real çağırışla sınanmalıdır — defolt dəyər overload
-- ambiguity-sini ARADAN QALDIRMIR.
