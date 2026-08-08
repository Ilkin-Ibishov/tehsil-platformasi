# ADR-012 — S3 `/api/solve`: yoxlama məntiqi TS-ə köçürüldü, `attempts.device_id`, dəvət kodu paylaşılan sirdir

## Kontekst

`docs/PHASE-1.md` S3 üç şeyi tələb edir: (1) `/api/solve`-in real implementasiyası, (2)
`scripts/lib`-dəki `schema_check`/`verify`/`leak` məntiqinin TS-ə köçürülməsi VƏ YA Python
serverless funksiya kimi saxlanması — **amma iki fərqli implementasiya olmasın**, (3) dəvət
kodu + `device_id` üzrə serverdə gündəlik limit (30).

Üç arxitektur qərarı tələb olunurdu, hamısı bu ADR-də.

## Qərar 1 — yoxlama məntiqi: Python serverless YOX, TS port

**Seçim: TS-ə köçürüldü** (`web/lib/verify/`), Python serverless funksiya seçilmədi.

Səbəb: Vercel-in Python runtime-ı `web/`-dən (Root Directory) kənardakı `scripts/lib/*.py`-ı
funksiya bundle-ına daxil edib-etməyəcəyi sənədləşdirilməmiş/qeyri-müəyyəndir ("Python Vercel
Functions include all files from your project that are reachable at build time" — "project"
Root Directory-yə aiddirmi, repo kökünə aiddirmi aydın deyil). Bunu canlı deploy olmadan
yoxlamaq mümkün deyildi, bu sessiyada isə nə Vercel yazma girişi, nə canlı test şəraiti var idi.
Cross-runtime (Next.js → daxili Python funksiya HTTP çağırışı) `next dev`-də də işləməzdi —
yalnız `vercel dev` dəstəkləyir, S1a-dan bəri qurulmuş lokal iş axınını (`next dev`) pozardı.

**Nəticə — praktik dəyişiklik:** istehsalat yoxlaması (`equation_cross_check`) aşkarlandı ki,
əslində CAS-a (tam simvolik sadələşdirməyə) ehtiyac duymur — yekun yoxlama HƏMİŞƏ **ədədi**dir
(`residual.is_number` → `abs(complex(residual)) < 1e-6`). `sympy.simplify` yalnız simvolik
ifadəni ədədə endirmək üçün vasitə idi. Bu, `mathjs`-in `evaluate()`-i ilə (simvolu ədədi
qiymətlə əvəz edib iki tərəfi ədədi hesablamaq) funksional ekvivalentdir.

**Köçürülənlər (`web/lib/verify/`):**
- `schema.ts` — `ajv` (Draft-07) `docs/STEP-SCHEMA.json`-a qarşı. Mexaniki port, uyğunsuzluq riski yoxdur.
- `leak.ts` — `leak.py`-ın hərfi portu (regex sərhəd yoxlaması). Sympy-dən asılı deyil, riskiz.
- `answer.ts` — `verify.py`-ın YALNIZ istehsalatda işləyən yolu: `equation_cross_check` +
  `_value_satisfies`. `direct_compare` (golden-əsaslı 1-ci qat) köçürülmədi — istehsalatda
  `golden_values` heç vaxt yoxdur (yalnız eval harness-də mövcuddur), ona görə production path
  onsuz da həmişə `cross`-a düşürdü.

**Bilinən fərq (qeyd olunur, gizlədilmir):** sympy-nin `implicit_multiplication_application`
transformu (`5x` → `5*x`) mathjs-də yoxdur — regex-əsaslı ön emal (`5x`→`5*x`, `)x`→`)*x`)
əlavə edildi, amma bu, sympy-nin tam parser-i qədər davamlı deyil. Mürəkkəb ifadələrdə
(iç-içə funksiyalar, çoxdəyişənli tənliklər) sympy-dən fərqli nəticə verə bilər. Bu, `ADR-009`-un
xəbərdarlıq etdiyi sinifdəndir: **ölçünün özü** səhv olduqda model günahlandırılır. Tövsiyə:
S3 canlıya çıxdıqdan sonra ilk 30 həllin `verify_conflict`/`unreadable` nisbəti izlənməlidir —
gözlənilməz yüksəkdirsə, səbəb model deyil, bu port ola bilər.

