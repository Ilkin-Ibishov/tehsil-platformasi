-- ADR-019 kod mərhələsi (web/app/api/solve/route.ts) zamanı tapılan boşluq. Additiv,
-- sıfır risk.
--
-- Köhnə `solutions` cədvəli HƏR solve çağırışında (LLM HƏMİŞƏ əvvəlcə çağırılır, `problems`
-- dedup-undan ASILI OLMAYARAQ) yeni sətir yaradırdı — `cost_usd` demək olar hər sorğu üçün
-- ayrıca yazılırdı. Yeni sxemdə `question_translations` PK-si `(question_id, lang)`-dır —
-- eyni sual üçün İKİNCİ 'az' tərcüməsi YAZILA BİLMƏZ (constraint pozulardı), ona görə
-- keş-uyğunluğu (cache-hit) həllərində YENİ tərcümə sətri YARADILMIR. Nəticədə əgər `cost_usd`
-- yalnız `question_translations`-da saxlanılsaydı, keş-uyğun sorğuların LLM xərci HEÇ YERDƏ
-- görünməzdi — gündəlik xərc tavanı (`DAILY_COST_CEILING_USD`) SƏSSİZCƏ az hesablanardı.
--
-- Həll: hər solve-un öz xərci `attempt_items`-də saxlanılır (hər solve = bir item, keş-hit/miss
-- fərq etmir, LLM həmişə çağırılıb, xərc həmişə realdır). `question_translations.cost_usd`
-- MƏNASINI SAXLAYIR ("bu kontenti YARADAN ilk çağırışın xərci"), `attempt_items.cost_usd` isə
-- "BU sorğunun xərci" — ikisi fərqli suallara cavab verir, biri o birini əvəz etmir.

alter table attempt_items add column if not exists cost_usd numeric(8,5);
