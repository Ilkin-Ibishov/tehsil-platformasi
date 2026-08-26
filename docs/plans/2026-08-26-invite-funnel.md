# Dəvət hunisi, implementasiya planı

Tarix: 2026-08-26. Sonra icra. Parent, i18n, resume, reels, bank sinif filtri, InviteGate-i onboarding-ə köçürmə **yoxdur**.

## Problem + grounded model

Faza 1 qapısı 15–20 şagirdin içəri girib `delivered` həll yazmasıdır. Nəzərdə tutulan giriş WhatsApp `?invite=` linkidir (HANDOFF 197). Əl ilə yazılan kod `InviteGate` ilə `device_id` göndərir. 1-klik yolu `validateAndStoreInviteCode` isə yalnız `{ invite_code }` göndərir.

`POST /api/invite/check` `device_id` yoxdursa belə kodu qəbul edə bilər (henüz redemption yoxdur). Kod artıq başqa cihazdadırsa, `device_id` olmadan **həmişə 409** — eyni şagird WhatsApp linki ilə qayıdanda da. Tək-cihaz kilidi (HANDOFF 201) əl-yazı qapısında işləyir, 1-klikdə yox.

Bank `?invite=` oxumur. Link `/bank?invite=ilkin-01` olsa, şagird yenə əl ilə yazır.

Kamera `setSolution` `topicTitle` ötürmür. Bank ötürür. Ana səhifə `topicTitle || canonical || "Riyazi məsələ"` göstərir — kamera həllində birinci sahə boşdur. `topic_code` (`ALG.*`) başlıq kimi getməməlidir.

`url.ts` `getDeviceId` import etməz — `telemetry/index.ts` `"use client"`-dir, `url.selftest.mts` extract testləridir, fetch mock məcburi deyil. `device_id`-ni çağıran ötürür.

## Usage

Linkdən açan şagird:

1. `/?invite=ilkin-01` və ya `/kamera?invite=ilkin-01` — check `device_id` ilə, kod yazılır, query silinir. Eyni cihaz təkrar linkdə 409 yox. Başqa cihaz 409, kod localStorage-a düşmür.
2. `/bank?invite=ilkin-01` — eyni helper, qapı skip, suallar yüklənir. Query silinir.
3. Kameradan həll: tarixçə sətri insan başlığı və ya kanonik mətn. Xam `ALG.LINEAR_EQUATION` yox.

## Shape

```ts
// web/lib/invite/url.ts
export async function validateAndStoreInviteCode(
  code: string,
  deviceId: string,
): Promise<boolean>;

// çağıranlar
validateAndStoreInviteCode(code, getDeviceId());
```

Body: `{ invite_code, device_id }` — `InviteGate.submit` ilə eyni. 403/409/şəbəkə → `false`, `setItem` yox.

Kamera:

```ts
topicTitle:
  typeof body.topic_title === "string" && body.topic_title.trim()
    ? body.topic_title.trim()
    : canonical,
```

`topic_code` title kimi getmir. `SolveView` toxunulmur.

## Sequenced implementation

1. `url.ts` — ikinci arqument `deviceId: string`, body-yə qoy. Boş `deviceId` göndərmə (trim; boşdursa field omit etmə, çağıran `getDeviceId()` verir).
2. `page.tsx`, `kamera/page.tsx` — `getDeviceId()` ötür.
3. `bank/page.tsx` — home/kamera ilə eyni `useEffect`: extract → validate → ok-da `setInviteCode` + `loading` + `cleanInviteFromUrl`; fail-də `inviteError` + `invite` mərhələsi.
4. `kamera/page.tsx` — monolit `submitSolve` və kaskad finish `setSolution` hər ikisinə `topicTitle` (title və ya canonical).
5. `url.selftest.mts` — extract 13 case eyni qalır. `validateAndStoreInviteCode` imzası selftest-ə düşmür.

## Verification

- `npx tsx lib/invite/url.selftest.mts` 13/13.
- `npx tsc --noEmit` `web/`.
- Brauzer: `/kamera?invite=` mövcud kodla qapını keçir (API 200 olarsa). `/bank?invite=` eyni. Query təmizlənir.
- `/api/invite/check` 1-klikdən `device_id` body-dədir (şəbəkə tab və ya kod oxunuşu).
- Tarixçə: kamera həllində başlıq `ALG.` ilə başlamır əgər canonical varsa.

## Next implementation step

`validateAndStoreInviteCode(code, getDeviceId())` yaz, bankı bağla, kamera `topicTitle` ötür.
