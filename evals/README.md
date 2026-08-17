# evals — Faza 0

## Məqsəd

Kod yazmadan əvvəl boru xəttinin dəqiqliyini ölçmək. Bu qovluq sonradan **daimi reqressiya testi**
olur — prompt və ya model dəyişəndə pisləşməni tutur.

## Golden set — necə qurulur

**Hədəf: 30 şəkil (Faza 0), sonra 150–300 (daimi).**

Tərkib reallığı əks etdirməlidir:

| mənbə | pay |
|---|---|
| Çap olunmuş DİM test toplusu | 70% |
| Çap olunmuş dərslik | 20% |
| Əl yazısı (dəftər) | 10% |

Şəkillər müxtəlif şəraitdə çəkilməlidir: yaxşı işıq, zəif işıq, əyilmiş bucaq, kölgə, flaş.
Bir şəkildə **bir məsələ** olsun (Kamera ekranı onsuz da çərçivə ilə kəsdirir).

## Fayllar

```
evals/
├── images/               # şəkillər (git-ə getmir, .gitignore-dadır)
│   └── 001.jpg ...
├── golden-set.jsonl         # xam şəkillər — aşkarlama yolu (çoxsuallı kadr, multiple_problems)
├── golden-set-cropped.jsonl # əl ilə kəsilmiş şəkillər — həll yolu (hamısı "ok")
├── fixtures.jsonl        # sintetik, şəkilsiz nümunələr — golden-set boş olanda da harness işə düşsün deyə
├── selftest-cases.jsonl  # harness-in öz məntiqini (schema/verify/leak) yoxlayan mock nümunələr
└── results/              # eval nəticələri (git-ə getmir)
```

İkisinin də `n < 30`-dur (Faza 0-lite, bax `HANDOFF (13)`) — nəticələr qapı hökmü vermir, yalnız
boru xəttinin real şəkillərlə işlədiyini yoxlayır. `fixtures.jsonl` isə şəkilsiz, LLM açarı
işləməyəndə/limitli olanda belə harness-in mənasız qırılmadığını sınamaq üçündür.

## `golden-set.jsonl` formatı

Hər sətir bir JSON obyekti:

```jsonc
{
  "id": "001",
  "image": "images/001.jpg",
  "source": "dim_2025_9sinif_v1_q34",   // istinad, DİM mətni YOX
  "capture": "print_good_light",         // print_good_light | print_low_light | print_angled | handwritten
  "grade": 9,
  "subject": "riyaziyyat",
  "problem_type": "formula",
  "canonical": "x^2-5x+6=0",             // insanın yazdığı doğru forma
  "topic_code": "ALG.QUADRATIC_EQUATION",
  "final_answer_values": ["3", "2"],     // insan ground truth-u
  "answer_values_are": "components",     // ADR-009: "alternate_forms" (defolt, kəsişmə — hər hansı
                                          // golden dəyəri hər hansı model dəyəri ilə üst-üstə düşsə
                                          // doğrudur, məs. ["3/10","0.3","0,3"]) | "components" (tam
                                          // əhatə — HƏR golden komponentinin (iki kök və s.) modelin
                                          // dəyərləri arasında ekvivalenti olmalıdır)
  "answer_is_root": true,                // ADR-009: false-dursa sympy çarpaz yoxlama (2-ci qat) keçilir —
                                          // cavab tənliyin kökü DEYİL (məs. kontekstual tənlikdən törəmə ehtimal)
  "expected_choice": "B",                // opsional, variantlı məsələdə düzgün hərf — informativdir, qapıya girmir
  "expected_status": "ok",               // ADR-006: ok | unreadable | not_a_problem | multiple_problems | cut_off | unsupported. Yoxdursa "ok" sayılır.
  "expected_step_count": 4,
  "expected_step_titles": [              // müəllim rəyi — addım bölgüsü müqayisəsi üçün
    "Əmsalları oxu", "Diskriminantı hesabla", "Kök düsturunu qur", "Kökləri yoxla"
  ]
}
```

