import "server-only";

import { fetchThreads } from "@/lib/threads/queries";
import { LABELS } from "@/app/threads/data";
import type { TrendingThread } from "@/app/home/data";

/** Top DB threads by 👍, mapped onto the home trending card shape.
 * Returns [] when the DB is empty / unavailable so the caller can fall
 * back to the bundled samples. */
export async function loadTrendingThreads(): Promise<TrendingThread[]> {
  const rows = await fetchThreads(50);
  return rows
    .sort((a, b) => b.ups_count - a.ups_count)
    .slice(0, 4)
    .map((r) => ({
      id: r.id,
      category: LABELS.categories[r.category] ?? r.category,
      title: r.title,
      replies: r.replies_count,
      ups: r.ups_count,
    }));
}
