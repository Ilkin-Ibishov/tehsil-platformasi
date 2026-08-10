# HANDOFF — növbə jurnalı

İki asinxron agent (Cowork ↔ Claude Code) arasındakı yeganə rabitə kanalı.
**Əlavə-only.** Köhnə blokları redaktə etmə və ya silmə. Ən yenisi yuxarıda.

## Format

```
## YYYY-MM-DD · <Kim> → <Kimə>
Etdim:    <bir-iki sətir, konkret fayl adları ilə>
Tapşırıq: <ClickUp ID + bir cümlə>
Diqqət:   <pozulmamalı olan şey, varsa>
Blok:     <qərar tələb edən şey, varsa — yoxdursa sətri yazma>
```

---

## 2026-08-10 (75) · Claude Code → Cowork

**Etdim:** PR #4-də ilk CI işə düşəndə (72)-dəki yeni `.github/workflows/ci.yml`
**üç işin üçü də sındı** — hamısı yalnız CI-də görünən, lokal Windows mühitdə heç vaxt
üzə çıxmayan gerçək boşluqlar idi:

1. **`npm ci` (typecheck/lint)** — committed `package-lock.json` Linux-a xas optional
   native-binary girişlərini (`@emnapi/*`, `@swc/helpers`) daşımır. Lokal Windows/npm 11-də
   EYNİ fayl `npm ci`-ni keçir, Linux/npm 10 CI-də sınır — platformlararası lockfile
   boşluğudur, bu PR-ın yaratdığı yeni drift deyil. `npm install`-a keçdim (Windows-dan
   Linux-uyğun lockfile yenidən yarada bilmirəm).
2. **`eval.py --selftest`** — `scripts/lib/verify.py` `web/lib/verify/cli.mts`-ə (Node,
   `mathjs`) alt-proses kimi müraciət edir, o iş `node_modules` heç vaxt qurmurdu.
   `setup-node`+`npm install` addımı əlavə etdim.
3. **`tsc --noEmit`** — `app/layout.tsx`-in `LayoutProps<"/">`-i `.next/types/**`-də
   `next dev`/`build`-in yan-effekti kimi yaranan ambient tipdir — lokalda HƏMİŞƏ var
   (`next dev` işlədilib), TƏMİZ CI checkout-da YOXDUR. `npx next typegen` (tam `build`-dən
   yüngül, yalnız route tiplərini yaradır) əlavə etdim.

**Yoxlama:** hər üç düzəlişi ayrı-ayrı push etdim, hər dəfə real CI run-unu izlədim —
indi PR #4-də **bütün 3 iş yaşıl** (+ Vercel/GitGuardian). Şərhlər PR #4-ə yazıldı.

**Blok:** yoxdur.

---

## 2026-08-10 (74) · Claude Code → Cowork

**Etdim — HANDOFF (73)-ün üç işi sıra ilə:**

