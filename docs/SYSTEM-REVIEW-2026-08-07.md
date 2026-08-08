# Sistem baxışı — 2026-08-07

> Bütün boru xətti üzrə «detektiv» yoxlama: kod, sxem, DB yazıları və ölçmə
> müqavilələri tutuşduruldu. Tapıntılar **təsir dərəcəsinə görə** sıralanıb.
> Hər biri konkret fayl/sətirlə bağlıdır.

---

## A · ÖLÇMƏ SINIQDIR — Faza 1 öz qapısını ölçə bilmir

Bunlar ən ciddiləridir, çünki səhv rəqəm səhv koddan pisdir: yanlış qərara **inamla**
aparır. `ADR-009` və `HANDOFF 37` bu səhvin iki dəfə baş verdiyini göstərir.

### A1 · `attempts.completed` iki fərqli məna daşıyır — funnel ölüdür

`/api/solve` həlli çatdırdıqda **dərhal** `completed = true` yazır:

```sql
insert into attempts (…, completed) values (…, true)
```

`DATA-MODEL.md` isə `completed`-i belə tərif edir: **«son addıma çatdımı»**.

İndi bir sütun iki şeyi bildirir: *həll çatdırıldı* (limit/xərc üçün) və
*şagird məsələni bitirdi* (öyrənmə üçün). Nəticə:

- `completed` **həmişə 100%** olacaq
- `abandoned_at_step` bu yolda **heç vaxt dolmayacaq**
- «Harada itiririk?» sualı — `DATA-MODEL.md`-nin «ölçmə birinci həlldən əvvəl
  qurulmalıdır» siyahısındakı bənd — **cavabsız qalır**

**Düzəliş:** iki ayrı sütun. `delivered` (server yazır, limit bunu sayır) və
`completed` (klient son addımdan sonra yazır, defolt `false`).
Limit sorğusu `delivered`-ə keçir. Miqrasiya + `DATA-MODEL.md` yenilənməsi.

### A2 · `solutions.verified` hardcode `true` yazılır

```sql
values ($1,$2,1,$3,true,$4,$5,$6)
```

`verified === null` (sympy yoxlaya bilmədi) halında da `true` yazılır.
Davranış düzgündür — `verified === false` onsuz da bu sətrə çatmır — amma **qeyd yalandır**.

Nəticə: «neçə həll həqiqətən sympy ilə təsdiqlənib?» sualına `verified` sütunundan
cavab **yoxdur**. Yalnız `verification_method`-dan bilinir, yəni sütun ölüdür.
Daha pisi: gələcəkdə kimsə `where verified = true` yazsa, **yanlış nəticə alacaq və bilməyəcək**.

**Düzəliş:** `verified` sütununa həqiqi üçlü dəyəri yaz (`true` / `null`).

### A3 · `device_id` sıfırlana bilir — **retensiya qapısı buna bağlıdır**

Faza 1 qapısı: *«20 şagirddən ≥8-i 7 gündə ≥3 dəfə qayıdır»*.
Bu ölçmə tamamilə `device_id`-yə söykənir, o isə `localStorage`-dadır.

Üç səssiz sızma:

1. Şagird brauzer datasını təmizləyir → **yeni şagird** kimi görünür
2. İki cihaz (telefon + planşet) → **iki şagird**
3. **iOS Safari ITP:** quraşdırılmamış saytın yerli yaddaşı **7 gün istifadəsizlikdən
   sonra silinir**

Üçüncüsü öldürücüdür: qapı **məhz 7 günlük pəncərəni** ölçür. 6-cı gün qayıdan şagird
sayılır, 8-ci gün qayıdan **yeni şagird kimi görünür və retensiya itir**.
Yəni ölçü aləti tam olaraq ölçmək istədiyimiz sərhəddə sınır.

**Düzəliş (Faza 1 üçün kifayət, auth tələb etmir):** dəvət kodunu şagirdə **fərdi** ver
(`ilkin-01` … `ilkin-20`). Kod serverdə `student_ref` kimi saxlanılır və `attempts`-ə
yazılır. `device_id` texniki qalır, **retensiya `student_ref` üzrə hesablanır**.
20 nəfər üçün bu, cəmi 20 sətirlik cədvəldir və qapını etibarlı edir.

Əlavə: şagirdlərə **PWA kimi «Ana ekrana əlavə et»** deməyi tövsiyə et — quraşdırılmış
PWA-da ITP silinməsi tətbiq olunmur.

---

## B · MƏHSULUN ƏSAS AKTİVİ ZƏDƏLƏNƏ BİLƏR

`CLAUDE.md` qızıl qaydası: *bütün dəyər `error_code` taksonomiyasına bağlıdır*.
Aşağıdakı ikisi məhz onu korlayır — və **səssizcə**.

### B1 · Şagirdin cavabı sətir kimi müqayisə olunur → SAXTA səhv kodları

