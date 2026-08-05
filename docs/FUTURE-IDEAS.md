# FUTURE-IDEAS

> **Bunlar backlog deyil, planlaşdırılmış iş deyil.** Heç biri Faza 4-dən əvvəl başlanmır.
> Burada olmalarının səbəbi: data modelinə təsir edirlər, ona görə indidən bilinməlidirlər.
>
> Claude Code üçün: **bu fayldakı heç nə tapşırıq deyil.** Kod yazma.
> Yalnız sxem qərarı verərkən "bu, gələcəkdə X-i mümkünsüz edirmi?" sualına cavab üçün oxu.

## Süzgəc

Hər yeni funksiya ideyası bu sualla ölçülür:

> **Bu funksiya səhv xəritəsini yaxşılaşdırır, yoxsa sadəcə app-də keçirilən vaxtı uzadır?**

Birincidirsə — məhsulun özüdür. İkincidirsə — başqa bir məhsuldur, sadəcə eyni app-in içində.

## Strateji çəngəl — bunu bilərək seç

| | **Diaqnostik alət** (cari) | **Engagement app** (Duolingo modeli) |
|---|---|---|
| İstifadə | epizodik (ev tapşırığı olanda) | gündəlik vərdiş |
| Ödəyən | valideyn | şagird / IAP |
| Metrika | səhv xəritəsinin dəqiqliyi | DAU, sessiya uzunluğu |
| Risk | az istifadə → az qavranılan dəyər | valideyn "oyun oynayır" görüb ləğv edir |

Aşağıdakı 4 ideya app-i ikinci istiqamətə çəkir. İkisi də etibarlı bizneslərdir, amma **fərqli metrikaları optimallaşdırırlar** və bir nöqtədə ziddiyyət təşkil edirlər. Şüursuz sürüşmə ən pis nəticədir.

---

## 0. Öncül şərt — variant generasiya mühərriki

**Siyahıda yoxdur, amma dördündən vacibdir.**

`Eynisini sən həll et` dizaynda artıq var: eyni tipli, fərqli ədədlərlə məsələ. Bunu ayrıca
mühərrik kimi qursan, aşağıdakı dördü də ondan qidalanır:

- memory cards → variant = kartın arxa üzü
- test bankı → variant = yeni sual
- oyunlar → variant = raund məzmunu
- köçürməyə qarşı döngə → artıq işləyir

**Bir mühərrik, dörd funksiya.** Aşağıdakılardan hər hansı birinə başlamazdan əvvəl bu olmalıdır.

Data təsiri: `problems` cədvəlinə `template_id` və `params` sütunları lazım olacaq —
`x^2 - {b}x + {c} = 0` şablonu + parametr diapazonu. Faza 2 miqrasiyasında nəzərə al.

---

## 1. Memory cards — spaced repetition

**Qiymət: ən güclüsü. Faza 4-ün birinci namizədi, hətta daha əvvəl.**

Şagirdin əzbərləməkdə çətinlik çəkdiyi düstur və qaydaların təkrarı.

**Niyə güclüdür:**
- Kartlar **şagirdin öz `step_events` datasından avtomatik doğulur** — məzmun xərci sıfır
- Keçən dəfə qaldırılan retensiya problemini həll edir: ev tapşırığı hər gün yoxdur, təkrar var.
  Gündəlik açmaq üçün legitim səbəb (streak-dən daha sağlam mexanika)
- Valideyn hesabatına konkret sətir verir: *"bu həftə 12 kart təkrarladı, İŞARƏ İTDİ 6 → 2"*
- Süzgəcdən keçir: səhv xəritəsini **yaxşılaşdırır**

**Tələ:** ümumi flashcard funksiyası qurmaq. O, Anki/Quizlet ilə rəqabətdir və uduzur.
Yalnız `error_code` və `topic_code`-dan generasiya olunan kartlar fərqləndiricidir.

**Data təsiri:** `cards` (problem/error-dan törəmə), `card_reviews` (SM-2 və ya FSRS intervalı).
`step_events` onsuz da lazım olan hər şeyi saxlayır — əlavə loqlama tələb etmir.

---

## 2. Gamification — oyunlar və credits

**Qiymət: formatlar bəli, credits iqtisadiyyatı yox.**

Krossvord, "Kim milyonçu olmaq istəyir", "Time attack" + credits/points sistemi.

**İki ciddi problem:**

1. **Credits abunə ilə rəqabət aparır.** Ödənişli xidmətləri credits ilə açmaq ikinci valyuta yaradır.
   Qazanma sürəti ucuzdursa abunəni yeyir; bahalıdırsa şagird aldadılmış hiss edir. Ortası yoxdur.
   Üstəlik credits qazanmaq üçün oynamaq server/LLM xərci yaradır, gəlir yaratmır.
