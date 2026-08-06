# web — Təhsil Platforması (Faza 1)

Next.js (App Router, TS, Tailwind). Bax `../docs/PHASE-1.md` — sprintlər, API müqaviləsi, qəbul şərtləri.

## S1a — lokal işə salma (hesab tələb etmir)

```bash
# 1) lokal Postgres (Docker) — supabase start da olar, hər hansı əlçatandırsa
docker run --name th-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=tehsil -p 5432:5432 -d postgres:16

# 2) miqrasiya (portativ SQL, Supabase-ə xas heç nə yoxdur)
docker exec -i th-postgres psql -U postgres -d tehsil < ../supabase/migrations/0001_events.sql

# 3) env
cp .env.example .env.local   # DATABASE_URL defolt dəyəri yuxarıdakı konteynerə uyğundur

# 4) asılılıqlar + server
npm install
npm run dev -- -H 0.0.0.0 -p 3000   # -H 0.0.0.0 telefon LAN IP-dən açması üçün lazımdır
```

Telefon eyni Wi-Fi-dadırsa: `http://<kompüterin LAN IP-si>:3000` (məs. `ipconfig` → Wi-Fi adapterinin IPv4 ünvanı).

**Qəbul (docs/PHASE-1.md → S1a):**
1. Telefondan LAN IP ilə açılır → Postgres-də `app.opened` sətri görünür
   (`docker exec th-postgres psql -U postgres -d tehsil -c "select * from events;"`)
2. Təyyarə rejimi → internet qayıdır → hadisə itmir, gecikməylə gəlir
3. Eyni paket iki dəfə göndərilir → cədvəldə bir sətir

## S2 — kamera → kəsmə (HTTPS ön şərti ilə)

`getUserMedia` təhlükəsiz kontekst tələb edir — `http://<LAN IP>:3000` işləməyəcək.
Hesabsız, dərhal HTTPS URL üçün `cloudflared` (portativ, quraşdırma tələb etmir):

```bash
# .tools/cloudflared.exe — https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
.tools/cloudflared.exe tunnel --url http://localhost:3000
# konsolda çıxan https://xxx.trycloudflare.com telefondan açılır
```

**Qəbul (docs/PHASE-1.md → S2):** telefonda şəkil çəkilir, kəsilir (tam ölçülü kadr üzərində,
faiz-əsaslı — CSS/mənbə piksel qarışıqlığı struktur olaraq mümkün deyil, bax `lib/image.ts`),
əvvəl kəsilir SONRA ≤1600px-ə kiçildilir, `/api/solve`-ə çatır (S3-ə qədər stub cavab qaytarır).
`capture.*`/`crop.*` hadisələri, o cümlədən `capture.permission_denied` (icazə rədd edilsə app
çökmür, bax `TELEMETRY.md`).

**Diqqət:** pulsuz `trycloudflare.com` tuneli hesabsızdır və ara-sıra `403`/bağlantı kəsilməsi
verə bilər (Cloudflare-in özü xəbərdarlıq edir — "no uptime guarantee"). İstehsalat üçün deyil,
yalnız dev dövrü üçündür.

## Struktur

```
app/
  layout.tsx        kök: tema/tone CSS dəyişənləri, i18n provider, telemetriya init
  page.tsx           Ana ekran (S1) — app.opened atəşləyir
  kamera/page.tsx    S2: çəkiliş → kəsmə → /api/solve axını
  api/events/         POST — telemetriya upsert (event_id üzrə, həmişə 200)
  api/solve/           POST — S2 stub (S3-də real Gemini inteqrasiyası)
components/kamera/    CaptureView (getUserMedia, icazə/dəstək halları), CropView (faiz-əsaslı kəsmə)
lib/
  db.ts               pg Pool, DATABASE_URL-dən (S1a lokal, S1b Supabase — kod dəyişmir)
  design-tokens.ts   ../docs/DESIGN-TOKENS.json → CSS custom property (ADR-002, tək mənbə)
  image.ts            kəs → (yalnız lazımdırsa) ≤1600px kiçilt — sıra sabitdir
  telemetry/          klient kitabxanası: IndexedDB növbə, offline-a davamlı flush, idempotent
i18n/request.ts       next-intl konfiqurasiyası (yalnız `az` aktiv, struktur hazırdır)
messages/az.json      UI mətnləri (hardcode qadağandır — CLAUDE.md)
```

## S1b (deploy) üçün

`DATABASE_URL`-i Supabase-in connection string-i ilə əvəz et, Vercel-ə deploy et,
`supabase/migrations/0001_events.sql`-i Supabase-də tətbiq et. Kod dəyişmir.
