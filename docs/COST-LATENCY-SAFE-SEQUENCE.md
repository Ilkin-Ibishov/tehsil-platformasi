# Təhlükəsiz paket — xərc və latensiya ardıcıllığı (3 → 2 → 1 → 4 → 5)

**Status:** İcra planı (qəbul gözləyir)
**Tarix:** 2026-08-17
**Rejim:** How-to (iş ardıcıllığı) + qısa kontekst
**Toxunur:** `web/lib/llm.ts` · `web/app/api/solve/transcribe` · `web/lib/storage.ts` ·
`web/lib/cascade/ocr-capture.ts` · `prompts/solve/math/` · `ADR-017` · `ADR-020` ·
`ADR-024` · `ADR-030` · kamera klienti (`web/app/.../kamera`)
**Sahə xaricində:** Qat 5 `reasoning_effort` endirmək · flash-lite marşrutu · offline
kitab bişirmə · sympy-əvvəl · ChatGPT/Railway soak

Bu sənəd **təhlükəsiz** (qızıl qaydaya və `error_code` taksonomiyasına bilərəkdən
toxunmayan) beş dəyişikliyi **sabit ardıcıllıqla** icra etmək üçündür.

Orijinal nömrələmə (təklif siyahısı) saxlanılır. İcra sırası fərqlidir:

| İcra # | Siyahı # | Ad |
|---|---|---|
| 1 | **3** | Qat 1 düşünməni söndür |
| 2 | **2** | Gemini kontekst keşi |
| 3 | **1** | Storage və DB yazısını kritik yoldan çıxar |
| 4 | **4** | ADR-030 mövzu promptlarını genişləndir |
| 5 | **5** | Qat 5 cavabını axınla (streaming) ver |

**Niyə bu sıra.** Əvvəl ucuz, tərsinə çevrilməsi asan LLM bayrağı (3). Sonra giriş
qiymətini kəsən keş (2). Sonra I/O yenidən qurulması (1). Sonra məzmun işi (4).
Axırda müştəri müqaviləsi dəyişən streaming (5), çünki o digər addımların ölçüsünü
bulandırmasın.

---

## 1. Məqsəd

DİM skan sualı üçün ölçülmüş baza (2026-08-16/17 korpus soak, n≈13–18 uğurlu):

| Metrik | Baza | Paket hədəfi (təxmini) |
|---|---|---|
| Uğurlu həll xərci | ~$0.0233 | ~$0.015–0.016 (−~30%) |
| Çatdırılan həll (fail daxil) | ~$0.027 | eyni istiqamətdə enmə |
| Server divar saatı (transcribe+finish) | ~25–26 san | ~21–23 san LLM/I/O; streaming ilə **qavranılan** ~11–13 san |
| Qat 1 HTTP | ~8–9 san | ~4–6 san (addım 1+3) |
| Qat 5 HTTP | ~16–18 san | eyni divar; ilk addım daha tez görünür (addım 5) |

Paket **dəqiqliyi bilərəkdən güzəştə getmir.** Qat 5 düşünmə büdcəsini endirmək bu
sənəddə yoxdur.

---

## 2. İlkin şərtlər

1. Production soak Gemini yolundadır (`soak_provider=gemini`, `ADR-029` / `ADR-030`).
2. PHASE-2 5/5 transkripsiya qapısı keçib (HANDOFF 151).
3. Hər addımdan sonra ölçünü **eyni üsulla** təkrarlayın: eyni invite, eyni 5–10 kəsik,
   `events` / `attempt_items.cost_usd` / HTTP wall clock.
4. `error_code` enum və `docs/STEP-SCHEMA.json` dəyişmir.

---

## 3. Ardıcıllıq

Aşağıdakı addımları **bir-bir** bağlayın. Növbəti addıma keçməzdən əvvəl həmin
addımın qəbul şərtlərini keçin. Bir addım fail olsa, onu geri alın; paketin qalanına
keçməyin.

---

### Addım 1 (siyahı 3) — Qat 1 düşünməni söndür

**Problem.** Transkripsiya OCR + təsnifatdır. Model ~450 düşünmə tokeni yandırır.
Bu, xərcə və Qat 1 latensiyasına əlavə olunur. `error_code` Qat 5-dədir.

**Dəyişiklik səthi.**

- `web/lib/llm.ts` (və ya Qat 1 çağırış yeri): provayderə uyğun
  `thinking_budget: 0` / `reasoning_effort: "none"` yalnız **transcribe** yolunda.
- Qat 5 çağırışına toxunmayın.

**Qəbul.**

1. 5/5 transkripsiya qapısı (etiketlər 1, 11, 21, 31, 41 və ya eyni müxtəliflik)
   yenidən `status=ok` və vizual uyğun qalır.
2. Qat 1 orta xərc ~$0.0044-dən enir (gözlənti ~−$0.0015…0.002).
3. `topic_code` paylanması bariz dağılmır (əllə 5 nümunə kifayətdir).

