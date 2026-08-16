# Soak — paylaşılan ChatGPT söhbəti (tələb təklifi)

**Status:** Təklif — qəbul edilməyib. Fayl-prime nəqliyyatı canlı **fail**.
**Tarix:** 2026-08-16
**Sahib qərarları (2026-08-16):**
- **OQ-2 bağlandı:** prime **iki ayrı `.txt` fayldır** — `prompts/solve/transcribe.md` və
  `prompts/solve/core.md` (+ `math.md` birləşməsi, istehsalatın eyni yükləməsi). Bir
  mesajda ikisi yox (composer bir attachment).
- **OQ-5 bağlandı:** **bir söhbət = 100 kəsik.**
- **OQ-8 bağlandı (ölçü, fail):** Plus, Hobby, **adi** söhbət (`url=https://chatgpt.com/`,
  `temporary-chat` yox). `#upload-files` chip görünür; canary yalnız fayldadır.
  Model: «no file attached». `fill()` chip-i silir; filesiz Send sönük; chip yanında
  `keyboard.type` Send-i açır, model yenə oxumur. Temporary chat fail-i ümumiləşir —
  bu hesabda Playwright `.txt` attach modelə çatmır.

**Sahibə qayıt:** fayl tələbi bu nəqliyyatla **yerinə yetirilmir**. Qalan sürət yolu:
paylaşılan söhbətdə `fill()` bir dəfə (17 san), sonra qısa mətn — və ya Temporary+fill
hər kəsikdə qalır.

**Toxunur:** `docs/PHASE-2.md` · `ADR-029` · `Cloud_Server_AI` (`POST /chat`, növbə,
`browser-controller`) · Tehsil soak adapteri (`web/lib/soak/`). Şagird Gemini yolu
**sahə xaricindədir**.

---

## 1. Nəyi həll edirik

Soak Qat 5-in ~30 san-i (2026-08-16, Plus, Hobby, canlı ölçü):

| Mərhələ | Vaxt | Kim |
|---|---|---|
| Yeni Temporary chat | ~2 san | biz |
| 22 KB `core.md` composer-ə yazmaq | ~17 san | biz |
| Model cavabı | ~5 san | ChatGPT |
| Mətn çıxarma | ~4 san | biz |

17 san hər kəsikdə təkrarlanır, çünki hər `POST /chat` təzə Temporary chat açır və
promptu yenidən yazır. Təklif: **bir adi söhbət, prompt bir dəfə, növbədə bir-bir**.

Şagird bu 30 san-i görmür (Gemini). Bu, yalnız Faza 2 həcminin ritmidir. `PHASE-2.md`
~2.5 həll/dəq və 150 san timeout yazır; Qat 1+Qat 5 indiki ~50+ san/kəsik o ritmdən
aşağıdır.

---

## 2. Təklif olunan model

1. ChatGPT-də **Temporary chat yoxdur**. Adi `/c/{id}` söhbəti.
2. **Bir söhbət = 100 kəsik** (adi `/c/{id}`). 100-dən sonra yeni söhbət + yenidən
   iki fayl. Job 100-dən azdırsa söhbət job sonuna qədər eynidir.
3. Prime: `transcribe.md` və `core.md` **iki ardıcıl növbə elementi**, hər biri `.txt`.
4. Sonrakı sorğular qısa per-problem mətndir (Qat 1-də şəkil). 22 KB hər kəsikdə yox.
5. Eyni anda ChatGPT-yə iki mesaj yoxdur. Hər HTTP `POST /chat` növbəyə düşür;
   növbəti yalnız əvvəlkinin `response`-u qayıdandan sonra göndərilir.

### Artıq mövcud olan (dəyişmə)

`Cloud_Server_AI` `RequestQueue` FIFO-dur, `maxSize=10`, tək brauzer, eyni anda bir
iş. Tehsil Vercel-dən 3 paralel `fetch` gəlsə belə ChatGPT UI ardıcıl oxunur.
**Bu tələb növbəni yenidən icad etmir — onu invariant saxlayır.** Paralel Playwright
worker və ya ikinci brauzer bu invariantı pozur və qadağandır.

### Mövcud vəziyyətdən fərq (yeni)

