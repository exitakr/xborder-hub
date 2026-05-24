import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Non-redirecting session check. Returns the user, or null if Supabase is
 * unavailable or the visitor isn't signed in. Safe to call from any
 * public page that needs to know whether to gate an action behind login.
 */
export async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

/**
 * Server-component auth guard. Redirects to /login if no session, returning
 * the verified user otherwise. Uses getUser() so the JWT is validated by
 * Supabase (cookies alone could be spoofed). Safe to call from any async
 * Server Component / Route Handler.
 */
export async function requireUser(returnTo?: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const dest = returnTo
        ? `/login?next=${encodeURIComponent(returnTo)}`
        : "/login";
      redirect(dest);
    }
    return user;
  } catch {
    // Supabase env vars missing or network blip: send to login so the user
    // never lands on a half-broken protected page.
    redirect("/login");
  }
}

/**
 * Mirror of requireUser for the /login page: if already signed in, bounce to
 * the destination instead of showing the form again.
 */
export async function redirectIfSignedIn(to = "/mypage") {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect(to);
  } catch {
    // No env vars or network issue: let the user see /login.
  }
}