**Geri alma.** Bayrağı silin və ya yalnız Qat 5-ə tətbiq olunmayan əvvəlki davranışı
bərpa edin.

**Risk.** `topic_code` səhv ola bilər → səhv mövzu faylı (addım 4) seçilər. Qapı bunu
tutmalıdır.

---

### Addım 2 (siyahı 2) — Gemini kontekst keşi

**Problem.** Qat 5 system promptu (~5k token) sorğudan sorğuya eynidir. Hər dəfə tam
giriş qiyməti ödənilir. `normalizeUsage` artıq `cached_content_token_count` /
`prompt_tokens_details.cached_tokens` oxuyur; keş **aktiv deyil**.

**Dəyişiklik səthi.**

- `web/lib/llm.ts`: Gemini / OpenAI-uyğun endpoint-də kontekst keşi (explicit cache
  və ya provayderin dəstəklədiyi implicit cache) Qat 5 system mesajı üçün.
- Telemetriya: keş hit olduqda `cost_usd` və usage sahələrində görünməlidir.

**Qəbul.**

1. İsti sorğularda `cached_tokens` və ya `cached_content_token_count` > 0.
2. Qat 5 giriş xərci soyuq sorğuya nisbətən enir (gözlənti girişin ~75%-i endirim,
   paketdə ~−$0.003).
3. JSON sxem / addım keyfiyyəti dəyişmir (eyni prompt baytı).

**Geri alma.** Keş yaratma / bağlama kodunu söndürün; çağırış əvvəlki kimi tam prompt
göndərsin.

**Risk.** Keş TTL və ya model dəyişəndə stale prompt. Keş açarını `active_model` +
prompt hash ilə bağlayın.

---

### Addım 3 (siyahı 1) — Storage və DB-ni kritik yoldan çıxar

**Problem.** Qat 1 LLM ~4 san çəkir. `/api/solve/transcribe` HTTP ~8–9 san çəkir.
Fərqin böyük hissəsi: `uploadCaptureImages` (crop + raw PUT), pHash, keş RPC,
`ocr_captures` insert — cavabdan **əvvəl** (`ADR-024`, transcribe route).

**Dəyişiklik səthi.**

- `web/app/api/solve/transcribe/route.ts`
- `web/lib/storage.ts`
- `web/lib/cascade/ocr-capture.ts`

**Məqsəd davranışı.**

1. LLM + transcript cavabını mümkün qədər tez qaytarın.
2. Storage və ağır persist-i cavabdan sonra (və ya `/finish` ilə əlaqələndirilmiş
   yolda) tamamlayın.
3. Klientin `/finish` üçün lazım olan `capture_id` müqaviləsini pozmayın. Əgər
   `capture_id` cavabda qalmalıdırsa, yüngül DB sətri əvvəl, blob-lar sonra ola bilər.
   Müqaviləni dəyişməzdən əvvəl klient oxuyun.

**Qəbul.**

1. Eyni şəkil ilə `/transcribe` wall clock ~−2.5…5 san (LLM vaxtı sabit qalmalıdır).
2. Capture faylları və `ocr_captures` sətri sonda mövcuddur (async tamamlanma
   pəncərəsi sənədləşdirilmiş timeout içində).
3. Uğursuz Storage şagirdə yalançı `ok` vermir. Xəta yolu aydın qalır.

**Geri alma.** Upload və write-i yenidən cavabdan əvvəl sıralayın.

**Risk.** Yarımçıq capture + uğurlu transcript. Finalize və retry siyasətini əvvəldən
yazın. `ADR-024` retensiya gözləntisini pozmayın.

---

### Addım 4 (siyahı 4) — ADR-030 mövzu promptlarını genişləndir

**Problem.** Soak partiyasında çox `topic_code` üçün `prompts/solve/math/{TOPIC}.md`
yoxdur. Qat 5 ümumi `math.md` nümunəsinə düşür (~18k simvol system). Dar mövzu faylı
promptu kiçildir və `error_code` nümunəsini yaxşılaşdıra bilər.

**Dəyişiklik səthi.**

- `prompts/solve/math/*.md` (əskik mövzular; soak-da görünənlər prioritetdir, məs.
  `ALG.FUNCTION_RANGE`, `ALG.SEQUENCES`, `ALG.RADICALS`, `GEO.TRIANGLE_ANGLES`, …)
- Loader artıq `ADR-030` / `web/lib/prompt.ts` üzərindədir. Yeni marşrut yazmayın.

**Qəbul.**

1. Hədəf `topic_code` üçün fayl var; Qat 5 log / selftest mövzu faylını seçir.
2. System prompt uzunluğu ümumi `math.md` fallback-indən qısadır.
3. Golden və ya kiçik soak: sxem 100%, cavab keyfiyyəti geriləmir.
4. `core.md` və `error_code` enum toxunulmur.

**Geri alma.** Faylı silin; loader yenidən `math.md`-ə düşür.

