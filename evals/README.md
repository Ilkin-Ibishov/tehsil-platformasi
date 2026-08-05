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
  "final_answer_values": ["3", "2"],     // insan ground truth-u — 86eyhqggz: modelin dəyəri bunlardan
                                          // HƏR HANSI biri ilə üst-üstə düşsə doğrudur (alternativ
                                          // formalar da ola bilər, məs. ["3/10","0.3","0,3"])
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
| **Son cavab dəqiqliyi** | üç qat (86eyhqggz): (1) golden `final_answer_values` ilə birbaşa müqayisə — əsas mənbə, (2) sympy `canonical`-a qarşı müstəqil çarpaz yoxlama, (3) heç biri mümkün deyilsə `None` | **≥85%** |
| **Yoxlama ziddiyyəti** | (1) və (2) fərqli nəticə verib — golden set-in özündə səhv ola bilər, əl ilə yoxlanmalıdır | qapısız, item id-ləri ilə çap olunur |
| **Variant uyğunluğu** | `expected_choice` son addımın `check.accept`-ində varmı | informativ, qapısız |
| **Addım bölgüsü — struktur** | say 2–6, hər addımda `check`, `index` ardıcıl, son addım yoxlama, `error_code`-lar fərqli | **100%** |
| **Addım bölgüsü — pedaqoji** | insan rəyi: "bu bölgü ilə şagird özü həll edə bilərmi?" (bax `ADR-004`) | **≥75%** |
| **Sxem validliyi** | `STEP-SCHEMA.json`-a uyğunluq | 100% |
| **Cavab sızması** | `V` dəyəri `steps[i].explanation`-da görünür VƏ heç bir **əvvəlki** (`j<i`) addımın `check.accept`-ində yoxdur (`ADR-005`) | ≤10% |
| **Hallüsinasiya** | `expected_status != ok` olduğu halda model yenə `steps`/`final_answer` qaytarır (`ADR-006`) | **0%** |
| **Artıq ehtiyat** | `expected_status == ok` olduğu halda model imtina edir (simmetrik, qapısız) | ölçülüb qeyd edilir |
| **Xərc / həll** | token sayı × qiymət | ölçülüb qeyd edilir |
| **Latensiya** | uçdan-uca, YALNIZ son cəhd (retry gözləməsi daxil deyil) | ölçülüb qeyd edilir |

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
