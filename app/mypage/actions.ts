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

/**
 * Mirror the locally-edited identity card into the profiles table so other
 * members see real display names on threads / comments / Coffee Chat.
 * Fire-and-forget from the client: failures degrade to localStorage-only.
 */
export async function syncProfileBasics(input: {
  displayName: string;
  age?: string;
  bio?: string;
  country?: string;
  city?: string;
  industry?: string;
  role?: string;
  goalCountry?: string;
}): Promise<UpdateState> {
  const displayName = input.displayName
    .replace(/(さん|くん|さま|様)\s*$/, "")
    .trim();
  if (!displayName) return { error: "表示名を入力してください" };
  if (displayName.length > 60) return { error: "表示名は 60 文字以内です" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const ageNum = input.age ? Number.parseInt(input.age, 10) : null;

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      display_name: displayName,
      age: Number.isFinite(ageNum) ? ageNum : null,
      bio: input.bio?.trim() || null,
      to_country: input.country || null,
      to_city: input.city || null,
      industry: input.industry || null,
      role: input.role || null,
    },
    { onConflict: "id" },
  );

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
  return { ok: true };
}
