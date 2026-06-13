import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  CompEntry,
  CompensationData,
} from "@/lib/supabase/database.types";

/**
 * Matches both missing-table errors and missing-RPC errors — PostgREST
 * reports an absent function as PGRST202 / "Could not find the function",
 * not "relation does not exist".
 */
const SCHEMA_MISSING =
  /relation .* does not exist|column .* does not exist|function .* does not exist|could not find the function|PGRST202/i;

function safeIgnore(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    ("message" in error || "code" in error)
  ) {
    const e = error as { message?: string; code?: string };
    if (e.code === "PGRST202") return true;
    return typeof e.message === "string" && SCHEMA_MISSING.test(e.message);
  }
  return false;
}

/**
 * The signed-in user's own compensation row (RLS permits exactly this).
 * Non-null result = the user has contributed = browsing is unlocked.
 */
export async function fetchOwnCompRow(): Promise<CompensationData | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("compensation_data")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) {
      if (!safeIgnore(error)) console.error("[comp] fetchOwnCompRow", error);
      return null;
    }
    return (data ?? null) as CompensationData | null;
  } catch (err) {
    console.error("[comp] fetchOwnCompRow (catch)", err);
    return null;
  }
}

export type CompFilters = {
  country?: string;
  industry?: string;
  role?: string;
};

/** Anonymous entries via the Give-to-Get RPC. [] until the user contributes. */
export async function fetchCompEntries(
  filters: CompFilters = {},
  limit = 50,
  offset = 0,
): Promise<CompEntry[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("fetch_comp_entries", {
      p_country: filters.country || null,
      p_industry: filters.industry || null,
      p_role: filters.role || null,
      p_limit: limit,
      p_offset: offset,
    });
    if (error) {
      if (!safeIgnore(error)) console.error("[comp] fetchCompEntries", error);
      return [];
    }
    return (data ?? []) as CompEntry[];
  } catch (err) {
    console.error("[comp] fetchCompEntries (catch)", err);
    return [];
  }
}

/** Total contribution count — teaser shown on the locked state. */
export async function fetchCompEntryCount(): Promise<number | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("count_comp_entries");
    if (error) {
      if (!safeIgnore(error)) console.error("[comp] fetchCompEntryCount", error);
      return null;
    }
    return typeof data === "number" ? data : Number(data) || 0;
  } catch (err) {
    console.error("[comp] fetchCompEntryCount (catch)", err);
    return null;
  }
}
