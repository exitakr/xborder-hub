/**
 * Rakuten Ichiba — Japanese marketplace listings.
 *
 * WHY THIS SOURCE
 * Watches, bags and sneakers have no free API anywhere that reports realised
 * prices. Of the Japanese venues that could, none is usable: Yahoo! Auctions
 * retired its search API for general developers, and Mercari has never had a
 * public one and forbids scraping. Rakuten Ichiba is the one large Japanese
 * marketplace with a free, documented, commercially usable API, and it carries
 * a substantial second-hand (中古) inventory in exactly these categories.
 *
 * WHAT IT IS AND IS NOT
 * These are ASKING prices, the same class of data as eBay Browse, and they read
 * high for the same reason. The advantage over eBay is that they are JPY-native
 * and reflect the Japanese market, which is the one most of this catalogue is
 * priced in. Realised prices come from the community layer instead — see
 * migration 0006 and docs/RESEARCH.md §8.
 *
 * OBLIGATIONS (licence terms, not preferences):
 *  - An application ID is required; register free at webservice.rakuten.co.jp.
 *  - Stay at or under 1 request/second. The cron paces above this already.
 *  - Attribute Rakuten Web Service wherever its data appears. `sourceLabel` in
 *    @oma/core carries the required wording and the item screen renders it.
 *
 * §要検証: the response shape below could not be confirmed against the live API
 * from the build sandbox (outbound access is blocked by the network policy).
 * Parsing is defensive — an unexpected shape yields `null` ("no data") rather
 * than an exception or a wrong number.
 */

import { trimmedMedian } from "@oma/core";
import type { SourcePrice } from "./types";

const ENDPOINT = "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601";

/** The API caps a page at 30, which is comfortably above the median's floor. */
const HITS = 30;

export async function fetchRakutenPrice(keyword: string): Promise<SourcePrice | null> {
  const applicationId = process.env.RAKUTEN_APPLICATION_ID;
  if (!applicationId) return null;

  const url = new URL(ENDPOINT);
  url.searchParams.set("applicationId", applicationId);
  url.searchParams.set("keyword", keyword);
  url.searchParams.set("hits", String(HITS));
  url.searchParams.set("format", "json");
  // Cheapest first. The tail of a collectible search is padded with accessories
  // and empty boxes; the trimmed median below drops both ends anyway, but
  // starting from the low end keeps the sample near the real item.
  url.searchParams.set("sort", "+itemPrice");

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return null;

  const prices = readPrices(await res.json());
  if (prices.length === 0) return null;

  const median = trimmedMedian(prices);
  if (!median) return null;

  return {
    price: median.price,
    currency: "JPY",
    sampleSize: median.sampleSize,
    source: "rakuten_ichiba",
  };
}

/**
 * Rakuten wraps each result as `{ Item: {...} }` inside `Items`. Older revisions
 * of the endpoint returned the item unwrapped, so both shapes are accepted
 * rather than making the price disappear on a format the account happens to get.
 */
function readPrices(json: unknown): number[] {
  if (typeof json !== "object" || json === null) return [];
  const items = (json as { Items?: unknown }).Items;
  if (!Array.isArray(items)) return [];

  const prices: number[] = [];
  for (const entry of items) {
    if (typeof entry !== "object" || entry === null) continue;
    const record = entry as Record<string, unknown>;
    const item =
      typeof record.Item === "object" && record.Item !== null
        ? (record.Item as Record<string, unknown>)
        : record;

    const price = item.itemPrice;
    if (typeof price === "number" && Number.isFinite(price) && price > 0) {
      prices.push(price);
    }
  }
  return prices;
}
