# Hub dürüstlüyü, implementasiya planı

Tarix: 2026-08-25. Yalnız plan. Kod yox, HANDOFF yox, ClickUp yox.

Auditor tapıntıları 1–7 birinci gəmidə bağlanır. 8–11 backlog dilimində qalır. Valideyn məhsulu, tam i18n, reels, paywall və SolveView resume qurulmur.

## Problem + grounded model

Hub iki fərqli şeyi bir vitrinə yığır. Birincisi realdır: şəkil, kaskad, addım-addım həll, `error_code` yazılması, dəvət kodu ilə giriş. İkincisi vitrindir: valideyn rolu, dörd dil, həftə/ay filtri, orta vaxt, reels lenti, "davam" düyməsi. Vitrin düymələri basılanda reklam etdikləri işi görmür. Şagird yoxdur deyə production qırılmır, amma ilk real dəvət bu yalanlarla qarşılaşacaq.

Necə işləyir bu gün.

Profil yerli `localStorage`-dır, server hesabı deyil. `getStoredProfile` / `saveProfile` `web/lib/profile/storage.ts`-də `th_*` açarlarını oxuyur-yazır. `onboarded` yalnız `th_onboarded === "true"` olanda doğrudur. Köhnə `th_device_id` artıq avtomatik onboard sayılmır. Ana səhifə `useEffect`-də `onboarded` yoxdursa `/onboarding`-ə atır. Onboarding bitəndə `persistAndGo("/")` yazır, kameraya yox.

Giriş qapısı onboarding deyil. `InviteGate` yalnız `/kamera` və `/bank` üzərindədir, `POST /api/invite/check` ilə. Ana səhifə qapısızdır, `BottomNav` var. Kamera və onboarding-də `BottomNav` yoxdur. Bankın dəvət mərhələsi `InviteGate`-i tək qaytarır, nə `BottomNav` nə geriyə yol. URL `?invite=` `validateAndStoreInviteCode` ilə API-yə gedir, amma `device_id` göndərmir. Profil səhifəsində "Kodu dəyiş" `window.prompt` + `saveProfile({ inviteCode })` yazır, API-yə toxunmur. Eyni `th_invite_code` açarını üç yer yazır: `InviteGate`, `saveProfile`, `lib/invite/url.ts`.

Valideyn addımı mətn vəd edir: hesab bağlanır, ödəniş və hesabat valideynə gedir. Seçəndən sonra axın yenə sinif, imtahan hədəfi, şagird kamerasıdır. `Role = "valideyn"` saxlanılır, heç bir marşrut onu oxumur. Növbəti ekranlarda yalnız nişan dəyişir.

Dil seçimi `th_locale`-ə yazılır və `kamera` formu `locale` + `grade` + `pedagogical_tone` göndərir. `web/i18n/request.ts` `ACTIVE_LOCALE = "az"`-dır. `layout.tsx` `lang="az"`. UI heç vaxt ru/en/tr olmur. Profil "Tətbiq dili" deyir. Bu, yalan əlçatanlıqdır.

Sinif real oxucuya malikdir. `ThemeToneSync` 5–8 `genc`, 9–11 `yetkin` edir. `/api/solve` və transcribe `form.grade`-i `{{grade}}` promptuna qoyur. Hədəf `th_goal` yazılır, bank və həll onu oxumur. Bank `GET /api/bank/questions` bütün sinifləri qaytarır, qruplarda sinif etiketi göstərir, filtr yoxdur. Onboarding mətni deyir ki, izahın dərinliyi və lent mövzuları sinfə görə seçilir. Dərinlik qismən doğrudur. Lent mövzuları yalandır, çünki lent yoxdur.

Üslub realdır. `/uslub` `pedagogicalTone` yazır. Qat 5 və monolit `pedagogicalToneAddendum` əlavə edir. Bunu sındırma.

Tarixçə `SolveView`-dən gəlir. Mount-da `completed: false` yazılır, unmount-da incomplete qalır, `reveal()`-də `completed: true`. `id` `attemptId`-dir. Addımlar localStorage-da yoxdur. Ana səhifə bölməsi həmişə "YARIMÇIQ QALDI" adlanır, içində bitmiş sətirlər də var. Incomplete "davam" `/kamera`-ya gedir, yeni çəkiliş. Completed "bax" `/profil`-ə gedir, həllə yox. Resume ucuz deyil. ADR-017 addımları klientdə saxlamağı qadağan edir. Düyməni "davam" adlandırmaq olmaz.

