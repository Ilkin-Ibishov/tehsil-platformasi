# LOG

- 2026-08-24: HANDOFF 196 — Streaming Steps və Mobile Math Input tətbiq edildi:
  `MathKeyboardBar.tsx` yaradıldı, `visualViewport` listener və `answer.ts` Unicode normallaşdırması (29/29) bağlandı.
  `SolveView.tsx` axın zamanı DB race condition-un qarşısını alan `streamPersistencePromise` ilə təchiz olundu.
- 2026-08-24: HANDOFF 195 — E1.9 sızma bençmarkı tam uğurla ölçüldü (`core.md` v17).
  Riyaziyyat (e24 n=24) leak 0/24=0.0%, Fizika (n=27) leak 0/27=0.0%, hər iki modeldə 0%.
  Sxem validliyi 100%, fizika topic_code 27/27=100%, false refusal 0%.
- 2026-08-23: HANDOFF 194 — E1.9 sızma qaydası `core.md` v17-yə gücləndirildi (məntiq/hökm sızması qadağası).
  `scripts/lib/leak.py` və `web/lib/verify/leak.ts`-ə cəbri dəyişən parametri (T-3 / x+3) istisnası əlavə edildi.
  ADR-024 məxfilik mətni yeniləndi: `web/messages/az.json` və `Kamera.dc.html` təhlükəsiz qapalı emal bəyanatına keçdi.
- 2026-08-19: HANDOFF 193 — `.cursor/` modulyarizasiya: push-verify, eval harness, lockfile CI
  skill/qaydaları; `deploy-guard` subagent; `99-agent-context` file map yeniləndi.
- 2026-08-19: HANDOFF 192 — push verify zamanı CI-də `eval.py --selftest` faili bağlandı:
  `vision_image_exists` CI-də media yoxdursa `SKIP` edir, digər image invariant testləri qalır.
  Vercel deploy `951c1a4` üçün Ready idi; qalan blocker selftest idi.
- 2026-08-19: HANDOFF 191 — deploy fail kök səbəbi bağlandı: `web/package-lock.json`-da
  korlanmış `rolldown` stub-ları silindi (`npm install` yenidən keçir). Push-sonrası
  verify protokolu AGENTS + close-session skill-ə əlavə olundu (CI+Vercel məcburi yoxlama).
- 2026-08-19: HANDOFF 190 — E1.9 text-path harness yenilənməsi (`--from-canonical` + 503 fallback + `model_used`/model-bölünmüş leak). e24 n=24 leak 3/24, physics-30 n=30 leak 3/30 (0% alınmadı). `86eyp5gt2` və qərar `86eyp6mhp` bu sessiyada qeyd olundu.
- 2026-08-19: HANDOFF 187 — E1.9/E1.10 qismən eval nəticələri. Sızma qaydası core.md-ə,
  layout.py etiket düzəlişi, question_kind sahəsi. e24 leak 7/46=15.2% (keçmədi),
  vB false_refusal 56/76=73.7% (80/160, natamam — API 503). `86eyp3au4` complete (leak≠0).
- 2026-08-19: HANDOFF 186 — E1.8 fizika taksonomiya: `0073` 15 kod, golden relabel.
  topic_code 27/30=90%, leak 0/30, choice 30/30. `86eynm9r9` complete.
  3 qalan alias: MOMENTUM_CONSERVATION / SELF_INDUCTION / MAGNETIC_ENERGY.
- 2026-08-19: HANDOFF 185 — E2.4 ir_vB recrop n=48: api 2.1%, visual fill 0/46,
  graph-helps n=4 <<30, choice 88.9% (homoqlif deyil). `core.md` kiçildilmədi.
  `86eyncqbz` qapı keçmədi. İfadə edilməz: IQ fiqur, kompozit geo, üçbucaq sayma.
