## 2026-09-11 (216) · Cursor → Cowork
Etdim:    Bank hit rate diaqnozu və answer-choice-stripping fixi: 40/40 camera solves llm-ə düşdüyünün səbəbi tapıldı — bank pipe-format şablonları (`FAIZ.OF|n=300|p=5`, fingerprint `300,5`) saxlayır, camera natural DİM məsələləri cavab variantları ilə (`A) 58% B) 34%...`, fingerprint əvvəl `15,20,60,58,34,68,80,40` idi). `numericFingerprint` (web/lib/cascade/bank.ts) cavab variant nümunələrini stripləyir (`/\b[A-Ea-e]\)\s*-?\d+(\.\d+)?%?\b/g`), indi `15,20,60`. PR #9 (draft) — CI keçdi. BU FİKS TƏKBAŞINA bank hit yaratmır (format uyğunsuzluğu qalır), amma gələcək DİM bank seed-i üçün zəruridir və saxta uniqueness-i qarşısını alır.
Tapşırıq: meta / no ClickUp — Bank/Template Hit Rate Diaqnozu.
Diqqət:   225 bank sətri camera üçün STRUKTURAL olaraq əlçatmazdır (synthetic template vs real DİM). Bank hit əldə etmək üçün: (A) bank-a real DİM məsələləri seed et, (B) Qat 1-də canonical normallaşdır, və ya (C) Qat 3 template regexlərini genişləndir. Tövsiyə: A (ən yüksək ROI).

# HANDOFF — növbə jurnalı

Cowork (BA/PO) ↔ Cursor və ya Claude Code (executor) arasındakı yeganə rabitə kanalı.
**Əlavə-only.** Köhnə blokları redaktə etmə və ya silmə. Ən yenisi yuxarıda.

## Format

```
## YYYY-MM-DD (N) · <Kim> → <Kimə>
    10|Etdim:    <bir-iki sətir, konkret fayl adları ilə>
Tapşırıq: <ClickUp ID + bir cümlə>
Diqqət:   <pozulmamalı olan şey, varsa>
Blok:     <qərar tələb edən şey, varsa — yoxdursa sətri yazma>
```

---

## 2026-09-10 (215) · Antigravity → Cowork
Etdim:    /learn əsasında daimi qaydalar və bacarıqlar yeniləndi: .agents/rules/10-web-ui.md (Math Keyboard Invariant və Empathetic Copy Invariant), .agents/rules/00-session.md (Stop Hook Guard intizamı), .agents/skills/student-reviewer/SKILL.md (mötərizə və dəyişən erqonomika meyarları); .cursor/skills/ ilə sinxronlaşdırıldı; 10 preflight testi keçdi.
    20|Tapşırıq: meta / no ClickUp — /learn Persistent Rules & Ergonomics Invariants.
Diqqət:   Stop hook-un turn sonlandırmasını bloklamaması üçün kod dəyişikliyindən sonra HANDOFF və LOG hər zaman əvvəlcədən yenilənir.

## 2026-09-10 (214) · Antigravity → Cowork
Etdim:    Şagird və Sokratik təhlil rəyləri implement edildi: MathKeyboardBar-a 'x' dəyişəni, '(' və ')' mötərizələri əlavə edildi (i18n ilə); errorRecorded bildirişi 'qeyd olundu, birlikdə düzəldəcəyik' olaraq humanistləşdirildi; onboarding headerLabel 'TANIŞLIQ' edildi; bütün 10 preflight testi keçdi.
Tapşırıq: meta / no ClickUp — Student Reviewer & Critical Thinker Ergonomics Hardening.
Diqqət:   MathKeyboardBar toxunma sahələri min 44px saxlanıldı, preventDefault ilə mobil klaviatura itkisi qarşısı qorundu.

