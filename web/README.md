# web — Təhsil Platforması (Faza 1)

Next.js (App Router, TS, Tailwind). Bax `../docs/PHASE-1.md` — sprintlər, API müqaviləsi, qəbul şərtləri.

## S1a — lokal işə salma (hesab tələb etmir)

```bash
# 1) lokal Postgres (Docker) — supabase start da olar, hər hansı əlçatandırsa
docker run --name th-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=tehsil -p 5432:5432 -d postgres:16

# 2) miqrasiyalar (portativ SQL, Supabase-ə xas heç nə yoxdur)
docker exec -i th-postgres psql -U postgres -d tehsil < ../supabase/migrations/0001_events.sql
docker exec -i th-postgres psql -U postgres -d tehsil < ../supabase/migrations/0002_problems_solutions_attempts.sql

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
verə bilər (Cloudflare-in özü xəbərdarlıq edir — "no uptime guarantee"). **`ADR-011`-ə görə
telefon testi üçün istifadə edilmir** — bax aşağıda S1b. Tunel yalnız S1b-dən əvvəlki bir
günlük keçid idi, tarixi qeyd üçün saxlanılır.

## S3 — Həll API (`/api/solve` real inteqrasiya)

```bash
cp .env.example .env.local
# INVITE_CODE — özün seç (sınaq qrupuna şifahi/mesajla ötürüləcək)
# GEMINI_API_KEY — Vercel-də artıq var, lokal test üçün ayrıca əlavə et
```

Axın: dəvət kodu (yalnız bir dəfə, `localStorage`-da saxlanılır) → kamera → kəsmə →
`/api/solve` (Gemini, `prompts/solve-step.md` fayldan oxunur — eval harness ilə TƏK MƏNBƏ) →
sxem yoxlanışı (1 retry) → ədədi yoxlama (`lib/verify/`, `ADR-012`) → `problems`/`solutions`/
`attempts`-a yazı. `verified=false` və ya sxem etibarsızdırsa → `status: "unreadable"`.

Gündəlik limit 30 (`device_id` üzrə, yalnız çatdırılmış həllər sayılır) — 429 + `events`-ə
`limit.blocked`. Yanlış dəvət kodu → 403, klient kodu silir və yenidən soruşur.

**Bu sessiyada canlı Gemini açarı və işlək Postgres olmadığı üçün uc-uca (kamera → real
Gemini cavabı → DB sətri) YOXLANILMADI.** Yoxlanılan: `next build`/`lint` təmiz, `lib/verify/
answer.ts`-in ədədi yoxlama məntiqi (`x²-5x+6=0` → kök 3/2 doğru, 5 səhv, `sqrt(2)` işləyir)
ayrıca skriptlə sınandı, `outputFileTracingIncludes` ilə `prompts/solve-step.md`-in funksiya
bundle-ına düşdüyü `.next/server/app/api/solve/route.js.nft.json`-dan təsdiqləndi. **Real
API açarı əlavə olunandan sonra bir dəfə tam axın (kamera → cavab → DB sətri) əl ilə
yoxlanılmalıdır** — `ADR-012`-dəki mathjs portu ilə bağlı bilinən risk buna görə əvvəlcədən
yazılıb, ilk 30 canlı həllin `unreadable` nisbəti izlənməlidir.

## Struktur

```
app/
  layout.tsx        kök: tema/tone CSS dəyişənləri, i18n provider, telemetriya init
  page.tsx           Ana ekran (S1) — app.opened atəşləyir
  kamera/page.tsx    S2/S3: dəvət kodu → çəkiliş → kəsmə → /api/solve axını
  api/events/         POST — telemetriya upsert (event_id üzrə, həmişə 200)
  api/solve/           POST — S3: Gemini + sxem/ədədi yoxlama + problems/solutions/attempts yazısı
components/kamera/    CaptureView, CropView, InviteGate (dəvət kodu, ADR-012)
lib/
  db.ts               pg Pool, DATABASE_URL-dən (S1a lokal, S1b Supabase — kod dəyişmir)
  design-tokens.ts   ../docs/DESIGN-TOKENS.json → CSS custom property (ADR-002, tək mənbə)
  image.ts            kəs → (yalnız lazımdırsa) ≤1600px kiçilt — sıra sabitdir
  prompt.ts            ../prompts/solve-step.md-dən System/User oxuyur (eval ilə TƏK MƏNBƏ)
  llm.ts / cost.ts     Gemini (OpenAI-uyğun) çağırışı, xərc hesablaması
  verify/               schema.ts (ajv), answer.ts (mathjs, ADR-012), leak.ts — scripts/lib portu
  telemetry/          klient kitabxanası: IndexedDB növbə, offline-a davamlı flush, idempotent
i18n/request.ts       next-intl konfiqurasiyası (yalnız `az` aktiv, struktur hazırdır)
messages/az.json      UI mətnləri (hardcode qadağandır — CLAUDE.md)
```

## S1b — deploy (`ADR-011`: telefon testi üçün YEGANƏ etibarlı mühit)

**Qurulub, işləyir.** GitHub (`Ilkin-Ibishov/tehsil-platformasi`, private) ↔ Vercel
(`ilkin-ibishovs-projects/web`) ↔ Supabase (`tehsil-platformasi`, `eu-central-1`) qoşulu.

| Nə | URL |
|---|---|
| **Production** (`main` push edəndə avtomatik) | `https://web-ilkin-ibishovs-projects.vercel.app` |
| **Preview** (hər digər branch push edəndə avtomatik) | `web-git-<branch>-ilkin-ibishovs-projects.vercel.app` |
| Supabase layihəsi | `oxjzehxnbumgyoqjonju` (dashboard: supabase.com/dashboard/project/oxjzehxnbumgyoqjonju) |

**Vercel Project Settings:**
- Root Directory: `web` (repo kökü klonlanır, `../docs/DESIGN-TOKENS.json` idxalı buna görə işləyir)
- Env: `DATABASE_URL`, `NEXT_PUBLIC_APP_VERSION` — `production`/`preview`/`development` hər üçündə
- **SSO Deployment Protection SÖNDÜRÜLÜB** (istifadəçi təsdiqi ilə) — söndürülməsəydi telefon/
  brauzer heç bir URL-i aça bilməzdi (Vercel login-ə yönləndirirdi). `/api/solve` hələ stub
  olduğu üçün risk yoxdur; S3-də real API qoşulanda `PHASE-1.md`-dəki dəvət kodu qoruyacaq.

**Miqrasiya tətbiq etmək üçün** (yeni miqrasiya yazılanda):
```bash
docker run --rm postgres:16 psql "postgresql://postgres.oxjzehxnbumgyoqjonju:<DB_PASS>@aws-0-eu-central-1.pooler.supabase.com:5432/postgres" -f - < ../supabase/migrations/000X_xxx.sql
```
DB şifrəsi Vercel env-də (`DATABASE_URL` daxilində) və Supabase dashboard-dadır, ayrıca saxlanmır.

**Növbəti sprintlər üçün axın:** kodu dəyiş → `git push` (feature branch → Preview URL avtomatik
gəlir, telefon üçün) → `main`-ə merge → Production yenilənir. Kod DƏYİŞMİR, S1a-dakı eyni
`DATABASE_URL` mexanizmi.
