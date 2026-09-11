---
name: backend-developer
description: >-
  Specialized backend engineering for Təhsil Platforması: Next.js App Router API endpoints, Supabase Postgres & RLS, LLM cascade pipelines (Qat 0..5), NDJSON streaming, SymPy verification, model fallback orchestration, and self-healing telemetry. Use when implementing or refactoring backend routes, database interactions, streaming pipelines, third-party API integrations, or diagnosing live LLM latency/errors with PostHog traces and Sentry.
---

# Backend Developer & Pipeline Engineer

Architectural guide and execution runbook for the server-side infrastructure, database contracts, streaming protocols, and LLM orchestration layers of Təhsil Platforması.

---

## 1. System Map & Hot Paths

| Funksionallıq | Əsas Fayl | İcra Rejimi |
|---|---|---|
| **Solve Entry (Monolit / Kaskad)** | `web/app/api/solve/route.ts` | Request-Response POST |
| **Solve Finish (Streaming)** | `web/app/api/solve/finish/route.ts` | NDJSON Text-Stream |
| **Kaskad Koordinatoru** | `web/lib/cascade/run.ts` | Qat 0..5 orkestrasiyası |
| **Qat 1 (Transcribe OCR)** | `web/lib/cascade/transcribe.ts` | Vision LLM kanonikləşdirmə |
| **Qat 3 (DİM Şablon Mühərriki)**| `web/lib/cascade/template.ts` | Deterministik Regex / Math |
| **Qat 5 (Mətn LLM)** | `web/lib/cascade/solve-text.ts` | STEP-SCHEMA strukturlaşdırılmış çıxış |
| **DB Persist & Telemetriya** | `web/lib/cascade/persist.ts` | Supabase Postgres yazılışı |
| **Model Registry & Fallback** | `web/lib/llm.ts`, `web/lib/models.ts` | 503 ardıcıl keçid mexanizmi |
| **SymPy Riyazi Yoxlama** | `web/lib/verify/sympy.ts` | 3-hallı simvolik bərabərlik |
| **LLM Müşahidəsi (Observability)**| `web/lib/posthog-server.ts` | Server-side `$ai_generation` tracking |
| **Xəta Mühafizəsi (Sentry)** | `web/instrumentation.ts` | Next.js 15+ server crash tutucusu |

---

## 2. Kaskad Memarlığı (Layers 0 to 5)

Hər həll sorğusu ən ucuz və sürətli qatdan başlayaraq emal olunur:

```
[İstifadəçi Şəkli]
       │
       ▼
┌──────────────────┐  Hit
│ Qat 0: Keş       │ ──────► [Mövcud Həll] (0 san, $0.00)
└──────────────────┘
       │ Miss
       ▼
┌──────────────────┐
│ Qat 1: Transcribe│ ──────► Kanonik Mətn (OCR)
└──────────────────┘
       │
       ▼
┌──────────────────┐  Hit
│ Qat 2: Hash Keş  │ ──────► [Keşlənmiş Həll] ($0.0005)
└──────────────────┘
       │ Miss
       ▼
┌──────────────────┐  Hit
│ Qat 3: Şablon    │ ──────► [Deterministik DİM Həlli] (0 san, $0.0005)
└──────────────────┘
       │ Miss
       ▼
┌──────────────────┐
│ Qat 5: Mətn LLM  │ ──────► [STEP-SCHEMA v2 Həlli] (~$0.008)
└──────────────────┘
```

> **Vacib**: Qat 4 (Embedding) hazırda kodda aktiv DEYİL. Qat 3-də uyğunluq olmadıqda birbaşa Qat 5-ə keçir.

---

## 3. Canlı LLM Diaqnostikası (PostHog Traces & Sentry)

Gecikmə və ya xətaları araşdırarkən lokal fərziyyələr yerinə real alətləri sorğulayın:

### A. PostHog AI İzləmə (`posthog:exec`)
- `query-llm-traces-list`: Son LLM zənglərinin siyahısını, latency və xərclərini çıxarın.
- `query-llm-trace`: Tək bir zəngin daxili detallarına (model, prompt token sayı, output token sayı, keş olub-olmaması) baxın.
- Yoxlayın:
  - `$ai_latency > 10s` olan zənglər hansı modellə baş verib?
  - `$ai_fallback_used = true` hansı saatlarda sıxlaşıb (Google 503 dalğaları)?
  - `$ai_cache_hit = true` nisbəti gözlənilən səviyyədədirmi?

