# FAZA 2 — Korpus soak

> Faza 1 şaquli dilimi canlıdır (`docs/PHASE-1.md`). Bu sənəd növbəti fazadır.
> `CLAUDE.md` → `HANDOFF.md` → **bura**. Kod `main`-də, miqrasiya tətbiq olunmadan merge yoxdur.

## Bir abzas

Faza 1 20 real şagirdin əlini gözləyir. Bu faza həmin əli **əvəz etmir** — ölçməni
**avtomatlaşdırır**. DİM test toplusunun PDF-indən suallar əvvəlcədən kəsilir, Supabase-ə
yazılır, app kameranı atlayıb şəkil yükləyir, eyni şagird axını (təsdiq → addımlar →
`error_code`) yüzlərlə dəfə işləyir, nəticə SQL-lə oxunur.

**Çıxış:** etibarlı, təkrarlanan, ucuz korpus datası. Gözəl UI deyil.

**Qapı (bu faza):** 100+ `delivered` həll **app vasitəsilə** (kamera yox, yükləmə bəli) ·
`error_code` doluluğu və `transcript.corrected` / `refusal.shown` / `match_path` paylanması
ölçülür · qrafikli alt-nümunə `ADR-025` üçün ayrıca sayılır. 20 şagirdin 7 günlük qayıdışı
**bu fazanın qapısı deyil** — o, hələ insan qapısıdır.

## Nəyi dəyişmirik

- Şagird production yolu Gemini kaskadında qalır (`active_model` / `active_transcribe_model`).
- Qızıl qayda: soak `error_code` xəritəsini zəiflədən qısa yol yoxdur (həmişə düz cavab
  yalnız transkripsiya dəqiqliyi üçündür, addım səhvləri skriptlə verilir).
- `ADR-016` / `ADR-029`: korpus daxilidir; ChatGPT cookie/ToS riski sahibindir.
- DİM PDF və kəsiklər git-ə düşmür.

## İki xərc, iki qayda

### 1. Cursor tokeni — PDF-dən kəsim

Agent səhifə şəkillərini chat-ə yükləyib “bunu kəs” demir. Kəsim **lokal skriptdir**,
LLM yox.

```
PDF → (poppler/pdf2image) səhifə PNG
    → layout heuristika (boşluq, nömrə, kontur) → bbox JSON
    → Pillow crop → fayl
    → Supabase Storage (yeni private bucket) + sətir
```

Cursor yalnız: skripti işə salır, **nümunə** kəsiklərə baxır (məs. hər 20-dən 1),
bbox JSON-u oxuyur. Tam səhifəni vision-a vermək qadağandır.

Bbox tapılmayanda ehtiyat: səhifəni **bir** ucuz çağırışla yalnız
`[{label, x, y, w, h}]` JSON-u üçün oxumaq. Həll yox, mətn yox.

### 2. App LLM xərci — soak provayderi

Ilkin-in Railway ChatGPT avtomat servisi (`Cloud_Server_AI`, `POST /chat`) Gemini-ni
**soak üçün** əvəz edir. Şagird production-u əvəz etmir.

Bu, OpenAI-uyğun endpoint deyil. `web/lib/llm.ts`-ə birbaşa `base_url` yapışdırmaq
işləməz. Adapter + `ADR-029` lazımdır.

| Məhdudiyyət | Rəqəm | Nəticə |
|---|---|---|
| Rate | 5 sorğu / 60 san | Kaskad 2 çağırışdır → ~2.5 həll/dəq. 100 həll ≥ 40 dəq |
| Növbə | max 10 | Paralel Playwright bunu aşır |
| Timeout | 150 san | `/api/solve` abort-u (~45 san) **uzadılmalıdır** soak-da |
| Cavab | `{ response: string }` | `json_object` yoxdur — hashtag/hasar təmizlə, STEP-SCHEMA validate et |
| Auth | cookie, müddəti bitir | `/health` `authMode` + `selectorFailures` izlə |

