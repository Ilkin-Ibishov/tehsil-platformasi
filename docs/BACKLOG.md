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

