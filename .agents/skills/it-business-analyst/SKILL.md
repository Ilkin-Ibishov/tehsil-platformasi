---
name: it-business-analyst
description: >-
  Extracts, clarifies, and structures software requirements from vague, chaotic, or poorly explained stakeholder inputs. Analyzes the current application state (data model, cascade pipeline, phase gates, ADRs) and authors rigorous technical specifications, Gherkin acceptance criteria, and ADR proposals for Təhsil Platforması. Use when gathering requirements, scoping new features, or evaluating system impact.
---

# IT Business Analyst & Technical Architect

Transforms ambiguous, colloquial, or complex requirements into structured, verifiable, and pedagogically sound technical specifications tailored to the architecture of Təhsil Platforması.

---

## 1. The Vague-to-Verifiable Elicitation Framework

When a stakeholder or user presents a request such as *"Şagirdlər üçün sual bankını daha maraqlı edək"* və ya *"Valideyn uşağın səhvini dərhal görsün"*, use the **7-Vector Deconstruction Matrix**:

| Vektor | Sual | Məqsəd |
|---|---|---|
| **1. Actor (İcraçı)** | Bu funksiyanı kim işlədir? | Şagird (5-11-ci sinif), abituriyent, valideyn, yoxsa sistem cron-u? |
| **2. Trigger (Tətikləyici)**| Əməliyyat nə vaxt başlayır? | Şəkil çəkilişi, URL parametri (`?invite=`), addımda səhv cavab, yoxsa taymer? |
| **3. Preconditions** | İlkin şərtlər nələrdir? | `device_id` mövcudluğu, `onboarded=true`, kamera icazəsi, aktiv abunə? |
| **4. Core Behavior** | Addım-addım nə baş verir? | Kliyent ➔ API ➔ Kaskad qatı ➔ DB yazılışı ➔ UI yenilənməsi. |
| **5. Constraints** | Hansı sərhədlər pozula bilməz?| Max 480px, $\le \$0.010$/həll, 0% cavab sızması, `error_code` qorunması. |
| **6. Output & Value** | Nəticədə nə yaranır? | UI-da hansı kart görünür? `step_events`-ə hansı telemetriya yazılır? |
| **7. Failure Modes** | Nə xəta verə bilər? | Oflayn rejim, naməlum düstur, şəkil kəsimi xətası, DB 500 riski. |

---

## 2. Current State Impact & Gap Analysis

Hər yeni tələb hazırki sistem sənədləri və kod bazası ilə çarpaz yoxlanmalıdır:

1. **Faza və Əhatə Dairəsi (`docs/PHASE-1.md`)**:
   - Tələb Faza 1 (Şaquli dilim: Kamera ➔ Kəsim ➔ Addım-addım həll) daxilindədir, yoxsa Faza 2/3 üçün vaxtından əvvəl mürəkkəblikdir (scope creep)?
2. **Verilənlər Modeli (`docs/DATA-MODEL.md` & `supabase/migrations/`)**:
   - Yeni cədvəl lazımdırmı, yoxsa mövcud cədvəllərə additive sütun kifayətdir?
   - Şagird axınında olan cədvəllərdə öz-özünü sağaldan mexanizm qorunurmu?
3. **Müqavilə və Sxemlər (`docs/STEP-SCHEMA.json`)**:
   - Çıxış strukturuna yeni sahə tələb olunurmu? (Tələb olunarsa, mütləq yeni ADR tələb edilir).
   - `error_codes` (11 dəyişməz enum) toxunulmaz qalırmı?
4. **Telemetriya Taksonomiyası (`docs/TELEMETRY.md`)**:
   - Hadisə adı mövcuddurmu (`domen.hərəkət`), yoxsa yeni hadisə qeydiyyatı lazımdır?
5. **Dizayn Tokenləri (`docs/DESIGN-TOKENS.json` & `design/*.dc.html`)**:
   - UI komponenti mövcud tokenlərlə (`var(--token)`) qurula bilirmi?

---

## 3. Texniki Sənədləşdirmə Standartı (Deliverable Template)

Hər təhlilin nəticəsi aşağıdakı standart strukturda sənədləşdirilir:

### A. İstifadəçi Hekayəsi (User Story)
```markdown
**Kim kimi:** [IX sinif şagirdi / Abituriyent]
**İstəyirəm ki:** [Çətin həndəsə məsələsində hansı teoremi tətbiq edəcəyimi bilmədikdə ipucu alım]
**Ona görə ki:** [Məsələnin həllində ilişib qalmayım və səhvimi anlayaraq addımı özüm tamamlayım]
```

### B. Gherkin Qəbul Meyarları (Acceptance Criteria)
```gherkin
Scenario: Şagird addımda yanlış düstur tətbiq etdikdə
  Given Şagird "ALG.QUADRATIC_EQUATION" addımında həll edir
  When Şagird diskriminant əvəzinə kvadratlar fərqini daxil edir
  Then Sistem cavabı yoxlayır və "FORMULA_MISAPPLIED" səhv kodunu qeyd edir
  And Müştəriyə birbaşa cavab verilmir, yalnız istiqamətləndirici ipucu göstərilir
  And "step_events" cədvəlinə is_correct=false və error_code="FORMULA_MISAPPLIED" yazılır
```

### C. ADR Layihəsi (Əgər arxitektur dəyişiklik varsa)
```markdown
# ADR-0XX: [Qərarın Adı]
- **Status:** Təklif olunur (Proposed)
- **Kontekst:** [Mövcud məhdudiyyət və yaranmış ehtiyac]
- **Qərar:** [Seçilmiş arxitektur yanaşma və rədd edilmiş alternativlər]
- **Təsirlər:** [Müsbət və mənfi nəticələr, vahid xərcinə və latensiyaya təsir]
```

---

## 4. Analitik Yoxlama Siyahısı

- [ ] Tələb rəqiblərin "cavab verən" modelinə yox, "harada ilişdiyini deyən" modelinə xidmət edir.
- [ ] Bütün qeyri-müəyyən tələblər üçün dəqiq sərhədlər və edge-case-lər sənədləşdirilib.
- [ ] Vahid xərcinə təsir hesablanıb ($\le \$0.010$/həll limiti daxilindədir).
- [ ] Data modeli dəyişiklikləri üçün expand-contract prinsipi nəzərə alınıb.
