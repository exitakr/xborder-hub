/**
 * Whether there is a seller identity to publish.
 *
 * The Specified Commercial Transactions Act notice at /legal/commerce needs a
 * real name, address and telephone number, none of which belong in this
 * repository. Until they are supplied through the environment, that page 404s
 * — so anything that links to it has to ask first. A dead link is a small
 * problem on most pages and a serious one on the screen immediately before a
 * payment, which is exactly where the law wants the link to work.
 */
export function sellerConfigured(): boolean {
  return Boolean(process.env.SELLER_NAME?.trim());
}
