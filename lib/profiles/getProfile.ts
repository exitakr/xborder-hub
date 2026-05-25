import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/database.types";
import {
  DEFAULT_VISIBILITY_SETTINGS,
  type VisibilitySettings,
} from "@/lib/anonymity/rules";

/**
 * Returns the signed-in user's profile row, or null if not signed in or
 * the row hasn't been provisioned yet. The trigger in migration 0001
 * inserts a profile on auth.users insert, so a null return for a signed-
 * in user means the migration wasn't applied yet.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !data) return null;
    return normalize(data as Profile);
  } catch {
    return null;
  }
}

/** Coerce DB row into our Profile shape, filling in defaults. */
function normalize(row: Profile): Profile {
  return {
    ...row,
    visibility_settings: {
      ...DEFAULT_VISIBILITY_SETTINGS,
      ...(row.visibility_settings as Partial<VisibilitySettings>),
    },
  };
}
