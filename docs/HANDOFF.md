# HANDOFF — növbə jurnalı

İki asinxron agent (Cowork ↔ Claude Code) arasındakı yeganə rabitə kanalı.
**Əlavə-only.** Köhnə blokları redaktə etmə və ya silmə. Ən yenisi yuxarıda.

## Format

```
## YYYY-MM-DD · <Kim> → <Kimə>
Etdim:    <bir-iki sətir, konkret fayl adları ilə>
Tapşırıq: <ClickUp ID + bir cümlə>
Diqqət:   <pozulmamalı olan şey, varsa>
Blok:     <qərar tələb edən şey, varsa — yoxdursa sətri yazma>
```

---

## 2026-08-07 (33) · Claude Code → Cowork

**Etdim — ƏSL SƏBƏB TAPILDI VƏ DÜZƏLDİLDİ, bu dəfə koda baxaraq DEYİL, canlı DOM sınağı ilə sübut edərək.**

Ilkin bloklar 31/32-nin işləmədiyini bildirdi və haqlı sual verdi: "həqiqətən push etdinmi,
tapşırığı düzgün başa düşdünmü?" İkisini də CANLI yoxladım (əvvəl fərz etmək əvəzinə):

**1) Push/deploy təsdiqi:** istehsalat bundle-ını (`web-ilkin-ibishovs-projects.vercel.app`)
endirib blok 32-nin unikal işarəsini (`left:-22,top:-22`, 44px handle-lər) axtardım —
**tapıldı, canlıdır.** Push/deploy problemi YOX İDİ.

**2) Əsl bug — canlı DOM-a sintetik hadisə göndərərək tapıldı:** istehsalat səhifəsində
`getUserMedia`-nı saxta `canvas.captureStream()` ilə əvəz etdim (brauzer aləti kameranı
bloklayır, amma bu, JS səviyyəsində problemi keçir), kameradan KƏSMƏ ekranına qədər əl ilə
gəzdim, sonra "se" (sağ-alt) handle-ə həqiqi `MouseEvent`/`TouchEvent` göndərib qutunun
`style.left/top/width/height`-ni ÖLÇDÜM:

Nəticə: **width/height HEÇ VAXT dəyişmədi, yalnız left/top dəyişdi** — hər resize cəhdi
səssizcə "move"-a çevrilirdi. Bloklar 31/32 (Pointer→Touch/Mouse keçidi, `window`-a bağlama,
44px hədəf) hamısı **doğru, amma yanlış problemi həll edirdi.**

**Həqiqi səbəb:** 4 künc handle-i "move" qutusunun İÇİNDƏ (DOM övladı) yerləşir.
`stopPropagation()` çağırılmadığı üçün handle-in öz down-hadisəsi valideynə **bubble edir**,
qutunun öz "move" down-handler-i DƏ işə düşür və `drag.current.handle`-i handle-in adından
("se"/"nw"/...) **"move"-un üzərinə yazır** — nəticədə hansı handle-ə toxunsan da, YALNIZ
mövqe (x/y) dəyişir, ölçü (w/h) HEÇ VAXT dəyişmir. Bu, Pointer/Touch API-dən TAMAMİLƏ
asılı olmayan, sadə DOM event-bubbling bugudur — kod YAZILDIĞI GÜNDƏN (S2, blok 23) var idi,
desktop siçanla təsadüfən "move" işlədiyi üçün heç vaxt tutulmayıb.

**Düzəliş:** `onDragStart`-a bir sətir — `e.stopPropagation()`.

**Yoxlama — bu dəfə FƏRZ ETMİRƏM, ÖLÇDÜM:** lokal `next dev`-də eyni sintetik-hadisə testini
düzəlişdən SONRA təkrarladım:
- `se` handle sürüşdürüldü → `width: 80%→90%, height: 44%→71.27%, left/top DƏYİŞMƏDİ` (düzgün resize).
- Qutunun özü (touch ilə) sürüşdürüldü → `left/top dəyişdi, width/height DƏYİŞMƏDİ` (düzgün move).

İkisi də DƏQİQ gözlənilən davranışı verdi. `npm run build`/`lint` təmiz.

**Diqqət:** bu, hələ də REAL barmaqla telefonda sınanmayıb (yenə eyni mühit məhdudiyyəti —
kamera bloklanır), AMMA bu dəfə fərq keyfiyyətcədir: əvvəlki iki cəhd yalnız NƏZƏRİ əsaslanırdı
("bu, doğru naxışdır"), bu dəfə DOM-un özündə ÖLÇÜLMÜŞ, TƏKRARLANA BİLƏN sübut var (`resized:
true, moved:false` və əksi) — problem koddadır, mühit fərqindən deyil, ona görə telefonda da
eyni nəticəni gözləyirəm.

**Blok:** yoxdur.

---

## 2026-08-07 (32) · Claude Code → Cowork

**Etdim — blok 31-in düzəlişi telefonda İŞLƏMƏDİ (Ilkin bildirdi). İkinci, fərqli kök səbəblə düzəldim, xarici mənbələrə əsaslanaraq.**

Blok 31-də `pointermove`/`pointerup`-ı `window`-a köçürdüm (element-target asılılığını sildim),
amma çərçivə YENƏ statik qaldı. Bu, ilk fərziyyəmin (yalnız bubble/capture yolu) YANLIŞ
olduğunu göstərdi — kök səbəb elementin özündə deyil, **Pointer Events API-nin özündə** imiş.

**Xarici araşdırma (Ilkin-in tövsiyəsi ilə):** axtardım — məlum, geniş sənədləşdirilmiş
problem: brauzer toxunuşu səhifə sürüşdürməsi/gest kimi "ələ alanda" aktiv Pointer Event
ardıcıllığına `pointercancel` göndərir, `touch-action:none` olsa belə bəzi mobil brauzerlərdə/
in-app webview-lərdə (WhatsApp/Instagram/Telegram-ın öz daxili brauzeri kimi) Pointer Events
dəstəyi qismən və ya gecikmişdir. Bu, real developer-lərin dəfələrlə rast gəldiyi sinifdəndir
(mənbə: javascript.info/pointer-events, MDN `touch-action`). **`react-easy-crop` kimi məşhur
açıq mənbəli kəsmə kitabxanaları məhz bu səbəbdən Pointer Events-ə güvənmir** — ayrı-ayrı
`touchstart`/`touchmove`/`touchend` (toxunuş üçün) və `mousedown`/`mousemove`/`mouseup`
(siçan üçün) işlədirlər, daha köhnə amma universal dəstəklənən API.

**Düzəliş — `CropView.tsx` tam yenidən yazıldı bu naxışla:**
- `onPointerDown` → `onDragStart`, `React.MouseEvent | React.TouchEvent` qəbul edir.
- `pointFromEvent()` — `TouchEvent`-dən (`touches[0].clientX/Y`) və ya `MouseEvent`-dən
  (`clientX/Y`) koordinatı çıxarır, hər iki halı vahid məntiqə gətirir.
- `window`-a **beş** dinləyici: `mousemove`/`mouseup` (siçan) + `touchmove`/`touchend`/
  `touchcancel` (toxunuş). `touchmove` `{passive:false}` ilə (əks halda `preventDefault`
  Chrome-da xəbərdarlıqla məhv edilir).
- **Toxunuş hədəfi böyüdüldü:** handle-lar 28px → **44px** (Apple/Google minimum tövsiyəsi),
  görünən yaşıl nöqtə 22px qalır, daxilində mərkəzləşib (`pointerEvents:"none"`, klikləri
  valideynə keçirir). Bu, ayrıca simptom idi — kiçik dairəyə dəqiq barmaqla düşmək çətindir.

**Yoxlama:** `npm run build`/`lint` təmiz. **YENƏ real toxunuşla sına bilmədim** — bu mühitin
brauzer aləti kameranı bloklayır (istehsalat linkinin ÖZÜNDƏ də sınadım, eyni nəticə — bu,
localhost-a məxsus deyil, alətin öz məhdudiyyətidir), kameraszı kəsmə ekranına çatmaq mümkün
deyil. `getUserMedia`-nı saxta `MediaStream` ilə əvəz etməyi düşündüm (HANDOFF 23-də bir dəfə
cəhd edilib) — brauzer alətimdə səhifə YÜKLƏNMƏZDƏN ƏVVƏL skript inyeksiyası (Playwright-ın
`addInitScript`-i kimi) mexanizmi yoxdur, React effekti mənim JS-imdən əvvəl işə düşür, ona
görə bu yol da bağlıdır.

**Etibar səviyyəsi fərqlidir bu dəfə:** blok 31 öz məntiqi ilə (yalnız target dəyişdirmək)
əsassız nikbin idi. Bu düzəliş konkret, adlandırılmış, sənədləşdirilmiş problemi (Pointer
Events-in mobil brauzerlərdə `pointercancel`/qismən dəstək riski) real açıq mənbəli
kitabxananın öz seçimi ilə üst-üstə salır — amma **yenə də son söz telefonda sənindir.**

**Blok:** yoxdur. Əgər BU da işləməzsə, növbəti addım Playwright/real-device MCP alətindən
istifadə edərək canlı toxunuş sınağı aparmaq olardı (bu sessiyanın alətləri kifayət etmir).

---

## 2026-08-07 (31) · Claude Code → Cowork

**Etdim — telefonda kəsmə çərçivəsi statik idi (Ilkin bildirdi, blok 30-un düzəlişindən dərhal sonra).**

`CropView.tsx`: sürüşdürmə/böyütmə `onPointerMove`/`onPointerUp`-ı `imgWrapRef` div-inə
bağlayırdı, hərəkət `pointerdown`-da `setPointerCapture` edilmiş handle-dan **bubble** yolu
ilə gəlirdi. Real toxunuşda barmaq 28px handle-dan demək olar həmişə cüzi kənara çıxır —
bəzi mobil brauzerlərdə `setPointerCapture` toxunuş (touch-type) pointer üçün etibarlı işləmir,
nəticədə ilk `pointermove` handle-dan deyil, HANSISA BAŞQA elementdən gəlir, `imgWrapRef`-ə
bubble etmir, sürüşdürmə İLK HƏRƏKƏTDƏ dayanır — "statik" kimi görünür. Fənərin/desktop
siçanın işləməsi (mouse pointer capture adətən etibarlıdır) bunu maskalayıb, sınaqdan keçməyib.

**Düzəliş:** `pointermove`/`pointerup`/`pointercancel` indi `window`-a bağlanır (`useEffect`,
boş asılılıq — yeganə oxunan dəyərlər `drag.current`/`imgWrapRef.current`, hər ikisi ref,
staleness yoxdur). Barmaq ekranda haradan keçirsə keçsin hadisə tutulur, konkret DOM
elementindən asılılıq aradan qalxır. `onPointerDown` handle-larda qalır (sürüşdürmənin
başlanğıcını qeyd edir), `setPointerCapture` çağırışı SİLİNDİ (artıq lazım deyil, yalnız
səhv təhlükəsizlik hissi verirdi).

**Yoxlama:** `npm run build`/`lint` təmiz. Bu mühitdə də kamera bloklanır (blok 30-dakı
eyni məhdudiyyət) — kəsmə ekranına çatmaq üçün əvvəlcə şəkil çəkilməlidir, ona görə real
toxunuşla birbaşa sına bilmədim. Məntiq baxımından bu, tam olaraq HANDOFF-da təsvir edilən
sinifin standart həllidir (pointer/drag interaksiyalarında window-level listener konkret
elementə bağlı listener-dən daha etibarlıdır) — amma **son təsdiq yenə telefonda sənin/
Ilkin-in tərəfindəndir.**

**Blok:** yoxdur, amma bu, İKİNCİ ardıcıl kamera/kəsmə bug-ıdır ki, yalnız real telefon
sınağında üzə çıxdı (blok 30, indi bu). Növbəti kamera/kəsmə dəyişikliyində bu qatın real
cihazda sınanmasını prioritetləşdir — bu mühit (browser aləti) kameranı bloklayır, struktur
məhdudiyyətdir, yoxlama boşluğunu doldurmur.

---

## 2026-08-07 (30) · Claude Code → Cowork

**Etdim — telefonda kamera bug-ı düzəldildi (diaqnoz Ilkin-dən birbaşa gəldi, HANDOFF-a yazılmamışdı — bu blok həm diaqnozu, həm düzəlişi qeyd edir).**

`CaptureView.tsx`: `<video>` yalnız `stage==="live"`-da mount olunurdu, amma `srcObject`
ondan ƏVVƏL (effektdə, `setStage("live")`-dan öncə) təyin edilirdi → `videoRef.current`
hələ `null` idi → sətir səssizcə keçilirdi → video mənbəsiz mount olurdu. `shoot()`
`videoWidth===0` görüb səssiz `return` edirdi. Fənərin işləməsi (`streamRef`-i birbaşa
işlədir) axının sağlamlığını göstərirdi — problem yalnız `<video>` elementinin özündə idi.

**Düzəliş:** callback ref (`setVideoEl`) — `videoRef.current`-i həm elementin mount
anında, həm stream-in hazır olma anında (hansı sonra gəlirsə) `srcObject`-ə bağlayır,
sıra asılılığı aradan qalxır. Effektdəki köhnə əl ilə təyinetmə silindi (artıq heç vaxt
işə düşməyəcəkdi — video həmişə effektdən sonra mount olur).

`capture.shutter_noop` hadisəsi əlavə edildi (`props: {reason: "video_not_ready"}`) —
`shoot()`-un erkən `return`-ünə, `docs/TELEMETRY.md`-yə yazıldı (sənin sahibliyindədir,
açıq təlimatınla etdim, `HANDOFF (26)`-dakı `capture.permission_denied` əlavəsi ilə eyni nümunə).

**Yoxlama:** `npm run build`/`lint` təmiz. Real kamera ilə sınaya bilmədim — bu mühitin
brauzer aləti kamera girişini bloklayır (`ADR-011`-də əvvəldən qeyd olunan məhdudiyyət),
yalnız `permission-denied` yolunu gördüm. Kodun məntiqi cəhətdən düzgünlüyünə əminəm
(callback ref sıra asılılığını struktur olaraq aradan qaldırır, eyni sinif TypeScript-də
yoxlanıla bilməz), amma **real telefon kamerasında son təsdiq sənin/Ilkin-in tərəfindədir**
— `S2`-nin qalan açıq maddəsi elə budur (HANDOFF 23-dən bəri).

**Blok:** yoxdur.

---

## 2026-08-07 (29) · Claude Code → Cowork

**Etdim — blok 28-in İKİ açığı da bağlandı: v6 eval REAL nəticə verdi, `/api/solve` uc-uca sınandı, VƏ canlı sınaqda ciddi bug tapılıb düzəldildi.**

Ilkin `.env`-i (real `API_KEY`/`MODEL`/`BASE_URL`) əlavə etdiyini dedi — bu worktree-yə
kopyaladım (əsas worktree-də idi, worktree-lər fayl sistemini paylaşmır), heç vaxt dəyərini
çap etmədim.

**1) v6 eval işə salındı (sənin təsdiqinlə, real xərc):**
```
scripts/eval.py --pipeline B --set evals/golden-set-cropped.jsonl
```
Sxem validliyi **10/10**, struktur (index ardıcıl, hər addımda check, son addım yoxlama)
**10/10**, cavab sızması **0/10**, son cavab dəqiqliyi **7/10**, orta xərc $0.0159/həll.

**VACİB METODOLOJİ TAPINTI:** konsol "Addım bölgüsü — pedaqoji: 6/10" çap etdi — AMMA bu,
v6-nın YENİ cavablarının rəyi DEYİL. `report.py::find_latest_human_review` sadəcə ən son
`human-review-*.jsonl` faylını götürür, tarixinə/prompt versiyasına baxmadan — yeganə mövcud
fayl `human-review-2026-08-06.jsonl` (KÖHNƏ, v5-in cavablarına aid) idi, problem `id`-ləri
üst-üstə düşdüyü üçün SƏSSİZCƏ yenidən göstərildi. **v6-nın pedaqoji keyfiyyəti hələ İNSAN
tərəfindən BAXILMAYIB.** Bu, gələcək hər eval run-ı üçün gizli tələ — `evals/README.md`-yə
xəbərdarlıq əlavə etməyi tövsiyə edirəm (mən sənədi dəyişmədim, sənin sahibliyindir).

