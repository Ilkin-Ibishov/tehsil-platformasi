-- Staging-də tapılan KRİTİK bug (ADR-019 §"Deploy checklist" addım 1-in TAM MƏHZ bunun üçün
-- olduğu tapıntı — real `app_runtime` qoşulması olmadan bu görünmürdü).
--
-- `0007`-nin RLS-siyasətsiz qaydası ("`postgres` rolu RLS-i bypass edir, anon tam bağlıdır")
-- YALNIZ tətbiq SUPERUSER (`postgres`) rolu ilə qoşulanda düzgündür — superuser RLS-i avtomatik
-- keçir. `ADR-017` tətbiqi `app_runtime`-a köçürdü: bu, ADİ (BYPASSRLS OLMAYAN) roldur. Nəticə:
-- RLS aktiv + siyasət YOX olan HƏR cədvəl `app_runtime` üçün DƏ tam bağlanır — təkcə `anon` yox,
-- TƏTBİQİN ÖZÜ DƏ. `0012`-`0022`-də yaradılan bütün cədvəllər (və `0007`-dəki köhnə beşi,
-- rename-dən sonra da) bu vəziyyətdədir.
--
-- Real staging-də sınandı: `app_runtime` ilə `select count(*) from events` — siyasətsiz halda
-- HƏR ZAMAN `0` qaytarır (sətir var olsa belə, RLS onu filtrləyir), `insert` isə AÇIQ xəta verər.
-- Yəni bu düzəliş olmadan BÜTÜN TƏTBİQ (yeni sxem YOX, mövcud `/api/events` daxil) sınayacaqdı.
--
-- Düzəliş: `app_runtime`-a HƏR cədvəldə tam CRUD icazə verən açıq siyasət. `BYPASSRLS`
-- ATTRİBUTU YOX qəsdən — ADR-017-nin "Faza 2-yə keçid" bölməsi gələcəkdə `auth.uid()`-əsaslı
-- sətir siyasətlərinin TƏTBİQ QOŞULMASININ ÜSTÜNƏ əlavə olunacağını yazır; `BYPASSRLS` bu
-- gələcək siyasətləri də səssizcə keçərdi. Açıq siyasət Faza 2-də DƏYİŞDİRİLƏ BİLƏR
-- (məs. `attempts`/`attempt_items`-də `using (true)` `auth.uid()` şərtinə DARALDILA bilər),
-- `BYPASSRLS`-i SONRADAN məhdudlaşdırmaq mümkün deyil (rol səviyyəsində qlobal açardır).
--
-- `solutions` (köhnə, ADR-018 §6-ya görə saxlanılır) BURAYA DAXİL EDİLMİR — API qatı artıq onu
-- oxumur (`question_translations` əvəzlədi), siyasətsiz qalması funksional fərq yaratmır.
-- `private.*` cədvəlləri də daxil edilmir — `app_runtime`-in ora GRANT-ı belə yoxdur (ADR-017),
-- RLS siyasəti mənasız olardı.

do $$
declare
  t text;
begin
  foreach t in array array[
    'events', 'questions', 'attempt_items', 'attempts', 'step_events',
    'subjects', 'standards', 'question_groups', 'question_group_translations',
    'question_standards', 'question_translations', 'question_reports'
  ]
  loop
    if not exists (
      select 1 from pg_policies where schemaname = 'public' and tablename = t
        and policyname = 'app_runtime_full_access'
    ) then
      execute format(
        'create policy app_runtime_full_access on public.%I for all to app_runtime using (true) with check (true)',
        t
      );
    end if;
  end loop;
end
$$;
