# ADR-006 — Şəkil girişi müqaviləsi: uğursuzluq yolu, etibarlılıq, şəkil qaydaları

**Status:** Qəbul edilib
**Tarix:** 2026-08-05
**Dəyişdirir:** `docs/STEP-SCHEMA.json` · `prompts/solve-step.md` · `scripts/lib/llm_client.py` · `evals/README.md`
**Kontekst:** vision boru xətti hələ heç bir real şəkillə sınanmayıb (Faza 0-lite gözlənilir)

## Problem 1 — sistemdə **uğursuzluq yolu yoxdur**

`STEP-SCHEMA.json`-un kök `required` siyahısı `steps` və `final_answer`-i **məcburi** edir,
`steps.minItems = 2`. Yəni model şəkli oxuya bilməsə belə **həll uydurmalıdır** — sxem ona
"oxuya bilmədim" demək imkanı vermir.

Bu, məhsulun ən təhlükəli səhv rejimidir:

- Bulanıq şəkil → model ağlabatan görünən, **tamamilə uydurma** məsələ həll edir
- Şagird səhvini "öz səhvi" sanır, `error_code` hesabata yazılır → **səhv xəritəsi zəhərlənir**
- Qızıl qayda (`CLAUDE.md`) pozulur: dəyər `error_code` taksonomiyasındadır; uydurma giriş onu korlayır

Dizayn tərəfində də uyğun ekran yoxdur. `design/Həll ekranı v5.dc.html` dörd vəziyyət tanıyır:
`normal`, `ocr` (düzəliş), `xeta` (şəbəkə), `yuklenir`. **"Məsələni oxuya bilmədim" vəziyyəti yoxdur.**

## Problem 2 — etibarlılıq siqnalı yoxdur

Dizaynda `düzəliş` axını var ("Simvolu düzəlt, sonra yenidən həll et"), amma onu **nə vaxt**
göstərəcəyimizi bilmirik — model heç bir etibarlılıq qiyməti qaytarmır. Nəticədə ya heç vaxt
göstəririk (səhv oxunuş sezilmir), ya həmişə (hər həlldə əlavə sürtünmə).

## Qərar

### A. Sxemə uğursuzluq kanalı əlavə olunur (geriyə uyğun)

```
status          ok | unreadable | not_a_problem | multiple_problems | cut_off | unsupported
ocr_confidence  high | medium | low
reason_az       status != ok olduqda UI-da göstəriləcək bir cümlə
```

`status` **opsionaldır**: yoxdursa `ok` sayılır → mövcud valid çıxışlar valid qalır.
`status` yoxdursa və ya `ok`-dursa → `canonical`, `subject`, `grade`, `topic_code`,
`final_answer`, `steps` məcburidir. Əks halda → yalnız `status` və `reason_az` məcburidir.

| `status` | nə vaxt | UI reaksiyası |
|---|---|---|
| `unreadable` | bulanıq, işıq az, kəsilmiş, oxunmur | "Şəkil aydın deyil — daha yaxından çək" + təkrar çək |
| `not_a_problem` | şəkildə riyazi məsələ yoxdur | "Burada məsələ görmürəm" + təkrar çək |
| `multiple_problems` | bir neçə məsələ var, hansı olduğu bəlli deyil | "Bir məsələni çərçivəyə sal" + kəsmə |
| `cut_off` | məsələnin bir hissəsi kadrdan kənardadır | "Məsələnin hamısı görünmür" |
| `unsupported` | fənn/mövzu dəstəklənmir (fizika, kimya) | "Bu fənn hələ hazır deyil" + `xəbər ver` |

**Ən vacib qayda:** model şübhə edirsə **uydurmaqdansa `unreadable` qaytarmalıdır.**
Yanlış həll yanlış səhv xəritəsi yaradır; imtina isə yalnız bir təkrar çəkilişə başa gəlir.

### B. Dizayna yeni ekran vəziyyəti lazımdır

`design/Həll ekranı v5.dc.html`-ə beşinci vəziyyət: `oxunmadi`. Mövcud `xeta` vəziyyəti
(`Şəkil serverə çatmadı`) şəbəkə üçündür və mesajı yanlışdır — şəkil çatıb, sadəcə oxunmayıb.

### C. Prompta şəkil qaydaları bölməsi

Aşağıdakı hallar promptda **açıq şəkildə** göstərilməlidir (bax "Şəkil halları" cədvəli).

### D. Şəkil ön emalı — kodda

`llm_client._image_content()` şəkli olduğu kimi base64 edir. Real telefon şəkilləri üçün bu sınır.

## Şəkil halları — real şagird şəkillərində gözlənilənlər

