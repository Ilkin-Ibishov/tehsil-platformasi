# ADR-016 — DİM korpusu: mənbə bankı kimi saxlanılır

**Status:** Qəbul edilib (sahibin qərarı, 2026-08-08)
**Əvəz edir:** `ADR-003`-ün «mətn saxlanılmır» qaydası
**Toxunur:** `ADR-001` (xərc) · `ADR-014` (triaj) · `SYSTEM-REVIEW §D1, §E` · `BULK-EVAL.md`

## Qərar

DİM sualları **və cavabları** bazada saxlanılır. Şagird yükləməsini gözləmirik —
korpus əvvəlcədən toplanır (scraping) və `problems` cədvəlinə yüklənir.

Hüquqi qiymətləndirmə və məsuliyyət **sahibindir** (Ilkin, 2026-08-08).
`ADR-003`-ün «mətn saxlanılmır» qaydası ləğv olunur — o qayda məhsulun tələb etdiyi
şeyi qadağan edirdi və nəticədə həftələrlə səssizcə pozuldu (`HANDOFF 57`).
Yerinə yetirilə bilməyən qayda qoruma deyil, gizli borcdur.

**Qüvvədə qalan məhdudiyyət:** korpus **daxili aktivdir** — kütləvi ixrac edilmir,
ictimai axtarış interfeysi verilmir, üçüncü tərəfə ötürülmür.

## Nə açılır — sıra ilə, ən vacibindən

### 1. Nəhayət HƏQİQİ dəqiqlik qapısı (ən böyük qazanc)

`ADR-001` yazır: *«Bu ADR təsdiqlənmir — ölçülür. 30 real DİM səhifəsi üzərində.»*
İndiyə qədər **n=10** ilə işləmişik və hər dəfə qeyd etmişik ki, bu, rəsmi qapı deyil.
Səbəb sadə idi: **insan ground truth-u yazmaq bahalı idi.**

Scraping **cavabları da** gətirirsə, ground truth **pulsuz** gəlir.
n=10 → n=300+ olur və `ADR-001`, `ADR-004`, `ADR-013` qapıları ilk dəfə həqiqətən ölçülür.

Bu, layihənin ən uzun müddət açıq qalan boşluğudur.

### 2. Vahid iqtisadiyyat dəyişir

`ADR-001`: $0.0182/həll, abunə 200 həlldən sonra zərərdə.
Korpus əvvəlcədən mövcuddursa, şagirdin çəkdiyi şəkil **məlum məsələyə** uyğunlaşır
və həll **yenidən generasiya edilmir**.

`ADR-001`-in «keş 60%» fərziyyəsi indi **fərziyyə olmaqdan çıxır** — DİM istifadəçisi
üçün hit-rate qat-qat yüksək olmalıdır, çünki hovuz təsadüfi deyil, **hədəflənmişdir**.

⚠️ Amma `SYSTEM-REVIEW §E` xəbərdarlığı qüvvədədir: uyğunlaşdırma `canonical_hash`-a
söykənirsə və `canonical` model çıxışıdırsa, hash sabit olmayacaq.
Scraped mətn ilə model çıxışı **heç vaxt bayt-bayt eyni olmayacaq**.
**`numeric_fingerprint` birinci dərəcəli açar olmalıdır**, `canonical_hash` yox.

### 3. `ADR-014` (triaj) prioritetdə yuxarı qalxır

Şəkli məlum məsələyə uyğunlaşdırmaq üçün **əvvəlcə mətn lazımdır**.
Hazırkı memarlıqda mətn yalnız tam həll çağırışından sonra çıxır — yəni uyğunlaşdırma
üçün onsuz da tam qiymət ödənilir və keş mənasız olur (`ADR-014`-də yazılıb).

Triaj ayrıldıqda: ucuz çağırış → mətn → fingerprint → **korpusda tap** → həll hazırdır.
`ADR-014` artıq yalnız «prompt böyüməsi» məsələsi deyil — **keşin işləməsi üçün şərtdir.**

### 4. Transfer soyuq startı həll olunur

`HANDOFF 57 §1`: hovuzda 3 `formula` məsələsi, 4 mövzu → transfer demək olar ki,
heç vaxt işə düşmür. Korpus yüklənəndən sonra hovuz dərhal dolu olur.

### 5. `BULK-EVAL` korpusu pulsuz gəlir

`BULK-EVAL.md` mətn dəsti təklif edirdi və onu şəkillərdən qurmağı planlaşdırırdı
(~$0.50 çevirmə). Scraped korpus **elə odur** — mətn, `topic_code`, cavab.
Prompt versiyalarını yüzlərlə məsələdə müqayisə etmək mümkün olur.

## Kritik risk — 4/10 promptla kütləvi öncədən həll ETMƏ

Ən cəlbedici addım: bütün korpusu batch rejimdə öncədən həll etmək
(`ADR-001`: batch tier yarıbayarı ucuzdur, $0.75/$3.75).

**Bunu indi etmə.** Pedaqoji ox **4/10**-dur (`ADR-013`) və v8 hələ ölçülməyib.
Minlərlə həlli pis promptla generasiya etmək qüsuru **bazaya bişirmək** deməkdir;
prompt düzələndə hamısı köhnəlmiş olur.

**Doğru forma:**

1. **Məsələləri** yüklə (mətn, cavab, `topic_code`, mənbə istinadı) — ucuzdur, prompta bağlı deyil
2. Həlli **tələb üzrə** generasiya et, birinci istifadədən sonra keşlə
3. `solutions` sətrində **`prompt_version`** saxla (`HANDOFF 38`-də bu sahə onsuz da tələb olunub)
4. Prompt yaxşılaşanda köhnə versiyalı həlləri **etibarsız say** — fon prosesi yenidən generasiya etsin

Kütləvi öncədən həll yalnız pedaqoji ox qapını keçəndən sonra məna kəsb edir.
O vaxta qədər **məsələ bankı** aktivdir, **həll bankı** deyil.

## Ölçmə — korpus yüklənən kimi

| sual | necə |
|---|---|
| Uyğunlaşdırma işləyirmi? | 20 foto çək, neçəsi korpusdakı məsələyə düşür |
| `fingerprint` vs `hash` | ikisini paralel hesabla, hansı daha çox tutur |
| Dəqiqlik (n≥300) | scraped cavab = ground truth, `--input text` |
| Addım sayı paylanması | v8 effekti (baza xətti: 6/7 → 4) |

## Açıq sual — mənbə formatı

Scraping boru xətti mənbədən asılıdır və bu, **hələ müəyyən edilməyib**:

- **HTML/veb** → ucuz parse, sıfır LLM xərci
- **PDF (mətn qatı var)** → `pdftotext`, ucuz
- **PDF (skan/şəkil)** → vision LLM lazımdır, minlərlə səhifə = real xərc
- **Çap kitab** → skan + vision, ən bahalı

Qərar verilməmiş bu sualdan asılı olaraq korpusun qiyməti sıfırdan yüzlərlə dollara qədər dəyişir.
