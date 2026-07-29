import { trimmedMedian } from "./calc";

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

export class EbayError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "EbayError";
  }
}

/**
 * Client-credentials grant. The resulting token identifies the application, not
 * a user, which is all the Browse API needs.
 */
export async function getAppToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.value;
  }

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

export interface PriceObservation {
  price: number;
  currency: string;
  sampleSize: number;
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
  { marketplace = "EBAY_US", limit = 100 }: { marketplace?: string; limit?: number } = {},
): Promise<PriceObservation | null> {
  const token = await getAppToken();

  const url = new URL(BROWSE_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(Math.min(limit, 200)));
  // Fixed-price only: auctions in progress are not comparable to a market price.
  url.searchParams.set("filter", "buyingOptions:{FIXED_PRICE}");

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
  if (summaries.length === 0) return null;

  // Mixing currencies inside one median would be meaningless, so we keep only
  // the majority currency and drop the rest.
  const currency = dominantCurrency(summaries);
  if (!currency) return null;

  const values = summaries
    .filter((s) => s.price?.currency === currency)
    .map((s) => Number(s.price?.value))
    .filter((n) => Number.isFinite(n) && n > 0);

  const result = trimmedMedian(values);
  if (!result) return null;

  return { price: result.price, currency, sampleSize: result.sampleSize };
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