`scripts/lib/*.py` **toxunulmadı** — eval harness dəyişmədi, iki müstəqil implementasiya
indi rəsmən mövcuddur (TS istehsalat, Python eval). Divergensiya riski qəbul edilir, çünki
alternativ (cross-runtime Python funksiya çağırışı) bu sessiyada yoxlanıla bilməyən daha
böyük risk idi.

**2026-08-07 yenilənməsi — bu qəbul edilmiş risk BAĞLANDI, "sürətli" yox "doğru" seçimlə.**
Cowork (`HANDOFF 28`) düzgün olaraq qeyd etdi: yuxarıdakı qərar `scripts/lib/verify.py`-i
TOXUNULMAZ saxlamışdı, yəni `PHASE-1.md` S3-ün "iki fərqli implementasiya olmasın" tələbi
əslində POZULMUŞDU — sadəcə ADR-də açıq yazılıb "qəbul edilmiş risk" adlandırılmışdı.
İki seçim var idi:
1. **Sürətli:** `verify.py`-də sympy-ni EYNİ semantika ilə (`null` vs `false` fərqi) əl ilə
   yeniləmək — iki implementasiya QALIR, sadəcə davranışları indi UYĞUNLAŞDIRILIR (gələcək
   dəyişiklik yenə ayrıla bilər).
2. **Doğru:** eval-ın ÖZÜ istehsalat kodunu çağırması — TƏK MƏNBƏ həqiqətən TƏK olur.

**Seçim: 2 (doğru).** Səbəb dəyişdi: əvvəlki sessiyada Python→TS cross-runtime çağırışı
(Vercel-in Root Directory-dən kənar faylları necə bundle etdiyi qeyri-müəyyən, `next dev`-i
poza bilər) rədd edilmişdi — bu, İSTEHSALAT SORĞU YOLU üçün həqiqi risk idi (istifadəçi
gözləyir, latensiya/etibarlılıq vacibdir). Əksinə — **eval-ın Python-dan Node çağırması** —
tamam fərqli risk profilinə malikdir: yalnız YERLİ İNKİŞAF ALƏTİDİR, istifadəçiyə görünmür,
uğursuz olsa yalnız bir eval run-ı pozular. Node.js v22+ `.ts` fayllarını BİRBAŞA (tip
strip etməklə) işə sala bilir — sınandı, işləyir, əlavə build addımı lazım deyil.

**İcra:** `web/lib/verify/cli.mts` — stdin-dən `{canonical, values}` JSON oxuyur,
`answer.ts::equationCrossCheck`-i çağırır, stdout-a `{verified}` JSON yazır.
`scripts/lib/verify.py::equation_cross_check` indi bu CLI-ı `subprocess.run(["node",
"--no-warnings", ...])` ilə çağırır — **sympy-based həndəsi/tənlik-yoxlama kodu tamamilə
silindi** (`_extract_equations`, `_parse_equation`, `_value_satisfies`). `direct_compare`
(golden-əsaslı, YALNIZ eval-a aiddir, istehsalatda ekvivalenti yoxdur) sympy ilə **qalır** —
divergensiya narahatlığı ora aid deyil (müqayisə ediləcək ikinci implementasiya yoxdur).

