# Test Plan: İlkin Quraşdırma və Tanışlıq Axını (TP-ONBOARDING)

**Müəllif:** QA Tester & Product Usability Engineering  
**Tarix:** 2026-09-11  
**Hədəf Versiya:** v0.1.0 (Faza 1)  
**Tətbiq Sahəsi:** `web/app/onboarding/page.tsx`, `web/app/page.tsx`, `web/app/profil/page.tsx`, `web/lib/profile/storage.ts`

---

## 1. Məqsəd və Əhatə Dairəsi (Scope)

### A. Sınaqdan Keçirilənlər (In-Scope)
- **İstifadəçi Axınları (User Flows)**:
  - İlk dəfə gələn şagirdin quraşdırma axını (`/` ➔ `/onboarding` ➔ `/`).
  - Quraşdırmanı atlama ("keç") ssenarisi.
  - Profil səhifəsindən yenidən quraşdırma axını (`/profil` ➔ `/onboarding` ➔ `/`).
  - Dərin linklərlə daxilolma (`/kamera`, `/bank`, `/test`).
- **Giriş Sahələri (Universal Input Matrix)**:
  - Ad daxiletmə sahəsi (`fullName`): boş sətir, boşluqlar, uzunluq həddi, XSS, simvollar, Azərbaycan hərfləri (`ə, ı, ö, ğ, ç, ş, ü, İ`).
- **Sinif və Ton Seçimi**:
  - 5–11-ci sinif düymələri, vizual ton (`genc`/`yetkin`) və pedaqoji ton (`dostyana`/`yetkin`/`qisa`) sinxronizasiyası.
- **Naviqasiya və Tarixçə**:
  - Brauzer və Android "Geri" düyməsi, tarixçə dövriyyəsi (navigation loop).
- **Telemetriya və Müşahidə**:
  - PostHog hadisələri, `app.opened` soyuq başlanğıc siqnalları.

### B. Əhatə Olunmayanlar (Out-of-Scope)
- Kamera vizorunda şəklin çəkilməsi (TP-CAMERA-da əhatə olunur).
- Dəvət kodlarının kriptoqrafik generasiyası.

---

## 2. Risk Analizi

| Risk İdentifikatoru | Təsir | Ehtimal | Təsvir və Tədbir |
|---|---|---|---|
| **R-ONB-01 (P0)** | Yüksək (High) | Yüksək (High) | **"Keç" tələsi**: 11-ci sinif şagirdi və ya 5-ci sinif şagirdi "keç" vurduqda xəbərdarlıqsız 9-cu sinif edilir; həll bazası və izah səviyyəsi pozulur. |
| **R-ONB-02 (P1)** | Yüksək (High) | Orta (Med) | **Tarixçə tələsi (`router.push`)**: Onboarding bitdikdən sonra ana ekranda Android geri jesti edən şagird yenidən onboarding-ə düşür. `router.replace` zəruridir. |
| **R-ONB-03 (P1)** | Yüksək (High) | Yüksək (High) | **Telemetriya korluğu**: Onboarding üçün heç bir PostHog hadisəsi yoxdur; ilk dəfə gələn istifadəçilər tərk etdikdə analitikada tam görünməz qalır. |
| **R-ONB-04 (P1)** | Yüksək (High) | Yüksək (High) | **Pedaqoji ton uyğunsuzluğu**: 5-ci sinif şagirdinə vizual ton "genc" verilsə də, `pedagogicalTone` "yetkin" (DİM akademik müəllim) qalır; şagird üçün izah çox sərtdir. |
| **R-ONB-05 (P2)** | Orta (Med) | Yüksək (High) | **Giriş sahəsində məhdudiyyətin olmaması**: `maxLength` yoxdur, 500+ simvollu ad bütün ana ekranı və profil başlıqlarını dağıdır. |
| **R-ONB-06 (P2)** | Orta (Med) | Orta (Med) | **Yenidən onboarding məlumat itkisi**: `/profil`-dən "Quraşdırmanı yenidən keç" vurduqda mövcud ad və sinif formadan silinir, default 9-a qayıdır. |

