# Təhlükəsiz paket — xərc və latensiya ardıcıllığı (3 → 2 → 1 → 4 → 5)

**Status:** İcra planı (qəbul gözləyir) · **2026-08-17 yeniləndi** (telefon funnel + ölçü düzəlişi)
**Rejim:** How-to (iş ardıcıllığı) + ölçülmüş kontekst
**Toxunur:** `web/lib/llm.ts` · `web/app/api/solve/transcribe` · `web/lib/storage.ts` ·
`web/lib/cascade/ocr-capture.ts` · `web/components/kamera/CropView.tsx` ·
`prompts/solve/math/` · `ADR-017` · `ADR-020` · `ADR-024` · `ADR-030` ·
`web/app/kamera/page.tsx`
**Sahə xaricində:** Qat 5 `reasoning_effort` endirmək · flash-lite marşrutu · offline
kitab bişirmə · sympy-əvvəl · ChatGPT/Railway soak

Bu sənəd **təhlükəsiz** (qızıl qaydaya və `error_code` taksonomiyasına bilərəkdən
toxunmayan) beş dəyişikliyi **sabit ardıcıllıqla** icra etmək üçündür.

Orijinal nömrələmə (təklif siyahısı) saxlanılır. İcra sırası fərqlidir:

| İcra # | Siyahı # | Ad |
|---|---|---|
| 1 | **3** | Qat 1 düşünməni söndür |
| 2 | **2** | Gemini kontekst keşi |
| 3 | **1** | Kritik yoldan I/O çıxar (server Storage/DB **və** klient encode) |
| 4 | **4** | ADR-030 mövzu promptlarını genişləndir |
| 5 | **5** | Qat 5 cavabını axınla (streaming) ver |

**Niyə bu sıra.** Əvvəl ucuz LLM bayrağı (3). Sonra giriş keşi (2). Sonra I/O (1).
Sonra məzmun (4). Axırda streaming (5), digər addımların ölçüsünü bulandırmasın.

---

## 0. Ölçü dərsləri (2026-08-17) — oxumadan planı icra etməyin

### 0.1 “Qat 1 = 9 san AI” səhvdir

| Siqnal | Nə ölçür | Tipik |
|---|---|---|
| `ocr_captures.latency_ms` / `meta.latency_ms` | **Yalnız LLM** (`callVisionLLM`) | Telefon: **~1.9–2.0 san**. Soak HTTP skripti: LLM ~4 san, HTTP ~8–9 san |
| Klient `solve.requested` → `transcript.shown` | Upload + server (LLM + Storage + DB) + şəbəkə | Telefon: **~5.7–9.9 san** |
| HTTP `/transcribe` wall (skript) | Eyni, server tərəfi | ~8–9 san (AI deyil) |

**Qayda.** AI vaxtı üçün `ocr_captures.latency_ms` oxuyun. “9 san Qat 1” deyəndə
həmişə **HTTP/klient wall** nəzərdə tutulurdu — AI deyil.

### 0.2 Şagirdin hiss etdiyi gecikmənin parçalanması (telefon, eyni device)

İki real cəhd (gallery 960×1280, `events.ts_client`, 2026-08-16 ~21:13–21:17 UTC):

**Cəhd A — uğurlu** (sual 84, kompleks; `attempt_id` `836a2b9a-…`):

| Interval | ~san | İzah |
|---|---|---|
| `photo_taken` → `crop.screen_opened` | **0.08** | Crop “gec açılır” hissi telemetriyada **yoxdur** |
| Crop düzəlişi | ~18 | İstifadəçi |
| `crop.confirmed` → `solve.requested` | **~4.1** | Telefonda **ikinci encode** (kəsik artıq yazılıb; sonra raw `cropAndResize`) |
| `solve.requested` → `transcript.shown` | **~9.9** | Şəbəkə + server; LLM yalnız **1.93 san** (`ocr_captures`) |
| Mətn oxuma | ~32 | İstifadəçi |
| `transcript.confirmed` → `solve.response` | **~0** | Fon `/finish` artıq bitmişdi |
| Qat 5 `latency_ms` (hadisə) | 20.9 | LLM |
| Xərc | ~$0.021 Qat5 + ~$0.0045 Qat1 | `delivered=true`, 3 addım |