Hesabat `getProgressReport()` period qəbul etmir. Profil `period` state-i yalnız düymə etiketini dəyişir. `avgTimeMinutes/Seconds` həll varsa 2 və 14-dür. `immediateAnswerCount` incomplete sayıdır, reveal sayı deyil. `selfStepPercent` bitmiş/cəmi nisbətidir, "özü keçdiyi addımlar" deyil. Səhv sayğacı `recordErrorCode` ilə realdır, 11 kodlu whitelist. Mövzu başlıqları `item.topicTitle`-dandır, DB `title_az`. Sıfır səhvdə mətn "əla nəticədir!" deyir.

Lent kartı "40 saniyə · 3 kart" `/bank`-a gedir. Reels yoxdur.

`az.json` içində `topics.ALG.*` nöqtəli açarlar var. next-intl `.`-i yuva yolu sayır. Namespace heç yerdə `useTranslations("topics")` ilə oxunmur, amma dev overlay INVALID_KEY göstərib klikləri bloklayır. Mövzu adı artıq DB-dən gəlir.

SolveView toxunulmur: növbəti addım düzgün cavabsız sönük, `inputMode=decimal`, "Cavabı göstər" yalnız son addım, distraktor mesajı saxlanılır, `error_title` `needs_review = false` olanda gəlir. Orta addımda ipucu + səhv cəhddən sonra `POST /api/steps/pass` qapağı **bilərəkdən** var. Bunu reqressiya sayma.

İcraçının ilişəcəyi, vitrindən ayrı kəskin kənarlar:

- `touchStreak` yeni istifadəçidə 1-də ilişir. `lastActiveDate` oxunanda bu gün default-lanır, yazılmır. `touchStreak` "artıq bu gün" görür, heç vaxt persist etmir.
- `selfStepPercent` bitirmə nisbətidir. Bitirmək son addımda `reveal()` tələb edir. "Özü keçdiyi addımlar" yalandır.
- Kamera `setSolution` çox vaxt `topicTitle` ötürmür. Bank ötürür. Tarixçə kamerada kanonik mətnə və ya "Riyazi məsələ"yə düşür.
- Ana səhifə onboarding redirect-i `useEffect`-dədir. İlk boya hub-dur, sonra `/onboarding`.
- `/kamera` və `/bank` `onboarded` yoxlamır. Dərin link onboarding-i keçir.
- Bank `?invite=` oxumur. WhatsApp linki yenə əl ilə yazdırır.
- GET-attempt API yoxdur. Resume üçün yeni endpoint lazımdır, P0-da yoxdur.
- `saveHistoryItem` eyni `attemptId` üçün upsert. Reveal-dən sonra unmount `completed: false` yaza bilər. Duplicate-də `completed` qalib gəlməlidir.

## Usage

Plan gəmidən sonra ilk dəfə açan şagird bunu görür.

1. `/` onboard olmayıbsa `/onboarding`. Üç addım: ad, sinif, Başla. Dil yox. Valideyn yox. Hədəf yox. Ad boş qala bilər, skip 44px. Bitəndə ana səhifə.
2. Ana səhifə. Ad varsa "Salam, Ad!". CTA "Tapşırığı çək" → `/kamera`. Bank CTA qalır. Reels kartı yoxdur. Tarixçə boşdursa dürüst boş vəziyyət. Dolu olsa "SON HƏLLƏR", status mətni bitib/yarımçıq, düymə "davam" deyil.
3. `/kamera` dəvətsizdirsə `InviteGate`: başlıq, gövdə, `aria-label` olan input, təsdiq, altında PWA qeydi, yuxarıda "Ana səhifə". Kod `POST /api/invite/check` keçməsə localStorage-a yazılmır. Keçəndən sonra kamera.
4. Həll bitəndə və ya tərk ediləndə tarixçə yenilənir. Ana səhifəyə qayıdanda yarımçıq sətir "yenidən çək" kimi kameraya apara bilər, resume kimi yox. Bitmiş sətir həllə qayıtmır.
5. `/profil` real rəqəmlər: cəhd/bitmiş say, təkrar səhvlər, mövzu, bu həftənin sütunları. Həftə/ay/hamısı düyməsi yoxdur. Orta vaxt yoxdur. "Cavaba dərhal baxdı" yoxdur. Dil çipləri yoxdur. Valideyn nişanı yoxdur. Dəvət kodu göstərilir, "Kodu dəyiş" qapıya qaytarır, `prompt`-a yox.
6. `/uslub` əvvəlki kimi Qat 5-ə gedir.