- 2026-08-19: HANDOFF 184 — E1.7 fizika leak 0/30=0% (əvvəl 5/29=17%). Choice 30/30=100%.
  `physics.md` sızma qaydası + 10 mövzu nümunəsi; `leak.py`/`leak.ts` `20 m/s`≡`20`.
  `86eynm9qy` complete. Xülasə `summary-golden-set-physics-30-2026-08-19.json`.
- 2026-08-18: HANDOFF 183 — ClickUp ölçmə qeydləri yoxlandı (təkrar yox).
  `86eyncjh3` E1.4 n=30; `86eynh47m` E2.6 kind; `86eyncqbz` E2.4 proxy.
  Rəqəmlər 182/181-dədir. Eval yenidən işlədilmədi.
- 2026-08-18: HANDOFF 182 — E1.4 fizika-30: kəsik + insan golden + vision n=30.
  Choice 100%, verified false 0; topic_code 37%, leak 17%, fa 70%. `86eyncjh3` complete.
- 2026-08-17: HANDOFF 181 — E1.4 blok: fizika buraxılış PDF və kəsik yoxdur.
  Golden cavab uydurulmadı. `86eyncjh3` complete deyil.
- 2026-08-17: HANDOFF 181 — E2.4 yenidən ölçü (e24 `--text`): api 21/52=40%, graph-helps 22 (ok 9),
  fill 3/9=33% (<60%), səhv sxem 0. dim-100test canonical/PDF yox. Kind silinmədi.
- 2026-08-17: HANDOFF 182 — E2.6 visual kind: triangle, circle, force_diagram, cartesian
  (sxem v2, bump yox). Renderer + selftest. GEO.* və MECH.DYNAMICS/KINEMATICS nümunə.
  Naməlum kind hələ atılır. eval 48/48. core.md visual kiçildilmədi (v15 əlavə).
- 2026-08-17: HANDOFF 181 — eval retry: 503/429/timeout 5 cəhd, `failed` n_attempted-dən çıxır.
  Vision golden-set: api_failure_rate 1/10=10%, n_attempted=9/10 (qapı keçdi). 48/48 selftest.
  `failed` səhv cavab sayılmır. core.md visual kiçildilmədi.

- 2026-08-17: HANDOFF 180 — E1.3 physics.md + 0072 (10 topic) + transcribe v3 şaxə.
  Selftest: physics fallback yox; visual mövzu faylına qoyulmayıb (E2.4 fill 50%).
  `86eyncjdu` complete. eval 41/41.
- 2026-08-17: HANDOFF 179 — E2.4 qapı: 22 ok / 52; fill 3/6=50% (keçmədi), səhv sxem 0%.
  Kind silinmədi. `86eyncqbz` komment. dim-100test şəkilləri diskdə yox.
- 2026-08-17: HANDOFF 178 — vision eval işləyir: 10/10 şəkil, n_attempted=10, skip yox.
  Kök: gitignore + səssiz fallback. 8/10 Gemini 503/timeout. `--text` + 120s timeout.
