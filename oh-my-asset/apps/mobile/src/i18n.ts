import { getLocales } from "expo-localization";
import { DEFAULT_LOCALE, getDict, isLocale, type Locale } from "@oma/core";

/**
 * Locale resolution for the native app.
 *
 * The device language is the starting point — a Singaporean user should not have
 * to find a language switch before the app makes sense — and the profile's saved
 * choice overrides it once loaded.
 */
export function deviceLocale(): Locale {
  const tag = getLocales()[0]?.languageCode ?? undefined;
  return isLocale(tag) ? tag : DEFAULT_LOCALE;
}

export { getDict, isLocale, DEFAULT_LOCALE, type Locale };

/** BCP-47 tag for Intl formatting, matching the web app's choices. */
export function intlLocale(locale: Locale): string {
  return locale === "ja" ? "ja-JP" : "en-SG";
}
