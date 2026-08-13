# INVARIANTS.md — maşınla yoxlanan qaydalar

> Sahib: Cowork. Yeni invariant əlavə edən hər ADR bu faylı da yeniləyir.

## Prinsip

Sənəd drift-in qarşısını almır. `numeric_fingerprint` uyğunsuzluğu üç dəfə təkrarlandı —
ADR-008 mövcud olduğu halda. Sənəd oxunmaya bilər; DB trigger-i və selftest oxunmamaq
imkanı vermir.

**Qayda:** hər arxitektura qərarı üç formadan birinə çevrilməlidir. Çevrilə bilmirsə,
o qərar sənəddə qalan bir *fərziyyədir* və gec-tez pozulacaq.

| Forma | Nə vaxt | Nümunə |
|---|---|---|
| DB constraint / trigger | Data haqqında qayda | `trg_assert_fingerprint_prefix` |
| Selftest | Kod davranışı haqqında qayda | `cascade.selftest.mts` |
| Codegen / tək mənbə | Təkrarlanan dəyər | `topic_codes.fingerprint_prefix` |

Yeni qərar qəbul ediləndə soruşulan tək sual: **bunu necə maşın yoxlaya bilər?**
Cavab yoxdursa, qərar hələ hazır deyil.

## Şagird axını heç vaxt qırılmır

Şagirdin yolunda olan cədvəldə sərt rədd (FK, CHECK) yazılmır. Naməlum dəyər
`active=false, needs_review=true` ilə qeydə alınır və `v_taxonomy_review`-da görünür.
Anomaliya görünür qalır, istifadəçi isə itmir.

Sərt rədd yalnız müəllif tərəfindəki data üçün (bank seed, miqrasiya) qəbul ediləndir.

## Aktiv invariantlar

### INV-01 · Fingerprint prefiksi (miqrasiya 0049/0051)
`source='generated'` sətirlərində `numeric_fingerprint` prefiksi
`topic_codes.fingerprint_prefix` ilə eyni olmalıdır.
**Təminat:** `trg_assert_fingerprint_prefix`.
**Şamil edilmir:** `user_capture` (prefiksiz format işlədir — `bank.ts` `fingerprint_digits`
GENERATED sütunu ilə uyğunlaşdırır, ADR-020).

### INV-02 · Taksonomiya tək mənbədədir (0049/0050)
`public.topic_codes` və `public.error_codes` — kodların yeganə həqiqət mənbəyi.
FK yoxdur (şagird axını qırılmasın); `trg_register_topic_code` / `trg_register_error_code`
naməlum kodu `needs_review=true` ilə avtomatik qeydə alır.
**Yoxlama:** `select * from v_taxonomy_review` boş olmalıdır.
**Açıq:** `ARITHMETIC` tətbiq kodunda hardcode edilib, heç bir distraktorda seed yoxdur.

### INV-03 · Cavab izolyasiyası (ADR-017)
`app_runtime` `private` sxeminə birbaşa `SELECT` edə bilməz — yalnız `app` RPC-ləri ilə.
**Yoxlama:** `has_table_privilege('app_runtime','private.question_answers','SELECT')` = false.
`get_advisors` bu sinfi GÖRMÜR — əl ilə yoxlanılır.

### INV-04 · OCR korpus ardıcıllığı (0043)
`ocr_raw` təsdiq ekranından ƏVVƏL, `ocr_final` sonra yazılır.
**Yoxlama:** `ocr_final is not null and ocr_raw is null` → 0 sətir.
Yalnız son mətn saxlanılsa training korpusu dəyərsizdir.

### INV-05 · Soft delete
Şagirdə göstərilən hər sorğu `deleted_at is null` filtri daşıyır.

## Yazılası invariantlar

- **INV-06 · Vaxt zonası.** Gündəlik kvota (`DAILY_LIMIT=30`), streak və D1 retention Bakı
  vaxtı (UTC+4) ilə hesablanmalıdır; server UTC-dədir. Səhv qurulsa metrikalar səssizcə
  yanlış olur və data toplandıqdan sonra geriyə dönük hesablana bilmir.
  **Faza 1 dəvətindən əvvəl bağlanmalıdır.**
- **INV-07 · Sual versiyalaşması.** Eyni `root_id` altında yalnız bir `superseded_by is null`
  sətir ola bilər.
- **INV-08 · Mətn konvensiyası.** `x^2` və `Vyet` bank mətnlərində qadağandır — lint.
- **INV-09 · Şəkil saxlama müddəti.** `ocr_captures` şəkilləri uşaqlara aiddir. Saxlama
  müddəti və silinmə qaydası data yığılmamışdan əvvəl yazılır.

## Token intizamı

Kontekst həm xərcdir, həm keyfiyyətdir — pəncərə 50%-i keçəndə çıxış ölçülə bilən şəkildə pisləşir.

- `CLAUDE.md` 200 sətirdən qısa qalır — hər sorğuda yenidən göndərilir.
- Layihə `.mcp.json`-da yalnız Supabase + Desktop Commander + ClickUp. Hər əlavə server
  hər mesaja tool sxemi əlavə edir.
- Mövzu dəyişəndə `/clear`; uzun sessiyada 60%-də `/compact` (95%-də yox).
- Fayl oxuyanda sətir aralığı göstərilir, tam fayl yox.
- Sessiya 2–3 saatdan uzun sürmür — compaction keyfiyyəti düşür.

**Ən böyük qənaət dəqiq spesifikasiyadır.** Yenidən işləmə tokenləri ilk yazılışdan bahadır.

### INV-10 · Miqrasiya jurnalı uyğunluğu
`supabase/migrations/*.sql` fayl nömrələri DB-dəki tətbiq sırası ilə üst-üstə düşməlidir.
**Pozulma (2026-08-13):** Cowork `0043`/`0044` adları ilə miqrasiya tətbiq etdi, halbuki
repoda həmin nömrələr artıq işlənmişdi. Repo faylları `0049`–`0053` kimi yenidən nömrələndi,
DB-dəki adlar isə dəyişdirilmədi — hər faylın başında real DB adı və `version` qeyd edilib.
**Qayda:** `apply_migration` çağırmazdan əvvəl `supabase/migrations` qovluğundakı son
nömrəyə bax. DB `list_migrations` kifayət deyil — repo nömrələri ondan fərqli ola bilər.