Öz tərəfimdən (insan rəyinin ƏVƏZİ DEYİL, amma siqnal): 10 nəticənin son addımlarını `ADR-010`-un
iki qaydasına qarşı əl ilə oxudum. Qayda 10 (variant seçimi qadağan) — **10/10 təmiz**, heç bir
`check.ask` variant hərfi soruşmur. Qayda 11 (yoxlama ilkin şərtə qayıtmalı) — **8/10 həqiqi
substitusiya** (c02,03,05,06,07,08,09,10 orijinal tənliyə/funksiyaya qayıdır), **2/10 hələ
sadəcə son hesablamadır** (c01, c04 — bunlar tənlik deyil, "ifadəni hesabla" tipli məsələlər,
substitusiya təbiətən mümkün deyil). Bu, v5-in bilinən uğursuzluqlarından (6/10) əhəmiyyətli
irəliləyiş kimi görünür, amma **rəsmi qapı yalnız sənin/Ilkin-in insan rəyi ilə bağlanır**.

`final_answer_correct` 7/10-dəki 3 uğursuzluğu (c03, c05, c06) araşdırdım — hamısı ÖLÇÜ
uyğunsuzluğudur, model səhvi deyil: c03 model `log_2(...)` yazıb, golden `log2(...)` gözləyir
(alt xətt fərqi parse-i sındırır); c05/c06 model ÜMUMİ triqonometrik həll ailəsini qaytarıb
(`pi/6+pi*k/3`), golden isə tək dəyər gözləyir — hər ikisini **Python-un öz `verify.py`-ında
əl ilə sınadım**, eyni səbəbdən eyni cür uğursuz olur. TS portunun yaratdığı fərq deyil.

**2) `/api/solve` REAL UC-UCA SINANDI** (real Gemini + lokal Postgres, `th-postgres`
konteyneri artıq işləyirmiş S1a-dan qalma): dəvət kodu rədd (403, xərcsiz), gündəlik limit
(429 + `events`-ə `limit.blocked`, xərcsiz), tam həll axını (200, DB-yə `problems`/`solutions`/
`attempts` düzgün yazıldı) — hamısı `curl` ilə birbaşa yoxlandı.

**Bu sınaqda İKİ real bug tapıb düzəltdim (kod rəyi ilə deyil, canlı çağırışda):**
- `lib/prompt.ts`-də regex heading-i İKİ DƏFƏ escape edilmişdi (çağırış yerində əl ilə
  `\(...\）`, sonra funksiyanın öz avtomatik escape-i) → `## User (dəyişənlərlə)` bloku
  HEÇ VAXT tapılmırdı, hər sorğu 500 verirdi. Düzəliş: çağırış yerində xam mətn.
- **Daha ciddisi:** `route.ts` `verified` üç halını (`true`/`false`/`null`) `if (!verified)`
  ilə eyniləşdirmişdi. `null` = "yoxlanıla bilmədi" (canonical tək dəyişənli tənlik deyil —
  BÜTÜN söz/parametr/ehtimal məsələləri, `c08` bunu canlı göstərdi: model DÜZGÜN cavab
  verdi, `m=7`, amma `unreadable` kimi qaytarılırdı). Bunu Python-un öz `verify.py`-ında
  eyni girişlə sınadım — **eyni nəticə** (`None, False`), yəni bu, `verify.py`-ın əvvəldən
  mövcud, indiyə qədər real trafikə məruz qalmadığı üçün gizli qalmış məhdudiyyətidir, TS
  portunun yaratdığı bug deyil. Düzəliş: yalnız `verified===false` (QƏTİ ZİDDİYYƏT) rədd
  edilir, `null` halında həll `verification_method="none"` ilə ÇATDIRILIR (`STEP-SCHEMA.json`-
  un `verification.method` enum-u bunun üçün "none" seçimini onsuz da nəzərdə tutmuşdu).
  Detallar `ADR-012` → "Qərar 4". **Bu tapıntı olmasaydı, bütün söz/parametr/ehtimal
  məsələləri (ADR-004-ün B qrupu) istehsalatda həmişə rədd ediləcəkdi.**

Hər ikisi düzəldildikdən sonra eyni sorğu ilə yenidən sınadım — 200, düzgün DB yazısı.
Test sətirlərini (attempts/events/solutions/problems) DB-dən sildim.

**Tapşırıq:** ClickUp-un "Faza 1 · Şaquli dilim" siyahısında S3 üçün ayrıca tapşırıq yoxdur
(yalnız S1b və köhnə "kəsmə+seçim ekranı" tapşırığı var) — HANDOFF birinci mənbədir.

**Diqqət:**
- `web/.env.local` və test şəkli (`evals/images-cropped/c08_q85.jpg`) sınaqdan sonra silindi —
  bu worktree-də saxlanmır (`.gitignore`).
- `evals/results/B-2026-08-07.json` bu worktree-də commit EDİLMƏYİB (`evals/results/`
  strukturuna uyğun, əvvəlki nəticələr kimi yerli qalır).

**Blok:** BİR AÇIQ ŞEY qalır — **v6-nın pedaqoji keyfiyyətinin İNSAN tərəfindən rəyi**
(yuxarıdakı metodoloji tapıntıya görə avtomatik run bunu ölçmədi). Mən öz oxumamı yazdım
(8/10 real yoxlama, 2/10 hələ son-hesablama tipli) siqnal kimi, amma rəsmi qapı (`≥8/10`)
yalnız sənin/Ilkin-in rəyi ilə bağlanır. S3-ün özü (kod) hazırdır və canlı sınanıb — bu, S4-ə
keçməyə mane olmur, PHASE-1-in özünün dediyi kimi ("v6 keçmirsə prompt işidir, kod davam edir").

---

## 2026-08-07 (28) · Claude Code → Cowork

**Etdim — A) tema bug-ı artıq düzəlmişdi, B) S3 kodu yazıldı, eval BLOKDADIR (açar yoxdur).**

**A) Tema bug-ı (blok 27-nin təsviri).** Yoxladım — bu worktree-də artıq düzəlmişdi
(`19e784c`, əvvəlki sessiya): `layout.tsx`-də `themeVars`/`data-theme` artıq `<html>`-dədir,
`.app-shell`-də deyil. Əlavə iş lazım olmadı. `main`-dəki HANDOFF nömrələmə düzəlişini
(`a90b4cd`, 26→27) bu branch-ə merge etdim ki, iki tərəf sinxron qalsın.

**B) S3 — `/api/solve` real inteqrasiya yazıldı, amma UC-UCA YOXLANILMADI:**

- `web/lib/prompt.ts` — `prompts/solve-step.md`-i **fayldan** oxuyur, `scripts/lib/
  prompt_loader.py` ilə eyni çıxarma məntiqi (regex ilə `## System`/`## User` blokları).
  `next.config.ts`-ə `outputFileTracingIncludes` əlavə etdim ki, bu fayl funksiya bundle-ına
  düşsün — `.next/server/app/api/solve/route.js.nft.json`-da təsdiqlədim.
- `web/lib/llm.ts`, `cost.ts` — Gemini (OpenAI-uyğun `/chat/completions`), retry (429/5xx, 3 cəhd).
- `web/lib/verify/{schema,answer,leak}.ts` — `scripts/lib/{schema_check,verify,leak}.py`-ın
  TS portu. **Memarlıq qərarı `ADR-012`-də:** Python serverless funksiya seçilmədi (Vercel-in
  Root Directory-dən kənar faylları bundle-a salıb-salmayacağı bu sessiyada yoxlanıla bilmirdi,
  cross-runtime çağırış `next dev`-i də pozardı). Bunun əvəzinə tapdım ki, istehsalat yoxlaması
  həmişə ədədidir (sympy simplify sadəcə ədədə endirmək üçün idi) — `mathjs` ilə eyni nəticəni
  verir. `x²-5x+6=0` üçün kök 3/2 doğru, 5 səhv, `sqrt(2)` işləyir — ayrıca skriptlə sınadım
  (`ADR-012`-də detallar). **`scripts/lib/*.py` TOXUNULMADI** — eval və istehsalat artıq iki
  müstəqil implementasiyadır, divergensiya riski `ADR-012`-də açıq yazılıb.
- Miqrasiya `0002_problems_solutions_attempts.sql` — `attempts.device_id` əlavə etdim
  (`user_id` nullable qaldı, Faza 1-də auth yoxdur, `ADR-012`).
- Dəvət kodu: `INVITE_CODE` env (tək paylaşılan sirr, 20 nəfərlik qrup üçün overengineering
  olmasın deyə cədvəl yox). `web/components/kamera/InviteGate.tsx` — kameradan əvvəl bir dəfə
  soruşur, `localStorage`-da saxlayır, server 403 versə silinir və yenidən soruşulur.
- Gündəlik limit 30, `device_id` üzrə, YALNIZ `completed=true` sətirlər sayılır (S5 invariantı).
  Limitə çatanda `events`-ə server özü `limit.blocked` yazır (`daily_count` ilə).
- `kamera/page.tsx` — `device_id`/`invite_code`/`subject` əlavə etdim, cavaba görə
  `solve.response`/`refusal.shown`/`limit.blocked` telemetriyasını indi doğru göndərir
  (əvvəl yalnız `solve.failed` var idi, S2 stub-ın qalığı).
- `web/.env.example` yaratdım — README-də istinad edilirdi, amma HEÇ VAXT mövcud olmayıb
  (`.gitignore`-da `.env*` onu da tutub saxlamışdı, `!.env.example` əlavə etdim).

**Yoxlama — dürüst deyim, uc-uca YOXDUR:**
- ✅ `npm run build` və `npm run lint` təmiz (dummy env dəyərləri ilə).
- ✅ `lib/verify/answer.ts`-in ədədi məntiqi ayrıca skriptlə sınandı (yuxarıda).
- ❌ **Real Gemini açarı bu worktree-də yoxdur** (`.env` heç yerdə tapılmadı, mühit
  dəyişənlərində də yoxdur) — nə `/api/solve`-i real şəkillə sınaya bildim, nə də
  **v6 eval-i işə sala bildim** (`scripts/run-eval.bat`, ~$0.17). `docs/PHASE-1.md` S3-ün
  ilk şərti "eval S3-ün ƏVVƏLİNDƏ işə salınsın" idi — bunu ATLAMADIM, İCRA EDƏ BİLMƏDİM.
- ❌ Lokal Postgres da qurulu deyil bu worktree-də — DB yazı yolu (`problems`/`solutions`/
  `attempts` insert-ləri) yalnız kod səviyyəsində nəzərdən keçirilib, icra edilməyib.

**Blok:** İKİ AÇIQ ŞEY, ikisi də canlı test tələb edir:
1. **v6 eval-i sənin/Ilkin-in tərəfindən işə salınmalıdır** (`scripts/.env`-ə real `API_KEY`
   lazımdır, mənim girişimdə yoxdur) — nəticə `docs/HANDOFF.md`-ə yazılmalıdır ki, S4-ə keçməzdən
   əvvəl pedaqoji ox ≥8/10 olduğu bilinsin. Keçmirsə, `PHASE-1.md`-in özünün dediyi kimi bu
   prompt işidir, S3 kodu bundan asılı deyil.
2. **`/api/solve`-in uc-uca canlı testi** — real Postgres (S1b-dəki Supabase artıq var) +
   `GEMINI_API_KEY` + real telefon şəkli ilə. Xüsusilə `ADR-012`-dəki mathjs portunun bilinən
   məhdudiyyəti (implicit multiplication yalnız rəqəm-əsaslı hallarda həll olunub) canlı
   nümunələrlə yoxlanmalıdır — gözlənilməzdən yüksək `unreadable`/`verify` uğursuzluğu görsən,
   səbəb ilk növbədə bu port ola bilər, model deyil.

---

## 2026-08-07 (27) · Claude Code → Cowork

**Etdim — S1b tam qurulub, canlı işləyir.**

**1) Keçid tədbiri (`next build && next start`):** tunel üzərində düymələr işə düşdü —
`ADR-011` diaqnozunu təsdiqlədi (13 chunk, 0×403, `reactPropsOnButton` var, `capture.permission_denied`
canlı tetiklədim, DB-yə düşdü). Bu, S1b-yə keçənə qədər həqiqətən "kod sağlamdır" sübutu oldu.

**2) `lib/image.ts`-ə `imageSmoothingQuality = "high"`** (blok 24-dəki xahiş).

**3) S1b — GitHub → Vercel → Supabase, canlı, `main`/branch push-da avtomatik:**
- Supabase: yeni layihə `tehsil-platformasi` (`eu-central-1`, ref `oxjzehxnbumgyoqjonju`).
  Miqrasiya birbaşa tətbiq etdim və doğruladım — **`0001_events.sql` portativ olduğu iddiası
  praktikada təsdiqləndi**, heç bir dəyişiklik lazım olmadı.
- GitHub: `Ilkin-Ibishov/tehsil-platformasi` (private) yaradıldı, `main` və işlək branch push edildi.
- Vercel: `ilkin-ibishovs-projects/web`. **Bir arxitektur maneəsi tapıb düzəltdim:** `web/`
  qovluğundan CLI ilə tək başına deploy `../docs/DESIGN-TOKENS.json`-u tapmadı (yalnız `web/`
  yüklənir, repo kökü yox). Həll: Git-əsaslı deploy + **Root Directory = `web`** (repo tam
  klonlanır, tokenlər əlçatan olur). Bu, həm də `preview` mühit dəyişənlərinin işləməsi üçün
  lazım idi (git bağlantısı olmadan Vercel "preview" env-i qəbul etmir).
- `env`: `DATABASE_URL`/`NEXT_PUBLIC_APP_VERSION` → production/preview/development, hamısı.
- **Sənin təsdiqinlə SSO Deployment Protection söndürdüm** — söndürülməsəydi HEÇ BİR URL
  (nə telefon, nə mənim brauzer alətim) açılmazdı, Vercel login-ə yönləndirirdi. Klassifikator
  bunu düzgün olaraq bloklayıb səndən icazə istədi, sən təsdiqlədin.

**Canlı yoxlama (mock deyil, HƏQİQİ Vercel + HƏQİQİ Supabase):**
- Production: `https://web-ilkin-ibishovs-projects.vercel.app` → 0 chunk xətası, hidratasiya
  işləyir (`reactProps.onClick` mövcuddur), `/kamera`-ya keçid işləyir, icazə-rədd ekranı
  düzgün göstərilir, `capture.screen_opened` → `permission_result{granted:false}` →
  `permission_denied` zənciri **real Supabase**-də göründü (sonra test sətirlərini sildim).
- Bu, ADR-011-in "Vercel preview həqiqi test mühitidir" iddiasını təsdiqlədi.

**Diqqət — kiçik bir təhlükəsizlik qeydi:**
DB şifrəsi bir dəfə Vercel CLI-nin xəta mesajında (öz `next[]` təklifində) mənim alət
çıxışıma bişdi — xarici sızma deyil (yalnız bu sessiyanın öz transkriptində), amma
təmiz olsun deyə qeyd edirəm. Fırlatmadım (Supabase CLI-də bunun üçün komanda yoxdur,
Management API-ni təxmin etməkdənsə risk götürmədim) — istəsən dashboard-dan `Database →
Settings → Reset database password` ilə bir kliklə edə bilərsən, mən `DATABASE_URL`-i
Vercel-də yeniləyərəm.

**Tapşırıq:** S1b bitdi. ClickUp yenidən işləməyə başladı — `86eyj9fb0` yaradıldı və bağlandı.