**Cəhd B — uğursuz** (sual 83; `attempt_id` `a49da4ad-…`):

| Interval | ~san | İzah |
|---|---|---|
| Encode + Qat 1 HTTP | ~4.1 + ~5.7 | LLM yenə **~2.0 san** |
| `transcript.shown` → `confirmed` | **~1.3** | Tez “Düzdür” |
| `confirmed` → `solve.failed` | **~19** | Fon Qat 5 gözləməsi → `unreadable` |
| `attempt_items` | yox | Fail; Qat 1 pulu + Qat 5 çağırışı ödənilib, çatdırılma yox |

**Nəticə.** “Təsdiqlə / Düzdür gec reaksiya verir” üç fərqli şeydir:

1. Crop **Təsdiqlə** → ~4 san encode + ~6–10 san transcribe HTTP.
2. Transcript **Düzdür** (tez) → qalan Qat 5 (~15–20 san) gözləməsi.
3. Transcript **Düzdür** (geç, oxuduqdan sonra) → demək olar ki, ani (fon bitibsə).

### 0.3 Logging — nə düzgün, nə boşdur

| Siqnal | Status (2026-08-17 sonra) |
|---|---|
| Funnel hadisələri + `ts_client` | Düzgün |
| `ocr_captures.latency_ms` (LLM) | Düzgün |
| `meta.latency_ms` (transcribe) | Düzgün = **LLM only** |
| Server `llm_ms` / `storage_ms` / `db_ms` / `route_total_ms` | **Əlavə edildi** — `/transcribe` `meta` + `transcript.shown` props |
| Klient `encode_ms` | **Əlavə edildi** — `crop.confirmed`, `solve.requested` |
| Klient `transcribe_wait_ms` | **Əlavə edildi** — `transcript.shown` |
| Klient `finish_wait_ms` | **Əlavə edildi** — `solve.response` / `solve.failed` |
| `cached_tokens` | **Əlavə edildi** — meta + hadisə (keş aktiv olanda >0) |
| Uğursuz Qat 5 `cost_usd` | **Əlavə edildi** — `finish` `unreadable` `meta` + `solve.failed` / `solve.cascade` `persist_ok:false` |

Taksonomiya: `docs/TELEMETRY.md` (mövcud hadisə adlarına prop; yeni ad yoxdur, `solve.cascade` sənədləşdirildi).

Paket ölçüsündə **üç siqnal** məcburidir: LLM (`latency_ms`/`llm_ms`) · klient wall
(`encode_ms` / `transcribe_wait_ms` / `finish_wait_ms`) · server I/O (`storage_ms`+`db_ms`).
Yalnız birini yazmaq yenə qarışdırır.

### 0.4 Xərc (yenilənmiş)

| Mənbə | Uğurlu həll | Qeyd |
|---|---|---|
| Korpus soak batch-30 | ~$0.0233 | n=15 ok |
| Telefon cəhd A | ~$0.026 | Qat1 $0.0045 + Qat5 $0.021 |
| Fail daxil (soak 3/18) | ~$0.027+ çatdırılan | `unreadable` də LLM yandırır |
| Telefon cəhd B | Qat1 ödənildi; Qat5 fail | `solve.failed` / `unreadable` |

Xərcin böyük hissəsi hələ **Qat 5 çıxış+düşünmə**dir. Qat 1 AI artıq qısa ola bilər
(~2 san telefonda); düşünməni söndürmək xərcə kiçik, latensiyaya kiçik təsir edir.
**Qavranılan** latensiya isə encode + Storage + Qat 5 gözləməsindədir.

---

## 1. Məqsəd

