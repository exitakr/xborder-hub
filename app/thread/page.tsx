import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/guard";
import { THREADS } from "@/app/threads/data";
import { ThreadClient } from "./ThreadClient";

export const metadata: Metadata = {
  title: "スレッド詳細",
};

type Props = {
  searchParams: Promise<{ id?: string }>;
};

export default async function ThreadPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  const { id } = await searchParams;
  const numericId = id ? Number.parseInt(id, 10) : NaN;
  const thread =
    THREADS.find((t) => t.id === numericId) ?? THREADS[0]!;
  return <ThreadClient isLoggedIn={!!user} thread={thread} />;
}