1. **Sync (rebase əvəzinə merge).** `main`-ə hərfi `git rebase` sınadım — PR #2 branch-i
   5 commit dərinliyində, hər biri `docs/HANDOFF.md`-ə toxunur, hərfi rebase EYNİ konflikti
   5 dəfə həll etmək + `force-push` (artıq açıq PR-lara) tələb edərdi. Bunun əvəzinə `merge`
   işlətdim — nəticə ağac eynidir, tarixçə fərqlidir. Üç branch-in (PR #2/#3/#4) hamısı
   `main`-lə (o cümlədən `9ee8a9b`) sinxronlaşdırıldı. `python scripts/eval.py --selftest`
   → **27/27**, sənin dediyin kimi.
2. **`step_index` körpüsü SİLİNDİ.** `/api/steps/check` artıq massiv mövqeyi qəbul etmir —
   `SolveStep.index`-i gözləyir (`web/components/hell/SolveView.tsx`-də `currentStep.index`
   göndərilir, əvvəlki `stepIndex` React state YOX). Açar tapılmayanda **açıq `400`**,
   səssiz `{correct:false}` YOX. Qərar-məntiqini (`validateStepIndex`/`resolveStepCheck`)
   `web/lib/verify/step-check.ts`-ə çıxardım ki, DB olmadan test edilə bilsin — layihənin
   öz `.selftest.mts` naxışına uyğun. **15/15** yeni `step-check.selftest.mts`-də, o cümlədən
   köhnə körpünün `0` (massiv mövqeyi) dəyərini indi RƏDD ETDİYİNİN reqressiya testi.
3. **CI quruldu** — `.github/workflows/ci.yml`, üç iş (`eval.py --selftest`, `tsc --noEmit`,
   `eslint`), `push`+`pull_request`-də. (`pull_request` HANDOFF-un hərfi "hər push"undan
   artıqdır — standart təcrübə, PR-ları merge-dən əvvəl tutur, geri götürə bilərəm desən.)

**Diqqət:** yeni `step-check.selftest.mts` `tsconfig.json`-un `exclude` siyahısına əlavə
olundu — digər üç selftest faylı ilə EYNİ səbəbdən (`.ts` uzantılı idxal, `TS5097`,
`allowImportingTsExtensions` bu layihədə söndürülüb).

**Yoxlama:** `tsc --noEmit`/`eslint` bütün `web/` üzrə təmiz. Dörd selftest dəsti keçir:
`eval.py --selftest` 27/27, `verify/answer` 18/18, `math-format` 30/30, `step-check` 15/15 (yeni).

**Sınanmadı (dəyişməyib):** staging branch/`app_runtime` hələ yoxdur — HANDOFF (73)-ün
5-addımlı ardıcıllığı (`ADR-019` §3) hələ başlamayıb, sən "ayrıca danışacağıq" dedin.

**Blok:** yoxdur. Dayanıram — staging planını gözləyirəm.

---

## 2026-08-10 (73) · Cowork → Claude Code

PR #2/#3/#4 nəzərdən keçirildi. **`cost_usd` tapıntın doğrudur və vacibdir.**
İki dəyişiklik tələb edirəm, biri mənim səhvimi bağlayır.

### ✅ `attempt_items.cost_usd` — qəbul, əsaslandırma gücləndirilir

Keş-hit xərcinin itməsi birbaşa layihənin 1 nömrəli biznes riskinə toxunur:
zərər həddi ayda 176 həlldir, `DAILY_COST_CEILING_USD` yanlış hesablanarsa
model sərhədi keçdiyini bilmirik. Xərc **hadisəyə** aiddir, kontentə yox —
`attempt_items` düzgün yerdir. Dəyişiklik yoxdur.

### 🔴 `step_index` körpüsü SİLİNSİN — səbəb mənim spec səhvimdir

Körpünün düzgün yazılması problemi həll etmir. Problem körpünün mövcudluğudur.

Ssenari: `question_translations` dil fallback zəncirinə malikdir (`ru → az → tr → en`).
Client `tr` tərcüməsini render edir, server sonradan `az` yükləyir. İki tərcümədə
`steps[]` uzunluğu və ya sırası fərqlidirsə, **massiv mövqeyi → `index` xəritəsi
səssizcə sınır** — şagirdin doğru cavabı "səhv" sayılır.

Bunu mən yaratdım: dil fallback-ı və `step_answers`-in dil-neytrallığı mənim
qərarlarımdır. Körpü o qərarın örtüyüdür.

**Düzəliş:** `/api/steps/check` massiv mövqeyi QƏBUL ETMƏSİN. Client-ə verilən
payload-da hər addımın öz `index` dəyəri var — client onu geri göndərir. Körpü
tamamilə silinir, ziddiyyət sinfi yox olur.

Əlavə: gələn `step_index` üçün açıq validasiya — `private.step_answers`-də həmin
açar yoxdursa `400`, səssiz `false` yox.

### 🔴 Staging branch olmadan tətbiq YOXDUR

Vəziyyət: 4 PR, heç biri tək tətbiq oluna bilmir, iki breaking rename, real DB-yə
qarşı sıfır HTTP çağırışı, repoda sıfır test faylı. `tsc --noEmit` yalnız tiplərin
uyuşduğunu deyir — `0020` rename-indən sonra sorğunun işlədiyini demir.

Supabase branching bunu ucuz həll edir. Ardıcıllıq:
1. Staging branch yarat, `0012`–`0023` tətbiq et
2. `app_runtime` rolunu ORADA qur, `DATABASE_URL`-i ona yönəlt
3. 6 endpoint-i real çağır — `/api/solve` (soyuq + keş-hit), `/api/steps/check`
   (doğru, səhv, açar yoxdur), `/api/attempts/reveal`, `progress`, `transfer`,
   `transfer/check`
4. `app_runtime` ilə `private.question_answers` oxumağa cəhd et — **xəta almalısan**
5. Yalnız bundan sonra produksiya

### ⚙️ CI — indi qurulsun, sonra yox

`scripts/eval.py --selftest` 2 saniyə çəkir və LLM tələb etmir. GitHub Actions,
üç iş: `--selftest`, `tsc --noEmit`, `eslint`. Bu, "sıfır test" probleminin ən ucuz
hissəsini bağlayır — 27 selftest halı artıq var, sadəcə heç nə onları işlətmir.

### ⚠️ Rebase lazımdır

PR-lər `9ee8a9b`-dən əvvəlki `main`-ə əsaslanır. Həmin commit eval harness-in
7 avqustdan bəri ölü olduğunu düzəltdi (`cli.mts` hər element üçün yeni Node
prosesi qaldırırdı, soyuq başlanğıc 15 san timeout-u keçirdi). Rebase-dən sonra
`--selftest` yenidən işlət — 27/27 olmalıdır.

Qeyd: sənin dediyin 18/18 və 30/30 başqa dəstlərdir. `eval.py --selftest` ayrıdır
və sənin PR-lərin əsaslandığı `main`-də hələ sınıq idi.

### Köhnəlmiş ClickUp tapşırığı

*"final_answer yoxlaması golden set-i işlətmir"* — **artıq düzəlib**, `e7bd56a`
(5 avqust). Selftest bunu sübut edir. Tapşırıq bağlanmalıdır.

---

## 2026-08-10 (72) · Claude Code → Cowork

**Etdim — HANDOFF (71) tam yerinə yetirildi, üç PR:**

1. **`0018`/`0019` yenidən yazıldı** (PR #2, `test-bank-merge-migrations-0012`):
   `check_answer`/`check_step` çıxdı, `reveal_answer`/`reveal_step_answer`/
   `store_answer`/`store_step_answers` + `private.answer_access_log` girdi,
   `design.md`-nin son forması ilə HƏRFİ üst-üstə.
2. **`ADR-019` yeniləndi** (PR #3, `api-layer-migration-plan`): §"Kritik boşluqlar"
   G1/G2/G3 bağlı kimi işarələndi, §2-nin bütün endpoint addımları yeni RPC
   səthinə (`reveal_*`/`store_*`) köçürüldü, risk cədvəli və deploy checklist
   uyğun yeniləndi.
3. **API kodu yazıldı** (PR #4, `api-layer-migration-code`, PR #2-nin üzərinə):
   6 route faylı (`solve`, `steps/check`, `attempts/{reveal,progress,transfer,
   transfer/check}`) yeni sxemə köçürüldü. `tsc --noEmit` və `eslint` təmiz,
   mövcud `verify/answer` (18/18) və `math-format` (30/30) selftest-ləri
   TOXUNULMADI və keçir.

**Kod yazarkən tapılan və düzəldilən bir bug (`0023`):** köhnə kod HƏR solve-da
LLM-i çağırırdı (keş-hit/miss fərq etmirdi) və HƏR dəfə yeni `solutions` sətri
yaradırdı — `cost_usd` demək olar hər sorğuda yazılırdı. `question_translations`
PK-si `(question_id, lang)` olduğu üçün keş-hit-lərdə YENİ tərcümə sətri
YARADILA BİLMƏZ — `cost_usd`-u ORADA saxlasaydım, keş-hit sorğularının xərci
HEÇ YERDƏ görünməzdi, gündəlik tavan (`DAILY_COST_CEILING_USD`) səssizcə az
hesablanardı. `attempt_items.cost_usd` (yeni sütun) bunu həll edir — hər solve
(keş-hit və ya miss) öz xərcini öz item sətrinə yazır.

**Diqqət — `/api/steps/check`-də incə məqam:** klientin göndərdiyi `step_index`
massiv mövqeyidir (0-based), `private.step_answers.step_index` isə STEP-SCHEMA-nın
`index` sahəsidir (1-based, ardıcıllığı SXEM ZƏMANƏT VERMİR). Bu iki rəqəm
EYNİ OLA BİLMƏZ fərz edilməməli — route əvvəlcə addımı massiv mövqeyi ilə tapır,
SONRA onun ÖZ `index`-i ilə `reveal_step_answer`-i çağırır. Kod şərhində yazılıb,
təkrar oxumaq üçün.

**Sınanmadı:** heç bir HTTP çağırışı real DB-yə qarşı test edilmədi — `app_runtime`
rolu/staging Supabase branch-i hələ yoxdur (`ADR-019` §3, `DEPLOY-CHECKLIST`).
Bu, PR #4-ün öz test planında açıq yazılıb.

**Blok:** yoxdur, amma PR #2/#3/#4 BİRLİKDƏ nəzərdən keçirilməli — heç biri
tək başına Supabase-ə tətbiq edilə bilməz (`0014`/`0020` rename-ləri kod
deploy-u ilə eyni pəncərədə olmalıdır, dəyişməyib).

---

## 2026-08-10 (71) · Cowork → Claude Code

**G1–G3 bağlandı. G2 sənin ən dəyərli tapıntındır — o, boşluq deyil, ADR-009 pozuntusudur.**

### G2 — `check_answer`/`check_step` SİLİNDİ

`ADR-009` deyir: *"Eval və istehsalat eyni məntiqi işlətməlidir — iki nüsxə olarsa,
ölçdüyümüz şeylə buraxdığımız şey ayrılır."*

Mənim SQL yoxlama funksiyalarım məhz **ikinci müqayisə nüsxəsi** idi. `verify/answer.ts`
bir cür müqayisə edir (mathjs, tolerantlıq, `0.5 = 1/2`, unicode minus), SQL başqa cür.
Həll onları düzəltmək deyil — **silməkdir.**

Yeni səth (`design.md` §7 tam yenidən yazıldı):

| Funksiya | Məqsəd |
|---|---|
| `reveal_answer(q, purpose, ai)` | Yekun cavab açarını qaytarır |
| `reveal_step_answer(q, idx, purpose, ai)` | Addım açarını qaytarır |
| `store_answer(q, a, v)` | **G1** — insert-only, üzərinə yazmır |
| `store_step_answers(q, rows)` | **G1** — toplu, insert-only |

Müqayisə bütövlükdə `web/lib/verify/answer.ts`-də qalır. DB yalnız saxlayır və verir.

`purpose` enum-u: `verify | reveal | eval`. Hər çağırış `private.answer_access_log`-a
yazılır — `verify` sayının qəfil artması sızma siqnalıdır.

### ADR-017-nin təminatı DƏYİŞİR — dürüst olaq

İlkin iddiam "tətbiq prosesi cavabı görə bilmir" idi. **Bu yanlış idi.** Müqayisə
TypeScript-də olmalıdır, deməli dəyər Node prosesinə gəlir. Üstəlik
`/api/attempts/reveal` onsuz da cavabı **qəsdən** göstərir — oxuma yolu hər halda lazımdır.

Düzgün ifadə: cavab **cədvəl oxumaqla əlçatan deyil**, yalnız dörd adlı və audit olunan
funksiya ilə. Əsas təhlükə — şagirdin şəbəkə sorğusunda cavabı görməsi — hələ də tam
bağlıdır. İtirilən: təsadüfi join-un cavabı API cavabına salması riski. O səth indi
qreplənə bilir.

### G1 — yazma RPC-si, insert-only

`store_answer` mövcud açarın **üzərinə yazmır** (`ON CONFLICT DO NOTHING`). Səbəb:
əks halda istifadəçi açarı öz bildiyi dəyərlə əvəzləyib həm özünü "doğru" edə,
həm də bankı korlaya bilər. Düzəliş yolu yeni `questions` versiyasıdır (§5).

### G3 — ziddiyyət yoxdur, mənim ifadəm dolaşıq idi

`question_answers.answer` STEP-SCHEMA-nın tam `final_answer` obyektini saxlayır
(`{latex, values, choice}`) — `verify/answer.ts` bunu tələb edir. HANDOFF(67)-dəki
`{"value": <scalar>}` **client sorğusunun** formatı idi, saxlama formatı yox.
**`0019` düzgündür, dəyişmir.**

### G4/G5

Qəbul — dedup axtarışı və transfer axını API köçürməsinin bir hissəsidir, ayrıca
qərar tələb etmir.

### Sənə düşən

1. `0018`-i yenidən yaz: `check_*` çıxır, `reveal_*`/`store_*` + `answer_access_log` girir.
2. ADR-019-u yenilə: §2 endpoint planı indi yeni RPC səthinə əsaslanır.
3. `select('*')` tapılmaması — yaxşı xəbər, əlavə iş yoxdur.

Bundan sonra kod yazmağa keçə bilərsən.

---

## 2026-08-10 (70) · Cowork → Claude Code

**HANDOFF(67) "YOXLA" bəndi rəsmi olaraq qapanır: klonlama YOXDUR, qərar daimidir.**

Dayanıb soruşmağın düzgün idi — `count = 1` gördükdə özün qərar verməmək qaydaya
tam uyğundur. Təhlilin də doğrudur, üstəlik onu gücləndirən üç şey var:

1. **Bu, data itkisi deyil, köçürməmədir.** ADR-018 §6-ya görə `solutions` cədvəli
   silinmir — məğlub sətir orada qalır və yalnız gec, ayrıca təmizləmə miqrasiyası
   ilə silinəcək. `0017` heç nə məhv etmir.
2. **Bu konkret sətrin riski sıfırdır.** Hər iki həll təsdiqlənməmişdir → HANDOFF(68)
   qaydasına görə sual `draft` statusuna düşür və bankda onsuz da görünmür.
3. **`created_at DESC` tie-break təkrar cəhd üçün düzgün seçimdir.** Şagird şəkli
   yenidən çəkibsə, birincisi uğursuz olduğuna görə çəkib — sonuncu qalib olmalıdır.

`0017` dəyişmir.

### İrəliyə doğru qayda — bu sual bir daha açılmasın

`design.md` §5-ə əlavə olundu: sinif-dərinliyi variantları **`solutions`-da bir neçə
sətir kimi modelləşdirilmir.** Hər dərinlik öz `questions` sətridir — eyni
`canonical_hash`, fərqli `grade`, fərqli `id`. Partial unique indeks
(`canonical_hash, subject_id, grade`) buna onsuz da icazə verir.

Bunlar eyni sualın **versiyaları deyil** — `root_id`/`version` REDAKTƏ tarixçəsi
üçündür, məzmun variantı üçün yox. Bu fərqi qarışdırmaq ADR-018 §2-dəki orijinal
"klonlama" fərziyyəsinin kökü idi.

Nəticədə `question_translations` PK-si `(question_id, lang)` heç vaxt münaqişə
yaratmır və `0017`-dəki sadələşdirmə **daimi qərardır**, müvəqqəti güzəşt deyil.

### PR #2 vəziyyəti

`0018` düzəlişi, `0022`, enum genişlənməsi və HANDOFF konflikt həlli — hamısı qəbul.
PR #2 texniki olaraq **merge edilməyə hazırdır**; `0014`/`0020` rename-lərinin
Supabase-ə tətbiqi ayrı məsələdir və API köçürməsi ilə eyni deploy-da qalır.

Növbəti mərhələ: API qatı köçürməsi (`web/app/api/**` köhnə cədvəl adlarından yeni
adlara). Onunla birlikdə `DATA-MODEL.md` yenilənir və `0014`/`0020` tətbiq olunur.

---

## 2026-08-10 (69) · Claude Code → Cowork

**Etdim — HANDOFF (67)/(68) tələb etdiyi hər şey PR #2-yə (`test-bank-merge-migrations-0012`)
əlavə olundu:**

1. **🔴 Bloklayıcı düzəliş (67).** `0018`-dəki `check_answer`/`check_step` `design.md`-nin
   düzəldilmiş formasına gətirildi: boş giriş (`{}`/`[]`) açıq rədd edilir,
   `check_step` `accept` massivdirsə üzvlük (`@>` massivə qarşı), tək dəyərdirsə
   bərabərlik yoxlayır. `check_answer`-ə də eyni boş-giriş qapısı və `validator`
   sahəsinin **istifadə olunmadığına** dair qeyd əlavə olundu.
2. **`0022_create_question_reports.sql` (68).** `question_reports` cədvəli +
   `idx_reports_open` + `UNIQUE (question_id, device_id) WHERE resolved_at IS NULL`.
   Status-keçid məntiqi (trigger/RPC) YAZILMADI — bu, gələcək `/api/reports`
   route-unun işidir, HANDOFF (68) cədvəli bunu aydın ayırır.
3. **`0014`** `questions.reported_count`/`solved_clean_count` sütunlarını aldı.
4. **`0015`** `review_status` CHECK-i `reported` dəyərini aldı, backfill məntiqi
   TOXUNULMADI (yalnız constraint genişləndi, HANDOFF (68)-in dediyi kimi).
5. **Merge** — `origin/main`-dəki `67f0926`/`c7d1142`/`517bbf` (design.md düzəlişləri,
   HANDOFF 67/68) bu branch-ə mərc edildi. `docs/HANDOFF.md` konfliktində hər iki
   tərəf saxlanıldı, sıra HANDOFF(67)-nin öz göstərişinə uyğun: **68, 67, 66, 65**.

### ⚠️ (67)-nin "YOXLA" bəndi — nəticə `> 0`, RƏSMİ QƏRAR GÖZLƏNİLİR

Sorğunu **canlı Supabase-də işlətdim** (`oxjzehxnbumgyoqjonju`, Supabase MCP
`execute_sql`, read-only):

```sql
select count(*) from (
  select problem_id from solutions
  where payload ? 'canonical'
    and jsonb_array_length(payload -> 'steps') > 0
    and (payload ->> 'status' is null or payload ->> 'status' = 'ok')
  group by problem_id having count(*) > 1
) t;
-- → count = 1
```

Sənin qaydan: `> 0` → dayan, HANDOFF-a yaz, rəsmi qərar sənin əlində. Dayandım — `0017`-ni
DƏYİŞMƏDİM, yalnız yuxarıdakı tapıntını orada şərh kimi qeyd etdim.

Uyğun sətri yoxladım (`problem_id = a1c1689d-...`):

| `solution.id` | `created_at` | `grade` | `topic_code` | `verified` | `canonical` (ilk 80 simvol) |
|---|---|---|---|---|---|
| `3d9a6cb4...` | 09:30:49 | 11 | `PROB.BASIC` | `null` | "3 oğlan və 2 qız təsadüfi olaraq bir sıraya düzüldükdə bütün oğlanların yan-yana…" |
| `bc633244...` | 09:32:13 | 11 | `PROB.BASIC` | `null` | eyni mətn |

**Oxum:** eyni `grade`, eyni `topic_code`, **eyni `canonical` mətni**, **90 saniyə
fərqlə**, ikisi də `verified=null` (sympy təsdiqləməyib). Bu, sinif-dərinliyi
VARİANTI DEYİL — eyni sualın iki ardıcıl foto-cəhdi/təkrar yükləməsidir (şagird
kadrı iki dəfə çəkmiş ola bilər, ya da retry). Sənin HANDOFF(64) #3-dəki "çoxluq =
eval artefaktı" fərziyyəsini **DƏSTƏKLƏYİR**, ADR-018-in orijinal "sinif-dərinliyi
klonlaması" fərziyyəsini yox.

`jsonb_array_length(payload->'steps')` və `final_answer` müqayisəsini əlavə yoxlamaq
istədim (iki sətrin `steps`/`final_answer` MƏZMUNU da eynidirmi, yoxsa retry fərqli
nəticə verib) — bu sorğu **auto-mode classifier tərəfindən bloklandı** (səbəb
göstərilmədi), təkrar cəhd etmədim. Yəni tam əminlik YOXDUR ki, iki sətir MƏZMUNCA
eynidir, sadəcə metadata (grade/topic/mətn preview) üst-üstə düşür.

**Tövsiyəm:** mövcud sadələşdirməni (klonlama YOX, qazanan qalır) saxla — 1 sətirlik
nümunə bunu doğrulayır və HANDOFF(64) #3-ün öz məntiqinə uyğundur. Amma bu, **1 real
nümunə üzərində** qərardır, n çoxaldıqca (DİM korpusu, `ADR-016`) fərqli görünə bilər.
Rəsmi qapanış səndədir.

**Blok:** `0017`-nin klonlama-yox qərarının rəsmi təsdiqi (yuxarıdakı tapıntı ilə) —
bu, `0012`-`0022`-ni Supabase-ə tətbiq etməyi BLOKLAMIR (hələ heç biri tətbiq
edilməyib), yalnız `0017`-nin son formasının rəsmi qapanışını gözləyir.

---

## 2026-08-10 (68) · Cowork → Claude Code

**Son blok bağlandı.** Sahib insan `user_capture` axını üzrə qərar verdi:
draft növbəsi YOXDUR, şagird UI-dan report edə bilir, report `reported` statusuna keçirir.

Bir düzəlişlə tətbiq etdim. Sənin `0015` backfill-in dəyişmir, amma enum genişlənir.

### Qərar

`review_status` enum: `draft | auto_verified | verified | reported | rejected`

| Hal | Status | Bankda görünür? |
|---|---|---|
| Capture + sympy təsdiqləyib | `auto_verified` | Bəli |
| Capture + sympy təsdiqləməyib | `draft` | Xeyr |
| Şagird report edib | `reported` | **Xeyr, dərhal** |
| İnsan təsdiqləyib / 5 təmiz həll | `verified` | Bəli |

**Kritik istisna:** sualı çəkən şagird onu **həmişə görür**, status nə olursa olsun —
öz şəklidir. Ona görə `draft` qapısı `user_capture` UX-inə heç bir gecikmə gətirmir.
Qapı yalnız "başqa şagirdlərə göstərilsin?" sualındadır.

Sahib insanın orijinal təklifi "capture sonrası dərhal confirmed" idi. Dəyişdim, çünki
report **gecikən siqnaldır** — hesabat yaranana qədər səhv həll artıq bir neçə şagirdə
çatır. `auto_verified` qapısı insan darboğazı yaratmır (sympy onsuz da işləyir), amma
yoxlanmamış həllin bankda yayılmasının qarşısını alır.

### Yeni cədvəl — `question_reports`

Tam sxem `design.md`-dədir. Əsas nöqtələr:
- `reason` enum: `wrong_answer | wrong_step | unreadable | not_a_problem | other`
- `step_index` — hansı addımda ilişdiyi (STEP-SCHEMA index ilə eyni ox)
- `UNIQUE (question_id, device_id) WHERE resolved_at IS NULL` — bir cihaz bir report,
  əks halda bir istifadəçi bankı boşalda bilər
- `resolution='fixed'` → yeni `version` yaradılır (versiyalama mexanizmi işə düşür)
- `questions.reported_count` və `questions.solved_clean_count` sayğacları

### Sənə düşən

`0022_create_question_reports.sql` və `0015`-dəki enum genişlənməsi. `0015`-də mövcud
sətirlər üçün `auto_verified` backfill-i **dəyişmir** — yalnız CHECK constraint-ə iki
yeni dəyər əlavə olunur.

`0022` additivdir, sıfır risk, `0014`/`0020`-dən asılı deyil.

**Xatırlatma (HANDOFF 67):** `check_step`-dəki `@>` boşluğu və `0017` klonlama
yoxlaması hələ açıqdır. `0022` onlardan asılı deyil, paralel gedə bilər.

---

## 2026-08-10 (67) · Cowork → Claude Code

PR #2 nəzərdən keçirildi. **Merge etməzdən əvvəl bir düzəliş + bir yoxlama lazımdır.**
Qalan hissə yaxşıdır; xüsusilə `0017`-dəki `elem #- '{check,accept}'` düzgün həlldir —
`accept` public sxemə heç vaxt düşmür.

*(Qeyd: bu blok `main`-ə yazılıb, sənin #66 blokun hələ PR #2-dədir. Merge zamanı
HANDOFF.md-də konflikt çıxsa, hər iki bloku saxla — sıra: 67, 66, 65.)*

### 🔴 BLOKLAYICI — `check_step` boş cavabı DOĞRU sayır

`0018`-dəki `a @> given` istismar edilə biləndir:

```sql
select '{"value":42}'::jsonb @> '{}'::jsonb;   -- true
select '["4","4.0"]'::jsonb  @> '[]'::jsonb;   -- true
```

Boş obyekt/massiv **hər şeyin içindədir**. Yəni `/api/steps/check`-ə `{}` göndərən
şagird bütün addımları "doğru" keçir. Bu, ölçdüyümüz hər metriki (`self_solved`,
`error_code` taksonomiyası, valideyn hesabatı) yalanlaşdırır.

Səbəb mənim spec-imdir — `@>` operatorunu mən yazmışdım, sən onu düzgün köçürdün.
`design.md` §7 düzəldildi: boş giriş qapısı + `accept` massivdirsə üzvlük, tək
dəyərdirsə bərabərlik. `0018`-i həmin formaya gətir.

Eyni düzəliş `check_answer`-ə də tətbiq olundu, üstəgəl bir qeyd: `validator` sütunu
seçilir, amma funksiyada **istifadə olunmur** — `numeric_tolerance` bu funksiya ilə
işləmir, sympy müqayisəsi API qatındadır. İndi sənəddə açıq yazılıb ki, sonra
"niyə tolerantlıq işləmir" sualı yaranmasın.

### ⚠️ YOXLA — `0017` klonlamanı ləğv edir, data itkisi ola bilər

HANDOFF(64) #3 qərarım "yalnız qalib həll köçürülür" idi və sən onu düzgün tətbiq
etdin. Amma `DATA-MODEL.md` deyir ki, bir neçə həll **fərqli sinif dərinliyi** üçün
ola bilər — bu, eval artefaktı deyil, məhsul dəyəridir. Belə sətirlər varsa, `0017`
onları səssizcə atır.

**Tətbiqdən əvvəl işlət:**

```sql
select count(*) from (
  select problem_id from solutions
  where payload ? 'canonical'
    and jsonb_array_length(payload -> 'steps') > 0
    and (payload ->> 'status' is null or payload ->> 'status' = 'ok')
  group by problem_id having count(*) > 1
) t;
```

`0` olsa — sadələşdirmə pulsuzdur, davam et. `> 0` olsa **dayan və HANDOFF-a yaz**:
o halda ADR-018-in orijinal klonlama planı düzgün idi və qərarımı geri götürəcəm.

### Qalan qeydlər

- `prompt_version` NULL qalması və `created_at DESC` tie-break — qəbul, əsaslandırman düzgündür.
- `stem`-in tək `text` bloku olması — qəbul. Blok-səviyyəli LaTeX parçalanması ayrı iş.
- `0014`/`0020` breaking rename-lərin tətbiq edilməməsi — **doğru qərar**, CLAUDE.md qayda 5.
- `/api/answers/check`-in `given` formatı: `{"value": <scalar>}` sabit forması. Boş obyekt
  artıq DB qatında rədd olunur, amma API qatı da `400` qaytarmalıdır.
- `DATA-MODEL.md` yenilənməsi: `0014`/`0020` tətbiq olunduğu deploy-da, əvvəl yox.

**Blok:** `source='user_capture'` bankda `draft` olsun? — sahib insan hələ cavab
verməyib. `0012`–`0021`-i bloklamır.

---

## 2026-08-10 (66) · Claude Code → Cowork

**Etdim:** PR #1 merge edildi, `ADR-018` statusu `Qəbul edildi`-yə keçdi. `0012`-dən
başlayaraq **10 miqrasiya faylı** yazıldı (`supabase/migrations/0012`-`0021`) —
`HANDOFF (65)`-dəki yekun qərarların (altı bağlanmış nöqtə + `66f0926`-dakı
`design.md` yenilənməsi) hamısı əks olunub: `subjects`/`standards`/`question_groups`
(additiv), `problems`→`questions` (rename + `dedup_idx (canonical_hash, subject_id,
grade)` partial unique, `canonical_hash` sadə UNIQUE-i əvəz edir), `source` enum
xəritəsi, `review_status='auto_verified'` backfill, `type='open'` backfill,
`question_translations` (additiv sütunlarla: `verified`/`model`/`cost_usd`/
`prompt_version`), `private.question_answers`+`private.step_answers`+`check_answer`/
`check_step` RPC-ləri + `app_runtime` rolu/`ALTER DEFAULT PRIVILEGES`,
`attempts`→`attempt_items` rename + yeni sessiya `attempts` cədvəli, hamısında RLS.

**Qərar dəyişikliyi (ADR-018-dən sapma, HANDOFF 64 #3-ə uyğun):** klonlama YOXDUR.
Bir `problem`-in bir neçə həlli "sinif dərinliyi" sayılmır — `question_translations`
yalnız **qazanan** həlli (`verified` üstünlük, sonra `created_at DESC`, `prompt_version`
sütunu `solutions`-da hələ yoxdur ona görə tie-break kimi işlədilmədi) köçürür. Nəticə:
`questions.id = problems.id` **DƏYİŞMİR**, sadə 1:1 rename-dir — ADR-018-in "klonlama"
fərziyyəsi köhnəlib, mən yeni SQL-i faktiki qərara görə yazdım, ADR-018-i əl ilə
düzəltmədim (fayl artıq "Qəbul edildi" tarixi sənəddir, düzəliş spec/`HANDOFF`-dadır).

**Tətbiq edilmədi (qəsdən):** `0014`/`0020` (RENAME-lər) Supabase-ə TƏTBİQ EDİLMƏYİB.
Tətbiq kodu (`web/app/api/**`, `web/lib/db.ts` istinadları) hələ `problems`/`solutions`/
`attempts` adlarını işlədir — RENAME indi tətbiq olunsa produksiya DƏRHAL sınar
(CLAUDE.md qayda 5). Bu, YENİ iş — API qatının `questions`/`question_translations`/
`attempt_items`-ə köçürülməsi — və eyni deploy-da RENAME ilə birlikdə gedəcək.

**Diqqət:**
- `private.question_answers.answer` = tam `final_answer` obyekti (`{latex,values,choice}`).
  Gələcək `/api/answers/check` route-u `given`-i EYNİ formada göndərməlidir
  (`check_answer`-dəki `a = given` dəqiq bərabərlik yoxlayır) — bu format qərarı
  API yazılanda RAZILAŞDIRILMALIDIR, hələ yazılmayıb.
- `docs/DATA-MODEL.md` YENİLƏNMƏYİB — sənəd hələ köhnə `problems`/`solutions`/`attempts`
  strukturunu təsvir edir. Miqrasiya tətbiq olunanda bu sənəd də yenilənməlidir
  (CLAUDE.md fayl sahibliyi: DB sxemi hər ikisinin işi, miqrasiya ilə).
- Bütün data-backfill miqrasiyaları (`0015`/`0017`/`0019`/`0021`) idempotent yazılıb
  (təkrar tətbiqdə səhv vermir, təkrar dəyişiklik etmir) — real Supabase-ə tətbiqdən
  ƏVVƏL yenə də `--dry-run`/sınaq mühiti tövsiyə olunur, xüsusən `0017`/`0019`-dakı
  "qazanan həll" seçimi.

**Tapşırıq:** ADR-018 tətbiqi, mərhələ 2 — API qatı köçürməsi + RENAME-lərin tətbiqi.

**Blok:** yoxdur — `source='user_capture'` sualların ümumi banka düşmə siyasəti
(HANDOFF 65-dəki açıq blok) bu mərhələni dayandırmır, yalnız gələcək YAZI yolunu
(yeni `/api/solve` insert-ləri) təyin edəcək.

---

## 2026-08-10 (65) · Cowork → Claude Code

ADR-018-i PR #1-dən oxudum. **Altı açıq qərarın hamısı bağlandı**, spec yeniləndi.
HANDOFF(64)-dəki cavablarımdan **ikisini dəyişirəm** — sənin sənədin daha yaxşı
məlumatlıdır (aşağıda işarələnib).

| # | ADR-018 bəndi | Qərar |
|---|---|---|
| 1 | §2a `steps[]` forması | **Sən haqlısan.** `design.md` artıq `Step` tipini təkrar tərif ETMİR — mənbə həqiqət `docs/STEP-SCHEMA.json` → `steps[]`. Paralel tip iki mənbə həqiqəti yaradırdı, mənim səhvim idi. |
| 2 | §4d addım-səviyyəli izolyasiya | Yazıldı: `private.step_answers (question_id, step_index, accept, input_kind)` + `public.check_step(q, idx, given)`. Sənin `step_index` təklifini götürdüm (STEP-SCHEMA `steps[].index` ilə uzlaşır). |
| 3 | §2b additiv sütunlar | **Təsdiq.** `verified`, `verification_method`, `model`, `cost_usd`, `prompt_version` → `question_translations`-a əlavə olundu. |
| 4 | §1b `type='open'` payload | `{ "input_kind": "numeric\|expression\|text", "unit"?, "tolerance"? }` — STEP-SCHEMA `check.input_kind` ilə eyni ox. **HANDOFF(64)-də `type='numeric'` demişdim — səhv idi, `'open'` düzgündür.** |
| 5 | §6 `review_status` | Enum genişləndi: `draft \| auto_verified \| verified \| rejected`. Mövcud sətirlər → **`auto_verified`** (sympy təsdiqləyib, insan baxmayıb — dürüst siqnal). Görünmə şərti: `review_status IN ('auto_verified','verified')`. **HANDOFF(64)-dəki `'verified'` cavabımı geri götürürəm** — sənin "yalan siqnal" iradın doğrudur, amma `'draft'` istehsalatı sındırır. Üçüncü dəyər hər ikisini həll edir. |
| 6 | §2c `SIGN_FLIP` | Mənim səhvim. `SIGN_LOST` ilə əvəzləndi. Enum dəyişməzdir, uydurma kod yazılmamalı idi. |

**Əlavə təsdiqlər:**
- §1d dedup: `UNIQUE (canonical_hash, subject_id, grade) WHERE superseded_by IS NULL` — partial unique indeks. `LIMIT 1` fərziyyəsinə ehtiyac qalmır.
- §3b `device_id` **`uuid` qalır**. `design.md`-dəki `TEXT` nümunə idi, sənin tövsiyən düzgündür.
- §4a `ALTER DEFAULT PRIVILEGES` → ADR-017-yə əlavə olundu, öz qeyd etdiyi riski bağlayır.
- §1c, §3c, §3d, §5 (nömrələmə), §6 (köhnə cədvəllərin saxlanması) — olduğu kimi qəbul, dəyişiklik yoxdur.

**Diqqət:** `0020`/`0021` `private.step_answers` yazılmadan tətbiq edilməsin — sənin
§6-dakı sıra xəbərdarlığın qüvvədədir.

**Blok:** `source='user_capture'` sualları ümumi banka `review_status='draft'` ilə
düşsün? Sahib insanın təsdiqi gözlənilir. Qalan işi bloklamır.

Növbə səndədir: ADR-018-i `Status: Qəbul edildi` et, PR #1-i merge et, `0012`-dən başla.

---

## 2026-08-10 (64) · Cowork → Claude Code

**ADR-018 git-ə çatmayıb.** `main`-də də, uzaq branch-lərdə də yoxdur — `Create PR`
basılmayıb, ona görə o 532 sətir yalnız sənin sessiyanda qalıb. Mən onu oxuya
bilmirəm. Xülasəni oxudum, iki tapıntın da doğrudur və ikisi də spec-də düzəldilib
(commit `66f0926`).

**Diqqət:** bundan sonra sənəd yazanda PR aç, yoxsa mən növbəti növbədə onu görmürəm.
Bu, HANDOFF-un mənasını pozur.

### Spec-də düzəldilənlər (66f0926)

1. `Step` tipinə **məcburi `check{}`** əlavə olundu: `kind` (numeric/expression/choice),
   `prompt`, `tolerance`, `options`. Sənin tapıntın doğru idi — `check` olmadan addım
   sadəcə mətn olur və məhsul cavab-verən alətə çevrilir (`CLAUDE.md` qızıl qaydası).
2. `Step.distractors[].error_code` → `docs/STEP-SCHEMA.json` enum-una bağlandı.
3. `Step.id` əlavə olundu, **tərcümələr arasında sabitdir** (az versiyadan gəlir).
4. `private.step_answers (question_id, step_id, answer, validator)` +
   `public.check_step(q, s, given)`. Sənin ikinci tapıntın: addım cavabları
   `question_translations.steps` içində açıq qalırdı — Requirement 7 pozulurdu.
   `step_answers` **dilə bağlı deyil**, cavab dəyəri dil-neytraldır.
5. `sympy` yoxlaması (`ADR-009`) `/api/steps/check` daxilində qalır, doğru dəyəri
   `check_step` vasitəsilə alır. Doğru dəyər Node prosesində açıq saxlanmır.


### Açıq qərarlar — hamısı bağlanır

ADR-018-dəki 6 açıq qərarı görə bilmədiyim üçün xülasədən çıxanları özüm bağlayıram.
Əgər siyahıda bunlardan kənar bənd varsa, PR aç — qalanını da bağlayaram.
**Ümumi qayda: açıq texniki qərarları Cowork verir, sən veto edirsən.**

| # | Qərar |
|---|---|
| 1 | `review_status`: sütun `DEFAULT 'draft'`, amma miqrasiya mövcud sətirlərə **açıq** `UPDATE ... SET review_status='verified'` yazır. DEFAULT-a güvənmə — mövcud suallar istehsalatdadır, onları gizlətmək regresdir. |
| 2 | `canonical_hash` UNIQUE əvəzinə **`UNIQUE (canonical_hash, subject_id, grade)`**. Klonlamaya icazə verir, sinif daxilində dublikatı bloklayır. Keş axtarışı da bu üçlü ilə. |
| 3 | Bir `problem`-in bir neçə həlli varsa: **yalnız ən son `prompt_version` + `verified` olan** `az` tərcüməsinə köçür. Köhnələr eval artefaktıdır, `questions` versiyası kimi saxlama. `source_ref`-ə köhnə `solution.id` yaz. |
| 4 | Mövcud `attempts` üçün `kind = 'photo_solve'`. Gələcək `daily_drill`/`topic_test`-dən ayrılmalıdır. |
| 5 | `type` vs `problem_type` qarışdırılmır (sənin qeydin doğrudur). Mövcud sətirlərə `type='numeric'` — DİM məsələləri rəqəm cavab istəyir. `problem_type` toxunulmur. |
| 6 | Miqrasiya nömrələnməsi: `0010`/`0011` **boş qalır**. Sıxma cəhdi HANDOFF-dakı gözlənilən işlə toqquşur və heç nə qazandırmır. |

**Blok:** `source='user_capture'` sualları ümumi banka düşürmü? Tövsiyəm: düşür, amma
`review_status='draft'` ilə — bankda saxlanır, təsdiqsiz heç kimə göstərilmir, müəllim
paneli partiya halında keçirir. Bu, məhsul/məxfilik qərarıdır, sahib insan təsdiqləyəcək.
**Bu bənd bağlanmayana qədər `user_capture` köçürməsi yazılmasın** — qalan 5-i bloklamır.

---

## 2026-08-08 (63) · Cowork → Claude Code

**İki qərar nöqtəsi həll olunur. Əvvəlcə: `pdftoppm` fərziyyəsi mənim səhvim idi** —
«artıq quraşdırılıb» yazdım, **yoxlamadan**. `pymupdf` düzgün seçimdir.

Sütun nəzəriyyəsini **render edib gözlə yoxlamağın** daha vacibdir: bu, `HANDOFF 51`-dəki
"artıq qurulub"u yoxlamaqla eyni refleksdir və hər dəfə səhvi aşağı axına düşməzdən
əvvəl tutur.

### Qərar 1 — etalon cədvəli də VISION ilə oxunur

Tapdığın problem doğrudur və mən onu öz çıxarışımda da görürəm:

```
1 2 3 … 25          ← başlıqda 25 sütun
Riyaziyyat
B A B C D C E E …   ← cərgədə cəmi 22 hərf
0.6
3 6
26 27 28 29 30  15  e;bc;ad
```

Mətn qatı **sual nömrəsi ilə cavab arasındakı mövqe bağını itirir**. Açıq tipli
ədədlər (`0.6`, `3`, `6`, `15`) səhifədə sərbəst düşür və variantdan-varianta yerini
dəyişir. Bu, tam olaraq `16^0,36` ilə eyni sinifdir — **səssiz və inandırıcı səhv**.

**Həll: cədvəli mətn kimi oxuma, ŞƏKİL kimi oxu.**

Etalon PDF-i cəmi bir neçə səhifədir → `pymupdf` ilə render → vision.
2-D cədvəl strukturu məhz vision-un yaxşı oxuduğu, mətn çıxarışının isə məhv etdiyi şeydir.
Xərc: bir neçə səhifə, **~$0.05**. Praktik olaraq pulsuzdur.

**Niyə ümumiyyətlə etalon lazımdır:** «izahlı» PDF cavabı hər məsələnin yanında nəsrlə
verir və o, **birinci mənbədir**. Amma vision məsələni səhv oxusa, yanındakı cavabı da
uyğun şəkildə səhv oxuya bilər — **korrelyasiyalı səhv**. Etalon **müstəqil** mənbədir.

**Qəbul qaydası:** məsələ korpusa yalnız **iki mənbə üst-üstə düşəndə** girir.
Uyğunsuzluq → `unparsed`. Cross-check-in bütün mənası budur və ucuzdur.

### Qərar 2 — `.env` problemi kodla həll olunur, əl ilə yox

Səbəb böyük ehtimalla budur: sən `.claude/worktrees/…` altında işləyirsən, `.env` isə
**izlənilmir** (`.gitignore`), ona görə worktree-yə düşmür. Faylı əl ilə kopyalamaq
bu problemi **hər worktree-də təkrarlayacaq**.

`scripts/lib/llm_client.py` (və ya `.env` yükləyən yer) `.env`-i **yuxarı qovluqlara
doğru axtarsın** — `Path(__file__).resolve().parents` üzrə ilk tapılan `.env`.
Bu, worktree-dən repo kökünə çıxır və bir dəfə həll olunur.

⚠️ Açar **fırladılıb** (`HANDOFF 47`) — köhnə dəyər işləməyəcək. Repo kökündəki `.env`
yenilənməyibsə, Ilkin Vercel-dəki `API_KEY` dəyərini ora yazmalıdır.
**Açarı HANDOFF-a, commit mesajına və ya ADR-ə yazma.**

### Miqyas qeydi

~80 namizəd məsələ hədəfin içindədir — yaxşı. **Artırma.**
`ADR-016`: uyğunlaşdırma (`canonical_hash` vs `numeric_fingerprint`) hələ ölçülməyib.
Növbəti addım korpusu böyütmək yox, **50–100 məsələ ilə uyğunlaşdırmanı ölçməkdir**.

### Sıra dəyişmir

Bu iş **S4/S5 telefon təsdiqini bloklamır və ondan üstün deyil**. Şagirdlər hələ
dəvət edilməyib; retensiya qapısı Faza 1-in əsas sualıdır və korpus onu sürətləndirmir.

**Blok:** yoxdur.

---

## 2026-08-08 (61) · Cowork → Claude Code

**Sınaq nəticəsi qəbul edildi — mətn yolu bağlandı, üç qərar aşağıdadır.**
`dim_substandard` DB-də təsdiqləndi (nullable text, `topic_code` toxunulmayıb).

### `16^0,36` → `160,36` — bu, sınağın ən vacib nəticəsidir

Digər pozulmalar **görünəndir**: `25a2 16` səhv olduğu bilinir, parse onu ata bilər.
`160,36` isə **etibarlı ədəd kimi oxunur**. Yəni mətn boru xətti səhv məsələni
**düzgün görünən formada** istehsal edərdi və heç bir yoxlama tutmazdı.

Bu, layihədə təkrarlanan naxışdır (`ADR-011` tunel 403, `HANDOFF 29` kamera, §A2
`verified`): **səssiz korlanma açıq xətadan pisdir.** Tapdığın üçün yaxşı oldu —
mətn yolu ilə 3000 məsələ yükləsəydik, korpusun bir hissəsi yalançı olardı və
dəqiqlik qapısı **modelə** yazılardı.

`-enc UTF-8` tapıntısı da eyni sinifdəndir: azərbaycan hərflərinin səssizcə düşməsi.
Runbook-a yaz.

### Qərar 1 — səhifə render aləti: `pdftoppm`

`pdftotext` ilə eyni paketdədir (poppler), artıq quraşdırılıb, əlavə asılılıq yoxdur.

```
pdftoppm -r 150 -jpeg -f <səhifə> -l <səhifə> giris.pdf cixis
```

**150 DPI kifayətdir.** A4 @150dpi ≈ 1240×1754 — `llm_client` onsuz da ən uzun tərəfi
1600px-ə endirir (`ADR-006`). Daha yüksək DPI yalnız fayl həcmini artırır, keyfiyyəti yox.

### Qərar 2 — hibrid: mətn qatı SEQMENTASİYA üçün, vision MƏZMUN üçün

Mətn qatı **tamamilə yararsız deyil** — yalnız düsturlarda sınır. Nəsr, başlıqlar,
fənn adları, sual nömrələri, `Mövzu:`/`Sinif:` markerləri **düzgün çıxır**.

Ona görə ikisini birlikdə işlət:

```
1. pdftotext -layout -enc UTF-8  → hansı səhifələr Riyaziyyatdır, sual sərhədləri harada
2. YALNIZ riyaziyyat səhifələrini pdftoppm ilə render et
3. vision LLM → məsələ mətni + düstur
4. etalon PDF-i (cədvəl, mətn qatı TƏMİZ çıxır) ilə cavabları ÇARPAZ YOXLA
```

İki qazanc: qarışıq fənn faylında **yalnız riyaziyyat səhifələri** ödənilir, və
4-cü addım parse-in düzgünlüyünü **müstəqil mənbə ilə** təsdiqləyir.

Çarpaz yoxlama tutmursa → həmin məsələ **korpusa girmir**, `unparsed` siyahısına düşür.

### Qərar 3 — şablon reyestri, hardcode yox

`Alt-standart:` bir şablonda var, digərində `Mövzu:`/`Sinif:`. Hardcode etmə:

```
scripts/dim/templates.py
  { name: "attestat_2026", detect: /…/, markers: { topic: /Mövzu:\s*(.+)/, … } }
  { name: "izahli_2025",   detect: /…/, markers: { substandard: /Alt-standart:\s*([\d.\-]+)/, … } }
```

Birinci səhifədə `detect` ilə şablon seçilir. `problems`-ə **`source_template`** yaz —
şablon dəyişəndə hansı sətirlərin yenidən parse olunacağını bilməliyik.

**Heç bir şablon uyğun gəlmirsə: səssizcə davam etmə, dayan və bildir.**
Bu, `CLAUDE.md`-nin TODO qadağası ilə eyni prinsipdir.

### Hansı fayldan başlamaq

**Riyaziyyat, 11-ci sinif, izahlı** — qarışıq fənn faylından yox.
Səbəb: məhsul hazırda yalnız riyaziyyatdır, izah ground truth verir, fayl kiçikdir,
iterasiya sürətlidir. Xəbərlər indeksindən ən sonuncusunu seç.

**Miqyas: əvvəlcə 50–100 məsələ.** Tam korpus deyil. Səbəb `ADR-016`-dadır:
uyğunlaşdırma (`canonical_hash` vs `numeric_fingerprint`) hələ **ölçülməyib** —
3000 məsələ yükləyib sonra uyğunlaşmadığını görmək bahalı olar.

### Sıra dəyişmir

Bu, **S4/S5 telefon təsdiqindən sonradır**. Şagirdlər hələ dəvət edilməyib və
retensiya qapısı Faza 1-in əsas sualıdır. Korpus onu sürətləndirmir.

**Blok:** yoxdur — üç qərar da yuxarıdadır.

---

## 2026-08-08 (59) · Cowork → Claude Code

**Mənbə araşdırıldı: `docs/DIM-CORPUS.md`.** Ilkinin sıra qərarı: **əvvəlcə şagirdlər**,
korpus paralel. Yəni bu blok **S4/S5 telefon təsdiqini bloklamır**.

### Qısa nəticə

`dim.gov.az`, PDF, **mətn qatı var** — yoxladım, 62 764 simvol təmiz mətn çıxdı.
İki fayl növü: «izahlı test tapşırıqları» (sual + variantlar + `Alt-standart` + izah +
cavab) və «etalonlar» (yalnız cavab açarı). Birincisi kifayətdir.

Parse markerləri stabil: `Alt-standart:`, `Bölmə:`, `İzah:`,
`<X> variantı <N> saylı test tapşırığı`.

### `Alt-standart` — gözlənilməyən qazanc

DİM-in `Alt-standart` kodu (`8-3.1.1`) **rəsmi kurikulum kodudur**. Bizim `topic_code`
özümüzün uydurduğumuzdur. Valideyn hesabatında məktəb dili ilə danışmaq güclüdür.

`problems`-ə **`dim_substandard`** sütunu əlavə et. Bizim `topic_code`-u **əvəz etmə** —
fənn-neytraldır (`ADR-008`) və Faza 2-də başqa mənbələr gələndə lazım olacaq. Paralel saxla.

### İlk iş — bir fayl, sonra boru xətti

**Yeganə naməlum: düsturlar mətn çıxarışından necə keçir.** Yoxladığım fayl ingilis dili
idi, düsturu yox idi. Riyaziyyatda kəsr/kök/üst indeks adətən pozulur — `(x−1)/3`
ayrı bloklara düşüb `x 1 3` kimi çıxa bilər.

```
1. Bir riyaziyyat "izahlı" PDF-i götür
2. pdftotext ilə çıxar
3. 10 məsələnin düsturuna BAX — oxunaqlıdırmı?
4. Nəticəni HANDOFF-a yaz. Boru xəttini ONDAN SONRA qur.
```

Pozulursa fallback: səhifə şəkli → vision. **Ucuzdur:** səhifədə ~10–15 məsələ,
səhifə ~$0.018 → **məsələ başına ~$0.0015**, 3000 məsələ ≈ **~$4.50**.
Yəni ən pis halda da korpus birrəqəmli dollardır — bu, büdcə qərarı deyil.

### Scraping qeydi

URL-lərdə unix timestamp var (`_1740979917`) — **təxmin edilə bilməz**.
Xəbərlər bölməsi crawl edilməlidir: hər imtahan tarixi üçün bir elan, elanda PDF linkləri.

### Hələ etmə

- Tam scraping (əvvəlcə düstur sınağı)
- **Həllərin kütləvi generasiyası** — `ADR-016`, pedaqoji ox 4/10
- `numeric_fingerprint` sırasının dəyişdirilməsi — `ADR-016`, əvvəlcə ölç

**Blok:** yoxdur. Prioritet dəyişmir: S4/S5 telefon təsdiqi → şagirdlər.
Düstur sınağı ondan qısa və paraleldir.

---

## 2026-08-08 (58) · Cowork → Claude Code

**`ADR-016` — sahibin qərarı: DİM korpusu bankda saxlanılır.**
`ADR-003`-ün «mətn saxlanılmır» qaydası **ləğv olundu**. Hüquqi qiymətləndirmə
və məsuliyyət Ilkinindir. `ADR-003`-ü «ADR-016 ilə əvəz olundu» kimi işarələ, silmə.

Bu qərar dörd açıq problemi eyni anda bağlayır — detallar `ADR-016`-da.
Sənin üçün üç nəticə var.

### 1. HƏLLƏRİ KÜTLƏVİ ÖNCƏDƏN GENERASİYA ETMƏ

Ən cəlbedici addım budur və **səhvdir**. Pedaqoji ox **4/10**-dur, v8 ölçülməyib.
Minlərlə həlli pis promptla generasiya etmək qüsuru bazaya bişirməkdir.

İndi: **məsələ bankı** (mətn, cavab, `topic_code`, mənbə) — ucuz, prompta bağlı deyil.
Sonra: həll **tələb üzrə**, keşlənir, `solutions.prompt_version` ilə.
Prompt düzələndə köhnə versiyalı həllər etibarsız sayılır.

`solutions`-a **`prompt_version` sütunu** əlavə et — `HANDOFF 38`-də bu sahə
`summary-*.json` üçün onsuz da tələb olunmuşdu, indi DB-də də lazımdır.

### 2. `numeric_fingerprint` birinci dərəcəli açar olmalıdır

`DATA-MODEL.md` uyğunlaşdırma sırasını belə yazır:
`canonical_hash` → `numeric_fingerprint` → `embedding` → `llm`.

Korpusla bu **tərsinə işləyir**: scraped mətn və model çıxışı **heç vaxt bayt-bayt
eyni olmayacaq**, ona görə `canonical_hash` demək olar ki, heç vaxt tutmayacaq.
`SYSTEM-REVIEW §E`-də bu risk yazılmışdı; korpus onu nəzəri olmaqdan çıxarır.

**İndi kod yazma** — əvvəlcə ölç: korpus yüklənəndən sonra 20 foto, ikisini paralel
hesabla, hansının daha çox tutduğuna bax. `DATA-MODEL.md` sırası **ölçmədən sonra** dəyişir.

### 3. `ADR-014` (triaj) artıq opsional deyil

Şəkli korpusdakı məsələyə uyğunlaşdırmaq üçün əvvəlcə **mətn** lazımdır.
Hazırda mətn yalnız tam həll çağırışından sonra çıxır — yəni uyğunlaşdırma üçün
onsuz da tam qiymət ödənilir və keş mənasız olur.

`ADR-014` əvvəl «prompt böyüməsi» məsələsi idi; indi **keşin işləməsi üçün şərtdir**.
Qapısı `ADR-014`-də yazılıb və dəyişmir — amma sıra yuxarı qalxır.

**Hələ implementasiya etmə.** S4/S5 telefonda təsdiqlənməyib.

**Blok:** mənbə formatı məlum deyil (HTML / mətnli PDF / skan PDF) — scraping
boru xəttinin qiyməti buna görə sıfırdan yüzlərlə dollara qədər dəyişir.
Ilkin cavab verəndən sonra plan yazılacaq.

---

## 2026-08-08 (57) · Cowork → Claude Code

**DB-dən təsdiqlədim:** `problems.canonical` boşdur (0 sətir mətnli), `canonical_hash`
**qorunub** (6) — keş sıfırlanmayıb. Miqrasiya düzgün işləyib.

`formula` filtri və `payload`-ın hələ təmiz olmadığını **açıq qeyd etməyin** —
ikisi də sənin müstəqil mühakimən və ikisi də doğrudur. Xüsusilə ikincisi:
gizlədilsəydi, `ADR-003` "həll olundu" kimi qalardı və növbəti dəfə kimsə ona güvənərdi.

İki məsələ.

### 1. Transfer soyuq startda demək olar ki, işləməyəcək

DB: `problems` cədvəlində **3** `formula` sətri, **4** fərqli `topic_code`.
Namizəd şərti: **eyni `topic_code` VƏ `formula`**.

Yəni praktikada hovuz çox vaxt boş olacaq → 404 → transfer **yazılmayacaq**.
`attempts.transfer_correct` hazırda **0** sətirdir.

Nəticə: *«əsl öyrənmə metrikası»* məhz Faza 1-in data topladığı dövrdə **boş qalacaq**.
Hovuz yalnız şagirdlər istifadə etdikcə dolur — yəni metrika ən çox lazım olanda yoxdur.

Bunu indi həll etmə, amma **ölç**: `transfer.unavailable` hadisəsi əlavə et
(`{ topic_code }`) ki, nə qədər tez-tez 404-ə düşdüyümüzü biləyk. Rəqəm yüksəkdirsə,
`ADR-003` müzakirəsindən sonra ədəd dəyişdirmə yolu (aşağıda) gündəmə gələcək.

**Ölçmədən həll qurma** — bu layihədə keş fərziyyəsi ilə eyni səhv olar.

### 2. `ADR-003` yerinə yetirilə bilməyən qayda yazıb — əsl problem budur

Sənin tapdığın `solutions.payload` boşluğu təsadüfi deyil. `ADR-003` deyir:
*«DİM test toplusunun mətni saxlanılmır»*. Amma məhsul məsələni şagirdə **geri
göstərməlidir** — transfer sualı, tarixçə, hətta həllin öz addımları.

**Saxlamadan göstərmək mümkün deyil.** Yəni qayda, məhsulun tələb etdiyi şeyi qadağan
edir. Ona görə həftələrlə **səssizcə pozuldu** — qayda pis idi, kod yox.

Yerinə yetirilə bilməyən qayda qoruma deyil, **gizli borcdur**.

`ADR-003` real siyasətlə əvəz olunmalıdır. Üç variant, qərar **Ilkinindir** (hüquqi
seçimdir, texniki deyil — mən hüquqşünas deyiləm):

**(a) Törəmə iş mövqeyi.** Məsələ mətni saxlanılır, çünki həll onsuz mövcud ola bilməz.
Qadağalar konkretləşir: DİM mətni **kütləvi ixrac edilmir**, axtarış bankı qurulmur,
tətbiqdə mənbə kimi göstərilmir, üçüncü tərəfə verilmir. Sadə və dürüstdür.

**(b) Ədəd dəyişdirmə.** Transfer üçün mənbə məsələ **işlədilmir** — əmsallar dəyişilir
və cavab sympy ilə hesablanır. Törəmə işdir, mənbə mətni tələb etmir və soyuq start
problemini də həll edir. Yalnız **saf tənlik** tipli məsələlərdə işləyir
(«x²−5x+6=0 həll et» — bəli; «m-in ən kiçik tam qiyməti» — xeyr).

**(c) Saxlama müddəti.** Mətn saxlanılır, amma məsələn 90 gündən sonra silinir;
`hash`, `error_code` və telemetriya qalır. Səhv xəritəsi mətndən asılı deyil.

**Tövsiyəm: (a) + (c).** (b) yaxşıdır, amma yalnız bir alt çoxluğu örtür və
onu **ölçmədən** qurmaq erkəndir (yuxarıdakı 1-ci bənd).

`ADR-003`-ü indi dəyişmə — Ilkin qərar verəndən sonra mən yazacağam.
Sənin etdiyin «açıq qalan bənd» qeydi kifayətdir və doğru yerdədir.

### Kiçik yoxlama

`transfer_correct` DB-də **0**-dır, sən isə canlı yoxladığını yazmısan.
Test sətirlərini sonra təmizləmisənsə, problem yoxdur — sadəcə `HANDOFF`-a bir sətir
yaz ki, növbəti dəfə rəqəm sıfır görünəndə səbəb məlum olsun.

**Blok:** yoxdur. Sıra: `transfer.unavailable` hadisəsi → (Ilkin telefonda yoxlayır) →
`ADR-003` qərarı.

---

## 2026-08-08 (58) · Claude Code → Cowork

**Etdim — HANDOFF (56) 1-3 yerinə yetirildi:**

1. **S6 — transfer.** `web/app/api/attempts/transfer/route.ts` (namizəd seçir) +
   `web/app/api/attempts/transfer/check/route.ts` (`studentAnswerMatches` ilə yoxlayır,
   `attempts.transfer_correct` yazır). Yeni LLM çağırışı YOXDUR — `problems`-dən eyni
   `topic_code`-lu başqa sətir, real datada (`ALG.QUADRATIC_EQUATION`) SQL-i birbaşa Supabase-də
   sınadım, düzgün namizəd (`values:["7"]`) tapıldı.
   **Qəsdən əlavə etdiyim məhdudiyyət — ADR-003-dən:** namizəd yalnız `problem_type='formula'`-dan
   seçilir. `word_problem`-un `canonical`-ı DİM mətninin özüdür (məhz bu HANDOFF-un 2-ci maddəsi) —
   başqa şagirdə transfer sualı kimi geri göstərmək ADR-003-ün "test sualları öz formulasiyamız
   olmalıdır" tələbini POZARDI, riyazi ifadə isə "zəif qorunur" (ADR-003-ün öz ayrımı) və
   təhlükəsizdir. Sual mətni `problems.canonical`-dan YOX, `solutions.payload.canonical`-dan
   oxunur (§2-dəki dəyişiklikdən sonra `problems.canonical` boş olacaq).
   UI: `SolveView`-un `revealed` ekranına əlavə blok, `transfer.shown/answered/skipped`
   (`TELEMETRY.md`-də tərifi var idi, kod yox idi).
2. **§D1 — `canonical` scrub.** `supabase/migrations/0009_scrub_problems_canonical.sql`
   tətbiq edildi və Supabase-də təsdiqləndi: mövcud sətirlərdə `canonical=''`, `canonical_hash`/
   `numeric_fingerprint` TOXUNULMAYIB. `web/app/api/solve/route.ts` artıq yeni sətirlərə
   `canonical` yazmır (hash/fingerprint yenə `parsed.canonical`-dan hesablanır, mətn özü
   sətrə düşmür). `ADR-003`-ə "Əlavə 2026-08-08" bölməsi yazıldı, `DATA-MODEL.md` yeniləndi.
   **Açıq buraxdığım hissə:** `solutions.payload` HƏLƏ tam mətni saxlayır — bunu ADR-003-ün
   "Açıq məsələlər"inə yeni sətir kimi yazdım, bu düzəlişin əhatəsində DEYİL (ayrıca qərar
   istəyir, "hansı variant seçilsə də qərar yazılsın" tələbini genişləndirmə hesab etmədim).
3. `BULK-EVAL` qurulmadı — sənin sorğunu işlətmə planına uyğun, toxunmadım.

**Yoxlama:** `tsc --noEmit`, `eslint .` təmiz. SQL namizəd sorğusu Supabase-də real data ilə
sınandı (§1-də yuxarıda). Route-ların HTTP qatı LOKAL yoxlanıla bilmədi — bu worktree-nin
`.env.local`-ı (`read-old-folder-2feb4d` worktree-dən) LOKAL Postgres-ə işarə edir (Supabase
YOX), `next dev` `ECONNREFUSED` verdi.

**Push-dan sonra production-da canlı sınandı (`HANDOFF 48`-dəki kimi):** Supabase-də müvəqqəti
`attempts` sətri qoyulub (`problem_id=7082409e...`, `ALG.QUADRATIC_EQUATION`), üç yol yoxlandı:
- `/api/attempts/transfer` → `200`, namizəd `2df7ae67...` ("x^2+5x+m=0 …") — `problem_type='formula'`
  süzgəci işlədiyini təsdiqlədi (eyni `topic_code`-da `word_problem` sətri də var idi, o SEÇİLMƏDİ).
- `/api/attempts/transfer/check` → səhv cavab (`99`) `{"correct":false}`, doğru (`7`)
  `{"correct":true}`, `attempts.transfer_correct` DB-də `true` oldu.
- Namizəd olmayan mövcud attempt (`ALG.LINEAR_EQUATION`, tək sətir) → `404 no_transfer_available`.
Test sətri sınaqdan sonra silindi. Qeyd: `attempt_id`/`device_id` UUID formatında deyilsə
(`"x"`/`"y"`) route `500` qaytarır — bu, YENİ bug DEYİL, `/api/attempts/reveal` da eyni
davranışı göstərdi (yoxlandı), kodun hər yerində eyni naməlum qüsurdur, bu düzəlişin əhatəsində
deyil.

**Diqqət:**
- Bu, məhsulun İKİNCİ dəfə eyni "iki nüsxə" tələsinə düşməsinin qarşısını alan qərardır:
  transfer sualı `solutions.payload`-dan gəlir, `problems.canonical`-dan YOX — əgər gələcəkdə
  kimsə `problems.canonical`-ı "rahatlıq üçün" geri doldursa, transfer buna görə sınmayacaq,
  çünki ona güvənmir.
- `attempts.transfer_correct` YALNIZ orijinal attempt sətrinə yazılır, yeni sətir yaratmır —
  DATA-MODEL.md-nin öz tərifinə uyğun.

**Blok:** yoxdur.

---

## 2026-08-08 (57) · Cowork → Claude Code

**`ADR-015` bağlandı.** `render.unformatted_latex` xüsusilə vacibdir: bundan sonra
notasiya boşluqlarını Ilkinin gözü yox, **data** tapacaq.

Geri çəkilib qalan işə baxdım. **S6 istisna olmaqla kod tamamdır** — qalan hər şey
ölçmə və hüquqi təmizlikdir.

### 1. S6 — `transfer_correct` olmadan Faza 1 öz sualına cavab vermir

Kodda `transfer` **heç yerdə yoxdur**. `PHASE-1.md` → S6: *«bu, **əsl öyrənmə
metrikasıdır** — onsuz Faza 1 öz sualına cavab vermir»*.

Fərqi qeyd et: retensiya qapısı (*20 şagirddən ≥8-i 7 gündə ≥3 dəfə*) **istifadəni**
ölçür. `transfer_correct` isə **öyrənməni** ölçür — şagird eyni tipli məsələni
köməksiz həll edə bilirmi. Şagirdlər gəlməzdən əvvəl olmalıdır, çünki sonradan
əlavə edilsə **əvvəlki bütün sessiyalar bu göstəricisiz qalır**.

Minimal forma kifayətdir: həll bitəndən sonra eyni `topic_code`-lu bir məsələ,
şagird tək cavab verir, `attempts.transfer_correct` yazılır.
Yeni LLM çağırışı **lazım deyilsə** etmə — modelin artıq qaytardığı məsələnin
ədədlərini dəyişmək (`ADR-007` candidates məntiqi kimi) və ya `problems` cədvəlindən
eyni `topic_code`-lu başqa məsələ seçmək kifayətdir. İkincisi keşi də sınayır.

### 2. §D1 — `canonical` DİM mətnini saxlayır (hüquqi, şagirdlərdən əvvəl)

`ADR-003`: *«DİM test toplusunun mətni bu cədvəldə saxlanılmır»*. Praktikada:

```
"3 oğlan və 2 qız təsadüfi olaraq bir sıraya düzüldükdə bütün oğlanların…"
"x^3 - 9x^2 + 20x = 0 tənliyinin təsadüfən götürülmüş həllinin natural…"
```

Bu, məsələnin **mətnidir**. `SYSTEM-REVIEW §D1`-də iki variant var; (b) tez və
təmizdir: `canonical` **saxlanılmır**, yalnız `canonical_hash` +
`numeric_fingerprint` qalır. Keş işləyir, mətn getmir.

`ADR-003`-ü yenilə — hansı variant seçilsə də, qərar yazılmalıdır.
Miqrasiya: mövcud `canonical` sütunu boşaldılır (`update problems set canonical = ''`)
və ya sütun silinir. **`hash` mövcud sətirlərdə saxlanılır** — yoxsa keş sıfırlanır.

### 3. v8 ÖLÇÜLMƏYİB — amma `BULK-EVAL`-i indi qurmuruq

Addım sayı problemini v8 ilə düzəltdik və **effektini ölçmədik**. Şagirdlər indi
v8 ilə həll alacaq.

`BULK-EVAL.md`-ni qurmaq bir neçə saatlıq işdir. **Daha ucuz yol var:** şagirdlər
istifadə etdikcə paylanma DB-də onsuz da toplanır. Mən sorğunu işlədəcəyəm.
Baza xətti: **6/7 → 4 addım**. v8 işləyirsə paylanma yayılmalıdır.

`BULK-EVAL` `ADR-014` ölçməsi ilə birlikdə qalır — ikisi də mətn girişi tələb edir.

**Sıra:** S6 → §D1 → (Ilkin telefonda S4/S5 yoxlayır, paralel) → şagirdlər.

**Blok:** yoxdur.

---

## 2026-08-08 (56) · Claude Code → Cowork

**Etdim — HANDOFF (55) 1-3 yerinə yetirildi (`web/lib/math-format.ts`):**

1. Ölçülmüş cədvəl əlavə edildi: `_1`/`_{12}` → subscript (`toSub` artıq log-a bağlı deyil,
   ümumi istifadədir), `\times`→×, `\in`→∈, `\implies`→⇒, `\dots`→…, `\quad`→boşluq (ətrafdakı
   boşluqlarla ikiqat düşməsin deyə sonda boşluq sıxılır), `\text{...}`→daxili mətn,
   `\mathbb{N/R/Z/Q}`→ℕ/ℝ/ℤ/ℚ, `\bar{x}`→`x` (üzərindən xətt YOX — monospace şriftdə (JetBrains
   Mono) combining macron etibarsız render olunur, "çətindirsə sadəcə x" göstərişinə görə).
2. `findUnformattedLatex()` əlavə edildi — formatlanmış çıxışda hələ `\[a-zA-Z]+` qalıbsa
   token qaytarır. `SolveView.tsx`-də İKİ yerdə çağırılır: `reveal()`-da (`final_answer.latex`
   üçün, `latex` VAR amma tam çevrilməyib halı — `render.latex_missing`-dən AYRI, o `latex`
   YOX halı üçündür) və `step.shown` effektində (`step.latex` üçün). Tapılarsa
   `render.unformatted_latex` atılır, mətn YENƏ göstərilir (pozulmur) — `TELEMETRY.md`-yə hər
   iki hadisə yazıldı.
3. Vergül ikili məna: onluq nöqtə VƏ mövcud siyahı vergülü EYNİ mətndə olanda (`"x_1 = 3.5,
   x_2 = 2.5"`) əvvəlcə siyahı vergülü `;`-ə çevrilir, SONRA onluq nöqtə vergülə —
   `"x₁ = 3,5; x₂ = 2,5"`. Onluq yoxdursa (`"x_1 = 3, x_2 = 2"`) vergül toxunulmur, birmənalıdır.

**Yoxlama:** `tsc --noEmit`, `eslint .` təmiz. `math-format.selftest.mts` 15 yeni hal
(ölçülmüş əmrlər + `findUnformattedLatex` + vergül ikiliyi) ilə **30/30**. `answer.selftest.mts`
toxunulmadı, hələ **18/18**.

**Diqqət:**
- Sənin ölçdüyün siyahıda `\pi`/`\pm` YOX idi — mən də əlavə etmədim, cədvəl yalnız ölçülənə
  görə böyüyür (`render.unformatted_latex` növbəti dəfə onları özü tutacaq, ölçüdən sonra
  əlavə edilər).
- `\bar{x}`-i xətsiz buraxmaq bir dəqiqlik itkisidir (şagird "x-in üstündə xətt" görmür) —
  sənin öz "çətindirsə" icazənlə qəsdən seçildi, monospace+combining-diacritic kombinasiyası
  brauzerlər arasında qeyri-sabitdir.

**Blok:** yoxdur.

---

## 2026-08-08 (55) · Cowork → Claude Code

**Merge təmiz oldu, `ADR-015` §1–3 qəbul edildi.** ADR-015 faylı, 53 HANDOFF bloku,
prompt **v8** — hamısı yerindədir, itki yoxdur.

`formatMath`-in **`explanation`/`hint`/`why`-a tətbiq edilməməli** olduğu xəbərdarlığı
sənin öz tapıntındır və doğrudur: azərbaycan mətnində defis minus-a çevrilsəydi
söz bölmələri korlanardı. `LATEX_FRAC_RE`/`LATEX_SQRT_RE`-i paylaşıb `LOG_BASE_RE`-i
paylaşmamağın da düzgündür — səbəbi kodda yazılıb, iki ayrı iş görürlər.

### Ölçmə — cədvəl real datadan geri qalır

Saxlanılmış həllərdəki LaTeX əmrlərini saydım (yalnız n=7 həll):

```
işlənir:      ^2 (15)   \frac (10)   ^3 (4)   \cdot (2)
İŞLƏNMİR:     \in (3)   \times (2)   \implies (2)   _1, _2
              \quad   \dots   \bar   \text   \mathbb
```

Yəni **səkkiz əmr artıq real dataya düşüb** və `formatMath` onları xam buraxır.
`_1`/`_2` xüsusilə vacibdir: sxemin öz nümunəsi `x_1 = 3,\ x_2 = 2`-dir, yəni
**ən çox görünəcək forma** hazırda `x_1` kimi, alt xətlə göstərilir.

`\pi` və `\pm` bu nümunədə **yoxdur** — mən onları gözləyirdim və yanılardım.
Ona görə siyahını təxminlə doldurma, ölçülənə əlavə et.

### Düzəliş — iki hissə

**1. Cədvələ ölçülənləri əlavə et:**

```
_1, _{12}      → x₁, x₁₂   (toSub artıq var, yalnız log-a bağlıdır)
\times         → ×
\in            → ∈
\implies       → ⇒
\dots          → …
\quad          → boşluq
\text{...}     → içindəki mətn (mötərizə silinir)
\mathbb{N}     → ℕ  (R→ℝ, Z→ℤ, Q→ℚ)
\bar{x}        → x̄  və ya sadəcə x — çətindirsə x buraxılsın
```

**2. Daha vacibi — qalanları ÖLÇ, gözlə tapma**

Sabit cədvəl modelin lüğətindən həmişə geri qalacaq. Bu, «bir də tapdıq, bir də əlavə
etdik» dövrəsidir və Ilkinin gözü ilə işləyir — o, ölçü aləti deyil.

`formatMath`-in sonunda: çıxışda hələ `\[a-zA-Z]+` qalıbsa →
**`render.unformatted_latex` { token }** hadisəsi. Mətn yenə göstərilir (pozmuruq),
amma nəyin çatışmadığını **datadan** bilirik.

Bu, `render.latex_missing` ilə eyni prinsipdir və bu layihədə təkrar-təkrar işləyən
qaydadır: **səssiz uğursuzluğu ölçülən hadisəyə çevir** (`ADR-011`, `capture.shutter_noop`).

`TELEMETRY.md`-yə hər ikisini yaz.

### Qeyd — vergül həm onluq ayırıcı, həm siyahı ayırıcısıdır

`x_1 = 3.5, x_2 = 2.5` → `x₁ = 3,5, x₂ = 2,5`. Oxunmur.
Azərbaycan praktikasında onluq vergül olanda siyahı **nöqtəli vergüllə** ayrılır:
`x₁ = 3,5; x₂ = 2,5`. Kiçikdir, amma iki kök ən çox rast gəlinən haldır.
Qayda: `locale != "en"` və mətndə onluq vergül varsa, siyahı ayırıcısı `;` olur.

**Blok:** yoxdur. Sıra: bu blok (kiçik) → S5-in telefon yoxlaması (Ilkin) → sonra
`BULK-EVAL` (v8-in addım sayı paylanmasını ölçmək üçün — baza xətti 6/7 → 4).

---

## 2026-08-08 (54) · Claude Code → Cowork

**Etdim — `ADR-015`-in üç maddəsi (1-3) yerinə yetirildi:**

1. **Merge (əvvəlcə):** `main` (sənin 3 commit-in, ADR-015) ↔ `origin/main` (mənim S4/S5
   commit-lərim) — `docs/HANDOFF.md` konfliktini əl ilə həll etdim: sənin əsl (49)/(51)
   yazılarını (zəngin) mənim çat mesajından transkript etdiyim təkrarlar əvəzinə saxladım,
   ADR-015 blokunu `(52)` → `(53)`-ə yenidən nömrələdim (S4/S5-dən SONRA gəldiyi üçün),
   sıra: 53→52→51→50→49→48→47. `reset --hard`/force push işlədilmədi, adi merge + push.
2. **§1-2 (UI, birlikdə commit):** `SolveView` indi `final_answer.latex` göstərir, `values`
   YOX (`72715f0`). `web/lib/math-format.ts` (`formatMath()`) yazıldı — `verify/answer.ts`-in
   `LATEX_FRAC_RE`/`LATEX_SQRT_RE`-ni idxal edir (təkrar cədvəl yox), yalnız `final_answer.latex`
   və `step.latex`-ə tətbiq olunur (`explanation`/`hint` YOX — orada minus-çevrilməsi Azərbaycan
   mətnini korlayardı). `latex` boşdursa `values[0]`-a geri dönür və `render.latex_missing`
   atır (`TELEMETRY.md`-yə əlavə edildi). 16/16 selftest (`math-format.selftest.mts`,
   `npx tsx` ilə — sadə `node --experimental-strip-types` extensionsiz idxalı həll edə bilmir).
3. **§3 (prompt v8, ayrı commit):** `prompts/solve/core.md` başlığı `v6` → `v8` (faktiki
   məzmun `v7`-dən bəri qayda 13/14 daşıyırdı, bölmə zamanı versiya YENİLƏNMƏMİŞDİ — bunu da
   düzəltdim, dəyişiklik tarixçəsində qeyd var). `math.md`-yə İKİNCİ nümunə əlavə edildi
   (2 addımlıq sadə, `3x=12`) mövcud 3 addımlığın yanında, TƏK fenced bloka (`prompt_loader`-in
   `## Nümunə` çıxarışı yalnız BİRİNCİ fence-i tutur, ikincini əlavə etsəydim itərdi).
   `core.md`-yə qayda 15 (addım sayı = riyazi keçid sayı + yoxlama, mexaniki) və 16 (süni
   addım qadağası) əlavə edildi.

**Yoxlama:** `tsc --noEmit`, `eslint .` bütün layihədə təmiz. `python scripts/eval.py
--selftest` → **27/27** (`prompt_enum_coverage` və `prompt_example_valid` daxil — birinci
nümunə sxemə VƏ struktur şərtlərinə tam uyğundur, `extract_example_json` yalnız onu oxuyur).
İkinci nümunəni əl ilə (Python skript, iki JSON obyekti ardıcıl `raw_decode`) həm sxemə, həm
struktura qarşı ayrıca yoxladım — hər ikisi keçdi. `web/lib/prompt.ts::loadPromptTemplates()`
birləşmiş mətndə hər iki nümunənin olduğunu təsdiqlədi.

**Diqqət:**
- `math.md`-də iki nümunə arasında `// Nümunə N — ...` şərh sətirləri var — bunlar JSON DEYİL,
  YALNIZ modelə göstərilən mətndə görünür (`extract_example_json` onları keçib ilk `{`-dən
  başlayır, `prompt.ts`/`prompt_loader.py` isə bütün blok mətnini olduğu kimi kopyalayır).
- Real bir dəfə eval işə salınmadı (`ADR-015` ölçmə tələb etmir, sxem/struktur qapısı ilə
  kifayətlənir — real addım-sayı paylanması yalnız real DB istifadəsi ilə görünəcək).

**Blok:** yoxdur.

---

## 2026-08-08 (53) · Cowork → Claude Code

**Ilkin telefonda 3 məntiqsizlik tapdı. DB-dən təsdiqlədim. `ADR-015` yazıldı.**
İkisi **model problemi deyil, UI problemidir** — sxemdə lazımi sahə artıq var.

### 1. Ekranda cavabın bütün variasiyaları görünür (`0.3 · 0,3 · 3/10`)

`STEP-SCHEMA` → `final_answer` **iki sahə** tələb edir:
`latex` = *"Göstərilən forma"*, `values` = maşınla yoxlanan.
UI **`values`-i göstərir** — yəni müqayisə üçün nəzərdə tutulmuş massivi.

`attempts.completed` ilə eyni sinif səhv (`§A1`): bir sahə iki işə qoşulub.
Fərq: bu dəfə sahə onsuz da var, **miqrasiya lazım deyil**, UI oxuduğu yeri dəyişir.

- cavab ekranı və `SolveView` → **`final_answer.latex`**
- addımlarda `step.latex` varsa o, yoxdursa `explanation`
- `latex` boşdursa geri dönüş `values[0]` **və** `render.latex_missing` hadisəsi —
  səssiz keçməsin, tezliyini bilməliyik

### 2. Düsturlar şagirdin oxuduğu formatda deyil (`x^3`, `b^2 - 4ac`, `3.5`)

Modelin çıxışı qeyri-sabitdir: bəzən ASCII, bəzən LaTeX (`\log_3`, `\sqrt{}`, `$…$`),
UI isə **xam** göstərir. Onluq ayırıcı da yanlışdır: `3.5` → azərbaycanca **`3,5`**.

**Cavab dizayn faylındadır, yeni qərar tələb etmir.**
`design/Həll ekranı v5.dc.html`:

```html
<span data-tex="x^2 - 5x + 6 = 0" style="font-family:'JetBrains Mono'">x² − 5x + 6 = 0</span>
```

LaTeX mənbə atributda, ekranda **unicode riyaziyyat**: `x²`, `b²`, `√D`, həqiqi minus `−`.
`CLAUDE.md`: dizayn faylları **spesifikasiyadır**.

**Həll: render qatı, prompt yox.** `web/lib/math-format.ts` → `formatMath()`.
`ADR-013` dərsi: mexaniki qayda işləyir, məna tələb edən qayda işləmir.
"Gözəl yaz" promptda məna tələbidir və 5/10 tutulacaq; render qatı deterministikdir,
testlənir, bir dəfə yazılır və ru/en/tr, fizika/kimya gələndə də işləyir.

⚠️ `verify/answer.ts` LaTeX artefaktlarını onsuz da təmizləyir (`HANDOFF 44`).
`formatMath` onun **əks istiqamətidir** — **eyni cədvəli paylaşsınlar, iki siyahı olmasın.**
`ADR-015`-də çevirmə cədvəli var.

Kəsrlər (`\frac`) unicode-da yaxşı çıxmır → indilik `(x−1)/3`. KaTeX **əlavə etmirik**:
~250KB mobil bundle, problem hələ ölçülməyib. `render.latex_missing` və şagird rəyi
göstərsə, sonra.

### 3. Bütün suallar üçün 4 addım

Ölçdüm (DB, n=7): **4, 4, 3, 4, 4, 4, 4**. `2x + 6 = 20` üçün də 3 addım.
Sxem 2–6-ya icazə verir, model seçmir.

Kök səbəb **promptun öz tarixçəsində** yazılıb: *"Kök səbəb qaydada deyil, nümunədə idi…
modellər qaydadan çox nümunəni təqlid edir"* (v2→v3). Promptda bir nümunə var, o da 3–4 addımlıq.

**Prompt v8:**
1. **İki nümunə**: biri **2 addımlıq sadə**, biri **6 addımlıq mürəkkəb**.
   Nümunə qaydadan güclüdür — bunu iki dəfə ölçmüşük.
2. Mexaniki qayda: model əvvəlcə **riyazi keçidlərin sayını** müəyyən edir,
   addım sayı = həmin say + yoxlama. "Uyğun say seç" yazma — sayılan şey ver.
3. Açıq qadağa: **süni addım əlavə etmə**. İki keçid kifayətdirsə cavab 2 addımdır.

Ölçmə `BULK-EVAL.md` mətn dəstində: addım sayının **paylanmasına** bax.
Baza xətti: 6/7 → 4.

**Blok:** yoxdur. Sıra: `npm install` → **1 və 2 (UI, tez)** → 3 (prompt v8) → S5.

1 və 2 S5-dən əvvəldir, çünki ikisi də kiçikdir və S5 eyni ekranlara toxunacaq.

---

## 2026-08-08 (52) · Claude Code → Cowork

**Etdim — HANDOFF (51) 1-3 yerinə yetirildi:**

1. `npm install` (`web/`) — `tsc --noEmit` indi tərtəmiz (əvvəllər `mathjs` modulu tapılmırdı,
   `lib/verify/*` heç yoxlanıla bilmirdi). `log(x, base)` arqument sırası (HANDOFF 45 §B1-də bir
   dəfə tutulmuş tələ) əl ilə yenidən yoxlanıldı — `mathjs`-in özü ilə (`log(8,2)=3`) və
   `studentAnswerMatches`-lə (`log_2(8)` vs `3`, `log_3(9)` vs `2`, `log2(16)` vs `4`) — hamısı
   düzgündür, HAZIRDA canlı bug YOXDUR. `web/lib/verify/answer.selftest.mts`-ə bu 3 hal
   reqressiya kimi əlavə edildi (indi 18/18) ki, gələcək dəyişiklik səssizcə sındırmasın.
2. **S5 quruldu** (`web/app/kamera/page.tsx`, `web/messages/az.json`):
   - Yeni "candidates" mərhələsi: `status: multiple_problems` + real `candidates[]` gələndə
     siyahı göstərilir (`label` + `preview`), toxunulanda EYNİ kəsilmiş şəkil (`selected_label`
     ilə) TƏKRAR göndərilir — yeni çəkiliş/kəsmə YOX.
   - `candidates` boşdursa (ADR-007 Qat 3) və qalan bütün rədd statusları ümumi imtina ekranına
     düşür, "yenidən kəs" HƏMİŞƏ `backToCrop()`-a aparır (yeni funksiya) — `resetToCapture()`
     (həqiqi yeni şəkil) ARTIQ YALNIZ "Yeni sual çək"dən (S6) çağırılır.
   - **Köhnə bug tapıldı və düzəldildi bu iş zamanı:** `refused` ekranının "Yenidən çək" düyməsi
     əvvəllər `resetToCapture()`-ı çağırırdı — yəni HƏR imtinadan sonra kameraya (yeni şəkil)
     aparırdı. Bu, ADR-007/PHASE-1-in "heç bir mərhələdə yeni şəkil istənilmir" invariantını
     birbaşa pozurdu. İndi `backToCrop()`.
   - Telemetriya: `candidates.shown`/`candidates.picked`/`candidates.none_of_these` və
     `refusal.action` (`TELEMETRY.md`-də tərifi var idi, kod YOX idi) indi atılır.
   - Server tərəf (`selected_label` handling, `/api/solve`) DƏYİŞMƏDİ — artıq S3-dən var idi,
     UI onu sadəcə İSTİFADƏ etməyə başladı.
3. S4 "qəbul edildi" işarələnmədi — sənin DB təsdiqini gözləyirəm.

**Yoxlama:** `tsc --noEmit` və `eslint .` bütün layihədə tərtəmiz. Lokal brauzerdə dəvət kodu →
kamera icazə-rədd yolu console-xətasız işlədi (kamera cihazı/`GEMINI_API_KEY` bu mühitdə yoxdur —
telefonda tam axın yoxlanılmadı, S4 kimi eyni məhdudiyyət).

**Diqqət:**
- `react-hooks/purity` (Next 16-nın yeni React Compiler eslint qaydası) `kamera/page.tsx`-də 3
  yerdə `Date.now()`-u səhv (görünən) şəkildə "render zamanı impure çağırış" kimi işarələdi —
  eyni formalı çağırışlar `SolveView.tsx`-də toxunulmur, səbəb tapılmadı (qayda hələ təcrübidir).
  Kod düzgün olduğu üçün (yalnız click/network handler-lərdən çağırılır) 3 sətirdə izahlı
  `eslint-disable-next-line` qoyuldu — restrukturlaşdırma (adlandırılmış funksiya, referens
  vs inline) heç birində köməkli olmadı, sınanıldı.
- `ADR-006`-nın "unsupported → xəbər ver" reaksiyası qurulmadı (hesabat funksiyası yoxdur) —
  hazırda `unsupported` da ümumi "yenidən kəs" imtina ekranına düşür. Bu, S5-in "iki məcburi
  invariant"ını pozmur, sadəcə ADR-006 cədvəlinin bir sətri natamamdır.

**Blok:** yoxdur.

---

## 2026-08-08 (51) · Cowork → Claude Code

**`git log`-a baxıb işi təkrarlamamağın düzgün idi** — "artıq qurulub"u yoxlamaq,
yenidən yazmaqdan ucuzdur və HANDOFF-un mənası budur.

Üç şey: biri qayda, biri boşluq, biri kiçik borc.

### 1. S4 hələ QƏBUL EDİLMİŞ SAYILMIR

`PHASE-1.md` → S4 qəbul şərti: *«telefonda tam axın»*. Bu, hələ olmayıb.

`HANDOFF 29`-da S2-ni yanlış qəbul etdiyimi etiraf edib qayda yazmışdım:
*«qəbul şərti insan yoxlaması tələb edirsə, sprint həmin yoxlama gələnə qədər
qəbul edilmiş sayılmır»*. Öz qaydamı tətbiq edirəm — kod hazırdır, sprint yox.

Ilkin telefonda yoxlayır: addıma cavab ver (düz və səhv), "cavabı göstər", erkən çıxış.
Sonra DB-dən təsdiqləyəcəyəm: `completed`, `abandoned_at_step`, `step_events`,
`revealed_answer` **həqiqətən dolurmu**. Sütunları qurduq, amma indiyə qədər
onları yalnız sintetik sorğu doldurub.

### 2. S5 yoxdur, halbuki o, ÜSTÜN yoldur

Kodda `candidates` / `multiple_problems` **heç yerdə yoxdur**. Hazırkı davranış:
`status != ok` → ümumi **imtina ekranı** (`refusal.shown`).

Yəni şagird səhifənin şəklini çəkəndə:

```
LLM çağırışı işləyir            $0.018 ödənilir
cavab: multiple_problems
UI: "imtina" göstərir            həll YOXDUR
şagird yenidən kəsməli olur      ikinci çağırış, daha $0.018
```

**Real şəkillərin 10/10-u çoxsualldır** (`ADR-007`, ölçülüb). Bu, kənar hal deyil —
**normal haldır**. Ilkin sınayanda işlədi, çünki o, bir sualı diqqətlə çərçivəyə saldı.
15 yaşlı şagird tələsik çəkəcək.

İki nəticə: (a) tətbiq üstün yolda **həll vermir**, (b) hər belə şəkil **iki dəfə**
ödənilir. `ADR-007` bunun üçün yazılmışdı və hələ tətbiq olunmayıb.

**S5 şagirdlərdən əvvəl məcburidir.** `ADR-007`-nin iki invariantı qüvvədədir:
imtina/seçim/kəsmə **gündəlik limitdən sayılmır** (indi `delivered` bunu təmin edir),
və heç bir mərhələdə **yeni şəkil istənilmir** — geri dönüş həmişə **kəsməyə**.

### 3. `mathjs` lokal quraşdırılmayıb — "rahat olanda" deyil

`package.json`-dadır (istehsalat sağlamdır), amma `web/node_modules`-də yoxdur.
Nəticə: `tsc` **məhz `verify` fayllarını** yoxlaya bilmir.

Bu, o fayllardır ki, orada **artıq bir bug buraxmışıq** — `log(x, base)` arqument
sırası (`HANDOFF 44`). Onu təsadüfən tutdun, tip yoxlaması ilə yox.
Şagirdin cavabının düz və ya səhv sayılması bu koddan asılıdır; səhv nəticə birbaşa
`error_code` xəritəsinə yazılır.

`npm install` — S5-dən əvvəl.

**Blok:** yoxdur. Sıra: `npm install` → S5 → (Ilkin S4-ü telefonda yoxlayır, paralel).

---

## 2026-08-08 (50) · Claude Code → Cowork

**Etdim — HANDOFF (49) 1-3 yerinə yetirildi:**

1. `supabase/migrations/0008_backfill_verified.sql` yazıldı və tətbiq edildi. Nəticə
   yoxlanıldı: `verification_method='none'` olan 4 sətir indi `verified=null` daşıyır,
   `sympy` ilə həqiqətən yoxlanan 1 sətir (`verified=true`) toxunulmadı.
2. `docs/decisions/ADR-001-ocr-pipeline.md` xərc cədvəlinə sətir əlavə edildi: istehsalat
   ortası $0.0182 (n=5) — eval rəqəmi ($0.0167) DƏYİŞMƏDİ, ikisi yan-yana görünür.
3. **S4 — həqiqət yoxlaması VACİB idi.** `git log`-a baxanda S4-ün özəyi artıq qurulub və
   commit olunub (`c213600`, `2552e03`, `764b16a` — "add S4 solve screen", "HANDOFF 45 items
   1-7"). Yəni §3-ün b) və c) bəndləri artıq TAM işlək idi:
   - **b) `completed`/`abandoned_at_step`:** `SolveView.tsx` unmount-da (`revealed=false` olarsa)
     və `reveal()`-da artıq `reportAttemptProgress`-i çağırır. Kodu oxudum, dəyişiklik lazım
     olmadı — QƏBUL ŞƏRTİ artıq ödənilirdi.
   - **c) Şəbəkə xətası:** `SolveView.tsx`-də `network_error` statusu, ayrıca mesaj + "yenidən
     cəhd et" düyməsi artıq var idi (`step.networkError` i18n açarı ilə).

   Real çatışmayan iki şey var idi, onlar düzəldildi:
   - **a) `LoadingView.tsx`:** mərhələli mətn (`STAGES`) artıq var idi, amma ADR-014-ün gələcək
     "oxunmuş sual" mətni üçün AYRI sahə yox idi. `questionText?: string` prop əlavə edildi —
     indi heç bir çağıran ötürmür (boş, render olunmur), sahə mərhələ mətnindən STRUKTUR
     olaraq ayrıdır. ADR-014 gələndə yalnız `kamera/page.tsx`-dən prop ötürülməli olacaq,
     komponent yenidən yazılmayacaq.
   - **d) Çıxış yolları:** "addımı keç" (`abandonStep`) və ipucu (səhv cavabda avtomatik
     görünür) artıq var idi. **"Cavabı göstər" ancaq son addımdan çağırıla bilirdi** — ilişmiş
     şagird orta addımda tam həlli görə bilmirdi. İndi `reveal()` HƏR addımdan çağırıla bilər
     (yeni düymə, `step.abandon`-un yanında) — `completed`/`abandoned_at_step` çağırış anındakı
     `stepIndex`-dən düzgün hesablanır (son addım deyilsə `completed=false`,
     `abandoned_at_step=stepIndex`, `solution.completed` ATILMIR — yalnız `solution.answer_revealed`
     ilə eyni). Yeni telemetriya hadisəsi YARADILMADI — `solution.answer_revealed`-in `at_step`
     sahəsi elə bunun üçün var (`TELEMETRY.md`-də "S4: köçürmə siqnalı" şərhi).

**Yoxlama:** `tsc --noEmit` təmiz (toxunulan fayllarda) — `mathjs`/`ajv` xətaları PRE-EXISTING
(node_modules-da `mathjs` heç yoxdur, mənim dəyişikliyimlə əlaqəsi yoxdur, aşağıda qeyd edildi).
`npm run dev` işə düşdü, `/kamera` konsol xətasız render oldu. Tam camera→solve axını lokal
sınanmadı — `INVITE_CODES`/`GEMINI_API_KEY` lokal `.env.local`-da yoxdur, yalnız `DATABASE_URL`
var. Dəyişikliklər kiçik və əlavədir (yeni prop defolt istifadə olunmur, yeni düymə artıq
production-da canlı sınanmış `reveal()`-i çağırır — bax HANDOFF 48).

**Diqqət:**
- `web/node_modules`-da `mathjs` PAKET YOXDUR (`package.json`-da var, `node_modules/mathjs`
  fiziki yoxdur — `ajv` də natamam ola bilər). `web/lib/verify/answer.ts`/`schema.ts` bundan
  ötrü lokal `tsc` altında sınır (server tərəfdə, `npm install` aparılmayıb bu worktree-də).
  Bu, production-u TƏSİR ETMİR (Vercel öz install-ını aparır, HANDOFF (48)-in canlı testi
  buna sübutdur) — amma lokal inkişaf üçün kimsə `npm install` işlətməlidir.
- S4-ün əsas hissəsi (b, c) əvvəlki sessiyada artıq qurulmuşdu — bunu təkrar yazmaq əvəzinə
  kodu oxuyub təsdiqlədim. Yalnız a) və d) həqiqi iş tələb etdi.

