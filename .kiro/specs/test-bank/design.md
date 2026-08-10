# Design — Test Bankı Arxitekturası

## Ümumi baxış

Üç qatlı model: **Item Bank → Assessment → Attempt**. Hər qat müstəqil miqyaslanır və
biri digərinin sxeminə təsir etmir.

```
standards ──┐
            ├─< question_standards >── questions ──< question_translations
question_groups ──────────────────────┤          └─< question_answers (RLS: admin only)
                                      │          └─< question_assets
                                      │
                    assessments ──< assessment_items
                                      │
                    attempts ──< attempt_items ──┘
                                      │
                                 mastery (aqreqat)
```

---

## 1. Ortaq konvensiyalar

Hər cədvəldə:

```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
deleted_at  TIMESTAMPTZ            -- soft delete
```

`updated_at` trigger ilə avtomatik yenilənir. Sinxronizasiya bu sütun üzərində qurulur.

---

## 2. Blok sxemi (kontent formatı)

Bütün mətn məzmunu eyni struktur ilə saxlanır:

```ts
type Block =
  | { t: 'text';  v: string }
  | { t: 'math';  v: string }               // LaTeX, KaTeX ilə render
  | { t: 'image'; v: string; alt?: string } // asset_id
  | { t: 'code';  v: string; lang?: string }
  | { t: 'table'; v: string[][] }
  | { t: 'list';  v: string[]; ordered?: boolean }

type Content = { blocks: Block[] }
```

Bu sxem üç yerdə eyni işləyir: sual mətni, izah addımı, reels başlığı.
Naməlum `t` dəyəri gəldikdə renderer onu buraxır (forward compatibility).

---

## 3. Taksonomiya

```sql
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,              -- 'math', 'az_lang', 'physics'
  label JSONB NOT NULL,                   -- {"az":"Riyaziyyat","ru":"Математика"}
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES standards(id),
  subject_id UUID NOT NULL REFERENCES subjects(id),
  grade SMALLINT NOT NULL CHECK (grade BETWEEN 1 AND 11),
  curriculum_year SMALLINT NOT NULL,      -- 2024, 2026 ...
  code TEXT NOT NULL,                     -- '2.1.3'
  label JSONB NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (subject_id, curriculum_year, code)
);

CREATE INDEX idx_standards_lookup
  ON standards (subject_id, grade, curriculum_year) WHERE deleted_at IS NULL;
```

`label` JSONB-dir, çünki taksonomiya adları az sayda və sabitdir — ayrı tərcümə
cədvəli artıqlıq yaradar.

---

## 4. Sual qrupları

```sql
CREATE TABLE question_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('reading','graph','table','audio')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE question_group_translations (
  group_id UUID NOT NULL REFERENCES question_groups(id) ON DELETE CASCADE,
  lang TEXT NOT NULL CHECK (lang IN ('az','ru','en','tr')),
  stimulus JSONB NOT NULL,                -- Content
  PRIMARY KEY (group_id, lang)
);
```

---

## 5. Suallar (immutable, versiyalı)

```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  root_id UUID NOT NULL,                  -- ilk versiyanın id-si
  version INT NOT NULL DEFAULT 1,
  superseded_by UUID REFERENCES questions(id),

  group_id UUID REFERENCES question_groups(id),
  subject_id UUID NOT NULL REFERENCES subjects(id),
  grade SMALLINT NOT NULL,

  type TEXT NOT NULL CHECK (type IN
    ('single','multi','numeric','match','order','open')),
  payload JSONB NOT NULL,                 -- tipə görə struktur, cavabsız

  difficulty_static SMALLINT NOT NULL CHECK (difficulty_static BETWEEN 1 AND 5),
  difficulty_calibrated NUMERIC(4,3),     -- p-value, 50+ cəhddən sonra
  attempt_count INT NOT NULL DEFAULT 0,

  source TEXT NOT NULL CHECK (source IN
    ('generated','teacher','licensed','imported','user_capture')),
  source_ref TEXT,                        -- batch id / müqavilə id
  license_status TEXT NOT NULL DEFAULT 'unknown'
    CHECK (license_status IN ('owned','licensed','unknown','flagged')),
  review_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (review_status IN ('draft','auto_verified','verified','rejected')),
    -- draft         = yoxlanmayıb, şagirdə göstərilmir
    -- auto_verified = maşın (sympy/ADR-009) təsdiqləyib, insan baxmayıb → GÖRÜNÜR
    -- verified      = insan nəzərdən keçirib → görünür
    -- Görünmə şərti: review_status IN ('auto_verified','verified')
    -- ADR-018 §6: mövcud sətirlərə 'verified' yazmaq YALAN siqnaldır,
    -- 'draft' yazmaq isə istehsalatda sualları yox edir. Üçüncü dəyər hər ikisini həll edir.
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (root_id, version)
);
```

