import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guard";
import { THREADS } from "@/app/threads/data";
import { SHOW_DEMO_CONTENT } from "@/lib/demo/flags";
import {
  adaptCommentRow,
  fetchComments,
  fetchThreadById,
  toDisplayThread,
  type DisplayThread,
} from "@/lib/threads/queries";
import { ThreadClient } from "./ThreadClient";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
  searchParams: Promise<{ id?: string }>;
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const { id } = await searchParams;
  if (id && UUID_RE.test(id)) {
    const row = await fetchThreadById(id);
    if (row) {
      const description = row.body.slice(0, 120);
      return {
        title: row.title,
        description,
        openGraph: { title: row.title, description },
      };
    }
  }
  return { title: "スレッド詳細" };
}

/** Adapter for the bundled sample threads → DisplayThread shape. */
function sampleToDisplay(t: (typeof THREADS)[number]): DisplayThread {
  return {
    id: t.id,
    title: t.title,
    body: t.body,
    category: t.category,
    country: t.country,
    industry: t.industry,
    role: t.role,
    ups: t.ups,
    downs: t.downs,
    replies: t.replies,
    authorLabel: t.author,
    authorHandle: t.author + "Sample",
    authorVerified: false,
    authorBg: t.bg,
    authorText: t.text,
    authorInitials: t.author,
    posted: t.posted,
  };
}

export default async function ThreadPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  const { id } = await searchParams;

  if (id && UUID_RE.test(id)) {
    const row = await fetchThreadById(id);
    if (row) {
      const comments = await fetchComments(id);
      return (
        <ThreadClient
          isLoggedIn={!!user}
          thread={toDisplayThread(row)}
          comments={comments.map(adaptCommentRow)}
        />
      );
    }
  }

  if (!SHOW_DEMO_CONTENT) notFound();

  const sample = (id && THREADS.find((t) => t.id === id)) || THREADS[0]!;
  return (
    <ThreadClient
      isLoggedIn={!!user}
      thread={sampleToDisplay(sample)}
      comments={[]}
    />
  );
}
