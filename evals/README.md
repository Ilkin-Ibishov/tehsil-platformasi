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
├── golden-set.jsonl      # ground truth — real DİM şəkilləri çəkilənə qədər BOŞDUR
├── fixtures.jsonl        # sintetik, şəkilsiz nümunələr — golden-set boş olanda da harness işə düşsün deyə
├── selftest-cases.jsonl  # harness-in öz məntiqini (schema/verify/leak) yoxlayan mock nümunələr
└── results/              # eval nəticələri (git-ə getmir)
```

`golden-set.jsonl` boş olduğu müddətcə `--set evals/fixtures.jsonl` istifadə et. Fixture nəticələri
qapı hökmü vermir (aşağıya bax) — yalnız harness-in canlı LLM çağırışı ilə uçdan-uca işlədiyini yoxlayır.

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
  "topic_code": "ALG.KVADRAT_TENLIK",
  "final_answer_values": ["3", "2"],     // maşınla yoxlanılan həqiqət
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
| **Son cavab dəqiqliyi** | `final_answer_values` sympy yoxlanışı | **≥85%** |
| **Addım bölgüsü** | sayı ±1 və başlıqların semantik uyğunluğu | **≥75%** |
| **Sxem validliyi** | `STEP-SCHEMA.json`-a uyğunluq | 100% |
| **Cavab sızması** | `explanation` içində nəticə varmı | ≤10% |
| **Xərc / həll** | token sayı × qiymət | ölçülüb qeyd edilir |
| **Latensiya** | uçdan-uca | ölçülüb qeyd edilir |

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