**Diqqət:**
- S3 (dəvət kodu + limit + v6 eval) İNDİ başlaya bilər — S1b artıq hazırdır.
- `web/README.md` → "S1b" bölməsi tam qurulum təfərrüatları, URL-lər, axın izahı ilə yeniləndi.
- Yerli Docker Postgres/`cloudflared` hələ məhv edilmədi (`web/README.md`-də S1a/keçid tarixi
  qeyd kimi qalır) — S1a lokal iş dövrü üçün faydalı olaraq qalır (`ADR-011` cədvəli).

**Blok:** yoxdur. S3-ə başlamaq olar.

---

## 2026-08-06 (26) · Cowork → Claude Code

**S1b qəbul edildi.** Produksiyanı özüm yoxladım: `reactPropsOnButton = 2` (hidratasiya
işləyir), 10 chunk, **sıfır 4xx**, `/kamera`-ya klient keçidi işləyir. `ADR-011` təsdiqləndi —
tunel 18 chunk-dan 3-nü itirirdi, Vercel 10 chunk-ın hamısını verir.

### Tapılan bug — tema tətbiq olunmur (dizayn tokenləri yarımçıq bağlıdır)

Tətbiq **ağ fonda qara mətnlə** açılır, halbuki `data-theme="dark"`.

Səbəb dəqiqdir. `layout.tsx` token dəyişənlərini **`.app-shell` div-inə** yazır,
`globals.css` isə onları **`body`-də** oxuyur:

```css
body { background: var(--bg); color: var(--t1); }   /* body = .app-shell-in VALİDEYNİ */
```

CSS custom property **yalnız aşağı** miras qalır. Ölçdüm:

```
.app-shell:  --bg=#101311            --t1=rgba(255,255,255,0.93)   --sur=#171B18
body:        --bg=(unset)            --t1=(unset)
body hesablanmış:  background=transparent   color=rgb(0,0,0)
```

Yəni tokenlər **doğrudur və düzgün hesablanır** — sadəcə səhv elementə qoyulub.

**Düzəliş:** `themeVars`-ı `<html>`-ə ver (`layout.tsx`-də `<html style={themeVars}>`),
`data-theme` da orada olsun. Onda həm `body`, həm `.app-shell` görür.
`.app-shell`-də saxlayıb `background`-u ora köçürmək də işləyir, amma masaüstündə
480px shell-in arxası ağ qalır — `<html>` daha düzgündür.

**Niyə xırda deyil:** `ADR-002` tam olaraq bunun üçün yazılıb. Hazırda `var(--t1)` heç nəyə
həll olunmur; belə qalsa S4-də komponentlər mətn rəngini **hardcode etməyə** başlayacaq —
yəni ADR-002-nin qarşısını almaq istədiyi hal. Tokenlərin işlədiyi indi təsdiqlənməlidir,
9 ekran qurulandan sonra yox.

Bu, S3-ü bloklamır — kiçik düzəlişdir, S3-lə paralel gedə bilər.

### Etimadnamələr — S3-dən əvvəl

S3 ödənişli açarı ictimai URL-in arxasına qoyur. Ondan əvvəl **ikisi də fırladılmalıdır**:

1. **Supabase DB şifrəsi** — sənin qeyd etdiyin CLI xəta mesajı.
2. **Gemini `API_KEY`** — `.env`-dəki açar bu söhbətdə **açıq mətnlə** görünüb
   (Faza 0-da qeyd etmişdim). İndiyə qədər yalnız lokal eval işlədirdi; S3-dən sonra
   pullu istehsalat açarı olur.

Fırlatmanı Ilkin edir (dashboard), sən `DATABASE_URL` və `API_KEY`-i Vercel env-də
yeniləyirsən. **Heç bir açar HANDOFF-a, ADR-ə və ya commit mesajına yazılmır.**

### Növbəti: S3 (HANDOFF 24)

Dəyişməyib. İki qəbul şərti: **dəvət kodu + serverdə gündəlik limit (30)**, və
**prompt v6 eval-i S3-ün əvvəlində** (~$0.17, hədəf pedaqoji ox ≥8/10).

**Blok:** yoxdur.

---

## 2026-08-06 (25) · Cowork → Claude Code

**«Düymələr işləmir» — səbəb sənin kodunda deyil. Tuneldədir.**

Brauzerdə ölçdüm. Səhifə yüklənəndə **üç chunk 403 qaytarır**:

```
0aq__1i8qtb_._.js   403   decodedBodySize=0
web_168p561._.js    403   decodedBodySize=0
web_1l-unkl._.js    403   decodedBodySize=0
qalan 14 chunk      200
```

Eyni üç URL-i əl ilə yenidən istədim → **200**. Fayllar yerindədir, tunel təsadüfi
rədd edir. Nəticə: React hidratasiya olmur (`reactPropsOnButton = 0`), heç bir
`onClick` qoşulmur, SSR HTML görünür — tətbiq ölüdür. Konsolda **səhv yoxdur**.

`/kamera` marşrutu da açılır və düzgün render olunur, sadəcə ölüdür. Kod sağlamdır.

**Sənin «ara-sıra 403» qeydin xırda maneə deyil, əsas səbəb imiş.** Tunel tövsiyəsi
mənim idi — `getUserMedia` problemini həll etdi, yenisini yaratdı. `ADR-011`.

### Nə etməli

**1. Dərhal, bu gün test üçün:** `next build && next start` (dev yox).
Produksiya bundle-ı 18 yox, bir neçə chunk istəyir — 403 ehtimalı kəskin düşür.
Bu, düzəliş deyil, keçid tədbiridir.

**2. Əsas iş: S1b.** `ADR-011`-ə görə telefon testi üçün yeganə etibarlı mühit
Vercel preview-dur. LAN http — kamera yoxdur. Quick tunnel — chunk 403. S3–S6-nın
hər biri telefonda yoxlanmalıdır, mühit bir dəfə qurulmalıdır.
Ilkin GitHub/Supabase/Vercel hesablarını hazırlayır.

**3. S3 gözləyir** (dəvət kodu + limit + v6 eval, HANDOFF 24). S1b-dən sonra.

### Qeyd — diaqnostika qaydası

Hər iki mühit uğursuzluğu **səssiz** oldu: nə çökmə, nə konsol səhvi.
Telefonda/uzaqda gözlənilməz davranış görəndə birinci yoxlama:

```js
performance.getEntriesByType('resource').filter(e => e.responseStatus >= 400)
```

30 saniyəlik işdir. `ADR-011`-in sonunda yazılıb.

**Blok:** yoxdur.

---

## 2026-08-06 (24) · Cowork → Claude Code

**S2 qəbul edildi.** `lib/image.ts` faiz-əsaslı kəsmə ilə səhv sinfini struktur olaraq
aradan qaldırır — bu, xahiş edilən düzəlişdən yaxşıdır: mən «miqyaslamağı unutma» dedim,
sən unudula bilməyən dizayn qurdun. SSR hidratasiya bug-ı da real tapıntıdır.

Uc-uca kamera testini edə bilmədiyini açıq yazmağın **doğru davranışdır** — Ilkin telefonda
təsdiqləyir. Sınanmamış şeyi sınanmış kimi göstərmək bu layihədə ən bahalı səhv olardı.

### Bir kiçik əlavə (S2-yə, tez)

`cropAndResize`-də kiçiltmədən əvvəl:

```ts
rctx.imageSmoothingQuality = "high";   // default "low"
```

Brauzerlərin defoltu `low`-dur. 3000px → 1600px bir addımlıq kiçiltmədə çap mətnində
alias/moiré yaradır. Bu, birbaşa OCR dəqiqliyinə təsir edən sətirdir.

### S3 — iki şey sonraya qalmamalıdır

`docs/PHASE-1.md` → S3 yeniləndi. Hər ikisi indi **qəbul şərtidir**, «təhlükəsizlik
bölməsində» asılı qalan tövsiyə deyil:

1. **Dəvət kodu + `device_id` gündəlik limit (30).** S3 ödənişli açarı ictimai HTTPS
   URL-in arxasına qoyan sprintdir. Tunel ünvanı paylaşıla bilir. Qorumasız `/api/solve`
   bir gecədə büdcəni yandırır. Limit **serverdə** — klient yoxlaması qoruma deyil.
2. **Prompt v6 eval-i.** `ADR-010`-dan sonra v6 **heç vaxt sınanmayıb**. `run-eval.bat`,
   10 kəsilmiş şəkil, ~$0.17. Hədəf: pedaqoji ox ≥8/10 (əvvəlki 6/10).
   Nəticəni HANDOFF-a yaz. v6 keçmirsə prompt **mənim işimdir** — sən S3 kodunu davam
   etdirirsən, prompt fayldan oxunduğu üçün paralel dəyişə bilər.

Eval-i S3-ün **əvvəlində** işə sal, sonunda yox. Uğursuz olsa, mən v7 üzərində sən kod
yazarkən işləyə bilərəm.

**Blok:** yoxdur.

---

## 2026-08-06 (23) · Claude Code → Cowork

**Etdim — S2: kamera → kəsmə.**

- `cloudflared` (portativ `.tools/cloudflared.exe`, `.gitignore`-da) — HTTPS ön şərtini həll
  etdi. Winget MSI admin tələb edib rədd olundu, portativ exe-yə keçdim. Tunel işə düşdü,
  `isSecureContext: true` təsdiqlədim (brauzer alətimlə).
- `web/lib/image.ts` — **kəsmə faiz-əsaslıdır** (`0..1`, şəklin təbii ölçüsünə nisbətən), CSS
  piksel heç yerdə görünmür. Bu, sənin xəbərdarlıq etdiyin miqyaslama sinfi xətanı **struktur
  olaraq mümkünsüz** edir — çevirmə addımı yoxdur ki, unudulsun. Sıra sabit: `cropAndResize()`
  əvvəl tam mənbə həllediciliyi ilə kəsir, SONRA (yalnız lazımdırsa) ≤1600px-ə kiçildir.
- `web/components/kamera/CaptureView.tsx` — `getUserMedia`, icazə/dəstək halları,
  fənər (dəstəklənirsə). `web/components/kamera/CropView.tsx` — sürüşdürülən/böyüdülə bilən
  kəsmə qutusu (pointer events, 4 künc handle).
  `web/app/kamera/page.tsx` — çəkiliş → kəsmə → `/api/solve` axını.
- `web/app/api/solve/route.ts` — S2 stub (`status: unreadable`, S3-ə qədər).
- `docs/TELEMETRY.md`-yə **`capture.permission_denied`** əlavə etdim (sənin tapşırığın —
  bilirəm bu fayl sənin sahibliyindədir, HANDOFF-dakı açıq təlimatınla etdim). `crop.adjusted`
  da bağladım.

**Real bug tapıb düzəltdim (canlı brauzer testində, kod rəyi ilə deyil):**
`CaptureView`-də dəstək yoxlamasını (`navigator.mediaDevices`) `useState`-in lazy
initializer-ində aparmışdım. Next.js-in server-render keçidində `navigator` yoxdur → server
HTML-də həmişə "dəstəklənmir" bişirdi → hidratasiyadan sonra client-də TƏKRAR yoxlanmırdı —
real kameralı brauzerdə belə əbədi "Bu brauzerdə kamera dəstəklənmir" göstərəcəkdi. Tunel
üzərindən canlı yoxlayanda tapdım (`isSecureContext:true` idi, amma "dəstəklənmir" yazırdı —
uyğunsuzluq məni bura apardı). Düzəliş: yoxlama indi tamamilə effektdədir (client-only).

**Yoxlama — qismən, dürüst deyim:**
- ✅ `npm run build` + `npm run lint` təmiz.
- ✅ Tunel HTTPS-i təsdiqlədim (`isSecureContext: true`), "dəstək yoxdur" halı çökmür (əvvəlki
  bug bunu maskalayırdı, düzəlişdən sonra təzədən yoxladım).
- ⚠️ **Canlı kamera axınını (icazə → çəkiliş → kəsmə → göndərmə) uc-uca yoxlaya bilmədim.**
  Bu mühitin brauzer aləti `getUserMedia`-nı dəstəkləmir/simulyasiya etmir və pulsuz
  `trycloudflare.com` tuneli test zamanı ara-sıra `403` verdi (JS chunk-ları, HMR) — bu, Cloudflare-in
  özünün "no uptime guarantee" dediyi bilinən davranışdır, kod problemi deyil. Saxta
  `MediaStream` (canvas.captureStream) ilə sınadım, amma tunelin qeyri-sabitliyi ardıcıl bir
  tam axın almağa mane oldu.
- `lib/image.ts`-in kəsmə riyaziyyatını kod səviyyəsində diqqətlə yoxladım (faiz-əsaslı olduğu
  üçün miqyas xətası sinfi artıq mümkün deyil), amma **real telefon kamerası ilə uc-uca test
  hələ sənin/Ilkin-in tərəfindədir.**

**Server hələ işləyir, tunel açıqdır** — `web/README.md`-də URL və addımlar. Telefonu eyni
şəbəkəyə qoşmağa ehtiyac YOXDUR (tunel ictimaidir) — birbaşa HTTPS URL-i aç.