| Metrik | Baza (düzəldilmiş) | Paket hədəfi |
|---|---|---|
| Uğurlu həll xərci | ~$0.023–0.026 | ~$0.015–0.017 |
| Çatdırılan (fail daxil) | ~$0.027+ | enmə + fail xərcinin görünməsi |
| Qat 1 **LLM** | ~2–4 san | eyni və ya bir az aşağı (addım 1) |
| Qat 1 **şagird gözləməsi** (crop Təsdiqlə → mətn) | ~10–14 san (encode+HTTP) | ~4–7 san (addım 3) |
| Qat 5 LLM | ~16–21 san | eyni divar; **qavranılan** aşağı (addım 5) |
| “Düzdür” (tez basılanda) | qalan Qat 5 | ilk addım axını (addım 5) |

Paket **dəqiqliyi bilərəkdən güzəştə getmir.** Qat 5 düşünmə büdcəsini endirmək bu
sənəddə yoxdur.

---

## 2. İlkin şərtlər

1. Production soak Gemini yolundadır (`soak_provider=gemini`, `ADR-029` / `ADR-030`).
2. PHASE-2 5/5 transkripsiya qapısı keçib (HANDOFF 151).
3. Hər addımdan sonra ölçünü **eyni üsulla** təkrarlayın (§5).
4. `error_code` enum və `docs/STEP-SCHEMA.json` dəyişmir.

---

## 3. Ardıcıllıq

Aşağıdakı addımları **bir-bir** bağlayın. Növbəti addıma keçməzdən əvvəl həmin
addımın qəbul şərtlərini keçin. Bir addım fail olsa, onu geri alın; paketin qalanına
keçməyin.

---

### Addım 1 (siyahı 3) — Qat 1 düşünməni söndür

**Problem.** Transkripsiya OCR + təsnifatdır. Model düşünmə tokeni yandıra bilər.
Telefon ölçüsündə LLM artıq ~2 san-dir; soak-da bəzən daha uzun. Xərc qazancı kiçikdir;
`error_code` Qat 5-dədir.

**Dəyişiklik səthi.**

- `web/lib/llm.ts` (və ya Qat 1 çağırış yeri): `thinking_budget: 0` /
  `reasoning_effort: "none"` yalnız **transcribe** yolunda.
- Qat 5 çağırışına toxunmayın.

**Qəbul.**

1. 5/5 transkripsiya qapısı yenidən `status=ok` və vizual uyğun.
2. `ocr_captures.cost_usd` / Qat 1 xərc enir və ya sabit qalır (reqressiya yox).
3. `ocr_captures.latency_ms` p50 artmır.
4. `topic_code` paylanması bariz dağılmır.

**Geri alma.** Bayrağı silin.

**Risk.** `topic_code` səhv → səhv mövzu faylı (addım 4). Qapı tutmalıdır.

**Prioritet (yenilənmiş).** Latensiya üçün bu addım **zəif** qoldur; xərc üçün kiçik.
Sıralamada qalır, çünki ucuz və təhlükəsizdir — amma gözləntini şişirtməyin.

---

### Addım 2 (siyahı 2) — Gemini kontekst keşi

**Problem.** Qat 5 system promptu (~5k token) sorğudan sorğuya eynidir. Hər dəfə tam
giriş qiyməti ödənilir. `normalizeUsage` artıq keş sahələrini oxuyur; keş **aktiv deyil**.

**Dəyişiklik səthi.**

- `web/lib/llm.ts`: Qat 5 system üçün kontekst keşi.
- Telemetriya: keş hit usage-də görünməlidir.

**Qəbul.**

1. İsti sorğularda `cached_tokens` və ya `cached_content_token_count` > 0.
2. Qat 5 giriş xərci enir (gözlənti ~−$0.003).
3. Sxem / addım keyfiyyəti dəyişmir.

**Geri alma.** Keşi söndürün.

**Risk.** Stale prompt. Keş açarı: `active_model` + prompt hash.

---

### Addım 3 (siyahı 1) — Kritik yoldan I/O çıxar (server + klient)

**Problem (iki yer).**

**A — Server.** LLM bitəndən sonra, cavabdan **əvvəl**: `uploadCaptureImages` (crop + raw),
`writeOcrCapture`. Telefon cəhdində LLM ~2 san, `solve.requested`→`transcript.shown`
~6–10 san → fərqin böyük hissəsi şəbəkə + Storage/DB + cold start ola bilər.

