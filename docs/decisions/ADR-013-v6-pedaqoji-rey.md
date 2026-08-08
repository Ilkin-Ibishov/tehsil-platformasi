# ADR-013 — v6 pedaqoji rəyi: bir qayda tam işlədi, ikisi yarımçıq

**Status:** Qəbul edilib
**Tarix:** 2026-08-07
**Davamı:** `ADR-010` (v6 qaydaları) · `ADR-004` (insan rəyi metodu)
**Nəticə faylı:** `evals/results/human-review-2026-08-07.jsonl`

## Nəticə

| ölçü | v5 | v6 | qapı |
|---|---|---|---|
| Pedaqoji (ADR-010 standartı) | — | **4/10** | ≥75% ❌ |
| Pedaqoji (v5 standartı ilə, müqayisə üçün) | 6/10 | **7/10** | — |

İki rəqəm verilir, çünki **standart ADR-010 ilə sərtləşdi**. v5-i qiymətləndirəndə zəif
yoxlama addımına tolerans göstərmişdim (`c01`, `c07` buna görə keçmişdi); ADR-010 qayda 11
və 12-ni normativ edəndə həmin tolerans qanuni olmaqdan çıxdı. Tək rəqəm versəydim,
«v6 daha pisdir» kimi oxunardı — halbuki model yaxşılaşıb, ölçü sərtləşib.

**Bunu ayrıca yazıram, çünki bir dəfə əks səhvi etmişik:** `ADR-009`-da 3/10 dəqiqlik
əslində ölçmə qüsuru idi. Pis metrika modelə qarşı ittiham kimi oxunur.

**Qeyd (2026-08-07, HANDOFF 38) — bu ADR-dakı `7/10` BAŞQA metrikadır, QARIŞDIRMA.**
Yuxarıdakı cədvəldəki `7/10` **pedaqoji rəydir** (v5 standartı ilə, insan qiymətləndirməsi).
`docs/decisions/ADR-001-ocr-pipeline.md`-in "Yenilənmə (2026-08-07)" qeydindəki `7/10` isə
**son cavab dəqiqliyidir** (`final_answer_accuracy`, `scripts/lib/verify.py`) — TAMAMİLƏ
FƏRQLİ ölçü, təsadüfən eyni gündə eyni rəqəmə düşüb. İkincisi ölçmə qüsuru idi (normallaşdırma,
düzəldi, əsl nəticə 9/10 — `HANDOFF 37/38`), BİRİNCİSİ (bu ADR-dakı pedaqoji 7/10) ölçmə qüsuru
DEYİL, real insan rəyidir, dəyişmir. Bu qeyd məhz HANDOFF (27)-dəki "köhnə rəy səhvən v6-ya aid
edildi" sinfindən bir qarışıqlığın qarşısını almaq üçündür.

## Qayda-qayda hesabat

### Qayda 10 (variant seçimi qadağan) — **tam işlədi, 10/10**

v5-də üç məsələdə (`c03`, `c06`, `c09`) model addımı «hansı variant?»-a çevirirdi.
v6-da **heç bir addımda variant seçimi yoxdur**. `c06` tam düzəldi və keçdi.

Bu, ən vacib nəticədir: **konkret, mexaniki qadağa işləyir.**

### Qayda 11 (yoxlama ilkin şərtə qayıtsın) — **yarımçıq, 5/10**

Həqiqi yoxlama: `c02`, `c05`, `c06`, `c08`, `c09`.
Uydurma yoxlama: `c01` (3×0), `c04` (**−3+1 = −2**, məsələ ilə əlaqəsizdir),
`c07` (verilmiş ədədlərlə), `c10` (0,3×120 → 2-ci addımın nəticəsinə qayıdır).

`c04` diqqətəlayiqdir: v5-də bu məsələdə uydurma yoxlama addımı **yox idi**;
v6 «yoxlama addımı olmalıdır» tələbini oxuyub **boş bir addım əlavə edib**.
Qaydanı forma kimi başa düşüb, məzmun kimi yox.

### Qayda 12 (düsturu sualın içində vermə) — **yarımçıq, 1/2**

`c10` düzəldi (`(3!×3!)` mötərizəsi getdi — bu, ADR-010-da göstərilən konkret nümunə idi).
`c07` düzəlmədi: «1 − 4 nədir?» hələ də əsl fikri (`2^(2+√x) = 4·2^√x`) gizlədir.

Yəni model **adı çəkilən nümunəni** düzəldir, qaydanı ümumiləşdirmir.

## Yeni davranış — ədədlə əvəzləmə

`c03` v5-də variant seçdirirdi. Variant qadağan olunanda model çıxarışı **konkret ədədlə**
əvəz etdi: «y = 7 olduqda 2^(x−5)?», «x = 7 olduqda tərs funksiya?».
Şagird `log₂((x−1)/3)+5` ifadəsini **heç vaxt qurmur**, yalnız 7 ədədi ilə işləyir.
Son cavab şagirdin çıxarmadığı düsturdur.

Bu, qadağanın **kompensasiya davranışı** yaratdığını göstərir: bir qısayol bağlananda
model başqasını tapır. Qayda əlavə edərkən bunu gözləmək lazımdır.

## Qərar — v7, iki qayda, sonra DAYAN

**13. Ümumi ifadə istənəndə konkret ədəd qoyma.** Sual «tərs funksiyanı tap», «həllər
çoxluğunu yaz», «ifadəni sadələşdir» tipindədirsə, addımlar ümumi ifadəni qurmalıdır.
Konkret ədəd yalnız **yoxlama** addımında işlənə bilər.

**14. Yoxlama addımının `check.ask`-i ilkin məsələnin ifadəsini EHTİVA ETMƏLİDİR.**
Bu, qayda 11-in mexaniki formasıdır. Qayda 11 «məna» tələb edirdi və 5/10 tutdu;
qayda 10 mexaniki idi və 10/10 tutdu. Fərq mexanikliyədədir.
Ümumi «yoxlama olmalıdır» tələbi `c04`-də boş addım doğurdu — mexaniki şərt bunu bağlayır.

**Sonra prompt tuninqi dayanır.** İki səbəb:

1. **Overfitting riski.** n=10 və qiymətləndirici mənəm. Üçüncü iterasiya artıq mənim
   rəyimə uyğunlaşdırma olur, məhsul keyfiyyəti yox.
2. **`ADR-001` onsuz da deyir ki, rəsmi qapı n≥30 real şagird istifadəsindən gəlir.**
   Həqiqi siqnal `transfer_correct` və `abandoned_at_step`-dədir — 10 məsələ üzərində
   mənim mühakiməmdə yox.

v7 yazılır, **yenidən eval edilmir**. Növbəti pedaqoji ölçmə ilk 30 real həll üzərində
olur (`PHASE-1.md` → «Faza 1-i bitmiş saymaq üçün»).

## Faza 1-ə buraxılış şərti

v6/v7 ilə buraxmaq **təhlükəsizdir**, çünki ən zərərli davranış — variant seçdirmək —
aradan qalxıb. Qalan qüsurlar (zəif yoxlama addımı, ədədlə əvəzləmə) məhsulun mənasını
pozmur, keyfiyyətini aşağı salır. Real istifadə bu ikisini məndən yaxşı ölçəcək.
