# Requirements — Test Bankı Arxitekturası

## Giriş

Bu spesifikasiya test bankının məlumat modelini, sual render qatını və offline
sinxronizasiya təməlini əhatə edir. Məqsəd: gələcəkdə yeni sual tipləri, yeni dillər,
yeni məhsul formatları (sınaq, gündəlik məşq, reels quiz) əlavə edərkən **sxem
miqrasiyası tələb olunmaması.**

Əhatə dairəsindən kənar: kontent generasiyası pipeline-ı (ayrı spec), ödəniş,
autentifikasiya.

---

## Requirement 1 — Sual bankının qatlara ayrılması

**User story:** Tərtibatçı olaraq mən sualı, testi və cəhdi ayrı modellərdə saxlamaq
istəyirəm ki, yeni məhsul formatı əlavə edərkən mövcud məlumatı miqrasiya etməyim.

### Acceptance Criteria

1. WHEN sual yaradılır THEN sistem onu `questions` cədvəlində saxlamalı və heç bir
   test/kolleksiya məlumatı bu cədvəldə olmamalıdır.
2. WHEN test (sınaq, mövzu testi, gündəlik məşq) yaradılır THEN sistem yalnız sual
   ID-lərinə istinad saxlamalı, sual mətnini kopyalamamalıdır.
3. WHEN eyni sual üç fərqli testdə istifadə olunur THEN bazada sualın yalnız bir
   nüsxəsi olmalıdır.
4. IF yeni məhsul formatı əlavə edilirsə THEN `questions` cədvəlinin sxemi
   dəyişdirilməməlidir.

---

## Requirement 2 — Çoxdilli kontent

**User story:** Məhsul sahibi olaraq mən eyni sualı dörd dildə təqdim etmək istəyirəm,
lakin bazanın çoxunun yalnız Azərbaycan dilində olacağını nəzərə alaraq.

### Acceptance Criteria

1. WHEN sual yaradılır THEN mətn məzmunu `question_translations` cədvəlində dil kodu
   ilə saxlanmalıdır, `questions` cədvəlində dilə bağlı sütun olmamalıdır.
2. WHEN istifadəçi `ru` dilində sual tələb edir AND `ru` tərcüməsi yoxdursa THEN sistem
   `az → tr → en` fallback zənciri ilə mövcud ilk dili qaytarmalı və hansı dilin
   qaytarıldığını cavabda göstərməlidir.
3. WHEN heç bir tərcümə yoxdursa THEN sistem sualı nəticə dəstinə daxil etməməlidir.
4. WHEN UI dili dəyişir THEN kontent dili avtomatik dəyişməməlidir; ikisi ayrı
   parametrlərdir.
5. WHEN yeni dil əlavə edilir THEN heç bir cədvəl sxemi dəyişməməlidir.

---

## Requirement 3 — Polimorfik sual tipləri

**User story:** Məhsul sahibi olaraq mən gələcəkdə rəqəm daxiletmə, uyğunlaşdırma və
sıralama suallarını əlavə etmək istəyirəm, tip başına yeni cədvəl açmadan.

### Acceptance Criteria

1. WHEN sual yaradılır THEN onun tipi `single | multi | numeric | match | order | open`
   dəyərlərindən biri olmalıdır.
2. WHEN yeni sual tipi əlavə edilir THEN yeni cədvəl yaradılmamalı, `payload` JSONB
   strukturu genişləndirilməlidir.
3. WHEN `payload` yazılır THEN o, tipə uyğun JSON Schema ilə validasiyadan keçməlidir.
4. IF `payload` sxemə uyğun deyilsə THEN yazma əməliyyatı rədd edilməlidir.
5. WHEN sual oxunur THEN `payload` içində doğru cavab **olmamalıdır.**

---

## Requirement 4 — Sual qrupları (ortaq stimul)

**User story:** Kontent redaktoru olaraq mən bir mətnə və ya cədvələ bağlı bir neçə sual
yaratmaq istəyirəm (oxu anlama, qrafik təhlili).

### Acceptance Criteria

