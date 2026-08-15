# ADR-028 — `cost_usd` provayder `usage`-indən, düşünmə tokeni daxil

**Status:** Qəbul edilib
**Tarix:** 2026-08-15
**Toxunur:** `ADR-027` (tarif hələ registridədir) · `web/lib/cost.ts` · `web/lib/llm.ts`
**Motivasiya:** Ilkin — hər sorğu cavabında xərc gəlirmi, gəlirsə ondan götür.
Ən düzgün best practice.

## Araşdırma

| Mənbə | Cavabda USD `cost`? | Nə var |
|---|---|---|
| Gemini Developer API (`chat/completions`, `generateContent`) | **yox** | token `usage` / `usageMetadata` |
| OpenAI Chat Completions | **yox** | token `usage`; USD ayrıca Usage API-də, sorğu səviyyəsində deyil |
| OpenRouter | **bəli** | `usage.cost` hər cavabda |
| Native Gemini `UsageMetadata` | **yox** | `promptTokenCount`, `candidatesTokenCount`, `thoughtsTokenCount`, `cachedContentTokenCount` |

Google-un öz sənədi: xərc = cavabdakı token sayları × rəsmi tarif. `count_tokens`
təxminidir, fatura deyil. Düşünmə tokeni **çıxış** tarifindədir.

Gemini-nin OpenAI-uyğun qatı (bizim yol) düşünməni tez-tez `completion_tokens`-a
qoymur. Forum nümunəsi (2026-01): `prompt=15`, `completion=18`, `total=175` —
157 düşünmə tokeni `total`-dadır, köhnə `prompt×in + completion×out` onları
ATLAYIRDI.

## Qərar

1. `usage.cost` / `usage.cost_usd` ədəddirsə (≥0) — onu yaz. Gemini-də bu sahə
   yoxdur; OpenRouter/gələcək gateway üçün.
2. Yoxdursa: `(prompt - cached) × input + cached × input + (total - prompt) × output`.
   `total` yoxdursa `completion + reasoning_tokens`.
3. Tarif yenə `web/lib/models.ts` (`ADR-027`). API tarif kataloqu yoxdur.

Eval `scripts/lib/cost.py` eyni qaydanı işlədir.