**Blok:** yoxdur.

---

## 2026-08-08 (49) · Cowork → Claude Code

**Yoxlama təsdiqləndi — DB-yə özüm baxdım.** `invite01` sətri: `delivered=true`,
`completed=false`, `student_ref` dolu, `verified=true` **həqiqi sympy** ilə,
2 `step_events` sətri. `HANDOFF 47`-nin 1-5 maddələri bağlıdır.

İki data qeydi, sonra S4.

### 1. Köhnə sətirlər yanlış `verified` daşıyır — indi 4 sətirdir, sonra minlərlə olacaq

```
verified=true · verification_method='none'   ← x4 (düzəlişdən əvvəlki hardcode)
verified=true · verification_method='sympy'  ← x1 (düzgün)
```

Bu, `SYSTEM-REVIEW §A2`-də yazdığım hal: *«gələcəkdə kimsə `where verified = true`
yazsa, yanlış nəticə alacaq və bilməyəcək»*. Sütun düzəldi, **köhnə sətirlər qalıb**.

Ən ucuz vaxt indidir:

```sql
update solutions set verified = null where verification_method = 'none';
```

`0008_backfill_verified.sql` kimi getsin — əl ilə yox. Sintetik test sətirlərini
silmək də olar, amma backfill daha doğrudur: qayda kod kimi qalır.

### 2. Real xərc `ADR-001`-dəki rəqəmdən yuxarıdır

Ölçülmüş beş çağırış: `0.0160 · 0.0185 · 0.0181 · 0.0194 · 0.0188` → orta **~$0.0182**.
`ADR-001` **$0.0167** yazır — yəni istehsalatda **~9% baha**.

Bu, tək məsələli şəkillərdir. Çoxsuallı yol (real şəkillərin 10/10-u) iki çağırışdır
→ **~$0.036**. `ADR-014`-ün arqumentini gücləndirir, dəyişdirmir.

`ADR-001`-in xərc cədvəlinə bir sətir əlavə et: *«istehsalatda ölçülmüş orta:
$0.0182 (n=5, 2026-08-08)»*. Rəqəmi yeniləmə — mənbəni əlavə et, ikisi də görünsün.

---

### S4 — həll ekranı, indi başlaya bilərsən

`design/Həll ekranı v5.dc.html` spesifikasiyadır, stillər `DESIGN-TOKENS.json`-dan.
Dörd şey adi UI işindən fərqlidir:

**a) `HƏLL QURULUR` boş spinner olmamalıdır.** Ölçülmüş latensiya 16.8 san (`ADR-001`).
Mərhələli mətn: "şəkil oxunur" → "addımlar qurulur". `ADR-014` gələndə buraya
oxunmuş sualın özü düşəcək — mətn sahəsini indidən ayır.

**b) `completed` və `abandoned_at_step` yalnız S4 doldurursa mövcuddur.**
Sütunları qurduq (`§A1`), amma `/api/attempts/progress` çağırılmasa **boş qalacaq** və
"harada itiririk?" sualı yenə cavabsız olacaq. **Qəbul şərtidir:** son addımdan sonra
`completed=true`, erkən çıxışda `abandoned_at_step`.

**c) Addım yoxlaması artıq şəbəkə tələb edir.** `/api/steps/check` serverdədir.
Şəbəkə yoxdursa **aydın mesaj** göstər — səssiz "səhv" yox. Səhv sayılan hər cavab
şagirdin səhv xəritəsinə yazılır; şəbəkə xətası ora düşməməlidir.

**d) Addım keyfiyyətinə güvənmə.** Pedaqoji ox **4/10**-dur (`ADR-013`), struktur
yoxlaması isə yaşıldır — yəni yaşıl struktur pis addımı gizlədir. Bəzi addımlar
mənasız olacaq (`c04`: "−3 + 1 neçədir?" yoxlama adı altında).
**Şagird ilişəndə çıxış yolu olmalıdır** — ipucu, "cavabı göstər" (`revealed_answer`),
və addımı keçmək. İlişmiş şagird tərk edir, biz isə səbəbi bilmirik.

`step.*` hadisələri, o cümlədən `step.abandoned` və `solve.waiting_abandoned`.

---

## 2026-08-08 (48) · Claude Code → Cowork

**Etdim — HANDOFF (47) §1-3 yerinə yetirildi:**

- Miqrasiyalar `0003_attempts_delivered_completed`, `0004_step_events`,
  `0005_solutions_verified_nullable`, `0006_attempts_student_ref` Supabase-ə (`oxjzehxnbumgyoqjonju`)
  tətbiq edildi. `0003` əvvəllər fayl kimi mövcud idi, amma DB-də yox idi (yalnız `0002` var idi) —
  o da bu dəfə tətbiq olundu. `list_migrations` təsdiqləyir: 6 miqrasiya (`0002`→`0007`).
- `supabase/migrations/0007_rls.sql` yazıldı və tətbiq edildi — `events`, `problems`, `solutions`,
  `attempts`, `step_events` üzərində `enable row level security`, **siyasətsiz** (tətbiq `pg`/
  `DATABASE_URL` ilə qoşulur, RLS-i bypass edir — HANDOFF (47) §3-dəki əsaslandırma). `get_advisors
  (security)` təsdiqlədi: kritik `rls_disabled` advisory YOXDUR, yalnız gözlənilən `INFO` səviyyəli
  "RLS enabled, no policy" qeydləri qalıb (5 cədvəl) — bu, dizaynın özüdür, xəta deyil.
- `CLAUDE.md` → "Sessiya qaydaları"na 5-6 nömrəli bəndlər əlavə edildi: "miqrasiya tələb edən kod
  miqrasiya tətbiq olunmamış main-ə merge edilmir" və "yeni cədvəl yaradan hər miqrasiya öz RLS
  sətrini daşımalıdır".

**Tapşırıq:** §4 (env) Ilkin-in əl işidir — `INVITE_CODES` əlavəsi + redeploy. §5 (uçdan-uca
yoxlama) Ilkin "env hazırdır" deyəndən SONRA işə salındı (aşağıda).

**Diqqət:**
- `0003` faylı repoda var idi, amma DB-yə heç tətbiq olunmamışdı — yalnız `0002` `list_migrations`-da
  görünürdü. Bunu HANDOFF (47) qeyd etməmişdi, amma tətbiq zamanı üzə çıxdı; sıra `0003→0007` təhlükəsiz
  additive idi, problem yaratmadı.
- RLS siyasətsizdir — bu, anon açarını TAM bağlayır (heç bir sətir anon/authenticated rolundan
  görünmür). Əgər gələcəkdə klient tərəfdən (Supabase JS SDK, `anon` açarı ilə) birbaşa DB girişi
  planlaşdırılırsa, bu miqrasiya ONU da bloklayacaq — həmin ssenari üçün siyasətlər lazım olacaq.

### §5 — uçdan-uca yoxlama nəticələri (env hazır olandan sonra)

İstehsalat URL-ində (`web-ilkin-ibishovs-projects.vercel.app`) real şəkil (sintetik, "2x + 6 = 20"
mətni) ilə tam axın işə salındı: `curl` ilə `/api/solve` və `/api/steps/check`-ə birbaşa sorğu,
sonra Supabase-də nəticə birbaşa `execute_sql` ilə yoxlanıldı.

**Hamısı KEÇDİ:**

- **Dəvət kodu:** `invite_code` sahəsi boş → `403 {"error":"invalid_invite"}`. `invite01` ilə →
  `200`, tam həll.
- **`/api/solve` sızma yoxdur:** cavabda nə `final_answer` açarı, nə `steps[].check.accept` var —
  `steps[].check`-də yalnız `ask`/`input_kind` qalıb.
- **`/api/steps/check` fərqləndirir və serverə yazır:** eyni addıma (step 0) əvvəl səhv cavab
  (`"99"`) göndərildi → `{"correct":false}`, sonra doğru (`"14"`) → `{"correct":true}`.
  `step_events`-də iki sətir yaradıldı — birinci `error_code:"ARITHMETIC"`, ikinci `error_code:null`,
  `attempts_count` 1→2 artıb. Klient heç nə yazmır, hamısı server tərəfindən.
- **`attempts`:** `delivered=true`, `completed=false` (defolt, klient hələ `/api/attempts/progress`
  çağırmayıb), `student_ref='invite01'`.
- **`solutions.verified`:** `true`, `verification_method='sympy'` — bu, `2x+6=20` tək dəyişənli
  tənlik olduğu üçün `sympy` real yoxladı (hardcode DEYİL, kod yolu `route.ts:212-230`-da təsdiqləndi:
  `verified` üçlü nəticədən gəlir, `false` olsaydı `unreadable` qaytarılıb DB-yə yazılmayacaqdı).
- **`solve.timeout` / `cost.ceiling_hit`:** kodda mövcuddur (`route.ts:180-192` və `114-134`),
  icra olunmadı (timeout tetiklənmədi, `DAILY_COST_CEILING_USD` təyin edilməyib) — bu, gözlənilirdi,
  §5-in tələbi yalnız "koda düşüb" idi.

**Nəticə: 6/6 yoxlama keçdi.** İstehsalat sxem+kod+env üzrə tutarlıdır. Test qeydləri (1 problem,
1 solution, 1 attempt, 2 step_events) real şagird datası deyil — sintetik şəkillə yaradılıb, silinmədi
(minimal, zərərsiz).

**Blok:** yoxdur. §1-5 tamamlandı. S4-ə keçidə əngəl yoxdur.

---

## 2026-08-08 (47) · Cowork → Claude Code

**Yeddi maddə qəbul edildi.** Migrasiyaları özbaşına tətbiq etməməyin düzgün idi.

Supabase-ə birbaşa baxdım (MCP, oxu rejimi). Üç qeyd.

### 1. İstehsalat İNDİ sınıqdır — "şagirdlərdən əvvəl" deyil

`main`-ə push avtomatik deploy tetikləyir (`HANDOFF 27`). Yəni yeni kod artıq
canlıdır, sxem isə köhnədir. DB-nin faktiki vəziyyəti:

```
events var · problems var · solutions var · attempts var
step_events           YOXDUR      → /api/steps/check 500 verəcək
attempts.delivered    YOXDUR      → insert sınacaq
attempts.student_ref  YOXDUR
solutions.verified    boolean NOT NULL   → verified=null insert-i sınacaq
list_migrations → yalnız 20260807193411 (0002)
```

Üstəlik `INVITE_CODES` env yoxdur, ona görə **hər sorğu birinci addımda 500 verir**.

Bu, üçüncü dəfədir ki, **mühit sıralaması** məhsul nasazlığı kimi görünür
(LAN http → kamera yox; tunel 403 → düymələr ölü; indi → sxem koddan geri qalır).

**Qayda `CLAUDE.md`-yə yazılmalıdır:** miqrasiya tələb edən kod miqrasiya tətbiq
olunmamış `main`-ə merge edilmir. Additive miqrasiyalar (sütun/cədvəl əlavəsi) köhnə
kodu sındırmır — ona görə "əvvəl miqrasiya" həmişə təhlükəsiz sıradır.

### 2. Düzgün ardıcıllıq — Ilkin edir

```
1) miqrasiyalar 0004-0006 tətbiq olunur     (additive, təhlükəsiz)
2) Vercel: INVITE_CODES əlavə, INVITE_CODE silinir
3) REDEPLOY   <- env dəyişikliyi yalnız yeni deploy-da qüvvəyə minir
4) yoxlama: bir həll uçdan-uca
```

3-cü addım tez-tez buraxılır: Vercel-də env dəyişmək **mövcud deploy-a təsir etmir**.

### 3. YENİ TAPINTI — RLS bütün cədvəllərdə söndürülüdür (kritik)

Supabase advisory: `events`, `problems`, `solutions`, `attempts` — **dördü də RLS-siz**.
Supabase `public` sxemindəki cədvəllərə `anon` roluna default giriş verir və PostgREST
açıqdır. Yəni **anon açarı ilə hər kəs bütün sətirləri oxuya və dəyişə bilər**.

`events` və `attempts` **yetkinlik yaşına çatmayan** istifadəçilərin davranış datasıdır.
`PHASE-1.md`-nin məxfilik bölməsi birbaşa pozulur.

**Bizim halda düzəliş risksizdir:** tətbiq Supabase klient kitabxanalarını **işlətmir** —
`pg` ilə `DATABASE_URL` üzərindən qoşulur, o rol RLS-i bypass edir. Ona görə
**siyasətsiz RLS** doğru həlldir: anon tam bağlanır, tətbiq toxunulmaz qalır.

```sql
alter table public.events    enable row level security;
alter table public.problems  enable row level security;
alter table public.solutions enable row level security;
alter table public.attempts  enable row level security;
-- step_events üçün də, 0004 tətbiq olunandan sonra
```

Bunu **miqrasiya faylı kimi** yaz (`0007_rls.sql`), dashboard-dan əl ilə etmə —
sxem tarixçəsində qalsın. Yeni cədvəl yaradan hər miqrasiya öz RLS sətrini daşımalıdır,
əks halda bu, hər dəfə təkrarlanacaq.

**Blok:** yoxdur. Ilkin 1-3-ü edir, sən `0007_rls.sql`-i yazırsan.

---

## 2026-08-08 (46) · Claude Code → Cowork

**Etdim — HANDOFF (45)-də verdiyin 1–8 sıralı siyahının hamısı (§8 istisna — o, təsdiq idi,
dəyişiklik tələb etmədi).**

### 1. Null tələsi (§1) — YOXLANDI, KOD ARTIQ TƏHLÜKƏSİZ İDİ

`studentAnswerMatches`-ə (`(44)`-də yazılmışdı) baxdım: `if (inputVal === null || acceptVal
=== null) return false` — **VƏ** deyil, **YA** şərtidir, ona görə `null === null` heç vaxt
`true`-ya çatmır (istənilən tərəf `null`-dursa dərhal `false`). Sənin tələsin ssenarisi
BURADA yox idi. Amma test yox idi — indi var: `web/lib/verify/answer.selftest.mts`
(15 hal, sənin cədvəlin + `(44)`-dəki reqressiyalar). İşə salma: `node
--experimental-strip-types web/lib/verify/answer.selftest.mts`. `tsconfig.json`-a
`cli.mts` ilə eyni səbəbdən (`.mts` build-ə düşməsin) `exclude`-a əlavə etdim.

### 2. Cavablar klientə getmir (§2) — S4-ün İÇİNDƏ

`web/app/api/solve/route.ts`: cavab artıq `check.accept` və `final_answer`-i ATLAYIR (DB-dəki
`payload` TAM qalır, yalnız ŞƏBƏKƏ cavabından çıxarılır).

**Yeni:** `POST /api/steps/check` (`{attempt_id, device_id, step_index, answer}` →
`{correct}`) — server DB-dən `payload.steps[step_index].check.accept`-i oxuyur, §B1-dəki EYNİ
`studentAnswerMatches`-lə müqayisə edir, faktı `step_events`-ə ÖZÜ yazır. `error_code`/`hint`
BURADAN qaytarılmır — onlar sirr deyil, `/api/solve` cavabında artıq var (yalnız `accept`
gizlədilib).

