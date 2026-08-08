-- Siyasət QƏSDƏN yoxdur. Tətbiq Supabase klient kitabxanalarını işlətmir —
-- pg ilə DATABASE_URL üzərindən qoşulur, o rol RLS-i bypass edir.
-- Siyasətsiz RLS = anon tam bağlıdır. "rls_enabled_no_policy" advisory-si
-- INFO səviyyəsindədir və bu memarlıqda düzəliş TƏLƏB ETMİR.
-- Siyasət yalnız klient kitabxanası işlədilməyə başlasa lazım olacaq.
--
-- HANDOFF (47) §3: `events`, `problems`, `solutions`, `attempts`, `step_events` — RLS söndürülüb.
-- Supabase `public` sxemi `anon` roluna default giriş verir, PostgREST açıqdır — anon açarı ilə
-- hər kəs bütün sətirləri oxuya/dəyişə bilər. `events`/`attempts` yetkinlik yaşına çatmayanların
-- davranış datasıdır (PHASE-1.md məxfilik bölməsi).
--
-- Tətbiq `pg` ilə DATABASE_URL üzərindən qoşulur (Supabase klient kitabxanaları yox) — o rol
-- RLS-i bypass edir. Ona görə siyasətsiz RLS doğru həlldir: anon tam bağlanır, tətbiq toxunulmaz
-- qalır. Yeni cədvəl yaradan hər miqrasiya öz RLS sətrini daşımalıdır (bax CLAUDE.md).

alter table public.events      enable row level security;
alter table public.problems    enable row level security;
alter table public.solutions   enable row level security;
alter table public.attempts    enable row level security;
alter table public.step_events enable row level security;
