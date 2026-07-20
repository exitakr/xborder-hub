import "server-only";

import { createStaticClient } from "@/lib/supabase/static";

export type SalaryPageStats = {
  n: number;
  salary: { key: string; count: number }[];
  rent: { key: string; count: number }[];
  visa: { key: string; count: number }[];
  wlbAvg: number | null;
  lifeAvg: number | null;
};

const EMPTY: SalaryPageStats = {
  n: 0,
  salary: [],
  rent: [],
  visa: [],
  wlbAvg: null,
  lifeAvg: null,
};

/**
 * Aggregates for one SEO page via the anon-safe salary_page_stats RPC
 * (migration 0015). Distributions are only present when n >= 5 — below
 * that the page renders the データ募集中 CTA instead.
 */
export async function fetchSalaryPageStats(
  countryDb: string,
  roleDb?: string,
): Promise<SalaryPageStats> {
  try {
    const supabase = createStaticClient();
    const { data, error } = await supabase.rpc("salary_page_stats", {
      p_country: countryDb,
      p_role: roleDb ?? null,
    });
    if (error || !data) {
      if (error) console.error("[seo] salary_page_stats", error.message);
      return EMPTY;
    }
    const rows = data as { kind: string; key: string; val: number }[];
    const stats: SalaryPageStats = { ...EMPTY, salary: [], rent: [], visa: [] };
    for (const r of rows) {
      switch (r.kind) {
        case "n":
          stats.n = Number(r.val);
          break;
        case "salary":
          stats.salary.push({ key: r.key, count: Number(r.val) });
          break;
        case "rent":
          stats.rent.push({ key: r.key, count: Number(r.val) });
          break;
        case "visa":
          stats.visa.push({ key: r.key, count: Number(r.val) });
          break;
        case "wlb_avg":
          stats.wlbAvg = Number(r.val);
          break;
        case "life_avg":
          stats.lifeAvg = Number(r.val);
          break;
      }
    }
    return stats;
  } catch (err) {
    console.error("[seo] salary_page_stats (catch)", err);
    return EMPTY;
  }
}
