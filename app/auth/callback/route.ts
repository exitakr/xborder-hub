import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { needsOnboarding } from "@/lib/profile/onboarding";

/**
 * Auth callback for magic links, OAuth providers, and email confirmation.
 * Exchanges the one-time code for a session cookie and redirects to `next`.
 * First-time members (profiles.onboarded_at is null) detour to /welcome —
 * except on the password-recovery path, which must reach /reset-password.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/mypage";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (next !== "/reset-password" && (await needsOnboarding())) {
        return NextResponse.redirect(
          `${origin}/welcome?next=${encodeURIComponent(next)}`,
        );
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("認証に失敗しました。もう一度お試しください。")}`,
  );
}
