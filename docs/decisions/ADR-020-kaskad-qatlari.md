# ADR-020 — Kaskad qatları: transkripsiya → bank → şablon → sympy → LLM

**Status:** Qurulub · **bayraq arxasında, defolt SÖNÜK** · `ADR-014` qapısı ilə açılır
**Tarix:** 2026-08-13
**Toxunur:** `ADR-014` (çağırışın ikiyə bölünməsi — bu ADR onun icrasıdır) · `ADR-001` (tək çağırış) ·
`ADR-006` (şəkil girişi) · `ADR-007` (çoxməsələli kadr) · `ADR-008` (neytrallıq) · `ADR-017` (cavab təcridi)
**ClickUp:** `86eykj7tu` (kaskad) · `86eykj7x2` (transkripsiya təsdiqi) · `86eykqb1c` (model bölgüsü) · `86eykhvcg` (skeleton)

## Qərar

`/api/solve`-un tək monolit çağırışı qatlı kaskada çevrilir. **İndi qurulan şey qatların
hamısı deyil — İNTERFEYSDİR**, ki sonrakı qatlar yenidən yazılma tələb etmədən əlavə olunsun.

| Qat | Şərt | LLM | Vəziyyət | Kod |
|---|---|---|---|---|
| 1 | şəkil → transkripsiya + rədd qapısı | 1 vision çağırışı | **QURULDU** | `web/lib/cascade/transcribe.ts` |
| 2a | `canonical_hash` bankda var | yox | **QURULDU** | `web/lib/cascade/bank.ts` |
| 2b | `fingerprint_digits` bankda var | yox | **QURULDU** | `web/lib/cascade/bank.ts` |
| 3 | şablona oturur → generasiya | yox | YOX | — |
| 4 | sympy həll edir, LLM izah yazır | izah | YOX | — |
| 5 | tam həll (mətn üzərində) | tam | **QURULDU** | `web/lib/cascade/solve-text.ts` |

Sıra `web/lib/cascade/run.ts`-dəki BİR massivdədir. Yeni qat = `SolveLayer` tipini ödəyən
modul + massivə düzgün yerdə sətir. `/api/solve`, klient, telemetriya TOXUNULMUR.

**Qat 3 və 4 niyə yoxdur** (boş `TODO` qoymaq CLAUDE.md qayda 4-ün pozulmasıdır):
- Qat 3 — `app.store_generated_steps` RPC-si (`0037`) mövcuddur, amma şablon TANIYICISI yoxdur:
  `0038`-in şablonları SQL-də generasiya edilib, TS tərəfdə "hansı canonical hansı şablona
  oturur" məntiqi yazılmayıb.
- Qat 4 — **sympy serverdə YOXDUR.** `scripts/lib/verify.py` python-dur, `web/lib/verify/
  answer.ts` onun MƏHDUD portudur (yalnız tək dəyişənli tənlik krossyoxlaması). "Cavabı sympy
  tapır" tələbi python xidməti və ya WASM sympy qərarı deməkdir — AYRI ADR.

## Niyə bayraq arxasında, defolt sönük

`ADR-014` bu dəyişiklik üçün **öncədən qeyd edilmiş ölçmə qapısı** təyin edib və açıq yazıb:
*«Şərtlərin hamısı ödənilmirsə tək çağırış qalır. Ölçülmədən qərar verilmir.»*

| ölçü | şərt |
|---|---|
| Son cavab dəqiqliyi | tək çağırışdan ≥1 item-dən çox itirməsin (9/10 → ≥8/10) |
| Hallüsinasiya | **0** qalsın |
| Struktur / sxem | 100% qalsın |
| Xərc (çoxsuallı yol) | **azalsın** |
| Transkripsiyanın qayıtması | **≤6 san** |
| *(bu ADR əlavə edir)* `has_figure=true` alt dəsti | dəqiqlik ayrıca ölçülsün — R1 riski |

