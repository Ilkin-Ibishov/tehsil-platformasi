# ADR-017 — Cavab izolyasiyası: RLS yox, məhdud DB rolu

**Status:** Qəbul edildi
**Tarix:** 2026-08-10
**Kontekst:** Faza 1 (auth yoxdur), `docs/DATA-MODEL.md`, `.kiro/specs/test-bank/design.md`

## Problem

Test bankı sualların doğru cavabını saxlayır. Şagird şəbəkə sorğusuna baxaraq
cavabı görməməlidir. Faza 1-də autentifikasiya yoxdur (`ADR-012`), tətbiq isə
`DATABASE_URL` üzərindən RLS-i bypass edən rolla qoşulur.

## Nəzərdən keçirilən variantlar

**A — Supabase `authenticated` client + RLS.**
Rədd edildi: Faza 1-də istifadəçi şəxsiyyəti yoxdur, RLS-in bağlanacağı
`auth.uid()` mövcud deyil.

**B — Yalnız API qatında intizam** (`/api/questions` `answer` seçmir).
Rədd edildi: tək bir `select('*')`, debug endpoint-i və ya diqqətsiz join
bütün qorumanı sıfırlayır. Tək müdafiə xətti kifayət deyil.

**C — Məhdud DB rolu + ayrı sxem + SECURITY DEFINER.** ✅ Seçildi.

## Qərar

RLS bu problem üçün **yanlış alətdir.** RLS sətir-səviyyəlidir və şəxsiyyət
tələb edir ("hər istifadəçi öz sətirlərini görsün"). Bizim qaydamız isə
cədvəl-səviyyəlidir: **heç kim cavabı görməsin.** Bu, GRANT məsələsidir və
auth tələb etmir.

### Konkret quruluş

1. Cavablar `private` sxemində saxlanır: `private.question_answers`.
2. Tətbiq `postgres` yox, `app_runtime` rolu ilə qoşulur.
   `app_runtime`-in `private` sxeminə **heç bir icazəsi yoxdur.**
3. Yeganə giriş nöqtəsi: `public.check_answer(q, given)` —
   `SECURITY DEFINER`, sahibi `postgres`, `EXECUTE` yalnız `app_runtime`-ə.
4. Miqrasiyalar ayrı bağlantı sətri ilə işləyir (`MIGRATION_DATABASE_URL`,
   `postgres` rolu). Tətbiq bu sətri heç vaxt istifadə etmir.
5. API qatı ikinci müdafiə xəttidir: `/api/questions` heç vaxt cavab sahəsi
   qaytarmır. Bu, artıq tək müdafiə deyil — səhv edilsə DB icazəsi tutur.

```sql
CREATE SCHEMA private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;

CREATE ROLE app_runtime LOGIN PASSWORD :'app_pw';
GRANT USAGE ON SCHEMA public TO app_runtime;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_runtime;
-- Gələcək cədvəllər üçün (aşağıdakı "mənfi" bəndini bağlayır — ADR-018 §4a):
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE ON TABLES TO app_runtime;
-- private sxeminə GRANT verilmir

CREATE TABLE private.question_answers (
  question_id UUID PRIMARY KEY REFERENCES public.questions(id) ON DELETE CASCADE,
  answer JSONB NOT NULL,
  validator TEXT NOT NULL DEFAULT 'exact'
);

CREATE FUNCTION public.check_answer(q UUID, given JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = private, public AS $$
DECLARE a JSONB; v TEXT;
BEGIN
  SELECT answer, validator INTO a, v
  FROM private.question_answers WHERE question_id = q;
  RETURN jsonb_build_object('is_correct', a = given);
END; $$;

REVOKE ALL ON FUNCTION public.check_answer FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_answer TO app_runtime;
```

## Nəticələr

**Müsbət:**
- Auth-dan asılı deyil — Faza 1-də bu gün işləyir.
- İki müstəqil müdafiə xətti (DB icazəsi + API kontraktı).
- `sympy` yoxlaması serverdə qalır, `check_answer` onu çağıra bilər.

**Mənfi / risk:**
- `app_runtime` rolu yaradılmasa və `DATABASE_URL` dəyişməsə, qoruma **yoxdur.**
  Bu, ən çox ehtimal olunan icra səhvidir — deploy checklist-ə salınmalıdır.
- Lokal dev mühiti də eyni rolu işlətməlidir, əks halda produksiyada
  "icazə yoxdur" xətaları ilk dəfə istehsalatda görünəcək.
- Yeni cədvəl əlavə edildikdə `GRANT` avtomatik verilmir —
  `ALTER DEFAULT PRIVILEGES` qurulmalıdır.

## Faza 2-yə keçid

Auth gələndə RLS bunun **əvəzinə deyil, üstünə** əlavə olunur:
istifadəçiyə aid cədvəllərdə (`attempts`, `attempt_items`, `mastery`)
`auth.uid()` əsaslı sətir siyasətləri qurulur. Cavab izolyasiyası
dəyişmir — o, şəxsiyyətdən asılı olmayan qayda olaraq qalır.

## `CLAUDE.md` qaydası ilə əlaqə

Qayda 6 ("hər miqrasiya öz RLS sətrini daşımalıdır") qüvvədə qalır, lakin
dəqiqləşdirilir: **cavab cədvəli üçün RLS kifayət deyil** — o, `private`
sxemində olmalı və `app_runtime`-ə GRANT verilməməlidir.
