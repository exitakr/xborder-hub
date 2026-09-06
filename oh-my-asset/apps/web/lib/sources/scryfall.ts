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
 *  - Do NOT put Scryfall data behind a paywall. If Oh My Asset ever gains a paid tier,
 *    prices sourced here must remain visible on the free tier. See
 *    docs/RESEARCH.md §7 — this constrains monetisation and matters for a sale.
 *
 * Prices refresh once a day upstream, which matches our daily cron exactly.
 * Scryfall publishes no price history, so a Magic card's chart can only build
 * forward from the first cron run. MTGJSON carries 90 days but only as a
 * multi-gigabyte bulk export, which does not fit a serverless refresh; see
 * docs/RESEARCH.md §7.2.
 *
 * §要検証: the response shape below could not be confirmed against the live API
 * from the build sandbox (outbound access to api.scryfall.com is blocked by the
 * network policy). Parsing is defensive: an unexpected shape yields `null`
 * ("no data") rather than an exception or a wrong number.
 */

import type { SourcePrice, SourceSeries } from "./types";

export type { SourcePrice };

const ENDPOINT = "https://api.scryfall.com/cards/named";
const USER_AGENT = "OhMyAsset/1.0 (collectible portfolio tracker)";

/**
 * Price plus artwork in one call.
 *
 * Kept separate from `fetchScryfallPrice` so the existing price path and its
 * tests are untouched; both read the same response, so asking for the image
 * costs no extra request. Scryfall publishes no history, hence the empty array.
 */
export async function fetchScryfallSeries(cardName: string): Promise<SourceSeries | null> {
  const card = await fetchScryfallCard(cardName);
  if (!card) return null;
  return { current: card.current, history: [], imageUrl: card.imageUrl };
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

/** One request, read twice: the price and the artwork come from one card. */
async function fetchScryfallCard(
  cardName: string,
): Promise<{ current: SourcePrice; imageUrl?: string } | null> {
  const url = new URL(ENDPOINT);
  url.searchParams.set("exact", cardName);

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return null;

  const json: unknown = await res.json();
  const usd = readPrice(json, "usd");
  if (usd === null) return null;

  return {
    current: { price: usd, currency: "USD", sampleSize: 1, source: "scryfall" },
    imageUrl: readImage(json),
  };
}

/**
 * `normal` rather than `png` or `large`: this is drawn at thumbnail size, and
 * the high-resolution scans are several times the bytes for pixels nobody sees.
 * Double-faced cards carry their images one level down, under `card_faces`.
 */
function readImage(json: unknown): string | undefined {
  if (typeof json !== "object" || json === null) return undefined;

  const direct = pickNormal((json as { image_uris?: unknown }).image_uris);
  if (direct) return direct;

  const faces = (json as { card_faces?: unknown }).card_faces;
  if (!Array.isArray(faces) || faces.length === 0) return undefined;
  const front = faces[0];
  if (typeof front !== "object" || front === null) return undefined;
  return pickNormal((front as { image_uris?: unknown }).image_uris);
}

function pickNormal(imageUris: unknown): string | undefined {
  if (typeof imageUris !== "object" || imageUris === null) return undefined;
  const normal = (imageUris as { normal?: unknown }).normal;
  return typeof normal === "string" && normal.startsWith("https://") ? normal : undefined;
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
