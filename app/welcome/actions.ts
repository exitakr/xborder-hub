"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_VISIBILITY_SETTINGS,
  type VisibilitySettings,
} from "@/lib/anonymity/rules";

export type OnboardingResult = { ok: true } | { ok: false; error: string };

export async function completeOnboarding(input: {
  displayName: string;
  fromCountry?: string;
  fromCity?: string;
  toCountry?: string;
  toCity?: string;
  industry?: string;
  role?: string;
  allowCoffeeChat: boolean;
}): Promise<OnboardingResult> {
  const displayName = input.displayName
    .replace(/(さん|くん|さま|様)\s*$/, "")
    .trim();
  if (!displayName) return { ok: false, error: "表示名を入力してください" };
  if (displayName.length > 60)
    return { ok: false, error: "表示名は 60 文字以内です" };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "ログインが必要です" };

    const visibility: VisibilitySettings = {
      ...DEFAULT_VISIBILITY_SETTINGS,
      allow_coffee_chat: input.allowCoffeeChat,
    };

    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        display_name: displayName,
        from_country: input.fromCountry || null,
        from_city: input.fromCity?.trim() || null,
        to_country: input.toCountry || null,
        to_city: input.toCity?.trim() || null,
        industry: input.industry || null,
        role: input.role || null,
        visibility_settings: visibility,
        onboarded_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    if (error) {
      if (/column .* does not exist|relation .* does not exist/i.test(error.message)) {
        return {
          ok: false,
          error:
            "DB がまだ準備できていません。supabase/migrations/0004_onboarding_comp.sql を実行してください。",
        };
      }
      console.error("[welcome] completeOnboarding", error);
      return { ok: false, error: "保存に失敗しました。もう一度お試しください。" };
    }

    revalidatePath("/mypage");
    return { ok: true };
  } catch (err) {
    console.error("[welcome] completeOnboarding (catch)", err);
    return { ok: false, error: "通信エラーが発生しました。" };
  }
}