**Risk.** Zəif nümunə səhv `error_code` öyrədə bilər. Nümunəni `STEP-SCHEMA` ilə
uyğun saxlayın.

---

### Addım 5 (siyahı 5) — Qat 5 axını (streaming)

**Problem.** Şagirdə işə başlamaq üçün bütün addımlar yox, **birinci addım** lazımdır.
Hazırda `/finish` tam JSON gözlədir. Divar saatı və xərc eyni qala bilər; **qavranılan**
gözləmə qısalır.

**Dəyişiklik səthi.**

- `web/app/api/solve/finish/route.ts` (və ya cascade solve-text çıxışı)
- Kamera / həll UI istehlakçısı
- `ADR-017` (`check.accept` serverdə qalır; cavab izolyasiyası pozulmur)

**Məqsəd davranışı.**

1. Server NDJSON və ya SSE ilə addımları sırayla göndərir.
2. UI ilk tam addımı alır almaz göstərir.
3. Tam sənəd (bütün addımlar + meta) axın sonunda təsdiqlənir.
4. `check.accept` və yoxlama serverdə qalır.

**Qəbul.**

1. Qavranılan “təsdiq → addım 1” ~18 san-dən ~5–6 san-ə enir (eyni şəbəkə şəraitində).
2. Xərc və tam LLM divar saatı əhəmiyyətli dəyişmir (streaming özü tokeni azaltmır).
3. Abort / transcript düzəlişi əvvəlki kimi təhlükəsizdir.
4. Sxem pozulmuş axın şagirdə yarımçıq səhv JSON göstərmir.

**Geri alma.** `/finish` yenidən tək JSON cavabına qayıdır; köhnə klient uyğunluğu
saxlanılır və ya versiya bayrağı ilə.

**Risk.** Next.js / Vercel proxy buffering. Əvvəl staging-də real mobile şəbəkədə ölçün.
Bufərləmə qavranılan qazancı silə bilər.

---

## 4. Paket qəbulu (hamısı bitəndən sonra)

1. Eyni DİM kəsik dəstində orta uğurlu xərc ≤ **$0.017** (baza $0.0233-ə görə).
2. `/transcribe` p50 wall clock bazadan ≥ **2.5 san** aşağı.
3. Şagird yolunda təsdiqdən sonra ilk addımın görünməsi bazadan ≥ **8 san** aşağı
   (streaming işləyəndə).
4. 5/5 transkripsiya qapısı yaşıl qalır.
5. `error_code` enum və Qat 5 düşünmə büdcəsi dəyişməyib.

---

## 5. Ölçü protokolu

Hər addım üçün eyni skript/qeyd:

1. Invite: `soak-dim-01` (və ya sabit soak invite).
2. Kəsiklər: ən azı gate-5 dəsti + 5 əlavə uğurlu label.
3. Yazın: `transcribe_ms`, `finish_ms`, `cost_usd` (Qat 1 + Qat 5), `match_path`,
   `status`, model adı.
4. Nəticəni `tmp/corpus/.../safe-pack-step-N.json` kimi saxlayın (gitignore altında).
5. HANDOFF-a bir blok: addım nömrəsi, delta xərc, delta san, qapı keç/fail.

---

## 6. Bilərəkdən kənar (sonraki paket)

Bu ardıcıllığa **daxil etməyin** (ayrı qapı və ADR lazımdır):

| Təklif | Səbəb |
|---|---|
| Qat 5 `reasoning_effort: low` | Birbaşa `error_code` / addım bölgüsü riski |
| flash-lite marşrutu | `ADR-025` qrafik reqressiyası |
| Offline DİM bank bişirmə | Struktur layihə; ən böyük qazanc, ayrı plan |
| sympy-əvvəl (Qat 4) | `ADR-021` / infra |
| `unreadable` repair prompt | Təhlükəsizdir, amma bu beşlikdən ayrı; istəsəniz addım 3.5 kimi əlavə edin |

---

## 7. İstinad ölçüləri (mənbə)

- HANDOFF 150–152 (canary, 5/5 qapı, batch-30 15/18)
- `tmp/corpus/ix-riyaziyyat-2009/gate-5/summary.json`
- `tmp/corpus/ix-riyaziyyat-2009/batch-30/batch.json`
- E2E parçalanma (2026-08-17): Qat 1 ~$0.0044 · Qat 5 ~$0.019 · cəmi ~$0.0233;
  divar ~25.6 san; xərcin ~64%-i Qat 5 çıxış+düşünmə

---

## 8. Qısa xülasə

```
3 (Qat 1 thinking off)
 → 2 (context cache)
 → 1 (defer Storage/DB)
 → 4 (topic prompt files)
 → 5 (stream first step)
```

Hər addım: kiçik diff → ölçü → qəbul → HANDOFF. Paket bitəndə təhlükəsiz ~30% xərc
və ~yarım qavranılan gözləmə hədəflənir. Daha böyük qazanc üçün ayrıca “kitabı bişir”
planı yazın.
