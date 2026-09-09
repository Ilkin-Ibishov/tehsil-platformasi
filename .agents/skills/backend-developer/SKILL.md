---
name: backend-developer
description: >-
  Specialized backend engineering for Təhsil Platforması: Next.js App Router API endpoints, Supabase Postgres & RLS, LLM cascade pipelines (Qat 0..5), NDJSON streaming, SymPy verification, model fallback orchestration, and self-healing telemetry. Use when implementing or refactoring backend routes, database interactions, streaming pipelines, or third-party API integrations.
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

## 3. İki Əsas API Giriş Nöqtəsi

1. **`/api/solve` (Monolit və ya Standart Kaskad)**:
   - Şəkil qəbul edilir, `captures` private bucket-inə yazılır (ADR-024).
   - Kaskad aktivdirsə (`app_config.cascade_enabled=true`), Qat 1 icra olunur, ardınca Qat 2..5 işləyir.
   - Bütöv JSON nəticə qaytarır.
2. **`/api/solve/finish` (NDJSON Axını - Streaming)**:
   - Müştəri öncə `/api/solve/transcribe` ilə transkript əldə edir.
   - `/api/solve/finish` transkripti qəbul edir və addımları müştəriyə birbaşa stream edir (`onPublicStep`).
   - Kliyent bağlantısı qırıldıqda belə DB persist itkisinin qarşısını almaq üçün `streamPersistencePromise` gözlənilir.

---

## 4. Model Registry & 503 Fallback Mexanizmi

- **Aktiv Model İerarxiyası**:
  1. `public.app_config.active_model` (DB-dən oxunur, redeploy tələb etmir).
  2. `GEMINI_MODEL` mühit dəyişəni (əgər DB konfiqi yoxdursa).
  3. Registry default (`web/lib/models.ts`).
- **Resilience (Dayanıqlıq)**:
  - 2 ardıcıl 503 (və ya rate-limit) xətası zamanı `pickFallbackModel()` avtomatik olaraq reyestrdə növbəti modelə keçir (`web/lib/llm.ts`).
  - Nəticədə `attempt_items.model_used` sahəsinə `{ "qat1": "...", "qat5": "...", "fallbackUsed": true, "fallbackFrom": "..." }` yazılır.
  - Telemetriyaya `model`, `fallback_used`, `fallback_from` hadisə xüsusiyyətləri göndərilir.

---

## 5. Verilənlər Bazası & Miqrasiya Qanunları

1. **Expand-Contract Qaydası**:
   - Əvvəl əlavə et (additive), köhnə deploy üçün uyğunluq qoruyucusu (shim) saxla, kodu deploy et, yalnız sonra köhnə sütunu/funksiyanı sil.
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
4. **Şagird Axınında Öz-Özünü Sağaldan Sxem (Self-Healing)**:
   - `step_events` və ya `questions` cədvəlinə yazarkən naməlum `topic_code` və ya `error_code` gələrsə, sərt FK/CHECK xətası ilə 500 atmayın.
   - `trg_register_topic_code` və `trg_register_error_code` triggerləri naməlum kodu `active=false, needs_review=true` olaraq qeyd edir və sorğu uğurla tamamlanır.
5. **Cavabların Təcrid Edilməsi (ADR-017)**:
   - Düzgün cavablar və addım həlləri `private` sxemində saxlanılır. `app_runtime` istifadəçisinin `private.*` üzərinə birbaşa oxuma hüququ yoxdur.

---

## 6. SymPy Riyazi Doğrulama (Three-State Status)

Doğrulama üç qiymətlidir və DB ilə tam eyni olmalıdır:
- `true`: Riyazi bərabərlik sübut edildi (SymPy təsdiqlədi).
- `false`: Həll yanlışdır (həll şagirddən gizlədilir).
- `null`: Avtomatlaşdırılmış yoxlama aparılmadı (həll göstərilir, lakin "yoxlanılmadı" nişanı ilə).

> **Kritik Qayda**: `method='none'` olduqda müştəriyə və ya DB-yə əsla `verified: true` göndərilməməlidir (Bax: CLAUDE.md Dərs 7).

---

## 7. Backend İnkişaf Yoxlama Siyahısı (Checklist)

- [ ] API endpoint-i `next-intl` üçün uyğun i18n xəta strukturu qaytarır.
- [ ] Yeni SQL obyektləri üçün `grant ... to app_runtime` yazılıb.
- [ ] Zənginləşdirilmiş telemetriya hadisələri `docs/TELEMETRY.md` taksonomiyasına uyğundur.
- [ ] Sızma qoruyucusu (`leak.ts`) yoxlanılıb (0% sızma hədəfi).
- [ ] Type check keçir: `cd web && npx tsc --noEmit`.
- [ ] Testlər keçir: `node scripts/replay-prod-verify.mts` və ya `npm test`.
