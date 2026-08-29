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

/**
 * Rakuten caps a page at 30, so more than that means paging.
 *
 * One page was enough when the query was wide open. It stopped being enough
 * once 0023 pushed the price band into the request: a floor of ¥400,000 on a
 * Chanel 19 removes most of the page before the median ever sees it, and the
 * five-sample minimum then rejected what was left. Paging is how the sample is
 * restored WITHOUT relaxing any of the quality gates — more of the same
 * filtered inventory, not looser filters.
 */
const HITS = 30;
const MAX_PAGES = 3;
/** Stop paging as soon as there is a comfortable sample; each page is a request. */
const ENOUGH = 12;

/**
 * Listings that use the item's name but are not the item.
 *
 * A search for a luxury bag returns its accessory economy — protective covers,
 * bag charms, handle wraps, storage bags, replicas — and there are far more of
 * those than of the bag. Excluding them at the source is the only reliable
 * filter: they are internally consistent in price, so no statistic computed
 * afterwards can tell them apart from a genuine cheap listing.
 */
/*
 * Words that name a DIFFERENT PRODUCT, and only those.
 *
 * The previous list was longer and it was quietly destroying the results it
 * was meant to protect. Rakuten's NGKeyword is matched against the whole item
 * title, and Japanese marketplace titles are long, descriptive sentences —
 * unlike eBay's terse English ones, which is why the same idea is safe there
 * and dangerous here. These were all in the list and all appear constantly in
 * listings for the genuine article:
 *
 *   収納   「収納力抜群」 is in the title of nearly every bag on Rakuten
 *   持ち手 「持ち手に使用感あり」 is how a pre-owned bag's condition is stated
 *   風     matches 風合い, the standard word for leather texture
 *   カバー 「保存袋・カバー付き」 — an accessory INCLUDED with the bag
 *   保護   「保護袋付き」, same
 *   ケース 「ギャランティケース付属」, same
 *   似     matches 類似 in ordinary prose
 *
 * Each of those excluded exactly the well-described, complete, higher-value
 * listings — the ones a median most wants — and that is most of why bags came
 * back as "データ不足".
 */
const EXCLUDE = [
  "チャーム", "キーホルダー", "型紙", "レプリカ", "インナーバッグ", "中敷き",
  "クリーナー", "ステッカー",
];

/**
 * Exclusions that only apply to one kind of thing.
 *
 * Same rule as above: each word has to name a different product rather than
 * describe a part of this one. 「ベルト」 was removed from the watch list for
 * that reason — 「純正ベルト付属」 is a complete watch, not a strap.
 */
const EXCLUDE_BY_CATEGORY: Record<string, string[]> = {
  car: [
    "ミニカー", "模型", "プラモデル", "トミカ", "1/18", "1/24", "1/43",
    "エンブレム", "フロアマット", "カタログ", "ポスター", "キーケース",
    "シートカバー", "Tシャツ", "マグカップ",
  ],
  watch: ["ワインダー", "工具", "電池", "コマ詰め"],
  bag: ["ツイリー", "バッグインバッグ", "底板"],
  sneaker: ["靴紐", "シューレース", "インソール", "シューキーパー", "洗剤"],
};

/**
 * How a Rakuten price was arrived at, for the admin screen.
 *
 * Deliberately the same idea as the eBay audit and not the same type: the two
 * sources take genuinely different parameters, and flattening them into one
 * shape would mean inventing fields that are null for whichever source is not
 * being described.
 */
export interface RakutenAudit {
  keyword: string;
  ngKeyword: string;
  /** The API request with the application id removed — it is a credential. */
  apiUrl: string;
  /** The same search on Rakuten's own site, for a human to open and judge. */
  webUrl: string;
  minPrice: number | null;
  maxPrice: number | null;
  /** Pages actually fetched. */
  pages: number;
  returned: number;
  used: number;
  low: number | null;
  high: number | null;
}

export interface RakutenPrice extends SourcePrice {
  audit: RakutenAudit;
}

/**
 * Why a search produced no price.
 *
 * The single most useful thing this module can report, and until now it
 * reported nothing at all: a failed fetch returned bare `null`, so the audit
 * describing what had been asked was discarded at exactly the moment somebody
 * needed to read it. That is why the admin screen could not explain a
 * catalogue full of "データ不足" — there was no record to explain it with.
 */
export type RakutenReason =
  | "ok"
  | "not_configured"
  | "http_error"
  | "no_listings"
  | "too_few"
  | "too_spread";

export interface RakutenResult {
  price: RakutenPrice | null;
  /** Always present, including on every failure. That is the whole point. */
  audit: RakutenAudit;
  reason: RakutenReason;
}

