import "server-only";

import { createClient } from "@/lib/supabase/server";

const SCHEMA_MISSING = /relation .* does not exist/i;

/**
 * The set of sample (seed) keys the admin has hidden. Sample content is
 * static and shown to everyone; admins can dismiss individual items and the
 * dismissal is recorded in public.dismissed_samples (migration 0005).
 *
 * Returns an empty array if the table isn't there yet — samples then show
 * for everyone, which is the desired pre-migration default.
 */
export async function fetchDismissedSampleKeys(): Promise<string[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("dismissed_samples")
      .select("sample_key");
    if (error) {
      if (!SCHEMA_MISSING.test(error.message)) {
        console.error("[samples] fetchDismissedSampleKeys", error);
      }
      return [];
    }
    return (data ?? []).map((r) => (r as { sample_key: string }).sample_key);
  } catch (err) {
    console.error("[samples] fetchDismissedSampleKeys (catch)", err);
    return [];
  }
}
