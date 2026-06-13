"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const SCHEMA_MISSING = /relation .* does not exist/i;

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

export async function addCommentAction(input: {
  threadId: string;
  body: string;
  parentId?: string | null;
}): Promise<ActionResult> {
  const body = input.body.trim();
  if (!body) return { ok: false, error: "コメントを入力してください。" };
  if (body.length > 4000)
    return { ok: false, error: "4000 文字以内で入力してください。" };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "ログインが必要です。" };

    const { data, error } = await supabase
      .from("comments")
      .insert({
        thread_id: input.threadId,
        author_id: user.id,
        parent_id: input.parentId ?? null,
        body,
      })
      .select("id")
      .single();

    if (error) {
      if (SCHEMA_MISSING.test(error.message)) {
        return {
          ok: false,
          error:
            "DB がまだ準備できていません。Supabase のマイグレーションを適用してください。",
        };
      }
      console.error("[thread] addCommentAction", error);
      return { ok: false, error: "コメントの保存に失敗しました。" };
    }

    revalidatePath(`/thread`);
    return { ok: true, id: data?.id };
  } catch (err) {
    console.error("[thread] addCommentAction (catch)", err);
    return { ok: false, error: "通信エラーが発生しました。" };
  }
}

/**
 * Toggle a 👍/👎 on a thread or comment. Three-state: tapping the same
 * kind removes it; tapping the other kind flips it. Counts are kept in
 * sync by the tg_sync_reaction_counts trigger from migration 0002.
 */
export async function toggleReactionAction(input: {
  targetType: "thread" | "comment";
  targetId: string;
  kind: "up" | "down";
}): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "ログインが必要です。" };

    const { data: existing, error: selErr } = await supabase
      .from("reactions")
      .select("id, kind")
      .eq("user_id", user.id)
      .eq("target_type", input.targetType)
      .eq("target_id", input.targetId)
      .maybeSingle();

    if (selErr) {
      if (SCHEMA_MISSING.test(selErr.message)) {
        return {
          ok: false,
          error: "DB がまだ準備できていません。",
        };
      }
      console.error("[thread] toggleReaction select", selErr);
      return { ok: false, error: "リアクションに失敗しました。" };
    }

    if (existing && existing.kind === input.kind) {
      // Same kind → remove (un-vote)
      const { error } = await supabase
        .from("reactions")
        .delete()
        .eq("id", existing.id);
      if (error) {
        console.error("[thread] toggleReaction delete", error);
        return { ok: false, error: "リアクションに失敗しました。" };
      }
    } else if (existing) {
      // Other kind → flip
      const { error } = await supabase
        .from("reactions")
        .update({ kind: input.kind })
        .eq("id", existing.id);
      if (error) {
        console.error("[thread] toggleReaction update", error);
        return { ok: false, error: "リアクションに失敗しました。" };
      }
    } else {
      const { error } = await supabase.from("reactions").insert({
        user_id: user.id,
        target_type: input.targetType,
        target_id: input.targetId,
        kind: input.kind,
      });
      if (error) {
        console.error("[thread] toggleReaction insert", error);
        return { ok: false, error: "リアクションに失敗しました。" };
      }
    }

    return { ok: true };
  } catch (err) {
    console.error("[thread] toggleReaction (catch)", err);
    return { ok: false, error: "通信エラーが発生しました。" };
  }
}
