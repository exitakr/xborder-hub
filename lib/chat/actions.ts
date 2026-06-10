"use server";

import { createClient } from "@/lib/supabase/server";

const SCHEMA_MISSING = /relation .* does not exist/i;

export type SendMessageResult =
  | { ok: true; id: string; createdAt: string }
  | { ok: false; error: string };

export async function sendChatMessage(input: {
  roomId: string;
  body: string;
}): Promise<SendMessageResult> {
  const body = input.body.trim();
  if (!body) return { ok: false, error: "メッセージを入力してください。" };
  if (body.length > 4000)
    return { ok: false, error: "4000 文字以内で入力してください。" };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "ログインが必要です。" };

    const { data, error } = await supabase
      .from("chat_messages")
      .insert({ room_id: input.roomId, sender_id: user.id, body })
      .select("id, created_at")
      .single();

    if (error) {
      if (SCHEMA_MISSING.test(error.message)) {
        return {
          ok: false,
          error:
            "DB がまだ準備できていません。Supabase のマイグレーション 0003 を適用してください。",
        };
      }
      console.error("[chat] sendChatMessage", error);
      return { ok: false, error: "送信に失敗しました。" };
    }

    return { ok: true, id: data!.id, createdAt: data!.created_at };
  } catch (err) {
    console.error("[chat] sendChatMessage (catch)", err);
    return { ok: false, error: "通信エラーが発生しました。" };
  }
}
