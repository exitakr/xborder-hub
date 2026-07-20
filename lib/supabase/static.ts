import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cookie-less anon Supabase client for statically generated / ISR pages
 * (e.g. the public /salaries/[country] SEO pages). Never reads the request,
 * so Next.js can prerender and cache the page. Only use for data that is
 * safe for anonymous visitors (aggregates gated by the n>=5 rule in SQL).
 */
export function createStaticClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env vars. Copy .env.example to .env.local and fill them in.",
    );
  }
  return createSupabaseClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