Qapı 10 real kəsilmiş DİM şəkli + golden-set tələb edir; kod yazmaqla əvəz edilə bilməz.
`CASCADE_ENABLED=1` olmayanda mövcud monolit yol **bayt-bayt** işləyir. Eyni intizam
HANDOFF 82-də qri-şkala üçün tətbiq edilib (defolt sönük, A/B təsdiqlənmədən açılmır).

## `ADR-014` R1 ilə ziddiyyət — açıq qeyd

`ADR-014` R1 belə yazır: *«Bölmə "şəkli atmaq" kimi qurulmamalıdır … `geometry` /
`has_figure: true` → şəkil də ötürülür. Bu fərq ADR-in mərkəzidir.»*

ClickUp `86eykj7tu` isə əksini tələb edir: *«Şəkli yalnız bir çağırış görür. **Həmişə.**»*

**Bu ADR taskın tərəfini tutur** — səbəb: iki çağırışın eyni şəkli fərqli oxuması şagird üçün
diaqnoz edilə bilməz haldır (hansı oxunuş doğrudur?), üstəlik vision tokeni iki dəfə ödənilir.
R1-in real riski (çertyoj mətnə tam çevrilə bilməz) **inkar edilmir**, üç yolla idarə olunur:

1. Qat 1 promptu `has_figure=true` olanda fiquru **sözlə təsvir etməyi** MƏCBURİ edir
   (verilən uzunluqlar, bucaqlar, nöqtə adları) — `prompts/solve/transcribe.md`.
2. `has_figure` sxemə **ölçülən sahə** kimi əlavə edilir və `solve.cascade` hadisəsində yazılır.
3. Qapıya `has_figure=true` alt dəstinin ayrıca dəqiqlik şərti əlavə edilir (yuxarıdaki cədvəl).

Alt dəstin dəqiqliyi düşərsə düzəliş `run.ts`-də BİR şərtdir (`hasFigure` → Qat 5-ə şəkli də
ötür) — memarlıq yenidən yazılmır. Qərar ölçmədən SONRA verilir.

## Ayrı cavab müqaviləsi — `docs/TRANSCRIBE-SCHEMA.json`

Qat 1 `STEP-SCHEMA.json`-dan İSTİFADƏ EDƏ BİLMİR: onun `allOf` qaydası `status='ok'` halında
`final_answer` və `steps` sahələrini məcburi edir, Qat 1 isə qəsdən heç birini istehsal etmir.
Ona görə ayrı, daha kiçik sxem. **Enum dəyərləri STEP-SCHEMA ilə hərfi eynidir** (`status`,
`subject`, `problem_type`, `detected_language`, `candidates`) — sapma yaranarsa Qat 1-in çıxışı
Qat 5-in sxemindən keçməz. `STEP-SCHEMA.json` TOXUNULMADI (Cowork sahibliyi).

## Ölçülmüş tapıntılar (kod yazarkən üzə çıxan, əvvəl bilinməyən)

### T1 · `numeric_fingerprint`-də iki uyğunsuz format — Qat 2 heç vaxt işləmirdi

`questions.numeric_fingerprint` sütununda iki namespace yaşayır:

```
source='generated'    (217 sətir)  →  'FAIZ.OF|300,5'   ← şablon prefiksi + rəqəmlər
source='user_capture' (9 sətir)    →  '300,5'           ← yalnız rəqəmlər  ← DATA-MODEL.md formatı
```

`/api/solve` ikincisini hesablayır, bank birincisini saxlayır → bərabərlik **heç vaxt**
tutmurdu. Üstəlik `questions_fingerprint_dedup_idx` unikal olduğu halda eyni məsələ ikinci
sətir kimi yazılırdı (latent dublikat).

**Düzəliş:** `0047` — prefiksi soyan `fingerprint_digits` GENERATED sütunu + öz indeksi.
Additive; köhnə sütun, köhnə indeks, köhnə kod toxunulmadı (CLAUDE.md miqrasiya dərsi 1).
217 sətrin formatını düzəltmək MÜMKÜN DEYİL: prefiksi silmək `QUAD.MIN|-1,-2` və
`QUAD.SUM|-1,-2`-ni eyni açara çevirər, unikal indeks pozulardı.

