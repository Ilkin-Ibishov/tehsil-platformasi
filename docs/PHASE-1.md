# FAZA 1 — Şaquli dilim

> Claude Code üçün əsas sənəd. `CLAUDE.md` → `HANDOFF.md` → **bura**.
> Sprintlər ardıcıldır. Hər biri **telefonda işləyən** nəticə ilə bitir və deploy olunur.

## Məqsəd

Qohum şagirdlər real ev tapşırığı ilə istifadə etsin və **hər addım loqlansın**.
Faza 1-in çıxışı gözəl app deyil — **etibarlı data**.

**Qapı:** 15–20 şagird · 100+ real həll · 20 şagirddən **≥8-i 7 gündə ≥3 dəfə qayıdır**

## Sahə daxilində / xaricində

| daxil | xaric |
|---|---|
| Kamera → kəsmə → həll → addımlar | Auth, qeydiyyat |
| İmtina və seçim ekranları | Ödəniş, paywall |
| Telemetriya (`TELEMETRY.md`) | Valideyn hesabatı |
| Transfer məsələsi | Lent, Test, streak |
| Minimal tarixçə (localStorage) | Tab naviqasiyası |
| i18n karkası (`az` aktiv) | ru/en/tr tərcümələr |

**Sahə böyüdü və bunu etiraf edirik.** `PRODUCT.md` Faza 1-i "2–3 həftə" yazmışdı; kəsmə
ekranı, seçim ekranı və telemetriya ondan sonra əlavə olundu (`ADR-007`, `TELEMETRY.md`).
Realistik: **4–5 həftə**. Kəsmə ekranı ixtisar edilə bilməz — real şəkillərin **10/10-u
çoxsualldır**, onsuz tətbiq işləmir.

---

## Memarlıq — Faza 1 üçün minimum

```
Next.js (App Router, TS, Tailwind) · PWA · max-width 480px
   ↓
/api/solve      şəkil → Gemini → STEP-SCHEMA validasiya → sympy → DB
/api/events     telemetriya paketi (upsert)
   ↓
Supabase: events, problems, solutions   (attempts/step_events → view)
   ↓
Vercel
```

**Faza 1-də YOXDUR:** keş uyğunlaşdırması (`match_path` həmişə `llm`), embedding, pgvector.
Sahə `attempts`-də qeyd olunur ki, Faza 2-də keş əlavə olunanda müqayisə mümkün olsun.

---

## API müqaviləsi

### `POST /api/solve`

```jsonc
// Sorğu
{
  "attempt_id": "uuid",        // klientdə yaradılır, telemetriya ilə eyni
  "device_id": "uuid",
  "image_base64": "...",       // KƏSİLMİŞ şəkil, klientdə ≤1600px
  "grade": 11,
  "locale": "az",
  "selected_label": "14"       // opsional — candidates seçimindən sonrakı 2-ci çağırış
}
```

Cavab: **`STEP-SCHEMA.json`-a uyğun obyekt** + server sahələri:

```jsonc
{
  "...": "STEP-SCHEMA sahələri (status, steps, final_answer, candidates, ...)",
  "solution_id": "uuid",
  "match_path": "llm",
  "verification": { "verified": true, "method": "sympy" }
}
```

**Server qaydaları:**
1. **`verified=false` olan həll istifadəçiyə göstərilmir** — `status: unreadable` kimi qaytar.
2. Cavab `STEP-SCHEMA`-ya valid deyilsə → **bir dəfə** təkrar cəhd, yenə olmasa `unreadable`.
   Model xam çıxışı loqlanır (`solve.response.props`-a yox, **server loguna**).
3. Şəkil **saxlanılmır**. Yalnız `image_px`, `image_bytes` metadatası.
4. `selected_label` verilibsə, prompta əlavə olunur: yalnız həmin məsələ həll edilir.

### `POST /api/events`

```jsonc
{ "events": [ { "event_id": "uuid", "name": "...", "ts_client": "...", "props": {} } ] }
```

`event_id` üzrə **upsert**. Təkrar göndəriş dublikat yaratmır. Cavab həmişə `200` —
telemetriya xətası istifadəçiyə çatmamalıdır.

---

## Sprintlər

### S1a — Telemetriya bel sütunu (LOKAL, hesab tələb ETMİR)

Next.js (App Router, TS, Tailwind) + **lokal Postgres**. `events` cədvəli və miqrasiyası
(`DATA-MODEL.md` sxemi — **portativ SQL**, Supabase-ə xas heç nə yoxdur).
Klient telemetriya kitabxanası: IndexedDB növbəsi, paket göndərmə, offline davamlılıq,
idempotentlik. `/api/events` route. Bir ekran, bir hadisə.

**Niyə birinci:** telemetriya sonradan əlavə edilən şey deyil. Birinci commit-dən mövcuddursa,
sonrakı hər funksiya pulsuz loqlanır.

**Qəbul — hamısı LOKAL yoxlanılır, deploy tələb etmir:**
1. `next dev`, telefon eyni Wi-Fi-da, LAN IP ilə açılır → lokal DB-də `app.opened` sətri
2. Təyyarə rejimi → hadisə növbədə qalır → internet qayıdır → **itmir**, gecikməylə gəlir
3. Eyni paket iki dəfə göndərilir → cədvəldə **bir** sətir (upsert)

Postgres lokal olaraq Docker (`postgres:16`) və ya `supabase start` ilə qaldırıla bilər —
hansı əlçatandırsa. **Cloud hesabı lazım deyil.**

### S1b — Deploy (Ilkin hesabları yaradandan sonra)

