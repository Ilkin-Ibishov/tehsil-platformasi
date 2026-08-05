# PRODUCT

## Problem

Azərbaycan şagirdi ev tapşırığında ilişəndə iki seçimi var: repetitor (bahalı, planlı) və ya
cavab verən tətbiq (Photomath, Gauth — pulsuz, amma **köçürməyə** öyrədir). Valideyn isə uşağın
harada ilişdiyini bilmir; yalnız qiyməti görür, səbəbini yox.

## Həll

Şəkil çək → məsələ **addım-addım** açılır → hər addımda şagird **özü cavab yazır** →
səhv **adlandırılır** və kateqoriyalaşdırılır → həftəlik valideyn hesabatı.

Fərq bir cümlədə: **rəqiblər cavab verir, biz harada ilişdiyini deyirik.**

## İstifadəçi və ödəyən ayrıdır

| | Şagird | Valideyn |
|---|---|---|
| Nə istəyir | tapşırığı bitirmək | uşağın irəliləyişini görmək |
| Nə ödəyir | heç nə (kartı yoxdur) | **abunəni** |
| Əsas ekran | Həll ekranı | Hesabat |

Bu ayrım paywall dizaynını təyin edir: şagird "Valideynə göndər" düyməsinə basır, valideynə SMS gedir.

## Bazar

- İlkin: Azərbaycan, 5–11 sinif, riyaziyyat
- İkinci: **Türkiyə** — riyaziyyat dil-yüngüldür, məhsul demək olar dəyişmədən keçir, bazar ~10x böyükdür
- Buna görə **i18n birinci gündən** (az/ru/en/tr onboarding-də artıq var)

## Qiymət (ilkin fərziyyə)

- Aylıq 4.99 ₼ · İllik 49.99 ₼
- ⚠️ Dizayndakı `39.99 ₼ / "2 ay pulsuz"` **səhvdir** — 4.99×12 = 59.88, yəni 39.99 ≈ 4 ay pulsuzdur.
  Qərar: illik qiyməti 49.99-a qaldır, badge "2 ay pulsuz" doğru olsun.
- Pulsuz qat: **cavab limitsiz deyil, izah kilidlidir** — `niyə belədir`, `eynisini sən həll et`,
  səhv xəritəsi abunəyə aiddir. Səbəb: sadəcə həll sayını limitləmək pulsuz istifadəçini funnel-dən qovur.

## Vahid iqtisadiyyat

| | təxmin |
|---|---|
| LLM həlli (keşdə yoxdursa) | ~$0.002–0.005 |
| Keşdən həll | ~$0 |
| Aylıq abunə | $2.94 (4.99 ₼) |
| Break-even | keş hit-i olmadan belə ~600 həll/ay |

Marja problem deyil. Keş **xərc üçün yox, keyfiyyət və latensiya üçün** qurulur.

---

# Fazalar və qapılar

Hər fazanın **rəqəmli qapısı** var. Qapı keçilmirsə növbəti fazaya keçmək qadağandır.

## Faza 0 — Eval (2 gün, kod yox)

Girişin əksəriyyəti **çap olunmuş DİM test toplusu** olduğu üçün bu qısadır.

1. 30 DİM səhifəsi telefonla çəkilir (müxtəlif işıq, bucaq, əyilmə)
2. `evals/golden-set.jsonl` doldurulur (doğru cavab + addımlar əl ilə)
3. İki boru xətti müqayisə olunur:
   - Texo (ONNX, brauzer) → LaTeX → mətn LLM → sxem
   - Vision LLM tək çağırış → sxem
4. `scripts/eval.py` dəqiqlik və xərci hesablayır

**Qapı:** son cavab ≥85% · addım bölgüsü ≥75% · orta xərc/həll ölçülüb
**Nəticə:** `docs/decisions/ADR-001-ocr-pipeline.md` yenilənir

## Faza 1 — Şaquli dilim (2–3 həftə)

Yalnız bir yol: **Kamera → həll → addımlar**. Auth yox, tab yox, ödəniş yox, lent yox.
Sinif `localStorage`-da.

**Qapı:** 15–20 şagird · 100+ real həll · 20 şagirddən ≥8-i 7 gündə ≥3 dəfə qayıdır

## Faza 2 — Yaddaş və ölçmə (2 həftə)

Hesab, tarixçə, `step_events`, keş qatı, admin dashboard.

**Qapı:** `match_path` paylanması görünür · `transfer_correct` ölçülür

## Faza 3 — Ödəniş niyyəti (1 həftə, PSP YOX)

"Valideynə göndər" işləyir, SMS gedir, amma ödəniş səhifəsi əvəzinə sadə forma — sonra əl ilə zəng.
**Fake door testi:** PSP inteqrasiyasına 3 həftə xərcləmədən ödəməyə hazırlığı ölç.

**Qapı:** paywall görən valideynlərin ≥3%-i əlaqə buraxır

## Faza 4 — Valideyn hesabatı + real ödəniş

Yalnız Faza 3 siqnal verirsə.

## Faza 5 — Lent və Test

Keşdən **avtomatik generasiya** ilə. Əl ilə məzmun istehsalı qadağandır — bax `ADR-001`.

---

## Hələ dizayn edilməmiş, amma vəd edilən

Paywall `Səhv xəritəsi` vəd edir, `MƏN` tabı naviqasiyada var — ikisi də mövcud deyil.
Faza 2-dən əvvəl dizayn olunmalıdır, yoxsa satılan şeyin biri boşdur.

- [ ] Səhv xəritəsi ekranı
- [ ] MƏN / profil ekranı
- [ ] Tarixçə (`hamısı` düyməsinin hədəfi)
- [ ] Şagird üçün "valideyn bunu görür" önizləməsi (etimad üçün kritik)
