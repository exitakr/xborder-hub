import { trimmedMedian } from "@oma/core";

/**
 * eBay Browse API client.
 *
 * WHY BROWSE AND NOT MARKETPLACE INSIGHTS
 * The SPEC's preferred source for sold prices is the Marketplace Insights API.
 * That API is a Limited Release: eBay's own docs state access "cannot be granted
 * upon request", and in practice it is issued only to major partners. We
 * therefore use the documented fallback from SPEC §3.2 — Browse API asking
 * prices, reduced to a trimmed median.
 *
 * This is an ASKING price, not a SOLD price, and it reads high. Every price this
 * module produces is labelled `ebay_browse` so the UI can say so honestly.
 * If Insights access is ever granted, only `fetchPrices` needs to change.
 *
 * No scraping (SPEC §3.1). This is the public, documented, ToS-compliant API.
 */

const OAUTH_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const BROWSE_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search";
const SCOPE = "https://api.ebay.com/oauth/api_scope";

/** Application token, cached in module scope for the life of the invocation. */
let cachedToken: { value: string; expiresAt: number } | null = null;

/**
 * The request currently fetching a token, if any.
 *
 * The cron now issues eBay searches concurrently, and callers that start
 * together all miss the cache together — without this they would each open
 * their own token request against a cache none of them had filled yet.
 */
let inFlight: Promise<string> | null = null;

export class EbayError extends Error {
  // Written out rather than declared as a constructor parameter property.
  // Node's `--experimental-strip-types`, which is what runs the test suite,
  // refuses parameter properties — they need emitted code, not erased types.
  // That one line of syntax is why this file had no tests until now.
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "EbayError";
    this.status = status;
  }
}

/**
 * Client-credentials grant. The resulting token identifies the application, not
 * a user, which is all the Browse API needs.
 */
export async function getAppToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  // Cleared on both settle paths so a failed request does not pin every later
  // caller to the same rejection.
  inFlight ??= requestToken().finally(() => {
    inFlight = null;
  });

  return inFlight;
}

async function requestToken(): Promise<string> {
  const now = Date.now();
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new EbayError("EBAY_CLIENT_ID / EBAY_CLIENT_SECRET are not configured.");
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(OAUTH_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials", scope: SCOPE }),
    cache: "no-store",
  });

  if (!res.ok) {
    // Deliberately does not echo the response body: it can contain the
    // credentials we just sent.
    throw new EbayError("eBay token request failed", res.status);
  }

  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: json.access_token,
    expiresAt: now + json.expires_in * 1000,
  };
  return cachedToken.value;
}

/** Terms that mark a listing as being about the item rather than being it. */
const EXCLUDE = [
  "case", "cover", "charm", "keychain", "keyring", "strap", "handle",
  "replica", "inspired", "style", "organizer", "insert", "protector",
  "sticker", "decal", "repair", "cleaner", "stand", "dust bag", "box only",
];

/**
 * Extra exclusions that only make sense for one kind of thing.
 *
 * A car is surrounded by a far larger accessory economy than a handbag is, and
 * it is a different one. "BMW" on eBay is overwhelmingly die-cast models, wheel
 * emblems, floor mats, brochures and spare parts, all of them priced in the
 * tens of dollars and all of them internally consistent — which is exactly the
 * shape of data no statistic can rescue. A BMW showing around ¥10,000 is not a
 * cheap BMW; it is a keyring, and the median said so correctly.
 *
 * These lists are the second line of defence. The first is CATEGORY_IDS below,
 * which is far stronger.
 */
const EXCLUDE_BY_CATEGORY: Record<string, string[]> = {
  car: [
    "diecast", "die-cast", "model", "toy", "1:18", "1:24", "1:43", "1/18",
    "scale", "emblem", "badge", "grille", "bumper", "wheel", "rim", "mat",
    "manual", "brochure", "poster", "part", "parts", "steering", "mirror",
    "seat", "knob", "spoiler", "headlight", "sensor", "module", "keyfob",
    "key fob", "hubcap", "shirt", "hat", "mug",
  ],
  watch: ["band", "bracelet", "bezel", "crystal", "winder", "link", "clasp", "crown"],
  bag: ["scarf", "twilly", "wallet insert", "base shaper", "chain strap"],
  sneaker: ["lace", "laces", "insole", "shoe tree", "cleaning kit", "keychain"],
};