- 2026-08-17: HANDOFF 177 — E2.4 prompt: `visual` nə vaxt; linear/quadratic nümunə; sequences omit; eval 36/36.
- 2026-08-17: HANDOFF 176 — E2.3 Should-fix: WebView `r`, reuse visual backfill UPDATE, eval=prod strip, revealed graph; 36/36.
- 2026-08-17: HANDOFF 175 — E2.3 SVG renderer + payload persist + strip unknown kind; eval 35/35.
- 2026-08-17: HANDOFF 174 — E2.2: `visual` təsviri rədd davranışı ilə uyğunlaşdı (strip E2.3).
- 2026-08-17: HANDOFF 173 — E2.2 STEP-SCHEMA v2 + `visual` JSON (renderer yox); eval 35/35; transcribe 1.
- 2026-08-17: HANDOFF 172 — `81e9767` push; E2.1 ADR-031 (SVG, KaTeX/npm yox). E1.3–E1.6 açıq.
- 2026-08-17: Faza3 dilim0 — eval baseline 08-14 commit + summary-golden-set-2026-08-17 (52 prod verify replay; vision evals/images yox).
- 2026-08-17: Faza3 E1.2 `86eyncj7k` — verify genişləndi (42.3% true, 0 false); mathjs method; 0070; 24 selftest.
- 2026-08-17: Faza3 E1.1 `86eyncj10` — prompt.subject_fallback + prompt_strict_subject (0071); cascade/route UI.
- 2026-08-17: HANDOFF 170 — UI LaTeX → test-toplusu simvolları (`∠` `°` `⊥` `√(…)`); təsdiq/izah `formatMathProse`.
- 2026-08-17: HANDOFF 169 — ClickUp: S8+valideyn, oxunmadı UI, ARITHMETIC bağlandı; safe-pack `86eyna6ru`.
- 2026-08-17: HANDOFF 168 — Vercel: `llm.ts` UTF-8; CI eslint purity/InviteGate/SolveView.
- 2026-08-17: HANDOFF 167 — Qat 5 cache: `contents[]` create + native generate/stream for real `cached_tokens`; skip logs; no fake hits.
- 2026-08-17: HANDOFF 166 — NDJSON flush pad (~2KB) + headers so phone sees step 1 before final.
- 2026-08-17: HANDOFF 165 — `formatMath` `\vec` → `→` (unformatted_latex).
- 2026-08-17: HANDOFF 164 — crop encode bir addım + preview=raw; `encode_ms` crop-only (~4s→~1s gözlənti).
- 2026-08-17: HANDOFF 163 — stream Qat 5 usage/cost (`include_usage` + SSE flush); finish meta layer_cost.
- 2026-08-17: HANDOFF 162 — Qat 5 NDJSON streaming (finish → LoadingView first step); ADR-017.
- 2026-08-17: HANDOFF 161 — Qat 5 keş Map + finish `cached_tokens` telemetriya.
- 2026-08-17: HANDOFF 160 — CropView raw prefetch; confirm no longer awaits full-frame encode.
- 2026-08-17: HANDOFF 159 — ADR-030 mövzu faylları (6 soak/telefon topic).
- 2026-08-17: HANDOFF 158 — safe-pack addım 3: Storage `after()` + crop-first encode.
- 2026-08-17: HANDOFF 157 — Qat 5 Gemini `cachedContents` + cost ×0.1 on cached tokens.
- 2026-08-17: HANDOFF 156 — Qat 1 `reasoning_effort: "none"` (transcribe only); Qat 5 unchanged.
- 2026-08-17: HANDOFF 155 — timing props (encode/transcribe/finish wait + storage/db) + fail cost.
- 2026-08-17: HANDOFF 154 — safe-pack doc: telefon ölçü dərsləri (LLM≠HTTP, encode, tez təsdiq).
- 2026-08-17: HANDOFF 153 — `COST-LATENCY-SAFE-SEQUENCE.md` (3→2→1→4→5 safe pack).
- 2026-08-17: HANDOFF 151–152 — 5/5 gate PASS; batch 15/18 ok (3 unreadable verify).
- 2026-08-16: HANDOFF 150 — soak Gemini canary q001 delivered=true.
- 2026-08-16: HANDOFF 149 — ix-riyaziyyat 51/51 corpus upload.
- 2026-08-16: HANDOFF 148 — deploy TS5097 fix; upload service_role boş.
- 2026-08-16: HANDOFF 147 — yapışıq sual etiketi + ix-riyaziyyat 51 lokal kəsik.
- 2026-08-16: HANDOFF 146 — ADR-030 mövzu promptu + soak Gemini. Fingerprint reuse. `86eyn6zth`.
- 2026-08-16: HANDOFF 145 — OQ-8 fail: Plus adi söhbətdə `.txt` chip var, model oxumur. Soak yenidən Temporary.
- 2026-08-16: HANDOFF 140 — ChatGPT mesajları yalnız Temporary chat; opt-out yox, submit-dən əvvəl URL qapısı.
- 2026-08-16: HANDOFF 139 — soak şəkil: ChatGPT Free upload kvotası (Plus/18 saat), Xvfb deyil. Debug screenshot + fail-fast.
- 2026-08-16: HANDOFF 138 — soak şəkil Railway-də çatmır (`unreadable` / indi `soak_unavailable`). Lokal headed 5+5 oxunur.
- 2026-08-16: HANDOFF 136 — soak izolyasiya: Temporary chat; `goto` yox. Railway live `NONE`.
- 2026-08-16: HANDOFF 135 — Qat 1 typed+şəkil, Qat 5 `.txt`; ChatGPT hər sorğuda yeni söhbət. Railway deploy.
- 2026-08-16: HANDOFF 134 — Railway chatgpt-api eyni URL-də `authMode=cookie`; soak health idle+cookie qəbul edir.
- 2026-08-16: HANDOFF 133 — Vercel-dən `GEMINI_PRICE_*` silindi (`ADR-027`). Kod dəyişmədi.
- 2026-08-16: HANDOFF 132 — S2 soak qalereya (`86eyn2u6x`): kamera icazəsi yox, tam-kadr kəsmə yalnız soak. Şagird çərçivəsi eyni.
- 2026-08-16: HANDOFF 131 — S1 PDF kəsik skripti + `corpus` bucket (`86eyn2pw5`). Vision yox, DİM mətni yox.
- 2026-08-16: HANDOFF 130 — S0 soak ChatGPT adapter + `soak_enabled=0` (`86eyn2c70`). Şagird Gemini toxunulmur.
- 2026-08-16: HANDOFF 129 — Qat 1 `gemini-3.7-flash` (`0065`), prompt v12 dövri son addım, `transcribe.md` v2. `86eyn2bgc`.
- 2026-08-16: HANDOFF 128 — S-pre1 ilişmə keçidi (`86eyn28kn`), S-pre2 prompt v11 1–6 + 1 addımlıq nümunə (`86eyn28kq`).
- 2026-08-16: HANDOFF 127 — Faza 2 S-pre1 ilişmə çıxışı (`86eyn28kn`), S-pre2 mənasız addım kök səbəbi (`86eyn28kq`).
- 2026-08-16: HANDOFF 126 — Faza 2 blokları bağlandı (`ADR-029`): n=10 Gemini qızıl, ToS sahibin, 5/5 transkripsiya qapısı.
- 2026-08-15: HANDOFF 125 — Faza 2 planı (Korpus soak) `docs/PHASE-2.md`.
- 2026-08-15: HANDOFF 124 — `cost_usd` düşünmə tokeni daxil (`ADR-028`); Gemini USD göndərmir. ClickUp `86eymrm8j`.
- 2026-08-15: HANDOFF 123 — LLM tarifi yalnız registridə (`ADR-027`), Vercel PRICE env silindi. ClickUp `86eymrm8j`.
- 2026-08-15: HANDOFF 122 — Qat 1 `active_transcribe_model` ucuz modelə (registri + `0064`). ClickUp `86eykqb1c`.
- 2026-08-15: HANDOFF 121 — həll ekranında LENT irəli/geri (`SolveView.tsx`). ClickUp `86eyn1t7b`.
- 2026-08-15: HANDOFF 120 — «Cavabı göstər» yalnız son addım (`SolveView.tsx`). ClickUp `86eymrkjn`.
- 2026-08-15: HANDOFF 119 — dəvət kodu qapıda yoxlanır (`/api/invite/check`, `InviteGate`, bank `inviteError`). ClickUp `86eymrm6g`.
- 2026-08-15: HANDOFF 116 — həll ekranında yığılmış sual mətni + `problem.expanded`. `SolveView.tsx`, `TELEMETRY.md`, `Həll ekranı v5.dc.html`.
- 2026-08-15: Cursor masa — `AGENTS.md` + `.cursor/` (qayda/skill/agent/hook). HANDOFF indeksdən çıxarıldı ki, köhnə bloklar "cari vəziyyət" olmasın.

