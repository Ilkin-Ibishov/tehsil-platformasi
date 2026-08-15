# DATA-MODEL

Supabase / Postgres. Miqrasiyalar `supabase/migrations/` altında (Faza 1-də yaradılacaq).

> ⚠️ **KÖHNƏLMƏ XƏBƏRDARLIĞI (2026-08-14 əlavəsi):** bu fayl ERKƏN DİZAYN sənədidir —
> `problems`/`solutions` adları faktiki miqrasiyalarda (`0014`, `0020`) `questions`/
> `question_translations`/`attempt_items` kimi YENİDƏN ADLANDIRILIB, `match_path`
> siyahısına sonradan `template`/`image_cache` əlavə olunub (`ADR-021`, `0045`). Bu sənəd
> HƏLƏ real sxemlə tam sinxronlaşdırılmayıb — konkret sütun adı/tip lazımdırsa
> `supabase/migrations/*.sql`-ə birbaşa bax, bura yalnız KONSEPSIYA üçün etibarlıdır.
> Tam yenidən yazma ayrı iş kimi qalır, bu əlavə yalnız gələcək sessiyanın kor-koranə
> köhnə ad işlətməsinin qarşısını almaq üçündür.
>
> **2026-08-15 əlavəsi (S1–S8, miqrasiyalar `0057`–`0062`).** Aşağıdakılar bu sənəddə HƏLƏ
> əks olunmayıb, real sxemə birbaşa bax:
> `question_translations.verification_reason` (`0060`) · `attempt_items.completed` /
> `revealed_answer` real yazılır (`0059`) · `public.error_codes` STEP-SCHEMA-nın 11 kodu ilə
> birləşdirildi, artıq `deprecated` sütunu var (`0058`) · `topic_codes`/`error_codes`-da RLS
> AKTİVDİR, `app_runtime` üçün full policy (`0061`) · Supabase Storage-da `captures` bucket-i
> (`0057`, `ADR-024`) · `questions.canonical` YENİDƏN YAZILIR (`0062`, `ADR-003` ləğv edildi).

## Prinsip

Bazada **iki ayrı şey** var və qarışdırılmamalıdır:

1. **Məsələ bilikləri** (`problems`, `solutions`) — istifadəçidən asılı deyil, keşdir, böyüdükcə xərc düşür.
2. **Şagird davranışı** (`attempts`, `step_events`) — hesabatın və səhv xəritəsinin mənbəyi.

Birincisi paylaşılan aktivdir, ikincisi şəxsi datadır. RLS siyasətləri buna uyğun ayrılır.

---

## `problems` — məsələ indeksi

| sütun | tip | qeyd |
|---|---|---|
| `id` | uuid pk | |
| `canonical` | text | **YAZILIR** (`0062`, 2026-08-14 — `ADR-003`-ün boşaltma qərarı LƏĞV EDİLDİ: eyni mətn onsuz da `question_translations.stem`-də qalırdı, boşaltmaq yalnız forensikanı itirirdi) |
| `canonical_hash` | text unique | `sha256(normalize(canonical))` — hesablanır, mətnin özü saxlanılmır. Birinci dərəcəli açar |
| `numeric_fingerprint` | text | mətndəki bütün ədədlər sıra ilə: `"60,2,3"` — ikinci dərəcəli açar |
| `embedding` | vector(768) | üçüncü dərəcəli açar, pgvector |
| `problem_type` | text | `formula` / `word_problem` / `geometry` / `mixed` |
| `subject` | text | **dil-neytral kod**: `math`/`physics`/`chemistry` (ADR-008). UI etiketi i18n-dədir. |
| `grade` | int | |
| `topic_code` | text | DİM proqramından |
| `source` | text | `dim_import` / `user_photo` / `textbook` |
| `source_ref` | text | məs. `DIM-2025-9SINIF-V1-Q34` — **DİM mətni saxlanılmır, yalnız istinad** |
| `hit_count` | int | neçə dəfə uyğunlaşdırılıb → Test bankına yüksəltmə meyarı |
| `created_at` | timestamptz | |

**İndekslər:** `canonical_hash` (unique btree), `numeric_fingerprint` (btree), `embedding` (ivfflat).