2. **Ödəyən valideyndir.** 5 ₼ ödədiyi "riyaziyyat köməkçisi"ndə uşağın krossvord həll etdiyini
   görən valideyn ləğv edir. Bu, ən dərin gərginlikdir və dizaynla həll olunmur.

**Üçüncü, daha incə problem:** `time attack` pedaqogika ilə ziddiyyət təşkil edir. Məhsulun bütün
mesajı *"yavaşla, hər addımı özün et"*dir. Sürət oyunu əks mesajdır.

**İşləyən versiya:**
- Oyun formatları **məsələ bankından** qidalansın (variant mühərriki, §0) — məzmun xərci sıfır
- Raundlar şagirdin **zəif `error_code`-larından** seçilsin — onda oyun = məşqdir, əyləncə deyil
- **Credits yalnız kosmetika alsın.** Onda iki valyuta rəqabət etmir:
  **abunə = fayda, credits = görünüş**

**Data təsiri:** `credits_ledger` (append-only, balans hesablanır, saxlanılmır),
`cosmetic_items`, `user_cosmetics`. Credits **heç vaxt** fayda açmır — bunu sxem səviyyəsində
qeyd et ki, sonradan "bir dəfəlik" istisna edilməsin.

---

## 3. Blog / Reels + tövsiyə alqoritmi

**Qiymət: əvvəlcə bir suala cavab lazımdır.**

> Bu, **retensiya funksiyasıdır**, yoxsa **müştəri cəlbi kanalıdır**?

İkisi fərqli məhsuldur:
- **Retensiya:** app içində lent (dizaynda `Reels lenti` artıq var) — məsələ bankından generasiya
- **Cəlb:** SEO bloqu, ayrıca sayt, ayrıca investisiya, app-in içində yeri yoxdur

**Alqoritm hələ tezdir.** Sənin miqyasında bu sadə qayda hər hansı ML tövsiyə sistemini üstələyir:

```
lent = f(şagirdin son 7 gündəki top error_code-ları, cari topic_code)
```

Minlərlə DAU olmadan alqoritm quraşdırmaq ölçülə bilməyən mürəkkəblikdir.

**Data təsiri:** `feed_items` (mənbə: `error_code` / `topic_code`), `feed_events` (baxıldı, bəyənildi,
saxlanıldı). Manual məzmun **qadağandır** — hər kart bir `error_code` və ya `topic_code`-a bağlı olmalıdır.

---

## 4. Leaderboard + profil kosmetikası

**Qiymət: standart versiya istifadəçini öldürür; iki dəyişikliklə işləyir.**

**Niyə standart leaderboard təhlükəlidir:**
- Açıq reytinq alt 80%-i demotivasiya edir. Ən çox köməyə ehtiyacı olan şagird ən aşağıda oturur,
  sonra gedir. Ed-tech-də yaxşı sənədləşdirilmiş nəticədir.
- **Həcmə görə** sıralama səni pul itirməyə məcbur edir (daha çox şəkil = daha çox LLM çağırışı)
  və yanlış davranışı mükafatlandırır
- **Dəqiqliyə görə** sıralama çətin mövzuya girən şagirdi cəzalandırır

**İşləyən versiya:**
- **Kohort** — öz sinfi/məktəbi və ya ~20 oxşar səviyyəli şagird. Hər kəs nəyinsə top-5-i ola bilər.
- **İrəliləyişə görə** sıralama — *"bu həftə ən çox irəliləyən"*. Zəif şagird də birinci ola bilər.
  Bu, hədəf istifadəçin üçün yeganə motivasiyaedici formadır.
- **Opt-in**, defolt yox.

**Profil kosmetikası — strateji olaraq sağlamdır.** Səbəb: **valideyndən yox, şagirddən gələn
yeganə gəlir xətti**, və öyrənməni kilidləmir. Amma yeniyetmənin kartı yoxdur → real yol:
credits (§2) ilə qazanılsın, nadir predmetlər valideyn kartından alınsın.

**Data təsiri:** `cohorts`, `weekly_snapshots` (irəliləyiş hesablamaq üçün keçən həftənin
aqreqasiyası lazımdır — bunu Faza 2-dən **snapshot kimi saxla**, sonradan geriyə hesablamaq mümkün olmayacaq).

---

## Faza 2 üçün konkret nəticə

Bu ideyaların heç biri indi qurulmur, amma üçü **indi verilməli qərar** yaradır:

- [ ] `problems` cədvəlinə `template_id` + `params` (variant mühərriki üçün)
- [ ] `weekly_snapshots` cədvəli — irəliləyiş sonradan geriyə hesablana bilməz
- [ ] `credits` sxeminə **"fayda açmır, yalnız kosmetika"** qaydası kommentlə yazılsın

Qalanı sonra əlavə oluna bilər və indi düşünülməməlidir.
