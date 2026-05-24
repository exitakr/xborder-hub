import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/guard";
import { ThreadsClient } from "./ThreadsClient";

export const metadata: Metadata = {
  title: "スレッド",
};

export default async function ThreadsPage() {
  const user = await getCurrentUser();
  return <ThreadsClient isLoggedIn={!!user} />;
}