1. WHEN bir neçə sual eyni stimula (mətn, şəkil, cədvəl) bağlıdır THEN stimul
   `question_groups` cədvəlində bir dəfə saxlanmalıdır.
2. WHEN qrupa aid sual göstərilir THEN stimul sualla birlikdə qaytarılmalıdır.
3. WHEN qrupa aid sual təsadüfi məşqə seçilir THEN sistem ya bütün qrupu daxil etməli,
   ya da sualı tamamilə kənarlaşdırmalıdır — stimulsuz təkbaşına göstərməməlidir.
4. WHEN sual qrupa aid deyilsə THEN `group_id` NULL olmalı və bu normal hal sayılmalıdır.

---

## Requirement 5 — Versiyalama və dəyişməzlik

**User story:** Analitik olaraq mən üç ay əvvəlki cəhdə baxanda şagirdin **o vaxt hansı
mətni gördüyünü** dəqiq bilmək istəyirəm.

### Acceptance Criteria

1. WHEN mövcud sual redaktə edilir THEN sistem yeni sətir yaratmalı, köhnəni
   dəyişdirməməlidir.
2. WHEN yeni versiya yaradılır THEN köhnə sətrin `superseded_by` sahəsi yeni ID ilə
   doldurulmalıdır.
3. WHEN cəhd qeyd edilir THEN `attempt_items` konkret sual versiyasına istinad etməlidir.
4. WHEN aktiv suallar sorğulanır THEN yalnız `superseded_by IS NULL AND deleted_at IS NULL`
   olanlar qaytarılmalıdır.
5. WHEN sualın bütün versiya tarixçəsi tələb olunur THEN `root_id` üzrə sorğu bütün
   versiyaları qaytarmalıdır.

---

## Requirement 6 — Kurikulum taksonomiyası

**User story:** Məhsul sahibi olaraq mən kurikulum dəyişəndə bazanı əl ilə
təmizləməmək istəyirəm.

### Acceptance Criteria

1. WHEN standart yaradılır THEN o, iyerarxik (`parent_id`) və kurikulum ilinə bağlı
   (`curriculum_year`) olmalıdır.
2. WHEN sual standarta bağlanır THEN əlaqə çoxa-çox olmalıdır — bir sual bir neçə
   altstandartı yoxlaya bilər.
3. WHEN yeni kurikulum ili əlavə edilir THEN köhnə standartlar silinməməli, yeni dəst
   paralel mövcud olmalıdır.
4. WHEN mövzu adı göstərilir THEN o, `question` cədvəlində mətn kimi deyil,
   `standards` cədvəlindən çoxdilli olaraq oxunmalıdır.

---

## Requirement 7 — Cavab təhlükəsizliyi

**User story:** Məhsul sahibi olaraq mən şagirdin şəbəkə sorğusuna baxaraq doğru cavabı
görməsini istəmirəm.

### Acceptance Criteria

1. WHEN client sualı yükləyir THEN cavabda doğru cavab **heç bir formada** olmamalıdır.
2. WHEN şagird cavab göndərir THEN yoxlama server tərəfdə RPC funksiyası ilə
   aparılmalıdır.
3. WHEN cavab yoxlanır THEN sistem yalnız `is_correct` və izah addımlarını qaytarmalıdır.
4. WHEN admin rolu sualı oxuyur THEN doğru cavab qaytarılmalıdır.
5. WHEN RLS siyasəti yoxdursa THEN cədvəl produksiyaya çıxarılmamalıdır.

---

## Requirement 8 — Cəhd jurnalı və "özü həll etdi" metriki

**User story:** Valideyn olaraq mən uşağın nə qədərini **özü** həll etdiyini görmək
istəyirəm, sadəcə neçə sual açdığını yox.

### Acceptance Criteria

1. WHEN şagird sualla işləyir THEN sistem hər addımı ayrıca qeyd etməlidir:
   sərf olunan vaxt, açılan addım sayı, ipucu sayı, cavabın açılıb-açılmadığı.