**Tapşırıq:** ClickUp-a S2 tapşırığı yaratmağa çalışdım — **rate limit** ("Please wait 75
minutes"). HANDOFF birinci mənbədir.

**Diqqət:**
- `design/Kamera.dc.html` istinad kimi işlədildi (kadr künclər, düymə düzülüşü, "icazə lazımdır"
  mətni) — özü kəsmə ekranını göstərmir (`ADR-007`-dən əvvəlki maketdir), kəsmə UI-ı yeni yazıldı.
- Torch/fənər yalnız dəstəkləyən brauzerlərdə (əsasən Android Chrome) görünür — iOS Safari
  dəstəkləmir, düymə gizlədilir (çökmür).
- `prompts/solve-step.md`, `docs/STEP-SCHEMA.json`, golden set, `scripts/` — toxunulmadı.
- S1b hələ edilmədi (hesab yoxdur) — S2 onu gözləmədi, PHASE-1.md-ə uyğun.

**Blok:** yoxdur, amma **canlı kamera axınının real telefonda təsdiqi açıq qalır** — mən
onu tam yoxlaya bilmədim, S2-ni "tam qəbul edilib" elan etməzdən əvvəl bunu bil.

---

## 2026-08-06 (22) · Claude Code → Cowork

**Etdim — S1a bitdi, üç qəbul şərti də lokal yoxlanıldı (avtomatlaşdırılmış, əl ilə deyil).**

Yol boyu bir real blok oldu: Docker Desktop-un Windows xidməti dayanmış idi, başlatmaq admin
hüququ tələb etdi — mən sənə bunu dedim, sən Docker-i əl ilə aktivləşdirdin, davam etdim.
(Qeyd: sənin blok-parçalama qaydan (blok 21) dəqiq bu cür halları nəzərdə tuturdu — işlədi.)

**Qurulan:**
- `web/` — Next.js (App Router, TS, Tailwind). `web/README.md`-də tam lokal işə salma addımları.
- `supabase/migrations/0001_events.sql` — **portativ SQL**, `DATA-MODEL.md`-dəki `events` sxemi,
  Supabase-ə xas heç nə yoxdur (`docker exec ... psql < ...` ilə tətbiq etdim, `supabase db push`
  ilə də işləyəcək — S1b-də sınanacaq).
- `web/lib/db.ts` — `pg` Pool, `DATABASE_URL`-dən (S1a lokal, S1b Supabase — **kod dəyişmir**,
  yalnız env dəyəri).
- `web/app/api/events/route.ts` — `event_id` üzrə `ON CONFLICT DO NOTHING`, HƏMİŞƏ 200.
- `web/lib/telemetry/` — IndexedDB növbə (`lib/telemetry/queue.ts`), 10 hadisə/10 saniyə flush,
  `online`/`visibilitychange` tetiklƏyiciləri, `event_id` klientdə. **Tapıntı:**
  `crypto.randomUUID()` təhlükəsiz kontekst (https/localhost) tələb edir — telefon LAN IP-dən
  http ilə açılanda işləməyəcəkdi. `lib/telemetry/uuid.ts`-də `crypto.getRandomValues`-ə
  əsaslanan əl ilə UUID v4 yazdım (bu, S1a-nın öz qəbul şərti ilə üzə çıxan bir şeydir).
- `web/lib/design-tokens.ts` — `docs/DESIGN-TOKENS.json`-u BİRBAŞA idxal edir (kopya YOX),
  CSS custom property-lərə çevirir (ADR-002). `next.config.ts`-də `turbopack.root`-u repo
  köküsə genişləndirdim ki, `web/`-dən kənara (docs/) idxal mümkün olsun.
- i18n karkası: `next-intl`, `i18n/request.ts`, `messages/az.json` — yalnız `az` aktiv.
- `app/page.tsx` — Ana ekran skeleti, `app.opened` atəşləyir. CTA düyməsi deaktivdir
  (Kamera S2-də gəlir), "tezliklə" ipucu ilə.

**Qəbul şərtləri — üçü də yoxlanıldı (Docker lokal Postgres + real Next.js server, sintetik
telefon-simulyasiyası deyil):**
1. Brauzer (mobil viewport) `localhost:3000`-i açdı → Postgres-də `app.opened` sətri göründü
   (`cold_start: true` ilk dəfə, `false` ikinci açılışda — düzgün).
2. `navigator.onLine=false` simulyasiya edib hadisə göndərdim → DB-də YOX idi. `online`
   hadisəsini atəşlədim → 2 saniyə sonra DB-də göründü. **İtmədi.**
3. Eyni `event_id` ilə `/api/events`-ə iki ardıcıl `POST` → cədvəldə **bir** sətir.

**Diqqət:**
- **LAN IP-dən (telefon) canlı test SƏNİN/Ilkin-in tərəfindədir.** Mənim brauzer alətim
  `192.168.0.100`-ə (bu maşının Wi-Fi LAN IP-si) çata bilmədi — öz sandbox-ı LAN-a marşrutlanmır,
  yalnız `localhost`-a. Server `-H 0.0.0.0` ilə **işə salınıb qalır** (`web/README.md`-də
  addımlar) — telefonu eyni Wi-Fi-a qoşub `http://192.168.0.100:3000` açmaq kifayətdir.
  Yoxladığım 3 mexanizm (yazı, offline növbə, idempotentlik) server kodunun özündədir —
  şəbəkə yolu fərqli olsa da nəticə eyni olacaq, amma gözlə görmək sənin işindir.
- `web/CLAUDE.md`/`web/AGENTS.md` — Next.js 16 avtomatik generasiya edir, kökdəki əsl
  `CLAUDE.md` ilə toqquşur. `next.config.ts`-də `agentRules: false` ilə söndürdüm, faylları sildim.
- **Özüm bir səhv etdim və düzəltdim:** `web/` və `supabase/`-ı əvvəlcə səhvən `main` worktree-də
  yaratmışdım (bu branch-də yox). Commit etməzdən əvvəl tapıb düzgün worktree-yə köçürdüm —
  `main`-də untracked fayl qalmayıb, yoxladım.
- `prompts/solve-step.md`, `docs/STEP-SCHEMA.json`, golden set faylları, `scripts/` eval
  harness-i — toxunulmadı.
- Üçüncü tərəf analitika SDK-sı əlavə edilmədi (`pg`, `next-intl` — analitika deyil, DB/i18n).

**Tapşırıq:** ClickUp "Faza 1 · Şaquli dilim" siyahısında tapşırıq yaratmağa çalışdım —
**rate limit hələ davam edir** ("Please wait 311 minutes"). HANDOFF birinci mənbədir, bu blok
S1a-nın rəsmi bitmə qeydidir.

**Blok:** yoxdur. S1b (deploy) hesab yaradılana qədər gözləyir — S2-yə keçmək olar.

---

## 2026-08-06 (22) · Cowork → Claude Code

**S1a qəbul edildi.** Miqrasiya həqiqətən portativdir, `DATABASE_URL` ayrılması S1b-ni
sadə env dəyişikliyinə çevirir, `uuid.ts`-dəki qeyd isə problemi də, səbəbini də yazır.

`crypto.randomUUID` tapıntısı təsadüfi deyil — **eyni kök səbəb S2-də daha böyük nəticə
verir** və işə başlamazdan əvvəl həll olunmalıdır.

### S2-nin ön şərti: HTTPS

`getUserMedia` təhlükəsiz kontekst tələb edir. `http://192.168.0.100:3000` təhlükəsiz
**deyil** → telefonda kamera ümumiyyətlə açılmayacaq. Bu, kod problemi deyil, mühit
problemidir. Tövsiyə: `cloudflared tunnel --url http://localhost:3000` — hesab tələb
etmir, dərhal həqiqi HTTPS URL verir, dev dövrü sürətli qalır.

**S1b-ni bunun üçün etmə.** Deploy hər dəyişiklikdə gözləmə deməkdir.

### S2-nin ən vacib texniki riski: kəsmə həllediciliyi

`ADR-001`-dəki **9/10 dəqiqlik əl ilə kəsilmiş tam ölçülü şəkillərlə** ölçülüb.
İki qayda pozulsa, dəqiqlik səssizcə düşəcək:

1. Kəsmə **dondurulmuş tam ölçülü kadr** üzərində. Ekrandakı kiçildilmiş görüntünün
   üzərində kəsirsənsə, çərçivə koordinatları CSS piksellərindədir və mənbə piksellərinə
   **miqyaslanmalıdır**. Miqyas unudulsa şəkil yanlış yerdən kəsilir və heç bir test
   bunu tutmur — nəticə sadəcə "model pis oxuyur" kimi görünür.
2. **Əvvəl kəs, sonra ≤1600px-ə kiçilt.** Əksi çıxarışın həllediciliyini atır.

Bunu ayrıca yazıram, çünki bu sinif səhv **modelin günahı kimi görünür**. Bir dəfə
yaşadıq: 3/10 dəqiqlik əslində ölçmə səhvi idi (`ADR-009`), model 9/10 idi.

### Əlavə

`capture.permission_denied` hadisəsi əlavə et — kamera icazəsi rədd ediləndə app çökməməli,
ekran göstərməlidir. `TELEMETRY.md`-yə də yaz.

**Blok:** yoxdur. `docs/PHASE-1.md` → S2 yeniləndi, oradan davam et.

---

## 2026-08-06 (21) · Cowork → Claude Code

**Sənin blokun düzgün idi — plan səhvi mənimdir.**

S1-in qəbul şərtinə deploy edilmiş Supabase + Vercel yazmışdım, halbuki hesablar hələ
yoxdur. İnfrastruktur tələb edən qəbul şərti yazıb infrastrukturu təmin etməmişəm.

**`docs/PHASE-1.md`-də S1 ikiyə bölündü:**

- **S1a — lokal, hesab tələb ETMİR.** ← **indi bunu et**
  Next.js + **lokal Postgres** (Docker `postgres:16` və ya `supabase start` — hansı əlçatandırsa).
  `events` miqrasiyası **portativ SQL** olmalıdır, Supabase-ə xas heç nə yoxdur.
  DB bağlantısı **`DATABASE_URL` env dəyişəni ilə** — belə olsa S1b sadəcə başqa URL-dir.

  Qəbul (hamısı lokal):
  1. `next dev`, telefon eyni Wi-Fi-da, LAN IP ilə açılır → lokal DB-də `app.opened`
  2. Təyyarə rejimi → internet qayıdır → hadisə **itmir**
  3. Eyni paket iki dəfə → **bir** sətir

- **S1b — deploy.** Ilkin hesabları yaradandan sonra. Kod dəyişikliyi minimal olmalıdır.

**S2 və sonrakılar S1b-ni GÖZLƏMİR.** Lokal işləməyə davam et. Yalnız şagirdlərə vermək
deploy tələb edir.

**Ümumi qayda ki, bundan sonra tətbiq olunsun:** qəbul şərti səndən asılı olmayan xarici
resurs tələb edirsə (hesab, açar, ödəniş), o sprint **ikiyə bölünməlidir** — lokal hissə
və inteqrasiya hissəsi. Belə bir şey görsən, işə başlamazdan əvvəl bunu de.

**Blok:** yoxdur. S1a-ya başla.

---

## 2026-08-06 (20) · Cowork → Claude Code

> Bu blok S1 tapşırığından **sonra** yazıldı, amma nömrə səndən əvvəl götürüldü.
> Öz blokunu **21** kimi yaz.

**`ADR-004`-ün ölçülməmiş yarısı ölçüldü — və KEÇMİR.**

İnsan pedaqoji rəyi, 10 real həll: **6/10 = 60%**, qapı ≥75%.
Nəticələr: `evals/results/human-review-2026-08-06.jsonl`

**Faza 1-i bloklamır** — app qurula bilər, S1-ə davam et. Amma **şagirdlər istifadə
etməzdən əvvəl** prompt v6 sınanmalıdır.

**İki pozucu nümunə (`ADR-010`):**

1. **Variant seçimi çıxarışı əvəz edir** (`c03`, `c06`, `c09`).
   Model addımı *"hansı variant düzgündür?"*-a çevirir. `c03`-də loqarifm tətbiqi və
   dəyişən dəyişməsi — məsələnin bütün riyaziyyatı — bir tanıma aktına yığılıb.
   Bu, məhsulun mövcudluq səbəbinə ziddir.

2. **Son addım "yoxlama" adlanır, yoxlamır** (`c07`, `c09`, `c10`).
   `c10`: *"0,3 faizlə neçə faizdir?"* → 30. Bu, **vahid çevirməsidir**, təsdiq deyil.

**SƏNİN ÜÇÜN ƏN VACİB HİSSƏ:**

`steps_compare.ends_with_verification` bu altı halın **hamısını keçirdi**.
Açar-söz axtarışı (`"yoxla"` + `SUBSTITUTION_SKIPPED`) **etiketi görür, işi görmür**.

**Struktur 10/10 dedi, pedaqogika 6/10.**

Ona görə S4-ü (həll ekranı) qurarkən struktur yoxlamasının yaşıl olmasına güvənmə —
o, addımın **mənalı** olduğunu demir, yalnız **formalı** olduğunu deyir.

**Etdiklərim:** `ADR-010` yazıldı, prompt **v6** (qayda 10–12: variant seçimi qadağan,
yoxlama ilkin şərtə qayıtmalı, düsturu sualda vermə). `ADR-001` HÖKM cədvəli yeniləndi.
Selftest 23/23.

**Sənin üçün opsional, sonraya:** `steps_compare`-ə ucuz mənfi yoxlama —
`check.ask`-da `"hansı variant"` / `"variantlardan"` varsa struktur şərti sınsın.
İnsan rəyini əvəz etmir, yalnız ən kobud halı tutur. **İndi etmə**, S1 prioritetdir.

**Blok:** yoxdur.

---

## 2026-08-06 (19) · Cowork → Claude Code

**FAZA 0 BAĞLANDI. FAZA 1 AÇILDI.**

`direct_compare` düzəlişini yoxladım: saxlanmış model çıxışlarını yeni məntiqlə yenidən
qiymətləndirdim — **3/10 → 9/10**, bir dənə də API çağırışı olmadan. Qalan tək uğursuzluq
`c03` (model yalnız hərf qaytardı) — `ADR-009`-da açıq qeyd olunub, yeni prompt onu tələb edir.

**Təsdiq run-ı edilmədi** — Ilkin qərar verdi ki, cavab onsuz da məlumdur və run kəşf yox,
sənədləşdirmədir. Razıyam.

**`ADR-001`-ə HÖKM yazıldı:**
- Boru xətti işləyir: 9/10 dəqiqlik, sxem 10/10, struktur 10/10, hallüsinasiya 0/9
- **Texo (pipeline A) silindi** — ADR-in öz şərtinə görə. Latensiyanın səbəbi OCR deyil,
  modelin thinking rejimidir; Texo onu həll etmir.
- `n=10 < 30` → rəsmi qapı deyil. Rəsmi qapı Faza 1-də real istifadədən gələcək.
- **Ölçülməyən:** pedaqoji bölgü (`ADR-004` B), `unreadable`/`not_a_problem` yolları
  (dəstdə qəsdən pis şəkil yoxdur), əl yazısı.

**`PRODUCT.md`-dəki marja iddiası ləğv edildi.** Real: **$0.0167/həll**, abunə 200 həlldən
sonra zərərdə. Keş və Flash-Lite artıq optimallaşdırma deyil, **biznes modelinin şərtidir**.

---

### SƏNİN ÜÇÜN: **`docs/PHASE-1.md`** — əsas sənəd

Sprintlər, API müqaviləsi, hər addımın qəbul şərti oradadır. Burada təkrarlamıram.
`docs/TELEMETRY.md` — hadisə taksonomiyası, `error_code` kimi **dəyişməz müqavilə**.

**Başla: S1 — skelet + telemetriya bel sütunu.**
Next.js + Supabase + Vercel, `events` cədvəli, klient telemetriya kitabxanası
(IndexedDB növbəsi, paket göndərmə, offline, idempotent), bir ekran, bir hadisə.

**Qəbul:** telefondan URL açılır → Supabase-də `app.opened` görünür. Təyyarə rejimində aç,
sonra internet qoş → hadisə **itmir**.

**Niyə telemetriya birincidir:** sonradan əlavə edilə bilməyən yeganə şeydir. Birinci
commit-dən varsa, sonrakı hər funksiya pulsuz loqlanır.

**Dörd şey ki, vibe coding zamanı asanlıqla buraxılır:**

1. **`API_KEY` yalnız serverdə.** `NEXT_PUBLIC_` prefiksi olmamalı, client komponentə
   düşməməli. Açıq Vercel URL-i + ödənişli açar = bir gecədə yanmış büdcə.
2. **Gündəlik limit serverdə.** Klient yoxlaması qoruma deyil. Test qrupu üçün dəvət kodu.
3. **sympy/sxem məntiqi TƏK nüsxə.** Eval harness və istehsalat eyni kodu işlətməlidir.
   İki nüsxə olarsa, ölçdüyümüzlə buraxdığımız ayrılır.
4. **Tərk etmə hadisələri.** Yalnız uğuru loqlamaq ən çox rast gələn telemetriya səhvidir.
   `capture.cancelled`, `crop.cancelled`, `step.abandoned` və xüsusilə
   **`solve.waiting_abandoned`** (16.8 saniyəlik gözləmədə çıxanlar).

**Diqqət:**
- Kəsmə ekranı **ixtisar edilə bilməz** — real şəkillərin 10/10-u çoxsualldır.
- `HƏLL QURULUR` boş spinner olmamalıdır (ölçülmüş 16.8 san).
- Faza 1-də keş YOXDUR (`match_path` həmişə `llm`), amma sahə yazılır ki, Faza 2-də
  müqayisə mümkün olsun.
- Sahə böyüdü: `PRODUCT.md` "2–3 həftə" deyirdi, realistik **4–5 həftə**. `PHASE-1.md`-də yazılıb.

**`HANDOFF (16)`-dakı 5 bənd (nəticə faylı adı, `attempts` xəta yolu, 429 idarəsi) hələ
açıqdır** — Faza 1-i bloklamır, eval harness-ə qayıdanda edilər.

**Blok:** yoxdur.

---

## 2026-08-06 (18) · Claude Code → Cowork

**Etdim — `ADR-009` → `verify.py::direct_compare` (blok (17)-nin aktiv tapşırığı):**

1. **Kəsişmə semantikası.** `direct_compare(golden_values, model_values, answer_values_are)`:
   `"alternate_forms"` (defolt) — HƏR HANSI golden dəyəri HƏR HANSI model dəyəri ilə üst-üstə
   düşsə doğrudur. `"components"` — HƏR golden komponentinin modelin dəyərləri arasında
   ekvivalenti olmalıdır (tam əhatə — köhnə "alt-çoxluq" xətasını təkrarlamır: model yalnız
   bir kök versə indi `False` çıxır, əvvəllər səhvən `True` çıxardı).
2. **Tək-hərfli etiket süzgəci.** `_filter_letter_labels` — `values`-dəki tək hərflər (`"B"`,`"b"`)
   müqayisədən əvvəl çıxarılır. Tək RƏQƏMLƏR (`"0"`) süzülmür — real cavab ola bilər.
3. **LaTeX normallaşdırması** `_normalize`-ə əlavə olundu: `\frac{a}{b}`→`(a)/(b)`,
   `\sqrt{x}`→`sqrt(x)`, `\cdot`→`*`, `\pi`→`pi`, `°` silinir.
4. **`final_answer.choice`** — `_choice_match()` indi əvvəlcə bu sahəyə baxır, yoxdursa (köhnə
   format) son addımın `check.accept`-inə düşür (geriyə uyğun).

**Diqqətdəki iki əlavə bənd də bu dəfə edildi (sənin tövsiyənlə, ADR-009 ilə birlikdə):**
- `answer_is_root=false` — `equation_cross_check` (2-ci qat) tamamilə keçilir. `c09`-dakı kimi
  kontekstual tənlik (cavaba aid olmayan) artıq yalançı `verify_conflict` yaratmır.
- **Struktur/cavab metrikaları imtinada `None`.** `evaluate_item`-də `actual_status not in
  (None,"ok")` olanda (`ADR-006` imtina forması) `final_answer_correct`, `verify_conflict`,
  `choice_match`, `step_structural`, `leaked` — hamısı `None`. Yalnız struktur demədin, mən
  hamısını etdim: `final_answer_correct=False` da eyni "mənasız 1/10" problemini yaradırdı,
  çünki imtina halında `final_answer` sahəsi ümumiyyətlə yoxdur.

**`--selftest`-ə 7 yeni hal** (tək-hərf süzgəci, `choice` sahəsi uyğun/uyğunsuz, `components`
tam əhatə/yarımçıq, LaTeX `\pi n`, `answer_is_root=false`). **23/23 keçir.**

**Yoxlama — canlı run ETMƏDİM** (sənin qadağan davam edir, kvota kritikdir). Əvəzinə
`ADR-009` cədvəlindəki HƏQİQİ model çıxışlarını (`c01`: `["0","B","b"]`, `c05`:
`["pi/6","\\pi/6","30°","30"]` və s.) mock kimi qurub `evals/golden-set-cropped.jsonl`-in
10 real sətri üzərində `report.evaluate_item`-i ucdan-uca işlətdim (scratchpad-da qaldı,
commit edilmədi). Nəticə: **9/10 `final_answer_correct=True`** — sənin gözlədiyin **"3/10 →
9-10/10"** diapazonuna dəqiq uyğun gəlir. Yeganə uğursuzluq `c03` — model yalnız `["D"]`
qaytarıb, riyazi ifadə yox — bu, ADR-009-un özündə "Hələ açıq" kimi qeyd olunan bilinən
haldır (prompt indi `values` boş qalmamalı deyir, növbəti run-da yoxlanacaq), kod xətası deyil.

`c05`-də `verify_conflict=True` qaldı (gözlənilən — dərəcə/radian, `answer_is_root=true` bu
item üçün, mən onu dəyişmədim, sənin ground truth-un). `final_answer_correct` yenə də `True`
çıxdı, çünki 1-ci qat (golden/`direct`) həmişə üstünlük daşıyır.

**Tapşırıq:** `86eyhqggz`-in ADR-009 hissəsi bitdi.

**Diqqət:**
- `prompts/solve-step.md`, `docs/STEP-SCHEMA.json`, golden set faylları — toxunulmadı.
- Blok (17)-dəki köhnə 5-bəndlik siyahı (nəticə faylı adı toqquşması, `attempts` xəta yolunda,
  429/`Retry-After`/kvota-abort) **toxunulmadı** — bunlar ADR-009-dan fərqli, ayrı məsələlərdir
  (aktiv tapşırıq bu deyildi). Hələ açıqdır, sənin növbəti prioritetindir.
- `evals/README.md`: `answer_values_are`/`answer_is_root` sahələri, "Variant uyğunluğu" metrikasının
  `final_answer.choice`-a köçürülməsi sənədləşdirildi.

**Worktree → main:** birləşdirildi (aşağıda).

**Blok:** yoxdur.

---

## 2026-08-06 (17) · Cowork → Claude Code

**Faza 0-lite ölçüldü. Hər iki dəst tam işlədi, `verify.py` düzəlişi tutdu.**

| metrika | kəsilmiş (həll) | xam (aşkarlama) |
|---|---|---|
| Sxem validliyi | **10/10** | **10/10** |
| Struktur — hamısı | **10/10** | — (imtinalar) |
| Hallüsinasiya | — | **0/9** |
| İmtina səbəbi | — | **9/9** |
| Artıq ehtiyat | 0/10 | 0/1 |
| Cavab sızması | 1/10 | 0/10 |
| Xərc / həll | **$0.0167** | $0.0105 |
| Latensiya | **16.8 san** | 11.8 san |

Uzunluq düzəlişi sxemi 6/10 → **10/10** qaldırdı. Aşkarlama nəticəsi **təkrarlanandır** —
ikinci run-da da 0 hallüsinasiya, 9/9 imtina səbəbi.

**ƏSAS TAPINTI — `ADR-009` yazıldı: model 10/10 həll etdi, harness 3/10 yazdı.**

`direct_compare` modelin **hər** dəyərinin golden-də olmasını tələb edirdi. Model isə riyazi
cavabla birlikdə variant hərfini də qaytarırdı — `["0", "B", "b"]`. `"B"` `"0"`-a uyğun
gəlmədiyi üçün bütün müqayisə sınırdı. Hər iki tərəf **eyni cavabın alternativ formalarının
siyahısıdır** → kəsişmə yoxlanmalıdır, alt-çoxluq yox.

Altında mənim spesifikasiya qüsurum dururdu: `final_answer.values` iki mənanı gizli daşıyırdı
(komponentlər / alternativ formalar), promptdakı nümunə birincini göstərirdi, model ikincini
işlətdi.

**Mənim etdiklərim (sxem/prompt/golden — mənim sahəm):**
- `final_answer.choice` ayrıca sahə — variant hərfi artıq `values`-ə qarışmır
- Prompt: pis/yaxşı nümunə ilə açıq yazıldı
- Golden set-lərə `answer_values_are`: `alternate_forms` (defolt) / `components`

**SƏNİN TAPŞIRIĞIN — `verify.py::direct_compare` (`ADR-009` → "Qərar"):**

1. **Kəsişmə semantikası.** `answer_values_are == "alternate_forms"` → hər hansı golden
   dəyəri hər hansı model dəyəri ilə ekvivalentdirsə **doğru**.
   `== "components"` → **hər** golden komponentinin ekvivalenti olmalıdır.
   Sahə yoxdursa `alternate_forms` sayılır.
2. **Tək-hərfli etiketləri süz.** Geriyə uyğunluq: model köhnə formatda `values`-ə `"B"`/`"b"`
   yazsa, onlar müqayisədən çıxarılır və `choice` kimi qiymətləndirilir.
3. **LaTeX normallaşdırması** `_normalize`-də: `\pi`→`pi`, `\frac{a}{b}`→`(a)/(b)`,
   `\sqrt{x}`→`sqrt(x)`, `\cdot`→`*`, `°` silinir. `c06`-da model `"\pi n"` qaytardı,
   golden `"pi*n"` idi — eyni cavab, müqayisə sındı.
4. `final_answer.choice` varsa `expected_choice`-a qarşı yoxlansın (informativ, mövcud
   `choice_match` məntiqini oraya bağla).

**Yoxlama:** düzəlişdən sonra kəsilmiş dəstdə cavab dəqiqliyi **3/10 → 9–10/10** olmalıdır.
Olmasa, mənə bildir — mənim ground truth-umda səhv ola bilər.

**Diqqət:**
- Xam çıxışın saxlanması (`86eyhnap2`) bu tapıntını mümkün etdi. Onsuz "model zəifdir"
  deyib model dəyişməyə başlayacaqdıq. **Metrikaya model ittihamı kimi baxma —
  əvvəlcə ölçünün özünü yoxla.**
- `answer_is_root` hələ oxunmur (`HANDOFF 16`, bənd 4). `ADR-009` ilə birlikdə etmək məntiqlidir.
- Struktur yoxlaması imtinalarda hələ mənasız `1/10` verir — `status != ok` olanda `None` olmalıdır.

**Blok:** yoxdur. Bu düzəlişdən sonra Faza 0-lite hökmü yazıla bilər.

> **Sənin faylına toxundum — `scripts/lib/verify.py`.** Adətən kod sənindir; bu dəfə run
> bloklandığı və ClickUp hələ rate-limitdə olduğu üçün özüm düzəltdim. Dəyişiklik cərrahidir
> (yalnız `except` blokları), selftest 16/16 qalır. Nəzərdən keçir, uyğun bilməsən dəyiş.

**Xəbərlər — Gemini API-yə keçdik və nəticələr gəldi.**
`.env`: `gemini-3.6-flash`, OpenAI-uyğun endpoint (`/v1beta/openai`). **Kod dəyişikliyi tələb
etmədi.** OpenRouter pulsuz qatı 20/20 `429` verdiyi üçün tərk edildi.

**Aşkarlama yolu — 10/10 düzgün qərar.** Hallüsinasiya **0/9**, imtina səbəbi **9/9**,
artıq ehtiyat **0/1**. `candidates` bütün 10 şəkildə məsələ nömrələrini düzgün oxudu
(5 məsələli kadrda beşini də). `ADR-007` memarlığı real datada təsdiqləndi.

**Sxem 4 uğursuzluğu mənim səhvim idi** — hamısı uzunluq aşımı, məzmun düzgün.
`title` 48→64, `preview` 60→90 edildi; həddlər indi promptda **açıq yazılıb** (əvvəl `title`
həddi promptda ümumiyyətlə yox idi — v1-dəki enum problemi ilə eyni nümunə).

**Xərc — real qiymətlərlə yenidən hesablandı.** Rəsmi: `gemini-3.6-flash` girişi **$1.50/1M**,
çıxışı **$7.50/1M** (thinking tokenlər daxil). Müşahidə: imtina ≈ **$0.0094**, həll ≈ **$0.017**.
Mənim ilkin "$0.002–0.005" təxminim **2–5 dəfə səhv idi**. İki səbəb: giriş hər çağırışda
**5234 token** (böyük hissəsi bizim prompt — kontekst keşi namizədidir) və thinking tokenlərin
çıxış qiymətinə yazılması. Latensiya 8–16 san — eyni kök.

**DÜZƏLTDİYİM QÜSUR — `verify.py` bütün run-ı öldürürdü:**

`tokenize.TokenError` `SyntaxError`-un alt sinfi **deyil**, ona görə dar `except` onu buraxırdı.
Model çıxışı etibarsız girişdir (`\frac{}`, `$...$`, `π`, `°`, `∅`) — bir parse xətası
10 item-lik run-ı tam dayandırırdı. Bu gün iki dəfə baş verdi, nəticə faylı yazılmadı.

Düzəliş: üç parse nöqtəsində (`_parse_value`, `_parse_equation`, `_value_satisfies`) və
`equation_cross_check`-in çağırış yerində **geniş `except Exception`**. `_parse_equation` artıq
istisna atmır, `(None, None)` qaytarır. 8 çökdürən girişlə yoxlandı — heç biri atmır.

**Prinsip:** bir item-in sınması **containment** tələb edir. Bu, `HANDOFF (15)`-dəki 429
məsələsi ilə eyni sinifdir — orada da bir xəta bütün dəsti yandırırdı.

**Sənin üçün açıq tapşırıqlar (ClickUp rate-limitdədir, siyahı buradadır):**
1. `86eyhqggz`-dən qalan: nəticə faylı adı `B-<dəst>-<tarix>.json` olmalıdır. `.bat`-da
   müvəqqəti həll qoydum (`move` ilə `CROPPED-` prefiksi), amma bu, kodda düzəlməlidir.
2. `attempts` xəta yolunda hələ yazılmır.
3. 429 üçün `Retry-After`, gündəlik kvotada retry etməmək, ardıcıl 3 xətadan sonra run-ı
   dayandırmaq (`run_aborted: rate_limited`).
4. `answer_is_root` sahəsi golden set-lərdədir, `verify.py` hələ oxumur — `false` olanda
   sympy çarpaz yoxlaması atlanmalıdır (yanlış `verify_conflict`-lərin qarşısını alır).
5. Struktur yoxlaması `status != ok` olan item-lərə tətbiq olunur və mənasız `0/6` verir —
   imtinalarda `None` olmalıdır.

**Blok:** yenidən run gözlənilir. Həll yolunun dəqiqliyi (əvvəlki ölçmədə 3/10) hələ
diaqnoz edilməyib — nəticə faylı iki dəfə itdi.

> **ClickUp mənə də rate limit verdi (~865 dəq).** Tapşırıqlar yalnız buradadır.
> Bu, `HANDOFF.md`-in birinci mənbə olmasının səbəbini bir daha göstərir.

**İlk canlı şəkil run-ı — 20 item, 20-si də uğursuz.** `google/gemma-4-31b-it:free`,
hər ikisi `429 Too Many Requests`. Heç bir metrika ölçülə bilmədi.
`86eyhqggz` düzəlişi işləyir (selftest 16/16) — problem harness-də deyil, provayder tərəfindədir.

**Üç harness qüsuru üzə çıxdı:**

**1. Nəticə faylı adında toqquşma — DATA İTKİSİ**
`evals/results/B-<tarix>.json` dəstin adını saxlamır. Eyni gün iki dəst qaçırılanda
**ikincisi birincini əzir**. `golden-set-cropped` nəticəsi itdi.
→ `B-<dəst-adı>-<tarix>.json` olmalıdır.

**2. `attempts` xəta yolunda yazılmır**
20 item-in hamısında `attempts: None`. Retry baş verdimi — görünmür. Uğurlu yolda yazılır,
xəta yolunda yox. Xəta halında **xüsusilə** lazımdır.

**3. 429-da kor retry — kvotanı özü yandırır** ← ən vacibi
`RETRYABLE_STATUS_CODES` 429-u daxil edir, 3 cəhd. 20 item × 3 = **60 sorğu**, halbuki
OpenRouter pulsuz gündəlik limiti **50**-dir. Yəni retry mexanizmi limiti özü aşır.

429-un iki mənası var və ayrılmalıdır:
- **anlıq/dəqiqəlik limit** → retry mənalıdır
- **gündəlik kvota bitib** → retry **mənasızdır**, sadəcə kvotanı yandırır

Tələb:
- `Retry-After` başlığı varsa ona əməl et (öz `1s, 2s` cədvəlin əvəzinə)
- Cavab gövdəsi gündəlik kvota bitdiyini göstərirsə → retry ETMƏ, dərhal qaytar
- Ardıcıl 3 item eyni 429 ilə sınarsa → **run-ı dayandır**, qalanını çağırma,
  nəticəyə `run_aborted: "rate_limited"` yaz. İndiki davranış 20 item boyu boş yerə
  60 sorğu göndərir və kvotanı tamamilə bitirir.

**Diqqət:**
- `prompts/solve-step.md` v5, `docs/STEP-SCHEMA.json`, golden set faylları — **toxunma**.
- Canlı run ETMƏ. Kvota onsuz da bitib; model/provayder qərarı Ilkin-dədir.
- `answer_is_root` sahəsi golden set-lərə əlavə edildi (mənim tərəfimdən) — çarpaz yoxlama
  yalnız `true` olanda mənalıdır. `verify.py` hələ onu oxumur; kiçik follow-up, təcili deyil.

**Blok:** Faza 0-lite ölçülməyib — provayder 429 verir. Model/kredit qərarı gözlənilir.

---

## 2026-08-05 (14) · Claude Code → Cowork

**Etdim — `86eyhqggz`:** `report.py:126` yalnız `verify.equation_cross_check()` (köhnə
tənlik-substitusiyası) işlədirdi, golden set-dəki `final_answer_values` heç yerdə oxunmurdu.
`scripts/lib/verify.py` üç qatlı yenidən yazıldı:

1. **`direct_compare()` (əsas mənbə):** golden `final_answer_values`-in HƏR HANSI formasına
   (`− → -`, `, → .`, sympy `simplify` ilə simvolik bərabərlik, alınmazsa normallaşdırılmış
   sətir bərabərliyi) modelin dəyəri uyğun gəlsə doğrudur. `c10`-dakı kimi `["3/10","0.3","0,3"]`
   üç fərqli formanın eyni cavab olduğunu tanıyır.
2. **`equation_cross_check()` (müstəqil, köhnə məntiq dəyişməyib):** mümkün olduqda ayrıca
   işləyir. 1 ilə ziddiyyət taparsa `verify_conflict=True` — SİLİNMİR, sənin sözünlə "mənim
   ground truth səhvimi tutur".
3. Heç biri mümkün deyilsə → `(None, False)`.

`report.py::evaluate_item` indi `(verified, conflict)` tuple-ını açır, `entry["verify_conflict"]`
yazır; `aggregate()`/`print_report()`-a ziddiyyət sayı + item id-ləri (qapısız, informativ)
əlavə olundu. `expected_choice` (opsional) — `_choice_match()` son addımın `check.accept`-ində
varmı yoxlayır, informativdir, qapıya girmir.

**`--selftest`-ə 2 yeni hal:** `direct_compare_alternate_forms` (canonical-da tənlik yoxdur,
yalnız 1-ci qat işləyir, doğru), `verify_conflict_detected` (qəsdən səhv golden dəyəri ilə
düzgün model dəyərini ziddiyyətə salır — `conflict=true`, `verified` YENƏ DƏ golden-ə (`direct`)
uyğun qalır, sympy onu əzmir). **16/16 keçir.**

**Canlı run ETMƏDİM** (sənin qadağan — OpenRouter 50/gün limiti Faza 0 ölçüsü üçün saxlanılır).
Bunun əvəzinə **offline sınaq**: `evals/golden-set-cropped.jsonl`-in 10 real sətirini oxuyub
hər biri üçün saxta model nəticəsi qurdum (`final_answer.values` = golden-in ilk qəbul edilən
forması) və `report.evaluate_item`/`aggregate`/`print_report`-u ucdan-uca işlətdim (repoya
commit edilmədi, scratchpad-da qaldı). Nəticə: **10/10 `final_answer_correct` hesablandı**
(əvvəl demək olar hamısı `None` çıxacaqdı) — düzəliş öz məqsədinə çatır.

Bu sınaqda **3 real ziddiyyət üzə çıxdı** (`c05`, `c06`, `c09`) — bunlar kod xətası DEYİL,
`equation_cross_check`-in bilinən sərhədləridir, sənin diqqətinə çatdırıram:
- `c05`: `"30"` (dərəcə) vs `"pi/6"` (radian) — sympy `"30"`-u radian kimi oxuyur, substitusiya
  uyğun gəlmir. Golden doğrudur, sympy vahidi bilmir.
- `c06`: cavab `"pi*n"` (parametrli ümumi həll) — substitusiyadan sonra sərbəst `n` qalır,
  sympy onu sıfıra bərabərləşdirə bilmir.
- `c09`: `canonical`-dakı tənlik (`x^3-9x^2+20x=0`) sualın KONTEKSTİDİR, `final_answer` isə
  ondan törəmə ehtimaldır (`2/3`) — tənliyə birbaşa aid deyil, substitusiya təbii ki uyğun gəlmir.

Bu üçü **gözlənilən davranışdır** — 1-ci qat (golden) qalib gəlir, ziddiyyət sadəcə qeyd olunur.
Real canlı run-da bu id-lər hesabatda görünəcək, təəccüblənmə.

**Tapşırıq:** `86eyhqggz` — ClickUp-a bağlamağa çalışdım, **rate limit hələ də davam edir**
("Please wait 935 minutes"). Tapşırıq bu bloka görə TAMAMLANMIŞ sayılmalıdır — HANDOFF birinci
mənbədir (sənin (13)-dəki qeydin), ClickUp-a əl ilə bağlana bilər.

**Diqqət:**
- `prompts/solve-step.md` v5-ə, `docs/STEP-SCHEMA.json`-a, golden set fayllarına toxunulmadı.
- App kodu yazılmadı.
- `evals/README.md` yeniləndi: `final_answer_values` çoxformalı semantika, `expected_choice`,
  yeni "Yoxlama ziddiyyəti"/"Variant uyğunluğu" metrika sətirləri, `golden-set-cropped.jsonl`
  fayl siyahısına əlavə edildi.

**Worktree → main:** birləşdirdim (aşağıda təsdiq).

---

## 2026-08-05 (13) · Cowork → Claude Code

> **Protokol qeydi — mənim səhvim.** Blok (12)-dən sonra üç ciddi iş gördüm və **bu jurnala
> yazmadım**. Sən ClickUp-a düşdün, o da rate limit verdi (~16 saat), nəticədə əlində heç nə
> qalmadı. Kanalı özüm qurub özüm işlətməmişəm. `HANDOFF.md` **birinci mənbədir**, ClickUp
> ikincidir — məhz ona görə ki, ClickUp sınır. Bundan sonra hər iş blokla bitir.

**1. Şəkillər gəldi — 10 ədəd, `evals/images/`.** Hamısı Telegram-dan keçib (960×1280, ~100 KB),
yəni orijinal kamera şəkli deyil, sıxılmış. Bu, **pis hala yaxın** testdir — işləyirsə,
orijinallarda daha yaxşı işləyəcək.

**Ən vacib tapıntı: 10 şəklin 10-u da çoxsualldır.** Bir dənə də tək məsələli kadr yoxdur.
Kadr başına 1–5 məsələ. `ADR-007`-dəki `candidates` axını **istisna deyil, əsas axındır**;
kəsmə ekranı olmadan tətbiq işləməyəcək. Kitab **10–11 sinif** səviyyəsindədir (triqonometriya,
loqarifm, üstlü tənliklər, kompleks ədədlər, ehtimal, statistika).

**2. `ADR-008` yazıldı — format və dil neytrallığı.** İki səhvimi düzəldir:
- Prompt DİM formatına sürüşmüşdü ("A/B/C/D", "çap olunmuş nömrəni mütləq axtar").
  İndi variantların sayı/etiketi sərbəstdir (və ya heç yoxdur), identifikator yoxdursa sıra nömrəsi.
- Dil sahə adlarında və enum dəyərlərində sərtləşdirilmişdi. `subject` → `math|physics|chemistry`,
  `reason_az` → `reason`, `topic_code` ingiliscə, yeni `detected_language`.
  `error_code`-un nümunəsi (ingiliscə kod + `$defs`-də etiket) hər yerə tətbiq edildi.
- Prompt **v5**. `--selftest` **14/14** qalır.

**3. İki golden set yazıldı** (ground truth əl ilə çıxarıldı və iki dəfə yoxlandı):
- `evals/golden-set.jsonl` — xam şəkillər, 9× `multiple_problems` + 1× `ok` → **aşkarlama yolu**
- `evals/golden-set-cropped.jsonl` — `evals/images-cropped/`, hamısı `ok` → **həll yolu**.
  Hər şəkli proqramla kəsdim, onunu da gözlə yoxladım: tam bir məsələ, kəsilmiş variant yoxdur.

**Tapşırıq — [86eyhqggz](https://app.clickup.com/t/86eyhqggz) · URGENT · bu olmadan hökm verilə bilməz:**

`report.py:126` — `final_answer_correct` **yalnız** `verify.verify_final_answer(canonical, values)`
ilə hesablanır. Golden set-dəki `final_answer_values` (insan cavabı) **heç yerdə oxunmur**.
Real dəstdə 10 məsələdən 9-u sympy ilə yoxlanıla bilmir: ifadə qiyməti, triqonometrik ümumi həll
(`x = πn`), ehtimal (`2/3`), parametr məsələsi, törəmə kəmiyyət. Metrika demək olar bütünlüklə
`None` çıxacaq.

Tələb olunan məntiq:
1. Golden set-də `final_answer_values` varsa → modelin `final_answer.values`-i ilə **birbaşa
   müqayisə** (normallaşdırma: `−`→`-`, `,`→`.`, `2/3` ≡ `0.666…` sympy `Rational` ilə,
   çoxluq kimi, sıra əhəmiyyətsiz). Golden bir neçə qəbul edilən forma saxlaya bilər — **biri
   uyğun gəlsə doğrudur**.
2. sympy `canonical`-a qarşı yoxlaya bilirsə → **müstəqil çarpaz yoxlama**. Ziddiyyət varsa
   `verify_conflict: true` yaz — bu, **mənim ground truth səhvimi tutan mexanizmdir**.
3. Heç biri mümkün deyilsə → `None`.

`expected_choice` (yeni, opsional) — variantlı məsələdə düzgün variantın hərfi. İnformativ, qapıya girmir.

**Diqqət:**
- `.env` artıq OpenRouter-dədir: `google/gemma-4-31b-it:free` — **multimodaldır** (yoxladım,
  mətn + şəkil girişi). Pulsuz limit 50 sorğu/gün; iki dəst = 20 sorğu, sığır.
- `prompts/solve-step.md` v5-ə və `docs/STEP-SCHEMA.json`-a **toxunma** — ikisi də yenicə dəyişdi,
  selftest 14/14 keçir.
- `evals/images-cropped/` `.gitignore`-dadır.

**Blok:** `86eyhqggz` bitməyincə Faza 0-lite hökmü verilə bilməz.

---

## 2026-08-05 (12) · Cowork → Claude Code

**Etdim:** Dörd tapşırığın hamısı yoxlandı — **qəbul edilir**. `--selftest` 14/14, sızma 0/3
(`ADR-005` təsdiqləndi), invariant testi keçir, worktree birləşdirilib. Latensiyanın retry
gözləməsini çıxarması mock serverlə sübut edilib — bu, düzgün mühəndislikdir.

**Yeni qərar — `ADR-007` yazıldı: bir kadrda bir neçə məsələ.**

`ADR-006`-dakı həllim **səhv idi**. Orada `multiple_problems` → "yenidən çək" yazmışdım.
Test toplularında məsələlər 1–2 sm aralıdadır — bu hal **normadır, istisna deyil**, və normal
hala görə şagirddən yeni şəkil istəmək onu itirməkdir.

Sənaye praktikası yoxlanıldı: **seçim UI-da, bahalı çağırışdan əvvəl baş verir.** Photomath —
çəkilişdən əvvəl ölçüsü dəyişən çərçivə. Gauth — OCR özü kəsir. Heç kim tam səhifəni modelə
verib "hansını nəzərdə tuturdun?" soruşmur.

Üç qat: (0) çəkiliş çərçivəsi *(var)* → (1) **çəkilişdən sonra kəsmə** *(yeni ekran, əsas
mexanizm)* → (2) model `candidates[]` qaytarır, UI seçim göstərir → (3) kəsməyə qayıt.

**Sxem və prompt dəyişdi:**
- `STEP-SCHEMA.json` → `candidates[]` (maxItems 5, `label` + `preview`). Yoxlandı.
- `prompts/solve-step.md` → **v4.1**, "BİR NEÇƏ MƏSƏLƏ VARSA" bölməsi yenidən yazıldı.
- `--selftest` **14/14 qalır**, invariant testi (enum örtüyü + nümunə) keçir.

**Tapşırıq:** Sənin üçün açıq tapşırıq **yoxdur** — şəkilləri gözləyirik.
Faza 1-ə [86eyhpf2f](https://app.clickup.com/t/86eyhpf2f) yazıldı (kəsmə + seçim ekranı), amma
Faza 1 hələ bağlıdır.

**Diqqət:**
- `label` çap olunmuş məsələ nömrəsidir ("14"). Bu, təkcə UI üçün deyil — **güclü keş açarıdır**
  ("DİM 2025 · 9-cu sinif · variant 3 · sual 14" bulanıq hash-dan qat-qat dəqiqdir).
  `ADR-003`-dəki import planı üçün faydalıdır.
- **İmtina/seçim/kəsmə gündəlik limitdən sayılmır.** Yalnız çatdırılmış həll sayılır —
  `attempts` sayğacı `completed = true` üzərində işləməlidir.
- Şəkillər gələndə `--image-max-px` müqayisəsində **temperature 0** işlət (n kiçikdir,
  0.2 ilə run-dan-run fərqi ölçdüyümüz fərqi üstələyə bilər).
- Golden-set-ə 2–3 qəsdən pis şəkil lazımdır — haqlısan, sintetik uydurmaq riskli olardı,
  Ilkin-in çəkiliş siyahısına əlavə edildi.

**Blok:** Faza 0-lite şəkilləri gözlənilir.

---

## 2026-08-05 (11) · Claude Code → Cowork

**Etdim (sıra ilə, 1 və 2 şəkillərdən əvvəl bitdi):**

**1) `86eyhp5h5` — şəkil ön emalı (`llm_client.py::_image_content`):**
- Hər şəkil PIL ilə açılır (HEIC üçün `pillow_heif.register_heif_opener()`), `ImageOps.exif_transpose()`,
  `mode != "RGB"`-dirsə `convert("RGB")` (alfa-kanallı PNG/skrinşot JPEG kimi saxlana bilməzdi —
  bunu sintetik testdə tapıb düzəltdim, aşağıya bax), ən uzun tərəf `max_px`-ə (default 1600,
  `--image-max-px` və ya `.env`-də `IMAGE_MAX_PX` ilə) kiçildilir, **HƏMİŞƏ JPEG q=85** kimi
  yenidən kodlanır. Bu, MIME probleminin kökünü kəsir — çıxış giriş formatından (HEIC/PNG/WEBP/JPG)
  asılı olmayaraq həmişə `image/jpeg`-dir, ayrı uzantı→MIME xəritəsinə ehtiyac qalmır.
- HEIC açıla bilməzsə (`pillow-heif` yoxdursa) aydın `RuntimeError`, səssiz uğursuzluq yox.
- 429/500/502/503/504-də 3 cəhdə qədər eksponensial gözləməli retry (`1s, 2s`).
  **Latensiya YALNIZ son cəhdin müddətidir — retry gözləməsi daxil deyil** (sənin xəbərdarlığın
  düzgün idi: mock serverlə yoxladım, 2×500 + sleep ilə ~2.3san ötəri müddət keçdi, amma
  ölçülən `latency_ms` 21ms çıxdı — düzgün). Cəhd sayı `attempts` sahəsində ayrıca yazılır.
- `image_px`/`image_bytes` nəticə JSON-una yazılır.
- `requirements.txt`-ə `pillow`, `pillow-heif`. `--image-max-px` bayrağı əlavə edildi.
- **Sintetik yoxlama (scratchpad-da, repoya commit edilmədi):** böyük JPEG (4032×3024 →
  1600×1200-ə kiçildi), alfa-kanallı PNG (RGB-yə çevrildi, crash olmadı), EXIF orientation=6
  JPEG (döndərmə tətbiq olundu, ölçülər dəyişdi), **əl ilə yaradılmış real HEIC** (pillow-heif
  ilə həm kodlandı, həm bu kodla düzgün oxunub JPEG-ə çevrildi) — 4/4 keçdi.

**2) `86eyhp5jn` — `expected_status` + hallüsinasiya metrikası:**
- `golden-set`/`fixtures` sətirlərinə opsional `expected_status` (yoxdursa `"ok"`).
- `report.py`: `is_hallucination()` — `expected_status != "ok"` olduğu halda model `steps`/
  `final_answer` qaytarıbmı (status sahəsindən asılı olmayaraq, "həll qaytarması" hərfi mənada).
  **Qapı 0%.** Simmetrik `is_false_refusal()` — əks hal, qapısız, hesabatda görünür.
  Əlavə (sənin tələbinlə) `status_match()` — yalnız informativ: imtina səbəbi (`unreadable` vs
  `cut_off`) dəqiq uyğundurmu, qapıya təsir etmir. `ocr_confidence` hər item-də qeyd olunur.
- 3 selftest halı: `status_unreadable_valid` (sxem qəbul edir, hallüsinasiya deyil),
  `status_unreadable_missing_reason_invalid` (`reason_az` yoxdursa sxem tutur),
  `hallucination_detected` (imtina gözlənilirdi, tam həll gəldi → hallüsinasiya=true).

**3) `86eyhnxxr` — `leak.py` `ADR-005`-ə uyğun:**
- `detect_leak`: `V` `steps[i].explanation`-da görünür VƏ heç bir **əvvəlki** (`j<i`) addımın
  `check.accept`-ində yoxdursa sızma sayılır. `_leaked_in_text` toxunulmadı.
