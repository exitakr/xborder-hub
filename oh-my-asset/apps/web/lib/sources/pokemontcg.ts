import type { SourcePrice, SourceSeries } from "./types";

/**
 * Pokémon TCG API (pokemontcg.io) — Pokémon card prices.
 *
 * Free, documented, and usable commercially. It republishes two venues:
 * TCGplayer (USD) and Cardmarket (EUR). Only Cardmarket carries any history —
 * `avg1`/`avg7`/`avg30` are trailing mean sale prices — so the Pokémon series is
 * built from Cardmarket whenever it is available, and falls back to TCGplayer
 * (current price only, no chart history) when it is not.
 *
 * Two honesty constraints shape the code below:
 *
 *  1. A trailing mean is not a spot price. `avg30` is the mean of the last 30
 *     days, so it describes roughly the MIDPOINT of that window, not the price
 *     30 days ago. Each anchor is therefore timestamped at its window midpoint.
 *     Plotting it at the window edge would misstate when the price was there.
 *
 *  2. The three anchors must come from the same statistic and the same printing.
 *     Mixing `trend` with `avgN`, or the base family with the reverse-holo
 *     family, produces steps in the line that are artefacts of the source rather
 *     than movements in the market.
 *
 * An API key is optional but raises the daily quota substantially; set
 * POKEMONTCG_API_KEY to use one.
 *
 * §要検証: the response shape below could not be confirmed against the live API
 * from the build sandbox (outbound access is blocked by the network policy).
 * Parsing is defensive — an unexpected shape yields `null` ("no data") rather
 * than an exception or a wrong number.
 */

const ENDPOINT = "https://api.pokemontcg.io/v2/cards";

const DAY_MS = 86_400_000;

/**
 * Where each trailing mean is plotted, in days before now: the midpoint of the
 * window it averages over.
 */
const WINDOW_MIDPOINT_DAYS = { avg7: 3.5, avg30: 15 } as const;

/**
 * @param query A pokemontcg.io query, e.g. `name:"Charizard" set.id:base1`.
 *   Narrow it: a loose query returns reprints whose prices differ by orders of
 *   magnitude.
 * @param eurToUsd Units of USD per 1 EUR, used to bring Cardmarket onto the
 *   USD axis the rest of the catalogue uses. Omit it and Cardmarket is skipped
 *   entirely rather than being reported in the wrong currency.
 */
export async function fetchPokemonTcgSeries(
  query: string,
  eurToUsd?: number,
): Promise<SourceSeries | null> {
  const url = new URL(ENDPOINT);
  url.searchParams.set("q", query);
  url.searchParams.set("pageSize", "1");
  url.searchParams.set("orderBy", "-set.releaseDate");

  const headers: Record<string, string> = { Accept: "application/json" };
  const key = process.env.POKEMONTCG_API_KEY;
  if (key) headers["X-Api-Key"] = key;

  const res = await fetch(url.toString(), { headers, cache: "no-store" });
  if (!res.ok) return null;

  const card = firstCard(await res.json());
  if (!card) return null;

  const imageUrl = readImage(card);

  const cardmarket = readCardmarketSeries(card, eurToUsd, Date.now());
  if (cardmarket) return { ...cardmarket, imageUrl };

  // No Cardmarket data: TCGplayer still gives a defensible current price, but
  // the chart for this item can only build forward from here.
  const market = readTcgPlayerMarket(card);
  if (market === null) return null;

  return {
    current: { price: market, currency: "USD", sampleSize: 1, source: "pokemontcg_tcgplayer" },
    history: [],
    imageUrl,
  };
}

/**
 * Card artwork. `small` rather than `large`: this is shown at thumbnail size in
 * a list of search results, and the large scan is roughly ten times the bytes
 * for pixels nobody sees.
 */
function readImage(card: Record<string, unknown>): string | undefined {
  const images = card.images;
  if (typeof images !== "object" || images === null) return undefined;
  const small = (images as { small?: unknown }).small;
  return typeof small === "string" && small.startsWith("https://") ? small : undefined;
}