`check.accept` sətir massividir: `["0.5", "0,5", "1/2"]`. Bu variantları **model**
düşünüb. Şagird `½`, `0.50`, `.5`, `1/2 ` (boşluqla) yazsa — siyahıda yoxdur → **səhv**
sayılır → həmin addımın `error_code`-u onun səhv xəritəsinə yazılır.

Şagird **düzgün** cavab verib, amma sistemə görə `SIGN_LOST` edib.
Valideyn hesabatı bu uydurma səhvi «təkrarlanan problem» kimi göstərəcək.

Bu, `ADR-009`/`HANDOFF 37`-dəki **eyni səhvin şagird tərəfidir**: orada golden cavabın
normallaşdırılmasını düzəltdik, burada **şagird cavabının** normallaşdırılması yoxdur.
Eyni səhvi iki dəfə tapdıq, üçüncü yeri hələ düzəltməmişik.

**Düzəliş:** şagird cavabı `web/lib/verify/answer.ts`-dəki **eyni** normallaşdırmadan
keçsin (vergül/nöqtə, boşluq, unicode minus/kəsr, `log_b`, gizli vurma), sonra sympy ilə
ekvivalentlik. Sətir bərabərliyi yalnız son çarədir.
**Bu, S4-dən əvvəl həll olunmalıdır** — S4 hələ qurulmayıb, ona görə vaxt idealdır.

### B2 · `error_code` diaqnoz deyil, **öncədən yazılmış təxmindir**

Hər addımda **bir** `error_code` var və o, addım qurularkən təyin olunur:
*«bu addımı səhv etsən, çox güman SIGN_LOST-dur»*.

Şagird səhv edəndə biz onun **niyə** səhv etdiyini yoxlamırıq — sadəcə addımın öncədən
yazılmış kodunu qeyd edirik. Yəni səhv xəritəsi **model təxminlərinin toplusudur**,
şagird davranışının deyil.

Valideynə *«övladınız daim işarə itirir»* deyirik, halbuki şagird həmin addımı
tamam başqa səbəbdən (məsələn hesablama səhvi) uduzmuş ola bilər.

**Bu, məhsulun mərkəzi vədidir və hazırda təsdiqlənməmiş fərziyyədir.**

**Düzəliş — sxemə əlavə (ADR tələb edir):** addıma `wrong_patterns` sahəsi:

```jsonc
"wrong_patterns": [
  { "value": "3",  "error_code": "SIGN_LOST" },      // işarəni itirsə bu çıxır
  { "value": "9",  "error_code": "SQUARE_FORGOTTEN" }
]
```

Şagirdin cavabı bir pattern-ə uyğun gəlirsə → **diaqnoz edilmiş** kod (yüksək etibar).
Uyğun gəlmirsə → addımın defolt kodu, amma **`confidence: "assumed"`** ilə.
Valideyn hesabatı yalnız diaqnoz edilmişləri sayır; ehtimal olunanlar ayrı saxlanılır.

Model bunları onsuz da yaxşı üretir — tipik şagird səhvini proqnozlaşdırmaq
riyazi olaraq asandır.

---

## C · XƏRC VƏ MÖVCUDLUQ

### C1 · Qlobal xərc tavanı YOXDUR

Limit yalnız `device_id` üzrədir (30/gün). `device_id` isə (A3) sıfırlana bilir.
Dəvət kodu **paylaşılan sirrdir** — şagirdlər onu WhatsApp-da bir-birinə göndərəcək,
bu qaçılmazdır.

Ən pis hal: 20 şagird × 30 həll × $0.0167 = **$10/gün ≈ $300/ay**.
Sızmış kodla tavan yoxdur.

**Düzəliş:** `events`/`solutions` üzərində **gündəlik qlobal xərc sorğusu**; hədd
keçilirsə `/api/solve` hamıya `limit_reached` qaytarır və sənə xəbər verir.
Bir SQL sorğusu + bir env dəyişəni (`DAILY_COST_CEILING_USD`).

### C2 · LLM çağırışında timeout/abort yoxdur, `maxDuration` təyin edilməyib

`web/lib/llm.ts`-də nə `AbortController`, nə timeout var.
`route.ts`-də `export const maxDuration` yoxdur → platforma defoltu işləyir.

Ölçülmüş latensiya **16.8 saniyədir** (`ADR-001`). Bu, defolta çox yaxındır.
Hazırda işləməsi **müqaviləyə görə deyil, təsadüfə görədir**: bir yavaş çağırış
platforma tərəfindən kəsilir və istifadəçi **izahsız xəta** görür.

**Düzəliş:** `export const maxDuration = 60;` + LLM çağırışına ~45 san
`AbortController`. Timeout halında `status: "unreadable"` və `solve.timeout` hadisəsi —
səssiz kəsilmə yox, ölçülən hadisə.

