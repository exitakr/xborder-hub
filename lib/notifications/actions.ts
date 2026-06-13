"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const SCHEMA_MISSING = /relation .* does not exist/i;

export type NotifActionResult = { ok: true } | { ok: false; error: string };

export async function markNotificationReadAction(
  id: string,
): Promise<NotifActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "ログインが必要です。" };

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      if (SCHEMA_MISSING.test(error.message)) return { ok: true };
      console.error("[notif] markRead", error);
      return { ok: false, error: "更新に失敗しました。" };
    }

    revalidatePath("/notifications");
    return { ok: true };
  } catch (err) {
    console.error("[notif] markRead (catch)", err);
    return { ok: false, error: "通信エラーが発生しました。" };
  }
}

export async function markAllNotificationsReadAction(): Promise<NotifActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "ログインが必要です。" };

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (error) {
      if (SCHEMA_MISSING.test(error.message)) return { ok: true };
      console.error("[notif] markAllRead", error);
      return { ok: false, error: "更新に失敗しました。" };
    }

    revalidatePath("/notifications");
    return { ok: true };
  } catch (err) {
    console.error("[notif] markAllRead (catch)", err);
    return { ok: false, error: "通信エラーが発生しました。" };
  }
}
