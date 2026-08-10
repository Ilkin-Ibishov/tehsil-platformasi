# Steering — Test Bankı və Kontent Qatı

Bu sənəd hər generasiya və kod dəyişikliyində avtomatik kontekstə daxil edilir.
Buradakı qaydalar bütün digər təlimatlardan üstündür.

## Layihə konteksti

Mobil-first təhsil platforması. Əsas istifadəçi: 10–16 yaş məktəb şagirdi.
Ödəyən tərəf: valideyn. Stack: Next.js 15 (PWA) + Supabase (Postgres) → Capacitor.

Məhsulun əsas fərqi: **cavab vermək yox, addım-addım öyrətmək.**
Ona görə hər sualın `steps` sahəsi məcburidir və boş buraxıla bilməz.

## Dəyişməz arxitektura qaydaları

1. **Üç qat ayrıdır və qarışdırılmır:** item bank (sual) / assessment (test yığımı) / attempt (cəhd).
   Bir cədvəldə iki qatın məlumatını saxlamaq qadağandır.
2. **Sual immutable-dır.** Redaktə `UPDATE` deyil, yeni `version` yaradır.
3. **Doğru cavab heç vaxt client-ə göndərilmir.** Yoxlama yalnız server RPC ilə.
4. **Kontent dili ≠ UI dili.** İkisi ayrı sahələrdə saxlanır.
5. **Bütün cədvəllərdə** `id UUID`, `created_at`, `updated_at`, `deleted_at` (soft delete).
6. **UUID client tərəfdə generasiya olunur** (offline yaradılan qeydlər üçün).
7. Native qatı (kamera, push, ödəniş) həmişə interfeys arxasında abstraksiya olunur.

## Kontent formatı

- Riyazi ifadələr **yalnız LaTeX sətri** kimi saxlanır. Şəkil kimi saxlamaq qadağandır.
- Sual mətni, izah və reels başlığı **eyni blok sxemi** ilə saxlanır (`blocks[]`).
- Şəkillər `question_assets` cədvəlində saxlanır, mətnə `asset_id` ilə bağlanır.
- HTML saxlanmır. Yalnız struktur bloklar.

## Dil qaydaları

- Dəstəklənən dillər: `az` (əsas), `ru`, `en`, `tr`.
- Fallback zənciri: `az → tr → en`. Tərcümə yoxdursa boş ekran yox, fallback göstərilir.
- Azərbaycan dilində mətn yazarkən: ə, ğ, ı, ö, ü, ç, ş hərfləri düzgün olmalıdır.
  Türk dilinə sürüşmə (ə → e, x → h) qəbul edilmir.
- Sinif səviyyəsinə uyğun lüğət: 5-ci sinif sualında 9-cu sinif terminologiyası işlədilmir.

## Sual keyfiyyət meyarları

Qadağan olunan variant tipləri:
- "Yuxarıdakıların hamısı" / "Heç biri"
- "A və B" tipli birləşdirilmiş variantlar
- Sözlə oyun və ya tələ (trick) sualları
- Bir-birindən yalnız işarə ilə fərqlənən distraktorlar

Hər distraktor **real şagird səhvini** əks etdirməlidir və `misconception` sahəsində
o səhvin nə olduğu yazılmalıdır.

## Kod konvensiyaları

- TypeScript strict mode.
- Server Actions **istifadə edilmir** — yalnız HTTP Route Handlers (`app/api/...`).
  Səbəb: Capacitor `output: 'export'` uyğunluğu.
- Supabase sorğuları typed client ilə. `any` qadağandır.
- Miqrasiyalar `supabase/migrations/` altında, tarixli fayl adları ilə.
- Yeni cədvəldə RLS aktivləşdirilir (CLAUDE.md qayda 6).
- **Cavab cədvəli üçün RLS kifayət deyil.** `private` sxemi + `app_runtime`
  rolunun icazəsizliyi + `SECURITY DEFINER` RPC — bax `docs/decisions/ADR-017`.
- API qatı ikinci müdafiə xəttidir: sual endpoint-ləri heç vaxt `select('*')`
  işlətmir və cavab sahəsi qaytarmır.

## Toxunulmaz məhsul qərarları

- Pulsuz limit: gündə 5 həll. Limit məntiqi server tərəfdədir.
- Cavab ayrıca toxunuşla açılır — heç vaxt addımlarla birlikdə göstərilmir.
- Ödəniş linki valideynə göndərilir (app store komissiyasından yayınma). Bu axın pozulmur.
- MVP-də reklam yoxdur.
