import { getRequestConfig } from "next-intl/server";

// Faza 1-də yalnız `az` aktivdir (CLAUDE.md → "Dil və format"). Struktur ru/en/tr üçün
// hazırdır — yeni dil əlavə etmək `messages/<locale>.json` + bu siyahıya əlavə etməkdir.
const ACTIVE_LOCALE = "az";

export default getRequestConfig(async () => {
  return {
    locale: ACTIVE_LOCALE,
    messages: (await import(`../messages/${ACTIVE_LOCALE}.json`)).default,
  };
});
