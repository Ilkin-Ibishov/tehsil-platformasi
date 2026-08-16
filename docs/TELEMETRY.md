# TELEMETRY — hadisə spesifikasiyası

> Faza 1-də bu, **məhsulun ikinci yarısıdır**. Şagird testi loqlama olmadan yalnız
> "xoşuma gəldi" cavabları verir. Bu sənəd `error_code` kimi **müqavilədir**:
> hadisə adları dəyişməz, əlavə olunur.

## Prinsip — suallardan başla, hadisələrdən yox

"Hər şeyi loqla" yanaşması 200 hadisə növü yaradır və heç biri analiz olunmur.
Aşağıdakı hər hadisə **konkret bir suala** bağlıdır. Sualı olmayan hadisə əlavə edilmir.

| # | sual | qərara təsiri |
|---|---|---|
| S1 | Qayıdırlarmı? | **Faza 1 qapısı**: 20 şagirddən ≥8-i 7 gündə ≥3 dəfə |
| S2 | Harada tərk edirlər? | funnel-in ən zəif halqası — növbəti sprint oraya gedir |
| S3 | Kəsmə ekranı işləyirmi? | `ADR-007`-nin əsas mərcidir; işləmirsə memarlıq dəyişir |
| S4 | Öyrənirlər, yoxsa köçürürlər? | məhsulun mövcudluq səbəbi |
| S5 | Səhv xəritəsi realdırmı? | `error_code` paylanması — valideyn hesabatının bütün dəyəri |
| S6 | Nə qədər baha? | `ADR-001` → abunə 200 həlldən sonra zərərdədir |
| S7 | Kifayət qədər sürətlidirmi? | 16.8 san ölçülüb; gözləmə zamanı tərk etmə nisbəti |
| S8 | İmtina qıcıqlandırırmı? | `ADR-006`/`ADR-007` imtina yolları — sonra nə edirlər? |

---

## Hadisə modeli

**Tək append-only cədvəl: `events`.** Yazmaq ucuzdur, silmək qadağandır, analiz oradan gəlir.
`DATA-MODEL.md`-dəki `attempts` və `step_events` **törəmə görünüşlərə** çevrilir — xam axın
həmişə bərpa oluna bilir, aqreqasiya isə yox.

Hər hadisə:

| sahə | qeyd |
|---|---|
| `event_id` | uuid, **klientdə** yaradılır → təkrar göndəriş təhlükəsizdir (upsert) |
| `device_id` | təsadüfi uuid, `localStorage`-da. Faza 1-də auth yoxdur — retensiya bununla ölçülür |
| `session_id` | tətbiqin bir açılışı |
| `attempt_id` | bir həll axını (kamera → həll → bitir). Ona bağlı hadisələr bir zəncirdir |
| `name` | `domen.hərəkət`, aşağıdakı dəyişməz siyahıdan |
| `ts_client` | klient saatı — **etibarsızdır**, yalnız `ts_server`-ə nisbətən delta üçün |
| `ts_server` | **həqiqi vaxt mənbəyi** |
| `props` | jsonb, hadisəyə xas sahələr |
| `app_version` | commit sha — hansı versiyada baş verdiyi |
| `schema_version` | hadisə sxeminin versiyası |

### Göndərmə qaydaları

1. **Klientdə buferlə, paketlə göndər.** Şagird mobil internetdədir; hər hadisəyə bir sorğu
   həm bahalıdır, həm itir. IndexedDB-də növbə, ~10 hadisə və ya ~10 saniyədə bir flush.
2. **Heç vaxt UI-ı bloklama.** Telemetriya sorğusu uğursuz olsa istifadəçi bilməməlidir.
3. **Offline-a davamlı.** İnternet kəsiləndə növbə saxlanılır, qayıdanda göndərilir.
   Şagirdin ən maraqlı sessiyası məhz internet pis olanda ola bilər.
4. **İdempotent.** `event_id` unikaldır; təkrar göndəriş dublikat yaratmır.
5. **Sempling YOXDUR.** Faza 1-də həcm kiçikdir, hər hadisə lazımdır.

### Məxfilik — istifadəçilər yetkinlik yaşına çatmayıb

