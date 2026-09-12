# BACKLOG — Təhsil Platforması Agent & Sistem Tapşırıqları

Bu fayl agentlər (Antigravity, Cursor) və tərtibatçılar üçün sistem təkmilləşdirmələri, təhlükəsizlik baryerləri, test avtomatlaşdırması, pedaqoji auditlər və əməliyyat tapşırıqlarının vahid idarəetmə reyestridir.

---

## 1. Status və Prioritet Şkalası

| Prioritet | Məna | Reaksiya |
|---|---|---|
| **P0** | Blocker / Kritik Təhlükəsizlik / Faza 1 Qapısı | Dərhal icra edilir, kompromis yoxdur. |
| **P1** | Yüksək / Əməliyyat və Keyfiyyət Gücləndirilməsi | Növbəti sessiyalarda prioritetləşdirilir. |
| **P2** | Orta / Texniki Borc və Erqonomika | Planlaşdırılmış sprintlərdə tamamlanır. |
| **P3** | Aşağı / İdeyalar və Gələcək Optimizasiyalar | Vaxt olduqda və ya Faza 2-də baxılır. |

| Status | Məna |
|---|---|
| `Complete` | Tamamlanıb, testlərdən keçib və təsdiqlənib. |
| `In Progress` | Hazırda icra olunur və ya monitorinqdədir. |
| `To Do` | Tələbləri aydınlaşdırılıb, icraya hazırdır. |
| `Blocked` | Qərar (ADR) və ya asılılıq səbəbindən dayanıb. |

---

## 2. Tapşırıqların İcmal Cədvəli (Master Matrix)

| ID | Başlıq | Sahə | Prioritet | Status | Məsuliyyət | Hədəf |
|---|---|---|---|---|---|---|
| **AG-001** | Agent Kontekst Modullaşdırması & 4 Yeni Skill | Agent / DX | **P0** | `Complete` | Antigravity | HANDOFF 207 |
| **AG-002** | 10-Saniyəlik Lokal Pre-Flight Yoxlama Skripti | CI/CD / Ops | **P0** | `Complete` | Antigravity | scripts/preflight.mjs |
| **AG-003** | Avtomatlaşdırılmış Skill Sinxronizasiyası | Agent / DX | **P1** | `Complete` | Antigravity | scripts/sync-agent-context.mjs |
| **AG-004** | Hook Genişlənməsi (`PreInvocation` & `PostToolUse`) | Lifecycle Hooks | **P1** | `Complete` | Antigravity | .agents/hooks.json |
| **AG-005** | Öz-Özünü Sağaldan Taksonomiya Triyajı (`triage-taxonomy`) | Data / LLM | **P1** | `Complete` | Antigravity | scripts/triage-taxonomy.mjs |
| **AG-006** | DİM "Qaralanmış Toplu" Eval Dəsti (`golden-set-dim-annotated`) | Vision / Qat 1 | **P1** | `To Do` | Eval Team | evals/ |
| **AG-007** | DİM Dərslik Terminologiyası və Pedaqoji Lüğət | Pedaqogika | **P2** | `Complete` | Antigravity | docs/DIM-GLOSSARY.md |
| **AG-008** | Faza 1 Şagird Qapısı İntizamı (15–20 Real Şagird) | Məhsul / QA | **P0** | `In Progress` | Cowork / BA | docs/PHASE-1.md |
| **AG-009** | Antigravity Deklarativ Subagent Qeydiyyatı | Multi-Agent | **P2** | `Complete` | Antigravity | .agents/agents/ |
| **AG-010** | Vizuallaşdırma Mühərriki & Funksiya Korpusu | Vizual / Faza 4 | **P2** | `Deferred (Phase 4)` | Cowork / Antigravity | ADR-031 / ClickUp 86eyp3auh |
| **AG-011** | Onboarding Naviqasiya & "Keç" Təhlükəsizliyi | Onboarding / Nav | **P0** | `Complete` | Antigravity | web/app/onboarding/ |
| **AG-012** | Siniflə Pedaqoji Ton & Dinamik İzah Qutusu | Pedaqogika / UX | **P1** | `Complete` | Antigravity | web/lib/profile/ |
| **AG-013** | Ad Sahəsi Erqonomikası & Azərbaycan Orfoqrafiyası | Mobil UX / i18n | **P1** | `Complete` | Antigravity | web/app/onboarding/ |
| **AG-014** | Onboarding Funnel Telemetriyası & Soyuq Başlanğıc | Telemetriya | **P1** | `Complete` | Antigravity | web/lib/telemetry.ts |
| **AG-015** | Sokratik İpucu İntizamı & Sıfır Semantik Sızma | Prompt / Qat 5 | **P0** | `Complete` | Antigravity | prompts/solve/ |
| **AG-016** | Sual Bankı Sızan İpuclarının Bərpası & Kurasiyası | DB / Supabase | **P0** | `Complete` | Antigravity | supabase/migrations/ |
| **AG-017** | Eval Harness Avtomatlaşdırılmış Leak Guard | CI/CD / Eval | **P1** | `Complete` | QA Team | scripts/eval.py |
| **AG-018** | Təmiz Sessiya Dəvət Qapısı & Bərpa QA Doğrulaması | QA / Onboarding | **P2** | `Complete` | qa_tester | web/components/kamera/ |
| **AG-019** | Sokratik Çoxpilləli İpucu (Progressive Tiering) | Arxitektura / F2 | **P2** | `To Do` | Cowork / BA | docs/plans/ |
| **AG-020** | Ana Ekran Erqonomikası & Streak Çipi Təmizliyi | Mobil UI / i18n | **P1** | `Complete` | Antigravity | web/app/page.tsx |