- 2026-08-11: S4/S5 dəvət axını — `invite_redemptions` cədvəli (0032), `/api/solve` kodu ilk açılışı qeyd edir, `invite_redeemed` hadisəsi əlavə edildi (`docs/TELEMETRY.md`).
- `invites` kataloq cədvəli, `/invite/[code]` səhifəsi yazılmadı — mövcud `InviteGate`/`INVITE_CODES` env axını artıq bunu edir (ADR-012), yenidən qurmaq overengineering olardı.
- Sərt 1-cihaz-1-kod kilidi qəsdən qoyulmadı — brauzer datası silinən şagirdi həmişəlik kilidləməmək üçün (`ON CONFLICT DO NOTHING`).

## 2026-08-13 - Cowork
- Miqrasiya 0043/0044: public.ocr_captures (OCR training korpusu), v_ocr_corpus, v_distractor_health.
- Miqrasiya 0049/0050/0051: topic_codes + error_codes taksonomiya cedvelleri, oz-ozunu sagaldan qeydiyyat trigger-leri, fingerprint prefiks invarianti (yalniz source=generated). 0049-un sert FK-lari user_capture axinini sindirirdi - 0050 duzeltdi.
- docs/INVARIANTS.md yaradildi; CLAUDE.md-e miqrasiya dersi 5-6 elave edildi.