Çağırış yerləri, icraçı bunları yazır.

```ts
import { getStoredProfile, saveProfile, getProgressReport, getHistoryItems } from "@/lib/profile/storage";
import { getStoredInviteCode, clearStoredInviteCode } from "@/components/kamera/InviteGate";

const profile = getStoredProfile();
saveProfile({ fullName, grade, onboarded: true });

const report = getProgressReport();
report.avgTimeMinutes; // type error, sahə yoxdur
saveProfile({ role: "valideyn" }); // type error
saveProfile({ inviteCode: "x" }); // type error, dəvət profil müqaviləsində deyil
```

Kamera formu əvvəlki kimi `grade`, `locale: "az"`, `pedagogical_tone` göndərir. `SolveView` `saveHistoryItem` / `recordErrorCode` çağırışını saxlayır, yalnız `completed: boolean` əvəzinə `status: "paused" | "completed"` yazır.

## Shape

Dürüstlük tiplərdədir. Səhifələr `localStorage` açarlarını birbaşa təxmin etmir.

```ts
// web/lib/profile/types.ts
export type Locale = "az";
export type PedagogicalTone = "dostyana" | "yetkin" | "qisa";
export type VisualTone = "genc" | "yetkin";
export type Grade = 5 | 6 | 7 | 8 | 9 | 10 | 11;

export type ProfileData = {
  deviceId: string;
  fullName: string;
  locale: Locale;
  grade: Grade;
  visualTone: VisualTone;
  pedagogicalTone: PedagogicalTone;
  onboarded: boolean;
  streakDays: number;
  lastActiveDate: string;
};

export type HistoryItem = {
  id: string;
  topicCode: string;
  topicTitle: string;
  canonical: string;
  stepsCount: number;
  errorCodesCount: number;
  timestamp: number;
  status: "paused" | "completed";
  currentStepIndex?: number;
};

export type ErrorStats = { code: string; label: string; count: number };
export type TopicStats = {
  topicCode: string;
  title: string;
  totalAttempts: number;
  completedCount: number;
  masteryPercent: number;
};

export type ProgressReport = {
  totalAttempts: number;
  completedCount: number;
  pausedCount: number;
  repeatedErrors: ErrorStats[];
  topicMasteries: TopicStats[];
  weeklyActivity: number[];
};
```

`Role` və `Goal` yoxdur. `inviteCode` profil obyektində yoxdur. `ProgressReport`-da `avgTime*`, `immediateAnswerCount`, `selfStepPercent`, `summaryText` yoxdur. Xülasə mətnini UI `completedCount` + birinci mövzu başlığından qurur.

```ts
// web/lib/profile/storage.ts  — dərin modul, açar adları burada qalır
export function getStoredProfile(): ProfileData;
export function saveProfile(
  partial: Partial<Pick<ProfileData, "fullName" | "grade" | "pedagogicalTone" | "visualTone" | "onboarded" | "streakDays" | "lastActiveDate">>
): ProfileData;
export function touchStreak(): ProfileData;
export function getHistoryItems(): HistoryItem[];
export function saveHistoryItem(item: HistoryItem): void;
export function recordErrorCode(code: string): void;
export function getProgressReport(): ProgressReport;
```

Migrasiya oxu zamanı. `th_role` / `th_goal` qalsa da ignore. Köhnə `completed: boolean` sətirləri `status`-a çevrilir. `th_locale` nə olursa olsun qaytarılan `locale` `"az"`-dır. `saveProfile` `th_invite_code` yazmır.

```ts
// InviteGate / lib/invite/url.ts  — girişin tək yazıçısı
export function getStoredInviteCode(): string | null;
export function clearStoredInviteCode(): void;
export async function validateAndStoreInviteCode(code: string): Promise<boolean>;
// P1: body-yə device_id əlavə et, InviteGate ilə eyni POST
```

