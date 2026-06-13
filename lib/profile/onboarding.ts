import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * True only when the visitor is signed in AND has a profiles row AND
 * onboarded_at is null. Any error / missing row / missing column returns
 * false so users are never trapped in /welcome by infrastructure issues
 * (e.g. migration 0004 not applied yet).
 */
export async function needsOnboarding(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from("profiles")
      .select("onboarded_at")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !data) return false;
    return (data as { onboarded_at: string | null }).onboarded_at === null;
  } catch {
    return false;
  }
}
