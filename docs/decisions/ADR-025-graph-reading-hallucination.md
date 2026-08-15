# ADR-025 — Qrafik oxuma hallüsinasiyası (Qat 1, `has_figure=true`)

**Status:** Qismən qərar — Qat 1 modeli dəyişdi; qrafik dəqiqliyi hələ ölçülməyib (n=2)
**Tarix:** 2026-08-15; əlavə 2026-08-16
**Toxunur:** `ADR-001` (OCR boru xətti, mətn dəqiqliyi ÖLÇÜLÜB — qrafik YOX),
`prompts/solve/core.md` §"HƏNDƏSƏ" (yalnız ölçü/uzunluqları yazmağı tələb edir, əyri/xəttin
İSTİQAMƏTİNİ NECƏ oxumağı YOX), HANDOFF blok 103/104

## Kontekst

Ilkin real DIM sualının şəklini çəkdi: `y=kx+b` qrafikinə görə `k`/`b`-nin işarəsini
müəyyənləşdirmək (5 variantlı, A-E). DIM-in öz açarına görə düzgün cavab **D) k<0, b>0**.
Sistem **B) k>0, b<0** qaytardı.

Şəklin özü (Ilkin tərəfindən Claude Code-a birbaşa göndərildi, DB-də saxlanmadı — bax aşağı)
əl ilə yoxlanıldı: xətt **AZALANDIR** (sol yuxarıdan sağ aşağıya), y-oxunu **MÜSBƏT**
yarımoxda kəsir. Bu, D-ni tam təsdiqləyir.

`ocr_captures.ocr_raw` (Qat 1-in transkripsiyası) isə belə yazmışdı:

> "Düz xətt **artandır** (artma istiqaməti sol aşağıdan sağ yuxarıyadır), y oxunu 0-dan
> **aşağıda** (mənfi yarımoxda)... kəsir."

**İkisi də TƏRS.** Model qrafikin istiqamətini VƏ y-kəsişməsinin işarəsini YANLIŞ oxudu.
Bütün sonrakı addımlar (k/b-nin işarəsi, addımların `check`-ləri) bu YANLIŞ transkripsiya
üzərində DÜZGÜN riyazi məntiqlə qurulub — yəni **qat 2-5 səhv etməyib, qat 1 (görmə) səhv
edib**. Bu, CLAUDE.md-in Qızıl qaydasını (`error_code` xəritəsinin doğruluğu) birbaşa
zədələyən sinifdir: şagird "SIGN_CHOICE" səhvi kimi qeyd olunan bir addımda əslində HEÇ NƏ
səhv etməyib — sual özü YANLIŞ girişdən qurulub.

## Niyə bu, ADR-001-in ölçdüyündən FƏRQLİDİR

`ADR-001`/Faza 0 qapısı **mətn/düstur OXUMA** dəqiqliyini ölçüb (9/10). Bu hadisə **qrafik
YOZMA**dır — modelin bir əyrinin/xəttin vizual formasından RİYAZİ NƏTİCƏ (artan/azalan,
işarə) ÇIXARMASI, sadəcə simvolları transkripsiya etməsi YOX. Bu, fərqli bir bacarıq sinfidir
və HEÇ VAXT ayrıca ölçülməyib — `evals/golden-set.jsonl`-in mövcud sətirlərində
`capture: print_good_light` kimi teqlər var, amma "qrafik + istiqamət oxuma" ayrıca
kateqoriya kimi İŞARƏLƏNMİR.

## Əlavə tapıntı — bu solve DEBUG EDİLƏ BİLMƏDİ, S1 hələ tam işləmir

Bu tapıntının ÖZÜ yalnız Ilkin şəkli Claude Code-a BİRBAŞA (bu söhbətdə) göndərdiyi üçün
mümkün oldu — `ocr_captures.storage_path` bu attempt-də DƏ `null`-dur (HANDOFF 103-ün
tapdığı `SUPABASE_SERVICE_ROLE_KEY` problemi hələ həll olunmayıb). Bucket-də hələ 0 fayl var.
**S1 tam açılana qədər bu sinif bug HƏR DƏFƏ Ilkin-in əl ilə şəkli bizə göndərməsini tələb
edəcək** — bu, S1-in dəyərinin məhz nə üçün olduğunun ikinci real sübutudur (birincisi blok
95 idi).

## Qərar verilmədi — açıq suallar

1. **Ölçülməli:** neçə faiz `has_figure=true` solve-da qrafik istiqaməti/işarəsi səhv oxunur?
   `n=1`-dən qərar VERİLMİR (ADR-004-ün eyni intizamı) — golden-set-ə qrafikli suallar
   əlavə edilməli, ayrıca metrika kimi ölçülməli.
2. **Mümkün istiqamətlər (heç biri seçilmib):**
   - Prompta qrafik-spesifik təlimat əlavə etmək ("əvvəlcə iki nöqtə seç, bucaq əmsalını
     onlardan hesabla" kimi addım-addım vizual oxuma protokolu) — riskli, ölçülmədən effekti
     bilinmir.
   - `ocr_confidence`-ə bənzər ayrıca "figure_confidence" sahəsi — modelin ÖZÜ şübhəli olduğu
     qrafikləri işarələsin.
   - Qrafikli suallarda `verification.method` HEÇ VAXT "sympy" ola bilmədiyi üçün (S5-in
     ölçdüyü kimi, bu sinif artıq `no_single_variable_equation`/`no_equation_extracted`-ə
     düşür) UI-dakı "yoxlanılmadı" xəbərdarlığı (S5) BU HAL üçün XÜSUSİLƏ DƏYƏRLİDİR — heç
     olmasa şagird xəbərdar olur.
3. **DİM-in açar cavabları** (test toplusunun son səhifələrində) gələcək bir avtomatlaşdırılmış
   test dəstinin `expected_choice`-u ola bilər — bax HANDOFF 104-ün "avtomatlaşdırılmış test
   boru xətti" müzakirəsi (Scribd mənbəyi əlçatan deyil, alternativ axtarılır).

## Nəticə

Kod dəyişikliyi əvvəl EDİLMƏDİ (n=1 üzərində qərar vermək ADR-004-ün əleyhinədir). Bu ADR risk
sinfini SƏNƏDLƏŞDİRİR ki, gələcək bənzər hadisələr təsadüfi görünməsin — ClickUp-da izlənilir.

## Əlavə (2026-08-16) — n=2 və Qat 1 model

İkinci ölçü: DİM 12, `y=kx+b`, `k+b`. Əsl qrafik y-kəsişmə **+5**, x-kəsişmə **−5** → `k=1`,
`k+b=6` (A). Qat 1 (`gemini-3.1-flash-lite`) yazdı: y-oxunu **−5**-də, x-oxunu **5**-də —
kəsişmələr dəyişdirildi və işarələr çevrildi. Qat 5 yanlış mətni düzgün həll etdi (`k+b=-4`, C).
Şagird şəkildən `b=5` desə `COEFFICIENT_READ` alardı.

Ilkin qərarı: Qat 1 **`gemini-3.7-flash`** (`0065`, `active_transcribe_model`). Qat 5
`active_model` toxunulmur. Qat 5-ə şəkil hələ GETMİR (ADR-020) — bu, model dəyişikliyi deyil,
ölçmə (Faza 2 soak S4 `has_figure`) tələb edir. `transcribe.md` v2 kəsişmə oxumağı mexaniki
qayda kimi yazır.

