import type { MetadataRoute } from "next";

const BASE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://xborder-hub.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/mypage",
        "/chat",
        "/notifications",
        "/welcome",
        "/reset-password",
        "/auth/",
      ],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