Modul xəritəsi.

| Modul | Sahib olduğu qərar |
|---|---|
| `web/lib/profile/types.ts` | Nə saxlamaq olar, nə yalan danışmaq olmaz |
| `web/lib/profile/storage.ts` | Persist, migrate, report törəməsi, error whitelist |
| `web/lib/profile/tone-prompt.ts` | Qat 5 addendum, dəyişməz |
| `web/components/kamera/InviteGate.tsx` | Validasiyalı dəvət yazısı, chrome + a11y |
| `web/lib/invite/url.ts` | URL kodu çıxarma + eyni API |
| `web/app/onboarding/page.tsx` | Ad + sinif, başqa addım yox |
| `web/app/page.tsx` | Dürüst CTA və tarixçə |
| `web/app/profil/page.tsx` | Report + tənzimləmə, yalan kontrol yox |
| `web/components/profil/StatCard.tsx` | Yalnız `ProgressReport` sahələri |
| `web/components/hell/SolveView.tsx` | Yalnız `saveHistoryItem` forması, pedaqogika yox |

İnterfeys dərinliyi. İctimai səth kiçilir: səhifə `role`/`goal`/`avgTime` görmür. Mürəkkəblik `storage.ts`-də qalır, köhnə açarları oxumaq, visualTone-u sinifdən törətmək, hesabatı yalnız mövcud hadisələrdən qurmaq. `web/lib/profile/index.ts` re-export faylı əlavə etmə. Yalnız ötürən qat lazım deyil.

Nə etmir bu forma. Valideyn app. next-intl locale routing. Bank SQL-ə `grade = $1` P0-da. Reels. Attempt resume. Ödəniş. `error_code` enum dəyişikliyi. `DESIGN-TOKENS` / `STEP-SCHEMA` / `TELEMETRY` redaktəsi.

## Synthesis decision

İki forma çəkildi.

**A. Subtract-in-place.** Eyni beş addımlı onboarding, eyni ekran topologiyası. Yalan düymələr silinir və ya etiketi dəyişir. Tiplər hələ `Role = "valideyn"`, `Locale = "az"\|"ru"\|"en"\|"tr"`, `avgTime` saxlaya bilər. Səhifələr dürüst davranmağa razılaşır.

**B. Honest contract.** Tiplər yalanı ifadə edə bilmir. Dəvət profil sahəsi deyil. Onboarding ad+sinifə qədər kiçilir. Hesabat yalnız hesablanan sahələrdir. Tarixçə sessiya deyil, jurnal.

B qazandı. A-nın ictimai səthi böyük qalır, siyasət səhifələrə səpələnir. `saveProfile({ role: "valideyn" })` və `saveProfile({ inviteCode })` yenə mümkün olar, növbəti PR yenə yalan yazardı. B bu yolları tiplə bağlayır. Dəvəti `InviteGate`-ə yığmaq `window.prompt` sıfırlamasını təsadüfən qaytarmağı da çətinləşdirir.

A-dan götürülən. Ekran topologiyası: `/`, `/profil`, `/bank`, `/kamera`, `/uslub` qalır. Sinif seçimi qalır, çünki real oxucusu var. Streak qalır, amma P0-da `touchStreak` bug-u düzəldilir ki, 1-də ilişməsin. Üslub qalır. InviteGate kamera/bank-da qalır, onboarding-ə köçürülmür. A-nın `ProgressPeriod = "all_time"` ideyası: period tipi ümumiyyətlə olmasın, sahə yoxdur.

B-dən götürülən, qat dəyişmədən. Dəvətin tək yazıçısı `claim` / mövcud `InviteGate` + `validateAndStoreInviteCode`. Duplicate `attemptId`-də `completed` `abandoned`-i əzir. `selfStepPercent` gizlənir və ya `completedCount / totalAttempts` kimi iki say göstərilir, "özü keçdi" adı yox. Kamera və UI eyni `az` sabitini oxusun. `ProfileEdit`-ə `inviteCode` qoymamaq.

A-nın rəddi. Dil addımını "izah dili" adı ilə saxlamaq. Hədəf addımını "hələ istifadə olunmur" qeydi ilə saxlamaq. `PedagogicalTone`-u `gentle`/`strict` etmək. Üslub `dostyana`/`yetkin`/`qisa` qalır, Qat 5 addendum dəyişməz. `getProgressReport({ userId })` yox. Auth yoxdur.

