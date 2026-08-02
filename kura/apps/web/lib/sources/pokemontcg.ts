import type { SourcePrice } from "./scryfall";

/**
 * Pokémon TCG API (pokemontcg.io) — Pokémon card prices.
 *
 * Free and documented, aggregating TCGplayer (USD) and Cardmarket (EUR)
 * figures. Like Scryfall, this reports market prices rather than asking prices,
 * so it is a better source than eBay Browse for this category.
 *
 * An API key is optional but raises the daily quota substantially; set
 * POKEMONTCG_API_KEY to use one. Without it the free quota is low enough that
 * a catalogue of any size will start returning 429s.
 *
 * §要検証: the response shape below could not be confirmed against the live API
 * from the build sandbox (outbound access is blocked by the network policy).
 * Parsing is defensive — an unexpected shape yields `null` ("no data") rather
 * than an exception or a wrong number.
 */

const ENDPOINT = "https://api.pokemontcg.io/v2/cards";

/**
 * @param query A pokemontcg.io query, e.g. `name:"Charizard" set.id:base1`.
 *   Narrow it: a loose query returns reprints whose prices differ by orders of
 *   magnitude.
 */
export async function fetchPokemonTcgPrice(query: string): Promise<SourcePrice | null> {
  const url = new URL(ENDPOINT);
  url.searchParams.set("q", query);
  url.searchParams.set("pageSize", "1");
  url.searchParams.set("orderBy", "-set.releaseDate");

  const headers: Record<string, string> = { Accept: "application/json" };
  const key = process.env.POKEMONTCG_API_KEY;
  if (key) headers["X-Api-Key"] = key;

  const res = await fetch(url.toString(), { headers, cache: "no-store" });
  if (!res.ok) return null;

  const json: unknown = await res.json();
  const card = firstCard(json);
  if (!card) return null;

  const market = readTcgPlayerMarket(card);
  if (market === null) return null;

  return { price: market, currency: "USD", sampleSize: 1, source: "pokemontcg" };
}

function firstCard(json: unknown): Record<string, unknown> | null {
  if (typeof json !== "object" || json === null) return null;
  const data = (json as { data?: unknown }).data;
  if (!Array.isArray(data) || data.length === 0) return null;
  const first = data[0];
  return typeof first === "object" && first !== null ? (first as Record<string, unknown>) : null;
}

/**
 * TCGplayer nests prices per finish (normal, holofoil, reverseHolofoil, …), and
 * which finishes exist varies by card. We take the highest `market` value
 * present, because the graded/holo printing is what a collector is tracking.
 */
function readTcgPlayerMarket(card: Record<string, unknown>): number | null {
  const tcgplayer = card.tcgplayer;
  if (typeof tcgplayer !== "object" || tcgplayer === null) return null;

  const prices = (tcgplayer as { prices?: unknown }).prices;
  if (typeof prices !== "object" || prices === null) return null;

  let best: number | null = null;
  for (const finish of Object.values(prices as Record<string, unknown>)) {
    if (typeof finish !== "object" || finish === null) continue;
    const market = (finish as { market?: unknown }).market;
    if (typeof market !== "number" || !Number.isFinite(market) || market <= 0) continue;
    if (best === null || market > best) best = market;
  }
  return best;
}
