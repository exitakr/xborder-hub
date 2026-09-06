/**
 * A block of schema.org JSON-LD.
 *
 * WHAT IS DELIBERATELY NOT HERE
 *
 * The obvious markup for an item page is `Product` with an `offers` block
 * carrying the price, and it is tempting because it is what earns a rich
 * result. It is also wrong twice over. Nothing on this site is for sale, and
 * `offers` asserts that it is; and every price here is explicitly described, in
 * the footer of every page, as an estimate that may differ from an actual
 * transaction. Publishing that same number as a machine-readable offer
 * contradicts the disclaimer in the only place a regulator or a search engine
 * would read literally.
 *
 * So this stays limited to structure — what the site is, and where a page sits
 * within it. Those claims are true, they survive any change to the pricing
 * pipeline, and they are what produces breadcrumbs and a sitelinks search box
 * in a result page.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // The payload is built from our own strings and database rows rather
      // than from anything a visitor supplies, and `JSON.stringify` escapes the
      // quoting. `<` is escaped by hand anyway, because a name containing
      // "</script>" would otherwise close this tag early — the one injection
      // this element is actually exposed to.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