**Yoxlama:** `scripts/eval.py --selftest` 23/23 (əvvəlki kimi — CLI eyni nəticələri verir).
`evals/results/B-2026-08-07.json`-un saxlanılmış çıxışları üzərində (YENİ API çağırışı YOX,
`ADR-009`-dakı metodla) `final_answer_accuracy` yenidən hesablandı: **7/10, DƏYİŞMƏDİ**.
Səbəb aydındır: bu golden set-in bütün 10 sualında `final_answer_values` mövcuddur, ona görə
`direct_compare` (1-ci qat) HƏR ZAMAN qəti nəticə verir və `equation_cross_check`-in
`null`/`false` fərqi bu run üçün heç vaxt qərar vermə nöqtəsinə çatmayıb — divergensiya
riski REAL idi (memarlıq səviyyəsində), amma BU KONKRET nəticəyə təsir etməmişdi. Fərq yalnız
golden-siz (istehsalat-bənzər) hallarda üzə çıxardı — məhz bunun üçün bağlanmalı idi.

## Qərar 2 — `attempts.device_id`, `user_id` yox

`docs/DATA-MODEL.md`-dəki `attempts` cədvəli `user_id fk` göstərir, amma **auth Faza 1-in
xaricindədir** (`docs/PHASE-1.md` → "Sahə daxilində/xaricində"). Gündəlik limit `device_id`
üzrə hesablanmalıdır (`events` cədvəlinin artıq işlətdiyi eyni model). `0002` miqrasiyası
`attempts.user_id`-ni **nullable** saxlayır (gələcək auth üçün) və `device_id uuid not null`
əlavə edir. Limit sorğusu: `completed=true` olan (yəni **çatdırılmış**) sətirlər sayılır —
`docs/PHASE-1.md` S5-in invariantına uyğun ("İmtina, seçim və kəsmə gündəlik limitdən sayılmır").

## Qərar 3 — dəvət kodu: tək paylaşılan sirr, cədvəl yox

Test qrupu 20 nəfərdir, `docs/PHASE-1.md`: "sadə paylaşılan kod". Per-user kod cədvəli
overengineering olardı. `INVITE_CODE` env dəyişəni (server-only) — `/api/solve`
`invite_code` form sahəsini bu dəyərlə müqayisə edir, uyğun olmasa `403`.

## Qərar 4 — `verified === null` ilə `verified === false` FƏRQLİDİR (canlı sınaqda tapıldı)

**Bu, bu sessiyanın ən vacib tapıntısıdır.** `/api/solve`-i real Gemini açarı ilə (Ilkin
təmin etdi) və lokal Postgres-lə (S1a-dan qalan `th-postgres` konteyneri) UC-UCA sınadım —
`docs/PHASE-1.md`-in `c08` sualı (parametr məsələsi: "`m`-in ən kiçik tam qiyməti") `verified:
false` aldı, halbuki modelin cavabı **düzgün idi** (`m=7`).

Səbəb: `equation_cross_check` YALNIZ canonical-dan **tək dəyişənli tənlik** çıxara bildikdə
işləyir. Söz məsələləri/parametr məsələləri/ehtimal məsələləri kimi hallarda (canonical
tənliklə yanaşı Azərbaycanca şərt mətni də daşıyır, məs. `"x^2+5x+m=0 tənliyinin kompleks
kökü olması üçün..."`) tək simvol tapıla bilmir → funksiya `null` (YOXLANILA BİLMƏDİ) qaytarır,
`false` (TƏKZİB EDİLDİ) YOX. Bunu **Python-un öz `scripts/lib/verify.py`-ında da** eyni
canonical/values ilə çağırıb yoxladım (`verify_final_answer(canonical, ["7"])` → `(None, False)`)
— **bu, TS portunun yaratdığı bug DEYİL, `verify.py`-ın istehsalat yolunun (`golden_values`-suz)
əvvəldən mövcud olan məhdudiyyətidir**, indiyə qədər heç vaxt real istifadəçi trafikinə
məruz qalmadığı üçün aşkarlanmamışdı.

İlk yazılışda mən `verified` üç halını (`true`/`false`/`null`) `if (!verified)` ilə YANLIŞ
eyniləşdirmişdim — bu, `null`-u da `false` kimi rədd edirdi. Nəticə: canonical-ı tək tənliyə
düşməyən HƏR məsələ (bütün söz/parametr/ehtimal məsələləri, ADR-004-ün B qrupu) istehsalatda
**həmişə** `unreadable` qaytaracaqdı — modelin cavabı düzgün olsa belə. Bu, `CLAUDE.md`-nin
Qızıl Qaydasını (səhv xəritəsi + çatdırılan həll) bu problem sinfinin tamamı üçün sıradan
çıxarardı.

