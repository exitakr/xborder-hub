import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Exchanges an OAuth / magic-link code for a session.
 *
 * Also handles `token_hash` + `type`, which is what Supabase's email templates
 * send. Without that branch, confirming an email on a different device than the
 * one that signed up fails, because the PKCE verifier lives in the original
 * browser only.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const rawNext = searchParams.get("next") ?? "/portfolio";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/portfolio";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "email" | "magiclink" | "recovery" | "invite" | "email_change",
    });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