| hal | ehtimal | indiki davranış | tələb olunan |
|---|---|---|---|
| **Şəkildə şagirdin öz (səhv) həlli var** | çox yüksək | model onu verilən kimi qəbul edə bilər | prompt: **yalnız çap olunmuş şərti oxu**, əl yazısı həlli tamamilə görməzdən gəl |
| **Cavab açarı görünür** (topluların sonunda) | yüksək | model cavabı köçürür, çıxarmır | prompt: cavab açarını görməzdən gəl, cavabı özün çıxar |
| **Kadrda bir neçə məsələ** | çox yüksək | ixtiyari seçim və ya qarışdırma | ən mərkəzi/tam olanı seç; qeyri-müəyyəndirsə `multiple_problems` |
| **A/B/C/D variantları var** (DİM formatı) | çox yüksək | istifadə olunmur | son addımın `check.input_kind = "choice"`, `accept` düzgün variantın hərfi + dəyəri |
| **Həndəsə: şəkil/çertyoj var** | yüksək | `canonical` şəkli təsvir edə bilmir | `problem_type = "geometry"`, `canonical`-da fiqur sözlə təsvir edilir; **keş açarı zəifdir** — bunlar keşə düşməməlidir |
| **HEIC formatı (iPhone)** | ~yarısı | `data:image/heic` — əksər API rədd edir | kodda JPEG-ə çevir |
| **12MP, 4–8 MB şəkil** | çox yüksək | tam base64 göndərilir | 1600px-ə kiçilt, JPEG q≈85 |
| **EXIF rotasiya (yan çəkilmiş)** | orta | tətbiq edilmir, model əyri görür | EXIF-ə görə döndər |
| **Parıltı / flaş parlaq səhifədə** | orta | siqnal yoxdur | `ocr_confidence = low` → `düzəliş` axını |
| **Rus dilində məsələ** (rus sektoru) | orta | qeyd olunmayıb | şərti olduğu dildə oxu, **izahları `locale`-a görə yaz** |
| **Məsələ kadrdan kəsilib** | orta | model çatışmayanı **uydurur** ← təhlükəli | `cut_off` qaytar, tamamlama |
| **Ümumiyyətlə riyaziyyat deyil** (selfi, təsadüfi səhifə) | orta (test zamanı) | uydurma məsələ | `not_a_problem` |

## Kod tələbləri (`llm_client.py`)

1. **HEIC → JPEG** çevirmə (`pillow-heif`); mümkün deyilsə aydın xəta
2. **MIME düzəlişi:** `.jpg` → `image/jpeg` (indi `image/jpg` yazılır — bəzi provayderlər rədd edir)
3. **Kiçiltmə:** ən uzun tərəf ≤1600px, JPEG q=85
4. **EXIF rotasiyası** tətbiq edilsin
5. **Yenidən cəhd:** 429/5xx üçün eksponensial gözləmə (3 cəhd). İndi `raise_for_status()`
   bütün run-ı öldürür — 30 şəkildə rate limit demək olar qaçılmazdır
6. Nəticə faylına **şəklin ölçüsü və bayt həcmi** yazılsın (keyfiyyət ↔ dəqiqlik korrelyasiyası üçün)

## Eval tələbləri

- `golden-set.jsonl`-a `expected_status` sahəsi
- **2–3 qəsdən pis şəkil** (bulanıq, riyaziyyat olmayan) — modelin imtina edib-etmədiyini ölçmək üçün
- Yeni metrika: **hallüsinasiya nisbəti** = ground truth `unreadable` olduğu halda modelin həll qaytarması.
  Qapı: **0%.** Bu, digər bütün metrikalardan vacibdir — yanlış həll heç bir həlldən pisdir.
- Ölçü eksperimenti: eyni şəkil 800 / 1200 / 1600px → dəqiqlik və xərc müqayisəsi.
  Ucuzdur, bir dəfə edilir, bütün istehsalat xərcini təyin edir.

## Nəticələr

**Müsbət:** uydurma həllər dayanır; `düzəliş` axını nə vaxt açılacağını bilir; şəkil xərci
proqnozlaşdırıla bilir; real şəkillərdə ilk gündən sınmır.

**Mənfi:** sxem mürəkkəbləşir (`if/then`); dizayna bir ekran vəziyyəti əlavə olunur;
prompt uzanır (token xərci artır — ölçüləcək).

**Qəbul edilən risk:** model həddindən artıq ehtiyatlı olub oxunaqlı şəkillərə də `unreadable`
deyə bilər. Faza 0-lite bunu ölçəcək — 10 şəkildən 8-i oxunaqlıdırsa və model 3-ünə imtina
edirsə, qayda yumşaldılır.