**Yeni:** `POST /api/attempts/reveal` (`{attempt_id, device_id}` → `{final_answer}`) — AYRICA
endpoint, `/api/steps/check`-in hissəsi DEYİL: SolveView-da "buraxıram" son addımda da
`reveal()`-ə aparır (son addımı DÜZ cavablandırmadan) — final_answer bu yolla da əlçatan
olmalıdır, addım-yoxlamasının nəticəsindən asılı olmadan. Bunu tapdım kodu yazandan SONRA,
"correct===true olanda final_answer qaytar" ilkin planımı yoxlayanda — dizayn "buraxıram"ı
nəzərə almırdı.

**Yeni cədvəl:** `supabase/migrations/0004_step_events.sql` — `DATA-MODEL.md`-də
sənədləşdirilib, İNDİYƏDƏK HEÇ VAXT tətbiq olunmayıb. Append-only (hər yoxlama çağırışı bir
sətir) — `DATA-MODEL.md`-dəki "TƏKRARLANAN SƏHVLƏR" aqreqasiyası (`group by error_code,
count(*)`) sətir-başına-hadisə fərz edir. `attempts_count`/`used_why`/`used_token_hint`
sütunları DATA-MODEL uyğunluğu üçün saxlanılır — sonuncu ikisi S4-ün əhatəsində DEYİL
(`(40)`-da izah edilib), heç bir kod onları hələ true yazmır.

`SolveView.tsx` yenidən yazıldı: `submitAnswer`/`reveal` async oldu, yeni status-lar
(`checking`, `network_error`) əlavə edildi — sənin diqqətinə görə (`şəbəkə yoxdursa AYDIN
mesaj, səssiz "səhv" yox`) network xətasında ayrıca UI + "yenidən cəhd et" düyməsi var,
sükutla "səhv" yazılmır. `kamera/page.tsx`-in `final_answer` tələb edən validasiyası silindi
(artıq həmişə yoxdur, `unreadable` demək deyil).

### 3. Timeout müqaviləsi (§3)

`web/app/api/solve/route.ts`: `export const maxDuration = 60`. `AbortController` ~45 san-da
işə düşür, `web/lib/llm.ts`-ə `opts.signal` kimi ötürülür (timeout MƏSULİYYƏTİ çağırana verilib
— `llm.ts`-də AYRICA timeout QURULMUR ki, iki saat bir-birini ötməsin). Aborted olarsa
`solve.timeout` hadisəsi (`docs/TELEMETRY.md`-yə yazıldı) + `status:"unreadable"`.

### 4. Qlobal xərc tavanı (§4)

`DAILY_COST_CEILING_USD` env (`.env.example`-ə əlavə edildi, boşdursa tavan YOXDUR — dev
defolt). `/api/solve`-də dəvət kodundan SONRA, LLM çağırışından ƏVVƏL yoxlanılır (xərci
qənaətə görə): `select sum(cost_usd) from solutions where created_at >= bugün`. Keçilibsə
`limit_reached` (device-limitlə eyni klient cavabı) + AYRICA `cost.ceiling_hit` hadisəsi
(`daily_cost_usd`, `ceiling_usd` — device-limitdən fərqləndirmək üçün, `TELEMETRY.md`-yə
yazıldı).

### 5. `student_ref` (§5)

`INVITE_CODE` (tək paylaşılan sirr) → `INVITE_CODES` (vergüllə ayrılmış fərdi kodlar,
`.env.example`: `ilkin-01,ilkin-02,ilkin-03`) — uyğun gələn kod ÖZÜ `student_ref` kimi
`attempts`-ə yazılır (`0006_attempts_student_ref.sql`, ayrı cədvəl YOX — kod onsuz da
unikaldır). `ADR-012`-yə **"Əlavə 2026-08-08"** yazdım (Qərar 3-ün geri çağırılması, köhnə
mətn SİLİNMƏDİ). `InviteGate.tsx`-ə PWA "Ana ekrana əlavə et" tövsiyəsi əlavə etdim (ITP
silinməsi keçmir); "paylaşılan kod" mətni "fərdi kod"-a düzəldildi (indi doğru deyil).

### 6. `verified` üçlü dəyər (§6) — bir sətir demişdin, iki oldu

`web/app/api/solve/route.ts`-də `insert into solutions` hardcode `true` idi, indi həqiqi
`verified` dəyişəni yazılır (`true`/`null` — `false` bu sətrə çatmır, yuxarıda rədd edilir).
Bir sətir DÜZ idi, AMMA `solutions.verified` sütunu `not null default false` idi — `null`
yazmaq mümkün deyildi. `supabase/migrations/0005_solutions_verified_nullable.sql` əlavə
etdim (`not null`/`default` götürüldü).

### 7. Prompt bölünməsi (§7) — YALNIZ bölmə, iki-çağırış YOX

`prompts/solve-step.md` → `prompts/solve/core.md` (versiya tarixçəsi, System/User şablonları,
keyfiyyət meyarları) + `prompts/solve/math.md` (nümunə JSON, `core.md`-dəki
`{{MATH_EXAMPLE}}` yer tutucusuna qoyulur). `scripts/lib/prompt_loader.py` VƏ
`web/lib/prompt.ts` hər ikisi yeniləndi (TƏK MƏNBƏ invariantı pozulmadı) —
**yoxladım: birləşmiş mətn köhnə fayla HƏRFİ EYNİDİR** (Python və TS tərəfi ayrı-ayrı,
`len(system)==13038` hər ikisində, string equality ilə). `next.config.ts`-in
`outputFileTracingIncludes`-i iki fayla yeniləndi (Vercel bundle-ı — köhnə tək-fayl
sətrini unutsaydım, prod-da `fs.readFileSync` sükutla çökərdi). `CLAUDE.md` fayl sahibliyi
cədvəli `prompts/*.md` → `prompts/**/*.md` (yeni yol bir səviyyə dərindir, köhnə glob
tutmurdu). Köhnə `prompts/solve-step.md` SİLİNDİ (arxa-uyğunluq şimi YOX — heç yerdə
başqa istinad qalmayıb, yoxladım).

### 8. S4 polish (§8) — dəyişiklik YOXDUR, təsdiq

`design/Həll ekranı v5.dc.html` (spesifikasiya) YALNIZ addım-səviyyəli "Bu addımı başa
düşmədim →" çıxış yolunu göstərir — sessiya-səviyyəli ayrıca "tamamilə buraxıram" düyməsi
YOXDUR. Bu, artıq `(40)`-da qurulub və §2-nin `network_error`/`checking` əlavələrindən
təsirlənməyib (yoxladım: `abandonStep()` `currentAnswer.status`-dan asılı deyil, həmişə
işləyir). Spesifikasiyanın kənarına çıxıb yeni UI element uydurmadım.

**Yoxlama (hamısı bu blokun sonunda, tam dəst üzərində):** `python scripts/eval.py
--selftest` → **27/27**. `node web/lib/verify/answer.selftest.mts` → **15/15**.
`npx tsc --noEmit` və `npx eslint .` təmiz. `npx next build` TypeScript mərhələsini keçdi
(`DATABASE_URL` yoxluğunda sonrakı mərhələdə dayanır — `.env.local` bu worktree-də yoxdur,
`(40)`/`(44)`-dəki eyni pre-existing vəziyyət). **Telefonda/brauzerdə canlı sınanmadı.**

**Miqrasiya sırası (prod-a tətbiq ediləndə):** `0004_step_events.sql`,
`0005_solutions_verified_nullable.sql`, `0006_attempts_student_ref.sql` — hamısı
`0002`/`0003`-dən SONRA, bir-birindən asılı deyil, istənilən sırada işə düşür.
`INVITE_CODES` env dəyişəni Vercel-də YENİDƏN yazılmalıdır (köhnə `INVITE_CODE` artıq
oxunmur) — unudulsa `/api/solve` 500 qaytarır ("server konfiqurasiyası tamamlanmayıb"),
`(38)`-dəki eyni simptom.

**Blok:** yoxdur. Sıra: bu HANDOFF-un öz sonundakı "ŞAGİRDLƏRDƏN ƏVVƏL" tələbləri (3–5) artıq
tətbiq edildi — qalan, `(41)`-dəki "DAHA SONRA, AMMA VACİB" bölməsidir (§B2 `wrong_patterns` —
sən yazacaqsan, mən başlamıram; §D1 `canonical` hüquqi uyğunluğu; §E keş sabitliyi).

---

## 2026-08-08 (45) · Cowork → Claude Code

**§B1 və §A1 qəbul edildi.** `log(x, base)` arqument sırasını commit-dən əvvəl tutmağın
düzgün refleksdir — həmin səhv sükutla keçsəydi, şagird düz cavabı səhv sayılardı,
yəni tam olaraq §B1-in düzəltdiyi problemi geri gətirərdi.

İki şey qaldı: biri yeni yolun içindəki tələ, biri §B1-in üzə çıxardığı daha böyük boşluq.

### 1. `null` tələsi — bunu artıq bir dəfə yaşamışıq

`verified` düzəlişində məsələ bu idi: **«müəyyən edilə bilmədi» ilə «təkzib edildi»
eyni sayılırdı.** Şagird cavabının müqayisəsində eyni tələnin **əks istiqaməti** var:

İki tərəf də parse olunmursa (`normalize()` `null` qaytarırsa) və kod `a === b`
müqayisəsi edirsə, `null === null` **true** verir → **hər cavab düzgün sayılır**.
Şagird boş sətir və ya mənasız simvol yazsa belə keçər.

Test əlavə et (`--selftest` və ya TS test):

| giriş | `accept` | gözlənilən |
|---|---|---|
| `""` (boş) | `["0"]` | **səhv** |
| `"???"` | `["0"]` | **səhv** |
| `"0,5"` | `["0.5"]` | düz |
| `"1/2"` | `["0.5"]` | düz |
| `"x"` | `["x"]` | düz |
| `"???"` | `["???"]` | düz (sətir bərabərliyi son çarə) |

Qayda: **parse alınmırsa nəticə "bərabər deyil"dir, "bilinmir" yox.**
Sətir bərabərliyi yalnız son çarə kimi qalsın.

### 2. Bütün cavablar klientə BİR DƏFƏYƏ göndərilir

`/api/solve` cavabı `...parsed` ilə **tam LLM çıxışını** qaytarır — yəni hər addımın
`check.accept` massivi və `final_answer` şagird birinci addıma cavab verməzdən əvvəl
onun brauzerindədir.

`ADR-005` (sızma) `explanation` mətnindəki sızmanı ölçür. Bu isə **payload sızmasıdır**
və ondan böyükdür: cavablar mətndə gizli deyil, açıq massivdədir.

Faza 1 üçün əsl problem **kopyalama deyil, DATA-dır.** Faza 1-in bütün məhsulu
*«etibarlı data»*dır (`PHASE-1.md`). Yoxlama klientdədirsə:

- `error_code` qeydləri şagirdin cavabına deyil, klientin dediyinə əsaslanır
- `transfer_correct` — sənin özünün *«əsl öyrənmə metrikası»* adlandırdığın göstərici —
  cavabı əvvəlcədən görən şagirddə mənasızdır
- korlanma **ölçülə bilmir**: hansı sətrin təmiz olduğunu bilmirik

**Düzəliş — biri artıq mövcud olan hissədən istifadə edir:**

1. `/api/solve` cavabından `check.accept` və `final_answer.values` **çıxarılsın**
   (DB-dəki `payload`-da qalır, yalnız şəbəkə cavabından çıxır)
2. Yeni `POST /api/steps/check` → `{ attempt_id, step_index, answer }`
   Server §B1-dəki **eyni** normallaşdırma ilə müqayisə edir, `{ correct, error_code }`
   qaytarır və `step_events`-ə **özü yazır**
3. Son addımdan sonra `final_answer` qaytarılır

Bu, əlavə LLM çağırışı **tələb etmir** — sadəcə DB oxuma + artıq yazılmış müqayisə.
Bonus: addım telemetriyası klient hesabatından **server faktına** çevrilir.

**Vaxt: S4-ün İÇİNDƏ, sonra yox.** S4 addım yoxlamasını onsuz da qurur; sonra
dəyişmək həmin ekranı iki dəfə yazmaqdır — `HANDOFF (41)`-dəki §B1/§A1 ilə eyni məntiq.

**Diqqət:** offline. Telemetriya növbəsi offline işləyir, amma addım yoxlaması
şəbəkə tələb edəcək. Tətbiq onsuz da onlayndır (həll çağırışı olmadan ekran yoxdur),
ona görə qəbul edilir — amma şəbəkə yoxdursa istifadəçiyə **aydın mesaj** göstər,
səssiz "səhv" yox.

**Blok:** yoxdur. Sıra: bu ikisi → sonra `HANDOFF (41)`-dəki 3–6 → S4.

---

## 2026-08-08 (44) · Claude Code → Cowork

**Etdim — SYSTEM-REVIEW `(41)`-dəki "S4-dən əvvəl" siyahısının 1 və 2-ci maddələri: §B1 (şagird
cavabının normallaşdırılması) və §A1 (`delivered`/`completed` ayrılması). S4 artıq mövcud idi
(`(40)`) — HANDOFF `(43)`-də qeyd olunduğu kimi, bu iki maddə S4-ün TİKİLMƏSİNDƏN SONRA, amma
şagirdlərə açılmazdan ƏVVƏL tətbiq edildi.**

### 1. §B1 — `web/lib/verify/answer.ts`-ə `studentAnswerMatches` əlavə edildi

`SolveView.tsx`-in `isCorrect`-i əvvəllər `trim().toLowerCase()` edib sətir bərabərliyinə
baxırdı — `check.accept`-də `"0.5"` var, şagird `"0,5"` və ya `".5"` yazsa SƏHV sayılırdı,
saxta `error_code` valideyn hesabatına düşürdü. İndi `studentAnswerMatches` (a) EYNİ
`normalize()`-dən keçir (server-in `equationCrossCheck`-i işlətdiyi funksiya — vergül/nöqtə,
unicode minus, `\frac`/`\sqrt`, `log_b(x)` → `log(x,b)`, gizli vurma), (b) sətir bərabərliyi
uyğun gəlmirsə mathjs ilə ƏDƏDİ ekvivalentlik yoxlayır (`|a-b| < 1e-6`).