## 2026-09-10 (213) · Antigravity → Cowork
Etdim:    Push & deploy doğrulaması və AG-009 tamamlandı: son 6 commit main-ə push edildi, GitHub CI (42s) və Vercel deploy (26s) Ready təsdiqləndi; AG-009 üzrə Antigravity üçün deklarativ subagent infrastrukturu (.agents/agents/*.md - reviewer, student_tester, ba_analyst, backend_dev, deploy_guard) quruldu, scripts/lib/agent-registry.mjs (5/5 pass) yazıldı, scripts/sync-agent-context.mjs ilə .cursor/agents/ sinxronlaşdırıldı, scripts/preflight.mjs 6-cı addım kimi əlavə olundu; docs/BACKLOG.md Complete edildi.
    30|Tapşırıq: AG-009 / no ClickUp — Antigravity Deklarativ Subagent Qeydiyyatı.
Diqqət:   Subagentlər define_subagent vasitəsilə aktivləşdirildi və invoke_subagent ilə birbaşa çağırıla bilər.

## 2026-09-10 (212) · Antigravity → Cowork
Etdim:    AG-007 DİM Dərslik Terminologiyası və Pedaqoji Lüğət tamamlandı: docs/DIM-GLOSSARY.md yaradıldı (Top 100 Do's & Don'ts matrisi, DİM standart əmr felləri, 10 Sokratik ipucu qəlibi, fənn terminləri); prompts/solve/core.md (v18, Qayda 18) dərslik dili və kalka qadağaları ilə yeniləndi; scripts/lib/glossary-linter.mjs linteri və 30/30 selftesti yaradıldı; scripts/preflight.mjs 5-ci addım olaraq inteqrasiya edildi; student-reviewer bacarığı lüğətə bağlandı və sinxronlaşdırıldı; docs/BACKLOG.md Complete edildi.
Tapşırıq: AG-007 / no ClickUp — DİM Dərslik Terminologiyası və Pedaqoji Lüğət.
Diqqət:   Token büdcəsini qorumaq üçün sistem promptuna yalnız ən kritik 10 kalka qaydası daxil edildi, tam 100+ maddəlik matris docs/DIM-GLOSSARY.md-də saxlanılır.

## 2026-09-10 (211) · Antigravity → Cowork
Etdim:    AG-005 Öz-Özünü Sağaldan Taksonomiya Triyajı tamamlandı: scripts/triage-taxonomy.mjs yaradıldı (lexical clustering, sinonim və domen analizi, --selftest, --save, --sql), .agents/skills/triage-taxonomy/SKILL.md və .cursor/skills/ sinxronlaşdırıldı, Supabase canlı v_taxonomy_review-dan 27 naməlum kod analiz edildi və rəsmi hesabat docs/reports/taxonomy-triage-2026-09-10.md çıxarıldı; scripts/preflight.mjs 8-ci addım kimi inteqrasiya olundu; docs/BACKLOG.md Complete edildi.
    40|Tapşırıq: AG-005 / no ClickUp — Self-Healing Taxonomy Triage Engine.
Diqqət:   VEC.OPERATIONS ➔ GEO.VECTORS və GEO.SOLID_CONE_VOLUME ➔ GEO.CONE_VOLUME kimi sinonim ziddiyyətləri aşkarlandı.

## 2026-09-10 (210) · Antigravity → Cowork
Etdim:    AG-004 hook təftişi və kritik xətaların aradan qaldırılması: PostToolUse daxilində TS6046 jsx tənzimləməsi düzəldildi (.ts fayllarında saxta sintaksis xətası aradan qaldırıldı), non-web fayllara (markdown/json) toxunarkən in-memory TS yoxlaması bloklandı, disk-fayl oxunması təmin edildi, read_file və private key (.key, .pem, id_rsa) mühafizəsi əlavə edildi, root guard.mjs proxy yaradıldı; scripts/hooks/guard.selftest.mjs 26/26 tam keçdi.
Tapşırıq: AG-004 / no ClickUp — Review & Hardening of Guard Hooks.
Diqqət:   Bütün 7 preflight yoxlaması (tsc, selftestlər, 26 hook testi, python eval) 100% keçdi.

## 2026-09-10 (209) · Antigravity → Cowork
Etdim:    AG-004 Hook Genişlənməsi tamamlandı: .agents/hooks.json və scripts/hooks/antigravity-guard.mjs daxilində PreInvocation (ADR-017 sızma qadağası və 3-hallı verification efemer xatırlatması) və PostToolUse (web/ fayllarında sürətli sintaksis və tip xətaları xəbərdarlığı) quruldu; scripts/hooks/guard.selftest.mjs (19/19 pass) yaradıldı və scripts/preflight.mjs mühərrikinə inteqrasiya olundu; docs/BACKLOG.md Complete edildi.
    50|Tapşırıq: AG-004 / no ClickUp — Hook Genişlənməsi (PreInvocation & PostToolUse).
Diqqət:   Protojson deserializasiyası üçün payload ciddi şəkildə { decision, reason } sxemində saxlanıldı. Bütün 7 preflight testi keçdi.

## 2026-09-10 (208) · Antigravity → Cowork
Etdim:    Backlog və avtomatlaşdırma alətləri: docs/BACKLOG.md yaradıldı (AG-001..AG-009 prioritetlər və statuslar ilə), scripts/preflight.mjs (.bat) 7 addımlı lokal test mühərriki və scripts/sync-agent-context.mjs sinxronizasiya skripti əlavə edildi. Bütün 7 pre-flight yoxlaması keçdi.
Tapşırıq: meta / no ClickUp — System Backlog Creation & Rapid Pre-Flight Tooling.
Diqqət:   Pre-flight tsc, selftestlər, hook və eval yoxlamasını 31 saniyədə uğurla tamamladı.

## 2026-09-10 (207) · Antigravity → Cowork
Etdim:    Agent kontekst modullaşdırma auditi və təkmilləşdirilməsi: 4 yeni skill yaradıldı (.agents/skills/ & .cursor/skills/ - critical-thinker, backend-developer, it-business-analyst, student-reviewer), push-verify və fix-lockfile sinxronlaşdırıldı, Antigravity iyerarxik qaydaları (.agents/rules/*.md) və aktiv həyat dövrü hook-u (.agents/hooks.json + scripts/hooks/antigravity-guard.mjs) quruldu, AGENTS.md və 99-agent-context yeniləndi.
    60|Tapşırıq: meta / no ClickUp — Agent Context Modularization Audit & Customizations Expansion.
Diqqət:   Antigravity və Cursor konfiqurasiyaları tam sinxronlaşdırıldı, npx tsc keçdi.

## 2026-08-26 (206) · Cursor → Cowork
Etdim:    Reviewer follow-up: 1-klik `InviteCheckResult` (`ok`/`invalid`/`already_used`/`network`); URL uğursuz olsa saxlanılmış kod silinmir (`bank`/`kamera`); 409 qapıda `already_used` mətnidir, generic invalid deyil.
Tapşırıq: meta / no ClickUp — invite funnel leftover.
Diqqət:   Şəbəkə xətasında `?invite=` URL-də qalır ki, yeniləmə təkrar cəhd etsin.

## 2026-08-26 (205) · Cursor → Cowork
Etdim:    Dəvət hunisi: `validateAndStoreInviteCode(code, deviceId)` InviteGate ilə eyni body (`url.ts`); `/bank?invite=` eyni helper; kamera `setSolution` `topicTitle` (API title və ya canonical). `url.selftest` extract 13/13 + body assert. Lokal `/api/invite/check` 500 (`DATABASE_URL` yoxdur) — 1-klik POST bank/kameradan gedir, qapı açıq qalır.
    70|Tapşırıq: meta / no ClickUp — invite funnel.
Diqqət:   `url.ts` `getDeviceId` import etmir. SolveView toxunulmayıb. Parent/resume yox.

## 2026-08-26 (204) · Cursor → Cowork
Etdim:    Reviewer follow-up: ana səhifədən «hamısı» linki silindi (`page.tsx` — profil tarixçə siyahısı vəd etmirdi); `clearInviteCode` `storage.ts` + `InviteGate` eyni `th_invite_code` açarını təmizləyir. Selftest keçdi.
Tapşırıq: meta / no ClickUp — hub honesty leftover.
Diqqət:   Fake `avgTime*` / `immediateAnswerCount` tiplərdə qalır (blitz). SolveView toxunulmayıb.

## 2026-08-26 (203) · Cursor → Cowork
Etdim:    Hub dürüstlüyü (blitz): onboarding ad+sinif (`onboarding/page.tsx`); lent/period/dil/fake 2:14 UI silindi (`page.tsx`, `StatCard`, `profil/page.tsx`); InviteGate «Ana səhifə» + `aria-label`; `topics.*` nöqtəli i18n silindi; `touchStreak` artıq `lastActiveDate` persist edir. `Role`/`Goal`/`Locale` tiplərdə qaldı. Selftest + `tsc` keçdi.
    80|Tapşırıq: meta / no ClickUp — hub honesty P0.
... 6913 lines not shown ...