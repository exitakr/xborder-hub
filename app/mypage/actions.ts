"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_VISIBILITY_SETTINGS,
  type VisibilitySettings,
} from "@/lib/anonymity/rules";
import { clientProfileToDbColumns } from "@/lib/profile/serverProfile";
import type { Profile as ClientProfile } from "@/lib/profile/store";

export type UpdateState =
  | { ok?: undefined; error?: undefined }
  | { ok: true; error?: undefined }
  | { ok?: undefined; error: string };

/**
 * Persist the privacy toggles to profiles.visibility_settings for the
 * current user. Called from the form action of PrivacySettings.tsx.
 */
export async function updateVisibilitySettings(
  _prev: UpdateState,
  formData: FormData,
): Promise<UpdateState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const next: VisibilitySettings = {
    show_companies: formData.get("show_companies") === "on",
    show_salary: formData.get("show_salary") === "on",
    show_skills: formData.get("show_skills") === "on",
    show_visa: formData.get("show_visa") === "on",
    allow_coffee_chat: formData.get("allow_coffee_chat") === "on",
  };

  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        visibility_settings: { ...DEFAULT_VISIBILITY_SETTINGS, ...next },
      },
      { onConflict: "id" },
    );

  if (error) {
    if (/relation .* does not exist/i.test(error.message)) {
      return {
        error:
          "profiles テーブルがまだ作成されていません。Supabase で supabase/migrations/0001_init.sql を実行してください。",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/mypage");
  return { ok: true };
}

/**
 * Persist the entire edited profile (identity, current position, skills,
 * goals, career timeline, Coffee Chat availability) into the profiles
 * table so it propagates to every page, every user, and every device.
 *
 * Coffee-chat availability lives in visibility_settings.allow_coffee_chat
 * (its canonical home) — we read-merge the existing settings so the other
 * privacy flags are preserved.
 *
 * Degrades gracefully: if migration 0006 columns aren't present yet, it
 * retries with only the original identity columns so the app still works.
 */
export async function syncProfileBasics(
  input: ClientProfile,
): Promise<UpdateState> {
  const cols = clientProfileToDbColumns(input);
  if (!cols.display_name) return { error: "表示名を入力してください" };
  if (cols.display_name.length > 60)
    return { error: "表示名は 60 文字以内です" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  // Merge allow_coffee_chat into the existing visibility settings.
  const { data: existing } = await supabase
    .from("profiles")
    .select("visibility_settings")
    .eq("id", user.id)
    .maybeSingle();
  const visibility: VisibilitySettings = {
    ...DEFAULT_VISIBILITY_SETTINGS,
    ...((existing?.visibility_settings as Partial<VisibilitySettings>) ?? {}),
    allow_coffee_chat: input.ccAvailable !== false,
  };

  const full = {
    id: user.id,
    ...cols,
    visibility_settings: visibility,
  };

  let { error } = await supabase
    .from("profiles")
    .upsert(full, { onConflict: "id" });

  // Pre-0006 fallback: write only the columns guaranteed by 0001/0004.
  if (error && /column .* does not exist/i.test(error.message)) {
    const basic = {
      id: user.id,
      display_name: cols.display_name,
      age: cols.age,
      bio: cols.bio,
      from_country: cols.from_country,
      from_city: cols.from_city,
      to_country: cols.to_country,
      to_city: cols.to_city,
      industry: cols.industry,
      role: cols.role,
      visibility_settings: visibility,
    };
    ({ error } = await supabase
      .from("profiles")
      .upsert(basic, { onConflict: "id" }));
  }

  if (error) {
    if (/relation .* does not exist/i.test(error.message)) {
      return {
        error:
          "profiles テーブルが未作成です。supabase/migrations/0001_init.sql を実行してください。",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/mypage");
  revalidatePath("/search");
  revalidatePath("/profile");
  return { ok: true };
}