### B. Sentry API Profilinqi
- Next.js 15+ server marşrutlarında (`/api/solve`, `/api/solve/finish`, `/api/reports`) baş verən unhandled rejection-ları və 500 statuslarını yoxlayın.
- Hər xətada `device_id` teqi üzrə Supabase `attempt_items` cədvəlindəki həmin cəhdi tapıb root-cause təhlili aparın.

---

## 4. Model Registry & 503 Fallback Mexanizmi

- **Aktiv Model İerarxiyası**:
  1. `public.app_config.active_model` (DB-dən oxunur, redeploy tələb etmir).
  2. `GEMINI_MODEL` mühit dəyişəni (əgər DB konfiqi yoxdursa).
  3. Registry default (`web/lib/models.ts`).
- **Resilience (Dayanıqlıq)**:
  - 2 ardıcıl 503 (və ya rate-limit) xətası zamanı `pickFallbackModel()` avtomatik olaraq reyestrdə növbəti modelə keçir (`web/lib/llm.ts`).
  - Hər fallback zamanı PostHog `$ai_generation` hadisəsində `fallbackUsed: true` qeydə alınır.
  - Telemetriyaya `model`, `fallback_used`, `fallback_from` hadisə xüsusiyyətləri göndərilir.

---

## 5. Verilənlər Bazası & Miqrasiya Qanunları

1. **Expand-Contract Qaydası**: Əvvəl əlavə et (additive), köhnə deploy üçün uyğunluq qoruyucusu saxla, kodu deploy et, yalnız sonra köhnə sütunu/funksiyanı sil.
2. **Hər Yeni Cədvəldə Məcburi RLS**:
   ```sql
   alter table public.new_table enable row level security;
   create policy "app_runtime_all" on public.new_table
     for all to app_runtime using (true) with check (true);
   ```
3. **Açıq `app_runtime` Qrantları (Implicit Grant Qadağandır)**:
   ```sql
   grant select, insert, update on public.new_table to app_runtime;
   grant execute on function public.my_func to app_runtime;
   grant usage, select on sequence public.new_table_id_seq to app_runtime;
   ```
4. **Şagird Axınında Öz-Özünü Sağaldan Sxem (Self-Healing)**: Naməlum `topic_code` və ya `error_code` gələrsə, sərt FK ilə 500 atmayın; triggerlər `active=false, needs_review=true` ilə qeydə almalıdır.
5. **Cavabların Təcrid Edilməsi (ADR-017)**: Düzgün cavablar və addım həlləri `private` sxemində saxlanılır. `app_runtime` birbaşa `private.*` oxuya bilməz.

---

## 6. SymPy Riyazi Doğrulama (Three-State Status)

Doğrulama üç qiymətlidir və DB ilə tam eyni olmalıdır:
- `true`: Riyazi bərabərlik sübut edildi (SymPy təsdiqlədi).
- `false`: Həll yanlışdır (həll şagirddən gizlədilir).
- `null`: Avtomatlaşdırılmış yoxlama aparılmadı (həll göstərilir, lakin "yoxlanılmadı" nişanı ilə).

> **Kritik Qayda**: `method='none'` olduqda müştəriyə və ya DB-yə əsla `verified: true` göndərilməməlidir (CLAUDE.md Dərs 7).

---

## 7. Backend İnkişaf Yoxlama Siyahısı (Checklist)

- [ ] API endpoint-i `next-intl` üçün uyğun i18n xəta strukturu qaytarır.
- [ ] Yeni SQL obyektləri üçün `grant ... to app_runtime` yazılıb.
- [ ] `web/lib/llm.ts`-də `trackAIGeneration()` çağırışı qorunur.
- [ ] Next.js API marşrutlarında `NextRequest`, `NextResponse` `next/server`-dən idxal olunub.
- [ ] Type check keçir: `cd web && npx tsc --noEmit`.
- [ ] Testlər keçir: `node scripts/preflight.mjs`.
