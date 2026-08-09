"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@oma/core";
import { LOCALE_COOKIE } from "@/lib/i18n-server";

export interface ProfileState {
  ok?: boolean;
  error?: boolean;
}

export async function saveProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName"),
    baseCurrency: formData.get("baseCurrency"),
    locale: formData.get("locale"),
  });
  if (!parsed.success) return { error: true };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: true };

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      base_currency: parsed.data.baseCurrency,
      locale: parsed.data.locale,
    })
    .eq("id", user.id);

  if (error) return { error: true };

  // Mirror the locale into a cookie so the shell renders in the chosen language
  // even on pages that do not load the profile.
  const store = await cookies();
  store.set(LOCALE_COOKIE, parsed.data.locale, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Irreversible account deletion (SPEC §8).
 *
 * Storage objects go first: the SQL function removes the auth user, and once
 * that row is gone the storage policies would no longer match, orphaning the
 * files. Rows are then removed by `delete_my_account()`.
 */
export async function deleteAccount(formData: FormData) {
  if (formData.get("confirm") !== "DELETE") return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: files } = await supabase.storage.from("holding-photos").list(user.id);
  if (files && files.length > 0) {
    await supabase.storage
      .from("holding-photos")
      .remove(files.map((f) => `${user.id}/${f.name}`));
  }

  const { error } = await supabase.rpc("delete_my_account");
  if (error) return;

  await supabase.auth.signOut();
  redirect("/");
}
