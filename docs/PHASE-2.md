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
- Qızıl qayda: soak `error_code` xəritəsini zəiflədən qısa yol yoxdur (həmişə düz cavab,
  transkripsiya təsdiqini avtomatik “Düzdür” etmək yalnız **ayrı** metrikadır).
- `ADR-016`: korpus daxilidir, ictimai bank/axtarış yoxdur.
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
ölür; `AUTH_EXPIRED` / `selectorFailures` artımı soak-u dayandırır, Gemini-yə keçmir
(şagird yolu ayrı qalır).

**Timeout.** App-də `/api/solve` və transcribe/finish **45 san** abort edir. ChatGPT
servisinin `REQUEST_TIMEOUT` 150 san-dir. Soak bayrağı olanda abort ≥150 san olmalıdır,
yoxsa növbə boşuna dolar. Uzun solve promptu üçün `attachTextAsFile: true` (100k hədd).

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

### S0 — ADR-029 + soak bayrağı (bloklayıcı)

`app_config`: `soak_provider`, `soak_enabled`. Production şagird yolu toxunulmur.
ChatGPT adapter: `POST /chat` `{ text, image }` → JSON çıxar → mövcud schema check.
429/QUEUE_FULL/TIMEOUT retry. `/health` soak başlamazdan əvvəl.

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

Playwright: təsdiq, addım, bilərəkdən səhv cavab (distraktor və ya skript), son addımda
reveal. Həmişə-düz rejim yalnız transkripsiya dəqiqliyi üçündür, `error_code` üçün deyil.

Sürət: 5/dəq-ə tabe. Növbə 10-u aşma.

**Qəbul:** 30 sual uçdan-uca, hesabat SQL-i üç sorğu qaytarır (həcm, `match_path`,
`error_code` null nisbəti).

### S4 — 100+ soak və analiz

Qapı: 100 delivered. Ayrı: `has_figure` alt-nümunə (`ADR-025`). `transcript.corrected`
soak-da adətən 0-dır (avtomatik təsdiq) — onu insan nümunəsi ilə qarışdırma.

**Qəbul:** HANDOFF-a cədvəl: n, match_path, refusal, xəta kodu doluluğu, qrafik n.

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

## Bloklar (qərar tələb edir)

1. Soak ChatGPT keyfiyyəti Gemini-dən zəif olsa: soak-u dayandır, yoxsa Gemini ilə
   kiçik n-də bahalı etibarlı ölçü saxla?
2. ChatGPT ToS / cookie ömrü — sahibin əməliyyat riski (`ADR-016` eyni model).
3. Avtomatik “Düzdür” transkripsiya metrikasını korlayır — ayrı n insan təsdiqi qalsınmı?
