# Design — Kontent Generasiya Pipeline

**Status:** planlaşdırılıb, icra edilməyib. Faza 1 qapısından SONRA başlanır.
**Asılılıq:** `.kiro/specs/test-bank/` sxemi tətbiq olunmalıdır (PR #4).

## Problem

Test bankı boşdur. Rəqib tətbiqlərdən scraping rədd edildi (bax Notion → Kontent
strategiyası). Bank öz-özünə qurulmalıdır.

## Arxitektura qərarı — IDE agenti toplu generasiya üçün yanlış alətdir

Claude Code və ya Kiro ilə 5 000 sual generasiya etmək **arxitektura səhvidir**.
Agent dövrəsi hər sual üçün kontekst yükləyir, cavab oxuyur, fayl yazır — eyni işə
20–50 dəfə artıq token gedir və IDE kvotası yanır.

| İş | Alət |
|---|---|
| Pipeline skriptini yazmaq | IDE agenti (bir dəfə) |
| 5 000 sual generasiya etmək | Öz API açarı ilə skript, Batch endpoint |

Batch endpoint təxminən yarı qiymətədir. IDE kvotası toxunulmaz qalır.

## Mərhələlər

### M1 — Toxum (seed)

DİM altstandart xəritəsi CSV kimi. Hər sətir: fənn, sinif, mövzu, altstandart,
hədəf sual sayı, çətinlik paylanması. **Bu, əl işidir** — AI-a həvalə edilmir,
çünki səhv olsa bütün baza səhv olur.

Mənbə: DİM/Təhsil Nazirliyinin dərc etdiyi fənn proqramları. Taksonomiya faktdır,
müəllif hüququ ilə qorunmur — yalnız *ifadə* qorunur.

### M2 — Generasiya

Hər altstandart üçün batch sorğu, bir çağırışda 10 sual. `temperature ≈ 0.9`
(müxtəliflik üçün). Nümunə-əsaslı prompt: steering-də 3 nümunə sual, model formatı
təqlid edir.

Çıxış `docs/STEP-SCHEMA.json` formasına uyğun olmalıdır — `steps[]`, `check`,
`error_code`. Sərbəst format qəbul edilmir.

### M3 — Avtomatik validasiya (ƏN VACİB MƏRHƏLƏ)

Ayrı çağırışda, **generasiya kontekstini görmədən**, ikinci model sualı sıfırdan
həll edir. Yalnız cavab uyğun gəlsə keçir.

Riyaziyyat üçün daha yaxşısı: `web/lib/verify/answer.ts` (ADR-009 tək mənbə) ilə
determinist yoxlama. `scripts/lib/verify.py`-dakı davamlı Node işçisi bunu onsuz da
təmin edir — eyni infrastruktur işlədilir.

Bu, keyfiyyət qapısıdır və ~30–40% zibili avtomatik atır. **Atlanmır.**

### M4 — Dublikat təmizləmə

Embedding + kosinus oxşarlığı > 0.92 → at. Model eyni mövzuda çox oxşar suallar
yazmağa meyllidir.

Bank səviyyəsində əlavə qat: `questions_dedup_idx`
(`canonical_hash, subject_id, grade`) onsuz da eyni sinif daxilində dublikatı bloklayır.

### M5 — Müəllim təsdiq paneli

Mövcud admin panel genişləndirilir. Üç əməliyyat: **Təsdiq / Düzəlt / Rədd.**
Müəllim yazmır, təsdiqləyir. Klaviatura qısayolları — hədəf saatda 100–150 sual.

Düzəliş `create_question_version` çağırır (sual immutable-dır).

## Status axını

Generasiya olunan sual `source='generated'`, `review_status='draft'` ilə düşür.
M3 keçərsə → `auto_verified` (bankda görünür). Müəllim təsdiqləyərsə → `verified`.

Bu, `user_capture` axını ilə eyni mexanizmdir — bax `design.md` §5 və HANDOFF(68).

## Xərc

Sual başına ~0.1–0.3 ₼ (API + müəllim yoxlama vaxtı). 5 000 sual ≈ 500–1 500 ₼,
3–4 həftə. Müqayisə üçün: müəllimə sıfırdan yazdırmaq 2 500–10 000 ₼.

## Alternativ kanallar (paralel gedə bilər)

1. **`user_capture`** — şagird şəkilləri bankı qidalandırır. Sıfır marjinal xərc,
   real məktəb tapşırıqları. Ən güclü kanal.
2. **Müəllimlərlə gəlir bölgüsü** — nağd yox, paketdən gələn abunə faizi. İlkin
   kapital tələb etmir, müəllim marketplace-inin təməli.
3. **Nəşriyyat lisenziyası** — uzunmüddətli, danışıq vaxtı aparır.

## Qadağalar

- Rəqib tətbiq və saytlardan scraping — **rədd edildi.** Store şikayəti tətbiqi
  günlərlə dayandıra bilər; oğurlanmış bank üzərində qurulan şirkət satıla bilməz.
- `steps` sahəsi boş sual bankaya düşmür — məhsulun əsas vədidir.
- Uydurma `error_code` — yalnız `docs/STEP-SCHEMA.json` enum-u.