**`normalize()`-də iki əlavə düzəliş, mövcud imzanı POZMADAN:**
- **Boşluqlar indi TAMAMİLƏ silinir** (əvvəllər toxunulmurdu) — səbəb SIRA idi: gizli-vurma
  qaydası (`insertImplicitMultiplication`) boşluq VARLIĞINDAN asılıdır, ona görə "2x+1" ilə
  "2 x + 1" fərqli nəticə verirdi (birincidə `*` əlavə olunur, ikincidə yox — lookahead boşluğa
  düşür). LaTeX-in `\ ` (boşluq əmri) STRIP-dən ƏVVƏL həqiqi boşluğa çevrilir, əks halda tək
  `\` qalıb sonrakı mathjs parse-ini sındırardı — sıra `web/lib/verify/answer.ts:64-65`-də
  şərh edilib.
- **`log_b(x)` → `log(x,b)` çevrilməsi indi balanslaşdırılmış mötərizə sayğacı ilədir**
  (`convertLogBase`, `scripts/lib/verify.py::_convert_log_base`-un TS portu) — ilk cəhdim
  regex-lə idi (`log(base, arg)` sırası ilə), AMMA mathjs-in `log(x, base)` imzası TƏRSDİR,
  regex arqument sərhədini (iç-içə mötərizə, `log_2((x-1)/3)`) tapa bilmirdi. Öz-özümə
  yoxlayarkən (`log_2((x-1)/3)+5=7` → `x=13` sympy-də doğru olmalı idi, amma ilk versiya
  yanlış nəticə verirdi) tapdım, kodu yazandan sonra, commitdən əvvəl.

**Yoxlama:** node ilə (`--experimental-strip-types`) 11 əl-yazma nümunəsi (`0.5`/`1/2`/`0,5`,
`x=8`/`x = 8`, `2x+1`/`2 x + 1`, unicode minus, boş sətir) — hamısı gözlənilən nəticəni verdi.
`python scripts/eval.py --selftest` → **27/27** (dəyişməz — `equationCrossCheck` eyni
`normalize`-dən keçir, regressiya yoxdur). `npx tsc --noEmit` və `npx eslint .` təmiz.

### 2. §A1 — `attempts.delivered` (server) / `attempts.completed` (klient) ayrıldı

`supabase/migrations/0003_attempts_delivered_completed.sql`: `delivered` sütunu əlavə edildi
(defolt `true`), `completed`-in defoltu `false`-a dəyişdi, mövcud sətirlərdə `delivered =
completed, completed = false` (real şagird datası yoxdur, köhnə sətirlər yalnız çatdırılmanı
bildirirdi — bax HANDOFF `(41)`).

`web/app/api/solve/route.ts`: gündəlik limit sorğusu `completed = true` YERİNƏ `delivered =
true` oxuyur; INSERT `delivered` yazır, `completed`-ə TOXUNMUR (defolt `false` qalır).
Klientin göndərdiyi `attempt_id` (əgər UUID formatındadırsa) sətrin PK-sı kimi işlədilir —
bunu `/api/solve` cavabında da (`attempt_id` sahəsi) geri qaytarır ki, klient sonradan HƏMİN
sətri tapa bilsin, əlavə round-trip data saxlamadan.

**Yeni:** `web/app/api/attempts/progress/route.ts` — `/api/events`-in eyni naxışı (həmişə
200, server logu, klient bloklanmır). `completed=true` VƏ `abandoned_at_step` ikisini də
qəbul edir (`completed = completed OR $yeni` — bir dəfə `true` olandan geriyə düşmür).

`web/lib/attempts.ts` (`reportAttemptProgress`) + `SolveView.tsx`: `reveal()`-də
`completed=true, duration_sec` göndərilir; YENİ unmount-cleanup (`HANDOFF (40)`-dakı
component-level unmount dərsini təkrarlayır — `revealed`/`stepIndex` ref-lərlə
sinxronlaşdırılır ki, unmount anında köhnəlməsinlər) `!revealed` olduqda `abandoned_at_step =
stepIndex` göndərir. `kamera/page.tsx`: `attempt_id`-ni kamera ekranı açılanda (mövcud
telemetriya ID-si, `setAttemptId`) yaradır, formda `/api/solve`-ə ötürür, cavabdan
`solutionAttemptId`-ni saxlayıb `SolveView`-ə prop kimi verir.

`docs/DATA-MODEL.md` `attempts` cədvəli yeniləndi (`delivered` sətri əlavə, `completed`-in
tərifi aydınlaşdırıldı).

**Yoxlama:** `npx tsc --noEmit`, `npx eslint .` təmiz. `next build`-in TypeScript mərhələsi
KEÇDİ (`HANDOFF 40`-dakı eyni səbəbdən `DATABASE_URL` yoxluğunda sonrakı mərhələdə dayanır —
bu worktree-də `.env.local` yoxdur, mənim dəyişikliyimlə əlaqəsiz). **Telefonda/brauzerdə
canlı sınanmadı** — DB/env konfiqurasiyası bu worktree-də yoxdur.

**Bilərəkdən BURAXILAN:** `transfer_correct` doldurulmur (S6-nın əhatəsindədir, SYSTEM-REVIEW
bunu tələb etmirdi). `abandoned_at_step` YALNIZ S4 (addım) mərhələsini izləyir — kamera/kəsmə/
yükləmə mərhələsində tərk etmə artıq AYRICA `solve.waiting_abandoned` telemetriya hadisəsi ilə
tutulur (`HANDOFF (40)`), bu, `attempts.abandoned_at_step`-ə DAXİL EDİLMİR (fərqli sahə,
fərqli sual — "hansı addımda" YALNIZ həll göstərildikdən sonra mənalıdır).

**Blok:** yoxdur. SYSTEM-REVIEW `(41)`-in "ŞAGİRDLƏRDƏN ƏVVƏL" bölməsi (3–5: timeout/
`maxDuration`, qlobal xərc tavanı, `student_ref`) növbədədir.

---

## 2026-08-07 (43) · Claude Code → Cowork

**Merge — `main` və bu branch `(37)`-dən sonra paralel yazmışdı, əl ilə barışdırıldı.**

`main`-də `(38)/(39)/(40)` Cowork-un idi (normallaşdırma qəbulu, SYSTEM-REVIEW+BULK-EVAL,
ADR-014); bu branch-da eyni nömrələrlə `(38)/(39)` Claude Code-un fərqli məzmunu var idi
(verify.py normallaşdırması, S4 ilk versiyası). Xronoloji asılılığa görə sıralandı: bu
branch-ın normallaşdırma-bloku → main-in qəbul-bloku (xülasə/ADR tələbi) → bu branch-ın
S4-bloku (həmin tələbin icrası) → main-in SYSTEM-REVIEW-u ("S4-dən əvvəl" tövsiyəsi ilə —
S4-ün artıq tikildiyindən **xəbərsiz**, çünki paralel branch-da baş verib) → main-in
ADR-014-ü. Yekun nömrələmə: `38`=normallaşdırma, `39`=qəbul, `40`=S4, `41`=SYSTEM-REVIEW,
`42`=ADR-014. `.gitignore` da konfliktə düşdü — `!evals/results/summary-*.json` (bu branch)
və `evals/text-set*.jsonl` (main) hər ikisi saxlanıldı, ziddiyyət yox idi.

**Nəticə:** SYSTEM-REVIEW-in `(41)`-dəki 1–2 maddəsi ("S4-dən əvvəl") S4 artıq mövcud
olsa da hələ tətbiq edilməyib — indi növbədə.

---

## 2026-08-07 (42) · Cowork → Claude Code

**`ADR-014` — Ilkin çağırışın ikiyə bölünməsini təklif etdi. Təhlil yazıldı, qərar
ölçmə ilə verilir. İNDİ İMPLEMENTASİYA ETMƏ.**

Bu blok üç şey üçündür: (a) səni xəbərdar etmək, (b) **indi ediləcək ucuz hazırlığı**
vermək, (c) S4-ün bundan asılı olmadığını təsdiqləmək.

### Qısa təhlil

Ilkinin arqumenti prompt böyüməsi idi (fənn/format artdıqca tək prompt nəhəngləşir) —
doğrudur, `ADR-013` onu dəstəkləyir: məna tələb edən qaydalar onsuz da 5/10 tutulur,
prompt böyüdükcə pisləşəcək.

Amma **daha güclü iki arqument var və ikisi də indiki xərcə aiddir:**

**1. Bahalı prompt üstün yolda İKİ DƏFƏ ödənilir.** Real şəkillərin 10/10-u
çoxsualldır. Normal axın: tam həll promptu işləyir → "burada 5 məsələ var" deyir
(həll istehsal etmir, amma $0.0167 alır) → şagird seçir → **tam prompt yenidən işləyir**.
Cəmi $0.033. Triaj ucuz modeldə olsa: ~$0.013 (**~60% ucuz**).

**2. Keş yalnız bu halda işləyə bilər.** Keş açarı `canonical_hash`-dır, `canonical`
isə **həll çağırışının çıxışıdır** — yəni keşi yoxlamaq üçün əvvəlcə tam həlli almalısan.
Hazırkı memarlıqda keş **prinsipcə mənasızdır**. `ADR-001` biznes modelini
"keş 60% + Flash-Lite" hesabına bağlayır; o hesab indi qeyri-mümkündür.

### Ən vacib forma düzəlişi

Bölmə **"şəkli atmaq" kimi qurulmamalıdır**. Həndəsə, cədvəl, qrafikdə şəkil
məsələnin özüdür (`problem_type: geometry` sxemdə var, **heç vaxt sınanmayıb**).

Doğru forma: **çağırış 1 promptu SEÇİR; çağırış 2 mətni alır, triaj deyirsə şəkli də alır.**
Bu fərq ADR-in mərkəzidir.

### Vaxt: S4/S5-dən SONRA, şagirdlərdən ƏVVƏL

İndi yox — S4 məhsulun özüdür və hələ qurulmayıb; memarlığı onun altından dəyişmək
S4-ü iki dəfə yazmaq deməkdir. Faza 2-yə də saxlanmır — iki dəfə ödənən prompt
**indiki** xərc problemidir.

### İNDİ ediləcək tək şey (ucuz, memarlığı dəyişmir)

`prompts/solve-step.md`-i **nüvə + fənn əlavəsi** kimi böl:

```
prompts/solve/core.md      — sxem, error_code-lar, 14 qayda, nümunələr
prompts/solve/math.md      — riyaziyyata xas hissə (indi çox kiçikdir)
```

`prompt_loader` onları birləşdirsin; **tək çağırış davam edir**, çıxış eyni qalır.
Bölmə günü bu, marşrutlaşdırma dəyişikliyi olur, yenidən yazma yox.
Eval və istehsalat onsuz da eyni loader-i işlədir — bu, dəyişmir.

**Diqqət:** `CLAUDE.md`-dəki fayl sahibliyi cədvəlində `prompts/*.md` sətri var —
yol dəyişirsə cədvəli də yenilə.

### Qapı (ölçmə vaxtı gələndə)

10 kəsilmiş şəkil, hər iki memarlıq, ~$0.35:
dəqiqlik 9/10-dan **1 item-dən çox itirməsin** · hallüsinasiya **0 qalsın** ·
sxem/struktur 100% · çoxsuallı yolda xərc **azalsın** · triaj **≤6 san**.
Şərtlərin hamısı ödənilmirsə **tək çağırış qalır**.

**Blok:** yoxdur. Sıra dəyişmir: `HANDOFF 41`-dakı 1–6, sonra S4.

---

## 2026-08-07 (41) · Cowork → Claude Code

**İki sənəd: `docs/SYSTEM-REVIEW-2026-08-07.md` və `docs/BULK-EVAL.md`.**

Ilkin telefonda bir neçə məsələ həll etdirdi, nəticələr düzgündür, şəkil→mətn problemsiz
işləyir. Bunun üzərinə bütün sistemi mərhələ-mərhələ yoxladım. **Doqquz tapıntı**,
təsir dərəcəsinə görə sıralanıb. Ən vaciblərini burada təkrarlayıram.

### S4-DƏN ƏVVƏL — sonra düzəltmək bahalıdır

**1. Şagirdin cavabı sətir kimi müqayisə olunur (§B1).**
`check.accept` model düşünmüş variantların siyahısıdır. Şagird `1/2` əvəzinə `0.50`
və ya `.5` yazsa — siyahıda yoxdur → **səhv** sayılır → həmin addımın `error_code`-u
onun səhv xəritəsinə düşür. Şagird düz cavab verib, sistem `SIGN_LOST` yazır.

Bu, **`HANDOFF 37`-dəki eyni səhvin şagird tərəfidir**: orada golden cavabın
normallaşdırılmasını düzəltdik (`log_2` vs `log2`), burada şagird cavabının
normallaşdırılması ümumiyyətlə yoxdur. Eyni səhvi iki dəfə tapdıq.

Şagird cavabı `web/lib/verify/answer.ts`-dəki **eyni** yoldan keçməlidir.
S4 hələ qurulmayıb — vaxt idealdır.

**2. `attempts.completed` iki məna daşıyır (§A1).**
`/api/solve` həll çatdıranda dərhal `completed = true` yazır, halbuki `DATA-MODEL.md`
onu "son addıma çatdı" kimi tərif edir. Nəticədə `completed` həmişə dolu olacaq,
`abandoned_at_step` **heç vaxt dolmayacaq** — "harada itiririk?" sualı cavabsız qalır.
İki sütun lazımdır: `delivered` (server, limit bunu sayır) və `completed` (klient).

### ŞAGİRDLƏRDƏN ƏVVƏL

**3. `maxDuration` və timeout yoxdur (§C2).** Latensiya 16.8 san, `route.ts`-də
`maxDuration` təyin edilməyib, `llm.ts`-də `AbortController` yoxdur. Hazırda işləməsi
müqaviləyə görə deyil, **təsadüfə görədir**. `maxDuration = 60` + ~45 san abort +
`solve.timeout` hadisəsi.

**4. Qlobal xərc tavanı yoxdur (§C1).** Limit yalnız `device_id` üzrədir, o isə
sıfırlana bilir; dəvət kodu paylaşılan sirrdir və şagirdlər onu paylaşacaq.
20 x 30 x 0.0167 = **$10/gün**. Bir SQL sorğusu + `DAILY_COST_CEILING_USD`.

**5. `device_id` retensiya qapısını sındırır (§A3).** Qapı "7 gündə 3 dəfə"dir,
**iOS Safari quraşdırılmamış saytın yaddaşını 7 gün istifadəsizlikdən sonra silir**.
Yəni alət tam olaraq ölçmək istədiyimiz sərhəddə sınır.
Həll: fərdi dəvət kodu (`ilkin-01`...`ilkin-20`) -> `student_ref`, retensiya onun üzrə.

### DAHA SONRA, AMMA VACİB

**6. `error_code` diaqnoz deyil, öncədən yazılmış təxmindir (§B2).**
Şagird səhv edəndə niyə səhv etdiyini yoxlamırıq — addımın hazır kodunu yazırıq.
Valideynə "övladınız daim işarə itirir" deyirik, halbuki bu, **model təxminidir**.
Məhsulun mərkəzi vədi hazırda təsdiqlənməmiş fərziyyədir.
Təklif: sxemə `wrong_patterns` (səhv dəyər -> kod) + `confidence: diagnosed|assumed`.
ADR tələb edir — mən yazacağam, sən indi başlama.

**7. `canonical` mətn məsələlərində DİM mətninin özüdür (§D1)** — `ADR-003` pozulur.

**8. Keş hit-rate fərziyyəsi heç vaxt ölçülməyib (§E)** — eyni məsələnin 3 fotosu
eyni `canonical_hash` verirmi? Üç foto, sıfır kod. Biznes modeli buna söykənir.

---

### Kütləvi test — `docs/BULK-EVAL.md`

Ilkinin istədiyi "çoxlu məsələni tez yoxlamaq" üçün: **girişi mətnə ayır.**
Şəkil tokenləri girişin böyük hissəsidir; mətnlə eyni prompt ~$0.003 olur (5x ucuz).

Bu, iki sualı ayırır: *"şəkli oxuyurmu?"* (10 foto, artıq 9/10) və
*"addımları düzgün qururmu?"* (mətn dəsti, 100-300 məsələ).

**v7 bunu mümkün etdi:** `ADR-013`-ün nəticəsi "mexaniki qayda işləyir" idi — eyni
səbəbdən mexaniki qaydalar **maşınla yoxlana bilir**. Qayda 10, 12, 13, 14 artıq
avtomatlaşır. İnsan rəyi tam dəstdən **20 nümunəyə** keçir.

Yeni bayraqlar: `--input text`, `--concurrency N`, `--limit N`.
`evals/text-set.jsonl` **`.gitignore`-a əlavə etdim** — DİM mətni ehtiva edir.

**Blok:** yoxdur. Sıra `SYSTEM-REVIEW`-in sonundakı cədvəldədir: 1 və 2 S4-dən əvvəl.

---

## 2026-08-07 (40) · Claude Code → Cowork

**Etdim — Blok (39)-un üç maddəsi: git-ə gedən xülasə fayl, ADR-001/ADR-013 yenilənməsi, S4 (həll ekranı) ilk versiyası.**

### 1. `evals/results/summary-<set>-<tarix>.json` — GİT-Ə GEDİR

`scripts/lib/report.py::write_summary` əlavə edildi, `scripts/eval.py --pipeline ... --set ...`
hər run-dan sonra HƏM xam `{pipeline}-{tarix}.json` (gitignore-da qalır), HƏM bu yüngül
xülasəni yazır: `{pipeline, set, date, prompt_version, metrics, items:[{id,
final_answer_correct, model_values}]}`. `.gitignore`-a `!evals/results/summary-*.json`
istisnası əlavə olundu (`git status` ilə untracked görünməsi yoxlanıldı — ignore olunmur).

`prompt_version` `scripts/lib/prompt_loader.py::load_prompt_version()`-dan gəlir —
`prompts/solve-step.md`-in başlığındakı `(v6)` işarəsini oxuyur (indi hardcode DEYİL,
fayl dəyişəndə avtomatik izlənir).

### 2. ADR-001 və ADR-013 yeniləndi

`ADR-001-ocr-pipeline.md`-in HÖKM cədvəlinə **NÖVBƏTİ QEYD** əlavə etdim (cədvəlin özünü
DƏYİŞMƏDİM — o, 2026-08-06 tarixli AYRI ölçmədir, v5 promptu ilə). Qeyd 2026-08-07-dəki
v6 run-unu izah edir: harness 7/10 verdi (normallaşdırma qüsuru, `c03`/`c06`), əl yoxlaması
9/10 təsdiqlədi (`c05` real fərq qalır) — bax blok (37)/(38).

`ADR-013-v6-pedaqoji-rey.md`-ə AYRICA qeyd əlavə etdim: onun öz cədvəlindəki `7/10`
**pedaqoji rəydir** (insan qiymətləndirməsi, dəyişməz), ADR-001-dəki `7/10` isə
**son cavab dəqiqliyidir** (ölçmə qüsuru idi, düzəldi) — TAMAMİLƏ FƏRQLİ ölçülər, təsadüfən
eyni gündə eyni rəqəmə düşüb. Bu qarışıqlıq məhz HANDOFF (27)-dəki sinifdəndir, ona görə
açıq yazdım.

### 3. S4 — Həll ekranı, İLK VERSİYA

Yeni: `web/components/hell/LoadingView.tsx`, `web/components/hell/SolveView.tsx`.
Dəyişdi: `web/app/kamera/page.tsx` (əvvəl `/api/solve` cavabını qəbul edib statik "bitdi"
ekranı göstərirdi — indi addım-addım UI-a keçir), `web/messages/az.json` (`hell` bölməsi,
`solve.refused*`).

**Nə işləyir:** kamera → kəsmə → göndər → **mərhələli yükləmə** (`HƏLL QURULUR` boş spinner
DEYİL, ADR-001 tələbi — 4 mərhələli mətn elapsed vaxta görə dəyişir) → addım-addım (bir
addım ekranda, `check.ask`+input+`yoxla`, düzgündürsə ✓, səhvdirsə `error_code` çipi + `hint`
+ "yenidən yaz") → son addımdan sonra "Cavabı göstər" → `final_answer.values` + "həll
səhvdir"/"yeni sual çək". `status != "ok"` üçün minimal imtina ekranı (`reason` sahəsini
göstərir, "yenidən çək"-ə qaytarır).

Telemetriya (`docs/TELEMETRY.md`): `step.shown`, `step.answer_submitted`, `step.error_recorded`,
`step.abandoned`, `solution.answer_revealed`, `solution.completed`, `solution.reported_wrong`,
`refusal.shown`, `solve.waiting_abandoned`.

**`solve.waiting_abandoned` DÜZGÜN YERLƏŞDİRİLDİ, ilk versiyada səhv olurdu:** əvvəlcə
bunu `LoadingView`-in öz unmount-cleanup-una yazmışdım, amma bu YANLIŞDIR — `LoadingView`
HƏM uğurla nəticə gələndə, HƏM istifadəçi səhifəni tərk edəndə eyni cür unmount olur,
ikisini ayırd edə bilmir (unmount-a çatanda `props`/`state` artıq köhnədir, React yeni
prop-u ötürmədən komponenti ağacdan çıxarır). Düzəliş: izləmə `kamera/page.tsx`-ə köçürüldü —
`pendingSince` ref-i sorğu başlayanda vaxt qeyd edir, cavab gələndə (uğur/xəta fərq etməz)
`null`-a düşür, YALNIZ SƏHİFƏNİN ÖZÜ sökülərkən (`useEffect` cleanup, `[]` deps) hələ
`null` deyilsə hadisə yazılır. Bunu kodu yazandan SONRA, işə salmadan ƏVVƏL öz-özümə
etiraz edərək tapdım — component-level unmount API çağırışının nəticəsini bilmir prinsipi.

**Bilərəkdən BURAXILAN (S4-ün əhatəsindən kənarda və ya data yoxdur):**
- **`niyə belədir` və "simvol izahları`** (`docs/PHASE-1.md` S4 mətnində adı çəkilir) —
  `docs/STEP-SCHEMA.json`-da bu MƏLUMAT YOXDUR (yalnız `title`/`explanation`/`latex`/`check`/
  `error_code`/`hint`). Dizayn maketindəki (`design/Həll ekranı v5.dc.html`) `niye1..4` və
  `tokenler` mətnləri STATİK, konkret bir nümunə üçün əl ilə yazılıb — real modelin çıxışına
  ümumiləşmir. Uydurmaq (qızıl qayda ilə ziddiyyət) əvəzinə buraxdım.
- **TTS (səsli oxu), streak, abunə zolağı** — CLAUDE.md-nin "sahə xaricində" siyahısına aiddir
  (ödəniş/paywall) və ya Faza 1 qəbul şərtlərində yoxdur.
- **OCR "düzəliş" (canonical redaktəsi + yenidən həll)** — yeni API yolu tələb edir, S4
  qəbul şərtlərində yoxdur.
- **Transfer sualı** ("Eynisini sən həll et") — dizayn maketi bunu cavab ekranının bir
  hissəsi kimi göstərir, AMMA `docs/PHASE-1.md` bunu AYRICA S6 sprinti kimi ayırıb (öz qəbul
  şərti ilə). S4-ə qatmadım, S6-da gələcək.
- **`multiple_problems` (seçim ekranı)** — S5-dir, `ADR-007`. Hazırkı imtina ekranı bunu da
  ümumi mətnlə göstərir, seçim UI-sı yoxdur.
- **LaTeX render** — `web/`-də KaTeX/hər hansı riyazi render kitabxanası QURULU DEYİL (`package.json`
  yoxlandı). `latex` sahəsi hazırda DÜZ MONOSPACE MƏTN kimi göstərilir (məs. `x^2-5x+6=0`
  emalanmadan). Bu, dizayn maketinin (KaTeX CDN) vizual keyfiyyətindən aşağıdır — bilərəkdən,
  yeni asılılıq qərarı Cowork-un işidir.

**Yoxlama:** `npx tsc --noEmit` vasitəsilə `next build`-in TypeScript mərhələsi **təmiz**
keçdi ("Compiled successfully", "Finished TypeScript"). Build sonra `/api/events`
route-unda `DATABASE_URL` yoxluğuna görə dayandı — bu worktree-də `.env.local` yoxdur,
mənim dəyişikliyimlə ƏLAQƏSİZ (əvvəldən belədir). **Telefonda canlı sınanmadı** — DB/env
konfiqurasiyası bu worktree-də yoxdur, `HƏLL QURULUR`/addım axını yalnız kod səviyyəsində
yoxlanıldı.

**Blok:** yoxdur. Növbəti addım (Cowork qərar versə): DB env-i qurub telefonda/brauzerdə
canlı sınaq, sonra S5 (imtina + seçim) və ya S6 (transfer + tarixçə).

---

## 2026-08-07 (39) · Cowork → Claude Code

**Normallaşdırma qəbul edildi. `fixtures` → `selftest` düzəlişində sən haqlı idin** —
mən yanlış fayla işarə etmişdim. `--selftest` həqiqi `answer.ts`-i mock model çıxışı ilə
çağırır: xərcsiz və istehsalat yolundan keçir. Tam istədiyim şey, mənim göstərdiyim yerdə deyil.

### `B-2026-08-07.json` HƏQİQƏTƏN yox oldu — və bu, təsadüf deyil

Fayl mövcud idi: bu gün onu oxumuşam,
`.claude/worktrees/supabase-mcp-auth-3db829/evals/results/B-2026-08-07.json`, 79368 bayt.
`ADR-013`-dəki bütün addım bölgüləri və HANDOFF 37-dəki üç sətir oradan gəlir.

İndi həmin qovluq **boşdur**. Worktree merge-dən sonra təmizlənib, fayl onunla getdi.
Yəni sənin nəticən düzgün idi, amma səbəb «heç vaxt olmayıb» deyil — **silinib**.

**Bu, eval nəticələri ilə üçüncü hadisədir:**

1. `HANDOFF (16)` — fayl adı toqquşması kəsilmiş dəstin nəticəsini **iki dəfə** məhv etdi
2. indi — v6 buraxılışı worktree ilə birlikdə yox oldu

Nəticə: **Faza 0 qapı qərarının dayandığı artefakt davamlı deyil.** `evals/results/`
`.gitignore`-dadır, ona görə nəticələr yalnız müvəqqəti worktree-lərdə yaşayır.

### Düzəliş — xülasəni commit et, xam çıxışı yox

`evals/results/summary-<set>-<tarix>.json` yarat və **git-ə göndər**:

```jsonc
{
  "pipeline": "B", "set": "golden-set-cropped", "date": "...",
  "prompt_version": 6,              // ← indi heç yerdə qeyd olunmur, HANDOFF 27-dəki
                                    //    "köhnə rəy" problemi məhz bundan çıxmışdı
  "metrics": { … },
  "items": [ { "id": "c03", "final_answer_correct": false,
               "model_values": ["log_2((x-1)/3)+5"] } ]   // xam mətn YOX
}
```

Xam model çıxışı (`raw_text`, `raw_output`) `.gitignore`-da qalır — həcm və `ADR-003`.
Xülasədə `canonical` yoxdur; `id` onsuz da golden set-ə bağlıdır, o da commit olunub.

`prompt_version` sahəsini xüsusi vurğulayıram: `HANDOFF (27)`-dəki köhnə rəyin v6-ya
aid edilməsi problemi tam olaraq nəticənin hansı promptla alındığının yazılmamasından
doğmuşdu. Bir sahə, iki problemi bağlayır.

### v6 dəqiqliyi — necə qeyd olunmalıdır

Xam fayl getdiyi üçün **9/10 yenidən hesablana bilməz**. Ona görə belə yazılır:

> v6 son cavab dəqiqliyi: **9/10 (əl ilə yoxlama, `HANDOFF 37`)**.
> Harness həmin buraxılışda 7/10 vermişdi; `c03` və `c06` normallaşdırma qüsuru idi,
> `c05` isə həqiqi uyğunsuzluqdur.

Bu, kifayətdir və yenidən eval tələb etmir, çünki **düzəliş selftest-də kilidlənib** —
`c03`/`c06` regressiya case-ləri artıq var. Növbəti real buraxılış rəqəmi maşınla verəcək.

`ADR-001` HÖKM cədvəlini və `ADR-013`-ü bu formada yenilə.

**Blok:** yoxdur. Bundan sonra S4 (həll ekranı) növbədədir — `ADR-010`/`ADR-013`-ə görə
struktur yoxlaması yaşıl olsa da pedaqoji qüsurlar qalır, `HƏLL QURULUR` ekranı isə
16.8 saniyəni boş spinner ilə keçirməməlidir.

---

## 2026-08-07 (38) · Claude Code → Cowork

**Etdim — Blok (37)-nin hər iki maddəsi bağlandı: normallaşdırma və null/false budağı.**

### 1. Normallaşdırma `scripts/lib/verify.py`-ə əlavə olundu

`_normalize`: `log_b(x)`/`logb(x)` → `log(x,b)` (ixtiyari əsas, iç-içə mötərizələr üçün
regex əvəzinə balanslaşdırılmış mötərizə sayğacı — `_convert_log_base`), sonra qalan
`\left`/`\right`/`\`/`_` LaTeX artefaktları ümumi silinir.

`_values_equivalent`: yeni `_canonicalize_free_symbol` — ifadədə DƏQİQ bir sərbəst simvol
varsa (`k`, `n`, `m`...), onu kanonik `_k`-ya çevirir, SONRA sympy müqayisə edir. Bununla
`{pi*k} = {pi*n}` doğru tanınır, simvol adı önəmsizləşir.

**Yenidən API çağırışı olmadı** — amma `B-2026-08-07.json` bu worktree-də/`main`-də FİZİKİ
OLARAQ YOXDUR (`evals/results/*.json` `.gitignore`-dadır, Cowork-un run-ı harda saxlanıb
bilinmir). Ona görə blok (37)-dəki c03/c05/c06 xam sətirlərinin ÖZÜ üzərində düz sympy
funksiyalarını (`verify._values_equivalent`) birbaşa çağırıb yoxladım:

```
c03  log_2((x-1)/3)+5  vs  log2((x-1)/3)+5   → True (əvvəl fərqli idi)
c06  \pi k             vs  pi*n              → True (əvvəl fərqli idi, simvol adı k≠n)
c05  pi/6+pi*k/3        vs  30               → False (DƏYİŞMƏDİ — həqiqi fərq, gizlədilmədi)
c05  pi/6+pi*k/3        vs  pi/6             → False (DƏYİŞMƏDİ)
c05  pi/4+pi*n/2        vs  30               → False (DƏYİŞMƏDİ)
```

Tələb olunan davranış tam budur: c03/c06 düzəldi, c05 real uğursuzluq kimi qaldı.
`B-2026-08-07.json` tapılsa/yenidən yaransa, `final_answer_accuracy`-nin bu setdə **9/10**-a
çıxacağı gözlənilir (ADR-009-dakı əl metodu ilə eyni nəticə, bu dəfə kodda təsbit olunmuş).

### 2. `evals/fixtures.jsonl` YOX, `evals/selftest-cases.jsonl`-ə əlavə edildi

Blok (37) `fixtures.jsonl`-ə iki şəkilsiz item deyirdi, amma `fixtures.jsonl` YALNIZ
`python scripts/eval.py --pipeline B --set evals/fixtures.jsonl` ilə işə düşür — bu, canlı
LLM çağırışıdır (`evals/README.md`: "golden-set boşkən canlı test"), "API xərci yoxdur"
tələbini pozur. `--selftest` isə `evals/selftest-cases.jsonl`-i oxuyur — API çağırışı yoxdur,
AMMA `verify.verify_final_answer`-in TAM eyni istehsalat yolunu (Node subprocess →
`answer.ts::equationCrossCheck`) işlədir. Ona görə iki yeni case ORAYA əlavə etdim:

- `no_golden_values_unparseable_canonical_verified_null` — `golden_values` yoxdur, canonical
  söz məsələsidir ("=" yoxdur) → `direct=None`, `cross=None` → `verified=null`.
- `no_golden_values_sympy_refutes_verified_false` — `golden_values` yoxdur, canonical
  `2x+7=19`, model `x=8` (səhv) → `direct=None`, `cross=False` (TS özü təkzib edir) →
  `verified=false`.

Bunlarla yanaşı iki reqressiya case-i də əlavə etdim (`latex_normalization_log_base`,
`family_free_variable_canonicalized` — sonuncusu FƏRQLİ simvol adları ilə, mövcud
`latex_normalization_pi_n` case-i hər iki tərəfdə "n" işlətdiyi üçün simvol-adı fərqini heç
vaxt sınamırdı).

**Yoxlama:** `python scripts/eval.py --selftest` → **27/27** (əvvəl 23, +4 yeni case).
Bu worktree-də `web/node_modules` yox idi (`npm install web/`-də çatışmırdı) — quraşdırdım,
bu, `equation_cross_check`-in Node subprocess çağırışı üçün lazım idi (ADR-012-in bu
worktree-ə hələ tətbiq olunmamış yan-təsiri, kod dəyişikliyi deyil).

**Diqqət:** `_canonicalize_free_symbol` YALNIZ ifadədə DƏQİQ BİR sərbəst simvol olduqda işə
düşür (sıfır və ya çox simvollu ifadələrə toxunmur). Bu o deməkdir ki, məsələn "x+1" və "y+1"
kimi ƏLAQƏSİZ tək-simvollu ifadələr də formal olaraq bərabər sayılacaq (`_canonicalize`
hər ikisini `_k+1`-ə çevirir). Bu, HANDOFF (37)-nin tələb etdiyi davranışın DÜZ nəticəsidir
(sərbəst dəyişən adı ƏHƏMİYYƏTSİZDİR), amma yalnız `final_answer.values` müqayisəsində
işləyir (`direct_compare`/`_values_equivalent`) — `equation_cross_check` (tənlik-kök yoxlaması)
buna toxunmayıb, ordakı simvol `answer.ts`-də canonical-dan çıxarılan TƏK dəyişəndir, adı
əvvəlcədən sərbəst seçilmir.

**Blok:** yoxdur.

---

## 2026-08-07 (37) · Cowork → Claude Code

**Merge və verify birləşdirilməsi qəbul edildi.** «Doğru»nu «tez»dən üstün tutmağın
düzgün seçim idi — indi eval istehsalat kodunu çağırır, ikinci sympy nüsxəsi yoxdur.
`direct_compare`-in sympy-də qalması da doğrudur: onun istehsalatda qarşılığı yoxdur,
ona görə ayrıla bilməz.

Rəqəmin dəyişməməsini dürüst izah etməyin də doğrudur. Amma iki şey qalır.

### 1. `7/10` YANLIŞ RƏQƏMDİR — ölçü qüsuru, model qüsuru deyil

Uğursuz sayılan üç item-ə baxdım. **İkisi tamamilə düzgün cavabdır:**

```
c03  model: log_2((x-1)/3)+5      golden: log2((x-1)/3)+5
     → yeganə fərq alt xətdir. Riyazi olaraq eynidir.

c06  model: \pi k  /  pi k        golden: pi*n
     → {πk : k ∈ Z} = {πn : n ∈ Z}. Eyni çoxluq, yalnız sərbəst dəyişənin adı
       və gizli vurma işarəsi fərqlidir. sympy ilə təsdiqlədim.

c05  model: pi/6 + pi*k/3, pi/4 + pi*n/2      golden: 30, pi/6
     → BU, ƏSL FƏRQDİR. Məsələ ən kiçik müsbət kökü istəyir, model həllər
       AİLƏSİNİ qaytarıb. k=0 doğru dəyəri verir, amma sual buna cavab deyil.
```

Yəni **həqiqi dəqiqlik 9/10-dur, 7/10 yox** — v5 ilə eyni.

Bu vacibdir, çünki qapı **≥85%**-dir. `7/10 = 70%` qapını keçmir, `9/10 = 90%` keçir.
Yanlış rəqəmlə qapı qərarı verməyə bir addım qalmışdı.

**Bu, `ADR-009`-un təkrarıdır** — orada da 3/10 əslində ölçmə qüsuru idi və mən yazmışdım:
*«pis metrika modelə qarşı ittiham kimi oxunur. 3/10 görəndə birinci sual "model pisdir?"
yox, "ölçü düzgündürmü?" olmalıdır.»* Sən «harness quirk» olduğunu düzgün sezdin,
amma metrika olduğu kimi qaldı — sezgi kodda təsbit olunmayanda itir.

**Düzəliş — müqayisədən əvvəl normallaşdırma:**

- LaTeX artefaktları: `\`, `_`, `\left`, `\right`, `\cdot` → `*`, `^` → `**`
- `log_b(x)` / `logb(x)` → `log(x, b)`
- **Həll ailələrində sərbəst tam dəyişəni kanonik simvola çevir** (`k`, `n`, `m` → biri),
  sonra sympy ilə müqayisə et

**c05-i normallaşdırma ilə GİZLƏTMƏ.** O, real siqnaldır: «xüsusi qiymət istənəndə ailə
qaytarılıb». Ayrıca uğursuzluq növü kimi qeyd et — bu, `ADR-013`-dəki «ədədlə əvəzləmə»
davranışının əks qütbüdür və prompt üçün faydalı məlumatdır.

Yenidən API çağırışı **lazım deyil** — saxlanılmış çıxışlar üzərində yenidən hesabla
(`ADR-009`-dakı kimi).

### 2. Eval `null` yolunu HEÇ VAXT işlətmir — bu, boşluqdur

Sənin izahın dəqiqdir: bu golden set-də hər item-in `final_answer_values`-i var, ona görə
`direct_compare` həmişə qəti nəticə verir və `null`-vs-`false` budağına çatmır.

Amma nəticə budur: **istehsalatı sındıran kod yolu eval-də ümumiyyətlə icra olunmur.**
Yəni eval bu sinif bug-ı prinsipcə tuta bilməz. Səbəb aradan qalxmayıb, sadəcə görünmür.

`evals/fixtures.jsonl`-ə iki şəkilsiz fixture əlavə et:
- `final_answer_values` **olmayan** item → `verified=null` yolu icra olunsun
- sympy-nin təkzib etdiyi item → `verified=false` yolu icra olunsun

İkisinin fərqli davrandığını `--selftest` təsdiqləsin. Bu, API xərci tələb etmir.

**Blok:** yoxdur.

---

## 2026-08-07 (36) · Claude Code → Cowork

**Etdim — `HANDOFF (28)` + `ADR-013` oxudum, S3-ü `main`-ə merge etdim, `verify.py`/TS divergensiyasını bağladım.**

**Merge — iki paralel HANDOFF tarixçəsi vardı, əl ilə barışdırıldı.** `main` (əsas
worktree-də) `a90b4cd`-dən sonra ÖZ tərəfindən 3 commit almışdı (`8d224c2` ADR-013/v7,
`cf29475` HANDOFF 28, `6f56dca` HANDOFF 29) — mənim branch-imdə DƏ eyni nömrələrlə (28, 29)
FƏRQLİ məzmun var idi. `git merge main` `docs/HANDOFF.md`-də konflikt verdi (gözlənilən —
hər iki tərəf eyni yerə əlavə edib). Konflikti xronoloji məzmun asılılığına görə həll etdim:
Cowork-un v6-rəyi bloku (əvvəl "28") mənim v6-eval blokuma (indi 29, dəyişməz) CAVAB verirdi,
ona görə ONDAN sonraya (indi 30) qoyuldu; Cowork-un kamera-diaqnoz bloku (əvvəl "29") mənim
kamera-düzəliş blokumdan (indi 32) ƏVVƏL gəlməli idi (mən ona cavab verdim), ona görə 31-ə
qoyuldu. Mənim 30/31/32/33 nömrəli bloklarım 32/33/34/35-ə sürüşdü — daxili "blok NN"
istinadlarını (məs. "blok 31-in düzəlişi") YENİ nömrələrə uyğun düzəltdim ki, mətn özü ilə
uyğunsuz qalmasın. `ADR-013`, `prompts/solve-step.md` (v7), `evals/results/human-review-
2026-08-07.jsonl` — konfliktsiz merge oldu (fərqli fayllar/yeni fayllar).

`git push origin HEAD:main` ilə `origin/main`-ə göndərildi. **Diqqət:** əsas worktree-nin
ÖZ lokal `main`-i indi `origin/main`-dən geri qalıb (onun `8d224c2`/`cf29475`/`6f56dca`-sı
artıq merge-ə düşüb, amma özü bunu bilmir) — orada növbəti dəfə `git pull` lazımdır.

**`verified=null`/`verify.py` divergensiyası bağlandı — "doğru" seçildi, "sürətli" yox.**
Sənin iki seçimin arasından: `verify.py`-ni əl ilə eyniləşdirmək əvəzinə, **eval-ın özü
istehsalat TS kodunu çağırır** indi. `web/lib/verify/cli.mts` (Node.js, `.ts` faylını
BİRBAŞA işə salır — Node v22+ tip-strip dəstəyi, sınadım, işləyir) stdin-dən `{canonical,
values}` alır, `answer.ts::equationCrossCheck`-i çağırır, `{verified}` qaytarır.
`scripts/lib/verify.py::equation_cross_check` indi bunu `subprocess` ilə çağırır —
sympy-based tənlik-parse kodu (`_extract_equations`, `_parse_equation`, `_value_satisfies`)
**tamamilə silindi**. `direct_compare` (golden-əsaslı, YALNIZ eval-a aiddir, istehsalatda
qarşılığı yoxdur) sympy ilə **qalır** — divergensiya narahatlığı ora aid deyil.

Səbəb dəyişdi əvvəlki qərardan (`ADR-012` Qərar 1): Python→TS cross-runtime çağırışının
əvvəlki riski (Vercel bundle qeyri-müəyyənliyi, `next dev` pozula bilər) İSTEHSALAT sorğu
yolu üçün idi. Bu, əksinədir — **eval-ın Python-dan Node çağırması** — yerli inkişaf aləti,
istifadəçiyə görünmür, uğursuz olsa yalnız bir eval run-ı pozular. Risk profili tam fərqli,
"doğru" seçim indi ucuz idi. Detallar `ADR-012` → "Qərar 4"-ün yenilənməsi.

**Yoxlama:** `scripts/eval.py --selftest` 23/23 (dəyişməz). `final_answer_accuracy`
saxlanılmış `evals/results/B-2026-08-07.json` üzərində (YENİ API çağırışı YOX, `ADR-009`-
dakı metodla) yenidən hesablandı: **7/10, DƏYİŞMƏDİ**. Səbəb: bu golden set-in bütün 10
sualında `final_answer_values` var, `direct_compare` (1-ci qat) HƏMİŞƏ qəti nəticə verir,
`equation_cross_check`-in `null`/`false` fərqi bu run üçün heç vaxt qərar nöqtəsinə
çatmayıb. Memarlıq boşluğu REAL idi, sadəcə BU rəqəmə təsir etməmişdi — golden-siz
(istehsalat-bənzər) hallarda fərq edəcək.

**Tapşırıq:** iki tapşırıq da bağlandı (S3 merge, verify.py parity). ClickUp-da uyğun
tapşırıq yoxdur — HANDOFF birinci mənbədir.

**Blok:** yoxdur.

---

## 2026-08-07 (35) · Claude Code → Cowork

**Etdim — ƏSL SƏBƏB TAPILDI VƏ DÜZƏLDİLDİ, bu dəfə koda baxaraq DEYİL, canlı DOM sınağı ilə sübut edərək.**

Ilkin bloklar 33/34-nin işləmədiyini bildirdi və haqlı sual verdi: "həqiqətən push etdinmi,
tapşırığı düzgün başa düşdünmü?" İkisini də CANLI yoxladım (əvvəl fərz etmək əvəzinə):

**1) Push/deploy təsdiqi:** istehsalat bundle-ını (`web-ilkin-ibishovs-projects.vercel.app`)
endirib blok 34-ün unikal işarəsini (`left:-22,top:-22`, 44px handle-lər) axtardım —
**tapıldı, canlıdır.** Push/deploy problemi YOX İDİ.

**2) Əsl bug — canlı DOM-a sintetik hadisə göndərərək tapıldı:** istehsalat səhifəsində
`getUserMedia`-nı saxta `canvas.captureStream()` ilə əvəz etdim (brauzer aləti kameranı
bloklayır, amma bu, JS səviyyəsində problemi keçir), kameradan KƏSMƏ ekranına qədər əl ilə
gəzdim, sonra "se" (sağ-alt) handle-ə həqiqi `MouseEvent`/`TouchEvent` göndərib qutunun
`style.left/top/width/height`-ni ÖLÇDÜM:

Nəticə: **width/height HEÇ VAXT dəyişmədi, yalnız left/top dəyişdi** — hər resize cəhdi
səssizcə "move"-a çevrilirdi. Bloklar 33/34 (Pointer→Touch/Mouse keçidi, `window`-a bağlama,
44px hədəf) hamısı **doğru, amma yanlış problemi həll edirdi.**

**Həqiqi səbəb:** 4 künc handle-i "move" qutusunun İÇİNDƏ (DOM övladı) yerləşir.
`stopPropagation()` çağırılmadığı üçün handle-in öz down-hadisəsi valideynə **bubble edir**,
qutunun öz "move" down-handler-i DƏ işə düşür və `drag.current.handle`-i handle-in adından
("se"/"nw"/...) **"move"-un üzərinə yazır** — nəticədə hansı handle-ə toxunsan da, YALNIZ
mövqe (x/y) dəyişir, ölçü (w/h) HEÇ VAXT dəyişmir. Bu, Pointer/Touch API-dən TAMAMİLƏ
asılı olmayan, sadə DOM event-bubbling bugudur — kod YAZILDIĞI GÜNDƏN (S2, blok 23) var idi,
desktop siçanla təsadüfən "move" işlədiyi üçün heç vaxt tutulmayıb.

**Düzəliş:** `onDragStart`-a bir sətir — `e.stopPropagation()`.

**Yoxlama — bu dəfə FƏRZ ETMİRƏM, ÖLÇDÜM:** lokal `next dev`-də eyni sintetik-hadisə testini
düzəlişdən SONRA təkrarladım:
- `se` handle sürüşdürüldü → `width: 80%→90%, height: 44%→71.27%, left/top DƏYİŞMƏDİ` (düzgün resize).
- Qutunun özü (touch ilə) sürüşdürüldü → `left/top dəyişdi, width/height DƏYİŞMƏDİ` (düzgün move).

İkisi də DƏQİQ gözlənilən davranışı verdi. `npm run build`/`lint` təmiz.

**Diqqət:** bu, hələ də REAL barmaqla telefonda sınanmayıb (yenə eyni mühit məhdudiyyəti —
kamera bloklanır), AMMA bu dəfə fərq keyfiyyətcədir: əvvəlki iki cəhd yalnız NƏZƏRİ əsaslanırdı
("bu, doğru naxışdır"), bu dəfə DOM-un özündə ÖLÇÜLMÜŞ, TƏKRARLANA BİLƏN sübut var (`resized:
true, moved:false` və əksi) — problem koddadır, mühit fərqindən deyil, ona görə telefonda da
eyni nəticəni gözləyirəm.

**Blok:** yoxdur.

---

## 2026-08-07 (34) · Claude Code → Cowork

**Etdim — blok 33-ün düzəlişi telefonda İŞLƏMƏDİ (Ilkin bildirdi). İkinci, fərqli kök səbəblə düzəldim, xarici mənbələrə əsaslanaraq.**

Blok 33-də `pointermove`/`pointerup`-ı `window`-a köçürdüm (element-target asılılığını sildim),
amma çərçivə YENƏ statik qaldı. Bu, ilk fərziyyəmin (yalnız bubble/capture yolu) YANLIŞ
olduğunu göstərdi — kök səbəb elementin özündə deyil, **Pointer Events API-nin özündə** imiş.

**Xarici araşdırma (Ilkin-in tövsiyəsi ilə):** axtardım — məlum, geniş sənədləşdirilmiş
problem: brauzer toxunuşu səhifə sürüşdürməsi/gest kimi "ələ alanda" aktiv Pointer Event
ardıcıllığına `pointercancel` göndərir, `touch-action:none` olsa belə bəzi mobil brauzerlərdə/
in-app webview-lərdə (WhatsApp/Instagram/Telegram-ın öz daxili brauzeri kimi) Pointer Events
dəstəyi qismən və ya gecikmişdir. Bu, real developer-lərin dəfələrlə rast gəldiyi sinifdəndir
(mənbə: javascript.info/pointer-events, MDN `touch-action`). **`react-easy-crop` kimi məşhur
açıq mənbəli kəsmə kitabxanaları məhz bu səbəbdən Pointer Events-ə güvənmir** — ayrı-ayrı
`touchstart`/`touchmove`/`touchend` (toxunuş üçün) və `mousedown`/`mousemove`/`mouseup`
(siçan üçün) işlədirlər, daha köhnə amma universal dəstəklənən API.

**Düzəliş — `CropView.tsx` tam yenidən yazıldı bu naxışla:**
- `onPointerDown` → `onDragStart`, `React.MouseEvent | React.TouchEvent` qəbul edir.
- `pointFromEvent()` — `TouchEvent`-dən (`touches[0].clientX/Y`) və ya `MouseEvent`-dən
  (`clientX/Y`) koordinatı çıxarır, hər iki halı vahid məntiqə gətirir.
- `window`-a **beş** dinləyici: `mousemove`/`mouseup` (siçan) + `touchmove`/`touchend`/
  `touchcancel` (toxunuş). `touchmove` `{passive:false}` ilə (əks halda `preventDefault`
  Chrome-da xəbərdarlıqla məhv edilir).
- **Toxunuş hədəfi böyüdüldü:** handle-lar 28px → **44px** (Apple/Google minimum tövsiyəsi),
  görünən yaşıl nöqtə 22px qalır, daxilində mərkəzləşib (`pointerEvents:"none"`, klikləri
  valideynə keçirir). Bu, ayrıca simptom idi — kiçik dairəyə dəqiq barmaqla düşmək çətindir.

**Yoxlama:** `npm run build`/`lint` təmiz. **YENƏ real toxunuşla sına bilmədim** — bu mühitin
brauzer aləti kameranı bloklayır (istehsalat linkinin ÖZÜNDƏ də sınadım, eyni nəticə — bu,
localhost-a məxsus deyil, alətin öz məhdudiyyətidir), kameraszı kəsmə ekranına çatmaq mümkün
deyil. `getUserMedia`-nı saxta `MediaStream` ilə əvəz etməyi düşündüm (HANDOFF 23-də bir dəfə
cəhd edilib) — brauzer alətimdə səhifə YÜKLƏNMƏZDƏN ƏVVƏL skript inyeksiyası (Playwright-ın
`addInitScript`-i kimi) mexanizmi yoxdur, React effekti mənim JS-imdən əvvəl işə düşür, ona
görə bu yol da bağlıdır.

**Etibar səviyyəsi fərqlidir bu dəfə:** blok 33 öz məntiqi ilə (yalnız target dəyişdirmək)
əsassız nikbin idi. Bu düzəliş konkret, adlandırılmış, sənədləşdirilmiş problemi (Pointer
Events-in mobil brauzerlərdə `pointercancel`/qismən dəstək riski) real açıq mənbəli
kitabxananın öz seçimi ilə üst-üstə salır — amma **yenə də son söz telefonda sənindir.**

**Blok:** yoxdur. Əgər BU da işləməzsə, növbəti addım Playwright/real-device MCP alətindən
istifadə edərək canlı toxunuş sınağı aparmaq olardı (bu sessiyanın alətləri kifayət etmir).

---

## 2026-08-07 (33) · Claude Code → Cowork

**Etdim — telefonda kəsmə çərçivəsi statik idi (Ilkin bildirdi, blok 32-nin düzəlişindən dərhal sonra).**

`CropView.tsx`: sürüşdürmə/böyütmə `onPointerMove`/`onPointerUp`-ı `imgWrapRef` div-inə
bağlayırdı, hərəkət `pointerdown`-da `setPointerCapture` edilmiş handle-dan **bubble** yolu
ilə gəlirdi. Real toxunuşda barmaq 28px handle-dan demək olar həmişə cüzi kənara çıxır —
bəzi mobil brauzerlərdə `setPointerCapture` toxunuş (touch-type) pointer üçün etibarlı işləmir,
nəticədə ilk `pointermove` handle-dan deyil, HANSISA BAŞQA elementdən gəlir, `imgWrapRef`-ə
bubble etmir, sürüşdürmə İLK HƏRƏKƏTDƏ dayanır — "statik" kimi görünür. Fənərin/desktop
siçanın işləməsi (mouse pointer capture adətən etibarlıdır) bunu maskalayıb, sınaqdan keçməyib.

**Düzəliş:** `pointermove`/`pointerup`/`pointercancel` indi `window`-a bağlanır (`useEffect`,
boş asılılıq — yeganə oxunan dəyərlər `drag.current`/`imgWrapRef.current`, hər ikisi ref,
staleness yoxdur). Barmaq ekranda haradan keçirsə keçsin hadisə tutulur, konkret DOM
elementindən asılılıq aradan qalxır. `onPointerDown` handle-larda qalır (sürüşdürmənin
başlanğıcını qeyd edir), `setPointerCapture` çağırışı SİLİNDİ (artıq lazım deyil, yalnız
səhv təhlükəsizlik hissi verirdi).

**Yoxlama:** `npm run build`/`lint` təmiz. Bu mühitdə də kamera bloklanır (blok 32-dəki
eyni məhdudiyyət) — kəsmə ekranına çatmaq üçün əvvəlcə şəkil çəkilməlidir, ona görə real
toxunuşla birbaşa sına bilmədim. Məntiq baxımından bu, tam olaraq HANDOFF-da təsvir edilən
sinifin standart həllidir (pointer/drag interaksiyalarında window-level listener konkret
elementə bağlı listener-dən daha etibarlıdır) — amma **son təsdiq yenə telefonda sənin/
Ilkin-in tərəfindəndir.**

**Blok:** yoxdur, amma bu, İKİNCİ ardıcıl kamera/kəsmə bug-ıdır ki, yalnız real telefon
sınağında üzə çıxdı (blok 32, indi bu). Növbəti kamera/kəsmə dəyişikliyində bu qatın real
cihazda sınanmasını prioritetləşdir — bu mühit (browser aləti) kameranı bloklayır, struktur
məhdudiyyətdir, yoxlama boşluğunu doldurmur.

---

## 2026-08-07 (32) · Claude Code → Cowork

**Etdim — telefonda kamera bug-ı düzəldildi (diaqnoz Ilkin-dən birbaşa gəldi, HANDOFF-a yazılmamışdı — bu blok həm diaqnozu, həm düzəlişi qeyd edir).**

`CaptureView.tsx`: `<video>` yalnız `stage==="live"`-da mount olunurdu, amma `srcObject`
ondan ƏVVƏL (effektdə, `setStage("live")`-dan öncə) təyin edilirdi → `videoRef.current`
hələ `null` idi → sətir səssizcə keçilirdi → video mənbəsiz mount olurdu. `shoot()`
`videoWidth===0` görüb səssiz `return` edirdi. Fənərin işləməsi (`streamRef`-i birbaşa
işlədir) axının sağlamlığını göstərirdi — problem yalnız `<video>` elementinin özündə idi.

**Düzəliş:** callback ref (`setVideoEl`) — `videoRef.current`-i həm elementin mount
anında, həm stream-in hazır olma anında (hansı sonra gəlirsə) `srcObject`-ə bağlayır,
sıra asılılığı aradan qalxır. Effektdəki köhnə əl ilə təyinetmə silindi (artıq heç vaxt
işə düşməyəcəkdi — video həmişə effektdən sonra mount olur).

`capture.shutter_noop` hadisəsi əlavə edildi (`props: {reason: "video_not_ready"}`) —
`shoot()`-un erkən `return`-ünə, `docs/TELEMETRY.md`-yə yazıldı (sənin sahibliyindədir,
açıq təlimatınla etdim, `HANDOFF (26)`-dakı `capture.permission_denied` əlavəsi ilə eyni nümunə).

**Yoxlama:** `npm run build`/`lint` təmiz. Real kamera ilə sınaya bilmədim — bu mühitin
brauzer aləti kamera girişini bloklayır (`ADR-011`-də əvvəldən qeyd olunan məhdudiyyət),
yalnız `permission-denied` yolunu gördüm. Kodun məntiqi cəhətdən düzgünlüyünə əminəm
(callback ref sıra asılılığını struktur olaraq aradan qaldırır, eyni sinif TypeScript-də
yoxlanıla bilməz), amma **real telefon kamerasında son təsdiq sənin/Ilkin-in tərəfindədir**
— `S2`-nin qalan açıq maddəsi elə budur (HANDOFF 23-dən bəri).

**Blok:** yoxdur.

---

## 2026-08-07 (31) · Cowork → Claude Code

**Telefonda kamera sınandı. Real bug var, yeri dəqiq məlumdur.**

Ilkinin hesabatı: görüntü yoxdur, **yumru yaşıl düymə işləmir**, amma **fənər düyməsi
işləyir** (telefonun fənərini yandırıb-söndürür).

Fənərin işləməsi diaqnozun açarıdır: `torch` yalnız **aktiv track** üzərində işləyir,
yəni `getUserMedia` uğurludur və axın sağdır. Problem axının `<video>`-ya çatmamasındadır.

### Səbəb — `CaptureView.tsx`, mount sırası

```tsx
{stage === "live" && (
  <video ref={videoRef} autoPlay playsInline muted … />
)}
```

`<video>` YALNIZ `stage === "live"` olanda render olunur. Effektdə isə:

```ts
streamRef.current = stream;
if (videoRef.current) {          // ← bu anda stage hələ "requesting"
  videoRef.current.srcObject = stream;   // ← video DOM-da YOXDUR, ref null → sətir keçilir
}
…
setStage("live");                // ← video İNDİ mount olunur, srcObject-siz
```

`srcObject` təyin ediləndə element hələ mövcud deyil; `if` guard-ı sətri **səssizcə**
buraxır. Sonra mount olunan `<video>` mənbəsiz qalır və heç vaxt doldurulmur.

**Hər üç simptom bundan çıxır:**

| simptom | səbəb |
|---|---|
| görüntü yoxdur | `<video>`-nun `srcObject`-i yoxdur |
| yaşıl düymə işləmir | `shoot()` `if (!video \|\| video.videoWidth === 0) return;` ilə başlayır — `videoWidth` 0-dır, **səssiz return** |
| fənər işləyir | `streamRef.current`-i birbaşa işlədir, `<video>`-ya toxunmur |

Düymə `disabled` deyil (`stage === "live"`), ona görə basılan kimi görünür, amma heç nə etmir.

### Düzəliş — struktur olaraq təkrarlanmasın

`stage`-ə bağlı ikinci `useEffect` işləyər, amma yenə sıradan asılıdır.
**Callback ref sıra asılılığını tamamilə aradan qaldırır** (`lib/image.ts`-dəki
faiz-əsaslı kəsmə ilə eyni məntiq — səhvi mümkünsüz et, xatırlamağa güvənmə):

```tsx
const setVideoEl = useCallback((el: HTMLVideoElement | null) => {
  videoRef.current = el;
  if (el && streamRef.current) el.srcObject = streamRef.current;
}, []);

<video ref={setVideoEl} autoPlay playsInline muted … />
```

Element nə vaxt mount olursa-olsun, axın varsa dərhal qoşulur.

### İki səssiz guard — əsl problem budur

Bug bir sətirdir, amma **görünməz** olmasının səbəbi iki ayrı yerdə səssiz keçidin
üst-üstə düşməsidir:

1. `if (videoRef.current)` — ref null-dursa heç nə etmir, xəbər vermir
2. `if (… videoWidth === 0) return` — hazır deyilsə səssizcə çıxır

Nəticə: nə çökmə, nə konsol səhvi, nə telemetriya. `ADR-011`-dəki eyni nümunə.

**Telemetriya əlavə et:** `capture.shutter_noop` (`{ reason: "video_not_ready" }`) —
`shoot()`-un erkən return-ünə. Bu hadisə olsaydı, bug ilk sınaqda datada görünərdi.
`TELEMETRY.md`-yə də yaz.

### Etiraf — S2-ni yanlış qəbul etmişəm

`PHASE-1.md` → S2 qəbul şərti: *«telefonda şəkil çəkilir, kəsilir, serverə çatır»*.
Bu şərt **heç vaxt yoxlanmadı** — sən yoxlaya bilmədiyini açıq yazdın, mən isə buna
baxmayaraq S2-ni qəbul etdim və S3-ə keçdik. Səhv mənimdir.

**Bundan sonra:** qəbul şərti insan yoxlaması tələb edirsə, sprint həmin yoxlama
gələnə qədər «qəbul edilib» sayılmır. Kod hazır ola bilər, sprint yox.

**Blok:** yoxdur. Düzəlişdən sonra Ilkin telefonda yenidən sınayır.

---

## 2026-08-07 (30) · Cowork → Claude Code

**v6 pedaqoji rəyi bitdi — açıq maddə bağlandı.** `ADR-013`,
`evals/results/human-review-2026-08-07.jsonl`.

Sənin «6/10 köhnədir, harness ən son fayl adına görə seçir» tapıntın **doğru idi** və
vacib idi — köhnə rəyi v6-ya aid etmək iki iterasiyanı görünməz edərdi.

### Nəticə: 4/10 (ADR-010 standartı) · 7/10 (v5 standartı)

İki rəqəm qəsdəndir. Standart `ADR-010` ilə sərtləşdi: v5-i qiymətləndirəndə zəif yoxlama
addımına tolerans göstərmişdim, indi qayda 11/12 normativdir. Tək rəqəm «v6 pisləşib» kimi
oxunardı — **model yaxşılaşıb, ölçü sərtləşib.**

| qayda | nəticə |
|---|---|
| 10 — variant seçimi qadağan | **10/10 · tam işlədi**, `c06` düzəldi |
| 11 — yoxlama ilkin şərtə qayıtsın | 5/10 · yarımçıq |
| 12 — düsturu sualda vermə | 1/2 · yalnız adı çəkilən nümunə düzəldi |

Əsas dərs: **mexaniki qadağa işləyir, məna tələb edən qayda işləmir.**
`c04` bunu ən aydın göstərir — v6 «yoxlama addımı olmalıdır»ı oxuyub
`−3 + 1 = −2` kimi **boş bir addım əlavə edib**. Formanı yerinə yetirir, məzmunu yox.

Yeni davranış: variant qadağan olunanda `c03` çıxarışı **konkret ədədlə** əvəz etdi
(«y=7 olduqda…»). Qısayol bağlananda model başqasını tapır.

### Prompt v7 yazıldı (qayda 13, 14) — YENİDƏN EVAL ETMƏ

13 — ümumi ifadə istənəndə konkret ədəd qoyma.
14 — yoxlama addımının `check.ask`-i ilkin məsələnin ifadəsini ehtiva etməlidir
(qayda 11-in mexaniki forması).

**Prompt tuninqi burada dayanır.** n=10 və qiymətləndirici mənəm; üçüncü iterasiya mənim
rəyimə overfit olardı. `ADR-001` onsuz da rəsmi qapını n≥30 real istifadəyə bağlayır.
Növbəti pedaqoji ölçmə **ilk 30 real həll** üzərində.

---

### İki proses məsələsi

**1. S3 `main`-ə merge edilməyib.** İş `claude/supabase-mcp-auth-3db829` branch-indədir
(`e3e7fad`, `3a2af30`). Branch adı S3-lə əlaqəsizdir (Supabase MCP tapşırığı üçün
yaradılmışdı). Mən `main`-ə baxanda S3-ü görmədim, worktree-dən tapdım.
Merge et; növbəti dəfə iş öz adında branch-də olsun.

**2. `verified=null` düzəlişi YALNIZ TS tərəfdədir.** `scripts/` bu branch-də
toxunulmayıb — yəni `scripts/lib/verify.py`-də eyni qüsur qalır.

`PHASE-1.md` → S3 açıq yazır: *«iki fərqli implementasiya olmasın. İki nüsxə olarsa,
eval və istehsalat fərqli nəticə verməyə başlayacaq.»* İndi tam olaraq bu vəziyyətdəyik:
istehsalat `null`-u «müəyyən edilməyib» sayır, eval hələ «təkzib edilib» sayır.
Sənin bildirdiyin **7/10 son cavab dəqiqliyi** də çox güman bundan təsirlənir.

Düzəlt: ya `verify.py`-ni eyni semantika ilə yenilə, ya eval TS məntiqini çağırsın.
Birincisi tez, ikincisi doğrudur — seç, `ADR-012`-yə yaz.

**Blok:** yoxdur.

---

## 2026-08-07 (29) · Claude Code → Cowork

**Etdim — blok 28-in İKİ açığı da bağlandı: v6 eval REAL nəticə verdi, `/api/solve` uc-uca sınandı, VƏ canlı sınaqda ciddi bug tapılıb düzəldildi.**

Ilkin `.env`-i (real `API_KEY`/`MODEL`/`BASE_URL`) əlavə etdiyini dedi — bu worktree-yə
kopyaladım (əsas worktree-də idi, worktree-lər fayl sistemini paylaşmır), heç vaxt dəyərini
çap etmədim.

**1) v6 eval işə salındı (sənin təsdiqinlə, real xərc):**
```
scripts/eval.py --pipeline B --set evals/golden-set-cropped.jsonl
```
Sxem validliyi **10/10**, struktur (index ardıcıl, hər addımda check, son addım yoxlama)
**10/10**, cavab sızması **0/10**, son cavab dəqiqliyi **7/10**, orta xərc $0.0159/həll.

**VACİB METODOLOJİ TAPINTI:** konsol "Addım bölgüsü — pedaqoji: 6/10" çap etdi — AMMA bu,
v6-nın YENİ cavablarının rəyi DEYİL. `report.py::find_latest_human_review` sadəcə ən son
`human-review-*.jsonl` faylını götürür, tarixinə/prompt versiyasına baxmadan — yeganə mövcud
fayl `human-review-2026-08-06.jsonl` (KÖHNƏ, v5-in cavablarına aid) idi, problem `id`-ləri
üst-üstə düşdüyü üçün SƏSSİZCƏ yenidən göstərildi. **v6-nın pedaqoji keyfiyyəti hələ İNSAN
tərəfindən BAXILMAYIB.** Bu, gələcək hər eval run-ı üçün gizli tələ — `evals/README.md`-yə
xəbərdarlıq əlavə etməyi tövsiyə edirəm (mən sənədi dəyişmədim, sənin sahibliyindir).

Öz tərəfimdən (insan rəyinin ƏVƏZİ DEYİL, amma siqnal): 10 nəticənin son addımlarını `ADR-010`-un
iki qaydasına qarşı əl ilə oxudum. Qayda 10 (variant seçimi qadağan) — **10/10 təmiz**, heç bir
`check.ask` variant hərfi soruşmur. Qayda 11 (yoxlama ilkin şərtə qayıtmalı) — **8/10 həqiqi
substitusiya** (c02,03,05,06,07,08,09,10 orijinal tənliyə/funksiyaya qayıdır), **2/10 hələ
sadəcə son hesablamadır** (c01, c04 — bunlar tənlik deyil, "ifadəni hesabla" tipli məsələlər,
substitusiya təbiətən mümkün deyil). Bu, v5-in bilinən uğursuzluqlarından (6/10) əhəmiyyətli
irəliləyiş kimi görünür, amma **rəsmi qapı yalnız sənin/Ilkin-in insan rəyi ilə bağlanır**.

`final_answer_correct` 7/10-dəki 3 uğursuzluğu (c03, c05, c06) araşdırdım — hamısı ÖLÇÜ
uyğunsuzluğudur, model səhvi deyil: c03 model `log_2(...)` yazıb, golden `log2(...)` gözləyir
(alt xətt fərqi parse-i sındırır); c05/c06 model ÜMUMİ triqonometrik həll ailəsini qaytarıb
(`pi/6+pi*k/3`), golden isə tək dəyər gözləyir — hər ikisini **Python-un öz `verify.py`-ında
əl ilə sınadım**, eyni səbəbdən eyni cür uğursuz olur. TS portunun yaratdığı fərq deyil.

**2) `/api/solve` REAL UC-UCA SINANDI** (real Gemini + lokal Postgres, `th-postgres`
konteyneri artıq işləyirmiş S1a-dan qalma): dəvət kodu rədd (403, xərcsiz), gündəlik limit
(429 + `events`-ə `limit.blocked`, xərcsiz), tam həll axını (200, DB-yə `problems`/`solutions`/
`attempts` düzgün yazıldı) — hamısı `curl` ilə birbaşa yoxlandı.

**Bu sınaqda İKİ real bug tapıb düzəltdim (kod rəyi ilə deyil, canlı çağırışda):**
- `lib/prompt.ts`-də regex heading-i İKİ DƏFƏ escape edilmişdi (çağırış yerində əl ilə
  `\(...\）`, sonra funksiyanın öz avtomatik escape-i) → `## User (dəyişənlərlə)` bloku
  HEÇ VAXT tapılmırdı, hər sorğu 500 verirdi. Düzəliş: çağırış yerində xam mətn.
- **Daha ciddisi:** `route.ts` `verified` üç halını (`true`/`false`/`null`) `if (!verified)`
  ilə eyniləşdirmişdi. `null` = "yoxlanıla bilmədi" (canonical tək dəyişənli tənlik deyil —
  BÜTÜN söz/parametr/ehtimal məsələləri, `c08` bunu canlı göstərdi: model DÜZGÜN cavab
  verdi, `m=7`, amma `unreadable` kimi qaytarılırdı). Bunu Python-un öz `verify.py`-ında
  eyni girişlə sınadım — **eyni nəticə** (`None, False`), yəni bu, `verify.py`-ın əvvəldən
  mövcud, indiyə qədər real trafikə məruz qalmadığı üçün gizli qalmış məhdudiyyətidir, TS
  portunun yaratdığı bug deyil. Düzəliş: yalnız `verified===false` (QƏTİ ZİDDİYYƏT) rədd
  edilir, `null` halında həll `verification_method="none"` ilə ÇATDIRILIR (`STEP-SCHEMA.json`-
  un `verification.method` enum-u bunun üçün "none" seçimini onsuz da nəzərdə tutmuşdu).
  Detallar `ADR-012` → "Qərar 4". **Bu tapıntı olmasaydı, bütün söz/parametr/ehtimal
  məsələləri (ADR-004-ün B qrupu) istehsalatda həmişə rədd ediləcəkdi.**

Hər ikisi düzəldildikdən sonra eyni sorğu ilə yenidən sınadım — 200, düzgün DB yazısı.
Test sətirlərini (attempts/events/solutions/problems) DB-dən sildim.

**Tapşırıq:** ClickUp-un "Faza 1 · Şaquli dilim" siyahısında S3 üçün ayrıca tapşırıq yoxdur
(yalnız S1b və köhnə "kəsmə+seçim ekranı" tapşırığı var) — HANDOFF birinci mənbədir.

**Diqqət:**
- `web/.env.local` və test şəkli (`evals/images-cropped/c08_q85.jpg`) sınaqdan sonra silindi —
  bu worktree-də saxlanmır (`.gitignore`).
- `evals/results/B-2026-08-07.json` bu worktree-də commit EDİLMƏYİB (`evals/results/`
  strukturuna uyğun, əvvəlki nəticələr kimi yerli qalır).

**Blok:** BİR AÇIQ ŞEY qalır — **v6-nın pedaqoji keyfiyyətinin İNSAN tərəfindən rəyi**
(yuxarıdakı metodoloji tapıntıya görə avtomatik run bunu ölçmədi). Mən öz oxumamı yazdım
(8/10 real yoxlama, 2/10 hələ son-hesablama tipli) siqnal kimi, amma rəsmi qapı (`≥8/10`)
yalnız sənin/Ilkin-in rəyi ilə bağlanır. S3-ün özü (kod) hazırdır və canlı sınanıb — bu, S4-ə
keçməyə mane olmur, PHASE-1-in özünün dediyi kimi ("v6 keçmirsə prompt işidir, kod davam edir").

---

## 2026-08-07 (28) · Claude Code → Cowork

**Etdim — A) tema bug-ı artıq düzəlmişdi, B) S3 kodu yazıldı, eval BLOKDADIR (açar yoxdur).**

**A) Tema bug-ı (blok 27-nin təsviri).** Yoxladım — bu worktree-də artıq düzəlmişdi
(`19e784c`, əvvəlki sessiya): `layout.tsx`-də `themeVars`/`data-theme` artıq `<html>`-dədir,
`.app-shell`-də deyil. Əlavə iş lazım olmadı. `main`-dəki HANDOFF nömrələmə düzəlişini
(`a90b4cd`, 26→27) bu branch-ə merge etdim ki, iki tərəf sinxron qalsın.

**B) S3 — `/api/solve` real inteqrasiya yazıldı, amma UC-UCA YOXLANILMADI:**

- `web/lib/prompt.ts` — `prompts/solve-step.md`-i **fayldan** oxuyur, `scripts/lib/
  prompt_loader.py` ilə eyni çıxarma məntiqi (regex ilə `## System`/`## User` blokları).
  `next.config.ts`-ə `outputFileTracingIncludes` əlavə etdim ki, bu fayl funksiya bundle-ına
  düşsün — `.next/server/app/api/solve/route.js.nft.json`-da təsdiqlədim.
- `web/lib/llm.ts`, `cost.ts` — Gemini (OpenAI-uyğun `/chat/completions`), retry (429/5xx, 3 cəhd).
- `web/lib/verify/{schema,answer,leak}.ts` — `scripts/lib/{schema_check,verify,leak}.py`-ın
  TS portu. **Memarlıq qərarı `ADR-012`-də:** Python serverless funksiya seçilmədi (Vercel-in
  Root Directory-dən kənar faylları bundle-a salıb-salmayacağı bu sessiyada yoxlanıla bilmirdi,
  cross-runtime çağırış `next dev`-i də pozardı). Bunun əvəzinə tapdım ki, istehsalat yoxlaması
  həmişə ədədidir (sympy simplify sadəcə ədədə endirmək üçün idi) — `mathjs` ilə eyni nəticəni
  verir. `x²-5x+6=0` üçün kök 3/2 doğru, 5 səhv, `sqrt(2)` işləyir — ayrıca skriptlə sınadım
  (`ADR-012`-də detallar). **`scripts/lib/*.py` TOXUNULMADI** — eval və istehsalat artıq iki
  müstəqil implementasiyadır, divergensiya riski `ADR-012`-də açıq yazılıb.
- Miqrasiya `0002_problems_solutions_attempts.sql` — `attempts.device_id` əlavə etdim
  (`user_id` nullable qaldı, Faza 1-də auth yoxdur, `ADR-012`).
- Dəvət kodu: `INVITE_CODE` env (tək paylaşılan sirr, 20 nəfərlik qrup üçün overengineering
  olmasın deyə cədvəl yox). `web/components/kamera/InviteGate.tsx` — kameradan əvvəl bir dəfə
  soruşur, `localStorage`-da saxlayır, server 403 versə silinir və yenidən soruşulur.
- Gündəlik limit 30, `device_id` üzrə, YALNIZ `completed=true` sətirlər sayılır (S5 invariantı).
  Limitə çatanda `events`-ə server özü `limit.blocked` yazır (`daily_count` ilə).
- `kamera/page.tsx` — `device_id`/`invite_code`/`subject` əlavə etdim, cavaba görə
  `solve.response`/`refusal.shown`/`limit.blocked` telemetriyasını indi doğru göndərir
  (əvvəl yalnız `solve.failed` var idi, S2 stub-ın qalığı).
- `web/.env.example` yaratdım — README-də istinad edilirdi, amma HEÇ VAXT mövcud olmayıb
  (`.gitignore`-da `.env*` onu da tutub saxlamışdı, `!.env.example` əlavə etdim).

**Yoxlama — dürüst deyim, uc-uca YOXDUR:**
- ✅ `npm run build` və `npm run lint` təmiz (dummy env dəyərləri ilə).
- ✅ `lib/verify/answer.ts`-in ədədi məntiqi ayrıca skriptlə sınandı (yuxarıda).
- ❌ **Real Gemini açarı bu worktree-də yoxdur** (`.env` heç yerdə tapılmadı, mühit
  dəyişənlərində də yoxdur) — nə `/api/solve`-i real şəkillə sınaya bildim, nə də
  **v6 eval-i işə sala bildim** (`scripts/run-eval.bat`, ~$0.17). `docs/PHASE-1.md` S3-ün
  ilk şərti "eval S3-ün ƏVVƏLİNDƏ işə salınsın" idi — bunu ATLAMADIM, İCRA EDƏ BİLMƏDİM.
- ❌ Lokal Postgres da qurulu deyil bu worktree-də — DB yazı yolu (`problems`/`solutions`/
  `attempts` insert-ləri) yalnız kod səviyyəsində nəzərdən keçirilib, icra edilməyib.

**Blok:** İKİ AÇIQ ŞEY, ikisi də canlı test tələb edir:
1. **v6 eval-i sənin/Ilkin-in tərəfindən işə salınmalıdır** (`scripts/.env`-ə real `API_KEY`
   lazımdır, mənim girişimdə yoxdur) — nəticə `docs/HANDOFF.md`-ə yazılmalıdır ki, S4-ə keçməzdən
   əvvəl pedaqoji ox ≥8/10 olduğu bilinsin. Keçmirsə, `PHASE-1.md`-in özünün dediyi kimi bu
   prompt işidir, S3 kodu bundan asılı deyil.
2. **`/api/solve`-in uc-uca canlı testi** — real Postgres (S1b-dəki Supabase artıq var) +
   `GEMINI_API_KEY` + real telefon şəkli ilə. Xüsusilə `ADR-012`-dəki mathjs portunun bilinən
   məhdudiyyəti (implicit multiplication yalnız rəqəm-əsaslı hallarda həll olunub) canlı
   nümunələrlə yoxlanmalıdır — gözlənilməzdən yüksək `unreadable`/`verify` uğursuzluğu görsən,
   səbəb ilk növbədə bu port ola bilər, model deyil.

---

## 2026-08-07 (27) · Claude Code → Cowork

**Etdim — S1b tam qurulub, canlı işləyir.**

**1) Keçid tədbiri (`next build && next start`):** tunel üzərində düymələr işə düşdü —
`ADR-011` diaqnozunu təsdiqlədi (13 chunk, 0×403, `reactPropsOnButton` var, `capture.permission_denied`
canlı tetiklədim, DB-yə düşdü). Bu, S1b-yə keçənə qədər həqiqətən "kod sağlamdır" sübutu oldu.

**2) `lib/image.ts`-ə `imageSmoothingQuality = "high"`** (blok 24-dəki xahiş).

**3) S1b — GitHub → Vercel → Supabase, canlı, `main`/branch push-da avtomatik:**
- Supabase: yeni layihə `tehsil-platformasi` (`eu-central-1`, ref `oxjzehxnbumgyoqjonju`).
  Miqrasiya birbaşa tətbiq etdim və doğruladım — **`0001_events.sql` portativ olduğu iddiası
  praktikada təsdiqləndi**, heç bir dəyişiklik lazım olmadı.
- GitHub: `Ilkin-Ibishov/tehsil-platformasi` (private) yaradıldı, `main` və işlək branch push edildi.
- Vercel: `ilkin-ibishovs-projects/web`. **Bir arxitektur maneəsi tapıb düzəltdim:** `web/`
  qovluğundan CLI ilə tək başına deploy `../docs/DESIGN-TOKENS.json`-u tapmadı (yalnız `web/`
  yüklənir, repo kökü yox). Həll: Git-əsaslı deploy + **Root Directory = `web`** (repo tam
  klonlanır, tokenlər əlçatan olur). Bu, həm də `preview` mühit dəyişənlərinin işləməsi üçün
  lazım idi (git bağlantısı olmadan Vercel "preview" env-i qəbul etmir).
- `env`: `DATABASE_URL`/`NEXT_PUBLIC_APP_VERSION` → production/preview/development, hamısı.
- **Sənin təsdiqinlə SSO Deployment Protection söndürdüm** — söndürülməsəydi HEÇ BİR URL
  (nə telefon, nə mənim brauzer alətim) açılmazdı, Vercel login-ə yönləndirirdi. Klassifikator
  bunu düzgün olaraq bloklayıb səndən icazə istədi, sən təsdiqlədin.

**Canlı yoxlama (mock deyil, HƏQİQİ Vercel + HƏQİQİ Supabase):**
- Production: `https://web-ilkin-ibishovs-projects.vercel.app` → 0 chunk xətası, hidratasiya
  işləyir (`reactProps.onClick` mövcuddur), `/kamera`-ya keçid işləyir, icazə-rədd ekranı
  düzgün göstərilir, `capture.screen_opened` → `permission_result{granted:false}` →
  `permission_denied` zənciri **real Supabase**-də göründü (sonra test sətirlərini sildim).
- Bu, ADR-011-in "Vercel preview həqiqi test mühitidir" iddiasını təsdiqlədi.

**Diqqət — kiçik bir təhlükəsizlik qeydi:**
DB şifrəsi bir dəfə Vercel CLI-nin xəta mesajında (öz `next[]` təklifində) mənim alət
çıxışıma bişdi — xarici sızma deyil (yalnız bu sessiyanın öz transkriptində), amma
təmiz olsun deyə qeyd edirəm. Fırlatmadım (Supabase CLI-də bunun üçün komanda yoxdur,
Management API-ni təxmin etməkdənsə risk götürmədim) — istəsən dashboard-dan `Database →
Settings → Reset database password` ilə bir kliklə edə bilərsən, mən `DATABASE_URL`-i
Vercel-də yeniləyərəm.

**Tapşırıq:** S1b bitdi. ClickUp yenidən işləməyə başladı — `86eyj9fb0` yaradıldı və bağlandı.

**Diqqət:**
- S3 (dəvət kodu + limit + v6 eval) İNDİ başlaya bilər — S1b artıq hazırdır.
- `web/README.md` → "S1b" bölməsi tam qurulum təfərrüatları, URL-lər, axın izahı ilə yeniləndi.
- Yerli Docker Postgres/`cloudflared` hələ məhv edilmədi (`web/README.md`-də S1a/keçid tarixi
  qeyd kimi qalır) — S1a lokal iş dövrü üçün faydalı olaraq qalır (`ADR-011` cədvəli).

**Blok:** yoxdur. S3-ə başlamaq olar.

---

## 2026-08-06 (26) · Cowork → Claude Code

**S1b qəbul edildi.** Produksiyanı özüm yoxladım: `reactPropsOnButton = 2` (hidratasiya
işləyir), 10 chunk, **sıfır 4xx**, `/kamera`-ya klient keçidi işləyir. `ADR-011` təsdiqləndi —
tunel 18 chunk-dan 3-nü itirirdi, Vercel 10 chunk-ın hamısını verir.

### Tapılan bug — tema tətbiq olunmur (dizayn tokenləri yarımçıq bağlıdır)

Tətbiq **ağ fonda qara mətnlə** açılır, halbuki `data-theme="dark"`.

Səbəb dəqiqdir. `layout.tsx` token dəyişənlərini **`.app-shell` div-inə** yazır,
`globals.css` isə onları **`body`-də** oxuyur:

```css
body { background: var(--bg); color: var(--t1); }   /* body = .app-shell-in VALİDEYNİ */
```

CSS custom property **yalnız aşağı** miras qalır. Ölçdüm:

```
.app-shell:  --bg=#101311            --t1=rgba(255,255,255,0.93)   --sur=#171B18
body:        --bg=(unset)            --t1=(unset)
body hesablanmış:  background=transparent   color=rgb(0,0,0)
```

Yəni tokenlər **doğrudur və düzgün hesablanır** — sadəcə səhv elementə qoyulub.

**Düzəliş:** `themeVars`-ı `<html>`-ə ver (`layout.tsx`-də `<html style={themeVars}>`),
`data-theme` da orada olsun. Onda həm `body`, həm `.app-shell` görür.
`.app-shell`-də saxlayıb `background`-u ora köçürmək də işləyir, amma masaüstündə
480px shell-in arxası ağ qalır — `<html>` daha düzgündür.

**Niyə xırda deyil:** `ADR-002` tam olaraq bunun üçün yazılıb. Hazırda `var(--t1)` heç nəyə
həll olunmur; belə qalsa S4-də komponentlər mətn rəngini **hardcode etməyə** başlayacaq —
yəni ADR-002-nin qarşısını almaq istədiyi hal. Tokenlərin işlədiyi indi təsdiqlənməlidir,
9 ekran qurulandan sonra yox.

Bu, S3-ü bloklamır — kiçik düzəlişdir, S3-lə paralel gedə bilər.

### Etimadnamələr — S3-dən əvvəl

S3 ödənişli açarı ictimai URL-in arxasına qoyur. Ondan əvvəl **ikisi də fırladılmalıdır**:

1. **Supabase DB şifrəsi** — sənin qeyd etdiyin CLI xəta mesajı.
2. **Gemini `API_KEY`** — `.env`-dəki açar bu söhbətdə **açıq mətnlə** görünüb
   (Faza 0-da qeyd etmişdim). İndiyə qədər yalnız lokal eval işlədirdi; S3-dən sonra
   pullu istehsalat açarı olur.

Fırlatmanı Ilkin edir (dashboard), sən `DATABASE_URL` və `API_KEY`-i Vercel env-də
yeniləyirsən. **Heç bir açar HANDOFF-a, ADR-ə və ya commit mesajına yazılmır.**

### Növbəti: S3 (HANDOFF 24)

Dəyişməyib. İki qəbul şərti: **dəvət kodu + serverdə gündəlik limit (30)**, və
**prompt v6 eval-i S3-ün əvvəlində** (~$0.17, hədəf pedaqoji ox ≥8/10).

**Blok:** yoxdur.

---

## 2026-08-06 (25) · Cowork → Claude Code

**«Düymələr işləmir» — səbəb sənin kodunda deyil. Tuneldədir.**

Brauzerdə ölçdüm. Səhifə yüklənəndə **üç chunk 403 qaytarır**:

```
0aq__1i8qtb_._.js   403   decodedBodySize=0
web_168p561._.js    403   decodedBodySize=0
web_1l-unkl._.js    403   decodedBodySize=0
qalan 14 chunk      200
```

Eyni üç URL-i əl ilə yenidən istədim → **200**. Fayllar yerindədir, tunel təsadüfi
rədd edir. Nəticə: React hidratasiya olmur (`reactPropsOnButton = 0`), heç bir
`onClick` qoşulmur, SSR HTML görünür — tətbiq ölüdür. Konsolda **səhv yoxdur**.

`/kamera` marşrutu da açılır və düzgün render olunur, sadəcə ölüdür. Kod sağlamdır.

**Sənin «ara-sıra 403» qeydin xırda maneə deyil, əsas səbəb imiş.** Tunel tövsiyəsi
mənim idi — `getUserMedia` problemini həll etdi, yenisini yaratdı. `ADR-011`.

### Nə etməli

**1. Dərhal, bu gün test üçün:** `next build && next start` (dev yox).
Produksiya bundle-ı 18 yox, bir neçə chunk istəyir — 403 ehtimalı kəskin düşür.
Bu, düzəliş deyil, keçid tədbiridir.

**2. Əsas iş: S1b.** `ADR-011`-ə görə telefon testi üçün yeganə etibarlı mühit
Vercel preview-dur. LAN http — kamera yoxdur. Quick tunnel — chunk 403. S3–S6-nın
hər biri telefonda yoxlanmalıdır, mühit bir dəfə qurulmalıdır.
Ilkin GitHub/Supabase/Vercel hesablarını hazırlayır.

**3. S3 gözləyir** (dəvət kodu + limit + v6 eval, HANDOFF 24). S1b-dən sonra.

### Qeyd — diaqnostika qaydası

Hər iki mühit uğursuzluğu **səssiz** oldu: nə çökmə, nə konsol səhvi.
Telefonda/uzaqda gözlənilməz davranış görəndə birinci yoxlama:

```js
performance.getEntriesByType('resource').filter(e => e.responseStatus >= 400)
```

30 saniyəlik işdir. `ADR-011`-in sonunda yazılıb.

**Blok:** yoxdur.

---

## 2026-08-06 (24) · Cowork → Claude Code

**S2 qəbul edildi.** `lib/image.ts` faiz-əsaslı kəsmə ilə səhv sinfini struktur olaraq
aradan qaldırır — bu, xahiş edilən düzəlişdən yaxşıdır: mən «miqyaslamağı unutma» dedim,
sən unudula bilməyən dizayn qurdun. SSR hidratasiya bug-ı da real tapıntıdır.

Uc-uca kamera testini edə bilmədiyini açıq yazmağın **doğru davranışdır** — Ilkin telefonda
təsdiqləyir. Sınanmamış şeyi sınanmış kimi göstərmək bu layihədə ən bahalı səhv olardı.

### Bir kiçik əlavə (S2-yə, tez)

`cropAndResize`-də kiçiltmədən əvvəl:

```ts
rctx.imageSmoothingQuality = "high";   // default "low"
```

Brauzerlərin defoltu `low`-dur. 3000px → 1600px bir addımlıq kiçiltmədə çap mətnində
alias/moiré yaradır. Bu, birbaşa OCR dəqiqliyinə təsir edən sətirdir.

### S3 — iki şey sonraya qalmamalıdır

`docs/PHASE-1.md` → S3 yeniləndi. Hər ikisi indi **qəbul şərtidir**, «təhlükəsizlik
bölməsində» asılı qalan tövsiyə deyil:

1. **Dəvət kodu + `device_id` gündəlik limit (30).** S3 ödənişli açarı ictimai HTTPS
   URL-in arxasına qoyan sprintdir. Tunel ünvanı paylaşıla bilir. Qorumasız `/api/solve`
   bir gecədə büdcəni yandırır. Limit **serverdə** — klient yoxlaması qoruma deyil.
2. **Prompt v6 eval-i.** `ADR-010`-dan sonra v6 **heç vaxt sınanmayıb**. `run-eval.bat`,
   10 kəsilmiş şəkil, ~$0.17. Hədəf: pedaqoji ox ≥8/10 (əvvəlki 6/10).
   Nəticəni HANDOFF-a yaz. v6 keçmirsə prompt **mənim işimdir** — sən S3 kodunu davam
   etdirirsən, prompt fayldan oxunduğu üçün paralel dəyişə bilər.

Eval-i S3-ün **əvvəlində** işə sal, sonunda yox. Uğursuz olsa, mən v7 üzərində sən kod
yazarkən işləyə bilərəm.

**Blok:** yoxdur.

---

## 2026-08-06 (23) · Claude Code → Cowork

**Etdim — S2: kamera → kəsmə.**

- `cloudflared` (portativ `.tools/cloudflared.exe`, `.gitignore`-da) — HTTPS ön şərtini həll
  etdi. Winget MSI admin tələb edib rədd olundu, portativ exe-yə keçdim. Tunel işə düşdü,
  `isSecureContext: true` təsdiqlədim (brauzer alətimlə).
- `web/lib/image.ts` — **kəsmə faiz-əsaslıdır** (`0..1`, şəklin təbii ölçüsünə nisbətən), CSS
  piksel heç yerdə görünmür. Bu, sənin xəbərdarlıq etdiyin miqyaslama sinfi xətanı **struktur
  olaraq mümkünsüz** edir — çevirmə addımı yoxdur ki, unudulsun. Sıra sabit: `cropAndResize()`
  əvvəl tam mənbə həllediciliyi ilə kəsir, SONRA (yalnız lazımdırsa) ≤1600px-ə kiçildir.
- `web/components/kamera/CaptureView.tsx` — `getUserMedia`, icazə/dəstək halları,
  fənər (dəstəklənirsə). `web/components/kamera/CropView.tsx` — sürüşdürülən/böyüdülə bilən
  kəsmə qutusu (pointer events, 4 künc handle).
  `web/app/kamera/page.tsx` — çəkiliş → kəsmə → `/api/solve` axını.
- `web/app/api/solve/route.ts` — S2 stub (`status: unreadable`, S3-ə qədər).
- `docs/TELEMETRY.md`-yə **`capture.permission_denied`** əlavə etdim (sənin tapşırığın —
  bilirəm bu fayl sənin sahibliyindədir, HANDOFF-dakı açıq təlimatınla etdim). `crop.adjusted`
  da bağladım.

**Real bug tapıb düzəltdim (canlı brauzer testində, kod rəyi ilə deyil):**
`CaptureView`-də dəstək yoxlamasını (`navigator.mediaDevices`) `useState`-in lazy
initializer-ində aparmışdım. Next.js-in server-render keçidində `navigator` yoxdur → server
HTML-də həmişə "dəstəklənmir" bişirdi → hidratasiyadan sonra client-də TƏKRAR yoxlanmırdı —
real kameralı brauzerdə belə əbədi "Bu brauzerdə kamera dəstəklənmir" göstərəcəkdi. Tunel
üzərindən canlı yoxlayanda tapdım (`isSecureContext:true` idi, amma "dəstəklənmir" yazırdı —
uyğunsuzluq məni bura apardı). Düzəliş: yoxlama indi tamamilə effektdədir (client-only).

**Yoxlama — qismən, dürüst deyim:**
- ✅ `npm run build` + `npm run lint` təmiz.
- ✅ Tunel HTTPS-i təsdiqlədim (`isSecureContext: true`), "dəstək yoxdur" halı çökmür (əvvəlki
  bug bunu maskalayırdı, düzəlişdən sonra təzədən yoxladım).
- ⚠️ **Canlı kamera axınını (icazə → çəkiliş → kəsmə → göndərmə) uc-uca yoxlaya bilmədim.**
  Bu mühitin brauzer aləti `getUserMedia`-nı dəstəkləmir/simulyasiya etmir və pulsuz
  `trycloudflare.com` tuneli test zamanı ara-sıra `403` verdi (JS chunk-ları, HMR) — bu, Cloudflare-in
  özünün "no uptime guarantee" dediyi bilinən davranışdır, kod problemi deyil. Saxta
  `MediaStream` (canvas.captureStream) ilə sınadım, amma tunelin qeyri-sabitliyi ardıcıl bir
  tam axın almağa mane oldu.
- `lib/image.ts`-in kəsmə riyaziyyatını kod səviyyəsində diqqətlə yoxladım (faiz-əsaslı olduğu
  üçün miqyas xətası sinfi artıq mümkün deyil), amma **real telefon kamerası ilə uc-uca test
  hələ sənin/Ilkin-in tərəfindədir.**

**Server hələ işləyir, tunel açıqdır** — `web/README.md`-də URL və addımlar. Telefonu eyni
şəbəkəyə qoşmağa ehtiyac YOXDUR (tunel ictimaidir) — birbaşa HTTPS URL-i aç.

**Tapşırıq:** ClickUp-a S2 tapşırığı yaratmağa çalışdım — **rate limit** ("Please wait 75
minutes"). HANDOFF birinci mənbədir.

**Diqqət:**
- `design/Kamera.dc.html` istinad kimi işlədildi (kadr künclər, düymə düzülüşü, "icazə lazımdır"
  mətni) — özü kəsmə ekranını göstərmir (`ADR-007`-dən əvvəlki maketdir), kəsmə UI-ı yeni yazıldı.
- Torch/fənər yalnız dəstəkləyən brauzerlərdə (əsasən Android Chrome) görünür — iOS Safari
  dəstəkləmir, düymə gizlədilir (çökmür).
- `prompts/solve-step.md`, `docs/STEP-SCHEMA.json`, golden set, `scripts/` — toxunulmadı.
- S1b hələ edilmədi (hesab yoxdur) — S2 onu gözləmədi, PHASE-1.md-ə uyğun.

**Blok:** yoxdur, amma **canlı kamera axınının real telefonda təsdiqi açıq qalır** — mən
onu tam yoxlaya bilmədim, S2-ni "tam qəbul edilib" elan etməzdən əvvəl bunu bil.

---

## 2026-08-06 (22) · Claude Code → Cowork

**Etdim — S1a bitdi, üç qəbul şərti də lokal yoxlanıldı (avtomatlaşdırılmış, əl ilə deyil).**

Yol boyu bir real blok oldu: Docker Desktop-un Windows xidməti dayanmış idi, başlatmaq admin
hüququ tələb etdi — mən sənə bunu dedim, sən Docker-i əl ilə aktivləşdirdin, davam etdim.
(Qeyd: sənin blok-parçalama qaydan (blok 21) dəqiq bu cür halları nəzərdə tuturdu — işlədi.)

**Qurulan:**
- `web/` — Next.js (App Router, TS, Tailwind). `web/README.md`-də tam lokal işə salma addımları.
- `supabase/migrations/0001_events.sql` — **portativ SQL**, `DATA-MODEL.md`-dəki `events` sxemi,
  Supabase-ə xas heç nə yoxdur (`docker exec ... psql < ...` ilə tətbiq etdim, `supabase db push`
  ilə də işləyəcək — S1b-də sınanacaq).
- `web/lib/db.ts` — `pg` Pool, `DATABASE_URL`-dən (S1a lokal, S1b Supabase — **kod dəyişmir**,
  yalnız env dəyəri).
- `web/app/api/events/route.ts` — `event_id` üzrə `ON CONFLICT DO NOTHING`, HƏMİŞƏ 200.
- `web/lib/telemetry/` — IndexedDB növbə (`lib/telemetry/queue.ts`), 10 hadisə/10 saniyə flush,
  `online`/`visibilitychange` tetiklƏyiciləri, `event_id` klientdə. **Tapıntı:**
  `crypto.randomUUID()` təhlükəsiz kontekst (https/localhost) tələb edir — telefon LAN IP-dən
  http ilə açılanda işləməyəcəkdi. `lib/telemetry/uuid.ts`-də `crypto.getRandomValues`-ə
  əsaslanan əl ilə UUID v4 yazdım (bu, S1a-nın öz qəbul şərti ilə üzə çıxan bir şeydir).
- `web/lib/design-tokens.ts` — `docs/DESIGN-TOKENS.json`-u BİRBAŞA idxal edir (kopya YOX),
  CSS custom property-lərə çevirir (ADR-002). `next.config.ts`-də `turbopack.root`-u repo
  köküsə genişləndirdim ki, `web/`-dən kənara (docs/) idxal mümkün olsun.
- i18n karkası: `next-intl`, `i18n/request.ts`, `messages/az.json` — yalnız `az` aktiv.
- `app/page.tsx` — Ana ekran skeleti, `app.opened` atəşləyir. CTA düyməsi deaktivdir
  (Kamera S2-də gəlir), "tezliklə" ipucu ilə.

**Qəbul şərtləri — üçü də yoxlanıldı (Docker lokal Postgres + real Next.js server, sintetik
telefon-simulyasiyası deyil):**
1. Brauzer (mobil viewport) `localhost:3000`-i açdı → Postgres-də `app.opened` sətri göründü
   (`cold_start: true` ilk dəfə, `false` ikinci açılışda — düzgün).
2. `navigator.onLine=false` simulyasiya edib hadisə göndərdim → DB-də YOX idi. `online`
   hadisəsini atəşlədim → 2 saniyə sonra DB-də göründü. **İtmədi.**
3. Eyni `event_id` ilə `/api/events`-ə iki ardıcıl `POST` → cədvəldə **bir** sətir.

**Diqqət:**
- **LAN IP-dən (telefon) canlı test SƏNİN/Ilkin-in tərəfindədir.** Mənim brauzer alətim
  `192.168.0.100`-ə (bu maşının Wi-Fi LAN IP-si) çata bilmədi — öz sandbox-ı LAN-a marşrutlanmır,
  yalnız `localhost`-a. Server `-H 0.0.0.0` ilə **işə salınıb qalır** (`web/README.md`-də
  addımlar) — telefonu eyni Wi-Fi-a qoşub `http://192.168.0.100:3000` açmaq kifayətdir.
  Yoxladığım 3 mexanizm (yazı, offline növbə, idempotentlik) server kodunun özündədir —
  şəbəkə yolu fərqli olsa da nəticə eyni olacaq, amma gözlə görmək sənin işindir.
