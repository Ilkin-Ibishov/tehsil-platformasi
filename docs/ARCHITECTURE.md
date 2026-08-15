# ARCHITECTURE

> Son yenilənmə: 2026-08-15 (S1–S8 sonrası). Köhnə Texo/klient-OCR versiyası üçün git tarixçəsinə bax.

## Prinsip: keş-əvvəl, LLM-son

LLM son çarədir, birinci addım deyil. Səbəb xərc deyil — **determinizm**. Təsdiqlənmiş həll
hallüsinasiya etmir; minlərlə şagirdə eyni cavab gedir. (Eyni yanaşma: Gauth/ByteDance —
100M+ əvvəlcədən həll olunmuş sual bankı, LLM yalnız uyğunluq tapılmayanda.)

## Kaskad — real boru xətti (`ADR-020`, `ADR-021`)

```
┌─ KLİENT ────────────────────────────────────────────────┐
│  Kamera → dondurulmuş kadr → kəsmə çərçivəsi            │
│  → resize ≤1600px, JPEG q=85  (klientdə OCR YOXDUR)     │
└──────────────────────┬───────────────────────────────────┘
                       │  şəkil (base64) serverə gedir
┌─ SERVER (`web/lib/cascade/`) ────▼───────────────────────┐
│  Qat 0  şəkil sha256 / pHash keşi   → image_cache  0 xərc│
│  Qat 1  transkripsiya (vision LLM)  → canonical mətn     │
│         → təsdiq ekranı (şagird mətni düzəldə bilər)     │
│  Qat 2  canonical_hash bərabər?     → hash        0 xərc │
│         numeric_fingerprint uyğun?  → fingerprint 0 xərc │
│  Qat 3  tənlik şablonu tanınır?     → template    0 xərc │
│         (ALG.LINEAR / QUADRATIC / VIETA)                 │
│  Qat 4  (embedding > 0.90)          → KODDA YOXDUR       │
│  Qat 5  heç biri → vision/mətn LLM  → STEP-SCHEMA JSON   │
│                    ↓                                      │
│         sympy ilə final_answer yoxlanışı                 │
│                    ↓                                      │
│         questions / question_translations / private-ə yaz│
└──────────────────────────────────────────────────────────┘
```

⚠️ **Qat 1-in qrafik oxuması ölçülməyib və HALLÜSİNASİYA verdi** (`ADR-025`, n=1): real DİM
sualında model xəttin istiqamətini VƏ y-kəsişməsinin işarəsini TƏRS oxudu. `ADR-001`-in
dəqiqlik ölçməsi MƏTN sualları üzrədir — `has_figure=true` yolu ayrıca ölçülməlidir.

**Diqqət — sympy real olaraq nadir hallarda işə düşür.** Son 10 canlı həllin 9-u
`verification_method='none'` qayıtdı (S5, `86eymwgkv`): əksər DİM məsələsi tək dəyişənli
tənlik deyil. Klientə `verification.reason` ilə düz vəziyyət göndərilir, cavab gizlədilmir,
"yoxlanılmadı" nişanı göstərilir. `verified=false` (yəni sympy AKTİV ŞƏKİLDƏ təkzib etdi)
hələ də göstərilmir.

## OCR — klientdə deyil, serverdə

~~Texo (ONNX, brauzerdə)~~ **silindi** (`ADR-001` HÖKM, 2026-08-06). Vision LLM tək çağırışda
OCR+həll edir, 9/10 dəqiqlik, 0 hallüsinasiya. Latensiyanın (16.8 san → n=99-da 19.2 san) səbəbi OCR deyil,
modelin thinking rejimidir — Texo onu həll etmirdi, yalnız ikinci bir uğursuzluq nöqtəsi əlavə
edirdi. Tesseract `aze` unicharset-də `Ə/ə` olmadığı üçün onsuz da yararsızdır.

## Stack

| qat | seçim | səbəb |
|---|---|---|
| Frontend | Next.js (App Router) + TS + Tailwind, PWA | mobile-first, tək repo, sürətli deploy |
| Auth / DB / Storage | Supabase | üç xidmət bir yerdə, pgvector daxil |
| DB girişi | `pg` ilə birbaşa Postgres (`app_runtime` rolu) | `@supabase/supabase-js` layihədə YOXDUR — Storage də REST `fetch`-lə (`ADR-024`) |
| Vektor | pgvector (Supabase içində) | **hələ istifadə edilmir** — Qat 4 kodda yoxdur |
| Simvolik yoxlama | sympy | eval və istehsalat eyni məntiqi işlədir |
| LLM | Gemini ailəsi, OpenAI-uyğun endpoint | model adı DB-də: `public.app_config.active_model` (`ADR-023`), qiymət `web/lib/models.ts`-də (`ADR-022`) |
| i18n | `next-intl` | az/ru/en/tr — **birinci gündən**, hardcode qadağan |
| Riyazi render | KaTeX | dizayn faylları artıq KaTeX işlədir |
| Hosting | Vercel (`main` branch-i izləyir) | |

## Qərar verilmiş məhdudiyyətlər

- **Şəkil SAXLANILIR** (`ADR-024`, 2026-08-14 — əvvəlki "saxlanılmır" vədi ləğv edildi).
  Hər çəkiliş üçün İKİ fayl (kəsilmiş + orijinal kadr) PRIVATE `captures` bucket-inə yazılır,
  `ocr_captures.storage_path` ilə bağlanır. Səbəb: real şagird şikayəti şəkilsiz debug
  edilə bilmədi. **Retensiya 90 gün — silmə cron-u HƏLƏ QURULMAYIB** (açıq maddə).
  ⚠️ Dizayn faylları (`Kamera.dc.html`) hələ "Şəkil telefonda qalır" yazır — mətn
  yenilənməlidir, yoxsa istifadəçiyə verilən vəd yalandır.
- **`max-width: 480px`** — masaüstündə də mərkəzləşmiş mobil layout. Ayrıca desktop dizaynı yoxdur.
- **iOS Safari-də web push etibarsızdır** → gündəlik streak bildirişi MVP-də yoxdur.
  Buna görə streak əvəzinə **həftəlik hədəf** mexanikası (bax `PRODUCT.md`).
- **Offline:** şəkil çəkmək offline işləyir, həll işləmir.

## Təhlükəsizlik və məxfilik

- İstifadəçilər əsasən **yetkinlik yaşına çatmayanlardır**. Minimum data topla.
- **Cavab izolyasiyası (`ADR-017`, INV-03):** `app_runtime` `private` sxeminə birbaşa SELECT
  edə bilmir — yalnız `app` sxemindəki RPC-lər vasitəsilə.
- RLS: hər cədvəl öz siyasətini daşıyır; `anon`/`authenticated`-ə heç bir grant verilmir.
- `captures` bucket-i PRIVATE, girişin yeganə yolu server tərəfin `SUPABASE_SERVICE_ROLE_KEY`-idir.
- Valideyn hesabatı **aqreqasiyadır**, xam məsələ mətnləri deyil.
- Şagird valideynin gördüyünün **eynisini** görə bilməlidir (`PRODUCT.md`).
