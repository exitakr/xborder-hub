import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { CoffeeChatRequest } from "@/lib/supabase/database.types";

export type CoffeeChatRow = CoffeeChatRequest & {
  from_user: { display_name: string | null } | null;
  to_user: { display_name: string | null } | null;
};

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

const SELECT =
  "id, from_user_id, to_user_id, message, preferred_when, status, responded_at, chat_room_id, created_at, updated_at, from_user:profiles!coffee_chat_requests_from_user_id_fkey(display_name), to_user:profiles!coffee_chat_requests_to_user_id_fkey(display_name)";

/** Requests this user has sent. */
export async function fetchSentCcRequests(
  userId: string,
): Promise<CoffeeChatRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("coffee_chat_requests")
      .select(SELECT)
      .eq("from_user_id", userId)
      .order("created_at", { ascending: false });
    if (error) {
      if (!safeIgnore(error)) console.error("[cc] fetchSent", error);
      return [];
    }
    return (data ?? []) as unknown as CoffeeChatRow[];
  } catch (err) {
    console.error("[cc] fetchSent (catch)", err);
    return [];
  }
}

/** Requests this user has received. */
export async function fetchReceivedCcRequests(
  userId: string,
): Promise<CoffeeChatRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("coffee_chat_requests")
      .select(SELECT)
      .eq("to_user_id", userId)
      .order("created_at", { ascending: false });
    if (error) {
      if (!safeIgnore(error)) console.error("[cc] fetchReceived", error);
      return [];
    }
    return (data ?? []) as unknown as CoffeeChatRow[];
  } catch (err) {
    console.error("[cc] fetchReceived (catch)", err);
    return [];
  }
}

/* ───────── Display adapters ───────── */

const PALETTE = [
  { bg: "bg-blue", text: "text-cream" },
  { bg: "bg-jade", text: "text-ink" },
  { bg: "bg-mustard", text: "text-ink" },
  { bg: "bg-plum", text: "text-cream" },
  { bg: "bg-blue-soft", text: "text-ink" },
] as const;

function chipFor(id: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < id.length; i++)
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length]!;
}

function initialsFor(name: string | null | undefined): string {
  if (!name) return "—";
  const cleaned = name.replace(/(さん|さま|様)\s*$/, "").trim();
  if (!cleaned) return "—";
  const words = cleaned.split(/\s+/);
  if (words.length >= 2 && /^[A-Za-z]/.test(words[0]!)) {
    return (words[0]!.charAt(0) + words[1]!.charAt(0)).toUpperCase();
  }
  return Array.from(cleaned).slice(0, 2).join("");
}

function relativeJa(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "たった今";
  if (min < 60) return `${min}分前`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}時間前`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}日前`;
  return new Date(iso).toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
  });
}

export type DisplayCcRequest = {
  id: string;
  /** Other-party display name (the side you didn't initiate). */
  otherName: string;
  otherInitials: string;
  otherUserId: string;
  bg: string;
  text: string;
  topic: string;
  status: CoffeeChatRequest["status"];
  preferredWhen: string | null;
  createdAt: string;
  postedRelative: string;
  chatRoomId: string | null;
};

export function adaptSentRow(row: CoffeeChatRow): DisplayCcRequest {
  const otherName = row.to_user?.display_name ?? "—";
  const chip = chipFor(row.to_user_id);
  return {
    id: row.id,
    otherName,
    otherInitials: initialsFor(otherName),
    otherUserId: row.to_user_id,
    bg: chip.bg,
    text: chip.text,
    topic: row.message,
    status: row.status,
    preferredWhen: row.preferred_when,
    createdAt: row.created_at,
    postedRelative: relativeJa(row.created_at),
    chatRoomId: row.chat_room_id,
  };
}

export function adaptReceivedRow(row: CoffeeChatRow): DisplayCcRequest {
  const otherName = row.from_user?.display_name ?? "—";
  const chip = chipFor(row.from_user_id);
  return {
    id: row.id,
    otherName,
    otherInitials: initialsFor(otherName),
    otherUserId: row.from_user_id,
    bg: chip.bg,
    text: chip.text,
    topic: row.message,
    status: row.status,
    preferredWhen: row.preferred_when,
    createdAt: row.created_at,
    postedRelative: relativeJa(row.created_at),
    chatRoomId: row.chat_room_id,
  };
}
