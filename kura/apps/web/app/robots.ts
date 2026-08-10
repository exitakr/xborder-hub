import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * The catalogue and the marketing pages are for crawling; everything behind a
 * session is not. `/portfolio`, `/mypage` and `/admin` would 302 to the login
 * page anyway — disallowing them keeps that redirect out of the crawl budget
 * and out of the index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/portfolio", "/mypage", "/admin", "/api/", "/auth/"],
    },
    sitemap: `${site.domain}/sitemap.xml`,
    host: site.domain,
  };
}