`props`-a **heç vaxt** düşməyənlər: şəklin özü, şəklin hər hansı hissəsi, məsələnin mətni,
şagirdin yazdığı sərbəst mətn, ad/e-poçt/telefon.

Düşənlər: `problem_id`, `topic_code`, `error_code`, ölçülər, müddətlər, boolean-lar.
`device_id` təsadüfidir və şəxsiyyətə bağlanmır.

---

## Hadisələr

### Sessiya və retensiya → S1

```
app.opened              props: {cold_start: bool, locale, grade, tone}
app.backgrounded        props: {session_duration_sec}
invite_redeemed         props: {code}                          ← HANDOFF (81): dəvət kodu bu (kod, cihaz)
                                                                  cütündə İLK dəfə görüldü (server yazır,
                                                                  `invite_redemptions` cədvəli, yalnız
                                                                  ilk sətirdə atılır — eyni cihazdan təkrar
                                                                  açılışda YOX, fərqli cihazdan HƏR ZAMAN)
invite_redemption_failed props: {code, error}                  ← HANDOFF (82): `invite_redemptions`-a yazı
                                                                  uğursuz oldu (siqnal — axını bloklamır,
                                                                  sükutla itməsin deyə)
```

`S1` hesablanması: `device_id` üzrə fərqli günlərin sayı (`app.opened`). Retensiya (DAU/D1)
`attempts.student_ref` (= dəvət kodu) üzrə hesablanır, `device_id` YOX (ADR-012) — `device_id`
itsə/sıfırlansa bu ölçü qırılmır, yalnız `invite_redeemed`-in özü (diaqnostik, "hansı cihazdan
ilk açıldı") köhnəlmiş qalır.

### Həll axını funnel-i → S2, S3, S7

Ardıcıllıq. Hər addımda **tərk etmə** də hadisədir — yalnız uğuru loqlamaq ən çox rast gələn
telemetriya səhvidir.

```
capture.screen_opened
capture.permission_result      props: {granted: bool}
capture.permission_denied                                       ← S2: icazə rədd edilib, app çökmür, ekran göstərir
capture.photo_taken            props: {px_w, px_h, bytes, torch_used: bool}
capture.shutter_noop           props: {reason}                 ← HANDOFF (29): çəkiliş düyməsi basıldı,
                                                                  video hələ hazır deyildi (səssiz olardı,
                                                                  telemetriyasız görünməz idi)
capture.cancelled              props: {stage}                  ← tərk etmə

crop.screen_opened             props: {default_box_ratio}
crop.adjusted                  props: {adjust_count}           ← S3: neçə dəfə düzəltdi
crop.confirmed                 props: {crop_ratio, px_w, px_h, encode_ms}
                               ← encode_ms: YALNIZ kəsik JPEG wall (CropView.confirm →
                                 cropAndResize). Raw ADR-024 mount-da prefetch / best-effort —
                                 encode_ms-ə DAXİL DEYİL (HANDOFF 160+).
crop.cancelled                                                  ← tərk etmə

solve.requested                props: {attempt_id, image_bytes, encode_ms}
                               ← encode_ms: CropView-dən (crop.confirmed ilə eyni; crop-only)
solve.waiting_abandoned        props: {waited_ms}              ← S7, KRİTİK: 16.8 san gözləmədə çıxdı
solve.response                 props: {status, ocr_confidence, latency_ms, match_path,
                                       cost_usd, tokens_in, tokens_out, step_count,
                                       finish_wait_ms, llm_ms, storage_ms, db_ms, route_total_ms,
                                       cached_tokens}
                               ← finish_wait_ms: transcript.confirmed → cavab (klient)
                               ← llm/storage/db/route_total_ms: YALNIZ kaskad Qat 1 meta
                                 echo (transcribe cavabından); Qat 5-də əsasən null
                               ← cached_tokens: Qat 5 finish meta (explicit kontekst keşi);
                                 yoxdursa Qat 1 transcribe echo
solve.failed                   props: {reason, http_status, attempts, cost_usd, latency_ms,
                                       finish_wait_ms}
                               ← cost_usd/latency_ms: uğursuz Qat 5 belə LLM pulunu göstərir
solve.timeout                  props: {timeout_ms}             ← server yazır (SYSTEM-REVIEW §C2):
                                                                   LLM çağırışı ~45 san-da kəsildi,
                                                                   klient solve.failed görür, bura
                                                                   server-tərəfli SƏBƏB üçündür

problem.expanded               props: {step_index}             ← HANDOFF 116: həll ekranında
                                                                   yığılmış sual mətni açıldı.
                                                                   Tezlik Qat 1 / transkripsiya
                                                                   keyfiyyətinin proxy-sidir
                                                                   (`transcript.corrected`,
                                                                   `solution.reported_wrong`
                                                                   ilə korrelyasiya — ADR-025)
```

`match_path` (`hash`/`fingerprint`/`embedding`/`llm`) → **S6-nın əsas metrikası**.

### İmtina və seçim → S3, S8

```
refusal.shown                  props: {status, reason_code}
refusal.action                 props: {status, action: retake|recrop|abandoned}   ← S8

candidates.shown               props: {count, labels_present: bool}
candidates.picked              props: {index, total, time_to_pick_ms}
candidates.none_of_these                                        ← kəsməyə qayıtdı
```

**S3-ün əsas rəqəmi:** kəsmədən SONRA `candidates.shown` nisbəti. >20%-dirsə defolt
kəsmə çərçivəsi çox genişdir (`ADR-007`).

### Addım-addım həll → S2, S4, S5

```
step.shown                     props: {index, total, error_code}
step.answer_submitted          props: {index, correct: bool, attempt_no, input_kind,
                                       time_on_step_ms}
step.error_recorded            props: {index, error_code}      ← S5: səhv xəritəsinin mənbəyi
step.hint_opened               props: {index}
step.why_opened                props: {index}
step.token_tapped              props: {index, token}
step.abandoned                 props: {index, total}           ← S2: funnel-in harada qırıldığı

solution.completed             props: {steps_total, errors_total, duration_sec}
solution.answer_revealed       props: {at_step, of_total}      ← S4: köçürmə siqnalı
solution.reported_wrong                                         ← "həll səhvdir" düyməsi

render.latex_missing           props: {field: "final_answer"|"step"}  ← ADR-015: `latex`
                                                                          boşdur, `values[0]`/
                                                                          `explanation`-a geri
                                                                          dönülüb, tezliyi
                                                                          səssiz keçməməlidir
render.unformatted_latex        props: {field: "final_answer"|"step", token}  ← HANDOFF (55):
                                                                          `formatMath` cədvəli
                                                                          modelin lüğətindən
                                                                          geri qalır — çıxışda
                                                                          hələ `\əmr` qalıbsa
                                                                          (mətn yenə göstərilir,
                                                                          pozulmur) BURA yazılır,
                                                                          cədvəl ölçülənə görə
                                                                          böyüyür, təxminlə yox
```

### Transfer məsələsi → S4, ƏSAS ÖYRƏNMƏ METRİKASI

```
transfer.shown
transfer.answered              props: {correct: bool, time_ms}
transfer.skipped
```

`transfer.answered.correct` **məhsulun işlədiyinin yeganə birbaşa sübutudur.**
Şagird oxşar məsələni köməksiz həll edirsə, öyrənib. Qalan hər şey vasitəlidir.

### OCR keyfiyyəti → S3

⚠️ **Aşağıdakı `ocr.correction_*` adları HEÇ VAXT KODA DÜŞMƏDİ.** Kaskad (`ADR-020`) gələndə
transkripsiya təsdiq ekranı ayrıca bir mərhələyə çevrildi və hadisələr `transcript.*` adı ilə
yazıldı. Planlanan adlar tarixi qeyd kimi saxlanılır, **canlı taksonomiya `transcript.*`-dır**:

```
transcript.shown               props: {ocr_confidence, transcribe_wait_ms,
                                       llm_ms, storage_ms, db_ms, route_total_ms, cached_tokens}
                               ← transcribe_wait_ms: solve.requested → transcript.shown (klient)
                               ← llm/storage/db/route_total_ms: server `/transcribe` meta
transcript.confirmed           props: {corrected: bool}    ← "Düzdür" — `corrected` mətnin
                                                              dəyişib-dəyişmədiyini deyir
transcript.corrected           props: {}                   ← şagird mətni redaktə etdi →
                                                              fon sorğusu abort, YENİ sorğu
transcript.rejected            props: {}                   ← "Bu mənim məsələm deyil"

### Kaskad server (ADR-020) → S6

```
solve.cascade                  props: {
                                 layer, match_path, declined,
                                 transcribe_cache_hit, transcribe_cost_usd, transcribe_latency_ms,
                                 transcribe_storage_ms, transcribe_db_ms, transcribe_route_total_ms,
                                 layer_cost_usd, layer_latency_ms, total_cost_usd,
                                 has_figure, ocr_confidence, attempt_kind, soak_provider,
                                 persist_ok
                               }
                               ← transcribe_*_ms: klientin ötürdüyü Qat 1 parçalanma (telemetriya)
                               ← persist_ok: false olanda layer cavabı var, DB/yoxlama fail
                               ← layer=none: həll qurulmayıb (layer_cost yox)
```
```

~~`ocr.correction_offered` / `ocr.correction_made` / `ocr.correction_skipped`~~ — planlandı,
yazılmadı.

`ocr_confidence: low` ilə `transcript.corrected` arasındakı korrelyasiya təsdiq ekranının
tetikleyicisinin düzgün olub-olmadığını göstərir.

### Test bankı → S2, S5

```
bank.list_loaded               props: {count}
bank.question_selected         props: {question_id, topic_code, grade}
```

Bank axını kamera axınından AYRIDIR — `match_path` həmişə bank-dır, LLM xərci sıfırdır.
Funnel müqayisəsində bu iki mənbəni qarışdırma.

### Limit → S8

```
limit.blocked                  props: {daily_count}
cost.ceiling_hit                props: {daily_cost_usd, ceiling_usd}  ← SYSTEM-REVIEW §C1:
                                                                          QLOBAL tavan, tək
                                                                          device_id-dən ayrı
                                                                          (bax DAILY_COST_CEILING_USD)
```

**Yoxlanılacaq invariant:** `refusal.*`, `candidates.*` və `crop.*` hadisələri limit
sayğacını artırmamalıdır (`ADR-007`). Bu, telemetriya ilə **yoxlanmalıdır**, kod
rəyinə güvənilməməlidir.

### Klient xətalarının görünürlüyü (HANDOFF 81) — üçüncü tərəf aləti (Sentry və s.) OLMADAN

```
client.error                   props: {message, filename, lineno, colno, stack}
client.unhandled_rejection     props: {message, stack}
```

`window.addEventListener('error'/'unhandledrejection')` — `lib/telemetry/index.ts →
initTelemetry()`. `message`/`stack` 500/2000 simvola KƏSİLİR (növbəyə gözlənilməz həcm
düşməsin). Bunlar JS runtime xətalarıdır — şəkil/həll/cavab MƏZMUNU BURAYA HEÇ VAXT
gəlmir.

---

## Faza 1-də hazır olmalı üç sorğu

Dashboard lazım deyil; üç SQL kifayətdir və hər gün baxılır.

**1. Qapı (S1)**
```sql
select count(*) from (
  select device_id from events
  where name = 'app.opened' and ts_server > now() - interval '7 days'
  group by device_id having count(distinct date(ts_server)) >= 3
) t;
```

**2. Funnel (S2)** — hadisə adları üzrə unikal `attempt_id` sayı, `capture.photo_taken`-dən
`solution.completed`-ə qədər. Ən böyük düşüş növbəti sprintin mövzusudur.

**3. Vahid iqtisadiyyat (S6)** — `match_path` paylanması + orta `cost_usd`.
`ADR-001`-ə görə `llm` payı 3 aydan sonra <30% olmalıdır.

---

## Nə loqlamırıq (bilərəkdən)

- Hər düymə klikini. Sualı olmayan hadisə şum yaradır.
- Skroll dərinliyi, mouse hərəkəti, heatmap. Faza 1-də cavab verdiyi sual yoxdur.
- Üçüncü tərəf analitika SDK-sı. Yetkinlik yaşına çatmayan istifadəçilər + öz DB-mizdə
  onsuz da hər şey var. Xarici SDK məxfilik səthini genişləndirir və heç nə əlavə etmir.