## 2026-08-15 - Cowork (sened auditi)
- S1-S8 (0057-0062) sonrasi knowledgebase sinxronlashdirildi: ARCHITECTURE.md ve README.md yeniden yazildi (Texo silinmisdi, kaskad qatlari yox idi, "Faza 0, kod yazilmir" yazirdi).
- Duzeldilen 4 real zidiyyat: sekil artiq SAXLANILIR (ADR-024) - 3 fayl "saxlanilmir" yazirdi; canonical yeniden yazilir (0062); verification 3 halldir (S5); telemetriyada ocr.correction_* heç vaxt yazilmayib, real adlar transcript.* + bank.*.
- Yeni: INV-11 (status yalan danismir), CLAUDE.md ders 7, DATA-MODEL-e captures bucket + taksonomiya bolmeleri. Aciq qalan: 90 gunluk silme cron-u YOXDUR (INV-09), dizayndaki "Sekil telefonda qalir" metni yalandir.
- Rebase: lokal main 14 commit geri idi (origin f36dcd6). Blok 103-113-un getirdikleri ile yeniden uzlasdirildi: n=99 eval (107), 0063 step_events, ADR-025/026.
- 2026-08-15: Qerar (Ilkin) - hell ekraninda sualin metni gorunmelidir. Task HANDOFF blok 115-de (ClickUp rate-limit). Esas sebeb ADR-025: sehv transkripsiya yalniz confirm ekraninda tutula bilir; problem.expanded telemetriyasi Qat 1 keyfiyyetinin proxy siqnalidir.

## 2026-08-17 - Cowork (ClickUp faza yenilenmesi)
- Faza 2 listi yaradildi: S3 (soak axini avtomatlasdirmasi, urgent) + S4 (100+ soak analizi). S0-S2 artiq bagli.
- Bagi: 86eykm8ja telefon kecidi (Ilkin el ile yoxladi), 86eymfg9z OpenCV (klient downscale ile evez olundu), 86eyhk10u 30 DIM sehifesi (n=99 dataset).
- 86eymfgge (862 distraktor) Faza 4 - Sagird dalgasina kocuruldu; sagird deveti bu fazada deyil.
- Faza 3 acildi (fenn + vizual + derslik): F1-F4 fenn genislenmesi, V1-V3 vizual izah (ADR-031 gozlenir), D1-D2 derslikler.