```sql
CREATE INDEX idx_questions_active ON questions (subject_id, grade, review_status)
  WHERE superseded_by IS NULL AND deleted_at IS NULL;
CREATE INDEX idx_questions_source ON questions (source, source_ref);
CREATE INDEX idx_questions_root ON questions (root_id);

CREATE TABLE question_standards (
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  standard_id UUID NOT NULL REFERENCES standards(id),
  weight NUMERIC(3,2) NOT NULL DEFAULT 1,
  PRIMARY KEY (question_id, standard_id)
);
```

### payload nümunələri

```jsonc
// single
{ "options": [{"key":"A"},{"key":"B"},{"key":"C"},{"key":"D"}], "shuffle": true }

// numeric
{ "unit": "sm", "tolerance": 0.01 }

// open (ADR-018 §1b — mövcud DİM/user_capture sualları bu tipdədir)
{ "input_kind": "numeric", "unit": "sm", "tolerance": 0.01 }
// input_kind: 'numeric' | 'expression' | 'text' — STEP-SCHEMA check.input_kind ilə eyni ox
// Doğru cavab burada YOXDUR, private.question_answers-dədir.
```

Variantların **mətni** payload-da deyil, tərcümə cədvəlindədir — yalnız açarlar burada.

### Dedup açarları (ADR-018 §1d)

`questions` cədvəli `canonical_hash` və `numeric_fingerprint` sütunlarını da daşıyır —
`user_capture` axını onlarsız işləmir. `UNIQUE (canonical_hash)` **götürülür**, çünki
eyni məsələ müxtəlif sinif dərinliyi üçün klonlanır. Əvəzinə:

```sql
CREATE UNIQUE INDEX questions_dedup_idx
  ON questions (canonical_hash, subject_id, grade)
  WHERE superseded_by IS NULL AND deleted_at IS NULL;
```

Klonlamaya icazə verir, sinif daxilində dublikatı bloklayır. Uyğunlaşdırma sorğusu
bu üçlü ilə gedir və `LIMIT 1` tələb etmir.

---

## 6. Tərcümələr

```sql
CREATE TABLE question_translations (
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  lang TEXT NOT NULL CHECK (lang IN ('az','ru','en','tr')),
  stem JSONB NOT NULL,                    -- Content
  options JSONB,                          -- {"A":Content,"B":Content,...}
  steps JSONB NOT NULL,                   -- docs/STEP-SCHEMA.json → steps[] forması
  misconception JSONB,                    -- {"A":{"error_code":"SIGN_LOST","note":"..."}}
                                          -- error_code MÜTLƏQ docs/STEP-SCHEMA.json
                                          -- error_codes enum-undan olmalıdır (qızıl qayda)
  hint JSONB,
  -- ADR-018 §2b ilə təsdiqlənən additiv sütunlar (user_capture axını üçün):
  verified BOOLEAN NOT NULL DEFAULT false,
  verification_method TEXT,               -- 'sympy' | 'human' | 'none'
  model TEXT,
  cost_usd NUMERIC(8,5),
  prompt_version TEXT,
  PRIMARY KEY (question_id, lang)
);
```

**`Step` tipi burada TƏKRAR TƏRİF OLUNMUR.** Mənbə həqiqət:
`docs/STEP-SCHEMA.json` → `steps[]` (index / title / explanation / latex / why /
tokens / **check** / **error_code** / hint). O sxem `CLAUDE.md`-yə görə dəyişməz
müqavilədir və Cowork-un ADR-i olmadan dəyişmir.

`question_translations.steps` məhz o formanı daşıyır. Əvvəlki spec versiyasında
paralel `Step` tipi tərif olunmuşdu — bu, iki mənbə həqiqəti yaradırdı və səhv idi
(ADR-018 §2a).

Yalnız bir əlavə qayda: `steps[].check.accept` **public sxemə yazılmır** —
o, `private.step_answers`-ə köçür (§7). `question_translations.steps` içindəki
`check` obyekti yalnız `ask` və `input_kind` saxlayır.

`steps` NOT NULL-dır — məhsulun əsas fərqi budur, boş sual bazaya düşməməlidir.

### Fallback

Postgres funksiyası ilə həll olunur, client-də deyil:

