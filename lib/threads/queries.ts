import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  Comment as DbComment,
  Thread as DbThread,
} from "@/lib/supabase/database.types";
import type { Thread as SampleThread } from "@/app/threads/data";
import { COUNTRY_OPTS, INDUSTRY_OPTS, ROLE_OPTS } from "@/lib/profile/options";

/**
 * Thread row with the minimum profile fields we need to render the
 * author byline. We do NOT use PostgREST `!fk_hint` joins because
 * `threads.author_id` references `auth.users` (not `profiles`), so the
 * embed `author:profiles!threads_author_id_fkey(...)` errors out with
 * "Could not find a relationship". We fetch profiles in a follow-up
 * batched query instead.
 */
export type ThreadRow = DbThread & {
  author: AuthorSnapshot | null;
};

export type CommentRow = DbComment & {
  author: AuthorSnapshot | null;
};

export type AuthorSnapshot = {
  display_name: string | null;
  industry: string | null;
  role: string | null;
  to_country: string | null;
  from_country: string | null;
  onboarded_at: string | null;
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

/**
 * Batched profile lookup keyed by user id. Returns a Map so callers can
 * cheaply attach the snapshot back onto each row.
 */
async function loadAuthors(
  authorIds: string[],
): Promise<Map<string, AuthorSnapshot>> {
  const unique = Array.from(new Set(authorIds.filter(Boolean)));
  const map = new Map<string, AuthorSnapshot>();
  if (unique.length === 0) return map;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, display_name, industry, role, to_country, from_country, onboarded_at",
      )
      .in("id", unique);
    if (error) {
      if (!safeIgnore(error)) console.error("[threads] loadAuthors", error);
      return map;
    }
    for (const row of (data ?? []) as Array<
      AuthorSnapshot & { id: string }
    >) {
      map.set(row.id, {
        display_name: row.display_name,
        industry: row.industry,
        role: row.role,
        to_country: row.to_country,
        from_country: row.from_country,
        onboarded_at: row.onboarded_at,
      });
    }
  } catch (err) {
    console.error("[threads] loadAuthors (catch)", err);
  }
  return map;
}

/** All threads, most recent first. Returns [] when DB is unavailable. */
export async function fetchThreads(limit = 50): Promise<ThreadRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("threads")
      .select(
        "id, author_id, community_id, country, industry, role, category, title, body, ups_count, downs_count, replies_count, created_at, updated_at",
      )
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      if (safeIgnore(error)) return [];
      console.error("[threads] fetchThreads", error);
      return [];
    }
    const rows = (data ?? []) as DbThread[];
    const authors = await loadAuthors(rows.map((r) => r.author_id));
    return rows.map((r) => ({
      ...r,
      author: authors.get(r.author_id) ?? null,
    }));
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
        "id, author_id, community_id, country, industry, role, category, title, body, ups_count, downs_count, replies_count, created_at, updated_at",
      )
      .eq("id", id)
      .maybeSingle();
    if (error) {
      if (!safeIgnore(error)) console.error("[threads] fetchThreadById", error);
      return null;
    }
    if (!data) return null;
    const row = data as DbThread;
    const authors = await loadAuthors([row.author_id]);
    return { ...row, author: authors.get(row.author_id) ?? null };
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
        "id, thread_id, author_id, parent_id, body, ups_count, downs_count, created_at, updated_at",
      )
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });
    if (error) {
      if (!safeIgnore(error)) console.error("[threads] fetchComments", error);
      return [];
    }
    const rows = (data ?? []) as DbComment[];
    const authors = await loadAuthors(rows.map((r) => r.author_id));
    return rows.map((r) => ({
      ...r,
      author: authors.get(r.author_id) ?? null,
    }));
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
 * Workcircle-style anonymous handle — six alphanumerics derived
 * deterministically from the user id. Same author = same handle, but
 * the handle can't be reversed into the underlying uuid.
 */
