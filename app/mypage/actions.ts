"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_VISIBILITY_SETTINGS,
  type VisibilitySettings,
} from "@/lib/anonymity/rules";

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
