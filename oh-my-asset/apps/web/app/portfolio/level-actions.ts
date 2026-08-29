"use server";

import { MAX_LEVEL } from "@oma/core";
import { createClient } from "@/lib/supabase/server";

/**
 * Remember a promotion.
 *
 * Called from the badge the first time it renders a level above the stored
 * peak, which is what makes the level survive selling. See migration 0025 for
 * why the peak is stored at all, and why accepting a client-computed level is
 * an acceptable trade here: it can only ever go up, it is clamped at both ends,
 * and no entitlement is attached to a level. The moment one is, this has to
 * start computing the level instead of being told it.
 *
 * Failure is deliberately silent. A badge that briefly shows a level the
 * database has not caught up with is a non-event; an error toast over one is
 * not.
 */
export async function recordLevelPeak(level: number): Promise<void> {
  if (!Number.isFinite(level)) return;
  const clamped = Math.min(MAX_LEVEL, Math.max(1, Math.floor(level)));

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_level_peak", { p_level: clamped });

  if (error) {
    // Logged rather than surfaced: the operator wants to know if migration
    // 0025 was never applied, and the collector does not.
    console.error("[levels] could not store peak:", error.message);
  }
}