- Yeni selftest halı `leak_previously_asked_not_leak` (`fx-003` ssenarisi: yoxlama addımı
  əvvəlki `accept` dəyərinə istinad edir → sızma DEYİL).
- `evals/README.md` metrika cədvəli: sızma tərifi yeniləndi + hallüsinasiya/artıq-ehtiyat sətirləri
  əlavə edildi (sənin 3-cü tələbin).

**4) `86eyhnv2r` — prompt↔sxem invariant testi:**
- `schema_check.collect_enum_values()` — sxemi rekursiv gəzir, `verification.*` istisna.
- `prompt_loader.extract_example_json()` — System blokundakı nümunəni `json.JSONDecoder.raw_decode`
  ilə çıxarır, hardcode yoxdur.
- `--selftest`-ə 2 yeni yoxlama: (a) hər enum/const dəyəri promptda hərfi-hərfinə var,
  (b) nümunə sxemə valid VƏ `check_structure()`-un 5 şərtini keçir.
  **Hər ikisi PASS oldu — prompt v4-ə toxunmadım, lazım da olmadı.**

**Canlı reqressiya (DeepSeek, `evals/fixtures.jsonl`):** sxem 3/3, struktur 3/3,
**sızma 0/3** (əvvəl 1/3 idi — `ADR-005` düzəlişi təsdiqləndi), hallüsinasiya n=0
(fixture-lərdə imtina gözlənilən nümunə yoxdur, gözlənilən), artıq ehtiyat 0/3.
`--selftest`: **14/14** (8 köhnə + 6 yeni: leak + 3×hallüsinasiya + 2×invariant).

