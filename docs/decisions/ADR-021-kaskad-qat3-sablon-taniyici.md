# ADR-021 — Kaskad Qat 3: şablon tanıyıcısının həcmi, Qat 4-ün təxiri

**Status:** Qəbul edilib · **kaskadın özü kimi bayraq arxasında, defolt SÖNÜK**
**Tarix:** 2026-08-14
**Toxunur:** `ADR-020` (kaskad qatları — bu ADR onun Qat 3/4 boşluğunu doldurur) · `ADR-007`
(bərabərlik-pozucu / "şübhəli isə imtina" prinsipi) · `0037`/`0038` miqrasiyaları (RPC və
birdəfəlik SQL backfill)
**ClickUp:** `86eykhvcg` (bu tapşırığın özü) · `86eykj7tu` (kaskad)

## Kontekst

`ADR-020` Qat 3-ü ("şablona oturur → generasiya, LLM YOX") və Qat 4-ü ("sympy həll edir,
LLM izah yazır") qəsdən boş buraxdı — hər ikisi "ayrı iş, ADR tələb edir" deyə qeyd edildi
(`run.ts`-in öz şərhi). Bu ADR ikisini AYRI qərarlar kimi həll edir, çünki riskləri fərqlidir.

## Qərar 1 — Qat 3 QURULUR, amma yalnız TƏMİZ tənlik şablonları üçün

`0038` miqrasiyası 5 mövzu kodu üçün SQL-də şablon **istehsal etmişdi** (birdəfəlik backfill,
217 bank sualı üçün): `FAIZ.PERCENT_OF`, `FAIZ.INCREASE`, `ALG.LINEAR_EQUATION`,
`ALG.QUADRATIC_EQUATION`, `ALG.VIETA_SUM`. Amma bu, Qat 3-ün özü DEYİL — 0038 sabit
`v1|v2|v3` pipe-formatını `q.canonical`-dan `split_part`-la oxudu, bu format YALNIZ o
sualları yaradan generasiya skriptinin öz konvensiyasıdır.

**Real Qat 1 çıxışı (`docs/TRANSCRIBE-SCHEMA.json`-un `canonical` sahəsi) fərqlidir:** sərbəst
ASCII-math (`"3x^2-5x+6=0"`) və ya tam mətn məsələsi (`"Bir malın qiyməti 40 manatdır. Qiymət
10% artırılıb..."`). 0038-in pipe-parse məntiqini birbaşa köçürmək YANLIŞDIR — canlı
transkripsiyada heç vaxt `|` formatı olmayacaq.

Buna görə Qat 3-ün əsl işi — "hansı canonical hansı şablona oturur" tanıyıcısı — İKİ risk
sinfinə bölünür:

| Sinif | Nümunə | Tanıma üsulu | Risk |
|---|---|---|---|
| Təmiz tənlik | `ALG.LINEAR_EQUATION`, `ALG.QUADRATIC_EQUATION`, `ALG.VIETA_SUM` | `canonical` sərbəst ASCII-math-dır, əmsallar sərt regexlə (`/^(-?\d+)x\s*([+-]\s*\d+)?\s*=\s*(-?\d+)$/` formasında) çıxarıla bilər — uyğun gəlməzsə `null` (imtina) | **Aşağı** — uyğunsuzluq quruluş fərqindən dərhal görünür, silinmiş uyğunluq yoxdur |
| Mətn məsələsi | `FAIZ.PERCENT_OF`, `FAIZ.INCREASE` | `canonical` sərbəst mətndir ("40 manatdır", "qiyməti 15% artırılıb") — ədədləri düzgün YERİNƏ (hansı ədəd əsas, hansı faiz) qoymaq mətnin ifadə tərzindən asılıdır | **Yüksək** — səhv yerləşdirmə (əsas/faiz qarışıqlığı) SƏSSİZCƏ yanlış addım göstərər, `ADR-007`-in "şübhəli isə imtina, təxmin bahalıdır" qaydasını pozar |

**Qərar:** Qat 3 İNDİ yalnız **təmiz tənlik** sinfini (3 topic_code) əhatə edir. Mətn
məsələsi sinfi (`FAIZ.*`) **TƏXİRƏ SALINIR** — regex-əsaslı sərbəst-mətn ədəd-yerləşdirməsi
`evals/golden-set.jsonl` üzərində ölçülmədən yazılmır (eyni intizam: `ADR-014`/`ADR-020`-nin
"ölçülmədən qərar verilmir" qaydası). `FAIZ.*` üçün Qat 2 (bank) və Qat 5 (LLM) kifayət edir.

Tanıma məntiqi: `topicCode` Qat 1-dən artıq gəlir (bank.ts-in özü də `topic_code`-a
bərabərlik-pozucu kimi güvənir, eyni etibar səviyyəsi burada da tətbiq olunur). Uyğun
`topicCode` üçün sərt regex əmsalları çıxarır; regex uyğun gəlmirsə (mürəkkəb tənlik,
gözlənilməz format) → `null`, Qat 5-ə (LLM) düşür. **Heç vaxt təxmin edilmir.**

### Yeni `match_path` dəyəri — Cowork-a AÇIQ sual

`web/lib/cascade/types.ts`-in `MatchPath` enum-u (`hash | fingerprint | embedding | llm |
image_cache`) heç bir "LLM yox, amma bank da yox" halını əhatə etmir. `docs/TELEMETRY.md`
bu taksonomiyanın sahibidir (`CLAUDE.md` fayl-sahibliyi cədvəli) — mən `"template"` dəyərini
əlavə etdim (aşağıdakı kod), amma bu, **TELEMETRY.md-nin özünün Cowork tərəfindən
yenilənməsini tələb edir**. `docs/HANDOFF.md`-ə açıq qeyd yazılıb, Cowork təsdiqləməyincə
bu, yalnız kodda mövcud olan, sənədləşməmiş dəyərdir.

## Qərar 2 — Qat 4 TƏXİRƏ SALINIR, indi qurulmur

Sympy serverdə yoxdur. İki seçim var:

| Seçim | Xərc/mürəkkəblik | Risk |
|---|---|---|
| WASM sympy (Pyodide) Node prosesinə yüklənir | Bundle ~15-30MB, soyuq-başlanğıc gecikməsi (~1-3s) hər instansda | Latensiya artımı `PHASE-1.md`-in 16.8s gecikmə narahatlığına ƏLAVƏ olunur |
| Ayrı Python mikroservisi (`scripts/lib/verify.py` artıq mövcud sympy məntiqini FastAPI-yə bağlamaq) | Yeni deploy edilən xidmət, Vercel-dən kənar host (Railway/Fly), şəbəkə round-trip | Əməliyyat mürəkkəbliyi (monitorinq, uptime) — layihənin hazırkı "tək Vercel + Supabase" sadəliyini pozur |

**Qərar:** Heç biri indi qurulmur. **Tövsiyə (qərar deyil, gələcək ADR üçün qeyd):** Python
mikroservisi — səbəb, `scripts/lib/verify.py` onsuz da mövcuddur və sympy-nin WASM portu
üçün bilinən sürət/dəqiqlik güzəştləri var (bax `scripts/eval.py`-nin öz sympy asılılığı).
Amma bu, YENİ infrastruktur qərarıdır, ayrı ClickUp tapşırığı və ayrı ADR açılanda
qiymətləndirilməlidir. `run.ts`-in massivində Qat 4 yeri boş qalır, şərhlə qeyd edilib.

## Nəticələr

**Müsbət:** Qat 3 real, ölçülə bilən dəyər verir (3 tənlik növü üçün sıfır-LLM-xərcli həll,
kaskad hələ bayraq arxasında olduğu üçün production-a təsirsiz). Səhv-yerləşdirmə riski olan
mətn-məsələsi sinfi toxunulmadı.

**Mənfi:** Qat 3-ün əhatəsi 5 topic_code-dan 3-ə düşdü — `FAIZ.*` hələ Qat 5-ə (LLM xərcli)
düşür. `match_path='template'` Cowork təsdiqi gözləyir — təsdiqlənməyincə telemetriya
dashboard-larında sənədləşməmiş dəyər kimi görünəcək.

**Ölçüləcək (kaskad aktivləşəndə, `ADR-014` qapısından sonra):** Qat 3-ün nə qədər faiz
sorğunu tutduğu (3 topic_code-un bank/real trafikdəki payı) — aşağıdırsa genişləndirmə
(FAIZ.* üçün ayrıca, ölçülmüş NLP yanaşması) haqlı çıxmır.
