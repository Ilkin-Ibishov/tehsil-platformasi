# ADR-003 — DİM datasetı və hüquqi mövqe

**Status:** Qəbul edilib (hüquqşünas rəyi ilə yenidən baxılacaq)
**Tarix:** 2026-08-05

## Kontekst

Azərbaycan şagirdləri əsasən DİM (Dövlət İmtahan Mərkəzi) test toplularını işləyirlər.
Bu məsələləri qabaqcadan sistemə yükləmək üç fayda verir:

1. **Determinizm** — təsdiqlənmiş həll hallüsinasiya etmir *(ən dəyərli fayda)*
2. **Latensiya** — 5 saniyə əvəzinə anında
3. **Soyuq start** — Test ekranı və Lent boş doğulmur

Xərc qənaəti dördüncü və ən az əhəmiyyətli faydadır.

## Hüquqi vəziyyət

Azərbaycan Respublikasının "Müəllif hüququ və əlaqəli hüquqlar haqqında" Qanunu (1996,
2021-ə qədər dəyişikliklərlə) qüvvədədir. Müəllif hüququ əsərin yaradılması ilə yaranır və
müəllifin ömrü + 70 il qorunur.

Ayrım:

- Riyazi məsələnin **özü** (fakt, tənlik) — zəif qorunur
- Toplunun **tərtibi** və mətn məsələlərinin **dəqiq ifadəsi** — kolleksiya/ədəbi əsər kimi qorunur

## Qərar

**Qəbul edilən mövqe (təhlükəsiz):**

- Şagird məsələnin şəklini **özü** çəkir
- Sistem daxili indekslə uyğunlaşdırır və **öz həllimizi** qaytarır
- Bazada `canonical` (normallaşdırılmış riyazi ifadə) + `source_ref` (istinad kodu) saxlanılır
- DİM-in **orijinal mətni tətbiqdə göstərilmir** və tam mətn kimi saxlanılmır

**Rədd edilən mövqe (riskli):**

- Test toplusunu tətbiq içində gəzilə bilən məzmun kimi yayımlamaq
- DİM mətnlərini olduğu kimi bazada saxlayıb istifadəçiyə göstərmək

## Nəticələr

- `problems` cədvəlində DİM mətni saxlanılmır — bax `docs/DATA-MODEL.md`
- Import skripti mətni **yalnız hash/fingerprint/embedding çıxarmaq üçün** oxuyur, sonra atır
- Test ekranındakı suallar **öz formulasiyamız** olmalıdır (eyni mövzu, fərqli ifadə)

## Əlavə 2026-08-05 — mətn məsələləri maşınla təsdiqlənə bilmir

`scripts/eval.py` yazılarkən üzə çıxdı: `verify.py` `final_answer.values`-i yalnız `canonical`-da
tənlik olduqda yoxlaya bilir. `word_problem` tipində tənlik yoxdursa `None` (yoxlanıla bilmədi)
qaytarır.

**Eval üçün problem deyil** — golden set-də insanın yazdığı `final_answer_values` var, müqayisə ona
görə aparılır.

**DİM import üçün problemdir.** Orada insan ground truth-u yoxdur. Yəni:

| məsələ tipi | əvvəlcədən hesablanmış həll | mövqe |
|---|---|---|
| `formula` | sympy təsdiqləyir | `verified=true` → göstərilir |
| `word_problem` | **maşınla təsdiqlənə bilmir** | `verified=false` → göstərilmir, canlı LLM-ə gedir |

Nəticələr:

1. DİM toplusunun mətn məsələləri hissəsi **avtomatik import edilə bilməz** — ya nümunə əsasında
   insan yoxlamasından keçməli, ya da keşə düşməməlidir. Bu, import işinin həcmini dəyişir.
2. Alternativ: import zamanı mətn məsələsindən **tənlik çıxarmaq** (LLM ilə), onu `canonical`-a
   `$...$` içində əlavə etmək — onda sympy yoxlaya bilir. Amma tənliyin özü LLM çıxışıdır, yəni
   yoxlama dairəvi olur. **Bu variant seçilərsə, ayrıca ADR tələb edir.**
