"use server";

import { createStaticClient } from "@/lib/supabase/static";

/**
 * Public count of contributed salary rows for a target country — powers the
 * "対象国の実データ N件 / 経験者に相談できる" line on the diagnostic result.
 * Anonymous-safe (salary_page_stats is granted to anon; we only read n).
 */
export async function countTargetCountry(countryDb: string): Promise<number> {
  if (!countryDb) return 0;
  try {
    const supabase = createStaticClient();
    const { data, error } = await supabase.rpc("salary_page_stats", {
      p_country: countryDb,
      p_role: null,
    });
    if (error || !data) return 0;
    const n = (data as { kind: string; val: number }[]).find(
      (r) => r.kind === "n",
    );
    return n ? Number(n.val) : 0;
  } catch {
    return 0;
  }
}
