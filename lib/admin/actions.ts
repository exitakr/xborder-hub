"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CommunityKind } from "@/lib/supabase/database.types";

export type AdminActionResult = { ok: true } | { ok: false; error: string };

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

function slugify(label: string): string {
  return (
    label
      .toLowerCase()
      .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || `community-${Date.now()}`
  );
}

/** Approve: mark the request approved and open the community. */
export async function approveCommunityRequest(input: {
  requestId: string;
  kind: CommunityKind;
  name: string;
  description?: string | null;
}): Promise<AdminActionResult> {
  try {
    const { supabase, user } = await requireAdmin();
    if (!user) return { ok: false, error: "管理者権限がありません。" };

    const { error: insertError } = await supabase.from("communities").insert({
      kind: input.kind,
      slug: slugify(input.name),
      label: input.name,
      description: input.description ?? null,
    });
    if (insertError && !/duplicate key/i.test(insertError.message)) {
      console.error("[admin] approve insert", insertError);
      return { ok: false, error: "コミュニティの作成に失敗しました。" };
    }

    const { error: updateError } = await supabase
      .from("community_requests")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", input.requestId);
    if (updateError) {
      console.error("[admin] approve update", updateError);
      return { ok: false, error: "ステータス更新に失敗しました。" };
    }

    revalidatePath("/admin");
    return { ok: true };
  } catch (err) {
    console.error("[admin] approve (catch)", err);
    return { ok: false, error: "通信エラーが発生しました。" };
  }
}

export async function rejectCommunityRequest(input: {
  requestId: string;
  note?: string;
}): Promise<AdminActionResult> {
  try {
    const { supabase, user } = await requireAdmin();
    if (!user) return { ok: false, error: "管理者権限がありません。" };

    const { error } = await supabase
      .from("community_requests")
      .update({
        status: "rejected",
        reviewer_note: input.note?.trim() || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", input.requestId);
    if (error) {
      console.error("[admin] reject", error);
      return { ok: false, error: "ステータス更新に失敗しました。" };
    }

    revalidatePath("/admin");
    return { ok: true };
  } catch (err) {
    console.error("[admin] reject (catch)", err);
    return { ok: false, error: "通信エラーが発生しました。" };
  }
}