Bu gün hər `sendMessage` Temporary chat açır (`?temporary-chat=true`), URL adi
`/c/...` olsa göndərmir. Təklif bunu **əksinə** çevirir: Temporary chat qadağandır,
paylaşılan `/c/{id}` məcburidir.

Bu, 2026-08-16 canlı ölçüyə ziddir: New chat təkbaşına o biri söhbətdən token
xatırladı; Temporary chat + təzə söhbət `NONE` verdi. Təklif qəbul olunarsa həmin
izolyasiya **bilərəkdən** güzəştə gedir. Bölmə 5 və 7 buna görə kill-qapısıdır.

---

## 3. Qeyri-məqsədlər

- Şagird production Gemini kaskadı, `active_model`, günlük limit.
- `error_code` enum-unun qısaldılması və ya «həmişə düz cavab» soak skripti
  (`PHASE-2.md` / `ADR-029`).
- İkinci Railway servisi, ikinci ChatGPT hesabı, paralel brauzer.
- VNC / headed debug pəncərəsi.
- Prompt mətninin qayda səviyyəsində qısaldılması (Cowork/ADR; bu sənəd sürəti
  **nəqliyyat** ilə alır).

---

## 4. Funksional tələblər

### FR-1 · Tək söhbət

Soak rejimində controller **bir** ChatGPT söhbət ID-si saxlayır. Hədəf ömür:
**100 kəsik** (Qat 1+Qat 5 cütü). URL `/c/{id}` qalır. Temporary chat
(`?temporary-chat=true`) **səhvdir** — `INTERFACE`, mesaj göndərilmir.

100 kəsik bitəndə: yeni söhbət, yenidən FR-2 (iki fayl). 100-ə çatmadan söhbət
ölürsə (FR-6): qalan kəsiklər yeni söhbətdə davam edir, itmiş kəsiklər yenidən
prime + növbə — «100-lük sayğacı» sıfırlanır (OQ-1 qalıq: idle/deploy bu ölümü
tətikləyirmi — bəli, FR-6 siyahısı).

### FR-2 · Prime: iki fayl, iki növbə addımı

Söhbət boş olanda per-problem sual **yoxdur**. Əvvəl iki prime, növbə invariantı
ilə (FR-4) — eyni mesajda iki fayl **olmaz** (composer bir attachment, 2026-08-16).

Sıra (kaskad sırası, qarışmanı azaltmaq üçün):

1. `#upload-files` → `transcribe.md` məzmunu `.txt`. Qısa mətn: bu fayl **yalnız
   şəkil gələndə** transkripsiya müqaviləsidir; həll yazma. Cavab gəlmədən addım 2 yox.
2. `#upload-files` → `core.md` (+ istehsalatın `math.md` birləşməsi) `.txt`. Qısa
   mətn: bu fayl **yalnız canonical mətn gələndə** (yeni şəkil yox) addım müqaviləsidir.