`cost_usd` bu provayderdə 0 yazılmır (tavanı yalan edər). `null` və ya
`method='soak'` ilə ayrı saxla. Gündəlik Gemini tavanı soak sorğularına şamil olunmur.

**Açarlar Tehsil repo-ya düşmür.** `SOAK_LLM_BASE_URL` + `SOAK_LLM_API_KEY` yalnız
server/env. Sənəddəki nümunə açarları bura köçürmə.

**Cookie məcburidir.** Guest rejimində sessiyada 3 şəkil limiti var — 100 həll üçün
yararsızdır. Soak başlamazdan əvvəl `/health` → `authMode=cookie`. Cookie 30–90 gündə
ölür; `AUTH_EXPIRED` / `selectorFailures` artımı soak-u dayandırır, şagird Gemini-yə
keçmir. ToS/cookie riski sahibindir (`ADR-029`).

**Timeout.** App-də `/api/solve` və transcribe/finish **45 san** abort edir. ChatGPT
servisinin `REQUEST_TIMEOUT` 150 san-dir. Soak bayrağı olanda abort ≥150 san olmalıdır,
yoxsa növbə boşuna dolar. `attachTextAsFile: true` yalnız şəkil yoxdursa (Qat 5,
~22k `core.md`). Qat 1 şəkil + typed prompt göndərir — eyni mesajda `.txt`
ChatGPT composer-də şəkil thumbnail-ini əvəz edir (2026-08-16). Hər `POST /chat`
Temporary chat açır (`?temporary-chat=true`) — adi New chat Memory/tarixdən
sızır; `page.goto(chatgpt.com)` isə son söhbəti bərpa edir və ya account picker
açır.

**Sürət seçimi.** Kaskad 2 LLM çağırışıdır. Soak-da iki variant:
1. Eyni kaskad (dürüst latensiya/keyfiyyət, yavaş: ~2.5 həll/dəq)
2. Tək vision+həll çağırışı (həcm üçün; `match_path` ayrıca etiketlənir, production
   kaskadı ilə qarışdırılmır)

Paralel Playwright növbə 10-u aşmamalıdır — bir worker, 5/dəq ritm.

## Memarlıq

```
DİM PDF (lokal, git-də yox)
   ↓  scripts/corpus/pdf_to_crops.py   ← Cursor vision YOX
private.corpus_stems + Storage bucket `corpus`
   ↓
Playwright soak (invite → qalereya yüklə → kəsmə təsdiqi → transkripsiya → addımlar)
   ↓  app eyni API-lər: /api/solve/transcribe + /finish və ya monolit
app_config.soak_provider = chatgpt_web | gemini
   ↓
events + attempt_items + ocr_captures  (kind='corpus_soak' və ya student_ref=soak-*)
   ↓
SQL hesabat: match_path, error_code doluluğu, refusal, qrafik alt-nümunə
```

Qalereya yükləmə artıq var (`CaptureView` `accept="image/*"`). Yeni UI: kəsilmiş
korpus şəklində kəsmə çərçivəsi tam kadra oturur (bir sual = bir şəkil).

## Sprintlər

Soak-dan **əvvəl** iki canlı-şagird işi. Hər ikisi Faza 2 qapısından asılı deyil;
biri qızıl qaydanı, o biri mənasız addımı kəsir.

### S-pre1 — Addımda ilişmə çıxışı (əvvəl)

ClickUp `86eyn28kn`. Orta addımda növbəti düymə yalnız `status==='correct'` olanda açılır
(`SolveView` `advance` disabled). İpucu eyni səhifədə saxlayır (`openHint`, HANDOFF 111).
«Cavabı göstər» yalnız son addımdadır (86eymrkjn) — orta addımdan finala tullanmaq
qalan `error_code`-ları silirdi.

Şagird ipucundan sonra da `check.ask`-i tapa bilməyəndə səhifədə qalır. Unmount
`abandoned_at_step` yazır, amma sonrakı addımların səhv xəritəsi heç yaranmır.