## Ölçülən metrikalar

| metrika | necə | qapı |
|---|---|---|
| **OCR dəqiqliyi** | `canonical` sympy ilə normallaşdırılıb müqayisə | ≥90% (çap) |
| **Son cavab dəqiqliyi** | üç qat (86eyhqggz, ADR-009): (1) golden `final_answer_values` ilə **kəsişmə** əsaslı müqayisə (`answer_values_are`-ə görə), (2) sympy `canonical`-a qarşı müstəqil çarpaz yoxlama (`answer_is_root=false`-da keçilir), (3) heç biri mümkün deyilsə `None` | **≥85%** |
| **Yoxlama ziddiyyəti** | (1) və (2) fərqli nəticə verib — golden set-in özündə səhv ola bilər, əl ilə yoxlanmalıdır | qapısız, item id-ləri ilə çap olunur |
| **Variant uyğunluğu** | `final_answer.choice` (yoxdursa son addımın `check.accept`-i) `expected_choice`-a uyğundurmu | informativ, qapısız |
| **Addım bölgüsü — struktur** | say 1–6, hər addımda `check`, `index` ardıcıl, son addım yoxlama (>1 addımda, HANDOFF 108), `error_code`-lar fərqli | **100%** |
| **Addım bölgüsü — pedaqoji** | insan rəyi: "bu bölgü ilə şagird özü həll edə bilərmi?" (bax `ADR-004`) | **≥75%** |
| **Sxem validliyi** | `STEP-SCHEMA.json`-a uyğunluq | 100% |
| **Cavab sızması** | `V` dəyəri `steps[i].explanation`-da görünür VƏ heç bir **əvvəlki** (`j<i`) addımın `check.accept`-ində yoxdur (`ADR-005`) | ≤10% |
| **Hallüsinasiya** | `expected_status != ok` olduğu halda model yenə `steps`/`final_answer` qaytarır (`ADR-006`) | **0%** |
| **Artıq ehtiyat** | `expected_status == ok` olduğu halda model imtina edir (simmetrik, qapısız) | ölçülüb qeyd edilir |
| **Xərc / həll** | token sayı × qiymət | ölçülüb qeyd edilir |
| **Latensiya** | uçdan-uca, YALNIZ son cəhd (retry gözləməsi daxil deyil) | ölçülüb qeyd edilir |

## PDF-dən avtomatlaşdırılmış golden-set (HANDOFF 104/105, 2026-08-15)

Əl ilə 30 şəkil çəkmək (yuxarıdakı bölmə) YEGANƏ yol deyil — Ilkin real DIM test toplusu PDF-i
tapdı (`100 test. Riyaziyyat..pdf`, 100 sual + cavab açarı). `scripts/pdf_to_golden_set.py`
bunu **LLM çağırışı OLMADAN** (tamamilə mətn-mövqeyi əsaslı proqram məntiqi) sual-sual kəsib
`evals/golden-set-<ad>.jsonl` + `evals/images/<ad>/qNNN.png` yaradır. Yalnız FAKTIKI
`--pipeline B` çağırışı token xərcləyir.

```bash
pip install pymupdf
python scripts/pdf_to_golden_set.py \
  --pdf "path/to/test-toplusu.pdf" \
  --question-pages 0-7 --answer-key-pages 8-9 \
  --out-name dim-100test-2025 --grade 11 --subject math
python scripts/eval.py --pipeline B --set evals/golden-set-dim-100test-2025.jsonl
```

`evals/golden-set-dim-100test-2025.jsonl` (99 sual — `q098` xaric edildi, fiqurların öz
koordinatları mətn axınından kənara düşüb, kəsmə natamam çıxdı, `scripts/pdf_to_golden_set.py`-in
öz başlığındakı məhdudiyyət qeydinə bax) commit edilib. Şəkillər (`evals/images/`) HƏMİŞƏ
gitignored — orijinal PDF-in ÖZÜ də repo-ya qoyulmur (ADR-003).