/**
 * eBay leaf categories, by our own category column.
 *
 * THIS IS THE FIX THAT ACTUALLY WORKS.
 *
 * Enumerating accessory words is a losing game: there is always another word,
 * and a seller who writes "BMW M3 Alloy" without any of them still lands in the
 * sample. eBay already sorts its inventory into a category tree, and a die-cast
 * model is not in Cars & Trucks — it is in Toys. Restricting the search to the
 * right category removes an entire class of wrong answer in one parameter,
 * before any statistic is computed.
 *
 * Cards are absent deliberately: they are priced by Scryfall and the Pokémon
 * TCG API, which return an aggregate for a specific printing and never see this
 * code path.
 *
 * Verify an id at https://www.ebay.com/n/all-categories before changing it. A
 * wrong id does not fail loudly — it returns an empty result set, which this
 * module reports as "no data", which looks like a thin market rather than a
 * typo.
 */
const CATEGORY_IDS: Record<string, string> = {
  car: "6001", // eBay Motors › Cars & Trucks
  watch: "31387", // Jewelry & Watches › Watches, Parts & Accessories › Wristwatches
  bag: "169291", // Women's Bags & Handbags
  sneaker: "15709", // Men's Shoes › Athletic Shoes
};

/**
 * Why a search produced no price.
 *
 * Mirrors the Rakuten client, and exists for the same reason: `fetchPrice`
 * used to return a bare `null`, throwing away the record of what had been
 * asked at precisely the moment somebody needed to read it.
 */
export type EbayReason =
  | "ok"
  | "no_listings"
  | "no_currency"
  | "too_few"
  | "too_spread";

export interface EbayResult {
  observation: PriceObservation | null;
  /** Always present, including on every failure. */
  audit: PriceAudit;
  reason: EbayReason;
}

export interface PriceObservation {
  price: number;
  currency: string;
  sampleSize: number;
  spread: number;
  /**
   * How this number was arrived at, for the admin screen.
   *
   * A price nobody can check is a price nobody can correct. Everything here is
   * either a request parameter or a figure computed from the response, so it
   * explains the number without anyone needing to read this file.
   */
  audit: PriceAudit;
}

export interface PriceAudit {
  /** The exact text sent as `q`, exclusions and all. */
  query: string;
  /** The Browse API request, credentials excluded — they travel in a header. */
  apiUrl: string;
  /** The same search on eBay's own website, for a human to open and judge. */
  webUrl: string;
  categoryId: string | null;
  /** Band pushed into the query, in `currency`. Null when none was known. */
  minPrice: number | null;
  maxPrice: number | null;
  currency: string | null;
  /** Listings returned, and how many survived currency and validity filters. */
  returned: number;
  used: number;
  /** Range of the values the median was taken over. */
  low: number | null;
  high: number | null;
}

/**
 * Fetch current listings for a query and reduce them to one price.
 *
 * Returns `null` when there are too few usable observations — SPEC §3.2 requires
 * "insufficient data" rather than a number derived from a handful of listings.
 *
 * @param marketplace e.g. EBAY_US. Determines currency and regional inventory.
 */