---

## 3. Cihaz və Ekran Matrisi

- **Büdcəli Android (360x640px / 375x667px)**: Redmi 9A, Samsung Galaxy A12 (azərbaycanlı şagirdlərin böyük hissəsi). Virtual klaviatura açıldıqda ekran hündürlüyü 320px-ə enir.
- **Standart iPhone (390x844px)**: iPhone 13/14/15, Safari auto-zoom (font < 16px) və home bar safe area (`env(safe-area-inset-bottom)`).
- **Böyük Ekran (430x932px)**: iPhone 15 Pro Max, tək əllə istifadədə yuxarı künc "Thumb Zone" kənarındadır.

---

## 4. Test Keysləri və Sınaq Nəticələri (TC-ONB-01 .. TC-ONB-15)

### TC-ONB-01: Standart Onboarding Axını (Happy Path)
- **Tip:** Funksional
- **Prioritet:** P0
- **İlkin Şərt:** Təmiz `localStorage` (`th_onboarded` yoxdur).
- **Addımlar:**
  1. `/` səhifəsinə daxil ol.
  2. Sistem `/onboarding`-ə yönləndirir.
  3. "Adın və Soyadın nədir?" sahəsinə "Aysel" yaz və "Davam et →" düyməsinə bas.
  4. Sinif seçimində "9" seç və "Başla →" düyməsinə bas.
- **Gözlənilən Nəticə:** `localStorage`-da `th_user_fullname="Aysel"`, `th_grade="9"`, `th_onboarded="true"` yazılır. İstifadəçi `/` səhifəsinə yönlənir, başlıqda "Salam, Aysel!" çıxır.
- **Real Nəticə:** ✅ KEÇDİ.

---

### TC-ONB-02: Ad Sahəsini Boş Buraxıb Keçmək
- **Tip:** Sərhəd / Erqonomika
- **Prioritet:** P1
- **Addımlar:**
  1. Step 1-də ad yazmadan birbaşa "Davam et →" bas.
  2. Step 2-də sinif seçib "Başla →" bas.
- **Gözlənilən Nəticə:** Ad boş buraxıldıqda sistem bunu qəbul edir, ana ekranda fərdi ad əvəzinə "Xoş gəldin!" göstərilir.
- **Real Nəticə:** ⚠️ KEÇDİ, LAKİN QEYRİ-MÜƏYYƏNDİR: Ekranda adın məcburi və ya ixtiyari olduğu qeyd edilməyib. Şagird ad yazmadan keçə biləcəyini ancaq yoxlayaraq öyrənir.

---

### TC-ONB-03: Yalnız Boşluqlardan İbarət Ad Daxiletməsi
- **Tip:** Mənfi (Negative) / Sərhəd
- **Prioritet:** P2
- **Test Məlumatı:** `fullName = "     "`
- **Addımlar:**
  1. Ad sahəsinə 5 boşluq yaz və "Davam et →" bas.
  2. Quraşdırmanı tamamla.
- **Gözlənilən Nəticə:** `fullName.trim()` icra olunmalı, ad boş string kimi saxlanmalı, ana ekranda tək "Salam, !" çıxmamalıdır.
- **Real Nəticə:** ✅ KEÇDİ. `persistAndGo` daxilində `name.trim()` çağırılır və `firstName` boş string olduqda "Xoş gəldin!" fallback işləyir.

---

### TC-ONB-04: Həddindən Artıq Uzun Ad (Buffer Overflow & UI Break)
- **Tip:** Sərhəd / Təhlükəsizlik
- **Prioritet:** P1
- **Test Məlumatı:** 500 simvol uzunluğunda mətn (`"Aysel_Məmmədova_"...`).
- **Addımlar:**
  1. Input sahəsinə 500 simvollu mətn yapışdır.
  2. Quraşdırmanı bitirib `/` və `/profil` səhifələrinə bax.
