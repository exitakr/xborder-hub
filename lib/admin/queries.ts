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
  communities: number | null;
  contactNew: number | null;
  chatRooms: number | null;
  salaries: number | null;
  signups7d: number | null;
};

/**
 * True totals via the admin_stats() RPC (migration 0012). This bypasses the
 * owner-only RLS on profiles (0007) safely — the RPC is is_admin()-gated —
 * so counts reflect the whole table, not just the caller's own row.
 */
export async function fetchAdminStats(): Promise<AdminStats> {
  const empty: AdminStats = {
    members: null,
    threads: null,
    comments: null,
    coffeeChats: null,
    communities: null,
    contactNew: null,
    chatRooms: null,
    salaries: null,
    signups7d: null,
  };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("admin_stats").maybeSingle();
    if (error || !data) {
      if (error && !safeIgnore(error)) console.error("[admin] stats", error);
      return empty;
    }
    const r = data as Record<string, number>;
    return {
      members: r.members ?? null,
      threads: r.threads ?? null,
      comments: r.comments ?? null,
      coffeeChats: r.coffee_chats ?? null,
      communities: r.communities ?? null,
      contactNew: r.contact_new ?? null,
      chatRooms: r.chat_rooms ?? null,
      salaries: r.salaries ?? null,
      signups7d: r.signups_7d ?? null,
    };
  } catch (err) {
    console.error("[admin] stats (catch)", err);
    return empty;
  }
}

export type AdminMember = {
  id: string;
  email: string | null;
  display_name: string | null;
  from_country: string | null;
  to_country: string | null;
  industry: string | null;
  role: string | null;
  onboarded_at: string | null;
  is_admin: boolean;
  created_at: string | null;
  last_sign_in_at: string | null;
  thread_count: number;
  comment_count: number;
};

export async function fetchAdminMembers(
  search = "",
  limit = 200,
): Promise<AdminMember[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("admin_list_members", {
      p_search: search || null,
      p_limit: limit,
      p_offset: 0,
    });
    if (error) {
      if (!safeIgnore(error)) console.error("[admin] members", error);
      return [];
    }
    return (data ?? []) as AdminMember[];
  } catch (err) {
    console.error("[admin] members (catch)", err);
    return [];
  }
}

export type AdminThread = {
  id: string;
  title: string;
  category: string;
  author_id: string;
  author_name: string;
  created_at: string;
  comment_count: number;
};

export async function fetchAdminThreads(limit = 100): Promise<AdminThread[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("admin_list_threads", {
      p_search: null,
      p_limit: limit,
      p_offset: 0,
    });
    if (error) {
      if (!safeIgnore(error)) console.error("[admin] threads", error);
      return [];
    }
    return (data ?? []) as AdminThread[];
  } catch (err) {
    console.error("[admin] threads (catch)", err);
    return [];
  }
}

export type AdminComment = {
  id: string;
  thread_id: string;
  thread_title: string | null;
  author_id: string;
  author_name: string;
  body: string;
  created_at: string;
};

export async function fetchAdminComments(limit = 100): Promise<AdminComment[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("admin_list_comments", {
      p_limit: limit,
      p_offset: 0,
    });
    if (error) {
      if (!safeIgnore(error)) console.error("[admin] comments", error);
      return [];
    }
    return (data ?? []) as AdminComment[];
  } catch (err) {
    console.error("[admin] comments (catch)", err);
    return [];
  }
}

export type ContactSubmission = {
  id: string;
  email: string;
  name: string | null;
  category: string;
  subject: string;
  body: string;
  status: string;
  created_at: string;
};

export async function fetchContactSubmissions(
  limit = 100,
): Promise<ContactSubmission[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("contact_submissions")
      .select("id, email, name, category, subject, body, status, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      if (!safeIgnore(error)) console.error("[admin] contact", error);
      return [];
    }
    return (data ?? []) as ContactSubmission[];
  } catch (err) {
    console.error("[admin] contact (catch)", err);
    return [];
  }
}
