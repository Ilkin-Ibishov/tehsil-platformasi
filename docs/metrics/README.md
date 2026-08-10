# Metrics

```bash
node scripts/metrics/snapshot.mjs        # yaz + çap et
node scripts/metrics/snapshot.mjs --dry  # yalnız çap et
```

## Fayllar

| Fayl | Nə |
|---|---|
| `latest.json` | Son snapshot |
| `history.jsonl` | Append-only zaman seriyası — dinamika buradan oxunur |
| `gate.json` | **Əl ilə doldurulur** — Faza 1 qapısının real rəqəmləri |

## Nə ölçülür

**Tərkib** — sətir sayı kateqoriyalar üzrə (app / docs / adr / handoff / spec / test /
migration / eval / design / prompt). `doc_to_code_ratio` bu bölmədən çıxır.

**Sürət və fokus** — commit sayı, aktiv gün, churn (silinən/əlavə = yenidən iş siqnalı),
commit tipləri. Ən vacibi **`focus_pct`**: son N gündə commit-lərin neçə faizi
`web/`, `supabase/` və ya `prompts/` toxunub. Yəni istehsalata çatan iş.

**Qərar sağlamlığı** — ADR sayı və statusu, nömrə toqquşmaları, HANDOFF blok sayı və
uzunluğu, **açıq blok sayı**.

**Təhvil** — miqrasiya, API route, komponent, test faylı sayı.

**Qapı** — `gate.json`-dan. Bu rəqəmlər 0 olduğu müddətdə qalan hər şey fərziyyədir.

## Xəbərdarlıq həddləri

| Metrik | Hədd | Səbəb |
|---|---|---|
| `doc_to_code_ratio` | > 1.5 | Sənəd kodu üstələyir |
| `focus_7d_pct` | < 40 | Həftə istehsalata çatmayan işə gedib |
| `test_to_app_ratio` | < 0.2 | Test örtüyü yoxdur |
| `handoff.lines` | > 2500 | Rotasiya vaxtıdır, kontekst xərci artır |
| `churn_ratio` | > 0.6 | Çox yenidən yazılır — qərar erkən verilib |
| `gate_progress_pct` | = 0 | Real istifadəçi məlumatı yoxdur |

## İstifadə qaydası

Hər HANDOFF növbəsinin sonunda işlət. Rəqəm özü qərar vermir — **trend** verir.
Bir snapshot mənasızdır, `history.jsonl`-dakı iki həftəlik seriya mənalıdır.

`gate.json` real şagird məlumatı gələn kimi doldurulmalıdır. O fayl 0 qaldığı müddətdə
bütün digər metriklər yalnız **fəaliyyət** ölçür, **irəliləyiş** yox.