### T2 · Rəqəm izi tək başına unikal deyil — `topic_code` FİLTR deyil, POZUCU

Ölçüldü: `200,15` + 6-cı sinif → **iki fərqli sual**:
«200 ədədinin 15%-i neçədir?» (cavab **30**) və «Qiymət 200 manat, 15% artırılıb» (cavab **230**).

Rəqəm-yalnız uyğunluq şagirdə **yanlış həlli inamla** öyrədərdi. `topic_code`-u sorğuda FİLTR
kimi işlətmək də səhvdir (aşağıdaki T3) — ona görə qayda:

1. `(digits, subject, grade)` üzrə axtar.
2. Tək namizəd → uyğunluq.
3. Birdən çox → `topic_code` ilə ayır.
4. Yenə ayrılmırsa → **İMTİNA** (`null`, növbəti qat). Bahalı yola düşmək pul itkisidir;
   səhv cavab vermək məhsulun dəyərini itirməkdir.

### T3 · Bankın `topic_code`-larının 42%-i `ADR-008`-i pozurdu — **DÜZƏLDİLDİ (`0048`)**

`FAIZ.PERCENT_OF` (55 sətir) və `FAIZ.INCREASE` (36 sətir) — `FAIZ` **azərbaycancadır**,
`ADR-008` isə «SAHƏ.MÖVZU, hər ikisi İNGİLİSCƏ» tələb edir. Prompt modelə `ARITH.*`
domenini öyrədir, yəni model bu kodları **heç vaxt** yazmayacaq. `topic_code` filtr olsaydı
bankın 42%-i Qat 2 üçün əbədi görünməz qalardı.

**Sahib insanın qərarı (2026-08-13, HANDOFF-84-ə cavab):** indi düzəlt, gözləmə — 91 sual
əhatəni birbaşa qaldırır. `0048` miqrasiyası tətbiq edildi:

```
FAIZ.PERCENT_OF  → ARITH.PERCENT_OF
FAIZ.INCREASE    → ARITH.PERCENT_INCREASE
```

`problem_type` sütunu SİNXRON yeniləndi — `0036`-nın öz sxem buqu üzündən (aşağıya bax)
`problem_type` STEP-SCHEMA enum-u YOX, elə `topic_code`-un özünü daşıyırdı; yeni kodla
uyğunsuzluq yaratmamaq üçün eyni dəyər hər iki sütuna yazıldı.

`prompts/solve/transcribe.md` yeniləndi: `ARITH.PERCENT_OF` vs `ARITH.PERCENT_INCREASE`
cütü indi `QUAD.MIN`/`QUAD.SUM` nümunəsi ilə YANAŞI, açıq misalla göstərilir — model bu iki
kodu təbii şəkildə fərqləndirməlidir (eyni rəqəmlər, fərqli sual, fərqli cavab).

**Aşkarlanan, AMMA bu miqrasiyanın əhatəsi XARİCİNDƏ qalan ikinci bug:** `0036`-nın seed
INSERT-i BÜTÜN 217 sətrin `problem_type` sütununa (formula|word_problem|geometry|mixed enum-u
yerinə) elə `topic_code`-un özünü yazıb — YALNIZ FAIZ-ə aid deyil, ALG/GEO/PROB/STAT
sətirlərinin hamısına aiddir. Bu, backlog-dadır (aşağıdaki "indi toxunulmayan" bölməsinə bax).

### T4 · Qat 2-nin real əhatəsi: 224 bank sualından **120-si** (əvvəl 0)

Mətndən çıxarılan rəqəm izi bankın saxladığı ilə müqayisə edildi (`0048`-dən SONRA):

