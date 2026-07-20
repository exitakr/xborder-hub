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

/** Admin moderation: delete any thread (comments cascade). */
export async function adminDeleteThread(input: {
  threadId: string;
}): Promise<AdminActionResult> {
  try {
    const { supabase, user } = await requireAdmin();
    if (!user) return { ok: false, error: "管理者権限がありません。" };
    const { error } = await supabase.rpc("admin_delete_thread", {
      p_id: input.threadId,
    });
    if (error) {
      console.error("[admin] deleteThread", error);
      return { ok: false, error: "削除に失敗しました。" };
    }
    revalidatePath("/admin");
    revalidatePath("/threads");
    return { ok: true };
  } catch (err) {
    console.error("[admin] deleteThread (catch)", err);
    return { ok: false, error: "通信エラーが発生しました。" };
  }
}

/** Admin moderation: delete any comment. */
export async function adminDeleteComment(input: {
  commentId: string;
}): Promise<AdminActionResult> {
  try {
    const { supabase, user } = await requireAdmin();
    if (!user) return { ok: false, error: "管理者権限がありません。" };
    const { error } = await supabase.rpc("admin_delete_comment", {
      p_id: input.commentId,
    });
    if (error) {
      console.error("[admin] deleteComment", error);
      return { ok: false, error: "削除に失敗しました。" };
    }
    revalidatePath("/admin");
    return { ok: true };
  } catch (err) {
    console.error("[admin] deleteComment (catch)", err);
    return { ok: false, error: "通信エラーが発生しました。" };
  }
}

/** Admin: update a contact submission's triage status. */
export async function updateContactStatus(input: {
  id: string;
  status: "new" | "in_progress" | "resolved";
}): Promise<AdminActionResult> {
  try {
    const { supabase, user } = await requireAdmin();
    if (!user) return { ok: false, error: "管理者権限がありません。" };
    const patch: { status: string; responded_at?: string } = {
      status: input.status,
    };
    if (input.status === "resolved") patch.responded_at = new Date().toISOString();
    const { error } = await supabase
      .from("contact_submissions")
      .update(patch)
      .eq("id", input.id);
    if (error) {
      console.error("[admin] contactStatus", error);
      return { ok: false, error: "更新に失敗しました。" };
    }
    revalidatePath("/admin");
    return { ok: true };
  } catch (err) {
    console.error("[admin] contactStatus (catch)", err);
    return { ok: false, error: "通信エラーが発生しました。" };
  }
}

export type CompExportRow = Record<string, string | number | boolean | null>;

/**
 * Anonymized compensation dataset for due-diligence export (migration 0015,
 * is_admin-gated RPC — no user_id, month-level dates only). The client turns
 * this into a CSV download.
 */
export async function adminExportCompData(): Promise<
  { ok: true; rows: CompExportRow[] } | { ok: false; error: string }
> {
  try {
    const { supabase, user } = await requireAdmin();
    if (!user) return { ok: false, error: "管理者権限がありません。" };
    const { data, error } = await supabase.rpc("admin_export_comp");
    if (error) {
      console.error("[admin] exportComp", error);
      return { ok: false, error: "エクスポートに失敗しました。" };
    }
    return { ok: true, rows: (data ?? []) as CompExportRow[] };
  } catch (err) {
    console.error("[admin] exportComp (catch)", err);
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
