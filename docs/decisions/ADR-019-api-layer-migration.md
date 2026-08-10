# ADR-019 — API qatı köçürməsi: `problems`/`solutions`/`attempts` → yeni sxem

**Status:** Təklif (kod yazılmayıb — yalnız plan)
**Tarix:** 2026-08-10
**Kontekst:** `ADR-018`, `ADR-017`, `HANDOFF (67)/(68)/(69)/(70)`, `supabase/migrations/0012-0022`
(PR #2, hələ merge edilməyib), `.kiro/specs/test-bank/design.md`.

## Bir cümlədə

`ADR-018`/PR #2-yə qədər hər addım **additiv** idi — heç nə pozula bilməzdi, çünki
köhnə cədvəllər toxunulmaz qalırdı. Bu, ilk **breaking** deploy-dur: `0014`/`0020`
(RENAME) tətbiq olunan andan `web/app/api/**`-in mövcud kodu 500 qaytarmağa başlayır,
əgər EYNİ deploy-da yenilənməyibsə. Plan bunun üçündür.

## Planlaşdırma zamanı tapılan KRİTİK boşluqlar — kod yazılmazdan ƏVVƏL həll tələb edir

Bunlar ADR-017/`design.md`-nin RPC səthində olmayan, amma real tətbiq kodu üçün
MƏCBURİ olan hissələrdir. Endpoint-planı (§2) bunlara istinad edir — əvvəlcə
oxunmalıdır, yoxsa §2 "necə" sualına cavab vermir.

### G1 — `private` sxeminə YAZI yolu yoxdur (BLOKLAYICI)

`ADR-017`/`0018`: `app_runtime`-in `private` sxeminə **heç bir GRANT-ı yoxdur** —
bu, oxumaq üçün düşünülüb. Amma `/api/solve` HƏR YENİ sualda `private.question_answers`
və `private.step_answers`-ə YAZMALIDIR (şagird yeni məsələ çəkəndə). `app_runtime`
rolu ilə bu, birbaşa mümkün DEYİL — `insert into private.question_answers ...`
`permission denied for schema private` xətası verəcək.

**Lazımdır (bu ADR-in əhatəsində DEYİL, ayrıca miqrasiya/Cowork qərarı):**

```sql
create function public.store_answer(q uuid, answer jsonb, validator text default 'exact')
returns void language plpgsql security definer set search_path = private, public as $$
begin
  insert into private.question_answers (question_id, answer, validator)
  values (q, answer, validator)
  on conflict (question_id) do update set answer = excluded.answer, validator = excluded.validator;
end; $$;
revoke all on function public.store_answer from public;
grant execute on function public.store_answer to app_runtime;

create function public.store_step_answers(q uuid, steps jsonb)
returns void language plpgsql security definer set search_path = private, public as $$
begin
  delete from private.step_answers where question_id = q;
  insert into private.step_answers (question_id, step_index, accept, input_kind)
  select q, (elem->>'index')::smallint, elem->'check'->'accept',
         coalesce(elem->'check'->>'input_kind','number')
  from jsonb_array_elements(steps) elem
  where elem->'check' ? 'accept';
end; $$;
revoke all on function public.store_step_answers from public;
grant execute on function public.store_step_answers to app_runtime;
```

Bunlar olmadan §2.1 (`/api/solve`) YAZILA BİLMƏZ.

### G2 — server-daxili "həqiqi cavabı oxu" yolu yoxdur (BLOKLAYICI)

İki müstəqil ehtiyac EYNİ RPC-ni tələb edir:

1. **`/api/attempts/reveal`** — şagird "Cavabı göstər"ə basanda HƏQİQİ dəyəri
   QƏSDƏN görməlidir. `check_answer` bunu qaytarmır (yalnız `is_correct`).
2. **Ədədi-tolerantlıq müqayisəsi** — `HANDOFF (67)`: *"`numeric_tolerance` bu
   funksiya ilə işləmir, sympy müqayisəsi API qatındadır."* Yəni `check_answer`/
   `check_step`-in hərfi `=`/`@>` müqayisəsi **kifayət deyil** — mövcud
   `studentAnswerMatches` (`web/lib/verify/answer.ts`) `0.5` ilə `1/2`-ni,
   `−3` ilə `-3`-ü, vergüllə nöqtəni EYNİ sayır (ədədi qiymətləndirmə,
   `mathjs`, tolerantlıq `1e-6`). Bunu SQL-də `a = given` ilə əvəz etmək
   **REQRESDİR** — bu gün işləyən cavablar sabah "səhv" görünəcək.

**Nəticə:** server (Node, `app_runtime` altında) HƏQİQİ dəyəri MÜVƏQQƏTİ yaddaşa
almalıdır ki, `studentAnswerMatches` ilə müqayisə edə bilsin — bu, `private` sxeminin
KLİENTƏ sızmasından FƏRQLİDİR (qoruma sərhədi client-server arasındadır, server
daxili hesablama deyil, `.kiro/steering/test-bank.md`-in "doğru cavab heç vaxt
client-ə göndərilmir" qaydası ilə ziddiyyət YARATMIR).

```sql
create function public.get_answer(q uuid)
returns jsonb language sql security definer set search_path = private, public as $$
  select answer from private.question_answers where question_id = q;
$$;
revoke all on function public.get_answer from public;
grant execute on function public.get_answer to app_runtime;

create function public.get_step_answer(q uuid, idx smallint)
returns jsonb language sql security definer set search_path = private, public as $$
  select jsonb_build_object('accept', accept, 'input_kind', input_kind)
  from private.step_answers where question_id = q and step_index = idx;
$$;
revoke all on function public.get_step_answer from public;
grant execute on function public.get_step_answer to app_runtime;
```

**Nəticə (mühüm):** `check_answer`/`check_step` RPC-ləri praktikada YALNIZ
`type != 'open'` (`single`/`multi`/`match`/`order`, gələcək) üçün istifadə olunacaq —
hazırkı bütün suallar `type='open'` olduğu üçün, Faza 1-də `/api/answers/check` və
`/api/steps/check` **`get_answer`/`get_step_answer` + Node-da `studentAnswerMatches`**
yolu ilə işləyəcək, `check_answer`/`check_step` YOX. Bu, `0018`-i lazımsız etmir
(gələcək tip üçün saxlanılır), amma §2-dəki plan bunu əsas götürür.

### G3 — `private.question_answers.answer` forması `HANDOFF (67)`-nin dediyi ilə üst-üstə düşmür

`0019` (PR #2) `answer = final_answer` (tam `{latex,values,choice}` obyekti) yazır.
`HANDOFF (67)`: *"`/api/answers/check`-in `given` formatı: `{"value": <scalar>}`
sabit forması."* Bunlar İKİ FƏRQLİ formadır. G2 qərarı (server `get_answer` ilə
oxuyub Node-da müqayisə edir) bu ziddiyyəti PRAKTİKİ OLARAQ ƏHƏMİYYƏTSİZ EDİR —
`check_answer` RPC-si (hərfi `a = given`) İSTİFADƏ OLUNMURSA, onun `given` formatı
kod yolunda görünmür. Amma `0019`-un özü RƏSMİ formatı QƏTİLƏŞDİRMİR — bu, Cowork-un
qərarı olaraq açıq qalır, §6-da risk kimi qeyd olunub.

### G4 — dedup sorğusu dəyişməlidir

`0014`: `canonical_hash` UNIQUE → `UNIQUE (canonical_hash, subject_id, grade)`.
`web/app/api/solve/route.ts:246` hazırda `where canonical_hash = $1` işlədir —
bu, indi YANLIŞ NƏTİCƏ VERMİR (hələ də bir sətir tapacaq, çünki hazırkı datada
hər `hash` unikaldır), amma **gələcəkdə** eyni `hash`, fərqli `grade` sətirləri
yarandıqda (HANDOFF 70-in "irəliyə doğru qayda"sı) YANLIŞ sətri tuta bilər. §2.1-də
düzəldilib.

### G5 — transfer axını `solutions.payload`-ı birbaşa oxuyur, yeni sxemdə buna icazə yoxdur

`/api/attempts/transfer` və `/api/attempts/transfer/check` HAZIRDA `solutions.payload`-ı
(canonical VƏ `final_answer.values`) birbaşa SQL-də oxuyur — yeni sxemdə bu, `private`
sxeminə birbaşa toxunmaq deməkdir, `app_runtime` ilə mümkün deyil. §2.4/§2.5-də
G2-dəki `get_answer` ilə əvəzlənir.

---

## 1. Təsir xəritəsi

`select *` / `.select('*')` üçün bütün `web/` axtarıldı — **HEÇ BİR NƏTİCƏ YOXDUR**
(`web/README.md`-də bir `psql` nümunə komandası istisna, kod deyil). Bütün sorğular
onsuz da AÇIQ sütun siyahısı işlədir — tapşırığın 3-cü bəndinin bu hissəsi üçün
düzəliş TƏLƏB OLUNMUR, yalnız sütun adları dəyişir (aşağıda).

| Fayl | Sətir(lər) | Cədvəl(lər) | Əməliyyat | Nə üçün |
|---|---|---|---|---|
| `web/app/api/solve/route.ts` | 98 | `attempts` | SELECT (`count`) | gündəlik limit |
| | 120 | `solutions` | SELECT (`sum(cost_usd)`) | xərc tavanı |
| | 246-249 | `problems` | SELECT + UPDATE (`hit_count`) | dedup axtarışı |
| | 257-269 | `problems` | INSERT | yeni sual |
| | 278-281 | `solutions` | INSERT | LLM çıxışı |
| | 284-287 | `attempts` | INSERT | cəhd sətri |
| `web/app/api/steps/check/route.ts` | 53-58 | `attempts` + `solutions` | SELECT (JOIN) | `payload.steps[idx].check.accept` oxumaq |
| | 74-82 | `step_events` | SELECT + INSERT | addım jurnalı (TOXUNULMUR, adı dəyişmir) |
| `web/app/api/attempts/reveal/route.ts` | 33-38 | `attempts` + `solutions` | SELECT (JOIN) | `payload.final_answer` oxumaq |
| `web/app/api/attempts/progress/route.ts` | 36-43 | `attempts` | UPDATE | `completed`/`abandoned_at_step`/`duration_sec` |
| `web/app/api/attempts/transfer/route.ts` | 34-39 | `attempts` + `problems` | SELECT (JOIN) | mənbə `topic_code` |
| | 49-61 | `problems` + `solutions` | SELECT (JOIN) | namizəd axtarışı |
| `web/app/api/attempts/transfer/check/route.ts` | 41-44 | `attempts` | SELECT | sahiblik yoxlaması |
| | 49-56 | `solutions` | SELECT | `final_answer.values` oxumaq |
| | 64-68 | `attempts` | UPDATE (`transfer_correct`) | nəticə yazısı |
| `web/app/api/events/route.ts` | 40-57 | `events` | INSERT | **TOXUNULMUR** — `events.attempt_id` sessiya `attempts.id`-sinə istinad edir, `0021`-in öz qərarı (köhnə `attempts.id` sessiyaya keçir) bunu qırmır |
| `web/lib/attempts.ts` | — | (heç biri, client-side fetch wrapper) | — | dəyişmir, sahə adları eyni qalır |
| `web/lib/llm.ts`, `web/lib/cost.ts`, `web/lib/prompt.ts`, `web/lib/verify/*`, `web/lib/db.ts` | — | (heç biri) | — | DB-ə TOXUNMUR, dəyişmir |

**Cəmi 6 route faylı, 13 sorğu yeri.** `web/lib/` altında birbaşa cədvəl istinadı
yalnız yuxarıdakı route-ların idxal etdiyi funksiyalardadır (`studentAnswerMatches`,
`verifyFinalAnswer`, `detectLeak`) — bunların özləri DB-ə toxunmur, sadəcə TS
funksiyalarıdır, dəyişməzlər.

---

## 2. Endpoint-başına köçürmə addımları

### 2.1 `POST /api/solve` — ən böyük dəyişiklik

| Köhnə | Yeni |
|---|---|
| `select count(*) from attempts where device_id=$1 and delivered=true...` | `select count(*) from attempt_items ai join attempts a on a.id=ai.attempt_id where a.device_id=$1 and ai.delivered=true and ai.created_at >= date_trunc('day', now())` — **`delivered` `attempt_items`-ə köçüb**, `device_id` sessiyadadır, JOIN lazımdır |
| `select sum(cost_usd) from solutions where created_at >= ...` | `select sum(cost_usd) from question_translations where created_at >= ...` |
| `select id from problems where canonical_hash=$1` | `select id from questions where canonical_hash=$1 and subject_id=$2 and grade=$3 and superseded_by is null and deleted_at is null` — **G4**, `subject_id` `subjects.code=subject` ilə əvvəlcə tapılmalı (kiçik əlavə sorğu və ya JOIN) |
| `update problems set hit_count=hit_count+1` | `update questions set hit_count=hit_count+1, attempt_count=attempt_count+1` — HANDOFF-da ayrılmış iki sayğac (ADR-018 §1c), ikisi də artır |
| `insert into problems (...)` | `insert into questions (id, canonical, canonical_hash, numeric_fingerprint, problem_type, subject_id, grade, topic_code, type, payload, difficulty_static, source, review_status, root_id) values (..., 'open', '{}', 3, 'user_capture', $review_status, id)` — **`review_status` YENİ MƏNTİQ**: `verified===true ? 'auto_verified' : 'draft'` (`HANDOFF 68` cədvəli) |
| `insert into solutions (...)` | `insert into question_translations (question_id, lang, stem, steps, verified, verification_method, model, cost_usd, prompt_version) values ($1,'az',...)` — `stem` `parsed.canonical`-dan tikilir (`0017`-dəki eyni tək-blok forması), `steps` `check.accept` ÇIXARILMIŞ halda (bax aşağıda) |
| — | **YENİ addım (G1):** `select store_answer($1, $2::jsonb, 'exact')` — `$2` = `final_answer` (forma §G3-də açıq qalıb) |
| — | **YENİ addım (G1):** `select store_step_answers($1, $2::jsonb)` — `$2` = `parsed.steps` (tam, `accept` daxil — funksiya özü ayırır) |
| `insert into attempts (id, device_id, problem_id, solution_id, match_path, ocr_source, delivered, student_ref)` | **İKİ INSERT:** `insert into attempts (id, device_id, student_ref, kind, started_at, client_created_at) values ($sessionId, $deviceId, $studentRef, 'photo_solve', now(), now())` + `insert into attempt_items (id, attempt_id, question_id, match_path, ocr_source, delivered, steps_total) values ($itemId, $sessionId, $questionId, 'llm', 'vision_llm', true, $stepsCount)` — **`sessionId` = klientin göndərdiyi `attempt_id`** (mövcud davranış saxlanılır, §G6), `itemId` server-generasiya |
| Cavabda `attempt_id: attemptRowId` | **DƏYİŞMİR** — client eyni ID-ni alır, sadəcə indi sessiya ID-sidir. Client kodu TOXUNULMUR. |

**Tranzaksiya sərhədi:** hazırkı `begin`/`commit` bloku EYNİ qalır, sadəcə daha çox
addım əlavə olunur (2 RPC çağırışı + 2 INSERT, əvvəlki 1 INSERT-in yerinə). Hamısı
BİR tranzaksiyada — RPC-lər `plpgsql`/`sql` funksiyalarıdır, adi `client.query`
çağırışı kimi tranzaksiya daxilində işləyir, xüsusi rəftar lazım deyil.

### 2.2 `POST /api/steps/check`

Köhnə: `payload.steps[idx].check.accept`-i `attempts JOIN solutions` ilə oxuyur,
Node-da `studentAnswerMatches` ilə müqayisə edir.

Yeni (**G2** yolu, `check_step` RPC YOX):

1. `select ai.id as item_id, ai.question_id from attempt_items ai join attempts a on a.id=ai.attempt_id where a.id=$1 and a.device_id=$2` — sahiblik + `question_id` tapılır (əvvəlki `attempt_id`, indi SESSİYA id-si, §G6-ya görə).
2. `select get_step_answer($question_id, $step_index)` → `{accept, input_kind}`.
3. Node-da eyni `studentAnswerMatches` (DƏYİŞMİR).
4. `error_code` üçün: köhnədə `step.error_code` `payload`-dan gəlirdi — YENİ sxemdə
   bu, `question_translations.steps[idx].error_code`-dadır (**PUBLIC**, sirr deyil,
   G2-yə ehtiyac yoxdur, adi `select` kifayətdir).
5. `step_events` INSERT-i **DƏYİŞMİR** (`attempt_id` sütunu indi sessiya id-sini
   daşıyır — `0021`-in qərarına görə bu, `events.attempt_id` ilə eyni referensdir,
   uyğundur).

### 2.3 `POST /api/attempts/reveal`

Köhnə: `payload.final_answer`-i `attempts JOIN solutions`-dan oxuyur.

Yeni: `select ai.question_id from attempt_items ai join attempts a on a.id=ai.attempt_id where a.id=$1 and a.device_id=$2`, sonra `select get_answer($question_id)` (**G2**). `latex` göstərmək üçün `question_translations`-dan da lazım ola bilər (`final_answer.latex` HAZIRDA `private.question_answers.answer`-in İÇİNDƏDİR, §G3-ün forması buna görə vacibdir — `latex` sirr DEYİL, amma indi sirr olan `values`-la EYNİ obyektdədir; ayrılması Cowork qərarı, §6).

### 2.4 `POST /api/attempts/transfer`

Köhnə: mənbə `topic_code`-u `attempts JOIN problems`-dan, namizədi `problems JOIN
solutions`-dan (canonical + `final_answer.values is not null` mövcudluq filtri)
oxuyur.

Yeni:
1. Mənbə: `select q.topic_code, q.id as question_id from attempt_items ai join attempts a on a.id=ai.attempt_id join questions q on q.id=ai.question_id where a.id=$1 and a.device_id=$2`.
2. Namizəd: `select q.id from questions q join question_translations qt on qt.question_id=q.id where q.topic_code=$1 and q.problem_type='formula' and q.id != $2 and qt.lang='az' and qt.verified=true order by random() limit 1` — **`final_answer.values is not null` filtri DÜŞÜR** (private sxemə toxuna bilmirik), əvəzinə `qt.verified=true` işlədilir (məntiqi ekvivalent: `0019`-dakı backfill YALNIZ `status='ok'`+`steps`+`canonical` olan sətirlərə `question_answers` yazır, VERİFİED olub-olmaması ayrı, amma PRAKTİKİ olaraq `private.question_answers` mövcudluğu = `question_translations` sətrinin mövcudluğu ilə EYNİDİR, çünki `0019` `0017`-nin EYNİ "winning" seçimini işlədir — bu ekvivalentlik G1 yazılanda da qorunmalıdır: `store_answer` HƏR YENİ sualda `question_translations` INSERT-i ilə EYNİ tranzaksiyada çağrılmalıdır, yoxsa fərqli düşərlər).
3. `canonical` cavabda: `qt.stem->'blocks'->0->>'v'` (tək-blok formatı, `0017`-dəki kimi).

### 2.5 `POST /api/attempts/transfer/check`

Köhnə: `solutions.payload.final_answer.values`-i birbaşa oxuyur.

Yeni: `select get_answer($transfer_question_id)` (**G2**) → `answer.values`
(və ya §G3 həll olunandan sonra hər hansı forma), Node-da `studentAnswerMatches`
(DƏYİŞMİR). Nəticə: `update attempt_items set transfer_correct=$2 where attempt_id=$1
and id = (select id from attempt_items where attempt_id=$1 limit 1)` — **`transfer_correct`
`attempt_items`-dədir, `attempts` (sessiya) YOX** (`design.md` §9-a görə), sahiblik
yoxlaması (`device_id`) sessiya cədvəlindən gəlir.

### 2.6 `POST /api/attempts/progress`

Köhnə: `attempts.completed`/`abandoned_at_step`/`duration_sec` UPDATE.

Yeni: bu sahələr **`attempt_items`-ə köçüb, formaları dəyişib** (`0021`-in
düşürdüyü/əvəzlədiyi sütunlar):

```sql
update attempt_items
   set steps_revealed = greatest(steps_revealed, coalesce($abandoned_at_step, steps_revealed)),
       time_ms = coalesce($duration_sec * 1000, time_ms)
 where attempt_id = $1
   and attempt_id in (select id from attempts where id=$1 and device_id=$2)
```

`completed` sütunu üçün BİRƏBİR qarşılıq yoxdur — `completed = (steps_revealed =
steps_total)` **HESABLANMIŞ** vəziyyətdir, ayrıca yazılmır. Client `completed=true`
göndərəndə server `steps_revealed = steps_total` yaza bilər (əgər son addım
göndərilməyibsə belə) — **bu, kiçik semantika sürüşməsidir**, §6-da risk kimi qeyd
olunub.

---

## 3. Deploy ardıcıllığı

CLAUDE.md qayda 5: "migrasiya tələb edən kod, migrasiya tətbiq olunmamış `main`-ə
merge edilmir". `0014`/`0020` ADDİTİV DEYİL — bu qaydanın YUMŞAQ oxunuşu ("əvvəl
miqrasiya, sonra kod, ikisi arasında pəncərə yoxdur") burada YETƏRLİ DEYİL, çünki
additiv miqrasiya köhnə kodu sındırmır, RENAME isə SINDIRIR. Ona görə sıra:

1. **G1-G5-in RPC-ləri üçün yeni miqrasiya yaz** (`0023_answer_write_read_rpcs.sql`,
   bu ADR-in əhatəsində DEYİL, ayrıca iş) — additiv, `0014`/`0020`-dən ASILI DEYİL,
   ayrıca tətbiq oluna bilər, ERKƏN sınana bilər.
2. **API qatı kodunu yaz** (§2-dəki hər fayl) — YENİ cədvəl adlarına qarşı, YEREL
   `.env.local`-da `DATABASE_URL` **staging/test Supabase branch**-ə (Supabase MCP
   `create_branch`) işarə edərək. Bu addımda `0012`-`0023` HƏMİN BRANCH-A tətbiq
   olunur, `main`-ə YOX.
3. **Staging branch-də UÇDAN-UÇA sınaq** — §5-dəki deploy checklist-in sınaq
   hissəsi bu branch-də keçirilir.
4. **Tək PR-da BİRLİKDƏ:** `0014`/`0020`-in Supabase-ə TƏTBİQİ (production) +
   `web/app/api/**` yeni kodun Vercel-ə DEPLOY-U. Vercel deploy `main`-ə push-la
   avtomatik tetiklənir (CLAUDE.md) — miqrasiya tətbiqi bu push-DAN ƏVVƏL, eyni
   dəqiqədə, əl ilə (`apply_migration`, Supabase MCP) edilməlidir. **Pəncərə:**
   miqrasiya tətbiqi ilə Vercel deploy-un bitməsi arasında köhnə kod YENİ sxemə
   qarşı işləyəcək (əvvəlki deploy hələ aktivdir) — bu, Vercel-in "instant
   rollback"/atomic deploy davranışı ilə MİNİMUMA endirilir, amma SIFIR DEYİL
   (adətən saniyələr). Trafik azkən (gecə) edilməlidir.
5. **Rollback planı:**
   - Kod tərəfi: Vercel-də əvvəlki deploy-a "Instant Rollback" (bir kliklə, artıq
     mövcud imkan).
   - DB tərəfi: `0014`/`0020` RENAME-lərini GERİ QAYTARMAQ üçün əks miqrasiya
     lazımdır (`questions` → `problems`, `attempt_items` → `attempts`,
     əlavə sütunlar SİLİNMİR — sadəcə adlar geri dönür, kod köhnəni gözləyir).
     Bu əks miqrasiya **İNDİ, tətbiqdən ƏVVƏL YAZILMALIDIR** (ayrıca fayl,
     `supabase/migrations/rollback/` və ya oxşar — bu ADR-in əhatəsində DEYİL,
     amma §5 checklist-də tələb kimi qeyd olunur, boş qala BİLMƏZ).
   - **Data itkisi riski rollback-də:** `0014`-dən sonra yazılan YENİ sətirlər
     (`questions`/`question_translations`/`private.*`) rollback-dən sonra köhnə
     kodun oxuya bilmədiyi formda qalacaq — rollback yalnız "deploy-dan DƏRHAL
     sonra, real trafik keçməmiş" pəncərədə TAM TƏHLÜKƏSİZDİR. Bu pəncərədən
     sonra rollback əlavə data-uzlaşdırma tələb edir.

---

## 4. Risk siyahısı — hansı endpoint sınarsa şagird nə görür

| Endpoint | Sınma səbəbi | Şagird nə görür |
|---|---|---|
| `/api/solve` | `store_answer`/`store_step_answers` RPC-ləri yazılmayıb (G1) | `500`, "Server xətası, yenidən cəhd et" — YENİ SUAL HƏLL EDİLƏ BİLMİR, məhsulun əsas axını dayanır |
| `/api/solve` | dedup sorğusu G4-ə köçürülməyib | funksional səhv YOX, amma keş tutmur — hər foto "yeni" sayılır, xərc artır (səssiz, şagird hiss etmir) |
| `/api/steps/check` | `get_step_answer` RPC-si yoxdur/yanlış | addım YOXLANILA BİLMİR, `500` — şagird cavab yazır, heç nə baş vermir |
| `/api/attempts/reveal` | `get_answer` RPC-si yoxdur | "Cavabı göstər" düyməsi işləmir — şagird son addımda ilişib qalır |
| `/api/attempts/transfer` | namizəd sorğusu yeni sxemə uyğunlaşdırılmayıb | S6 sual göstərmir — `no_transfer_available`, funksiya SƏSSİZCƏ boş qalır (öyrənmə metrikası itir, şagird ZƏRƏR görmür, amma ÖLÇÜ itir) |
| `/api/attempts/progress` | sütun adı səhvdir | `abandoned_at_step`/`duration_sec` YAZILMIR, valideyn hesabatının "harada itiririk" sualı korlanır — **şagird HEÇ NƏ hiss etmir** (fire-and-forget, 200 həmişə qayıdır), YALNIZ ölçmə səssiz sınır |
| `/api/attempts/transfer/check` | `get_answer` çağırışı köhnə cədvələ gedir | `500`, transfer sualının cavabı yoxlanılmır — şagird cavab yazır, nəticə görmür |
| **Hamısı birdən** | `app_runtime` yaradılmayıb / `DATABASE_URL` köhnə rola işarə edir | **HEÇ BİR XƏTA GÖRÜNMÜR** — `postgres` rolu `private` sxeminə giriş İCAZƏSİ olduğu üçün RPC-lər lazımsız olur, kod "normal" işləyir, AMMA `private` sxeminin bütün qorunması İŞLƏMİR (§5 deploy checklist-in #1 bəndi) |

---

## Açıq qərarlar (bu ADR-in EDİMƏDİYİ, Cowork/Ilkin qərarı gözləyən)

1. **G1/G2-nin RPC-ləri** — dizayn edilib (yuxarıda), amma `design.md`-yə YAZILMAYIB,
   miqrasiya YARADILMAYIB. Bu ADR-in NÖVBƏTİ addımıdır (kod mərhələsi başlamazdan
   əvvəl, §3 addım 1).
2. **G3 — `question_answers.answer` forması.** `{latex,values,choice}` tam obyekt
   (hazırkı `0019`) və ya `HANDOFF(67)`-nin `{"value": scalar}`-ı? G2 qərarı bunu
   TƏCİLİ ETMİR (Node RPC-dən nə formada gəlsə, özü emal edir), amma sxem sənədi
   (`design.md`) TUTARLI olmalıdır.
3. **`/api/attempts/progress`-in `completed` semantikası** (§2.6-nın sonu) — `steps_revealed`
   `steps_total`-a məcburi bərabərləşdirilsinmi, yoxsa YALNIZ real açılan addım sayı?
4. **`review_status` yeni insert məntiqi** (§2.1) `HANDOFF(68)` cədvəlinə əsaslanır —
   AÇIQ TƏSDİQ istəmir (artıq qərar bağlanıb), sadəcə burada İLK DƏFƏ koda tərcümə
   olunur, səhv oxunma riski var, gözdən keçirilməlidir.

**Blok:** yoxdur — yuxarıdakı 4 nöqtə bu ADR-in NÖVBƏTİ addımını (RPC dizaynının
rəsmiləşdirilməsi) bloklayır, amma planın özünü YOX.