**Alqoritm (qızıl qayda):** çıxış **bu addımın miss-ini yazır**, final cavabı açmır.

1. Şərt: bu addımda ipucu açıq **və** ≥1 səhv cəhd (ipucu belə yetməyəndə).
2. Aksiyon: «Bu addımı keç» — `step_events`: `is_correct=false`,
   `error_code` = addımın kodu, `given_answer` = son cəhd (yoxdursa boş).
3. Sonra `advance()` / `farthestIndex++`.
4. Son addım dəyişmir: düzgün cavabsız «Cavabı göstər» qalır.
5. Yeni hadisə adı kodda uydurulmur. `step.abandoned` səhifə tərkidir, keçid deyil.
   Cowork `TELEMETRY.md`-ə ad yazandan sonra klient onu atır.

**Qəbul:** orta addımda ipucu+səhvdən sonra keçmək olar; `step_events`-də sətir var;
final cavab açılmır; son addım əvvəlki kimidir.

### S-pre2 — Mənasız addım/izah (kök səbəb, 2026-08-16)

ClickUp `86eyn28kq`. Son əl həll (`attempt_items` 19:55 UTC, sual 27, parabola qrafiki, `match_path=llm`,
`gemini-3.6-flash` + Qat 1 `gemini-3.1-flash-lite`):

1. **Prompt ziddiyyəti.** `core.md` qayda 3 hələ «2–6 addım» deyir; qayda 8/15/16 və
   `STEP-SCHEMA` `minItems:1` 1 addıma icazə verir. Model nümunəyə və qayda 3-ə uyğun
   doldurur. Eyni sinif HANDOFF 108-dən sonra da gəlib: `56+27=?` 2-ci addımı
   «83−27» süni yoxlamadır (qayda 8-in qadağan etdiyi tərs əməl).
2. **Qat 1 qrafiki mətnə çevirib variantları kəsib.** `ocr_raw`: yalnız A və B;
   A = `y=3/2(x-1)(x-3)` (y-kəsişmə 2 ilə uyğun gəlmir). Şagird təsdiqləyib
   (`corrected=false`).
3. **Qat 5 şəkli görmür** (`finish` / `solve-text.ts`, ADR-020). `ADR-014` R1 əksini
   istəyirdi. Həll kəsilmiş mətn üzərində qurulub: addımlar `y=(2/3)(x-1)(x-3)` —
   nə A, nə B. Addım 3 `a`-nı təkrar soruşur; addım 4 eyni yerinəqoymanı yoxlayır
   (dövri, qayda 8).
4. **Keş.** Eyni `canonical_hash` köhnə addımları əbədi saxlayır (`persist.ts`
   ADDIM/CAVAB UYĞUNLUĞU, HANDOFF 109). Prompt düzələndə köhnə qrafik/cəm keşi
   yenilənmir.

**İş:** qayda 3-ü sxemlə eyniləşdir (1–6, mexaniki say qayda 15-dir). Qrafik alt-nümunə
`ADR-025` / S4 soak-dadır — bu sprintdə fizika yox, `has_figure` üçün Qat 5-ə şəkil
qaytarmaq ADR-020 qapısıdır, ölçülmədən edilmir. Keş invalidasiyası ayrıca qərardır
(qızıl qayda: `step_answers` uyğunsuzluğu).

**Qəbul:** qayda 3 ziddiyyəti yoxdur; yeni `5+5`/`56+27` 1 addım; sual 27 tipli keş
sətiri tapşırıqda qeyd olunur, səssizcə üzərinə yazılmır.

### S0 — ADR-029 + soak bayrağı (bloklayıcı)

`ADR-029` qəbul edilib. `app_config`: `soak_provider`, `soak_enabled`. Production
şagird yolu toxunulmur. ChatGPT adapter: `POST /chat` `{ text, image }` → JSON çıxar
→ mövcud schema check. 429/QUEUE_FULL/TIMEOUT retry. `/health` soak başlamazdan əvvəl.

Eyni sprintdə **n=10 Gemini qızıl** yolu ayrı `kind` ilə qalır (həcm ChatGPT-dir).

