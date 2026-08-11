-- ⚠️ Bu fayl production-da ARTIQ TƏTBİQ OLUNUB (əl ilə audit zamanı) — burada YALNIZ
-- repo-nu production ilə sinxron saxlamaq üçün YAZILIB. Yenidən tətbiq ETMƏ (`create
-- policy`/`alter function` idempotent deyil, `if not exists` YOXDUR — təkrar işlətsən
-- `policy already exists` xətası verər).
--
-- İki düzəliş:
-- 1. `solutions` cədvəli `0007`-də RLS aktivləşdirilib, amma `0024`-ün `app_runtime`
--    siyasət siyahısına DAXİL EDİLMƏYİB (ADR-018 §6-ya görə "köhnə, API qatı artıq
--    oxumur" deyə qəsdən buraxılmışdı). Səhv fərziyyə idi: `/api/solve` HƏLƏ DƏ
--    `solutions`-a yeni INSERT YAZMIR (yeni sxem `question_translations`/`private.*`
--    işlədir), AMMA miqrasiya skriptləri (`0017`/`0019`) və gələcək data-audit
--    sorğuları `solutions`-u OXUYUR — RLS-siz app_runtime bunu da edə bilmirdi.
--    `0024`-ün eyni "app_runtime_full_access" naxışı.
-- 2. `public.resolve_translation(uuid, text)` (`0016`) `search_path`-i AÇIQ TƏYİN
--    ETMİRDİ — `SECURITY INVOKER` funksiya olsa da, açıq `search_path` YOXLUĞU
--    Postgres-in ümumi "search_path injection" sinif zəifliyidir (çağıran öz
--    sessiyasında `search_path`-i dəyişib fərqli `public`/obyekt həll etdirə bilər).
--    `SET search_path = public` funksiyanı sessiya vəziyyətindən təcrid edir.

create policy app_runtime_full_access on public.solutions
  for all to app_runtime using (true) with check (true);

alter function public.resolve_translation(uuid, text) set search_path = public;
