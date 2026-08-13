# LOG

- 2026-08-11: S4/S5 dəvət axını — `invite_redemptions` cədvəli (0032), `/api/solve` kodu ilk açılışı qeyd edir, `invite_redeemed` hadisəsi əlavə edildi (`docs/TELEMETRY.md`).
- `invites` kataloq cədvəli, `/invite/[code]` səhifəsi yazılmadı — mövcud `InviteGate`/`INVITE_CODES` env axını artıq bunu edir (ADR-012), yenidən qurmaq overengineering olardı.
- Sərt 1-cihaz-1-kod kilidi qəsdən qoyulmadı — brauzer datası silinən şagirdi həmişəlik kilidləməmək üçün (`ON CONFLICT DO NOTHING`).

## 2026-08-13 - Cowork
- Miqrasiya 0043/0044: public.ocr_captures (OCR training korpusu), v_ocr_corpus, v_distractor_health.
- Miqrasiya 0049/0050/0051: topic_codes + error_codes taksonomiya cedvelleri, oz-ozunu sagaldan qeydiyyat trigger-leri, fingerprint prefiks invarianti (yalniz source=generated). 0049-un sert FK-lari user_capture axinini sindirirdi - 0050 duzeltdi.
- docs/INVARIANTS.md yaradildi; CLAUDE.md-e miqrasiya dersi 5-6 elave edildi.
