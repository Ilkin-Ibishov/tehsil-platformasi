# Deploy checklist — API qatı köçürməsi (`ADR-019`)

Bu, tək istifadəlik checklist DEYİL — `0014`/`0020` (breaking rename) hər tətbiq
olunanda (staging, sonra production) YENİDƏN keçirilir. Sıra ilə, atlamadan.

## 0. Əvvəlcədən (kod yazılmazdan əvvəl)

- [ ] `ADR-019` §"Kritik boşluqlar"-dakı G1/G2 RPC-ləri miqrasiya kimi yazılıb və
      **staging** Supabase branch-də tətbiq olunub.
- [ ] `ADR-019` §"Açıq qərarlar"-dakı G3 (`question_answers.answer` forması)
      Cowork tərəfindən bağlanıb.

## 1. 🔴 ƏN VACİB SƏTİR — `app_runtime` rolu və `DATABASE_URL`

**Niyə bu #1-dir:** bu addım buraxılsa, kod **normal işləyəcək** — heç bir xəta,
heç bir 500. Sadəcə `private` sxeminin bütün qorunması yox olacaq, çünki
`postgres` rolu (defolt) `private` sxeminə tam girişə malikdir. **Səhv səssizdir**
— test zamanı tutulmaz, yalnız bu yoxlama tutur.

- [ ] Supabase-də `app_runtime` rolu mövcuddur:
      ```sql
      select rolname from pg_roles where rolname = 'app_runtime';
      ```
      Nəticə BOŞ DEYİLSƏ davam et, boşdursa `0018`-i (və ya G1/G2 miqrasiyasını)
      əvvəlcə tətbiq et.

- [ ] Production `DATABASE_URL` (Vercel env) `app_runtime` roluna işarə edir —
      **`postgres` roluna YOX**. Connection string-in `://<rol_adı>:` hissəsini
      gözlə yoxla.

- [ ] **Mənfi yoxlama (ən vacib test):** `app_runtime` connection string-i ilə
      birbaşa qoşulub `private`-a girişin RƏDD EDİLDİYİNİ təsdiqlə:
      ```bash
      psql "$APP_RUNTIME_DATABASE_URL" -c "select * from private.question_answers limit 1;"
      # GÖZLƏNİLƏN: "ERROR: permission denied for schema private"
      # Əgər sətir qayıdırsa (xəta YOXDURSA) — DAYAN, rol/GRANT konfiqurasiyası səhvdir.
      ```

- [ ] Eyni mənfi yoxlama `postgres`/superuser connection ilə **TƏRSİNƏ** işləməli —
      `select * from private.question_answers limit 1;` **UĞURLU** olmalıdır
      (miqrasiya skriptləri `MIGRATION_DATABASE_URL` ilə bunu tələb edir).

- [ ] `check_answer`/`check_step`/`get_answer`/`get_step_answer`/`store_answer`/
      `store_step_answers` funksiyalarının hamısında `EXECUTE` yalnız
      `app_runtime`-ə verilib, `PUBLIC`-ə YOX:
      ```sql
      select p.proname, r.rolname
        from pg_proc p
        join pg_proc_acl on true -- (real sorğu: information_schema.role_routine_grants)
      ```
      sadə forması:
      ```sql
      select routine_name, grantee, privilege_type
        from information_schema.role_routine_grants
       where routine_schema = 'public'
         and routine_name in ('check_answer','check_step','get_answer',
                               'get_step_answer','store_answer','store_step_answers');
      ```
      Yalnız `app_runtime` sətirləri olmalıdır.

- [ ] Lokal `.env.local` (development) da EYNİ `app_runtime` roluna işarə edir —
      ADR-017-in öz qeyd etdiyi risk: *"lokal dev fərqli roldadırsa, icazə xətaları
      ilk dəfə istehsalatda görünür."*

## 2. Miqrasiya tətbiqi

- [ ] Staging Supabase branch-də `0012`-`0022` (+ G1/G2 miqrasiyası) TAM tətbiq
      olunub, `0017`/`0019`-un qəbul sorğuları (fayl daxilində şərh kimi yazılıb)
      işlədilib, gözlənilən nəticələr yoxlanılıb.
- [ ] `0014`/`0020`-in geri qaytarma (rollback) miqrasiyası YAZILIB və staging-də
      SINANIB (tətbiq et → geri qaytar → sxem əvvəlki vəziyyətə dönür, təsdiqlə).
- [ ] Production tətbiqi trafik azkən planlaşdırılıb (gecə saatı).

## 3. API kod sınağı (staging branch-ə qarşı)

Hər endpoint üçün — real HTTP çağırışı, real cavab yoxlanılır:

- [ ] `POST /api/solve` — yeni sual (keş-miss) VƏ təkrar sual (keş-hit, `hit_count`
      artır) hər ikisi sınanıb.
- [ ] `POST /api/steps/check` — düz VƏ səhv cavab, `error_code` düzgün qayıdır.
- [ ] `POST /api/attempts/reveal` — `final_answer` düzgün göstərilir.
- [ ] `POST /api/attempts/progress` — `steps_revealed`/`time_ms` DB-də düzgün
      yenilənir (birbaşa SQL ilə yoxla, cavab body-si `{ok:true}` KİFAYƏT DEYİL).
- [ ] `POST /api/attempts/transfer` — namizəd tapılan VƏ tapılmayan hal.
- [ ] `POST /api/attempts/transfer/check` — düz/səhv cavab.
- [ ] `tsc --noEmit`, `eslint .` təmizdir.

## 4. Production deploy

- [ ] Miqrasiya (`0014`/`0020` daxil) production Supabase-ə tətbiq olunur.
- [ ] Dərhal ardınca (əlavə addım YOX, EYNİ pəncərədə) `main`-ə push, Vercel deploy
      başlayır.
- [ ] Deploy bitəndən sonra §1-dəki mənfi yoxlama production-da TƏKRARLANIR.
- [ ] Bir real `/api/solve` çağırışı production-da (test cihazından) sınanır.

## 5. Post-deploy

- [ ] `docs/DATA-MODEL.md` yenilənir (yeni sxemi əks etdirsin).
- [ ] `docs/HANDOFF.md`-ə yeni blok — nəticə, sınanan/sınanmayan hallar.
- [ ] Köhnə `problems`/`solutions`/(rename-dən əvvəlki) `attempts` adları artıq
      mövcud deyil — bunu istinad edən qalan sənədlər (`README`, s.) yoxlanılır.