> ⚠️ **Hüquqi (2026-08-14-də yeniləndi):** `0009_scrub_problems_canonical.sql` sütunu
> boşaldırdı; `0062_restore_canonical_from_stem.sql` bunu geri qaytardı və `ADR-003`-ün həmin
> bəndini LƏĞV etdi (sürət > hüquqi ehtiyat, pre-launch, 0 istifadəçi). İndi DİM mətni HƏM
> `questions.canonical`-da, HƏM `question_translations.stem`-də, HƏM də addım payload-larında
> qalır. Hüquqşünas rəyi maddəsi indi DAHA AKTUALDIR — bax `ADR-003` → "Ləğv 2026-08-14".

## `solutions` — həllər

| sütun | tip | qeyd |
|---|---|---|
| `id` | uuid pk | |
| `problem_id` | uuid fk → problems | |
| `schema_version` | int | `STEP-SCHEMA.json` versiyası |
| `payload` | jsonb | sxemə uyğun tam obyekt (steps, final_answer, ...) |
| `verified` | bool | **`false` isə istifadəçiyə göstərilmir** |
| `verification_method` | text | `sympy` / `human` / `none`. **Real ölçmə (S5): son 10 canlı həllin 9-u `none`** — əksər DİM məsələsi tək dəyişənli tənlik deyil |
| `verification_reason` | text null | `0060` — niyə yoxlanmadı: `no_equation_extracted` / `no_single_variable_equation`. Klientə `verification.reason` kimi gedir |
| `model` | text | hansı model generasiya edib |
| `cost_usd` | numeric | vahid iqtisadiyyat ölçüsü |
| `created_at` | timestamptz | |

Bir məsələnin bir neçə həlli ola bilər (fərqli sinif dərinliyi). Seçim: `grade` uyğunluğu + `verified`.

## `attempts` — bir həll sessiyası

| sütun | tip | qeyd |
|---|---|---|
| `id` | uuid pk | |
| `user_id` | uuid fk | |
| `problem_id` | uuid fk | |
| `solution_id` | uuid fk | |
| `student_ref` | text null | fərdi dəvət kodu (SYSTEM-REVIEW §A3) — **retensiya BUNUN üzrə hesablanır**, `device_id` YOX (ITP-yə görə sıfırlana bilir) |
| `match_path` | text | `hash` / `fingerprint` / `embedding` / `llm` — **keş effektivliyi metrikası** |
| `ocr_source` | text | `texo_client` / `vision_llm` |
| `ocr_corrected` | bool | istifadəçi OCR nəticəsini düzəltdimi → OCR keyfiyyət siqnalı |
| `revealed_answer` | bool | "cavabı göstər"ə basdımı |
| `delivered` | bool | server `/api/solve`-də yazır — həll çatdırıldımı (gündəlik limit BUNU sayır) |
| `completed` | bool | klient `/api/attempts/progress`-də yazır — son addıma çatdımı (SYSTEM-REVIEW §A1: `delivered`-dən AYRI sahə, əvvəllər ikisi eyni sütunda qarışırdı) |
| `abandoned_at_step` | int null | hansı addımda tərk etdi |
| `duration_sec` | int | |
| `transfer_correct` | bool null | "eynisini sən həll et" nəticəsi |
| `created_at` | timestamptz | |

## `events` — xam telemetriya axını (Faza 1-dən)

**Append-only. Silinmir, yenilənmir.** `docs/TELEMETRY.md` bu cədvəlin müqaviləsidir.

| sütun | qeyd |
|---|---|
| `event_id` | uuid pk — **klientdə** yaradılır, upsert ilə idempotentlik |
| `device_id` | təsadüfi uuid, auth-suz retensiya ölçüsü |
| `session_id` / `attempt_id` | uuid, zəncirləmə üçün |
| `name` | `domen.hərəkət` — dəyişməz taksonomiya, `error_code` kimi |
| `ts_client` / `ts_server` | **`ts_server` həqiqi mənbədir**, klient saatı etibarsızdır |
| `props` | jsonb — **şəkil, məsələ mətni, şəxsi data QADAĞANDIR** |
| `app_version` | commit sha |

