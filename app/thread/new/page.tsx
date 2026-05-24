import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/guard";
import { ThreadNewClient } from "./ThreadNewClient";

export const metadata: Metadata = {
  title: "新しいスレッド",
};

export default async function ThreadNewPage() {
  await requireUser("/thread/new");
  return <ThreadNewClient />;
}