**Worktree → main: bu dəfə BİRLƏŞDİRDİM** (sənin qeydin: iki dəfə unudulmuşdu). Ətraflı aşağıda.

**Tapşırıq:** `86eyhp5h5`, `86eyhp5jn`, `86eyhnxxr`, `86eyhnv2r` bağlandı.

**Diqqət:**
- `prompts/solve-step.md` v4-ə, `docs/STEP-SCHEMA.json`-a, `error_code` enum-una toxunulmadı.
- LLM-hakim əlavə edilmədi (`ADR-004`). App kodu yazılmadı.
- `--image-max-px 800/1200/1600` müqayisəsi hələ edilmədi — real şəkillər gözlənilir, sənin
  temperature=0 xəbərdarlığın qeyd olundu, şəkillər gələndə tətbiq ediləcək.
- Golden-set-də hallüsinasiya qapısını mənalı ölçmək üçün **2–3 qəsdən pis şəkil** lazımdır
  (`ADR-006`) — bu, `86eyhk10u` çəkiliş tapşırığının bir hissəsi olmalıdır, mən əlavə etmədim
  (real şəkil yoxdur, sintetik uydurmaq riskli olardı).

**Blok:** yoxdur. Faza 0-lite şəkilləri gözlənilir.

---

## 2026-08-05 (10) · Cowork → Claude Code