B-nin rəddi. `keys.ts` / `migrate.ts` / `log.ts` / `report.ts` ayırmaq temporal parçalamadır, eyni qərarı dörd fayla səpələyir. `storage.ts` qalır. `requireInviteOrGate` + branded `InviteCode` + `useProfile` skeleton P0-da lazım deyil. Mövcud `InviteGate` və `getStoredProfile` dərinləşir, yeni qat yığılmır.

Red-flag yoxlaması. A sızdırır: `th_invite_code`-u üç yazıçı paylaşır. B-nin təklif etdiyi `ProfileStore` obyekti dərin olardı, amma dörd fayla bölünəndə dayazlaşır. Seçilən forma: bir `storage.ts`, dəvət `InviteGate` modulunda, tiplər yalanı kəsir.

## Tradeoffs accepted

- Valideyn mətnini və rolu silirik, gizli parent app əvəzinə. Gələcək parent axını onboarding-ə addım qaytaracaq, enum-a `valideyn` əlavə edəcək. İndi yoxdur, göstərmirik.
- Dil seçimini silirik. `locale` tipdə yalnız `"az"` qalır ki, solve formu dəyişməsin. Tam i18n gələndə `Locale` yenidən açılır, `ACTIVE_LOCALE` dəyişir. O, Cowork işidir.
- Hədəfi silirik. DİM/buraxılış fərqi bankı və promptu dəyişmir. Saxlamaq reklam olardı.
- Resume qurmuruk. Yarımçıq sətir "davam" demir. Addımları klientə yazmaq ADR-017-ni pozardı. Serverdən attempt bərpası ayrıca işdir.
- Hesabatda orta vaxt və "dərhal baxdı" gizlənir, stub rəqəm əvəzinə. Period filtri silinir. `weeklyActivity` artıq bu həftədir, ona görə "BU HƏFTƏ" etiketi düzgündür, seçim yoxdur.
- İki qapı qalır. Onboarding profil, InviteGate giriş. Birləşdirmirik. Dəyişən: qapıda geriyə yol və onboarding-in giriş vəd etməməsi.
- Bank P0-da bütün sinifləri göstərməyə davam edir. Sinifə görə kəsmək kiçik SQL-dir, amma "dürüstlük"dən çox yeni filtr siyasətidir. İlkin qərar versin.
- `storage.ts` bir modul qalır. `keys.ts` / `migrate.ts` / `log.ts` / `report.ts` açılmır.

## Alternatives considered

- **Subtract-in-place, 5 addım qalır.** İtirdi, çünki yalan tiplərdə yaşayırdı. Çağıran hələ `Role` və `Goal` öyrənməli idi. "Hədəf, hələ istifadə olunmur" etiketi yenə ölü sahə saxlayır.
- **`storage.ts`-i keys/migrate/log/report-a bölmək.** İtirdi. Eyni persist qərarı dörd sərhəddən keçər. Oxuyan dörd fayl axtarır.
- **InviteGate-i onboarding-ə qoymaq.** İtirdi. Profil və giriş qarışır. Kodsuz şagird ad belə yaza bilməzdi. ADR-012 dəvəti ödəniş/giriş qapısı saxlayır. Validasiyasız `prompt` isə qadağandır.
- **Locale picker-i "izah dili" etmək, UI az qalsın.** İtirdi. Şagird ru basır, ekran az qalır. LLM-ə ru göndərmək də tam i18n-in yarımçıq stub-udur, bu tapşırıq onu qurmur.
- **Hesabatı server `attempts`-dən oxumaq.** Dərin olardı, amma Faza 1-də auth yoxdur, cihaz localStorage-dır, soak ayrı `kind`-dir. P0 üçün yerli törəmə kifayətdir. Yalan rəqəm gizlətmək server roundtrip-dən ucuzdur.
- **Tarixçəni tam silmək.** Həddən artıq. Yazı realdır, yalnız CTA yalandır.

## Sequenced implementation

### P0. Dürüst müqavilə və yalan kontrollar

