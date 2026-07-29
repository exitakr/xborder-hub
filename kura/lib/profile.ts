import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { isCurrency, type Currency } from "./money";
import { isLocale, type Locale, DEFAULT_LOCALE } from "./i18n/dict";

export interface SessionProfile {
  userId: string;
  email: string | null;
  displayName: string | null;
  currency: Currency;
  locale: Locale;
  isAdmin: boolean;
}

/**
 * Current user + profile for a protected page. Redirects to /login when there
 * is no session — middleware already does this, but a page must not depend on
 * middleware for its authorisation.
 */
export async function requireProfile(): Promise<SessionProfile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("profiles")
    .select("display_name, base_currency, locale, is_admin")
    .eq("id", user.id)
    .maybeSingle();

  return {
    userId: user.id,
    email: user.email ?? null,
    // Fall back to the name captured at signup if the profile row is new.
    displayName:
      data?.display_name ?? (user.user_metadata?.display_name as string | undefined) ?? null,
    currency: isCurrency(data?.base_currency) ? data.base_currency : "JPY",
    locale: isLocale(data?.locale) ? data.locale : DEFAULT_LOCALE,
    isAdmin: Boolean(data?.is_admin),
  };
}

/**
 * Short-lived signed URL for a private holding photo.
 * Returns null rather than throwing, so a missing object degrades to the
 * category glyph instead of breaking the page.
 */
export async function signedPhotoUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("holding-photos")
    .createSignedUrl(path, 60 * 10);
  return data?.signedUrl ?? null;
}