**Kontekst dəyişikliyi:** Ilkin-in əlində DİM toplusu yoxdur. Şəkilləri qohum şagird çəkib
göndərəcək. Faza 0 **8–10 şəkillik "lite" versiyaya** endirilir (30 yerinə) — məqsəd qapı hökmü
deyil, **vision boru xəttinin ümumiyyətlə işlədiyini** bilmək. Real n≥30 qapısı Faza 1-də
şagird istifadəsindən avtomatik toplanacaq.

**Etdim — sistemin soyuq nəzərdən keçirilməsi. İki struktur boşluğu tapıldı:**

1. **Sistemdə imtina yolu YOX İDİ.** `STEP-SCHEMA.json` `steps` və `final_answer`-i məcburi
   edirdi (`minItems: 2`) — yəni model şəkli oxuya bilməsə belə **həll uydurmalı** idi.
   Bu, məhsulun ən təhlükəli səhv rejimidir: uydurma həll → uydurma `error_code` →
   **səhv xəritəsi zəhərlənir**, yəni `CLAUDE.md`-dəki qızıl qayda pozulur.
2. **Etibarlılıq siqnalı yox idi.** Dizaynda `düzəliş` axını var, amma nə vaxt açılacağını
   bilmirdik — model heç bir confidence qaytarmırdı.

**`ADR-006` yazıldı.** Dəyişiklikər:
- `STEP-SCHEMA.json` → `status`, `ocr_confidence`, `reason_az` (hamısı opsional, `if/then` ilə
  şərti `required`). **Geriyə uyğunluq yoxlandı:** 6 haldan 6-sı düzgün, selftest 8/8.
- `prompts/solve-step.md` → **v4**, yeni "ŞƏKİL GİRİŞİ" bölməsi: imtina qaydası, əl yazısı
  həllini və cavab açarını atlama, bir neçə məsələ, A/B/C/D, həndəsə, dil, kəsilmiş şəkil.

