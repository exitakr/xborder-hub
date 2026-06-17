import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/guard";
import { adaptThreadRow, fetchThreads } from "@/lib/threads/queries";
import { isCurrentUserAdmin } from "@/lib/admin/queries";
import { fetchDismissedSampleKeys } from "@/lib/samples/queries";
import { enforceOnboarding } from "@/lib/profile/onboarding";
import { ThreadsClient } from "./ThreadsClient";

export const metadata: Metadata = {
  title: "スレッド",
};

export const dynamic = "force-dynamic";

export default async function ThreadsPage() {
  await enforceOnboarding("/threads");
  const [user, rows, isAdmin, dismissedKeys] = await Promise.all([
    getCurrentUser(),
    fetchThreads(),
    isCurrentUserAdmin(),
    fetchDismissedSampleKeys(),
  ]);
  const dbThreads = rows.map(adaptThreadRow);
  return (
    <ThreadsClient
      isLoggedIn={!!user}
      dbThreads={dbThreads}
      isAdmin={isAdmin}
      dismissedKeys={dismissedKeys}
    />
  );
}
