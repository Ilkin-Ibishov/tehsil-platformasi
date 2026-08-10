# Tasks — Test Bankı Arxitekturası

Hər tapşırıq `requirements.md`-dəki bəndlərə istinad edir.
Ardıcıllıq vacibdir: 1–4 təməldir, onlar bitmədən 5+ başlanmır.

---

## Faza 1 — Təməl (bloklayıcı)

- [ ] **1. Ortaq DB konvensiyalarını qur**
  - `gen_random_uuid()` extension aktivləşdir
  - `set_updated_at()` trigger funksiyası yaz
  - Soft delete üçün ortaq `active` view pattern-i müəyyən et
  - Miqrasiya faylı: `supabase/migrations/0001_conventions.sql`
  - _Requirements: 11.1, 11.2_

- [ ] **2. Blok sxemini TypeScript tipi və JSON Schema kimi təsbit et**
  - `packages/content/src/blocks.ts` — `Block`, `Content`, `Step` tipləri
  - Zod schema ilə runtime validasiya
  - Naməlum blok tipi üçün forward-compatible parse testi
  - _Requirements: 10.1, 10.3_

- [ ] **3. Taksonomiya cədvəllərini yarat**
  - `subjects`, `standards` (iyerarxik, `curriculum_year` ilə)
  - İndekslər və `UNIQUE (subject_id, curriculum_year, code)`
  - Seed skripti: DİM altstandart CSV → `standards`
  - _Requirements: 6.1, 6.3, 6.4_

- [ ] **4. Sual bankı cədvəllərini yarat**
  - [ ] 4.1 `question_groups` + `question_group_translations`
    - _Requirements: 4.1, 4.4_
  - [ ] 4.2 `questions` (root_id, version, superseded_by, source, review_status)
    - _Requirements: 1.1, 3.1, 5.1, 9.1_
  - [ ] 4.3 `question_translations` (stem, options, steps, misconception)
    - `steps` NOT NULL constraint
    - _Requirements: 2.1, 2.5_
  - [ ] 4.4 `question_standards` çoxa-çox cədvəli
    - _Requirements: 6.2_
  - [ ] 4.5 `question_assets` + Supabase Storage bucket
    - _Requirements: 10.5_

---

## Faza 2 — Təhlükəsizlik və məntiq

- [ ] **5. Doğru cavabı izolyasiya et**
  - [ ] 5.1 `question_answers` cədvəli, RLS aktiv, SELECT siyasəti YOX
    - _Requirements: 7.1, 7.5_
  - [ ] 5.2 `check_answer(q, given)` SECURITY DEFINER RPC
    - Validator tipləri: `exact`, `numeric_tolerance`, `set`, `ordered`
    - _Requirements: 7.2, 7.3_
  - [ ] 5.3 RLS testi: anonim və `student` rolu cavab oxuya bilmir
    - _Requirements: 7.1, 7.4_

- [ ] **6. Tərcümə fallback funksiyası**
  - `resolve_translation(question_id, pref_lang)` SQL funksiyası
  - Zəncir: `pref → az → tr → en`, faktiki dil cavabda göstərilir
  - Tərcüməsi olmayan sual nəticə dəstinə düşmür
  - _Requirements: 2.2, 2.3_

- [ ] **7. Versiyalama məntiqi**
  - `create_question_version(root_id, patch)` RPC
  - Köhnə sətir `superseded_by` ilə bağlanır, UPDATE edilmir
  - `active_questions` view: `superseded_by IS NULL AND deleted_at IS NULL`
  - Test: redaktədən sonra keçmiş `attempt_items` toxunulmaz qalır
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] **8. JSON Schema validasiyası (payload)**
  - Hər sual tipi üçün ayrı schema
  - DB tərəfdə `CHECK` + tətbiq tərəfdə Zod
  - `payload` içində cavab olarsa yazma rədd edilir
  - _Requirements: 3.3, 3.4, 3.5_

---

## Faza 3 — Assessment və cəhd

- [ ] **9. Assessment qatı**
  - `assessments` + `assessment_items`
  - `is_dynamic` rejimi: `config` üzrə runtime sual seçimi
  - Qrup bütövlüyü: qrupa aid sual seçilirsə bütün qrup daxil edilir
  - _Requirements: 1.2, 1.3, 1.4, 4.3_

