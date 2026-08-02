/**
 * Scryfall — Magic: The Gathering prices.
 *
 * Free, no authentication, no scraping: a documented public API. It is a much
 * better source than eBay Browse for MTG because it reports actual market
 * prices rather than asking prices.
 *
 * OBLIGATIONS (these are licence terms, not preferences):
 *  - Send a descriptive User-Agent and Accept header.
 *  - Stay under ~10 requests/second; we pace at 1/sec in the cron anyway.
 *  - Attribute Scryfall wherever its data is shown (the item screen does).
 *  - Do NOT put Scryfall data behind a paywall. If KURA ever gains a paid tier,
 *    prices sourced here must remain visible on the free tier. See
 *    docs/RESEARCH.md §7 — this constrains monetisation and matters for a sale.
 *
 * Prices refresh once a day upstream, which matches our daily cron exactly.
 *
 * §要検証: the response shape below could not be confirmed against the live API
 * from the build sandbox (outbound access to api.scryfall.com is blocked by the
 * network policy). Parsing is defensive: an unexpected shape yields `null`
 * ("no data") rather than an exception or a wrong number.
 */

const ENDPOINT = "https://api.scryfall.com/cards/named";
const USER_AGENT = "KURA/1.0 (collectible portfolio tracker)";

export interface SourcePrice {
  price: number;
  currency: "USD" | "JPY" | "SGD";
  /** Observations behind the figure. Scryfall reports one aggregate value. */
  sampleSize: number;
  source: string;
}

export async function fetchScryfallPrice(cardName: string): Promise<SourcePrice | null> {
  const url = new URL(ENDPOINT);
  url.searchParams.set("exact", cardName);

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    cache: "no-store",
  });

  // 404 simply means the exact name did not match — not an error worth retrying.
  if (!res.ok) return null;

  const json: unknown = await res.json();
  const usd = readPrice(json, "usd");
  if (usd === null) return null;

  return {
    price: usd,
    currency: "USD",
    // One aggregated market price. Treated as a single high-quality observation
    // rather than being inflated into a fake sample count.
    sampleSize: 1,
    source: "scryfall",
  };
}

function readPrice(json: unknown, key: string): number | null {
  if (typeof json !== "object" || json === null) return null;
  const prices = (json as { prices?: unknown }).prices;
  if (typeof prices !== "object" || prices === null) return null;

  const raw = (prices as Record<string, unknown>)[key];
  if (typeof raw !== "string") return null;

  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}
