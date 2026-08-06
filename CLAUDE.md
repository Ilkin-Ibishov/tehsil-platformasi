# CLAUDE.md — Təhsil Platforması

> Bu fayl Claude Code tərəfindən hər sessiyanın əvvəlində avtomatik oxunur.
> Cowork (Claude Project) tərəfi bu faylı yeniləyir. **Dəyişiklik etməzdən əvvəl `docs/HANDOFF.md`-i oxu.**

## Layihə bir abzasda

Azərbaycan şagirdləri (5–11 sinif) üçün mobil-first web app. Şagird riyaziyyat məsələsinin şəklini çəkir
(əsasən **çap olunmuş DİM test toplusundan**), tətbiq məsələni addım-addım açır, hər addımda şagirddən
cavab istəyir, səhvləri **adlandırıb** kateqoriyalaşdırır. Toplanan səhv xəritəsi valideynə həftəlik
hesabat kimi gedir — abunəni ödəyən valideyndir.

Fərq: rəqiblər (Photomath, Gauth) **cavab** verir. Biz **harada ilişdiyini** deyirik.

## Qızıl qayda

Məhsulun bütün dəyəri `error_code` taksonomiyasına bağlıdır. Əgər bir dəyişiklik səhvin
adlandırılmasını zəiflədirsə — o dəyişiklik səhvdir, nə qədər "təmiz kod" olsa da.

## Fayl sahibliyi — tək mənbə qaydası

| Data | Tək mənbə | Yazan |
|---|---|---|
| LLM cavab müqaviləsi | `docs/STEP-SCHEMA.json` | Cowork (dəyişiklik ADR tələb edir) |
| Səhv kodları (`error_code`) | `docs/STEP-SCHEMA.json` → `error_codes` | Cowork — **dəyişməz enum** |
| Dizayn tokenləri | `docs/DESIGN-TOKENS.json` | Cowork |
| DB sxemi | `docs/DATA-MODEL.md` | hər ikisi (miqrasiya ilə) |
| Prompt mətnləri | `prompts/*.md` | hər ikisi |
| Memarlıq qərarları | `docs/decisions/ADR-*.md` | hər ikisi |
| Tapşırıq statusu | ClickUp | hər ikisi |
| Növbə jurnalı | `docs/HANDOFF.md` | hər ikisi |
| Gələcək ideyalar | `docs/FUTURE-IDEAS.md` | Cowork — **tapşırıq deyil, kod yazma** |
| Faza 1 planı və API müqaviləsi | `docs/PHASE-1.md` | Cowork |
| Telemetriya hadisələri | `docs/TELEMETRY.md` | Cowork — **dəyişməz taksonomiya** |

**Heç vaxt:** dizayn tokenini komponentin içində hardcode etmə. `DESIGN-TOKENS.json` → CSS custom
property → komponent. Səbəb: mövcud 9 dizayn faylında eyni token 3 fərqli dəyərdə idi
(bax `docs/decisions/ADR-002-design-tokens.md`).

## ClickUp koordinatları

Claude Code-a eyni ClickUp MCP-sini əlavə et (`claude mcp add`) — tapşırığı özün `in progress`-ə çək,
commit-dən sonra bağla.

| Siyahı | `list_id` |
|---|---|
| Faza 0 · Eval | `901820224519` |
| Faza 1 · Şaquli dilim | `901820224521` |
| Backlog | `901820224524` |
| Bloklar və qərarlar | `901820224530` |

Folder: `901815897469` · Space: `901810230629` · Workspace: `90182536078`

## Sessiya qaydaları (Claude Code üçün)

1. **Başlayanda:** `docs/HANDOFF.md`-in son 2 yazısını oxu.
2. **İşləyəndə:** memarlıq səviyyəsində qərar verirsənsə → `docs/decisions/ADR-XXX.md` yaz, köhnəni silmə.
3. **Bitirəndə:** `docs/HANDOFF.md`-ə yeni blok əlavə et (formatı faylın başındadır) və ClickUp tapşırığını yenilə.
4. **Bloka düşəndə:** kodda `TODO` qoyub davam etmə — `HANDOFF.md`-ə `Blok:` sətri yaz və dayan.

## Texniki stack (qərar verilib)

- **Next.js (App Router) + TypeScript + Tailwind** — PWA, mobile-first, `max-width: 480px`
- **Supabase** — Postgres + Auth + Storage
- **Vercel** — deploy
- **sympy** — cavab yoxlanışı. **Eval və istehsalat eyni məntiqi işlətməlidir** —
  iki nüsxə olarsa, ölçdüyümüz şeylə buraxdığımız şey ayrılır.
- **Vision LLM** — `gemini-3.6-flash`, OpenAI-uyğun endpoint. Açar **YALNIZ serverdə**.
- ~~Texo (ONNX)~~ — **silindi**, `ADR-001` HÖKM. B tək çağırışda OCR+həll edir; latensiyanın
  səbəbi OCR deyil, modelin thinking rejimidir, Texo onu həll etmir.

Detallar: `docs/ARCHITECTURE.md`

## Dil və format

- İstifadəçi interfeysi **Azərbaycan dilində**. Onboarding-də az/ru/en/tr seçimi var — i18n **birinci gündən**,
  hardcode edilmiş mətn qadağandır (`next-intl` və ya bənzəri).
- Kod, dəyişən adları, commit mesajları — **ingiliscə**.
- Sənədlər və `HANDOFF.md` — **Azərbaycanca** (sahib insan azərbaycanlıdır).

## Cari faza

**Faza 1 — Şaquli dilim.** Faza 0-lite keçdi (`ADR-001` → "HÖKM", 2026-08-06):
vision boru xətti işləyir, 9/10 dəqiqlik, 0 hallüsinasiya. Texo (pipeline A) silindi.

**Əsas sənəd: `docs/PHASE-1.md`** — sprintlər, API müqaviləsi, qəbul şərtləri.
Telemetriya müqaviləsi: `docs/TELEMETRY.md`.

İki açıq risk dəqiqlik deyil:
- **Xərc** — $0.0167/həll, abunə 200 həlldən sonra zərərdə. Keş və ucuz model
  optimallaşdırma deyil, biznes modelinin şərtidir.
- **Latensiya** — 16.8 san. `HƏLL QURULUR` ekranı boş spinner olmamalıdır.

Qapı: 15–20 şagird · 100+ real həll · 20 şagirddən ≥8-i 7 gündə ≥3 dəfə qayıdır.

## Referans

`design/*.dc.html` — 9 təsdiqlənmiş ekran maketi (interaktiv HTML). Bunlar **spesifikasiyadır**, kod deyil.
Komponent qurarkən onlardan struktur və mətnləri götür, stilləri isə `DESIGN-TOKENS.json`-dan.
