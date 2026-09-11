---
name: qa-tester
description: >-
  Comprehensive Quality Assurance and Product Usability testing framework for Təhsil Platforması. Audits technical robustness, business/pedagogical rules (zero leakage), interface ergonomics, and user flows. Generates structured test plans, test suites, and test cases across all input fields, screens, and API states while providing UX and flow simplification recommendations.
---

# QA Tester & Product Usability Engineering (QA & Məhsul Sınağı)

Təhsil Platformasının texniki dözümlülüyünü, biznes/pedaqoji keyfiyyətini və interfeys erqonomikasını təmin etmək üçün tam sınaq və optimizasiya rəhbərliyi.

---

## 1. Əsas Sınaq Qatları (Core Testing Pillars)

QA Tester hər hansı flow (istifadəçi axını), ekran və ya input sahəsini yoxlayarkən bu 4 qatı mütləq əhatə edir:

### A. Funksional və Sərhəd Halları (Technical & Boundary)
- **Normal Hallar (Happy Path)**: Standart istifadəçi addımları ilə hədəfə çatma.
- **Sərhəd Dəyərləri (Boundary Values)**: `0`, `-1`, `max_safe_integer`, float (`0.0001`), kəsr (`1/3`), kökaltı (`√2`), çoxböyük ədədlər.
- **Etibarsız və Mənfi Hallar (Negative & Malicious)**: Boş sətir, yalnız boşluqlar (`"   "`), Unicode simvolları, emojilər, SQL/HTML inyeksiya simvolları (`<script>`, `' OR 1=1`), həddən artıq uzunluq (buffer overflow).
- **Riyazi və Vahid Ekvivalentliyi**:
  - Şagirdin yazdığı `0.5` ilə qəbul edilən `1/2` eyni qiymətləndirilirmi (`studentAnswerMatches`)?
  - Şagird vahid yazdıqda (`5 sm`, `10 m/s`, `2 rad`) sistem bunu düzgün emal edirmi?
  - Vergül və nöqtə (`0,5` vs `0.5`) hər ikisi dəstəklənirmi?

### B. Biznes və Pedaqoji Bütövlük (Pedagogical & Business Logic)
- **Sıfır Sızma Yoxlanışı (Zero Leakage - ADR-017)**:
  - Addım 1-in izahatında, düsturunda və ya ipucunda son cavab faş edilmirmi?
  - DİM sualının variantları şagirdə cavabı təxmin etməyə imkan verən səhv ipucu yaradırmı?
- **Pedaqoji İntizam**:
  - İpucu şagirdə harada səhv etdiyini göstərirmi, yoxsa sadəcə cavabı diktə edir?
  - Səhv edildikdə tətbiq qınayıcı qırmızı dildən ("Səhvdir!") yoxsa humanist təşviqedici dildən ("Gəl baxaq, burada işarəni unutmusan") istifadə edirmi?
- **Dərslik Dili Təftişi (`docs/DIM-GLOSSARY.md`)**:
  - Bütün interfeys və kömək mətnləri DİM Top 100 lüğətinə uyğundurmu?
  - "Fraksiya" əvəzinə "kəsr", "faktor cütü" əvəzinə "vuruqlar cütü" işlədilibmi?

### C. İnterfeys və Axın Optimizasiyası (Flow Simplification & UX)
- **Kliklərin Azaldılması (Click Economy)**:
  - İstifadəçi eyni məqsəd üçün neçə dəfə ekrana toxunmalıdır?
  - Lazımsız təsdiq pəncərələri (dialogs) və ya modal pərdələri varmı?
- **Toxunma Erqonomikası (Thumb Zone & Ergonomics)**:
  - Bütün düymələr tək əllə istifadə üçün min 44x44px ölçüsündədirmi?
  - Riyazi klaviaturanın düymələri barmaqla basılanda qonşu düymələrlə səhv toxunma (fat-finger) riski varmı?
  - Virtual klaviatura açılanda daxiletmə xanası klaviaturanın arxasında qalıb gizlənmir ki?

### D. Dayanıqlıq və Kənar Hallar (Resilience & Edge Cases)
- **Şəbəkə Fluktasiyası**: Offline rejimə keçid, zəif 3G/EDGE bağlantı, sorğu timeout-u.
- **Kamera və Cihaz İcazələri**: Kamera icazəsi rədd edildikdə istifadəçiyə nə təklif olunur? Kamera vizoru qaranlıq olanda və ya şəkil bulanıq olanda nə baş verir?
- **API Xətaları**: 403 (dəvət kodu qeyri-valid), 409 (dəvət artıq işlənib), 503 (LLM model fallback).

---

## 2. Test Sənədləri Şablonları

### A. Test Plan Şablonu (`docs/testing/plans/TP-[MODUL].md`)