**B — Klient.** `CropView.confirm`: `crop.confirmed` hadisəsindən **sonra** hələ raw
kadr üçün ikinci `cropAndResize` (~4 san ölçülüb), **sonra** `solve.requested`.
Şagird “Təsdiqlə” basıb spinner görür; AI hələ başlamayıb.

Əlavə: crop ekranı açılarkən tam kadr `toBlob` (preview). Shutter→crop açılışı
telefonda ~80 ms idi — əsas ağrı burası deyil; ağrı **Təsdiqlə-dən sonradır**.

**Dəyişiklik səthi.**

- Server: `transcribe/route.ts`, `storage.ts`, `ocr-capture.ts`
- Klient: `CropView.tsx` (raw encode-u paralel və ya fon; UI-ni bloklamamaq),
  lazım olsa `page.tsx` submit sırası

**Məqsəd davranışı.**

1. Transcript JSON mümkün qədər tez (LLM bitən kimi) qayıtsın.
2. Storage/DB cavabdan sonra və ya yüngül id + ağır blob sonra.
3. `capture_id` müqaviləsi pozulmasın.
4. Crop Təsdiqlə → şəbəkə: raw encode UI-ni ~4 san saxlamasın (paralel və ya
   keyfiyyət/ölçü tənzimləməsi).

**Qəbul.**

1. `ocr_captures.latency_ms` sabit (LLM reqressiyası yox).
2. `solve.requested`→`transcript.shown` p50 ≥ **3 san** aşağı (telefon və ya eyni şəbəkə).
3. `crop.confirmed`→`solve.requested` p50 ≥ **2 san** aşağı (encode yolu).
4. Capture sonda mövcuddur; uğursuz Storage yalançı `ok` vermir.

**Geri alma.** Server upload yenidən cavabdan əvvəl; klient encode əvvəlki sıra.

**Risk.** Yarımçıq capture. `ADR-024` retensiya. Raw sübut itməsin (debug üçün lazımdır).

---

### Addım 4 (siyahı 4) — ADR-030 mövzu promptlarını genişləndir

**Problem.** Çox `topic_code` üçün mövzu faylı yoxdur → ümumi `math.md`. Token və
nümunə keyfiyyəti. Telefon fail (sual 83) və soak `unreadable` halları ayrıca
araşdırılmalıdır; mövzu faylı bəzi fail-ləri azalda bilər, hamısını yox.

**Dəyişiklik səthi.** `prompts/solve/math/*.md` · loader `ADR-030` / `prompt.ts`.

**Qəbul.** Mövzu faylı seçilir; prompt qısalır; golden/soak keyfiyyət geriləmir;
`core.md` / `error_code` toxunulmur.

**Geri alma.** Faylı silin.

**Risk.** Zəif nümunə → səhv `error_code`.

---

### Addım 5 (siyahı 5) — Qat 5 axını (streaming)

**Problem.** “Düzdür” düyməsi fon `/finish` promise-ini gözləyir. Tez basılanda
(~1 san sonra) şagird **bütün qalan Qat 5**-i hiss edir (~19 san, telefon cəhd B).
Gec basılanda (cəhd A) ani görünür. Streaming ilk addımı erkən göstərir; divar və
xərc eyni qala bilər.

**Dəyişiklik səthi.** `finish` route · kamera UI · `ADR-017` (`check.accept` serverdə).

**Məqsəd.** İlk tam addım gələn kimi UI; tam sənəd axın sonunda; yoxlama serverdə.

**Qəbul.**

1. Tez “Düzdür” ssenarisində ilk addıma qədər gözləmə bazadan ≥ **8 san** aşağı.
2. Xərc və tam LLM vaxtı əhəmiyyətli dəyişmir.
3. Abort / düzəliş təhlükəsizdir.
4. Yarımçıq JSON göstərilmir.

**Geri alma.** Tək JSON cavab.

**Risk.** Vercel/proxy buffering qazancı silə bilər. Mobil şəbəkədə ölçün.

---

## 4. Paket qəbulu (hamısı bitəndən sonra)