**İndekslər:** `(device_id, ts_server)`, `(attempt_id)`, `(name, ts_server)`.

> Aşağıdakı `attempts` və `step_events` **törəmədir** — `events`-dən qurulur.
> Xam axın həmişə bərpa oluna bilir, aqreqasiya yox. Faza 1-də görünüş (view) kimi,
> həcm artanda materiallaşdırılmış cədvəl kimi saxlanılır.

---

## `step_events` — addım səviyyəsində davranış

Səhv xəritəsinin və valideyn hesabatının **yeganə** mənbəyi.

| sütun | tip | qeyd |
|---|---|---|
| `id` | bigserial pk | |
| `attempt_id` | uuid fk | |
| `step_index` | int | |
| `error_code` | text null | `STEP-SCHEMA.json` enum-u (11 kod); doğrudursa `null` |
| `given_answer` | text null | `0063` — şagirdin YAZDIĞI xam cavab (doğru/səhv fərq etmədən) |
| `is_correct` | bool null | `0063` — **`error_code is null` ilə QARIŞDIRMA**: həm doğru cavab, həm "heç bir distraktora uyğun gəlməyən səhv cavab" `error_code=null` verir |
| `attempts_count` | int | həmin addımda neçə cəhd |
| `used_why` | bool | "niyə belədir"i açdımı |
| `used_token_hint` | bool | simvol izahına toxundumu |
| `created_at` | timestamptz | |

**Aqreqasiya:** valideyn hesabatındakı `TƏKRARLANAN SƏHVLƏR` =
`select error_code, count(*) from step_events where ... group by 1 order by 2 desc limit 3`.

## `users` / `profiles`

| sütun | qeyd |
|---|---|
| `role` | `student` / `parent` |
| `grade` | 5–11 |
| `locale` | `az` / `ru` / `en` / `tr` |
| `tone` | `genc` / `yetkin` — sinifdən avtomatik, dəyişilə bilər |
| `linked_parent_id` / `linked_student_id` | valideyn-şagird bağlantısı |
| `daily_limit` | int, default 30 — Faza 1-də sui-istifadə qoruyucusu, limit deyil |
| `subscription_status` | `free` / `active` / `past_due` |

---

## `app_config` — runtime konfiqurasiya (`ADR-023`, `0056`, real sxem)

Key/value cədvəli, `public` sxemində (sirr deyil, `error_codes`/`topic_codes` kimi arayış
datası). Redeploy-suz dəyişdirilə bilən dəyərlər üçün:

| `key` | `value` nümunəsi | qeyd |
|---|---|---|
| `active_model` | `gemini-3.7-flash` | `web/lib/models.ts`-in `getActiveModel`-i oxuyur, boşdursa `GEMINI_MODEL` env-ə düşür |
| `active_transcribe_model` | `` (boş = `active_model`-i işlət) | Qat 1 üçün, `TRANSCRIBE_MODEL` env-dən sonra sıradadır |
| `cascade_enabled` | `1` | Server kaskadı (`/api/solve` daxili Qat 1-5), boşdursa `CASCADE_ENABLED` env-ə düşür |
| `cascade_ui_enabled` | `0` | Klient transkripsiya təsdiq ekranı, `/api/config/public`-dən oxunur (`NEXT_PUBLIC_*` DEYİL — bax aşağı) |

2026-08-15: `cascade_*` bayraqları Vercel env-dən (build-vaxtı, redeploy tələb edən) bura
köçürüldü — `web/lib/app-config.ts::getBoolConfig` ümumi oxuyucudur, `readConfigValue`
`active_model`-lə PAYLAŞILIR. Klient (`NEXT_PUBLIC_*` YOX, çünki build-vaxtı bundle-a
yapışır) `GET /api/config/public`-i mount-da çağırır — bax `web/app/kamera/page.tsx`-in
`cascadeUiEnabled` state-i.

`app_runtime`-ın YALNIZ `SELECT`-i var (gate-78 dərsi) — yazı birbaşa SQL-lə (Claude Code/
Cowork) və ya gələcək admin RPC-lə. Bax `ADR-022` (qiymət registrisi) + `ADR-023` (bu cədvəl).

## Uyğunlaşdırma axını (`match_path`)