export async function fetchPrice(
  query: string,
  {
    marketplace = "EBAY_US",
    limit = 100,
    category = null,
    minPrice = null,
    maxPrice = null,
    minPriceCurrency = "USD",
  }: {
    marketplace?: string;
    limit?: number;
    /** Our own category, used to pick an eBay category and extra exclusions. */
    category?: string | null;
    /**
     * Floor for this item, in `minPriceCurrency`.
     *
     * Applied as a REQUEST FILTER rather than only as a check on the answer,
     * which is a different thing and a better one. Rejecting a median after the
     * fact throws away the whole item — the caller gets "no data" and the
     * screen shows nothing, even when genuine listings were sitting in the
     * sample underneath the junk. Filtering at the source removes the junk from
     * the sample instead, so the median is taken over the listings that could
     * actually be the item and a real price survives.
     *
     * The after-the-fact check in the cron stays: this one narrows the sample,
     * that one refuses to publish. They are not redundant — a floor pushed into
     * the query cannot catch an item whose brand we do not recognise.
     */
    minPrice?: number | null;
    /**
     * Ceiling, in the same currency as `minPrice`.
     *
     * The mirror of the floor and it earns its place for the same reason: a
     * search for "Chanel 19" matches Classic Flap listings at three times the
     * price, and a portfolio total inflated threefold is as wrong as one
     * deflated tenfold.
     */
    maxPrice?: number | null;
    minPriceCurrency?: string;
  } = {},
): Promise<EbayResult> {
  const token = await getAppToken();

  const exclusions = [...EXCLUDE, ...(category ? (EXCLUDE_BY_CATEGORY[category] ?? []) : [])];
  // Browse honours `-term` for exclusion. The same accessory economy that
  // surrounds a luxury item on a Japanese marketplace surrounds it here, and
  // those listings are internally consistent in price — so no statistic applied
  // afterwards can separate them from a genuinely cheap example of the item.
  const q = `${query} ${exclusions.map((t) => `-${t}`).join(" ")}`;
  const categoryId = category ? (CATEGORY_IDS[category] ?? null) : null;

  // eBay's price filter takes an inclusive range, so a floor with no ceiling
  // is written open-ended rather than as two separate filters.
  const lo = minPrice !== null && minPrice > 0 ? Math.floor(minPrice) : null;
  const hi = maxPrice !== null && maxPrice > 0 ? Math.ceil(maxPrice) : null;

  const filters = ["buyingOptions:{FIXED_PRICE}"];
  if (lo !== null || hi !== null) {
    filters.push(`price:[${lo ?? ""}..${hi ?? ""}]`, `priceCurrency:${minPriceCurrency}`);
  }

  const url = new URL(BROWSE_URL);
  url.searchParams.set("q", q);
  url.searchParams.set("limit", String(Math.min(limit, 200)));
  // Fixed-price only: auctions in progress are not comparable to a market price.
  url.searchParams.set("filter", filters.join(","));
  if (categoryId) url.searchParams.set("category_ids", categoryId);

  const audit: PriceAudit = {
    query: q,
    apiUrl: url.toString(),
    webUrl: webSearchUrl(q, categoryId, lo, hi),
    categoryId,
    minPrice: lo,
    maxPrice: hi,
    currency: lo !== null || hi !== null ? minPriceCurrency : null,
    returned: 0,
    used: 0,
    low: null,
    high: null,
  };

  const res = await fetchWithBackoff(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": marketplace,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const json = (await res.json()) as {
    itemSummaries?: Array<{ price?: { value?: string; currency?: string } }>;
  };

  const summaries = json.itemSummaries ?? [];
  audit.returned = summaries.length;
  if (summaries.length === 0) return { observation: null, audit, reason: "no_listings" };

  // Mixing currencies inside one median would be meaningless, so we keep only
  // the majority currency and drop the rest.
  const currency = dominantCurrency(summaries);
  if (!currency) return { observation: null, audit, reason: "no_currency" };

  const values = summaries
    .filter((s) => s.price?.currency === currency)
    .map((s) => Number(s.price?.value))
    .filter((n) => Number.isFinite(n) && n > 0);

  audit.used = values.length;
  if (values.length > 0) {
    audit.low = Math.min(...values);
    audit.high = Math.max(...values);
  }

  // A banded query earns a lower bar, for the reason set out in the Rakuten
  // client: the filtering happened before the sample rather than after it, so
  // three surviving listings are better evidence than five unconstrained ones.
  const minSamples = lo !== null && hi !== null ? 3 : 5;
  if (values.length < minSamples) {
    return { observation: null, audit, reason: "too_few" };
  }

  const result = trimmedMedian(values, { minSamples });
  if (!result) return { observation: null, audit, reason: "too_spread" };

  return {
    observation: {
      price: result.price,
      currency,
      sampleSize: result.sampleSize,
      spread: result.spread,
      audit,
    },
    audit,
    reason: "ok",
  };
}

/**
 * The same search as a link a person can open.
 *
 * The Browse API URL is the honest record of what was asked, and it is useless
 * to a human: it needs an OAuth header and answers in JSON. eBay's own site
 * takes the same query, so the admin screen can offer a link that shows what
 * the median was computed over — which is the difference between "the price
 * looks wrong" and "the price is wrong, and here is the die-cast model that
 * caused it".
 */
function webSearchUrl(
  q: string,
  categoryId: string | null,
  lo: number | null,
  hi: number | null,
): string {
  const url = new URL("https://www.ebay.com/sch/i.html");
  url.searchParams.set("_nkw", q);
  url.searchParams.set("LH_BIN", "1"); // fixed price, matching the API filter
  if (categoryId) url.searchParams.set("_sacat", categoryId);
  if (lo !== null) url.searchParams.set("_udlo", String(lo));
  if (hi !== null) url.searchParams.set("_udhi", String(hi));
  return url.toString();
}

function dominantCurrency(
  summaries: Array<{ price?: { currency?: string } }>,
): string | null {
  const counts = new Map<string, number>();
  for (const s of summaries) {
    const c = s.price?.currency;
    if (!c) continue;
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [c, n] of counts) {
    if (n > bestCount) {
      best = c;
      bestCount = n;
    }
  }
  return best;
}

/**
 * Retry on 429 and 5xx with exponential backoff. Anything else — including 4xx
 * for a malformed query — fails immediately, since retrying cannot help.
 */
async function fetchWithBackoff(
  url: string,
  init: RequestInit,
  attempts = 4,
): Promise<Response> {
  let lastStatus = 0;

  for (let attempt = 0; attempt < attempts; attempt++) {
    const res = await fetch(url, init);
    if (res.ok) return res;

    lastStatus = res.status;
    const retriable = res.status === 429 || res.status >= 500;
    if (!retriable) break;

    if (attempt < attempts - 1) {
      await sleep(2 ** attempt * 1000);
    }
  }

  throw new EbayError("eBay Browse request failed", lastStatus);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
