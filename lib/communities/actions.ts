"use server";

import { createClient } from "@/lib/supabase/server";
import type { CommunityKind } from "@/lib/supabase/database.types";

const SCHEMA_MISSING = /relation .* does not exist/i;

const VALID_KINDS = new Set<CommunityKind>(["country", "industry", "role"]);

export type CommunityRequestResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function requestCommunityAction(input: {
  kind: string;
  name: string;
  description?: string | null;
}): Promise<CommunityRequestResult> {
  const name = input.name.trim();
  if (name.length < 2)
    return { ok: false, error: "コミュニティ名を入力してください。" };
  if (name.length > 80)
    return { ok: false, error: "コミュニティ名は 80 文字以内でお願いします。" };
  if (!VALID_KINDS.has(input.kind as CommunityKind))
    return { ok: false, error: "種別を選択してください。" };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "ログインが必要です。" };

    const { data, error } = await supabase
      .from("community_requests")
      .insert({
        requester_id: user.id,
        kind: input.kind as CommunityKind,
        name,
        description: input.description?.trim() || null,
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
      console.error("[community] request", error);
      return { ok: false, error: "申請の送信に失敗しました。" };
    }

    return { ok: true, id: data!.id };
  } catch (err) {
    console.error("[community] request (catch)", err);
    return { ok: false, error: "通信エラーが発生しました。" };
  }
}