| topic_code | sətir | rəqəm izi UYĞUN |
|---|---|---|
| `ARITH.PERCENT_OF` | 55 | **55** |
| `ARITH.PERCENT_INCREASE` | 36 | **36** |
| `ALG.LINEAR_EQUATION` | 49 | 25 |
| `ALG.QUADRATIC_EQUATION` | 48 | **0** |
| `ALG.VIETA_SUM` | 31 | **0** |
| user_capture (7 mövzu) | 7 | 5 |

Yekun: **120 sətirdə rəqəm izi uyğun gəlir**. Onlardan **112-si** tək namizəddir (dərhal
əlçatan), **8-i** (`ARITH.PERCENT_OF`/`ARITH.PERCENT_INCREASE` cütləri) indi ADR-008-ə uyğun
kodlarla bərabərlik-pozucudan KEÇİR — **120-nin hamısı əlçatandır** (`0048`-dən əvvəl 112 +
8 imtina idi). Qat 2 sıfır LLM xərci ilə **224 bank sualının 120-sinə (54%)** cavab verə
bilir — əvvəl **0** idi.

**Qalan 104 sətir niyə tutulmur:** bankın kvadrat/xətti şablonları rəqəm izinə **şablon
PARAMETRLƏRİNİ** yazır (`b=-1, c=-12` → `-1,-12`), mətndə isə tamam başqa rəqəmlər görünür
(«x² − 1x − 2 = 0» → `1,2,0`; üstəlik `²` superskript rəqəm kimi oxunmur). Bu, `DATA-MODEL.md`-in
formatından **semantik** sapmadır — düzəlişi seed tərəfindədir, **Cowork tapşırığı**.

### T5 · Qat 1 HTTP-də AYRILDI — `86eykj7x2` üçün (2026-08-13, davam sessiyası)

İlkin versiya kaskadı `/api/solve` daxilində TƏK sorğuda icra edirdi (`CASCADE_ENABLED=1`
budağı) — Qat 1 bitəndən sonra klient HEÇ NƏ görmürdü, Qat 5 qurtarana qədər gözləməli idi.
Bu, `86eykj7x2`-nin bütün məqsədini (16.8 saniyəlik boş gözləməni Qat 1-in nəticəsi ilə
doldurmaq) İMKANSIZ edirdi.

Həll: `POST /api/solve/transcribe` (Qat 1) + `POST /api/solve/finish` (Qat 2-5, transkripsiya
ilə, ŞƏKİLSİZ). Klient axını:

```
crop təsdiqlənir
  → /transcribe (Qat 1, ~1-3s)
  → ekранда canonical göstərilir (TranscriptConfirmView, redaktə edilə bilər)
  → EYNİ ANDA fonda /finish başladılır (AbortController ilə)
  → şagird "Düzdür" basır, DƏYİŞMƏDƏN:
      → fon nəticəsi gözlənilir (TƏKRAR sorğu YOX)
  → şagird mətni DÜZƏLDİR, sonra təsdiqləyir:
      → fon sorğusu abort() edilir, düzəldilmiş mətnlə YENİ /finish sorğusu
  → şagird "düz deyil" deyir:
      → fon sorğusu abort() edilir, /finish-ə {rejected:true} göndərilir (yalnız korpus qeydi)
      → kəsmə ekranına qayıdır
```

`/api/solve`-un öz kaskad budağı (monolitin daxilindəki `CASCADE_ENABLED=1` yolu) TOXUNULMADI
— hələ də mövcuddur, klient İSTİFADƏ ETMİR (kamera axını indi HƏMİŞƏ `NEXT_PUBLIC_CASCADE_
ENABLED=1` olanda iki-endpoint yoluna keçir). Gələcəkdə həmin daxili budaq YIĞIŞDIRILA bilər
(dead code), amma bu sessiyada silinmədi — kim isə (test skripti, gələcək inteqrasiya) ona
etibar edə bilər, sübut olmadan silmək tələb olunmayan risk daşıyır.

