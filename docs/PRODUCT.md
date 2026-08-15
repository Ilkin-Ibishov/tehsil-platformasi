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

⚠️ **BU HESABLAMA SƏHV İDİ — `ADR-001` hökmü (2026-08-06) onu ləğv etdi.**
Real ölçmə: **$0.0167/həll** (`gemini-3.6-flash`, giriş 5234 token, çıxış thinking daxil,
**$1.50/$7.50 per-1M qiymətilə hesablanıb**). Abunə 200 həlldən sonra zərərə keçir. Keş
**xərc üçün də lazımdır** — keyfiyyət və latensiya üçün olduğu qədər. Detallar və azaldıcılar:
`ADR-001` → "İki açıq risk".

⚠️ **QİYMƏT KÖHNƏLDİ (2026-08-14 əlavəsi, `ADR-022`):** Google-un rəsmi qiymət səhifəsi
birbaşa yoxlanıldı — `gemini-3.6-flash`-ın HAZIRKI (2026-12-31-ə qədər) qiyməti $0.75/$3.75,
YOX yuxarıdakı $1.50/$7.50. Eyni token sayı ilə real hazırkı xərc **~$0.0084/həll** —
break-even nöqtəsi ~400 həll/aya qalxır. **2027-01-01-də qiymət ikiqat olur, $0.0167 yenidən
düzgün olur.** Model seçimi artıq bu faylda deyil, DB-də (`public.app_config.active_model`,
`ADR-023`) — redeploy-suz dəyişdirilə bilər, bu köhnə ölçmə fərqli model üçün etibarsız ola
bilər. Cari xərci `attempt_items.cost_usd`-dan real ölç, bu faylın rəqəminə güvənmə.

✅ **N=99 REAL ÖLÇMƏ (2026-08-15, HANDOFF 107):** orta **$0.00997/sual** (99 sual ≈ $0.99),
latensiya 19.2 san. Break-even ~295 həll/ay (4.99 ₼ ≈ $2.94). Yəni yuxarıdakı $0.0084
təxmini düz istiqamətdə idi, real rəqəm bir az yüksəkdir — keş hələ də biznes modelinin
şərtidir, optimallaşdırma deyil.

---

# Fazalar və qapılar

Hər fazanın **rəqəmli qapısı** var. Qapı keçilmirsə növbəti fazaya keçmək qadağandır.

## Faza 0 — Eval (2 gün, kod yox) — **KEÇDİ (2026-08-06)**

> **2026-08-06 (n=10, lite):** `ADR-001` HÖKM — vision boru xətti 9/10, Texo SİLİNDİ.
> **2026-08-15 (n=99, tam):** sxem 100% · cavab 94.8% · struktur 100% · sızma 21.9%
> · $0.00997/sual · 19.2 san. **Qapı NATAMAM** — yalnız insan pedaqoji rəyi (`ADR-004`)
> qalıb. Detallar: HANDOFF blok 107. Aşağıdakı orijinal plan tarixi qeyd kimi saxlanılır.

Girişin əksəriyyəti **çap olunmuş DİM test toplusu** olduğu üçün bu qısadır.

1. 30 DİM səhifəsi telefonla çəkilir (müxtəlif işıq, bucaq, əyilmə)
2. `evals/golden-set.jsonl` doldurulur (doğru cavab + addımlar əl ilə)
3. İki boru xətti müqayisə olunur:
   - Texo (ONNX, brauzer) → LaTeX → mətn LLM → sxem
   - Vision LLM tək çağırış → sxem
4. `scripts/eval.py` dəqiqlik və xərci hesablayır

**Qapı:**
- son cavab dəqiqliyi **≥85%** (sympy ilə; `word_problem`-lər məxrəcdən çıxır — bax `ADR-003`)
- sxem validliyi **100%**
- addım bölgüsü — **struktur 100%** (avtomatik) **+ pedaqoji məntiq ≥75%** (insan rəyi, bax `ADR-004`)
- orta xərc/həll ölçülüb

**Nəticə:** `docs/decisions/ADR-001-ocr-pipeline.md` yenilənir

## Faza 1 — Şaquli dilim (2–3 həftə → real: 4–5 həftə) — **CARİ**

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

---

## Vədin pozulduğu yer — dizayn mətni yenilənməlidir

`ADR-024` (2026-08-14) şəkil saxlamağı QƏBUL ETDİ: hər çəkilişdən iki fayl PRIVATE bucket-də,
90 gün. Dizayn faylları (`Kamera.dc.html`) hələ **"Şəkil telefonda qalır"** vədini göstərir.
Bu mətn dəyişdirilməyincə istifadəçiyə yalan deyilir — S4/S5 şagird dəvətindən ƏVVƏL
düzəldilməlidir (uşaq datası, valideyn etimadı).