export async function fetchRakutenPrice(
  keyword: string,
  {
    category = null,
    minPrice = null,
    maxPrice = null,
  }: {
    category?: string | null;
    /**
     * Floor in JPY, applied as a request parameter.
     *
     * Rakuten's `minPrice` narrows the sample before the median is taken, which
     * is what the cron's after-the-fact floor check cannot do: that one can only
     * throw the whole item away. Both are kept — see the eBay client for why.
     */
    minPrice?: number | null;
    /**
     * Ceiling in JPY. The mirror of the floor: a search for a mid-range model
     * matches the brand's flagship, and a median pulled upward by the wrong
     * model is as wrong as one pulled down by a keyring.
     */
    maxPrice?: number | null;
  } = {},
): Promise<RakutenResult> {
  const floor = minPrice !== null && minPrice > 0 ? Math.floor(minPrice) : null;
  const ceiling = maxPrice !== null && maxPrice > 0 ? Math.ceil(maxPrice) : null;

  /*
   * A validated floor makes the accessory list redundant, so it is dropped.
   *
   * Nothing that costs ¥400,000 is a bag charm. Every exclusion that survives
   * into a banded query is therefore pure downside: it cannot remove an
   * accessory the floor has not already removed, and it CAN remove a genuine
   * listing that happens to mention one — 「チャーム付属」 is a bag that comes
   * with a charm, and excluding it loses the bag.
   *
   * Without a floor the exclusions are still the only defence, so they stay.
   */
  const exclusions = floor !== null
    ? []
    : [...EXCLUDE, ...(category ? (EXCLUDE_BY_CATEGORY[category] ?? []) : [])];
  const ng = exclusions.join(" ");

  const audit: RakutenAudit = {
    keyword,
    ngKeyword: ng,
    apiUrl: "",
    webUrl: rakutenWebUrl(keyword, floor, ceiling),
    minPrice: floor,
    maxPrice: ceiling,
    pages: 0,
    returned: 0,
    used: 0,
    low: null,
    high: null,
  };

  const applicationId = process.env.RAKUTEN_APPLICATION_ID;
  if (!applicationId) return { price: null, audit, reason: "not_configured" };

  const prices: number[] = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const url = new URL(ENDPOINT);
    url.searchParams.set("applicationId", applicationId);
    url.searchParams.set("keyword", keyword);
    if (ng) url.searchParams.set("NGKeyword", ng);
    url.searchParams.set("hits", String(HITS));
    url.searchParams.set("page", String(page));
    url.searchParams.set("format", "json");
    if (floor !== null) url.searchParams.set("minPrice", String(floor));
    if (ceiling !== null) url.searchParams.set("maxPrice", String(ceiling));
    // Relevance, NOT price.
    //
    // This asked for cheapest-first, on the reasoning that the expensive tail
    // was noise. It is the other way round: the cheap end of a luxury search is
    // entirely accessories, so taking the first 30 by price guaranteed a sample
    // containing none of the actual item. A Birkin priced this way came out at
    // roughly the cost of a bag charm, which is precisely what was measured.
    url.searchParams.set("sort", "standard");

    // The application id is a credential and must not reach the admin screen or
    // the database, so the recorded URL is the request minus that one parameter.
    if (page === 1) {
      const redacted = new URL(url.toString());
      redacted.searchParams.delete("applicationId");
      audit.apiUrl = redacted.toString();
    }

    let res: Response;
    try {
      res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
    } catch {
      break;
    }
    // A later page failing is not fatal — whatever the earlier pages returned
    // is still a sample. Only a first-page failure means no data at all.
    if (!res.ok) {
      if (page === 1) return { price: null, audit, reason: "http_error" };
      break;
    }

    const json = await res.json();
    const items = (json as { Items?: unknown })?.Items;
    const count = Array.isArray(items) ? items.length : 0;

    audit.pages = page;
    audit.returned += count;
    prices.push(...readPrices(json));

    // A short page is the last page; asking for another returns nothing.
    if (count < HITS || prices.length >= ENOUGH) break;
  }

  audit.used = prices.length;
  if (prices.length > 0) {
    audit.low = Math.min(...prices);
    audit.high = Math.max(...prices);
  }

  if (prices.length === 0) return { price: null, audit, reason: "no_listings" };

  /*
   * A banded query is a stronger prior than an unbanded one, so it earns a
   * lower bar.
   *
   * Five listings was the right minimum when the query was "シャネル バッグ" and
   * the sample could be anything. With a validated floor, a validated ceiling
   * and a model-specific keyword, three surviving listings all agreeing is
   * better evidence than five unconstrained ones — the filtering happened
   * before the sample rather than after it. The confidence label still reports
   * the small sample honestly; this only decides whether to publish at all.
   */
  const minSamples = floor !== null && ceiling !== null ? 3 : 5;
  if (prices.length < minSamples) return { price: null, audit, reason: "too_few" };

  const median = trimmedMedian(prices, { minSamples });
  if (!median) return { price: null, audit, reason: "too_spread" };

  return {
    price: {
      price: median.price,
      currency: "JPY",
      sampleSize: median.sampleSize,
      spread: median.spread,
      source: "rakuten_ichiba",
      audit,
    },
    audit,
    reason: "ok",
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

/**
 * The same search as a link a person can open.
 *
 * Rakuten's own site takes `min` and `max` as query parameters on the mall
 * search path, so the admin screen can offer the human equivalent of the API
 * call — which is what turns "this price looks wrong" into "here is the pouch
 * that caused it".
 */
function rakutenWebUrl(keyword: string, lo: number | null, hi: number | null): string {
  const url = new URL(`https://search.rakuten.co.jp/search/mall/${encodeURIComponent(keyword)}/`);
  if (lo !== null) url.searchParams.set("min", String(lo));
  if (hi !== null) url.searchParams.set("max", String(hi));
  return url.toString();
}