3. Faza 2-də `solutions.verification_method` sahəsi `sympy` / `human` / `none` ayrımını onsuz da
   saxlayır — sxem hazırdır, qərar yoxdur.

**Qərar verilməyib.** DİM import işinə başlamazdan əvvəl həll edilməlidir.

## Əlavə 2026-08-08 — `canonical` DİM mətnini saxlayırdı, qərar verildi (§D1)

Praktikada `problems.canonical` mətn məsələlərində DİM test toplusunun mətnini **demək olar
hərfi** saxlayırdı (`STEP-SCHEMA.json`-un öz tərifinə görə: "mətn məsələsidirsə orijinal mətn
+ içindəki düsturlar `$...$` içində" — bu, elə DİM mətninin ÖZÜ deməkdir). Bu bölmənin yuxarıdakı
"Qəbul edilən mövqe" hissəsi ("`canonical` (normallaşdırılmış riyazi ifadə) saxlanılır") yalnız
`formula` tipli məsələlər üçün doğru çıxdı — `word_problem`/`mixed` üçün ADR-003 faktiki olaraq
pozulurdu, kod yazılana qədər sezilməmişdi.

**Qərar (variant b, SYSTEM-REVIEW §D1-dəki iki variantdan):** `problems.canonical` artıq
**yazılmır** — sütun qalır (DDL sadəliyi üçün silinmir), gələcək bütün insert-lər boş sətir
yazır. Keş açarı YALNIZ `canonical_hash` + `numeric_fingerprint`-dir — hər ikisi hələ də
`parsed.canonical`-dan hesablanır, mətnin ÖZÜ isə heç bazaya düşmür.

**Miqrasiya:** `supabase/migrations/0009_scrub_problems_canonical.sql` — mövcud `canonical`
sətirləri boşaldılır (`update ... set canonical = ''`). `canonical_hash` TOXUNULMUR — o,
sətirdən asılı deyil (SHA-256 əvvəlcədən hesablanıb saxlanılıb), silinsə keş bütün mövcud
sətirlər üçün sıfırlanardı (hər növbəti eyni foto YENİ sətir kimi görünərdi).

**Kod:** `web/app/api/solve/route.ts` — yeni `problems` sətri insert olunanda `canonical`
sahəsinə həmişə `''` yazılır (`hash`/`numeric_fingerprint` yenə `parsed.canonical`-dan
hesablanır, saxlanılan sətirə düşmür).

### Açıq qalan boşluq — `solutions.payload` HƏLƏ tam mətni saxlayır

Bu düzəliş yalnız `problems.canonical`-a aiddir. `solutions.payload` (modelin tam JSON
çıxışı) öz daxilində `canonical`-ı olduğu kimi saxlayır — DİM mətni ORADA hələ tamdır.
`problems`/`solutions` arasındakı keş münasibətinə görə (bir `problem_id`-yə bir neçə
`solution_id` bağlana bilər, məs. fərqli modellər/vaxtlarla) bu, HƏLƏ DƏ ADR-003-ün
"DİM mətni saxlanılmır" vədini tam ödəmir — yalnız İKİ yerdən biri düzəldi.

Bunu indi genişləndirmədim: S6 (transfer) `solutions.payload.canonical`-dan sual mətni
oxuyur (bax `HANDOFF 56` §1) və `problem_type='formula'`-ya məhdudlaşdırılıb — bu, DİM
prosasını GÖSTƏRMİR (riyazi ifadə "zəif qorunur", ADR-003-ün yuxarıdakı ayrımına görə).
Amma `solutions.payload`-ın ÖZÜ hüquqi baxımdan hələ açıq məsələdir — **ayrıca qərar
tələb edir**, bu düzəlişin əhatəsində deyil.

## Ləğv 2026-08-14 — `canonical` boşaltma qərarı GERİ ALINDI (S8, ClickUp 86eymwgmv)

**Ilkin-in qəti qərarı:** DİM mətninin hüquqi riski bu mərhələdə (pre-launch, 0 real
istifadəçi) maneə sayılmır — sürət hüquqi ehtiyatdan üstün tutulur. `questions.canonical`
artıq boşaldılmır, `2026-08-08 §D1`-in qərarı LƏĞV EDİLİR. Bu bölmə SİLİNMİR (tarixi qərar
niyə verildiyini izah edir), sadəcə artıq QÜVVƏDƏ DEYİL.

**Səbəb (blok 95-in tapıntısı):** `ADR-003`-ün özünün "məqsədi onsuz da pozulurdu" —
`canonical` boşaldılsa da eyni DİM mətni `question_translations.stem.blocks[0].v`-də HƏRFİ
saxlanılırdı (§D1-in "açıq qalan boşluq" bölməsi bunu qismən görmüşdü, amma `stem`-i
düzəltmək əvəzinə `canonical`-ı saxlamağı seçmək daha sadə/tutarlı qərardır — məhsulun
DEBUG-a olan ehtiyacı da bunu dəstəkləyir: `canonical` boş olanda forensika, S1-in şəkil
saxlanması kimi, "nə oldu" sualına cavab verə bilmirdi).

**Dəyişikliklər:**
- `web/lib/cascade/persist.ts` (Qat 5 yeni sual yolu) və `web/app/api/solve/route.ts`
  (monolit yol) — `insert into questions (...)`-dakı `canonical` sütununa artıq `transcript.
  canonical`/`parsed.canonical` yazılır, `''` YOX.
- `canonical_hash`/`numeric_fingerprint` onsuz da boşaltmadan ƏVVƏL, `parsed.canonical`-ın
  ÖZÜNDƏN hesablanırdı — keş davranışı DƏYİŞMİR, reqressiya gözlənilmir.
- **Geriyə doldurma:** mövcud `source='user_capture'` sətirlərin `canonical`-ı bərpa OLUNA
  BİLMƏZ (mətn heç yerdə ARI HALDA saxlanmayıb) — `question_translations.stem.blocks[0].v`-dən
  (eyni mətn, artıq orada idi) bir dəfəlik geri dolduruldu, `supabase/migrations/
  0062_restore_canonical_from_stem.sql`.

**Nəticə:** yeni foto-solve-dan sonra `questions.canonical` boş DEYİL. `solutions.payload`-ın
(indiki `question_translations.steps` JSONB-i) DİM mətnini saxlaması artıq AYRI açıq məsələ
DEYİL — bu ADR-in özü artıq `canonical`-ın saxlanmasını QƏBUL EDİR.

## Açıq məsələlər

- [ ] Miqyaslanmadan əvvəl 1 saatlıq hüquqşünas rəyi (ucuzdur, gecikdirmə) — **2026-08-14
      ləğvindən sonra daha AKTUALDIR**, DİM mətni indi HƏM `canonical`-da, HƏM `stem`-də saxlanılır.
- [ ] **DİM ilə rəsmi lisenziya danışığı** — alınsa kopyalana bilməyən üstünlükdür.
      Ən azı bir e-poçt göndərməyə dəyər.
- [x] ~~`solutions.payload` hələ DİM mətnini tam saxlayır~~ — 2026-08-14 ləğvi ilə bu artıq
      QƏSDƏN belədir, açıq məsələ olmaqdan çıxdı (bax yuxarı bölmə).

## Pulsuz və təhlükəsiz mənbə

dim.gov.az rəsmi **imtahan proqramlarını** PDF kimi yayımlayır — bunlar rəsmi sənədlərdir və
mövzu taksonomiyası (`topic_code`) üçün ideal mənbədir:

- Riyaziyyat 9: `https://dim.gov.az/CkImage/Riyaziyyat_9_2026_Az_1758261870.pdf`
- Riyaziyyat 11: `https://dim.gov.az/CkImage/Riyaziyyat_11_2026_Az_1758262038.pdf`

Valideyn hesabatındakı `MÖVZULAR` bölməsinin skeleti bunlardan qurulur.