1. `web/lib/profile/types.ts` — yuxarıdakı tiplər. `Role`, `Goal` sil. `Locale = "az"`. `ProgressReport` fake sahəsiz. `HistoryItem.status`. `ErrorStats.parentNote` sil, istifadə olunmur.
2. `web/lib/profile/storage.ts` — `saveProfile` dəvət/rol/hədəf/locale yazmır. `getStoredProfile` locale həmişə `"az"`, role/goal qaytarmır, invite qaytarmır. `getHistoryItems` köhnə `completed` boolean-u `status`-a map edir. Eyni `id` üçün `completed` `paused`-i əzir. `getProgressReport` yalnız real sayğaclar. `avgTime` hardcoded silinir. `touchStreak`: default `lastActiveDate` oxunanda yazılmırsa, bu günü persist et, 1-də ilişmə.
3. `web/lib/profile/storage.selftest.mts` — `role: "valideyn"` assert-i çıxar. Report-da `avgTime` yoxdugunu, `immediateAnswerCount` yoxdugunu yoxla. `status: "completed"` yaz. Köhnə `{ completed: true }` JSON-unun oxunduğunu yoxla.
4. `web/app/onboarding/page.tsx` — addımlar: ad, sinif, Başla. Role/locale/goal UI sil. `saveProfile({ fullName, grade, onboarded: true })`. Skip default sinif 9, ad boş. Skip düyməsinə `minWidth: 44`, `padding` sıfır olmasın. `az.json` `onboarding.step3Body` yalnız izah dərinliyi + vizual ton desin, lent/mövzu vəd etməsin. `step2Body` / role* / goal* / dil addımı açarları silinə və ya ölü qala bilər, çağırılmamalıdır.
5. `web/app/page.tsx` — `historyTitle` "SON HƏLLƏR" və ya ekvivalent. Incomplete klik `/kamera`, etiket `historyResume` yox, "yenidən çək" / mövcud `historyRetry`. Completed klik yox və ya eyni "yenidən çək", `/profil`-ə "bax" yox. Feed section tam sil. `az.json` `feed*` açarları ölü qalsın, UI-də olmasın.
6. `web/app/profil/page.tsx` — `period` state və düymə sil. Dil çipləri sil. Role nişanı yalnız şagird və ya nişansız. `handleResetCode` P0-da ya gizlət, ya `clearStoredInviteCode()` + `router.push("/kamera")`. `window.prompt` ilə kod yazma. Grade switcher qalır, `applyVisualToneFromProfile` qalır. `/uslub` linki qalır.
7. `web/components/profil/StatCard.tsx` — `immediateAnswerLabel` və `avgTime*` sətirləri sil. Hero `completedCount` və ya `totalAttempts`, etiket həqiqəti desin. `selfStepPercent` gizlət. Bitirmək `reveal()` tələb edir, "özü keçdi" deyil. İki say olar: bitmiş və cəhd. Uydurma `%` yox. Report `useState` mount-once qalırsa period düyməsi onsuz da yoxdur. Dəyişəndən sonra oxumaq lazımdırsa, save-dən sonra yenidən `getProgressReport()` çağır.
8. `web/components/kamera/InviteGate.tsx` — input-a `aria-label={t("placeholder")}` və ya ayrıca `invite.inputLabel`. `id` + vizual label. `onBack?: () => void` və ya daxili `router.push("/")` "Ana səhifə" 44px. Placeholder-only olmasın.
9. `web/app/kamera/page.tsx` və `web/app/bank/page.tsx` — invite stage-də geriyə yol. Bank invite-də `BottomNav` məcburi deyil, "Ana səhifə" kifayətdir.
10. `web/messages/az.json` — yuxarıdakı copy. `onboarding.roleParent*` vədini sil. `profil.period*` UI-dən çıxır.

P0-da qurma. Parent axını. `messages/ru.json`. Bank `where q.grade = $1`. Reels. Resume. `window.prompt` ad redaktəsi hələ qala bilər.

### P1. Dəvət sahibliyi və overlay

