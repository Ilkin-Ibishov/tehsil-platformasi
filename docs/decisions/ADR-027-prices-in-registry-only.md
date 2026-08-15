# ADR-027 — LLM qiyməti yalnız registridə, Vercel/env yox

**Status:** Qəbul edilib
**Tarix:** 2026-08-15
**Toxunur:** `ADR-022` (env override silinir) · `web/lib/models.ts` · `web/lib/cost.ts`
**Motivasiya:** Ilkin — qiymət Vercel-dən gəlməsin, repo-da olsun. Əlavə: Gemini API
USD qaytarırsa, ondan götür.

## Araşdırma (2026-08-15)

Gemini Developer API-də **USD tarif və ya sorğu xərci yoxdur.** Yoxlanan yerlər:

| Endpoint / sahə | Nə qaytarır | USD? |
|---|---|---|
| OpenAI-uyğun `POST .../chat/completions` → `usage` | `prompt_tokens`, `completion_tokens` | yox |
| Native `generateContent` → `usageMetadata` | token sayları (prompt, candidates, thoughts, cached) | yox |
| `GET .../v1beta/models/{id}` (`models.get`) | `inputTokenLimit`, `outputTokenLimit`, ad, versiya | yox |
| Rəsmi qiymət səhifəsi | HTML sənəd, maşın API deyil | — |

Token × tarif hesablaması Google-un öz sənədində də belədir: say API-dən, tarif
səhifədən. Ona görə runtime-da "qiyməti çəkib set et" yolu yoxdur.

## Qərar

`cost_usd` = `usage` tokenləri × `web/lib/models.ts` registrisindəki tarif.
`resolvePrice` `process.env` oxumur. Naməlum model → `null` (0 yazılmır).

Yeni model: registriyə sətir. Qiymət dəyişəndə: eyni fayl, commit, deploy — Vercel
env panelinə əl vurulmur.

`ADR-022`-nin "naməlum model üçün `MODEL_<SLUG>_PRICE_*` env" çıxışı ləğv olunur:
o çıxış qiyməti yenə Vercel-ə qaytarırdı, `86eymrm8j`-nin kök səbəbi idi.

## Həcm xaricində

Faza 0 eval harness (`scripts/lib/cost.py`) qiyməti arqument kimi alır; production
yolu deyil. Bu ADR onu dəyişmir.