Supabase layihəsi + Vercel deploy + miqrasiyanın tətbiqi + env dəyişənləri.
**Kod dəyişikliyi minimal olmalıdır** — S1a-da `DATABASE_URL` env dəyişəni ilə işləyirsə,
S1b sadəcə başqa `DATABASE_URL`-dir.

**Qəbul:** telefondan **ictimai URL** açılır → Supabase-də `app.opened` görünür.

**Bloklayır:** S2 və sonrakılar S1b-ni gözləmir — lokal işləməyə davam et.
Yalnız şagirdlərə vermək S1b tələb edir.

### S2 — Kamera → kəsmə

Kamera (`getUserMedia`), çəkiliş, **şəkli dondur**, kəsmə çərçivəsi (sürüşdürülən, defolt
mərkəzdə), klientdə resize ≤1600px, JPEG q=85. Server hələ stub qaytarır.

`design/Kamera.dc.html` struktur və mətn üçün, stillər `DESIGN-TOKENS.json`-dan.

**Qəbul:** telefonda şəkil çəkilir, kəsilir, serverə çatır.
`capture.*` və `crop.*` hadisələri, o cümlədən **`capture.cancelled` / `crop.cancelled`**.

### S3 — Həll API

`/api/solve`. `prompts/solve-step.md` **fayldan oxunur** (hardcode yox — eval harness ilə
eyni prompt işləməlidir). Sxem validasiyası, sympy yoxlaması, `problems`/`solutions`-a yazma.

`scripts/lib/` altındakı `schema_check`, `verify`, `leak` məntiqini TS-ə köçür və ya
Python serverless funksiya kimi saxla — **amma iki fərqli implementasiya olmasın**.
İki nüsxə olarsa, eval və istehsalat fərqli nəticə verməyə başlayacaq.

**Qəbul:** kəsilmiş şəkil → valid həll JSON-u DB-də. `solve.response` hadisəsində
`latency_ms`, `cost_usd`, `tokens_in/out`.

### S4 — Həll ekranı

Məhsulun özü. `design/Həll ekranı v5.dc.html` spesifikasiyadır. Addımlar, `check` girişi,
səhvin adlandırılması, `hint`, `niyə belədir`, simvol izahları, `HƏLL QURULUR` ekranı.

**`HƏLL QURULUR` boş spinner OLMAMALIDIR.** Ölçülmüş latensiya **16.8 saniyədir**
(`ADR-001`). Mərhələli mətn: "şəkil oxunur" → "addımlar qurulur".

**Qəbul:** telefonda tam axın. `step.*` hadisələri, o cümlədən `step.abandoned` və
`solve.waiting_abandoned`.

### S5 — İmtina + seçim

`status != ok` üçün beşinci ekran vəziyyəti (`ADR-006`) və `candidates` seçim ekranı
(`ADR-007`). Geri dönüş **həmişə kəsməyə**, kameraya yox — şəkil klientdə qalır.

**İki məcburi invariant:**
- İmtina, seçim və kəsmə **gündəlik limitdən sayılmır**. Yalnız çatdırılmış həll sayılır.
- Heç bir mərhələdə yeni şəkil istənilmir.

**Qəbul:** çoxsuallı şəkil → seçim → yalnız seçilən həll edilir.
`limit.blocked` hadisəsi `refusal.*`/`candidates.*` ilə **korrelyasiya etmir** (SQL ilə yoxla).

### S6 — Transfer + tarixçə

"Eynisini sən həll et" və minimal tarixçə (localStorage kifayətdir).

**Qəbul:** `transfer.answered` hadisəsi gəlir. Bu, **əsl öyrənmə metrikasıdır** — onsuz
Faza 1 öz sualına cavab vermir.

---

## Təhlükəsizlik — ödənişli açar açıq URL-in arxasındadır

Bu, Faza 1-in ən böyük texniki riskidir və vibe coding zamanı asanlıqla buraxılır.

1. **`API_KEY` yalnız serverdədir.** Next.js-də `NEXT_PUBLIC_` prefiksi olmamalıdır,
   client komponentə **heç vaxt** düşməməlidir. Bir dəfə sızsa, açar dəyişdirilməlidir.
2. **Server tərəfli gündəlik limit.** `device_id` üzrə sərt hədd (Faza 1-də 30).
   Klient yoxlaması qoruma deyil.
3. **Dəvət kodu.** URL ictimaidir. Test qrupu 20 nəfərdir — sadə paylaşılan kod
   `/api/solve`-u qoruyur. Onsuz bir bot bir gecədə büdcəni yandıra bilər.
4. Yüklənən şəkil ölçüsü serverdə də yoxlanılır (klientə güvənmə).

## Məxfilik — istifadəçilər yetkinlik yaşına çatmayıb

- Şəkil **saxlanılmır**. Bu, dizaynda istifadəçiyə verilən vəddir.
- `props`-a şəkil, məsələ mətni, şəxsi data düşmür (`TELEMETRY.md`).
- Üçüncü tərəf analitika SDK-sı yoxdur.
- Şagirdə ilk açılışda bir cümlə: nə toplanır, niyə.

## Faza 1-i bitmiş saymaq üçün

- [ ] 6 sprintin hamısı deploy olunub
- [ ] `TELEMETRY.md`-dəki hadisələrin hamısı real cihazdan gəlir
- [ ] Üç SQL sorğusu işləyir (qapı, funnel, vahid iqtisadiyyat)
- [ ] `limit.blocked` invariantı **datadan** yoxlanılıb
- [ ] 15–20 şagird dəvət edilib
- [ ] `ADR-004` pedaqoji rəy: ilk 30 real həll insan tərəfindən nəzərdən keçirilib
