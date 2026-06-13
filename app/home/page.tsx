import type { Metadata } from "next";
import { loadTrendingThreads } from "@/lib/threads/trending";
import { HomeClient } from "./HomeClient";

export const metadata: Metadata = {
  title: "ホーム — 今、世界で起きている動き",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const trending = await loadTrendingThreads();
  return <HomeClient trendingThreads={trending} />;
}
