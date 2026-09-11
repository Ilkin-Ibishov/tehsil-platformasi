# QA Testing Framework & Quality Standards

Bu sənəd Təhsil Platformasında hər bir funksionallıq, istifadəçi axını (flow), ekran (UI) və daxiletmə sahəsi (input field) üçün vahid QA sınaq çərçivəsini və keyfiyyət standartlarını müəyyən edir.

---

## 1. QA Rolunun Missiyası və Öhdəlikləri

`qa_tester` rolu platformada 3 əsas hədəfə xidmət edir:
1. **Texniki Dözümlülük (Robustness)**: Sərhəd dəyərləri, qeyri-valid girişlər, şəbəkə kəsilmələri və API xətaları qarşısında tətbiqin çökməməsi.
2. **Biznes və Pedaqoji Uyğunluq**: Sıfır sızma (ADR-017), DİM dərslik dili (`DIM-GLOSSARY.md`), şagirdin cavab əvəzinə düşünməyə təşviq edilməsi.
3. **İnterfeys və Axın Optimizasiyası**: Kliklərin minimuma endirilməsi, toxunma erqonomikası (min 44px), mobil klaviatura toqquşmasının aradan qaldırılması.

---

## 2. Universal Sınaq Matrisi (Testing Matrix)

Platformanın hər bir komponenti aşağıdakı 5 əsas axın üzrə sınaqdan keçirilir:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ 1. Giriş/Dəvət  │ ──► │ 2. Kamera/Vizor │ ──► │ 3. Kəsim/Crop   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ 5. Tester Paneli│ ◄── │ 4. Addım Həlli  │ ◄── │ 3b. Solve/Kaskad│
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Axın 1: Dəvət və Onboarding Axını (`/` və `/onboarding`)
- **TC-INV-01**: Linkdə `?invite=valid-code` ilə gəliş — kod avtomatik localStorage-a yazılır, URL təmizlənir, birbaşa ana səhifə açılır.
- **TC-INV-02**: İstifadə olunmuş dəvət kodu — 409 statusu `already_used` kimi göstərilir, mövcud işlək dəvət silinmir.
- **TC-INV-03**: Qeyri-valid dəvət kodu — 403 statusu nəzakətlə izah olunur.
- **TC-INV-04**: Onboarding adı və sinfi — 5-11-ci sinif seçimi, adın daxil edilməsi və `touchStreak` yadda saxlanması.

### Axın 2: Kamera və Vizor Axını (`/kamera`)
- **TC-CAM-01**: Kamera icazəsi tələbi və qəbulu.
- **TC-CAM-02**: Kamera icazəsi rədd edildikdə fayl yükləmə (gallery picker) alternativi.
- **TC-CAM-03**: Çərçivənin (vizor) DİM test toplusu sualına uyğunluğu.
- **TC-CAM-04**: Zəif işıq / çox böyük təsvir (>1600px) — müştəri tərəfdə sıxılma və göndərmə.

### Axın 3: Kəsim və Ön Emal Axını (`/kamera/kesim`)
- **TC-CRP-01**: Kəsim çərçivəsinin barmaqla rahat böyüdülüb kiçildilməsi.
- **TC-CRP-02**: Çox kiçik kəsim (<50px) — istifadəçiyə sualı tam əhatə etmək barədə xəbərdarlıq.
- **TC-CRP-03**: Tək toxunuşla "Həll et" keçidi.

### Axın 4: Addım-addım Həll Axını (`/solve`)
- **TC-SLV-01 (Happy Path)**: Qat 1 OCR ➔ Qat 3/5 Həll ➔ Addım 1 sualının göstərilməsi.
- **TC-SLV-02 (Riyazi Daxiletmə)**: Şagirdin `0.5`, `1/2`, `x=2`, `-3` kimi riyazi cavablarının `studentAnswerMatches` ilə tam ekvivalent yoxlanması.
- **TC-SLV-03 (Vahid Sınağı)**: `5 sm`, `10 m/san` kimi cavablardan vahidin çıxarılıb rəqəmin yoxlanması.
- **TC-SLV-04 (Zero Leakage - P0 Bloker)**: Addım 1-in izahında və ya ipucunda son cavabın faş edilməməsi (ADR-017).
- **TC-SLV-05 (İpucu Məntiqi)**: İpucunun ardıcıl açılması və humanist ton.
- **TC-SLV-06 (Klaviatura Erqonomikası)**: MathKeyboardBar (`x`, `(`, `)`, `√`, `²`, `±`, `/`, `π`) düymələrinin min 44px olması və cavab sahəsini örtməməsi.

### Axın 5: Tester İdarəetmə Paneli (`/tester` və Floating Panel)
- **TC-TST-01**: `/tester` səhifəsində rejimin aktiv/deaktiv edilməsi (`localStorage.TESTER_MODE`).
- **TC-TST-02**: Floating 🐞 düyməsi yalnız tester rejimində görünür.
- **TC-TST-03**: Problem göndərilərkən `device_id`, `route`, `screenWidth`, `userAgent` və `localStorage` dump-ının avtomatik toplanması.
- **TC-TST-04**: Supabase `public.bug_reports` cədvəlinə uğurlu yazılış.

---

## 3. Giriş Sahələri (Input Fields) Sınaq Qaydası

Hər bir daxiletmə sahəsi üçün standart cədvəl:

| Test ID | Sınaq Girişi | Tip | Gözlənilən Nəticə |
|---|---|---|---|
| **INP-01** | `""` (boş sətir) | Boundary | Submit deaktiv və ya "Daxil edin" bildirişi |
| **INP-02** | `"   "` (boşluqlar) | Boundary | Avtomatik trim, boş kimi rədd |
| **INP-03** | `0` | Boundary | Qəbul edilməli (əgər 0 məqbul cavabdırsa) |
| **INP-04** | `-5` | Boundary | Mənfi işarə (`-` və ya `−`) düzgün qəbul olunmalı |
| **INP-05** | `1/2` və `0.5` | Equivalence | Hər ikisi eyni dərəcədə düzgün sayılmalı |
| **INP-06** | `x = 8` və `x=8` | Formatting | Boşluqlar nəzərə alınmamalı |
| **INP-07** | `<script>alert(1)</script>` | Security | HTML escape olunmalı, təhlükəsiz saxlanmalı |
| **INP-08** | 500+ simvol | Stress | UI dağılmamalı, simvol limiti qorunmalıdır |

---

## 4. Şagird və Axın Optimizasiya Qiymətləndirməsi (UX Scoring)

Hər sınaqdan sonra QA Tester aşağıdakı meyarlar üzrə optimizasiya rəyi təqdim edir:

1. **Klik Effektivliyi (Click Economy)**:
   - Şagird məqsədinə minimum addımla çatırmı?
   - Harada artıq toxunuşlar və ya tərəddüdlər var?
2. **Koqnitiv Yük (Cognitive Load)**:
   - Sual və ya seçim şagird üçün dərhal anlaşılandır, yoxsa fikirləşməyə məcbur edir?
3. **Erqonomika (Touch & Reach)**:
   - Əsas əməliyyat düyməsi (Primary CTA) baş barmağın rahat çatdığı alt zonadadırmı?
