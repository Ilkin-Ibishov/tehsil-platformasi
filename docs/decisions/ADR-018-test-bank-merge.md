# ADR-018 — Test bankı birləşməsi: `problems/solutions/attempts` → spec modeli

**Status:** Qəbul edildi (2026-08-10, HANDOFF 65 — altı açıq qərar bağlandı, PR #1 merge edildi)
**Tarix:** 2026-08-10
**Kontekst:** `.kiro/specs/test-bank/{requirements,design}.md`, `.kiro/steering/test-bank.md`,
`docs/decisions/ADR-017-answer-isolation.md`, `docs/DATA-MODEL.md`, mövcud
`supabase/migrations/0001-0009`.

**Tətbiq statusu:** miqrasiya faylları `supabase/migrations/0012-0021` yazılıb (bax HANDOFF).
Altı açıq qərarın yekun cavabları `design.md`/`ADR-017`-yə köçüb, bu sənəddəki uyğun bəndlər
artıq TARİXİdir — güncəl mənbə spec fayllarıdır. `0014`/`0020` (RENAME) hələ Supabase-ə
TƏTBİQ EDİLMƏYİB — tətbiq kodu ilə eyni deploy-da olmalıdır, bax miqrasiya fayllarının öz
başlıq şərhləri.

## Nömrələmə qeydi (kod yazmazdan əvvəl oxu)

Tapşırıqda bu fayl `ADR-016` kimi istənildi, amma `ADR-016-dim-korpusu.md` artıq
mövcuddur (DİM korpusunun bank kimi saxlanması qərarı — fərqli mövzu). Toqquşmanın
qarşısını almaq üçün bu sənəd **`ADR-018`** kimi yazılıb (sondan sonra: 017 → 018).

Tapşırığın 4-cü bəndi "ADR-015-in tətbiqi: `app_runtime` rolu, `private` sxem,
`MIGRATION_DATABASE_URL`" deyir — bu təsvir həqiqətdə **`ADR-017`**-nin məzmunudur
(`ADR-015` göstərmə müqaviləsidir, LaTeX/render qaydalarıdır, DB rolu ilə əlaqəsi yoxdur).
Aşağıda `ADR-017` kimi işlədilib.

## Qərar

**Bir sistem.** Mövcud `problems`/`solutions`/`attempts` genişləndirilir və spec
modelinə (`questions`/`question_translations`/`attempts`+`attempt_items`) çevrilir.
`user_capture` (şagird şəkli) `source` enum-unda birinci dərəcəli dəyər olaraq qalır —
bu, DİM korpusu ilə YANAŞI, məhsulun əsas qidalanma kanalıdır və ayrı sxemdə
təcrid oluna bilməz.

`canonical_hash` və `numeric_fingerprint` **dedup açarı kimi saxlanılır** — spec-in
öz `design.md`-i bu iki sütunu tanımır (kuratoriya edilmiş kontent üçün lazım
deyildi), amma `user_capture` axını onlarsız işləməz. Bu, `design.md`-nin üzərinə
**additiv** genişləndirmədir, əvəzetmə deyil.

---

## 1. `problems` → `questions`

| Köhnə sütun (`problems`) | Yeni sütun (`questions`) | Hərəkət |
|---|---|---|
| `id` | `id` | dəyişmir |
| — | `root_id` | YENİ, backfill = `id` (hər mövcud sətir öz kökü olur) |
| — | `version` | YENİ, default `1` |
| — | `superseded_by` | YENİ, `NULL` (hələ heç bir versiya tarixçəsi yoxdur) |
| — | `group_id` | YENİ, `NULL` (sual qrupları hələ yoxdur) |
| `subject` (text: `math`/`physics`/`chemistry`) | `subject_id` (uuid FK → `subjects`) | **çevrilir**, aşağıda §1a |
| `grade` | `grade` | dəyişmir |
| — | `type` (`single/multi/numeric/match/order/open`) | YENİ, backfill = `'open'` (bax §1b — qərar tələb edir) |
| — | `payload` (jsonb, cavabsız) | YENİ, default `'{}'::jsonb` |
| — | `difficulty_static` | YENİ, backfill = `3` (özbaşına orta qiymət — **bax §6, risk**) |
| — | `difficulty_calibrated` | YENİ, `NULL` |
| `hit_count` | `attempt_count` | **ad DƏYİŞMİR** — semantika fərqlidir (bax §1c), `hit_count` PARALEL saxlanılır |
| `problem_type` (`formula/word_problem/geometry/mixed`) | `problem_type` | **SAXLANILIR olduğu kimi** — `type` ilə eyni deyil (bax §1b) |
| `canonical` | `canonical` | **SAXLANILIR, boş** (ADR-003 §D1 skrablanması pozulmur) |
| `canonical_hash` | `canonical_hash` | **SAXLANILIR açar kimi**, amma UNIQUE **götürülür** (bax §1d, risk) |
| `numeric_fingerprint` | `numeric_fingerprint` | **SAXLANILIR açar kimi** |
| `source` (`dim_import/user_photo/textbook`) | `source` (`generated/teacher/licensed/imported/user_capture`) | **enum xəritəsi**, §1e |
| `source_ref` | `source_ref` | dəyişmir |
| — | `license_status` | YENİ, backfill = `'unknown'` |
| — | `review_status` | YENİ, backfill = `'verified'` (mövcud sətirlər artıq şagirdlərə göstərilib — bax §6) |
| — | `reviewed_by` / `reviewed_at` | YENİ, `NULL` |
| `created_at` | `created_at` | dəyişmir |
| — | `updated_at` | YENİ, trigger ilə (steering qayda #5) |
| — | `deleted_at` | YENİ, `NULL` |

### §1a — `subject_id`

Yeni `subjects` cədvəli mövcud `problems.subject`-in 3 dəyərindən (`math`,
`physics`, `chemistry`) seedlənir (`code` = köhnə mətn dəyəri, `label` = ADR-008-in
subject-label cədvəlindən). Backfill: `subject_id = (select id from subjects where
code = problems.subject)`.

### §1b — `type` vs `problem_type` — QƏRAR TƏLƏB EDİR

Bunlar **eyni ox deyil**:
- `problem_type` (mövcud) — uyğunlaşdırma strategiyası: `formula` → hash, digərləri
  → fingerprint/embedding. Cavab **necə yoxlanır**a aid.
- `type` (spec) — UI cavab girişi: `single`/`numeric`/`match`/... Cavab **necə
  toplanır**a aid.

Mövcud məhsulda **bütün suallar addım-addım açıq-cavab həllidir** (çoxseçimli deyil),
ona görə `type = 'open'` bütün mövcud sətirlər üçün düzgün defolt görünür. Amma
`type='open'`-un `payload` strukturu, `check_answer` RPC-i necə çağıracağı hələ
`design.md`-də təyin OLUNMAYIB (`payload` nümunələri yalnız `single`/`numeric`/`match`
üçün var). **Bu, kod yazılmazdan əvvəl Cowork-dan ADR tələb edir** — `payload`
formatı `open` tip üçün müəyyən edilməlidir (STEP-SCHEMA-dakı `check.input_kind`-a
bənzər).

### §1c — `hit_count` vs `attempt_count`

`hit_count` = neçə dəfə **keş uyğunluğu** tapıldı (uyğunlaşdırma metrikası).
`attempt_count` (spec) = neçə **şagird cəhdi** oldu (kalibrasiya üçün, Req 12).
Fərqli şeylərdir — `hit_count` adı dəyişmədən qalır, `attempt_count` yeni sütun
kimi əlavə olunur və `attempt_items` INSERT trigger-i ilə artırılır (gələcək iş,
bu ADR-in əhatəsində deyil).

### §1d — `canonical_hash` UNIQUE məhdudiyyəti götürülür — RİSK

`DATA-MODEL.md`: *"Bir məsələnin bir neçə həlli ola bilər (fərqli sinif dərinliyi)"*.
Spec modelində hər sinif-dərinliyi ayrı `questions` sətri olacaq (§2-yə bax), yəni
**eyni `canonical_hash`-lı bir neçə sətir** mümkün olacaq. Mövcud `unique` indeks
(`0002`-dən) bunu qadağan edir.

Miqrasiya: `alter table questions drop constraint problems_canonical_hash_key;
create index questions_canonical_hash_idx on questions (canonical_hash);` (unique
btree → adi btree). **Nəticə:** hash uyğunlaşdırma sorğusu (`match_path`) artıq
`LIMIT 1` ilə YAZILMALIDIR, tətbiq kodunda bu fərz olunurdu — `web/`-də hash
axtarışı işlədən yerlər yoxlanmalıdır (bu ADR-in əhatəsində deyil, sadəcə qeyd).

### §1e — `source` enum xəritəsi

| köhnə | yeni |
|---|---|
| `user_photo` | `user_capture` |
| `dim_import` | `imported` |
| `textbook` | `licensed` |

Backfill **CHECK constraint əlavə etməzdən ƏVVƏL** işləməlidir, yoxsa köhnə
dəyərlər constraint-i pozar.

---

## 2. `solutions` → `question_translations`

**Struktur uyğunsuzluğu var — bu, xalis SQL miqrasiyası ilə həll olunmur.**

`question_translations` PK-si `(question_id, lang)`-dır — bir sualın bir dildə
YALNIZ BİR tərcüməsi. Amma `solutions` bir `problem_id`-yə **bir neçə sətir**
buraxır (fərqli sinif dərinliyi). Bunları eyni `question_id`-yə yazmaq mümkün
deyil — PK pozular.

**Qərar:** hər fərqli sinif-dərinliyi öz `questions` sətrinə klonlanır (eyni
`canonical_hash`/`numeric_fingerprint`, fərqli `grade`, fərqli `id`/`root_id` —
bunlar **eyni sualın versiyaları DEYİL**, fərqli suallardır ki, `root_id`/`version`
mexanizmi bunun üçün yanlış alətdir, o, REDAKTƏ tarixçəsi üçündür). Bu, sətir
sayını bir qədər artırır, amma dedup açarları (`canonical_hash`) paylaşıldığı üçün
uyğunlaşdırma sorğusu (§1d-dəki `LIMIT 1` sorğusu) yenə işləyir.

**Bu addım TS/Node skripti ilə yazılmalıdır** (`scripts/migrate/solutions-to-translations.ts`),
`.sql` faylı YOX — çünki "bu `solution_id` hansı `questions` sətrinə düşür, yoxsa
yeni klon yaradılsın" qərarı sorğu-daxili şərtdən çox, sətir-sətir məntiqdir.
Tranzaksiya daxilində, tək dəfəlik işlədilir.

| Köhnə sahə (`solutions.payload`, STEP-SCHEMA v1) | Yeni yer | Qeyd |
|---|---|---|
| `canonical` | `question_translations.stem` (`blocks[]`-ə sarılır) | `lang='az'` defolt (steering: az əsas dil) |
| `final_answer.latex`/`values`/`choice` | `private.question_answers.answer` | §4-ə bax, `check_answer` üçün |
| `steps[]` | `question_translations.steps` | **fərqli tip — §2a, KRİTİK RİSK** |
| `verified`/`verification_method`/`model`/`cost_usd` | `question_translations`-a ƏLAVƏ sütunlar | `design.md`-də YOXDUR, §2b |
| — | `question_translations.misconception` | `NULL` qalır (§2c) |
| — | `prompt_version` | ƏLAVƏ sütun, HANDOFF(58)-dən bəri gözlənilən borc |

### §2a — `steps[]` tipi uyğun gəlmir — QIZIL QAYDA RİSKİ

`design.md`-nin `Step` tipi:
```ts
type Step = { title: string; body: Content; why?: Content; reveals_answer: false }
```
Bunda **`check` (sən-yaz bloku) və `error_code` YOXDUR**. Amma steering sənədi
(`.kiro/steering/test-bank.md`) özü yazır: *"hər sualın `steps` sahəsi məcburidir"*
və `CLAUDE.md`-nin Qızıl Qaydası bütün məhsul dəyərini `error_code`
taksonomiyasına bağlayır. Mövcud `STEP-SCHEMA.json`-da hər addımın öz `check`
(`ask`/`accept`/`input_kind`) və `error_code`-u var — bu, **məhsulun əsas
fərqidir** (rəqiblər cavab verir, biz harada ilişdiyini deyirik).

`design.md`-nin `Step` tipini olduğu kimi tətbiq etsək, addım-səviyyəli
`error_code` və `check.accept` **itir**. Bu, Qızıl Qaydanı birbaşa pozur.

**Tövsiyə (Cowork təsdiqi tələb edir):** `question_translations.steps`-in
JSON strukturu `design.md`-dəki minimal `Step` tipini yox, mövcud
`STEP-SCHEMA.json`-un `steps[]` formasını (index/title/explanation/latex/why/
tokens/**check**/**error_code**/hint) daşımalıdır. `design.md`-dəki `Step` tipi
YENİLƏNMƏLİDİR — bu, sxem sahibliyi qaydasına görə (`CLAUDE.md`) Cowork-un işidir,
bu ADR-də YALNIZ problem qeyd olunur, həll YAZILMIR.

### §2b — Additiv sütunlar Cowork təsdiqi tələb edir

`verified`, `verification_method`, `model`, `cost_usd`, `prompt_version` —
`design.md`-nin `question_translations` sxemində yoxdur, çünki spec kuratoriya
edilmiş kontenti fərz edirdi (model/xərc anlayışı yoxdur). `user_capture` axını
üçün bunlar məcburidir (`verified=false` olan həll şagirdə göstərilmir — mövcud
qayda). `CLAUDE.md` fayl sahibliyi cədvəlinə görə SQL sxemi Cowork mənbə
həqiqətidir → bu sütunlar ADR ilə əlavə edilməlidir, bu sənəd o ADR-i əvəz etmir,
yalnız zərurəti sənədləşdirir.

### §2c — `misconception` boş qalır

Spec-in `misconception` sahəsi (`{"A": {"error_code":..., "note":...}}`)
**seçim-səviyyəli** (hansı yanlış variant hansı səhvi göstərir) — bizim `open`
tipli suallarımızda seçim yoxdur, addım-səviyyəli `error_code` `steps[]`-in
daxilindədir (§2a). `misconception` sütunu bütün miqrasiya edilmiş sətirlər üçün
`NULL` qalır, gələcəkdə çoxseçimli sual tipləri gələndə işə düşəcək.

**Qeyd — spec-in öz nümunəsindəki uyğunsuzluq:** `design.md`-nin `misconception`
nümunəsi `"error_code":"SIGN_FLIP"` işlədir — bu kod `STEP-SCHEMA.json`-un
**dəyişməz enum-unda yoxdur** (ən yaxını `SIGN_LOST`/`SIGN_CHOICE`). Bu, Qızıl
Qaydaya görə (enum təkdir, `SIGN_FLIP` uydurulmamalı idi) düzəldilməli — Cowork-a
bildirilməlidir, bu ADR-in özü düzəltmir.

---

## 3. `attempts` → `attempt_items` + yeni `attempts`

Mövcud `attempts` = **bir həll sessiyası** (1 sətir = 1 sual). Spec modelində
`attempts` = **sessiya konteyneri** (bir neçə sualı əhatə edə bilər, məs. test),
`attempt_items` = **sualbaşı sətir**. Yəni: köhnə `attempts` → **`attempt_items`**
adlanır, YENİ `attempts` sessiya cədvəli yaradılır.

### 3a. Adı dəyişən cədvəl: `attempts` → `attempt_items`

| Köhnə sütun | Yeni sütun | Hərəkət |
|---|---|---|
| `id` | — | **YENİDƏN generasiya olunur** (köhnə `id` sessiya `attempts.id`-yə köçür, bax 3b) |
| `problem_id`/`solution_id` | `question_id` | §2-dəki klonlanmış `questions` sətrinə işarə edir |
| `match_path` | `match_path` | **SAXLANILIR** (tələb olunub) |
| `ocr_source` | `ocr_source` | **SAXLANILIR** |
| `ocr_corrected` | `ocr_corrected` | **SAXLANILIR** |
| — | `delivered` | **SAXLANILIR** — mövcud `attempts.delivered` sütunundan (DATA-MODEL-də var, `0003`-dən) |
| `transfer_correct` | `transfer_correct` | **SAXLANILIR** |
| `revealed_answer` | `revealed_answer` | dəyişmir |
| — | `given_answer` (jsonb) | YENİ, backfill `NULL` — tarixi datada YOXDUR (bax §6) |
| — | `is_correct` | YENİ, backfill `NULL` |
| — | `error_code` | YENİ, backfill `NULL` — **`step_events`-i bura ÇÖKMƏ, o ayrıca qalır** (§3c) |
| `duration_sec` | `time_ms` | `duration_sec * 1000` (təxmini, sessiya-səviyyəli idi, indi item-səviyyəli sayılır) |
| `abandoned_at_step` | `steps_revealed` | **təxmini bərabərlik**, dəqiq deyil (§3d) |
| — | `steps_total` | backfill: köhnə `solution_id`-nin `payload.steps` uzunluğu (drop-dan ƏVVƏL oxunmalı) |
| — | `hints_used` | YENİ, backfill `0` — köhnə modeldə bu say heç saxlanmayıb |
| `completed` | — | **DÜŞÜR**, `steps_revealed = steps_total` ilə əvəzlənir (özbaşına deyil, hesablanan) |
| — | `self_solved` (generated) | avtomatik, `revealed_answer=false AND hints_used=0`-a görə |

### 3b. Yeni cədvəl: `attempts` (sessiya)

Köhnə `attempts.id` **YENİ `attempts` (sessiya) sətrinin `id`-si olaraq qalır** —
bu, `events.attempt_id`-nin (telemetriya axını) referans etibarlılığını qoruyur,
ayrıca cədvəl gəzintisi lazım deyil. `attempt_items.id` isə TƏZƏ UUID alır,
`attempt_items.attempt_id = köhnə_attempts.id`.

| Sütun | Backfill |
|---|---|
| `id` | köhnə `attempts.id` |
| `user_id` | köhnə `attempts.user_id` |
| `device_id` | köhnə `attempts.device_id` — **NÖV UYĞUNSUZLUĞU**: köhnə `uuid`, spec `TEXT` yazır (§6 risk) |
| `student_ref` | köhnə `attempts.student_ref` |
| `assessment_id` | `NULL` (Faza 1-də test/topluluq yoxdur) |
| `kind` | `'user_capture_solve'` sabiti |
| `started_at` | köhnə `created_at` |
| `finished_at` | köhnə `created_at + duration_sec` (varsa) |
| `score` | `NULL` (qiymətləndirilməyib) |
| `device` | `NULL` (yeni sahə, məlumat yoxdur) |
| `client_created_at` | köhnə `created_at` (dəqiq client vaxtı saxlanmayıb) |

### 3c. `step_events` TOXUNULMUR

`step_events` addım-səviyyəli `error_code` mənbəyi olaraq **olduğu kimi qalır**.
`attempt_items.error_code` YENİ, tək-dəyərli sahədir (məs. son cavabın
kateqoriyası) — `step_events`-in əvəzi DEYİL, üzərinə əlavədir. Valideyn
hesabatının `TƏKRARLANAN SƏHVLƏR` sorğusu `step_events`-dən oxumağa davam edir.

### 3d. `abandoned_at_step` → `steps_revealed` — dəqiq bərabərlik deyil

Köhnə `abandoned_at_step` = *"hansı addımda tərk etdi"*, tamamlanmadısa dolu,
tamamlandısa `NULL`. Yeni `steps_revealed` = *"neçə addım AÇILDI"* — tərk edən
şagird 2-ci addımı aça bilər, amma 1-ci addımda "tərk etdi" işarələnə bilər
(vaxt fərqi). Backfill `steps_revealed = coalesce(abandoned_at_step, steps_total)`
— **təxminidir**, tarixi sətirlər üçün dəqiq deyil, yalnız YENİ sətirlər üçün
düzgün hesablanacaq.

---

## 4. `ADR-017` tətbiqi — `app_runtime`, `private` sxem, `MIGRATION_DATABASE_URL`

Hazırkı vəziyyət yoxlanıldı (`web/lib/db.ts`, `web/.env.example`): tətbiq **tək
`DATABASE_URL`** ilə qoşulur, rol ayrımı, `private` sxem və `MIGRATION_DATABASE_URL`
**hələ mövcud deyil**. Bu, sıfırdan tətbiqdir.

### 4a. Miqrasiya addımları (SQL)

```sql
CREATE ROLE app_runtime LOGIN PASSWORD :'app_runtime_pw';
GRANT USAGE ON SCHEMA public TO app_runtime;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE ON TABLES TO app_runtime;  -- gələcək cədvəllər üçün, ADR-017 §risk

CREATE SCHEMA private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
-- app_runtime-a private sxeminə HEÇ BİR GRANT verilmir (qəsdən)

CREATE TABLE private.question_answers ( ... );  -- design.md §7
CREATE FUNCTION public.check_answer(...) SECURITY DEFINER ...;
REVOKE ALL ON FUNCTION public.check_answer FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_answer TO app_runtime;
```

⚠️ **`ALTER DEFAULT PRIVILEGES`** ADR-017-in özünün qeyd etdiyi riski bağlayır
(*"yeni cədvəl əlavə edildikdə GRANT avtomatik verilmir"*) — bu, ADR-017-nin
SQL-ində YOXDUR, bu ADR-də ƏLAVƏ olunur.

### 4b. Vercel üçün konkret addımlar

1. Supabase dashboard → SQL Editor-də yuxarıdakı `CREATE ROLE` əl ilə (bir dəfə,
   parol Supabase-in öz secret idarəçiliyində saxlanmır — Vercel env-ə yazılır).
2. Vercel env dəyişənləri:
   - `DATABASE_URL` → `app_runtime` rolu ilə connection string (mövcud dəyər
     DƏYİŞDİRİLİR, `postgres` roludan `app_runtime`-a).
   - `MIGRATION_DATABASE_URL` → **YENİ**, `postgres` (superuser) roludan
     connection string. Yalnız CI/miqrasiya addımında istifadə olunur, runtime
     kodunda HEÇ VAXT oxunmur (ADR-017 qaydası).
3. Miqrasiya işlədən skript (`npm run migrate` və ya bənzəri, hazırda yoxdursa
   YENİ yazılmalıdır) `MIGRATION_DATABASE_URL`-i, tətbiq (`web/lib/db.ts`) isə
   `DATABASE_URL`-i oxuyur — kod dəyişikliyi: `web/lib/db.ts` dəyişmir (artıq
   `DATABASE_URL`-i oxuyur), YALNIZ həmin dəyərin **hansı rola işarə etdiyi**
   dəyişir.

### 4c. Lokal dev üçün konkret addımlar

1. `.env.example`-ə iki sətir əlavə olunur: `MIGRATION_DATABASE_URL` (nümunə:
   `postgres://postgres:postgres@localhost:5432/tehsil`) və qeyd ki,
   `DATABASE_URL` artıq `app_runtime` roluna işarə etməlidir.
2. Lokal Docker Postgres-də də eyni `CREATE ROLE app_runtime ...` işlədilməlidir
   — README-dəki `docker run` addımından sonra bir `psql -f` addımı əlavə olunur.
   **ADR-017-in öz riski budur:** *"lokal dev eyni rolu işlətməlidir, əks halda
   `icazə yoxdur` xətaları ilk dəfə istehsalatda görünəcək"* — README-yə bu addım
   YAZILMALIDIR (bu ADR-in əhatəsində deyil, `web/README.md`-yə ayrı tapşırıq).

### 4d. Açıq risk — §2a ilə kəsişir

`check_answer(q, given)` YALNIZ **son cavabı** yoxlayır (`design.md`-nin RPC-i tək
`answer` sahəsi oxuyur). Amma mövcud məhsul **hər addımda** (`STEP-SCHEMA.json`
`check.ask`/`check.accept`) cavab istəyir — Requirement 7 (*"cavabda doğru cavab
heç bir formada olmamalı"*) məntiqi ilə **addım-səviyyəli `check.accept`
dəyərləri də** eyni izolyasiyaya ehtiyac duyur, çünki onlar da faktiki cavabdır.

`design.md`-nin `Step` tipində `check` YOXDUR (§2a-da qeyd olundu) — bu, təsadüfi
DEYİL, çox güman **bilərəkdən** belədir, çünki `check.accept`-i `public` sxemli
`question_translations.steps`-ə YAZMAQ Requirement 7-ni pozar. Yəni düzgün struktur
`private.question_step_answers (question_id, step_index, accept jsonb)` +
`public.check_step_answer(q, step_index, given)` RPC-i olmalıdır — `check_answer`-in
addım-səviyyəli qardaşı.

**Bu, kod yazılmazdan əvvəl Cowork-un `design.md`/`ADR-017`-ni genişləndirməsini
tələb edir.** Bu ADR problemi sənədləşdirir, sxemi YAZMIR.

---

## 5. Miqrasiya ardıcıllığı (`0012`-dən başlayaraq)

`0010`/`0011` bu ardıcıllıqda BOŞ BURAXILIB — HANDOFF (58)/(59)-da gözlənilən
`problems.dim_substandard` və `solutions.prompt_version` sütunları hələ tətbiq
olunmayıb, onlar bu iki nömrəni tuta bilər. Əgər onlar bu ardıcıllıqdan ƏVVƏL
tətbiq olunarsa, aşağıdakı nömrələr bir sürüşür — tətbiqdən əvvəl real fayl
siyahısı yoxlanmalıdır.

| Fayl | Növ | Bir cümləlik təsvir |
|---|---|---|
| `0012_create_subjects.sql` | additiv, geri qaytarıla bilən | `subjects` cədvəlini yaradır, `problems.subject`-in 3 dəyərindən seedləyir. |
| `0013_create_standards.sql` | additiv | `standards` + `question_standards` boş cədvəllərini yaradır (kurikulum taksonomiyası, hələ məlumat yoxdur). |
| `0014_create_question_groups.sql` | additiv | `question_groups` + `question_group_translations` boş cədvəllərini yaradır. |
| `0015_rename_problems_to_questions.sql` | **DƏYİŞDİRİCİ, geri qaytarıla bilən** | `problems` → `questions` adını dəyişir, §1-dəki yeni sütunları əlavə edir, `canonical_hash` UNIQUE-i adi indeksə salır. |
| `0016_backfill_questions_subject_and_source.sql` | data-only | `subject_id`-ni doldurur, `source` enum-unu §1e xəritəsi ilə çevirir, SONRA `CHECK` məhdudiyyətini əlavə edir. |
| `0017_add_review_status_default.sql` | data-only | mövcud sətirlərə `review_status='verified'` yazır (§6 riski ilə). |
| `0018_create_question_translations.sql` | additiv | `question_translations` cədvəlini §2b-dəki əlavə sütunlarla yaradır (**Cowork ADR təsdiqi tələb edir**, §2b). |
| `0019_backfill_question_translations.ts` | **data skripti, .sql YOX** | `solutions` sətirlərini `questions` (klonlarla) + `question_translations`-a köçürür (§2). |
| `0020_create_private_schema_and_answers.sql` | additiv | `private` sxemi, `question_answers`, `check_answer` RPC-i, `app_runtime` GRANT-ları (§4a). **Rolu miqrasiyadan ƏVVƏL Supabase-də əl ilə yaratmaq lazımdır** (§4b/4c). |
| `0021_backfill_private_question_answers.ts` | data skripti | hər `question_translations` sətri üçün `final_answer`-i `private.question_answers`-ə köçürür. |
| `0022_rename_attempts_to_attempt_items.sql` | **DƏYİŞDİRİCİ, geri qaytarıla bilən** | `attempts` → `attempt_items` adını dəyişir, §3a-dakı yeni sütunları əlavə edir. |
| `0023_create_attempts_sessions.sql` | additiv | YENİ `attempts` (sessiya) cədvəlini yaradır, boş. |
| `0024_backfill_attempts_sessions.ts` | data skripti | §3b-dəki xəritəyə görə hər köhnə `attempt_items` sətri üçün sessiya sətri yaradır, `attempt_id` FK-ni bağlayır. |
| `0025_attempt_items_repoint_question_id.sql` | data-only | `attempt_items.question_id`-ni §2-dəki klonlanmış `questions` sətrinə yönləndirir (0019-un çıxışına əsasən). |
| `0026_rls_new_tables.sql` | additiv | Yeni cədvəllərdə RLS aktivləşdirir, siyasətsiz (`0007`-dəki qayda ilə eyni məntiq — CLAUDE.md qayda 6). |

Hər addım **additiv və ya geri qaytarıla bilən** yazılmalıdır: `RENAME`
əməliyyatları `DOWN` skriptində tərsinə çevrilə bilər (`ALTER TABLE RENAME`),
data skriptləri **köhnə cədvəlləri SİLMİR**, yalnız köçürür — `problems`/`solutions`/
köhnə `attempts` sətirləri son doğrulama keçənə qədər saxlanılır (bax §6).

---

## 6. Data itmə riski olan addımlar

| Addım | Risk | Azaltma |
|---|---|---|
| `0015` — `canonical_hash` UNIQUE götürülür | Yoxdur (itki deyil), amma **davranış dəyişir**: hash axtarışı artıq unikal deyil, tətbiq kodunun `LIMIT 1`/sıralama fərziyyəsi yoxlanmalıdır. | Miqrasiyadan ƏVVƏL `web/`-də hash-əsaslı sorğuları grep et, `ORDER BY`/`LIMIT 1` əlavə et. |
| `0017` — `review_status='verified'` defolt | **Səhv siqnal**: mövcud sətirlərin heç biri insan tərəfindən nəzərdən keçirilməyib, `'verified'` yazmaq bunu YALANDAN bildirir. | Alternativ: `'draft'` yazıb Req 9.2-yə görə (*"draft şagird sorğularında qaytarılmır"*) YENİ sorğu yolu köhnə sətirləri görməyəcək — bu, PRODUKSIYADA SUALLARIN YOXA ÇIXMASI deməkdir. **Bu, real münaqişədir, bu ADR həll etmir — Ilkin qərar verməlidir.** |
| `0019` — solutions→questions klonlama | Klonlama məntiqi səhv olarsa (yanlış `grade` uyğunlaşdırması), **eyni məsələ iki dəfə** bazaya düşə bilər (dedup pozulur). | Skript `dry-run` rejimində əvvəlcə işlədilir, nəticə sayı əl ilə yoxlanılır (`select count(*) from questions` əvvəl/sonra), transaction daxilində, uğursuzluqda `ROLLBACK`. |
| `0020`/`0021` — `private.question_answers` | Yoxdur (yalnız köçürmə), amma **§4d-dəki addım-səviyyəli cavab boşluğu** həll olunmadan bu addım tətbiq olunsa, `check.accept` dəyərləri `question_translations.steps`-də (public, oxuna bilən) **açıq qalır** — bu, Requirement 7-ni indi POZUR (əvvəllər də pozulurdu, `solutions.payload` vasitəsilə, amma bu, o problemi HƏLL ETMİR, sadəcə yerini dəyişir). | §4d-dəki addım-səviyyəli RPC yazılmadan `0020`/`0021` **tətbiq edilməməlidir** — sıra vacibdir. |
| `0022` — `attempts`→`attempt_items` | **Referens qırılması riski**: `events.attempt_id` köhnə `attempts.id`-yə istinad edir. Əgər yeni sessiya `attempts.id`-si köhnə `id`-dən FƏRQLİ generasiya olunsa, telemetriya zənciri (§ADR-in 3b-dəki qərarı) qırılar. | 3b-dəki qərar məhz bunu qabaqlayır: köhnə `id` sessiyaya keçir, YENİ `id` yalnız item sətrinə verilir. Miqrasiyadan sonra `select count(*) from events e left join attempts a on a.id=e.attempt_id where a.id is null` sıfır olmalıdır — bu, qəbul testidir. |
| `0024` — `device_id` tip uyğunsuzluğu (§3b) | Köhnə `uuid`, spec `TEXT`. Tip dəyişdirilməzsə `design.md`-dən sapma, dəyişdirilərsə `device_id`-ə əsaslanan mövcud sorğular (limit məntiqi, S1-dəki gündəlik tavan) yenidən yazılmalıdır. | **Tövsiyə: `uuid` saxla**, `design.md`-nin `TEXT` təsviri sadəcə nümunədir (spec-in özü UUID-i "client tərəfdə generasiya" deyir, bu, `uuid` tipinə daha uyğundur). Cowork-a bir sətir qeyd kifayətdir, ADR tələb etmir. |
| Ümumi | Köhnə `problems`/`solutions`/`attempts` cədvəlləri NƏ VAXT silinir? | **Bu ADR-in əhatəsində deyil.** Tövsiyə: bütün yuxarıdakı addımlar production-da bir tam sınaq dövrü (məs. 2 həftə) sınaqdan keçənə qədər köhnə cədvəllər saxlanılır, sonra ayrıca miqrasiya ilə silinir. |

---

## Açıq qərarlar — Cowork/Ilkin təsdiqi tələb edir (kod YAZILMAYIB)

1. **§2a** — `question_translations.steps`-in JSON forması: `design.md`-nin
   minimal `Step` tipi YOX, `STEP-SCHEMA.json`-un tam `steps[]` forması
   (`check`+`error_code` daxil) işlədilməlidir. `design.md` yenilənməlidir.
2. **§4d** — Addım-səviyyəli cavab izolyasiyası: `private.question_step_answers`
   + `check_step_answer` RPC-i lazımdır, `ADR-017` bunu əhatə etmir. Yeni ADR
   (və ya `ADR-017`-yə əlavə) tələb olunur.
3. **§2b** — `question_translations`-a `verified`/`verification_method`/`model`/
   `cost_usd`/`prompt_version` sütunlarının əlavə edilməsi — SQL sxemi Cowork
   mənbə həqiqəti olduğu üçün onun təsdiqi lazımdır.
4. **§1b** — `type='open'` üçün `payload` strukturu hələ tərif olunmayıb.
5. **§6, `review_status`** — mövcud sətirlər `'verified'` yoxsa `'draft'` başlasın?
   Real biznes riski var (draft → görünməz olar).
6. **§2c** — `design.md`-nin `misconception` nümunəsindəki `SIGN_FLIP` kodu
   enum-da yoxdur, spec sənədi düzəldilməlidir.

**Blok:** yoxdur — yuxarıdakı 6 nöqtə bloklayıcı deyil, YALNIZ bu ADR-in
tətbiqindən ƏVVƏL cavablanmalıdır, çünki hər biri konkret miqrasiya faylının
məzmununu dəyişir.
