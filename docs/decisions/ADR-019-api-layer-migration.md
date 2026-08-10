# ADR-019 — API qatı köçürməsi: `problems`/`solutions`/`attempts` → yeni sxem

**Status:** Təklif (kod mərhələsi indi başlayır)
**Tarix:** 2026-08-10
**Kontekst:** `ADR-018`, `ADR-017`, `HANDOFF (67)/(68)/(69)/(70)/(71)`,
`supabase/migrations/0012-0022` (PR #2, hələ merge edilməyib),
`.kiro/specs/test-bank/design.md`.

**Yenilənmə qeydi (HANDOFF 71):** G1-G3 Cowork tərəfindən bağlandı, RPC səthi
DƏYİŞDİ — `check_answer`/`check_step` (bu sənədin ilk versiyasının təklif etdiyi
`get_answer`/`get_step_answer` YOX) SİLİNDİ, əvəzinə `reveal_answer`/
`reveal_step_answer`/`store_answer`/`store_step_answers` gəldi (audit jurnallı,
insert-only yazı). §"Kritik boşluqlar" və §2 aşağıda YENİ səthə görə yenidən
yazılıb. Köhnə mətnin qalıqları (RLS/select-audit kimi dəyişməyən hissələr)
toxunulmayıb.

## Bir cümlədə

`ADR-018`/PR #2-yə qədər hər addım **additiv** idi — heç nə pozula bilməzdi, çünki
köhnə cədvəllər toxunulmaz qalırdı. Bu, ilk **breaking** deploy-dur: `0014`/`0020`
(RENAME) tətbiq olunan andan `web/app/api/**`-in mövcud kodu 500 qaytarmağa başlayır,
əgər EYNİ deploy-da yenilənməyibsə. Plan bunun üçündür.

## RPC səthi (HANDOFF 71, yekun) — `0018` bunu tətbiq edir

Əvvəlki plan versiyası `check_answer`/`check_step`/`get_answer`/`get_step_answer`
adında dörd RPC təklif etmişdi. Cowork bunu **rədd etdi** — `check_answer`/
`check_step` ADR-009-u pozurdu (SQL-də müqayisənin İKİNCİ nüsxəsi, `verify/answer.ts`-dən
FƏRQLİ məntiqlə). Yekun səth **dörd fərqli funksiyadır**, hamısı `supabase/migrations/0018`-də:

| Funksiya | İşi | `purpose` |
|---|---|---|
| `reveal_answer(q, purpose, ai default null)` | yekun cavab açarını qaytarır, audit yazır | `'verify'` (müqayisə üçün) / `'reveal'` (şagirdə göstərmək üçün) / `'eval'` |
| `reveal_step_answer(q, idx, purpose, ai default null)` | addım açarını qaytarır, audit yazır | eyni üç dəyər |
| `store_answer(q, a, v default 'exact')` | insert-only yazır, `boolean` qaytarır (`found`) | — |
| `store_step_answers(q, rows)` | toplu insert-only yazır, neçə sətir yazıldığını qaytarır | — |

**Müqayisə HƏMİŞƏ Node-dadır** (`studentAnswerMatches`, `web/lib/verify/answer.ts`,
DƏYİŞMİR) — DB yalnız saxlayır/verir. `ai` (`attempt_item_id`) audit üçündür,
verilməsə `NULL` yazılır (məs. transfer axınında hələ `attempt_item` yoxdursa).

### G1/G2 — bağlandı (HANDOFF 71)

Əvvəlki plan iki AYRI problem kimi görmüşdü ("yazı yolu yoxdur" / "server-daxili
oxuma yolu yoxdur"). Cowork bunları BİR həllə birləşdirdi: `store_*` (yazı) və
`reveal_*` (oxuma, HƏR ZAMAN Node-a dəyər qaytarır — nə `/api/attempts/reveal`
üçün, nə server-daxili müqayisə üçün fərq yoxdur, ikisi də `purpose` ilə
fərqləndirilir, funksiyanın ÖZÜ eynidir). Ayrıca RPC dizaynı lazım deyildi.

**Diqqət — ADR-017-nin təminatı DƏQİQLƏŞDİ, ZƏİFLƏMƏDİ:** ilkin ifadə "tətbiq
prosesi cavabı görə bilmir" idi, bu YANLIŞ idi (müqayisə Node-da olur, dəyər
labüd olaraq oraya gəlir). Düzgün ifadə: cavab **cədvəl oxumaqla əlçatan deyil**,
yalnız adlı+audit olunan funksiya ilə — sızma vektoru (təsadüfi `join`/`select *`)
bağlıdır, server-daxili hesablama YOX.

### G3 — bağlandı, ziddiyyət yox idi (HANDOFF 71)

`private.question_answers.answer` = tam `{latex,values,choice}` obyekti — bu,
SAXLAMA formatıdır və DÜZGÜNDÜR (`0019` dəyişmir). `HANDOFF(67)`-dəki
`{"value": scalar}` **client SORĞUSUNUN** formatı idi (yəni `/api/answers/check`-ə
GƏLƏN body), saxlama formatı YOX. İkisi eyni şey olmalı DEYİLDİ — mənim əvvəlki
oxumam səhv idi.

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
`reveal_answer(...,'verify',...)` ilə əvəzlənir.

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
| — | **YENİ addım:** `select store_answer($1, $2::jsonb, 'exact')` — `$2` = `parsed.final_answer` (tam `{latex,values,choice}` obyekti, G3) |
| — | **YENİ addım:** `select store_step_answers($1, $2::jsonb)` — `$2` = `jsonb_agg({step_index, accept, input_kind})`, `parsed.steps`-dən Node-da qurulur (funksiya `rows` massivini gözləyir, tam `steps` obyektini YOX — `0018`-dəki `store_step_answers` imzasına bax) |
| `insert into attempts (id, device_id, problem_id, solution_id, match_path, ocr_source, delivered, student_ref)` | **İKİ INSERT:** `insert into attempts (id, device_id, student_ref, kind, started_at, client_created_at) values ($sessionId, $deviceId, $studentRef, 'photo_solve', now(), now())` + `insert into attempt_items (id, attempt_id, question_id, match_path, ocr_source, delivered, steps_total) values ($itemId, $sessionId, $questionId, 'llm', 'vision_llm', true, $stepsCount)` — **`sessionId` = klientin göndərdiyi `attempt_id`** (mövcud davranış saxlanılır, §G6), `itemId` server-generasiya |
| Cavabda `attempt_id: attemptRowId` | **DƏYİŞMİR** — client eyni ID-ni alır, sadəcə indi sessiya ID-sidir. Client kodu TOXUNULMUR. |

**Tranzaksiya sərhədi:** hazırkı `begin`/`commit` bloku EYNİ qalır, sadəcə daha çox
addım əlavə olunur (2 RPC çağırışı + 2 INSERT, əvvəlki 1 INSERT-in yerinə). Hamısı
BİR tranzaksiyada — RPC-lər `plpgsql`/`sql` funksiyalarıdır, adi `client.query`
çağırışı kimi tranzaksiya daxilində işləyir, xüsusi rəftar lazım deyil.

### 2.2 `POST /api/steps/check`

Köhnə: `payload.steps[idx].check.accept`-i `attempts JOIN solutions` ilə oxuyur,
Node-da `studentAnswerMatches` ilə müqayisə edir.

Yeni:

1. `select ai.id as item_id, ai.question_id from attempt_items ai join attempts a on a.id=ai.attempt_id where a.id=$1 and a.device_id=$2` — sahiblik + `question_id` tapılır (əvvəlki `attempt_id`, indi SESSİYA id-si, §G6-ya görə).
2. `select reveal_step_answer($question_id, $step_index, 'verify', $item_id)` → `{accept, input_kind}` (`NULL` ola bilər — açar yoxdursa `step_not_found` kimi `400` qaytar, köhnə davranışla eyni).
3. Node-da eyni `studentAnswerMatches` (DƏYİŞMİR).
4. `error_code` üçün: köhnədə `step.error_code` `payload`-dan gəlirdi — YENİ sxemdə
   bu, `question_translations.steps[idx].error_code`-dadır (**PUBLIC**, sirr deyil,
   G2-yə ehtiyac yoxdur, adi `select` kifayətdir).
5. `step_events` INSERT-i **DƏYİŞMİR** (`attempt_id` sütunu indi sessiya id-sini
   daşıyır — `0021`-in qərarına görə bu, `events.attempt_id` ilə eyni referensdir,
   uyğundur).

### 2.3 `POST /api/attempts/reveal`

Köhnə: `payload.final_answer`-i `attempts JOIN solutions`-dan oxuyur.

Yeni: `select ai.id as item_id, ai.question_id from attempt_items ai join attempts a on a.id=ai.attempt_id where a.id=$1 and a.device_id=$2`, sonra `select reveal_answer($question_id, 'reveal', $item_id)` → `{answer:{latex,values,choice}, validator}`. `latex` AYRICA sorğu tələb ETMİR — G3-ün bağlanması ilə eyni obyektin içindədir, birbaşa cavabda qaytarılır.

### 2.4 `POST /api/attempts/transfer`

Köhnə: mənbə `topic_code`-u `attempts JOIN problems`-dan, namizədi `problems JOIN
solutions`-dan (canonical + `final_answer.values is not null` mövcudluq filtri)
oxuyur.

Yeni:
1. Mənbə: `select q.topic_code, q.id as question_id from attempt_items ai join attempts a on a.id=ai.attempt_id join questions q on q.id=ai.question_id where a.id=$1 and a.device_id=$2`.
2. Namizəd: `select q.id from questions q join question_translations qt on qt.question_id=q.id where q.topic_code=$1 and q.problem_type='formula' and q.id != $2 and qt.lang='az' and qt.verified=true order by random() limit 1` — **`final_answer.values is not null` filtri DÜŞÜR** (private sxemə toxuna bilmirik), əvəzinə `qt.verified=true` işlədilir (məntiqi ekvivalent: `0019`-dakı backfill YALNIZ `status='ok'`+`steps`+`canonical` olan sətirlərə `question_answers` yazır, VERİFİED olub-olmaması ayrı, amma PRAKTİKİ olaraq `private.question_answers` mövcudluğu = `question_translations` sətrinin mövcudluğu ilə EYNİDİR, çünki `0019` `0017`-nin EYNİ "winning" seçimini işlədir — bu ekvivalentlik `/api/solve`-də `store_answer` yazılanda da qorunmalıdır: EYNİ tranzaksiyada `question_translations` INSERT-i ilə çağrılmalıdır, yoxsa fərqli düşərlər).
3. `canonical` cavabda: `qt.stem->'blocks'->0->>'v'` (tək-blok formatı, `0017`-dəki kimi).

### 2.5 `POST /api/attempts/transfer/check`

Köhnə: `solutions.payload.final_answer.values`-i birbaşa oxuyur.

Yeni: `select reveal_answer($transfer_question_id, 'verify', null)` (item hələ bu
transfer sualı üçün yoxdur, `ai=NULL`) → `answer.values`, Node-da
`studentAnswerMatches` (DƏYİŞMİR). Nəticə: `update attempt_items set
transfer_correct=$2 where attempt_id=$1 and id = (select id from attempt_items
where attempt_id=$1 limit 1)` — **`transfer_correct` `attempt_items`-dədir,
`attempts` (sessiya) YOX** (`design.md` §9-a görə), sahiblik yoxlaması
(`device_id`) sessiya cədvəlindən gəlir.

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
| `/api/solve` | `store_answer`/`store_step_answers` çağırışı yazılmayıb/yanlışdır | `500`, "Server xətası, yenidən cəhd et" — YENİ SUAL HƏLL EDİLƏ BİLMİR, məhsulun əsas axını dayanır |
| `/api/solve` | dedup sorğusu G4-ə köçürülməyib | funksional səhv YOX, amma keş tutmur — hər foto "yeni" sayılır, xərc artır (səssiz, şagird hiss etmir) |
| `/api/steps/check` | `reveal_step_answer` çağırışı yoxdur/yanlış, ya da `purpose` sətri etibarsızdır (funksiya `RAISE EXCEPTION` atır) | addım YOXLANILA BİLMİR, `500` — şagird cavab yazır, heç nə baş vermir |
| `/api/attempts/reveal` | `reveal_answer` çağırışı yoxdur/yanlış | "Cavabı göstər" düyməsi işləmir — şagird son addımda ilişib qalır |
| `/api/attempts/transfer` | namizəd sorğusu yeni sxemə uyğunlaşdırılmayıb | S6 sual göstərmir — `no_transfer_available`, funksiya SƏSSİZCƏ boş qalır (öyrənmə metrikası itir, şagird ZƏRƏR görmür, amma ÖLÇÜ itir) |
| `/api/attempts/progress` | sütun adı səhvdir | `abandoned_at_step`/`duration_sec` YAZILMIR, valideyn hesabatının "harada itiririk" sualı korlanır — **şagird HEÇ NƏ hiss etmir** (fire-and-forget, 200 həmişə qayıdır), YALNIZ ölçmə səssiz sınır |
| `/api/attempts/transfer/check` | `reveal_answer` çağırışı köhnə cədvələ gedir | `500`, transfer sualının cavabı yoxlanılmır — şagird cavab yazır, nəticə görmür |
| **Hamısı (`store_*`)** | `store_answer` ikinci dəfə EYNİ `question_id`-yə çağırılır (məs. retry) | **SƏSSİZ NO-OP** — funksiya `false` qaytarır (`ON CONFLICT DO NOTHING`), yeni sual YAZILMIR, köhnəsi qalır. Kod bunu YOXLAMALIDIR (`store_answer`-in `boolean` nəticəsi) — yoxlamasa, ekvivalent (fərqli LLM cavabı) SƏSSİZCƏ atılar, growth halında fərq gözə dəyməz, TEK problemli sual (yenidən LLM çağırışı yeni cavab versə) köhnə açarla qalar |
| **Hamısı birdən** | `app_runtime` yaradılmayıb / `DATABASE_URL` köhnə rola işarə edir | **HEÇ BİR XƏTA GÖRÜNMÜR** — `postgres` rolu `private` sxeminə giriş İCAZƏSİ olduğu üçün RPC-lər lazımsız olur, kod "normal" işləyir, AMMA `private` sxeminin bütün qorunması İŞLƏMİR (§5 deploy checklist-in #1 bəndi) |

---

## Açıq qərarlar (bu ADR-in EDİMƏDİYİ, Cowork/Ilkin qərarı gözləyən)

G1/G2/G3 `HANDOFF (71)`-də bağlandı (yuxarıda əks olunub) — aşağıda YALNIZ HƏLƏ
AÇIQ qalanlar:

1. **`/api/attempts/progress`-in `completed` semantikası** (§2.6-nın sonu) — `steps_revealed`
   `steps_total`-a məcburi bərabərləşdirilsinmi, yoxsa YALNIZ real açılan addım sayı?
2. **`review_status` yeni insert məntiqi** (§2.1) `HANDOFF(68)` cədvəlinə əsaslanır —
   AÇIQ TƏSDİQ istəmir (artıq qərar bağlanıb), sadəcə burada İLK DƏFƏ koda tərcümə
   olunur, səhv oxunma riski var, gözdən keçirilməlidir.
3. **`store_answer`-in `false` nəticəsi kod tərəfində necə işlənir?** (yuxarıdakı
   risk cədvəlinin son sətri) — sükutla keçmək, yoxsa `events`-ə bir telemetriya
   yazmaq (`answer.store_conflict` kimi)? Kiçikdir, kod yazarkən qərar veriləcək,
   ADR gözləmir.

**Blok:** yoxdur — bu 3 nöqtə kod yazılarkən həll olunacaq qədər kiçikdir, planı
bloklamır.
