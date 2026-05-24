import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Routes that require an authenticated user. Anything else is treated as
 * public. Add new prefixes here as they are introduced.
 */
const PROTECTED_PREFIXES = ["/mypage", "/chat", "/profile"];

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export async function updateSession(request: NextRequest) {
  // Default: let the request through unchanged. We only override when we
  // need to refresh cookies or perform a redirect. ANY uncaught failure in
  // the Supabase auth path falls back to this passthrough so the user
  // sees a working page rather than a 500.
  const passthrough = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Without env vars there's nothing to refresh.
  if (!url || !anonKey) return passthrough;

  try {
    let response = passthrough;

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });

    // IMPORTANT: getUser() validates the JWT with Supabase; getSession()
    // only reads the cookie and can be spoofed. Use getUser() here.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    if (!user && isProtected(pathname)) {
      const redirect = request.nextUrl.clone();
      redirect.pathname = "/login";
      redirect.searchParams.set("next", pathname);
      return NextResponse.redirect(redirect);
    }

    if (user && pathname === "/login") {
      const redirect = request.nextUrl.clone();
      redirect.pathname = "/mypage";
      redirect.search = "";
      return NextResponse.redirect(redirect);
    }

    return response;
  } catch (err) {
    // Network blips, malformed JWT, Supabase unreachable, etc. — never
    // 500 the entire site over middleware. Log for visibility and serve
    // the page without session refresh.
    console.error("[middleware] supabase session refresh failed", err);
    return passthrough;
  }
}