**Qəbul:** 1 şəkil soak provayderi ilə transcribe+finish, Gemini şagird yolu eyni qalır.

### S1 — PDF → kəsik, token-ucuz

`scripts/corpus/pdf_to_crops.py`. Heuristika birinci. Cursor nümunə QA. Bucket `corpus`
(90 günlük `captures`-dən ayrı, korpus silinmir). Cədvəl: `storage_path`, `pdf_ref`,
`page`, `label`, `bbox`, şəkil hash. DİM mətni sütun yoxdur (mətn lazımdırsa `ADR-016`
üzrə ayrıca qərar).

**Qəbul:** 1 PDF, ≥20 kəsik Storage-da, 5 əl yoxlaması keçib.

### S2 — App: yükləmə soak axını

Kamera icazəsi soak-da məcburi deyil. Playwright `input[type=file]` ilə kəsiyi qoyur.
Invite kodu `soak-*`. `kind` və ya `student_ref` hesabatlarda insan həllindən ayrılır.

**Qəbul:** 3 kəsik production-a yaxın mühitdə yüklənir, `delivered=true` yazılır.

### S3 — Axın avtomatlaşdırılması

**Transkripsiya qapısı (`ADR-029`):** Cursor 5 ChatGPT transkripsiyasını kəsik şəklə
qarşı yoxlayır. 5/5 düzdürsə qalan şəkillər üçün “Düzdür” avtomatikdir. Biri səhvdirsə
avtomatik təsdiq açılmır — həcm o qapını gözləyir.

Playwright: təsdiq (qapıdan sonra avtomatik), addım, bilərəkdən səhv cavab (distraktor
və ya skript), son addımda reveal. Həmişə-düz rejim yalnız transkripsiya dəqiqliyi
üçündür, `error_code` üçün deyil.

Sürət: 5/dəq-ə tabe. Növbə 10-u aşma.

**Qəbul:** 5/5 qapısı HANDOFF-da · 30 sual uçdan-uca · SQL üç sorğu (həcm, `match_path`,
`error_code` null nisbəti).

### S4 — 100+ soak və analiz

Qapı: 100 delivered (ChatGPT). Ayrı: n=10 Gemini qızıl (eyni kəsiklərin alt-nümunəsi).
Ayrı: `has_figure` alt-nümunə (`ADR-025`). `transcript.corrected` soak-da 0 qalır
(avtomatik təsdiq) — insan nümunəsi ilə qarışdırma.

**Qəbul:** HANDOFF-a cədvəl: n ChatGPT, n Gemini qızıl, match_path, refusal, xəta kodu
doluluğu, qrafik n.

## Sahə

| daxil | xaric |
|---|---|
| PDF kəsim skripti, `corpus` bucket | 20 şagird retensiyası |
| Qalereya soak, Playwright | Capacitor, OpenCV-on-Vercel |
| ChatGPT soak adapter | Şagird Gemini-ni söndürmək |
| `kind=corpus_soak` telemetriya ayrımı | Yeni `error_code` enum |
| Qrafik alt-nümunə ölçməsi | Embedding / Qat 4 |

Yeni telemetriya adı lazımdırsa əvvəl `TELEMETRY.md` (Cowork). Namizəd: `soak.run`
yox, mövcud `solve.response` + `student_ref`/`kind` filtri.

## Qərarlar (2026-08-16, `ADR-029`)

1. ChatGPT Gemini-dən zəif olsa soak **dayanmır**. n=10 Gemini qızıl nümunə ayrıca qalır.
2. Cookie / ChatGPT ToS riski **sahibindir**. İcraçı buna görə dayandırmır.
3. Avtomatik “Düzdür”: Cursor 5 ChatGPT transkripsiyasını şəkilə qarşı yoxlayır.
   5/5 keçərsə qalan şəkillər avtomatik təsdiqlənir; keçməzsə həcm açılmır.
   Ayrı davamlı insan təsdiq n-i yoxdur.
