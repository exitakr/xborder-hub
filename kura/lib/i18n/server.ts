import { cookies } from "next/headers";
import { DEFAULT_LOCALE, getDict, isLocale, type Locale } from "./dict";

export const LOCALE_COOKIE = "kura_locale";

/**
 * Resolve the active locale for a server render.
 *
 * Order: explicit cookie (user chose in /mypage) → Accept-Language → default.
 * We deliberately do not use URL-prefixed routing: one canonical URL per page
 * keeps the app simple to navigate and to operate. See docs/RESEARCH.md for the
 * SEO trade-off this makes.
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const fromCookie = store.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;
  return DEFAULT_LOCALE;
}

export async function getT() {
  const locale = await getLocale();
  return { locale, t: getDict(locale) };
}