`evals/golden-set-physics-30.jsonl` (E1.4, 2026-08-17): eyni kəsici, fizika buraxılış PDF
(`col-x-ranges 30-45,310-325` — etiketlər x≈36/315, variant rəqəmləri sütun kimi sayılmasın).
Kitabçada cavab açarı YOXDUR — `expected_choice` / `final_answer_values` insan həllidir, LLM
yox. `--answer-key-pages` boş buraxıla bilər. `--set physics-30` qısa adı dəstəklənir.

**Xərc:** ~99 sual × 1 vision çağırışı (tək-çağırış memarlığı, ADR-001) — əvvəlki ölçmələrə
görə (`~$0.013/sual`) tam dəst ~$1.3. Böyük dəyişiklikdən sonra hamısını YOX, əvvəlcə kiçik
partiya (`--set` faylını əl ilə bölərək və ya gələcək bir `--limit` bayrağı ilə) işlətmək
tövsiyə olunur.

## Müqayisə ediləcək boru xətləri

1. **A** — Texo (ONNX) → LaTeX → mətn LLM → sxem
2. **B** — Vision LLM tək çağırış → sxem

Nəticə `docs/decisions/ADR-001-ocr-pipeline.md`-ə yazılır. B, A-dan pis deyilsə → **A silinir**
(sadələşdirmə).

## İşə salma

```bash
pip install -r scripts/requirements.txt
cp scripts/.env.example .env   # MODEL, API_KEY, BASE_URL doldur

python scripts/eval.py --selftest                                  # API çağırışı yoxdur — harness-in özünü yoxlayır
python scripts/eval.py --pipeline B --set evals/fixtures.jsonl      # golden-set boşkən canlı test
python scripts/eval.py --pipeline A --set evals/golden-set.jsonl
python scripts/eval.py --pipeline B --set evals/golden-set.jsonl
python scripts/eval.py --compare
```

**Qapı guard-ı:** `n < 30` olan hər hansı dəst üzərində harness faiz ÇAP ETMİR, yalnız xam say
(məs. `2/3`) göstərir və nəticə JSON-una `"gate_status": "QAPI ÖLÇÜLƏ BİLMƏZ (n=…, minimum 30)"`
yazır. Bu, kiçik nümunə üzərində görünən faizin qapı keçidi kimi yozulmasının qarşısını alır —
Faza 0-ın bütün mənası bu rəqəmə güvənməkdir, ona görə etibarsız halda rəqəm göstərilmir.

**Addım bölgüsü — pedaqoji hissə** (bax `ADR-004`) insan rəyi ilə ölçülür:
`evals/results/human-review-<tarix>.jsonl` yarat, hər sətir `{"id": "...", "verdict": true|false, "note": "..."}`.
Fayl yoxdursa `--pipeline` və `--compare` nəticəsində qapı **"NATAMAM"** olur — `error_codes`
kimi bu da avtomatlaşdırılmır, ADR-004-ə bax.

**`JSON_MODE=0`** — bəzi provayderlər `response_format={"type":"json_object"}`-ı dəstəkləmir və
400 qaytarır. `.env`-də `JSON_MODE=0` bunu söndürür (bax `scripts/.env.example`).

**Şəkil ön emalı** (`ADR-006`) — `llm_client.py` hər şəkli açır, EXIF-ə görə döndərir, RGB-yə
çevirir, ən uzun tərəfi kiçildir və HƏMİŞƏ JPEG kimi yenidən kodlayır (giriş HEIC/PNG/WEBP olsa
belə) — bu, MIME səhvlərinin qarşısını kökündən alır. Kiçiltmə hədəfi: `.env`-də `IMAGE_MAX_PX`
(default 1600) və ya `--image-max-px 800` bayrağı (ölçü müqayisəsi üçün). 429/5xx-də 3 cəhdə qədər
eksponensial gözləməli retry — `attempts` sahəsi nəticə faylında görünür. **Kiçiltmə yalnız
eval/server tərəfindədir**, klient (Faza 1) resize etmir.
