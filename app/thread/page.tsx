import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/guard";
import { ThreadClient } from "./ThreadClient";

export const metadata: Metadata = {
  title: "スレッド詳細",
};

export default async function ThreadPage() {
  const user = await getCurrentUser();
  return <ThreadClient isLoggedIn={!!user} />;
}
