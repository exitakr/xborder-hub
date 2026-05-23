import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// VERCEL-MARKER: latest-typing-fix-2026-05-22
// If the Vercel build log still complains that `cookiesToSet` is implicitly
// any on this file, the build is running against a commit older than
// 2a8efc9 — trigger a manual Redeploy from the Deployments tab.

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

/**
 * Server-side Supabase client for use in Server Components, Route Handlers,
 * and Server Actions. Reads/writes the user's session via Next.js cookies.
 */
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env vars. Copy .env.example to .env.local and fill them in.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component — cookie mutation is read-only there.
          // Middleware will refresh the session on the next request.
        }
      },
    },
  });
}
