# ADR-011 — Telefonda test mühiti: tunel deyil, deploy

**Status:** Qəbul edilib
**Tarix:** 2026-08-06
**Dəyişdirir:** `docs/PHASE-1.md` (S1b prioriteti) · `HANDOFF (22)`-dəki cloudflared tövsiyəsi

## Kontekst — eyni sual iki dəfə səhv cavablandı

«Telefonda necə test edək?» sualı iki dəfə soruşuldu və hər ikisində cavab yanlış çıxdı:

1. **LAN `http://192.168.x.x:3000`** (S1a) — `crypto.randomUUID` işləmədi, sonra məlum oldu
   ki, `getUserMedia` ümumiyyətlə açılmır. Səbəb: təhlükəsiz kontekst yoxdur.
2. **Cloudflare quick tunnel** (S2, mənim tövsiyəm) — HTTPS problemini həll etdi,
   **yenisini yaratdı**.

## Ölçmə — 2026-08-06, brauzerdə

Tuneldəki tətbiqdə **heç bir düymə işləmirdi**. Səbəb kodda deyil:

```
performance resource timing, səhifə yüklənməsi:
  0aq__1i8qtb_._.js    status=403   decodedBodySize=0
  web_168p561._.js     status=403   decodedBodySize=0
  web_1l-unkl._.js     status=403   decodedBodySize=0
  ...qalan 14 chunk    status=200
```

Sonra **eyni üç URL** əl ilə yenidən istənildi → **200**. Yəni fayllar yerindədir;
tunel onları **təsadüfi olaraq 403-lə rədd edir**.

Nəticə zənciri:
```
3 chunk çatmır → React hidratasiya olmur → heç bir onClick qoşulmur
→ SSR HTML görünür, tətbiq ölüdür → "düymələr işləmir"
```

Diaqnostika: `reactPropsOnButton = 0` (React heç yerə qoşulmayıb),
`serviceWorkers = 0`, konsolda səhv **yoxdur**. Səssiz uğursuzluq.

**Səbəb:** `trycloudflare.com` pulsuz «quick tunnel»dur — hesabsızdır, ona görə
sərt limitlidir. `next dev` bir səhifə üçün **18 ayrı chunk** istəyir; bu partlayış
limiti işə salır. Cloudflare özü TryCloudflare-i istehsalat üçün tövsiyə etmir.

Claude Code test zamanı «ara-sıra 403» gördüyünü yazmışdı — bu, xırda maneə deyil,
**əsas səbəb** imiş.

## Qərar

**Telefon testi üçün tək mühit: deploy (S1b / Vercel preview).**

| mühit | nə üçün |
|---|---|
| `localhost` masaüstü brauzer | Claude Code-un iş dövrü. Təhlükəsiz kontekstdir — kamera işləyir. |
| **Vercel preview** | **Telefonda hər test.** Həqiqi HTTPS, həqiqi CDN, chunk sayı azdır. |
| ~~LAN http~~ | təhlükəsiz kontekst yoxdur — kamera açılmır |
| ~~quick tunnel~~ | chunk-ları təsadüfi 403-lə rədd edir — tətbiq səssizcə ölür |

**S1b artıq «sonra» deyil.** S3–S6-nın hər biri telefonda yoxlanmalıdır; hər sprintdə
tunellə vuruşmaq eyni xərci təkrar-təkrar ödəməkdir. Üstəlik şagirdlərə onsuz da
tunel URL-i verilə bilməz.

**Aralıq həll** (hesablar hazır olana qədər, bu gün üçün): `next build && next start`.
Produksiya bundle-ı 18 yox, bir neçə chunk istəyir — limit ehtimalı kəskin düşür.
Bu, düzəliş deyil, keçid tədbiridir.

## Nəticələr

**Müsbət:** telefon testi bir dəfə qurulur və bütün sprintlərə xidmət edir.
Test mühiti istehsalatla eyni olur — «məndə işləyirdi» sinfi səhvlər azalır.

**Mənfi:** hər telefon testi deploy gözləyir (Vercel preview ~1 dəq). Qəbul edilir.

**Ilkindən asılılıq:** GitHub (private repo) · Supabase · Vercel hesabları.

## Ümumi dərs

Hər iki uğursuzluq **səssiz** idi: nə çökmə, nə konsol səhvi. Birincisi «kamera
dəstəklənmir», ikincisi «düymələr işləmir» kimi göründü — ikisi də mühit problemi idi.

Buradan qayda: **mühit problemi məhsul problemi kimi görünür.** Telefonda gözlənilməz
davranış görəndə birinci sual «kod səhvdirmi?» yox, **«bütün asset-lər çatdımı?»**
olmalıdır. `performance.getEntriesByType('resource')` ilə status kodlarına baxmaq
30 saniyəlik işdir və bu dəfə saatlarla kod axtarışının qarşısını alardı.
