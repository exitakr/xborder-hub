import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  Community,
  CommunityRequest,
} from "@/lib/supabase/database.types";

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

/** True when the signed-in user has profiles.is_admin = true. */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const { data, error } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    if (error || !data) return false;
    return Boolean((data as { is_admin?: boolean }).is_admin);
  } catch {
    return false;
  }
}

export type CommunityRequestRow = CommunityRequest & {
  requester: { display_name: string | null } | null;
};

export async function fetchCommunityRequests(): Promise<CommunityRequestRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("community_requests")
      .select(
        "id, requester_id, kind, name, description, status, reviewer_note, created_at, reviewed_at, requester:profiles!community_requests_requester_id_fkey(display_name)",
      )
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      if (!safeIgnore(error)) console.error("[admin] fetchRequests", error);
      return [];
    }
    return (data ?? []) as unknown as CommunityRequestRow[];
  } catch (err) {
    console.error("[admin] fetchRequests (catch)", err);
    return [];
  }
}

export async function fetchCommunities(): Promise<Community[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("communities")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      if (!safeIgnore(error)) console.error("[admin] fetchCommunities", error);
      return [];
    }
    return (data ?? []) as Community[];
  } catch (err) {
    console.error("[admin] fetchCommunities (catch)", err);
    return [];
  }
}

export type AdminStats = {
  members: number | null;
  threads: number | null;
  comments: number | null;
  coffeeChats: number | null;
};

export async function fetchAdminStats(): Promise<AdminStats> {
  const supabase = await createClient();
  async function count(table: string): Promise<number | null> {
    try {
      const { count: c, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });
      if (error) return null;
      return c ?? 0;
    } catch {
      return null;
    }
  }
  const [members, threads, comments, coffeeChats] = await Promise.all([
    count("profiles"),
    count("threads"),
    count("comments"),
    count("coffee_chat_requests"),
  ]);
  return { members, threads, comments, coffeeChats };
}
