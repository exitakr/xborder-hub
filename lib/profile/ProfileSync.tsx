"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { dbProfileToClient } from "@/lib/profile/serverProfile";
import { useProfile, type Profile } from "@/lib/profile/store";
import type { Profile as DbProfile } from "@/lib/supabase/database.types";

// Hydrate at most once per page-load JS context — survives the per-page
// remounts of AppTopBar so we don't re-query on every client navigation.
let hydratedOnce = false;

/**
 * Pulls the signed-in user's profile from Supabase on first mount and
 * merges it into the localStorage store, making the DB the source of
 * truth across devices. Server values win when present; local-only data
 * (e.g. a career timeline saved before migration 0006) is preserved when
 * the server field is still empty. Renders nothing.
 */
export function ProfileSync() {
  const [, setProfile] = useProfile();

  useEffect(() => {
    if (hydratedOnce) return;
    hydratedOnce = true;

    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) return;

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        if (error || !data || cancelled) return;

        const server = dbProfileToClient(data as DbProfile);
        // Nothing meaningful on the server yet — leave local untouched.
        if (!server.name) return;

        setProfile((local) => mergeProfiles(local, server));
      } catch {
        // Offline / missing env — localStorage keeps working.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setProfile]);

  return null;
}

function isMeaningful(v: unknown): boolean {
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "string") return v.trim().length > 0;
  return v != null;
}

/** Server value wins when present; otherwise keep the local value. */
function mergeProfiles(local: Profile, server: Profile): Profile {
  const out = { ...local } as Record<string, unknown>;
  for (const [k, v] of Object.entries(server)) {
    if (k === "ccAvailable") {
      out[k] = server.ccAvailable; // boolean — server is authoritative
    } else if (isMeaningful(v)) {
      out[k] = v;
    }
  }
  return out as Profile;
}
