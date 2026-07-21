import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Edge middleware that enforces two things on every protected route:
 *   1. Supabase session cookies are refreshed (standard @supabase/ssr pattern).
 *   2. Signed-in users without a completed /welcome onboarding (no
 *      profiles.onboarded_at, or empty display_name) are redirected there.
 *
 * Hot path optimisation: once a user completes /welcome, app/welcome/actions.ts
 * sets the httpOnly cookie `xb_onb=1`. The middleware skips the DB lookup
 * whenever that cookie is present, so subsequent navigation is one cookie
 * read with no Supabase round-trip. The cookie is cleared on signOut.
 */

const PUBLIC_PREFIXES = [
  "/login",
  "/auth",
  "/legal",
  "/reset-password",
  "/welcome",
  "/api",
  "/check", // top-of-funnel diagnostic — usable before onboarding
];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: req });
  const { pathname } = req.nextUrl;

  const isPublicPath = PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet: CookieToSet[]) => {
          for (const { name, value, options } of cookiesToSet) {
            req.cookies.set(name, value);
            res.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || isPublicPath) return res;

  if (req.cookies.get("xb_onb")?.value === "1") return res;

  const { data } = await supabase
    .from("profiles")
    .select("onboarded_at")
    .eq("id", user.id)
    .maybeSingle();

  // Gate solely on onboarded_at so this stays in lock-step with
  // needsOnboarding()/app/welcome — /welcome bounces on the same condition,
  // which rules out a /welcome⇄/mypage redirect loop. A non-empty
  // display_name is already enforced server-side at onboarding
  // (app/welcome/actions.ts) and on profile edits (app/mypage/actions.ts),
  // so onboarded_at is a sufficient signal here.
  const onboarded = !!data?.onboarded_at;

  if (!onboarded) {
    const url = req.nextUrl.clone();
    url.pathname = "/welcome";
    url.searchParams.set("next", pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  res.cookies.set("xb_onb", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|svg|webp|ico|gif|woff2?|ttf)).*)",
  ],
};
