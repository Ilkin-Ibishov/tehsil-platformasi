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
| `canonical` | text | **BOŞ** (ADR-003, 2026-08-08 əlavəsi) — mətn məsələlərində DİM mətninin özü çıxdı, §D1. Sütun qalır, yazılmır. |
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

> ⚠️ **Hüquqi:** `canonical` sütunu artıq YAZILMIR (`0009_scrub_problems_canonical.sql`) — mətn
> məsələlərində DİM mətninin özünü saxlayırdı (§D1). Keş açarı yalnız `canonical_hash`/
> `numeric_fingerprint`-dir. **`solutions.payload` hələ tam mətni saxlayır** — bu, AYRICA açıq
> hüquqi məsələdir, bax `docs/decisions/ADR-003-dim-dataset-legal.md` "Əlavə 2026-08-08".

## `solutions` — həllər

| sütun | tip | qeyd |
|---|---|---|
| `id` | uuid pk | |
| `problem_id` | uuid fk → problems | |
| `schema_version` | int | `STEP-SCHEMA.json` versiyası |
| `payload` | jsonb | sxemə uyğun tam obyekt (steps, final_answer, ...) |
| `verified` | bool | **`false` isə istifadəçiyə göstərilmir** |
| `verification_method` | text | `sympy` / `human` / `none` |
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
| `error_code` | text null | `STEP-SCHEMA.json` enum-u; doğrudursa `null` |
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
datası). Redeploy-suz dəyişdirilə bilən dəyərlər üçün — indi yalnız model seçimi:

| `key` | `value` nümunəsi | qeyd |
|---|---|---|
| `active_model` | `gemini-3.7-flash` | `web/lib/models.ts`-in `getActiveModel`-i oxuyur, boşdursa `GEMINI_MODEL` env-ə düşür |
| `active_transcribe_model` | `` (boş = `active_model`-i işlət) | Qat 1 üçün, `TRANSCRIBE_MODEL` env-dən sonra sıradadır |

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
