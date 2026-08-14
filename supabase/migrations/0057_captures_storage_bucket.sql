-- 0057 · Çəkilmiş şəkillərin saxlanması (ADR-024, ClickUp S1 / 86eymwght)
--
-- `captures` bucket-i PRIVATE-dir. Qəsdən heç bir RLS policy əlavə edilmir: storage.objects-də
-- RLS artıq (Supabase sistem defoltu ilə) aktivdir, policy-siz bucket "heç kimə açıq deyil"
-- deməkdir — `service_role` isə RLS-i BYPASS edir (Postgres bypassrls), ona görə server
-- (`web/lib/storage.ts`) service-role açarı ilə yazır/signed URL yaradır, `anon`/`authenticated`
-- heç vaxt birbaşa toxuna bilmir. Bu, gate-78 dərsi ilə eyni prinsipdir (implicit-ə güvənmə),
-- fərq ondadır ki, storage.objects-də "implicit" = "sıfır", "explicit" burada YOX bir şey əlavə
-- etmək olardı ki, bu da səhv istiqamətdə davamlı riskdir.

-- `comment on table storage.buckets` CƏHD EDİLDİ, production-da rədd olundu ("must be owner
-- of table buckets" — Supabase `storage` sxemi `supabase_admin` mülkiyyətindədir, layihə
-- rolu ONA comment yaza bilmir). Şərh bu faylın özündədir, DB-də DEYİL.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('captures', 'captures', false, 2097152, array['image/jpeg', 'image/png'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
