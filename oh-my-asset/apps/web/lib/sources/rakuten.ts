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

/**
 * Listings that use the item's name but are not the item.
 *
 * A search for a luxury bag returns its accessory economy — protective covers,
 * bag charms, handle wraps, storage bags, replicas — and there are far more of
 * those than of the bag. Excluding them at the source is the only reliable
 * filter: they are internally consistent in price, so no statistic computed
 * afterwards can tell them apart from a genuine cheap listing.
 */
const EXCLUDE = [
  "保護", "カバー", "チャーム", "キーホルダー", "ケース", "型紙", "ハンドル",
  "持ち手", "レプリカ", "風", "収納", "インナーバッグ", "中敷き", "スタンド",
  "クリーナー", "修理", "リペア", "ショルダーストラップ", "似", "ステッカー",
];

/**
 * Exclusions that only apply to one kind of thing.
 *
 * Same reasoning as the eBay client, and more acute here: a Japanese
 * marketplace search for a car brand is almost entirely ミニカー, parts and
 * merchandise, because Rakuten Ichiba does not sell cars. That is worth saying
 * plainly — for `car` this source is close to unusable, and the honest outcome
 * is a refusal rather than the price of a 1/18 model.
 */
const EXCLUDE_BY_CATEGORY: Record<string, string[]> = {
  car: [
    "ミニカー", "模型", "プラモデル", "トミカ", "1/18", "1/24", "1/43",
    "エンブレム", "ステアリング", "フロアマット", "パーツ", "部品", "ホイール",
    "カタログ", "ポスター", "キーケース", "スマートキー", "シートカバー",
    "ミラー", "ライト", "ステッカー", "Tシャツ", "マグカップ",
  ],
  watch: ["ベルト", "バンド", "ブレス", "ガラス", "ワインダー", "コマ", "工具", "電池"],
  bag: ["スカーフ", "ツイリー", "バッグインバッグ", "底板", "ショルダー紐"],
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
  returned: number;
  used: number;
  low: number | null;
  high: number | null;
}

export interface RakutenPrice extends SourcePrice {
  audit: RakutenAudit;
}

export async function fetchRakutenPrice(
  keyword: string,
  {
    category = null,
    minPrice = null,
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
  } = {},
): Promise<RakutenPrice | null> {
  const applicationId = process.env.RAKUTEN_APPLICATION_ID;
  if (!applicationId) return null;

  const ng = [...EXCLUDE, ...(category ? (EXCLUDE_BY_CATEGORY[category] ?? []) : [])].join(" ");
  const floor = minPrice !== null && minPrice > 0 ? Math.floor(minPrice) : null;

  const url = new URL(ENDPOINT);
  url.searchParams.set("applicationId", applicationId);
  url.searchParams.set("keyword", keyword);
  url.searchParams.set("NGKeyword", ng);
  url.searchParams.set("hits", String(HITS));
  url.searchParams.set("format", "json");
  if (floor !== null) url.searchParams.set("minPrice", String(floor));
  // Relevance, NOT price.
  //
  // This asked for cheapest-first, on the reasoning that the expensive tail was
  // noise. It is the other way round: the cheap end of a luxury search is
  // entirely accessories, so taking the first 30 by price guaranteed a sample
  // containing none of the actual item. A Birkin priced this way came out at
  // roughly the cost of a bag charm, which is precisely what was being measured.
  url.searchParams.set("sort", "standard");

  // The application id is a credential and must not reach the admin screen or
  // the database, so the recorded URL is the request minus that one parameter.
  const redacted = new URL(url.toString());
  redacted.searchParams.delete("applicationId");

  const audit: RakutenAudit = {
    keyword,
    ngKeyword: ng,
    apiUrl: redacted.toString(),
    webUrl: `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(keyword)}/${
      floor !== null ? `?min=${floor}` : ""
    }`,
    minPrice: floor,
    returned: 0,
    used: 0,
    low: null,
    high: null,
  };

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return null;

  const json = await res.json();
  const prices = readPrices(json);
  audit.returned = Array.isArray((json as { Items?: unknown })?.Items)
    ? ((json as { Items: unknown[] }).Items.length)
    : 0;
  audit.used = prices.length;
  if (prices.length > 0) {
    audit.low = Math.min(...prices);
    audit.high = Math.max(...prices);
  }
  if (prices.length === 0) return null;

  const median = trimmedMedian(prices);
  if (!median) return null;

  return {
    price: median.price,
    currency: "JPY",
    sampleSize: median.sampleSize,
    spread: median.spread,
    source: "rakuten_ichiba",
    audit,
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
