import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const LEGACY_REDIRECTS: { from: string; to: string }[] = [
  { from: "/index.html", to: "/" },
  { from: "/home.html", to: "/home" },
  { from: "/search.html", to: "/search" },
  { from: "/profile.html", to: "/profile" },
  { from: "/mypage.html", to: "/mypage" },
  { from: "/premium.html", to: "/premium" },
  { from: "/login.html", to: "/login" },
  { from: "/chat.html", to: "/chat" },
  { from: "/threads.html", to: "/threads" },
  { from: "/thread.html", to: "/thread" },
  { from: "/thread-new.html", to: "/thread/new" },
  { from: "/404.html", to: "/" },
];

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    // Permanent redirects from the legacy static HTML URLs to the new
    // App Router routes. Catches bookmarks, search-engine snippets, and
    // any in-page link we missed during the migration.
    return LEGACY_REDIRECTS.map(({ from, to }) => ({
      source: from,
      destination: to,
      permanent: true,
    }));
  },
};

export default config;
