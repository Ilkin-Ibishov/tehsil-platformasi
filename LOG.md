# LOG

- 2026-08-11: S4/S5 dəvət axını — `invite_redemptions` cədvəli (0032), `/api/solve` kodu ilk açılışı qeyd edir, `invite_redeemed` hadisəsi əlavə edildi (`docs/TELEMETRY.md`).
- `invites` kataloq cədvəli, `/invite/[code]` səhifəsi yazılmadı — mövcud `InviteGate`/`INVITE_CODES` env axını artıq bunu edir (ADR-012), yenidən qurmaq overengineering olardı.
- Sərt 1-cihaz-1-kod kilidi qəsdən qoyulmadı — brauzer datası silinən şagirdi həmişəlik kilidləməmək üçün (`ON CONFLICT DO NOTHING`).
