import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * True only when the visitor is signed in AND has a profiles row AND
 * onboarded_at is null. Any error / missing row / missing column returns
 * false so users are never trapped in /welcome by infrastructure issues
 * (e.g. migration 0004 not applied yet).
 *
 * NOTE: middleware.ts applies a stricter gate that also requires a
 * non-empty display_name. This helper stays on onboarded_at alone so the
 * one-directional bounce in app/welcome/page.tsx can't loop.
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

/**
 * Page-level guard: a signed-in member who hasn't finished onboarding is
 * bounced to /welcome before they can use the app. Call at the top of an
 * authenticated page's server component, passing the page's own path so we
 * return them here after they finish.
 *
 * Safe against loops: `needsOnboarding()` returns false for signed-out
 * visitors (public pages render normally) and /welcome only redirects in
 * the opposite direction (away, once onboarded).
 */
export async function enforceOnboarding(next: string): Promise<void> {
  if (await needsOnboarding()) {
    redirect(`/welcome?next=${encodeURIComponent(next)}`);
  }
}