2. WHEN şagird cavabı addımları keçmədən açır THEN bu hadisə `revealed_answer = true`
   kimi qeyd edilməlidir.
3. WHEN valideyn hesabatı hesablanır THEN "özü keçdiyi addımlar" faizi bu jurnaldan
   hesablanmalıdır.
4. WHEN cəhd qeyd edilir THEN verilmiş cavab tam şəkildə (`given_answer` JSONB)
   saxlanmalıdır — yalnız doğru/səhv bayrağı yetərli deyil.
5. WHEN eyni cəhd offline-da yaradılıb sonradan sync olunur THEN dublikat yaranmamalıdır.

---

## Requirement 9 — Kontent mənşəyi və audit

**User story:** Qurucu olaraq mən istənilən vaxt konkret mənbədən gələn bütün sualları
filtrləyib ayıra və ya silə bilmək istəyirəm.

### Acceptance Criteria

1. WHEN sual bazaya daxil edilir THEN `source`, `source_ref`, `license_status` və
   `review_status` sahələri doldurulmalıdır.
2. WHEN `review_status = 'draft'` THEN sual şagird sorğularında qaytarılmamalıdır.
3. WHEN mənbə üzrə filtr tətbiq edilir THEN sistem bir sorğu ilə həmin mənbənin bütün
   suallarını qaytarmalıdır.
4. WHEN partiya (batch) geri qaytarılır THEN `source_ref` üzrə toplu status dəyişikliyi
   mümkün olmalıdır.

---

## Requirement 10 — Universal render kontraktı

**User story:** Tərtibatçı olaraq mən yeni sual tipi əlavə edərkən UI komponentlərinə
toxunmaq istəmirəm.

### Acceptance Criteria

1. WHEN kontent render olunur THEN o, `blocks[]` massivi kimi verilməlidir və hər blokun
   `t` (tip) və `v` (dəyər) sahəsi olmalıdır.
2. WHEN blok tipi `math` olur THEN dəyər LaTeX sətri olmalı və KaTeX ilə render edilməlidir.
3. WHEN naməlum blok tipi gəlir THEN komponent çökməməli, blok səssizcə buraxılmalıdır.
4. WHEN eyni blok sxemi sual mətnində, izah addımında və reels başlığında istifadə olunur
   THEN eyni komponent işləməlidir.
5. WHEN riyazi ifadə saxlanır THEN o, şəkil kimi saxlanmamalıdır.

---

## Requirement 11 — Offline və sinxronizasiya təməli

**User story:** Şagird olaraq mən internet olmayanda da mövzu paketini həll edə bilmək
istəyirəm.

### Acceptance Criteria

1. WHEN qeyd yaradılır THEN `id` client tərəfdə UUID kimi generasiya olunmalıdır.
2. WHEN qeyd silinir THEN fiziki silmə yox, `deleted_at` doldurulmalıdır.
3. WHEN client sync edir THEN o, `updated_at > cursor` şərti ilə delta almalıdır.
4. WHEN mövzu paketi offline üçün endirilir THEN o, versiyalı snapshot kimi
   (`content_packs`) qaytarılmalıdır.
5. WHEN eyni qeyd iki cihazdan dəyişdirilir THEN son yazılan qalır (last-write-wins) və
   münaqişə jurnala yazılır.

---

## Requirement 12 — Çətinliyin kalibrlənməsi

**User story:** Məhsul sahibi olaraq mən çətinlik səviyyəsinin real şagird nəticələrindən
öyrənilməsini istəyirəm.

### Acceptance Criteria

1. WHEN sual yaradılır THEN `difficulty_static` (1–5) təyin edilməlidir.
2. WHEN sual üzrə 50-dən çox cəhd toplanır THEN `difficulty_calibrated` hesablanmalıdır.
3. WHEN sual seçilir THEN sistem `difficulty_calibrated` mövcuddursa onu, əks halda
   `difficulty_static` dəyərini istifadə etməlidir.
4. WHEN mənimsəmə (mastery) hesablanır THEN o, canlı sorğu ilə deyil, aqreqat
   `mastery` cədvəlindən oxunmalıdır.
