"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const SCHEMA_MISSING = /relation .* does not exist/i;

export type CcActionResult =
  | { ok: true; id?: string; chatRoomId?: string | null }
  | { ok: false; error: string };

function friendly(error: { message: string }, fallback: string): string {
  if (SCHEMA_MISSING.test(error.message)) {
    return "DB がまだ準備できていません。Supabase のマイグレーションを適用してください。";
  }
  return fallback;
}

export async function createCoffeeChatRequest(input: {
  toUserId: string;
  message: string;
  preferredWhen?: string | null;
}): Promise<CcActionResult> {
  const message = input.message.trim();
  if (message.length < 10)
    return { ok: false, error: "相談内容は 10 文字以上で入力してください。" };
  if (message.length > 1000)
    return { ok: false, error: "相談内容は 1000 文字以内でお願いします。" };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "ログインが必要です。" };
    if (user.id === input.toUserId)
      return { ok: false, error: "自分自身には申請できません。" };

    const { data, error } = await supabase
      .from("coffee_chat_requests")
      .insert({
        from_user_id: user.id,
        to_user_id: input.toUserId,
        message,
        preferred_when: input.preferredWhen?.trim() || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[cc] createCoffeeChatRequest", error);
      return { ok: false, error: friendly(error, "申請の送信に失敗しました。") };
    }

    revalidatePath("/mypage");
    return { ok: true, id: data!.id };
  } catch (err) {
    console.error("[cc] createCoffeeChatRequest (catch)", err);
    return { ok: false, error: "通信エラーが発生しました。" };
  }
}

async function updateStatus(
  id: string,
  next: "approved" | "rejected" | "cancelled",
): Promise<CcActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "ログインが必要です。" };

    const { data, error } = await supabase
      .from("coffee_chat_requests")
      .update({
        status: next,
        responded_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("chat_room_id")
      .single();

    if (error) {
      console.error("[cc] updateStatus", next, error);
      return { ok: false, error: friendly(error, "更新に失敗しました。") };
    }

    revalidatePath("/mypage");
    return { ok: true, id, chatRoomId: data?.chat_room_id ?? null };
  } catch (err) {
    console.error("[cc] updateStatus (catch)", err);
    return { ok: false, error: "通信エラーが発生しました。" };
  }
}

export async function approveCoffeeChatRequest(id: string) {
  return updateStatus(id, "approved");
}

export async function rejectCoffeeChatRequest(id: string) {
  return updateStatus(id, "rejected");
}

export async function cancelCoffeeChatRequest(id: string) {
  return updateStatus(id, "cancelled");
}
