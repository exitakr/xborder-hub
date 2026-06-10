import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ChatMessage, ChatRoom } from "@/lib/supabase/database.types";

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

export type ChatRoomRow = ChatRoom & {
  a_profile: { display_name: string | null } | null;
  b_profile: { display_name: string | null } | null;
};

const ROOM_SELECT =
  "id, cc_request_id, user_a, user_b, last_message_at, created_at, updated_at, a_profile:profiles!chat_rooms_user_a_fkey(display_name), b_profile:profiles!chat_rooms_user_b_fkey(display_name)";

/** Single room (RLS limits to participants). */
export async function fetchChatRoom(roomId: string): Promise<ChatRoomRow | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("chat_rooms")
      .select(ROOM_SELECT)
      .eq("id", roomId)
      .maybeSingle();
    if (error) {
      if (!safeIgnore(error)) console.error("[chat] fetchChatRoom", error);
      return null;
    }
    return (data ?? null) as unknown as ChatRoomRow | null;
  } catch (err) {
    console.error("[chat] fetchChatRoom (catch)", err);
    return null;
  }
}

/** All rooms the user participates in, most recent activity first. */
export async function fetchChatRooms(): Promise<ChatRoomRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("chat_rooms")
      .select(ROOM_SELECT)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(50);
    if (error) {
      if (!safeIgnore(error)) console.error("[chat] fetchChatRooms", error);
      return [];
    }
    return (data ?? []) as unknown as ChatRoomRow[];
  } catch (err) {
    console.error("[chat] fetchChatRooms (catch)", err);
    return [];
  }
}

export async function fetchChatMessages(
  roomId: string,
  limit = 200,
): Promise<ChatMessage[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("chat_messages")
      .select("id, room_id, sender_id, body, created_at")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })
      .limit(limit);
    if (error) {
      if (!safeIgnore(error)) console.error("[chat] fetchChatMessages", error);
      return [];
    }
    return (data ?? []) as ChatMessage[];
  } catch (err) {
    console.error("[chat] fetchChatMessages (catch)", err);
    return [];
  }
}

export function partnerOf(
  room: ChatRoomRow,
  userId: string,
): { id: string; name: string } {
  const isA = room.user_a === userId;
  const name =
    (isA ? room.b_profile?.display_name : room.a_profile?.display_name) ?? "メンバー";
  return { id: isA ? room.user_b : room.user_a, name };
}