- **Gözlənilən Nəticə:** Input sahəsində `maxLength` (məs: 50) olmalı, 50-dən artıq simvol kəsilməlidir. UI elementləri (kartlar, başlıqlar) ekrandan kənara çıxmamalıdır.
- **Real Nəticə:** ❌ UĞURSUZ (BUG-ONB-01). `<input>` elementində heç bir `maxLength` təyin edilməyib. 500 simvollu ad ana səhifədə salamlaşmanı və profil səhifəsində sinif nişanını (`gradeBadge`) ekrandan sağa itələyib üfüqi sürüşmə (horizontal scroll) yaradır.

---

### TC-ONB-05: XSS və HTML İnjeksiya Girişi
- **Tip:** Təhlükəsizlik
- **Prioritet:** P1
- **Test Məlumatı:** `<script>alert('XSS')</script><b>Test</b>`
- **Addımlar:**
  1. Ad sahəsinə script tagı daxil et və yadda saxla.
  2. Ana ekran, profil və paylaşım kartında renderi yoxla.
- **Gözlənilən Nəticə:** XSS icra olunmamalı, HTML tagları təmiz mətn kimi escape edilməlidir.
- **Real Nəticə:** ✅ KEÇDİ. React JSX daxilində string render edildiyi üçün taglar literal mətn kimi çıxır, icra olunmur. Lakin ad sahəsində xüsusi tag simvollarının saxlanması gigiyenik deyil.

---

### TC-ONB-06: Azərbaycan Əlifbası Böyük Hərf Registri (i / İ, ı / I)
- **Tip:** Dil və Orfoqrafiya
- **Prioritet:** P2
- **Test Məlumatı:** `fullName = "ilkin işıq"`
- **Addımlar:**
  1. Adı "ilkin işıq" kimi daxil et.
  2. Profil səhifəsini (`/profil`) aç və yuxarı başlıqdakı ada bax.
- **Gözlənilən Nəticə:** Azərbaycan əlifbasına uyğun olaraq "İLKİN İŞIQ" yazılmalıdır.
- **Real Nəticə:** ❌ UĞURSUZ (BUG-ONB-02). `web/app/profil/page.tsx` sətir 106-da `profile.fullName.toUpperCase()` yazılıb. Sistem standartı ingilis dili olan mühitlərdə bu, **"ILKIN IŞIQ"** (nöqtəsiz I) kimi səhv çevrilir. `.toLocaleUpperCase("az")` istifadə edilməlidir.

---

### TC-ONB-07: Step 1-də "Keç" (Skip) Düyməsi Davranışı
- **Tip:** Biznes Məntiqi / Erqonomika
- **Prioritet:** P0 (Kritik)
- **Addımlar:**
  1. Tətbiqi açan kimi sağ yuxarıdakı "keç" düyməsinə toxun.
- **Gözlənilən Nəticə:** Şagird dərhal ana ekrana keçir. Əgər sinif soruşulmayıbsa, ona default bir sinif verilməməli və ya ana səhifədə bildiriş çıxmalıdır. Ən əsası: 11-ci sinif şagirdi xəbəri olmadan 9-cu sinif edilməməlidir.
- **Real Nəticə:** ❌ UĞURSUZ (BUG-ONB-03). Kod birbaşa `persistAndGo(fullName.trim(), 9)` çağırır. Şagirdin heç bir fikri olmadan sinif **9** edilir.

---

### TC-ONB-08: Step 2-də "Keç" Düyməsi Davranışı (Seçilmiş Sinfin İtirilməsi)
- **Tip:** Funksional / Data Bütövlüyü
- **Prioritet:** P0 (Kritik)
- **Addımlar:**
  1. Step 1-də adını "Kənan" yaz, "Davam et" vur.
  2. Step 2-də "11" sinfini seç.
  3. Aşağıdakı "Başla" əvəzinə yuxarı sağ küncdəki "keç" düyməsinə toxun.
- **Gözlənilən Nəticə:** Şagird artıq 11-ci sinfi seçdiyi üçün sistem 11-ci sinfi yadda saxlamalıdır.
- **Real Nəticə:** ❌ UĞURSUZ (BUG-ONB-04). `handleSkip()` funksiyası state-dəki `grade`-ə baxmır, sabit `9` göndərir! 11-ci sinif şagirdinin seçimi silinib 9 edilir.