---

## D · HÜQUQİ SƏRHƏD PRAKTİKADA POZULUR

### D1 · `problems.canonical` mətn məsələlərində DİM mətninin ÖZÜDÜR

`ADR-003` və `DATA-MODEL.md`: *«DİM test toplusunun mətni bu cədvəldə saxlanılmır»*.
`canonical` üçün nəzərdə tutulan «normallaşdırılmış qısa forma» idi.

Praktikada model nə qaytarır (golden dəstdən):

```
c09 → "x^3-9x^2+20x=0 tənliyinin təsadüfən götürülmüş həllinin natural ədəd olması ehtimalı"
c10 → "3 oğlan və 2 qız təsadüfi olaraq bir sıraya düzüldükdə bütün oğlanların yan-yana durması …"
```

Bu, məsələnin **mətnidir**. Yəni DB-də DİM mətni saxlanılır — ADR-003-ün qadağan etdiyi şey.

**Düzəliş — iki variant:**
- (a) `canonical`-ı yalnız **riyazi hissə** ilə məhdudlaşdır, mətn məsələsində
  strukturlaşdırılmış forma (`{"tip":"permutation","n":5,"blok":3}`) — keşləmə üçün
  daha yaxşıdır, amma promptu dəyişir
- (b) `canonical`-ı **saxlama**, yalnız `canonical_hash` + `numeric_fingerprint`
  saxla — keş işləyir, mətn getmir. Debug üçün itki var.

(b) tez və hüquqi cəhətdən təmizdir. **`ADR-003` yenilənməlidir, hansı seçilsə də.**

---

## E · KEŞ FƏRZİYYƏSİ SINANMAYIB

`ADR-001` biznes modelini keşə bağlayır: *«keş 60% + Flash-Lite → 200 həll/ay = $0.30»*.
Keş açarı `canonical_hash` = `sha256(normalize(canonical))`, `canonical` isə **model
çıxışıdır**.

Eyni məsələnin iki fotosu **eyni sətri** verməyə bilər — fərqli boşluq, `\cdot` vs `*`,
`x^2` vs `x²`. Onda hash fərqlidir və **keş boş qalır**.

Yəni 60% hit-rate fərziyyəsi **heç vaxt ölçülməyib** və biznes modeli ona söykənir.

**Düzəliş (ucuz, indi edilə bilər):** Faza 1-də keş qurmuruq, amma `canonical_hash`
onsuz da yazılır. **Eyni məsələni 3 fərqli fotoda çək** və hash-ların üst-üstə düşüb-
düşmədiyinə bax. Üç foto, sıfır kod. Cavab «yox»dursa, `numeric_fingerprint` birinci
dərəcəli açar olmalıdır, `canonical_hash` yox.

---

## F · SINANMAMIŞ YOLLAR

| yol | vəziyyət |
|---|---|
| `unreadable` / `not_a_problem` | **heç vaxt ölçülməyib** — dəstdə qəsdən pis şəkil yoxdur (`ADR-001`) |
| Əl yazısı | ölçülməyib — dəstdə yalnız çap |
| `cut_off` (yarımçıq şəkil) | ölçülməyib |
| Həndəsə (şəkilli məsələ) | `problem_type: geometry` sxemdə var, **heç vaxt sınanmayıb** |
| Çox uzun məsələ (6 addımdan çox) | `maxItems: 6` — model 8 addımlıq məsələni necə sıxır? |

Sonuncu ikisi Faza 1-də real şagirdlərdə **mütləq** qarşıya çıxacaq.

---

## Sıralanmış tövsiyə

| # | tapıntı | təcililik | səbəb |
|---|---|---|---|
| 1 | **B1** şagird cavabının normallaşdırılması | **S4-dən ƏVVƏL** | əsas aktivi korlayır, sonra geri qaytarıla bilməz |
| 2 | **A1** `delivered` / `completed` ayrılması | **S4-dən ƏVVƏL** | miqrasiya sonra daha bahalıdır, data itir |
| 3 | **C2** timeout + `maxDuration` | indi | təsadüfən işləyir |
| 4 | **C1** qlobal xərc tavanı | şagirdlərdən ƏVVƏL | bir gecədə büdcə |
| 5 | **A3** `student_ref` | şagirdlərdən ƏVVƏL | qapı ölçülə bilməz |
| 6 | **A2** `verified` üçlü dəyər | indi (bir sətir) | səssiz yanlış data |
| 7 | **D1** ADR-003 uyğunluğu | şagirdlərdən əvvəl | hüquqi |
| 8 | **E** hash sabitliyi (3 foto) | bu həftə | biznes modeli fərziyyəsi |
| 9 | **B2** `wrong_patterns` diaqnozu | Faza 1 sonu / Faza 2 | ADR tələb edir, sxem dəyişikliyi |