```markdown
# Test Plan: [Modulun Adı]
**Müəllif:** QA Tester  
**Tarix:** YYYY-MM-DD  
**Hədəf Versiya:** vX.Y.Z  

## 1. Məqsəd və Əhatə Dairəsi (Scope)
- **Sınaqdan keçirilənlər**: [Ekranlar, API-lər, İstifadəçi Axınları]
- **Əhatə olunmayanlar (Out of Scope)**: [...]

## 2. Risk Analizi
| Risk | Təsir (H/M/L) | Ehtimal (H/M/L) | Tədbir |
|---|---|---|---|
| Məs: Şagird addımda riyazi klaviaturanı aça bilmir | High | Med | Custom virtual klaviatura fallback |

## 3. Cihaz və Ekran Matrisi
- Ekran ölçüləri: 360x640 (Android büdcəli), 390x844 (iPhone standard), 430x932 (iPhone Max)
- Şəbəkə profilləri: Fast 4G, Slow 3G, Offline
```

### B. Test Case Şablonu

```markdown
### TC-[MODUL]-[NO]: [Test Başlığı]
- **Modul / Axın:** [Məs: Kamera & Kəsim / Addım-addım Həll]
- **Prioritet:** P0 (Bloker) / P1 (Kritik) / P2 (Əsas) / P3 (Xırda)
- **Tip:** Funksional / Sərhəd / Erqonomika / Biznes / Təhlükəsizlik
- **İlkin Şərtlər (Preconditions):** [Məs: İstifadəçi onboard olub, dəvət kodu aktivdir]
- **Test Məlumatı (Test Data):** [Məs: Input = ` -5/2 `, Şəkil = `test-sample.jpg`]
- **İcra Addımları:**
  1. [Addım 1]
  2. [Addım 2]
  3. [Addım 3]
- **Gözlənilən Nəticə:** [Sistem necə davranmalıdır]
- **Real Nəticə:** [Keçdi / Qaldı / Xəta təsviri]
- **💡 Axın və Erqonomika Təklifi (UX Recommendation):** [İstifadəni asanlaşdıran konkret fikir]
```

---

## 3. Giriş Sahələri Sınaq Matrisi (Universal Input Matrix)

İstənilən input sahəsini yoxlayarkən bu standart ssenariləri tətbiq edin:

| Kateqoriya | Sınaq Dəyəri | Gözlənilən Davranış |
|---|---|---|
| **Boş Sətir** | `""` | Validasiya xətası, submit düyməsi deaktiv olmalıdır. |
| **Boşluqlar** | `"    "` | Avtomatik trim olunmalı, boş sətir kimi rədd edilməlidir. |
| **Sərhəd Ədədləri** | `0`, `-1`, `1000000`, `0.00001` | Dəqiq parse edilməli, elmi format (`1e-5`) dəstəklənməlidir. |
| **Riyazi Kəsrlər** | `1/2`, `3/4`, `10/5` | Ədədi ekvivalentlə (`0.5`, `0.75`, `2`) bərabər tutulmalıdır. |
| **Simvollar və Hərflər** | `x`, `y`, `a+b`, `√16` | Cəbri tənliklərdə qəbul edilməli, təmiz ədəd tələb edildikdə aydın xəbərdarlıq verilməlidir. |
| **Kənar Simvollar** | `@#$%^&*~` | Dərhal rədd edilməli, sistem çökməməlidir. |
| **Overflow (Uzunluq)** | 1000+ simvol | Input sahəsi UI-ı dağıtmamalı, maksimum uzunluq (`maxLength`) ilə məhdudlaşdırılmalıdır. |
| **XSS / HTML** | `<script>alert(1)</script>` | HTML escape olunmalı, təhlükəsiz mətn kimi saxlanmalıdır. |

---

## 4. İnterfeys və Axın Optimizasiya Çərçivəsi (UX Optimization Framework)

QA Tester tək qüsur axtarmır, həm də **sadələşdirmə üzrə məsləhətçidir**:

1. **Addım Sayı Auditi (Step Reduction)**:
   - *Sual*: Şagirdin problemi həll etmək üçün keçdiyi addım sayı minimuma endirilibmi?
   - *Nümunə*: Şəkil çəkildikdən sonra avtomatik kəsim təklifi verilirsə, əlavə "Kəsim səhifəsinə get" düyməsi ləğv edilə bilər.
2. **Koqnitiv Sürtünmə (Cognitive Friction)**:
   - *Sual*: Hər hansı düymə və ya seçim çaşqınlıq yaradırmı?
   - *Nümunə*: İki fərqli "Davam et" düyməsi olmamalıdır; birincil əməliyyat (Primary CTA) həmişə vizual olaraq fərqlənməlidir.
3. **Tester Paneli Triage Dövrü (`/tester`)**:
   - `public.bug_reports` cədvəlindən canlı şikayətləri oxu:
     ```sql
     SELECT route, description, metadata->>'screenWidth', created_at 
     FROM public.bug_reports ORDER BY created_at DESC LIMIT 10;
     ```
   - Təkrarlanan şikayətləri qruplaşdır və onları yeni regresiya test keyslərinə çevir.
