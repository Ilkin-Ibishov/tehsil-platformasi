# ADR-005 — Cavab sızmasının tərifi

**Status:** Qəbul edilib
**Tarix:** 2026-08-05
**Dəyişdirir:** `evals/README.md` → "Cavab sızması" metrikası · `scripts/lib/leak.py`

## Kontekst

`ADR-004`-ə görə son addım **məcburi yoxlama addımıdır**. Prompt v3 bunu təmin etdi.
Nəticədə cavab sızması **0/3 → 1/3** oldu.

Sızan sayılan hal (`fx-003`, faiz məsələsi, `final_answer.values = ["230"]`):

```
Addım 2:  check.ask "Yeni qiymət nə qədərdir?"          accept ["230"]
Addım 3:  check.ask "230, 200-dən neçə faiz çoxdur?"    accept ["15"]
          explanation: "...230-un 200-dən neçə faiz çox olduğunu hesabla."
```

`leak.py` `230`-u 3-cü addımın `explanation`-ında tapıb sızma elan edir.

**Bu, yanlış müsbətdir.** Şagird `230`-u **2-ci addımda özü yazıb**. Üstəlik yoxlama addımı
cavaba istinad etmədən mümkün deyil — kökü adlandırmadan onu tənliyə yerinə qoya bilməzsən.

Yəni `ADR-004`-ün tələb etdiyi yoxlama addımı ilə mövcud sızma tərifi **struktur olaraq ziddir**.
Hər düzgün yoxlama addımı sızma kimi sayılacaq.

## Qərar

Sızmanın tərifi dəqiqləşdirilir:

> **Sızma = şagirdin hələ soruşulmadığı dəyəri açıqlamaq.**

Formal qayda — `final_answer.values`-dən `V` dəyəri `i`-ci addımda sızmış sayılır ƏGƏR:

1. `V` `steps[i].explanation`-da görünürsə, **VƏ**
2. `V` **heç bir əvvəlki** addımın (`j < i`) `check.accept` siyahısında yoxdursa

Yəni şagird dəyəri artıq özü istehsal edibsə, sonrakı addımda ona istinad etmək sızma deyil.

`V` həmin addımın **öz** `check.accept`-indədirsə və `explanation`-da görünürsə — **bu, sızmadır**
(izah öz sualının cavabını verir). Qayda 2 qəsdən `j < i` yazılıb, `j ≤ i` yox.

## Yoxlama

| hal | köhnə | yeni | doğru? |
|---|---|---|---|
| `fx-003` addım 3: `230`, əvvəl addım 2-də `accept ["230"]` | sızma | **sızma deyil** | ✅ |
| selftest `leaked_explanation`: addım 1 `explanation`-da `3`, öz `accept ["3"]` | sızma | **sızma** | ✅ |

Hər iki halda düzgün nəticə verir.

## Nəticələr

- `leak.py` `detect_leak(steps, final_answer_values)` imzasını saxlayır, məntiq dəyişir
- `evals/README.md`-də metrika təsviri yenilənir
- `selftest-cases.jsonl`-a yeni müsbət hal: yoxlama addımı əvvəlki `accept` dəyərinə istinad edir
  → **sızma sayılmamalıdır**

## Niyə metrika dəyişdi, prompt yox

`ADR-004`-də əks qərar verilmişdi (prompt dəyişdi, metrika qaldı) — çünki orada metrika
məhsulun dizayn tələbini əks etdirirdi. Burada tərsdir: yoxlama addımı dizayn tələbidir və
metrika onu cəzalandırır. **Hansının dəyişəcəyini məhsul qərarı təyin edir, hansının daha
rahat düzəldiyi yox.**
