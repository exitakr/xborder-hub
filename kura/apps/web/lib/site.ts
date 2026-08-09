/**
 * Web-deployment-specific identity values.
 *
 * The product name itself lives in @oma/core so the web and native apps cannot
 * disagree about it; only things that are genuinely per-deployment (canonical
 * origin, support address) are resolved from the environment here.
 */
export const site = {
  domain: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "support@example.com",
} as const;