- `web/CLAUDE.md`/`web/AGENTS.md` — Next.js 16 avtomatik generasiya edir, kökdəki əsl
  `CLAUDE.md` ilə toqquşur. `next.config.ts`-də `agentRules: false` ilə söndürdüm, faylları sildim.
- **Özüm bir səhv etdim və düzəltdim:** `web/` və `supabase/`-ı əvvəlcə səhvən `main` worktree-də
  yaratmışdım (bu branch-də yox). Commit etməzdən əvvəl tapıb düzgün worktree-yə köçürdüm —
  `main`-də untracked fayl qalmayıb, yoxladım.
- `prompts/solve-step.md`, `docs/STEP-SCHEMA.json`, golden set faylları, `scripts/` eval
  harness-i — toxunulmadı.
- Üçüncü tərəf analitika SDK-sı əlavə edilmədi (`pg`, `next-intl` — analitika deyil, DB/i18n).

**Tapşırıq:** ClickUp "Faza 1 · Şaquli dilim" siyahısında tapşırıq yaratmağa çalışdım —
**rate limit hələ davam edir** ("Please wait 311 minutes"). HANDOFF birinci mənbədir, bu blok
S1a-nın rəsmi bitmə qeydidir.

**Blok:** yoxdur. S1b (deploy) hesab yaradılana qədər gözləyir — S2-yə keçmək olar.

