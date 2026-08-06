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

## Struktur

```
app/
  layout.tsx        kök: tema/tone CSS dəyişənləri, i18n provider, telemetriya init
  page.tsx           Ana ekran (S1) — app.opened atəşləyir
  api/events/         POST — telemetriya upsert (event_id üzrə, həmişə 200)
lib/
  db.ts               pg Pool, DATABASE_URL-dən (S1a lokal, S1b Supabase — kod dəyişmir)
  design-tokens.ts   ../docs/DESIGN-TOKENS.json → CSS custom property (ADR-002, tək mənbə)
  telemetry/          klient kitabxanası: IndexedDB növbə, offline-a davamlı flush, idempotent
i18n/request.ts       next-intl konfiqurasiyası (yalnız `az` aktiv, struktur hazırdır)
messages/az.json      UI mətnləri (hardcode qadağandır — CLAUDE.md)
```

## S1b (deploy) üçün

`DATABASE_URL`-i Supabase-in connection string-i ilə əvəz et, Vercel-ə deploy et,
`supabase/migrations/0001_events.sql`-i Supabase-də tətbiq et. Kod dəyişmir.
