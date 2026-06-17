import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/database.types";
import type { Profile as ClientProfile } from "@/lib/profile/store";
import { dbProfileToClient } from "@/lib/profile/serverProfile";
import {
  DEFAULT_VISIBILITY_SETTINGS,
  type VisibilitySettings,
} from "@/lib/anonymity/rules";

/**
 * Any member's profile by id, mapped to the client shape with the owner's
 * visibility_settings applied (companies / salary / skills / visa are
 * stripped when hidden). Returns null when not found or the row has no
 * display name yet.
 *
 * Goes through the `fetch_public_profile` SECURITY DEFINER RPC so the
 * visibility gate is enforced inside Postgres — the base `profiles` table
 * is owner-only since migration 0007, so direct anon-key queries from a
 * malicious authenticated user cannot bypass the filter.
 */
export async function fetchPublicProfile(
  id: string,
): Promise<{ profile: ClientProfile; userId: string } | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .rpc("fetch_public_profile", { p_id: id })
      .maybeSingle();
    if (error || !data) return null;
    const row = data as unknown as Profile;
    if (!(row.display_name ?? "").trim()) return null;
    // Server already applied visibility — pass through to the client mapper
    // without re-gating (otherwise we'd double-strip and lose visible data).
    return {
      profile: dbProfileToClient(row, { respectVisibility: false }),
      userId: row.id,
    };
  } catch {
    return null;
  }
}

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
