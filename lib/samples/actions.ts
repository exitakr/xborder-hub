"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SampleActionResult = { ok: true } | { ok: false; error: string };

const SCHEMA_MISSING = /relation .* does not exist/i;

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null };
  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!data || !(data as { is_admin?: boolean }).is_admin) {
    return { supabase, user: null };
  }
  return { supabase, user };
}

/** Hide a static sample item for everyone (admin only). */
export async function dismissSample(
  sampleKey: string,
): Promise<SampleActionResult> {
  const key = sampleKey.trim();
  if (!key) return { ok: false, error: "対象が指定されていません。" };
  try {
    const { supabase, user } = await requireAdmin();
    if (!user) return { ok: false, error: "管理者権限がありません。" };

    const { error } = await supabase
      .from("dismissed_samples")
      .upsert({ sample_key: key, dismissed_by: user.id }, { onConflict: "sample_key" });
    if (error) {
      if (SCHEMA_MISSING.test(error.message)) {
        return {
          ok: false,
          error:
            "DB がまだ準備できていません。supabase/migrations/0005_admin_samples.sql を実行してください。",
        };
      }
      console.error("[samples] dismissSample", error);
      return { ok: false, error: "削除に失敗しました。" };
    }

    revalidatePath("/home");
    revalidatePath("/threads");
    return { ok: true };
  } catch (err) {
    console.error("[samples] dismissSample (catch)", err);
    return { ok: false, error: "通信エラーが発生しました。" };
  }
}

/** Restore a previously hidden sample item (admin only). */
export async function restoreSample(
  sampleKey: string,
): Promise<SampleActionResult> {
  const key = sampleKey.trim();
  if (!key) return { ok: false, error: "対象が指定されていません。" };
  try {
    const { supabase, user } = await requireAdmin();
    if (!user) return { ok: false, error: "管理者権限がありません。" };

    const { error } = await supabase
      .from("dismissed_samples")
      .delete()
      .eq("sample_key", key);
    if (error) {
      console.error("[samples] restoreSample", error);
      return { ok: false, error: "復元に失敗しました。" };
    }

    revalidatePath("/home");
    revalidatePath("/threads");
    return { ok: true };
  } catch (err) {
    console.error("[samples] restoreSample (catch)", err);
    return { ok: false, error: "通信エラーが発生しました。" };
  }
}
