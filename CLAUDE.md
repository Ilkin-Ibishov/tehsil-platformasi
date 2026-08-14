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

## Miqrasiya və icazə dərsləri (gate-78, 2026-08-11)

Production təhlükəsizlik auditindən (HANDOFF 79/80) çıxan, təkrarlanmaması üçün qeyd edilən qaydalar:

1. **Sxem-köçürən miqrasiyalar expand-contract tələb edir.** "Əvvəl miqrasiya, sonra merge" yalnız
   ADDITIVE miqrasiyalar üçün təhlükəsizdir. Bir obyekti (funksiya, sütun) başqa yerə köçürən/adını
   dəyişən miqrasiya DB-ni tətbiq etdiyi andan köhnə deploy edilmiş kodu SINDIRIR. Düzgün ardıcıllıq:
   yeni yerdə yarat → köhnəni keçid dövrü üçün saxla (shim) → kodu merge/deploy et → YALNIZ SONRA
   köhnəni sil.
2. **`app_runtime` üçün heç vaxt implicit/default privilege-ə güvənmə.** Hər obyekt (funksiya, cədvəl,
   sequence) üçün `grant ... to app_runtime` AÇIQ yazılmalıdır. Implicit PUBLIC-ə söykənən istənilən
   obyekt gələcək bir `revoke ... from public`-də (məs. `anon`/`authenticated` təmizliyi zamanı)
   kollateral zərər çəkəcək.
3. **Blanket REVOKE-dan sonra bütün `app_runtime` GRANT matrisini (funksiya EXECUTE, sequence
   USAGE/SELECT, cədvəl CRUD, sxem USAGE) yenidən yoxla.** Supabase-in `get_advisors` lint-ləri
   YALNIZ "çox açıq"-ı görür ("anon icazəsi var") — "çox bağlı"-nı ("app_runtime icazəsini itirdi")
   GÖRMÜR. Advisors 0 WARN göstərməsi kifayət DEYİL.
4. **Policy/grant əlavə etməzdən əvvəl həmin obyektin kod yolunda HƏQİQƏTƏN istifadə olunduğunu
   yoxla.** Cədvəl/funksiya adına baxıb təsir çıxarmaq səhvdir — məs. `resolve_translation` (0016)
   DB-də mövcuddur, amma HEÇ bir cari API route onu çağırmır (hamısı `qt.lang = 'az'` hardcode
   sorğusu işlədir); onun ACL-i qırılsa da canlı S4/S5 yolu pozulmazdı.
5. **Constraint/trigger yazmazdan əvvəl həmin cədvələ YAZAN kodu oxu** (2026-08-13, 0049→0050).
   `questions`-a `topic_code` FK-si və fingerprint prefiks trigger-i əlavə edildi — `persist.ts`
   oxunmadan. Halbuki `user_capture` sətirləri prefiksiz fingerprint yazır və `topic_code` LLM-dən
   gəlir (AÇIQ çoxluq). Hər ikisi produksiyada 500 verərdi. Kodu oxumaq miqrasiya yazmaqdan ucuzdur.
6. **Şagird axınında olan cədvəldə sərt rədd etmə — öz-özünü sağaldan qeydiyyat işlət.** Naməlum
   `topic_code`/`error_code` insert-i dağıtmır; `active=false, needs_review=true` ilə qeydə alınır
   və `v_taxonomy_review`-da görünür. Anomaliya görünür qalır, şagird isə qırılmır.

## Fayl sahibliyi — tək mənbə qaydası

| Data | Tək mənbə | Yazan |
|---|---|---|
| LLM cavab müqaviləsi | `docs/STEP-SCHEMA.json` | Cowork (dəyişiklik ADR tələb edir) |
| Səhv kodları (`error_code`) | `docs/STEP-SCHEMA.json` → `error_codes` | Cowork — **dəyişməz enum** |
| Dizayn tokenləri | `docs/DESIGN-TOKENS.json` | Cowork |
| DB sxemi | `docs/DATA-MODEL.md` | hər ikisi (miqrasiya ilə) |
| Prompt mətnləri | `prompts/**/*.md` (nüvə: `prompts/solve/core.md`, fənn əlavəsi: `prompts/solve/math.md` — ADR-014) | hər ikisi |
| Memarlıq qərarları | `docs/decisions/ADR-*.md` | hər ikisi |
| Test bankı arxitekturası | `.kiro/specs/test-bank/design.md` | Cowork — SQL sxemi mənbə həqiqətdir |
| Test bankı qaydaları | `.kiro/steering/test-bank.md` | Cowork |
| Tapşırıq statusu | ClickUp | hər ikisi |
| Növbə jurnalı | `docs/HANDOFF.md` | hər ikisi |
| Gələcək ideyalar | `docs/FUTURE-IDEAS.md` | Cowork — **tapşırıq deyil, kod yazma** |
| Faza 1 planı və API müqaviləsi | `docs/PHASE-1.md` | Cowork |
| Telemetriya hadisələri | `docs/TELEMETRY.md` | Cowork — **dəyişməz taksonomiya** |
| Maşınla yoxlanan invariantlar | `docs/INVARIANTS.md` | Cowork |

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
5. Miqrasiya tələb edən kod, miqrasiya tətbiq olunmamış `main`-ə merge edilmir. `main`-ə push
   avtomatik deploy tetikləyir — kod sxemdən irəli gedərsə istehsalat dərhal sınır. Additive
   miqrasiyalar köhnə kodu sındırmır, ona görə "əvvəl miqrasiya, sonra merge" həmişə təhlükəsiz
   sıradır.
6. Yeni cədvəl yaradan hər miqrasiya öz RLS sətrini daşımalıdır.
7. **Test bankı işinə başlamazdan əvvəl** oxu: `.kiro/specs/test-bank/requirements.md`,
   `.kiro/specs/test-bank/design.md`, `.kiro/steering/test-bank.md`,
   `docs/decisions/ADR-017-answer-isolation.md`. `design.md`-dəki SQL sxemi mənbə
   həqiqətdir — ondan sapma ADR tələb edir.

## Texniki stack (qərar verilib)

- **Next.js (App Router) + TypeScript + Tailwind** — PWA, mobile-first, `max-width: 480px`
- **Supabase** — Postgres + Auth + Storage
- **Vercel** — deploy
- **sympy** — cavab yoxlanışı. **Eval və istehsalat eyni məntiqi işlətməlidir** —
  iki nüsxə olarsa, ölçdüyümüz şeylə buraxdığımız şey ayrılır.
- **Vision LLM** — Gemini ailəsi, OpenAI-uyğun endpoint. Açar **YALNIZ serverdə**. Model adı
  artıq koddan/env-dən HARDCODE DEYİL — `ADR-022`/`ADR-023`: `public.app_config.active_model`
  (DB, redeploy-suz dəyişdirilir) → yoxdursa `GEMINI_MODEL` env → registri defoltu. Qiymət
  (`web/lib/models.ts`) modelin ÖZÜ ilə eyni yerdə yaşayır ki, model dəyişəndə unudulmasın.
  Cari aktiv modeli bilmək üçün DB-yə bax (`select value from public.app_config where
  key='active_model'`), bu faylı YOX — həmişə köhnəlmə riski var.
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