1. Orta uğurlu xərc ≤ **$0.017** (baza ~$0.023–0.026).
2. `solve.requested`→`transcript.shown` p50 ≥ **3 san** aşağı.
3. `crop.confirmed`→`solve.requested` p50 ≥ **2 san** aşağı.
4. Tez-təsdiq ssenarisində ilk addım görünməsi ≥ **8 san** aşağı (streaming).
5. 5/5 transkripsiya qapısı yaşıl; `ocr_captures.latency_ms` reqressiya etmir.
6. `error_code` enum və Qat 5 düşünmə büdcəsi dəyişməyib.

---

## 5. Ölçü protokolu

Hər addım üçün **eyni üç siqnal** (deploy sonrası birbaşa props; köhnə run-lar üçün
`ts_client` fərqi ehtiyatdır):

1. **LLM:** `ocr_captures.latency_ms` və ya hadisə `llm_ms` / `meta.latency_ms` (Qat 1);
   finish `layer_latency_ms` / `solve.response.latency_ms` (Qat 5).
2. **Şagird wall (props):**
   - `encode_ms` — `crop.confirmed` / `solve.requested`
   - `transcribe_wait_ms` — `transcript.shown`
   - `finish_wait_ms` — `solve.response` | `solve.failed`
3. **Server I/O:** `storage_ms`, `db_ms`, `route_total_ms` (`transcript.shown` və ya
   `/transcribe` `meta`).
4. **Nəticə:** `match_path`, `status`, `attempt_items.delivered`; fail-də
   `solve.failed.cost_usd` / `solve.cascade.persist_ok`.

Invite: sabit soak və ya şagird. Nəticə: `tmp/.../safe-pack-step-N.json` + HANDOFF.

Telefon smoke (n=1–2) paket qəbulunu əvəz etmir, amma I/O addımından sonra **məcburi**
yoxlamadır (encode yalnız real cihazda görünür).

### 5.1 Diagnostika SQL (telefon / production)

```sql
-- Son cəhdin latensiya props-ları
select name, ts_client, props
from public.events
where attempt_id = '<uuid>'
  and name in (
    'crop.confirmed','solve.requested','transcript.shown',
    'transcript.confirmed','solve.response','solve.failed','solve.cascade'
  )
order by ts_client;
```

---

## 6. Bilərəkdən kənar (sonraki paket)

| Təklif | Səbəb |
|---|---|
| Qat 5 `reasoning_effort: low` | `error_code` / addım riski |
| flash-lite marşrutu | `ADR-025` |
| Offline DİM bank bişirmə | Struktur; ən böyük qazanc |
| sympy-əvvəl (Qat 4) | `ADR-021` |
| `unreadable` repair + fail xərcinin telemetriyası | Təhlükəsiz; paketə **3.5** kimi əlavə oluna bilər (telefon cəhd B) |

---

## 7. İstinad ölçüləri (mənbə)

- HANDOFF 150–152 (canary, 5/5, batch-30)
- `tmp/corpus/ix-riyaziyyat-2009/gate-5/summary.json`, `batch-30/batch.json`
- Telefon funnel 2026-08-17: device `cd6b932c-…`, cəhdlər `836a2b9a-…` (ok),
  `a49da4ad-…` (unreadable); `ocr_captures` LLM ~1930 / ~1966 ms
- Bu sənədin §0 (ölçü dərsləri)

---

## 8. Qısa xülasə

```
3 (Qat 1 thinking off — kiçik qazanc)
 → 2 (context cache — xərc)
 → 1 (defer Storage/DB + client encode — qavranılan latensiya)
 → 4 (topic prompts)
 → 5 (stream first step — tez “Düzdür” ağrısı)
```

**Əsas düzəliş.** Latensiya problemi əsasən “yavaş AI Qat 1” deyil: **klient encode**,
**server I/O**, və **tez təsdiqdə Qat 5 gözləməsi**. Xərc problemi hələ **Qat 5
tokenləridir**. Paket hər ikisinə toxunur; gözləntiləri bu parçalanmaya görə qoyun.
