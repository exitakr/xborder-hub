"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_VISIBILITY_SETTINGS,
  type VisibilitySettings,
} from "@/lib/anonymity/rules";
import type { CareerStep } from "@/lib/profile/store";

/** A career step is "valid" once it carries the required core fields. */
function isValidStep(s: CareerStep): boolean {
  return (
    !!s &&
    s.company.trim().length > 0 &&
    s.country.length > 0 &&
    s.role.length > 0 &&
    s.startYear.length > 0
  );
}

export type OnboardingResult = { ok: true } | { ok: false; error: string };

/**
 * Marks the user's onboarded session for the edge middleware fast-path so
 * subsequent navigations skip the profiles DB read. Cleared on signOut.
 */
async function setOnboardedCookie() {
  const jar = await cookies();
  jar.set("xb_onb", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function completeOnboarding(input: {
  displayName: string;
  fromCountry?: string;
  fromCity?: string;
  toCountry?: string;
  toCity?: string;
  industry?: string;
  role?: string;
  allowCoffeeChat: boolean;
  career?: CareerStep[];
}): Promise<OnboardingResult> {
  const displayName = input.displayName
    .replace(/(さん|くん|さま|様)\s*$/, "")
    .trim();
  if (!displayName) return { ok: false, error: "表示名を入力してください" };
  if (displayName.length > 60)
    return { ok: false, error: "表示名は 60 文字以内です" };

  // Career history is mandatory at signup — at least one complete entry.
  const career = (input.career ?? []).filter(isValidStep);
  if (career.length === 0) {
    return {
      ok: false,
      error:
        "経歴を 1 社以上、企業名・国・職種・開始年まで入力してください。",
    };
  }

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

    const base = {
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
    };

    let { error } = await supabase
      .from("profiles")
      .upsert({ ...base, career }, { onConflict: "id" });

    // Pre-0006 fallback: the `career` column may not exist yet. Persist the
    // rest so the user still gets through onboarding.
    if (error && /column .* does not exist/i.test(error.message)) {
      ({ error } = await supabase
        .from("profiles")
        .upsert(base, { onConflict: "id" }));
    }

    if (error) {
      if (/relation .* does not exist/i.test(error.message)) {
        return {
          ok: false,
          error:
            "DB がまだ準備できていません。supabase/migrations/0004_onboarding_comp.sql を実行してください。",
        };
      }
      console.error("[welcome] completeOnboarding", error);
      return { ok: false, error: "保存に失敗しました。もう一度お試しください。" };
    }

    await setOnboardedCookie();
    revalidatePath("/mypage");
    return { ok: true };
  } catch (err) {
    console.error("[welcome] completeOnboarding (catch)", err);
    return { ok: false, error: "通信エラーが発生しました。" };
  }
}
