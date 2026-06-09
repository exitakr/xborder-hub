import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/guard";
import { adaptThreadRow, fetchThreads } from "@/lib/threads/queries";
import { ThreadsClient } from "./ThreadsClient";

export const metadata: Metadata = {
  title: "スレッド",
};

export const dynamic = "force-dynamic";

export default async function ThreadsPage() {
  const [user, rows] = await Promise.all([getCurrentUser(), fetchThreads()]);
  const dbThreads = rows.map(adaptThreadRow);
  return <ThreadsClient isLoggedIn={!!user} dbThreads={dbThreads} />;
}
