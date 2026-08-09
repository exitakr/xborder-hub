import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { isCurrency, type Currency } from "@oma/core";
import { isLocale, type Locale, DEFAULT_LOCALE } from "@oma/core";

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

  // Read through locals so the type guards narrow the values themselves —
  // guarding `data?.x` tells TypeScript nothing about `data` being non-null.
  const baseCurrency = data?.base_currency;
  const profileLocale = data?.locale;

  return {
    userId: user.id,
    email: user.email ?? null,
    // Fall back to the name captured at signup if the profile row is new.
    displayName:
      data?.display_name ?? (user.user_metadata?.display_name as string | undefined) ?? null,
    currency: isCurrency(baseCurrency) ? baseCurrency : "JPY",
    locale: isLocale(profileLocale) ? profileLocale : DEFAULT_LOCALE,
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