---

## 3. Ətraflı Tapşırıq Kartları

### 🎯 AG-001: Agent Kontekst Modullaşdırması & 4 Yeni Skill
- **Sahə:** Agentik İnfrastruktur / Context Engineering
- **Prioritet:** P0 | **Status:** `Complete` (HANDOFF 207, commit `4f0ed47`)
- **Təsvir:** Cowork, Cursor və Antigravity arasındakı kontekst boşluqları audit edildi. 4 yeni skill yaradıldı (`critical-thinker`, `backend-developer`, `it-business-analyst`, `student-reviewer`), Antigravity iyerarxik qaydaları (`.agents/rules/*.md`) və təhlükəsizlik hook-u (`scripts/hooks/antigravity-guard.mjs`) quruldu.
- **Qəbul Meyarları:**
  - [x] Bütün 4 skill `.agents/skills/` və `.cursor/skills/` daxilindədir.
  - [x] Antigravity `PreToolUse` destruktiv əmrləri və sirlərin oxunmasını bloklayır.
  - [x] `Stop` hook-u kod dəyişdikdə HANDOFF yazılmasını tələb edir.

---

### ⚡ AG-002: 10-Saniyəlik Lokal Pre-Flight Yoxlama Skripti
- **Sahə:** CI/CD / Geliştirici Əməliyyatları
- **Prioritet:** P0 | **Status:** `Complete`
- **Təsvir:** `git push`-dan əvvəl TypeScript tip yoxlamasını (`web`), 4 əsas selftesti (URL, Answer, Template, Leak), təhlükəsizlik hook testini və Python eval yoxlamasını <10 saniyədə birləşdirən pre-flight mühərriki.
- **Fayllar:** `scripts/preflight.mjs`, `scripts/preflight.bat`.
- **Qəbul Meyarları:**
  - [x] Bir əmrlə (`node scripts/preflight.mjs` və ya `scripts\preflight.bat`) işə düşür.
  - [x] Hər hansı bir yoxlama uğursuz olduqda qırmızı çıxış və exit code 1 qaytarır.
  - [x] Bütün yoxlamalar uğurlu olduqda <10 saniyə ərzində "Ready for push" bildirir.

---

