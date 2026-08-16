# LOG

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
