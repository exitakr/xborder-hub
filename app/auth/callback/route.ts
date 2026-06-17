import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { needsOnboarding } from "@/lib/profile/onboarding";

/**
 * Auth callback for magic links, OAuth providers, and email confirmation.
 *
 * Supabase emails can deliver either a PKCE `?code=` (newer projects) or a
 * `?token_hash=&type=` verify link (older templates). We handle BOTH so a
 * confirmation email never dead-ends on /login. First-time members detour
 * to /welcome — except on the password-recovery path.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const { searchParams } = url;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/mypage";

  // Build redirects from a trusted origin: prefer the configured site URL,
  // then the proxy's forwarded host (Vercel), then the request origin.
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    (forwardedHost ? `${forwardedProto ?? "https"}://${forwardedHost}` : url.origin);

  const supabase = await createClient();
  let ok = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  }

  if (ok) {
    if (next !== "/reset-password" && (await needsOnboarding())) {
      return NextResponse.redirect(
        `${origin}/welcome?next=${encodeURIComponent(next)}`,
      );
    }
    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("認証に失敗しました。リンクの有効期限が切れている可能性があります。もう一度お試しください。")}`,
  );
}
