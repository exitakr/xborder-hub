import type { MetadataRoute } from "next";
import { fetchThreads } from "@/lib/threads/queries";

const BASE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://xborder-hub.vercel.app";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const statics: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/threads`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE}/salaries`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/search`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/premium`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/login`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/legal/terms`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${BASE}/legal/privacy`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${BASE}/legal/contact`, changeFrequency: "yearly", priority: 0.1 },
  ];

  // Real threads (best-effort — [] while the DB is empty/unavailable).
  const threads = await fetchThreads(50);
  const threadUrls: MetadataRoute.Sitemap = threads.map((t) => ({
    url: `${BASE}/thread?id=${t.id}`,
    lastModified: new Date(t.updated_at),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [...statics, ...threadUrls];
}
