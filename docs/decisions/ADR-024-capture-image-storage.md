# ADR-024 — Çəkilmiş şəkillərin saxlanması və retensiya

**Status:** Qəbul edilib
**Tarix:** 2026-08-14
**Toxunur:** `0049_ocr_captures_training_corpus.sql` (`storage_path` sütunu artıq var idi, boş
qalırdı) · `0057_captures_storage_bucket.sql` · HANDOFF bloku 95, S1 (`86eymwght`)

## Kontekst

Blok 95-in DB adli-forensika seansı göstərdi ki, real şagird şikayəti ("həll yanlış addımlarla
göstərildi") **debug edilə bilmədi**, çünki heç bir şəkil heç yerdə saxlanmırdı
(`storage.buckets` = 0 sətir). `ocr_captures.storage_path` sütunu miqrasiya `0049`-dan bəri
mövcud idi, amma onu yazan kod heç vaxt yazılmamışdı. Kəsmə davranışı özü şübhəli idi
(`crop.confirmed` = 152×474px, nisbət 0.428, defolt qutu 1.818, 7 dəfə `crop.adjusted`) —
modelin nəyi oxuduğunu yoxlamaq mümkün olmadı.

## Qərar

1. **Supabase Storage-da `captures` bucket-i, PRIVATE.** `image/jpeg`+`image/png`, obyekt başı
   limit 2 MB. RLS policy əlavə edilmir (bax `0057`-in şərhi) — bucket-ə yeganə giriş yolu
   server tərəfin `SUPABASE_SERVICE_ROLE_KEY`-i ilədir (RLS-i bypass edir), `anon`/`authenticated`
   heç bir policy olmadığı üçün strukturca sıfır girişə malikdir.
2. **İki fayl, hər çəkiliş üçün:** kəsilmiş (LLM-ə göndərilən) şəkil VƏ orijinal kəsilməmiş
   kadr. Səbəb: kəsmə bug-larını (bax yuxarı) yalnız orijinal sübut edə bilər — yalnız kəsilmiş
   versiyanı saxlasaq, "model nə görüb" sualının yarısı hələ də cavabsız qalır.
3. **Yol formatı:** `captures/<yyyy>/<mm>/<attempt_item_id-yoxdursa capture_id>-{raw,crop}.jpg`.
4. **Yazan kod:** `web/lib/storage.ts` (YENİ) — Supabase Storage REST API-yə birbaşa `fetch`
   (SDK əlavə edilmədi, layihədə artıq `@supabase/supabase-js` yoxdur, `pg` ilə birbaşa
   Postgres bağlantısı işlədilir — SDK əlavə etmək bir asılılıq üçün kifayət qədər dəyər
   yaratmır). `writeOcrCapture`-ın YANINDA çağırılır, `ocr_captures.storage_path`/`width`/
   `height`/`bytes`/`image_sha256`/`image_phash` doldurulur.
5. **Retensiya: 90 gün.** Şagird şəkli şəxsi datadır, müddətsiz saxlama yolverilməzdir.
   Bu ADR silmə mexanizmini QURMUR (cron/pg_cron infrastrukturu bu sessiyanın həcmindən
   kənardır) — `docs/HANDOFF.md`-ə açıq maddə kimi yazılır, silinmə tarixini `ocr_captures.
   created_at + 90 gün`-dən hesablamaq kifayətdir, bucket-dəki obyekt adı `ocr_captures.
   storage_path`-la 1-1 uyğundur.
6. **Uğursuzluq axını BLOKLAMIR.** `writeOcrCapture` kimi, şəkil yükləməsi də best-effort —
   Storage API xətası (şəbəkə, limit) şagirdin həllini DAYANDIRMIR, yalnız loga düşür və
   `storage_path` `null` qalır (korpus bir sətir "şəkilsiz" qalır, məhsul davam edir).

## Alternativlər

- **`@supabase/supabase-js` SDK əlavə etmək** — rədd edildi. Tək bir upload+signed-url
  funksionallığı üçün yeni asılılıq, REST çağırışı 2 endpoint-dir (`PUT /object/...`,
  `POST /object/sign/...`), `fetch`-lə birbaşa yazmaq daha az səth sahəsi.
- **Bucket-i public etmək, siyasətsiz oxumaq** — rədd edildi. Şagird şəkli — sərt PRIVATE
  ilə başlamaq, lazım gələrsə (məs. valideyn hesabatında göstərmək) sonra AÇIQ qərarla
  signed URL axını əlavə etmək — əksi (əvvəlcə açıq, sonra bağlamaq) hüquqi risklidir.

## Nəticə

`web/lib/storage.ts` yazılır, `writeOcrCapture` çağırıldığı hər iki yerdə (`/api/solve/
transcribe`, monolit `/api/solve`) şəkil yükləməsi əlavə olunur. Miqrasiya additivdir (yalnız
bucket insert-i) — köhnə kodu sındırmır.

**Açıq qalan (bu ADR-in həcmində DEYİL):** 90 günlük avtomatik silmə cron-u, `SUPABASE_
SERVICE_ROLE_KEY`-in Vercel-də təyin edilməsi (Ilkin-in əl işi, sirr Claude Code-a
göstərilmir).
