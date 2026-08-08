# ADR-014 — Çağırışın ikiyə bölünməsi: triaj → ixtisaslaşmış həll

**Status:** Təklif edilib · ölçmə ilə həll olunur (qapı aşağıda, öncədən qeyd edilib)
**Tarix:** 2026-08-07
**Toxunur:** `ADR-001` (tək çağırış qərarı) · `ADR-007` (candidates) · `ADR-008` (neytrallıq) · `BULK-EVAL.md`

## Təklif (Ilkin)

Bir çağırışın əvəzinə iki:

1. **Çağırış 1 — triaj:** şəkil → mətn + təsnifat (fənn, format, sinif, dil,
   çoxsualldırsa `candidates`). Süzgəc rolunu oynayır və **növbəti promptu seçir**.
2. **Çağırış 2 — həll:** seçilmiş **ixtisaslaşmış** promptla addım bölgüsü.

Səbəb: hər fənn və hər sual formatı üçün ayrı prompt lazım olacaq; hamısını bir prompta
yığmaq onu nəhəngləşdirir.

## Bu, `ADR-001`-in geri alınması DEYİL

`ADR-001` **Texo-nu** (ayrıca ONNX OCR modeli) sildi. Arqumentləri: ikinci asılılıq,
20MB brauzer modeli, iki fərqli texnologiya. **Bunların heç biri buraya aid deyil** —
burada eyni provayder, eyni SDK, yalnız ikinci çağırış var.

`ADR-001` həm də yazmışdı ki, latensiyanın səbəbi OCR deyil, **modelin thinking
rejimidir**. Bu, hələ də doğrudur və aşağıdakı risk bölməsində nəzərə alınıb.

## Ən güclü arqument — Ilkinin qeyd etmədiyi

**Hazırda üstün yolda bahalı prompt İKİ DƏFƏ ödənilir.**

Real şəkillərin **10/10-u çoxsualldır** (`ADR-007`, ölçülüb). Yəni normal axın budur:

```
1) tam həll promptu işləyir  →  cavab: "multiple_problems, budur 5 namizəd"   $0.0167
2) şagird birini seçir
3) tam həll promptu YENİDƏN işləyir (selected_label ilə)                      $0.0167
                                                                       CƏMİ  $0.033
```

Birinci çağırış **heç bir həll istehsal etmir** — yalnız «burada 5 məsələ var» deyir —
amma tam qiymətə başa gəlir. Bu, kənar hal deyil, **normal haldır**.

İkiyə bölmə ilə:

```
1) triaj (ucuz model, şəkil, kiçik prompt)                                    ~$0.003
2) həll (yaxşı model, mətn + lazım olduqda şəkil)                             ~$0.010
                                                                       CƏMİ  ~$0.013
```

Yəni **~60% ucuzlaşma** — və bu, `ADR-001`-in «xərc biznes modelinin şərtidir»
xəbərdarlığına birbaşa cavabdır.

## İkinci güclü arqument — keş yalnız bu halda işləyir

`DATA-MODEL.md` keş açarını `canonical_hash` kimi təyin edir. Amma `canonical`
**həll çağırışının çıxışıdır**. Yəni indi keşi yoxlamaq üçün **əvvəlcə tam həlli
almalısan** — keş mənasızdır.

Triaj ayrılanda `canonical` **ucuz çağırışdan** çıxır:

```
triaj → canonical → hash → keşdə var? → BƏLİ: çağırış 2 ümumiyyətlə İCRA OLUNMUR
```

`ADR-001` biznes modelini «keş 60% + Flash-Lite → 200 həll/ay = $0.30» hesabına bağlayır.
**Hazırkı memarlıqda o hesab qeyri-mümkündür.** Bu bölmə onu mümkün edir.

## Digər faydalar

- **Boş spinner problemi həll olunur.** `ADR-001`: *«HƏLL QURULUR boş spinner
  olmamalıdır»*. Triaj 3–5 saniyəyə qayıdır və ekranda **oxunmuş sualı** göstərə bilərik:
  «Sualı oxudum: … · addımlar qurulur». Real məzmun, uydurma mərhələ deyil.
- **Eval strategiyası ilə üst-üstə düşür.** `BULK-EVAL.md` mətn girişli dəst təklif edir;
  bölmədən sonra çağırış 2 **elə həmin şeydir** — memarlıq və test eyni formanı alır.
