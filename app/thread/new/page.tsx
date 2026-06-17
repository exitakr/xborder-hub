import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/guard";
import { enforceOnboarding } from "@/lib/profile/onboarding";
import { ThreadNewClient } from "./ThreadNewClient";

export const metadata: Metadata = {
  title: "新しいスレッド",
};

export default async function ThreadNewPage() {
  await requireUser("/thread/new");
  await enforceOnboarding("/thread/new");
  return <ThreadNewClient />;
}