---

### TC-ONB-09: Sinif Seçildikdə Pedaqoji Tonun İtkin Düşməsi
- **Tip:** Pedaqoji Uyğunluq
- **Prioritet:** P1
- **Addımlar:**
  1. Sinif seçimində "5"-ci sinfi seç və quraşdırmanı bitir.
  2. `localStorage`-da `th_visual_tone` və `th_pedagogical_tone` yoxla.
- **Gözlənilən Nəticə:** 5-ci sinif üçün həm vizual ton "genc" olmalı, həm də pedaqoji izah tonu "dostyana" (həvəsləndirici, sadə dil) olmalıdır.
- **Real Nəticə:** ❌ UĞURSUZ (BUG-ONB-05). `storage.ts` `visualTone`-u avtomatik `genc` edir, lakin `pedagogicalTone` standart `"yetkin"` qalır. Nəticədə 5-ci sinif şagirdi uşaq interfeysində sərt DİM akademik üslublu riyazi izahlar alır.

---

### TC-ONB-10: Mobil Klaviatura və Avtomatik Fokuslanma
- **Tip:** Erqonomika / Mobil UX
- **Prioritet:** P1
- **Cihaz:** Kiçik ekranlı Android (Redmi 9A).
- **Addımlar:**
  1. `/onboarding` səhifəsini aç.
- **Gözlənilən Nəticə:** İstifadəçi əvvəlcə qarşılama mətnini və səhifəni bütöv görməli, input sahəsinə toxunduqda klaviatura açılmalı və klaviaturanın sağ alt düyməsi "İrəli/Sonrakı" göstərməlidir.
- **Real Nəticə:** ❌ UĞURSUZ (BUG-ONB-06). `<input autoFocus ... />` səbəbindən zəif telefonlarda səhifə açılan kimi ekran yuxarı atılır və klaviatura açılır; şagird başlıq mətnini görmür. Həmçinin `autoCapitalize="words"`, `autoComplete="name"`, `enterKeyHint="next"` atributları olmadığı üçün klaviatura kiçik hərflə başlayır və "Next" əvəzinə "Enter" göstərir.

---

### TC-ONB-11: Naviqasiya Tarixçəsi Tələsi (`router.push` vs Android Back)
- **Tip:** Mobil Naviqasiya / Dözümlülük
- **Prioritet:** P1
- **Addımlar:**
  1. Onboarding axınını tamamla və `/` ana səhifəsinə gəl.
  2. Telefonun hardware və ya jest "Geri" düyməsini sıx.
- **Gözlənilən Nəticə:** Tətbiq arxa plana keçməli və ya bağlanmalıdır (çünki ana səhifə kök səhifədir).
- **Real Nəticə:** ❌ UĞURSUZ (BUG-ONB-07). Onboarding səhifəsində `router.push("/")` istifadə edildiyi üçün `/onboarding` tarixçə yığınında qalır. "Geri" basıldıqda istifadəçi yenidən Onboarding Step 1-ə qayıdır və tətbiq artıq tamamlanmış quraşdırmanı yenidən göstərir!

---

### TC-ONB-12: Profil Səhifəsindən Quraşdırmanı Yenidən Keçərkən Məlumat Silinməsi
- **Tip:** Funksional / Data Bütövlüyü
- **Prioritet:** P2
- **İlkin Şərt:** İstifadəçi adı: "Rauf Əliyev", Sinfi: 11.
- **Addımlar:**
  1. `/profil` səhifəsinə get.
  2. "Quraşdırmanı yenidən keç" düyməsinə bas.
  3. `/onboarding` səhifəsi açılır.
- **Gözlənilən Nəticə:** Mövcud ad ("Rauf Əliyev") input sahəsində görünməli, 11-ci sinif düyməsi aktiv olmalıdır.
- **Real Nəticə:** ❌ UĞURSUZ (BUG-ONB-08). `OnboardingPage` daxilində `useState<string>("")` və `useState<number>(9)` hardcode edildiyindən, şagirdin adı boşalır və sinfi 9-a sıfırlanır. Əgər şagird adını dəyişmək istəməyib birbaşa irəli getsə, adı silinir.