```sql
CREATE FUNCTION resolve_translation(q UUID, pref TEXT)
RETURNS question_translations LANGUAGE sql STABLE AS $$
  SELECT * FROM question_translations
  WHERE question_id = q
  ORDER BY array_position(ARRAY[pref,'az','tr','en']::text[], lang) NULLS LAST
  LIMIT 1;
$$;
```

---

## 7. Doğru cavab — ayrı SXEM (RLS deyil)

Qərar və izahat: `docs/decisions/ADR-017-answer-isolation.md`.
RLS bu problem üçün yanlış alətdir — bax ADR.

```sql
CREATE SCHEMA private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;

CREATE TABLE private.question_answers (
  question_id UUID PRIMARY KEY REFERENCES public.questions(id) ON DELETE CASCADE,
  answer JSONB NOT NULL,
  validator TEXT NOT NULL DEFAULT 'exact'  -- exact | numeric_tolerance | set | ordered
);

-- Addım-səviyyəli cavablar (STEP-SCHEMA steps[].check.accept).
-- Dilə bağlı DEYİL: step_index tərcümələr arasında eynidir, cavab dil-neytraldır.
CREATE TABLE private.step_answers (
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  step_index SMALLINT NOT NULL,            -- STEP-SCHEMA steps[].index
  accept JSONB NOT NULL,
  input_kind TEXT NOT NULL,
  PRIMARY KEY (question_id, step_index)
);

CREATE FUNCTION public.check_answer(q UUID, given JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = private, public AS $$
DECLARE a JSONB; v TEXT;
BEGIN
  SELECT answer, validator INTO a, v
  FROM private.question_answers WHERE question_id = q;
  RETURN jsonb_build_object('is_correct', a = given);
END; $$;

REVOKE ALL ON FUNCTION public.check_answer FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_answer TO app_runtime;

-- Addım yoxlaması. error_code distractors-dan gəlir (public tərcümədə),
-- doğru cavab isə heç vaxt qaytarılmır.
CREATE FUNCTION public.check_step(q UUID, idx SMALLINT, given JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = private, public AS $$
DECLARE a JSONB; k TEXT;
BEGIN
  SELECT accept, input_kind INTO a, k
  FROM private.step_answers WHERE question_id = q AND step_index = idx;
  RETURN jsonb_build_object('is_correct', a @> given, 'input_kind', k);
END; $$;

REVOKE ALL ON FUNCTION public.check_step FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_step TO app_runtime;
```

**Vacib:** `sympy` yoxlaması (ADR-009) bu funksiyaların yerini tutmur — o,
`/api/steps/check` daxilində işləyir və doğru dəyəri `check_step` vasitəsilə
alır. Doğru dəyər heç vaxt Node prosesində açıq şəkildə saxlanmır.

Tətbiq `app_runtime` rolu ilə qoşulur; o rolun `private` sxeminə icazəsi yoxdur.
İkinci müdafiə xətti: `/api/questions` heç vaxt cavab sahəsi qaytarmır.

---

## 8. Assessment qatı

```sql
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN
    ('mock_exam','topic_test','daily_drill','diagnostic','reels_quiz')),
  title JSONB NOT NULL,
  subject_id UUID REFERENCES subjects(id),
  grade SMALLINT,
  time_limit_sec INT,
  config JSONB NOT NULL DEFAULT '{}',         -- kind-ə görə parametrlər
  is_dynamic BOOLEAN NOT NULL DEFAULT false,  -- true = suallar runtime seçilir
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE assessment_items (
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  position INT NOT NULL,
  points NUMERIC(5,2) NOT NULL DEFAULT 1,
  PRIMARY KEY (assessment_id, question_id)
);
```

`is_dynamic = true` olduqda `assessment_items` boş qalır və suallar `config`-dəki
qaydalara görə (standart + çətinlik paylanması) runtime seçilir. Gündəlik məşq və
reels quiz bu rejimdə işləyir — yeni format əlavə edərkən sxem dəyişmir.

---

## 9. Cəhdlər