### 🔄 AG-003: Avtomatlaşdırılmış Skill Sinxronizasiyası
- **Sahə:** Agent / Alət İnteqrasiyası
- **Prioritet:** P1 | **Status:** `Complete`
- **Təsvir:** `.agents/skills/` və `.cursor/skills/` qovluqları arasında manual kopyalama zərurətini aradan qaldıran avtomatlaşdırılmış sinxronizasiya skripti.
- **Fayllar:** `scripts/sync-agent-context.mjs`.
- **Qəbul Meyarları:**
  - [x] Mənbə kimi `.agents/skills/` qovluğunu qəbul edir.
  - [x] Fərqlənən və ya yeni əlavə olunan faylları avtomatik `.cursor/skills/`-ə güzgüləyir.
  - [x] Pre-flight və ya git hook-a inteqrasiya oluna bilir.

---

### 🛡️ AG-004: Hook Genişlənməsi (`PreInvocation` & `PostToolUse`)
- **Sahə:** Antigravity Həyat Dövrü Qoruyucuları
- **Prioritet:** P1 | **Status:** `Complete`
- **Təsvir:**
  - `PreInvocation`: Agent `prompts/` və ya `web/app/api/solve/` fayllarına toxunarkən efemer olaraq ADR-017 sızma qadağası və 3-hallı verification xatırlatması inyeksiya edilir.
  - `PostToolUse`: `web/` daxilində fayl redaktə edildikdən dərhal sonra sintaksis və tip xətalarını yoxlayıb anında xəbərdarlıq edir.
- **Qəbul Meyarları:**
  - [x] `.agents/hooks.json` daxilində `PreInvocation` və `PostToolUse` konfiqurasiyası qurulur.
  - [x] Agent yanlış tip yazdıqda növbəti addıma keçmədən səhvi görür.
  - [x] `scripts/hooks/guard.selftest.mjs` ilə 19 fərqli ssenari (PreInvocation, PreToolUse, PostToolUse, Stop) avtomatlaşdırılmış şəkildə test edilir və pre-flight mühərrikinə inteqrasiya olunub.

---

### 📊 AG-005: Öz-Özünü Sağaldan Taksonomiya Triyajı (`triage-taxonomy`)
- **Sahə:** Verilənlər Bazası / LLM Taksonomiyası
- **Prioritet:** P1 | **Status:** `Complete`
- **Təsvir:** `public.topic_codes` və `public.error_codes` cədvəllərində `needs_review=true` ilə qeydə alınmış sətirləri oxuyan, tezlik analizi aparan, sinonimləri qruplaşdıran və ya prompt təkmilləşdirməsi, ya da yeni ADR/SQL təklif edən skill və skript.
- **Fayllar:** `scripts/triage-taxonomy.mjs`, `.agents/skills/triage-taxonomy/SKILL.md`, `docs/reports/taxonomy-triage-2026-09-10.md`.
- **Qəbul Meyarları:**
  - [x] `v_taxonomy_review` cədvəlindən naməlum kodları qruplaşdırır (27 real istehsalat kodu analiz edildi).
  - [x] Sinonim və prefiks ziddiyyətlərini (`VEC.OPERATIONS` vs `GEO.VECTORS`, `GEO.SOLID_CONE_VOLUME` vs `GEO.CONE_VOLUME`) aşkarlayır.
  - [x] Rəsmi markdown hesabatı (`docs/reports/`) və SQL tənzimləmə layihəsi (`--sql`) generasiya edir.
  - [x] `scripts/preflight.mjs` test mühərrikinə inteqrasiya olunub.

---

### 📸 AG-006: DİM "Qaralanmış Toplu" Eval Dəsti
- **Sahə:** Vision OCR / Kaskad Qat 1
- **Prioritet:** P1 | **Status:** `To Do`
- **Təsvir:** Şagirdlərin real karandaş qeydləri, variant qaralamaları və qatlanmış səhifələrindən ibarət 20 suallıq xüsusi eval korpusu (`golden-set-dim-annotated`).
- **Qəbul Meyarları:**
  - [ ] Qat 1 OCR qələm izlərini riyazi kəsr xətti və ya mətn kimi qəbul etmir.
  - [ ] Dəqiqlik və imtina dərəcələri `scripts/eval.py` ilə ölçülür.

---