---

### TC-ONB-13: Dərin Linklə Onboarding-in Yanından Keçmə (Bypass)
- **Tip:** Təhlükəsizlik / Axın İntizamı
- **Prioritet:** P2
- **Addımlar:**
  1. Təmiz brauzerdə birbaşa `http://localhost:3000/kamera` və ya `/bank` linkini aç.
- **Gözlənilən Nəticə:** Əgər istifadəçi onboarding keçməyibsə, vahid təcrübə üçün onboarding-ə yönləndirilməlidir.
- **Real Nəticə:** ⚠️ QƏBUL EDİLİR (Dizayn qərarı). `hub-honesty.md` qərarına əsasən dərin linklər onboarding-i məcbur etmir; lakin bu halda profil default 9-cu siniflə işləyir.

---

### TC-ONB-14: Telemetriya Korluğu (Zero PostHog Events)
- **Tip:** Telemetriya və Analitika
- **Prioritet:** P1
- **Addımlar:**
  1. Onboarding səhifəsini aç, addımları keç, tamamla və ya atla.
  2. PostHog hadisələrini yoxla.
- **Gözlənilən Nəticə:** `onboarding.started`, `onboarding.step_completed`, `onboarding.skipped`, `onboarding.completed` hadisələri atılmalıdır.
- **Real Nəticə:** ❌ UĞURSUZ (BUG-ONB-09). Onboarding səhifəsində heç bir telemetriya hadisəsi yoxdur. Üstəlik `web/app/page.tsx`-dəki `app.opened` hadisəsi onboarding tamamlanana qədər atılmır (`if (!currentProfile.onboarded) router.replace(...)`). Nəticədə tətbiqi yükləyib onboarding-də tərk edən şagirdlər analitikada 100% görünməz qalır!

---

### TC-ONB-15: Sinif Seçim Şəbəkəsinin Simmetriyası
- **Tip:** UI Estetikası
- **Prioritet:** P3
- **Addımlar:**
  1. Step 2 ekranını aç.
  2. 5..11-ci sinif düymələrinə bax.
- **Gözlənilən Nəticə:** 7 düymə ekranda simmetrik və səliqəli paylanmalıdır.
- **Real Nəticə:** ❌ UĞURSUZ (BUG-ONB-10). `gridTemplateColumns: "repeat(4, 1fr)"` istifadə edilib. 1-ci sətirdə [5, 6, 7, 8], 2-ci sətirdə isə [9, 10, 11] və 4-cü xana boşdur. Dizayn yarımçıq təsir bağışlayır.

---

## 5. Qüsur və Problemlər Kataloqu (Bug Catalog)

| Kod | Prioritet | Komponent | Səbəb | Təsvir və Təsir |
|---|---|---|---|---|
| **BUG-ONB-01** | **P1** | `onboarding/page.tsx` | `<input>`-da `maxLength` yoxdur | 500+ simvol ad daxil edildikdə UI layout sınır. |
| **BUG-ONB-02** | **P2** | `profil/page.tsx:106` | `.toUpperCase()` | Azərbaycan 'i' hərfi nöqtəsiz 'I' olur ("İLKİN" əvəzinə "ILKIN"). |
| **BUG-ONB-03** | **P0** | `onboarding/page.tsx:31` | `handleSkip()` sabit `9` ötürür | "Keç" basan şagird xəbərdarlıqsız 9-cu sinif edilir. |
| **BUG-ONB-04** | **P0** | `onboarding/page.tsx:31` | `handleSkip()` state-dəki `grade`-i oxumur | Step 2-də sinif seçib "keç" vurduqda seçim itir, 9 olur. |
| **BUG-ONB-05** | **P1** | `storage.ts:117` | `pedagogicalTone` sinxron deyil | 5-8-ci siniflərə "dostyana" deyil, sərt "yetkin" DİM akademik tonu verilir. |
| **BUG-ONB-06** | **P1** | `onboarding/page.tsx:84` | Atributlar və `autoFocus` | Mobildə klaviatura kiçik hərflə açılır, ekran yuxarı atılır. |
| **BUG-ONB-07** | **P1** | `onboarding/page.tsx:27` | `router.push("/")` | Geri düyməsi basıldıqda təkrar onboarding-ə qayıdır (tarixçə tələsi). |
| **BUG-ONB-08** | **P2** | `onboarding/page.tsx:14` | Initial state profil məlumatından oxunmur | Yenidən quraşdırmada mövcud ad və sinif formadan silinir. |
| **BUG-ONB-09** | **P1** | `onboarding/page.tsx` | Telemetriya sıfırdır | PostHog funnel-ində onboarding addımları tamamilə qaranlıqdır. |
| **BUG-ONB-10** | **P3** | `onboarding/page.tsx:165` | `repeat(4, 1fr)` 7 elementlə | 2-ci sətirdə 4-cü xana boş qalır, vizual asimmetriya. |
| **BUG-ONB-11** | **P2** | `az.json:130` | "vizual ton" jarqonu | Dərslik dilinə uyğun deyil, şagirdi çaşdırır. |