1. `saveProfile` / `ProfileData` dəvəti tam tərk etdikdən sonra `AppHeader` badge `getStoredInviteCode()` oxusun.
2. `web/lib/invite/url.ts` `validateAndStoreInviteCode` body-yə `device_id: getDeviceId()` qoysun, `InviteGate.submit` ilə eyni. `url.selftest.mts` extract testlərinə toxunma, ayrı check testi əlavə etmək istəyirsənsə fetch mock, məcburi deyil.
3. `az.json` `topics` namespace sil. Nöqtəli açar qalmasın. `TopicMastery` `top.title` istifadə etməyə davam edir.
4. Profil dəvət "Kodu dəyiş" həmişə qapıya. CaptureView mövcud reset qalır, o da `InviteGate`-ə qayıdır, `prompt` yox.
5. `web/app/bank/page.tsx` `?invite=` / `?code=` oxusun, kamera və home ilə eyni `validateAndStoreInviteCode`.
6. Kamera `setSolution` transcript-dən gələn mövzu başlığını `topicTitle` kimi ötürsün, tarixçə boş qalmasın. Yoxdursa kanonik mətn, xam `ALG.*` kodu yox.

### P2. Backlog, birinci gəmi deyil

8. Tap: onboarding skip `minWidth` 44 P0-da da edilə bilər, qalanı burada. Profil locale çipləri P0-da silinir, ölçüsü ölür. `AppHeader` PROFİL `Link` `minHeight: 44`, `alignItems: center`.
9. `WeaknessDiagnosis` `emptyErrors`: `totalAttempts === 0` olanda tərif yox, "hələ səhv xəritəsi yoxdur". Sıfır səhv amma həll varsa tərif olar.
10. next-intl dotted keys P1-də silinir. Qalarsa P2 təkrar yoxla.
11. Ad redaktəsi üçün `window.prompt` əvəzinə inline input. Dəvət sıfırlaması P0/P1-də qapıdadır.

### Verification

Brauzer, mobile eni 390.

- Təmiz localStorage: `/` → onboarding. Valideyn və dil yox. Bitir → ana. Lent kartı yox.
- Ana → kamera → InviteGate. Geri → ana, `BottomNav` görünür. Kod yaz, keç, kamera açılır.
- Bank eyni qapı, geri ana.
- Bir həllə başla, tərk et, ana: yarımçıq status, "davam" mətni yox. Klik resume etmir, kameraya yeni axın.
- Həlli bitir, ana: bitmiş status, `/profil`-ə "bax" yox.
- Profil: period düyməsi yox, 2:14 yox, "dərhal baxdı" yox. Dil çipi yox. Sinif dəyiş → vizual ton dəyişir.
- `/uslub` dostyana seç, kamera həlli Qat 5 addendum-u saxlayır. SolveView: növbəti addım səhv cavabla sönük, "Cavabı göstər" orta addımda yox. İpucu + səhvdən sonra orta addım `pass` qapağı işləyir, reqressiya deyil.
- Mövcud `th_role=valideyn` + `th_onboarded=true`: onboarding-ə məcbur yox, şagird kimi işləyir.
- `npx tsc --noEmit` `web/`. `npx tsx lib/profile/storage.selftest.mts`. Invite URL selftest.

## Blitz qərarları (2026-08-26)

Yalan kontrollar UI-dən çıxır. `Role` / `Goal` / `Locale` / `inviteCode` tiplərdə qalır ki, növbəti həftə parent, i18n, hədəf, dəvət slotunu yenidən qazmayaq. Plan B müqavilə kəsimi blitz-ə ziddir: eyni enum-ları silib 3 gün sonra qaytarmaq.

- Bank bütün siniflər. Filtr siyasətdir, dürüstlük yox. Sinif artıq LLM dərinliyinə gedir.
- Yarımçıq sətir "yenidən çək" → `/kamera`. Ölü sətir resume-dən pisdir. Bitmiş sətir düymə deyil.
- Ad boş qala bilər. Soak və skip sürəti birinci dalğadır.
- `locale` profildə qalır, picker yoxdur. Kamera formu `profile.locale` göndərməyə davam edir.
- StatCard hero bitmiş həll sayıdır. Cəhd sayı kiçik sətirdə. Fake % / 2:14 / "dərhal baxdı" göstərilmir.
- Streak açılış günüdür, həll seriyası deyil. Ana rəqəmin altına mövcud `streakDays` mətni.
- FOUC qalır. Cookie-siz server redirect bu dilimə dəyməz.

## Next implementation step

Bu qərarlarla P0 UI dürüstlüyünü yaz: onboarding ad+sinif, lent/period/dil/fake metrik sil, InviteGate geri, `topics.*` nöqtəli açar sil.
