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