`web/lib/cascade/guards.ts` (invite/limit/xərc yoxlamaları) monolitdən İMPORT EDİLMİR, TƏKRAR
yazılıb — monolitin "bayt-bayt dəyişməz" invariantını qorumaq üçün (paylaşılan refaktorinq
riski, xüsusən vaxt təzyiqi altında).

## Nə DƏYİŞMƏDİ (qəsdən)

- **Cavab təcridi** (`ADR-017`): `final_answer` və `check.accept` şəbəkəyə DÜŞMÜR. Bankdan
  gələn addımlar DB-də artıq `accept`-siz saxlanılır (ölçüldü: 226 tərcümənin heç birində
  `accept` yoxdur), LLM-dən gələnlər `stripAccept`-dən keçir. `RawStep` vs `PublicStep` iki
  AYRI tipdir ki, `accept`-i çıxarmağı unutmaq kompilyatorda görünsün.
- **İmtina/seçim UI-ı** (`ADR-007`): Qat 1 mövcud `status`/`candidates` müqaviləsini eynilə
  qaytarır. Klientdə yeni vəziyyət yaranmadı.
- **Gündəlik limit** (S5): yalnız `delivered=true` sayılır. Qat 1 imtinası DB-yə heç nə yazmır,
  yəni imtina limitdən **sayılmır** — `ADR-007`-nin məcburi qaydası.
- **`match_path` taksonomiyası**: yeni dəyər UYDURULMADI. `hash`/`fingerprint`/`llm` artıq
  `TELEMETRY.md`-də var idi və qatlara BİR-BİR uyğun gəlir.

## Yeni səssiz-pozulma müdafiəsi

Mövcud sual sətri tapılanda (dedup) **DB-dəki addımlar göstərilir, yenilər YOX.**
Səbəb: `private.step_answers` mövcud sətrə bağlıdır və `store_step_answers` insert-only —
yeni generasiyanın `accept` dəyərləri DB-yə düşmür. Yeni addımları göstərsəydik, şagird N-ci
addıma cavab verəndə `/api/steps/check` KÖHNƏ sətrin N-ci `accept`-i ilə müqayisə edərdi:
doğru cavab «səhv» sayılar və **uydurma `error_code`** şagirdin səhv xəritəsinə yazılardı.
Məhsulun bütün dəyəri həmin xəritədədir (CLAUDE.md Qızıl qayda).

## Alternativlər

- **HTTP-ni iki endpointə bölmək** (`/api/solve/transcribe` + `/api/solve/steps`): İLK YAZILIŞDA
  rədd edilmişdi ("qatların interfeysi server tərəfindədir, streaming/tək çağırış lazımdır,
  iki ardıcıl POST YOX"). **BU QƏRAR SONRADAN GERİ ALINDI** (2026-08-13, eyni sessiya, `86eykj7x2`
  tikiləndə): real UI tələbi — Qat 1 bitən kimi (~1-3 san) məzmun göstərmək, Qat 2-5-i FONDA
  davam etdirmək, düzəliş olsa fon sorğusunu DAYANDIRMAQ — hazırkı stekdə (Next.js route
  handler-ləri, streaming JSON klienti yoxdur) YALNIZ iki ayrı sorğu ilə mümkündür. Tətbiq
  edildi: `POST /api/solve/transcribe` (Qat 1 tək başına) + `POST /api/solve/finish` (Qat 2-5,
  transkripsiya ilə). Bax bu faylın "T5" bölməsi (aşağıda) və HANDOFF-84 §4.
- **217 sətrin `numeric_fingerprint`-ini yenidən yazmaq**: rədd edilir — unikal indeks pozulur,
  seed Cowork sahibliyindədir, `hit_count` tarixçəsi itir.
- **Qat 2-də embedding (pgvector)**: `ARCHITECTURE.md`-də üçüncü dərəcəli açar kimi var,
  qurulmadı — `embedding` sütunu boşdur, doldurulması ayrı iş və ayrı xərcdir.