Hər addımın uğuru: modelin faylı **oxuduğuna** dair cavab (Temporary chat-dəki
«attachment isn't available» **fail**). Chip görünməsi kifayət deyil.

**2026-08-16 canlı:** Plus adi söhbətdə uğur siqnalı gəlmədi (OQ-8 fail, S18).
FR-2 nəqliyyatı bloklanır. Ehtiyat yalnız sahib `fill()` prime-ı qəbul edəndə açılır.

Prime uğursuzdursa kəsik göndərilmir.

### FR-3 · Per-problem mesaj qısadır

Prime-dan sonra Qat 5 yalnız `canonical` + qısa «`core.md` müqaviləsinə görə
STEP-SCHEMA JSON» tapşırığı. `core.md` hər kəsikdə **təkrar yazılmır / attach
olunmur**.

Qat 1: şəkil + qısa «`transcribe.md` müqaviləsinə görə transkripsiya JSON».
`transcribe.md` hər kəsikdə attach olunmur.

### FR-4 · Növbə invariantı

- Bütün `POST /chat` eyni FIFO növbəyə düşür.
- `processing === true` ikən ikinci Playwright `send` yoxdur.
- Cavab HTTP `response` olaraq qayıdandan **sonra** növbə növbəti elementi götürür.
- Növbə doludur (`429` / `QUEUE_FULL`) — çağıran retry edir; brauzerdə paralel
  mesaj **yoxdur**.
- Tehsil `callSoakChat` 3 cəhdi növbəni dövrə salır — bu, paralel göndərmə deyil.

### FR-5 · Şəkil və attachment

Composer **bir** attachment saxlayır. Prime `.txt` qalıbsa Qat 1 şəkli onu silir.
Qayda: prime mətn söhbət tarixində qalmalıdır (model oxuyub), composer chip-i
şəkil üçün boşalmalıdır. Chip qalıbsa şəkil göndərilmir.

### FR-6 · Söhbətin ölümü və yenidən prime

Aşağıdakılar söhbəti **batmış** sayır; növbəti işdən əvvəl yeni söhbət + yenidən
prime (əks halda qısa mesaj boş/yad söhbətə düşər):

- Chromium crash / `Target crashed`
- Idle shutdown (defolt 10 dəq) və ya Railway deploy/restart
- `AUTH_EXPIRED` / login divarı
- URL Temporary chat-ə düşüb və ya naməlum səhifə
- Operator reset (bax FR-8)

Yenidən prime **ödənişlidir** (iki fayl + iki model cavabı). 100-lük sayğacı
sıfırlanır. `IDLE_SHUTDOWN_MINUTES=0` soak job müddətində nəzərdən keçirilir
(OQ-3) — əks halda hər 10 dəq fasilə iki faylı yenidən göndərir.

### FR-7 · Bleed (sızma) görünməlidir

Paylaşılan söhbət əvvəlki kəsiyin rəqəmlərini, `error_code`-unu və ya canonical-ını
növbəti cavaba sala bilər. Soak-un bütün dəyəri `error_code` xəritəsidir
(`CLAUDE.md` qızıl qayda). Sızma bu xəritəni **zəiflədir**.

Hər cavabda yoxla (avtomatik, soak `kind=corpus_soak`):

- Əvvəlki kəsiyə məxsus marker (məs. unikal ədəd, kod sözü) bu cavabda varmı.
- `canonical` / `topic_code` göndərilən transkriptdən kəskin sapır.
- `final_answer.values` əvvəlki kəsiyin cavabına bərabərdir, bu kəsiyə deyil.

Sızma həddi keçərsə: soak **dayanır**, şagird Gemini-yə keçid **yoxdur** (`ADR-029`).
Bax AC-bleed.

### FR-8 · Operator reset

API və ya env: «söhbəti bağla, növbəti işdə yeni söhbət + prime». Bir kəsik
söhbəti pozanda (model schema-dan çıxıb, Canvas, «I can't see the image») bütün
növbəni zəhərləməsin.

### FR-9 · Telemetriya

Soak `POST /chat` cavabında və ya Tehsil `solve.cascade` props-da (mövcud ada
yeni ad uydurma — əvvəl `TELEMETRY.md` / Cowork):

- `conversation_reused` (boolean)
- `primed` (bu sorğuda prime oldu / olmadı)
- `queue_wait_ms`
- `input_ms` / `generation_ms` (ayrı; 17+5 qarışmasın)

`cost_usd` soak-da 0 yazılmır (`ADR-029`).

---

## 5. Ssenarilər (BA)

Hər ssenari: nə baş verir, tələb, uğursuzluq halı.

### S1 · Xoşbəxt yol (həcm)

İki fayl prime (növbədə 2 addım). Sonra 100 kəsik: Qat 1 şəkil+qısa, Qat 5 qısa.
Gözlənti: Qat 5 divar saatı ~30 san-dən ~10 san ətrafına (17 san `fill` yox).
100 kəsik × 2 qat + 2 prime = **202+ istifadəçi mesajı** eyni `/c/{id}`.

Uğursuzluq: birinci fayl oxunmayıb ikinci göndərilir; və ya Plus tavanı 100-dən
əvvəl kəsir (S9). Prime fail → kəsik yox (`ADR-029` 5/5 qapısından əvvəl).

### S2 · Qat 1 və Qat 5 eyni söhbətdə, fərqli promptlar

Sahib: hər iki fayl göndərilir. Risk bağlanmayıb — **azaldılıb**. Model hər iki
müqaviləni eyni kontekstdə saxlayır. Qat 1 mesajı «yalnız transcribe faylı» desə
belə 99 əvvəlki həll JSON-u söhbətdə durur.

Uğursuzluq: Qat 5 addım yazır, `error_code` yox / Qat 1 həll etməyə başlayır
(v2→v3). Ölçü: n=10 bleed+schema qapısında Qat 1-də `steps` və ya Qat 5-də
transcribe-only JSON. Fail → rollback, birləşmiş fayl uydurma **yox** (sahib
iki ayrı fayl istədi).

### S3 · Composer bir attachment

Prime `.txt` chip-i qalır, Qat 1 şəkil göndərir — şəkil txt-i əvəz edir (2026-08-16).
Model şəkil görür, faylı görmür; prime yalnız **söhbət tarixində** qalıbsa sağ qalır.

Uğursuzluq: model «fayl yoxdur» + şəkli görmür. FR-5: şəkilə keçməzdən əvvəl txt
chip-ini sil, tarixi yoxlama.

### S4 · Vercel eyni anda iki finish

Playwright və ya retry iki `POST /chat` eyni saniyədə. Növbə sıra saxlayır. UI-də
iki mesaj eyni anda **yoxdur**. Çağıran 429/gözləmə alır, ChatGPT cütləşmir.

### S5 · Növbə dolur (10)

100 kəsik + yavaş cavab + Tehsil 3 retry növbəni doldurur. `QUEUE_FULL`. Soak
skripti geri çəkilir, brauzerə basmır. İnvariant pozulmur; həcm yavaşlayır.

### S6 · Instruction decay

Uzun söhbətdə model `core.md` qaydalarını unudur: `error_code` təkrarlanır,
verifikasiya addımı düşür, JSON pozulur. Bu, 17 san-dən baha başa gəlir — **səhv
xəritəsi**.

Uğursuzluq siqnalı: ardıcıl N sxem etibarsız / eyni `error_code` hər addımda.
Aksiya: FR-8 reset + yenidən prime, soak-u davam et (dayandırma OQ-4).

### S7 · Bir pozulmuş növbə bütününü zəhərləyir

Bir kəsik modelı «bu şəkil oxunmur» döngüsünə salır; növbəti 20 kəsik eyni
imtinanı köçürür. Temporary chat bunu kəsirdi. Paylaşılan söhbət kəsmir.

Aksiya: imtina/schema fail həddi → avtomatik reset (FR-8). Hədd OQ-4.

### S8 · Memory / sidebar tarixi

Adi söhbət ChatGPT Memory və sidebar-a yazılır. New chat belə o biri threaddən
token qaytardı (2026-08-16). «Bir söhbət» Memory-ni **artırır**, azaltmır.

Tələb: soak hesabında Memory mümkün qədər sönük (operator, əl ilə). Kod Memory
UI-ni avtomatik söndürmür (Cloudflare / ToS). Qəbul şərtinə daxildir: operator
checklist.

### S9 · Kontekst pəncərəsi / uzun söhbət

Sahib 100 kəsik eyni söhbətdə istəyir. Bu, tavanı **açıq sualdan şərtə** çevirir.

Hesab (aşağı sərhəd): 2 prime + 100×(Qat 1 + Qat 5) = **202 istifadəçi mesajı**,
üstəgəl model cavabları. Plus Instant limiti tarixən ~160/3 saat olub — **rəqəm
dəyişir, canlı yoxla**. 202 > 160 isə 100 kəsik bir söhbətdə Plus tərəfindən
qırılır; kod 100-ü «həll etmiş» sayılmaz.

Uğursuzluq: «try again later», yavaşlama, köhnə kəsiyin kəsilməsi (decay, S6).
Aksiya qəbuldan əvvəl: bu Plus hesabında 3 saatlıq real tavanı ölç. Tavan < 202
mesajdırsa sahibə qayıt — 100-lük tələbi Plus ilə **zidd** ola bilər; BA 100-ü
səssiz 80-ə endirmir.

### S10 · Idle shutdown və deploy

10 dəq fasilə Chromium-u bağlayır; növbəti sorğu təzə söhbətdir, prime yoxdur.
Qısa «5+5=?» mesajı boş söhbətə düşür, schema pozulur, `unreadable`.

Tələb: FR-6 detektoru (URL `/c/{id}` deyil və ya composer boş + prime bayrağı
itib) → avtomatik yenidən prime. Soak job zamanı idle-ı söndürmək OQ-3.

### S11 · Cookie / AUTH_EXPIRED

Söhbət Plus hesabındadır. Cookie ölür. Login divarı cavab kimi qayıtmamalı
(`assertNotAuthWall`). Soak dayanır, Gemini-yə keçid yoxdur (`ADR-029`).

### S12 · Sızma (qızıl qayda)

Kəsik A: `MARKER-ALPHA-111`. Kəsik B: fərqli DİM. B-nin JSON-unda A-nın ədədi
və ya `canonical`-ı var.

Bu, təklifin **məhsul riskidir**, mühəndislik rahatlığı deyil. Soak «ucuz həcm»
üçün səhv `error_code` yazırsa Faza 2 çıxışı etibarsızdır — Faza 1 qapısından
pisdir, çünki yanlış inam yaradır.

AC-bleed keçməsə təklif **rədd** olunur, Temporary chat qalır.

### S13 · Tək vision+həll (`PHASE-2` variant 2)

Paylaşılan söhbət + tək çağırış bir-birini əvəz etmir. Tək çağırış 22 KB-ı və
ikinci round-tripi kəsir, amma `match_path` ayrıca etiketlənir və production
kaskadı ilə qarışdırılmır. Bu təklif kaskadı saxlayır, nəqliyyatı dəyişir.

Hər ikisini eyni vaxtda etmək OQ-6 (həcm vs dürüst latensiya).

### S14 · Persist / eyni rəqəm izi

Sürətdən asılı deyil, amma eyni soak `5+5` ikinci dəfə `questions_fingerprint_dedup_idx`
ilə 500 verir. Paylaşılan söhbət bunu düzəltmir. Ayrı `persist.ts` tələbi
(hash+fingerprint lookup). Bu sənədin qəbulu onu gizlətmir.

### S15 · Rollback

Bleed qapısı, decay, və ya Memory sızması fail: `POST /chat` yenidən Temporary
chat + tam prompt. Növbə eyni qalır. Tehsil adapteri dəyişməyə bilər (hələ
`attachTextAsFile` göndərir; server davranışı dəyişir).

---

### S16 · İki fayl, bir composer

Addım 1-in `.txt` chip-i qalırsa addım 2 ikinci faylı **əvəz edir**, göndərmir.
Tələb: addım 1 göndərilib, cavab gəlib, composer boş — **sonra** addım 2 attach.

Uğursuzluq: söhbətdə yalnız `core.md` var, `transcribe.md` heç vaxt oxunmayıb.

### S17 · 100-cü kəsik

99 JSON + 99 şəkil təsviri kontekstdə. Model ilk faylları «unudur» (S6) və ya
ilk kəsiyin `5+5` cavabını 100-cüyə köçürür (S12). AC-bleed n=10 **və** n=100
sonunda təkrar (son 10 kəsikdə marker). n=10 keçib n=100 fail = təklif yarı
qəbul deyil.

### S18 · `.txt` chip ≠ oxunmuş fayl (canlı, 2026-08-16)

Plus, Hobby, `CHATGPT_CONVERSATION_MODE=shared`, canary yalnız `.txt`-də
(`7f3c91e2`), typed mətndə yox.

| Cəhd | Nə oldu | Model |
|---|---|---|
| Chip + `fill("read the file")` | Chip upload-da var; `fill` composer-i təmizləyir | «no file attached», canary yox |
| Yalnız fayl, typed yox | Send sönük, 503 | — |
| Chip + `keyboard.type` yanında | Chip qalır, Send işləyir, regular URL | Yenə «no file attached»; Library-dəki köhnə fayllara baxır |

Uğursuzluq: sahibin iki-fayl prime-ı bu Playwright yolla **iflas**. Şəkil
(`#upload-photos`) eyni hesabda işləyir — `.txt` (`#upload-files`) ayrı kəmərdir
və modelə çatmır.

---

## 6. Açıq suallar (sahib / Cowork)

| ID | Status | Sual | Niyə |
|---|---|---|---|
| OQ-1 | qismən | Ölüm (idle/deploy) 100-lük sayğacını sıfırlayır — təsdiq? | FR-6 |
| OQ-2 | **bağlı** | İki ayrı `.txt`: `transcribe.md` sonra `core.md` | — |
| OQ-3 | açıq | Soak-da `IDLE_SHUTDOWN_MINUTES=0`? | 10 dəq = iki fayl yenidən |
| OQ-4 | açıq | Neçə ardıcıl schema/imtina → reset? | Zəhər söhbət |
| OQ-5 | **bağlı** | Bir söhbət = 100 kəsik | S9 tavanı şərt oldu |
| OQ-6 | açıq | Kaskad vs `PHASE-2` tək çağırış | dürüstlük |
| OQ-7 | açıq | Bleed: 0, yoxsa ≤k/100? | qızıl qayda |
| OQ-8 | **bağlı — fail** | Adi söhbətdə `#upload-files` `.txt` oxunmur | S18 |
| OQ-9 | **açıq — sahib** | Fayl əvəzinə `fill()` bir dəfə prime? | yeganə ölçülmüş sürət yolu |

Kod: OQ-9 (fill prime qəbul?) və OQ-7 (bleed) cavabsız paylaşılan söhbət **yazılmır**.
OQ-8 fail fayl-prime icrasını bağlayır.

---

## 7. Qəbul şərtləri (qəbul **olunarsa**)

Canlı, Plus cookie, Hobby, n≥10 fərqli kəsik, eyni söhbət:

1. **Növbə:** 3 eyni anda HTTP; cavablar qarışmır; logda eyni anda iki `Submitting` yoxdur.
2. **Prime:** `transcribe.md` və `core.md` iki ayrı `.txt` mesajı; hər ikisinin
   oxunduğu sübut (cavab mətni). Sonrakı Qat 1/5-də bu fayllar **yenidən attach
   olunmur**; `fill` 22 KB **yoxdur**.
3. **Sürət:** Qat 5 divar saatı prime-dan sonra median ≤12 san (2026-08-16 30 san
   ilə müqayisə). Prime özü ayrıca ölçülür, medianı korlamır.
4. **Temporary chat yoxdur:** göndərmə URL-i `?temporary-chat=true` deyil.
5. **AC-bleed:** n≥10-da əvvəlki kəsiyin unikal markeri növbəti JSON-da **0**.
   Bir hadisə = qapı fail, rollback.
6. **Schema:** Qat 5 JSON `validateStep` keçidi Temporary chat baseline-indən
   pisləşmir (Cowork ədədi qoyur).
7. **Şagird:** `soak-*` olmayan dəvət Gemini-də qalır; bu dəyişiklikdən 0 fərq.
8. **Ölüm:** idle/crash/deploy-dən sonra növbəti iş yenidən prime olur, qısa
   mesaj boş söhbətə düşmür.

---

## 8. Qərar çərçivəsi (BA tövsiyəsi)

Təklif **sürəti** həll edir (17 san-lik yazı). Qiyməti **ölçmə etibarlılığıdır**.

Faza 2 çıxışı «etibarlı korpus datası»dır, tez UI deyil. Sızma ilə 100 `delivered`
sətir Faza 1-dən təhlükəlidir: səhv `error_code` xəritəsi məhsulun satış iddiasını
zəhərləyir.

Tövsiyə icra sırası:

1. ~~OQ-2 / OQ-5~~ — sahib: iki fayl, 100 kəsik.
2. ~~OQ-8~~ — canlı fail (S18). Fayl-prime bu yolla yox.
3. **Sahib OQ-9:** paylaşılan söhbətdə `fill()` bir dəfə (17 san) qəbul, yoxsa
   Temporary+hər kəsikdə fill qalır, yoxsa `PHASE-2` tək çağırış.
4. Fill-prime qəbul olsa: Plus tavan ≥ 202 mesaj? Sonra n=10 bleed **həcmdən əvvəl**.
5. Növbə invariantına toxunma.
6. `persist` fingerprint dedup ayrıca.

Tək çağırış (`PHASE-2` variant 2) eyni 17 san-i kəsə bilər **və** söhbət
paylaşmadan — bleed riski bu təklifdən kiçikdir, kaskad dürüstlüyü isə şüurlu
güzəştdir. OQ-6 bunu müqayisə etmədən paylaşılan söhbətə keçməyin.

---

## 9. İcra qeydi (qəbuldan sonra, indi yox)

Yalnız `Cloud_Server_AI` söhbət həyat dövrünü dəyişir. Tehsil adapteri mümkün
qədər eyni `POST /chat` gövdəsini göndərir; server prime-ı özü idarə edə bilər
ki, Vercel redeploy-u blok olmasın. Şagird yolu import etmir.
