/**
 * Web-deployment-specific identity values.
 *
 * The product name itself lives in @oma/core so the web and native apps cannot
 * disagree about it; only the canonical origin is genuinely per-deployment.
 *
 * There is deliberately no support address here. Support runs through the
 * contact form, which writes to a table the admin dashboard reads — an address
 * in the client bundle would be a personal mailbox published on every page,
 * and a second, unwatched channel for messages to arrive on.
 */

/**
 * The origin every canonical URL, Open Graph tag and sitemap entry is built
 * from.
 *
 * The old version of this file read one variable and fell back to
 * `http://localhost:3000`. That fallback is the most expensive kind of bug:
 * nothing breaks, no error is logged, and the site quietly publishes a sitemap
 * full of localhost URLs and a canonical tag pointing at a machine no crawler
 * can reach — which is indistinguishable, from the outside, from a site that
 * simply has no visitors.
 *
 * So the localhost value is now the last resort rather than the only
 * alternative. Vercel injects the deployment's own hostname into the build
 * environment, which is right often enough to keep an unconfigured production
 * deployment indexable:
 *
 *   NEXT_PUBLIC_SITE_URL            the answer, once a custom domain exists
 *   VERCEL_PROJECT_PRODUCTION_URL   the project's stable production hostname
 *   VERCEL_URL                      this specific deployment (preview builds)
 *
 * Only the first is a decision; the rest are recovery. Set it as soon as
 * ohmyasset.com resolves, because a preview hostname is stable enough to index
 * and not stable enough to keep.
 */
function resolveOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return withScheme(stripTrailingSlash(explicit));

  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || process.env.VERCEL_URL?.trim();
  if (vercel) return withScheme(stripTrailingSlash(vercel));

  return "http://localhost:3000";
}

/** Vercel's variables carry a bare hostname; `new URL()` needs a scheme. */
function withScheme(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

/** A trailing slash here produces `//items/…` everywhere it is concatenated. */
function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export const site = {
  domain: resolveOrigin(),
} as const;
