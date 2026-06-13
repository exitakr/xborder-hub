import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  Comment as DbComment,
  Thread as DbThread,
} from "@/lib/supabase/database.types";
import type { Thread as SampleThread } from "@/app/threads/data";

/**
 * Thread row joined with its author's display name. Comes straight from
 * Supabase when the 0002 migration has been applied; otherwise
 * `fetchThreads` returns an empty array and the client falls back to
 * the static sample data shipped in app/threads/data.ts.
 */
export type ThreadRow = DbThread & {
  author: { display_name: string | null } | null;
};

export type CommentRow = DbComment & {
  author: { display_name: string | null } | null;
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

/** All threads, most recent first. Returns [] when DB is unavailable. */
export async function fetchThreads(limit = 50): Promise<ThreadRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("threads")
      .select(
        "id, author_id, community_id, country, industry, role, category, title, body, ups_count, downs_count, replies_count, created_at, updated_at, author:profiles!threads_author_id_fkey(display_name)",
      )
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      if (safeIgnore(error)) return [];
      console.error("[threads] fetchThreads", error);
      return [];
    }
    return (data ?? []) as unknown as ThreadRow[];
  } catch (err) {
    console.error("[threads] fetchThreads (catch)", err);
    return [];
  }
}

/** Single thread by UUID. Returns null when not found or DB missing. */
export async function fetchThreadById(id: string): Promise<ThreadRow | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("threads")
      .select(
        "id, author_id, community_id, country, industry, role, category, title, body, ups_count, downs_count, replies_count, created_at, updated_at, author:profiles!threads_author_id_fkey(display_name)",
      )
      .eq("id", id)
      .maybeSingle();
    if (error) {
      if (!safeIgnore(error)) console.error("[threads] fetchThreadById", error);
      return null;
    }
    return (data ?? null) as ThreadRow | null;
  } catch (err) {
    console.error("[threads] fetchThreadById (catch)", err);
    return null;
  }
}

/** Comments on a thread, oldest first. */
export async function fetchComments(threadId: string): Promise<CommentRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("comments")
      .select(
        "id, thread_id, author_id, parent_id, body, ups_count, downs_count, created_at, updated_at, author:profiles!comments_author_id_fkey(display_name)",
      )
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });
    if (error) {
      if (!safeIgnore(error)) console.error("[threads] fetchComments", error);
      return [];
    }
    return (data ?? []) as unknown as CommentRow[];
  } catch (err) {
    console.error("[threads] fetchComments (catch)", err);
    return [];
  }
}

/* ────────────────────────────────────────────────────────────────
 * Adapters: DB row → SampleThread shape so the existing client
 * components keep rendering without per-call branching.
 * ──────────────────────────────────────────────────────────────── */

const AUTHOR_PALETTE = [
  { bg: "bg-blue", text: "text-cream" },
  { bg: "bg-jade", text: "text-ink" },
  { bg: "bg-mustard", text: "text-ink" },
  { bg: "bg-plum", text: "text-cream" },
  { bg: "bg-blue-soft", text: "text-ink" },
  { bg: "bg-ink", text: "text-cream" },
] as const;

function authorChip(authorId: string): { bg: string; text: string } {
  // Deterministic colour assignment per author_id so the same user keeps
  // the same avatar tint between page loads.
  let hash = 0;
  for (let i = 0; i < authorId.length; i++)
    hash = (hash * 31 + authorId.charCodeAt(i)) | 0;
  const idx = Math.abs(hash) % AUTHOR_PALETTE.length;
  return AUTHOR_PALETTE[idx]!;
}

function initialsFor(displayName: string | null | undefined): string {
  if (!displayName) return "—";
  const cleaned = displayName
    .replace(/(さん|くん|さま|様)\s*$/, "")
    .trim();
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

/**
 * Convert a DB row into the SampleThread shape the existing
 * ThreadsClient / ThreadClient already render. Keeps the visual
 * language identical regardless of data origin.
 */
export function adaptThreadRow(row: ThreadRow): SampleThread {
  const author = row.author?.display_name ?? "—";
  const chip = authorChip(row.author_id);
  return {
    id: row.id,
    author: initialsFor(author),
    bg: chip.bg,
    text: chip.text,
    location: row.country ?? "",
    posted: relativeJa(row.created_at),
    country: row.country ?? "",
    industry: row.industry ?? "",
    role: row.role ?? "",
    category: row.category,
    title: row.title,
    body: row.body,
    ups: row.ups_count,
    downs: row.downs_count,
    replies: row.replies_count,
  };
}

export type DisplayComment = {
  id: string;
  authorName: string;
  initials: string;
  bg: string;
  text: string;
  badge: string | null;
  posted: string;
  body: string;
  ups: number;
  downs: number;
};

export function adaptCommentRow(row: CommentRow): DisplayComment {
  const author = row.author?.display_name ?? "—";
  const chip = authorChip(row.author_id);
  return {
    id: row.id,
    authorName: author,
    initials: initialsFor(author),
    bg: chip.bg,
    text: chip.text,
    badge: null,
    posted: relativeJa(row.created_at),
    body: row.body,
    ups: row.ups_count,
    downs: row.downs_count,
  };
}
