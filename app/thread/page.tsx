import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guard";
import { THREADS } from "@/app/threads/data";
import { SHOW_DEMO_CONTENT } from "@/lib/demo/flags";
import {
  adaptCommentRow,
  adaptThreadRow,
  fetchComments,
  fetchThreadById,
} from "@/lib/threads/queries";
import { ThreadClient } from "./ThreadClient";

export const metadata: Metadata = {
  title: "スレッド詳細",
};

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
  searchParams: Promise<{ id?: string }>;
};

export default async function ThreadPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  const { id } = await searchParams;

  if (id && UUID_RE.test(id)) {
    const row = await fetchThreadById(id);
    if (row) {
      const [comments] = await Promise.all([fetchComments(id)]);
      return (
        <ThreadClient
          isLoggedIn={!!user}
          thread={adaptThreadRow(row)}
          comments={comments.map(adaptCommentRow)}
        />
      );
    }
  }

  if (!SHOW_DEMO_CONTENT) notFound();

  const thread = (id && THREADS.find((t) => t.id === id)) || THREADS[0]!;
  return <ThreadClient isLoggedIn={!!user} thread={thread} comments={[]} />;
}