### 📖 AG-007: DİM Dərslik Terminologiyası və Pedaqoji Lüğət
- **Sahə:** Pedaqogika / Azərbaycan Dili i18n
- **Prioritet:** P2 | **Status:** `Complete` (HANDOFF 212)
- **Təsvir:** Azərbaycan məktəb dərsliklərində (5–11-ci sinif) işlədilən standart termin və ifadələrin toplusu (`docs/DIM-GLOSSARY.md`). Süni intellektin tərcümə üslubunu aradan qaldırmaq üçün Qat 5 promptuna referans verilir, pre-flight linteri və student-reviewer inteqrasiyası tamamlandı.
- **Qəbul Meyarları:**
  - [x] Dərsliklərdən ən çox işlənən 100 riyazi ifadə və onların qadağan olunmuş robotik ekvivalentləri cədvəlləşdirilir (`docs/DIM-GLOSSARY.md`).
  - [x] `prompts/solve/core.md` (v18, Qayda 18) standart DİM dərslik dili və kalka qadağaları ilə təchiz edildi.
  - [x] Avtomatlaşdırılmış linter (`scripts/lib/glossary-linter.mjs` --selftest) yazıldı və `scripts/preflight.mjs`-ə inteqrasiya olundu.
  - [x] `student-reviewer` bacarığına dərslik dili qiymətləndirmə meyarı kimi bağlandı.

---

