"use server";

import { createClient } from "@/lib/supabase/server";
import type { ThreadCategory } from "@/lib/supabase/database.types";

const SCHEMA_MISSING = /relation .* does not exist/i;

const VALID_CATEGORIES = new Set<ThreadCategory>([
  "career",
  "life",
  "visa",
  "salary",
  "family",
  "other",
]);

export type CreateThreadResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createThreadAction(input: {
  country?: string | null;
  industry?: string | null;
  role?: string | null;
  category: string;
  title: string;
  body: string;
}): Promise<CreateThreadResult> {
  const title = input.title.trim();
  const body = input.body.trim();
  if (title.length < 5)
    return { ok: false, error: "タイトルは 5 文字以上で入力してください。" };
  if (body.length < 10)
    return { ok: false, error: "本文は 10 文字以上で入力してください。" };
  if (!VALID_CATEGORIES.has(input.category as ThreadCategory))
    return { ok: false, error: "カテゴリを選択してください。" };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "ログインが必要です。" };

    const { data, error } = await supabase
      .from("threads")
      .insert({
        author_id: user.id,
        country: input.country || null,
        industry: input.industry || null,
        role: input.role || null,
        category: input.category as ThreadCategory,
        title,
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
      console.error("[thread/new] createThreadAction", error);
      return { ok: false, error: "投稿の保存に失敗しました。" };
    }

    return { ok: true, id: data!.id };
  } catch (err) {
    console.error("[thread/new] createThreadAction (catch)", err);
    return { ok: false, error: "通信エラーが発生しました。" };
  }
}