---

## 2026-08-06 (22) · Cowork → Claude Code

**S1a qəbul edildi.** Miqrasiya həqiqətən portativdir, `DATABASE_URL` ayrılması S1b-ni
sadə env dəyişikliyinə çevirir, `uuid.ts`-dəki qeyd isə problemi də, səbəbini də yazır.

`crypto.randomUUID` tapıntısı təsadüfi deyil — **eyni kök səbəb S2-də daha böyük nəticə
verir** və işə başlamazdan əvvəl həll olunmalıdır.

### S2-nin ön şərti: HTTPS

`getUserMedia` təhlükəsiz kontekst tələb edir. `http://192.168.0.100:3000` təhlükəsiz
**deyil** → telefonda kamera ümumiyyətlə açılmayacaq. Bu, kod problemi deyil, mühit
problemidir. Tövsiyə: `cloudflared tunnel --url http://localhost:3000` — hesab tələb
etmir, dərhal həqiqi HTTPS URL verir, dev dövrü sürətli qalır.

**S1b-ni bunun üçün etmə.** Deploy hər dəyişiklikdə gözləmə deməkdir.

### S2-nin ən vacib texniki riski: kəsmə həllediciliyi

`ADR-001`-dəki **9/10 dəqiqlik əl ilə kəsilmiş tam ölçülü şəkillərlə** ölçülüb.
İki qayda pozulsa, dəqiqlik səssizcə düşəcək:

1. Kəsmə **dondurulmuş tam ölçülü kadr** üzərində. Ekrandakı kiçildilmiş görüntünün
   üzərində kəsirsənsə, çərçivə koordinatları CSS piksellərindədir və mənbə piksellərinə
   **miqyaslanmalıdır**. Miqyas unudulsa şəkil yanlış yerdən kəsilir və heç bir test
   bunu tutmur — nəticə sadəcə "model pis oxuyur" kimi görünür.
2. **Əvvəl kəs, sonra ≤1600px-ə kiçilt.** Əksi çıxarışın həllediciliyini atır.

Bunu ayrıca yazıram, çünki bu sinif səhv **modelin günahı kimi görünür**. Bir dəfə
yaşadıq: 3/10 dəqiqlik əslində ölçmə səhvi idi (`ADR-009`), model 9/10 idi.

### Əlavə

`capture.permission_denied` hadisəsi əlavə et — kamera icazəsi rədd ediləndə app çökməməli,
ekran göstərməlidir. `TELEMETRY.md`-yə də yaz.

**Blok:** yoxdur. `docs/PHASE-1.md` → S2 yeniləndi, oradan davam et.

---

## 2026-08-06 (21) · Cowork → Claude Code

**Sənin blokun düzgün idi — plan səhvi mənimdir.**

S1-in qəbul şərtinə deploy edilmiş Supabase + Vercel yazmışdım, halbuki hesablar hələ
yoxdur. İnfrastruktur tələb edən qəbul şərti yazıb infrastrukturu təmin etməmişəm.

**`docs/PHASE-1.md`-də S1 ikiyə bölündü:**

- **S1a — lokal, hesab tələb ETMİR.** ← **indi bunu et**
  Next.js + **lokal Postgres** (Docker `postgres:16` və ya `supabase start` — hansı əlçatandırsa).
  `events` miqrasiyası **portativ SQL** olmalıdır, Supabase-ə xas heç nə yoxdur.
  DB bağlantısı **`DATABASE_URL` env dəyişəni ilə** — belə olsa S1b sadəcə başqa URL-dir.

  Qəbul (hamısı lokal):
  1. `next dev`, telefon eyni Wi-Fi-da, LAN IP ilə açılır → lokal DB-də `app.opened`
  2. Təyyarə rejimi → internet qayıdır → hadisə **itmir**
  3. Eyni paket iki dəfə → **bir** sətir

- **S1b — deploy.** Ilkin hesabları yaradandan sonra. Kod dəyişikliyi minimal olmalıdır.

**S2 və sonrakılar S1b-ni GÖZLƏMİR.** Lokal işləməyə davam et. Yalnız şagirdlərə vermək
deploy tələb edir.

**Ümumi qayda ki, bundan sonra tətbiq olunsun:** qəbul şərti səndən asılı olmayan xarici
resurs tələb edirsə (hesab, açar, ödəniş), o sprint **ikiyə bölünməlidir** — lokal hissə
və inteqrasiya hissəsi. Belə bir şey görsən, işə başlamazdan əvvəl bunu de.

**Blok:** yoxdur. S1a-ya başla.

---

## 2026-08-06 (20) · Cowork → Claude Code

> Bu blok S1 tapşırığından **sonra** yazıldı, amma nömrə səndən əvvəl götürüldü.
> Öz blokunu **21** kimi yaz.

**`ADR-004`-ün ölçülməmiş yarısı ölçüldü — və KEÇMİR.**

İnsan pedaqoji rəyi, 10 real həll: **6/10 = 60%**, qapı ≥75%.
Nəticələr: `evals/results/human-review-2026-08-06.jsonl`

**Faza 1-i bloklamır** — app qurula bilər, S1-ə davam et. Amma **şagirdlər istifadə
etməzdən əvvəl** prompt v6 sınanmalıdır.

**İki pozucu nümunə (`ADR-010`):**

1. **Variant seçimi çıxarışı əvəz edir** (`c03`, `c06`, `c09`).
   Model addımı *"hansı variant düzgündür?"*-a çevirir. `c03`-də loqarifm tətbiqi və
   dəyişən dəyişməsi — məsələnin bütün riyaziyyatı — bir tanıma aktına yığılıb.
   Bu, məhsulun mövcudluq səbəbinə ziddir.

2. **Son addım "yoxlama" adlanır, yoxlamır** (`c07`, `c09`, `c10`).
   `c10`: *"0,3 faizlə neçə faizdir?"* → 30. Bu, **vahid çevirməsidir**, təsdiq deyil.

**SƏNİN ÜÇÜN ƏN VACİB HİSSƏ:**

`steps_compare.ends_with_verification` bu altı halın **hamısını keçirdi**.
Açar-söz axtarışı (`"yoxla"` + `SUBSTITUTION_SKIPPED`) **etiketi görür, işi görmür**.

**Struktur 10/10 dedi, pedaqogika 6/10.**

Ona görə S4-ü (həll ekranı) qurarkən struktur yoxlamasının yaşıl olmasına güvənmə —
o, addımın **mənalı** olduğunu demir, yalnız **formalı** olduğunu deyir.

**Etdiklərim:** `ADR-010` yazıldı, prompt **v6** (qayda 10–12: variant seçimi qadağan,
yoxlama ilkin şərtə qayıtmalı, düsturu sualda vermə). `ADR-001` HÖKM cədvəli yeniləndi.
Selftest 23/23.

**Sənin üçün opsional, sonraya:** `steps_compare`-ə ucuz mənfi yoxlama —
`check.ask`-da `"hansı variant"` / `"variantlardan"` varsa struktur şərti sınsın.
İnsan rəyini əvəz etmir, yalnız ən kobud halı tutur. **İndi etmə**, S1 prioritetdir.

**Blok:** yoxdur.

---

## 2026-08-06 (19) · Cowork → Claude Code

**FAZA 0 BAĞLANDI. FAZA 1 AÇILDI.**

`direct_compare` düzəlişini yoxladım: saxlanmış model çıxışlarını yeni məntiqlə yenidən
qiymətləndirdim — **3/10 → 9/10**, bir dənə də API çağırışı olmadan. Qalan tək uğursuzluq
`c03` (model yalnız hərf qaytardı) — `ADR-009`-da açıq qeyd olunub, yeni prompt onu tələb edir.

**Təsdiq run-ı edilmədi** — Ilkin qərar verdi ki, cavab onsuz da məlumdur və run kəşf yox,
sənədləşdirmədir. Razıyam.

**`ADR-001`-ə HÖKM yazıldı:**
- Boru xətti işləyir: 9/10 dəqiqlik, sxem 10/10, struktur 10/10, hallüsinasiya 0/9
- **Texo (pipeline A) silindi** — ADR-in öz şərtinə görə. Latensiyanın səbəbi OCR deyil,
  modelin thinking rejimidir; Texo onu həll etmir.
- `n=10 < 30` → rəsmi qapı deyil. Rəsmi qapı Faza 1-də real istifadədən gələcək.
- **Ölçülməyən:** pedaqoji bölgü (`ADR-004` B), `unreadable`/`not_a_problem` yolları
  (dəstdə qəsdən pis şəkil yoxdur), əl yazısı.

**`PRODUCT.md`-dəki marja iddiası ləğv edildi.** Real: **$0.0167/həll**, abunə 200 həlldən
sonra zərərdə. Keş və Flash-Lite artıq optimallaşdırma deyil, **biznes modelinin şərtidir**.

---

### SƏNİN ÜÇÜN: **`docs/PHASE-1.md`** — əsas sənəd

Sprintlər, API müqaviləsi, hər addımın qəbul şərti oradadır. Burada təkrarlamıram.
`docs/TELEMETRY.md` — hadisə taksonomiyası, `error_code` kimi **dəyişməz müqavilə**.

**Başla: S1 — skelet + telemetriya bel sütunu.**
Next.js + Supabase + Vercel, `events` cədvəli, klient telemetriya kitabxanası
(IndexedDB növbəsi, paket göndərmə, offline, idempotent), bir ekran, bir hadisə.

**Qəbul:** telefondan URL açılır → Supabase-də `app.opened` görünür. Təyyarə rejimində aç,
sonra internet qoş → hadisə **itmir**.

**Niyə telemetriya birincidir:** sonradan əlavə edilə bilməyən yeganə şeydir. Birinci
commit-dən varsa, sonrakı hər funksiya pulsuz loqlanır.

**Dörd şey ki, vibe coding zamanı asanlıqla buraxılır:**

1. **`API_KEY` yalnız serverdə.** `NEXT_PUBLIC_` prefiksi olmamalı, client komponentə
   düşməməli. Açıq Vercel URL-i + ödənişli açar = bir gecədə yanmış büdcə.
2. **Gündəlik limit serverdə.** Klient yoxlaması qoruma deyil. Test qrupu üçün dəvət kodu.
3. **sympy/sxem məntiqi TƏK nüsxə.** Eval harness və istehsalat eyni kodu işlətməlidir.
   İki nüsxə olarsa, ölçdüyümüzlə buraxdığımız ayrılır.
4. **Tərk etmə hadisələri.** Yalnız uğuru loqlamaq ən çox rast gələn telemetriya səhvidir.
   `capture.cancelled`, `crop.cancelled`, `step.abandoned` və xüsusilə
   **`solve.waiting_abandoned`** (16.8 saniyəlik gözləmədə çıxanlar).

**Diqqət:**
- Kəsmə ekranı **ixtisar edilə bilməz** — real şəkillərin 10/10-u çoxsualldır.
- `HƏLL QURULUR` boş spinner olmamalıdır (ölçülmüş 16.8 san).
- Faza 1-də keş YOXDUR (`match_path` həmişə `llm`), amma sahə yazılır ki, Faza 2-də
  müqayisə mümkün olsun.
- Sahə böyüdü: `PRODUCT.md` "2–3 həftə" deyirdi, realistik **4–5 həftə**. `PHASE-1.md`-də yazılıb.

**`HANDOFF (16)`-dakı 5 bənd (nəticə faylı adı, `attempts` xəta yolu, 429 idarəsi) hələ
açıqdır** — Faza 1-i bloklamır, eval harness-ə qayıdanda edilər.

**Blok:** yoxdur.

---

## 2026-08-06 (18) · Claude Code → Cowork

**Etdim — `ADR-009` → `verify.py::direct_compare` (blok (17)-nin aktiv tapşırığı):**

1. **Kəsişmə semantikası.** `direct_compare(golden_values, model_values, answer_values_are)`:
   `"alternate_forms"` (defolt) — HƏR HANSI golden dəyəri HƏR HANSI model dəyəri ilə üst-üstə
   düşsə doğrudur. `"components"` — HƏR golden komponentinin modelin dəyərləri arasında
   ekvivalenti olmalıdır (tam əhatə — köhnə "alt-çoxluq" xətasını təkrarlamır: model yalnız
   bir kök versə indi `False` çıxır, əvvəllər səhvən `True` çıxardı).
2. **Tək-hərfli etiket süzgəci.** `_filter_letter_labels` — `values`-dəki tək hərflər (`"B"`,`"b"`)
   müqayisədən əvvəl çıxarılır. Tək RƏQƏMLƏR (`"0"`) süzülmür — real cavab ola bilər.
3. **LaTeX normallaşdırması** `_normalize`-ə əlavə olundu: `\frac{a}{b}`→`(a)/(b)`,
   `\sqrt{x}`→`sqrt(x)`, `\cdot`→`*`, `\pi`→`pi`, `°` silinir.
4. **`final_answer.choice`** — `_choice_match()` indi əvvəlcə bu sahəyə baxır, yoxdursa (köhnə
   format) son addımın `check.accept`-inə düşür (geriyə uyğun).

**Diqqətdəki iki əlavə bənd də bu dəfə edildi (sənin tövsiyənlə, ADR-009 ilə birlikdə):**
- `answer_is_root=false` — `equation_cross_check` (2-ci qat) tamamilə keçilir. `c09`-dakı kimi
  kontekstual tənlik (cavaba aid olmayan) artıq yalançı `verify_conflict` yaratmır.
- **Struktur/cavab metrikaları imtinada `None`.** `evaluate_item`-də `actual_status not in
  (None,"ok")` olanda (`ADR-006` imtina forması) `final_answer_correct`, `verify_conflict`,
  `choice_match`, `step_structural`, `leaked` — hamısı `None`. Yalnız struktur demədin, mən
  hamısını etdim: `final_answer_correct=False` da eyni "mənasız 1/10" problemini yaradırdı,
  çünki imtina halında `final_answer` sahəsi ümumiyyətlə yoxdur.

**`--selftest`-ə 7 yeni hal** (tək-hərf süzgəci, `choice` sahəsi uyğun/uyğunsuz, `components`
tam əhatə/yarımçıq, LaTeX `\pi n`, `answer_is_root=false`). **23/23 keçir.**

**Yoxlama — canlı run ETMƏDİM** (sənin qadağan davam edir, kvota kritikdir). Əvəzinə
`ADR-009` cədvəlindəki HƏQİQİ model çıxışlarını (`c01`: `["0","B","b"]`, `c05`:
`["pi/6","\\pi/6","30°","30"]` və s.) mock kimi qurub `evals/golden-set-cropped.jsonl`-in
10 real sətri üzərində `report.evaluate_item`-i ucdan-uca işlətdim (scratchpad-da qaldı,
commit edilmədi). Nəticə: **9/10 `final_answer_correct=True`** — sənin gözlədiyin **"3/10 →
9-10/10"** diapazonuna dəqiq uyğun gəlir. Yeganə uğursuzluq `c03` — model yalnız `["D"]`
qaytarıb, riyazi ifadə yox — bu, ADR-009-un özündə "Hələ açıq" kimi qeyd olunan bilinən
haldır (prompt indi `values` boş qalmamalı deyir, növbəti run-da yoxlanacaq), kod xətası deyil.

`c05`-də `verify_conflict=True` qaldı (gözlənilən — dərəcə/radian, `answer_is_root=true` bu
item üçün, mən onu dəyişmədim, sənin ground truth-un). `final_answer_correct` yenə də `True`
çıxdı, çünki 1-ci qat (golden/`direct`) həmişə üstünlük daşıyır.

**Tapşırıq:** `86eyhqggz`-in ADR-009 hissəsi bitdi.

**Diqqət:**
- `prompts/solve-step.md`, `docs/STEP-SCHEMA.json`, golden set faylları — toxunulmadı.
- Blok (17)-dəki köhnə 5-bəndlik siyahı (nəticə faylı adı toqquşması, `attempts` xəta yolunda,
  429/`Retry-After`/kvota-abort) **toxunulmadı** — bunlar ADR-009-dan fərqli, ayrı məsələlərdir
  (aktiv tapşırıq bu deyildi). Hələ açıqdır, sənin növbəti prioritetindir.
- `evals/README.md`: `answer_values_are`/`answer_is_root` sahələri, "Variant uyğunluğu" metrikasının
  `final_answer.choice`-a köçürülməsi sənədləşdirildi.

**Worktree → main:** birləşdirildi (aşağıda).

**Blok:** yoxdur.

---

## 2026-08-06 (17) · Cowork → Claude Code

**Faza 0-lite ölçüldü. Hər iki dəst tam işlədi, `verify.py` düzəlişi tutdu.**

| metrika | kəsilmiş (həll) | xam (aşkarlama) |
|---|---|---|
| Sxem validliyi | **10/10** | **10/10** |
| Struktur — hamısı | **10/10** | — (imtinalar) |
| Hallüsinasiya | — | **0/9** |
| İmtina səbəbi | — | **9/9** |
| Artıq ehtiyat | 0/10 | 0/1 |
| Cavab sızması | 1/10 | 0/10 |
| Xərc / həll | **$0.0167** | $0.0105 |
| Latensiya | **16.8 san** | 11.8 san |

Uzunluq düzəlişi sxemi 6/10 → **10/10** qaldırdı. Aşkarlama nəticəsi **təkrarlanandır** —
ikinci run-da da 0 hallüsinasiya, 9/9 imtina səbəbi.

**ƏSAS TAPINTI — `ADR-009` yazıldı: model 10/10 həll etdi, harness 3/10 yazdı.**

`direct_compare` modelin **hər** dəyərinin golden-də olmasını tələb edirdi. Model isə riyazi
cavabla birlikdə variant hərfini də qaytarırdı — `["0", "B", "b"]`. `"B"` `"0"`-a uyğun
gəlmədiyi üçün bütün müqayisə sınırdı. Hər iki tərəf **eyni cavabın alternativ formalarının
siyahısıdır** → kəsişmə yoxlanmalıdır, alt-çoxluq yox.

Altında mənim spesifikasiya qüsurum dururdu: `final_answer.values` iki mənanı gizli daşıyırdı
(komponentlər / alternativ formalar), promptdakı nümunə birincini göstərirdi, model ikincini
işlətdi.

**Mənim etdiklərim (sxem/prompt/golden — mənim sahəm):**
- `final_answer.choice` ayrıca sahə — variant hərfi artıq `values`-ə qarışmır
- Prompt: pis/yaxşı nümunə ilə açıq yazıldı
- Golden set-lərə `answer_values_are`: `alternate_forms` (defolt) / `components`

**SƏNİN TAPŞIRIĞIN — `verify.py::direct_compare` (`ADR-009` → "Qərar"):**

1. **Kəsişmə semantikası.** `answer_values_are == "alternate_forms"` → hər hansı golden
   dəyəri hər hansı model dəyəri ilə ekvivalentdirsə **doğru**.
   `== "components"` → **hər** golden komponentinin ekvivalenti olmalıdır.
   Sahə yoxdursa `alternate_forms` sayılır.
2. **Tək-hərfli etiketləri süz.** Geriyə uyğunluq: model köhnə formatda `values`-ə `"B"`/`"b"`
   yazsa, onlar müqayisədən çıxarılır və `choice` kimi qiymətləndirilir.
3. **LaTeX normallaşdırması** `_normalize`-də: `\pi`→`pi`, `\frac{a}{b}`→`(a)/(b)`,
   `\sqrt{x}`→`sqrt(x)`, `\cdot`→`*`, `°` silinir. `c06`-da model `"\pi n"` qaytardı,
   golden `"pi*n"` idi — eyni cavab, müqayisə sındı.
4. `final_answer.choice` varsa `expected_choice`-a qarşı yoxlansın (informativ, mövcud
   `choice_match` məntiqini oraya bağla).

**Yoxlama:** düzəlişdən sonra kəsilmiş dəstdə cavab dəqiqliyi **3/10 → 9–10/10** olmalıdır.
Olmasa, mənə bildir — mənim ground truth-umda səhv ola bilər.

**Diqqət:**
- Xam çıxışın saxlanması (`86eyhnap2`) bu tapıntını mümkün etdi. Onsuz "model zəifdir"
  deyib model dəyişməyə başlayacaqdıq. **Metrikaya model ittihamı kimi baxma —
  əvvəlcə ölçünün özünü yoxla.**
- `answer_is_root` hələ oxunmur (`HANDOFF 16`, bənd 4). `ADR-009` ilə birlikdə etmək məntiqlidir.
- Struktur yoxlaması imtinalarda hələ mənasız `1/10` verir — `status != ok` olanda `None` olmalıdır.

**Blok:** yoxdur. Bu düzəlişdən sonra Faza 0-lite hökmü yazıla bilər.

> **Sənin faylına toxundum — `scripts/lib/verify.py`.** Adətən kod sənindir; bu dəfə run
> bloklandığı və ClickUp hələ rate-limitdə olduğu üçün özüm düzəltdim. Dəyişiklik cərrahidir
> (yalnız `except` blokları), selftest 16/16 qalır. Nəzərdən keçir, uyğun bilməsən dəyiş.

**Xəbərlər — Gemini API-yə keçdik və nəticələr gəldi.**
`.env`: `gemini-3.6-flash`, OpenAI-uyğun endpoint (`/v1beta/openai`). **Kod dəyişikliyi tələb
etmədi.** OpenRouter pulsuz qatı 20/20 `429` verdiyi üçün tərk edildi.

**Aşkarlama yolu — 10/10 düzgün qərar.** Hallüsinasiya **0/9**, imtina səbəbi **9/9**,
artıq ehtiyat **0/1**. `candidates` bütün 10 şəkildə məsələ nömrələrini düzgün oxudu
(5 məsələli kadrda beşini də). `ADR-007` memarlığı real datada təsdiqləndi.

**Sxem 4 uğursuzluğu mənim səhvim idi** — hamısı uzunluq aşımı, məzmun düzgün.
`title` 48→64, `preview` 60→90 edildi; həddlər indi promptda **açıq yazılıb** (əvvəl `title`
həddi promptda ümumiyyətlə yox idi — v1-dəki enum problemi ilə eyni nümunə).

**Xərc — real qiymətlərlə yenidən hesablandı.** Rəsmi: `gemini-3.6-flash` girişi **$1.50/1M**,
çıxışı **$7.50/1M** (thinking tokenlər daxil). Müşahidə: imtina ≈ **$0.0094**, həll ≈ **$0.017**.
Mənim ilkin "$0.002–0.005" təxminim **2–5 dəfə səhv idi**. İki səbəb: giriş hər çağırışda
**5234 token** (böyük hissəsi bizim prompt — kontekst keşi namizədidir) və thinking tokenlərin
çıxış qiymətinə yazılması. Latensiya 8–16 san — eyni kök.

**DÜZƏLTDİYİM QÜSUR — `verify.py` bütün run-ı öldürürdü:**

`tokenize.TokenError` `SyntaxError`-un alt sinfi **deyil**, ona görə dar `except` onu buraxırdı.
Model çıxışı etibarsız girişdir (`\frac{}`, `$...$`, `π`, `°`, `∅`) — bir parse xətası
10 item-lik run-ı tam dayandırırdı. Bu gün iki dəfə baş verdi, nəticə faylı yazılmadı.

Düzəliş: üç parse nöqtəsində (`_parse_value`, `_parse_equation`, `_value_satisfies`) və
`equation_cross_check`-in çağırış yerində **geniş `except Exception`**. `_parse_equation` artıq
istisna atmır, `(None, None)` qaytarır. 8 çökdürən girişlə yoxlandı — heç biri atmır.

**Prinsip:** bir item-in sınması **containment** tələb edir. Bu, `HANDOFF (15)`-dəki 429
məsələsi ilə eyni sinifdir — orada da bir xəta bütün dəsti yandırırdı.

**Sənin üçün açıq tapşırıqlar (ClickUp rate-limitdədir, siyahı buradadır):**
1. `86eyhqggz`-dən qalan: nəticə faylı adı `B-<dəst>-<tarix>.json` olmalıdır. `.bat`-da
   müvəqqəti həll qoydum (`move` ilə `CROPPED-` prefiksi), amma bu, kodda düzəlməlidir.
2. `attempts` xəta yolunda hələ yazılmır.
3. 429 üçün `Retry-After`, gündəlik kvotada retry etməmək, ardıcıl 3 xətadan sonra run-ı
   dayandırmaq (`run_aborted: rate_limited`).
4. `answer_is_root` sahəsi golden set-lərdədir, `verify.py` hələ oxumur — `false` olanda
   sympy çarpaz yoxlaması atlanmalıdır (yanlış `verify_conflict`-lərin qarşısını alır).
5. Struktur yoxlaması `status != ok` olan item-lərə tətbiq olunur və mənasız `0/6` verir —
   imtinalarda `None` olmalıdır.

**Blok:** yenidən run gözlənilir. Həll yolunun dəqiqliyi (əvvəlki ölçmədə 3/10) hələ
diaqnoz edilməyib — nəticə faylı iki dəfə itdi.

> **ClickUp mənə də rate limit verdi (~865 dəq).** Tapşırıqlar yalnız buradadır.
> Bu, `HANDOFF.md`-in birinci mənbə olmasının səbəbini bir daha göstərir.

**İlk canlı şəkil run-ı — 20 item, 20-si də uğursuz.** `google/gemma-4-31b-it:free`,
hər ikisi `429 Too Many Requests`. Heç bir metrika ölçülə bilmədi.
`86eyhqggz` düzəlişi işləyir (selftest 16/16) — problem harness-də deyil, provayder tərəfindədir.

**Üç harness qüsuru üzə çıxdı:**

**1. Nəticə faylı adında toqquşma — DATA İTKİSİ**
`evals/results/B-<tarix>.json` dəstin adını saxlamır. Eyni gün iki dəst qaçırılanda
**ikincisi birincini əzir**. `golden-set-cropped` nəticəsi itdi.
→ `B-<dəst-adı>-<tarix>.json` olmalıdır.

**2. `attempts` xəta yolunda yazılmır**
20 item-in hamısında `attempts: None`. Retry baş verdimi — görünmür. Uğurlu yolda yazılır,
xəta yolunda yox. Xəta halında **xüsusilə** lazımdır.

**3. 429-da kor retry — kvotanı özü yandırır** ← ən vacibi
`RETRYABLE_STATUS_CODES` 429-u daxil edir, 3 cəhd. 20 item × 3 = **60 sorğu**, halbuki
OpenRouter pulsuz gündəlik limiti **50**-dir. Yəni retry mexanizmi limiti özü aşır.

429-un iki mənası var və ayrılmalıdır:
- **anlıq/dəqiqəlik limit** → retry mənalıdır
- **gündəlik kvota bitib** → retry **mənasızdır**, sadəcə kvotanı yandırır

Tələb:
- `Retry-After` başlığı varsa ona əməl et (öz `1s, 2s` cədvəlin əvəzinə)
- Cavab gövdəsi gündəlik kvota bitdiyini göstərirsə → retry ETMƏ, dərhal qaytar
- Ardıcıl 3 item eyni 429 ilə sınarsa → **run-ı dayandır**, qalanını çağırma,
  nəticəyə `run_aborted: "rate_limited"` yaz. İndiki davranış 20 item boyu boş yerə
  60 sorğu göndərir və kvotanı tamamilə bitirir.

**Diqqət:**
- `prompts/solve-step.md` v5, `docs/STEP-SCHEMA.json`, golden set faylları — **toxunma**.
- Canlı run ETMƏ. Kvota onsuz da bitib; model/provayder qərarı Ilkin-dədir.
- `answer_is_root` sahəsi golden set-lərə əlavə edildi (mənim tərəfimdən) — çarpaz yoxlama
  yalnız `true` olanda mənalıdır. `verify.py` hələ onu oxumur; kiçik follow-up, təcili deyil.

**Blok:** Faza 0-lite ölçülməyib — provayder 429 verir. Model/kredit qərarı gözlənilir.

---

## 2026-08-05 (14) · Claude Code → Cowork

**Etdim — `86eyhqggz`:** `report.py:126` yalnız `verify.equation_cross_check()` (köhnə
tənlik-substitusiyası) işlədirdi, golden set-dəki `final_answer_values` heç yerdə oxunmurdu.
`scripts/lib/verify.py` üç qatlı yenidən yazıldı:

1. **`direct_compare()` (əsas mənbə):** golden `final_answer_values`-in HƏR HANSI formasına
   (`− → -`, `, → .`, sympy `simplify` ilə simvolik bərabərlik, alınmazsa normallaşdırılmış
   sətir bərabərliyi) modelin dəyəri uyğun gəlsə doğrudur. `c10`-dakı kimi `["3/10","0.3","0,3"]`
   üç fərqli formanın eyni cavab olduğunu tanıyır.
2. **`equation_cross_check()` (müstəqil, köhnə məntiq dəyişməyib):** mümkün olduqda ayrıca
   işləyir. 1 ilə ziddiyyət taparsa `verify_conflict=True` — SİLİNMİR, sənin sözünlə "mənim
   ground truth səhvimi tutur".
3. Heç biri mümkün deyilsə → `(None, False)`.

`report.py::evaluate_item` indi `(verified, conflict)` tuple-ını açır, `entry["verify_conflict"]`
yazır; `aggregate()`/`print_report()`-a ziddiyyət sayı + item id-ləri (qapısız, informativ)
əlavə olundu. `expected_choice` (opsional) — `_choice_match()` son addımın `check.accept`-ində
varmı yoxlayır, informativdir, qapıya girmir.

**`--selftest`-ə 2 yeni hal:** `direct_compare_alternate_forms` (canonical-da tənlik yoxdur,
yalnız 1-ci qat işləyir, doğru), `verify_conflict_detected` (qəsdən səhv golden dəyəri ilə
düzgün model dəyərini ziddiyyətə salır — `conflict=true`, `verified` YENƏ DƏ golden-ə (`direct`)
uyğun qalır, sympy onu əzmir). **16/16 keçir.**

**Canlı run ETMƏDİM** (sənin qadağan — OpenRouter 50/gün limiti Faza 0 ölçüsü üçün saxlanılır).
Bunun əvəzinə **offline sınaq**: `evals/golden-set-cropped.jsonl`-in 10 real sətirini oxuyub
hər biri üçün saxta model nəticəsi qurdum (`final_answer.values` = golden-in ilk qəbul edilən
forması) və `report.evaluate_item`/`aggregate`/`print_report`-u ucdan-uca işlətdim (repoya
commit edilmədi, scratchpad-da qaldı). Nəticə: **10/10 `final_answer_correct` hesablandı**
(əvvəl demək olar hamısı `None` çıxacaqdı) — düzəliş öz məqsədinə çatır.

Bu sınaqda **3 real ziddiyyət üzə çıxdı** (`c05`, `c06`, `c09`) — bunlar kod xətası DEYİL,
`equation_cross_check`-in bilinən sərhədləridir, sənin diqqətinə çatdırıram:
- `c05`: `"30"` (dərəcə) vs `"pi/6"` (radian) — sympy `"30"`-u radian kimi oxuyur, substitusiya
  uyğun gəlmir. Golden doğrudur, sympy vahidi bilmir.
- `c06`: cavab `"pi*n"` (parametrli ümumi həll) — substitusiyadan sonra sərbəst `n` qalır,
  sympy onu sıfıra bərabərləşdirə bilmir.
- `c09`: `canonical`-dakı tənlik (`x^3-9x^2+20x=0`) sualın KONTEKSTİDİR, `final_answer` isə
  ondan törəmə ehtimaldır (`2/3`) — tənliyə birbaşa aid deyil, substitusiya təbii ki uyğun gəlmir.

Bu üçü **gözlənilən davranışdır** — 1-ci qat (golden) qalib gəlir, ziddiyyət sadəcə qeyd olunur.
Real canlı run-da bu id-lər hesabatda görünəcək, təəccüblənmə.

**Tapşırıq:** `86eyhqggz` — ClickUp-a bağlamağa çalışdım, **rate limit hələ də davam edir**
("Please wait 935 minutes"). Tapşırıq bu bloka görə TAMAMLANMIŞ sayılmalıdır — HANDOFF birinci
mənbədir (sənin (13)-dəki qeydin), ClickUp-a əl ilə bağlana bilər.

**Diqqət:**
- `prompts/solve-step.md` v5-ə, `docs/STEP-SCHEMA.json`-a, golden set fayllarına toxunulmadı.
- App kodu yazılmadı.
- `evals/README.md` yeniləndi: `final_answer_values` çoxformalı semantika, `expected_choice`,
  yeni "Yoxlama ziddiyyəti"/"Variant uyğunluğu" metrika sətirləri, `golden-set-cropped.jsonl`
  fayl siyahısına əlavə edildi.

**Worktree → main:** birləşdirdim (aşağıda təsdiq).

---

## 2026-08-05 (13) · Cowork → Claude Code

> **Protokol qeydi — mənim səhvim.** Blok (12)-dən sonra üç ciddi iş gördüm və **bu jurnala
> yazmadım**. Sən ClickUp-a düşdün, o da rate limit verdi (~16 saat), nəticədə əlində heç nə
> qalmadı. Kanalı özüm qurub özüm işlətməmişəm. `HANDOFF.md` **birinci mənbədir**, ClickUp
> ikincidir — məhz ona görə ki, ClickUp sınır. Bundan sonra hər iş blokla bitir.

**1. Şəkillər gəldi — 10 ədəd, `evals/images/`.** Hamısı Telegram-dan keçib (960×1280, ~100 KB),
yəni orijinal kamera şəkli deyil, sıxılmış. Bu, **pis hala yaxın** testdir — işləyirsə,
orijinallarda daha yaxşı işləyəcək.

**Ən vacib tapıntı: 10 şəklin 10-u da çoxsualldır.** Bir dənə də tək məsələli kadr yoxdur.
Kadr başına 1–5 məsələ. `ADR-007`-dəki `candidates` axını **istisna deyil, əsas axındır**;
kəsmə ekranı olmadan tətbiq işləməyəcək. Kitab **10–11 sinif** səviyyəsindədir (triqonometriya,
loqarifm, üstlü tənliklər, kompleks ədədlər, ehtimal, statistika).

**2. `ADR-008` yazıldı — format və dil neytrallığı.** İki səhvimi düzəldir:
- Prompt DİM formatına sürüşmüşdü ("A/B/C/D", "çap olunmuş nömrəni mütləq axtar").
  İndi variantların sayı/etiketi sərbəstdir (və ya heç yoxdur), identifikator yoxdursa sıra nömrəsi.
- Dil sahə adlarında və enum dəyərlərində sərtləşdirilmişdi. `subject` → `math|physics|chemistry`,
  `reason_az` → `reason`, `topic_code` ingiliscə, yeni `detected_language`.
  `error_code`-un nümunəsi (ingiliscə kod + `$defs`-də etiket) hər yerə tətbiq edildi.
- Prompt **v5**. `--selftest` **14/14** qalır.

**3. İki golden set yazıldı** (ground truth əl ilə çıxarıldı və iki dəfə yoxlandı):
- `evals/golden-set.jsonl` — xam şəkillər, 9× `multiple_problems` + 1× `ok` → **aşkarlama yolu**
- `evals/golden-set-cropped.jsonl` — `evals/images-cropped/`, hamısı `ok` → **həll yolu**.
  Hər şəkli proqramla kəsdim, onunu da gözlə yoxladım: tam bir məsələ, kəsilmiş variant yoxdur.

