# ADR-002 — Dizayn tokenlərinin tək mənbəyi

**Status:** Qəbul edilib
**Tarix:** 2026-08-05

## Kontekst

9 dizayn faylı (`design/*.dc.html`) ayrı-ayrı redaktə olunduğu üçün eyni token fərqli dəyərlər alıb:

| Token | Ana ekran / Həll / Test | Onboarding / Kamera / Abunəlik / Hesabat |
|---|---|---|
| `dark.t3` | `0.45` | `0.55` |
| `dark.accSoft` | `0.24` (Ana ekran) | `0.14` |
| `light.accSoft` | `0.22` (Ana ekran) | `0.10` |
| `dark.bor` | `0.09` | `0.12` (Kamera) |

Bundan başqa `dark.t3 = 0.45` `#101311` fonu üzərində təxminən **4.3:1** kontrast verir —
12px mətn üçün WCAG 2.1 AA həddi (4.5:1) **altındadır**. Bu rəng ekranların yarısında ən çox
işlənən etiket rəngidir.

## Qərar

1. `docs/DESIGN-TOKENS.json` — **tək mənbə**. Bütün rəng, radius, şrift, tap-target dəyərləri oradadır.
2. Build zamanı bu fayldan CSS custom property-lər generasiya olunur.
   Komponent yalnız `var(--acc)` yazır, heç vaxt `#A6E06A`.
3. Aşağıdakı düzəlişlər tətbiq edildi:
   - `dark.t3`: `0.45` → **`0.55`** (kontrast)
   - `light.t3`: `#878C81` → **`#767B70`** (kontrast)
   - `accSoft`: çoxluq dəyəri seçildi — `0.14` / `0.10`
   - `dark.bor`: → **`0.12`** (`0.09` OLED-də görünmür)
4. `design/*.dc.html` faylları **referansdır, mənbə deyil**. Onlarda köhnə dəyərlər qalır —
   yenilənmirlər, arxiv kimi saxlanılırlar.

## Nəticələr

**Müsbət:** token drift-i strukturca mümkünsüz olur; tema/ton dəyişikliyi bir faylda edilir;
WCAG AA kontrast təmin edilir.

**Mənfi:** dizayn faylları ilə kod arasında kiçik vizual fərq olacaq. Bu **qəsdəndir** —
kod mənbədir.

**Claude Code üçün qayda:** `DESIGN-TOKENS.json`-dakı dəyəri "dizayn faylında belə idi" səbəbi ilə
geri qaytarma. `_fixes_applied` massivi hər dəyişikliyin səbəbini saxlayır.

## Ton sistemi

`genc` / `yetkin` yalnız radius, başlıq şrifti və tap-target-i dəyişir — rəngləri yox.
Sinifdən avtomatik təyin olunur (5–8 → `genc`, 9–11 → `yetkin`), profildən dəyişilə bilər.

Üslub seçimi (`design/Üslub seçimi.dc.html`) 5 istiqamət göstərir — **1d "Redaksiya" kilidlənib**.
Digər 4 istiqamət araşdırılmır. Səbəb: ödəyən valideyndir, 1d valideyn gözündə ən inandırıcıdır,
yaş fərqini isə `TON` açarı örtür.