function firstCard(json: unknown): Record<string, unknown> | null {
  if (typeof json !== "object" || json === null) return null;
  const data = (json as { data?: unknown }).data;
  if (!Array.isArray(data) || data.length === 0) return null;
  const first = data[0];
  return typeof first === "object" && first !== null ? (first as Record<string, unknown>) : null;
}

/**
 * Build the current price plus its historical anchors from one Cardmarket
 * average family. Returns null unless `avg1` — the point we publish as current —
 * is present, because a chart whose newest point is inferred is worse than no
 * chart.
 */
function readCardmarketSeries(
  card: Record<string, unknown>,
  eurToUsd: number | undefined,
  now: number,
): SourceSeries | null {
  if (!eurToUsd || !Number.isFinite(eurToUsd) || eurToUsd <= 0) return null;

  const prices = nested(card, "cardmarket", "prices");
  if (!prices) return null;

  // Base printing first; reverse holo is the fallback for cards that only exist
  // in that finish. Whichever family answers is used for all three anchors.
  const family =
    familyOf(prices, "avg1", "avg7", "avg30") ??
    familyOf(prices, "reverseHoloAvg1", "reverseHoloAvg7", "reverseHoloAvg30");
  if (!family) return null;

  const toUsd = (eur: number) => eur * eurToUsd;

  const history: SourceSeries["history"] = [];
  for (const [window, days] of Object.entries(WINDOW_MIDPOINT_DAYS)) {
    const eur = family[window as "avg7" | "avg30"];
    if (eur === null) continue;
    history.push({
      price: toUsd(eur),
      currency: "USD",
      source: `${family.sourcePrefix}_${window}`,
      observedAt: new Date(now - days * DAY_MS),
    });
  }
  history.sort((a, b) => a.observedAt.getTime() - b.observedAt.getTime());

  return {
    current: {
      price: toUsd(family.avg1),
      currency: "USD",
      sampleSize: 1,
      source: `${family.sourcePrefix}_avg1`,
    },
    history,
  };
}

/**
 * Read one average family. `avg1` is required; the longer windows are optional
 * because Cardmarket omits them for cards that have not traded recently.
 */
function familyOf(
  prices: Record<string, unknown>,
  currentKey: string,
  weekKey: string,
  monthKey: string,
): { avg1: number; avg7: number | null; avg30: number | null; sourcePrefix: string } | null {
  const avg1 = positiveNumber(prices[currentKey]);
  if (avg1 === null) return null;

  return {
    avg1,
    avg7: positiveNumber(prices[weekKey]),
    avg30: positiveNumber(prices[monthKey]),
    sourcePrefix: currentKey.startsWith("reverseHolo")
      ? "pokemontcg_cardmarket_reverseholo"
      : "pokemontcg_cardmarket",
  };
}

/**
 * TCGplayer nests prices per finish (normal, holofoil, reverseHolofoil, …), and
 * which finishes exist varies by card. We take the highest `market` value
 * present, because the graded/holo printing is what a collector is tracking.
 */
function readTcgPlayerMarket(card: Record<string, unknown>): number | null {
  const prices = nested(card, "tcgplayer", "prices");
  if (!prices) return null;

  let best: number | null = null;
  for (const finish of Object.values(prices)) {
    if (typeof finish !== "object" || finish === null) continue;
    const market = positiveNumber((finish as { market?: unknown }).market);
    if (market === null) continue;
    if (best === null || market > best) best = market;
  }
  return best;
}

function nested(
  card: Record<string, unknown>,
  outer: string,
  inner: string,
): Record<string, unknown> | null {
  const level1 = card[outer];
  if (typeof level1 !== "object" || level1 === null) return null;
  const level2 = (level1 as Record<string, unknown>)[inner];
  if (typeof level2 !== "object" || level2 === null) return null;
  return level2 as Record<string, unknown>;
}

function positiveNumber(raw: unknown): number | null {
  return typeof raw === "number" && Number.isFinite(raw) && raw > 0 ? raw : null;
}

/** Back-compat wrapper for callers that only need the current price. */
export async function fetchPokemonTcgPrice(
  query: string,
  eurToUsd?: number,
): Promise<SourcePrice | null> {
  return (await fetchPokemonTcgSeries(query, eurToUsd))?.current ?? null;
}
