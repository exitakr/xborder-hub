import "server-only";

import { createClient } from "@/lib/supabase/server";

const SCHEMA_MISSING = /relation .* does not exist/i;

export type ActiveCommunity = {
  id: string;
  kind: "country" | "industry" | "role";
  label: string;
  members_count: number;
};

/**
 * Active communities for user-facing surfaces (/threads strip). Readable by
 * any authenticated user via communities_select_auth (0002). Admin-approved
 * communities show up here, so approval has a visible effect.
 */
export async function fetchActiveCommunities(): Promise<ActiveCommunity[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("communities")
      .select("id, kind, label, members_count")
      .eq("active", true)
      .order("members_count", { ascending: false })
      .limit(30);
    if (error) {
      if (!SCHEMA_MISSING.test(error.message)) {
        console.error("[communities] fetchActive", error);
      }
      return [];
    }
    return (data ?? []) as ActiveCommunity[];
  } catch (err) {
    console.error("[communities] fetchActive (catch)", err);
    return [];
  }
}
