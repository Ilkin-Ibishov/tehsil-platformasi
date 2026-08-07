# Kütləvi eval — çoxlu məsələ, sürətli, ucuz

**Məqsəd:** OCR-i deyil, **addım keyfiyyətini və format sabitliyini** həcmdə ölçmək.
Şəkil boru xətti işləyir (`ADR-001`, 9/10) — indi darboğaz odur ki, hər ölçmə
10 fotoya bağlıdır.

## Əsas ideya — girişi mətnə ayır

Hazırda eval hər item üçün şəkil göndərir: **$0.0167** və **16.8 san**.
Şəkil tokenləri girişin böyük hissəsidir.

Mətn girişi ilə eyni prompt ~**$0.003** olur (5x ucuz) və daha sürətlidir.
Yəni **eyni büdcəyə ~5 dəfə çox məsələ**, və paralel işlədilə bilər.

Bu, dəqiqlik ölçüsünü zəiflətmir, çünki **iki fərqli sualı ayırır**:

| sual | necə ölçülür |
|---|---|
| Şəkli düzgün oxuyurmu? | 10 foto, artıq ölçülüb — **9/10** |
| Addımları düzgün qururmu? | **mətn dəsti, 100–300 məsələ** |

## Korpus — bir dəfə qur, dəfələrlə işlət

1. Test toplusunun səhifələrini kütləvi çək (səhifə başına 10–15 məsələ)
2. **Bir dəfə** vision ilə mətnə çevir (`status: multiple_problems` → `candidates`
   onsuz da hər məsələni ayırır — bu axın artıq mövcuddur, `ADR-007`)
3. Nəticəni `evals/text-set.jsonl` kimi saxla

⚠️ **`evals/text-set.jsonl` `.gitignore`-a əlavə edilməlidir** — DİM mətni ehtiva edir
(`ADR-003`). `images/` ilə eyni rejim.

30 səhifə ≈ 300 məsələ ≈ bir dəfəlik ~$0.50 çevirmə xərci.

## Format

```jsonc
{ "id": "t001",
  "problem_text": "…",          // image sahəsinin əvəzinə
  "grade": 11,
  "source": "test_toplusu_s60_q6",
  "expected_status": "ok",
  "final_answer_values": ["0"],  // varsa — yoxdursa yalnız struktur ölçülür
  "answer_values_are": "alternate_forms" }
```

`final_answer_values` **məcburi deyil**. Cavab açarını yazmadan da struktur, format və
qayda uyğunluğu ölçülə bilir — bu, korpusu qurmağı kəskin ucuzlaşdırır.

## Nə AVTOMATİK ölçülür — v7 bunu mümkün etdi

`ADR-013`-ün əsas nəticəsi: **mexaniki qayda işləyir, məna tələb edən qayda işləmir.**
Eyni səbəbdən mexaniki qaydalar **maşınla yoxlana bilir**. v7-dən sonra dördü avtomatdır:

| yoxlama | necə |
|---|---|
| Sxem validliyi | mövcud |
| Struktur (say, `index`, `check`, fərqli `error_code`) | mövcud |
| **Qayda 10** — variant seçimi | `check.ask`-da `hansı variant\|variantlardan\|cavab variantı` → sınır |
| **Qayda 14** — yoxlama ilkin şərtə qayıdır | son addımın `check.ask`-i `canonical`-dan ən azı bir simvol/ifadə ehtiva etməlidir |
| **Qayda 12** — düstur sualda | `check.ask`-da mötərizəli düstur nümunəsi (`(3!\|^2\|\\frac`) → şübhəli, işarələ |
| **Qayda 13** — ədədlə əvəzləmə | məsələ ümumi ifadə istəyir, amma addımlar konkret ədəd qoyur → işarələ |
| Sızma | mövcud (`ADR-005`) |
| Xərc / latensiya | mövcud |

`ADR-004` deyirdi ki, pedaqoji ox avtomatlaşdırıla bilməz. **Bu, hələ də doğrudur** —
amma indi onun **böyük hissəsi** avtomatlaşır. İnsan rəyi tam dəstdən **nümunəyə**
keçir: 200 məsələdən təsadüfi **20**-si. Qalanı avtomat tutur.

## İşə salma

```bash
python scripts/eval.py --pipeline B --set evals/text-set.jsonl --input text --concurrency 4
```

Üç yeni bayraq:

- `--input text` — `problem_text` işlədilir, şəkil göndərilmir
- `--concurrency N` — paralel sorğu (rate limit-ə diqqət; 429-da geri çəkil)
- `--limit N` — ilk N item (sürətli sınaq üçün)

**Nəticə `summary-*.json` kimi commit olunur** (`HANDOFF 38`) — `prompt_version` sahəsi ilə.

## Nə ölçmür — bunu unutma

- OCR dəqiqliyi (mətn artıq düzgündür)
- Şəkil keyfiyyəti, kəsmə, çoxsuallı kadr
- `unreadable` / `not_a_problem` yolları (**bunlar hələ heç vaxt ölçülməyib**, bax
  `SYSTEM-REVIEW` § F)

Mətn dəsti şəkil dəstini **əvəz etmir**, ona **əlavədir**.
Şəkil dəsti kiçik qalır (10–30) və nadir işlədilir; mətn dəsti böyük olur və tez-tez.

## Hədəflər

| ölçü | hədəf |
|---|---|
| Sxem validliyi | 100% |
| Struktur | 100% |
| Qayda 10 (variant) | **100%** — v6-da artıq 10/10 idi |
| Qayda 14 (yoxlama) | ≥85% — v6-da 5/10 idi, v7 bunu hədəfləyir |
| Son cavab (açar olan itemlərdə) | ≥85% |
| Pedaqoji (20 nümunə, insan) | ≥75% |
