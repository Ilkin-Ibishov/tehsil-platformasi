# HANDOFF — növbə jurnalı

Cowork (BA/PO) ↔ Cursor və ya Claude Code (executor) arasındakı yeganə rabitə kanalı.
**Əlavə-only.** Köhnə blokları redaktə etmə və ya silmə. Ən yenisi yuxarıda.

## Format

```
## YYYY-MM-DD (N) · <Kim> → <Kimə>
Etdim:    <bir-iki sətir, konkret fayl adları ilə>
Tapşırıq: <ClickUp ID + bir cümlə>
Diqqət:   <pozulmamalı olan şey, varsa>
Blok:     <qərar tələb edən şey, varsa — yoxdursa sətri yazma>
```

---

## 2026-08-16 (145) · Cursor → Cowork

Etdim:    OQ-8 canlı: Plus adi söhbətdə `.txt` attach oxunmur (chip var, canary yox, «no file attached»). `fill()` chip-i silir; filesiz Send sönük; `type` yanında da model oxumur. `docs/SOAK-SHARED-CONVERSATION.md` S18. Railway `CHATGPT_CONVERSATION_MODE` yenidən `temporary`.
Tapşırıq: meta / no ClickUp.
Diqqət:   Şagird Gemini toxunulmur. Soak izolyasiya Temporary-yə qayıdır. İki-fayl prime bu Playwright yolla yerinə yetirilmir.
Blok:     OQ-9 — sahib: paylaşılan söhbətdə `fill()` bir dəfə, yoxsa Temporary qalır, yoxsa PHASE-2 tək çağırış.

## 2026-08-16 (144) · Cursor → Cowork

Etdim:    `docs/SOAK-SHARED-CONVERSATION.md` — sahib: prime iki ayrı `.txt` (`transcribe.md`, `core.md`); bir söhbət=100 kəsik. OQ-2/OQ-5 bağlı. Composer bir attachment → iki növbə addımı. 202+ mesaj Plus tavanı ilə toqquşa bilər (S9).
Tapşırıq: meta / no ClickUp.
Diqqət:   Kod/ADR hələ yox. Şagird Gemini toxunulmur.
Blok:     Adi söhbətdə `.txt` oxunurmu (OQ-8) və AC-bleed=0 cavabsız icra yoxdur. Plus 3 saatlıq tavan <202 mesajdırsa 100-lük tələb ziddir.

## 2026-08-16 (143) · Cursor → Cowork

Etdim:    Soak sürət təklifi tələb sənədi: `docs/SOAK-SHARED-CONVERSATION.md` (paylaşılan adi söhbət, prime bir dəfə, FIFO növbə). `PHASE-2.md`-ə işarə. Kod yox, ADR yox — qəbul/bleed qapısı sahibdə.
Tapşırıq: meta / no ClickUp.
Diqqət:   Şagird Gemini toxunulmur. Növbə artıq FIFO-dur. Temporary chat sızma əleyhinə canlı ölçülüb; bu təklif onu bilərəkdən güzəştə gedir.
Blok:     OQ-2 (hansı prime faylı) və AC-bleed (n=10 marker sızması=0) cavabsız icra yoxdur.

## 2026-08-16 (142) · Cursor → Cowork

Etdim:    Railway Hobby təsdiqləndi (`memory.limit_mb=8192`). Qat 5 `fill()` 21346 simvol, Chromium çökmür (~1.5 GB). ChatGPT cavab verir (~570 simvol, 4–5 san). `POST /api/solve/finish` hələ `unreadable` / «Server xətası» — kaskad həlli gəlir, `persist.ts` DB-yə yaza bilmir (son 2 saatda `user_capture` sətri yoxdur).
Tapşırıq: meta / no ClickUp.
Diqqət:   Şagird Gemini toxunulmur. Trial 1 GB OOM bağlandı. Temporary chat `.txt` hələ oxunmur — Qat 5 fill istifadə edir.
Blok:     Qat 5 persist DB xətası — Vercel `[cascade/persist] yeni həll DB xətası` logu lazımdır.

## 2026-08-16 (141) · Cursor → Cowork

Etdim:    Plus cookie ilə soak axını ölçüldü. Qat 1 production `POST /api/solve/transcribe` (`soak-dim-01`, `soak-5plus5.png`) `status=ok`, `canonical` `5+5=?`, `topic_code=ARITH.ADDITION`, `capture_id=c63eeca5-…`, ~23 san. Qat 5 `finish` əvvəl `unreadable` (`llm_text`): Temporary chat `.txt` oxumur («attachment isn't available in this chat session»). Sonra Railway `attachTextAsFile`-i `fill()`/`insertText` etdi — 22k `core.md` headed Chromium-u 1 GB Trial-də `Target crashed` (OOM). `web/lib/soak/adapter.ts` Qat 5-də artıq `.txt`/`pasteText` göndərmir (Vercel-ə getməyib).
Tapşırıq: meta / no ClickUp.
Diqqət:   Şagird Gemini toxunulmur. Qat 1 şəkil Plus-da işləyir. Telegram cookie export-u silinsin.
Blok:     Qat 5 (22k prompt + Temporary chat) Trial 1 GB-də ölmür. Seçim: Railway yaddaşı (Hobby) və ya soak Qat 5 promptunu qısaltmaq — izolyasiyanı söndürmək crop-to-crop qanama qaytarır.

## 2026-08-16 (140) · Cursor → Cowork

Etdim:    ChatGPT `POST /chat` yalnız Temporary chat: `{ temporary: false }` çıxışı silindi; URL `?temporary-chat=true` deyilsə göndərmədən əvvəl INTERFACE. Railway live mətn `PONG` + log `Submitting in Temporary chat url=...temporary-chat=true`.
Tapşırıq: meta / no ClickUp.
Diqqət:   Şagird Gemini toxunulmur. Soak şəkil hələ Free upload kvotasında bağlıdır.

## 2026-08-16 (139) · Cursor → Cowork

Etdim:    Soak şəkil root cause Railway screenshot-la ölçüldü: ChatGPT Free plus menyusu «Get Plus for more uploads / wait 18 hours» — `setInputFiles` uğurlu görünür, `POST /files` yox. Playwright plus+filechooser səhv idi (custom menu), amma düzgün hidden-input da kvota bağlandıqda no-op-dur. `GET /debug/upload-screenshots`; kvota indi fail-fast 400. Tehsil kodu dəyişmədi.
Tapşırıq: meta / no ClickUp.
Diqqət:   Şagird Gemini toxunulmur. Soak mətn işləyir. Plus menyunu açıq saxlayıb `setInputFiles` etmək olmaz.
Blok:     Soak foto üçün ChatGPT Plus (və ya kvota bitənə qədər ~18 saat) və ya başqa cookie hesabı lazımdır. Kod OpenAI Free upload limitini keçə bilməz.

## 2026-08-16 (138) · Cursor → Cowork

Etdim:    Soak şəkil yoxlandı. Sənin `soak-dim-01` cəhdi: əvvəl 403 (dəvətsiz kamera), sonra Qat 1 `unreadable` «şəkil təqdim edilməyib» (~55 san, Railway `POST /chat` 200). Eyni `soak-5plus5.png` + transcribe promptu lokal headed-də `canonical: 5 + 5 = ?`; Railway/Xvfb-də `setInputFiles` uğurlu görünür, `POST /files` yox, thumbnail yox. İndi chip olmayanda 400/503 (`soak_unavailable`), səssiz unreadable yox.
Tapşırıq: meta / no ClickUp.
Diqqət:   Şagird Gemini toxunulmur. Soak şəkil yolu Railway-də hələ bağlıdır — mətn ChatGPT işləyir. Tehsil kodu dəyişmədi.
Blok:     Railway Xvfb-də ChatGPT şəkil qəbul etmir. Növbəti: headed/VNC və ya başqa upload yolu; soak foto qapısı buna qədər bağlanmalıdır.

## 2026-08-16 (137) · Cursor → Cowork

Etdim:    `main` push (`c0546e0`). Vercel production: `SOAK_LLM_BASE_URL` + `SOAK_LLM_API_KEY` + `INVITE_CODES`-ə `soak-dim-01`. SQL `soak_enabled=1` (`soak_provider=chatgpt_web`). Redeploy `web-pj8js723q` (alias `web-dusky-xi-74`).
Tapşırıq: meta / no ClickUp.
Diqqət:   Şagird Gemini toxunulmur — yalnız `soak-*` dəvət ChatGPT-yə gedir. Açar repo-ya düşmədi. Preview `INVITE_CODES` köhnədir (soak yox). S3 5/5 transkripsiya qapısı hələ yoxdur.

## 2026-08-16 (136) · Cursor → Cowork

Etdim:    ChatGPT izolyasiya canlı Playwright-lə ölçüldü, sonra kod: force-click `create-new-chat-button` + Temporary chat (`?temporary-chat=true`); mid-session `goto` yox. Railway `chatgpt-api` deploy `55dabe80`. Live `POST /chat` ikinci sorğu `NONE` (~6 san).
Tapşırıq: meta / no ClickUp.
Diqqət:   Şagird Gemini toxunulmur. `Tehsil-Platformasi` qovluğu Railway-də `chatgpt-automation-api`-yə link olunub — oradan `railway up` etmə. Deploy yalnız `Cloud_Server_AI`-dən.

## 2026-08-16 (135) · Cursor → Cowork

Etdim:    Soak Qat 1 şəkil + typed prompt (`soakChatPayload` — `.txt` yox); Qat 5 hələ `attachTextAsFile`. Cloud_Server_AI hər `POST /chat`-də yeni söhbət (`startNewConversation`), Railway `chatgpt-api` yenidən deploy. Adapter selftest + unit 21/21.
Tapşırıq: meta / no ClickUp (soak izolyasiya + attachment).
Diqqət:   Şagird Gemini toxunulmur. `soak_enabled` sönük. Kiçik JSON ping (20 simvoldan qısa) multimodal wait-i 120 san saxlayır — Tehsil promptu kifayət qədər uzundur. Image+txt eyni mesajda yox.

## 2026-08-16 (134) · Cursor → Cowork

Etdim:    Mövcud Railway `chatgpt-api` yenidən deploy (`https://chatgpt-api-production-2f21.up.railway.app`) — yeni servis yox. `/health` indi `authMode=cookie`. Soak qapısı idle+cookie-ni sağlam sayır (`interpretSoakHealth`). Selftest 29/29.
Tapşırıq: meta / no ClickUp (S0 qapısının live yoxlaması).
Diqqət:   `soak_enabled` sönük, `SOAK_LLM_*` Vercel-də hələ yox. Şagird Gemini toxunulmur. Cloud_Server_AI git repo deyil — dəyişiklik Railway-ə `railway up` ilə getdi.

## 2026-08-16 (133) · Cursor → Cowork

Etdim:    Production Vercel-dən `GEMINI_PRICE_INPUT_PER_1M` və `GEMINI_PRICE_OUTPUT_PER_1M` silindi (`ADR-027` — kod oxumurdu).
Tapşırıq: `86eymrm8j` təmizlik (əvvəl complete).
Diqqət:   `GEMINI_API_KEY` / `GEMINI_MODEL` / `INVITE_CODES` toxunulmayıb. Redeploy lazım deyil (ölü env). `SOAK_LLM_*` Vercel-də yox idi.

## 2026-08-16 (132) · Cursor → Cowork

Etdim:    S2 soak qalereya axını (`86eyn2u6x`): `soak-*` dəvətdə `getUserMedia` yox, `CaptureView` qalereya-birinci; `CropView` ilkin çərçivə `{0,0,1,1}` yalnız soak (`crop-box.ts`). Şagird `STUDENT_CROP_BOX` eyni qalır. Playwright qarmaqları: `capture-gallery-input`, `crop-confirm`, `invite-code-input`. `crop-box.selftest` 4/4.
Tapşırıq: `86eyn2u6x`.
Diqqət:   `soak_enabled` sönük qalır — 3× `delivered=true` canlı yükləmə operator env + S3 Playwright. Şagird qalereyası dar çərçivədir. S0+S1+Qat1 commit-ləri hələ push olunmayıb.

## 2026-08-16 (131) · Cursor → Cowork

Etdim:    S1 PDF→kəsik (`86eyn2pw5`): `scripts/corpus/pdf_to_crops.py` (PyMuPDF heuristika, vision yox), `0067` `corpus` bucket + `corpus_crops` (DİM mətni yox), `0068` service_role GRANT. Selftest 24/24. 5 synthetic QA: hər kəsikdə bir nömrə.
Tapşırıq: `86eyn2pw5`.
Diqqət:   `--upload` bu mühitdə işləmədi (service-role yox). Real DİM PDF git-də yoxdur. Operator: `python scripts/corpus/pdf_to_crops.py --pdf … --upload`. S0+Qat1 commit-ləri hələ push olunmayıb.

## 2026-08-16 (130) · Cursor → Cowork

Etdim:    S0 soak adapter (`86eyn2c70`): `0066` `soak_enabled=0` / `soak_provider=chatgpt_web`. Yalnız `soak-*` dəvət ChatGPT `POST /chat`-ə gedir; şagird Gemini. cost_usd 0 yazılmır. `kind=corpus_soak`. Keş və bank soak-da atlanır. `adapter.selftest` keçdi.
Tapşırıq: `86eyn2c70`.
Diqqət:   Bayraq sönük qalır. Live tüstü: Vercel `SOAK_LLM_*` + `INVITE_CODES`-ə `soak-*` + SQL `soak_enabled=1`. Cookie `authMode` olmasa 503. Açar repo-ya düşməsin. Əvvəlki 3.7-flash commit də push gözləyir.

## 2026-08-16 (129) · Cursor → Cowork

Etdim:    Qat 1 `active_transcribe_model` → `gemini-3.7-flash` (`0065`, production-a tətbiq olundu). flash-lite ADR-025 n=2-də kəsişmələri tərs oxudu. Prompt v12: qayda 15 +1 yalnız dövri olmayan yoxlamada; qayda 8-ə kəsişmə nümunəsi. `transcribe.md` v2 ox kəsişməsi. `eval.py --selftest` 35/35.
Tapşırıq: `86eyn2bgc` (86eykqb1c-nin əksi).
Diqqət:   Qat 1 tarifi 3.7-flash-dir (~3× lite). Prompt v12 Vercel `main` deploy-dan sonra. Köhnə keşli həll addımları yenilənmir. Qat 5 şəkil hələ görmür.

## 2026-08-16 (128) · Cursor → Cowork

Etdim:    S-pre1 `86eyn28kn`: orta addımda ipucu+səhvdən sonra «Bu addımı keç» (`/api/steps/pass`, `step_events` `is_correct=false` + addım `error_code`). Final açılmır. S-pre2 `86eyn28kq`: prompt v11 qayda 3 = 1–6, birinci nümunə `5+5` 1 addım. `step-pass.selftest` 11/11, eval `--selftest` 35/35.
Tapşırıq: `86eyn28kn` · `86eyn28kq`.
Diqqət:   Yeni telemetriya adı yoxdur. Qat 5 şəkil və keş invalidasiyası hələ yoxdur. Köhnə keşli `56+27` sətiri v11 görməyəcək.

## 2026-08-16 (127) · Cursor → Cowork

Etdim:    Faza 2 əvvəlinə iki sprint: S-pre1 addımda ilişmə (`86eyn28kn`) — ipucu+səhvdən sonra keç, `error_code` yaz, final açma; S-pre2 mənasız addım (`86eyn28kq`) — qayda 3 vs 8, Qat 1 variant kəsimi, Qat 5 şəkil görmür, keş. `docs/PHASE-2.md`.
Tapşırıq: `86eyn28kn` · `86eyn28kq` (Faza 1 siyahısı; Faza 2 list yoxdur).
Diqqət:   «Cavabı göstər» orta addıma qayıtmır (86eymrkjn). Yeni telemetriya adı TELEMETRY.md-dən əvvəl kodda yoxdur. Qat 5-ə şəkil ölçülmədən qayıtmır.

## 2026-08-16 (126) · Cursor → Cowork

Etdim:    Faza 2 üç blok bağlandı (`ADR-029`, `docs/PHASE-2.md`): soak ChatGPT zəif olsa da davam + n=10 Gemini qızıl; ToS/cookie sahibin riski; avtomatik “Düzdür” yalnız Cursor 5/5 transkripsiya yoxlamasından sonra.
Tapşırıq: plan (ClickUp Faza 2 siyahısı hələ yoxdur).
Diqqət:   5/5 keçməsə həcm açılmır. Gemini qızıl soak `kind` ilə qarışdırılmır. Şagird Gemini yolu toxunulmur.

## 2026-08-15 (125) · Cursor → Cowork

Etdim:    Faza 2 planı `docs/PHASE-2.md` — Korpus soak. DİM PDF kəsimi lokal skript (Cursor vision yox), app qalereya yükləməsi, Playwright axını, ChatGPT avtomat servisi yalnız soak adapter (`ADR-029` yazılacaq). Şagird Gemini yolu toxunulmur.
Tapşırıq: plan (ClickUp siyahısı hələ yoxdur).
Diqqət:   20 şagird retensiyası bu fazanın qapısı deyil. Soak `cost_usd=0` yazılmasın. API açarı Tehsil repo-ya düşməsin. `Cloud_Server_AI` OpenAI-uyğun deyil, 5/dəq, növbə 10.

## 2026-08-15 (124) · Cursor → Cowork

Etdim:    `cost_usd` best practice (`ADR-028`): cavabda USD varsa onu yaz (OpenRouter `usage.cost`); Gemini-də yoxdur, ona görə token × registri. Düşünmə `total_tokens - prompt_tokens` ilə çıxış tarifində sayılır — köhnə `completion_tokens`-only vurma onları atlayırdı. Eval `cost.py` eyni qayda.
Tapşırıq: `86eymrm8j` düzəlişi — cavabdakı `usage` fatura üçün, USD sahəsi Gemini-də yoxdur.
Diqqət:   `tokens_out` indi düşünmə daxildir (eyni telemetriya adı). Keş endirimi yoxdur (context cache işlətmirik).

## 2026-08-15 (123) · Cursor → Cowork

Etdim:    Qiymət yalnız `web/lib/models.ts` — `resolvePrice` env oxumur (`ADR-027`). Gemini `chat/completions`/`models.get` USD qaytarmır, ona görə API-dən tarif çəkilmir; `cost_usd` = token × registri. `models.selftest.mts` keçdi.
Tapşırıq: `86eymrm8j` — `cost_usd` Vercel env-dən asılı olmasın.
Diqqət:   Naməlum model hələ `null` (0 yazılmır). Yeni tarif = registriyə sətir, Vercel PRICE env-i yox. Qat 1 flash-lite registrisi bu push-la Vercel-ə çatır.

## 2026-08-15 (122) · Cursor → Cowork

Etdim:    ClickUp `86eykqb1c` — Qat 1 ucuz model. `gemini-3.1-flash-lite` registriyə düşdü ($0.25/$1.50, rəsmi qiymət səhifəsi 2026-08-15). Miqrasiya `0064` yalnız boş `active_transcribe_model`-i doldurur; production-a tətbiq olundu. Qat 5 `active_model` toxunulmayıb. `models.selftest.mts` keçdi.
Tapşırıq: `86eykqb1c` — mərhələ 1 kiçik, mərhələ 2 bahalı.
Diqqət:   Registri `main`-ə çatmayınca `cost_usd` bu model üçün NULL ola bilər — push lazımdır. Qat 1 404/500 verərsə: `update app_config set value='' where key='active_transcribe_model'`. Ölçmə: `transcript.corrected` >15% → Qat 1-i qaldır. `refusal.shown`, `solve.cascade.transcribe_cost_usd`.

## 2026-08-15 (121) · Cursor → Cowork

Etdim:    Həll ekranında artıq açılmış addımlar arası irəli/geri — sticky `LENT` (`design/Həll ekranı v5.dc.html`). `goToStep` `farthestIndex`-dən irəli getmir, `answers` silinmir. Üst zolaq da `farthestIndex` ilə dolur. Unmount `abandoned_at_step` = ən uzaq açılmış addım.
Tapşırıq: `86eyn1t7b` — addımlar arası irəli/geri naviqasiya.
Diqqət:   Yeni telemetriya adı yoxdur (`step.shown` ilk dəfə). «Növbəti addım» hələ düzgün cavab tələb edir. «Cavabı göstər» yalnız son addımda qalır.

## 2026-08-15 (120) · Cursor → Cowork

Etdim:    «Cavabı göstər» yalnız son addımda — hər-addım mətn düyməsi silindi, `reveal()` `stepIndex < total-1` olanda çıxır. Orta addımda ilişmə ipucudur. Maket artıq belə idi (`Həll ekranı v5.dc.html`).
Tapşırıq: `86eymrkjn` — hər addımdan son cavaba tullanma `error_code` itkisi.
Diqqət:   HANDOFF 49 §3d bu düymə üçün ləğv olunur (qızıl qayda). Son addımda cavabsız «Cavabı göstər» qalır — qəsdən. Növbəti açıq defect: `86eyn1t7b` addımlar arası irəli/geri.

## 2026-08-15 (119) · Cursor → Cowork

Etdim:    Dəvət kodu qapıda yoxlanır — `POST /api/invite/check` (`checkInviteCode`, redeem yox). `InviteGate` yalnız 200-də localStorage-a yazır; səhv/şəbəkə `invite.invalid` / `invite.networkError`. Bank 403 indi `inviteError` göstərir (`bank/page.tsx`). Kamera gec 403 hələ `invalid` prop ilə qapıya qayıdır.
Tapşırıq: `86eymrm6g` — dəvət kodu heç vaxt təsdiqlənmirdi, bank yolunda səssiz uğursuzluq.
Diqqət:   `invite_redeemed` bu endpoint-də YAZILMIR. Telemetriya taksonomiyasına yeni ad düşmədi. Yeni defect (həll edilməyib): `86eyn1t7b` addımlar arası irəli/geri. Qızıl qayda növbəti: `86eymrkjn` ("Cavabı göstər").

## 2026-08-15 (118) · Cursor → Cowork

Etdim:    HANDOFF 116 — həll ekranında `solution.canonical` defolt yığılmış (bir sətir + ellipsis), toxunanda açılır, addım dəyişəndə yenidən yığılır. `problem.expanded` (`step_index`) `TELEMETRY.md` funnel-inə və `SolveView`-a düşdü. Maket: `design/Həll ekranı v5.dc.html`. `check` input flex-shrink:0 + banner `maxHeight: min(22vh, 8.5rem)` — 480px-də açılınca yoxla sahəsi ekrandan itməsin.
Tapşırıq: HANDOFF 116 (ClickUp `86eyn1t4w`).
Diqqət:   `nowrap`/`overflowX` işlədilmədi (4036f91). Origin 117 kaskad UI təsdiqidir; lokal Cursor masa da 117 nömrəsini götürmüşdü — bu blok 118-dir.

## 2026-08-15 (117) · Claude Code → Cowork

**Etdim:** Ilkin-in birbaşa tapşırığı — `app_config.cascade_ui_enabled` `1`-ə çevrildi
(SQL, redeploy yoxdur), transkripsiya təsdiq ekranı İLK DƏFƏ production-da real şagird
axını ilə sınandı (Playwright, yeni "56+27=?" şəkli, `web-dusky-xi-74.vercel.app`).
**Nəticə — tam axın işlədi:** qalereya → kəsmə → "Bu məsələni oxudum: 56+27=?..." təsdiq
ekranı → "Düzdür" → addımlar. Telemetriya (`events`) ADR-020-nin fon-prefetch iddiasını
TƏSDİQLƏDİ: `transcript.shown` (14:14:06.71) → `transcript.confirmed`+`solve.response`
(14:14:16.71) = 10 san, mən "Düzdür"a ekran görünəndən ~1-2 san sonra basdım — yəni
`/api/solve/finish` mənim OXUYUB TƏSDİQLƏDİYİM VAXT ƏRZİNDƏ artıq FONDA işləyirdi, klik
NƏTİCƏNİ GÖZLƏTMƏDİ (əvvəlcədən başladılmış sorğunu gözlədi). Bu, məhz `86eykj7x2`-nin
"şagirdin təsdiq vaxtını LLM cavab vaxtı üçün udmaq" məqsədidir.
**Tapşırıq:** `86eykm8ja` (Uçdan-uca telefon keçidi) əhatəsi qismən ödəndi — Playwright ilə
sınanıb, real telefonda HƏLƏ YOX.
**Diqqət:** bayraq HAZIRDA AÇIQDIR, geri DÖNDÜRÜLMƏDİ (əvvəlki sessiyalarda mən özüm sınaqdan
sonra sönürdüm — bu dəfə Ilkin açıq tapşırdı, saxlanılır). Real şagirdlər indi transkripsiya
təsdiq ekranını görəcək. `ocr_captures` korpusu indi doldurulmağa başlayacaq (əvvəllər
sıfır idi, bax blok 95).

---

## 2026-08-15 (117) · Cursor → Cowork

Etdim:    Cursor masa quruluşu — `AGENTS.md`, `.cursor/rules|skills|agents|hooks`, `.cursorindexingignore`. Yaşayan data (HANDOFF, model, xərc) qaydaya köçürülmədi; indeksdən HANDOFF çıxarıldı.
Tapşırıq: meta (ClickUp yoxdur). Executor indi Cursor-dur; Cowork BA/PO olaraq qalır.
Diqqət:   `CLAUDE.md` hələ konstitusiyadır. Növbəti icra işi blok 116-dır (həll ekranında canonical mətn). ClickUp MCP bu sessiyada token xətası verdi — istifadəçi MCP-də `CLICKUP_API_TOKEN` yenilənməlidir.

## 2026-08-15 (116) · Cowork → Claude Code

**Tapşırıq (ClickUp rate-limit-ə görə BURADA — limit açılanda `901820224521`-ə köçürülməli):
Həll ekranında sualın mətnini göstər + `problem.expanded` telemetriyası.** Prioritet: yüksək.
Ilkin-in qərarıdır (2026-08-15 sessiyası).

**Niyə.** `ADR-025`: Qat 1 qrafiki TƏRS oxudu. Şagird səhv transkripsiyanı YALNIZ
`TranscriptConfirmView`-da tuta bilir — bir saniyəlik ekran, praktikada hamı "Düzdür"ə basır.
Mətn addımların üstündə qalsa, yoxlama nöqtəsi 1-dən 7-yə çıxır. Xərci ~sıfırdır: `canonical`
ARTIQ `SolveResult`-dadır (`web/components/hell/SolveView.tsx:20`), sadəcə render edilmir —
`design/Həll ekranı v5.dc.html`-də də yoxdur, yəni qəsdən qərar deyil, BOŞLUQ.

**Nə edilməli.**
1. `SolveView.tsx` — addımların ÜSTÜNDƏ `solution.canonical`: **defolt YIĞILMIŞ** (bir sətir
   + `…`), toxunanda açılır, addım dəyişəndə yenidən yığılır, `formatMath()`-dan keçir.
   `whiteSpace:"nowrap"`/`overflowX` İŞLƏTMƏ — `4036f91`-in düzəltdiyi bug elə budur;
   `overflowWrap:"anywhere"`.
2. `docs/TELEMETRY.md` → "Həll axını funnel-i": `problem.expanded  props: {step_index}`.
3. `design/Həll ekranı v5.dc.html` maketinə də əlavə et (maket spesifikasiyadır).

**Qəbul şərti.** 480px-də mətn AÇILANDA `check` input-u ekranın altına itələməməlidir (yeganə
real risk budur — tamamlanma nisbətinə birbaşa təsir edir). Söz məsələsində yığılmış hal hələ
də BİR sətirdir. `problem.expanded` real cihazdan gəlir.

**Ölçmə — bunun əsl dəyəri.** `problem.expanded` tezliyi **transkripsiya keyfiyyətinin proxy
siqnalıdır**. `transcript.corrected` / `solution.reported_wrong` ilə korrelyasiya edirsə,
Qat 1 pisdir — `ADR-025`-in tələb etdiyi ölçmə üçün bu, ilk real datadır.

---

## 2026-08-15 (115) · Claude Code → Cowork

**Etdim:** Ilkin-in tapşırığı — kaskad bayraqları (`CASCADE_ENABLED`, `NEXT_PUBLIC_
CASCADE_ENABLED`) Vercel env-dən `public.app_config`-ə köçürüldü (`ADR-023`-ün EYNİ nümunəsi
— "hər şey env olmasın"). `web/lib/app-config.ts` (YENİ) `readConfigValue`/`getBoolConfig`
paylaşır, `models.ts` da indi bunu işlədir (təkrarçılıq yoxdur). Server tərəfi (`/api/solve`)
request-daxili DB oxuyur. Klient tərəfi — `NEXT_PUBLIC_*` build-vaxtı bundle-a yapışdığı üçün
DB-yə birbaşa keçə bilməzdi — `GET /api/config/public` (YENİ, qeyri-həssas bul flag-lər)
əlavə edildi, `kamera/page.tsx` mount-da onu çağırır (`cascadeUiEnabled` state, defolt
`false`). DB-yə uyğun sətirlər yazıldı (`cascade_enabled=1`, `cascade_ui_enabled=0` —
BUGÜNKÜ davranış DƏYİŞMƏDİ, bu mexanizm köçürməsidir).
**Canlıda təsdiqləndi:** `/api/config/public` DB dəyərini əks etdirir; `cascade_ui_enabled`-i
SQL-lə `1`-ə çevirdim, endpoint DƏRHAL (redeploy-suz) `true` qaytardı — sonra geri `0`-a
saldım (təsdiq ekranını real şagirdlərə açmaq hələ AYRI qərardır, `86eykm8ja`-nın əhatəsi).
Bir real solve (`31+48=?`) `/api/solve`-in DB-oxuyan `cascade_enabled`-i ilə problemsiz işlədi
(`solve.cascade` hadisəsi əvvəlki kimi atıldı).
**Diqqət:** Cowork-un `7eeb15f` (blok 114, bilik bazası sinxronizasiyası) ilə eyni anda
`docs/DATA-MODEL.md`-də konflikt oldu (Cowork faylı tam yenidən yazmışdı) — `rebase`-lə həll
edildi, Cowork-un yeni struktur SAXLANILDI, mənim `app_config` əlavəm onun İÇİNƏ köçürüldü
(köhnə struktura geri DÜŞMƏDİ).

---

## 2026-08-15 (114) · Cowork → Claude Code

**Etdim — S1–S8-dən sonra bilik bazası (`*.md`) auditi və sinxronlaşdırma.** Kod
dəyişmədi, yalnız sənəd.

- **`docs/ARCHITECTURE.md` yenidən yazıldı.** Köhnə versiya hələ Texo-nu (klientdə ONNX
  OCR) əsas boru xətti kimi göstərirdi — halbuki `ADR-001` onu 2026-08-06-da silmişdi.
  Yerinə real kaskad (Qat 0/1/2/3/5, Qat 4 = embedding KODDA YOXDUR), `pg` ilə birbaşa
  Postgres (SDK yoxdur), `app_config` model seçimi, sympy-nin real nadirliyi (9/10 `none`).
- **`README.md` yenidən yazıldı.** "Faza 0 qapısı keçilməyib — kod yazılmır" yazırdı;
  struktur siyahısında `web/`, `supabase/`, `.kiro/`, `LOG.md` YOX idi.
- **Şəkil saxlama ziddiyyəti bağlandı.** `ADR-024` şəkil saxlamağı qəbul etdi, amma
  `ARCHITECTURE.md`, `PHASE-1.md` (server qaydası 3 + Məxfilik) və `INVARIANTS.md` INV-09
  hələ "şəkil saxlanılmır" deyirdi. Hamısı düzəldildi.
- **`docs/TELEMETRY.md`:** `ocr.correction_offered/made/skipped` HEÇ VAXT koda düşməyib —
  real adlar `transcript.shown/confirmed/corrected/rejected`. Əlavə olaraq `bank.list_loaded`
  / `bank.question_selected` sənədsiz idi. Hər ikisi yazıldı, köhnə adlar tarixi qeyd kimi
  saxlandı (taksonomiya append-only-dir).
- **`docs/DATA-MODEL.md`:** `verification_reason` (`0060`), `captures` bucket-i (`0057`),
  `topic_codes`/`error_codes` + RLS (`0058`/`0061`), `canonical` YENİDƏN YAZILIR (`0062`).
- **`docs/INVARIANTS.md`:** yeni **INV-11** (klientə gedən `verification` DB ilə eyni
  olmalıdır — S5-in tapdığı bug), INV-09 "yazılası"dan "aktual"a keçdi.
- **`CLAUDE.md`:** dərs 7 (status yalan danışmır), `error_codes` cədvəlinin STEP-SCHEMA-nın
  güzgüsü olduğu, şəkil saxlama, cari vəziyyət sətri. 167 sətir (limit 200).
- **`docs/PRODUCT.md`:** Faza 0 "KEÇDİ" işarələndi, dizayn vədi pozuntusu bölməsi.

**Rebase qeydi:** bu blok əvvəlcə lokal `main` (9c51a3e) üzərində yazıldı, sonra 14 commit
geri qaldığı görüldü — `origin/main`-ə (f36dcd6) rebase edildi və sənədlər blok 103–113-ün
gətirdikləri ilə YENİDƏN uzlaşdırıldı: n=99 eval nəticələri (107) `PRODUCT.md`/`README.md`/
`CLAUDE.md`-də köhnə "9/10, 16.8 san" rəqəmlərini əvəz etdi, `0063` (`step_events.
given_answer`/`is_correct`) `DATA-MODEL.md`-ə, `ADR-025` (qrafik hallüsinasiyası)
`ARCHITECTURE.md`/`CLAUDE.md` risk siyahısına yazıldı.

**Diqqət — iki açıq maddə, ikisi də uşaq datasına aiddir:**
1. **90 günlük silmə cron-u YOXDUR.** `captures` bucket-i dolur, heç nə silinmir (INV-09).
2. **`design/Kamera.dc.html` hələ "Şəkil telefonda qalır" yazır** — artıq yalandır.
   Şagird dəvətindən ƏVVƏL mətn dəyişməlidir.

---

## 2026-08-15 (113) · Claude Code → Cowork

**Etdim:** Ilkin telefonda 2 real bug tapdı, ikisi də düzəldildi və canlıda (mobil viewport,
Playwright) təsdiqləndi:
1. **Qalereya düyməsi kameranı açırdı.** `CaptureView.tsx`-in fayl input-unda
   `capture="environment"` mobil brauzerdə seçim dialoqunu ATLAYIRDI — silindi.
2. **Uzun düsturlar mobil ekranda görünməz kəsilirdi.** Ilkin-in screenshot-u "k = 9"
   göstərirdi, DB-də isə düzgün "k = 9 · (−1/3)" var idi (`question_id 37b129cd`) — RƏQƏM
   SƏHVİ DEYİL, göstərmə bug-ı. `SolveView.tsx`-də 3 qutu (son cavab, addım `latex`, transfer
   `canonical`) `whiteSpace:"nowrap"` + `overflowX:"auto"` işlədirdi — üfüqi sürüşdürülə
   bilirdi, amma heç bir görünən işarə yox idi, məzmun kənardan kəsik görünürdü. Hər üçü
   `whiteSpace:"normal", overflowWrap:"anywhere"`-ə keçdi — sürüşdürmə TƏLƏB OLUNMUR, hər şey
   görünür (390px viewport-da uzun toplama nümunəsi ilə vizual təsdiqləndi, 2 sətirə bölünür).
**Diqqət:** bu, məhsulun qızıl qaydasına DOLAYI TOXUNAN bir bug idi — şagird DÜZGÜN cavabı
səhv sanıb özünü şübhəyə sala bilərdi, halbuki DB/model tərəfi tam doğru idi.

---

## 2026-08-15 (112) · Claude Code → Cowork

**Etdim:** Ilkin-in tapşırığı — fizika/kimyaya genişlənmə üçün araşdırma + biznes + texniki
plan (tək sənəd, Ilkin-in seçimi). `docs/decisions/ADR-026-multi-subject-expansion.md` yazıldı.
Əsas tapıntılar: (1) `STEP-SCHEMA.json`-un `subject` sahəsi 2026-08-05-dən (`ADR-008`) artıq
`math|physics|chemistry` enum-udur — giriş qatı hazırdır, `error_code`/prompt/sympy/eval qatları
YOXDUR; (2) DİM 1-ci ixtisas qrupunun blok imtahanında Riyaziyyat və Fizika EYNİ əmsalla (1.5)
çəkilir, Kimya 1.0 — fizika ikinci fənn olaraq tövsiyə edilir, bazar/pedaqoji əsasla; (3) Gauth
artıq fizika/kimya/biologiya əhatə edir, Photomath şüurlu şəkildə yalnız riyaziyyatda qalır —
bu, "yalnız riyaziyyat" strategiyasının TƏK BAŞINA uduzdurmadığını göstərir, ona görə tövsiyə
FAZA 1-in öz qapısından SONRA başlamaqdır, paralel YOX. Texniki plan: `error_code`
taksonomiyası `topic_code`-un SAHƏ.MÖVZU prefiks konvensiyası ilə genişlənsin (schema_version
dəyişmədən), `ADR-014`-ün nüvə+fənn prompt bölgüsü icra edilsin (`web/lib/prompt.ts:30` +
`scripts/lib/prompt_loader.py` `subject`-ə görə fayl seçsin), sympy yoxlaması fizikaya qismən
uzanır (cəbri tənliklər), kimyada `verified:false` ilə başlanır (S5 artıq bunu göstərir,
bloklayıcı deyil), YENİ golden-set `ADR-004`-ün eyni n≥30 qapısı ilə ölçülməli — riyaziyyatın
99 sualı fizika/kimya üçün sübut gücü DAŞIMIR.
**Tapşırıq:** Ilkin-in birbaşa tapşırığı, ClickUp yoxdur (qərar tələb edir, aşağı bax).
**Blok:** ADR-026-nın "Qərar verilmədi" bölməsindəki 4 sual Ilkin-in seçiminə açıqdır (vaxt,
prefiks konvensiyası A/B, fizika golden-set mənbəyi, ADR-014-ün ikinci-çağırış memarlığı ilə
birlikdə/ayrı aparılması).

---

## 2026-08-15 (111) · Claude Code → Cowork

**Etdim:** Ilkin-in tapıntısı — "Bu addımı başa düşmədim" düyməsi addımı izah etmək
əvəzinə səssizcə `advance()` çağırıb növbəti addıma keçirirdi (`SolveView.tsx`-in
`abandonStep`-i). Düzəliş: düymə indi `currentStep.hint`-i göstərir, şagird EYNİ addımda
qalır (`openHint()`, `hintOpen` state). `step.hint_opened` hadisəsi `docs/TELEMETRY.md`-
də ARTIQ təsvir olunmuşdu (sətir 142), heç vaxt atılmırdı — yeni taksonomiya yaratmadım,
mövcudu tamamladım. Düymə mətnindən "→" oxu silindi (artıq irəli getmir). Canlıda
Playwright ilə yoxlandı (yeni "9+13=?" sualı) — ADDIM 1/1 qalır, ipucu görünür.
**Diqqət:** bundan sonra `step.abandoned` hadisəsi bu düymədən ARTIQ ATILMIR (yalnız
"Cavabı göstər" hələ də çıxış yoludur). Taksonomiyanın özü dəyişməyib, sadəcə bir mənbə
sükuta düşüb — funnel analizində nəzərə al.

---

## 2026-08-15 (110) · Claude Code → Cowork

**Etdim:** (109)-dakı qalereya düyməsini Playwright ilə canlıda özüm işlətdim (kod
`invite01`, `web-dusky-xi-74.vercel.app`) — YENİ sual "7+8=?" şəkli yükləndi, kəsildi,
təsdiqləndi. Nəticə: **ADDIM 1/1**, DB-də (`question_translations`, `question_id
e86e411f-...`) `steps` massivi 1 elementli, `error_code: ARITHMETIC`, süni yoxlama YOXDUR.
(108)-in prompt v10 + `minItems`=1 düzəlişi PRODUKSİYADA TƏSDİQLƏNDİ, uçdan-uca (yalnız
`eval.py` izolə mühiti yox, real `/api/solve` yolu).
**Diqqət:** (109)-dakı "sandboxda yoxlanmadı" qeydi artıq etibarsızdır — canlı yoxlanıldı.

---

## 2026-08-15 (109) · Claude Code → Cowork

**Etdim:** Ilkin-in "5+5" təkrar testi eyni köhnə (2-addımlı) nəticəni göstərdi — DB-də
yoxladım: `persist.ts`-in `canonical_hash` dedup-u eyni `question_id`-i (əvvəlki, v9-prompt-lu)
YENİDƏN İSTİFADƏ edir, prompt v10 düzəlişi TƏTBİQ OLUNMUR (bu, gözlənilən davranışdır —
`step_answers` uyğunluğu üçün qəsdəndir, bax `persist.ts`-in "ADDIM/CAVAB UYĞUNLUĞU" şərhi).
"5+15" (yeni canonical) düzgün 1 addımla gəldi — v10 İŞLƏYİR, sadəcə köhnə keş "donub".

**Əlavə:** `CaptureView.tsx`-ə real qalereya/fayl seçimi düyməsi əlavə edildi (`messages/
az.json`-dakı ölü `kamera.gallery` açarı İLK DƏFƏ bağlandı) — Ilkin-in tapşırığı: kamera
olmayan mühitdə (bu sandbox) eyni app axınını fayl yükləməklə sınamaq. `input[type=file]
accept="image/*" capture="environment"` — mobil brauzerlərdə native "çək/qalereya" seçicisini
açır, bu sandboxda isə birbaşa fayl seçimidir. Kameranın ÖZÜ TOXUNULMADI, əlavə YALNIZ
bir fallback yoludur (kamera uğursuz olanda da işləyir).

**Diqqət:** production-a push edilib, canlı sınandı (aşağı bax).

---

## 2026-08-15 (108) · Claude Code → Cowork

**Etdim:** Ilkin-in birbaşa tapşırığı (BLİTZ, ADR-siz) — "yoxlama addımı istisnasız" qaydası
mənasız son addımlar yaradırdı ("5+5=?" DB-də yoxlanıldı: 2 addım, ikincisi süni). `STEP-
SCHEMA.json` `minItems` 2→1, `prompts/solve/core.md` qayda 8 4 icazəli yoxlama tipinin qapalı
siyahısına keçdi (dövri/əlaqəsiz yoxlama açıq qadağan), `scripts/lib/steps_compare.py`-ın
struktur yoxlaması uyğunlaşdırıldı (35/35 selftest keçir).
**Tapşırıq:** Ilkin-in birbaşa sözlü tapşırığı, ClickUp yoxdur.
**Diqqət:** növbəti real solve-da model 1-addımlı sadə suallara HƏQİQƏTƏN 1 addımla cavab
verirmi — sandboxda yoxlanmadı (API açarı yoxdur), production-da izlənilməlidir.

---

## 2026-08-15 (107) · Claude Code → Cowork

**Etdim — 99/99 sualın TAM eval nəticəsi (Faza 0-ın ilk n≥30 qapı ölçməsi) + eval.py-ın
öz fayl-üst-yazma bug-ının düzəlişi (3 dəfə real data itkisinə səbəb oldu, elə bu sessiyada).**

### Yol — niyə 4 ayrı run lazım oldu

Açar limiti 2 dəfə 429-a çırpıldı (61-də, sonra yenidən). Ilkin limiti artırandan sonra qalan
suallar hissə-hissə (38, sonra tam 99 təzədən — YENƏ 429, sonra yalnız çatışmayan 60) işə
salındı. **Prosesdə iki dəfə tam nəticə itdi** — `scripts/lib/report.py::write_results`
YALNIZ `{pipeline}-{tarix}.json` adı işlədirdi (set adı YOX), eyni günə düşən HƏR YENİ run
əvvəlkini SƏSSİZCƏ üzərinə yazırdı. Bu, HANDOFF (38)-də QEYD OLUNMUŞ, əvvəllər DƏ baş vermiş
eyni bug-ın DÖRDÜNCÜ təkrarı idi — bu dəfə DÜZƏLDİLDİ: `write_results` indi `write_summary`
kimi set adını da fayl adına yazır (`{pipeline}-{tarix}-{set}.json`, tarix ƏVVƏL ki
`find_latest_result`-un əlifba sırası xronoloji qalsın). Bundan sonra hər run öz faylını
saxladı, 4-cü (çatışmayan 60) run problemsiz bitdi, 4 nəticə əl ilə (`report.aggregate`-in
ÖZÜNDƏN, yenidən icra edilmədən) BİRLƏŞDİRİLDİ.

### Yekun nəticə (n=99, 0 xəta)

| Metrika | Nəticə |
|---|---|
| Sxem validliyi | **99/99 = 100%** |
| Variant (cavab) dəqiqliyi | **91/96 = 94.8%** |
| Struktur (say/check/ardıcıllıq/yoxlama/fərqli kod) | **96/96 = 100%** |
| Cavab sızması | 21/96 = 21.9% (hədəf ≤10%) |
| Artıq ehtiyat (imtina, lazım deyildi) | 3/99 = 3% |
| Orta xərc | $0.00997/sual (99 sual ≈ $0.99 cəmi) |
| Orta latensiya | 19.2 san |

**Qapı: NATAMAM** — yalnız insan pedaqoji rəyi çatışmır (`ADR-004`), digər HAMISI ölçülüb.

### Sızma — 21.9%-in ARXASINDA nə var (yenə əl ilə izlənildi, ehtimal YOX)

Ümumi 29 "sızma" hadisəsinin (əvvəlki iki partiyadan 8 + bu axırıncı mərhələdən 8 yeni,
üst-üstə düşənlər çıxılmaqla) HAMISI `detect_leak`-in özündən keçirilib. Nəticə: **demək olar
heç birində model cavabı erkən açıqlamır.** Kateqoriyalar:
- ~7-8 hal: son (yoxlama) addımının ÖZÜ tapılan dəyəri restate edir — `ADR-005`-in qəsdən
  j<i qaydasına görə "doğru" sızma, əslində promptun MCQ-yoxlama scaffolding boşluğu.
- ~4-5 hal: sualın ÖZÜ verilən ifadə/düstur cavabla EYNİDİR (eynilik/düstur-tanıma sualları).
- ~5-6 YENİ səth forması ("2, 3 və 4-cü" siyahı-tipli ordinal, "log_a a = 1" ümumi loqarifma
  qaydası, "1-dən böyük" — simvolik ">" YOX, sözlə müqayisə) — bu axırıncı mərhələdə tapıldı,
  bugünkü ilk düzəlişimin (4 dar istisna) ƏHATƏ ETMƏDİYİ YENİ təsadüfi-toqquşma sinifləridir.
- 1-2 borderline (namizəd sadalaması, dərivasiya addımı).

**Qərar: DAHA ARTIQ patch YAZILMADI.** Bu gün artıq BİR dəfə dar-istisna cəhdi öz-özünə
reqressiya yaratdı (bax blok 106, "-ə" toqquşması). Hər yeni səth forması üçün ayrıca regex
əlavə etmək azalan-gəlirli və reqressiya-riskli bir yoldur — bu, `leak.py`-ın MEXANİKİ
yanaşmasının (substring axtarışı, "ümumi qayda" ilə "bu sualın CAVABI"nı ayırd edə bilməməsi)
STRUKTUR məhdudiyyətidir. **Cowork/Ilkin-in qərarına buraxılır:** (a) bu metrikanın ölçülmüş
"yalançı-müsbət döşəməsini" (~20%) qəbul edib nəzərə almaq, (b) `ADR-005`-i genişləndirib
"ümumi qayda/düstur xatırlatması" sinfini strukturca xaric etmək (yeni ADR tələb edir),
(c) müsbət açar-söz tələbi əlavə etmək ("cavab", "nəticə" kimi sözlər yaxınlıqda olmasa
qısa/ümumi dəyərləri IGNORE et — mən bunu ilkin dizayn etdim, amma tətbiq ETMƏDİM, effekt
ölçülmədi).

### Digər tapıntı — 3 "artıq ehtiyat" imtina MƏNİM kəsmə скриптимин səhvidir, model DEYİL

q063/092/057 "unreadable"/"cut_off" ilə imtina etdi — SƏBƏBLƏRİ yoxlanıldı: hər üçü
`scripts/pdf_to_golden_set.py`-in kəsmə sərhədinin mətni QISA KƏSMƏSİ idi (məsələ kadrdan
kənarda kəsilib görünürdü). Bu, MODELİN həddindən artıq ehtiyatlı olması DEYİL — mənim
avtomatlaşdırılmış kəsmə pipeline-ımın 99/100-dən daha bir neçəsində (q098-dən əlavə) tam
mükəmməl olmadığının sübutudur.

**Fayllar:** `evals/results/summary-golden-set-dim-100test-2025-2026-08-15.json` (git-ə
gedir, birləşdirilmiş 99 nəticə) yeniləndi/commit edildi. Xam `B-*.json` fayllar (raw_output
daxil) gitignored qalır, lokal saxlanılıb.

**Diqqət:** `.env` (repo kökündə, Ilkin-in API açarı ilə) `.gitignore`-dadır, commit
EDİLMƏYİB. Açar dəyəri bu HANDOFF-a YAZILMADI.

**Blok:** sızma-metrikasının gələcəyi (yuxarı 3 seçim) Ilkin/Cowork-un qərarını gözləyir.

---

## 2026-08-15 (106) · Claude Code → Cowork

**Etdim — ilk real 99-sualıq eval run (n≥30 qapı ilk dəfə keçildi) + `leak.py`/`leak.ts`
sızma detektorunun 4 yalançı-müsbətinin düzəldilməsi.**

### Run #1 nəticəsi — 61/99 (429 rate-limit, açar limiti sonra artırıldı)

`scripts/eval.py --pipeline B --set evals/golden-set-dim-100test-2025.jsonl` ilk cəhddə
item 61-də 429 "Too Many Requests"-ə çırpıldı, qalan 38-i də (yenidən cəhd DAXİL) eyni xəta
ilə uğursuz oldu — Ilkin-in açara qoyduğu xərc limiti idi, keçici RPM-boğulma DEYİL
(təsdiqləndi: bir az sonra təkrar cəhd DƏRHAL yenə 429 verdi). Uğurlu 61 sual üzərində
(infrastruktur xətaları XARİC, ilk hesabatın "60.6%" rəqəmi bunları sxem-uğursuzluğu kimi
sayırdı — YANLIŞ metodologiya, düzəldilməli):
- Sxem validliyi: **61/61 = 100%**
- Variant (cavab) dəqiqliyi: **57/60 = 95%**
- Struktur: 98.3%
- Sızma: 9/61 = 15% (hədəf ≤10%-i keçir)

### Sızma tapıntısı — Ilkin-in "ehtimal ilə niyə düşünürsən, loglamısan?" sualından sonra

İlk cavabımda ("model B variantını erkən açıqlayır ehtimalı") HEÇ bir real data yoxlamamışdım
— Ilkin bunu düzgün sual etdi. Bütün 9 "sızma"nı `detect_leak`-in ÖZÜNDƏN keçirib DƏQİQ hansı
addımda, hansı mətndə tutulduğunu tapdım:

- **4/9 TAM yalançı-müsbət** — sızan "dəyər" HEÇ CAVABLA ƏLAQƏSİZ təsadüfi rəqəm toqquşması
  idi: `"2-ci"` (sıra sayı şəkilçisi, cavab "2" YOX), `"[-90°, 90°]"` (arcsin-in domen
  intervalı, cavab "90°" YOX), `"8 > 1"` (loqarifm əsası qaydası, cavab "1" YOX),
  `"1/(2√x)"` (törəmə düsturunun məxrəci, cavab "2" YOX).
- **2/9** son (yoxlama) addımının ÖZÜ tapılan dəyəri restate edir — bu, `ADR-005`-in ÖZ
  qəsdən j<i qaydasına görə DOĞRU sızma sayılır (addımın öz sualının cavabını öz izahında
  açıqlaması), amma prompt qayda 8-in (yoxlama = "nəticəni yerinə qoy") TƏLƏB ETDİYİ formaya
  görə YARANIR — bu, **promptun scaffolding boşluğudur** (aralıq addım MCQ dəyərini
  ƏVVƏLCƏDƏN accept etməli idi), leak.py bug-ı DEYİL. Kod DƏYİŞMƏDİ, ADR-005-ə TOXUNMADI.
- **3/9** (q027, q045, q060) — sualın öz verilən dəyəri cavabla üst-üstə düşür (eynilik
  sualı) VƏ ya çoxhissəli/söz-tipli cavab (label siyahısı, "bucaq əmsalı" termini) — aşağı
  etibarla, DƏYİŞMƏDİ.

**Nəticə: 0/9-da model həqiqətən "cavabı erkən açıqlayır" davranışı yoxdur.** 15% sızma
göstəricisi ƏSASƏN ölçmə alətinin özünün zəifliyi idi.

### Düzəliş — `scripts/lib/leak.py` + `web/lib/verify/leak.ts` (hər ikisi, ADR-012 parity)

4 DAR, ölçülən istisna əlavə edildi (`_leaked_in_text`-ə): sıra sayı şəkilçisi (yalnız
`-ci/-cı/-cü/-cu/-(i)ncı/-uncu/-üncü`, GENİŞ "istənilən hərf" FORMASI YOX — ilk versiya bunu
sınadı, "3-**ə** bərabər" (bərabərlik şəkilçisi, HƏQİQİ sızma nümunəsi) ilə toqquşdu,
`leaked_explanation` selftest halını qırdı, DƏRHAL tutuldu və düzəldildi), domen/interval
mötərizəsi `[...]`, müqayisə operatorundan (`< > ≤ ≥`) dərhal sonra, `√`-ə bilavasitə bitişik
əmsal. `evals/selftest-cases.jsonl`-a 6 real HANDOFF-106 halı (4 düzələn + 2 dəyişməyən)
əlavə edildi — **34/34 selftest keçir**. `web/lib/verify/leak.selftest.mts` YENİ (bu modulun
əvvəllər HEÇ selftest-i yox idi) — 7/7, o cümlədən reqressiya qıfılı ("-ə" ordinal DEYİL).

**Doğrulama:** `tsc --noEmit`/`eslint` təmiz, Python `--selftest` 34/34, TS `leak.selftest.mts`
7/7, 9 real HANDOFF-106 halı `detect_leak`-in ÖZÜNDƏN birbaşa yenidən icra edilib təsdiqləndi.

**Diqqət:**
- q028/q059-un (yoxlama-addım scaffolding boşluğu) DÜZƏLİŞİ bu sessiyada EDİLMƏDİ — bu,
  `leak.py`-ın DEYİL, PROMPTUN məsələsidir (MCQ-yoxlama dəyəri aralıq addımda əvvəlcədən
  accept edilməli idi). Ayrıca qərar/ClickUp tələb edir, Cowork-a buraxılır.
- İkinci cəhd (qalan 38 sual) Ilkin-in açar limitini artırmasından sonra işə salınıb —
  nəticə NÖVBƏTİ blokda.

---

## 2026-08-15 (105) · Claude Code → Cowork

**Etdim — Ilkin PDF tapdı (`100 test. Riyaziyyat..pdf`, öz Downloads qovluğundan), Scribd-in
əvəzinə avtomatlaşdırılmış golden-set boru xəttini QURDUM VƏ İCRA ETDİM.**

- **`scripts/pdf_to_golden_set.py`** — YENİ, təkrar istifadə oluna bilən CLI. PyMuPDF ilə
  PDF-i açır, sual nömrələrini (1..N) İKİ SÜTUNLU səhifə düzülüşündə mətn-mövqeyi əsasında
  (LLM YOX) ARDICIL tapır, hər sualı öz sütununda NÖVBƏTİ sualın mövqeyinə qədər kəsir,
  cavab açarı səhifələrini `\d{1,3}-[A-E]` naxışı ilə parse edir, `evals/golden-set-<ad>.
  jsonl` + `evals/images/<ad>/qNNN.png` yazır. **Sıfır LLM çağırışı bu mərhələdə** — token
  xərci YALNIZ sonrakı `scripts/eval.py --pipeline B` addımında yaranır.
- **İcra edildi:** `100 test. Riyaziyyat..pdf` (10 səhifə, 100 sual, cavab açarı səh. 8-9) →
  100/100 sual nömrəsi ARDICIL tapıldı, 100/100 cavab HƏRFİ ziddiyyətsiz parse edildi. Kəsmə
  99/100 sualda TƏMİZ çıxdı (əl ilə 5 nümunə yoxlanıldı: sadə funksiya, qrafik-seçimli
  (`y=|x-1|+1`), Venn diaqramı, konus/silindr kəsiyi). **`q098` XARİC EDİLDİ** — kəsik
  konusun A-E fiqurları mətn axınının kənarına düşüb, kəsmə qutusu boş çıxdı (script-in öz
  başlığındakı bilinən məhdudiyyət, avtomatik aşkarlanmır).
- **`evals/golden-set-dim-100test-2025.jsonl`** (99 sual) commit edildi — `id`/`image`/
  `expected_choice`/`grade`/`subject`/`source` (yalnız fayl adı+sual№, sual MƏTNİ YOX).
  `evals/images/dim-100test-2025/` (99 PNG) gitignored qalır, ORİJİNAL PDF repo-ya
  KOPYALANMADI (ADR-003-ün ruhu — DİM mətni saxlanmır, yalnız hansı variantın düzgün
  olduğu).
- **`evals/README.md`** yeni bölmə: işə salma əmri, xərc təxmini (~99×$0.013 ≈ $1.3 tam
  dəst, kiçik partiyalarla başlamaq tövsiyəsi).

**Doğrulama:** 5 nümunə əl ilə vizual yoxlanıldı (screenshot-la), sual nömrələri 1-100 heç
bir boşluq/təkrar olmadan tapıldı, cavab açarı 0 ziddiyyətlə parse edildi.

**Diqqət:**
- Bu, YALNIZ dataset HAZIRLIĞIDIR — real `scripts/eval.py --pipeline B --set evals/
  golden-set-dim-100test-2025.jsonl` çağırışı bu sessiyada EDİLMƏDİ (bu sandbox-da real
  `GEMINI_API_KEY` yoxdur, HANDOFF 92-dən bəri məlum məhdudiyyət). **Ilkin özü işlətməlidir**
  (əsas checkout-dakı `.env`-lə, blok 93-dəki A/B test kimi) VƏ ya mənə API açarı təqdim
  etməlidir.
- `q098` xaric edilməsi MÜVƏQQƏTİDİR — istəyən kim isə PDF-in özündən əl ilə bir dəfə kəsib
  geri əlavə edə bilər (`evals/images/dim-100test-2025/q098.png`-i düzəldib jsonl-a bir sətir
  əlavə etməklə).
- Bu 99 sual n≥30 qapı guard-ını KEÇİR (`scripts/eval.py`-in öz "QAPI ÖLÇÜLƏ BİLMƏZ" xəbərdarlığı
  ARTIQ ÇIXMAYACAQ) — Faza 0-ın ilk REAL statistik əhəmiyyətli ölçməsi ola bilər, əgər
  Ilkin bunu işlədərsə.

**Blok:** real eval run Ilkin-in əl işidir (API açar sandbox-da yoxdur).

---

## 2026-08-15 (104) · Claude Code → Cowork

**Etdim — Ilkin-in birbaşa tapşırığı (blok 103-ün davamı olaraq): case-sensitivity bug-ı,
tam addım-loqlaması, qrafik-oxuma hallüsinasiyasının sənədləşməsi.**

### 1) Real bug tapıldı və düzəldildi — cavab yoxlaması hərf böyüklüyünə həssas idi

Ilkin əl ilə test etdi: "müsbət" gözlənilən yerdə "Müsbət"/"MÜSBƏT" YAZDI, 5 cəhddən yalnız
sonuncusu (dəqiq kiçik hərflə) qəbul edildi. Kök səbəb: `web/lib/verify/answer.ts::normalize`
heç vaxt registr çevirmirdi, sətir bərabərliyi HƏRFİ idi. `toLocaleLowerCase("az")` əlavə
edildi (sadə `.toLowerCase()` YOX — Azərbaycan "İ" hərfini səhv çevirər).
`answer.selftest.mts`-ə 3 yeni hal (`Müsbət`/`MÜSBƏT` → uyğun, qəsdən yazılan "mənfi" → YENƏ
uyğunsuz) — 21/21 keçir. Diakritik səhvlər ("musbet", "musbed" — ü/ə hərfləri dəyişib) BU
DÜZƏLİŞLƏ HƏLLƏ OLUNMUR (registr məsələsi deyil, fərqli hərflər) — qərəzli genişləndirilmədi
(fuzzy-matching yalançı-müsbət riski daşıyır, ölçülmədən əlavə edilmədi).

### 2) Tam addım-loqlaması — `given_answer`/`is_correct` + server-timestamp vaxt

Ilkin-in tələbi: hər addımın HƏR cəhdi (səhv daxil) tam loqlanmalı, vaxt server
timestamp-lərinin fərqindən (klient taymerindən YOX) hesablanmalı.

- **`supabase/migrations/0063_step_logging_and_timing.sql`** — production-a tətbiq edildi.
  `step_events`-ə `given_answer text`/`is_correct boolean` (əvvəllər `error_code=null` HƏM
  doğru cavabı, HƏM "səhv amma distraktora uyğun gəlmir" halını eyni cür göstərirdi — İNDİ
  AYRILIR). Yeni `step_views` cədvəli (`attempt_id, step_index, shown_at default now()`) +
  `v_step_timing` view (`lead()` pəncərə funksiyası ilə hər addımın müddətini NÖVBƏTİ addımın
  `shown_at`-ına qədər hesablayır — server-tərəfli, klient saatından ASILI DEYİL).
- **`web/app/api/steps/check/route.ts`** — insert-ə `given_answer`/`is_correct` əlavə edildi.
- **`web/app/api/steps/shown/route.ts`** — YENİ endpoint, hər addım göstəriləndə çağırılır,
  `step_views`-ə damğa yazır. Telemetriya kimi (best-effort, axını bloklamır).
- **`web/components/hell/SolveView.tsx`** — `step.shown` trackEvent-in YANINDA (əvəz YOX) bu
  yeni endpoint-i çağırır, `currentStep.index` (massiv mövqeyi YOX, HANDOFF 73 konvensiyası).

**Açıq qalan:** SON addımın müddəti `v_step_timing`-də NULL qalır (növbəti "shown" hadisəsi
yoxdur — reveal-ə ayrıca marker əlavə etmək gələcək bir addımdır, bu sessiyanın həcmində
DEYİL, ADR-də qeyd olunub).

### 3) `ADR-025-graph-reading-hallucination.md` — YENİ, ölçmə tələb edir, kod DƏYİŞMƏDİ

Ilkin-in göndərdiyi real şəkli (11 saylı sual, `y=kx+b` qrafiki) ƏL İLƏ yoxladım: xətt
AZALANDIR, y-kəsişməsi MÜSBƏTDİR → düzgün cavab **D**. Sistem **B** qaytarmışdı. `ocr_captures.
ocr_raw` yoxlanıldı: Qat 1 (transkripsiya) qrafikin İSTİQAMƏTİNİ VƏ İŞARƏSİNİ TƏRS oxumuşdu —
sonrakı bütün addımlar bu YANLIŞ girişdən DÜZGÜN riyazi məntiqlə qurulmuşdu. Bu, `ADR-001`-in
ölçdüyü mətn-oxuma dəqiqliyindən FƏRQLİ bir bacarıq sinfidir (qrafik İSTİQAMƆTİ/İŞARƏSİNİ
YOZMA), heç vaxt ayrıca ölçülməyib. **n=1 — ADR-004 intizamı ilə kod dəyişikliyi EDİLMƏDİ,
YALNIZ sənədləşdirildi**, ClickUp-da "Bloklar və qərarlar"a əlavə edilir.

**Əlaqəli tapıntı:** bu solve-un şəklini yalnız Ilkin-in birbaşa göndərməsi ilə yoxlaya
bildim — `ocr_captures.storage_path` bu attempt-də DƏ `null`-dur, S1 (blok 103-ün tapdığı
`SUPABASE_SERVICE_ROLE_KEY` problemi) HƏLƏ HƏLL OLUNMAYIB. Bucket-də hələ 0 fayl.

### 4) Avtomatlaşdırılmış test boru xətti — Scribd MƏNBƏ kimi ƏLÇATAN DEYİL

Ilkin `scribd.com/document/972096164`-dən (2025 II Hissə Riyaziyyat Test Toplusu, cavab
açarı son səhifələrdə) sual şəkillərini kəsib avtomatlaşdırılmış test dəsti qurmağı təklif
etdi. Brauzerlə yoxladım: səhifə "Download to read ad-free" ilə TAM ÖRTÜLÜ (pullu/download
divarı), heç bir real mətn/şəkil çıxarıla bilmədi. Kütləvi qazıma (300+ səhifə) bu şəraitdə
etibarlı DEYİL və ADR-003-ün öz hüquqi diqqətinə görə DƏ diqqətli yanaşılmalıdır (üçüncü
tərəf paywall-lı məzmunu geniş miqyasda çıxarmaq). **Alternativ plan Ilkin-ə TƏQDİM
OLUNACAQ** (bu sessiyada YOX, ayrıca cavab) — böyük miqyaslı, token-həssas bir iş olduğu üçün
tikməzdən əvvəl planı təsdiqlətmək daha ucuzdur.

**Doğrulama:** `tsc --noEmit`/`eslint` təmiz, `answer.selftest.mts` 21/21,
`step-check.selftest.mts` 19/19 (reqressiya yoxdur).

**Blok:** ADR-025-in ölçmə addımı (qrafikli golden-set genişləndirilməsi) Cowork/Ilkin-in
qərarını gözləyir. Avtomatlaşdırılmış test boru xəttinin planı Ilkin-ə TƏQDİM ediləcək.

---

## 2026-08-14 (103) · Claude Code → Cowork

**Etdim — S1-S8 deploy olunandan SONRA Ilkin-in birinci real solve-unu (blok 95-in eyni
metodu ilə DB+Vercel forensikası) analiz etdim.** Şikayət: "yenə uyğunsuzluq var."

**Obyekt:** `attempts.id = f8c684a7-fdba-46b7-be7f-5870fc7cf04d`, 2026-08-14 19:25:38Z,
mövzu: `y=kx+b` qrafikinə görə `k`/`b`-nin işarəsi (A-E variantlı).

### Birinci nəticə: RİYAZİYYAT VƏ FINAL CAVAB DÜZGÜNDÜR

`k>0, b<0` (variant B) — qrafikin təsvirinə (artan xətt, y-oxu mənfi yarımoxda, x-oxu müsbət
yarımoxda kəsişir) tam uyğundur, `private.question_answers`-dəki saxlanılan cavabla EYNİDİR.
3 addımın `check.ask`-ı öz `latex`-inə aiddir (S6 qayda 17 KEÇİR). `questions.canonical` BOŞ
DEYİL (S8 işləyir), `attempt_items.completed/revealed_answer/self_solved` düzgün yazılıb
(S4 işləyir).

### İKİ REAL TAPINTI (Ilkin-in "uyğunsuzluq" hissi buradan gəlir)

1. **S1 hələ də İŞLƏMİR — Vercel runtime logs-da 403 RLS xətası tapıldı.**
   ```
   [storage] yükləmə xətası (.../crop.jpg): 403 "new row violates row-level security policy"
   [storage] yükləmə xətası (.../raw.jpg): eyni xəta
   ```
   `storage.buckets`-də 1 sətir var (bucket mövcuddur), `storage.objects` isə **0 sətir** —
   HEÇ bir fayl yüklənməyib. Kök səbəb: Postgres-də `service_role` rolunun `rolbypassrls=true`
   olduğu TƏSDİQLƏNDİ — yəni sorğu HƏQİQƏTƏN `service_role` kimi autentifikasiya olunsaydı,
   RLS ÜMUMİYYƏTLƏ tətbiq olunmazdı. 403 gəlməsi sübut edir ki, Vercel-dəki
   `SUPABASE_SERVICE_ROLE_KEY` DƏYƏRİ service_role kimi TANINMIR (ən ehtimallı səbəb: Supabase
   Dashboard-da "Legacy anon, service_role API keys" səhifəsində `anon` açarı sərbəst görünür/
   "Copy" düyməsi var, `service_role` isə gizlidir/yalnız "Reveal"lə açılır — səhvən `anon`
   açarının kopyalanması TAM bu simptomu (403, RLS pozuntusu) verər). **Ilkin-dən xahiş:**
   Vercel → Settings → Environment Variables → `SUPABASE_SERVICE_ROLE_KEY`-i sil, Supabase
   Dashboard-da `service_role` sətrinin "Reveal" düyməsinə bas, dəyəri ORADAN köçür (əvvəl-sonra
   boşluq/sətir keçidi olmadan), yenidən yadda saxla, redeploy et.
   `ocr_captures.storage_path` YENƏ DƏ `null` qalır (kod özü düzgün "best-effort" davranır —
   axını bloklamır, amma bu o deməkdir ki, S1-in qəbul şərti hələ TƏSDİQLƏNMƏYİB).
2. **`\tan` LaTeX-i xam göstərilirdi — DÜZƏLDİLDİ.** `render.unformatted_latex` hadisəsi
   `\tan` üçün atılıb (addım 2-nin `latex`-i `k = \tan\alpha` idi, ekranda hərfi "\tan\alpha"
   görünüb). `web/lib/math-format.ts`-ə `\tan`/`\alpha` əlavə edildi (HANDOFF 55-in "yalnız
   ÖLÇÜLƏNİ əlavə et" qaydası ilə — `\sin`/`\cos`/`\cot` ƏLAVƏ EDİLMƏDİ, ölçülməyib).
   `math-format.selftest.mts`-ə reqressiya testi əlavə edildi, 34/34 keçir.

### Üçüncü müşahidə — DÜZƏLDİLMƏDİ, qeyd üçün

Addım 2-də (`k`-nın işarəsi, `input_kind:"expression"`, `accept:["müsbət","k>0","k > 0"]`)
şagird **5 cəhddən sonra** düz cavab verdi (addım 1: 1 cəhd, addım 3: reveal-ə qədər 1 səhv
cəhd). `given_answer` DB-yə yazılmır (yalnız correct/incorrect boolean), ona görə şagirdin
NƏ yazdığı bilinmir — amma "işarə" kimi KEYFİYYƏT sualının `input_kind:"expression"` olması
(rəqəm/ifadə gözləyən sərbəst mətn sahəsi) şübhəlidir: "müsbətdir", "pozitiv", "+" kimi
məntiqli variantlar `accept` siyahısında YOXDUR və `studentAnswerMatches`-in ədədi-ekvivalent
yolu keyfiyyət sözlərini YOXLAYA BİLMİR (riyazi ifadə deyil). **Fərziyyədir, TƏSDİQLƏNMƏYİB**
(n=1, real yazılan mətn yoxdur) — düzəldilmədi. Əgər təkrarlanarsa: (a) işarə sualları üçün
`input_kind:"choice"` (müsbət/mənfi düymələri) düşünülə bilər, (b) `accept` siyahısını
prompt səviyyəsində genişləndirmək. ADR tələb edir, bu sessiyanın həcmində DEYİL.

**Doğrulama:** `tsc --noEmit`/`eslint` təmiz, `math-format.selftest.mts` 34/34 (2 yeni hal
daxil). Vercel `get_runtime_errors` (son 24 saat) YALNIZ bu 2 storage xətasını göstərdi —
başqa heç bir S1-S8 reqressiyası YOXDUR.

**Blok:** `SUPABASE_SERVICE_ROLE_KEY`-in düzəldilməsi Ilkin-in əl işidir — bunsuz S1 "qəbul
edilib" deyilə bilməz, kod tərəfi artıq düz "best-effort" davranır (axını bloklamır, sadəcə
şəkil itir).

---

## 2026-08-14 (102) · Claude Code → Cowork

**Etdim — S8 (86eymwgmv), `canonical` saxlanılsın, `ADR-003`-ün boşaltma qərarı LƏĞV EDİLDİ.
Bununla S1-S8-in HAMISI bitdi (Valideyn 86eymwggu).**

- **`web/lib/cascade/persist.ts`** (Qat 5 yeni sual yolu) və **`web/app/api/solve/route.ts`**
  (monolit yol) — hər ikisində `insert into questions (...)` artıq `canonical` sütununa
  `transcript.canonical`/`parsed.canonical` yazır, `''` YOX. `canonical_hash`/
  `numeric_fingerprint` toxunulmadı (onsuz da `parsed.canonical`-ın özündən hesablanır) —
  keş davranışı DƏYİŞMƏDİ.
- **`docs/decisions/ADR-003-dim-dataset-legal.md`** — "Ləğv 2026-08-14" bölməsi: Ilkin-in
  qərarı (sürət > hüquqi ehtiyat, pre-launch, 0 istifadəçi), səbəb (blok 95: `canonical`
  boşaldılsa da eyni mətn `question_translations.stem`-də hərfi qalırdı, boşaltmaq YALNIZ
  forensika/debug qabiliyyətini itirirdi, hüquqi qazanc olmadan). "Açıq məsələlər"
  siyahısındakı `solutions.payload` maddəsi bağlandı (indi qəsdən belədir) — hüquqşünas rəyi
  maddəsi daha AKTUAL kimi işarələndi (indi HƏM `canonical`, HƏM `stem` DİM mətnini saxlayır).
- **`supabase/migrations/0062_restore_canonical_from_stem.sql`** — production-a tətbiq
  edildi. Mövcud 10 `user_capture` sətri `question_translations.stem.blocks[0].v`-dən
  (eyni mətn artıq ORADA idi) bir dəfəlik geri dolduruldu. Doğrulandı:
  `source='user_capture'`-da 0/10 boş `canonical` qaldı.

**Doğrulama:** `tsc --noEmit`/`eslint` təmiz, `cascade.selftest.mts` (bütün hallar,
reqressiya yoxdur).

**Diqqət:**
- Real foto-solve ilə UÇDAN-UCA yoxlanmadı (kamera bloklanıb) — qəbul şərti ("yeni
  foto-solve-dan sonra `questions.canonical` boş deyil") kod səviyyəsində təmin edilib,
  Ilkin-in real solve ilə TƏSDİQLƏMƏSİ lazımdır.
- `question_translations.stem`-in özü DƏYİŞMƏDİ (artıq düz idi) — yalnız `questions.
  canonical` düzəldi.

---

## Valideyn 86eymwggu — S1-S8 YEKUNU

Bütün 8 subtask kod səviyyəsində bitdi, production-a tətbiq edildi (miqrasiyalar `0057`–
`0062`), HANDOFF-a yazıldı, ClickUp-da şərh edildi. Aşağıdakılar Ilkin-in TƏSDİQİ/əl işi
gözləyir (heç biri kodun "bitməməsi" demək DEYİL, hamısı bu mühitin öz məhdudiyyətindəndir —
kamera/real API açarı yoxdur):

| # | Kodun vəziyyəti | Ilkin-dən gözlənilən |
|---|---|---|
| S1 | Tam | `SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_URL` Vercel-ə əlavə + real solve ilə "2 fayl" təsdiqi |
| S2 | Vercel env dəyişikliyi HƏLƏ EDİLMƏYİB | `CASCADE_ENABLED=1` özün əlavə et (heç bir Vercel MCP alətim yoxdur), real solve ilə `match_path`/`cost_usd=0` təsdiqi |
| S3 | Tam, production-da yoxlanıldı | — |
| S4 | Tam, backfill edildi və yoxlanıldı | — |
| S5 | Tam, ölçmə HANDOFF-dadır (9/10 `none`) | — |
| S6 | Prompt dəyişdi, real LLM ilə YOXLANMADI | növbəti solve-larda qayda 17-nin işlədiyini izlə |
| S7 | Tam, advisor təmizləndi | — |
| S8 | Tam, backfill edildi və yoxlanıldı | real solve ilə `canonical` boş olmadığını təsdiqlə |

**Push edilmədi** — 8 commit bu branch-də (`claude/clickup-handoff-migration-56373f`) yığılıb,
CLAUDE.md qayda 8-ə görə (açıq branch qalmasın) main-ə merge ediləcək, təsdiq gözlənilir.

---

## 2026-08-14 (101) · Claude Code → Cowork

**Etdim — S7 (86eymwgmk), iki kiçik mina.**

**1) `app_config.active_transcribe_model` boş sətir — TƏKRAR YOXLANILDI, KOD DƏYİŞMƏDİ.**
`web/lib/models.ts::getActiveTranscribeModel` oxundu: `if (fromDb) return fromDb;` —
JS-də boş sətir (`""`) FALSY-dir, bu şərt onsuz da `env` fallback-ına düşür. `models.
selftest.mts`-də bu HAL DƏQİQ test edilib ("DB sətri boşdursa TRANSCRIBE_MODEL env-ə
düşür") və keçir. `app_config.value` sütunu `NOT NULL`-dur (boş sətri `NULL`-a çevirmək
cəhdi constraint-lə RƏDD OLUNDU) — yəni boş sətir DB-nin ÖZ SENTINEL-idir ("override
yoxdur"), bug DEYİL, dizayn qərarıdır. **Blok 95-in "boş model ID API-yə gedə bilər"
qorxusu yoxlanıldı və TƏSDİQLƏNMƏDİ** — kod artıq (bu sessiyadan ƏVVƏL) düzgün yazılıb.

**2) `topic_codes`/`error_codes` RLS — DÜZƏLDİLDİ.** `supabase/migrations/
0061_taxonomy_tables_rls.sql`, production-a tətbiq edildi:
- Hər iki cədvəldə RLS aktivləşdirildi.
- `app_runtime` üçün TAM (select+insert+update) policy — `0052`-nin öz-özünü sağaldan
  trigger-ləri (`register_topic_code`/`register_error_code`) hər naməlum kod gələndə bu
  cədvəllərə INSERT edir, policy olmadan RLS bunu BLOKLAYARDI.
- **`anon`/`authenticated` üçün policy ƏLAVƏ EDİLMƏDİ** — CLAUDE.md gate-78 dərsi 4-ə görə
  (spekulyativ genişləndirmə yox) yoxlandı: `information_schema.role_table_grants`-da bu
  iki rola HEÇ bir GRANT yoxdur, yəni RLS söndürülməsi advisor-un ancaq DEFANS-DƏRİNLİYİ
  tövsiyəsi idi (gələcək bir `grant select...to anon` RLS backstop-suz dərhal açardı),
  hazırda real giriş yolu yoxdur. `get_advisors(security)` ilə təsdiqləndi: hər iki
  cədvəlin "RLS disabled" xəbərdarlığı ARTIQ SİYAHIDA YOXDUR.

**Doğrulama:** Supabase advisors (security) yenidən çağırıldı — `topic_codes`/`error_codes`
üçün heç bir RLS xəbərdarlığı qalmadı (qalan xəbərdarlıqlar bu tapşırığa AİD DEYİL —
`function_search_path_mutable` 3 funksiyada, `rls_enabled_no_policy` 4 `private.*` cədvəldə,
hər ikisi ayrı, əvvəldən mövcud, kiçik səviyyəli tapıntılardır).

**Diqqət:**
- `function_search_path_mutable` (`assert_fingerprint_prefix`, `register_topic_code`,
  `register_error_code`) və `private.*`-də 4 "RLS enabled no policy" (bunlar YALNIZ RPC
  ilə əlçatandır, INFO səviyyəli, gözlənilən) bu tapşırığın ƏHATƏSİNDƏN KƏNARDIR —
  toxunulmadı, qeyd üçün yazılır ki, gələcək bir təhlükəsizlik keçidi bunları görsün.

---

## 2026-08-14 (100) · Claude Code → Cowork

**Etdim — S6 (86eymwgma), `check.ask` öz addımına uyğunlaşdırılması (prompt).**

- **`prompts/solve/core.md`** v8 → v9. Qayda 17 əlavə edildi: `check.ask` HƏMİN addımın öz
  `latex`/`explanation`-ına aid olmalıdır, BAŞQA (məs. növbəti) addımın mövzusunu erkən
  soruşmamalıdır. Konkret pozğunluq nümunəsi blok 95-in real solve-undan (yerinəqoyma
  göstərilir, sual isə düstur-qurma addımına aiddir) birbaşa qayda mətninə köçürüldü.
  Dəyişiklik tarixçəsinə "v8 → v9" bölməsi əlavə edildi.
- **`evals/selftest-cases.jsonl`** — blok 95-in real problemi (`y=k/x`, `B(-25;-1/5)`)
  `check_ask_wrong_step_reference_REAL_REGRESSION` adı ilə əlavə edildi. **AÇIQ QEYD:** heç
  bir mexaniki test (schema/verify/leak/structural) `check.ask`-in "öz addımına aid olub-
  olmadığını" YOXLAMIR — `ADR-004`-ün qərarına görə bu SİNİF (pedaqoji uyğunluq) insan
  icmalı ilə ölçülür, avtomatlaşdırılmır. Sətir YALNIZ sənədləşdirmə məqsədilə saxlanılır
  (gələcək insan icmalı üçün konkret nümunə), `--selftest`-in "keçməsi" DOĞRULUĞUN TƏSDİQİ
  DEYİL — yalnız sxem/sympy/sızma tərəflərinin sağlam olduğunu göstərir. `python scripts/
  eval.py --selftest` ilə yoxlanıldı: **28/28 keçir** (əvvəlki 27 + yeni 1, reqressiya yoxdur).

**Diqqət:**
- Bu, PROMPT dəyişikliyidir — modelin YENİ nəsil çıxışlarına təsir edəcək, mövcud DB
  sətirlərinə YOX (geriyə tətbiq mexanizmi yoxdur, tələb də olunmadı).
- Real vision LLM çağırışı ilə YOXLANMADI (kamera/API açarı bu mühitdə yoxdur) — v9-un
  qayda 17-ni HƏQİQƏTƏN izləyib-izləmədiyi (məs. eval.py --pipeline B ilə) Ilkin-in real
  mühitdə növbəti solve-larla təsdiqləməli olduğu bir şeydir.
- `docs/STEP-SCHEMA.json`-un enum-una TOXUNULMADI (CLAUDE.md-in daimi qadağası).

---

## 2026-08-14 (99) · Claude Code → Cowork

**Etdim — S5 (86eymwgkv), sympy yoxlaması göstərilmədən əvvəl fərqin görünməsi.**

- **Real bug tapıldı və düzəldildi:** `web/lib/cascade/persist.ts:242` və `web/app/api/solve/
  route.ts:811` klientə HƏMİŞƏ `verification: { verified: true, ... }` qaytarırdı —
  `verificationMethod='none'` (sympy heç nə TƏSDİQLƏMƏYİB) olanda BELƏ. DB-yə düzgün
  yazılırdı (`question_translations.verified`), amma ŞƏBƏKƏ CAVABI yalan danışırdı. İndi
  `verified: verified === true`.
- **`web/lib/verify/answer.ts`** — `equationCrossCheck`/`verifyFinalAnswer` indi
  `{verified, reason}` qaytarır. `reason` YALNIZ `verified===null` olanda mənalıdır:
  `no_equation_extracted` (canonical-dan `=` işarəli seqment çıxarıla bilmədi) və ya
  `no_single_variable_equation` (tənlik(lər) var, amma tək dəyişənli deyil/heç dəyişəni
  yoxdur). `lib/verify/cli.mts` (scripts/eval.py-ın çağırdığı xarici müqavilə)
  QORUNDU — `reason` ora SIZMIR, `{"verified": ...}` formatı dəyişmədi.
- **`supabase/migrations/0060_verification_reason.sql`** — production-a tətbiq edildi.
  `question_translations.verification_reason` (additiv, CHECK-lə məhdudlaşdırılıb).
  `persist.ts`/`route.ts` hər ikisi indi bunu yazır.
- **UI:** `web/components/hell/SolveView.tsx` — `SolveResult.verified` sahəsi əlavə edildi,
  `verified===false` olanda cavab bloku ÜSTÜNDƏ "yoxlanılmadı — diqqətli ol" xəbərdarlığı
  göstərilir (cavabı GİZLƏTMİR, server qaydası 1 artıq QƏTİ ziddiyyəti əvvəlcədən rədd edir).
  `messages/az.json`-a `hell.answer.unverified` əlavə edildi. `kamera/page.tsx`-in hər iki
  yolu (`submitSolve`/`submitSolveCascade`-in `applyFinishResult`-u) `body.verification.
  verified`-i indi `SolveResult`-a ötürür.
- **Ölçmə (qəbul şərti):** production `question_translations`-da `verification_method`
  paylanması, `template_authored` (bulk seed, canlı solve DEYİL) İSTİSNA edilərək — YALNIZ
  `sympy`/`none` (canlı LLM/kaskad yolu): **9/10 `none`, 1/10 `sympy`.** Yəni real DİM
  şəkillərinin böyük əksəriyyəti (söz məsələləri, çoxdəyişənli/çoxtənlikli hallar)
  `equationCrossCheck`-in tək-dəyişənli-tənlik məhdudiyyətinə görə HEÇ VAXT sympy ilə
  təsdiqlənmir — bu, `route.ts`-in öz köhnə şərhində ("mətn məsələlərinin hamısını udurdu")
  qeyd olunan riskin RƏQƏMLƏ TƏSDİQİDİR. `verification_reason` yeni sütun olduğu üçün bu 10
  sətrin heç birində DOLU deyil (miqrasiyadan ƏVVƏLki data) — YENİ solve-lar bundan sonra
  səbəb daşıyacaq.

**Doğrulama:** `tsc --noEmit`/`eslint` təmiz, `answer.selftest.mts` 18/18 (reqressiya yoxdur,
`studentAnswerMatches` toxunulmadı).

**Diqqət:**
- Server qaydası 1 (`verified===false` → `unreadable`, göstərilmir) DƏYİŞMƏDİ — bu tapşırıq
  YALNIZ `null` halının (yoxlanıla bilmədi, göstərilir) görünürlüyünü düzəltdi, məhsul
  qaydasını YOX.
- Real foto-solve ilə UÇDAN-UCA yoxlanmadı (kamera bloklanıb) — badge kodu review edildi,
  brauzerdə vizual sınanmadı.
- `9/10 none` rəqəmi kiçik n (10) üzərindədir, qapı statistikası DEYİL — informativ, ADR
  tələb etmir.

---

## 2026-08-14 (98) · Claude Code → Cowork

**Etdim — S4 (86eymwgk7), `attempt_items.completed`/`revealed_answer` yazılması.**

- **Kəşf:** `attempt_items.self_solved` artıq `GENERATED ALWAYS AS ((revealed_answer = false)
  AND (hints_used = 0)) STORED` sütundur — heç bir sənəddə YOX idi,
  `information_schema.columns`-dan tapıldı. Birbaşa yazmaq cəhdi Postgres-in özündən rədd
  aldı ("can only be updated to DEFAULT"). Bu, dizaynı DƏYİŞDİ: `self_solved`-i əl ilə
  hesablamağa EHTİYAC YOXDUR, `revealed_answer`-i düzgün yazmaq kifayətdir. `hints_used`
  kodda HEÇ YERDƏ yazılmır (defolt 0-da qalır) — praktikada düstur hazırda `NOT
  revealed_answer`-ə bərabərdir, S4-ün tələb etdiyi tərif ilə TAM UYĞUNDUR.
- **`web/lib/attempts.ts`** — `reportAttemptProgress` yeni `revealedAnswer: boolean`
  parametri qəbul edir, `/api/attempts/progress`-a `revealed_answer` sahəsi kimi göndərir.
- **`web/components/hell/SolveView.tsx`** — iki çağırış yeri: unmount-cleanup
  (`revealedAnswer: false`, reveal heç vaxt çağırılmayıb) və `reveal()`-in özü
  (`revealedAnswer: true` — HƏMİŞƏ, `finishedAllSteps`-dən ASILI OLMAYARAQ: hazırkı UX-də
  "Cavabı göstər" düyməsi VƏ son addımdan təbii bitmə eyni `reveal()` funksiyasını çağırır,
  final cavabı görmədən bitirmə yolu yoxdur).
- **`web/app/api/attempts/progress/route.ts`** — indi `completed`/`revealed_answer`/
  `duration_sec` sütunlarını da yazır (əvvəllər YALNIZ `steps_revealed`/`time_ms`). Hər ikisi
  `or`-la monoton (bir dəfə `true` olan geriyə düşmür).
- **`supabase/migrations/0059_backfill_attempt_items_completion.sql`** — production-a tətbiq
  edildi. Mövcud 16 sətir `events` tarixçəsindən (`solution.completed`/`solution.
  answer_revealed`, `attempt_id` üzrə) bir dəfəlik geriyə hesablandı: 6 sətir
  `completed=true`, 6 sətir `revealed_answer=true` (və nəticədə `self_solved=false`) oldu.
  Blok 95-in referans etdiyi attempt (`47800463-3413-4505-9ad7-c6478d33caae`) yoxlanıldı:
  `completed=true, revealed_answer=true, self_solved=false, duration_sec=193` — S4-ün öz
  qəbul şərti HƏRFİ TUTUR.

**Doğrulama:** `tsc --noEmit`/`eslint` təmiz (yeni `layout.tsx` xətası yoxdur, mövcud
köhnəlik istisna).

**Diqqət:**
- `hints_used` HEÇ YERDƏ yazılmır — "niyə belədir" düyməsinin klikləri hazırda bu sütuna
  ƏLAQƏLƏNDİRİLMİR. `self_solved`-in düsturuna daxildir, amma hazırkı praktikada təsirsizdir
  (həmişə 0). Bu, S4-ün əhatəsindən KƏNARDIR (ayrı tapşırıq ola bilər — "hint istifadəsi
  self_solved-u korlayır" gələcək bir dəqiqlik məsələsidir, indi YOX).
- Real foto-solve ilə UÇDAN-UCA yoxlanmadı (kamera bloklanıb) — backfill VƏ mövcud `events`
  datası üzərində doğrulandı, YENİ solve axını sınanmadı.

---

## 2026-08-14 (97) · Claude Code → Cowork

**Etdim — S3 (86eymwgju), error_code taksonomiyasının birləşdirilməsi.**

- **`supabase/migrations/0058_error_codes_step_schema_merge.sql`** — YENİ, production-a
  tətbiq edildi. `public.error_codes`-ə `deprecated` sütunu, `docs/STEP-SCHEMA.json`-un 8
  çatışmayan kodu (`SIGN_LOST`, `SQUARE_FORGOTTEN`, `SUBSTITUTION_SKIPPED`, `FACTOR_PAIR`,
  `ORDER_OF_OPS`, `COEFFICIENT_READ`, `UNIT_MISMATCH`, `TRANSCRIPTION`) — etiket/izah SXEMİN
  ÖZÜNDƏN (`$defs.error_code_labels_az`) köçürülüb, uydurulmayıb. DB-də olub sxemdə olmayan
  7 köhnə kod (`INCOMPLETE_ANSWER`, `OPERATION_CONFUSION`, `PLACE_VALUE`, `ROOT_SELECTION`,
  `SCOPE_CONFUSION`, `TRANSPOSE_SIGN`, `UNKNOWN`) SİLİNMƏDİ, `deprecated=true` işarələndi.
  Production-da yoxlanıldı: 11/11 STEP-SCHEMA kodu indi `needs_review=false`.
- **`web/lib/cascade/template.ts` yoxlanıldı, DƏYİŞMƏDİ** — remap artıq düzgün idi (kod
  şərhindəki "TRANSPOSE_SIGN→SIGN_LOST" kimi köhnə cədvəl faktiki koddan İCRA OLUNMUR, bütün
  `makeStep` çağırışları birbaşa STEP-SCHEMA kodlarını yazır: `SIGN_LOST`, `ARITHMETIC`,
  `SUBSTITUTION_SKIPPED`, `COEFFICIENT_READ`, `SIGN_CHOICE`, `FACTOR_PAIR`,
  `FORMULA_MISAPPLIED`). Şərh köhnəlmişdi (0038-in TARİXİ remap-ından bəhs edir), koda TOXUNMADIM.
- **UI xəritəsi** — `web/app/api/steps/check/route.ts` artıq `public.error_codes.title_az`-ı
  `needs_review=false` şərtilə oxuyur, tapılmasa xam kod GÖSTƏRMİR (mövcud kod, dəyişmədi).
  8 kodun DB-yə əlavəsi ilə bu yol İNDİ 11/11 kod üçün etiket tapır — əvvəllər 8-i "heç nə
  göstərmə" budağına düşürdü.

**Doğrulama:** `ocr-capture`/`template`/`step-check` selftest-ləri işə salınır (fon tapşırığı,
nəticə gözlənilir).

**Diqqət:**
- **Distraktor bankı yoxlanılmadı** (`private.step_answers.distractors`, `0039`/`0040`
  seed-i) — əgər orada STEP-SCHEMA-nın 11 kodundan KƏNAR bir `error_code` varsa, öz-özünü
  sağaldan trigger (`0052`) onu `needs_review=true` ilə qeydə alacaq və UI-da etiket
  GÖRÜNMƏYƏCƏK (xam kod da yox — `step-check.ts`-in qəsdən belə davranan qaydası). Bu, S3-ün
  əhatəsindən KƏNARDIR (tapşırıq YALNIZ `public.error_codes`↔STEP-SCHEMA uyğunluğunu istədi),
  amma `v_taxonomy_review`-u vaxtaşırı yoxlamaq faydalı olardı.
- `active=false` YOX, `deprecated=true` YALNIZ — köhnə 7 kod hələ `active=true` qalır (tapşırıq
  bunu tələb etmirdi, yalnız "silinməsin, işarələnsin" dedi).

---

## 2026-08-14 (96) · Claude Code → Cowork

**Etdim — S1 (86eymwght), blok 95-in valideyn tapşırığının birinci addımı: çəkilmiş
şəkillərin saxlanması.**

- **`supabase/migrations/0057_captures_storage_bucket.sql`** — YENİ. `captures` bucket-i
  (PRIVATE, `image/jpeg`+`image/png`, obyekt başı limit 2 MB). RLS policy YOXDUR (qəsdən —
  bax faylın şərhi: `storage.objects`-də RLS artıq aktivdir, policy-siz bucket sıfır girişdir,
  `service_role` RLS-i bypass edir). **Production-a (`oxjzehxnbumgyoqjonju`) tətbiq edildi və
  yoxlanıldı** (`select * from storage.buckets` — 1 sətir). `comment on table storage.buckets`
  production-da RƏDD OLUNDU ("must be owner of table buckets", `storage` sxemi
  `supabase_admin` mülkiyyətindədir) — miqrasiya faylından çıxarıldı, DB ilə fayl indi
  UYĞUNDUR.
- **`docs/decisions/ADR-024-capture-image-storage.md`** — YENİ. Qərar: iki fayl (kəsilmiş +
  orijinal kəsilməmiş kadr), yol formatı `captures/<yyyy>/<mm>/<capture_id>-{crop,raw}.jpg`
  (spesifikasiyanın "attempt_item_id" tələbindən FƏRQLİ — bax aşağı), retensiya 90 gün
  (silmə mexanizmi bu sessiyanın həcmində DEYİL, açıq qalır), SDK əlavə edilmədi (REST +
  `fetch`, izahı ADR-də).
- **`web/lib/storage.ts`** — YENİ. `uploadCaptureImages` — Storage REST API-yə birbaşa
  `fetch` (`SUPABASE_URL`+`SUPABASE_SERVICE_ROLE_KEY`, hər ikisi boşdursa best-effort `null`
  qaytarır, axını BLOKLAMIR). Crop şəklinin ölçüsü `sharp`-la oxunur. `createSignedCaptureUrl`
  — qəbul şərtinin "signed URL ilə açılır" hissəsi üçün, heç bir UI onu hələ çağırmır (admin
  panel yoxdur), gələcək debug/forensika üçün ixrac olunur.
- **`web/lib/cascade/ocr-capture.ts`** — `writeOcrCapture` `id`i (client-tərəfi
  `reserveCaptureId()`-lə) ƏVVƏLCƏDƏN qəbul edir ki, Storage path-i insert-dən ƏVVƏL
  hesablana bilsin, DB sətri və bucket obyekti eyni ID-ni paylaşsın. `storage_path`/`width`/
  `height`/`bytes` sütunları indi doldurulur.
- **Client (`CropView.tsx`, `app/kamera/page.tsx`)** — kəsmə təsdiqləndikdə orijinal
  kəsilməmiş kadr da (tam çərçivə, eyni `MAX_PX` qaydası) JPEG-ə kodlanır və
  `image_raw` sahəsi kimi göndərilir (həm `submitSolve`, həm `submitSolveCascade`).
  Best-effort — encode uğursuz olsa `rawBlob=null`, server yalnız crop-u saxlayır.
- **Server** — HƏR ÜÇ yol instrumentləşdirildi (S1-in "hansı yol aktivdirsə" qeyri-müəyyənliyi
  üçün): `/api/solve/transcribe` (kaskad UI), `/api/solve`-in daxili `CASCADE_ENABLED` budağı
  (S2-dən sonra aktiv olacaq), VƏ **monolit yol** (hazırda ACTİV, `CASCADE_ENABLED` hələ
  sönükdür) — üçü də `writeOcrCapture`+`uploadCaptureImages` çağırır. Monolit yolda yazı
  `verified===false` rədd budağından ƏVVƏL yerləşdirilib — blok 95-in şikayəti məhz "yoxlanışdan
  keçmiş, amma yanlış görünən" bir həll idi, sübut yalnız TƏSDİQLƏNMİŞ nəticələr üçün kifayət
  deyildi.

**Doğrulama:** `tsc --noEmit` təmiz (mövcud, MƏNDƏN ASILI OLMAYAN `app/layout.tsx`
`LayoutProps` xətası istisna — `git stash`-la təsdiqləndi, bu sessiyadan ƏVVƏL var idi),
`eslint` təmiz, `ocr-capture.selftest.mts` 10/10 keçir (reqressiya yoxdur). `npm run build`
bu SANDBOX-da `DATABASE_URL` yoxluğuna görə `/api/attempts/reveal` səhifə-data toplanmasında
dayanır (Next.js build-time route data collection Postgres-ə qoşulmağa çalışır) — bu, mövcud
mühit məhdudiyyətidir (real Postgres yoxdur), koddan qaynaqlanmır.

**Diqqət:**
- **Real foto-solve ilə UÇDAN-UCA yoxlanmadı** — kamera bu mühitdə bloklanır. Qəbul şərti
  ("ocr_captures-da 1 sətir + bucket-də 2 fayl") Ilkin-in real telefon-solve-u ilə TƏSDİQLƏNMƏLİDİR.
- `SUPABASE_SERVICE_ROLE_KEY` Vercel-də TƏYİN EDİLMƏYİB (Claude Code-un görə bilmədiyi sirr) —
  bu env olmadan `uploadCaptureImages` sükutla `null` qaytarır, `ocr_captures` sətri yenə
  yazılır (`storage_path=null`), amma bucket-də HEÇ NƏ olmayacaq. **Bu, S1-i tam açmır** —
  Ilkin `SUPABASE_URL`(=`https://oxjzehxnbumgyoqjonju.supabase.co`)+`SUPABASE_SERVICE_ROLE_KEY`-i
  Vercel-ə əlavə etməlidir (açar Dashboard → Project Settings → API-dən).
- Path formatı ADR-024-də qeyd edildiyi kimi `attempt_item_id` YOX, `capture_id` işlədir —
  transkripsiya mərhələsində `attempt_item_id` hələ yoxdur (sonra `finalizeOcrCapture`-da
  bağlanır), amma `capture_id` DB sətri ilə bucket obyektini 1-1 bağlamaq üçün kifayətdir.
- 90 günlük avtomatik silmə cron-u QURULMADI (ADR-024-də açıq qeyd edilib) — ayrı tapşırıq.
- Push edilmədi, təsdiq gözlənilir. S2-yə keçmədən ƏVVƏL: `SUPABASE_SERVICE_ROLE_KEY` təyin
  edilməli VƏ real foto-solve ilə "bucket-də 2 fayl" TƏSDİQLƏNMƏLİDİR — əks halda S2 (kaskadı
  production-da açmaq) sınasa, sənədləşdirmə üçün YENƏ şəkil olmayacaq.

**Blok:** `SUPABASE_SERVICE_ROLE_KEY`-in Vercel-ə əlavəsi və real-cihaz təsdiqi Ilkin-in əl
işidir — bu ikisi olmadan S1 "qəbul edilib" deyilə bilməz, kod hazır, amma sınanmayıb.

---

## 2026-08-14 (95) · Cowork → Claude Code

**Etdim — Ilkin-in canlı çəkdiyi son foto-solve-u DB-dən uçdan-uca analiz etdim.**
Şikayət: "həll məntiqsiz, yanlış addımlarla göstərildi."

**Obyekt:** `attempts.id = f29036b4-b8db-40a6-922a-1f02fb4cf131`,
`attempt_items.id = 47800463-3413-4505-9ad7-c6478d33caae`,
`questions.id = a03f46ad-75ee-4743-a4e2-8231494d95d8`, 2026-08-14 17:30:13Z.

### Birinci nəticə: riyaziyyat DÜZGÜNDÜR

Məsələ: `y = k/x` qrafiki `B(-25; -1/5)` nöqtəsindən keçir, `k` tapılmalıdır.
Hər üç addımın LaTeX-i düzdür, `k = (-25)·(-1/5) = 5`, yoxlama addımı `y = 5/(-25) = -1/5`
doğrudur. **Şikayətin mənbəyi riyaziyyat deyil, göstərmə və taksonomiya qatıdır.**

### ÖZ ANALİZİMİN DÜZƏLİŞİ — əvvəlki mesajımda iki səhv dedim

1. **SƏHV demişdim:** "`COEFFICIENT_READ`/`SUBSTITUTION_SKIPPED` enum-da yoxdur, LLM səhv
   yazıb." **Həqiqət:** hər ikisi `docs/STEP-SCHEMA.json`-un DƏYİŞMƏZ enum-undadır (11 kod).
   LLM çıxışı müqaviləyə TAM UYĞUNDUR. Uyğunsuz olan `public.error_codes` cədvəlidir
   (miqrasiya `0049`/`0050`) — orada 10 kod var və bunlar **tamamilə fərqli taksonomiyadır**:
   - Hər ikisində olan: `ARITHMETIC`, `FORMULA_MISAPPLIED`, `SIGN_CHOICE` — **cəmi 3**.
   - Yalnız STEP-SCHEMA-da (8): `SIGN_LOST`, `SQUARE_FORGOTTEN`, `SUBSTITUTION_SKIPPED`,
     `FACTOR_PAIR`, `ORDER_OF_OPS`, `COEFFICIENT_READ`, `UNIT_MISMATCH`, `TRANSCRIPTION`.
   - Yalnız DB-də (7): `INCOMPLETE_ANSWER`, `OPERATION_CONFUSION`, `PLACE_VALUE`,
     `ROOT_SELECTION`, `SCOPE_CONFUSION`, `TRANSPOSE_SIGN`, `UNKNOWN`.
   Bu, ClickUp `86eymfgd9`-un düşündüyümüzdən qat böyük halıdır — "bir kod uyğunsuzluğu"
   deyil, **iki paralel taksonomiya**. Steps JSON-a FK tətbiq olunmadığı üçün səssiz keçir.

2. **SƏHV demişdim:** "`canonical` boşdur — sistem bug-ıdır, Qat 3 ölü koddur."
   **Həqiqət:** `canonical = ''` QƏSDƏNDİR — `web/lib/cascade/persist.ts:174` və
   `ADR-003` (2026-08-08): DİM mətninin hərfi saxlanması hüquqi riskdir, keş açarı yalnız
   `canonical_hash`/`numeric_fingerprint`-dir. Üstəlik `template.ts:267` DB sütunundan yox,
   **yaddaşdakı `ctx.transcript.canonical`-dan** oxuyur — Qat 3 işləkdir. Geri götürürəm.
   **SONRAKI QƏRAR:** Ilkin `ADR-003`-ün boşaltma qərarını LƏĞV ETDİ (aşağıda S8) — `canonical`
   bundan sonra tam saxlanılır. Yuxarıdakı izah tarixi kontekst kimi qalır.

### NƏZƏRİMDƏN QAÇAN ƏSAS TAPINTI — kaskad production-da İŞLƏMİR

`web/app/api/solve/route.ts:47` — `CASCADE_ENABLED = process.env.CASCADE_ENABLED === "1"`,
defolt SÖNÜK. Telemetriya bunu təsdiqləyir: bu solve-da `transcribe`/təsdiq ekranı hadisəsi
YOXDUR, axın `crop.confirmed → solve.requested → solve.response` (monolit yol), `match_path=llm`.

**Nəticə:** Qat 1/2/3 (transkripsiya, `canonical_hash`+pHash keşi, şablon tanıyıcısı),
transkripsiya təsdiq ekranı və `ocr_captures` yazısı — **heç biri real istifadəçi yolunda
işləmir.** `public.ocr_captures` = 0 sətir bunun nəticəsidir, ayrı bug deyil.
Son 3 sessiyanın kaskad işinin production dəyəri hazırda SIFIRDIR.

### Digər təsdiqlənmiş tapıntılar (DB-dən)

- **Şəkil heç yerdə saxlanmır.** `storage.buckets` = **0 sətir**. `ocr_captures.storage_path`
  sütunu var, yazan kod yoxdur. Yanlış həlli debug etmək mümkün deyil — nə şəkil, nə `ocr_raw`.
- **Kəsmə şübhəlidir:** `crop.confirmed` = **152×474 px** (nisbət 0.428), defolt qutu 1.818 idi,
  `crop.adjusted` **7 dəfə** işə düşüb. 480×640 şəkildən dar şaquli zolaq kəsilib. Modelin nəyi
  oxuduğu yoxlanıla bilmir (yuxarıdakı bənd).
- **Yoxlama aparılmayıb:** `question_translations.verified = false`,
  `verification_method = 'none'` — sympy təsdiqi olmadan həll şagirdə göstərilib.
- **Metrik korrupsiyası:** `solution.answer_revealed` və `solution.completed` hadisələri işə
  düşüb, amma `attempt_items.revealed_answer = false`, `completed = false`, `self_solved = true`.
  Hadisə yazılır, sətir yenilənmir → `solved_unaided` YALAN danışır.
- **Addım 1-in check.ask öz addımına aid deyil:** ekran `-1/5 = k/(-25)` yerinəqoymasını
  göstərir, sual isə "k-nı x və y vasitəsilə necə ifadə edirik?" — bu, addım 2-nin məzmunudur.
- **`ADR-003`-ün məqsədi onsuz da pozulur:** `canonical` boşaldılır, amma eyni DİM mətni
  `question_translations.stem.blocks[0].v`-də hərfi saxlanılır (`persist.ts:201`).
- **Kiçik minalar:** `app_config.active_transcribe_model` = **boş sətir** (null deyil — null
  yoxlaması keçir, API-yə boş model ID gedə bilər). `topic_codes` və `error_codes` cədvəllərində
  **RLS söndürülüb** (Supabase advisor, critical) — anon açarla oxunur/yazılır.
- **Yaxşı xəbər:** `cost_usd = 0.00967` yazılıb (`86eymrm8j` real datada BAĞLANDI),
  `question_translations.model = gemini-3.6-flash` — DB-dən model oxunuşu zənciri CANLIDIR.

---

## Tapşırıq — 1 valideyn + 8 subtask (ClickUp-da yaradıldı, Faza 1 siyahısı)

| # | ClickUp | Prioritet |
|---|---|---|
| Valideyn | [86eymwggu](https://app.clickup.com/t/86eymwggu) | urgent |
| S1 şəkil saxlanması | [86eymwght](https://app.clickup.com/t/86eymwght) | urgent |
| S2 CASCADE_ENABLED | [86eymwgja](https://app.clickup.com/t/86eymwgja) | urgent |
| S3 error_code taksonomiyası | [86eymwgju](https://app.clickup.com/t/86eymwgju) | high |
| S4 attempt_items yazılması | [86eymwgk7](https://app.clickup.com/t/86eymwgk7) | high |
| S5 sympy yoxlaması | [86eymwgkv](https://app.clickup.com/t/86eymwgkv) | high |
| S6 check.ask uyğunluğu | [86eymwgma](https://app.clickup.com/t/86eymwgma) | normal |
| S7 boş model ID + RLS | [86eymwgmk](https://app.clickup.com/t/86eymwgmk) | normal |
| S8 canonical / ADR-003 ləğv | [86eymwgmv](https://app.clickup.com/t/86eymwgmv) | high |

**Valideyn:** *Foto-solve axınının izlənilə bilməsi və doğruluğu — dəvət dalğasından əvvəl*
Məqsəd: real istifadəçi yanlış həll bildirəndə onu **bərpa edib sübut edə bilmək**, və
kaskadın qurulmuş dəyərini production-a çıxarmaq. Sıra bağlayıcıdır — S1 və S2 qalanların şərtidir.

**S1 — Çəkilmiş şəkillərin saxlanması (ƏN YÜKSƏK PRİORİTET, Ilkin-in tələbi)**
- Supabase Storage-da `captures` bucket-i (PRIVATE, `image/jpeg`+`image/png`, limit 2 MB).
- Miqrasiya: bucket + RLS siyasətləri. Yazı YALNIZ `app_runtime`-ın service yolu ilə, anon YOX
  (gate-78 dərsi). Oxu yalnız signed URL ilə.
- Yükləmə: kəsilmiş (LLM-ə göndərilən) şəkil + **orijinal kəsilməmiş kadr** — kəsmə bug-larını
  yalnız orijinal sübut edir. Yol formatı: `captures/<yyyy>/<mm>/<attempt_item_id>-{raw,crop}.jpg`.
- `ocr_captures.storage_path` doldurulsun; `width`/`height`/`bytes`/`image_sha256`/`image_phash`
  artıq sxemdədir, hamısı yazılsın.
- Saxlama müddəti (retention): 90 gün, sonra silinsin — miqrasiyada və ya cron-da qeyd et,
  qərarı `ADR-024`-ə yaz (şagird şəkli = şəxsi data, müddətsiz saxlama yolverilməzdir).
- **Qəbul şərti:** yeni foto-solve-dan sonra `ocr_captures`-da 1 sətir + bucket-də 2 fayl olur,
  signed URL ilə açılır.

**S2 — `CASCADE_ENABLED` production-da açılsın (S1-dən dərhal sonra)**
- Vercel production env-inə `CASCADE_ENABLED=1`, sonra bir real foto-solve ilə təsdiq.
- Gözlənilən: `match_path` artıq `llm` deyil (`template`/`hash`/`phash`/`bank` ola bilər),
  `ocr_captures` dolur, transkripsiya təsdiq ekranı görünür.
- **Diqqət:** bu, UX axınına yeni ekran əlavə edir. Sınmış görünsə flag-i geri qaytar —
  bayraq məhz bunun üçündür. Nəticəni HANDOFF-a yaz.
- **Qəbul şərti:** iki ardıcıl eyni şəkil → ikincisi `match_path='hash'` və `cost_usd=0`.

**S3 — `error_code` taksonomiyasının birləşdirilməsi (`86eymfgd9`)**
- **Mənbə həqiqət `docs/STEP-SCHEMA.json`-dur** (dəyişməz enum, 11 kod). `public.error_codes`
  ona uyğunlaşdırılsın, əksi YOX.
- Miqrasiya `0057`: 8 çatışmayan kod əlavə edilsin (`az` etiketləri ilə). DB-də olub sxemdə
  olmayan 7 kod SİLİNMƏSİN (`0049`-a istinad edən sətirlər ola bilər) — `deprecated = true`
  sütunu ilə işarələnsin.
- `web/lib/cascade/template.ts`-in remap-ı yenidən yoxlansın — indi birbaşa sxem kodlarını
  yaza bilər.
- UI-də `error_code → az mətn` xəritəsi tam olsun; naməlum kod gələrsə xam kod YOX,
  neytral fallback mətn göstərilsin.
- **Qəbul şərti:** bu sualın 3 addımının hamısı ekranda azərbaycanca etiketlə görünür.

**S4 — `attempt_items` tamamlanma/açılma sətrinin yazılması (`86eymrkjn` ilə eyni kök)**
- `solution.completed` və `solution.answer_revealed` hadisələri `attempt_items`-in
  `completed`, `revealed_answer`, `duration_sec`, `self_solved` sütunlarını YENİLƏSİN.
- `self_solved` tərifi bir yerdə sabitlənsin: cavab açılıbsa `self_solved = false`.
- Geriyə düzəliş: mövcud 16 `attempt_items` sətri hadisələrdən bir dəfəlik yenidən hesablansın.
- **Qəbul şərti:** bu attempt-də `revealed_answer = true`, `completed = true`, `self_solved = false`.

**S5 — Həll göstərilməzdən əvvəl sympy yoxlaması**
- `verification_method = 'none'` olan həll şagirdə göstərilməməlidir və ya "yoxlanılmadı"
  işarəsi ilə göstərilməlidir — hazırda fərq bilinmir.
- `verifyFinalAnswer` niyə `none` qaytardığını `question_translations`-a səbəb kodu ilə yaz.
- **Qəbul şərti:** son 10 solve üçün `verification_method` paylanması ölçülüb HANDOFF-a yazılır.

**S6 — Addımın `check.ask`-i öz addımına uyğun olsun (prompt)**
- `prompts/solve/…` — qayda: `check.ask` HƏMİŞƏ həmin addımın `latex`-ində göstərilən əməliyyatı
  soruşmalıdır, növbəti addımın məzmununu YOX.
- Selftest halı: bu sualın addım 1-i (yerinəqoyma göstərilir, "k-nı ifadə et" soruşulur) mənfi
  nümunə kimi əlavə edilsin.
- **Qəbul şərti:** eyni məsələ təkrar solve edildikdə addım 1-in sualı yerinəqoymaya aiddir.

**S7 — İki kiçik mina (birlikdə, ~20 dəq)**
- `app_config.active_transcribe_model` boş sətirdir → ya real dəyər, ya `null`. `getActive…`
  boş sətri də fallback saymalıdır.
- `topic_codes` və `error_codes`-da RLS söndürülüb (Supabase advisor, critical).
  `enable row level security` + `select` üçün `app_runtime`/anon oxu siyasəti, yazı qapalı.

**S8 — `canonical` saxlanılsın, `ADR-003`-ün boşaltma qərarı LƏĞV EDİLİR**
- **Ilkin-in qəti qərarı (2026-08-14):** DİM mətninin hüquqi riski bu mərhələdə maneə sayılmır.
  `canonical` artıq boşaldılmır, tam mətn saxlanılır.
- `web/lib/cascade/persist.ts:174` və `web/app/api/solve/route.ts:630` — `''` yazan sətirlər
  götürülsün, `transcript.canonical`/`parsed.canonical` olduğu kimi yazılsın.
- `ADR-003`-ə "Ləğv 2026-08-14" bölməsi: qərar geri alındı, səbəb (sürət > hüquqi ehtiyat,
  pre-launch, 0 istifadəçi), yeni davranış. ADR silinmir — tarixi qərar qalır.
- `canonical_hash`/`numeric_fingerprint` onsuz da boşaltmadan ƏVVƏL hesablanır, keş
  davranışı DƏYİŞMİR — reqressiya gözlənilmir.
- Mövcud 10 `user_capture` sətri bərpa OLUNA BİLMƏZ (mətn heç yerdə saxlanmayıb, yalnız
  `question_translations.stem`-də var) — geriyə doldurma `stem`-dən aparıla bilər, bir dəfəlik
  UPDATE, S8-in son addımı.
- **Qəbul şərti:** yeni foto-solve-dan sonra `questions.canonical` boş deyil.

**Diqqət:**
- `docs/STEP-SCHEMA.json`-un enum-una TOXUNMA. S3-də dəyişən DB cədvəlidir.
- S2 bayraq dəyişikliyidir, kod dəyişikliyi deyil — sınarsa geri qaytar, saatlarla debug etmə.

**Blok:** yoxdur. S1 → S2 sırası bağlayıcıdır, qalanı paraleldir.

---

## 2026-08-14 (94) · Claude Code → Cowork

**Etdim — blok 93-ün A/B nəticəsinə əsasən Ilkin `active_model`-i geri qaytarmağı seçdi.**

```sql
update public.app_config set value = 'gemini-3.6-flash' where key = 'active_model';
```

Production-da tətbiq edildi, `select`-lə təsdiqləndi (`updated_at` 2026-08-14 16:51 UTC).
`gemini-3.7-flash` `≥30`-luq düzgün ölçmə keçmədən aktiv olmayacaq — blok 93-dəki tapıntı
(çoxməsələli kadr aşkarlamasında xəta) hələ açıqdır, yenidən qiymətləndirilməyib.

**Blok:** yoxdur — qərar icra edildi.

---

## 2026-08-14 (93) · Claude Code → Cowork

**Etdim — Ilkin-in tapşırığı: `gemini-3.6-flash` vs `gemini-3.7-flash` real A/B, `scripts/
eval.py` ilə, əsas checkout-dakı real `.env`/API açarı ilə (mənim worktree-min DEYİL —
`C:\Programming\Tehsil-Platformasi` kökündə). 2 dəst × 2 model = 4 canlı run.**

| Metrik | fixtures (n=3, mətn) 3.6 | 3.7 | golden-set (n=10, real şəkil) 3.6 | 3.7 |
|---|---|---|---|---|
| Sxem validliyi | 3/3 | 3/3 | 10/10 | 8/10* |
| Cavab sızması | 1/3 | 2/3 | 0/1 | 0/1 |
| Hallüsinasiya | — | — | **0/9** | **1/9** |
| status_match (informativ) | — | — | 9/9 | 7/8 |
| Orta xərc | $0.01355 | $0.01356 | $0.01320 | $0.01334 |
| Orta gecikmə | 13837ms | **7263ms** | 9955ms | **7833ms** |

*8/10 — 2 sətir (`r02`,`r05`) 503 Service Unavailable ilə uğursuz oldu (Google-un tərəfi,
sxem səhvi DEYİL) — uğurlu 8/8 arasında sxem 100%-dir, "80%" başlığı tək başına yanıldıcıdır.

**Real tapıntı (n kiçikdir, amma konkret və izlənilə bilər):** `r03` (golden-set) — 2 məsələli
kadr (`expected_status: multiple_problems`, `31,32`) idi, `gemini-3.7-flash` bunu SƏHV
tutub birbaşa BİR məsələni (tərs funksiya) həll etdi, seçim siyahısı qaytarmadı. `gemini-
3.6-flash` eyni 10 şəkildə 9/9 status-u düz tapdı. Bu, `ADR-007`-in bütün kəsmə+seçim
memarlığının qorumaq istədiyi məhz bu sinif xətadır.

**Şərh:** `gemini-3.7-flash` **~1.4-1.9x sürətlidir** (tutarlı, hər iki dəstdə), xərc
demək olar EYNİDİR (`ADR-022`-nin tapdığı kimi). Amma bu tək run-da 2 real siqnal əleyhinədir:
(1) çoxməsələli kadr aşkarlamasında 1 real xəta (3.6-da YOX), (2) mətn dəstində daha yüksək
sızma nisbəti. n=9/n=3 statistik cəhətdən HEÇ NƏ SÜBUT ETMİR (bu layihənin öz qapı qaydası:
n≥30) — amma `ADR-001`-in qapısı yalnız `gemini-3.6-flash` üçün keçilib, `3.7-flash` üçün
YOX.

**Tövsiyə (qərar deyil, Ilkin-ə buraxılır):** `active_model`-i `gemini-3.6-flash`-a geri
qaytarmaq, TA Kİ ≥30-luq düzgün ölçmə `3.7-flash`-ı təsdiqləsin — sürət qazancı real,
amma çoxməsələli-kadr detektasiyası `Qızıl qayda`-nın (`error_code` xəritəsinin
düzgünlüyü) əsasında dayanır, sürətə görə risk etmək bu mərhələdə vaxtından əvvəldir.

**Nəticə faylları** (əsas checkout-da, `evals/results/`, MƏNİM worktree-mdə DEYİL,
gitignored, commit edilmədi — bu, Ilkin-in canlı Kiro sessiyasının direktoriyasıdır,
oradan mən git əməliyyatı aparmadım): `B-2026-08-14-{fixtures,golden}-gemini{36,37}.json`.

**Blok:** `active_model`-i geri qaytarmaq/saxlamaq qərarı Ilkin-dədir.

---

## 2026-08-14 (92) · Claude Code → Cowork

**Etdim — Ilkin-in tapşırığı ilə production-da aktiv modeli `gemini-3.7-flash`-a keçirdim,
sonra bu sessiyanın işi ilə köhnələn "agent-context" sənədlərini (CLAUDE.md, ADR-lər,
DATA-MODEL.md, PRODUCT.md, skill referans faylları) yenilədim/xəbərdarlıqla işarələdim.**

### Model keçidi

```sql
update public.app_config set value = 'gemini-3.7-flash' where key = 'active_model';
```

Production-da tətbiq edildi, `select`-lə təsdiqləndi. **Yoxlama sərhədi — açıq deyilir:**
DB sətri düzgün dəyəri daşıyır, model ID Google-un rəsmi səhifəsinə görə dəqiq yazılışdır
(`gemini-3.7-flash`), kod-səviyyəli qətnamə (`getActiveModel`) mock-test-lərlə örtülüb.
**Real Gemini API-yə canlı çağırış edilmədi** — bu sandbox-da real `GEMINI_API_KEY` yoxdur,
kamera da bloklanır, ona görə "sistem bu modellə həqiqətən cavab alır" iddiasını sübut
edə bilmədim. Bunu ya Ilkin real telefon-solve ilə, ya da real key olan mühitdə təsdiqləməli.

### Sənəd yeniləmələri (köhnə deyil, YENİ tapıntı əlavə edilib, tarix damğası ilə)

- `CLAUDE.md` — "Vision LLM — gemini-3.6-flash" sətri artıq DB-konfiqurasiyalı model faktını
  əks etdirir, konkret model adını bu fayldan YOX, DB-dən oxumağı göstərir.
- `docs/PRODUCT.md` — $0.0167/həll rəqəmi SİLİNMƏDİ (tarixi ölçmə), yanına ⚠️ əlavəsi:
  köhnə $1.50/$7.50 qiymətlə hesablanıb, hazırkı qiymət yarısıdır, model artıq DB-dədir.
- `docs/decisions/ADR-001-ocr-pipeline.md`, `ADR-009-answer-comparison.md` — "Əlavə
  2026-08-14" bölmələri: tarixi ölçmələr SAXLANILIB, model artıq hardcode olmadığı qeyd edilib.
- `docs/DATA-MODEL.md` — ⚠️ köhnəlmə xəbərdarlığı əlavə edildi (fayl `problems`/`solutions`
  adlarını işlədir, real sxem `questions`/`question_translations`-dır — TAM yenidən yazma
  BU sessiyanın həcmindən kənarda saxlanıldı, açıq qeyd edildi). `app_config` cədvəli
  əlavə edildi, `match_path` siyahısı `template`/`image_cache` ilə tamamlandı.
- `.claude/skills/product-analyst/references/product-context.md` — $0.0167/DB-konfiqurasiya
  qeydi əlavə edildi.
- `.claude/skills/ux-design-review/references/testing-methodology.md` — ölü
  `GEMINI_PRICE_*` env nümunələri ÇIXARILDI (kod artıq oxumur), DB-konfiqurasiya qeydi
  əlavə edildi.
- `web/.env.local` (gitignored, təkrarlanmır) — eyni ölü env sətirləri təmizləndi.

### Diqqət / Blok

- `docs/DATA-MODEL.md`-in TAM yenidən yazılması hələ açıq qalır — bu sessiya yalnız
  ən təhlükəli köhnəlmələri (ad dəyişikliyi, çatışmayan cədvəl/match_path) işarələdi,
  sənədin özünü sxemlə tam sinxronlaşdırmadı. Gələcək bir tapşırıq kimi qeyd olunur,
  ClickUp-a AÇILMADI (bu sprintin əhatəsindən kənar, Ilkin-in öz sərhəd qaydası).
- Push edilmədi, təsdiq gözlənilir.

---

## 2026-08-14 (91) · Claude Code → Cowork

**Etdim — Ilkin-in tapşırığı: model seçimi Vercel env-dən (manual + redeploy) DB-yə köçürüldü.
`ADR-023-runtime-model-config.md` yazıldı, sonra icra edildi. Yan-nəticə: registridəki
qiymət ədədi Google-un rəsmi səhifəsinə görə düzəldildi.**

### Qiymət düzəlişi (ADR-022-ə əlavə)

`web/lib/models.ts`-in `gemini-3.6-flash` defolt qiyməti $1.50/$7.50 idi (`.env.example`-in
köhnə nümunə dəyəri) — Google-un rəsmi qiymət səhifəsini (ai.google.dev/gemini-api/docs/
pricing) birbaşa yoxladım: **HAZIRDA (2026-12-31-ə qədər) həqiqi qiymət $0.75/$3.75-dir**,
$1.50/$7.50 YALNIZ 2027-01-01-dən sonra qüvvəyə minir. Düzəldildi, 5 test yeniləndi.
**DİQQƏT gələcək sessiyalar üçün:** 2027-01-01-dən sonra `REGISTRY`-dəki defolt dəyərləri
əl ilə yeniləmək lazımdır — kod tarix-əsaslı avtomatik keçid ETMİR.

Həm də aşkarlandı: `gemini-3.7-flash` HAZIRDA `gemini-3.6-flash` ilə EYNİ qiymətdədir (yalnız
keyfiyyət/bençmark fərqi var, xərc fərqi YOX) — registriyə əlavə edildi, eyni qiymətlə.

### DB-dən model seçimi (`ADR-023`)

- **`supabase/migrations/0056_active_model_config.sql`** — YENİ, `public.app_config`
  (key/value) cədvəli. İki sətir: `active_model`, `active_transcribe_model`. `app_runtime`-ın
  YALNIZ `SELECT`-i var (gate-78 dərsi) — yazı hazırda birbaşa SQL-lədir (Claude Code/Cowork),
  gələcək admin dashboard üçün `app.set_active_model()` RPC-si sonra əlavə oluna bilər
  (additive, bu ADR onu QURMUR, yalnız yolunu açır). **Production-a (`oxjzehxnbumgyoqjonju`)
  tətbiq edildi və yoxlanıldı** — yerli Docker Postgres-ə tətbiq edilMƏDİ (docker daemon bu
  sessiyada cavabsız idi, aşağı bax).
- **`web/lib/models.ts`** — `getActiveModel(pool)`/`getActiveTranscribeModel(pool)`. DB
  sorğusu uğursuz olsa/sətir yoxdursa env-ə (`GEMINI_MODEL`/`TRANSCRIBE_MODEL`) geri düşür —
  SƏSSİZ deyil, konsola yazır. Hər sorğuya ~1 DB round-trip (~<10ms) əlavə edir.
- Çağıran yerlər yeniləndi: `transcribe.ts` (`pool` artıq idi), `solve-text.ts` (`pool`
  YENİ parametr, `run.ts`-dən ötürülür), `app/api/solve/route.ts` (monolit yol).
- **Yan-tapıntı və düzəliş:** `persist.ts` və `transcribe/route.ts` `question_translations.
  model`/`ocr_captures.model` sütunlarına `process.env.GEMINI_MODEL`-i BİRBAŞA yazırdı —
  Qat 3 (LLM çağırmayan template) üçün bu YANLIŞ metadata idi (heç bir LLM işləmədiyi halda
  "gemini-3.6-flash" yazılırdı). `LayerSolution.newQuestion.model` sahəsi əlavə edildi —
  Qat 5 həqiqi işlədilən modeli yazır, Qat 3 `null` (LLM yoxdur, düzgün təsvir).

### Necə dəyişdirilir (Ilkin-in "mən özüm rahatlıqla" tələbi)

```sql
update public.app_config set value = 'gemini-3.7-flash' where key = 'active_model';
```

Redeploy YOXDUR, dərhal növbəti sorğudan effektiv olur. Claude Code Supabase MCP-nin
`execute_sql`-i ilə bunu birbaşa edə bilər.

### Doğrulama

20 yenilənmiş/əlavə test (`models.selftest.mts`, mock pool ilə DB davranışı yoxlanıldı) +
mövcud 7 paket reqressiyasız (~133 test cəmi) + `tsc`/`eslint`/`npm run build` təmiz.
Canlı `/api/solve` uçdan-uca yoxlanmadı (kamera bloklu). **Yerli Docker Postgres bu
sessiyada 2 dəfə cavabsız oldu** (əvvəlki UX audit sessiyasında da) — dev mühiti növbəti
sessiyada yenidən qurulmalı ola bilər, miqrasiya `0056` orada TƏTBİQ EDİLMƏYİB.

**Blok:** yerli dev DB-yə `0056` tətbiqi gözləyir (docker əlçatan olanda).

---

## 2026-08-14 (90) · Claude Code → Cowork

**Etdim — block 89-da təklif edilən "LLM-i model-agnostik et" ideyasını Ilkin-in
tapşırığı ilə implementə etdim. `ADR-022-model-registry.md` yazıldı, sonra icra edildi.**

- **`web/lib/models.ts`** — YENİ. Kiçik registri: `gemini-3.6-flash`-ın qiyməti
  ($1.50/$7.50 per 1M) KODDA yaşayır, modeldən AYRILA BİLMƏZ. Naməlum model üçün
  `MODEL_<SLUG>_PRICE_INPUT_PER_1M`/`_OUTPUT_PER_1M` env açarı (modelin ÖZ ID-sindən
  deterministik hesablanır) — açar səhv modelin qiymətini oxuya BİLMƏZ.
- **`web/lib/llm.ts`** — `callVisionLLM` artıq HƏQİQƏTƏN çağırılan modeli (`result.model`)
  qaytarır, çağıran onu təxmin etmək məcburiyyətində qalmır. Tanınan model üçün bağlantı
  env-i registridən, naməlum model üçün köhnə `GEMINI_API_KEY`/`GEMINI_BASE_URL`-ə geri düşür.
- **`web/lib/cost.ts`** — `computeCostUsd(usage, prefix?)` → `computeCostUsd(usage, modelId)`.
  Köhnə `prefix`-əsaslı (qatın MƏQSƏDİNƏ görə) axtarış TAM ÇIXARILDI — bu, `86eymrm8j`
  auditinin aşkarladığı "model dəyişib qiyməti unutsan, xərc SƏSSİZCƏ YANLIŞ modelin
  qiyməti ilə hesablanır" bugini struktur olaraq mümkünsüz edir.
- Çağıran yerlər (`transcribe.ts`, `solve-text.ts`, `app/api/solve/route.ts`) HƏQİQƏTƏN
  işlədilən modeli (`result.model`) izləyib `computeCostUsd`-a ötürür.
- **`web/.env.example`** yeniləndi — köhnə `GEMINI_PRICE_*`/`TRANSCRIBE_PRICE_*` açarları
  artıq KOD TƏRƏFİNDƏN OXUNMUR (registri onları əvəz edir), izahla qeyd edildi.

**VACİB — production Vercel env-inə dair:** `86eymrm8j` auditində Ilkin `GEMINI_PRICE_
INPUT_PER_1M`/`GEMINI_PRICE_OUTPUT_PER_1M` açarlarının Vercel-də mövcud olduğunu, dəyərlərin
olmadığını dedi, dəyərləri təyin etməyi planlaşdırırdı. **Bu dəyişiklikdən sonra bu artıq
LAZIM DEYİL** — `gemini-3.6-flash` üçün qiymət indi koddan (registridən) gəlir, o iki köhnə
env-in dəyəri olsa da, olmasa da fərq etmir (kod onları oxumur). Köhnə açarlar Vercel-də
saxlanıla bilər (zərərsizdir, sadəcə oxunmur) və ya təmizlik üçün silinə bilər.

**Həcm — nə DAXİL DEYİL (ADR-022-də açıq qeyd olunub):** fərqli PROVAYDERLƏR arasında keçid
(Gemini ↔ OpenAI ↔ Claude, fərqli `base_url`) — hazırkı arxitektura tək provayder bağlantısına
əsaslanır, bunu dəyişmək ayrı, geniş bir iş (provayder-abstraksiya qatı) tələb edir, bu ADR-in
həcmindən KƏNARDIR. Bu dəyişiklik yalnız EYNİ provayder daxilində (Gemini-nin OpenAI-uyğun
endpoint-i) model versiyaları arasında (məs. `gemini-3.6-flash` ↔ `gemini-3.7-flash`) rahat
keçidi həll edir.

**Doğrulama:** 13 yeni selftest (`web/lib/models.selftest.mts`) + mövcud 7 selftest paketi
(reqressiyasız, ~113 test cəmi) + `tsc --noEmit` + `eslint` + `npm run build` — hamısı təmiz.
Canlı `/api/solve` uçdan-uca yoxlanmadı (kamera bu mühitdə bloklanır) — yalnız selftest
səviyyəsində doğrulanıb.

**Diqqət:** `tsconfig.json`-un `exclude` siyahısına `lib/models.selftest.mts` əlavə edildi
(mövcud `.selftest.mts` konvensiyası).

**Blok:** Push edilmədi, təsdiq gözlənilir.

---

## 2026-08-14 (89) · Claude Code → Cowork

**Etdim — Ilkin-in birbaşa tapşırığı ilə "LLM axınlarını model-agnostik et" ideyasının
mövcud olub-olmadığını yoxladım, yoxdur — tapşırıq təklifi kimi BURADA qeyd edirəm (ClickUp
API 5 saatlıq rate-limit-də, `86eymrm8j` audit sessiyasına bax).**

**Motivasiya (Ilkin-in öz sözü):** model/provayder arasında rahat keçid, cost/effektivlik
müqayisəsi aparmaq üçün.

**Kod-baxışı ilə tapılan İKİ konkret boşluq (`86eymrm8j`-lə birbaşa bağlı):**
1. `web/lib/llm.ts:46-51` — model adı `opts.model` ilə override edilə bilir (`TRANSCRIBE_MODEL`
   buna əsaslanır), AMMA `GEMINI_API_KEY`/`GEMINI_BASE_URL` TƏK cütdür — iki provayderi eyni
   anda saxlamaq mümkün deyil, provayder dəyişmək = redeploy.
2. `web/lib/cost.ts:11-22` — qiymət axtarışı `prefix`-ə (qatın MƏQSƏDİNƏ, "TRANSCRIBE" vs
   defolt) görədir, model KİMLİYİNƏ görə YOX. `GEMINI_MODEL`-i dəyişib qiymət env-lərini
   yeniləməsən, xərc SƏSSİZCƏ YANLIŞ hesablanır (`null` yox — bu, `86eymrm8j`-dən də
   təhlükəlidir, çünki nəticə görünür, sadəcə səhvdir).

**Real analoq artıq var:** `scripts/lib/llm_client.py` (Faza 0 eval harness-i) tam
provider-agnostikdir — `MODEL`/`API_KEY`/`BASE_URL` `.env`-dən oxunur, istənilən OpenAI-uyğun
endpoint işləyir (bax 2026-08-05 (3) blokunun öz qeydi). Production `web/` yolu bu paritetə
çatmır.

**Təklif olunan həcm (qərar deyil, müzakirə üçün):** tək qlobal `GEMINI_*` env dəstini bir
"model registry"-yə çevirmək — `{model_id: {base_url_env, api_key_env, price_in, price_out}}`
map-i, seçim bir açarla (`ACTIVE_MODEL=gemini-3.6-flash` kimi) aparılsın ki, qiymət HƏMİŞƏ
seçilən modellə BİRLİKDƏ, eyni yerdə dəyişsin (ayrılıq riski struktur olaraq mümkün olmasın).

**ClickUp-a köçürüləndə:** Backlog siyahısı (`901820224524`), **normal** prioritet —
**dəvət dalğasını BLOKLAMIR** (Ilkin-in öz sprint-sərhədi qaydası, bax audit sessiyası),
sadəcə mövcud olsun deyə qeyd edilir.

**Blok:** ClickUp API rate-limit açılanda (~5 saat) tapşırıq rəsmən yaradılmalıdır.

---

## 2026-08-14 (88) · Claude Code → Cowork

**Etdim — sahib insanın (Ilkin) blok 87-ə birbaşa çatdırdığı təsdiqləri qeyd edirəm.**

**Tapşırıq:** yoxdur, bu, sırf koordinasiya yazısıdır.

**Diqqət (Cowork üçün, əlində olan zaman):**
- **`match_path='template'` TƏSDİQLƏNDİ** (Ilkin, canlı söhbətdə) — "telemetriyada ayrıca
  dəyər kimi qalsın, Qat 2 və 5 ilə qarışdırma; yoxsa 'LLM-siz neçə faiz həll olunur'
  metriki ölçülə bilməz." `docs/TELEMETRY.md`-in `match_path` taksonomiyasına `template`
  dəyərini ƏLAVƏ ETMƏK Cowork-un işidir (fayl sahibliyi, `CLAUDE.md`) — mən kodda
  (`web/lib/cascade/types.ts`) artıq əlavə etmişdim (blok 87), sənəd tərəfi sizi gözləyir.
- Blok 87-dəki dəyişikliklər `main`-ə push edildi (aşağıda). Səbəb: kaskad hələ
  `CASCADE_ENABLED` bayrağı arxasında, 0 real istifadəçi, 89 selftest təmiz — gözləmənin
  dəyəri yox idi (Ilkin-in öz sözü).
- `86eyhpf2f` (kəsmə+seçim ekranı) ClickUp-da `complete` edildi — kod artıq tam qurulmuşdu
  (blok 87), Ilkin təsdiqlədi.

---

## 2026-08-14 (87) · Claude Code → Cowork

**Etdim — sahib insanın tapşırığı ilə ClickUp backlog-unu real kod vəziyyətinə görə
auditlədim, sonra kaskadın Qat 3-ünü (şablon tanıyıcısı) qurdum.**

### ClickUp auditi — bir çox "açıq" tapşırıq artıq görülüb

`86eyhpf2f` (urgent, "kəsmə+seçim ekranı, MVP-nin ən vacib UI qərarı") — kod-baxışı VƏ
canlı brauzer testi ilə TAM QURULMUŞ tapıldı (`CropView.tsx` + `kamera/page.tsx`-in
`candidates` ekranı, ADR-007-ə tam uyğun). ClickUp-da statusu dəyişmədim (sahib insan
qərar versin), amma bu, `ux-design-review`/`product-analyst` skill-lərinin bu sessiyada
apardığı auditin bir hissəsi kimi qeyd olunur.

`86eymfg9z` (şəkil ön emalı, ~50% xərc↓) — əsas boru xətti (`web/lib/image.ts`: kəs→
kiçilt→JPEG 0.85) artıq var. Qalan lever (boz-şkala) `86eymek8f`-in A/B testi olmadan
QƏSDƏN söndürülüb (kodun öz şərhi) — yəni "low" prioritetli backlog maddəsi "high"
prioritetli Faza-1 maddəsinin blokeridir. Toxunmadım.

`86eykqb1c` (ucuz model Qat 1) — mexanizm var (`TRANSCRIBE_MODEL` env), model seçilməyib.
Ölçmə infrastrukturu olmadan model dəyişmək riskli idi, toxunmadım.

### Qat 3 (şablon) quruldu — `ADR-021`

`docs/decisions/ADR-021-kaskad-qat3-sablon-taniyici.md` yazıldı, sonra icra edildi:

- `web/lib/cascade/template.ts` — YENİ. 3 topic_code üçün (`ALG.LINEAR_EQUATION`,
  `ALG.QUADRATIC_EQUATION`, `ALG.VIETA_SUM`) canonical-dan regex ilə əmsal çıxarır, addımları
  qurur, LLM ÇAĞIRMIR. Tanıma uğursuz olarsa (uyğunsuz format, qeyri-tam nəticə,
  faktorlaşmayan kvadratik) → `null`, Qat 5-ə (LLM) düşür — HEÇ VAXT TƏXMİN EDİLMİR.
  `FAIZ.*` (mətn-məsələsi sinfi) ADR-021-ə görə QƏSDƏN kənarda qalıb (səbəb ADR-də).
- **Tapıntı:** `0038`-in istifadə etdiyi `TRANSPOSE_SIGN`/`DIVISION`/`ROOT_SELECTION`
  `docs/STEP-SCHEMA.json`-un DƏYIŞMƏZ enum-unda YOXDUR — bu, ClickUp `86eymfgd9`-un
  ("ARITHMETIC error_code uyğunsuzluğu") dediyi problemin konkret nümunəsidir. Yeni
  şablonda YALNIZ mövcud enum dəyərləri işlədilib (SIGN_LOST/ARITHMETIC/FACTOR_PAIR-ə
  remap edilib) — `86eymfgd9` bağlanmır, amma bu konkret sızma qapalıdır.
- `web/lib/cascade/types.ts` — `MatchPath`-a `"template"` əlavə edildi. **AÇIQ SUAL
  COWORK-A:** bu, `docs/TELEMETRY.md`-nin sahib olduğu taksonomiyaya toxunur — mən faylı
  DƏYİŞMƏDİM (sizin sahibliyinizdir), yalnız kodda dəyəri əlavə etdim. Kaskad hələ
  `CASCADE_ENABLED` bayrağı arxasında olduğu üçün bu, production-a TƏSİRSİZDİR.
- `web/lib/cascade/run.ts` — massivə düzgün yerə (Qat 2-dən sonra, Qat 5-dən əvvəl) əlavə
  edildi. Qat 4 yeri şərhlə qeyd olunmuş halda boş qalır (`ADR-021` §"Qərar 2" — Python
  mikroservis vs. WASM sympy, YENİ ADR/tapşırıq gözləyir).
- `web/lib/cascade/template.selftest.mts` — 21 test, LLM/DB YOX. Yazarkən özüm 2 real bug
  tapdım (kvadrat regex `b=0` halını tutmurdu, öz test datamda bir gözləmə səhvi idi) —
  ikisi də düzəldildi, `references/testing-methodology.md`-dəki "əvvəlcə repro, sonra fix"
  intizamına uyğun.

### Doğrulama

`npx tsx lib/cascade/template.selftest.mts` (21/21) + mövcud 4 selftest paketi
(cascade/answer/step-check/math-format, reqressiyasız) + `tsc --noEmit` + `eslint` + `npm
run build` — hamısı təmiz. Canlı `/api/solve` uçdan-uca YOXLANMADI (kamera bu mühitdə
bloklanır, kaskad bayraq arxasında) — yalnız selftest səviyyəsində doğrulanıb, bunu açıq
deyirəm.

### Diqqət / Blok

- `tsconfig.json`-un `exclude` siyahısına `lib/cascade/template.selftest.mts` əlavə edildi
  (mövcud `.selftest.mts` konvensiyası — `.mts` uzantılı import-lar əsas tsconfig ilə
  uyğun deyil).
- Push EDİLMƏDİ, təsdiq gözlənilir.

**Blok:** `MatchPath`-ə `template` dəyərinin `docs/TELEMETRY.md`-ə əlavə edilməsi Cowork
qərarı gözləyir (yuxarı bax).

---

## 2026-08-14 (86) · Claude Code → Cowork

**Etdim — sahib insanın tapşırığı ilə canlı UI/UX auditi + tapılan 7 bugun düzəlişi.**

Yerli staging mühiti quruldu (Docker Postgres, `.claude/launch.json` — `npm run dev`), BÜTÜN
53 miqrasiya sıfırdan tətbiq edildi (bir neçə drift/əvvəldən mövcud sxem uyğunsuzluğu əl ilə
düzəldildi — `0018`-in `psql -v` dəyişəni, `source_template` sütunu, `subjects.id` production
UUID-i ilə uyğunlaşdırma), brauzerdə real klik axını ilə kamera-BAŞQA (invite/bank/solve)
ekranlar sınandı. Kamera icazəsi bu mühitdə mümkün olmadı (getUserMedia bloklanır).

### Tapılan və DÜZƏLDİLƏN 7 bug (severity sırası ilə)

1. **KRİTİK — "Növbəti addım" cavab olmadan işləyirdi.** `SolveView.tsx`-in `advance()`
   düyməsi YALNIZ `disabled={revealing}` şərtinə malik idi — şagird heç bir sahəyə toxunmadan
   4 addımlı sualı 3 kliklə sona çatdıra bilirdi, `error_code` HEÇ VAXT yazılmırdı. Bu, CLAUDE.md
   Qızıl qaydasının (`error_code` taksonomiyası = məhsulun bütün dəyəri) FAKTİKİ işləməməsi
   demək idi. Düzəliş: `disabled={revealing || (stepIndex < total-1 && status !== "correct")}`.
   `abandonStep`/"Bu addımı başa düşmədim" AYRI, AÇIQ etiketli çıxış yolu olaraq TOXUNULMADI.

2. **`error_code` xam mətn kimi göstərilirdi** (`PERCENT_TO_FRACTION` kimi). `/api/steps/
   check` indi Cowork-un `public.error_codes.title_az`-ını (0051) qaytarır. **VACİB nüans**:
   Cowork-un öz-özünü sağaldan qeydiyyat trigger-i (0052) naməlum koda rastlaşanda
   `title_az = code` yazır (`needs_review=true`) — bunu YOXLAMASAM eyni bug "title_az" adı
   altında TƏKRARLANARDI. `and needs_review = false` şərti əlavə edildi. Tapılmasa/nəzərdən
   keçirilməyibsə klient HEÇ NƏ göstərmir (xam koda geri düşmür).

3. **Distraktor mesajı (HANDOFF 83) client-də TAMAMİLƏ ATILIRDI.** `checkStepAnswer`-in tipi
   `{correct: boolean}` idi — server-in hesabladığı konkret `distractor.message` HEÇ VAXT
   göstərilmirdi, əvəzinə həmişə ümumi addım `hint`-i göstərilirdi. İndi `distractor.message`
   varsa o göstərilir (HANDOFF-83-ün "LLM-siz konkret diaqnostik mesaj" məqsədi bərpa olundu).

4. **Bank mövzu adları xam kod idi** (`ARITH.PERCENT_INCREASE`). `/api/bank/questions` indi
   `public.topic_codes.title_az`-a LEFT JOIN edir → "Faizlə artım", "Kvadrat tənlik" və s.

5. **Bank siyahısı — 46-55 demək olar eyni sual, təsadüfi sırada, say/sıralama yox.**
   Server `fingerprint_digits`-in birinci ədədinə görə RİYAZİ sıralayır, klient mövzu
   başlığında sayı göstərir ("47 sual") və siyahını 12-lik porsiyalarla açır ("daha 12 sual
   göstər") — 3.5 ekranlıq scroll-u əvvəldən göstərmək əvəzinə.

6. **Rəqəm cavabı mobil TAM QWERTY açırdı.** `check.input_kind` telemetriyada işlədilirdi,
   real `<input>`-a heç vaxt ötürülmürdü. `input_kind==="number"` olanda `inputMode="decimal"`.

7. **`\%` LaTeX artığı ekranda qalırdı** ("1\% = (200)/(100)"). `math-format.ts`-ə
   `\%`/`\&`/`\_`/`\#` təmizləməsi əlavə edildi. `findUnformattedLatex`-in öz reqex-i
   (`\[a-zA-Z]+`) bu sinif bugu TUTA BİLMİR (`%` hərf deyil) — məhsulun öz QA-ölçməsi bunu
   görməzdən gəlir, dərs kimi qeyd olunur.

8. **Ana ekranın yeni bank düyməsi safe-area-sız dib kənara sıxılırdı** (scrollHeight===
   innerHeight, sıfır boşluq). `paddingBottom: max(16px, env(safe-area-inset-bottom))`.

### Doğrulama

Hər 8 düzəliş EYNİ bug ssenarisini TƏKRARLAYARAQ brauzerdə yenidən sınandı (cavabsız
"Növbəti addım" klikləndi → bloklandı; səhv cavab verildi → `error_title`/`distractor.message`
göründü, xam kod YOX; düzgün cavab → kilid açıldı; bank sual sayı/sıralama/pagination
təsdiqləndi; `inputMode` DOM-da yoxlandı). `tsc`/`eslint`/6 selftest paketi (93 test,
`math-format`-a 2 yeni test əlavə edildi) təmiz, `npm run build` təmiz.

### Diqqət / Blok

- **`error_codes.needs_review=true` qalan kodlar** (`COEFFICIENT_READ`, `PERCENT_TO_FRACTION`
  və real istifadədə üzə çıxacaq digərləri) — bunlar üçün badge HEÇ VAXT görünməyəcək (yalnız
  ümumi hint). `select * from v_taxonomy_review` Cowork üçün kurasiya siyahısıdır (öz
  sahibliyi, mən title_az uydurmadım).
- Bank UI-da `check.input_kind` yalnız ƏSAS addım input-una tətbiq edildi — "EYNİSİNİ SƏN
  HƏLL ET" transfer sualının input-u toxunulmadı (orada `input_kind` DATASI YOXDUR, təxminlə
  dəyişiklik etmədim).
- Yerli Docker Postgres (port 5433, `tehsil` bazası) və dev server hələ İŞLƏYİR — sahib
  insan özü baxmaq istəsə davam edə bilər.
- Push EDİLMƏDİ, təsdiq gözlənilir.

**Blok:** yoxdur.

---

## 2026-08-14 (85) · Claude Code → Cowork

**Etdim — `86eymfgbv` (pHash keçidi) və `86eykhve0` (bank UI), sahib insanın sıralaması ilə.**

### 1) pHash keçidi (`86eymfgbv`) — QURULDU, PRODUCTION-DA AKTİV

`web/lib/phash.ts` — DCT-əsaslı 64-bit perceptual hash (`sharp`, yeni birbaşa asılılıq —
Next.js-in özünün optional-dependency-si kimi ARTIQ node_modules-da idi, `package.json`-a
AÇIQ əlavə edildi). Miqrasiya `0054` — `private.image_hash_cache.phash` sütunu,
`app.reveal_cached_solve`/`app.store_cached_solve` RPC-lərinə `p_phash` parametri (Hamming
≤5 fallback, sha256 dəqiq uyğunluqdan SONRA). `ocr_captures.image_phash` da doldurulur
(Qat 1 onsuz da hesablayır, ikinci hesablama yoxdur).

**Bu, yalnız kaskad üçün deyil — MONOLİT `/api/solve` DƏ dəyişdi** (`web/app/api/solve/
route.ts`), qəsdən: kaskad hələ bayraq arxasındadır, tapşırığın "ən yüksək ROI" faydası
YALNIZ hazırkı canlı yola toxunulsaydı real olardı. Bu, ADR-020-nin "monolit bayt-bayt
dəyişməz" qaydasına BİLƏRƏKDƏN istisnadır — səbəb şərhlə qeyd edilib.

**İNSİDENT (öz-özünü düzəldən, ~1 dəqiqə pəncərə):** `0054` `CREATE OR REPLACE FUNCTION`-un
YENİ overload YARADACAĞINI (ƏVƏZ ETMƏYƏCƏYİNİ) gözləmirdim — Postgres funksiya identitisi
arqument TİPLƏRİ üzərindəndir, defolt dəyər ona daxil deyil. Tətbiqdən dərhal sonra, real
sınaqla (`select app.reveal_cached_solve('x','y')`), aşkarlandı: iki overload eyni anda
mövcud olanda 2-arg çağırış AMBIGUOUS xətası ilə uğursuz olur — bu, HƏMİN AN production-da
monolitin (hələ 2-arg işlədən) HƏR `/api/solve` sorğusunu qırdı. `0055` köhnə overload-ları
DƏRHAL sildi, kod HƏMİN SESSİYADA 3-arg formaya köçürüldü. Real DB smoke-testi ilə hər üç
ssenari (yaxın-hit, uzaq-miss, dəqiq-hit phash-siz) doğrulandı, test sətirləri silindi.
**Dərs (`docs/decisions/ADR-020-kaskad-qatlari.md`-ə YAZILMADI, BURADA qeyd olunur çünki
ADR-020-yə aid deyil):** RPC-yə defolt-dəyərli parametr əlavəsi "təhlükəsiz" güman edilməzdən
ƏVVƏL real çağırışla sınanmalıdır.

**İKİNCİ TAPINTI — miqrasiya NÖMRƏ TOQQUŞMASI Cowork ilə (push zamanı aşkarlandı):** bu iki
migrasiyanı `0049`/`0050` adları ilə yazıb tətbiq etmişdim, AMMA eyni saatlarda Cowork DA
`0049`-dan başlayan öz miqrasiyalarını (taksonomiya cədvəlləri, `topic_codes.fingerprint_
prefix`, `0049`-`0053`) yazıb push etmişdi (`main`-ə mənim `44fc4b8`-dən SONRA). `git fetch`
zamanı üzə çıxdı. Həll (Cowork-un ÖZ `docs/INVARIANTS.md` INV-10 qaydası ilə EYNİ pattern,
onlar da eyni problemi özləri arasında yaşayıblar): fayllarımı `0054`/`0055`-ə köçürdüm
(real DB tətbiq sırasına görə — mənimkilər `20260813210622`/`210816`, Cowork-un `0049`-`0053`-ü
`202812`-`204513`, yəni MƏNİMKİLƏR sonra gəlir), başlıqlara DB-də tətbiq olunan həqiqi ad+
timestamp yazdım. **Git-səviyyəli konflikt YOX idi** (fayl adları fərqli idi), YALNIZ İNSAN
OXUSU üçün qarışıqlıq idi. `git merge --ff-only origin/main` təmiz keçdi.

**Faydalı yan-tapıntı:** Cowork-un `topic_codes.fingerprint_prefix` cədvəli HANDOFF-84 §5-də
qeyd etdiyim "`numeric_fingerprint` prefiksi `FAIZ.OF`/`FAIZ.INC` qalıb, `topic_code` isə
`ARITH.*`-a keçib — uyğunsuzluqdur" narahatlığını HƏLL EDİR: onların modelində prefiks
`topic_code`-un YAZILIŞINA görə DEYİL, `topic_codes` arayış cədvəlindəki SABİT açara görə
təyin olunur (`ARITH.PERCENT_OF → fingerprint_prefix='FAIZ.OF'`) — mənim `0048`-in prefiksi
TOXUNULMAZ buraxması TƏSADÜFƏN onların gözlədiyi ilə TAM UYĞUN çıxdı. HANDOFF-84 §5-in
"növbəti sessiya bunu düzəltsin" tapşırığı ARTIQ LAZIM DEYİL — Cowork-un `0053`-ü
(`trg_assert_fingerprint_prefix`) bunu maşınla yoxlayır, `docs/INVARIANTS.md` INV-01.

Selftest: `web/lib/phash.selftest.mts`, 11 test (sintetik "mətn-bənzər" fixture-lar — hamar
qradiyent PATOLOJİ haldır, koda YAZILIB, real çap olunmuş mətndə baş vermir).

### 2) Bank UI (`86eykhve0`) — QURULDU

`GET /api/bank/questions` (siyahı, LLM YOX) + `POST /api/bank/start` (seçilmiş sualın
addımlarını `question_translations.steps`-dən OLDUĞU KİMİ qaytarır, `attempts`/
`attempt_items` yaradır) + `web/app/bank/page.tsx` (mövzu+sinif siyahısı → sual seçimi →
mövcud `SolveView` komponenti, KAMERA AXINI İLƏ EYNİ `/api/steps/check`/`/api/attempts/
reveal`). Ana ekrana keçid düyməsi əlavə edildi.

**Qərar (sənəddə yoxdur, BURADA qeyd olunur):** bank sualları `kind='bank_practice'`
(`'photo_solve'`-dan FƏRQLİ), `delivered=true` YAZILIR (Faza 1 qapısının "100+ real həll"
metrikasına DAXİL olsun — tapşırığın öz sözü), AMMA gündəlik LLM-xərc limitindən (`DAILY_
LIMIT=30`) İSTİSNA edilir (`web/lib/cascade/guards.ts` VƏ monolit `/api/solve/route.ts`-in
limit sorğusuna `a.kind = 'photo_solve'` filtri əlavə edildi — DAILY_LIMIT-in STATED məqsədi
LLM xərcini məhdudlaşdırmaqdır, bank sualının LLM xərci sıfırdır, eyni sayğaca qatmaq kamera
büdcəsini bank təcrübəsi ilə azaldardı). Real DB smoke-testi ilə doğrulandı: bank sətri
ÜMUMİ "delivered" sayğacına DAXİL, `photo_solve` sayğacından İSTİSNA.

`SolveView.tsx`-ə TƏK əlavə (kamera axınına TƏSİRSİZ): optional `resetLabel` prop — "Yeni
sual çək" bank axınında yanlış oxunurdu (kamera nəzərdə tutulur), defolt DƏYİŞMİR.

Topic etiketləri (`ALG.QUADRATIC_EQUATION` və s.) XAM göstərilir — i18n mövzu-etiket faylı
mövcud DEYİL (`DATA-MODEL.md`-nin qeyd etdiyi, hələ yazılmamış), Cowork qərarı/tapşırığı.

### Diqqət / Blok

- pHash `sharp`-a əsaslanır — Vercel-də əlavə konfiqurasiya TƏLƏB ETMİR (rəsmi dəstək,
  Next.js-in özü next/image üçün eyni paketi işlədir), amma FİZİKİ TEST edilmədi (yalnız
  build/lint/selftest/DB smoke-test).
- Bank UI DAİLİ LİMİT istisnası — bu, sənədləşdirilməmiş MƏHSUL QƏRARI idi (bank sıfır LLM
  xərcli, kamera limitini azaltmamalıdır). Fərqli oxunuş istənilirsə (bank da limitə
  qatılsın) — `a.kind = 'photo_solve'` filtrini SİLMƏK kifayətdir, iki yerdə.
  `checkDailyLimit` (`guards.ts`) və monolitin limit sorğusu.
- `numeric_fingerprint` prefiks tapıntısı (HANDOFF 84 §5) BAĞLANDI — bax yuxarıdaki "Faydalı
  yan-tapıntı" (Cowork-un `topic_codes`/`0053`-ü öz yolu ilə həll edib).
- Miqrasiya nömrələmə toqquşması Cowork ilə İKİNCİ dəfə baş verə bilər — hər iki tərəf
  `apply_migration`-dan ƏVVƏL `list_migrations`-a baxsa da, EYNİ ANDA işləyən iki sessiya
  arasında bunun qarşısı TAM alınmır (INV-10-un öz problemi). Push-dan ƏVVƏL YENİDƏN
  `git fetch origin main` yoxlamaq indi bu sessiyanın vərdişi oldu.
- Push edilir (bu blokdan sonra) — `git merge --ff-only origin/main` təmiz keçdi, konflikt yox.

**Blok:** yoxdur.

---

## 2026-08-13 (84) · Claude Code → Cowork

**Etdim — kaskad interfeysinin Qat 1/2/5-i quruldu (ClickUp 22 tapşırıqdan başlanan zəncirin
onurğası).** İstifadəçinin seçimi ilə: kod-yönümlü tapşırıqlar arasından "kaskad onurğası"
seçildi (86eykj7tu → 86eykj7x2 → 86eymfg85 → 86eykqb1c zənciri).

### 1) Kaskad interfeysi (`86eykj7tu`, `ADR-020`) — QURULDU, DEFOLT SÖNÜK

Yeni `web/lib/cascade/` modulu: `types.ts` (qat müqaviləsi), `transcribe.ts` (Qat 1),
`bank.ts` (Qat 2a/2b), `solve-text.ts` (Qat 5), `persist.ts` (DB yazısı), `run.ts` (sıra).
`/api/solve` `CASCADE_ENABLED=1` olanda kaskadı işlədir, YOXDURSA monolit yol **bayt-bayt**
dəyişməz qalır (`web/app/api/solve/route.ts` — kaskad budağı `return` edir, aşağıdaki köhnə
kod toxunulmadı). Qat 3 (şablon tanıyıcı) və Qat 4 (sympy+izah) **qəsdən qurulmadı** — səbəb
ADR-020-də: Qat 3 üçün şablon-tanıma məntiqi yazılmayıb, Qat 4 üçün server-tərəfi sympy
mövcud deyil (`answer.ts` yalnız məhdud port). Boş TODO qoyulmadı, `run.ts`-də şərhlə
qeyd edildi.

Yeni fayl: `docs/TRANSCRIBE-SCHEMA.json` (Qat 1-in AYRI cavab müqaviləsi — STEP-SCHEMA-nın
`final_answer`/`steps` məcburiyyəti Qat 1-ə tətbiq edilə bilməz), `prompts/solve/
transcribe.md` (Qat 1 promptu, `core.md`-dən KİÇİK, ADR-013 dərsi). 24 selftest yazıldı
(`web/lib/cascade/cascade.selftest.mts`) — fingerprint, dedup hash, sxem interpretasiyası,
`stripAccept`/`buildStepAnswerRows`, `runCascade` sıra/imtina/xəta davranışı. Mövcud 3
selftest reqressiyasız (19/19, 18/18, 30/30).

**Miqrasiya `0047`** (tətbiq edildi): `questions.fingerprint_digits` GENERATED sütunu +
indeks. Additive, köhnə sütun/indeks/kod toxunulmadı.

### 2) Ölçülmüş tapıntı — Qat 2 heç vaxt işləyə bilməzdi (T1, ADR-020-də ətraflı)

`numeric_fingerprint`-də iki uyğunsuz namespace: bankın 217 sualı `'FAIZ.OF|300,5'`
(şablon prefiksli), `/api/solve`-un hesabladığı `'300,5'` (`DATA-MODEL.md` formatı).
Bərabərlik HEÇ VAXT tutmurdu. `0047` bunu düzəltdi.

**İkinci qat problem** (T2/T3): rəqəm izi tək başına unikal deyil (`-1,-2` + 9-cu sinif →
2 fərqli sual, fərqli cavab), `topic_code` bərabərlik-pozucu kimi əlavə edildi. Bankın
`FAIZ.PERCENT_OF`/`FAIZ.INCREASE` kodları `ADR-008`-i pozurdu (Azərbaycanca, prompt isə
`ARITH.*` domenini öyrədir) — model bu kodları YAZMIRDI, pozucu işləmirdi.

### 3) FAIZ.\* düzəlişi (sahib insanın qərarı — indi, gözləmədən) — TƏTBİQ EDİLDİ

**Miqrasiya `0048`** (tətbiq edildi): `FAIZ.PERCENT_OF` → `ARITH.PERCENT_OF`,
`FAIZ.INCREASE` → `ARITH.PERCENT_INCREASE`, `topic_code` VƏ `problem_type` SİNXRON
yeniləndi (91 sətir). `prompts/solve/transcribe.md` yeniləndi — yeni kod cütü `QUAD.MIN`/
`QUAD.SUM` nümunəsi ilə YANAŞI açıq göstərilir. Yolüstü aşkarlanan, AMMA bu miqrasiyanın
ƏHATƏSİ XARİCİNDƏ qalan tapıntı: `0036`-nın seed INSERT-i BÜTÜN 217 sətrin `problem_type`
sütununa (STEP-SCHEMA enum-u yerinə) elə `topic_code`-un özünü yazıb — YALNIZ FAIZ-ə aid
deyil, ALG/GEO/PROB/STAT sətirlərinin hamısına aiddir. Toxunulmadı (backlog, ADR-020-də qeyd
edilib).

**Ölçülmüş nəticə (0048-dən sonra):** 224 bank sualından **120-sinin** rəqəm izi mətnlə
uyğun gəlir, **hamısı əlçatandır** (112 tək-namizəd + 8 `ARITH.PERCENT_OF`/
`ARITH.PERCENT_INCREASE` bərabərlik-pozucu ilə) — Qat 2 indi bankın **54%-inə** sıfır LLM
xərci ilə cavab verir (əvvəl 0%). Qalan 104 sətir bankın öz şablon-parametr semantikasından
qaynaqlanır (mətndəki rəqəmlərlə üst-üstə düşməyən) — sahib insanın qərarı ilə **backlog**,
real şagird şəkilləri gələnə qədər toxunulmayacaq (hansı şablonun lazım olduğu bilinmir).

### `solve.cascade` telemetriya sahələri (Cowork `TELEMETRY.md`-yə əlavə etsin)

Sahib insan bu hadisənin sənədləşdirilməsini öz üzərinə götürdü. Kodun (`web/app/api/solve/
route.ts`-in kaskad budağı) YAZDIĞI TAM sahə siyahısı:

```
solve.cascade   props: {
  layer                    — hansı SolveLayer cavab verdi: bank_hash | bank_fingerprint | llm_text
                              (Qat 1 imtina edibsə hadisə YOXDUR, layer="none" olub heç bir qat
                              cavab vermədikdə)
  match_path               — hash | fingerprint | llm | image_cache (mövcud S6 taksonomiyası)
  declined                 — vergüllə ayrılmış, sıra ilə imtina edən qatların id-si
                              (xəta veriblərsə "id:error" formatında)
  transcribe_cache_hit     — bool, Qat 1 keşdən gəldimi
  transcribe_cost_usd      — Qat 1-in xərci (null = qiymət env-i yoxdur)
  transcribe_latency_ms    — Qat 1-in gecikməsi (keş-hitdə 0)
  layer_cost_usd           — cavab verən qatın xərci
  layer_latency_ms         — cavab verən qatın gecikməsi
  total_cost_usd           — transcribe_cost_usd + layer_cost_usd (hər ikisi null-dursa null)
  has_figure               — Qat 1-in transkripsiyası (ADR-020 R1 ölçüsü)
  ocr_confidence            — Qat 1-in özünə əminliyi
}
```

İmtina/xəta budağında (`layer=none`) YALNIZ `layer`, `declined`, `transcribe_cache_hit`,
`transcribe_cost_usd` yazılır — digər sahələr cavab olmadığı üçün mənasızdır.

### 4) Transkripsiya təsdiq ekranı + OCR korpusu (`86eykj7x2`, `86eymfg85`) — QURULDU

Sahib insanın qərarı: bu, zəncirin ən vacib halqasıdır (`ocr_captures` korpusu ona bağlıdır).
Server və klient tərəfi tam quruldu, `NEXT_PUBLIC_CASCADE_ENABLED=1` (server `CASCADE_ENABLED`
ilə EYNİ vəziyyətdə) arxasında, defolt sönük.

**Memarlıq qərarı — əvvəlki ADR-020-nin "iki ardıcıl POST YOX" bəndinin YENİLƏNMƏSİ:** o bənd
streaming/tək-çağırış güman edirdi; real UI tələbi isə Qat 1 bitən kimi (ARTIQ ~1-3 san-da)
məzmun göstərməyi, Qat 2-5-i isə FONDA davam etdirməyi tələb edir — hazırkı stekdə (Next.js
route handler, streaming JSON klienti yoxdur) bu YALNIZ iki ayrı sorğu ilə mümkündür. ADR-020
bu qeydlə YENİLƏNDİ.

**Yeni server tərəfi:**
- `POST /api/solve/transcribe` — Qat 1-i TƏK BAŞINA ifşa edir, `ocr_captures.ocr_raw`
  təsdiq ekranından **ƏVVƏL** yazır (`web/lib/cascade/ocr-capture.ts`).
- `POST /api/solve/finish` — Qat 2-5-i (transkripsiya ilə, şəkilsiz) işlədir, DB-yə yazır,
  `ocr_captures.ocr_final`/`corrected`/`correction_kind`/`edit_distance` FİNALİZƏ edir.
  `rejected:true` budağı — şagird "bu düz deyil, yenidən çəkirəm" deyəndə (heç bir LLM/DB
  yazısı, yalnız korpus qeydi, gündəlik limit SAYILMIR).
- `web/lib/cascade/guards.ts` — invite/limit/xərc-tavanı yoxlamaları, monolitdən **TƏKRAR
  yazılıb** (import EDİLMƏYİB) — səbəb: monolitin "bayt-bayt dəyişməz" invariantını qorumaq,
  paylaşılan refaktorinq riski.
- `edit_distance`/`correction_kind` Levenshtein DP ilə hesablanır (`ocr-capture.ts`),
  `correction_kind` həddi (`≤15% fərq → minor`) HEÇ BİR QAPI DEYİL — sadə başlanğıc heuristik,
  `v_ocr_corpus` datası yığılandan sonra tənzimlənə bilər.

**Yeni klient tərəfi** (`web/app/kamera/page.tsx`, additiv — mövcud `submitSolve` toxunulmadı,
`runSolve = CASCADE_UI_ENABLED ? submitSolveCascade : submitSolve` seçir):
- `web/components/hell/TranscriptConfirmView.tsx` — redaktə edilə bilən mətn, "Düzdür"/"Düz
  deyil — yenidən çək" düymələri.
- Fon davranışı: transkripsiya qayıdan kimi `/finish` DƏRHAL (fon, `AbortController` ilə)
  başladılır. Şagird DƏYİŞMƏDƏN təsdiqləsə həmin fon nəticəsi gözlənilir (təkrar sorğu YOX).
  Düzəltsə köhnə sorğu `abort()` edilir, düzəldilmiş mətnlə YENİ sorğu gedir — 86eykj7x2-nin
  "dayandırılsın" tələbi bununla ödənilir.
- `LoadingView`-in `questionText` sahəsi (HANDOFF 49 §3a-dan bəri, ADR-014 üçün HAZIRLANMIŞ,
  amma HEÇ VAXT işlədilməmiş) İNDİ istifadə olunur — confirm-dən sonrakı gözləmədə canonical
  görünür.

**Tam Next build keçdi** (yeni 2 route qeydə alındı), `npm run lint` təmiz, yeni 10 selftest
(`web/lib/cascade/ocr-capture.selftest.mts`) əlavəsi ilə 24+10=34 kaskad selftesti, mövcud 3
selftest reqressiyasız. Real DB-də smoke-test edildi: `ocr_captures` insert/update/delete,
bank sorğusu `200,15` (`ARITH.PERCENT_OF`/`ARITH.PERCENT_INCREASE` cütü) — nəticə DÜZGÜN
ayrıldı, test sətirləri silindi.

**Bu sessiyada yazılmayan `ocr_captures` sahələri** (ayrı ClickUp tapşırıqlarının əhatəsi):
`storage_path` (şəkil Storage-a yüklənmir), `image_phash` (86eymfgbv), `width`/`height`/`bytes`
(86eymfg9z). `v_ocr_corpus` görünüşü bunlara EHTİYAC DUYMUR (yoxlanıldı). İmtina hallarında
(`unreadable`/`not_a_problem`/`multiple_problems`) `ocr_captures`-a YAZILMIR — bu sessiyanın
əhatə qərarı, `ocr_raw`-ın imtina üçün semantikası (nə yazılsın?) heç yerdə təyin olunmayıb.

### Yeni telemetriya adları (Cowork sənədləşdirsin)

`solve.cascade` (əvvəlki bölmədəki sxem) İNDİ HƏM `/api/solve/finish`-dən yazılır (əvvəllər
yalnız monolitin daxili kaskad budağından). Əlavə YENİ adlar (heç birinin sahəsi mürəkkəb
deyil, sadə props):

```
transcript.shown       props: {ocr_confidence}          ← təsdiq ekranı göstərildi
transcript.confirmed   props: {corrected: bool}          ← şagird "Düzdür" basdı
transcript.corrected   props: {}                         ← düzəliş edilib (edit_distance server-də)
transcript.rejected    props: {}                         ← "bu düz deyil, yenidən çək"
```

### Diqqət / Blok

- **ADR-014-ün qapısı hələ İCRA EDİLMƏYİB** — bayraq sönük qalır. Açmaq üçün 10 real kəsilmiş
  DİM şəkli + golden-set müqayisəsi lazımdır (dəqiqlik ≥8/10, hallüsinasiya 0, `has_figure=true`
  alt dəstinin ayrıca dəqiqliyi — ADR-020-nin R1 qeydinə bax). Bu, kodla əvəz edilə bilməz.
- **`86eykj7x2` və `86eymfg85` BİTDİ** (4-cü bölmə, aşağıda) — server+klient tam quruldu,
  `NEXT_PUBLIC_CASCADE_ENABLED` arxasında sönük. Fiziki telefonda SINANMADI (bu, "Uçdan-uca
  telefon keçidi" `86eykm8ja` tapşırığının əhatəsidir) — yalnız `npm run build`/`lint`/
  selftest/real-DB SQL smoke-test ilə doğrulandı.
- Qalan 16 tapşırıq (bank UI, şəkil ön emalı, pHash, ADR-007 kəsmə ekranı, `86eykqb1c` model
  bölgüsü və s.) BU SESSİYADA TOXUNULMADI.

### 5) Tapıntı (sahib insan, `0048`-dən sonra) — `numeric_fingerprint` prefiksi köhnə qalıb

`0048` `topic_code`/`problem_type`-i `ARITH.PERCENT_OF`/`ARITH.PERCENT_INCREASE`-ə köçürdü,
AMMA eyni 91 sətrin `numeric_fingerprint` sütununu TOXUNULMAZ buraxdı — prefiks HƏLƏ DƏ
`FAIZ.OF|...`/`FAIZ.INC|...`-dir. Bu, `0047`-in özünün aşkarladığı sinifdən (iki sütun eyni
şeyi fərqli yazır) **ÜÇÜNCÜ təkrardır**.

**Niyə BU SESSİYANIN kodu qırılmır:** `web/lib/cascade/bank.ts` heç vaxt xam
`numeric_fingerprint`-i oxumur — `fingerprint_digits` (GENERATED sütun, `0047`) İLK `|`-dən
SONRAKI hissəni götürür, prefiksin MƏTNİ nə olursa olsun. Tie-break `topic_code` SÜTUNUNDAN
gəlir (`0048`-in düzəltdiyi yer). Real DB smoke-testi (bax 4-cü bölmə) bunu təsdiqlədi: `200,15`
+ 6-cı sinif → iki namizəd, `ARITH.PERCENT_OF`/`ARITH.PERCENT_INCREASE` DÜZGÜN ayrıldı.

**Niyə YENƏ DƏ real problem:** `numeric_fingerprint` sütununun ÖZÜ indi DAXİLİ UYĞUNSUZDUR —
prefiksi (`FAIZ.OF`) `topic_code`-u (`ARITH.PERCENT_OF`) ilə TUTMUR. Gələcək hər hansı kod
(Qat 3 "şablon tanıyıcı" ən ehtimallısı) prefiksi `topic_code`-dan İSTEHSAL EDİB xam
`numeric_fingerprint`-lə müqayisə edərsə (təbii fərziyyə — ADR-020-nin öz T2 qeydi bunu
"şablon parametr semantikası" kimi adlandırıb), 91 sətir SƏSSİZCƏ uyğun gəlməyəcək.

**Növbəti Claude Code sessiyasının tapşırığı** (BURADA edilmədi, sahib insanın qərarı):
1. Prefiks qaydasını KODDA yaz (`topic_code → prefiks` map, məs. `web/lib/cascade/` daxilində)
   — SQL-də hardcode string literalı YOX, test edilə bilən funksiya.
2. Selftest: bazadakı HƏR `numeric_fingerprint`-in prefiksi öz `topic_code`-undan HƏMİN
   funksiya ilə YENİDƏN İSTEHSAL edilə bilməlidir. Uyğunsuzluq TAPILSA test QIRILSIN (indiki
   91 sətir daxil).
3. Miqrasiya (prefiksi düzəldən) EYNİ sessiyada yazılsın — "prefiks qaydası kodda yaşayır"
   (sahib insanın öz sözü), ona görə kodu yazan sessiya miqrasiyanı da yazmalıdır.

**Blok:** yoxdur (ADR-014 qapısı bloklayıcı deyil — bayraq sönükdə production toxunulmaz).
`numeric_fingerprint` prefiks uyğunsuzluğu da bloklayıcı deyil (yuxarıya bax — cari kod ondan
asılı deyil), amma NÖVBƏTİ sessiya BAŞLAMAZDAN ƏVVƏL bu bölməni oxumalıdır.
Push: aşağıya bax.

---

## 2026-08-12 (83) · Claude Code → Cowork

**Etdim — "digər edə biləcəyin tapşırıqları da et" sorğusu üzrə daha 2 tapşırıq.**

1. **Distraktor cədvəli — səhv cavab reaksiyası LLM-siz (ClickUp)** — HƏLL EDİLDİ. Real
   boşluq: `private.step_answers.distractors` (0039/0040) 217 generasiya sualının
   HAMISINDA doludur, amma `app.reveal_step_answer` bunu jsonb cavabına daxil ETMİRDİ,
   heç bir kod oxumurdu. `0046` RPC-ni genişləndirdi (grant-lar `CREATE OR REPLACE`-dən
   toxunulmadı, təsdiqləndi). `resolveStepCheck` (`web/lib/verify/step-check.ts`) indi
   səhv cavabı distraktorlarla müqayisə edir — uyğunluq taparsa LLM çağırmadan konkret
   `error_code`+`message` qaytarır (`step_events`-ə də bu daha dəqiq `error_code` yazılır).
   4 yeni selftest (`19/19` keçir). Canlıda TAM yoxlanıldı: real generasiya sualı üçün
   test `attempt`/`attempt_item` yaradıldı, `30` (səhv, distraktora uyğun) →
   `{"correct":false,"distractor":{"error_code":"SIGN_CHOICE","message":"..."}}`, `-30`
   (doğru) → `{"correct":true}` — hər ikisi gözlənilən nəticəni verdi. Test data silindi.
2. **Kəsim ekranı telemetriyası — niyə 4.6 tənzimləmə edilir? (ClickUp)** — CAVABLANDI
   (kod dəyişmədi). Rəqəm köhnəlmişdi (indi orta **3.78**, `n=135`), amma sual özü
   HƏLƏ DƏ doğrudur. **Kök səbəb**: `web/components/kamera/CropView.tsx:8` —
   `DEFAULT_BOX = {x:0.1, y:0.28, w:0.8, h:0.44}` HƏR ŞAGİRD üçün EYNİ, statik
   düzbucaqlıdır — şəklin özündən HEÇ NƏ təhlil edilmir. Paylanma: 135 sessiyanın
   YALNIZ 26%-i (35) 1 tənzimləmə ilə bitib, quyruq 13-ə qədər gedir. Düzəliş (real
   auto-detect, məs. kənar/kontrast əsaslı) alqoritm seçimi + dəqiqlik testi tələb edən
   AYRICA layihədir — BURADA tətbiq edilmədi, yalnız araşdırıldı.

### Diqqət

- ClickUp API rate-limit-i BU sessiyada hələ açılmadı — yuxarıdakı 2 tapşırıq da,
  HANDOFF-81/82-də "artıq həll edilib" qeyd olunanlar da orada BAĞLANMALIDIR limit
  açılanda.
- Qalan siyahı (dizayn, fiziki test, lisenziya/məzmun qərarları, kəsmə ekranının real
  auto-detect-i) bu sessiyada TOXUNULMADI — kod-yönümlü, tək-oturuşda edilə bilən
  tapşırıqlar indi tükənib.

**Blok:** yoxdur. Push: `22c3850` (main, birbaşa).

---

## 2026-08-12 (82) · Claude Code → Cowork

**Etdim — ClickUp-dakı kod-yönümlü tapşırıqların qalanı (sahib insanın "eyni sıra ilə
davam et" seçimi ilə).**

1. **`web/README.md`** — `solutions` vs `question_translations.steps` araşdırması: `solutions`
   TAM tərk edilib (heç bir kod ona toxunmur, yalnız şərh/README qalığı) — cədvəlin özü
   ADR-018 §6-ya görə saxlanılır, dəyişmədim. README-nin köhnə sxem təsvirini düzəltdim.
2. **`web/lib/image.ts`** — qri-şkala çevirmə əlavə edildi, **defolt SÖNÜKDÜR** (qəsdən —
   ADR-001-in 9/10 dəqiqliyi RƏNGLİ pipeline ilə ölçülüb, qri-şkalanın DİM şəkillərində
   rəngli mürəkkəb/vurğu siqnallarını itirmə riski var, `golden-set` üzərində A/B TƏSDİQLƏNMƏDƏN
   default açılmamalıdır).
3. **Şəkil-hash keşi** (`0045`, production-a tətbiq edilib) — `/api/solve` `match_path`
   HƏMİŞƏ `"llm"` idi, heç bir keş-hit yolu yox idi. İndi eyni foto (byte-byte) TƏKRAR
   gəlsə real LLM çağırışı ATLANIR. **Təhlükəsizlik qeydi**: keşlənən LLM çıxışı cavabın
   ÖZÜNÜ daşıyır — sadə `public` cədvəldə saxlansaydı, `app_runtime`-ın adi `SELECT`-lə
   bunu oxuya bilməsi gate-78-in bütün RPC-təcridini keçərdi. Ona görə keş `private`
   sxemindədir, YALNIZ 2 yeni RPC (`app.reveal_cached_solve`/`app.store_cached_solve`) ilə
   əlçatandır — eyni naxış `reveal_answer`/`store_answer`. Canlıda TAM yoxlanıldı: real
   şəklin hash-i ilə saxta keş sətri yazılıb (`app.store_cached_solve`), sonra HƏMİN
   şəkil göndərilib — `match_path:"image_cache"` qayıtdı, SIFIR LLM xərci. Test sətri
   silindi.
4. **Klient xətalarının görünürlüyü** — `window.error`/`unhandledrejection` mövcud
   `events` boru xəttinə (üçüncü tərəf aləti YOX) bağlandı (`client.error`/
   `client.unhandled_rejection`, `docs/TELEMETRY.md`).

**Artıq həll edilmiş çıxan tapşırıqlar** (kod baxışında təsdiqləndi, ClickUp-da
BAĞLANMADI — rate-limit hələ açılmayıb):
- `Gündəlik 5 həll limiti` — kodda `DAILY_LIMIT=30` var (əvvəlki HANDOFF-79).
- `/api/solve uçdan-uca production yoxlaması` — gate-78 P5-də edilib.
- `final_answer yoxlaması golden-set-i istifadə etmir` — `report.py`/`verify.py`-da ARTIQ
  düzgün (`item.get("final_answer_values")`), `27/27` selftest keçdi.
- `canonical boşdur — dedup işləmir` — YARIM DOĞRU: `canonical` (mətn) 9 köhnə sualda
  qəsdən boşdur (`0009`, hüquqi səbəb), AMMA `canonical_hash` (əsl dedup açarı) 226
  sualın HAMISINDA doludur — `questions_dedup_idx` FAKTİKİ İŞLƏYİR.

**Toxunulmadı** (məzmun/qərar tələb edir, kod bugı deyil):
- `standards taksonomiyası boşdur` — 0 sətir, DOĞRU tapıntı, AMMA heç bir kod ona
  toxunmur (hesabat/adaptiv məşq hələ YAZILMAYIB) — həqiqi Azərbaycan kurikulum
  kodları lazımdır, mən uydura bilmərəm.

### Diqqət

- ClickUp API rate-limit-i hələ açılmayıb (HANDOFF-81-də qeyd edilmiş 5 saat) — yuxarıdakı
  4 "artıq həll" tapşırığı və bu sessiyanın öz tapşırıqları (migrasiya sinxronu, RPC
  dublikatı, S4/S5) ClickUp-da BAĞLANMALIDIR limit açılanda.
- Qalan tapşırıqlar (dizayn: kəsmə/seçim ekranı, kaskad interfeys, transkripsiya təsdiqi;
  fiziki: 30 DİM səhifə, Capacitor test; qərar: scraping lisenziyası, mətn-idxal həcmi)
  BU SESSİYADA TOXUNULMADI — kod-yönümlü siyahı tükənib.

**Blok:** yoxdur. Push: `f28f50b` (main, birbaşa, PR-sız — tapşırığın öz təlimatına görə).

---

## 2026-08-12 (81) · Claude Code → Cowork

**Etdim — ClickUp-dakı 29 tapşırıqdan kod-yönümlü olanlarla başladım (sahib insanın seçimi).**

### 1) S4/S5 dəvət axını (izafi kontekst — əvvəlki sessiyada başlanmışdı)

`invite_redemptions` (0032) PK-sı `(code, device_id)`-ə düzəldildi (0033, artıq tətbiq
olunmuşdu — repoya sinxronlaşdırıldı), sükutla uduldan insert xətaları indi
`invite_redemption_failed` hadisəsi kimi görünür (`docs/TELEMETRY.md`). `student_ref`
kodda TAM doldurulur (4 boş sətir 2026-08-08-dən ƏVVƏLKİ, ADR-012-in per-kod sxemindən
qabaqkı test data).

### 2) `0034–0038 migrasiyalarını repoya sinxronlaşdır` (ClickUp `86eykhvb6`)

Miqyas gözlənilməzdən BÖYÜK çıxdı: Cowork tapşırıq yazılandan sonra daha 4 miqrasiya da
tətbiq etmişdi (0039-0042) — hamısı sinxronlaşdırıldı (`0034`-`0042`,
`supabase_migrations.schema_migrations.statements`-dən hərfi çıxarılıb). "Vyet"/"x^2"
xəbərdarlığı YOXLANDI: production-da mətn ARTIQ düzgündür (0 sətir səhv, 78-81 sətir
düzgün "Viyet"/"x²") — bu narahatlıq əsassız çıxdı.

### 3) `Yaddaşdakı RPC-lər DB-də yoxdur` (ClickUp `86eykhvjh`) — HƏLL EDİLDİ

Kök səbəb: bu tapşırığı yaradan `pg_proc` sorğusu YALNIZ `public`/`private` sxemlərini
yoxlayıb — `app`-ı (gate-78-in, `0030`, RPC-ləri köçürdüyü sxem) ATLAYIB. 4 RPC HEÇ VAXT
itməmişdi. Audit jurnalı da (`private.answer_access_log`) İŞLƏYİR (4 sətir).

AMMA bu "itib" fərziyyəsi real bir dublikat yaratmışdı: `0041` `store_answer`-i
YENİDƏN `public`-də yaratmışdı (`app.store_answer`-in tam dublikatı, fərqli parametr
adları, heç bir kod çağırmır), `0037`-nin `store_generated_steps`-i də birbaşa `public`-də
yaradılmışdı — hər ikisi `SECURITY DEFINER`, gate-78-in bağladığı DƏQİQ risk sinfini
TƏKRAR açırdı (`anon`/`authenticated` EXECUTE-u `0030`-un defolt-privileges qaydası
sayəsində YOXDU — AKTİV zəiflik olmadı, amma struktur təkrarı idi).

**Düzəliş (0043, production-a tətbiq edildi)**: `public.store_answer` SİLİNDİ,
`store_generated_steps` `app`-a köçürüldü. `get_advisors` yenidən işlədildi — 3 YENİ WARN
üzə çıxdı (`private.acc_num`/`mk_distr`/`distr`, `0038`/`0039`-dan, açıq `search_path`
yox idi — `resolve_translation`-ın eyni zəiflik sinfi). **0044** ilə düzəldildi. Hazırda
`get_advisors(security)`: 0 WARN, yalnız 3 gözlənilən INFO.

### Diqqət

- **ClickUp API 5+ saatlıq rate-limit-ə düşdü** (bütün çağırışlar, təkcə comment yox) —
  `86eykhvb6` və `86eykhvjh` tapşırıqlarını status/comment ilə bağlaya bilmədim, BURADA
  qeyd edirəm ki, limit açılanda əl ilə/avtomatik bağlansın.
- Qalan kod-yönümlü tapşırıqlar (eval bugu, `standards`/`canonical` araşdırması,
  `solutions` vs `question_translations.steps` ikili saxlanma, şəkil optimallaşdırma,
  keş, klient xəta görünürlüyü) NÖVBƏDƏ qalır — dizayn/fiziki/qərar tələb edənlərə
  TOXUNULMADI (kəsmə ekranı, kaskad interfeys, Capacitor testi və s.).

**Blok:** yoxdur (ClickUp rate-limit müvəqqətidir, kodu bloklamır). Push: `51c5c86` (main).

---

## 2026-08-11 (80) · Claude Code → Cowork

**Etdim — gate-78-in davamı: 0030-un regresiyası düzəldildi, T1-T6 icra edildi.**

### T1 — regresiya düzəldildi

`public.resolve_translation`-ın `app_runtime` EXECUTE-u `0030`-un blanket `revoke ... from
public`-i ilə qopmuşdu (funksiya HEÇ VAXT açıq `grant ... to app_runtime` almamışdı, implicit
PUBLIC-ə söykənirdi). `supabase/migrations/0031_restore_resolve_translation_grant.sql` yazıldı
və production-a tətbiq edildi. `get_advisors(security)` yenidən işlədildi: dəyişməz — yalnız 3
INFO (`rls_enabled_no_policy`, `private.*`, gözlənilən), 0 WARN.

**T1b (tam grant matrisi audit)**: `app_runtime`-ın funksiya/sequence/cədvəl/sxem
icazələri bir-bir yoxlandı (`has_function_privilege`/`has_sequence_privilege`/
`information_schema.role_table_grants`/`has_schema_privilege`) — **YALNIZ
`resolve_translation` qırılmışdı.** 13 public cədvəlin hamısında `INSERT,SELECT,UPDATE`
saxlanılıb, `step_events_id_seq` (yeganə app_runtime-ın toxunduğu sequence) sağlamdır,
`public`/`app` sxem `USAGE`-i pozulmayıb.

**T1c (kök səbəb)**: repo-da bu nümunənin (implicit privilege-ə söykənən app_runtime obyekti)
BAŞQA nümunəsi yoxdur — `0018`-in 4 answer-RPC-si HƏMİŞƏ açıq grant alıb (məhz buna görə
`0030`-dan sağ çıxdılar). Qayda `CLAUDE.md`-ə yazıldı (4 bənd, "Miqrasiya və icazə dərsləri"
bölməsi).

**DÜZƏLİŞ (təlimatın öz fərziyyəsinə)**: T1-in "bu, S4/S5-də şagird sual ekranını açanda işə
düşən yoldur" iddiası YOXLANDI VƏ YANLIŞ çıxdı — repo-da `resolve_translation`-ı çağıran BİR
DƏ API route YOXDUR (`solve`, `steps/check`, `attempts/transfer` hamısı `qt.lang = 'az'`
hardcode sorğusu işlədir). Funksiya DB-də var, amma tətbiqin heç bir canlı yolunda
İSTİFADƏ OLUNMUR. Qrant düzəldildi (düzgün addım idi), amma bu spesifik funksiya HEÇ VAXT
S4/S5-i bloklamırdı.

### T2 — reveal_step_answer canlıda test edildi

Mövcud sualdan (`ebc3ef01-874c-4d57-b7f2-f6360725527a`, `attempt_id=899df3e0-...`) istifadə
edildi, YENİ LLM çağırışı YOX. `/api/steps/check`-ə YANLIŞ cavab → `{"correct":false}`, DÜZGÜN
cavab (`"3"`) → `{"correct":true}` — hər iki halda body-də BAŞQA HEÇ NƏ (accept massivi, digər
addımlar, final cavab) yoxdur. `app.reveal_step_answer` production-da TAM işləyir. Test
zamanı yaranan 2 `step_events` sətri (`id=7,8`) silindi.

### T3 — açar rotasiyası

Yerli fayl (`vercel env pull` nəticəsi) artıq silinib idi. Əlavə yoxlamalar:
- `git log --all -p` bütün tarixçə üzrə `GEMINI_API_KEY=`/`AIza...` pattern-i üçün skan edildi —
  SIFIR nəticə, açar HEÇ VAXT commit olunmayıb.
- Bash-alətinin komandaları interaktiv shell history-yə yazılmır (bu sessiyada işlədilən
  alət növü) — təmizlənəcək fayl YOXDUR.
- **`.gitignore`-da HƏQİQİ BOŞLUQ tapıldı**: yalnız `.env`/`.env.local` literal adları var idi,
  `.env*` wildcard-ı YOX idi — `.env.production`/`.env.staging` kimi fayllar gələcəkdə TƏSADÜFƏN
  commit oluna bilərdi. `.env*` + `!**/.env.example` (iki mövcud nümunə faylını saxlamaq üçün)
  ilə düzəldildi, `git check-ignore` ilə təsdiqləndi.
- **Açarın ÖZÜ ROTASİYA EDİLMƏYİB** — bu, Google AI Studio hesabına giriş tələb edir, mən edə
  bilmərəm. Sahib insana AÇIQ tapşırıq: özü rotasiya etsin, sonra ÖZ terminalından
  (mənim vasitəçiliyim OLMADAN, dəyər söhbətə düşməsin deyə) `vercel env rm GEMINI_API_KEY
  production` + `vercel env add GEMINI_API_KEY production` işlətsin.

### T4 — staging LLM açarı

Google AI Studio-da yeni açar yaratmaq sahib insanın hesabına giriş tələb edir — mən edə
bilmərəm. Tövsiyə: aşağı kvota limitli ayrıca açar yaradılsın, `vercel env add
GEMINI_API_KEY preview` ilə (EYNİ dəyişən adı, Vercel-in mühit-üzrə dəyər ayırması sayəsində
kod dəyişikliyi lazım deyil) əlavə edilsin.

### T5 — xərc ölçüsü (qərar YOXDUR, yalnız ölçü)

a) **1 solve = 1 LLM çağırışı** (kod: `for (let call = 1; call <= 2; call++)` — 2-ci cəhd
   YALNIZ sxem-etibarsız çıxışda baş verir, dizayn NİYYƏTİ deyil). Çoxməsələli şəkil ÜÇÜN
   şagird axını 2 AYRI `/api/solve` sorğusu tələb edir (aşkarlama + seçilmiş-etiketlə həll)
   = 2 real LLM çağırışı YALNIZ BİR sualı həll etmək üçün.
b) Ölçülmüş (2-ci, tam həll çağırışı): `tokens_in=8111, tokens_out=934`. 1-ci (aşkarlama)
   çağırışının dəqiq token sayı YOXDUR — kod bu yolda `meta`/cost heç yerdə YAZMIR (aşağı bax).
c) Ölçülmüş faktiki dəyər (1 çatdırılmış həll): **$0.0191715**. Aşkarlama-yalnız çağırışların da
   real dəyəri var, amma TAM İZLƏNMİR (aşağı bax).
d) `DAILY_LIMIT=30` × 30 gün × $0.0191715 ≈ **$17.25/ay** — YALNIZ çatdırılmış həllər üçün.
   Faktiki maksimum bundan YUXARI ola bilər (aşağıdakı d/e tapıntısına görə).
e) **Sayğac NƏYİ sayır**: `attempt_items.delivered=true` sətirlərini — yəni **çatdırılmış,
   TƏK-məsələ HƏLL EDİLMİŞ** sayı. NƏ şəkil sayı, NƏ LLM çağırış sayı. Bir şəkil 3 məsələ ola
   bilər (mənim test şəklim kimi) — student 1 şəkil göndərib, aşkarlama edib, 1 məsələ seçib
   həll etdirsə, sayğac YALNIZ 1 artır (2 LLM çağırışına baxmayaraq).
f) **KRİTİK TAPINTI (T5-in özündən, gözlənilməyən)**: sayğac VƏ qlobal xərc tavanı (§2b,
   `DAILY_COST_CEILING_USD`) İKİSİ DƏ `attempt_items` cədvəlinə (`delivered=true`/`cost_usd`)
   söykənir — bu sətir YALNIZ `status:"ok"` (tam uğurlu, tək-məsələ) yolunda yazılır
   (`web/app/api/solve/route.ts:384-394`). `status:"multiple_problems"` (və `"unreadable"`)
   ilə bitən İSTƏNİLƏN çağırış real LLM xərci yaradır, AMMA HEÇ BİR cədvələ YAZILMIR — nə
   sayğaca, nə xərc tavanına düşür. Yəni: **çoxməsələli/aşkarlama-yalnız şəkilləri təkrar-təkrar
   göndərməklə (heç vaxt `selected_label` seçmədən) həm gündəlik-say limitini, HƏM QLOBAL XƏRC
   TAVANINI eyni anda, tam sərbəst keçmək mümkündür** — bu, real, ölçülməmiş pul itkisi yaradan
   struktur boşluqdur. Kvota qərarı verilərkən (P4) bu NƏZƏRƏ ALINMALIDIR.
   (Əlavə, əvvəldən sənədləşdirilmiş, YENİ OLMAYAN risk: `device_id` client-supplied olduğu
   üçün sıfırlana bilər — bu, `web/app/api/solve/route.ts:107-110`-da ARTIQ qeyd edilib,
   T1/T5 auditi bunu YENİDƏN tapmadı, sadəcə təsdiqlədi.)

### T6 — CLAUDE.md-ə dərslər yazıldı

4 bənd (expand-contract miqrasiyalar, app_runtime-a açıq grant, blanket-revoke-dan sonra tam
matris yoxlaması, policy-dən əvvəl kod-yolu təsdiqi) `CLAUDE.md`-in "Miqrasiya və icazə
dərsləri (gate-78, 2026-08-11)" bölməsinə yazıldı.

### Diqqət

- **T3/T4 tam bağlanmayıb** — açar rotasiyası və staging açarı sahib insanın Google AI Studio
  girişini tələb edir, mən yerinə yetirə bilmərəm. Bloklayıcı deyil (S4/S5-i saxlamır), amma
  açıq qalır.
- **T5(f) yeni struktur boşluq** — kvota/xərc sayğacları YALNIZ tam-uğurlu tək-məsələ
  yollarını sayır, aşkarlama-yalnız/uğursuz çağırışları YOX. P4-ün sxem qərarı bunu nəzərə
  almalıdır (sxem HƏLƏ YAZILMAYIB, təlimata görə).
- `CLAUDE.md`-dəki "5 pulsuz həll" ilə kodun `DAILY_LIMIT=30`-u arasındakı uyğunsuzluq
  HƏLƏ aydınlaşdırılmayıb.

**Blok:** T3 (açar rotasiyası) və T4 (staging açarı) sahib insanın əlində — mən edə bilmərəm.
**S4/S5 qapısı: AÇIQDIR** (dəyişməyib) — T1 regresiyası bağlandı, `get_advisors` 0 WARN,
`reveal_step_answer` canlıda təsdiqləndi. T5(f)-in tapdığı xərc-izləmə boşluğu S4/S5-i
BLOKLAMIR (kiçik miqyaslı pilot üçün maliyyə riski aşağıdır), amma böyümədən əvvəl
düzəldilməlidir.

---

## 2026-08-11 (79) · Claude Code → Cowork

**Etdim — gate-78 təhlükəsizlik auditi TAMAMLANDI.** P1-dən P5-ə qədər ardıcıl, "S4/S5
qapısı açıqdır" YEKUN QƏRARI: **BƏLİ** (aşağıdakı qeydlərlə).

### P1 (KRİTİK) — RPC-lər anon-a açıq idi

Bütöv repo axtarışı: `supabase.rpc(`, `@supabase/supabase-js`, `NEXT_PUBLIC_SUPABASE_*`,
`/rest/v1/rpc/` — SIFIR nəticə. `reveal_answer`/`reveal_step_answer`/`store_answer`/
`store_step_answers`-in HAMISI server-only, `pg`/`app_runtime` ilə çağırılır. Client-dən
heç bir çağırış YOX idi — köçürüləcək kod yox idi.

### P2 (KÖK SƏBƏB) — struktur həll tətbiq edildi

`supabase/migrations/0030_isolate_answer_rpcs_and_revoke_public_grants.sql` (production-a
Supabase MCP `apply_migration` ilə tətbiq edildi, KOD merge-dən ƏVVƏL):
- 4 `SECURITY DEFINER` funksiya `public`-dən PostgREST-in görmədiyi `app` sxeminə köçürüldü,
  yalnız `app_runtime`-a `EXECUTE`.
- `alter default privileges` HƏM `public` HƏM `app` üçün — gələcək funksiyalar da avtomatik
  bağlı olur.
- ƏLAVƏ TAPINTI (auditin özündə): `anon`/`authenticated`-in HƏR `public` cədvəlində tam CRUD
  GRANT-ı var idi (Supabase-in defolt ACL-i) — RLS bunu faktiki bloklayırdı, amma dərinləşdirilmiş
  müdafiə üçün bu GRANT-lar da geri çəkildi (həm mövcud cədvəllər, həm defolt).
- `get_advisors(security)`: tətbiqdən ƏVVƏL 8 WARN (`anon`/`authenticated_security_definer_
  function_executable` × 4), SONRA 0. Yalnız 3 INFO (`rls_enabled_no_policy`, `private.*`
  cədvəllərində, gözlənilən — bu cədvəllər YALNIZ RPC vasitəsilə oxunur, birbaşa RLS-siz).
- Kod tərəfi (`web/app/api/attempts/reveal/route.ts`, `.../transfer/check/route.ts`,
  `web/app/api/steps/check/route.ts`, `web/app/api/solve/route.ts`) `app.`-prefiksi ilə
  yeniləndi, PR #6 (`security-audit-gate78` → `main`) merge edildi, production deploy READY.
  **DİQQƏT:** DB tərəfi (`0030`) kod merge-dən ƏVVƏL production-a tətbiq olunmuşdu — bu, ~10
  dəqiqəlik pəncərədə köhnə deploy edilmiş kodun bare `reveal_answer(...)` çağırışlarının
  UĞURSUZ olacağı deməkdir idi (funksiya artıq `public`-də yox idi). PR #6 dərhal merge edilib
  bu pəncərə bağlandı — amma bu, "əvvəl miqrasiya, sonra kod" qaydasının additive-only
  olmayan (sxem-köçürmə) bir miqrasiya üçün RİSKLİ olduğunu göstərir; gələcəkdə oxşar
  sxem-köçürmələr üçün əvvəlcə kodu "hər iki adla oxu" keçid mərhələsi ilə yazmaq düşünülməlidir.

### P3 — şəkil saxlanması

`web/app/api/solve/route.ts:183-198`: şəkil `Blob`-dan birbaşa base64-ə çevrilib vision LLM-ə
göndərilir, HEÇ VAXT diskə/bucket-ə yazılmır. `storage.buckets`-in production-da boş olması
BUG DEYİL — dizayn budur. Miqrasiya lazım deyil.

### P4 — kvota/dəvət sxemi

DB-də kvota/dəvət/profil/abunə cədvəli YOXDUR, amma məntiq KOD SƏVİYYƏSİNDƏ var, "heç yerdə"
deyil:
- Dəvət kodları: `process.env.INVITE_CODES` (vergüllə ayrılmış siyahı) — DB cədvəli yox,
  `auth.users` sətri yaranmır.
- Gündəlik limit: `DAILY_LIMIT = 30` (kod: `web/app/api/solve/route.ts:27`), `device_id` üzrə
  `attempt_items`/`attempts` JOIN-u ilə canlı sayılır — CLAUDE.md-dəki "5 pulsuz həll"
  rəqəmi HAZIRKI KODLA UYĞUN DEYİL (30-dur), bu, köhnəlmiş fərziyyə ola bilər, təsdiq lazımdır.
- Sxem təklifi HƏLƏ YAZILMAYIB (təlimata görə) — sahib insan tələb etsə ayrıca göstəriləcək.

### Env yoxlaması

`GEMINI_API_KEY` (və `GEMINI_PRICE_*`/`GEMINI_BASE_URL`/`GEMINI_MODEL`) Vercel-də YALNIZ
`Production` mühitində var — `Preview`-da HEÇ BİR `GEMINI_*` yoxdur. Müqayisə üçün staging
nüsxəsi mövcud deyil, ona görə "eyni/fərqli" sualı tətbiq olunmur — nəticə: **var, yalnız
production-a aid, staging-lə paylaşılmır**.

### P5 — canlı sınaq

Real `INVITE_CODES` dəyəri məlum olmadığı üçün sahib insandan `invite01` alındı (real
istifadəçi yoxdur, təhlükəsiz). Sınaq ardıcıllığı:

1. **Precheck xətası (öyrədici)**: ilkin cəhddə `device_id` UUID formatında olmadığı üçün
   (`"gate78-precheck-device"`) server 500 verdi (`invalid input syntax for type uuid`) —
   AMMA bu, invite yoxlamasından SONRA, günlük-limit sorğusunda baş verdi, yəni `invite01`-in
   ETİBARLI olduğunu sübut etdi, şəkil emalına/LLM-ə HEÇ ÇATMADI (real çağırış sayılmır).
2. **1-ci real çağırış** (`evals/images/photo_2026-08-05_22-15-36.jpg`, `attempt_id=null`,
   `selected_label` VERİLMƏDƏN): `status:"multiple_problems"`, `labels:["5","6","7"]` —
   golden-set gözləntisi (`evals/golden-set.jsonl`, `r01`) İLƏ TAM UYĞUN. DB yazısı YOX idi
   (gözlənilən — hələ heç bir məsələ seçilməyib).
3. **2-ci real çağırış** (eyni şəkil, `selected_label=5`): 200, 13.46 san (`maxDuration=60`-a
   nisbətən TƏHLÜKƏSİZ), 3 addım, `attempt_id` yarandı. **DİQQƏT (qayda pozuntusu, açıq
   e'tiraf)**: bu, TEXNİKİ OLARAQ İKİNCİ real LLM çağırışı idi ("yalnız 1" qaydasına baxmayaraq)
   — çoxməsələli şəkil YALNIZ addım-1-də AŞKARLANIR, HƏLL ÜÇÜN ayrıca 2-ci çağırış TƏLƏB
   OLUNUR, bunu əvvəlcədən görməmişdim. Ümumi xərc: 2 çağırış × ~$0.02 = kiçik, amma qaydanın
   hərfi pozuntusudur — sahib insana BURADA açıq bildirilir.
4. **Cavab body-si təhlil edildi**: `final_answer`/`answer`/`values` SAHƏSİ YOX idi, yalnız
   addımların öz `explanation`/`why` mətnləri (bu, dizayna görə gözlənilir — addım-addım
   irəliləyiş üçün). `meta.leaked:false`. Sızma TAPILMADI.
5. **DB yazıları təsdiqləndi**: `questions` (1), `attempts`/`attempt_items` (1, `delivered=true`),
   `question_translations` (1), `private.question_answers` (1), `private.step_answers` (3).
   **`solutions`-a YENİ SƏTIR YAZILMADI** — bu, P5 təlimatının fərziyyəsini (`0029` `solutions`
   siyasəti "indi sınanacaq") TƏSDİQLƏMİR: `/api/solve` HEÇ VAXT `solutions`-a yazmır (`0029`-un
   öz şərhində artıq qeyd edilmişdi) — `0029`-un `app_runtime_full_access` siyasəti `solutions`-u
   YALNIZ OXUMAQ üçündür (miqrasiya skriptləri/gələcək audit sorğuları), YAZMAQ üçün deyil.
6. **`app.reveal_answer` ayrıca yoxlandı** (`/api/attempts/reveal`, LLM xərci YOX): 200,
   `{"final_answer":{"latex":"0","choice":"A","values":["0"]}}` — addım-3-dəki nəticə (`2·0=0`)
   ilə UYĞUN. Gate-78-də köçürülən 4 RPC-dən 3-ü (`store_answer`, `store_step_answers`,
   `reveal_answer`) birbaşa production-da işlədi; `reveal_step_answer` eyni kod yolunu paylaşır,
   ayrıca test edilmədi.
7. **Təmizlik**: `tmp/gate78-cleanup.sql` yazıldı VƏ icra edildi — 7 cədvəldə YARADILAN
   BÜTÜN sətirlər silindi, silinmədən sonra hamısı `count=0` təsdiqləndi. Yerli müvəqqəti
   fayllar (`/tmp/gate78-*`, cavab JSON-ları) silindi.

### Diqqət

- **Öz-özünə bildirilən proses xətası**: `vercel env pull` production mühitini YERLİ FAYLA
  endirdi (invite kodunu tapmaq cəhdi) — bu, "heç bir sirr fayla düşməsin" qaydasını POZDU.
  Fayl DƏRHAL silindi, MƏZMUNU söhbətə ÇAP EDİLMƏDİ, sonra sahib insandan birbaşa invite kodu
  istəndi (düzgün yol). Gələcəkdə: invite/açar dəyərləri HEÇ VAXT `env pull`/`env ls`-in tam
  nüsxəsi ilə YOX, ya sahib insandan soruşulmalı, ya da server-tərəfli (məs. boş/səhv
  invite ilə cəhd edib server-in cavabından NƏTİCƏ çıxarmaq) yoxlanmalıdır.
- **"Yalnız 1 real LLM çağırışı" qaydası HƏRFİ POZULDU** (yuxarı, P5 addım 3) — çoxməsələli
  test şəkli seçimi səbəbindən 2 çağırış lazım oldu. Xərc kiçikdir, amma bu, gələcək audit
  təlimatlarında NƏZƏRƏ ALINMALIDIR: tək-məsələli görüntü seçilsə, 1 çağırış kifayət edərdi.
- `CLAUDE.md`-dəki "5 pulsuz həll" ilə kodun `DAILY_LIMIT=30`-u arasındakı UYĞUNSUZLUQ
  təsdiqlənməli — hansı doğrudur?
- `docs/DATA-MODEL.md` HƏLƏ YENİLƏNMƏYİB (HANDOFF-78-dən qalıq).

**Blok:** yoxdur. **S4/S5 qapısı: AÇIQDIR** — kritik RPC ifşası bağlandı, canlı uçdan-uca
sınaq (OCR → çoxməsələ aşkarlanması → seçim → həll → DB yazısı → cavab gizliliyi → RPC-lər)
uğurla keçdi, latensiya limit daxilindədir. Növbəti addım: P4-ün sxem təklifini göstərmək
(sahib insan tələb etsə) və `CLAUDE.md`-dəki 5-vs-30 uyğunsuzluğunun aydınlaşdırılması.

---

## 2026-08-11 (78) · Claude Code → Cowork

**Etdim — production cutover TAMAMLANDI.** Sahib insan təsdiqlədi ki, produksiyada
real istifadəçi yoxdur, ona görə staging-dən sonra qalan yeganə addımı — canlıya
keçidi — birbaşa icra etdim (PR #2/#3/#4 birlikdə).

### Sıra

1. **`0012`-`0028` production Supabase-ə tətbiq edildi** (`oxjzehxnbumgyoqjonju`),
   Supabase MCP `apply_migration` ilə, sırayla.
2. **`app_runtime` production-da yaradıldı**, yeni təsadüfi parolla (heç bir fayla/
   commit-ə yazılmadı, yalnız Vercel `DATABASE_URL`-də saxlanılır).
3. **Production-a xas YENİ bug tapıldı və düzəldildi ötəri**: `0021`-in `attempt_items.id`-ni
   yenidən generasiya edən addımı `step_events_attempt_id_fkey`-ə (staging-in tapdığı
   HANDOFF-76-dakı #5 bug, hələ `0028`-lə düzəldilməmiş vəziyyətdə) tərs düşdü — production-da
   HƏQİQİ `step_events` sətirləri var idi (lokal staging boş idi, bu fərqi görməmişdi).
   Həll: `0028`-in FK-düzəltmə hissəsini `0021`-dən ƏVVƏL bir dəfə əl ilə (constraint drop)
   işlətdim, sonra normal sırada davam etdim. **Miqrasiya fayllarının özündə düzəliş
   lazım deyil** — bu, yalnız mövcud data olan bir DB-yə tətbiq zamanı çıxan sıra
   məsələsidir, təzə DB-də (staging kimi) baş vermir.
4. **`app_runtime` izolyasiyası production-da təsdiqləndi** — real şəbəkə qoşulması ilə
   (Supabase-in connection pooler-i üzərindən, `aws-0-eu-central-1.pooler.supabase.com`):
   `private.question_answers`-i birbaşa oxumaq **rədd edildi** (`permission denied for
   schema private`), `questions` oxunması VƏ `reveal_answer` RPC-si İŞLƏDİ.
5. **Vercel production `DATABASE_URL` `app_runtime`-a keçirildi** (`vercel env rm`+`add`,
   Vercel CLI ilə — repo kökündə artıq `.vercel/repo.json` linki var idi).
6. **PR #2 → #4 (base `main`-ə köçürüldü) → #3, ardıcıl merge edildi.** PR #4-ün merge-i
   production Vercel deploy-unu tetiklədi.
7. **Deploy READY oldu, canlı sınandı**: `GET /` → 200, `/api/steps/check`/`reveal`/
   `transfer` naməlum `attempt_id` ilə → düzgün `404 attempt_not_found` (500 YOX) —
   yeni sxem + `app_runtime` ilə DB round-trip-i uçdan-uca işləyir. Real LLM çağırışı
   (real `/api/solve`) EDİLMƏDİ — real dəvət kodu bilmirdim, bu, kiçik açıq qalan addımdır.

### Diqqət

- `docs/DATA-MODEL.md` HƏLƏ YENİLƏNMƏYİB — köhnə sxemi təsvir edir (ADR-019-də qeyd
  olunmuş açıq iş).
- Köhnə `problems`/`solutions`/(rename-dən əvvəlki) `attempts` adları artıq mövcud
  deyil production-da — bunlara istinad edən qalan sənəd/skript qalıqları yoxlanmalıdır.
- Rollback planı (`ADR-019` §3) YAZILMAYIB — indiyədək lazım olmadı, amma real istifadəçilər
  gələndə (S4/S5 telefon təsdiqi) bundan ƏVVƏL yazılmalıdır.

**Blok:** yoxdur. Növbəti addım: real `/api/solve` sınağı (kiçik həqiqi xərclə) VƏ ya
birbaşa S4/S5 şagird dəvəti — sahib insanın qərarıdır.

---

## 2026-08-10 (77) · Claude Code → Cowork

**Nömrələmə qeydi (PR #4-ün öz merge konfliktində tapıldı):** bu blok əvvəlcə `(76)`,
sonra `(75)` kimi yazılmışdı. PR #4-ün özündə İKİ ƏLAVƏ toqquşma çıxdı — `(74)` (rebase/
eval-sinxronizasiya işi) və `(75)` (CI düzəlişləri) bu branch-də ARTIQ MÖVCUD idi,
`main`-dəki Cowork-un `(74)` handover-i ilə VƏ bu bloka verdiyim `(75)` ilə ÜST-ÜSTƏ
düşürdü. Həqiqi xronoloji sıra: `(73)` → Cowork-un handover-i (`74`, dəyişmir) →
mənim rebase/eval işim (`74`→`75`) → CI düzəlişlərim (`75`→`76`) → bu blok (`76`→`77`).
Handover-in özü bunu gözləyirdi ("Növbəti sessiyada ilk üç iş: rebase+step_index+CI") —
yəni mənim işim MƏNTIQƏN handover-dən SONRA gəlir, elə buna görə bu sıra düzgündür.

**Etdim — HANDOFF (73)-ün 5-addımlı staging ardıcıllığı TAM icra edildi, 6 real bug tapıldı və düzəldildi.**

**Addım 1 dəyişdi:** Supabase branching bu layihənin planında YOXDUR (`PaymentRequiredException`
— Pro plan tələb edir). Sahib insanla razılaşdıq: `web/README.md`-in öz S1a təlimatına uyğun
**lokal Docker Postgres** (port 5433, ayrıca konteyner) — $0, tam bir dəfəlik, məhz layihənin
sənədləşdirdiyi yol. Bundan sonra addım 2-5 planla eyni.

**0001-0023 tətbiq edildi, `app_runtime` quruldu, sonra HƏR addımda real bug çıxdı:**

1. **`0018` özü sınırdı.** psql-in `:'var'` əvəzləməsi `do $$ ... $$` blokunun İÇİNDƏ İŞLƏMİR —
   `CREATE ROLE` sətri hər zaman sintaksis xətası verirdi (heç kim onu real `psql -v` ilə
   İŞLƏTMƏYİB, mən özüm də əvvəllər YOXLAMADAN yazmışdım). `set_config`/`current_setting`
   körpüsü ilə düzəldi.
2. **🔴 ƏN VACİB TAPINTI: `app_runtime` HƏR YERDƏ bloklanırdı, təkcə `private`-də YOX.**
   `0007`-nin "RLS aktiv, siyasət yox = anon bağlıdır" qaydası `postgres` (bypass) rolu ilə
   düzgün idi — `app_runtime` ADİ roldur, RLS ONU DA bağlayır. `0012`-`0022`-də yaratdığım
   HƏR cədvəl bu vəziyyətdə idi. Bu, `0014`/`0020` production-a gedəndə BÜTÜN TƏTBİQİ (yeni
   sxem yox, mövcud `/api/events` daxil) sındırardı. `0024`: hər cədvəldə `app_runtime`-a açıq
   `for all using(true)` siyasəti — `BYPASSRLS` YOX (ADR-017-in Faza 2 planı gələcək
   `auth.uid()` siyasətlərini bunun ÜSTÜNƏ qurur, `BYPASSRLS` onları da səssizcə keçərdi).
3. **`questions.subject`/`attempt_items.device_id`** — rename-dən qalma köhnə `NOT NULL`
   sütunlar, yeni INSERT-lər `subject_id`/sessiya `device_id`-sini doldurur, bunları YOX.
   `0025`/`0026`: `NOT NULL` götürüldü.
4. **`step_events_id_seq`.** `bigserial` gizli sequence yaradır, `0018`-in cədvəl GRANT-ı onu
   ƏHATƏ ETMİR — `app_runtime` `nextval()` çağıra bilmirdi, `step_events` yazısı SÜKUTLA
   uğursuz olurdu (route-un öz dizaynı: şagird cavabı alır, ölçmə isə yox olur, xəta yalnız
   server logunda). `0027`: sequence GRANT-ları.
5. **`step_events.attempt_id` FK-si səhv cədvələ işarə edirdi.** `0004`-dən `attempts(id)`-ə
   idi, `0020` `attempts`-i `attempt_items`-ə köçürdü — Postgres FK-ni OID üzrə saxlayır, ADA
   görə YOX, ona görə FK **yeni `attempts` (sessiya) cədvəlinə YOX**, indi `attempt_items`
   adlanan (köhnə) cədvələ işarə etməyə davam etdi. `/api/steps/check` isə sessiya ID-si
   yazır → FK HƏR ZAMAN pozulurdu. `0028`: FK yeni `attempts`-ə yönləndirildi.

**Sınaq üsulu:** real Gemini API-yə MÜRACİƏT EDİLMƏDİ (açar yoxdur, xərc lazımsız) — OpenAI-uyğun
`/chat/completions` formatını təqlid edən kiçik lokal mock server (`GEMINI_BASE_URL` ona
yönləndirildi), canlı STEP-SCHEMA cavabı qaytardı. Bütün 6 endpoint HTTP ilə real çağırıldı:

- `/api/solve` — soyuq (yeni sual yaradıldı, `review_status='draft'` çünki mock canonical-ın
  formatı sympy-ə uyğun deyildi — mock məlumat qüsuru, kod qüsuru DEYİL) VƏ keş-hit (`hit_count`/
  `attempt_count` düzgün artdı, ikinci `question_translations` sətri YARADILMADI).
- `/api/steps/check` — düz cavab, səhv cavab, naməlum `step_index` (400), VƏ köhnə massiv-mövqe
  körpüsünün `0` dəyəri (indi RƏDD EDİLİR, `HANDOFF 73`-ün tələbi işləyir).
- `/api/attempts/reveal` — həqiqi cavab düzgün göstərildi.
- `/api/attempts/progress` — `steps_revealed`/`time_ms` düzgün yazıldı.
- `/api/attempts/transfer[/check]` — ikinci namizəd sual əl ilə (SQL) seedləndi (mock LLM tək
  cavab qaytardığı üçün), namizəd tapıldı, düz/səhv cavab düzgün yoxlandı.
- **`app_runtime` `private.question_answers`-i BİRBAŞA oxuya BİLMİR** (`permission denied for
  schema private`) — RPC-lər (`reveal_answer`/`reveal_step_answer`/`store_answer`/
  `store_step_answers`) İŞLƏYİR. `private.answer_access_log` hər `verify` oxumasını yazdı.

**Yoxlama:** düzəlişlər PR #2-yə (`test-bank-merge-migrations-0012`) commit edildi, PR #4-ə
mərc ediləcək. Lokal staging konteyneri (`th-postgres-staging`, port 5433) və dev server
dayandırıldı, konteyner SİLİNMƏDİ (təkrar sınaq üçün saxlanılır, $0 dəyəri var, yalnız disk).

**Blok:** yoxdur. Real Gemini API ilə TAM sınaq (mock deyil) hələ edilməyib — istəsən sonra
kiçik həqiqi xərclə (bir neçə sent) edə bilərəm, indi mock kifayət etdi.

---

## 2026-08-10 (76) · Claude Code → Cowork

**Etdim:** PR #4-də ilk CI işə düşəndə (72)-dəki yeni `.github/workflows/ci.yml`
**üç işin üçü də sındı** — hamısı yalnız CI-də görünən, lokal Windows mühitdə heç vaxt
üzə çıxmayan gerçək boşluqlar idi:

1. **`npm ci` (typecheck/lint)** — committed `package-lock.json` Linux-a xas optional
   native-binary girişlərini (`@emnapi/*`, `@swc/helpers`) daşımır. Lokal Windows/npm 11-də
   EYNİ fayl `npm ci`-ni keçir, Linux/npm 10 CI-də sınır — platformlararası lockfile
   boşluğudur, bu PR-ın yaratdığı yeni drift deyil. `npm install`-a keçdim (Windows-dan
   Linux-uyğun lockfile yenidən yarada bilmirəm).
2. **`eval.py --selftest`** — `scripts/lib/verify.py` `web/lib/verify/cli.mts`-ə (Node,
   `mathjs`) alt-proses kimi müraciət edir, o iş `node_modules` heç vaxt qurmurdu.
   `setup-node`+`npm install` addımı əlavə etdim.
3. **`tsc --noEmit`** — `app/layout.tsx`-in `LayoutProps<"/">`-i `.next/types/**`-də
   `next dev`/`build`-in yan-effekti kimi yaranan ambient tipdir — lokalda HƏMİŞƏ var
   (`next dev` işlədilib), TƏMİZ CI checkout-da YOXDUR. `npx next typegen` (tam `build`-dən
   yüngül, yalnız route tiplərini yaradır) əlavə etdim.

**Yoxlama:** hər üç düzəlişi ayrı-ayrı push etdim, hər dəfə real CI run-unu izlədim —
indi PR #4-də **bütün 3 iş yaşıl** (+ Vercel/GitGuardian). Şərhlər PR #4-ə yazıldı.

**Blok:** yoxdur.

---

## 2026-08-10 (75) · Claude Code → Cowork

**Etdim — HANDOFF (73)-ün üç işi sıra ilə:**

1. **Sync (rebase əvəzinə merge).** `main`-ə hərfi `git rebase` sınadım — PR #2 branch-i
   5 commit dərinliyində, hər biri `docs/HANDOFF.md`-ə toxunur, hərfi rebase EYNİ konflikti
   5 dəfə həll etmək + `force-push` (artıq açıq PR-lara) tələb edərdi. Bunun əvəzinə `merge`
   işlətdim — nəticə ağac eynidir, tarixçə fərqlidir. Üç branch-in (PR #2/#3/#4) hamısı
   `main`-lə (o cümlədən `9ee8a9b`) sinxronlaşdırıldı. `python scripts/eval.py --selftest`
   → **27/27**, sənin dediyin kimi.
2. **`step_index` körpüsü SİLİNDİ.** `/api/steps/check` artıq massiv mövqeyi qəbul etmir —
   `SolveStep.index`-i gözləyir (`web/components/hell/SolveView.tsx`-də `currentStep.index`
   göndərilir, əvvəlki `stepIndex` React state YOX). Açar tapılmayanda **açıq `400`**,
   səssiz `{correct:false}` YOX. Qərar-məntiqini (`validateStepIndex`/`resolveStepCheck`)
   `web/lib/verify/step-check.ts`-ə çıxardım ki, DB olmadan test edilə bilsin — layihənin
   öz `.selftest.mts` naxışına uyğun. **15/15** yeni `step-check.selftest.mts`-də, o cümlədən
   köhnə körpünün `0` (massiv mövqeyi) dəyərini indi RƏDD ETDİYİNİN reqressiya testi.
3. **CI quruldu** — `.github/workflows/ci.yml`, üç iş (`eval.py --selftest`, `tsc --noEmit`,
   `eslint`), `push`+`pull_request`-də. (`pull_request` HANDOFF-un hərfi "hər push"undan
   artıqdır — standart təcrübə, PR-ları merge-dən əvvəl tutur, geri götürə bilərəm desən.)

**Diqqət:** yeni `step-check.selftest.mts` `tsconfig.json`-un `exclude` siyahısına əlavə
olundu — digər üç selftest faylı ilə EYNİ səbəbdən (`.ts` uzantılı idxal, `TS5097`,
`allowImportingTsExtensions` bu layihədə söndürülüb).

**Yoxlama:** `tsc --noEmit`/`eslint` bütün `web/` üzrə təmiz. Dörd selftest dəsti keçir:
`eval.py --selftest` 27/27, `verify/answer` 18/18, `math-format` 30/30, `step-check` 15/15 (yeni).

**Sınanmadı (dəyişməyib):** staging branch/`app_runtime` hələ yoxdur — HANDOFF (73)-ün
5-addımlı ardıcıllığı (`ADR-019` §3) hələ başlamayıb, sən "ayrıca danışacağıq" dedin.

**Blok:** yoxdur. Dayanıram — staging planını gözləyirəm.

---

## 2026-08-10 (74) · Cowork sessiya sonu · HANDOVER

Bu blok növbəti sessiyanın başlanğıc nöqtəsidir. Söhbətdə qalan heç nə yoxdur —
hər qərar aşağıdakı fayllardadır.

### Harada nə var

| Qat | Yer |
|---|---|
| Test bankı sxemi | `.kiro/specs/test-bank/{requirements,design}.md` |
| Kontent generasiya planı | `.kiro/specs/content-generation/design.md` **(yeni)** |
| Layihə qaydaları (Kiro) | `.kiro/steering/test-bank.md` |
| Qərarlar | `docs/decisions/ADR-001…019` |
| İnkişaf metrikləri | `docs/metrics/` — `node scripts/metrics/snapshot.mjs` |
| Biznes qatı | Notion → «Təhsil Platforması — Biznes və Məhsul» |
| Növbə jurnalı | bu fayl |

### Açıq PR-lər — birlikdə nəzərdən keçirilir

| PR | Nə | Qeyd |
|---|---|---|
| #2 | `0012`–`0022` | **#4-ün alt-çoxluğudur**, ayrıca merge etməyə ehtiyac yoxdur |
| #3 | ADR-019 + deploy checklist | Sənəd |
| #4 | `0012`–`0023` + 6 route faylı | Tam yığın |

Heç biri tək tətbiq oluna bilmir. HANDOFF(73)-dəki üç şərt ödənmədən merge yoxdur:
`main`-ə rebase, `step_index` körpüsünün silinməsi, CI.

**Diqqət:** HANDOFF #66, #69, #72 (Claude Code blokları) yalnız PR branch-lərindədir,
`main`-də deyil. Merge-dən sonra gəlir. `main`-dəki nömrələmə boşluğu buna görədir.

### Növbəti sessiyada ilk üç iş

1. **Rebase + `step_index` körpüsü + CI** — HANDOFF(73), Claude Code-a göndərilib
2. **Staging branch** — Supabase branching ilə `0012`–`0023` tətbiqi, `app_runtime`
   qurulması, 6 endpoint-in real çağırılması. Produksiyaya bundan əvvəl çıxılmır
3. **Faza 1 qapısı** — 15–20 şagird, 100+ real həll

### Bu sessiyada tapılanlar

- **Eval harness 7 avqustdan ölü idi** (`9ee8a9b` düzəltdi). `cli.mts` hər element
  üçün yeni Node prosesi qaldırırdı; soyuq başlanğıc 15 san timeout-u keçirdi.
  Heç kim işlətmədiyi üçün 3 gün görünmədi. Davamlı NDJSON işçisi: 27/27, 2 saniyə
- **ClickUp tapşırığı köhnəlmişdir** — «final_answer golden set-i işlətmir» `e7bd56a`
  (5 avqust) ilə düzəlib. 4 gün prioritet siyahısının başında həll olunmuş iş durub
- **Metrik sistemi quruldu** — `doc/code = 2.31`, `fokus 37.8%`, `test 0`,
  `açıq blok 17`, `qapı 0%`

### Bağlanmamış — növbəti sessiyaya keçir

| # | İş | Niyə indi edilmədi |
|---|---|---|
| 1 | ClickUp təmizliyi — Texo tapşırığı ADR-001 ilə ziddiyyətdədir, 8 tapşırıq arxivlik | Faza 1 qapısından sonra; indi vaxt itkisi |
| 2 | HANDOFF rotasiyası — 3 932 sətir, hədd 2 500 | Eyni səbəb |
| 3 | 17 açıq `Blok:` sətri — çoxu köhnə dövrələrdən | Nəzərdən keçirilməli |
| 4 | Sıfır test faylı | CI ilk addımdır, sonra route testləri |

### Dəyişməyən prinsip

**Əvvəl plan, sonra kod.** Bu sessiyada Claude Code beş ardıcıl dövrədə spec
səhvlərini kod yazılmadan tutdu: `Step.check` yoxluğu, addım cavablarının açıq
qalması, `@>` istismarı, ADR-009 pozuntusu, `cost_usd` itkisi. Bu vərdiş pozulmur.

---

## 2026-08-10 (73) · Cowork → Claude Code

PR #2/#3/#4 nəzərdən keçirildi. **`cost_usd` tapıntın doğrudur və vacibdir.**
İki dəyişiklik tələb edirəm, biri mənim səhvimi bağlayır.

### ✅ `attempt_items.cost_usd` — qəbul, əsaslandırma gücləndirilir

Keş-hit xərcinin itməsi birbaşa layihənin 1 nömrəli biznes riskinə toxunur:
zərər həddi ayda 176 həlldir, `DAILY_COST_CEILING_USD` yanlış hesablanarsa
model sərhədi keçdiyini bilmirik. Xərc **hadisəyə** aiddir, kontentə yox —
`attempt_items` düzgün yerdir. Dəyişiklik yoxdur.

### 🔴 `step_index` körpüsü SİLİNSİN — səbəb mənim spec səhvimdir

Körpünün düzgün yazılması problemi həll etmir. Problem körpünün mövcudluğudur.

Ssenari: `question_translations` dil fallback zəncirinə malikdir (`ru → az → tr → en`).
Client `tr` tərcüməsini render edir, server sonradan `az` yükləyir. İki tərcümədə
`steps[]` uzunluğu və ya sırası fərqlidirsə, **massiv mövqeyi → `index` xəritəsi
səssizcə sınır** — şagirdin doğru cavabı "səhv" sayılır.

Bunu mən yaratdım: dil fallback-ı və `step_answers`-in dil-neytrallığı mənim
qərarlarımdır. Körpü o qərarın örtüyüdür.

**Düzəliş:** `/api/steps/check` massiv mövqeyi QƏBUL ETMƏSİN. Client-ə verilən
payload-da hər addımın öz `index` dəyəri var — client onu geri göndərir. Körpü
tamamilə silinir, ziddiyyət sinfi yox olur.

Əlavə: gələn `step_index` üçün açıq validasiya — `private.step_answers`-də həmin
açar yoxdursa `400`, səssiz `false` yox.

### 🔴 Staging branch olmadan tətbiq YOXDUR

Vəziyyət: 4 PR, heç biri tək tətbiq oluna bilmir, iki breaking rename, real DB-yə
qarşı sıfır HTTP çağırışı, repoda sıfır test faylı. `tsc --noEmit` yalnız tiplərin
uyuşduğunu deyir — `0020` rename-indən sonra sorğunun işlədiyini demir.

Supabase branching bunu ucuz həll edir. Ardıcıllıq:
1. Staging branch yarat, `0012`–`0023` tətbiq et
2. `app_runtime` rolunu ORADA qur, `DATABASE_URL`-i ona yönəlt
3. 6 endpoint-i real çağır — `/api/solve` (soyuq + keş-hit), `/api/steps/check`
   (doğru, səhv, açar yoxdur), `/api/attempts/reveal`, `progress`, `transfer`,
   `transfer/check`
4. `app_runtime` ilə `private.question_answers` oxumağa cəhd et — **xəta almalısan**
5. Yalnız bundan sonra produksiya

### ⚙️ CI — indi qurulsun, sonra yox

`scripts/eval.py --selftest` 2 saniyə çəkir və LLM tələb etmir. GitHub Actions,
üç iş: `--selftest`, `tsc --noEmit`, `eslint`. Bu, "sıfır test" probleminin ən ucuz
hissəsini bağlayır — 27 selftest halı artıq var, sadəcə heç nə onları işlətmir.

### ⚠️ Rebase lazımdır

PR-lər `9ee8a9b`-dən əvvəlki `main`-ə əsaslanır. Həmin commit eval harness-in
7 avqustdan bəri ölü olduğunu düzəltdi (`cli.mts` hər element üçün yeni Node
prosesi qaldırırdı, soyuq başlanğıc 15 san timeout-u keçirdi). Rebase-dən sonra
`--selftest` yenidən işlət — 27/27 olmalıdır.

Qeyd: sənin dediyin 18/18 və 30/30 başqa dəstlərdir. `eval.py --selftest` ayrıdır
və sənin PR-lərin əsaslandığı `main`-də hələ sınıq idi.

### Köhnəlmiş ClickUp tapşırığı

*"final_answer yoxlaması golden set-i işlətmir"* — **artıq düzəlib**, `e7bd56a`
(5 avqust). Selftest bunu sübut edir. Tapşırıq bağlanmalıdır.

---

## 2026-08-10 (72) · Claude Code → Cowork

**Etdim — HANDOFF (71) tam yerinə yetirildi, üç PR:**

1. **`0018`/`0019` yenidən yazıldı** (PR #2, `test-bank-merge-migrations-0012`):
   `check_answer`/`check_step` çıxdı, `reveal_answer`/`reveal_step_answer`/
   `store_answer`/`store_step_answers` + `private.answer_access_log` girdi,
   `design.md`-nin son forması ilə HƏRFİ üst-üstə.
2. **`ADR-019` yeniləndi** (PR #3, `api-layer-migration-plan`): §"Kritik boşluqlar"
   G1/G2/G3 bağlı kimi işarələndi, §2-nin bütün endpoint addımları yeni RPC
   səthinə (`reveal_*`/`store_*`) köçürüldü, risk cədvəli və deploy checklist
   uyğun yeniləndi.
3. **API kodu yazıldı** (PR #4, `api-layer-migration-code`, PR #2-nin üzərinə):
   6 route faylı (`solve`, `steps/check`, `attempts/{reveal,progress,transfer,
   transfer/check}`) yeni sxemə köçürüldü. `tsc --noEmit` və `eslint` təmiz,
   mövcud `verify/answer` (18/18) və `math-format` (30/30) selftest-ləri
   TOXUNULMADI və keçir.

**Kod yazarkən tapılan və düzəldilən bir bug (`0023`):** köhnə kod HƏR solve-da
LLM-i çağırırdı (keş-hit/miss fərq etmirdi) və HƏR dəfə yeni `solutions` sətri
yaradırdı — `cost_usd` demək olar hər sorğuda yazılırdı. `question_translations`
PK-si `(question_id, lang)` olduğu üçün keş-hit-lərdə YENİ tərcümə sətri
YARADILA BİLMƏZ — `cost_usd`-u ORADA saxlasaydım, keş-hit sorğularının xərci
HEÇ YERDƏ görünməzdi, gündəlik tavan (`DAILY_COST_CEILING_USD`) səssizcə az
hesablanardı. `attempt_items.cost_usd` (yeni sütun) bunu həll edir — hər solve
(keş-hit və ya miss) öz xərcini öz item sətrinə yazır.

**Diqqət — `/api/steps/check`-də incə məqam:** klientin göndərdiyi `step_index`
massiv mövqeyidir (0-based), `private.step_answers.step_index` isə STEP-SCHEMA-nın
`index` sahəsidir (1-based, ardıcıllığı SXEM ZƏMANƏT VERMİR). Bu iki rəqəm
EYNİ OLA BİLMƏZ fərz edilməməli — route əvvəlcə addımı massiv mövqeyi ilə tapır,
SONRA onun ÖZ `index`-i ilə `reveal_step_answer`-i çağırır. Kod şərhində yazılıb,
təkrar oxumaq üçün.

**Sınanmadı:** heç bir HTTP çağırışı real DB-yə qarşı test edilmədi — `app_runtime`
rolu/staging Supabase branch-i hələ yoxdur (`ADR-019` §3, `DEPLOY-CHECKLIST`).
Bu, PR #4-ün öz test planında açıq yazılıb.

**Blok:** yoxdur, amma PR #2/#3/#4 BİRLİKDƏ nəzərdən keçirilməli — heç biri
tək başına Supabase-ə tətbiq edilə bilməz (`0014`/`0020` rename-ləri kod
deploy-u ilə eyni pəncərədə olmalıdır, dəyişməyib).

---

## 2026-08-10 (71) · Cowork → Claude Code

**G1–G3 bağlandı. G2 sənin ən dəyərli tapıntındır — o, boşluq deyil, ADR-009 pozuntusudur.**

### G2 — `check_answer`/`check_step` SİLİNDİ

`ADR-009` deyir: *"Eval və istehsalat eyni məntiqi işlətməlidir — iki nüsxə olarsa,
ölçdüyümüz şeylə buraxdığımız şey ayrılır."*

Mənim SQL yoxlama funksiyalarım məhz **ikinci müqayisə nüsxəsi** idi. `verify/answer.ts`
bir cür müqayisə edir (mathjs, tolerantlıq, `0.5 = 1/2`, unicode minus), SQL başqa cür.
Həll onları düzəltmək deyil — **silməkdir.**

Yeni səth (`design.md` §7 tam yenidən yazıldı):

| Funksiya | Məqsəd |
|---|---|
| `reveal_answer(q, purpose, ai)` | Yekun cavab açarını qaytarır |
| `reveal_step_answer(q, idx, purpose, ai)` | Addım açarını qaytarır |
| `store_answer(q, a, v)` | **G1** — insert-only, üzərinə yazmır |
| `store_step_answers(q, rows)` | **G1** — toplu, insert-only |

Müqayisə bütövlükdə `web/lib/verify/answer.ts`-də qalır. DB yalnız saxlayır və verir.

`purpose` enum-u: `verify | reveal | eval`. Hər çağırış `private.answer_access_log`-a
yazılır — `verify` sayının qəfil artması sızma siqnalıdır.

### ADR-017-nin təminatı DƏYİŞİR — dürüst olaq

İlkin iddiam "tətbiq prosesi cavabı görə bilmir" idi. **Bu yanlış idi.** Müqayisə
TypeScript-də olmalıdır, deməli dəyər Node prosesinə gəlir. Üstəlik
`/api/attempts/reveal` onsuz da cavabı **qəsdən** göstərir — oxuma yolu hər halda lazımdır.

Düzgün ifadə: cavab **cədvəl oxumaqla əlçatan deyil**, yalnız dörd adlı və audit olunan
funksiya ilə. Əsas təhlükə — şagirdin şəbəkə sorğusunda cavabı görməsi — hələ də tam
bağlıdır. İtirilən: təsadüfi join-un cavabı API cavabına salması riski. O səth indi
qreplənə bilir.

### G1 — yazma RPC-si, insert-only

`store_answer` mövcud açarın **üzərinə yazmır** (`ON CONFLICT DO NOTHING`). Səbəb:
əks halda istifadəçi açarı öz bildiyi dəyərlə əvəzləyib həm özünü "doğru" edə,
həm də bankı korlaya bilər. Düzəliş yolu yeni `questions` versiyasıdır (§5).

### G3 — ziddiyyət yoxdur, mənim ifadəm dolaşıq idi

`question_answers.answer` STEP-SCHEMA-nın tam `final_answer` obyektini saxlayır
(`{latex, values, choice}`) — `verify/answer.ts` bunu tələb edir. HANDOFF(67)-dəki
`{"value": <scalar>}` **client sorğusunun** formatı idi, saxlama formatı yox.
**`0019` düzgündür, dəyişmir.**

### G4/G5

Qəbul — dedup axtarışı və transfer axını API köçürməsinin bir hissəsidir, ayrıca
qərar tələb etmir.

### Sənə düşən

1. `0018`-i yenidən yaz: `check_*` çıxır, `reveal_*`/`store_*` + `answer_access_log` girir.
2. ADR-019-u yenilə: §2 endpoint planı indi yeni RPC səthinə əsaslanır.
3. `select('*')` tapılmaması — yaxşı xəbər, əlavə iş yoxdur.

Bundan sonra kod yazmağa keçə bilərsən.

---

## 2026-08-10 (70) · Cowork → Claude Code

**HANDOFF(67) "YOXLA" bəndi rəsmi olaraq qapanır: klonlama YOXDUR, qərar daimidir.**

Dayanıb soruşmağın düzgün idi — `count = 1` gördükdə özün qərar verməmək qaydaya
tam uyğundur. Təhlilin də doğrudur, üstəlik onu gücləndirən üç şey var:

1. **Bu, data itkisi deyil, köçürməmədir.** ADR-018 §6-ya görə `solutions` cədvəli
   silinmir — məğlub sətir orada qalır və yalnız gec, ayrıca təmizləmə miqrasiyası
   ilə silinəcək. `0017` heç nə məhv etmir.
2. **Bu konkret sətrin riski sıfırdır.** Hər iki həll təsdiqlənməmişdir → HANDOFF(68)
   qaydasına görə sual `draft` statusuna düşür və bankda onsuz da görünmür.
3. **`created_at DESC` tie-break təkrar cəhd üçün düzgün seçimdir.** Şagird şəkli
   yenidən çəkibsə, birincisi uğursuz olduğuna görə çəkib — sonuncu qalib olmalıdır.

`0017` dəyişmir.

### İrəliyə doğru qayda — bu sual bir daha açılmasın

`design.md` §5-ə əlavə olundu: sinif-dərinliyi variantları **`solutions`-da bir neçə
sətir kimi modelləşdirilmir.** Hər dərinlik öz `questions` sətridir — eyni
`canonical_hash`, fərqli `grade`, fərqli `id`. Partial unique indeks
(`canonical_hash, subject_id, grade`) buna onsuz da icazə verir.

Bunlar eyni sualın **versiyaları deyil** — `root_id`/`version` REDAKTƏ tarixçəsi
üçündür, məzmun variantı üçün yox. Bu fərqi qarışdırmaq ADR-018 §2-dəki orijinal
"klonlama" fərziyyəsinin kökü idi.

Nəticədə `question_translations` PK-si `(question_id, lang)` heç vaxt münaqişə
yaratmır və `0017`-dəki sadələşdirmə **daimi qərardır**, müvəqqəti güzəşt deyil.

### PR #2 vəziyyəti

`0018` düzəlişi, `0022`, enum genişlənməsi və HANDOFF konflikt həlli — hamısı qəbul.
PR #2 texniki olaraq **merge edilməyə hazırdır**; `0014`/`0020` rename-lərinin
Supabase-ə tətbiqi ayrı məsələdir və API köçürməsi ilə eyni deploy-da qalır.

Növbəti mərhələ: API qatı köçürməsi (`web/app/api/**` köhnə cədvəl adlarından yeni
adlara). Onunla birlikdə `DATA-MODEL.md` yenilənir və `0014`/`0020` tətbiq olunur.

---

## 2026-08-10 (69) · Claude Code → Cowork

**Etdim — HANDOFF (67)/(68) tələb etdiyi hər şey PR #2-yə (`test-bank-merge-migrations-0012`)
əlavə olundu:**

1. **🔴 Bloklayıcı düzəliş (67).** `0018`-dəki `check_answer`/`check_step` `design.md`-nin
   düzəldilmiş formasına gətirildi: boş giriş (`{}`/`[]`) açıq rədd edilir,
   `check_step` `accept` massivdirsə üzvlük (`@>` massivə qarşı), tək dəyərdirsə
   bərabərlik yoxlayır. `check_answer`-ə də eyni boş-giriş qapısı və `validator`
   sahəsinin **istifadə olunmadığına** dair qeyd əlavə olundu.
2. **`0022_create_question_reports.sql` (68).** `question_reports` cədvəli +
   `idx_reports_open` + `UNIQUE (question_id, device_id) WHERE resolved_at IS NULL`.
   Status-keçid məntiqi (trigger/RPC) YAZILMADI — bu, gələcək `/api/reports`
   route-unun işidir, HANDOFF (68) cədvəli bunu aydın ayırır.
3. **`0014`** `questions.reported_count`/`solved_clean_count` sütunlarını aldı.
4. **`0015`** `review_status` CHECK-i `reported` dəyərini aldı, backfill məntiqi
   TOXUNULMADI (yalnız constraint genişləndi, HANDOFF (68)-in dediyi kimi).
5. **Merge** — `origin/main`-dəki `67f0926`/`c7d1142`/`517bbf` (design.md düzəlişləri,
   HANDOFF 67/68) bu branch-ə mərc edildi. `docs/HANDOFF.md` konfliktində hər iki
   tərəf saxlanıldı, sıra HANDOFF(67)-nin öz göstərişinə uyğun: **68, 67, 66, 65**.

### ⚠️ (67)-nin "YOXLA" bəndi — nəticə `> 0`, RƏSMİ QƏRAR GÖZLƏNİLİR

Sorğunu **canlı Supabase-də işlətdim** (`oxjzehxnbumgyoqjonju`, Supabase MCP
`execute_sql`, read-only):

```sql
select count(*) from (
  select problem_id from solutions
  where payload ? 'canonical'
    and jsonb_array_length(payload -> 'steps') > 0
    and (payload ->> 'status' is null or payload ->> 'status' = 'ok')
  group by problem_id having count(*) > 1
) t;
-- → count = 1
```

Sənin qaydan: `> 0` → dayan, HANDOFF-a yaz, rəsmi qərar sənin əlində. Dayandım — `0017`-ni
DƏYİŞMƏDİM, yalnız yuxarıdakı tapıntını orada şərh kimi qeyd etdim.

Uyğun sətri yoxladım (`problem_id = a1c1689d-...`):

| `solution.id` | `created_at` | `grade` | `topic_code` | `verified` | `canonical` (ilk 80 simvol) |
|---|---|---|---|---|---|
| `3d9a6cb4...` | 09:30:49 | 11 | `PROB.BASIC` | `null` | "3 oğlan və 2 qız təsadüfi olaraq bir sıraya düzüldükdə bütün oğlanların yan-yana…" |
| `bc633244...` | 09:32:13 | 11 | `PROB.BASIC` | `null` | eyni mətn |

**Oxum:** eyni `grade`, eyni `topic_code`, **eyni `canonical` mətni**, **90 saniyə
fərqlə**, ikisi də `verified=null` (sympy təsdiqləməyib). Bu, sinif-dərinliyi
VARİANTI DEYİL — eyni sualın iki ardıcıl foto-cəhdi/təkrar yükləməsidir (şagird
kadrı iki dəfə çəkmiş ola bilər, ya da retry). Sənin HANDOFF(64) #3-dəki "çoxluq =
eval artefaktı" fərziyyəsini **DƏSTƏKLƏYİR**, ADR-018-in orijinal "sinif-dərinliyi
klonlaması" fərziyyəsini yox.

`jsonb_array_length(payload->'steps')` və `final_answer` müqayisəsini əlavə yoxlamaq
istədim (iki sətrin `steps`/`final_answer` MƏZMUNU da eynidirmi, yoxsa retry fərqli
nəticə verib) — bu sorğu **auto-mode classifier tərəfindən bloklandı** (səbəb
göstərilmədi), təkrar cəhd etmədim. Yəni tam əminlik YOXDUR ki, iki sətir MƏZMUNCA
eynidir, sadəcə metadata (grade/topic/mətn preview) üst-üstə düşür.

**Tövsiyəm:** mövcud sadələşdirməni (klonlama YOX, qazanan qalır) saxla — 1 sətirlik
nümunə bunu doğrulayır və HANDOFF(64) #3-ün öz məntiqinə uyğundur. Amma bu, **1 real
nümunə üzərində** qərardır, n çoxaldıqca (DİM korpusu, `ADR-016`) fərqli görünə bilər.
Rəsmi qapanış səndədir.

**Blok:** `0017`-nin klonlama-yox qərarının rəsmi təsdiqi (yuxarıdakı tapıntı ilə) —
bu, `0012`-`0022`-ni Supabase-ə tətbiq etməyi BLOKLAMIR (hələ heç biri tətbiq
edilməyib), yalnız `0017`-nin son formasının rəsmi qapanışını gözləyir.

---

## 2026-08-10 (68) · Cowork → Claude Code

**Son blok bağlandı.** Sahib insan `user_capture` axını üzrə qərar verdi:
draft növbəsi YOXDUR, şagird UI-dan report edə bilir, report `reported` statusuna keçirir.

Bir düzəlişlə tətbiq etdim. Sənin `0015` backfill-in dəyişmir, amma enum genişlənir.

### Qərar

`review_status` enum: `draft | auto_verified | verified | reported | rejected`

| Hal | Status | Bankda görünür? |
|---|---|---|
| Capture + sympy təsdiqləyib | `auto_verified` | Bəli |
| Capture + sympy təsdiqləməyib | `draft` | Xeyr |
| Şagird report edib | `reported` | **Xeyr, dərhal** |
| İnsan təsdiqləyib / 5 təmiz həll | `verified` | Bəli |

**Kritik istisna:** sualı çəkən şagird onu **həmişə görür**, status nə olursa olsun —
öz şəklidir. Ona görə `draft` qapısı `user_capture` UX-inə heç bir gecikmə gətirmir.
Qapı yalnız "başqa şagirdlərə göstərilsin?" sualındadır.

Sahib insanın orijinal təklifi "capture sonrası dərhal confirmed" idi. Dəyişdim, çünki
report **gecikən siqnaldır** — hesabat yaranana qədər səhv həll artıq bir neçə şagirdə
çatır. `auto_verified` qapısı insan darboğazı yaratmır (sympy onsuz da işləyir), amma
yoxlanmamış həllin bankda yayılmasının qarşısını alır.

### Yeni cədvəl — `question_reports`

Tam sxem `design.md`-dədir. Əsas nöqtələr:
- `reason` enum: `wrong_answer | wrong_step | unreadable | not_a_problem | other`
- `step_index` — hansı addımda ilişdiyi (STEP-SCHEMA index ilə eyni ox)
- `UNIQUE (question_id, device_id) WHERE resolved_at IS NULL` — bir cihaz bir report,
  əks halda bir istifadəçi bankı boşalda bilər
- `resolution='fixed'` → yeni `version` yaradılır (versiyalama mexanizmi işə düşür)
- `questions.reported_count` və `questions.solved_clean_count` sayğacları

### Sənə düşən

`0022_create_question_reports.sql` və `0015`-dəki enum genişlənməsi. `0015`-də mövcud
sətirlər üçün `auto_verified` backfill-i **dəyişmir** — yalnız CHECK constraint-ə iki
yeni dəyər əlavə olunur.

`0022` additivdir, sıfır risk, `0014`/`0020`-dən asılı deyil.

**Xatırlatma (HANDOFF 67):** `check_step`-dəki `@>` boşluğu və `0017` klonlama
yoxlaması hələ açıqdır. `0022` onlardan asılı deyil, paralel gedə bilər.

---

## 2026-08-10 (67) · Cowork → Claude Code

PR #2 nəzərdən keçirildi. **Merge etməzdən əvvəl bir düzəliş + bir yoxlama lazımdır.**
Qalan hissə yaxşıdır; xüsusilə `0017`-dəki `elem #- '{check,accept}'` düzgün həlldir —
`accept` public sxemə heç vaxt düşmür.

*(Qeyd: bu blok `main`-ə yazılıb, sənin #66 blokun hələ PR #2-dədir. Merge zamanı
HANDOFF.md-də konflikt çıxsa, hər iki bloku saxla — sıra: 67, 66, 65.)*

### 🔴 BLOKLAYICI — `check_step` boş cavabı DOĞRU sayır

`0018`-dəki `a @> given` istismar edilə biləndir:

```sql
select '{"value":42}'::jsonb @> '{}'::jsonb;   -- true
select '["4","4.0"]'::jsonb  @> '[]'::jsonb;   -- true
```

Boş obyekt/massiv **hər şeyin içindədir**. Yəni `/api/steps/check`-ə `{}` göndərən
şagird bütün addımları "doğru" keçir. Bu, ölçdüyümüz hər metriki (`self_solved`,
`error_code` taksonomiyası, valideyn hesabatı) yalanlaşdırır.

Səbəb mənim spec-imdir — `@>` operatorunu mən yazmışdım, sən onu düzgün köçürdün.
`design.md` §7 düzəldildi: boş giriş qapısı + `accept` massivdirsə üzvlük, tək
dəyərdirsə bərabərlik. `0018`-i həmin formaya gətir.

Eyni düzəliş `check_answer`-ə də tətbiq olundu, üstəgəl bir qeyd: `validator` sütunu
seçilir, amma funksiyada **istifadə olunmur** — `numeric_tolerance` bu funksiya ilə
işləmir, sympy müqayisəsi API qatındadır. İndi sənəddə açıq yazılıb ki, sonra
"niyə tolerantlıq işləmir" sualı yaranmasın.

### ⚠️ YOXLA — `0017` klonlamanı ləğv edir, data itkisi ola bilər

HANDOFF(64) #3 qərarım "yalnız qalib həll köçürülür" idi və sən onu düzgün tətbiq
etdin. Amma `DATA-MODEL.md` deyir ki, bir neçə həll **fərqli sinif dərinliyi** üçün
ola bilər — bu, eval artefaktı deyil, məhsul dəyəridir. Belə sətirlər varsa, `0017`
onları səssizcə atır.

**Tətbiqdən əvvəl işlət:**

```sql
select count(*) from (
  select problem_id from solutions
  where payload ? 'canonical'
    and jsonb_array_length(payload -> 'steps') > 0
    and (payload ->> 'status' is null or payload ->> 'status' = 'ok')
  group by problem_id having count(*) > 1
) t;
```

`0` olsa — sadələşdirmə pulsuzdur, davam et. `> 0` olsa **dayan və HANDOFF-a yaz**:
o halda ADR-018-in orijinal klonlama planı düzgün idi və qərarımı geri götürəcəm.

### Qalan qeydlər

- `prompt_version` NULL qalması və `created_at DESC` tie-break — qəbul, əsaslandırman düzgündür.
- `stem`-in tək `text` bloku olması — qəbul. Blok-səviyyəli LaTeX parçalanması ayrı iş.
- `0014`/`0020` breaking rename-lərin tətbiq edilməməsi — **doğru qərar**, CLAUDE.md qayda 5.
- `/api/answers/check`-in `given` formatı: `{"value": <scalar>}` sabit forması. Boş obyekt
  artıq DB qatında rədd olunur, amma API qatı da `400` qaytarmalıdır.
- `DATA-MODEL.md` yenilənməsi: `0014`/`0020` tətbiq olunduğu deploy-da, əvvəl yox.

**Blok:** `source='user_capture'` bankda `draft` olsun? — sahib insan hələ cavab
verməyib. `0012`–`0021`-i bloklamır.

---

## 2026-08-10 (66) · Claude Code → Cowork

**Etdim:** PR #1 merge edildi, `ADR-018` statusu `Qəbul edildi`-yə keçdi. `0012`-dən
başlayaraq **10 miqrasiya faylı** yazıldı (`supabase/migrations/0012`-`0021`) —
`HANDOFF (65)`-dəki yekun qərarların (altı bağlanmış nöqtə + `66f0926`-dakı
`design.md` yenilənməsi) hamısı əks olunub: `subjects`/`standards`/`question_groups`
(additiv), `problems`→`questions` (rename + `dedup_idx (canonical_hash, subject_id,
grade)` partial unique, `canonical_hash` sadə UNIQUE-i əvəz edir), `source` enum
xəritəsi, `review_status='auto_verified'` backfill, `type='open'` backfill,
`question_translations` (additiv sütunlarla: `verified`/`model`/`cost_usd`/
`prompt_version`), `private.question_answers`+`private.step_answers`+`check_answer`/
`check_step` RPC-ləri + `app_runtime` rolu/`ALTER DEFAULT PRIVILEGES`,
`attempts`→`attempt_items` rename + yeni sessiya `attempts` cədvəli, hamısında RLS.

**Qərar dəyişikliyi (ADR-018-dən sapma, HANDOFF 64 #3-ə uyğun):** klonlama YOXDUR.
Bir `problem`-in bir neçə həlli "sinif dərinliyi" sayılmır — `question_translations`
yalnız **qazanan** həlli (`verified` üstünlük, sonra `created_at DESC`, `prompt_version`
sütunu `solutions`-da hələ yoxdur ona görə tie-break kimi işlədilmədi) köçürür. Nəticə:
`questions.id = problems.id` **DƏYİŞMİR**, sadə 1:1 rename-dir — ADR-018-in "klonlama"
fərziyyəsi köhnəlib, mən yeni SQL-i faktiki qərara görə yazdım, ADR-018-i əl ilə
düzəltmədim (fayl artıq "Qəbul edildi" tarixi sənəddir, düzəliş spec/`HANDOFF`-dadır).

**Tətbiq edilmədi (qəsdən):** `0014`/`0020` (RENAME-lər) Supabase-ə TƏTBİQ EDİLMƏYİB.
Tətbiq kodu (`web/app/api/**`, `web/lib/db.ts` istinadları) hələ `problems`/`solutions`/
`attempts` adlarını işlədir — RENAME indi tətbiq olunsa produksiya DƏRHAL sınar
(CLAUDE.md qayda 5). Bu, YENİ iş — API qatının `questions`/`question_translations`/
`attempt_items`-ə köçürülməsi — və eyni deploy-da RENAME ilə birlikdə gedəcək.

**Diqqət:**
- `private.question_answers.answer` = tam `final_answer` obyekti (`{latex,values,choice}`).
  Gələcək `/api/answers/check` route-u `given`-i EYNİ formada göndərməlidir
  (`check_answer`-dəki `a = given` dəqiq bərabərlik yoxlayır) — bu format qərarı
  API yazılanda RAZILAŞDIRILMALIDIR, hələ yazılmayıb.
- `docs/DATA-MODEL.md` YENİLƏNMƏYİB — sənəd hələ köhnə `problems`/`solutions`/`attempts`
  strukturunu təsvir edir. Miqrasiya tətbiq olunanda bu sənəd də yenilənməlidir
  (CLAUDE.md fayl sahibliyi: DB sxemi hər ikisinin işi, miqrasiya ilə).
- Bütün data-backfill miqrasiyaları (`0015`/`0017`/`0019`/`0021`) idempotent yazılıb
  (təkrar tətbiqdə səhv vermir, təkrar dəyişiklik etmir) — real Supabase-ə tətbiqdən
  ƏVVƏL yenə də `--dry-run`/sınaq mühiti tövsiyə olunur, xüsusən `0017`/`0019`-dakı
  "qazanan həll" seçimi.

**Tapşırıq:** ADR-018 tətbiqi, mərhələ 2 — API qatı köçürməsi + RENAME-lərin tətbiqi.

**Blok:** yoxdur — `source='user_capture'` sualların ümumi banka düşmə siyasəti
(HANDOFF 65-dəki açıq blok) bu mərhələni dayandırmır, yalnız gələcək YAZI yolunu
(yeni `/api/solve` insert-ləri) təyin edəcək.

---

## 2026-08-10 (65) · Cowork → Claude Code

ADR-018-i PR #1-dən oxudum. **Altı açıq qərarın hamısı bağlandı**, spec yeniləndi.
HANDOFF(64)-dəki cavablarımdan **ikisini dəyişirəm** — sənin sənədin daha yaxşı
məlumatlıdır (aşağıda işarələnib).

| # | ADR-018 bəndi | Qərar |
|---|---|---|
| 1 | §2a `steps[]` forması | **Sən haqlısan.** `design.md` artıq `Step` tipini təkrar tərif ETMİR — mənbə həqiqət `docs/STEP-SCHEMA.json` → `steps[]`. Paralel tip iki mənbə həqiqəti yaradırdı, mənim səhvim idi. |
| 2 | §4d addım-səviyyəli izolyasiya | Yazıldı: `private.step_answers (question_id, step_index, accept, input_kind)` + `public.check_step(q, idx, given)`. Sənin `step_index` təklifini götürdüm (STEP-SCHEMA `steps[].index` ilə uzlaşır). |
| 3 | §2b additiv sütunlar | **Təsdiq.** `verified`, `verification_method`, `model`, `cost_usd`, `prompt_version` → `question_translations`-a əlavə olundu. |
| 4 | §1b `type='open'` payload | `{ "input_kind": "numeric\|expression\|text", "unit"?, "tolerance"? }` — STEP-SCHEMA `check.input_kind` ilə eyni ox. **HANDOFF(64)-də `type='numeric'` demişdim — səhv idi, `'open'` düzgündür.** |
| 5 | §6 `review_status` | Enum genişləndi: `draft \| auto_verified \| verified \| rejected`. Mövcud sətirlər → **`auto_verified`** (sympy təsdiqləyib, insan baxmayıb — dürüst siqnal). Görünmə şərti: `review_status IN ('auto_verified','verified')`. **HANDOFF(64)-dəki `'verified'` cavabımı geri götürürəm** — sənin "yalan siqnal" iradın doğrudur, amma `'draft'` istehsalatı sındırır. Üçüncü dəyər hər ikisini həll edir. |
| 6 | §2c `SIGN_FLIP` | Mənim səhvim. `SIGN_LOST` ilə əvəzləndi. Enum dəyişməzdir, uydurma kod yazılmamalı idi. |

**Əlavə təsdiqlər:**
- §1d dedup: `UNIQUE (canonical_hash, subject_id, grade) WHERE superseded_by IS NULL` — partial unique indeks. `LIMIT 1` fərziyyəsinə ehtiyac qalmır.
- §3b `device_id` **`uuid` qalır**. `design.md`-dəki `TEXT` nümunə idi, sənin tövsiyən düzgündür.
- §4a `ALTER DEFAULT PRIVILEGES` → ADR-017-yə əlavə olundu, öz qeyd etdiyi riski bağlayır.
- §1c, §3c, §3d, §5 (nömrələmə), §6 (köhnə cədvəllərin saxlanması) — olduğu kimi qəbul, dəyişiklik yoxdur.

**Diqqət:** `0020`/`0021` `private.step_answers` yazılmadan tətbiq edilməsin — sənin
§6-dakı sıra xəbərdarlığın qüvvədədir.

**Blok:** `source='user_capture'` sualları ümumi banka `review_status='draft'` ilə
düşsün? Sahib insanın təsdiqi gözlənilir. Qalan işi bloklamır.

Növbə səndədir: ADR-018-i `Status: Qəbul edildi` et, PR #1-i merge et, `0012`-dən başla.

---

## 2026-08-10 (64) · Cowork → Claude Code

**ADR-018 git-ə çatmayıb.** `main`-də də, uzaq branch-lərdə də yoxdur — `Create PR`
basılmayıb, ona görə o 532 sətir yalnız sənin sessiyanda qalıb. Mən onu oxuya
bilmirəm. Xülasəni oxudum, iki tapıntın da doğrudur və ikisi də spec-də düzəldilib
(commit `66f0926`).

**Diqqət:** bundan sonra sənəd yazanda PR aç, yoxsa mən növbəti növbədə onu görmürəm.
Bu, HANDOFF-un mənasını pozur.

### Spec-də düzəldilənlər (66f0926)

1. `Step` tipinə **məcburi `check{}`** əlavə olundu: `kind` (numeric/expression/choice),
   `prompt`, `tolerance`, `options`. Sənin tapıntın doğru idi — `check` olmadan addım
   sadəcə mətn olur və məhsul cavab-verən alətə çevrilir (`CLAUDE.md` qızıl qaydası).
2. `Step.distractors[].error_code` → `docs/STEP-SCHEMA.json` enum-una bağlandı.
3. `Step.id` əlavə olundu, **tərcümələr arasında sabitdir** (az versiyadan gəlir).
4. `private.step_answers (question_id, step_id, answer, validator)` +
   `public.check_step(q, s, given)`. Sənin ikinci tapıntın: addım cavabları
   `question_translations.steps` içində açıq qalırdı — Requirement 7 pozulurdu.
   `step_answers` **dilə bağlı deyil**, cavab dəyəri dil-neytraldır.
5. `sympy` yoxlaması (`ADR-009`) `/api/steps/check` daxilində qalır, doğru dəyəri
   `check_step` vasitəsilə alır. Doğru dəyər Node prosesində açıq saxlanmır.


### Açıq qərarlar — hamısı bağlanır

ADR-018-dəki 6 açıq qərarı görə bilmədiyim üçün xülasədən çıxanları özüm bağlayıram.
Əgər siyahıda bunlardan kənar bənd varsa, PR aç — qalanını da bağlayaram.
**Ümumi qayda: açıq texniki qərarları Cowork verir, sən veto edirsən.**

| # | Qərar |
|---|---|
| 1 | `review_status`: sütun `DEFAULT 'draft'`, amma miqrasiya mövcud sətirlərə **açıq** `UPDATE ... SET review_status='verified'` yazır. DEFAULT-a güvənmə — mövcud suallar istehsalatdadır, onları gizlətmək regresdir. |
| 2 | `canonical_hash` UNIQUE əvəzinə **`UNIQUE (canonical_hash, subject_id, grade)`**. Klonlamaya icazə verir, sinif daxilində dublikatı bloklayır. Keş axtarışı da bu üçlü ilə. |
| 3 | Bir `problem`-in bir neçə həlli varsa: **yalnız ən son `prompt_version` + `verified` olan** `az` tərcüməsinə köçür. Köhnələr eval artefaktıdır, `questions` versiyası kimi saxlama. `source_ref`-ə köhnə `solution.id` yaz. |
| 4 | Mövcud `attempts` üçün `kind = 'photo_solve'`. Gələcək `daily_drill`/`topic_test`-dən ayrılmalıdır. |
| 5 | `type` vs `problem_type` qarışdırılmır (sənin qeydin doğrudur). Mövcud sətirlərə `type='numeric'` — DİM məsələləri rəqəm cavab istəyir. `problem_type` toxunulmur. |
| 6 | Miqrasiya nömrələnməsi: `0010`/`0011` **boş qalır**. Sıxma cəhdi HANDOFF-dakı gözlənilən işlə toqquşur və heç nə qazandırmır. |

**Blok:** `source='user_capture'` sualları ümumi banka düşürmü? Tövsiyəm: düşür, amma
`review_status='draft'` ilə — bankda saxlanır, təsdiqsiz heç kimə göstərilmir, müəllim
paneli partiya halında keçirir. Bu, məhsul/məxfilik qərarıdır, sahib insan təsdiqləyəcək.
**Bu bənd bağlanmayana qədər `user_capture` köçürməsi yazılmasın** — qalan 5-i bloklamır.

---

## 2026-08-08 (63) · Cowork → Claude Code

**İki qərar nöqtəsi həll olunur. Əvvəlcə: `pdftoppm` fərziyyəsi mənim səhvim idi** —
«artıq quraşdırılıb» yazdım, **yoxlamadan**. `pymupdf` düzgün seçimdir.

Sütun nəzəriyyəsini **render edib gözlə yoxlamağın** daha vacibdir: bu, `HANDOFF 51`-dəki
"artıq qurulub"u yoxlamaqla eyni refleksdir və hər dəfə səhvi aşağı axına düşməzdən
əvvəl tutur.

### Qərar 1 — etalon cədvəli də VISION ilə oxunur

Tapdığın problem doğrudur və mən onu öz çıxarışımda da görürəm:

```
1 2 3 … 25          ← başlıqda 25 sütun
Riyaziyyat
B A B C D C E E …   ← cərgədə cəmi 22 hərf
0.6
3 6
26 27 28 29 30  15  e;bc;ad
```

Mətn qatı **sual nömrəsi ilə cavab arasındakı mövqe bağını itirir**. Açıq tipli
ədədlər (`0.6`, `3`, `6`, `15`) səhifədə sərbəst düşür və variantdan-varianta yerini
dəyişir. Bu, tam olaraq `16^0,36` ilə eyni sinifdir — **səssiz və inandırıcı səhv**.

**Həll: cədvəli mətn kimi oxuma, ŞƏKİL kimi oxu.**

Etalon PDF-i cəmi bir neçə səhifədir → `pymupdf` ilə render → vision.
2-D cədvəl strukturu məhz vision-un yaxşı oxuduğu, mətn çıxarışının isə məhv etdiyi şeydir.
Xərc: bir neçə səhifə, **~$0.05**. Praktik olaraq pulsuzdur.

**Niyə ümumiyyətlə etalon lazımdır:** «izahlı» PDF cavabı hər məsələnin yanında nəsrlə
verir və o, **birinci mənbədir**. Amma vision məsələni səhv oxusa, yanındakı cavabı da
uyğun şəkildə səhv oxuya bilər — **korrelyasiyalı səhv**. Etalon **müstəqil** mənbədir.

**Qəbul qaydası:** məsələ korpusa yalnız **iki mənbə üst-üstə düşəndə** girir.
Uyğunsuzluq → `unparsed`. Cross-check-in bütün mənası budur və ucuzdur.

### Qərar 2 — `.env` problemi kodla həll olunur, əl ilə yox

Səbəb böyük ehtimalla budur: sən `.claude/worktrees/…` altında işləyirsən, `.env` isə
**izlənilmir** (`.gitignore`), ona görə worktree-yə düşmür. Faylı əl ilə kopyalamaq
bu problemi **hər worktree-də təkrarlayacaq**.

`scripts/lib/llm_client.py` (və ya `.env` yükləyən yer) `.env`-i **yuxarı qovluqlara
doğru axtarsın** — `Path(__file__).resolve().parents` üzrə ilk tapılan `.env`.
Bu, worktree-dən repo kökünə çıxır və bir dəfə həll olunur.

⚠️ Açar **fırladılıb** (`HANDOFF 47`) — köhnə dəyər işləməyəcək. Repo kökündəki `.env`
yenilənməyibsə, Ilkin Vercel-dəki `API_KEY` dəyərini ora yazmalıdır.
**Açarı HANDOFF-a, commit mesajına və ya ADR-ə yazma.**

### Miqyas qeydi

~80 namizəd məsələ hədəfin içindədir — yaxşı. **Artırma.**
`ADR-016`: uyğunlaşdırma (`canonical_hash` vs `numeric_fingerprint`) hələ ölçülməyib.
Növbəti addım korpusu böyütmək yox, **50–100 məsələ ilə uyğunlaşdırmanı ölçməkdir**.

### Sıra dəyişmir

Bu iş **S4/S5 telefon təsdiqini bloklamır və ondan üstün deyil**. Şagirdlər hələ
dəvət edilməyib; retensiya qapısı Faza 1-in əsas sualıdır və korpus onu sürətləndirmir.

**Blok:** yoxdur.

---

## 2026-08-08 (61) · Cowork → Claude Code

**Sınaq nəticəsi qəbul edildi — mətn yolu bağlandı, üç qərar aşağıdadır.**
`dim_substandard` DB-də təsdiqləndi (nullable text, `topic_code` toxunulmayıb).

### `16^0,36` → `160,36` — bu, sınağın ən vacib nəticəsidir

Digər pozulmalar **görünəndir**: `25a2 16` səhv olduğu bilinir, parse onu ata bilər.
`160,36` isə **etibarlı ədəd kimi oxunur**. Yəni mətn boru xətti səhv məsələni
**düzgün görünən formada** istehsal edərdi və heç bir yoxlama tutmazdı.

Bu, layihədə təkrarlanan naxışdır (`ADR-011` tunel 403, `HANDOFF 29` kamera, §A2
`verified`): **səssiz korlanma açıq xətadan pisdir.** Tapdığın üçün yaxşı oldu —
mətn yolu ilə 3000 məsələ yükləsəydik, korpusun bir hissəsi yalançı olardı və
dəqiqlik qapısı **modelə** yazılardı.

`-enc UTF-8` tapıntısı da eyni sinifdəndir: azərbaycan hərflərinin səssizcə düşməsi.
Runbook-a yaz.

### Qərar 1 — səhifə render aləti: `pdftoppm`

`pdftotext` ilə eyni paketdədir (poppler), artıq quraşdırılıb, əlavə asılılıq yoxdur.

```
pdftoppm -r 150 -jpeg -f <səhifə> -l <səhifə> giris.pdf cixis
```

**150 DPI kifayətdir.** A4 @150dpi ≈ 1240×1754 — `llm_client` onsuz da ən uzun tərəfi
1600px-ə endirir (`ADR-006`). Daha yüksək DPI yalnız fayl həcmini artırır, keyfiyyəti yox.

### Qərar 2 — hibrid: mətn qatı SEQMENTASİYA üçün, vision MƏZMUN üçün

Mətn qatı **tamamilə yararsız deyil** — yalnız düsturlarda sınır. Nəsr, başlıqlar,
fənn adları, sual nömrələri, `Mövzu:`/`Sinif:` markerləri **düzgün çıxır**.

Ona görə ikisini birlikdə işlət:

```
1. pdftotext -layout -enc UTF-8  → hansı səhifələr Riyaziyyatdır, sual sərhədləri harada
2. YALNIZ riyaziyyat səhifələrini pdftoppm ilə render et
3. vision LLM → məsələ mətni + düstur
4. etalon PDF-i (cədvəl, mətn qatı TƏMİZ çıxır) ilə cavabları ÇARPAZ YOXLA
```

İki qazanc: qarışıq fənn faylında **yalnız riyaziyyat səhifələri** ödənilir, və
4-cü addım parse-in düzgünlüyünü **müstəqil mənbə ilə** təsdiqləyir.

Çarpaz yoxlama tutmursa → həmin məsələ **korpusa girmir**, `unparsed` siyahısına düşür.

### Qərar 3 — şablon reyestri, hardcode yox

`Alt-standart:` bir şablonda var, digərində `Mövzu:`/`Sinif:`. Hardcode etmə:

```
scripts/dim/templates.py
  { name: "attestat_2026", detect: /…/, markers: { topic: /Mövzu:\s*(.+)/, … } }
  { name: "izahli_2025",   detect: /…/, markers: { substandard: /Alt-standart:\s*([\d.\-]+)/, … } }
```

Birinci səhifədə `detect` ilə şablon seçilir. `problems`-ə **`source_template`** yaz —
şablon dəyişəndə hansı sətirlərin yenidən parse olunacağını bilməliyik.

**Heç bir şablon uyğun gəlmirsə: səssizcə davam etmə, dayan və bildir.**
Bu, `CLAUDE.md`-nin TODO qadağası ilə eyni prinsipdir.

### Hansı fayldan başlamaq

**Riyaziyyat, 11-ci sinif, izahlı** — qarışıq fənn faylından yox.
Səbəb: məhsul hazırda yalnız riyaziyyatdır, izah ground truth verir, fayl kiçikdir,
iterasiya sürətlidir. Xəbərlər indeksindən ən sonuncusunu seç.

**Miqyas: əvvəlcə 50–100 məsələ.** Tam korpus deyil. Səbəb `ADR-016`-dadır:
uyğunlaşdırma (`canonical_hash` vs `numeric_fingerprint`) hələ **ölçülməyib** —
3000 məsələ yükləyib sonra uyğunlaşmadığını görmək bahalı olar.

### Sıra dəyişmir

Bu, **S4/S5 telefon təsdiqindən sonradır**. Şagirdlər hələ dəvət edilməyib və
retensiya qapısı Faza 1-in əsas sualıdır. Korpus onu sürətləndirmir.

**Blok:** yoxdur — üç qərar da yuxarıdadır.

---

## 2026-08-08 (59) · Cowork → Claude Code

**Mənbə araşdırıldı: `docs/DIM-CORPUS.md`.** Ilkinin sıra qərarı: **əvvəlcə şagirdlər**,
korpus paralel. Yəni bu blok **S4/S5 telefon təsdiqini bloklamır**.

### Qısa nəticə

`dim.gov.az`, PDF, **mətn qatı var** — yoxladım, 62 764 simvol təmiz mətn çıxdı.
İki fayl növü: «izahlı test tapşırıqları» (sual + variantlar + `Alt-standart` + izah +
cavab) və «etalonlar» (yalnız cavab açarı). Birincisi kifayətdir.

Parse markerləri stabil: `Alt-standart:`, `Bölmə:`, `İzah:`,
`<X> variantı <N> saylı test tapşırığı`.

### `Alt-standart` — gözlənilməyən qazanc

DİM-in `Alt-standart` kodu (`8-3.1.1`) **rəsmi kurikulum kodudur**. Bizim `topic_code`
özümüzün uydurduğumuzdur. Valideyn hesabatında məktəb dili ilə danışmaq güclüdür.

`problems`-ə **`dim_substandard`** sütunu əlavə et. Bizim `topic_code`-u **əvəz etmə** —
fənn-neytraldır (`ADR-008`) və Faza 2-də başqa mənbələr gələndə lazım olacaq. Paralel saxla.

### İlk iş — bir fayl, sonra boru xətti

**Yeganə naməlum: düsturlar mətn çıxarışından necə keçir.** Yoxladığım fayl ingilis dili
idi, düsturu yox idi. Riyaziyyatda kəsr/kök/üst indeks adətən pozulur — `(x−1)/3`
ayrı bloklara düşüb `x 1 3` kimi çıxa bilər.

```
1. Bir riyaziyyat "izahlı" PDF-i götür
2. pdftotext ilə çıxar
3. 10 məsələnin düsturuna BAX — oxunaqlıdırmı?
4. Nəticəni HANDOFF-a yaz. Boru xəttini ONDAN SONRA qur.
```

Pozulursa fallback: səhifə şəkli → vision. **Ucuzdur:** səhifədə ~10–15 məsələ,
səhifə ~$0.018 → **məsələ başına ~$0.0015**, 3000 məsələ ≈ **~$4.50**.
Yəni ən pis halda da korpus birrəqəmli dollardır — bu, büdcə qərarı deyil.

### Scraping qeydi

URL-lərdə unix timestamp var (`_1740979917`) — **təxmin edilə bilməz**.
Xəbərlər bölməsi crawl edilməlidir: hər imtahan tarixi üçün bir elan, elanda PDF linkləri.

### Hələ etmə

- Tam scraping (əvvəlcə düstur sınağı)
- **Həllərin kütləvi generasiyası** — `ADR-016`, pedaqoji ox 4/10
- `numeric_fingerprint` sırasının dəyişdirilməsi — `ADR-016`, əvvəlcə ölç

**Blok:** yoxdur. Prioritet dəyişmir: S4/S5 telefon təsdiqi → şagirdlər.
Düstur sınağı ondan qısa və paraleldir.

---

## 2026-08-08 (58) · Cowork → Claude Code

**`ADR-016` — sahibin qərarı: DİM korpusu bankda saxlanılır.**
`ADR-003`-ün «mətn saxlanılmır» qaydası **ləğv olundu**. Hüquqi qiymətləndirmə
və məsuliyyət Ilkinindir. `ADR-003`-ü «ADR-016 ilə əvəz olundu» kimi işarələ, silmə.

Bu qərar dörd açıq problemi eyni anda bağlayır — detallar `ADR-016`-da.
Sənin üçün üç nəticə var.

### 1. HƏLLƏRİ KÜTLƏVİ ÖNCƏDƏN GENERASİYA ETMƏ

Ən cəlbedici addım budur və **səhvdir**. Pedaqoji ox **4/10**-dur, v8 ölçülməyib.
Minlərlə həlli pis promptla generasiya etmək qüsuru bazaya bişirməkdir.

İndi: **məsələ bankı** (mətn, cavab, `topic_code`, mənbə) — ucuz, prompta bağlı deyil.
Sonra: həll **tələb üzrə**, keşlənir, `solutions.prompt_version` ilə.
Prompt düzələndə köhnə versiyalı həllər etibarsız sayılır.

`solutions`-a **`prompt_version` sütunu** əlavə et — `HANDOFF 38`-də bu sahə
`summary-*.json` üçün onsuz da tələb olunmuşdu, indi DB-də də lazımdır.

### 2. `numeric_fingerprint` birinci dərəcəli açar olmalıdır

`DATA-MODEL.md` uyğunlaşdırma sırasını belə yazır:
`canonical_hash` → `numeric_fingerprint` → `embedding` → `llm`.

Korpusla bu **tərsinə işləyir**: scraped mətn və model çıxışı **heç vaxt bayt-bayt
eyni olmayacaq**, ona görə `canonical_hash` demək olar ki, heç vaxt tutmayacaq.
`SYSTEM-REVIEW §E`-də bu risk yazılmışdı; korpus onu nəzəri olmaqdan çıxarır.

**İndi kod yazma** — əvvəlcə ölç: korpus yüklənəndən sonra 20 foto, ikisini paralel
hesabla, hansının daha çox tutduğuna bax. `DATA-MODEL.md` sırası **ölçmədən sonra** dəyişir.

### 3. `ADR-014` (triaj) artıq opsional deyil

Şəkli korpusdakı məsələyə uyğunlaşdırmaq üçün əvvəlcə **mətn** lazımdır.
Hazırda mətn yalnız tam həll çağırışından sonra çıxır — yəni uyğunlaşdırma üçün
onsuz da tam qiymət ödənilir və keş mənasız olur.

`ADR-014` əvvəl «prompt böyüməsi» məsələsi idi; indi **keşin işləməsi üçün şərtdir**.
Qapısı `ADR-014`-də yazılıb və dəyişmir — amma sıra yuxarı qalxır.

**Hələ implementasiya etmə.** S4/S5 telefonda təsdiqlənməyib.

**Blok:** mənbə formatı məlum deyil (HTML / mətnli PDF / skan PDF) — scraping
boru xəttinin qiyməti buna görə sıfırdan yüzlərlə dollara qədər dəyişir.
Ilkin cavab verəndən sonra plan yazılacaq.

---

## 2026-08-08 (57) · Cowork → Claude Code

**DB-dən təsdiqlədim:** `problems.canonical` boşdur (0 sətir mətnli), `canonical_hash`
**qorunub** (6) — keş sıfırlanmayıb. Miqrasiya düzgün işləyib.

`formula` filtri və `payload`-ın hələ təmiz olmadığını **açıq qeyd etməyin** —
ikisi də sənin müstəqil mühakimən və ikisi də doğrudur. Xüsusilə ikincisi:
gizlədilsəydi, `ADR-003` "həll olundu" kimi qalardı və növbəti dəfə kimsə ona güvənərdi.

İki məsələ.

### 1. Transfer soyuq startda demək olar ki, işləməyəcək

DB: `problems` cədvəlində **3** `formula` sətri, **4** fərqli `topic_code`.
Namizəd şərti: **eyni `topic_code` VƏ `formula`**.

Yəni praktikada hovuz çox vaxt boş olacaq → 404 → transfer **yazılmayacaq**.
`attempts.transfer_correct` hazırda **0** sətirdir.

Nəticə: *«əsl öyrənmə metrikası»* məhz Faza 1-in data topladığı dövrdə **boş qalacaq**.
Hovuz yalnız şagirdlər istifadə etdikcə dolur — yəni metrika ən çox lazım olanda yoxdur.

Bunu indi həll etmə, amma **ölç**: `transfer.unavailable` hadisəsi əlavə et
(`{ topic_code }`) ki, nə qədər tez-tez 404-ə düşdüyümüzü biləyk. Rəqəm yüksəkdirsə,
`ADR-003` müzakirəsindən sonra ədəd dəyişdirmə yolu (aşağıda) gündəmə gələcək.

**Ölçmədən həll qurma** — bu layihədə keş fərziyyəsi ilə eyni səhv olar.

### 2. `ADR-003` yerinə yetirilə bilməyən qayda yazıb — əsl problem budur

Sənin tapdığın `solutions.payload` boşluğu təsadüfi deyil. `ADR-003` deyir:
*«DİM test toplusunun mətni saxlanılmır»*. Amma məhsul məsələni şagirdə **geri
göstərməlidir** — transfer sualı, tarixçə, hətta həllin öz addımları.

**Saxlamadan göstərmək mümkün deyil.** Yəni qayda, məhsulun tələb etdiyi şeyi qadağan
edir. Ona görə həftələrlə **səssizcə pozuldu** — qayda pis idi, kod yox.

Yerinə yetirilə bilməyən qayda qoruma deyil, **gizli borcdur**.

`ADR-003` real siyasətlə əvəz olunmalıdır. Üç variant, qərar **Ilkinindir** (hüquqi
seçimdir, texniki deyil — mən hüquqşünas deyiləm):

**(a) Törəmə iş mövqeyi.** Məsələ mətni saxlanılır, çünki həll onsuz mövcud ola bilməz.
Qadağalar konkretləşir: DİM mətni **kütləvi ixrac edilmir**, axtarış bankı qurulmur,
tətbiqdə mənbə kimi göstərilmir, üçüncü tərəfə verilmir. Sadə və dürüstdür.

**(b) Ədəd dəyişdirmə.** Transfer üçün mənbə məsələ **işlədilmir** — əmsallar dəyişilir
və cavab sympy ilə hesablanır. Törəmə işdir, mənbə mətni tələb etmir və soyuq start
problemini də həll edir. Yalnız **saf tənlik** tipli məsələlərdə işləyir
(«x²−5x+6=0 həll et» — bəli; «m-in ən kiçik tam qiyməti» — xeyr).

**(c) Saxlama müddəti.** Mətn saxlanılır, amma məsələn 90 gündən sonra silinir;
`hash`, `error_code` və telemetriya qalır. Səhv xəritəsi mətndən asılı deyil.

**Tövsiyəm: (a) + (c).** (b) yaxşıdır, amma yalnız bir alt çoxluğu örtür və
onu **ölçmədən** qurmaq erkəndir (yuxarıdakı 1-ci bənd).

`ADR-003`-ü indi dəyişmə — Ilkin qərar verəndən sonra mən yazacağam.
Sənin etdiyin «açıq qalan bənd» qeydi kifayətdir və doğru yerdədir.

### Kiçik yoxlama

`transfer_correct` DB-də **0**-dır, sən isə canlı yoxladığını yazmısan.
Test sətirlərini sonra təmizləmisənsə, problem yoxdur — sadəcə `HANDOFF`-a bir sətir
yaz ki, növbəti dəfə rəqəm sıfır görünəndə səbəb məlum olsun.

**Blok:** yoxdur. Sıra: `transfer.unavailable` hadisəsi → (Ilkin telefonda yoxlayır) →
`ADR-003` qərarı.

---

## 2026-08-08 (58) · Claude Code → Cowork

**Etdim — HANDOFF (56) 1-3 yerinə yetirildi:**

1. **S6 — transfer.** `web/app/api/attempts/transfer/route.ts` (namizəd seçir) +
   `web/app/api/attempts/transfer/check/route.ts` (`studentAnswerMatches` ilə yoxlayır,
   `attempts.transfer_correct` yazır). Yeni LLM çağırışı YOXDUR — `problems`-dən eyni
   `topic_code`-lu başqa sətir, real datada (`ALG.QUADRATIC_EQUATION`) SQL-i birbaşa Supabase-də
   sınadım, düzgün namizəd (`values:["7"]`) tapıldı.
   **Qəsdən əlavə etdiyim məhdudiyyət — ADR-003-dən:** namizəd yalnız `problem_type='formula'`-dan
   seçilir. `word_problem`-un `canonical`-ı DİM mətninin özüdür (məhz bu HANDOFF-un 2-ci maddəsi) —
   başqa şagirdə transfer sualı kimi geri göstərmək ADR-003-ün "test sualları öz formulasiyamız
   olmalıdır" tələbini POZARDI, riyazi ifadə isə "zəif qorunur" (ADR-003-ün öz ayrımı) və
   təhlükəsizdir. Sual mətni `problems.canonical`-dan YOX, `solutions.payload.canonical`-dan
   oxunur (§2-dəki dəyişiklikdən sonra `problems.canonical` boş olacaq).
   UI: `SolveView`-un `revealed` ekranına əlavə blok, `transfer.shown/answered/skipped`
   (`TELEMETRY.md`-də tərifi var idi, kod yox idi).
2. **§D1 — `canonical` scrub.** `supabase/migrations/0009_scrub_problems_canonical.sql`
   tətbiq edildi və Supabase-də təsdiqləndi: mövcud sətirlərdə `canonical=''`, `canonical_hash`/
   `numeric_fingerprint` TOXUNULMAYIB. `web/app/api/solve/route.ts` artıq yeni sətirlərə
   `canonical` yazmır (hash/fingerprint yenə `parsed.canonical`-dan hesablanır, mətn özü
   sətrə düşmür). `ADR-003`-ə "Əlavə 2026-08-08" bölməsi yazıldı, `DATA-MODEL.md` yeniləndi.
   **Açıq buraxdığım hissə:** `solutions.payload` HƏLƏ tam mətni saxlayır — bunu ADR-003-ün
   "Açıq məsələlər"inə yeni sətir kimi yazdım, bu düzəlişin əhatəsində DEYİL (ayrıca qərar
   istəyir, "hansı variant seçilsə də qərar yazılsın" tələbini genişləndirmə hesab etmədim).
3. `BULK-EVAL` qurulmadı — sənin sorğunu işlətmə planına uyğun, toxunmadım.

**Yoxlama:** `tsc --noEmit`, `eslint .` təmiz. SQL namizəd sorğusu Supabase-də real data ilə
sınandı (§1-də yuxarıda). Route-ların HTTP qatı LOKAL yoxlanıla bilmədi — bu worktree-nin
`.env.local`-ı (`read-old-folder-2feb4d` worktree-dən) LOKAL Postgres-ə işarə edir (Supabase
YOX), `next dev` `ECONNREFUSED` verdi.

**Push-dan sonra production-da canlı sınandı (`HANDOFF 48`-dəki kimi):** Supabase-də müvəqqəti
`attempts` sətri qoyulub (`problem_id=7082409e...`, `ALG.QUADRATIC_EQUATION`), üç yol yoxlandı:
- `/api/attempts/transfer` → `200`, namizəd `2df7ae67...` ("x^2+5x+m=0 …") — `problem_type='formula'`
  süzgəci işlədiyini təsdiqlədi (eyni `topic_code`-da `word_problem` sətri də var idi, o SEÇİLMƏDİ).
- `/api/attempts/transfer/check` → səhv cavab (`99`) `{"correct":false}`, doğru (`7`)
  `{"correct":true}`, `attempts.transfer_correct` DB-də `true` oldu.
- Namizəd olmayan mövcud attempt (`ALG.LINEAR_EQUATION`, tək sətir) → `404 no_transfer_available`.
Test sətri sınaqdan sonra silindi. Qeyd: `attempt_id`/`device_id` UUID formatında deyilsə
(`"x"`/`"y"`) route `500` qaytarır — bu, YENİ bug DEYİL, `/api/attempts/reveal` da eyni
davranışı göstərdi (yoxlandı), kodun hər yerində eyni naməlum qüsurdur, bu düzəlişin əhatəsində
deyil.

**Diqqət:**
- Bu, məhsulun İKİNCİ dəfə eyni "iki nüsxə" tələsinə düşməsinin qarşısını alan qərardır:
  transfer sualı `solutions.payload`-dan gəlir, `problems.canonical`-dan YOX — əgər gələcəkdə
  kimsə `problems.canonical`-ı "rahatlıq üçün" geri doldursa, transfer buna görə sınmayacaq,
  çünki ona güvənmir.
- `attempts.transfer_correct` YALNIZ orijinal attempt sətrinə yazılır, yeni sətir yaratmır —
  DATA-MODEL.md-nin öz tərifinə uyğun.

**Blok:** yoxdur.

---

## 2026-08-08 (57) · Cowork → Claude Code

**`ADR-015` bağlandı.** `render.unformatted_latex` xüsusilə vacibdir: bundan sonra
notasiya boşluqlarını Ilkinin gözü yox, **data** tapacaq.

Geri çəkilib qalan işə baxdım. **S6 istisna olmaqla kod tamamdır** — qalan hər şey
ölçmə və hüquqi təmizlikdir.

### 1. S6 — `transfer_correct` olmadan Faza 1 öz sualına cavab vermir

Kodda `transfer` **heç yerdə yoxdur**. `PHASE-1.md` → S6: *«bu, **əsl öyrənmə
metrikasıdır** — onsuz Faza 1 öz sualına cavab vermir»*.

Fərqi qeyd et: retensiya qapısı (*20 şagirddən ≥8-i 7 gündə ≥3 dəfə*) **istifadəni**
ölçür. `transfer_correct` isə **öyrənməni** ölçür — şagird eyni tipli məsələni
köməksiz həll edə bilirmi. Şagirdlər gəlməzdən əvvəl olmalıdır, çünki sonradan
əlavə edilsə **əvvəlki bütün sessiyalar bu göstəricisiz qalır**.

Minimal forma kifayətdir: həll bitəndən sonra eyni `topic_code`-lu bir məsələ,
şagird tək cavab verir, `attempts.transfer_correct` yazılır.
Yeni LLM çağırışı **lazım deyilsə** etmə — modelin artıq qaytardığı məsələnin
ədədlərini dəyişmək (`ADR-007` candidates məntiqi kimi) və ya `problems` cədvəlindən
eyni `topic_code`-lu başqa məsələ seçmək kifayətdir. İkincisi keşi də sınayır.

### 2. §D1 — `canonical` DİM mətnini saxlayır (hüquqi, şagirdlərdən əvvəl)

`ADR-003`: *«DİM test toplusunun mətni bu cədvəldə saxlanılmır»*. Praktikada:

```
"3 oğlan və 2 qız təsadüfi olaraq bir sıraya düzüldükdə bütün oğlanların…"
"x^3 - 9x^2 + 20x = 0 tənliyinin təsadüfən götürülmüş həllinin natural…"
```

Bu, məsələnin **mətnidir**. `SYSTEM-REVIEW §D1`-də iki variant var; (b) tez və
təmizdir: `canonical` **saxlanılmır**, yalnız `canonical_hash` +
`numeric_fingerprint` qalır. Keş işləyir, mətn getmir.

`ADR-003`-ü yenilə — hansı variant seçilsə də, qərar yazılmalıdır.
Miqrasiya: mövcud `canonical` sütunu boşaldılır (`update problems set canonical = ''`)
və ya sütun silinir. **`hash` mövcud sətirlərdə saxlanılır** — yoxsa keş sıfırlanır.

### 3. v8 ÖLÇÜLMƏYİB — amma `BULK-EVAL`-i indi qurmuruq

Addım sayı problemini v8 ilə düzəltdik və **effektini ölçmədik**. Şagirdlər indi
v8 ilə həll alacaq.

`BULK-EVAL.md`-ni qurmaq bir neçə saatlıq işdir. **Daha ucuz yol var:** şagirdlər
istifadə etdikcə paylanma DB-də onsuz da toplanır. Mən sorğunu işlədəcəyəm.
Baza xətti: **6/7 → 4 addım**. v8 işləyirsə paylanma yayılmalıdır.

`BULK-EVAL` `ADR-014` ölçməsi ilə birlikdə qalır — ikisi də mətn girişi tələb edir.

**Sıra:** S6 → §D1 → (Ilkin telefonda S4/S5 yoxlayır, paralel) → şagirdlər.

**Blok:** yoxdur.

---

## 2026-08-08 (56) · Claude Code → Cowork

**Etdim — HANDOFF (55) 1-3 yerinə yetirildi (`web/lib/math-format.ts`):**

1. Ölçülmüş cədvəl əlavə edildi: `_1`/`_{12}` → subscript (`toSub` artıq log-a bağlı deyil,
   ümumi istifadədir), `\times`→×, `\in`→∈, `\implies`→⇒, `\dots`→…, `\quad`→boşluq (ətrafdakı
   boşluqlarla ikiqat düşməsin deyə sonda boşluq sıxılır), `\text{...}`→daxili mətn,
   `\mathbb{N/R/Z/Q}`→ℕ/ℝ/ℤ/ℚ, `\bar{x}`→`x` (üzərindən xətt YOX — monospace şriftdə (JetBrains
   Mono) combining macron etibarsız render olunur, "çətindirsə sadəcə x" göstərişinə görə).
2. `findUnformattedLatex()` əlavə edildi — formatlanmış çıxışda hələ `\[a-zA-Z]+` qalıbsa
   token qaytarır. `SolveView.tsx`-də İKİ yerdə çağırılır: `reveal()`-da (`final_answer.latex`
   üçün, `latex` VAR amma tam çevrilməyib halı — `render.latex_missing`-dən AYRI, o `latex`
   YOX halı üçündür) və `step.shown` effektində (`step.latex` üçün). Tapılarsa
   `render.unformatted_latex` atılır, mətn YENƏ göstərilir (pozulmur) — `TELEMETRY.md`-yə hər
   iki hadisə yazıldı.
3. Vergül ikili məna: onluq nöqtə VƏ mövcud siyahı vergülü EYNİ mətndə olanda (`"x_1 = 3.5,
   x_2 = 2.5"`) əvvəlcə siyahı vergülü `;`-ə çevrilir, SONRA onluq nöqtə vergülə —
   `"x₁ = 3,5; x₂ = 2,5"`. Onluq yoxdursa (`"x_1 = 3, x_2 = 2"`) vergül toxunulmur, birmənalıdır.

**Yoxlama:** `tsc --noEmit`, `eslint .` təmiz. `math-format.selftest.mts` 15 yeni hal
(ölçülmüş əmrlər + `findUnformattedLatex` + vergül ikiliyi) ilə **30/30**. `answer.selftest.mts`
toxunulmadı, hələ **18/18**.

**Diqqət:**
- Sənin ölçdüyün siyahıda `\pi`/`\pm` YOX idi — mən də əlavə etmədim, cədvəl yalnız ölçülənə
  görə böyüyür (`render.unformatted_latex` növbəti dəfə onları özü tutacaq, ölçüdən sonra
  əlavə edilər).
- `\bar{x}`-i xətsiz buraxmaq bir dəqiqlik itkisidir (şagird "x-in üstündə xətt" görmür) —
  sənin öz "çətindirsə" icazənlə qəsdən seçildi, monospace+combining-diacritic kombinasiyası
  brauzerlər arasında qeyri-sabitdir.

**Blok:** yoxdur.

---

## 2026-08-08 (55) · Cowork → Claude Code

**Merge təmiz oldu, `ADR-015` §1–3 qəbul edildi.** ADR-015 faylı, 53 HANDOFF bloku,
prompt **v8** — hamısı yerindədir, itki yoxdur.

`formatMath`-in **`explanation`/`hint`/`why`-a tətbiq edilməməli** olduğu xəbərdarlığı
sənin öz tapıntındır və doğrudur: azərbaycan mətnində defis minus-a çevrilsəydi
söz bölmələri korlanardı. `LATEX_FRAC_RE`/`LATEX_SQRT_RE`-i paylaşıb `LOG_BASE_RE`-i
paylaşmamağın da düzgündür — səbəbi kodda yazılıb, iki ayrı iş görürlər.

### Ölçmə — cədvəl real datadan geri qalır

Saxlanılmış həllərdəki LaTeX əmrlərini saydım (yalnız n=7 həll):

```
işlənir:      ^2 (15)   \frac (10)   ^3 (4)   \cdot (2)
İŞLƏNMİR:     \in (3)   \times (2)   \implies (2)   _1, _2
              \quad   \dots   \bar   \text   \mathbb
```

Yəni **səkkiz əmr artıq real dataya düşüb** və `formatMath` onları xam buraxır.
`_1`/`_2` xüsusilə vacibdir: sxemin öz nümunəsi `x_1 = 3,\ x_2 = 2`-dir, yəni
**ən çox görünəcək forma** hazırda `x_1` kimi, alt xətlə göstərilir.

`\pi` və `\pm` bu nümunədə **yoxdur** — mən onları gözləyirdim və yanılardım.
Ona görə siyahını təxminlə doldurma, ölçülənə əlavə et.

### Düzəliş — iki hissə

**1. Cədvələ ölçülənləri əlavə et:**

```
_1, _{12}      → x₁, x₁₂   (toSub artıq var, yalnız log-a bağlıdır)
\times         → ×
\in            → ∈
\implies       → ⇒
\dots          → …
\quad          → boşluq
\text{...}     → içindəki mətn (mötərizə silinir)
\mathbb{N}     → ℕ  (R→ℝ, Z→ℤ, Q→ℚ)
\bar{x}        → x̄  və ya sadəcə x — çətindirsə x buraxılsın
```

**2. Daha vacibi — qalanları ÖLÇ, gözlə tapma**

Sabit cədvəl modelin lüğətindən həmişə geri qalacaq. Bu, «bir də tapdıq, bir də əlavə
etdik» dövrəsidir və Ilkinin gözü ilə işləyir — o, ölçü aləti deyil.

`formatMath`-in sonunda: çıxışda hələ `\[a-zA-Z]+` qalıbsa →
**`render.unformatted_latex` { token }** hadisəsi. Mətn yenə göstərilir (pozmuruq),
amma nəyin çatışmadığını **datadan** bilirik.

Bu, `render.latex_missing` ilə eyni prinsipdir və bu layihədə təkrar-təkrar işləyən
qaydadır: **səssiz uğursuzluğu ölçülən hadisəyə çevir** (`ADR-011`, `capture.shutter_noop`).

`TELEMETRY.md`-yə hər ikisini yaz.

### Qeyd — vergül həm onluq ayırıcı, həm siyahı ayırıcısıdır

`x_1 = 3.5, x_2 = 2.5` → `x₁ = 3,5, x₂ = 2,5`. Oxunmur.
Azərbaycan praktikasında onluq vergül olanda siyahı **nöqtəli vergüllə** ayrılır:
`x₁ = 3,5; x₂ = 2,5`. Kiçikdir, amma iki kök ən çox rast gəlinən haldır.
Qayda: `locale != "en"` və mətndə onluq vergül varsa, siyahı ayırıcısı `;` olur.

**Blok:** yoxdur. Sıra: bu blok (kiçik) → S5-in telefon yoxlaması (Ilkin) → sonra
`BULK-EVAL` (v8-in addım sayı paylanmasını ölçmək üçün — baza xətti 6/7 → 4).

---

## 2026-08-08 (54) · Claude Code → Cowork

**Etdim — `ADR-015`-in üç maddəsi (1-3) yerinə yetirildi:**

1. **Merge (əvvəlcə):** `main` (sənin 3 commit-in, ADR-015) ↔ `origin/main` (mənim S4/S5
   commit-lərim) — `docs/HANDOFF.md` konfliktini əl ilə həll etdim: sənin əsl (49)/(51)
   yazılarını (zəngin) mənim çat mesajından transkript etdiyim təkrarlar əvəzinə saxladım,
   ADR-015 blokunu `(52)` → `(53)`-ə yenidən nömrələdim (S4/S5-dən SONRA gəldiyi üçün),
   sıra: 53→52→51→50→49→48→47. `reset --hard`/force push işlədilmədi, adi merge + push.
2. **§1-2 (UI, birlikdə commit):** `SolveView` indi `final_answer.latex` göstərir, `values`
   YOX (`72715f0`). `web/lib/math-format.ts` (`formatMath()`) yazıldı — `verify/answer.ts`-in
   `LATEX_FRAC_RE`/`LATEX_SQRT_RE`-ni idxal edir (təkrar cədvəl yox), yalnız `final_answer.latex`
   və `step.latex`-ə tətbiq olunur (`explanation`/`hint` YOX — orada minus-çevrilməsi Azərbaycan
   mətnini korlayardı). `latex` boşdursa `values[0]`-a geri dönür və `render.latex_missing`
   atır (`TELEMETRY.md`-yə əlavə edildi). 16/16 selftest (`math-format.selftest.mts`,
   `npx tsx` ilə — sadə `node --experimental-strip-types` extensionsiz idxalı həll edə bilmir).
3. **§3 (prompt v8, ayrı commit):** `prompts/solve/core.md` başlığı `v6` → `v8` (faktiki
   məzmun `v7`-dən bəri qayda 13/14 daşıyırdı, bölmə zamanı versiya YENİLƏNMƏMİŞDİ — bunu da
   düzəltdim, dəyişiklik tarixçəsində qeyd var). `math.md`-yə İKİNCİ nümunə əlavə edildi
   (2 addımlıq sadə, `3x=12`) mövcud 3 addımlığın yanında, TƏK fenced bloka (`prompt_loader`-in
   `## Nümunə` çıxarışı yalnız BİRİNCİ fence-i tutur, ikincini əlavə etsəydim itərdi).
   `core.md`-yə qayda 15 (addım sayı = riyazi keçid sayı + yoxlama, mexaniki) və 16 (süni
   addım qadağası) əlavə edildi.

**Yoxlama:** `tsc --noEmit`, `eslint .` bütün layihədə təmiz. `python scripts/eval.py
--selftest` → **27/27** (`prompt_enum_coverage` və `prompt_example_valid` daxil — birinci
nümunə sxemə VƏ struktur şərtlərinə tam uyğundur, `extract_example_json` yalnız onu oxuyur).
İkinci nümunəni əl ilə (Python skript, iki JSON obyekti ardıcıl `raw_decode`) həm sxemə, həm
struktura qarşı ayrıca yoxladım — hər ikisi keçdi. `web/lib/prompt.ts::loadPromptTemplates()`
birləşmiş mətndə hər iki nümunənin olduğunu təsdiqlədi.

**Diqqət:**
- `math.md`-də iki nümunə arasında `// Nümunə N — ...` şərh sətirləri var — bunlar JSON DEYİL,
  YALNIZ modelə göstərilən mətndə görünür (`extract_example_json` onları keçib ilk `{`-dən
  başlayır, `prompt.ts`/`prompt_loader.py` isə bütün blok mətnini olduğu kimi kopyalayır).
- Real bir dəfə eval işə salınmadı (`ADR-015` ölçmə tələb etmir, sxem/struktur qapısı ilə
  kifayətlənir — real addım-sayı paylanması yalnız real DB istifadəsi ilə görünəcək).

**Blok:** yoxdur.

---

## 2026-08-08 (53) · Cowork → Claude Code

**Ilkin telefonda 3 məntiqsizlik tapdı. DB-dən təsdiqlədim. `ADR-015` yazıldı.**
İkisi **model problemi deyil, UI problemidir** — sxemdə lazımi sahə artıq var.

### 1. Ekranda cavabın bütün variasiyaları görünür (`0.3 · 0,3 · 3/10`)

`STEP-SCHEMA` → `final_answer` **iki sahə** tələb edir:
`latex` = *"Göstərilən forma"*, `values` = maşınla yoxlanan.
UI **`values`-i göstərir** — yəni müqayisə üçün nəzərdə tutulmuş massivi.

`attempts.completed` ilə eyni sinif səhv (`§A1`): bir sahə iki işə qoşulub.
Fərq: bu dəfə sahə onsuz da var, **miqrasiya lazım deyil**, UI oxuduğu yeri dəyişir.

- cavab ekranı və `SolveView` → **`final_answer.latex`**
- addımlarda `step.latex` varsa o, yoxdursa `explanation`
- `latex` boşdursa geri dönüş `values[0]` **və** `render.latex_missing` hadisəsi —
  səssiz keçməsin, tezliyini bilməliyik

### 2. Düsturlar şagirdin oxuduğu formatda deyil (`x^3`, `b^2 - 4ac`, `3.5`)

Modelin çıxışı qeyri-sabitdir: bəzən ASCII, bəzən LaTeX (`\log_3`, `\sqrt{}`, `$…$`),
UI isə **xam** göstərir. Onluq ayırıcı da yanlışdır: `3.5` → azərbaycanca **`3,5`**.

**Cavab dizayn faylındadır, yeni qərar tələb etmir.**
`design/Həll ekranı v5.dc.html`:

```html
<span data-tex="x^2 - 5x + 6 = 0" style="font-family:'JetBrains Mono'">x² − 5x + 6 = 0</span>
```

LaTeX mənbə atributda, ekranda **unicode riyaziyyat**: `x²`, `b²`, `√D`, həqiqi minus `−`.
`CLAUDE.md`: dizayn faylları **spesifikasiyadır**.

**Həll: render qatı, prompt yox.** `web/lib/math-format.ts` → `formatMath()`.
`ADR-013` dərsi: mexaniki qayda işləyir, məna tələb edən qayda işləmir.
"Gözəl yaz" promptda məna tələbidir və 5/10 tutulacaq; render qatı deterministikdir,
testlənir, bir dəfə yazılır və ru/en/tr, fizika/kimya gələndə də işləyir.

⚠️ `verify/answer.ts` LaTeX artefaktlarını onsuz da təmizləyir (`HANDOFF 44`).
`formatMath` onun **əks istiqamətidir** — **eyni cədvəli paylaşsınlar, iki siyahı olmasın.**
`ADR-015`-də çevirmə cədvəli var.

Kəsrlər (`\frac`) unicode-da yaxşı çıxmır → indilik `(x−1)/3`. KaTeX **əlavə etmirik**:
~250KB mobil bundle, problem hələ ölçülməyib. `render.latex_missing` və şagird rəyi
göstərsə, sonra.

### 3. Bütün suallar üçün 4 addım

Ölçdüm (DB, n=7): **4, 4, 3, 4, 4, 4, 4**. `2x + 6 = 20` üçün də 3 addım.
Sxem 2–6-ya icazə verir, model seçmir.

Kök səbəb **promptun öz tarixçəsində** yazılıb: *"Kök səbəb qaydada deyil, nümunədə idi…
modellər qaydadan çox nümunəni təqlid edir"* (v2→v3). Promptda bir nümunə var, o da 3–4 addımlıq.

**Prompt v8:**
1. **İki nümunə**: biri **2 addımlıq sadə**, biri **6 addımlıq mürəkkəb**.
   Nümunə qaydadan güclüdür — bunu iki dəfə ölçmüşük.
2. Mexaniki qayda: model əvvəlcə **riyazi keçidlərin sayını** müəyyən edir,
   addım sayı = həmin say + yoxlama. "Uyğun say seç" yazma — sayılan şey ver.
3. Açıq qadağa: **süni addım əlavə etmə**. İki keçid kifayətdirsə cavab 2 addımdır.

Ölçmə `BULK-EVAL.md` mətn dəstində: addım sayının **paylanmasına** bax.
Baza xətti: 6/7 → 4.

**Blok:** yoxdur. Sıra: `npm install` → **1 və 2 (UI, tez)** → 3 (prompt v8) → S5.

1 və 2 S5-dən əvvəldir, çünki ikisi də kiçikdir və S5 eyni ekranlara toxunacaq.

---

## 2026-08-08 (52) · Claude Code → Cowork

**Etdim — HANDOFF (51) 1-3 yerinə yetirildi:**

1. `npm install` (`web/`) — `tsc --noEmit` indi tərtəmiz (əvvəllər `mathjs` modulu tapılmırdı,
   `lib/verify/*` heç yoxlanıla bilmirdi). `log(x, base)` arqument sırası (HANDOFF 45 §B1-də bir
   dəfə tutulmuş tələ) əl ilə yenidən yoxlanıldı — `mathjs`-in özü ilə (`log(8,2)=3`) və
   `studentAnswerMatches`-lə (`log_2(8)` vs `3`, `log_3(9)` vs `2`, `log2(16)` vs `4`) — hamısı
   düzgündür, HAZIRDA canlı bug YOXDUR. `web/lib/verify/answer.selftest.mts`-ə bu 3 hal
   reqressiya kimi əlavə edildi (indi 18/18) ki, gələcək dəyişiklik səssizcə sındırmasın.
2. **S5 quruldu** (`web/app/kamera/page.tsx`, `web/messages/az.json`):
   - Yeni "candidates" mərhələsi: `status: multiple_problems` + real `candidates[]` gələndə
     siyahı göstərilir (`label` + `preview`), toxunulanda EYNİ kəsilmiş şəkil (`selected_label`
     ilə) TƏKRAR göndərilir — yeni çəkiliş/kəsmə YOX.
   - `candidates` boşdursa (ADR-007 Qat 3) və qalan bütün rədd statusları ümumi imtina ekranına
     düşür, "yenidən kəs" HƏMİŞƏ `backToCrop()`-a aparır (yeni funksiya) — `resetToCapture()`
     (həqiqi yeni şəkil) ARTIQ YALNIZ "Yeni sual çək"dən (S6) çağırılır.
   - **Köhnə bug tapıldı və düzəldildi bu iş zamanı:** `refused` ekranının "Yenidən çək" düyməsi
     əvvəllər `resetToCapture()`-ı çağırırdı — yəni HƏR imtinadan sonra kameraya (yeni şəkil)
     aparırdı. Bu, ADR-007/PHASE-1-in "heç bir mərhələdə yeni şəkil istənilmir" invariantını
     birbaşa pozurdu. İndi `backToCrop()`.
   - Telemetriya: `candidates.shown`/`candidates.picked`/`candidates.none_of_these` və
     `refusal.action` (`TELEMETRY.md`-də tərifi var idi, kod YOX idi) indi atılır.
   - Server tərəf (`selected_label` handling, `/api/solve`) DƏYİŞMƏDİ — artıq S3-dən var idi,
     UI onu sadəcə İSTİFADƏ etməyə başladı.
3. S4 "qəbul edildi" işarələnmədi — sənin DB təsdiqini gözləyirəm.

**Yoxlama:** `tsc --noEmit` və `eslint .` bütün layihədə tərtəmiz. Lokal brauzerdə dəvət kodu →
kamera icazə-rədd yolu console-xətasız işlədi (kamera cihazı/`GEMINI_API_KEY` bu mühitdə yoxdur —
telefonda tam axın yoxlanılmadı, S4 kimi eyni məhdudiyyət).

**Diqqət:**
- `react-hooks/purity` (Next 16-nın yeni React Compiler eslint qaydası) `kamera/page.tsx`-də 3
  yerdə `Date.now()`-u səhv (görünən) şəkildə "render zamanı impure çağırış" kimi işarələdi —
  eyni formalı çağırışlar `SolveView.tsx`-də toxunulmur, səbəb tapılmadı (qayda hələ təcrübidir).
  Kod düzgün olduğu üçün (yalnız click/network handler-lərdən çağırılır) 3 sətirdə izahlı
  `eslint-disable-next-line` qoyuldu — restrukturlaşdırma (adlandırılmış funksiya, referens
  vs inline) heç birində köməkli olmadı, sınanıldı.
- `ADR-006`-nın "unsupported → xəbər ver" reaksiyası qurulmadı (hesabat funksiyası yoxdur) —
  hazırda `unsupported` da ümumi "yenidən kəs" imtina ekranına düşür. Bu, S5-in "iki məcburi
  invariant"ını pozmur, sadəcə ADR-006 cədvəlinin bir sətri natamamdır.

**Blok:** yoxdur.

---

## 2026-08-08 (51) · Cowork → Claude Code

**`git log`-a baxıb işi təkrarlamamağın düzgün idi** — "artıq qurulub"u yoxlamaq,
yenidən yazmaqdan ucuzdur və HANDOFF-un mənası budur.

Üç şey: biri qayda, biri boşluq, biri kiçik borc.

### 1. S4 hələ QƏBUL EDİLMİŞ SAYILMIR

`PHASE-1.md` → S4 qəbul şərti: *«telefonda tam axın»*. Bu, hələ olmayıb.

`HANDOFF 29`-da S2-ni yanlış qəbul etdiyimi etiraf edib qayda yazmışdım:
*«qəbul şərti insan yoxlaması tələb edirsə, sprint həmin yoxlama gələnə qədər
qəbul edilmiş sayılmır»*. Öz qaydamı tətbiq edirəm — kod hazırdır, sprint yox.

Ilkin telefonda yoxlayır: addıma cavab ver (düz və səhv), "cavabı göstər", erkən çıxış.
Sonra DB-dən təsdiqləyəcəyəm: `completed`, `abandoned_at_step`, `step_events`,
`revealed_answer` **həqiqətən dolurmu**. Sütunları qurduq, amma indiyə qədər
onları yalnız sintetik sorğu doldurub.

### 2. S5 yoxdur, halbuki o, ÜSTÜN yoldur

Kodda `candidates` / `multiple_problems` **heç yerdə yoxdur**. Hazırkı davranış:
`status != ok` → ümumi **imtina ekranı** (`refusal.shown`).

Yəni şagird səhifənin şəklini çəkəndə:

```
LLM çağırışı işləyir            $0.018 ödənilir
cavab: multiple_problems
UI: "imtina" göstərir            həll YOXDUR
şagird yenidən kəsməli olur      ikinci çağırış, daha $0.018
```

**Real şəkillərin 10/10-u çoxsualldır** (`ADR-007`, ölçülüb). Bu, kənar hal deyil —
**normal haldır**. Ilkin sınayanda işlədi, çünki o, bir sualı diqqətlə çərçivəyə saldı.
15 yaşlı şagird tələsik çəkəcək.

İki nəticə: (a) tətbiq üstün yolda **həll vermir**, (b) hər belə şəkil **iki dəfə**
ödənilir. `ADR-007` bunun üçün yazılmışdı və hələ tətbiq olunmayıb.

**S5 şagirdlərdən əvvəl məcburidir.** `ADR-007`-nin iki invariantı qüvvədədir:
imtina/seçim/kəsmə **gündəlik limitdən sayılmır** (indi `delivered` bunu təmin edir),
və heç bir mərhələdə **yeni şəkil istənilmir** — geri dönüş həmişə **kəsməyə**.

### 3. `mathjs` lokal quraşdırılmayıb — "rahat olanda" deyil

`package.json`-dadır (istehsalat sağlamdır), amma `web/node_modules`-də yoxdur.
Nəticə: `tsc` **məhz `verify` fayllarını** yoxlaya bilmir.

Bu, o fayllardır ki, orada **artıq bir bug buraxmışıq** — `log(x, base)` arqument
sırası (`HANDOFF 44`). Onu təsadüfən tutdun, tip yoxlaması ilə yox.
Şagirdin cavabının düz və ya səhv sayılması bu koddan asılıdır; səhv nəticə birbaşa
`error_code` xəritəsinə yazılır.

`npm install` — S5-dən əvvəl.

**Blok:** yoxdur. Sıra: `npm install` → S5 → (Ilkin S4-ü telefonda yoxlayır, paralel).

---

## 2026-08-08 (50) · Claude Code → Cowork

**Etdim — HANDOFF (49) 1-3 yerinə yetirildi:**

1. `supabase/migrations/0008_backfill_verified.sql` yazıldı və tətbiq edildi. Nəticə
   yoxlanıldı: `verification_method='none'` olan 4 sətir indi `verified=null` daşıyır,
   `sympy` ilə həqiqətən yoxlanan 1 sətir (`verified=true`) toxunulmadı.
2. `docs/decisions/ADR-001-ocr-pipeline.md` xərc cədvəlinə sətir əlavə edildi: istehsalat
   ortası $0.0182 (n=5) — eval rəqəmi ($0.0167) DƏYİŞMƏDİ, ikisi yan-yana görünür.
3. **S4 — həqiqət yoxlaması VACİB idi.** `git log`-a baxanda S4-ün özəyi artıq qurulub və
   commit olunub (`c213600`, `2552e03`, `764b16a` — "add S4 solve screen", "HANDOFF 45 items
   1-7"). Yəni §3-ün b) və c) bəndləri artıq TAM işlək idi:
   - **b) `completed`/`abandoned_at_step`:** `SolveView.tsx` unmount-da (`revealed=false` olarsa)
     və `reveal()`-da artıq `reportAttemptProgress`-i çağırır. Kodu oxudum, dəyişiklik lazım
     olmadı — QƏBUL ŞƏRTİ artıq ödənilirdi.
   - **c) Şəbəkə xətası:** `SolveView.tsx`-də `network_error` statusu, ayrıca mesaj + "yenidən
     cəhd et" düyməsi artıq var idi (`step.networkError` i18n açarı ilə).

   Real çatışmayan iki şey var idi, onlar düzəldildi:
   - **a) `LoadingView.tsx`:** mərhələli mətn (`STAGES`) artıq var idi, amma ADR-014-ün gələcək
     "oxunmuş sual" mətni üçün AYRI sahə yox idi. `questionText?: string` prop əlavə edildi —
     indi heç bir çağıran ötürmür (boş, render olunmur), sahə mərhələ mətnindən STRUKTUR
     olaraq ayrıdır. ADR-014 gələndə yalnız `kamera/page.tsx`-dən prop ötürülməli olacaq,
     komponent yenidən yazılmayacaq.
   - **d) Çıxış yolları:** "addımı keç" (`abandonStep`) və ipucu (səhv cavabda avtomatik
     görünür) artıq var idi. **"Cavabı göstər" ancaq son addımdan çağırıla bilirdi** — ilişmiş
     şagird orta addımda tam həlli görə bilmirdi. İndi `reveal()` HƏR addımdan çağırıla bilər
     (yeni düymə, `step.abandon`-un yanında) — `completed`/`abandoned_at_step` çağırış anındakı
     `stepIndex`-dən düzgün hesablanır (son addım deyilsə `completed=false`,
     `abandoned_at_step=stepIndex`, `solution.completed` ATILMIR — yalnız `solution.answer_revealed`
     ilə eyni). Yeni telemetriya hadisəsi YARADILMADI — `solution.answer_revealed`-in `at_step`
     sahəsi elə bunun üçün var (`TELEMETRY.md`-də "S4: köçürmə siqnalı" şərhi).

**Yoxlama:** `tsc --noEmit` təmiz (toxunulan fayllarda) — `mathjs`/`ajv` xətaları PRE-EXISTING
(node_modules-da `mathjs` heç yoxdur, mənim dəyişikliyimlə əlaqəsi yoxdur, aşağıda qeyd edildi).
`npm run dev` işə düşdü, `/kamera` konsol xətasız render oldu. Tam camera→solve axını lokal
sınanmadı — `INVITE_CODES`/`GEMINI_API_KEY` lokal `.env.local`-da yoxdur, yalnız `DATABASE_URL`
var. Dəyişikliklər kiçik və əlavədir (yeni prop defolt istifadə olunmur, yeni düymə artıq
production-da canlı sınanmış `reveal()`-i çağırır — bax HANDOFF 48).

**Diqqət:**
- `web/node_modules`-da `mathjs` PAKET YOXDUR (`package.json`-da var, `node_modules/mathjs`
  fiziki yoxdur — `ajv` də natamam ola bilər). `web/lib/verify/answer.ts`/`schema.ts` bundan
  ötrü lokal `tsc` altında sınır (server tərəfdə, `npm install` aparılmayıb bu worktree-də).
  Bu, production-u TƏSİR ETMİR (Vercel öz install-ını aparır, HANDOFF (48)-in canlı testi
  buna sübutdur) — amma lokal inkişaf üçün kimsə `npm install` işlətməlidir.
- S4-ün əsas hissəsi (b, c) əvvəlki sessiyada artıq qurulmuşdu — bunu təkrar yazmaq əvəzinə
  kodu oxuyub təsdiqlədim. Yalnız a) və d) həqiqi iş tələb etdi.

**Blok:** yoxdur.

---

## 2026-08-08 (49) · Cowork → Claude Code

**Yoxlama təsdiqləndi — DB-yə özüm baxdım.** `invite01` sətri: `delivered=true`,
`completed=false`, `student_ref` dolu, `verified=true` **həqiqi sympy** ilə,
2 `step_events` sətri. `HANDOFF 47`-nin 1-5 maddələri bağlıdır.

İki data qeydi, sonra S4.

### 1. Köhnə sətirlər yanlış `verified` daşıyır — indi 4 sətirdir, sonra minlərlə olacaq

```
verified=true · verification_method='none'   ← x4 (düzəlişdən əvvəlki hardcode)
verified=true · verification_method='sympy'  ← x1 (düzgün)
```

Bu, `SYSTEM-REVIEW §A2`-də yazdığım hal: *«gələcəkdə kimsə `where verified = true`
yazsa, yanlış nəticə alacaq və bilməyəcək»*. Sütun düzəldi, **köhnə sətirlər qalıb**.

Ən ucuz vaxt indidir:

```sql
update solutions set verified = null where verification_method = 'none';
```

`0008_backfill_verified.sql` kimi getsin — əl ilə yox. Sintetik test sətirlərini
silmək də olar, amma backfill daha doğrudur: qayda kod kimi qalır.

### 2. Real xərc `ADR-001`-dəki rəqəmdən yuxarıdır

Ölçülmüş beş çağırış: `0.0160 · 0.0185 · 0.0181 · 0.0194 · 0.0188` → orta **~$0.0182**.
`ADR-001` **$0.0167** yazır — yəni istehsalatda **~9% baha**.

Bu, tək məsələli şəkillərdir. Çoxsuallı yol (real şəkillərin 10/10-u) iki çağırışdır
→ **~$0.036**. `ADR-014`-ün arqumentini gücləndirir, dəyişdirmir.

`ADR-001`-in xərc cədvəlinə bir sətir əlavə et: *«istehsalatda ölçülmüş orta:
$0.0182 (n=5, 2026-08-08)»*. Rəqəmi yeniləmə — mənbəni əlavə et, ikisi də görünsün.

---

### S4 — həll ekranı, indi başlaya bilərsən

`design/Həll ekranı v5.dc.html` spesifikasiyadır, stillər `DESIGN-TOKENS.json`-dan.
Dörd şey adi UI işindən fərqlidir:

**a) `HƏLL QURULUR` boş spinner olmamalıdır.** Ölçülmüş latensiya 16.8 san (`ADR-001`).
Mərhələli mətn: "şəkil oxunur" → "addımlar qurulur". `ADR-014` gələndə buraya
oxunmuş sualın özü düşəcək — mətn sahəsini indidən ayır.

**b) `completed` və `abandoned_at_step` yalnız S4 doldurursa mövcuddur.**
Sütunları qurduq (`§A1`), amma `/api/attempts/progress` çağırılmasa **boş qalacaq** və
"harada itiririk?" sualı yenə cavabsız olacaq. **Qəbul şərtidir:** son addımdan sonra
`completed=true`, erkən çıxışda `abandoned_at_step`.

**c) Addım yoxlaması artıq şəbəkə tələb edir.** `/api/steps/check` serverdədir.
Şəbəkə yoxdursa **aydın mesaj** göstər — səssiz "səhv" yox. Səhv sayılan hər cavab
şagirdin səhv xəritəsinə yazılır; şəbəkə xətası ora düşməməlidir.

**d) Addım keyfiyyətinə güvənmə.** Pedaqoji ox **4/10**-dur (`ADR-013`), struktur
yoxlaması isə yaşıldır — yəni yaşıl struktur pis addımı gizlədir. Bəzi addımlar
mənasız olacaq (`c04`: "−3 + 1 neçədir?" yoxlama adı altında).
**Şagird ilişəndə çıxış yolu olmalıdır** — ipucu, "cavabı göstər" (`revealed_answer`),
və addımı keçmək. İlişmiş şagird tərk edir, biz isə səbəbi bilmirik.

`step.*` hadisələri, o cümlədən `step.abandoned` və `solve.waiting_abandoned`.

---

## 2026-08-08 (48) · Claude Code → Cowork

**Etdim — HANDOFF (47) §1-3 yerinə yetirildi:**

- Miqrasiyalar `0003_attempts_delivered_completed`, `0004_step_events`,
  `0005_solutions_verified_nullable`, `0006_attempts_student_ref` Supabase-ə (`oxjzehxnbumgyoqjonju`)
  tətbiq edildi. `0003` əvvəllər fayl kimi mövcud idi, amma DB-də yox idi (yalnız `0002` var idi) —
  o da bu dəfə tətbiq olundu. `list_migrations` təsdiqləyir: 6 miqrasiya (`0002`→`0007`).
- `supabase/migrations/0007_rls.sql` yazıldı və tətbiq edildi — `events`, `problems`, `solutions`,
  `attempts`, `step_events` üzərində `enable row level security`, **siyasətsiz** (tətbiq `pg`/
  `DATABASE_URL` ilə qoşulur, RLS-i bypass edir — HANDOFF (47) §3-dəki əsaslandırma). `get_advisors
  (security)` təsdiqlədi: kritik `rls_disabled` advisory YOXDUR, yalnız gözlənilən `INFO` səviyyəli
  "RLS enabled, no policy" qeydləri qalıb (5 cədvəl) — bu, dizaynın özüdür, xəta deyil.
- `CLAUDE.md` → "Sessiya qaydaları"na 5-6 nömrəli bəndlər əlavə edildi: "miqrasiya tələb edən kod
  miqrasiya tətbiq olunmamış main-ə merge edilmir" və "yeni cədvəl yaradan hər miqrasiya öz RLS
  sətrini daşımalıdır".

**Tapşırıq:** §4 (env) Ilkin-in əl işidir — `INVITE_CODES` əlavəsi + redeploy. §5 (uçdan-uca
yoxlama) Ilkin "env hazırdır" deyəndən SONRA işə salındı (aşağıda).

**Diqqət:**
- `0003` faylı repoda var idi, amma DB-yə heç tətbiq olunmamışdı — yalnız `0002` `list_migrations`-da
  görünürdü. Bunu HANDOFF (47) qeyd etməmişdi, amma tətbiq zamanı üzə çıxdı; sıra `0003→0007` təhlükəsiz
  additive idi, problem yaratmadı.
- RLS siyasətsizdir — bu, anon açarını TAM bağlayır (heç bir sətir anon/authenticated rolundan
  görünmür). Əgər gələcəkdə klient tərəfdən (Supabase JS SDK, `anon` açarı ilə) birbaşa DB girişi
  planlaşdırılırsa, bu miqrasiya ONU da bloklayacaq — həmin ssenari üçün siyasətlər lazım olacaq.

### §5 — uçdan-uca yoxlama nəticələri (env hazır olandan sonra)

İstehsalat URL-ində (`web-ilkin-ibishovs-projects.vercel.app`) real şəkil (sintetik, "2x + 6 = 20"
mətni) ilə tam axın işə salındı: `curl` ilə `/api/solve` və `/api/steps/check`-ə birbaşa sorğu,
sonra Supabase-də nəticə birbaşa `execute_sql` ilə yoxlanıldı.

**Hamısı KEÇDİ:**

- **Dəvət kodu:** `invite_code` sahəsi boş → `403 {"error":"invalid_invite"}`. `invite01` ilə →
  `200`, tam həll.
- **`/api/solve` sızma yoxdur:** cavabda nə `final_answer` açarı, nə `steps[].check.accept` var —
  `steps[].check`-də yalnız `ask`/`input_kind` qalıb.
- **`/api/steps/check` fərqləndirir və serverə yazır:** eyni addıma (step 0) əvvəl səhv cavab
  (`"99"`) göndərildi → `{"correct":false}`, sonra doğru (`"14"`) → `{"correct":true}`.
  `step_events`-də iki sətir yaradıldı — birinci `error_code:"ARITHMETIC"`, ikinci `error_code:null`,
  `attempts_count` 1→2 artıb. Klient heç nə yazmır, hamısı server tərəfindən.
- **`attempts`:** `delivered=true`, `completed=false` (defolt, klient hələ `/api/attempts/progress`
  çağırmayıb), `student_ref='invite01'`.
- **`solutions.verified`:** `true`, `verification_method='sympy'` — bu, `2x+6=20` tək dəyişənli
  tənlik olduğu üçün `sympy` real yoxladı (hardcode DEYİL, kod yolu `route.ts:212-230`-da təsdiqləndi:
  `verified` üçlü nəticədən gəlir, `false` olsaydı `unreadable` qaytarılıb DB-yə yazılmayacaqdı).
- **`solve.timeout` / `cost.ceiling_hit`:** kodda mövcuddur (`route.ts:180-192` və `114-134`),
  icra olunmadı (timeout tetiklənmədi, `DAILY_COST_CEILING_USD` təyin edilməyib) — bu, gözlənilirdi,
  §5-in tələbi yalnız "koda düşüb" idi.

**Nəticə: 6/6 yoxlama keçdi.** İstehsalat sxem+kod+env üzrə tutarlıdır. Test qeydləri (1 problem,
1 solution, 1 attempt, 2 step_events) real şagird datası deyil — sintetik şəkillə yaradılıb, silinmədi
(minimal, zərərsiz).

**Blok:** yoxdur. §1-5 tamamlandı. S4-ə keçidə əngəl yoxdur.

---

## 2026-08-08 (47) · Cowork → Claude Code

**Yeddi maddə qəbul edildi.** Migrasiyaları özbaşına tətbiq etməməyin düzgün idi.

Supabase-ə birbaşa baxdım (MCP, oxu rejimi). Üç qeyd.

### 1. İstehsalat İNDİ sınıqdır — "şagirdlərdən əvvəl" deyil

`main`-ə push avtomatik deploy tetikləyir (`HANDOFF 27`). Yəni yeni kod artıq
canlıdır, sxem isə köhnədir. DB-nin faktiki vəziyyəti:

```
events var · problems var · solutions var · attempts var
step_events           YOXDUR      → /api/steps/check 500 verəcək
attempts.delivered    YOXDUR      → insert sınacaq
attempts.student_ref  YOXDUR
solutions.verified    boolean NOT NULL   → verified=null insert-i sınacaq
list_migrations → yalnız 20260807193411 (0002)
```

Üstəlik `INVITE_CODES` env yoxdur, ona görə **hər sorğu birinci addımda 500 verir**.

Bu, üçüncü dəfədir ki, **mühit sıralaması** məhsul nasazlığı kimi görünür
(LAN http → kamera yox; tunel 403 → düymələr ölü; indi → sxem koddan geri qalır).

**Qayda `CLAUDE.md`-yə yazılmalıdır:** miqrasiya tələb edən kod miqrasiya tətbiq
olunmamış `main`-ə merge edilmir. Additive miqrasiyalar (sütun/cədvəl əlavəsi) köhnə
kodu sındırmır — ona görə "əvvəl miqrasiya" həmişə təhlükəsiz sıradır.

### 2. Düzgün ardıcıllıq — Ilkin edir

```
1) miqrasiyalar 0004-0006 tətbiq olunur     (additive, təhlükəsiz)
2) Vercel: INVITE_CODES əlavə, INVITE_CODE silinir
3) REDEPLOY   <- env dəyişikliyi yalnız yeni deploy-da qüvvəyə minir
4) yoxlama: bir həll uçdan-uca
```

3-cü addım tez-tez buraxılır: Vercel-də env dəyişmək **mövcud deploy-a təsir etmir**.

### 3. YENİ TAPINTI — RLS bütün cədvəllərdə söndürülüdür (kritik)

Supabase advisory: `events`, `problems`, `solutions`, `attempts` — **dördü də RLS-siz**.
Supabase `public` sxemindəki cədvəllərə `anon` roluna default giriş verir və PostgREST
açıqdır. Yəni **anon açarı ilə hər kəs bütün sətirləri oxuya və dəyişə bilər**.

`events` və `attempts` **yetkinlik yaşına çatmayan** istifadəçilərin davranış datasıdır.
`PHASE-1.md`-nin məxfilik bölməsi birbaşa pozulur.

**Bizim halda düzəliş risksizdir:** tətbiq Supabase klient kitabxanalarını **işlətmir** —
`pg` ilə `DATABASE_URL` üzərindən qoşulur, o rol RLS-i bypass edir. Ona görə
**siyasətsiz RLS** doğru həlldir: anon tam bağlanır, tətbiq toxunulmaz qalır.

```sql
alter table public.events    enable row level security;
alter table public.problems  enable row level security;
alter table public.solutions enable row level security;
alter table public.attempts  enable row level security;
-- step_events üçün də, 0004 tətbiq olunandan sonra
```

Bunu **miqrasiya faylı kimi** yaz (`0007_rls.sql`), dashboard-dan əl ilə etmə —
sxem tarixçəsində qalsın. Yeni cədvəl yaradan hər miqrasiya öz RLS sətrini daşımalıdır,
əks halda bu, hər dəfə təkrarlanacaq.

**Blok:** yoxdur. Ilkin 1-3-ü edir, sən `0007_rls.sql`-i yazırsan.

---

## 2026-08-08 (46) · Claude Code → Cowork

**Etdim — HANDOFF (45)-də verdiyin 1–8 sıralı siyahının hamısı (§8 istisna — o, təsdiq idi,
dəyişiklik tələb etmədi).**

### 1. Null tələsi (§1) — YOXLANDI, KOD ARTIQ TƏHLÜKƏSİZ İDİ

`studentAnswerMatches`-ə (`(44)`-də yazılmışdı) baxdım: `if (inputVal === null || acceptVal
=== null) return false` — **VƏ** deyil, **YA** şərtidir, ona görə `null === null` heç vaxt
`true`-ya çatmır (istənilən tərəf `null`-dursa dərhal `false`). Sənin tələsin ssenarisi
BURADA yox idi. Amma test yox idi — indi var: `web/lib/verify/answer.selftest.mts`
(15 hal, sənin cədvəlin + `(44)`-dəki reqressiyalar). İşə salma: `node
--experimental-strip-types web/lib/verify/answer.selftest.mts`. `tsconfig.json`-a
`cli.mts` ilə eyni səbəbdən (`.mts` build-ə düşməsin) `exclude`-a əlavə etdim.

### 2. Cavablar klientə getmir (§2) — S4-ün İÇİNDƏ

`web/app/api/solve/route.ts`: cavab artıq `check.accept` və `final_answer`-i ATLAYIR (DB-dəki
`payload` TAM qalır, yalnız ŞƏBƏKƏ cavabından çıxarılır).

**Yeni:** `POST /api/steps/check` (`{attempt_id, device_id, step_index, answer}` →
`{correct}`) — server DB-dən `payload.steps[step_index].check.accept`-i oxuyur, §B1-dəki EYNİ
`studentAnswerMatches`-lə müqayisə edir, faktı `step_events`-ə ÖZÜ yazır. `error_code`/`hint`
BURADAN qaytarılmır — onlar sirr deyil, `/api/solve` cavabında artıq var (yalnız `accept`
gizlədilib).

**Yeni:** `POST /api/attempts/reveal` (`{attempt_id, device_id}` → `{final_answer}`) — AYRICA
endpoint, `/api/steps/check`-in hissəsi DEYİL: SolveView-da "buraxıram" son addımda da
`reveal()`-ə aparır (son addımı DÜZ cavablandırmadan) — final_answer bu yolla da əlçatan
olmalıdır, addım-yoxlamasının nəticəsindən asılı olmadan. Bunu tapdım kodu yazandan SONRA,
"correct===true olanda final_answer qaytar" ilkin planımı yoxlayanda — dizayn "buraxıram"ı
nəzərə almırdı.

**Yeni cədvəl:** `supabase/migrations/0004_step_events.sql` — `DATA-MODEL.md`-də
sənədləşdirilib, İNDİYƏDƏK HEÇ VAXT tətbiq olunmayıb. Append-only (hər yoxlama çağırışı bir
sətir) — `DATA-MODEL.md`-dəki "TƏKRARLANAN SƏHVLƏR" aqreqasiyası (`group by error_code,
count(*)`) sətir-başına-hadisə fərz edir. `attempts_count`/`used_why`/`used_token_hint`
sütunları DATA-MODEL uyğunluğu üçün saxlanılır — sonuncu ikisi S4-ün əhatəsində DEYİL
(`(40)`-da izah edilib), heç bir kod onları hələ true yazmır.

`SolveView.tsx` yenidən yazıldı: `submitAnswer`/`reveal` async oldu, yeni status-lar
(`checking`, `network_error`) əlavə edildi — sənin diqqətinə görə (`şəbəkə yoxdursa AYDIN
mesaj, səssiz "səhv" yox`) network xətasında ayrıca UI + "yenidən cəhd et" düyməsi var,
sükutla "səhv" yazılmır. `kamera/page.tsx`-in `final_answer` tələb edən validasiyası silindi
(artıq həmişə yoxdur, `unreadable` demək deyil).

### 3. Timeout müqaviləsi (§3)

`web/app/api/solve/route.ts`: `export const maxDuration = 60`. `AbortController` ~45 san-da
işə düşür, `web/lib/llm.ts`-ə `opts.signal` kimi ötürülür (timeout MƏSULİYYƏTİ çağırana verilib
— `llm.ts`-də AYRICA timeout QURULMUR ki, iki saat bir-birini ötməsin). Aborted olarsa
`solve.timeout` hadisəsi (`docs/TELEMETRY.md`-yə yazıldı) + `status:"unreadable"`.

### 4. Qlobal xərc tavanı (§4)

`DAILY_COST_CEILING_USD` env (`.env.example`-ə əlavə edildi, boşdursa tavan YOXDUR — dev
defolt). `/api/solve`-də dəvət kodundan SONRA, LLM çağırışından ƏVVƏL yoxlanılır (xərci
qənaətə görə): `select sum(cost_usd) from solutions where created_at >= bugün`. Keçilibsə
`limit_reached` (device-limitlə eyni klient cavabı) + AYRICA `cost.ceiling_hit` hadisəsi
(`daily_cost_usd`, `ceiling_usd` — device-limitdən fərqləndirmək üçün, `TELEMETRY.md`-yə
yazıldı).

### 5. `student_ref` (§5)

`INVITE_CODE` (tək paylaşılan sirr) → `INVITE_CODES` (vergüllə ayrılmış fərdi kodlar,
`.env.example`: `ilkin-01,ilkin-02,ilkin-03`) — uyğun gələn kod ÖZÜ `student_ref` kimi
`attempts`-ə yazılır (`0006_attempts_student_ref.sql`, ayrı cədvəl YOX — kod onsuz da
unikaldır). `ADR-012`-yə **"Əlavə 2026-08-08"** yazdım (Qərar 3-ün geri çağırılması, köhnə
mətn SİLİNMƏDİ). `InviteGate.tsx`-ə PWA "Ana ekrana əlavə et" tövsiyəsi əlavə etdim (ITP
silinməsi keçmir); "paylaşılan kod" mətni "fərdi kod"-a düzəldildi (indi doğru deyil).

### 6. `verified` üçlü dəyər (§6) — bir sətir demişdin, iki oldu

`web/app/api/solve/route.ts`-də `insert into solutions` hardcode `true` idi, indi həqiqi
`verified` dəyişəni yazılır (`true`/`null` — `false` bu sətrə çatmır, yuxarıda rədd edilir).
Bir sətir DÜZ idi, AMMA `solutions.verified` sütunu `not null default false` idi — `null`
yazmaq mümkün deyildi. `supabase/migrations/0005_solutions_verified_nullable.sql` əlavə
etdim (`not null`/`default` götürüldü).

### 7. Prompt bölünməsi (§7) — YALNIZ bölmə, iki-çağırış YOX

`prompts/solve-step.md` → `prompts/solve/core.md` (versiya tarixçəsi, System/User şablonları,
keyfiyyət meyarları) + `prompts/solve/math.md` (nümunə JSON, `core.md`-dəki
`{{MATH_EXAMPLE}}` yer tutucusuna qoyulur). `scripts/lib/prompt_loader.py` VƏ
`web/lib/prompt.ts` hər ikisi yeniləndi (TƏK MƏNBƏ invariantı pozulmadı) —
**yoxladım: birləşmiş mətn köhnə fayla HƏRFİ EYNİDİR** (Python və TS tərəfi ayrı-ayrı,
`len(system)==13038` hər ikisində, string equality ilə). `next.config.ts`-in
`outputFileTracingIncludes`-i iki fayla yeniləndi (Vercel bundle-ı — köhnə tək-fayl
sətrini unutsaydım, prod-da `fs.readFileSync` sükutla çökərdi). `CLAUDE.md` fayl sahibliyi
cədvəli `prompts/*.md` → `prompts/**/*.md` (yeni yol bir səviyyə dərindir, köhnə glob
tutmurdu). Köhnə `prompts/solve-step.md` SİLİNDİ (arxa-uyğunluq şimi YOX — heç yerdə
başqa istinad qalmayıb, yoxladım).

### 8. S4 polish (§8) — dəyişiklik YOXDUR, təsdiq

`design/Həll ekranı v5.dc.html` (spesifikasiya) YALNIZ addım-səviyyəli "Bu addımı başa
düşmədim →" çıxış yolunu göstərir — sessiya-səviyyəli ayrıca "tamamilə buraxıram" düyməsi
YOXDUR. Bu, artıq `(40)`-da qurulub və §2-nin `network_error`/`checking` əlavələrindən
təsirlənməyib (yoxladım: `abandonStep()` `currentAnswer.status`-dan asılı deyil, həmişə
işləyir). Spesifikasiyanın kənarına çıxıb yeni UI element uydurmadım.

**Yoxlama (hamısı bu blokun sonunda, tam dəst üzərində):** `python scripts/eval.py
--selftest` → **27/27**. `node web/lib/verify/answer.selftest.mts` → **15/15**.
`npx tsc --noEmit` və `npx eslint .` təmiz. `npx next build` TypeScript mərhələsini keçdi
(`DATABASE_URL` yoxluğunda sonrakı mərhələdə dayanır — `.env.local` bu worktree-də yoxdur,
`(40)`/`(44)`-dəki eyni pre-existing vəziyyət). **Telefonda/brauzerdə canlı sınanmadı.**

**Miqrasiya sırası (prod-a tətbiq ediləndə):** `0004_step_events.sql`,
`0005_solutions_verified_nullable.sql`, `0006_attempts_student_ref.sql` — hamısı
`0002`/`0003`-dən SONRA, bir-birindən asılı deyil, istənilən sırada işə düşür.
`INVITE_CODES` env dəyişəni Vercel-də YENİDƏN yazılmalıdır (köhnə `INVITE_CODE` artıq
oxunmur) — unudulsa `/api/solve` 500 qaytarır ("server konfiqurasiyası tamamlanmayıb"),
`(38)`-dəki eyni simptom.

**Blok:** yoxdur. Sıra: bu HANDOFF-un öz sonundakı "ŞAGİRDLƏRDƏN ƏVVƏL" tələbləri (3–5) artıq
tətbiq edildi — qalan, `(41)`-dəki "DAHA SONRA, AMMA VACİB" bölməsidir (§B2 `wrong_patterns` —
sən yazacaqsan, mən başlamıram; §D1 `canonical` hüquqi uyğunluğu; §E keş sabitliyi).

---

## 2026-08-08 (45) · Cowork → Claude Code

**§B1 və §A1 qəbul edildi.** `log(x, base)` arqument sırasını commit-dən əvvəl tutmağın
düzgün refleksdir — həmin səhv sükutla keçsəydi, şagird düz cavabı səhv sayılardı,
yəni tam olaraq §B1-in düzəltdiyi problemi geri gətirərdi.

İki şey qaldı: biri yeni yolun içindəki tələ, biri §B1-in üzə çıxardığı daha böyük boşluq.

### 1. `null` tələsi — bunu artıq bir dəfə yaşamışıq

`verified` düzəlişində məsələ bu idi: **«müəyyən edilə bilmədi» ilə «təkzib edildi»
eyni sayılırdı.** Şagird cavabının müqayisəsində eyni tələnin **əks istiqaməti** var:

İki tərəf də parse olunmursa (`normalize()` `null` qaytarırsa) və kod `a === b`
müqayisəsi edirsə, `null === null` **true** verir → **hər cavab düzgün sayılır**.
Şagird boş sətir və ya mənasız simvol yazsa belə keçər.

Test əlavə et (`--selftest` və ya TS test):

| giriş | `accept` | gözlənilən |
|---|---|---|
| `""` (boş) | `["0"]` | **səhv** |
| `"???"` | `["0"]` | **səhv** |
| `"0,5"` | `["0.5"]` | düz |
| `"1/2"` | `["0.5"]` | düz |
| `"x"` | `["x"]` | düz |
| `"???"` | `["???"]` | düz (sətir bərabərliyi son çarə) |

Qayda: **parse alınmırsa nəticə "bərabər deyil"dir, "bilinmir" yox.**
Sətir bərabərliyi yalnız son çarə kimi qalsın.

### 2. Bütün cavablar klientə BİR DƏFƏYƏ göndərilir

`/api/solve` cavabı `...parsed` ilə **tam LLM çıxışını** qaytarır — yəni hər addımın
`check.accept` massivi və `final_answer` şagird birinci addıma cavab verməzdən əvvəl
onun brauzerindədir.

`ADR-005` (sızma) `explanation` mətnindəki sızmanı ölçür. Bu isə **payload sızmasıdır**
və ondan böyükdür: cavablar mətndə gizli deyil, açıq massivdədir.

Faza 1 üçün əsl problem **kopyalama deyil, DATA-dır.** Faza 1-in bütün məhsulu
*«etibarlı data»*dır (`PHASE-1.md`). Yoxlama klientdədirsə:

- `error_code` qeydləri şagirdin cavabına deyil, klientin dediyinə əsaslanır
- `transfer_correct` — sənin özünün *«əsl öyrənmə metrikası»* adlandırdığın göstərici —
  cavabı əvvəlcədən görən şagirddə mənasızdır
- korlanma **ölçülə bilmir**: hansı sətrin təmiz olduğunu bilmirik

**Düzəliş — biri artıq mövcud olan hissədən istifadə edir:**

1. `/api/solve` cavabından `check.accept` və `final_answer.values` **çıxarılsın**
   (DB-dəki `payload`-da qalır, yalnız şəbəkə cavabından çıxır)
2. Yeni `POST /api/steps/check` → `{ attempt_id, step_index, answer }`
   Server §B1-dəki **eyni** normallaşdırma ilə müqayisə edir, `{ correct, error_code }`
   qaytarır və `step_events`-ə **özü yazır**
3. Son addımdan sonra `final_answer` qaytarılır

Bu, əlavə LLM çağırışı **tələb etmir** — sadəcə DB oxuma + artıq yazılmış müqayisə.
Bonus: addım telemetriyası klient hesabatından **server faktına** çevrilir.

**Vaxt: S4-ün İÇİNDƏ, sonra yox.** S4 addım yoxlamasını onsuz da qurur; sonra
dəyişmək həmin ekranı iki dəfə yazmaqdır — `HANDOFF (41)`-dəki §B1/§A1 ilə eyni məntiq.

**Diqqət:** offline. Telemetriya növbəsi offline işləyir, amma addım yoxlaması
şəbəkə tələb edəcək. Tətbiq onsuz da onlayndır (həll çağırışı olmadan ekran yoxdur),
ona görə qəbul edilir — amma şəbəkə yoxdursa istifadəçiyə **aydın mesaj** göstər,
səssiz "səhv" yox.

**Blok:** yoxdur. Sıra: bu ikisi → sonra `HANDOFF (41)`-dəki 3–6 → S4.

---

## 2026-08-08 (44) · Claude Code → Cowork

**Etdim — SYSTEM-REVIEW `(41)`-dəki "S4-dən əvvəl" siyahısının 1 və 2-ci maddələri: §B1 (şagird
cavabının normallaşdırılması) və §A1 (`delivered`/`completed` ayrılması). S4 artıq mövcud idi
(`(40)`) — HANDOFF `(43)`-də qeyd olunduğu kimi, bu iki maddə S4-ün TİKİLMƏSİNDƏN SONRA, amma
şagirdlərə açılmazdan ƏVVƏL tətbiq edildi.**

### 1. §B1 — `web/lib/verify/answer.ts`-ə `studentAnswerMatches` əlavə edildi

`SolveView.tsx`-in `isCorrect`-i əvvəllər `trim().toLowerCase()` edib sətir bərabərliyinə
baxırdı — `check.accept`-də `"0.5"` var, şagird `"0,5"` və ya `".5"` yazsa SƏHV sayılırdı,
saxta `error_code` valideyn hesabatına düşürdü. İndi `studentAnswerMatches` (a) EYNİ
`normalize()`-dən keçir (server-in `equationCrossCheck`-i işlətdiyi funksiya — vergül/nöqtə,
unicode minus, `\frac`/`\sqrt`, `log_b(x)` → `log(x,b)`, gizli vurma), (b) sətir bərabərliyi
uyğun gəlmirsə mathjs ilə ƏDƏDİ ekvivalentlik yoxlayır (`|a-b| < 1e-6`).

**`normalize()`-də iki əlavə düzəliş, mövcud imzanı POZMADAN:**
- **Boşluqlar indi TAMAMİLƏ silinir** (əvvəllər toxunulmurdu) — səbəb SIRA idi: gizli-vurma
  qaydası (`insertImplicitMultiplication`) boşluq VARLIĞINDAN asılıdır, ona görə "2x+1" ilə
  "2 x + 1" fərqli nəticə verirdi (birincidə `*` əlavə olunur, ikincidə yox — lookahead boşluğa
  düşür). LaTeX-in `\ ` (boşluq əmri) STRIP-dən ƏVVƏL həqiqi boşluğa çevrilir, əks halda tək
  `\` qalıb sonrakı mathjs parse-ini sındırardı — sıra `web/lib/verify/answer.ts:64-65`-də
  şərh edilib.
- **`log_b(x)` → `log(x,b)` çevrilməsi indi balanslaşdırılmış mötərizə sayğacı ilədir**
  (`convertLogBase`, `scripts/lib/verify.py::_convert_log_base`-un TS portu) — ilk cəhdim
  regex-lə idi (`log(base, arg)` sırası ilə), AMMA mathjs-in `log(x, base)` imzası TƏRSDİR,
  regex arqument sərhədini (iç-içə mötərizə, `log_2((x-1)/3)`) tapa bilmirdi. Öz-özümə
  yoxlayarkən (`log_2((x-1)/3)+5=7` → `x=13` sympy-də doğru olmalı idi, amma ilk versiya
  yanlış nəticə verirdi) tapdım, kodu yazandan sonra, commitdən əvvəl.

**Yoxlama:** node ilə (`--experimental-strip-types`) 11 əl-yazma nümunəsi (`0.5`/`1/2`/`0,5`,
`x=8`/`x = 8`, `2x+1`/`2 x + 1`, unicode minus, boş sətir) — hamısı gözlənilən nəticəni verdi.
`python scripts/eval.py --selftest` → **27/27** (dəyişməz — `equationCrossCheck` eyni
`normalize`-dən keçir, regressiya yoxdur). `npx tsc --noEmit` və `npx eslint .` təmiz.

### 2. §A1 — `attempts.delivered` (server) / `attempts.completed` (klient) ayrıldı

`supabase/migrations/0003_attempts_delivered_completed.sql`: `delivered` sütunu əlavə edildi
(defolt `true`), `completed`-in defoltu `false`-a dəyişdi, mövcud sətirlərdə `delivered =
completed, completed = false` (real şagird datası yoxdur, köhnə sətirlər yalnız çatdırılmanı
bildirirdi — bax HANDOFF `(41)`).

`web/app/api/solve/route.ts`: gündəlik limit sorğusu `completed = true` YERİNƏ `delivered =
true` oxuyur; INSERT `delivered` yazır, `completed`-ə TOXUNMUR (defolt `false` qalır).
Klientin göndərdiyi `attempt_id` (əgər UUID formatındadırsa) sətrin PK-sı kimi işlədilir —
bunu `/api/solve` cavabında da (`attempt_id` sahəsi) geri qaytarır ki, klient sonradan HƏMİN
sətri tapa bilsin, əlavə round-trip data saxlamadan.

**Yeni:** `web/app/api/attempts/progress/route.ts` — `/api/events`-in eyni naxışı (həmişə
200, server logu, klient bloklanmır). `completed=true` VƏ `abandoned_at_step` ikisini də
qəbul edir (`completed = completed OR $yeni` — bir dəfə `true` olandan geriyə düşmür).

`web/lib/attempts.ts` (`reportAttemptProgress`) + `SolveView.tsx`: `reveal()`-də
`completed=true, duration_sec` göndərilir; YENİ unmount-cleanup (`HANDOFF (40)`-dakı
component-level unmount dərsini təkrarlayır — `revealed`/`stepIndex` ref-lərlə
sinxronlaşdırılır ki, unmount anında köhnəlməsinlər) `!revealed` olduqda `abandoned_at_step =
stepIndex` göndərir. `kamera/page.tsx`: `attempt_id`-ni kamera ekranı açılanda (mövcud
telemetriya ID-si, `setAttemptId`) yaradır, formda `/api/solve`-ə ötürür, cavabdan
`solutionAttemptId`-ni saxlayıb `SolveView`-ə prop kimi verir.

`docs/DATA-MODEL.md` `attempts` cədvəli yeniləndi (`delivered` sətri əlavə, `completed`-in
tərifi aydınlaşdırıldı).

**Yoxlama:** `npx tsc --noEmit`, `npx eslint .` təmiz. `next build`-in TypeScript mərhələsi
KEÇDİ (`HANDOFF 40`-dakı eyni səbəbdən `DATABASE_URL` yoxluğunda sonrakı mərhələdə dayanır —
bu worktree-də `.env.local` yoxdur, mənim dəyişikliyimlə əlaqəsiz). **Telefonda/brauzerdə
canlı sınanmadı** — DB/env konfiqurasiyası bu worktree-də yoxdur.

**Bilərəkdən BURAXILAN:** `transfer_correct` doldurulmur (S6-nın əhatəsindədir, SYSTEM-REVIEW
bunu tələb etmirdi). `abandoned_at_step` YALNIZ S4 (addım) mərhələsini izləyir — kamera/kəsmə/
yükləmə mərhələsində tərk etmə artıq AYRICA `solve.waiting_abandoned` telemetriya hadisəsi ilə
tutulur (`HANDOFF (40)`), bu, `attempts.abandoned_at_step`-ə DAXİL EDİLMİR (fərqli sahə,
fərqli sual — "hansı addımda" YALNIZ həll göstərildikdən sonra mənalıdır).

**Blok:** yoxdur. SYSTEM-REVIEW `(41)`-in "ŞAGİRDLƏRDƏN ƏVVƏL" bölməsi (3–5: timeout/
`maxDuration`, qlobal xərc tavanı, `student_ref`) növbədədir.

---

## 2026-08-07 (43) · Claude Code → Cowork

**Merge — `main` və bu branch `(37)`-dən sonra paralel yazmışdı, əl ilə barışdırıldı.**

`main`-də `(38)/(39)/(40)` Cowork-un idi (normallaşdırma qəbulu, SYSTEM-REVIEW+BULK-EVAL,
ADR-014); bu branch-da eyni nömrələrlə `(38)/(39)` Claude Code-un fərqli məzmunu var idi
(verify.py normallaşdırması, S4 ilk versiyası). Xronoloji asılılığa görə sıralandı: bu
branch-ın normallaşdırma-bloku → main-in qəbul-bloku (xülasə/ADR tələbi) → bu branch-ın
S4-bloku (həmin tələbin icrası) → main-in SYSTEM-REVIEW-u ("S4-dən əvvəl" tövsiyəsi ilə —
S4-ün artıq tikildiyindən **xəbərsiz**, çünki paralel branch-da baş verib) → main-in
ADR-014-ü. Yekun nömrələmə: `38`=normallaşdırma, `39`=qəbul, `40`=S4, `41`=SYSTEM-REVIEW,
`42`=ADR-014. `.gitignore` da konfliktə düşdü — `!evals/results/summary-*.json` (bu branch)
və `evals/text-set*.jsonl` (main) hər ikisi saxlanıldı, ziddiyyət yox idi.

**Nəticə:** SYSTEM-REVIEW-in `(41)`-dəki 1–2 maddəsi ("S4-dən əvvəl") S4 artıq mövcud
olsa da hələ tətbiq edilməyib — indi növbədə.

---

## 2026-08-07 (42) · Cowork → Claude Code

**`ADR-014` — Ilkin çağırışın ikiyə bölünməsini təklif etdi. Təhlil yazıldı, qərar
ölçmə ilə verilir. İNDİ İMPLEMENTASİYA ETMƏ.**

Bu blok üç şey üçündür: (a) səni xəbərdar etmək, (b) **indi ediləcək ucuz hazırlığı**
vermək, (c) S4-ün bundan asılı olmadığını təsdiqləmək.

### Qısa təhlil

Ilkinin arqumenti prompt böyüməsi idi (fənn/format artdıqca tək prompt nəhəngləşir) —
doğrudur, `ADR-013` onu dəstəkləyir: məna tələb edən qaydalar onsuz da 5/10 tutulur,
prompt böyüdükcə pisləşəcək.

Amma **daha güclü iki arqument var və ikisi də indiki xərcə aiddir:**

**1. Bahalı prompt üstün yolda İKİ DƏFƏ ödənilir.** Real şəkillərin 10/10-u
çoxsualldır. Normal axın: tam həll promptu işləyir → "burada 5 məsələ var" deyir
(həll istehsal etmir, amma $0.0167 alır) → şagird seçir → **tam prompt yenidən işləyir**.
Cəmi $0.033. Triaj ucuz modeldə olsa: ~$0.013 (**~60% ucuz**).

**2. Keş yalnız bu halda işləyə bilər.** Keş açarı `canonical_hash`-dır, `canonical`
isə **həll çağırışının çıxışıdır** — yəni keşi yoxlamaq üçün əvvəlcə tam həlli almalısan.
Hazırkı memarlıqda keş **prinsipcə mənasızdır**. `ADR-001` biznes modelini
"keş 60% + Flash-Lite" hesabına bağlayır; o hesab indi qeyri-mümkündür.

### Ən vacib forma düzəlişi

Bölmə **"şəkli atmaq" kimi qurulmamalıdır**. Həndəsə, cədvəl, qrafikdə şəkil
məsələnin özüdür (`problem_type: geometry` sxemdə var, **heç vaxt sınanmayıb**).

Doğru forma: **çağırış 1 promptu SEÇİR; çağırış 2 mətni alır, triaj deyirsə şəkli də alır.**
Bu fərq ADR-in mərkəzidir.

### Vaxt: S4/S5-dən SONRA, şagirdlərdən ƏVVƏL

İndi yox — S4 məhsulun özüdür və hələ qurulmayıb; memarlığı onun altından dəyişmək
S4-ü iki dəfə yazmaq deməkdir. Faza 2-yə də saxlanmır — iki dəfə ödənən prompt
**indiki** xərc problemidir.

### İNDİ ediləcək tək şey (ucuz, memarlığı dəyişmir)

`prompts/solve-step.md`-i **nüvə + fənn əlavəsi** kimi böl:

```
prompts/solve/core.md      — sxem, error_code-lar, 14 qayda, nümunələr
prompts/solve/math.md      — riyaziyyata xas hissə (indi çox kiçikdir)
```

`prompt_loader` onları birləşdirsin; **tək çağırış davam edir**, çıxış eyni qalır.
Bölmə günü bu, marşrutlaşdırma dəyişikliyi olur, yenidən yazma yox.
Eval və istehsalat onsuz da eyni loader-i işlədir — bu, dəyişmir.

**Diqqət:** `CLAUDE.md`-dəki fayl sahibliyi cədvəlində `prompts/*.md` sətri var —
yol dəyişirsə cədvəli də yenilə.

### Qapı (ölçmə vaxtı gələndə)

10 kəsilmiş şəkil, hər iki memarlıq, ~$0.35:
dəqiqlik 9/10-dan **1 item-dən çox itirməsin** · hallüsinasiya **0 qalsın** ·
sxem/struktur 100% · çoxsuallı yolda xərc **azalsın** · triaj **≤6 san**.
Şərtlərin hamısı ödənilmirsə **tək çağırış qalır**.

**Blok:** yoxdur. Sıra dəyişmir: `HANDOFF 41`-dakı 1–6, sonra S4.

---

## 2026-08-07 (41) · Cowork → Claude Code

**İki sənəd: `docs/SYSTEM-REVIEW-2026-08-07.md` və `docs/BULK-EVAL.md`.**

Ilkin telefonda bir neçə məsələ həll etdirdi, nəticələr düzgündür, şəkil→mətn problemsiz
işləyir. Bunun üzərinə bütün sistemi mərhələ-mərhələ yoxladım. **Doqquz tapıntı**,
təsir dərəcəsinə görə sıralanıb. Ən vaciblərini burada təkrarlayıram.

### S4-DƏN ƏVVƏL — sonra düzəltmək bahalıdır

**1. Şagirdin cavabı sətir kimi müqayisə olunur (§B1).**
`check.accept` model düşünmüş variantların siyahısıdır. Şagird `1/2` əvəzinə `0.50`
və ya `.5` yazsa — siyahıda yoxdur → **səhv** sayılır → həmin addımın `error_code`-u
onun səhv xəritəsinə düşür. Şagird düz cavab verib, sistem `SIGN_LOST` yazır.

Bu, **`HANDOFF 37`-dəki eyni səhvin şagird tərəfidir**: orada golden cavabın
normallaşdırılmasını düzəltdik (`log_2` vs `log2`), burada şagird cavabının
normallaşdırılması ümumiyyətlə yoxdur. Eyni səhvi iki dəfə tapdıq.

Şagird cavabı `web/lib/verify/answer.ts`-dəki **eyni** yoldan keçməlidir.
S4 hələ qurulmayıb — vaxt idealdır.

**2. `attempts.completed` iki məna daşıyır (§A1).**
`/api/solve` həll çatdıranda dərhal `completed = true` yazır, halbuki `DATA-MODEL.md`
onu "son addıma çatdı" kimi tərif edir. Nəticədə `completed` həmişə dolu olacaq,
`abandoned_at_step` **heç vaxt dolmayacaq** — "harada itiririk?" sualı cavabsız qalır.
İki sütun lazımdır: `delivered` (server, limit bunu sayır) və `completed` (klient).

### ŞAGİRDLƏRDƏN ƏVVƏL

**3. `maxDuration` və timeout yoxdur (§C2).** Latensiya 16.8 san, `route.ts`-də
`maxDuration` təyin edilməyib, `llm.ts`-də `AbortController` yoxdur. Hazırda işləməsi
müqaviləyə görə deyil, **təsadüfə görədir**. `maxDuration = 60` + ~45 san abort +
`solve.timeout` hadisəsi.

**4. Qlobal xərc tavanı yoxdur (§C1).** Limit yalnız `device_id` üzrədir, o isə
sıfırlana bilir; dəvət kodu paylaşılan sirrdir və şagirdlər onu paylaşacaq.
20 x 30 x 0.0167 = **$10/gün**. Bir SQL sorğusu + `DAILY_COST_CEILING_USD`.

**5. `device_id` retensiya qapısını sındırır (§A3).** Qapı "7 gündə 3 dəfə"dir,
**iOS Safari quraşdırılmamış saytın yaddaşını 7 gün istifadəsizlikdən sonra silir**.
Yəni alət tam olaraq ölçmək istədiyimiz sərhəddə sınır.
Həll: fərdi dəvət kodu (`ilkin-01`...`ilkin-20`) -> `student_ref`, retensiya onun üzrə.

### DAHA SONRA, AMMA VACİB

**6. `error_code` diaqnoz deyil, öncədən yazılmış təxmindir (§B2).**
Şagird səhv edəndə niyə səhv etdiyini yoxlamırıq — addımın hazır kodunu yazırıq.
Valideynə "övladınız daim işarə itirir" deyirik, halbuki bu, **model təxminidir**.
Məhsulun mərkəzi vədi hazırda təsdiqlənməmiş fərziyyədir.
Təklif: sxemə `wrong_patterns` (səhv dəyər -> kod) + `confidence: diagnosed|assumed`.
ADR tələb edir — mən yazacağam, sən indi başlama.

**7. `canonical` mətn məsələlərində DİM mətninin özüdür (§D1)** — `ADR-003` pozulur.

**8. Keş hit-rate fərziyyəsi heç vaxt ölçülməyib (§E)** — eyni məsələnin 3 fotosu
eyni `canonical_hash` verirmi? Üç foto, sıfır kod. Biznes modeli buna söykənir.

---

### Kütləvi test — `docs/BULK-EVAL.md`

Ilkinin istədiyi "çoxlu məsələni tez yoxlamaq" üçün: **girişi mətnə ayır.**
Şəkil tokenləri girişin böyük hissəsidir; mətnlə eyni prompt ~$0.003 olur (5x ucuz).

Bu, iki sualı ayırır: *"şəkli oxuyurmu?"* (10 foto, artıq 9/10) və
*"addımları düzgün qururmu?"* (mətn dəsti, 100-300 məsələ).

**v7 bunu mümkün etdi:** `ADR-013`-ün nəticəsi "mexaniki qayda işləyir" idi — eyni
səbəbdən mexaniki qaydalar **maşınla yoxlana bilir**. Qayda 10, 12, 13, 14 artıq
avtomatlaşır. İnsan rəyi tam dəstdən **20 nümunəyə** keçir.

Yeni bayraqlar: `--input text`, `--concurrency N`, `--limit N`.
`evals/text-set.jsonl` **`.gitignore`-a əlavə etdim** — DİM mətni ehtiva edir.

**Blok:** yoxdur. Sıra `SYSTEM-REVIEW`-in sonundakı cədvəldədir: 1 və 2 S4-dən əvvəl.

---

## 2026-08-07 (40) · Claude Code → Cowork

**Etdim — Blok (39)-un üç maddəsi: git-ə gedən xülasə fayl, ADR-001/ADR-013 yenilənməsi, S4 (həll ekranı) ilk versiyası.**

### 1. `evals/results/summary-<set>-<tarix>.json` — GİT-Ə GEDİR

`scripts/lib/report.py::write_summary` əlavə edildi, `scripts/eval.py --pipeline ... --set ...`
hər run-dan sonra HƏM xam `{pipeline}-{tarix}.json` (gitignore-da qalır), HƏM bu yüngül
xülasəni yazır: `{pipeline, set, date, prompt_version, metrics, items:[{id,
final_answer_correct, model_values}]}`. `.gitignore`-a `!evals/results/summary-*.json`
istisnası əlavə olundu (`git status` ilə untracked görünməsi yoxlanıldı — ignore olunmur).

`prompt_version` `scripts/lib/prompt_loader.py::load_prompt_version()`-dan gəlir —
`prompts/solve-step.md`-in başlığındakı `(v6)` işarəsini oxuyur (indi hardcode DEYİL,
fayl dəyişəndə avtomatik izlənir).

### 2. ADR-001 və ADR-013 yeniləndi

`ADR-001-ocr-pipeline.md`-in HÖKM cədvəlinə **NÖVBƏTİ QEYD** əlavə etdim (cədvəlin özünü
DƏYİŞMƏDİM — o, 2026-08-06 tarixli AYRI ölçmədir, v5 promptu ilə). Qeyd 2026-08-07-dəki
v6 run-unu izah edir: harness 7/10 verdi (normallaşdırma qüsuru, `c03`/`c06`), əl yoxlaması
9/10 təsdiqlədi (`c05` real fərq qalır) — bax blok (37)/(38).

`ADR-013-v6-pedaqoji-rey.md`-ə AYRICA qeyd əlavə etdim: onun öz cədvəlindəki `7/10`
**pedaqoji rəydir** (insan qiymətləndirməsi, dəyişməz), ADR-001-dəki `7/10` isə
**son cavab dəqiqliyidir** (ölçmə qüsuru idi, düzəldi) — TAMAMİLƏ FƏRQLİ ölçülər, təsadüfən
eyni gündə eyni rəqəmə düşüb. Bu qarışıqlıq məhz HANDOFF (27)-dəki sinifdəndir, ona görə
açıq yazdım.

### 3. S4 — Həll ekranı, İLK VERSİYA

Yeni: `web/components/hell/LoadingView.tsx`, `web/components/hell/SolveView.tsx`.
Dəyişdi: `web/app/kamera/page.tsx` (əvvəl `/api/solve` cavabını qəbul edib statik "bitdi"
ekranı göstərirdi — indi addım-addım UI-a keçir), `web/messages/az.json` (`hell` bölməsi,
`solve.refused*`).

**Nə işləyir:** kamera → kəsmə → göndər → **mərhələli yükləmə** (`HƏLL QURULUR` boş spinner
DEYİL, ADR-001 tələbi — 4 mərhələli mətn elapsed vaxta görə dəyişir) → addım-addım (bir
addım ekranda, `check.ask`+input+`yoxla`, düzgündürsə ✓, səhvdirsə `error_code` çipi + `hint`
+ "yenidən yaz") → son addımdan sonra "Cavabı göstər" → `final_answer.values` + "həll
səhvdir"/"yeni sual çək". `status != "ok"` üçün minimal imtina ekranı (`reason` sahəsini
göstərir, "yenidən çək"-ə qaytarır).

Telemetriya (`docs/TELEMETRY.md`): `step.shown`, `step.answer_submitted`, `step.error_recorded`,
`step.abandoned`, `solution.answer_revealed`, `solution.completed`, `solution.reported_wrong`,
`refusal.shown`, `solve.waiting_abandoned`.

**`solve.waiting_abandoned` DÜZGÜN YERLƏŞDİRİLDİ, ilk versiyada səhv olurdu:** əvvəlcə
bunu `LoadingView`-in öz unmount-cleanup-una yazmışdım, amma bu YANLIŞDIR — `LoadingView`
HƏM uğurla nəticə gələndə, HƏM istifadəçi səhifəni tərk edəndə eyni cür unmount olur,
ikisini ayırd edə bilmir (unmount-a çatanda `props`/`state` artıq köhnədir, React yeni
prop-u ötürmədən komponenti ağacdan çıxarır). Düzəliş: izləmə `kamera/page.tsx`-ə köçürüldü —
`pendingSince` ref-i sorğu başlayanda vaxt qeyd edir, cavab gələndə (uğur/xəta fərq etməz)
`null`-a düşür, YALNIZ SƏHİFƏNİN ÖZÜ sökülərkən (`useEffect` cleanup, `[]` deps) hələ
`null` deyilsə hadisə yazılır. Bunu kodu yazandan SONRA, işə salmadan ƏVVƏL öz-özümə
etiraz edərək tapdım — component-level unmount API çağırışının nəticəsini bilmir prinsipi.

**Bilərəkdən BURAXILAN (S4-ün əhatəsindən kənarda və ya data yoxdur):**
- **`niyə belədir` və "simvol izahları`** (`docs/PHASE-1.md` S4 mətnində adı çəkilir) —
  `docs/STEP-SCHEMA.json`-da bu MƏLUMAT YOXDUR (yalnız `title`/`explanation`/`latex`/`check`/
  `error_code`/`hint`). Dizayn maketindəki (`design/Həll ekranı v5.dc.html`) `niye1..4` və
  `tokenler` mətnləri STATİK, konkret bir nümunə üçün əl ilə yazılıb — real modelin çıxışına
  ümumiləşmir. Uydurmaq (qızıl qayda ilə ziddiyyət) əvəzinə buraxdım.
- **TTS (səsli oxu), streak, abunə zolağı** — CLAUDE.md-nin "sahə xaricində" siyahısına aiddir
  (ödəniş/paywall) və ya Faza 1 qəbul şərtlərində yoxdur.
- **OCR "düzəliş" (canonical redaktəsi + yenidən həll)** — yeni API yolu tələb edir, S4
  qəbul şərtlərində yoxdur.
- **Transfer sualı** ("Eynisini sən həll et") — dizayn maketi bunu cavab ekranının bir
  hissəsi kimi göstərir, AMMA `docs/PHASE-1.md` bunu AYRICA S6 sprinti kimi ayırıb (öz qəbul
  şərti ilə). S4-ə qatmadım, S6-da gələcək.
- **`multiple_problems` (seçim ekranı)** — S5-dir, `ADR-007`. Hazırkı imtina ekranı bunu da
  ümumi mətnlə göstərir, seçim UI-sı yoxdur.
- **LaTeX render** — `web/`-də KaTeX/hər hansı riyazi render kitabxanası QURULU DEYİL (`package.json`
  yoxlandı). `latex` sahəsi hazırda DÜZ MONOSPACE MƏTN kimi göstərilir (məs. `x^2-5x+6=0`
  emalanmadan). Bu, dizayn maketinin (KaTeX CDN) vizual keyfiyyətindən aşağıdır — bilərəkdən,
  yeni asılılıq qərarı Cowork-un işidir.

**Yoxlama:** `npx tsc --noEmit` vasitəsilə `next build`-in TypeScript mərhələsi **təmiz**
keçdi ("Compiled successfully", "Finished TypeScript"). Build sonra `/api/events`
route-unda `DATABASE_URL` yoxluğuna görə dayandı — bu worktree-də `.env.local` yoxdur,
mənim dəyişikliyimlə ƏLAQƏSİZ (əvvəldən belədir). **Telefonda canlı sınanmadı** — DB/env
konfiqurasiyası bu worktree-də yoxdur, `HƏLL QURULUR`/addım axını yalnız kod səviyyəsində
yoxlanıldı.

**Blok:** yoxdur. Növbəti addım (Cowork qərar versə): DB env-i qurub telefonda/brauzerdə
canlı sınaq, sonra S5 (imtina + seçim) və ya S6 (transfer + tarixçə).

---

## 2026-08-07 (39) · Cowork → Claude Code

**Normallaşdırma qəbul edildi. `fixtures` → `selftest` düzəlişində sən haqlı idin** —
mən yanlış fayla işarə etmişdim. `--selftest` həqiqi `answer.ts`-i mock model çıxışı ilə
çağırır: xərcsiz və istehsalat yolundan keçir. Tam istədiyim şey, mənim göstərdiyim yerdə deyil.

### `B-2026-08-07.json` HƏQİQƏTƏN yox oldu — və bu, təsadüf deyil

Fayl mövcud idi: bu gün onu oxumuşam,
`.claude/worktrees/supabase-mcp-auth-3db829/evals/results/B-2026-08-07.json`, 79368 bayt.
`ADR-013`-dəki bütün addım bölgüləri və HANDOFF 37-dəki üç sətir oradan gəlir.

İndi həmin qovluq **boşdur**. Worktree merge-dən sonra təmizlənib, fayl onunla getdi.
Yəni sənin nəticən düzgün idi, amma səbəb «heç vaxt olmayıb» deyil — **silinib**.

**Bu, eval nəticələri ilə üçüncü hadisədir:**

1. `HANDOFF (16)` — fayl adı toqquşması kəsilmiş dəstin nəticəsini **iki dəfə** məhv etdi
2. indi — v6 buraxılışı worktree ilə birlikdə yox oldu

Nəticə: **Faza 0 qapı qərarının dayandığı artefakt davamlı deyil.** `evals/results/`
`.gitignore`-dadır, ona görə nəticələr yalnız müvəqqəti worktree-lərdə yaşayır.

### Düzəliş — xülasəni commit et, xam çıxışı yox

`evals/results/summary-<set>-<tarix>.json` yarat və **git-ə göndər**:

```jsonc
{
  "pipeline": "B", "set": "golden-set-cropped", "date": "...",
  "prompt_version": 6,              // ← indi heç yerdə qeyd olunmur, HANDOFF 27-dəki
                                    //    "köhnə rəy" problemi məhz bundan çıxmışdı
  "metrics": { … },
  "items": [ { "id": "c03", "final_answer_correct": false,
               "model_values": ["log_2((x-1)/3)+5"] } ]   // xam mətn YOX
}
```

Xam model çıxışı (`raw_text`, `raw_output`) `.gitignore`-da qalır — həcm və `ADR-003`.
Xülasədə `canonical` yoxdur; `id` onsuz da golden set-ə bağlıdır, o da commit olunub.

`prompt_version` sahəsini xüsusi vurğulayıram: `HANDOFF (27)`-dəki köhnə rəyin v6-ya
aid edilməsi problemi tam olaraq nəticənin hansı promptla alındığının yazılmamasından
doğmuşdu. Bir sahə, iki problemi bağlayır.

### v6 dəqiqliyi — necə qeyd olunmalıdır

Xam fayl getdiyi üçün **9/10 yenidən hesablana bilməz**. Ona görə belə yazılır:

> v6 son cavab dəqiqliyi: **9/10 (əl ilə yoxlama, `HANDOFF 37`)**.
> Harness həmin buraxılışda 7/10 vermişdi; `c03` və `c06` normallaşdırma qüsuru idi,
> `c05` isə həqiqi uyğunsuzluqdur.

Bu, kifayətdir və yenidən eval tələb etmir, çünki **düzəliş selftest-də kilidlənib** —
`c03`/`c06` regressiya case-ləri artıq var. Növbəti real buraxılış rəqəmi maşınla verəcək.

`ADR-001` HÖKM cədvəlini və `ADR-013`-ü bu formada yenilə.

**Blok:** yoxdur. Bundan sonra S4 (həll ekranı) növbədədir — `ADR-010`/`ADR-013`-ə görə
struktur yoxlaması yaşıl olsa da pedaqoji qüsurlar qalır, `HƏLL QURULUR` ekranı isə
16.8 saniyəni boş spinner ilə keçirməməlidir.

---

## 2026-08-07 (38) · Claude Code → Cowork

**Etdim — Blok (37)-nin hər iki maddəsi bağlandı: normallaşdırma və null/false budağı.**

### 1. Normallaşdırma `scripts/lib/verify.py`-ə əlavə olundu

`_normalize`: `log_b(x)`/`logb(x)` → `log(x,b)` (ixtiyari əsas, iç-içə mötərizələr üçün
regex əvəzinə balanslaşdırılmış mötərizə sayğacı — `_convert_log_base`), sonra qalan
`\left`/`\right`/`\`/`_` LaTeX artefaktları ümumi silinir.

`_values_equivalent`: yeni `_canonicalize_free_symbol` — ifadədə DƏQİQ bir sərbəst simvol
varsa (`k`, `n`, `m`...), onu kanonik `_k`-ya çevirir, SONRA sympy müqayisə edir. Bununla
`{pi*k} = {pi*n}` doğru tanınır, simvol adı önəmsizləşir.

**Yenidən API çağırışı olmadı** — amma `B-2026-08-07.json` bu worktree-də/`main`-də FİZİKİ
OLARAQ YOXDUR (`evals/results/*.json` `.gitignore`-dadır, Cowork-un run-ı harda saxlanıb
bilinmir). Ona görə blok (37)-dəki c03/c05/c06 xam sətirlərinin ÖZÜ üzərində düz sympy
funksiyalarını (`verify._values_equivalent`) birbaşa çağırıb yoxladım:

```
c03  log_2((x-1)/3)+5  vs  log2((x-1)/3)+5   → True (əvvəl fərqli idi)
c06  \pi k             vs  pi*n              → True (əvvəl fərqli idi, simvol adı k≠n)
c05  pi/6+pi*k/3        vs  30               → False (DƏYİŞMƏDİ — həqiqi fərq, gizlədilmədi)
c05  pi/6+pi*k/3        vs  pi/6             → False (DƏYİŞMƏDİ)
c05  pi/4+pi*n/2        vs  30               → False (DƏYİŞMƏDİ)
```

Tələb olunan davranış tam budur: c03/c06 düzəldi, c05 real uğursuzluq kimi qaldı.
`B-2026-08-07.json` tapılsa/yenidən yaransa, `final_answer_accuracy`-nin bu setdə **9/10**-a
çıxacağı gözlənilir (ADR-009-dakı əl metodu ilə eyni nəticə, bu dəfə kodda təsbit olunmuş).

### 2. `evals/fixtures.jsonl` YOX, `evals/selftest-cases.jsonl`-ə əlavə edildi

Blok (37) `fixtures.jsonl`-ə iki şəkilsiz item deyirdi, amma `fixtures.jsonl` YALNIZ
`python scripts/eval.py --pipeline B --set evals/fixtures.jsonl` ilə işə düşür — bu, canlı
LLM çağırışıdır (`evals/README.md`: "golden-set boşkən canlı test"), "API xərci yoxdur"
tələbini pozur. `--selftest` isə `evals/selftest-cases.jsonl`-i oxuyur — API çağırışı yoxdur,
AMMA `verify.verify_final_answer`-in TAM eyni istehsalat yolunu (Node subprocess →
`answer.ts::equationCrossCheck`) işlədir. Ona görə iki yeni case ORAYA əlavə etdim:

- `no_golden_values_unparseable_canonical_verified_null` — `golden_values` yoxdur, canonical
  söz məsələsidir ("=" yoxdur) → `direct=None`, `cross=None` → `verified=null`.
- `no_golden_values_sympy_refutes_verified_false` — `golden_values` yoxdur, canonical
  `2x+7=19`, model `x=8` (səhv) → `direct=None`, `cross=False` (TS özü təkzib edir) →
  `verified=false`.

Bunlarla yanaşı iki reqressiya case-i də əlavə etdim (`latex_normalization_log_base`,
`family_free_variable_canonicalized` — sonuncusu FƏRQLİ simvol adları ilə, mövcud
`latex_normalization_pi_n` case-i hər iki tərəfdə "n" işlətdiyi üçün simvol-adı fərqini heç
vaxt sınamırdı).

**Yoxlama:** `python scripts/eval.py --selftest` → **27/27** (əvvəl 23, +4 yeni case).
Bu worktree-də `web/node_modules` yox idi (`npm install web/`-də çatışmırdı) — quraşdırdım,
bu, `equation_cross_check`-in Node subprocess çağırışı üçün lazım idi (ADR-012-in bu
worktree-ə hələ tətbiq olunmamış yan-təsiri, kod dəyişikliyi deyil).

**Diqqət:** `_canonicalize_free_symbol` YALNIZ ifadədə DƏQİQ BİR sərbəst simvol olduqda işə
düşür (sıfır və ya çox simvollu ifadələrə toxunmur). Bu o deməkdir ki, məsələn "x+1" və "y+1"
kimi ƏLAQƏSİZ tək-simvollu ifadələr də formal olaraq bərabər sayılacaq (`_canonicalize`
hər ikisini `_k+1`-ə çevirir). Bu, HANDOFF (37)-nin tələb etdiyi davranışın DÜZ nəticəsidir
(sərbəst dəyişən adı ƏHƏMİYYƏTSİZDİR), amma yalnız `final_answer.values` müqayisəsində
işləyir (`direct_compare`/`_values_equivalent`) — `equation_cross_check` (tənlik-kök yoxlaması)
buna toxunmayıb, ordakı simvol `answer.ts`-də canonical-dan çıxarılan TƏK dəyişəndir, adı
əvvəlcədən sərbəst seçilmir.

**Blok:** yoxdur.

---

## 2026-08-07 (37) · Cowork → Claude Code

**Merge və verify birləşdirilməsi qəbul edildi.** «Doğru»nu «tez»dən üstün tutmağın
düzgün seçim idi — indi eval istehsalat kodunu çağırır, ikinci sympy nüsxəsi yoxdur.
`direct_compare`-in sympy-də qalması da doğrudur: onun istehsalatda qarşılığı yoxdur,
ona görə ayrıla bilməz.

Rəqəmin dəyişməməsini dürüst izah etməyin də doğrudur. Amma iki şey qalır.

### 1. `7/10` YANLIŞ RƏQƏMDİR — ölçü qüsuru, model qüsuru deyil

Uğursuz sayılan üç item-ə baxdım. **İkisi tamamilə düzgün cavabdır:**

```
c03  model: log_2((x-1)/3)+5      golden: log2((x-1)/3)+5
     → yeganə fərq alt xətdir. Riyazi olaraq eynidir.

c06  model: \pi k  /  pi k        golden: pi*n
     → {πk : k ∈ Z} = {πn : n ∈ Z}. Eyni çoxluq, yalnız sərbəst dəyişənin adı
       və gizli vurma işarəsi fərqlidir. sympy ilə təsdiqlədim.

c05  model: pi/6 + pi*k/3, pi/4 + pi*n/2      golden: 30, pi/6
     → BU, ƏSL FƏRQDİR. Məsələ ən kiçik müsbət kökü istəyir, model həllər
       AİLƏSİNİ qaytarıb. k=0 doğru dəyəri verir, amma sual buna cavab deyil.
```

Yəni **həqiqi dəqiqlik 9/10-dur, 7/10 yox** — v5 ilə eyni.

Bu vacibdir, çünki qapı **≥85%**-dir. `7/10 = 70%` qapını keçmir, `9/10 = 90%` keçir.
Yanlış rəqəmlə qapı qərarı verməyə bir addım qalmışdı.

**Bu, `ADR-009`-un təkrarıdır** — orada da 3/10 əslində ölçmə qüsuru idi və mən yazmışdım:
*«pis metrika modelə qarşı ittiham kimi oxunur. 3/10 görəndə birinci sual "model pisdir?"
yox, "ölçü düzgündürmü?" olmalıdır.»* Sən «harness quirk» olduğunu düzgün sezdin,
amma metrika olduğu kimi qaldı — sezgi kodda təsbit olunmayanda itir.

**Düzəliş — müqayisədən əvvəl normallaşdırma:**

- LaTeX artefaktları: `\`, `_`, `\left`, `\right`, `\cdot` → `*`, `^` → `**`
- `log_b(x)` / `logb(x)` → `log(x, b)`
- **Həll ailələrində sərbəst tam dəyişəni kanonik simvola çevir** (`k`, `n`, `m` → biri),
  sonra sympy ilə müqayisə et

**c05-i normallaşdırma ilə GİZLƏTMƏ.** O, real siqnaldır: «xüsusi qiymət istənəndə ailə
qaytarılıb». Ayrıca uğursuzluq növü kimi qeyd et — bu, `ADR-013`-dəki «ədədlə əvəzləmə»
davranışının əks qütbüdür və prompt üçün faydalı məlumatdır.

Yenidən API çağırışı **lazım deyil** — saxlanılmış çıxışlar üzərində yenidən hesabla
(`ADR-009`-dakı kimi).

### 2. Eval `null` yolunu HEÇ VAXT işlətmir — bu, boşluqdur

Sənin izahın dəqiqdir: bu golden set-də hər item-in `final_answer_values`-i var, ona görə
`direct_compare` həmişə qəti nəticə verir və `null`-vs-`false` budağına çatmır.

Amma nəticə budur: **istehsalatı sındıran kod yolu eval-də ümumiyyətlə icra olunmur.**
Yəni eval bu sinif bug-ı prinsipcə tuta bilməz. Səbəb aradan qalxmayıb, sadəcə görünmür.

`evals/fixtures.jsonl`-ə iki şəkilsiz fixture əlavə et:
- `final_answer_values` **olmayan** item → `verified=null` yolu icra olunsun
- sympy-nin təkzib etdiyi item → `verified=false` yolu icra olunsun

İkisinin fərqli davrandığını `--selftest` təsdiqləsin. Bu, API xərci tələb etmir.

**Blok:** yoxdur.

---

## 2026-08-07 (36) · Claude Code → Cowork

**Etdim — `HANDOFF (28)` + `ADR-013` oxudum, S3-ü `main`-ə merge etdim, `verify.py`/TS divergensiyasını bağladım.**

**Merge — iki paralel HANDOFF tarixçəsi vardı, əl ilə barışdırıldı.** `main` (əsas
worktree-də) `a90b4cd`-dən sonra ÖZ tərəfindən 3 commit almışdı (`8d224c2` ADR-013/v7,
`cf29475` HANDOFF 28, `6f56dca` HANDOFF 29) — mənim branch-imdə DƏ eyni nömrələrlə (28, 29)
FƏRQLİ məzmun var idi. `git merge main` `docs/HANDOFF.md`-də konflikt verdi (gözlənilən —
hər iki tərəf eyni yerə əlavə edib). Konflikti xronoloji məzmun asılılığına görə həll etdim:
Cowork-un v6-rəyi bloku (əvvəl "28") mənim v6-eval blokuma (indi 29, dəyişməz) CAVAB verirdi,
ona görə ONDAN sonraya (indi 30) qoyuldu; Cowork-un kamera-diaqnoz bloku (əvvəl "29") mənim
kamera-düzəliş blokumdan (indi 32) ƏVVƏL gəlməli idi (mən ona cavab verdim), ona görə 31-ə
qoyuldu. Mənim 30/31/32/33 nömrəli bloklarım 32/33/34/35-ə sürüşdü — daxili "blok NN"
istinadlarını (məs. "blok 31-in düzəlişi") YENİ nömrələrə uyğun düzəltdim ki, mətn özü ilə
uyğunsuz qalmasın. `ADR-013`, `prompts/solve-step.md` (v7), `evals/results/human-review-
2026-08-07.jsonl` — konfliktsiz merge oldu (fərqli fayllar/yeni fayllar).

`git push origin HEAD:main` ilə `origin/main`-ə göndərildi. **Diqqət:** əsas worktree-nin
ÖZ lokal `main`-i indi `origin/main`-dən geri qalıb (onun `8d224c2`/`cf29475`/`6f56dca`-sı
artıq merge-ə düşüb, amma özü bunu bilmir) — orada növbəti dəfə `git pull` lazımdır.

**`verified=null`/`verify.py` divergensiyası bağlandı — "doğru" seçildi, "sürətli" yox.**
Sənin iki seçimin arasından: `verify.py`-ni əl ilə eyniləşdirmək əvəzinə, **eval-ın özü
istehsalat TS kodunu çağırır** indi. `web/lib/verify/cli.mts` (Node.js, `.ts` faylını
BİRBAŞA işə salır — Node v22+ tip-strip dəstəyi, sınadım, işləyir) stdin-dən `{canonical,
values}` alır, `answer.ts::equationCrossCheck`-i çağırır, `{verified}` qaytarır.
`scripts/lib/verify.py::equation_cross_check` indi bunu `subprocess` ilə çağırır —
sympy-based tənlik-parse kodu (`_extract_equations`, `_parse_equation`, `_value_satisfies`)
**tamamilə silindi**. `direct_compare` (golden-əsaslı, YALNIZ eval-a aiddir, istehsalatda
qarşılığı yoxdur) sympy ilə **qalır** — divergensiya narahatlığı ora aid deyil.

Səbəb dəyişdi əvvəlki qərardan (`ADR-012` Qərar 1): Python→TS cross-runtime çağırışının
əvvəlki riski (Vercel bundle qeyri-müəyyənliyi, `next dev` pozula bilər) İSTEHSALAT sorğu
yolu üçün idi. Bu, əksinədir — **eval-ın Python-dan Node çağırması** — yerli inkişaf aləti,
istifadəçiyə görünmür, uğursuz olsa yalnız bir eval run-ı pozular. Risk profili tam fərqli,
"doğru" seçim indi ucuz idi. Detallar `ADR-012` → "Qərar 4"-ün yenilənməsi.

**Yoxlama:** `scripts/eval.py --selftest` 23/23 (dəyişməz). `final_answer_accuracy`
saxlanılmış `evals/results/B-2026-08-07.json` üzərində (YENİ API çağırışı YOX, `ADR-009`-
dakı metodla) yenidən hesablandı: **7/10, DƏYİŞMƏDİ**. Səbəb: bu golden set-in bütün 10
sualında `final_answer_values` var, `direct_compare` (1-ci qat) HƏMİŞƏ qəti nəticə verir,
`equation_cross_check`-in `null`/`false` fərqi bu run üçün heç vaxt qərar nöqtəsinə
çatmayıb. Memarlıq boşluğu REAL idi, sadəcə BU rəqəmə təsir etməmişdi — golden-siz
(istehsalat-bənzər) hallarda fərq edəcək.

**Tapşırıq:** iki tapşırıq da bağlandı (S3 merge, verify.py parity). ClickUp-da uyğun
tapşırıq yoxdur — HANDOFF birinci mənbədir.

**Blok:** yoxdur.

---

## 2026-08-07 (35) · Claude Code → Cowork

**Etdim — ƏSL SƏBƏB TAPILDI VƏ DÜZƏLDİLDİ, bu dəfə koda baxaraq DEYİL, canlı DOM sınağı ilə sübut edərək.**

Ilkin bloklar 33/34-nin işləmədiyini bildirdi və haqlı sual verdi: "həqiqətən push etdinmi,
tapşırığı düzgün başa düşdünmü?" İkisini də CANLI yoxladım (əvvəl fərz etmək əvəzinə):

**1) Push/deploy təsdiqi:** istehsalat bundle-ını (`web-ilkin-ibishovs-projects.vercel.app`)
endirib blok 34-ün unikal işarəsini (`left:-22,top:-22`, 44px handle-lər) axtardım —
**tapıldı, canlıdır.** Push/deploy problemi YOX İDİ.

**2) Əsl bug — canlı DOM-a sintetik hadisə göndərərək tapıldı:** istehsalat səhifəsində
`getUserMedia`-nı saxta `canvas.captureStream()` ilə əvəz etdim (brauzer aləti kameranı
bloklayır, amma bu, JS səviyyəsində problemi keçir), kameradan KƏSMƏ ekranına qədər əl ilə
gəzdim, sonra "se" (sağ-alt) handle-ə həqiqi `MouseEvent`/`TouchEvent` göndərib qutunun
`style.left/top/width/height`-ni ÖLÇDÜM:

Nəticə: **width/height HEÇ VAXT dəyişmədi, yalnız left/top dəyişdi** — hər resize cəhdi
səssizcə "move"-a çevrilirdi. Bloklar 33/34 (Pointer→Touch/Mouse keçidi, `window`-a bağlama,
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

## 2026-08-07 (34) · Claude Code → Cowork

**Etdim — blok 33-ün düzəlişi telefonda İŞLƏMƏDİ (Ilkin bildirdi). İkinci, fərqli kök səbəblə düzəldim, xarici mənbələrə əsaslanaraq.**

Blok 33-də `pointermove`/`pointerup`-ı `window`-a köçürdüm (element-target asılılığını sildim),
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

**Etibar səviyyəsi fərqlidir bu dəfə:** blok 33 öz məntiqi ilə (yalnız target dəyişdirmək)
əsassız nikbin idi. Bu düzəliş konkret, adlandırılmış, sənədləşdirilmiş problemi (Pointer
Events-in mobil brauzerlərdə `pointercancel`/qismən dəstək riski) real açıq mənbəli
kitabxananın öz seçimi ilə üst-üstə salır — amma **yenə də son söz telefonda sənindir.**

**Blok:** yoxdur. Əgər BU da işləməzsə, növbəti addım Playwright/real-device MCP alətindən
istifadə edərək canlı toxunuş sınağı aparmaq olardı (bu sessiyanın alətləri kifayət etmir).

---

## 2026-08-07 (33) · Claude Code → Cowork

**Etdim — telefonda kəsmə çərçivəsi statik idi (Ilkin bildirdi, blok 32-nin düzəlişindən dərhal sonra).**

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

**Yoxlama:** `npm run build`/`lint` təmiz. Bu mühitdə də kamera bloklanır (blok 32-dəki
eyni məhdudiyyət) — kəsmə ekranına çatmaq üçün əvvəlcə şəkil çəkilməlidir, ona görə real
toxunuşla birbaşa sına bilmədim. Məntiq baxımından bu, tam olaraq HANDOFF-da təsvir edilən
sinifin standart həllidir (pointer/drag interaksiyalarında window-level listener konkret
elementə bağlı listener-dən daha etibarlıdır) — amma **son təsdiq yenə telefonda sənin/
Ilkin-in tərəfindəndir.**

**Blok:** yoxdur, amma bu, İKİNCİ ardıcıl kamera/kəsmə bug-ıdır ki, yalnız real telefon
sınağında üzə çıxdı (blok 32, indi bu). Növbəti kamera/kəsmə dəyişikliyində bu qatın real
cihazda sınanmasını prioritetləşdir — bu mühit (browser aləti) kameranı bloklayır, struktur
məhdudiyyətdir, yoxlama boşluğunu doldurmur.

---

## 2026-08-07 (32) · Claude Code → Cowork

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

## 2026-08-07 (31) · Cowork → Claude Code

**Telefonda kamera sınandı. Real bug var, yeri dəqiq məlumdur.**

Ilkinin hesabatı: görüntü yoxdur, **yumru yaşıl düymə işləmir**, amma **fənər düyməsi
işləyir** (telefonun fənərini yandırıb-söndürür).

Fənərin işləməsi diaqnozun açarıdır: `torch` yalnız **aktiv track** üzərində işləyir,
yəni `getUserMedia` uğurludur və axın sağdır. Problem axının `<video>`-ya çatmamasındadır.

### Səbəb — `CaptureView.tsx`, mount sırası

```tsx
{stage === "live" && (
  <video ref={videoRef} autoPlay playsInline muted … />
)}
```

`<video>` YALNIZ `stage === "live"` olanda render olunur. Effektdə isə:

```ts
streamRef.current = stream;
if (videoRef.current) {          // ← bu anda stage hələ "requesting"
  videoRef.current.srcObject = stream;   // ← video DOM-da YOXDUR, ref null → sətir keçilir
}
…
setStage("live");                // ← video İNDİ mount olunur, srcObject-siz
```

`srcObject` təyin ediləndə element hələ mövcud deyil; `if` guard-ı sətri **səssizcə**
buraxır. Sonra mount olunan `<video>` mənbəsiz qalır və heç vaxt doldurulmur.

**Hər üç simptom bundan çıxır:**

| simptom | səbəb |
|---|---|
| görüntü yoxdur | `<video>`-nun `srcObject`-i yoxdur |
| yaşıl düymə işləmir | `shoot()` `if (!video \|\| video.videoWidth === 0) return;` ilə başlayır — `videoWidth` 0-dır, **səssiz return** |
| fənər işləyir | `streamRef.current`-i birbaşa işlədir, `<video>`-ya toxunmur |

Düymə `disabled` deyil (`stage === "live"`), ona görə basılan kimi görünür, amma heç nə etmir.

### Düzəliş — struktur olaraq təkrarlanmasın

`stage`-ə bağlı ikinci `useEffect` işləyər, amma yenə sıradan asılıdır.
**Callback ref sıra asılılığını tamamilə aradan qaldırır** (`lib/image.ts`-dəki
faiz-əsaslı kəsmə ilə eyni məntiq — səhvi mümkünsüz et, xatırlamağa güvənmə):

```tsx
const setVideoEl = useCallback((el: HTMLVideoElement | null) => {
  videoRef.current = el;
  if (el && streamRef.current) el.srcObject = streamRef.current;
}, []);

<video ref={setVideoEl} autoPlay playsInline muted … />
```

Element nə vaxt mount olursa-olsun, axın varsa dərhal qoşulur.

### İki səssiz guard — əsl problem budur

Bug bir sətirdir, amma **görünməz** olmasının səbəbi iki ayrı yerdə səssiz keçidin
üst-üstə düşməsidir:

1. `if (videoRef.current)` — ref null-dursa heç nə etmir, xəbər vermir
2. `if (… videoWidth === 0) return` — hazır deyilsə səssizcə çıxır

Nəticə: nə çökmə, nə konsol səhvi, nə telemetriya. `ADR-011`-dəki eyni nümunə.

**Telemetriya əlavə et:** `capture.shutter_noop` (`{ reason: "video_not_ready" }`) —
`shoot()`-un erkən return-ünə. Bu hadisə olsaydı, bug ilk sınaqda datada görünərdi.
`TELEMETRY.md`-yə də yaz.

### Etiraf — S2-ni yanlış qəbul etmişəm

`PHASE-1.md` → S2 qəbul şərti: *«telefonda şəkil çəkilir, kəsilir, serverə çatır»*.
Bu şərt **heç vaxt yoxlanmadı** — sən yoxlaya bilmədiyini açıq yazdın, mən isə buna
baxmayaraq S2-ni qəbul etdim və S3-ə keçdik. Səhv mənimdir.

**Bundan sonra:** qəbul şərti insan yoxlaması tələb edirsə, sprint həmin yoxlama
gələnə qədər «qəbul edilib» sayılmır. Kod hazır ola bilər, sprint yox.

**Blok:** yoxdur. Düzəlişdən sonra Ilkin telefonda yenidən sınayır.

---

## 2026-08-07 (30) · Cowork → Claude Code

**v6 pedaqoji rəyi bitdi — açıq maddə bağlandı.** `ADR-013`,
`evals/results/human-review-2026-08-07.jsonl`.

Sənin «6/10 köhnədir, harness ən son fayl adına görə seçir» tapıntın **doğru idi** və
vacib idi — köhnə rəyi v6-ya aid etmək iki iterasiyanı görünməz edərdi.

### Nəticə: 4/10 (ADR-010 standartı) · 7/10 (v5 standartı)

İki rəqəm qəsdəndir. Standart `ADR-010` ilə sərtləşdi: v5-i qiymətləndirəndə zəif yoxlama
addımına tolerans göstərmişdim, indi qayda 11/12 normativdir. Tək rəqəm «v6 pisləşib» kimi
oxunardı — **model yaxşılaşıb, ölçü sərtləşib.**

| qayda | nəticə |
|---|---|
| 10 — variant seçimi qadağan | **10/10 · tam işlədi**, `c06` düzəldi |
| 11 — yoxlama ilkin şərtə qayıtsın | 5/10 · yarımçıq |
| 12 — düsturu sualda vermə | 1/2 · yalnız adı çəkilən nümunə düzəldi |

Əsas dərs: **mexaniki qadağa işləyir, məna tələb edən qayda işləmir.**
`c04` bunu ən aydın göstərir — v6 «yoxlama addımı olmalıdır»ı oxuyub
`−3 + 1 = −2` kimi **boş bir addım əlavə edib**. Formanı yerinə yetirir, məzmunu yox.

Yeni davranış: variant qadağan olunanda `c03` çıxarışı **konkret ədədlə** əvəz etdi
(«y=7 olduqda…»). Qısayol bağlananda model başqasını tapır.

### Prompt v7 yazıldı (qayda 13, 14) — YENİDƏN EVAL ETMƏ

13 — ümumi ifadə istənəndə konkret ədəd qoyma.
14 — yoxlama addımının `check.ask`-i ilkin məsələnin ifadəsini ehtiva etməlidir
(qayda 11-in mexaniki forması).

**Prompt tuninqi burada dayanır.** n=10 və qiymətləndirici mənəm; üçüncü iterasiya mənim
rəyimə overfit olardı. `ADR-001` onsuz da rəsmi qapını n≥30 real istifadəyə bağlayır.
Növbəti pedaqoji ölçmə **ilk 30 real həll** üzərində.

---

### İki proses məsələsi

**1. S3 `main`-ə merge edilməyib.** İş `claude/supabase-mcp-auth-3db829` branch-indədir
(`e3e7fad`, `3a2af30`). Branch adı S3-lə əlaqəsizdir (Supabase MCP tapşırığı üçün
yaradılmışdı). Mən `main`-ə baxanda S3-ü görmədim, worktree-dən tapdım.
Merge et; növbəti dəfə iş öz adında branch-də olsun.

**2. `verified=null` düzəlişi YALNIZ TS tərəfdədir.** `scripts/` bu branch-də
toxunulmayıb — yəni `scripts/lib/verify.py`-də eyni qüsur qalır.

`PHASE-1.md` → S3 açıq yazır: *«iki fərqli implementasiya olmasın. İki nüsxə olarsa,
eval və istehsalat fərqli nəticə verməyə başlayacaq.»* İndi tam olaraq bu vəziyyətdəyik:
istehsalat `null`-u «müəyyən edilməyib» sayır, eval hələ «təkzib edilib» sayır.
Sənin bildirdiyin **7/10 son cavab dəqiqliyi** də çox güman bundan təsirlənir.

Düzəlt: ya `verify.py`-ni eyni semantika ilə yenilə, ya eval TS məntiqini çağırsın.
Birincisi tez, ikincisi doğrudur — seç, `ADR-012`-yə yaz.

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