```sql
CREATE TABLE attempts (
  id UUID PRIMARY KEY,                    -- client generasiya edir
  user_id UUID,                           -- Faza 1: NULL (auth yoxdur, ADR-012)
  device_id TEXT NOT NULL,                -- Faza 1-də əsas şəxsiyyət
  student_ref TEXT,                       -- dəvət kodu ilə bağlanma
  assessment_id UUID REFERENCES assessments(id),
  kind TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  score NUMERIC(6,2),
  device TEXT,
  client_created_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE attempt_items (
  id UUID PRIMARY KEY,                    -- client generasiya edir
  attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),  -- konkret versiya
  given_answer JSONB,
  is_correct BOOLEAN,
  error_code TEXT,                        -- STEP-SCHEMA.json error_codes enum-u
  match_path TEXT,                        -- mövcud keş metrikası, saxlanır
  ocr_source TEXT,                        -- mövcud, saxlanır
  ocr_corrected BOOLEAN,                  -- mövcud, saxlanır
  delivered BOOLEAN,                      -- mövcud limit məntiqi, saxlanır
  transfer_correct BOOLEAN,               -- mövcud öyrənmə metrikası, saxlanır
  time_ms INT,
  steps_revealed SMALLINT NOT NULL DEFAULT 0,
  steps_total SMALLINT NOT NULL,
  hints_used SMALLINT NOT NULL DEFAULT 0,
  revealed_answer BOOLEAN NOT NULL DEFAULT false,
  self_solved BOOLEAN GENERATED ALWAYS AS
    (revealed_answer = false AND hints_used = 0) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attempt_items_q ON attempt_items (question_id);
CREATE INDEX idx_attempts_user ON attempts (user_id, started_at DESC);
```

`self_solved` generated sütundur — valideyn hesabatının əsas metriki buradan gəlir.
Sonradan əlavə etmək retroaktiv məlumat itkisi deməkdir, ona görə birinci gündən var.

---

## 10. Mastery aqreqatı

```sql
CREATE TABLE mastery (
  user_id UUID NOT NULL,
  standard_id UUID NOT NULL REFERENCES standards(id),
  attempts INT NOT NULL DEFAULT 0,
  correct INT NOT NULL DEFAULT 0,
  self_solved_ratio NUMERIC(4,3),
  last_seen_at TIMESTAMPTZ,
  score NUMERIC(4,3),                     -- 0..1 mənimsəmə
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, standard_id)
);
```

Gecə cron ilə yenilənir. Valideyn hesabatı **heç vaxt** `attempt_items` üzərində
canlı aqreqasiya etmir.

---

## 11. Offline paketlər

```sql
CREATE TABLE content_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id),
  grade SMALLINT NOT NULL,
  standard_id UUID REFERENCES standards(id),
  lang TEXT NOT NULL,
  version INT NOT NULL,
  payload JSONB NOT NULL,                 -- sıxılmış sual dəsti (cavabsız)
  size_bytes INT NOT NULL,
  published_at TIMESTAMPTZ,
  UNIQUE (subject_id, grade, standard_id, lang, version)
);
```

Paket cavabları **daşımır** — offline yoxlama üçün yalnız hash saxlanır, tam yoxlama
online qayıdanda təsdiqlənir.

---

## 12. Sinxronizasiya

- Client hər cədvəl üçün `sync_cursor` (son `updated_at`) saxlayır.
- Pull: `GET /api/sync?since=<cursor>` → dəyişən sətirlər + yeni cursor.
- Push: client UUID-li qeydləri `POST /api/sync` ilə göndərir, `ON CONFLICT (id) DO UPDATE`.
- Münaqişə: last-write-wins, `sync_conflicts` cədvəlinə jurnal.
- Bütün endpoint-lər **Route Handler**-dir, Server Action deyil (Capacitor uyğunluğu).

---

## 13. UI render qatı

```
<QuestionRenderer question={q} lang={lang} />
   ├── <ContentBlocks blocks={stem.blocks} />
   ├── <AnswerInput type={q.type} payload={q.payload} onSubmit={...} />
   └── <StepReveal steps={steps} onReveal={...} />
```

- `ContentBlocks` yeganə render nöqtəsidir; blok tipi → komponent map.
- `AnswerInput` tip → komponent map (`single` → RadioGroup, `numeric` → NumberPad...).
  Yeni tip = map-a bir sətir, başqa heç nə.
- `StepReveal` hər açılan addımı `onReveal` ilə jurnala yazır.
- Naməlum blok tipi → `null` qaytarılır, çökmə olmur.

---

## Test strategiyası

| Səviyyə | Nə yoxlanır |
|---|---|
| Unit | Blok renderer hər tip üçün, naməlum tip daxil |
| Unit | Fallback zənciri (az/ru/en/tr, boş hallar) |
| Integration | `check_answer` RPC hər validator tipi üçün |
| RLS | Anonim və şagird rolu `question_answers`-dan oxuya bilmir |
| Integration | Versiyalama: redaktədən sonra köhnə cəhd toxunulmaz qalır |
| Integration | Sync: eyni UUID iki dəfə push → dublikat yoxdur |
| Snapshot | `self_solved` hesablanması müxtəlif ssenarilərdə |
