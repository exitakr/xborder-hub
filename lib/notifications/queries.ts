import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { AppNotificationRow } from "@/lib/supabase/database.types";

const SCHEMA_MISSING = /relation .* does not exist/i;

function safeIgnore(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: string }).message === "string"
  ) {
    return SCHEMA_MISSING.test((error as { message: string }).message);
  }
  return false;
}

export async function fetchUserNotifications(
  userId: string,
  limit = 100,
): Promise<AppNotificationRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("notifications")
      .select(
        "id, user_id, kind, group_label, title, body, href, read, created_at",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      if (!safeIgnore(error)) console.error("[notif] fetch", error);
      return [];
    }
    return (data ?? []) as unknown as AppNotificationRow[];
  } catch (err) {
    console.error("[notif] fetch (catch)", err);
    return [];
  }
}