- **`ADR-008` neytrallığı ucuzlaşır.** ru/en/tr və fizika/kimya üçün prompt böyütmək
  yox, **yeni fayl** əlavə etmək kifayət edir.
- **Sxem xətasında yalnız çağırış 2 təkrarlanır** — şəkil yenidən göndərilmir.

## Riskin adı — və bunu kiçiltmək

### R1 · Şəkildəki məlumat itə bilər (ƏSAS RİSK)

Həndəsə, cədvəl, qrafik, diaqram — bunlarda **şəkil məsələnin özüdür**, mətnə
tam çevrilə bilməz. `problem_type: geometry` sxemdə var və **heç vaxt sınanmayıb**
(`SYSTEM-REVIEW` §F).

**Ona görə bölmə «şəkli atmaq» kimi qurulmamalıdır.** Doğru forma:

> Çağırış 1 **promptu seçir**. Çağırış 2 mətni alır, **və triaj deyirsə şəkli də alır.**

`geometry` / `has_figure: true` → şəkil də ötürülür. Bölmə *prompt seçimi* haqqındadır,
*şəkli atmaq* haqqında deyil. Bu fərq ADR-in mərkəzidir.

### R2 · Səhvlərin yığılması

İki çağırış = iki uğursuzluq nöqtəsi. Triajdakı transkripsiya səhvi çağırış 2-yə
**səssizcə** ötürülür və orada şəkil olmadığı üçün model onu düzəldə bilmir.

Hazırkı hallüsinasiya nəticəsi **0/9**-dur — bu, model şəkli **həll edərkən də**
gördüyü üçündür. Bu göstərici geriləyə bilər. Qapıda ölçülür.

### R3 · Latensiya arta bilər

İki ardıcıl çağırış. Triaj «thinking»siz və ucuz modeldə olmalıdır, yoxsa cəmi 16.8-i
keçər. R3 qapıda ölçülür; qismən azaldıcı — triaj nəticəsi dərhal ekrana çıxır.

## Qapı — öncədən qeyd edilir (`ADR-001` intizamı)

10 kəsilmiş şəkil üzərində **hər iki memarlıq** işlədilir və müqayisə edilir:

| ölçü | şərt |
|---|---|
| Son cavab dəqiqliyi | tək çağırışdan **≥1 item-dən çox itirməsin** (9/10 → ≥8/10) |
| Hallüsinasiya | **0** olaraq qalsın (xam, çoxsuallı dəstdə) |
| Struktur / sxem | 100% qalsın |
| Xərc (çoxsuallı yol, 2 mərhələ) | **azalsın** |
| Latensiya | triajın qayıtması **≤6 san** (ekran məzmunu üçün) |

**Şərtlərin hamısı ödənilmirsə tək çağırış qalır.** Ölçülmədən qərar verilmir.

Xərc: 10 şəkil × 2 memarlıq ≈ **$0.35**.

## Vaxt — nə vaxt edilməli

**Faza 1-in sonunda, S4/S5 bitəndən sonra, şagirdlərə verməzdən əvvəl.**

- **İndi yox:** S4 (həll ekranı) məhsulun özüdür və hələ qurulmayıb; memarlığı onun
  altından dəyişmək S4-ü iki dəfə yazmaq deməkdir.
- **Faza 2-yə saxlanmır:** çünki iki dəfə ödənən prompt **indiki** xərc problemidir və
  şagirdlər gələndə real pul yandıracaq.

**İndi ediləcək hazırlıq (ucuz, memarlığı dəyişmir):**
promptu **nüvə + fənn əlavəsi** kimi böl (`prompts/solve/core.md` + `prompts/solve/math.md`),
`prompt_loader` onları birləşdirsin. Tək çağırış davam edir, amma bölmə günü
bu, **marşrutlaşdırma dəyişikliyi** olur, yenidən yazma yox.

## Alternativlər

- **Hər şeyi bir nəhəng prompta yığmaq:** rədd edilir. `ADR-013` göstərdi ki, məna
  tələb edən qaydalar onsuz da 5/10 tutulur; prompt böyüdükcə bu pisləşir.
- **Triajı kodda etmək (LLM-siz):** mümkün deyil — fənn və format təyini şəklin
  məzmununu anlamaq tələb edir.
- **Üç çağırış (triaj → həll → yoxlama):** həddindən artıq. sympy yoxlaması onsuz da
  koddadır və pulsuzdur.
