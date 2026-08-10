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
export const site = {
  domain: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;
