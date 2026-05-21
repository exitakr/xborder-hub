import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    return [
      { source: "/", destination: "/index.html" },
      { source: "/home", destination: "/home.html" },
      { source: "/search", destination: "/search.html" },
      { source: "/profile", destination: "/profile.html" },
      { source: "/mypage", destination: "/mypage.html" },
      { source: "/premium", destination: "/premium.html" },
      { source: "/login", destination: "/login.html" },
      { source: "/chat", destination: "/chat.html" },
      { source: "/threads", destination: "/threads.html" },
      { source: "/thread", destination: "/thread.html" },
      { source: "/thread/new", destination: "/thread-new.html" },
    ];
  },
};

export default config;
