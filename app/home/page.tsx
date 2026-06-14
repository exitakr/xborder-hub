import type { Metadata } from "next";
import { loadTrendingThreads } from "@/lib/threads/trending";
import { isCurrentUserAdmin } from "@/lib/admin/queries";
import { fetchDismissedSampleKeys } from "@/lib/samples/queries";
import { HomeClient } from "./HomeClient";

export const metadata: Metadata = {
  title: "ホーム — 今、世界で起きている動き",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [trending, isAdmin, dismissedKeys] = await Promise.all([
    loadTrendingThreads(),
    isCurrentUserAdmin(),
    fetchDismissedSampleKeys(),
  ]);
  return (
    <HomeClient
      trendingThreads={trending}
      isAdmin={isAdmin}
      dismissedKeys={dismissedKeys}
    />
  );
}