**Düzəliş:** `route.ts` indi YALNIZ `verified === false` (QƏTİ ZİDDİYYƏT) halında rədd edir.
`verified === null` (yoxlanıla bilmədi) halında həll ÇATDIRILIR, amma
`solutions.verification_method = 'none'` yazılır (`STEP-SCHEMA.json`-un `verification.method`
enum-unda `"none"` məhz bunun üçün var idi — sxem bunu əvvəlcədən nəzərdə tutmuşdu, mən
sadəcə istifadə etmirdim). `verified: true, method: sympy` YALNIZ real ədədi təsdiq olduqda.

**Nəticə üçün əhəmiyyəti:** ilk 30 canlı həllin `verification_method` paylanmasına baxılmalıdır
— `none` payı yüksəkdirsə (gözlənilən, çünki golden set-in ~30%-i söz/parametr məsələsidir),
bu, sistemin **model çıxışına kor-koranə etibar etdiyi** hallardır. Gələcəkdə (Faza 2) bu
sinif üçün əlavə yoxlama qatı (məs. ehtimal məsələləri üçün xüsusi yoxlayıcı) düşünülməlidir —
indi üçün "yoxlanıla bilmirsə göstər, gizlətmə" seçildi, çünki əks halı sınaqda **məhsulu
sındırdığı** göstərildi.

## Nəticə

`web/app/api/solve/route.ts` LLM çağırışını edir (`prompts/solve-step.md`-dən **fayldan**
oxunan prompt, `scripts/lib/prompt_loader.py` ilə eyni çıxarma məntiqi — TS portu),
sxem yoxlayır (bir dəfə retry), sympy-ekvivalent ədədi yoxlamadan keçirir, `problems`/
`solutions`/`attempts`-a yazır. `verified===false` (Qərar 4) və ya sxem etibarsızdırsa
istifadəçiyə `status: unreadable` qaytarılır (`docs/PHASE-1.md` server qaydası 1).

**Canlı sınandı** (2026-08-07, real Gemini açarı + lokal Postgres): `/api/solve` tam axını —
sxem valid, DB-yə `problems`/`solutions`/`attempts` yazıldı, `verification_method="none"`
düzgün seçildi. Dəvət kodu rədd (403) və gündəlik limit (429 + `limit.blocked` telemetriyası)
ayrıca sınandı, hər ikisi işləyir.

## Əlavə 2026-08-08 — Qərar 3 geri çağırılır: fərdi kod, tək paylaşılan sirr YOX

SYSTEM-REVIEW-2026-08-07 §A3 (HANDOFF 41): Qərar 3-ün "tək paylaşılan sirr" seçimi retensiya
qapısını (`docs/PHASE-1.md`: "20 şagirddən ≥8-i 7 gündə ≥3 dəfə qayıdır") sındırırdı —
ölçmə tamamilə `device_id`-yə (localStorage) söykənir, iOS Safari isə quraşdırılmamış saytın
yaddaşını MƏHZ 7 gün istifadəsizlikdən sonra silir (ITP). Ölçü aləti ölçdüyü sərhəddə sınırdı.

**"Per-user kod cədvəli overengineering olardı" arqumenti düzgün qaldı** — cədvəl yenə
lazım deyil, çünki kodun ÖZÜ unikaldır. `INVITE_CODE` (tək dəyər) → `INVITE_CODES`
(vergüllə ayrılmış siyahı, `ilkin-01`...`ilkin-20`) — uyğun gələn kod `attempts.student_ref`
kimi yazılır (`0006_attempts_student_ref.sql`). Retensiya BUNUN üzrə hesablanmalıdır,
`device_id` YOX.