```
şəkil hash/pHash keşdə var?          → image_cache (0 xərc, `0045`)
canonical_hash bərabər?              → hash        (0 xərc, <50ms)
numeric_fingerprint + type bərabər?  → fingerprint (0 xərc, <80ms)
tənlik şablonuna oturur (3 tip)?     → template    (0 xərc, `ADR-021`, hələ Cowork təsdiqi gözləyir)
embedding oxşarlığı > 0.90?          → embedding   (~0 xərc, qurulmayıb)
heç biri                             → llm         (yeni həll, verified=false → sympy → true)
```

`attempt_items.match_path` paylanması **əsas xərc metrikasıdır**. Hədəf: 3 aydan sonra `llm`
payı < 30%. (Sütun/cədvəl adı `attempts`→`attempt_items` dəyişib, yuxarıdakı köhnəlmə
xəbərdarlığına bax — `image_cache`/`template` real `MatchPath` enum-unda var, `web/lib/
cascade/types.ts`, embedding hələ kodda YOXDUR.)

## Ölçmə — birinci həlldən əvvəl qurulmalıdır

Bunlar olmadan test etmək faydasızdır:

- `match_path` paylanması (keş effektivliyi)
- `ocr_corrected` nisbəti (OCR keyfiyyəti)
- `abandoned_at_step` histoqramı (harada itiririk)
- `revealed_answer` nisbəti (öyrənir, yoxsa köçürür)
- `transfer_correct` nisbəti (**əsl öyrənmə metrikası**)
- gündəlik/həftəlik qayıdış (Faza 1 qapısı: 20 şagirddən ≥8-i 7 gündə ≥3 dəfə)

---

## `public.ocr_captures` + Storage `captures` bucket-i (`0049`, `0057`, `ADR-024`)

OCR training korpusu VƏ forensika. Hər çəkiliş üçün **iki fayl** yazılır:

| | qeyd |
|---|---|
| yol formatı | `captures/<yyyy>/<mm>/<attempt_item_id və ya capture_id>-{raw,crop}.jpg` |
| `raw` | orijinal kəsilməmiş kadr — kəsmə bug-larını yalnız bu sübut edir |
| `crop` | LLM-ə göndərilən şəkil |
| bucket | PRIVATE, `image/jpeg`+`image/png`, obyekt başı 2 MB. RLS policy YOXDUR — yeganə giriş `SUPABASE_SERVICE_ROLE_KEY` ilədir |
| sütunlar | `storage_path`, `width`, `height`, `bytes`, `image_sha256`, `image_phash`, `ocr_raw`, `ocr_final` |
| yazan kod | `web/lib/storage.ts` (Storage REST API-yə birbaşa `fetch`, SDK yoxdur) |

**Uğursuzluq axını bloklamır** — Storage xətası şagirdin həllini dayandırmır, `storage_path`
`null` qalır.

⚠️ **Retensiya 90 gün QƏRARDIR, amma silmə cron-u HƏLƏ QURULMAYIB.** Şagird şəkli şəxsi
datadır. Silinmə tarixi `ocr_captures.created_at + 90 gün`-dən hesablanır, bucket obyekti
`storage_path` ilə 1-1 uyğundur. Bax `INVARIANTS.md` INV-09.

## `public.topic_codes` / `public.error_codes` — taksonomiya (`0051`, `0058`, `0061`)

Kodların yeganə DB mənbəyi. FK YOXDUR (şagird axını qırılmasın) —
`trg_register_topic_code`/`trg_register_error_code` naməlum kodu `active=false,
needs_review=true` ilə avtomatik qeydə alır, `v_taxonomy_review`-da görünür.

- `error_codes` **`docs/STEP-SCHEMA.json`-un 11 kodlu enum-u ilə birləşdirilib** (`0058`).
  DB-də olub sxemdə olmayan 7 köhnə kod SİLİNMƏDİ — `deprecated=true` ilə işarələndi
  (tarixi `step_events` sətirləri qırılmasın).
- **RLS hər ikisində AKTİVDİR** (`0061`): `app_runtime` üçün full policy (trigger-lər hər
  şagird sorğusunda bu cədvəllərə insert edir), `anon`/`authenticated` üçün heç bir policy.