### 🚪 AG-008: Faza 1 Şagird Qapısı İntizamı (15–20 Real Şagird)
- **Sahə:** Məhsul / QA İntizamı
- **Prioritet:** P0 | **Status:** `In Progress`
- **Təsvir:** [`docs/PHASE-1.md`](file:///c:/Programming/Tehsil-Platformasi/docs/PHASE-1.md) qapı meyarlarının qorunması. Real şagird dəvətləri başlamadan qeyri-zəruri funksionallıqların (social feed, gamification) sistemə daxil olmasının qarşısının alınması.
- **Qəbul Meyarları:**
  - [ ] 15–20 real şagird pilot dəvəti tamamlanır.
  - [ ] 100+ real həll toplanır.
  - [ ] 20 şagirddən ≥8-i 7 gün ərzində ≥3 dəfə qayıdır.

---

### 🤖 AG-009: Antigravity Deklarativ Subagent Qeydiyyatı
- **Sahə:** Multi-Agent Orkestrasiyası
- **Prioritet:** P2 | **Status:** `Complete` (HANDOFF 213)
- **Təsvir:** Cursor-dakı `.cursor/agents/` analoqu olaraq Antigravity üçün xüsusi rolların (`reviewer`, `student_tester`, `ba_analyst`, `backend_dev`, `deploy_guard`) deklarativ manifestləri (`.agents/agents/*.md`), `scripts/lib/agent-registry.mjs` mühərriki, sinxronizasiya və preflight inteqrasiyası quruldu.
- **Qəbul Meyarları:**
  - [x] Bütün 5 subagent `.agents/agents/` daxilində YAML frontmatter və sistem təlimatı ilə təmin edildi.
  - [x] `scripts/sync-agent-context.mjs` `.cursor/agents/` ilə tam sinxronlaşdırmanı təmin edir.
  - [x] `scripts/lib/agent-registry.mjs` selftest ilə `scripts/preflight.mjs`-ə əlavə olundu.
  - [x] Agentlər tək əmrlə (`invoke_subagent`) ixtisaslaşmış kontekstdə işə düşür və nəticəni əsas agentə ötürür.

---

### 📈 AG-010: Vizuallaşdırma Mühərriki & Funksiya Korpusu
- **Sahə:** Vizual / Pedaqoji Təsvir / Qrafiklər
- **Prioritet:** P2 | **Status:** `Deferred (Phase 4)` (ADR-031, ClickUp `86eyp3auh`)
- **Təsvir:** ADR-031 əsasında deterministik SVG mühərriki (`web/lib/visual.ts`, `VisualFigure.tsx`) tam hazırdır. Real DİM suallarının yalnız ~8–17%-i sadə analitik qrafikdən faydalandığı üçün genişlənmə və funksiya-qrafik korpusu şüurlu şəkildə Faza 4-ə (Şagird dalğası) saxlanılıb. Hazırkı mərhələdə reqressiya qarşısı üçün `visual.selftest.mts` preflight-a qoşuldu və Bank üçün 2 real DİM sualına nümunəvi `visual` JSON bağlandı.
- **Qəbul Meyarları:**
  - [x] `web/lib/visual.selftest.mts` (43/43 pass) `scripts/preflight.mjs`-ə 11-ci yoxlama kimi inteqrasiya olundu.
  - [x] İstehsalat bazasında (Supabase) Bank üçün 2 real DİM sualına (`ALG.QUADRATIC_EQUATION` və `ALG.LINEAR_EQUATION`) nümunəvi `visual` payload bağlandı.
  - [ ] Faza 4: DİM funksiya-qrafik korpusu genişləndirilir ($n \ge 30$).
  - [ ] Faza 4: `visual.reported` və `visual.shown` telemetriya metrikaları ölçülür.

---

### 🛡️ AG-011: Onboarding Naviqasiya & "Keç" (Skip) Təhlükəsizlik Möhkəmləndirməsi
- **Sahə:** Onboarding Axını / Naviqasiya İntizamı
- **Prioritet:** P0 | **Status:** `Complete` (TP-ONBOARDING, BUG-ONB-03, BUG-ONB-04, BUG-ONB-07)
- **Təsvir:**
  1. `handleSkip()`-in sinfi məcburi 9 etməsi (P0 tələsi) aradan qaldırıldı: Step 1-də "keç" Step 2-yə (sinif seçiminə) yönləndirir; Step 2-də "keç" seçilmiş sinfi saxlayır (`persistAndGo(fullName.trim(), grade)`).
  2. Tarixçə tələsi: `persistAndGo` daxilində `router.push("/")` ➔ `router.replace("/")` edildi; Android geri jesti onboarding dövriyyəsi yaratmır.
  3. Yenidən onboarding məlumat itkisi: `/profil`-dən gələrkən form `getStoredProfile()` dəyərləri ilə inisializasiya olunur.
- **Fayllar:** `web/app/onboarding/page.tsx`, `web/app/profil/page.tsx`.
- **Qəbul Meyarları:**
  - [x] Step 1-də "keç" basıldıqda Step 2 açılır, sinif 9 olaraq zorlanmır.
  - [x] Step 2-də 11-ci sinif seçilib "keç" basıldıqda sinif 11 olaraq saxlanılır.
  - [x] Quraşdırma bitdikdən sonra ana ekranda "Geri" basıldıqda onboarding-ə qayıtmır.
  - [x] `/profil`-dən "Quraşdırmanı yenidən keç" basıldıqda mövcud ad və sinif form xanalarında görünür.

---

### 🎓 AG-012: Siniflə Pedaqoji Tonun Avtomatik Əlaqələndirilməsi & Dinamik İzah Qutusu
- **Sahə:** Pedaqogika / DİM Standartı / UX
- **Prioritet:** P1 | **Status:** `Complete` (TP-ONBOARDING, BUG-ONB-05, BUG-ONB-11)
- **Təsvir:**
  1. Sinif seçimi ilə yanaşı `web/lib/profile/storage.ts`-də həm `visualTone`, həm də `pedagogicalTone` avtomatik təyin olunur: 5-8 siniflər üçün `dostyana` + `mekteb`, 9 üçün `dostyana` + `buraxilis`, 10-11 üçün `yetkin` + `dim`.
  2. `design/Onboarding.dc.html`-də mövcud olan dinamik sinif izah mətni (`IZAH[sinif]`) bərpa olundu.
  3. `az.json`-dakı "vizual ton" dizayner jarqonu dərslik dili ilə əvəzləndi.
- **Fayllar:** `web/lib/profile/storage.ts`, `web/app/onboarding/page.tsx`, `web/messages/az.json`.
- **Qəbul Meyarları:**
  - [x] 5-8 sinif seçildikdə `pedagogicalTone: "dostyana"` yadda saxlanılır.
  - [x] Sinif düyməsinə basıldıqda dərhal altında müvafiq dərslik izah mətni çıxır.
  - [x] "Vizual ton" ifadəsi interfeysdən təmizlənir, dərslik dilinə uyğunlaşdırılır.

---

### 📱 AG-013: Ad Sahəsi Erqonomikası, Simvol Məhdudiyyəti & Azərbaycan Orfoqrafiyası
- **Sahə:** Mobil Daxiletmə Erqonomikası / i18n
- **Prioritet:** P1 | **Status:** `Complete` (TP-ONBOARDING, BUG-ONB-01, BUG-ONB-02, BUG-ONB-06, BUG-ONB-10)
- **Təsvir:**
  1. "Soyad" tələbi ləğv edildi, "Səni necə çağıraq? (İxtiyari)" şəklinə gətirildi.
  2. `<input>` sahəsinə `maxLength={50}`, `autoCapitalize="words"`, `autoComplete="given-name"`, `enterKeyHint="next"`, `spellCheck={false}` əlavə edildi.
  3. Dağıdıcı `autoFocus` ləğv edildi.
  4. `profil/page.tsx`-dəki `.toUpperCase()` Azərbaycan orfoqrafiyası üçün `.toLocaleUpperCase("az")` edildi.
  5. 7 sinif düyməsi üçün asimmetrik `repeat(4, 1fr)` şəbəkəsi səliqəli `repeat(7, 1fr)` strukturuna salındı.
- **Fayllar:** `web/app/onboarding/page.tsx`, `web/app/profil/page.tsx`, `web/messages/az.json`.
- **Qəbul Meyarları:**
  - [x] 50-dən artıq simvol daxil edilə bilmir, UI heç vaxt dağılmır.
  - [x] Mobildə ad yazarkən klaviatura böyük hərflə başlayır və "Next" düyməsi verir.
  - [x] "ilkin" adı profil ekranında "ILKIN" deyil, "İLKİN" kimi böyüyür.

---

### 📡 AG-014: Onboarding Funnel Telemetriyası və Soyuq Başlanğıc İzlənməsi
- **Sahə:** Telemetriya / PostHog Analitikası
- **Prioritet:** P1 | **Status:** `Complete` (TP-ONBOARDING, BUG-ONB-09)
- **Təsvir:**
  1. Onboarding addımları üçün 4 rəsmi telemetriya hadisəsi əlavə edildi: `onboarding.started`, `onboarding.step_viewed`, `onboarding.step_submitted`, `onboarding.completed`, `onboarding.skipped`.
  2. `web/app/page.tsx`-də soyuq başlanğıc zamanı `app.opened` hadisəsinin onboarding redirect-i səbəbindən itməsinin qarşısı alındı.
- **Fayllar:** `web/lib/telemetry.ts`, `docs/TELEMETRY.md`, `web/app/onboarding/page.tsx`, `web/app/page.tsx`.
- **Qəbul Meyarları:**
  - [x] Onboarding-in hər addımında PostHog hadisələri düzgün xassələrlə (`props`) atılır.
  - [x] Onboarding-də tərk edən istifadəçilər (drop-off) PostHog funnel-ində aydın görünür.

---

### 💡 AG-015: Sokratik İpucu İntizamı & Sıfır Semantik Sızma
- **Sahə:** Prompt Mühəndisliyi / Kaskad Qat 5 / Pedaqoji Nüvə
- **Prioritet:** **P0** | **Status:** `Complete` (commit-hazır)
- **Mənbə:** Aytən Retest (Bug 4 - FAIL), `docs/plans/2026-09-12-socratic-hints-retest-spec.md`
- **Təsvir:**
  1. `prompts/solve/core.md`-yə Qayda 19 əlavə edildi: İpucuda (`hint`) `check.ask` sualının yekun cavabını, ədədi nəticəsini və ya 1 addımlıq primitiv hesablama əmrini (məs: '25-4·7 hesabla', 'cavab 3-dür') yazmaq QƏTİ QADAĞANDIR.
  2. İpucu məcburi şəkildə Sokratik dərslik qaydasına (`docs/DIM-GLOSSARY.md` §3) yönəldir: 'Xatırla: ...', 'Diqqət yetir: ...', 'Yadına sal: ...', 'Qayda: ...'.
  3. `prompts/solve/math.md`, `physics.md` və mövzu promptlarındakı (`prompts/solve/math/*.md`, `prompts/solve/physics/*.md` — cəmi 39 nümunə) primitiv hesablama əmrləri və sızmalar təmizləndi.
- **Fayllar:** `prompts/solve/core.md`, `prompts/solve/math.md`, `prompts/solve/physics.md`, `prompts/solve/math/*.md`, `prompts/solve/physics/*.md`.
- **Qəbul Meyarları:**
  - [x] `core.md` və bütün fənn/mövzu promptlarında semantik sızma qadağası sənədləşdirilir və tətbiq olunur.
  - [x] Bütün 39 prompt nümunəsindəki hazır hesablama əmrləri və sızmalar dərslik qəlibləri ilə əvəzlənir.
  - [x] Qat 5 çıxışında ipucunun cavab verməsi riski aradan qaldırılır.

---

### 🗄️ AG-016: Sual Bankı Sızan İpuclarının Bərpası & Kurasiyası
- **Sahə:** Verilənlər Bazası / Məlumat Keyfiyyəti / Supabase
- **Prioritet:** **P0** | **Status:** `Complete` (0077_fix_bank_hint_semantic_leakage.sql tətbiq edildi)
- **Mənbə:** Aytən Retest (Bug 4 - FAIL), `docs/plans/2026-09-12-socratic-hints-retest-spec.md`
- **Təsvir:**
  1. İstehsalat bazasındakı (`question_translations`) sualların `steps` massivində mövcud sızan `hint` dəyərləri audit edildi.
  2. Aytənin test etdiyi və ən çox işlənən mövzular (`ALG.QUADRATIC_EQUATION`, `PROB.BASIC`) üzrə sızan `hint`-lər SQL miqrasiyası ilə Sokratik formaya salındı və canlı DB-yə tətbiq edildi.
- **Fayllar:** `supabase/migrations/0077_fix_bank_hint_semantic_leakage.sql`.
- **Qəbul Meyarları:**
  - [x] "7082409e" sualında "6.25-dən böyük ilk tam ədədi götür" və "25 − 4·7 hesabla" ipucları Sokratik mətnlə əvəzlənir.
  - [x] "4a2fa001" sualında "yəni cəmi 3 kök var" sızması aradan qaldırılır.
  - [x] Bank suallarında şagird heç vaxt hazır cavabla üzləşmir.

---

### 🛡️ AG-017: Eval Harness Avtomatlaşdırılmış İpucu Sızması Detektoru
- **Sahə:** CI/CD / QA Avtomatlaşdırması / Eval Harness
- **Prioritet:** **P1** | **Status:** `Complete` (`leak-guard.mjs`, `eval.py`)
- **Mənbə:** `docs/plans/2026-09-12-socratic-hints-retest-spec.md`
- **Təsvir:**
  1. `scripts/eval.py`, `scripts/lib/leak.py`, `scripts/lib/leak-guard.mjs` və `scripts/preflight.mjs`-ə `SEMANTIC_HINT_LEAK` yoxlaması əlavə edildi.
  2. Addımın `expected_answer` tokeni və ya birbaşa hesablama əmri `hint` mətnində aşkarlanarsa, test FAIL verir və preflight bloklayır.
- **Fayllar:** `scripts/eval.py`, `scripts/lib/leak.py`, `scripts/lib/leak-guard.mjs`, `scripts/preflight.mjs`.
- **Qəbul Meyarları:**
  - [x] `eval.py` test dəstlərində ipucu sızmasını avtomatik ölçür.
  - [x] Preflight mühərrikində hint leakage üçün linter inteqrasiya olunur.

---

### 🚪 AG-018: Təmiz Sessiya Dəvət Qapısı & Bərpa QA Doğrulaması
- **Sahə:** Manual & Avtomatlaşdırılmış QA / Dəvət Qapısı
- **Prioritet:** **P2** | **Status:** `Complete` (`TP-INVITE-RECOVERY.md`, `InviteGate.tsx`)
- **Mənbə:** Aytən Retest (Bug 1 - YOXLANMADI)
- **Təsvir:**
  1. Aytənin re-testində toxunulmamış qalan Dəvət Qapısı recovery kartının təmiz mühitdə (Incognito və ya `clearStoredInviteCode()`) sınaqdan keçirilməsi üçün QA planı hazırlandı.
  2. Səhv və ya bitmiş kodda `'demo' kodu ilə sınaqdan keçir →` düyməsinin 1 kliklə daxilolma və kamera axınına buraxması təmin edildi.
- **Fayllar:** `web/components/kamera/InviteGate.tsx`, `docs/testing/plans/TP-INVITE-RECOVERY.md`.
- **Qəbul Meyarları:**
  - [x] Təmiz sessiyada dəvət divarının aşılması 1 kliklə təsdiqlənir.
  - [x] QA test protokolu sənədləşdirilir və Aytən/alfa testçilərinə təqdim edilir.

---

### 🏛️ AG-019: Sokratik Çoxpilləli İpucu (Progressive Tiered Hinting) Arxitekturası
- **Sahə:** Sistem Arxitekturası / Faza 2
- **Prioritet:** **P2** | **Status:** `To Do`
- **Mənbə:** Aytən Retest Təklifi ("Səviyyəli hint: ilişmə yeri → üsul → istiqamət")
- **Təsvir:**
  1. `STEP-SCHEMA.json` v2-ni pozmadan (və ya gələcək v3 üçün ADR layihəsi ilə) 3 pilləli ipucu mexanizminin (1: Konseptual, 2: Strateji, 3: Taktiki istiqamət) arxitekturasının tədqiqi.
  2. UI-da hər kliklə növbəti dərinlik səviyyəsinin açılması üçün texniki təklif hazırlanır.
- **Fayllar:** `docs/plans/2026-09-12-socratic-hints-retest-spec.md`, `docs/decisions/ADR-033-progressive-hinting.md` (təklif).
- **Qəbul Meyarları:**
  - [ ] Geriye uyğun pilləli ipucu arxitekturası sənədləşdirilir.
  - [ ] ADR layihəsi hazırlanaraq Cowork müzakirəsinə təqdim edilir.

---

### 📱 AG-020: Ana Ekran Erqonomikası: Nəhəng Streak Rəqəminin Ləğvi & "Ardıcıl" Leksik Standartı
- **Sahə:** Mobil UI Erqonomikası / Leksika / i18n
- **Prioritet:** **P1** | **Status:** `Complete` (HANDOFF 231)
- **Mənbə:** İstifadəçi UI Auditi & /critical-thinker təhlili
- **Təsvir:**
  1. `web/app/page.tsx`-dəki 64px nəhəng yaşıl rəqəm və altındakı təkrarlanan etiket ləğv edildi; ekranda ~90px şaquli sahə azad olundu və əsas "Tapşırığı çək" (Kamera CTA) düyməsi birbaşa görünən zonaya qalxdı.
  2. `web/messages/az.json`-dakı şifahi/loru "dalbadal" sözü ədəbi və dərslik standartına uyğun "ardıcıl" ilə əvəzləndi (`streakDays: "{count} gün ardıcıl"`).
  3. `streakDays >= 2` olduqda xitabın üstündə zərif çip (`🔥 {count} gün ardıcıl`) göstərilir; `streakDays < 2` olduqda isə heç bir süni yazı çıxmır, birbaşa təmiz xitab açılır.
- **Fayllar:** `web/app/page.tsx`, `web/messages/az.json`, `design/Ana ekran.dc.html`.
- **Qəbul Meyarları:**
  - [x] "dalbadal" sözü interfeysdən və lokalizasiyadan tamamilə təmizlənir.
  - [x] Eyni rəqəmin ard-arda iki dəfə göstərilməsi aradan qaldırılır.
  - [x] 1-ci gündə şagirdə məntiqsiz "1 gün ardıcıl" yazılmır, təmiz başlıq açılır.
  - [x] 2 və daha çox gündə zərif `🔥` çipi göstərilir.
  - [x] `npm run typecheck` və `scripts/preflight.mjs` tam keçir.