---

## 6. Pedaqoji və Şagird Erqonomikası Tövsiyələri (UX Recommendations)

### 1. "Soyad" Tələbini Ləğv Edin (Sadəcə Ad)
- **Problem:** Şagirdlər (Aytən, Rauf) rəsmi sorğu-sualdan və məktəbə hesabat getməsindən qorxurlar.
- **Həll:** Başlıq: *"Səni necə çağıraq?"*, Alt yazı: *"Məsələn: Aytən (İxtiyari)"*.
- **Fayda:** Koqnitiv təzyiqi 70% azaldır, şagird tətbiqi rəsmi orqan deyil, köməkçi dost kimi qəbul edir.

### 2. Sinif Seçildikdə Dinamik İzah Qutusu Əlavə Edin
- **Problem:** Şagirdlər sinif düyməsini basanda nəyin dəyişdiyini başa düşmürlər.
- **Həll:** `design/Onboarding.dc.html`-də olan sinif izah mətnlərini bərpa edin:
  - 5-ci sinif: *"Sadə dildə, hər addım xırdalanaraq izah olunur."*
  - 7-ci sinif: *"Qaydaların və teoremlərin adı göstərilir."*
  - 9-cu sinif: *"Buraxılış imtahanı proqramına uyğun izah."*
  - 11-ci sinif: *"DİM blok imtahanı formatında akademik həll."*

### 3. Siniflə Pedaqoji Tonu Avtomatik Əlaqələndirin
- 5–8-ci siniflər seçildikdə: `visualTone: "genc"`, `pedagogicalTone: "dostyana"`, `goal: "mekteb"`.
- 9-cu sinif seçildikdə: `visualTone: "yetkin"`, `pedagogicalTone: "dostyana"`, `goal: "buraxilis"`.
- 10–11-ci siniflər seçildikdə: `visualTone: "yetkin"`, `pedagogicalTone: "yetkin"`, `goal: "dim"`.

### 4. "Keç" (Skip) Davranışını Şəffaf Edin
- Step 1-də "keç" vurularsa, birbaşa Step 2-yə (Sinif seçiminə) keçsin, çünki sinif olmadan düzgün riyazi izah vermək qeyri-mümkündür.
- Step 2-də artıq seçilmiş sinif varsa, "keç" həmin sinfi saxlamalıdır, onu gizlicə 9 etməməlidir.

### 5. Tarixçə Tələsini Aradan Qaldırın
- `router.push("/")` ➔ `router.replace("/")`.
- Beləliklə, onboarding-dən sonra Android geri düyməsi şagirdi təkrar quraşdırmaya atmayacaq.

### 6. Telemetriya Funnelini Aktivləşdirin
- Hadisələr:
  - `onboarding.viewed { step: 1 }`
  - `onboarding.step_submitted { step: 1, has_name: boolean }`
  - `onboarding.completed { grade: number, has_name: boolean, duration_sec: number }`
  - `onboarding.skipped { at_step: number }`