- 2026-08-17: Faza 3 BA strukturu - E1 (fenn, 6 alt-task), E2 (vizual, 5 alt-task), E3 (derslik, 5 alt-task). Kohne duz siyahi silindi.
- 2026-08-17: Kod auditi - prompt.ts subject fallback SESSIZ (physics.md yoxdur -> math numunesi); verify/answer.ts mathjs-dir, method='sympy' etiketi yalandir; verified===false hell GIZLEDIR (fizikada yanlis musbet riski). ADR-031 gozlenir.
- 2026-08-17: E2.1 qerari - oz SVG generatoru (saf funksiya, klientde render). JSXGraph/Mafs alinmir (interaktivlik sahedan kenardir), serverde SVG gonderilmir (NDJSON yuku). Eyni modul serverde snapshot testi + E2.4 toplu baxis ucun. ADR-031 yazilacaq.
- 2026-08-17: Cowork auditi (dilim 1) - E1.2 qapisi KECDI: verify replay 52 prod setirinde verified 1 -> 22 (42.3%, hedef >=40%), verified=false regressiya 0. Schema v2-de hem visual, hem mathjs_equation/mathjs_unit enum var - bump duzgun birlesdirilib.
- 2026-08-17: BOSLUQ - visual production-da acidqir, amma E2.4 qapisi (n=30 sehv sxem <=10%) OLCULMEYIB ve app_config-de visual_enabled bayragi YOXDUR. ClickUp 86eynftm0 (E2.0) acildi, dilim 2-nin birinci addimidir.
- 2026-08-17: summary-golden-set-2026-08-17.json 'evals/images yoxdur' yazir, amma qovluqda 11 fayl var - vision eval sehv diaqnozla atlanib, dilim 2-de arasdirilir.
- 2026-08-17: Cowork auditi (dilim 2) - ffd858b push edildi. 0072 production-da (10 fizika topic_code, bank_matchable=false).
- 2026-08-17: E2.4 olçmesi ETIBARSIZ - n=6 anekdotdur, qapi n=30 teleb edir. Vision eval-da 8/10 item Gemini 503 ile dusdu, yeni riyaziyyat reqressiya yoxlamasi faktiki n=2.
- 2026-08-17: KOK SEBEB tapildi - doldurulma az deyil ki prompt zeifdir, SXEMDE kind yoxdur. Movcud: none/number_line/linear/quadratic (yalniz cebr). triangle/circle/force_diagram/cartesian YOXDUR - ADR-031 hedefleri. Fizika 10 movzu faylinin heç birinde visual numunesi yoxdur. ClickUp 86eynh47m (E2.6) acildi. core.md kiçildilmir.
- 2026-08-18: Cowork tehlili (blok 182, fizika n=30) - qapi 'qarisiq' deyil: bir gercek defekt + bir olcme artefakti + bir yaxsi xeber.
- 2026-08-18: topic_code 37% MODEL UGURSUZLUGU DEYIL - xam fayl gosterir ki model 25 ferqli kod yazib, bizde 10 var, ve uygunsuzluqlarin coxunda model daha dogrudur (MAG.LORENTZ_FORCE vs golden ELEC.FIELD, MECH.HYDROSTATICS vs MECH.DYNAMICS, THERMO.IDEAL_GAS vs THERMO.GAS_LAWS). Golden etiketler 10 koda sixisdirilib - golden YENIDEN etiketlenmelidir. ClickUp 86eynm9r9 (E1.8).
- 2026-08-18: leak 5/29 = 17% ESAS BLOKERDIR (riyaziyyatda qapi 0%). Ortulmus/ortulmemis movzu bolgusu 2 vs 3 - routing deyil, physics.md-de leak intizami yoxdur. ClickUp 86eynm9qy (E1.7), urgent.
- 2026-08-18: YAXSI XEBER - choice 29/29=100%, has_figure 16/16=100%. DIM coxsecimlidir, sagird ucun netice choice-dur; final_answer 70% values formatidir. ADR-025 qrafik hallusinasiya qorxusu n=16-da tesdiqlenmedi.
- 2026-08-18: TEKRARLANAN NUMUNE - uc gunde ucuncu defe pis reqem modelin yox, bizim enum-un darligini olcdu (visual kind -> E2.6, topic_code -> E1.8). Qayda: metrika model cixisini bizim enum-la tutusdururusa, evvelce enum-a bax.
- 2026-08-18: Riyaziyyat DIM PDF alindi (ir_vB.pdf, Ilkin) -> tmp/ir_vB.pdf (gitignore). 33 seh, A4, TEK sutun; suallar p2-28 (0-based), etiket 'N)' x=66-84; 255 sual, 252 etiket tapildi.
- 2026-08-18: KITABCADA CAVAB ACARI VAR (p32) - fizikada yox idi. 254/255 parse olundu (bosluq: 251). Yeni golden choice EL ILE HELL EDILMIR. evals/keys/ir_vB-answer-key.json commit edildi.
- 2026-08-18: TELE TUTULDU - acar CYRILLIC homoqlif isledir (A U+0410, E U+0415). 254 yazidan 28-i (11%) cyrillic idi. Xam sekilde isledilseydi choice_match hemin itemlerde 0% verer ve MODEL UGURSUZLUGU kimi gorunerdi. JSON-da latin normallasdirilib, xam variant saxlanilib.
- 2026-08-19: Cowork auditi (dilim 4) - E1.7 (leak 0/30) ve E1.8 (topic 90%) fizikada KECDI. Lakin E2.4 qapisi ucuncu defe olculmedi ve iki gizli tapinti cixdi.
- 2026-08-19: RIYAZIYYATDA LEAK 15.2% (7/46, math-dim-vB-e24). E1.7 intizami yalniz physics.md-e elave olunub, core.md/math.md-e kecmeyib. Mehsulun esas vedi ESAS FENDE pozulur. ClickUp 86eyp3au4 (E1.9), urgent.
- 2026-08-19: false_refusal 73.7% (56/76) esas run-da; e24 alt-destinde 2.1%. Kitabcanin basi/sonu duzgun kesilir, ORTASI yox - Q21-227 aralig. O run-in butun metrikalari (leak 0/20 daxil) etibarsizdir. ClickUp 86eyp3aub (E1.10).
- 2026-08-19: choice 88.9% - 5 sehvin hamisi IQ/mentiq tipidir (fiqur ardicilligi 240, mentiqi cedvel 250, simvol tapmacasi 236, overline 002, meta-sayma 010). Korpus off-distribution, model ugursuzlugu deyil.
- 2026-08-19: QERAR - E2 dondurulur. Uc korpus, uc olcme: graph-helps 6/52, 9/52, 4/48. Real DIM suallarinin ~8-17%-i qrafikden faydalanir; n>=30 ucun funksiya-qrafikli kitabca lazimdir. visual fill 0/46 model sehvi DEYIL - 4 item ADR-031-in sahedan kenar qoydugu tiplerdir. ClickUp 86eyp3auh (E2.7, Faza 4).
- 2026-08-19: E1.11 model fallback telemetriyasi. 0074 miqrasiyasi (model_used jsonb), v_model_health view, solve.response/cascade-a model/fallback props. ClickUp 86eyp5gt2.
- 2026-08-19: E1.9/E1.10 yeniden olcme. core.md v16 leak qaydasi (butun fenn). layout.py suffix-only (variant ogurlama duzelisi). 255 recrop. question_kind (curriculum|iq_logic). e24 leak 15.2%->4% (1/25), choice curriculum 100%. e110-50 false_refusal 73.7%->4.2% (1/24). API 503 ~50%.
- 2026-08-15: ClickUp MCP limiti tapildi - MCP server-in AYRI kvotasi var (Free: 24 saatliq rolling pencerede 50 cagiris, sifirlanmir). REST API ise deqiqede 100. `scripts/clickup.mjs` yazildi, MCP artiq islenmir; CLAUDE.md-e qayda elave edildi.