- [ ] **10. Cəhd jurnalı**
  - [ ] 10.1 `attempts` + `attempt_items`, client-side UUID
    - _Requirements: 8.4, 11.1_
  - [ ] 10.2 `self_solved` generated sütunu
    - _Requirements: 8.1, 8.2, 8.3_
  - [ ] 10.3 `POST /api/attempts` Route Handler (Server Action DEYİL)
    - `ON CONFLICT (id) DO UPDATE` — idempotent
    - _Requirements: 8.5_

- [ ] **11. Mastery aqreqatı**
  - `mastery` cədvəli + `refresh_mastery(user_id)` funksiyası
  - Gecə cron (pg_cron və ya Vercel Cron)
  - Valideyn hesabatı yalnız bu cədvəldən oxuyur
  - _Requirements: 12.4_

- [ ] **12. Çətinlik kalibrləməsi**
  - `attempt_count` trigger ilə artırılır
  - 50+ cəhddən sonra `difficulty_calibrated` hesablanır
  - Sual seçimi kalibrlənmiş dəyərə üstünlük verir
  - _Requirements: 12.1, 12.2, 12.3_

---

## Faza 4 — UI render qatı

- [ ] **13. ContentBlocks komponenti**
  - Blok tipi → komponent map
  - KaTeX inteqrasiyası (`math` bloku)
  - Naməlum tip → `null`, çökmə yoxdur
  - Unit testlər hər blok tipi üçün
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] **14. AnswerInput komponenti**
  - Tip → komponent map: `single`, `multi`, `numeric`, `match`, `order`, `open`
  - MVP-də yalnız `single` və `numeric` implementasiya olunur, qalanı stub
  - Yeni tip əlavəsi map-a bir sətirdən ibarət olmalıdır
  - _Requirements: 3.1, 3.2_

- [ ] **15. StepReveal komponenti**
  - Ardıcıl addım açılışı, "Niyə?" genişlənməsi
  - Hər açılış `onReveal` ilə jurnala yazılır
  - Cavab ayrıca düymə ilə, addımlardan sonra
  - _Requirements: 8.1, 8.2_

- [ ] **16. QuestionRenderer birləşdirilməsi**
  - Eyni komponent sual, izah və reels quiz-də işləyir
  - _Requirements: 10.4_

---

## Faza 5 — Offline və sync

- [ ] **17. Sync təməli**
  - `sync_cursor` client saxlama qatı
  - `GET /api/sync?since=` — delta pull
  - `POST /api/sync` — batch push, idempotent
  - `sync_conflicts` jurnalı
  - _Requirements: 11.3, 11.5_

- [ ] **18. Content packs**
  - `content_packs` cədvəli
  - `build_content_pack(subject, grade, standard, lang)` generasiya skripti
  - Paket cavab daşımır, yalnız hash
  - Client tərəfdə IndexedDB saxlama
  - _Requirements: 11.4_

---

## Faza 6 — Admin və audit

- [ ] **19. Mənşə filtri və toplu əməliyyatlar**
  - Admin paneldə `source` / `source_ref` / `license_status` üzrə filtr
  - Batch üzrə toplu `review_status` dəyişikliyi
  - Batch geri qaytarma (rollback) əməliyyatı
  - _Requirements: 9.2, 9.3, 9.4_

- [ ] **20. Müəllim təsdiq paneli**
  - Üç əməliyyat: Təsdiq / Düzəlt / Rədd
  - Klaviatura qısayolları (saatda 100+ sual sürəti üçün)
  - Düzəliş `create_question_version` çağırır
  - _Requirements: 5.1, 9.2_

---

## Definition of Done

Tapşırıq yalnız aşağıdakılar ödəndikdə bağlanır:

- Miqrasiya faylı `supabase/migrations/` altındadır və geri qaytarıla bilir
- Cədvəldə RLS aktivdir
- TypeScript tipləri `supabase gen types` ilə yenilənib
- İstinad edilən acceptance criteria üçün ən azı bir test var
- Route Handler istifadə olunub, Server Action yoxdur
