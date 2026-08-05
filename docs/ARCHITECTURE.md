# ARCHITECTURE

## Prinsip: keş-əvvəl, LLM-son

LLM son çarədir, birinci addım deyil. Səbəb xərc deyil — **determinizm**. Təsdiqlənmiş həll
hallüsinasiya etmir; minlərlə şagirdə eyni cavab gedir. (Eyni yanaşma: Gauth/ByteDance —
100M+ əvvəlcədən həll olunmuş sual bankı, LLM yalnız uyğunluq tapılmayanda.)

```
┌─ KLİENT ────────────────────────────────────────────────┐
│  Kamera → çərçivə ilə kəsmə → resize (client-side)      │
│         ↓                                                │
│  Texo (ONNX / transformers.js)  →  LaTeX namizədi        │
│  ~20M param, brauzerdə, 0 xərc, şəkil telefonu tərk      │
│  etmir. Yalnız `formula` tipli girişdə.                  │
└──────────────────────┬───────────────────────────────────┘
                       │  (yalnız mətn gedir, şəkil YOX*)
┌─ SERVER ─────────────▼───────────────────────────────────┐
│  normalize (sympy) → canonical_hash                      │
│    ├─ hash uyğun          → həll                 <50ms   │
│    ├─ numeric_fingerprint → həll                 <80ms   │
│    ├─ embedding > 0.90    → həll                <200ms   │
│    └─ tapılmadı → Vision LLM → STEP-SCHEMA JSON          │
│                    ↓                                      │
│              sympy ilə final_answer yoxlanışı            │
│                    ↓                                      │
│         verified=true → DB-yə yaz → gələn dəfə pulsuz    │
└──────────────────────────────────────────────────────────┘
```

\* Mətn məsələsində (`word_problem`) Texo işləmir — şəkil vision LLM-ə göndərilir.
Klient bunu qabaqcadan bilmir, ona görə: Texo nəticəsi boş/aşağı etibarlıdırsa → şəkil yolu.

## Niyə Texo, niyə Tesseract yox

| | nəticə |
|---|---|
| **Texo** (20M param, ONNX) | UniMERNet-T səviyyəsində dəqiqlik, 80% kiçik, 7x sürətli, **brauzerdə işləyir** |
| **Tesseract `aze`** | `unicharset`-də **Ə/ə hərfi yoxdur**; praktikada türk traineddata ilə əvəz edilir — etibarsız |
| **Mathpix** | $0.002/sorğu, çox dəqiq — amma server gedişi + xərc, Texo-nun üstünlüyü yoxdur |

Qərar detalları: `decisions/ADR-001-ocr-pipeline.md`. **Faza 0 nəticəsi bu qərarı təsdiqləyə və ya ləğv edə bilər.**

## Stack

| qat | seçim | səbəb |
|---|---|---|
| Frontend | Next.js (App Router) + TS + Tailwind, PWA | mobile-first, tək repo, sürətli deploy |
| Auth / DB / Storage | Supabase | üç xidmət bir yerdə, pgvector daxil |
| Vektor | pgvector (Supabase içində) | ayrıca vektor DB-yə ehtiyac yoxdur |
| Simvolik yoxlama | sympy | Python serverless funksiya |
| OCR (düstur) | Texo ONNX, klientdə | 0 xərc, 0 latensiya, məxfilik |
| LLM | ucuz Flash sinifli vision model | ~$0.002–0.005/həll |
| i18n | `next-intl` | az/ru/en/tr — **birinci gündən**, hardcode qadağan |
| Riyazi render | KaTeX | dizayn faylları artıq KaTeX işlədir |
| Hosting | Vercel | |

## Qərar verilmiş məhdudiyyətlər

- **Şəkil saxlanılmır.** Dizaynda istifadəçiyə verilən vəddir (`"Şəkil telefonda qalır"`).
  Storage-a yalnız istifadəçi açıq şəkildə "sonra bax" seçərsə yazılır, 7 gün sonra silinir.
- **`max-width: 480px`** — masaüstündə də mərkəzləşmiş mobil layout. Ayrıca desktop dizaynı yoxdur.
- **iOS Safari-də web push etibarsızdır** → gündəlik streak bildirişi MVP-də yoxdur.
  Buna görə streak əvəzinə **həftəlik hədəf** mexanikası (bax `PRODUCT.md`).
- **Offline:** şəkil çəkmək offline işləyir, həll işləmir. Kəsilmə halında dizaynda artıq
  "Şəkil telefonda saxlanıldı, internet qayıdanda göndər" vəziyyəti var — həyata keçirilməlidir.

## Təhlükəsizlik və məxfilik

- İstifadəçilər əsasən **yetkinlik yaşına çatmayanlardır**. Minimum data topla.
- RLS: şagird yalnız öz `attempts`/`step_events`-ini görür; valideyn yalnız bağlı şagirdinkini.
- Valideyn hesabatı **aqreqasiyadır**, xam məsələ mətnləri deyil.
- Şagird valideynin gördüyünün **eynisini** görə bilməlidir (`PRODUCT.md` → dizayn edilməmiş siyahı).
  Şəffaflıq olmasa şagird sistemi aldatmağa keçir.
