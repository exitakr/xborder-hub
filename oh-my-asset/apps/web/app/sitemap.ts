import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { site } from "@/lib/site";

/**
 * The catalogue is the sitemap.
 *
 * Every item is a page somebody might search for by model number, and until
 * those pages were public there was nothing here worth submitting. Generated
 * from the database rather than hand-maintained, so an item a user adds is
 * discoverable without anyone remembering to list it.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = site.domain;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/market`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/signup`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.3 },
    // Ranks for "where does <app> get its prices", which is a question people
    // search before trusting a portfolio tool.
    { url: `${base}/data-sources`, changeFrequency: "monthly", priority: 0.5 },
    // Public on purpose: "what are the levels" is a question people ask about
    // the app before deciding to try it, and it is the page most likely to be
    // linked to by someone showing off a rank.
    { url: `${base}/levels`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/login`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/legal/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/legal/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("market_items")
      .select("id, price_updated_at")
      .limit(5000);

    const items: MetadataRoute.Sitemap = (data ?? []).map((row) => ({
      url: `${base}/items/${row.id as string}`,
      lastModified: row.price_updated_at
        ? new Date(row.price_updated_at as string)
        : undefined,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));

    return [...staticRoutes, ...items];
  } catch {
    // A sitemap missing its item pages is worth far more than a 500 that makes
    // the crawler drop the whole file.
    return staticRoutes;
  }
}