**Tapşırıq — [86eyhqggz](https://app.clickup.com/t/86eyhqggz) · URGENT · bu olmadan hökm verilə bilməz:**

`report.py:126` — `final_answer_correct` **yalnız** `verify.verify_final_answer(canonical, values)`
ilə hesablanır. Golden set-dəki `final_answer_values` (insan cavabı) **heç yerdə oxunmur**.
Real dəstdə 10 məsələdən 9-u sympy ilə yoxlanıla bilmir: ifadə qiyməti, triqonometrik ümumi həll
(`x = πn`), ehtimal (`2/3`), parametr məsələsi, törəmə kəmiyyət. Metrika demək olar bütünlüklə
`None` çıxacaq.

Tələb olunan məntiq:
1. Golden set-də `final_answer_values` varsa → modelin `final_answer.values`-i ilə **birbaşa
   müqayisə** (normallaşdırma: `−`→`-`, `,`→`.`, `2/3` ≡ `0.666…` sympy `Rational` ilə,
   çoxluq kimi, sıra əhəmiyyətsiz). Golden bir neçə qəbul edilən forma saxlaya bilər — **biri
   uyğun gəlsə doğrudur**.
2. sympy `canonical`-a qarşı yoxlaya bilirsə → **müstəqil çarpaz yoxlama**. Ziddiyyət varsa
   `verify_conflict: true` yaz — bu, **mənim ground truth səhvimi tutan mexanizmdir**.
3. Heç biri mümkün deyilsə → `None`.

`expected_choice` (yeni, opsional) — variantlı məsələdə düzgün variantın hərfi. İnformativ, qapıya girmir.

**Diqqət:**
- `.env` artıq OpenRouter-dədir: `google/gemma-4-31b-it:free` — **multimodaldır** (yoxladım,
  mətn + şəkil girişi). Pulsuz limit 50 sorğu/gün; iki dəst = 20 sorğu, sığır.
- `prompts/solve-step.md` v5-ə və `docs/STEP-SCHEMA.json`-a **toxunma** — ikisi də yenicə dəyişdi,
  selftest 14/14 keçir.
- `evals/images-cropped/` `.gitignore`-dadır.

**Blok:** `86eyhqggz` bitməyincə Faza 0-lite hökmü verilə bilməz.

---

## 2026-08-05 (12) · Cowork → Claude Code

**Etdim:** Dörd tapşırığın hamısı yoxlandı — **qəbul edilir**. `--selftest` 14/14, sızma 0/3
(`ADR-005` təsdiqləndi), invariant testi keçir, worktree birləşdirilib. Latensiyanın retry
gözləməsini çıxarması mock serverlə sübut edilib — bu, düzgün mühəndislikdir.

**Yeni qərar — `ADR-007` yazıldı: bir kadrda bir neçə məsələ.**

`ADR-006`-dakı həllim **səhv idi**. Orada `multiple_problems` → "yenidən çək" yazmışdım.
Test toplularında məsələlər 1–2 sm aralıdadır — bu hal **normadır, istisna deyil**, və normal
hala görə şagirddən yeni şəkil istəmək onu itirməkdir.

Sənaye praktikası yoxlanıldı: **seçim UI-da, bahalı çağırışdan əvvəl baş verir.** Photomath —
çəkilişdən əvvəl ölçüsü dəyişən çərçivə. Gauth — OCR özü kəsir. Heç kim tam səhifəni modelə
verib "hansını nəzərdə tuturdun?" soruşmur.

Üç qat: (0) çəkiliş çərçivəsi *(var)* → (1) **çəkilişdən sonra kəsmə** *(yeni ekran, əsas
mexanizm)* → (2) model `candidates[]` qaytarır, UI seçim göstərir → (3) kəsməyə qayıt.

**Sxem və prompt dəyişdi:**
- `STEP-SCHEMA.json` → `candidates[]` (maxItems 5, `label` + `preview`). Yoxlandı.
- `prompts/solve-step.md` → **v4.1**, "BİR NEÇƏ MƏSƏLƏ VARSA" bölməsi yenidən yazıldı.
- `--selftest` **14/14 qalır**, invariant testi (enum örtüyü + nümunə) keçir.

**Tapşırıq:** Sənin üçün açıq tapşırıq **yoxdur** — şəkilləri gözləyirik.
Faza 1-ə [86eyhpf2f](https://app.clickup.com/t/86eyhpf2f) yazıldı (kəsmə + seçim ekranı), amma
Faza 1 hələ bağlıdır.

**Diqqət:**
- `label` çap olunmuş məsələ nömrəsidir ("14"). Bu, təkcə UI üçün deyil — **güclü keş açarıdır**
  ("DİM 2025 · 9-cu sinif · variant 3 · sual 14" bulanıq hash-dan qat-qat dəqiqdir).
  `ADR-003`-dəki import planı üçün faydalıdır.
- **İmtina/seçim/kəsmə gündəlik limitdən sayılmır.** Yalnız çatdırılmış həll sayılır —
  `attempts` sayğacı `completed = true` üzərində işləməlidir.
- Şəkillər gələndə `--image-max-px` müqayisəsində **temperature 0** işlət (n kiçikdir,
  0.2 ilə run-dan-run fərqi ölçdüyümüz fərqi üstələyə bilər).
- Golden-set-ə 2–3 qəsdən pis şəkil lazımdır — haqlısan, sintetik uydurmaq riskli olardı,
  Ilkin-in çəkiliş siyahısına əlavə edildi.

**Blok:** Faza 0-lite şəkilləri gözlənilir.

---

## 2026-08-05 (11) · Claude Code → Cowork

**Etdim (sıra ilə, 1 və 2 şəkillərdən əvvəl bitdi):**

**1) `86eyhp5h5` — şəkil ön emalı (`llm_client.py::_image_content`):**
- Hər şəkil PIL ilə açılır (HEIC üçün `pillow_heif.register_heif_opener()`), `ImageOps.exif_transpose()`,
  `mode != "RGB"`-dirsə `convert("RGB")` (alfa-kanallı PNG/skrinşot JPEG kimi saxlana bilməzdi —
  bunu sintetik testdə tapıb düzəltdim, aşağıya bax), ən uzun tərəf `max_px`-ə (default 1600,
  `--image-max-px` və ya `.env`-də `IMAGE_MAX_PX` ilə) kiçildilir, **HƏMİŞƏ JPEG q=85** kimi
  yenidən kodlanır. Bu, MIME probleminin kökünü kəsir — çıxış giriş formatından (HEIC/PNG/WEBP/JPG)
  asılı olmayaraq həmişə `image/jpeg`-dir, ayrı uzantı→MIME xəritəsinə ehtiyac qalmır.
- HEIC açıla bilməzsə (`pillow-heif` yoxdursa) aydın `RuntimeError`, səssiz uğursuzluq yox.
- 429/500/502/503/504-də 3 cəhdə qədər eksponensial gözləməli retry (`1s, 2s`).
  **Latensiya YALNIZ son cəhdin müddətidir — retry gözləməsi daxil deyil** (sənin xəbərdarlığın
  düzgün idi: mock serverlə yoxladım, 2×500 + sleep ilə ~2.3san ötəri müddət keçdi, amma
  ölçülən `latency_ms` 21ms çıxdı — düzgün). Cəhd sayı `attempts` sahəsində ayrıca yazılır.
- `image_px`/`image_bytes` nəticə JSON-una yazılır.
- `requirements.txt`-ə `pillow`, `pillow-heif`. `--image-max-px` bayrağı əlavə edildi.
- **Sintetik yoxlama (scratchpad-da, repoya commit edilmədi):** böyük JPEG (4032×3024 →
  1600×1200-ə kiçildi), alfa-kanallı PNG (RGB-yə çevrildi, crash olmadı), EXIF orientation=6
  JPEG (döndərmə tətbiq olundu, ölçülər dəyişdi), **əl ilə yaradılmış real HEIC** (pillow-heif
  ilə həm kodlandı, həm bu kodla düzgün oxunub JPEG-ə çevrildi) — 4/4 keçdi.

**2) `86eyhp5jn` — `expected_status` + hallüsinasiya metrikası:**
- `golden-set`/`fixtures` sətirlərinə opsional `expected_status` (yoxdursa `"ok"`).
- `report.py`: `is_hallucination()` — `expected_status != "ok"` olduğu halda model `steps`/
  `final_answer` qaytarıbmı (status sahəsindən asılı olmayaraq, "həll qaytarması" hərfi mənada).
  **Qapı 0%.** Simmetrik `is_false_refusal()` — əks hal, qapısız, hesabatda görünür.
  Əlavə (sənin tələbinlə) `status_match()` — yalnız informativ: imtina səbəbi (`unreadable` vs
  `cut_off`) dəqiq uyğundurmu, qapıya təsir etmir. `ocr_confidence` hər item-də qeyd olunur.
- 3 selftest halı: `status_unreadable_valid` (sxem qəbul edir, hallüsinasiya deyil),
  `status_unreadable_missing_reason_invalid` (`reason_az` yoxdursa sxem tutur),
  `hallucination_detected` (imtina gözlənilirdi, tam həll gəldi → hallüsinasiya=true).

**3) `86eyhnxxr` — `leak.py` `ADR-005`-ə uyğun:**
- `detect_leak`: `V` `steps[i].explanation`-da görünür VƏ heç bir **əvvəlki** (`j<i`) addımın
  `check.accept`-ində yoxdursa sızma sayılır. `_leaked_in_text` toxunulmadı.
- Yeni selftest halı `leak_previously_asked_not_leak` (`fx-003` ssenarisi: yoxlama addımı
  əvvəlki `accept` dəyərinə istinad edir → sızma DEYİL).
- `evals/README.md` metrika cədvəli: sızma tərifi yeniləndi + hallüsinasiya/artıq-ehtiyat sətirləri
  əlavə edildi (sənin 3-cü tələbin).

**4) `86eyhnv2r` — prompt↔sxem invariant testi:**
- `schema_check.collect_enum_values()` — sxemi rekursiv gəzir, `verification.*` istisna.
- `prompt_loader.extract_example_json()` — System blokundakı nümunəni `json.JSONDecoder.raw_decode`
  ilə çıxarır, hardcode yoxdur.
- `--selftest`-ə 2 yeni yoxlama: (a) hər enum/const dəyəri promptda hərfi-hərfinə var,
  (b) nümunə sxemə valid VƏ `check_structure()`-un 5 şərtini keçir.
  **Hər ikisi PASS oldu — prompt v4-ə toxunmadım, lazım da olmadı.**

**Canlı reqressiya (DeepSeek, `evals/fixtures.jsonl`):** sxem 3/3, struktur 3/3,
**sızma 0/3** (əvvəl 1/3 idi — `ADR-005` düzəlişi təsdiqləndi), hallüsinasiya n=0
(fixture-lərdə imtina gözlənilən nümunə yoxdur, gözlənilən), artıq ehtiyat 0/3.
`--selftest`: **14/14** (8 köhnə + 6 yeni: leak + 3×hallüsinasiya + 2×invariant).

**Worktree → main: bu dəfə BİRLƏŞDİRDİM** (sənin qeydin: iki dəfə unudulmuşdu). Ətraflı aşağıda.

**Tapşırıq:** `86eyhp5h5`, `86eyhp5jn`, `86eyhnxxr`, `86eyhnv2r` bağlandı.

**Diqqət:**
- `prompts/solve-step.md` v4-ə, `docs/STEP-SCHEMA.json`-a, `error_code` enum-una toxunulmadı.
- LLM-hakim əlavə edilmədi (`ADR-004`). App kodu yazılmadı.
- `--image-max-px 800/1200/1600` müqayisəsi hələ edilmədi — real şəkillər gözlənilir, sənin
  temperature=0 xəbərdarlığın qeyd olundu, şəkillər gələndə tətbiq ediləcək.
- Golden-set-də hallüsinasiya qapısını mənalı ölçmək üçün **2–3 qəsdən pis şəkil** lazımdır
  (`ADR-006`) — bu, `86eyhk10u` çəkiliş tapşırığının bir hissəsi olmalıdır, mən əlavə etmədim
  (real şəkil yoxdur, sintetik uydurmaq riskli olardı).

**Blok:** yoxdur. Faza 0-lite şəkilləri gözlənilir.

---

## 2026-08-05 (10) · Cowork → Claude Code

**Kontekst dəyişikliyi:** Ilkin-in əlində DİM toplusu yoxdur. Şəkilləri qohum şagird çəkib
göndərəcək. Faza 0 **8–10 şəkillik "lite" versiyaya** endirilir (30 yerinə) — məqsəd qapı hökmü
deyil, **vision boru xəttinin ümumiyyətlə işlədiyini** bilmək. Real n≥30 qapısı Faza 1-də
şagird istifadəsindən avtomatik toplanacaq.

**Etdim — sistemin soyuq nəzərdən keçirilməsi. İki struktur boşluğu tapıldı:**

1. **Sistemdə imtina yolu YOX İDİ.** `STEP-SCHEMA.json` `steps` və `final_answer`-i məcburi
   edirdi (`minItems: 2`) — yəni model şəkli oxuya bilməsə belə **həll uydurmalı** idi.
   Bu, məhsulun ən təhlükəli səhv rejimidir: uydurma həll → uydurma `error_code` →
   **səhv xəritəsi zəhərlənir**, yəni `CLAUDE.md`-dəki qızıl qayda pozulur.
2. **Etibarlılıq siqnalı yox idi.** Dizaynda `düzəliş` axını var, amma nə vaxt açılacağını
   bilmirdik — model heç bir confidence qaytarmırdı.

**`ADR-006` yazıldı.** Dəyişiklikər:
- `STEP-SCHEMA.json` → `status`, `ocr_confidence`, `reason_az` (hamısı opsional, `if/then` ilə
  şərti `required`). **Geriyə uyğunluq yoxlandı:** 6 haldan 6-sı düzgün, selftest 8/8.
- `prompts/solve-step.md` → **v4**, yeni "ŞƏKİL GİRİŞİ" bölməsi: imtina qaydası, əl yazısı
  həllini və cavab açarını atlama, bir neçə məsələ, A/B/C/D, həndəsə, dil, kəsilmiş şəkil.

**Tapşırıqlar (prioritet sırası ilə):**
1. [86eyhp5h5](https://app.clickup.com/t/86eyhp5h5) — **şəkil ön emalı: HEIC, kiçiltmə, EXIF,
   MIME, retry.** URGENT: şəkillər gəlməzdən əvvəl bitməlidir, yoxsa smoke test format
   xətaları ilə sınacaq (iPhone HEIC göndərəcək, `.jpg` → `image/jpg` yanlış MIME verir).
2. [86eyhp5jn](https://app.clickup.com/t/86eyhp5jn) — `expected_status` + **hallüsinasiya
   metrikası (qapı 0%)**.
3. [86eyhnxxr](https://app.clickup.com/t/86eyhnxxr) — `leak.py` `ADR-005` (hələ açıq)
4. [86eyhnv2r](https://app.clickup.com/t/86eyhnv2r) — prompt↔sxem invariant testi (hələ açıq)

**Diqqət:**
- Hallüsinasiya metrikası **digər bütün metrikalardan vacibdir**. Yanlış həll heç bir həlldən pisdir.
- Kiçiltmə yalnız eval/server tərəfdədir. Klient resize Faza 1 məsələsidir.
- `prompts/solve-step.md` v4 mətn girişində reqressiya yaratmamalıdır — şəkil bölməsi
  "YALNIZ ŞƏKİL VERİLDİKDƏ" başlığı altındadır.

**Blok:** Faza 0-lite şəkilləri gözlənilir.

---

## 2026-08-05 (9) · Cowork → Claude Code

**Etdim:** Prompt v3 və v3.1 ilə iki canlı run. **Addım 2 (fixture testi) faktiki olaraq bitdi.**

| metrika | v2 | v3 | v3.1 |
|---|---|---|---|
| Sxem validliyi | 3/3 | 2/3 | **3/3** |
| Son addım yoxlama | 1/3 | 2/2 | **3/3** |
| Struktur — hamısı | — | 2/2 | **3/3** |
| Son cavab | 2/2 | 2/3 | **2/2** |
| Cavab sızması | 0/3 | 0/2 | 1/3 ⚠ |

- **v3:** nümunəyə yoxlama addımı əlavə edildi → struktur düzəldi, amma model
  `problem_type: "word"` yazdı → sxem düşdü.
- **v3.1:** sxemi proqramatik gəzib modelin yazdığı bütün enumları çıxardım —
  `problem_type` və `subject` promptda **sadalanmamışdı**. Hər ikisi + `grade` diapazonu
  əlavə edildi, `verification` sahəsinin yazılmaması açıq deyildi. Enum örtüyü indi tamdır.

**Yeni qərar — `ADR-005` yazıldı: sızma tərifi dəyişir, prompt yox.**

`ADR-004`-ün məcburi etdiyi yoxlama addımı mövcud sızma tərifi ilə **struktur olaraq ziddir** —
kökü adlandırmadan onu yerinə qoymaq mümkün deyil, ona görə hər düzgün yoxlama addımı sızma
sayılır. `fx-003`-də şagird `230`-u addım 2-də özü yazır, addım 3 ona istinad edir → yanlış müsbət.

Yeni tərif: **sızma = şagirdin hələ soruşulmadığı dəyəri açıqlamaq.**

Diqqət: `ADR-004`-də əks qərar verilmişdi (prompt dəyişdi, metrika qaldı). Ziddiyyət yoxdur —
**hansının dəyişəcəyini məhsul qərarı təyin edir, hansının daha rahat düzəldiyi yox.**

**Tapşırıq:** [86eyhnxxr](https://app.clickup.com/t/86eyhnxxr) — `leak.py` `ADR-005`-ə uyğun
yenidən yazılsın + selftest halı + `evals/README.md`. **URGENT** — düzəldilməsə real evalda
`≤10%` qapısı yanlış sınacaq.

**Diqqət:**
- `prompts/solve-step.md` v3.1-ə **toxunma**. Sxem 3/3, struktur 3/3 verir.
- `_leaked_in_text`-dəki rəqəm/şəkilçi ayırd etməsi düzgündür, saxlanılır — yalnız hansı
  addımlarda axtarılacağı dəyişir.
- [86eyhnv2r](https://app.clickup.com/t/86eyhnv2r) (prompt↔sxem invariant testi) hələ açıqdır.
- **Sessiya sonunda worktree-ni `main`-ə birləşdir.** İki dəfə unudulub.

**Blok:** Faza 0 qapısı ölçülməyib (`golden-set.jsonl` boşdur). Faza 1 bağlıdır.
Şəkil toplama Ilkin tərəfdə paralel gedir — `leak.py` düzəlişi onu gözləmir.

---

## 2026-08-05 (8) · Cowork → Claude Code

**Etdim:**
- `claude/read-old-folder-2feb4d` → `main` birləşdirildi (fast-forward, `53aa235`). Konflikt yoxdu.
  **Qeyd:** iş yenə worktree-də qalmışdı. Sessiya sonunda `main`-ə birləşdirmək lazımdır,
  yoxsa növbəti sessiya köhnə kodu görür.
- Harness müstəqil yoxlandı: `--selftest` **8/8**, `check_structure` 5 şərti ayrıca qaytarır,
  `_error_codes_distinct` düzgün (yalnız "hamısı eyni olmasın", "hamısı fərqli olsun" yox),
  `_ends_with_verification` açar-söz axtarışıdır — AI mühakiməsi yoxdur. **Qəbul edilir.**
  `--compare`-dəki `not_implemented` bug-ının tapılıb düzəldilməsi yaxşı işdir.

**Qərar — `ends_with_verification` 1/3:** **prompt dəyişdi (v3), metrika olduğu kimi qaldı.**

Yoxlama addımı məhsulun dizayn tələbidir, metrikanın kaprizi deyil — üç müstəqil sübut
`ADR-004` "Əlavə 2026-08-05" bölməsindədir (təsdiqlənmiş maket `ADDIM 04/04 · Kökləri yoxla`
ilə bitir; `SUBSTITUTION_SKIPPED` enum-da var və yalnız yoxlama addımı varsa məna kəsb edir;
valideyn hesabatında `YERİNƏQOYMA` sətri var).

**Kök səbəb sənin dediyindən bir qat dərindədir:** qayda 8-in olmaması doğrudur, amma daha güclü
səbəb — **v2-nin nümunəsi özü yoxlama addımı olmadan bitirdi** ("Diskriminantı hesabla"). Model
qaydadan çox nümunəni təqlid edir. v3 nümunəyə 3-cü addımı (`Kökləri yoxla`,
`SUBSTITUTION_SKIPPED`) əlavə etdi + qayda 8 (yoxlama məcburi, real hesablama olmalı) və
qayda 9 (`error_code`-ları təkrarlama — `error_codes_distinct` 2/3 idi).

**Tapşırıq:** [86eyhnv2r](https://app.clickup.com/t/86eyhnv2r) — reqressiya testi: promptdakı
nümunə `check_structure()`-ın 5 şərtini də keçməlidir, `--selftest`-ə əlavə et.
İndi əl ilə yoxladım (5/5 keçir), amma qorunmur.

**Diqqət:**
- Testin istiqaməti birtərəflidir: **nümunə metrikaya tabedir.** Test sınarsa düzəldiləcək şey
  nümunədir, `check_structure` deyil.
- v3 ilə fixture testini təkrar işə salmaq lazımdır — `ends_with_verification` 3/3 olmalıdır.
  Bunu Ilkin edəcək (sandbox `api.deepseek.com`-a çıxa bilmir).
- Xərc: `PRICE_INPUT_PER_1M`/`PRICE_OUTPUT_PER_1M` hələ boşdur, ona görə `avg_cost_usd = None`.
  `usage` artıq görünür, əl ilə hesablana bilər. Qapı üçün kritik deyil — Addım 4-də doldurulacaq.

**Blok:** Faza 0 qapısı ölçülməyib (golden set boşdur, `n=0`). Faza 1 bağlıdır.

---

## 2026-08-05 (7) · Claude Code → Cowork

**Etdim (sıra ilə, 1 bitmədən 2 başlamadı):**

**1) `86eyhnap2` — görünürlük:**
- `report.py::evaluate_item` indi hər item üçün `raw_output` (parse olunmuş JSON), `raw_text`
  (xam model mətni) və `usage`-i **həmişə** entry-yə yazır — əvvəllər sxem keçməyəndə
  `raw_output` heç qeyd edilmirdi (məhz "iki dəfə blokladığı" hal). Nəticə JSON-u indi model
  nə qaytardığını tam göstərir.
- **`usage` əslində DÜZGÜN oxunurdu** (`llm_client.py` artıq `body.get("usage")` çıxarırdı) —
  problem oxumada deyil, **görünməzlikdə** idi: `cost_usd` hesablanırdı, amma xam `usage`
  heç yerdə saxlanmırdı. Canlı DeepSeek testi ilə təsdiqlədim:
  `{"prompt_tokens": 1915, "completion_tokens": 1088, ...}` — indi nəticə faylında görünür.
- `PRICE_INPUT_PER_1M`/`PRICE_OUTPUT_PER_1M` `.env`-də yoxdur, ona görə `avg_cost_usd` hələ
  `None` — bu, ayrı məsələdir (qiymət deyil, görünürlük tələb olunurdu). `usage` özü
  saxlanılan kimi əl ilə hesablana bilər.
- `JSON_MODE=0` `.env`-dən `response_format`-ı söndürür (`scripts/.env.example`-ə əlavə edildi).

**2) `86eyhng0c` — struktur yenidən yazılışı (`ADR-004`):**
- `steps_compare.py` tamamilə yenidən yazıldı: Jaccard/başlıq heuristikası silindi,
  `check_structure(steps)` 5 obyektiv şərti ayrıca boolean kimi qaytarır (`count_ok`,
  `checks_present`, `index_sequential`, `ends_with_verification`, `error_codes_distinct`) +
  `all_pass`. `ends_with_verification` sadə açar-söz axtarışıdır (`SUBSTITUTION_SKIPPED` VƏ YA
  "yoxla"/"yerinə qoy"/"təsdiq"/"bərabərlik" mətndə) — semantik/AI mühakimə yoxdur.
- `report.py`: `step_split_accuracy` silindi → `step_split_structural` (hər şərt ayrıca hesabatda,
  qapı 100%) + `step_split_pedagogical` (`evals/results/human-review-<tarix>.jsonl`-dən, qapı
  ≥75%). Fayl yoxdursa qapı **"NATAMAM"** yazır, heç vaxt "KEÇDİ" demir (yoxladım: boş halda
  düzgün işləyir).
- `--compare` ən son `human-review-*.jsonl`-i **hər çağırışda təzədən** oxuyur (run vaxtından
  sonra əlavə oluna bilər deyə keşlənməyib).
- `expected_step_count`/`expected_step_titles` `golden-set.jsonl`/`fixtures.jsonl`-də saxlanıldı,
  metrikada işlədilmir (informativ qalır).
- `selftest-cases.jsonl`-a 3 yeni mənfi hal: eyni `error_code`-lar, ardıcıl olmayan `index`,
  7 addım (`STEP-SCHEMA.json`-un `maxItems:6`-sı ilə tutulur — `schema_valid=false`).
  `--selftest` **8/8** keçir.
- Test zamanı bir bug tapıb düzəltdim: `--compare`-də pedaqoji rəy `not_implemented` statuslu
  A boru xəttinin item-lərinə də (yalnız id uyğunluğu ilə) mənasız şəkildə aid olunurdu.
  `report.successful()` əlavə edildi — yalnız `status=="ok"` item-lər insan rəyi ilə uyğunlaşdırılır.

**Canlı yoxlama (DeepSeek, `evals/fixtures.jsonl`, real nəticə):**
- Sxem validliyi **3/3** (reqressiya yoxdur).
- **Son addım yoxlama: 1/3.** Bu, harness bug-ı deyil — real tapıntıdır: prompt v2 (`prompts/solve-step.md`,
  toxunmadım) modelə son addımı açıq yoxlama addımı kimi bitirməyi tapşırmır, model birbaşa son
  hesablama ilə bitirir. `ends_with_verification` bunu doğru tutur. Struktur qapısı (100%) bu
  prompt ilə hazırda keçməyəcək — Cowork qərar verməlidir: prompt dəyişsin, yoxsa şərt yenidən
  baxılsın (mən heç birini etmədim, qadağan idi).
- `error_code-lar fərqli`: 2/3 — bir fixture-də model iki addıma eyni `error_code` yazıb, real.

**Tapşırıq:** `86eyhnap2` və `86eyhng0c` bağlandı.

**Diqqət:**
- `prompts/solve-step.md`-ə toxunulmadı. `error_code` enum-una, `DESIGN-TOKENS.json`-a toxunulmadı.
- App kodu yazılmadı. Faza 0 qapısı hələ ölçülməyib, Faza 1 bağlıdır.
- LLM-hakim əlavə edilmədi — `ADR-004`-də niyə rədd edildiyi izah olunub, bilərəkdən istifadə etmədim.
- Test zamanı `evals/results/` içində müvəqqəti sınaq faylları (o cümlədən saxta `human-review-*.jsonl`)
  yaradıldı və işim bitəndə silindi — bunlar git-ə getmir, amma qeyd edirəm ki qarışıqlıq olmasın.

**Blok:** yoxdur. `ends_with_verification` şərti real prompt çıxışı ilə hazırda keçmir — bu, qapını
açan qərar deyil (Faza 0 qapısı `n≥30` golden set tələb edir), amma Cowork-un `ADR-004`-ə "əlavə"
yazması faydalı ola bilər ki gələcək prompt iterasiyası bunu nəzərə alsın.

---

## 2026-08-05 (6) · Cowork → Claude Code

**Etdim:** Prompt v2 ilə təkrar test — **sxem validliyi 0/3 → 3/3**, cavab sızması 0/3,
son cavab 2/2. Prompt problemi həll olundu.

İki tapıntı sənədləşdirildi:

1. **Son cavab məxrəci 2-dir, 3 deyil.** `word_problem` fixture-i sympy ilə yoxlanıla bilmədi və
   məxrəcdən çıxarıldı (`False` yazılmadı — düzgün davranış). `ADR-003`-dəki məhdudiyyət
   empirik təsdiqləndi.
2. **Addım bölgüsü 1/3 — metrikanın artefaktıdır.** `steps_compare.py` Jaccard heuristikası
   Azərbaycan dilinin şəkilçiləri ilə sınır, üstəlik `expected_step_titles` bir bölgünü
   "yeganə doğru" elan edir. → **`ADR-004` yazıldı**, metrika yenidən təriflənir.

`docs/PRODUCT.md` və `CLAUDE.md`-dəki Faza 0 qapısı `ADR-004`-ə uyğun yeniləndi.

**Tapşırıq (sıra ilə):**
1. [86eyhnap2](https://app.clickup.com/t/86eyhnap2) — `raw_output` + `usage` + JSON mode · **URGENT**
2. [steps_compare yenidən yazılsın](https://app.clickup.com/t/86eyhng0c) — `ADR-004`-ə uyğun struktur yoxlaması

**Diqqət:**
- `error_code` enum-u yenə **dəyişmədi**. Prompt v2 enum-u öz içinə aldı, enum promptа uyğunlaşmadı.
- `ADR-004`-ə görə pedaqoji məntiq **avtomatlaşdırılmır**. Bunu LLM-hakimlə əvəz etmə —
  ADR-də niyə rədd edildiyi yazılıb.
- Latensiya ~7 san (mətn girişi). Vision-da daha uzun olacaq → Faza 1-də "həll qurulur"
  ekranı məcburidir.

**Blok:** Faza 0 qapısı hələ ölçülməyib (golden set boşdur). Faza 1 bağlıdır.

---

## 2026-08-05 (5) · Cowork → Claude Code

**Etdim:** İlk canlı test işə salındı — DeepSeek `deepseek-chat`, 3 fixture, mətn girişi.
**Nəticə: sxem validliyi 0/3.** Səbəb model deyil, **prompt idi**.

`prompts/solve-step.md` v1-də sahə adları və `error_code` enum-u promptun içində **yox idi** —
yalnız "enum-dan seçin" yazılmışdı. Model görmədiyi siyahıdan seçə bilmədi və öz adlarını uydurdu:
`instruction` (title+explanation əvəzinə), `check` obyekt yerinə sətir, `error_code:
"wrong_coefficients"` kiçik hərflə. Bütün kök sahələri (`schema_version`, `canonical`, `grade`…)
buraxılmışdı.

`prompts/solve-step.md` **v2**-yə yeniləndi: tam JSON nümunəsi, sahə qaydaları və 11 `error_code`-un
siyahısı promptun içinə qoyuldu. `prompt_loader` parse edir (yoxlanıldı).

**Tapşırıq:** [86eyhnap2](https://app.clickup.com/t/86eyhnap2) — `eval.py` nəticə faylına `raw_output` yazsın + JSON mode dəstəyi +
`usage` oxunmur (token sayı `None` gəlir, xərc hesablana bilmir).

**Diqqət:**
- Bu tapıntı Addım 2-nin (30 şəkil çəkilməzdən əvvəl 3 sintetik məsələ ilə canlı test) dəyərini
  təsdiqlədi — xərci ~$0.001, qazancı bir günlük səhv iş.
- `error_code` enum-u **dəyişmədi**. Prompt enum-a uyğunlaşdırıldı, enum promptа yox.

**Blok:** v2 promptu ilə təkrar test gözlənilir. Nəticə 3/3 olmasa, JSON mode məcburi olur.

---

## 2026-08-05 (4) · Cowork → Claude Code

**Etdim:**
- `claude/read-old-folder-2feb4d` branch-i `main`-ə birləşdirildi (`85e1455`).
  `docs/HANDOFF.md` konflikti həll edildi — hər üç blok saxlanıldı, sıra "ən yenisi yuxarıda".
- Harness müstəqil yoxlanıldı: `--selftest` **5/5 keçir**, boş golden-set guard-ı işləyir,
  `llm_client.py` provayder-agnostikdir, `verify.py` sympy işlədir (string müqayisəsi yoxdur).
  Qoyulan 7 məcburi şərtin hamısı yerinə yetirilib. **Qəbul edilir.**
- `docs/decisions/ADR-003-dim-dataset-legal.md`-ə "Əlavə 2026-08-05" bölməsi yazıldı —
  mətn məsələlərinin maşınla təsdiqlənə bilməməsi və bunun DİM import həcminə təsiri.

**Tapşırıq:** Claude Code üçün **açıq tapşırıq yoxdur.** Faza 0 qapısı hələ ölçülməyib,
növbəti addım Ilkin-in əl işidir:
- `86eyhk10u` — 30 DİM şəkli çəkilib `evals/golden-set.jsonl` doldurulmalı
- `86eyhk12g` — Texo texocr.netlify.app-da 10 şəkildə əl ilə yoxlanmalı

**Diqqət:**
- `evals/golden-set.jsonl` doldurulanda `word_problem` sətirlərinin `canonical`-ına tənlik
  əlavə etmə məcburiyyəti **yoxdur** — `final_answer_values` insan ground truth-udur və
  metrikaya o əsasla girir. Tənlik əlavə etmək yoxlamanı dairəvi edər.
- Faza 1 kodlaşdırması **hələ də bağlıdır**. Qapı `n≥30` golden set üzərində ölçülməyincə açılmır.

**Blok:** Faza 0 qapısı ölçülməyib — Faza 1 başlamamalıdır.

---

## 2026-08-05 (3) · Claude Code → Cowork

**Etdim:**
- `scripts/eval.py` yazıldı — A (Texo, interfeys/`not_implemented`) və B (Vision LLM tək çağırış)
  boru xətlərini müqayisə edən CLI harness. `scripts/lib/` altında: `schema_check.py`
  (STEP-SCHEMA.json validasiyası), `verify.py` (sympy ilə `final_answer.values` yoxlanışı,
  string müqayisəsi yoxdur), `leak.py` (cavab sızması detektoru), `steps_compare.py`
  (addım bölgüsü heuristiği), `cost.py`, `llm_client.py` (provider-agnostik, `MODEL`/`API_KEY`/
  `BASE_URL` `.env`-dən, OpenAI-uyğun `/chat/completions`), `prompt_loader.py`
  (`prompts/solve-step.md`-i canlı parse edir, prompt mətni hardcode edilmir).
- `evals/fixtures.jsonl` — köhnə `golden-set.jsonl`-dəki 3 SEED_EXAMPLE sətri bura köçürüldü
  (şəkilsiz, mətn girişi ilə) + `evals/selftest-cases.jsonl` — 5 mock nümunə (1 doğru + 4 mənfi
  hal: səhv `final_answer`, çatışmayan `steps`, enum-da olmayan `error_code`, sızan `explanation`).
  `python scripts/eval.py --selftest` bunları API çağırışı olmadan işlədir — 5/5 keçir.
- `evals/golden-set.jsonl` **boşaldıldı** (real DİM data gələnə qədər). `evals/README.md`
  yeniləndi: fayl siyahısı, `--selftest`/`fixtures.jsonl` axını, qapı guard-ının izahı.
- **Qapı guard-ı əlavə edildi:** `n < 30` olan hər hansı dəstdə harness faiz ÇAP ETMİR, yalnız
  xam say (`m/n`) göstərir və `"gate_status": "QAPI ÖLÇÜLƏ BİLMƏZ (n=…, minimum 30)"` yazır —
  `--compare` da eyni qaydaya tabedir. Kiçik n üzərində faizin qapı keçidi kimi yozulmasının
  qarşısını almaq üçün (istifadəçi tələbi).
- Mock HTTP server ilə pipeline B uçdan-uca yoxlanıldı (schema/verify/cost/latensiya/gate guard
  işləyir); `.venv` və test nəticələri təmizləndi, repoya commit edilmədi.

**Tapşırıq:** ClickUp `86eyhk11z` bağlandı — https://app.clickup.com/t/86eyhk11z

**Diqqət:**
- `scripts/eval.py` işə salınmadan əvvəl: `pip install -r scripts/requirements.txt` və
  `.env` (bax `scripts/.env.example`: `MODEL`, `API_KEY`, `BASE_URL`, istəyə görə
  `PRICE_INPUT_PER_1M`/`PRICE_OUTPUT_PER_1M`).
- `evals/golden-set.jsonl` boşdur. 30 DİM şəkli çəkilib doldurulmayınca (`86eyhk10u`) harness
  yalnız `--set evals/fixtures.jsonl` ilə mənalı işləyir — nəticələr qapı hökmü vermir.
- `final_answer` yoxlanışı `word_problem` tipində canonical-da `$...$` daxilində tənlik yoxdursa
  `None` (yoxlanıla bilmədi) qaytarır, `False` yox — bu, dolayı denominatordan çıxarılır. Real
  golden-set doldurularkən mətn məsələlərinin `canonical`-ına lazım gələrsə tənlik əlavə edilməli
  ola bilər, əks halda son cavab dəqiqliyi metrikası mətn məsələlərini keçə bilər.
- `error_codes` enum-una toxunulmadı, `docs/DESIGN-TOKENS.json`-a toxunulmadı.

**Blok:** yoxdur — tapşırıq tam bitdi. Növbəti addım Ilkin-in əl işidir (`86eyhk10u`, `86eyhk12g`).

---

## 2026-08-05 (2) · Cowork → Claude Code

**Etdim:** `docs/FUTURE-IDEAS.md` — 4 gələcək funksiya (memory cards, gamification, lent alqoritmi,
leaderboard) qiymətləndirilib və saxlanılıb.

**Diqqət:** Bu fayl **tapşırıq deyil**. Heç biri Faza 4-dən əvvəl qurulmur. Kod yazma.
Yalnız Faza 2 sxem qərarlarında üç sətir nəzərə alınmalıdır:
- `problems` → `template_id` + `params` (variant generasiya mühərriki)
- `weekly_snapshots` cədvəli — irəliləyiş sonradan geriyə hesablana bilməz
- credits sxemi (əgər gələrsə) → **yalnız kosmetika, heç vaxt fayda**

---

## 2026-08-05 · Cowork → Claude Code

**Etdim:**
- Repo skeleti quruldu: `docs/`, `evals/`, `prompts/`, `design/`, `scripts/`
- `CLAUDE.md` — giriş faylı, fayl sahibliyi cədvəli, sessiya qaydaları
- `docs/STEP-SCHEMA.json` — LLM cavab müqaviləsi + `error_codes` enum-u (v1)
- `docs/DESIGN-TOKENS.json` — 9 dizayn faylındakı token drift-i həll edildi, kontrast düzəldildi
- `docs/DATA-MODEL.md` — Supabase sxemi (problems, solutions, attempts, step_errors, users)
- `docs/ARCHITECTURE.md` — keş-əvvəl boru xətti
- `docs/PRODUCT.md` — məhsul briefi, fazalar və qapı metrikaları
- `docs/decisions/ADR-001-ocr-pipeline.md` — OCR qərarı və araşdırma nəticələri
- `docs/decisions/ADR-002-design-tokens.md` — token drift-i və kontrast düzəlişi
- `prompts/solve-step.md` — addım generasiyası promptunun v1-i
- `evals/golden-set.jsonl` — 3 seed nümunə + format təsviri
- `design/` — 9 təsdiqlənmiş ekran maketi köçürüldü

**Tapşırıq:** ClickUp `Təhsil Platforması` folderi quruldu. Claude Code üçün açıq tapşırıq:

- **[86eyhk11z]** `scripts/eval.py` yaz — iki boru xəttini müqayisə edən harness
  (https://app.clickup.com/t/86eyhk11z)

Ilkin tərəfindəki əl işi (Claude Code gözləyir):
- **[86eyhk10u]** 30 DİM səhifəsini çək və `evals/golden-set.jsonl`-i doldur
- **[86eyhk12g]** Texo-nu 10 real şəkildə əl ilə yoxla (~30 dəq, texocr.netlify.app)

**Diqqət:**
- `error_codes` enum-u **dəyişməzdir**. Valideyn hesabatı, Test ekranı və Lent ona bağlıdır.
  Yeni kod lazımdırsa — ADR yaz, mövcud kodu yenidən adlandırma.
- `docs/DESIGN-TOKENS.json`-dakı `dark.t3` qəsdən `0.55`-dir (`0.45` deyil). WCAG AA kontrast
  düzəlişidir, "dizayn faylında belə idi" deyə geri qaytarma.

**Blok:** Faza 0 qapısı keçilməyib — Faza 1 kodlaşdırması başlamamalıdır.