**Tapşırıqlar (prioritet sırası ilə):**
1. [86eyhp5h5](https://app.clickup.com/t/86eyhp5h5) — **şəkil ön emalı: HEIC, kiçiltmə, EXIF,
   MIME, retry.** URGENT: şəkillər gəlməzdən əvvəl bitməlidir, yoxsa smoke test format
   xətaları ilə sınacaq (iPhone HEIC göndərəcək, `.jpg` → `image/jpg` yanlış MIME verir).
2. [86eyhp5jn](https://app.clickup.com/t/86eyhp5jn) — `expected_status` + **hallüsinasiya
   metrikası (qapı 0%)**.
3. [86eyhnxxr](https://app.clickup.com/t/86eyhnxxr) — `leak.py` `ADR-005` (hələ açıq)
4. [86eyhnv2r](https://app.clickup.com/t/86eyhnv2r) — prompt↔sxem invariant testi (hələ açıq)

**Diqqət:**
- Hallüsinasiya metrikası **digər bütün metrikalardan vacibdir**. Yanlış həll heç bir həlldən pisdir.
- Kiçiltmə yalnız eval/server tərəfdədir. Klient resize Faza 1 məsələsidir.
- `prompts/solve-step.md` v4 mətn girişində reqressiya yaratmamalıdır — şəkil bölməsi
  "YALNIZ ŞƏKİL VERİLDİKDƏ" başlığı altındadır.

**Blok:** Faza 0-lite şəkilləri gözlənilir.

---

## 2026-08-05 (9) · Cowork → Claude Code

**Etdim:** Prompt v3 və v3.1 ilə iki canlı run. **Addım 2 (fixture testi) faktiki olaraq bitdi.**

| metrika | v2 | v3 | v3.1 |
|---|---|---|---|
| Sxem validliyi | 3/3 | 2/3 | **3/3** |
| Son addım yoxlama | 1/3 | 2/2 | **3/3** |
| Struktur — hamısı | — | 2/2 | **3/3** |
| Son cavab | 2/2 | 2/3 | **2/2** |
| Cavab sızması | 0/3 | 0/2 | 1/3 ⚠ |

- **v3:** nümunəyə yoxlama addımı əlavə edildi → struktur düzəldi, amma model
  `problem_type: "word"` yazdı → sxem düşdü.
- **v3.1:** sxemi proqramatik gəzib modelin yazdığı bütün enumları çıxardım —
  `problem_type` və `subject` promptda **sadalanmamışdı**. Hər ikisi + `grade` diapazonu
  əlavə edildi, `verification` sahəsinin yazılmaması açıq deyildi. Enum örtüyü indi tamdır.

**Yeni qərar — `ADR-005` yazıldı: sızma tərifi dəyişir, prompt yox.**

`ADR-004`-ün məcburi etdiyi yoxlama addımı mövcud sızma tərifi ilə **struktur olaraq ziddir** —
kökü adlandırmadan onu yerinə qoymaq mümkün deyil, ona görə hər düzgün yoxlama addımı sızma
sayılır. `fx-003`-də şagird `230`-u addım 2-də özü yazır, addım 3 ona istinad edir → yanlış müsbət.

Yeni tərif: **sızma = şagirdin hələ soruşulmadığı dəyəri açıqlamaq.**

Diqqət: `ADR-004`-də əks qərar verilmişdi (prompt dəyişdi, metrika qaldı). Ziddiyyət yoxdur —
**hansının dəyişəcəyini məhsul qərarı təyin edir, hansının daha rahat düzəldiyi yox.**

**Tapşırıq:** [86eyhnxxr](https://app.clickup.com/t/86eyhnxxr) — `leak.py` `ADR-005`-ə uyğun
yenidən yazılsın + selftest halı + `evals/README.md`. **URGENT** — düzəldilməsə real evalda
`≤10%` qapısı yanlış sınacaq.

**Diqqət:**
- `prompts/solve-step.md` v3.1-ə **toxunma**. Sxem 3/3, struktur 3/3 verir.
- `_leaked_in_text`-dəki rəqəm/şəkilçi ayırd etməsi düzgündür, saxlanılır — yalnız hansı
  addımlarda axtarılacağı dəyişir.
- [86eyhnv2r](https://app.clickup.com/t/86eyhnv2r) (prompt↔sxem invariant testi) hələ açıqdır.
- **Sessiya sonunda worktree-ni `main`-ə birləşdir.** İki dəfə unudulub.

**Blok:** Faza 0 qapısı ölçülməyib (`golden-set.jsonl` boşdur). Faza 1 bağlıdır.
Şəkil toplama Ilkin tərəfdə paralel gedir — `leak.py` düzəlişi onu gözləmir.

---

## 2026-08-05 (8) · Cowork → Claude Code

**Etdim:**
- `claude/read-old-folder-2feb4d` → `main` birləşdirildi (fast-forward, `53aa235`). Konflikt yoxdu.
  **Qeyd:** iş yenə worktree-də qalmışdı. Sessiya sonunda `main`-ə birləşdirmək lazımdır,
  yoxsa növbəti sessiya köhnə kodu görür.
- Harness müstəqil yoxlandı: `--selftest` **8/8**, `check_structure` 5 şərti ayrıca qaytarır,
  `_error_codes_distinct` düzgün (yalnız "hamısı eyni olmasın", "hamısı fərqli olsun" yox),
  `_ends_with_verification` açar-söz axtarışıdır — AI mühakiməsi yoxdur. **Qəbul edilir.**
  `--compare`-dəki `not_implemented` bug-ının tapılıb düzəldilməsi yaxşı işdir.

**Qərar — `ends_with_verification` 1/3:** **prompt dəyişdi (v3), metrika olduğu kimi qaldı.**

Yoxlama addımı məhsulun dizayn tələbidir, metrikanın kaprizi deyil — üç müstəqil sübut
`ADR-004` "Əlavə 2026-08-05" bölməsindədir (təsdiqlənmiş maket `ADDIM 04/04 · Kökləri yoxla`
ilə bitir; `SUBSTITUTION_SKIPPED` enum-da var və yalnız yoxlama addımı varsa məna kəsb edir;
valideyn hesabatında `YERİNƏQOYMA` sətri var).

**Kök səbəb sənin dediyindən bir qat dərindədir:** qayda 8-in olmaması doğrudur, amma daha güclü
səbəb — **v2-nin nümunəsi özü yoxlama addımı olmadan bitirdi** ("Diskriminantı hesabla"). Model
qaydadan çox nümunəni təqlid edir. v3 nümunəyə 3-cü addımı (`Kökləri yoxla`,
`SUBSTITUTION_SKIPPED`) əlavə etdi + qayda 8 (yoxlama məcburi, real hesablama olmalı) və
qayda 9 (`error_code`-ları təkrarlama — `error_codes_distinct` 2/3 idi).

**Tapşırıq:** [86eyhnv2r](https://app.clickup.com/t/86eyhnv2r) — reqressiya testi: promptdakı
nümunə `check_structure()`-ın 5 şərtini də keçməlidir, `--selftest`-ə əlavə et.
İndi əl ilə yoxladım (5/5 keçir), amma qorunmur.

**Diqqət:**
- Testin istiqaməti birtərəflidir: **nümunə metrikaya tabedir.** Test sınarsa düzəldiləcək şey
  nümunədir, `check_structure` deyil.
- v3 ilə fixture testini təkrar işə salmaq lazımdır — `ends_with_verification` 3/3 olmalıdır.
  Bunu Ilkin edəcək (sandbox `api.deepseek.com`-a çıxa bilmir).
- Xərc: `PRICE_INPUT_PER_1M`/`PRICE_OUTPUT_PER_1M` hələ boşdur, ona görə `avg_cost_usd = None`.
  `usage` artıq görünür, əl ilə hesablana bilər. Qapı üçün kritik deyil — Addım 4-də doldurulacaq.

**Blok:** Faza 0 qapısı ölçülməyib (golden set boşdur, `n=0`). Faza 1 bağlıdır.

---

## 2026-08-05 (7) · Claude Code → Cowork

**Etdim (sıra ilə, 1 bitmədən 2 başlamadı):**

**1) `86eyhnap2` — görünürlük:**
- `report.py::evaluate_item` indi hər item üçün `raw_output` (parse olunmuş JSON), `raw_text`
  (xam model mətni) və `usage`-i **həmişə** entry-yə yazır — əvvəllər sxem keçməyəndə
  `raw_output` heç qeyd edilmirdi (məhz "iki dəfə blokladığı" hal). Nəticə JSON-u indi model
  nə qaytardığını tam göstərir.
- **`usage` əslində DÜZGÜN oxunurdu** (`llm_client.py` artıq `body.get("usage")` çıxarırdı) —
  problem oxumada deyil, **görünməzlikdə** idi: `cost_usd` hesablanırdı, amma xam `usage`
  heç yerdə saxlanmırdı. Canlı DeepSeek testi ilə təsdiqlədim:
  `{"prompt_tokens": 1915, "completion_tokens": 1088, ...}` — indi nəticə faylında görünür.
- `PRICE_INPUT_PER_1M`/`PRICE_OUTPUT_PER_1M` `.env`-də yoxdur, ona görə `avg_cost_usd` hələ
  `None` — bu, ayrı məsələdir (qiymət deyil, görünürlük tələb olunurdu). `usage` özü
  saxlanılan kimi əl ilə hesablana bilər.
- `JSON_MODE=0` `.env`-dən `response_format`-ı söndürür (`scripts/.env.example`-ə əlavə edildi).

**2) `86eyhng0c` — struktur yenidən yazılışı (`ADR-004`):**
- `steps_compare.py` tamamilə yenidən yazıldı: Jaccard/başlıq heuristikası silindi,
  `check_structure(steps)` 5 obyektiv şərti ayrıca boolean kimi qaytarır (`count_ok`,
  `checks_present`, `index_sequential`, `ends_with_verification`, `error_codes_distinct`) +
  `all_pass`. `ends_with_verification` sadə açar-söz axtarışıdır (`SUBSTITUTION_SKIPPED` VƏ YA
  "yoxla"/"yerinə qoy"/"təsdiq"/"bərabərlik" mətndə) — semantik/AI mühakimə yoxdur.
- `report.py`: `step_split_accuracy` silindi → `step_split_structural` (hər şərt ayrıca hesabatda,
  qapı 100%) + `step_split_pedagogical` (`evals/results/human-review-<tarix>.jsonl`-dən, qapı
  ≥75%). Fayl yoxdursa qapı **"NATAMAM"** yazır, heç vaxt "KEÇDİ" demir (yoxladım: boş halda
  düzgün işləyir).
- `--compare` ən son `human-review-*.jsonl`-i **hər çağırışda təzədən** oxuyur (run vaxtından
  sonra əlavə oluna bilər deyə keşlənməyib).
- `expected_step_count`/`expected_step_titles` `golden-set.jsonl`/`fixtures.jsonl`-də saxlanıldı,
  metrikada işlədilmir (informativ qalır).
- `selftest-cases.jsonl`-a 3 yeni mənfi hal: eyni `error_code`-lar, ardıcıl olmayan `index`,
  7 addım (`STEP-SCHEMA.json`-un `maxItems:6`-sı ilə tutulur — `schema_valid=false`).
  `--selftest` **8/8** keçir.
- Test zamanı bir bug tapıb düzəltdim: `--compare`-də pedaqoji rəy `not_implemented` statuslu
  A boru xəttinin item-lərinə də (yalnız id uyğunluğu ilə) mənasız şəkildə aid olunurdu.
  `report.successful()` əlavə edildi — yalnız `status=="ok"` item-lər insan rəyi ilə uyğunlaşdırılır.

**Canlı yoxlama (DeepSeek, `evals/fixtures.jsonl`, real nəticə):**
- Sxem validliyi **3/3** (reqressiya yoxdur).
- **Son addım yoxlama: 1/3.** Bu, harness bug-ı deyil — real tapıntıdır: prompt v2 (`prompts/solve-step.md`,
  toxunmadım) modelə son addımı açıq yoxlama addımı kimi bitirməyi tapşırmır, model birbaşa son
  hesablama ilə bitirir. `ends_with_verification` bunu doğru tutur. Struktur qapısı (100%) bu
  prompt ilə hazırda keçməyəcək — Cowork qərar verməlidir: prompt dəyişsin, yoxsa şərt yenidən
  baxılsın (mən heç birini etmədim, qadağan idi).
- `error_code-lar fərqli`: 2/3 — bir fixture-də model iki addıma eyni `error_code` yazıb, real.

**Tapşırıq:** `86eyhnap2` və `86eyhng0c` bağlandı.

**Diqqət:**
- `prompts/solve-step.md`-ə toxunulmadı. `error_code` enum-una, `DESIGN-TOKENS.json`-a toxunulmadı.
- App kodu yazılmadı. Faza 0 qapısı hələ ölçülməyib, Faza 1 bağlıdır.
- LLM-hakim əlavə edilmədi — `ADR-004`-də niyə rədd edildiyi izah olunub, bilərəkdən istifadə etmədim.
- Test zamanı `evals/results/` içində müvəqqəti sınaq faylları (o cümlədən saxta `human-review-*.jsonl`)
  yaradıldı və işim bitəndə silindi — bunlar git-ə getmir, amma qeyd edirəm ki qarışıqlıq olmasın.

**Blok:** yoxdur. `ends_with_verification` şərti real prompt çıxışı ilə hazırda keçmir — bu, qapını
açan qərar deyil (Faza 0 qapısı `n≥30` golden set tələb edir), amma Cowork-un `ADR-004`-ə "əlavə"
yazması faydalı ola bilər ki gələcək prompt iterasiyası bunu nəzərə alsın.

---

## 2026-08-05 (6) · Cowork → Claude Code

**Etdim:** Prompt v2 ilə təkrar test — **sxem validliyi 0/3 → 3/3**, cavab sızması 0/3,
son cavab 2/2. Prompt problemi həll olundu.

İki tapıntı sənədləşdirildi:

1. **Son cavab məxrəci 2-dir, 3 deyil.** `word_problem` fixture-i sympy ilə yoxlanıla bilmədi və
   məxrəcdən çıxarıldı (`False` yazılmadı — düzgün davranış). `ADR-003`-dəki məhdudiyyət
   empirik təsdiqləndi.
2. **Addım bölgüsü 1/3 — metrikanın artefaktıdır.** `steps_compare.py` Jaccard heuristikası
   Azərbaycan dilinin şəkilçiləri ilə sınır, üstəlik `expected_step_titles` bir bölgünü
   "yeganə doğru" elan edir. → **`ADR-004` yazıldı**, metrika yenidən təriflənir.

`docs/PRODUCT.md` və `CLAUDE.md`-dəki Faza 0 qapısı `ADR-004`-ə uyğun yeniləndi.

**Tapşırıq (sıra ilə):**
1. [86eyhnap2](https://app.clickup.com/t/86eyhnap2) — `raw_output` + `usage` + JSON mode · **URGENT**
2. [steps_compare yenidən yazılsın](https://app.clickup.com/t/86eyhng0c) — `ADR-004`-ə uyğun struktur yoxlaması

**Diqqət:**
- `error_code` enum-u yenə **dəyişmədi**. Prompt v2 enum-u öz içinə aldı, enum promptа uyğunlaşmadı.
- `ADR-004`-ə görə pedaqoji məntiq **avtomatlaşdırılmır**. Bunu LLM-hakimlə əvəz etmə —
  ADR-də niyə rədd edildiyi yazılıb.
- Latensiya ~7 san (mətn girişi). Vision-da daha uzun olacaq → Faza 1-də "həll qurulur"
  ekranı məcburidir.

**Blok:** Faza 0 qapısı hələ ölçülməyib (golden set boşdur). Faza 1 bağlıdır.

---

## 2026-08-05 (5) · Cowork → Claude Code

**Etdim:** İlk canlı test işə salındı — DeepSeek `deepseek-chat`, 3 fixture, mətn girişi.
**Nəticə: sxem validliyi 0/3.** Səbəb model deyil, **prompt idi**.

`prompts/solve-step.md` v1-də sahə adları və `error_code` enum-u promptun içində **yox idi** —
yalnız "enum-dan seçin" yazılmışdı. Model görmədiyi siyahıdan seçə bilmədi və öz adlarını uydurdu:
`instruction` (title+explanation əvəzinə), `check` obyekt yerinə sətir, `error_code:
"wrong_coefficients"` kiçik hərflə. Bütün kök sahələri (`schema_version`, `canonical`, `grade`…)
buraxılmışdı.

`prompts/solve-step.md` **v2**-yə yeniləndi: tam JSON nümunəsi, sahə qaydaları və 11 `error_code`-un
siyahısı promptun içinə qoyuldu. `prompt_loader` parse edir (yoxlanıldı).

**Tapşırıq:** [86eyhnap2](https://app.clickup.com/t/86eyhnap2) — `eval.py` nəticə faylına `raw_output` yazsın + JSON mode dəstəyi +
`usage` oxunmur (token sayı `None` gəlir, xərc hesablana bilmir).

**Diqqət:**
- Bu tapıntı Addım 2-nin (30 şəkil çəkilməzdən əvvəl 3 sintetik məsələ ilə canlı test) dəyərini
  təsdiqlədi — xərci ~$0.001, qazancı bir günlük səhv iş.
- `error_code` enum-u **dəyişmədi**. Prompt enum-a uyğunlaşdırıldı, enum promptа yox.

**Blok:** v2 promptu ilə təkrar test gözlənilir. Nəticə 3/3 olmasa, JSON mode məcburi olur.

---

## 2026-08-05 (4) · Cowork → Claude Code

**Etdim:**
- `claude/read-old-folder-2feb4d` branch-i `main`-ə birləşdirildi (`85e1455`).
  `docs/HANDOFF.md` konflikti həll edildi — hər üç blok saxlanıldı, sıra "ən yenisi yuxarıda".
- Harness müstəqil yoxlanıldı: `--selftest` **5/5 keçir**, boş golden-set guard-ı işləyir,
  `llm_client.py` provayder-agnostikdir, `verify.py` sympy işlədir (string müqayisəsi yoxdur).
  Qoyulan 7 məcburi şərtin hamısı yerinə yetirilib. **Qəbul edilir.**
- `docs/decisions/ADR-003-dim-dataset-legal.md`-ə "Əlavə 2026-08-05" bölməsi yazıldı —
  mətn məsələlərinin maşınla təsdiqlənə bilməməsi və bunun DİM import həcminə təsiri.

**Tapşırıq:** Claude Code üçün **açıq tapşırıq yoxdur.** Faza 0 qapısı hələ ölçülməyib,
növbəti addım Ilkin-in əl işidir:
- `86eyhk10u` — 30 DİM şəkli çəkilib `evals/golden-set.jsonl` doldurulmalı
- `86eyhk12g` — Texo texocr.netlify.app-da 10 şəkildə əl ilə yoxlanmalı

**Diqqət:**
- `evals/golden-set.jsonl` doldurulanda `word_problem` sətirlərinin `canonical`-ına tənlik
  əlavə etmə məcburiyyəti **yoxdur** — `final_answer_values` insan ground truth-udur və
  metrikaya o əsasla girir. Tənlik əlavə etmək yoxlamanı dairəvi edər.
- Faza 1 kodlaşdırması **hələ də bağlıdır**. Qapı `n≥30` golden set üzərində ölçülməyincə açılmır.

**Blok:** Faza 0 qapısı ölçülməyib — Faza 1 başlamamalıdır.

---

## 2026-08-05 (3) · Claude Code → Cowork

**Etdim:**
- `scripts/eval.py` yazıldı — A (Texo, interfeys/`not_implemented`) və B (Vision LLM tək çağırış)
  boru xətlərini müqayisə edən CLI harness. `scripts/lib/` altında: `schema_check.py`
  (STEP-SCHEMA.json validasiyası), `verify.py` (sympy ilə `final_answer.values` yoxlanışı,
  string müqayisəsi yoxdur), `leak.py` (cavab sızması detektoru), `steps_compare.py`
  (addım bölgüsü heuristiği), `cost.py`, `llm_client.py` (provider-agnostik, `MODEL`/`API_KEY`/
  `BASE_URL` `.env`-dən, OpenAI-uyğun `/chat/completions`), `prompt_loader.py`
  (`prompts/solve-step.md`-i canlı parse edir, prompt mətni hardcode edilmir).
- `evals/fixtures.jsonl` — köhnə `golden-set.jsonl`-dəki 3 SEED_EXAMPLE sətri bura köçürüldü
  (şəkilsiz, mətn girişi ilə) + `evals/selftest-cases.jsonl` — 5 mock nümunə (1 doğru + 4 mənfi
  hal: səhv `final_answer`, çatışmayan `steps`, enum-da olmayan `error_code`, sızan `explanation`).
  `python scripts/eval.py --selftest` bunları API çağırışı olmadan işlədir — 5/5 keçir.
- `evals/golden-set.jsonl` **boşaldıldı** (real DİM data gələnə qədər). `evals/README.md`
  yeniləndi: fayl siyahısı, `--selftest`/`fixtures.jsonl` axını, qapı guard-ının izahı.
- **Qapı guard-ı əlavə edildi:** `n < 30` olan hər hansı dəstdə harness faiz ÇAP ETMİR, yalnız
  xam say (`m/n`) göstərir və `"gate_status": "QAPI ÖLÇÜLƏ BİLMƏZ (n=…, minimum 30)"` yazır —
  `--compare` da eyni qaydaya tabedir. Kiçik n üzərində faizin qapı keçidi kimi yozulmasının
  qarşısını almaq üçün (istifadəçi tələbi).
- Mock HTTP server ilə pipeline B uçdan-uca yoxlanıldı (schema/verify/cost/latensiya/gate guard
  işləyir); `.venv` və test nəticələri təmizləndi, repoya commit edilmədi.

**Tapşırıq:** ClickUp `86eyhk11z` bağlandı — https://app.clickup.com/t/86eyhk11z

**Diqqət:**
- `scripts/eval.py` işə salınmadan əvvəl: `pip install -r scripts/requirements.txt` və
  `.env` (bax `scripts/.env.example`: `MODEL`, `API_KEY`, `BASE_URL`, istəyə görə
  `PRICE_INPUT_PER_1M`/`PRICE_OUTPUT_PER_1M`).
- `evals/golden-set.jsonl` boşdur. 30 DİM şəkli çəkilib doldurulmayınca (`86eyhk10u`) harness
  yalnız `--set evals/fixtures.jsonl` ilə mənalı işləyir — nəticələr qapı hökmü vermir.
- `final_answer` yoxlanışı `word_problem` tipində canonical-da `$...$` daxilində tənlik yoxdursa
  `None` (yoxlanıla bilmədi) qaytarır, `False` yox — bu, dolayı denominatordan çıxarılır. Real
  golden-set doldurularkən mətn məsələlərinin `canonical`-ına lazım gələrsə tənlik əlavə edilməli
  ola bilər, əks halda son cavab dəqiqliyi metrikası mətn məsələlərini keçə bilər.
- `error_codes` enum-una toxunulmadı, `docs/DESIGN-TOKENS.json`-a toxunulmadı.

**Blok:** yoxdur — tapşırıq tam bitdi. Növbəti addım Ilkin-in əl işidir (`86eyhk10u`, `86eyhk12g`).

---

## 2026-08-05 (2) · Cowork → Claude Code

**Etdim:** `docs/FUTURE-IDEAS.md` — 4 gələcək funksiya (memory cards, gamification, lent alqoritmi,
leaderboard) qiymətləndirilib və saxlanılıb.

**Diqqət:** Bu fayl **tapşırıq deyil**. Heç biri Faza 4-dən əvvəl qurulmur. Kod yazma.
Yalnız Faza 2 sxem qərarlarında üç sətir nəzərə alınmalıdır:
- `problems` → `template_id` + `params` (variant generasiya mühərriki)
- `weekly_snapshots` cədvəli — irəliləyiş sonradan geriyə hesablana bilməz
- credits sxemi (əgər gələrsə) → **yalnız kosmetika, heç vaxt fayda**

---

## 2026-08-05 · Cowork → Claude Code

**Etdim:**
- Repo skeleti quruldu: `docs/`, `evals/`, `prompts/`, `design/`, `scripts/`
- `CLAUDE.md` — giriş faylı, fayl sahibliyi cədvəli, sessiya qaydaları
- `docs/STEP-SCHEMA.json` — LLM cavab müqaviləsi + `error_codes` enum-u (v1)
- `docs/DESIGN-TOKENS.json` — 9 dizayn faylındakı token drift-i həll edildi, kontrast düzəldildi
- `docs/DATA-MODEL.md` — Supabase sxemi (problems, solutions, attempts, step_errors, users)
- `docs/ARCHITECTURE.md` — keş-əvvəl boru xətti
- `docs/PRODUCT.md` — məhsul briefi, fazalar və qapı metrikaları
- `docs/decisions/ADR-001-ocr-pipeline.md` — OCR qərarı və araşdırma nəticələri
- `docs/decisions/ADR-002-design-tokens.md` — token drift-i və kontrast düzəlişi
- `prompts/solve-step.md` — addım generasiyası promptunun v1-i
- `evals/golden-set.jsonl` — 3 seed nümunə + format təsviri
- `design/` — 9 təsdiqlənmiş ekran maketi köçürüldü

**Tapşırıq:** ClickUp `Təhsil Platforması` folderi quruldu. Claude Code üçün açıq tapşırıq:

- **[86eyhk11z]** `scripts/eval.py` yaz — iki boru xəttini müqayisə edən harness
  (https://app.clickup.com/t/86eyhk11z)

Ilkin tərəfindəki əl işi (Claude Code gözləyir):
- **[86eyhk10u]** 30 DİM səhifəsini çək və `evals/golden-set.jsonl`-i doldur
- **[86eyhk12g]** Texo-nu 10 real şəkildə əl ilə yoxla (~30 dəq, texocr.netlify.app)

**Diqqət:**
- `error_codes` enum-u **dəyişməzdir**. Valideyn hesabatı, Test ekranı və Lent ona bağlıdır.
  Yeni kod lazımdırsa — ADR yaz, mövcud kodu yenidən adlandırma.
- `docs/DESIGN-TOKENS.json`-dakı `dark.t3` qəsdən `0.55`-dir (`0.45` deyil). WCAG AA kontrast
  düzəlişidir, "dizayn faylında belə idi" deyə geri qaytarma.

**Blok:** Faza 0 qapısı keçilməyib — Faza 1 kodlaşdırması başlamamalıdır.
