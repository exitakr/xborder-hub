"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const SCHEMA_MISSING =
  /relation .* does not exist|column .* does not exist/i;

export type CompSubmission = {
  country: string;
  city?: string;
  industry: string;
  role: string;

  base_salary_range?: string;
  bonus_range?: string;
  has_equity?: boolean | null;
  total_comp_range: string;

  monthly_rent_range?: string;
  savings_rate_range?: string;
  life_satisfaction?: number | null;

  weekly_hours_range?: string;
  remote_frequency?: string;
  english_usage_rate?: string;
  wlb_satisfaction?: number | null;

  visa_type?: string;
  visa_difficulty?: number | null;
  has_pr?: boolean | null;
  overseas_satisfaction?: number | null;
};

export type CompActionResult = { ok: true } | { ok: false; error: string };

export type CompShareStats = {
  sampleN: number;
  scope: "country_role" | "country";
  /** % of contributors whose comp bucket is <= yours; null when n<5. */
  percentile: number | null;
  /** Convenience: max(1, 100 - percentile) — the "top X%" headline. */
  topPct: number | null;
};

/**
 * Approximate percentile for the post-completion share card (migration
 * 0016). Bucketed comp so it's a coarse "top X%", gated at n>=5 to protect
 * anonymity and avoid meaningless stats. Never returns row-level data.
 */
export async function getCompShareStats(input: {
  country: string;
  role: string;
  range: string;
}): Promise<CompShareStats | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .rpc("comp_percentile", {
        p_country: input.country,
        p_role: input.role,
        p_range: input.range,
      })
      .maybeSingle();
    if (error || !data) {
      if (error && !SCHEMA_MISSING.test(error.message)) {
        console.error("[comp] getCompShareStats", error);
      }
      return null;
    }
    const r = data as { sample_n: number; scope: string; percentile: number | null };
    const pct = r.percentile == null ? null : Number(r.percentile);
    return {
      sampleN: Number(r.sample_n ?? 0),
      scope: r.scope === "country" ? "country" : "country_role",
      percentile: pct,
      topPct: pct == null ? null : Math.max(1, 100 - pct),
    };
  } catch (err) {
    console.error("[comp] getCompShareStats (catch)", err);
    return null;
  }
}

function clampRating(v: number | null | undefined, max: number): number | null {
  if (v == null || Number.isNaN(v)) return null;
  return Math.min(max, Math.max(1, Math.round(v)));
}

export async function submitCompensation(
  input: CompSubmission,
): Promise<CompActionResult> {
  if (!input.country)
    return { ok: false, error: "国を選択してください。" };
  if (!input.industry)
    return { ok: false, error: "業界を選択してください。" };
  if (!input.role) return { ok: false, error: "職種を選択してください。" };
  if (!input.total_comp_range)
    return { ok: false, error: "年収レンジ(総額)を選択してください。" };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "ログインが必要です。" };

    const { error } = await supabase.from("compensation_data").upsert(
      {
        user_id: user.id,
        country: input.country,
        city: input.city?.trim() || null,
        industry: input.industry,
        role: input.role,
        base_salary_range: input.base_salary_range || null,
        bonus_range: input.bonus_range || null,
        has_equity: input.has_equity ?? null,
        total_comp_range: input.total_comp_range,
        monthly_rent_range: input.monthly_rent_range || null,
        savings_rate_range: input.savings_rate_range || null,
        life_satisfaction: clampRating(input.life_satisfaction, 10),
        weekly_hours_range: input.weekly_hours_range || null,
        remote_frequency: input.remote_frequency || null,
        english_usage_rate: input.english_usage_rate || null,
        wlb_satisfaction: clampRating(input.wlb_satisfaction, 5),
        visa_type: input.visa_type || null,
        visa_difficulty: clampRating(input.visa_difficulty, 5),
        has_pr: input.has_pr ?? null,
        overseas_satisfaction: clampRating(input.overseas_satisfaction, 10),
        reported_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (error) {
      if (SCHEMA_MISSING.test(error.message)) {
        return {
          ok: false,
          error:
            "DB がまだ準備できていません。supabase/migrations/0004_onboarding_comp.sql を実行してください。",
        };
      }
      console.error("[comp] submitCompensation", error);
      return { ok: false, error: "保存に失敗しました。もう一度お試しください。" };
    }

    revalidatePath("/salaries");
    return { ok: true };
  } catch (err) {
    console.error("[comp] submitCompensation (catch)", err);
    return { ok: false, error: "通信エラーが発生しました。" };
  }
}