function anonHandle(authorId: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0xdeadbeef;
  for (let i = 0; i < authorId.length; i++) {
    const c = authorId.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 ^ c, 0x85ebca6b);
  }
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = [h1, h1 >>> 8, h1 >>> 16, h2, h2 >>> 8, h2 >>> 16];
  return bytes
    .map((b) => alphabet[Math.abs(b) % alphabet.length])
    .join("");
}

/**
 * Compose the author byline as "国 · 業界 · 職種" — falls back to the
 * thread's own tags when the profile is blank, and finally to the
 * display name. Empty parts are dropped so we never render ` ·  · `.
 */
function bylineLabel(
  author: AuthorSnapshot | null,
  threadIndustry?: string | null,
  threadCountry?: string | null,
  threadRole?: string | null,
): string {
  const labelFrom = (
    opts: ReadonlyArray<{ v: string; label: string }>,
    value: string | null | undefined,
  ): string | null => {
    if (!value) return null;
    const hit = opts.find((o) => o.v === value);
    return hit ? stripFlag(hit.label) : value;
  };
  const country =
    labelFrom(COUNTRY_OPTS, author?.to_country) ??
    labelFrom(COUNTRY_OPTS, threadCountry);
  const industry =
    labelFrom(INDUSTRY_OPTS, author?.industry) ??
    labelFrom(INDUSTRY_OPTS, threadIndustry);
  const role =
    labelFrom(ROLE_OPTS, author?.role) ?? labelFrom(ROLE_OPTS, threadRole);
  const parts = [country, industry, role].filter(Boolean) as string[];
  if (parts.length > 0) return parts.join(" · ");
  return author?.display_name?.trim() || "メンバー";
}

function stripFlag(label: string): string {
  return label.replace(/^[^\p{L}\p{N}]+\s*/u, "").trim() || label;
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

export type DisplayThread = {
  id: string;
  authorId: string;
  title: string;
  body: string;
  category: string;
  country: string;
  industry: string;
  role: string;
  ups: number;
  downs: number;
  replies: number;
  /** Composed byline "国 · 業界 · 職種" */
  authorLabel: string;
  /** Anonymous 6-char handle */
  authorHandle: string;
  /** True when the author has finished onboarding (real verified user) */
  authorVerified: boolean;
  /** Deterministic avatar bg/text classes */
  authorBg: string;
  authorText: string;
  /** 2-char monogram */
  authorInitials: string;
  posted: string;
  /** True when updated_at is meaningfully after created_at (post was edited) */
  edited: boolean;
};

export function toDisplayThread(row: ThreadRow): DisplayThread {
  const chip = authorChip(row.author_id);
  const createdMs = new Date(row.created_at).getTime();
  const updatedMs = new Date(row.updated_at).getTime();
  return {
    id: row.id,
    authorId: row.author_id,
    title: row.title,
    body: row.body,
    category: row.category,
    country: row.country ?? "",
    industry: row.industry ?? "",
    role: row.role ?? "",
    ups: row.ups_count,
    downs: row.downs_count,
    replies: row.replies_count,
    authorLabel: bylineLabel(row.author, row.industry, row.country, row.role),
    authorHandle: anonHandle(row.author_id),
    authorVerified: !!row.author?.onboarded_at,
    authorBg: chip.bg,
    authorText: chip.text,
    authorInitials: initialsFor(row.author?.display_name),
    posted: relativeJa(row.created_at),
    // Treat as edited if updated > 60s after creation — the initial
    // insert may write updated_at first.
    edited: updatedMs - createdMs > 60_000,
  };
}

export type DisplayComment = {
  id: string;
  parentId: string | null;
  authorName: string;
  authorLabel: string;
  authorHandle: string;
  authorVerified: boolean;
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
    parentId: row.parent_id,
    authorName: author,
    authorLabel: bylineLabel(row.author),
    authorHandle: anonHandle(row.author_id),
    authorVerified: !!row.author?.onboarded_at,
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
