import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { confidenceFor } from "@kura/core";
import { fetchPrice, sleep } from "@/lib/ebay";
import { fetchScryfallPrice } from "@/lib/sources/scryfall";
import { fetchPokemonTcgSeries } from "@/lib/sources/pokemontcg";
import { fetchRakutenPrice } from "@/lib/sources/rakuten";
import type { SourceSeries } from "@/lib/sources/types";
import { fetchFxRates, type FxSnapshot } from "@/lib/fx";

/**
 * Daily price refresh (SPEC §3.3).
 *
 * Scheduled by vercel.json at 20:00 UTC = 05:00 JST. Vercel's Hobby plan allows
 * exactly one cron run per day and only guarantees the hour, which is why the
 * whole design assumes daily granularity rather than intraday quotes.
 *
 * Snapshots are INSERTed, never UPDATEd — the price history is the product.
 *
 * The first time an item is seen, any history its source can supply is written
 * too. Without that, a newly seeded catalogue draws nothing for weeks: one
 * point a day is not a chart, and "add an item, see an empty graph" reads as a
 * broken feature rather than as an honest absence of data.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Items held by at least one user are refreshed first, then the rest.
 *
 * The ceiling exists to fit inside `maxDuration`, so it has to be read together
 * with the pacing below: every item costs one interval plus its fetch. At 300ms
 * a full run of 50 lands near 30s, which leaves headroom for a slow upstream.
 */
const MAX_ITEMS_PER_RUN = 50;

/**
 * Gap between requests, per source, applied within that source's lane only.
 *
 * Rakuten's terms ask for no more than one request a second and that number is
 * theirs, not a guess. Scryfall asks to stay under ten a second. eBay publishes
 * a daily quota rather than a rate, so the gap there is ordinary courtesy.
 */
const REQUEST_INTERVAL_MS: Record<SourceType, number> = {
  rakuten: 1000,
  scryfall: 150,
  pokemontcg: 150,
  ebay: 100,
  curated: 0,
};

/**
 * How many requests a source will take at once.
 *
 * Only eBay is opened up, and only because its published limit is a daily quota
 * rather than a rate — it is also the largest slice of the catalogue, so left
 * sequential it alone decides whether a run finishes. Scryfall and Rakuten both
 * state a rate, and a stated rate is not something to reinterpret as a budget.
 */
const LANE_CONCURRENCY: Record<SourceType, number> = {
  ebay: 4,
  rakuten: 1,
  scryfall: 1,
  pokemontcg: 1,
  curated: 1,
};

/**
 * When to stop starting new work.
 *
 * `maxDuration` is 60s and Vercel kills the invocation at that line with no
 * response at all — the caller sees FUNCTION_INVOCATION_TIMEOUT and learns
 * nothing about what did or did not get written. Stopping early leaves room to
 * answer, and because items are ordered by staleness the next run resumes with
 * whatever was dropped.
 */
const TIME_BUDGET_MS = 45_000;
/**
 * Ceiling on the catalogue read. The whole table is fetched and narrowed in
 * code, so this only exists to keep the request bounded if the catalogue ever
 * grows far beyond the tens of rows it holds today.
 */
const CATALOGUE_READ_LIMIT = 2000;

interface CatalogueRow {
  id: string;
  source_type: string | null;
  search_query: string | null;
  price_updated_at: string | null;
}

type SourceType = "ebay" | "scryfall" | "pokemontcg" | "rakuten" | "curated";

interface Candidate {
  id: string;
  sourceType: SourceType;
  query: string;
}

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // A missing service-role key is a deployment mistake, not a runtime fault.
  // Answering with a clear 500 beats an unhandled throw in the cron logs.
  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json({ error: "service role key not configured" }, { status: 500 });
  }

  // Rates are fetched before the item loop, not after: Cardmarket quotes in EUR
  // and cannot be stored until there is a rate to bring it onto the USD axis.
  const fx = await fetchFxRates();
  if (fx.rows.length > 0) {
    await supabase.from("fx_rates").upsert(fx.rows, { onConflict: "currency" });
  }

  // eBay is the only source that needs credentials. Without them every eBay item
  // would throw, and — because each attempt still costs its pacing interval —
  // roughly two thirds of the catalogue would burn the run's time budget before
  // Scryfall and pokemontcg items were ever reached. Excluding them up front is
  // what makes a key-less deployment still produce the prices it CAN produce.
  const ebayConfigured = Boolean(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET);
  const rakutenConfigured = Boolean(process.env.RAKUTEN_APPLICATION_ID);
  const sources: SourceType[] = ["scryfall", "pokemontcg"];
  if (ebayConfigured) sources.push("ebay");
  if (rakutenConfigured) sources.push("rakuten");

  // The whole catalogue is read and then narrowed in code, rather than asking
  // PostgREST to filter and sort. It is a table of tens of rows, so the transfer
  // costs nothing — and a run that reported zero candidates against a catalogue
  // that demonstrably had rows left no way to tell a filter that matched nothing
  // from a request that never returned them. Selecting plainly removes that
  // whole class of failure instead of adding more instrumentation around it.
  const [held, listed] = await Promise.all([
    heldItemIds(supabase),
    supabase
      .from("market_items")
      .select("id, source_type, search_query, price_updated_at")
      .limit(CATALOGUE_READ_LIMIT),
  ]);

  // A failed read used to fall through `?? []` into a clean report over zero
  // items, which is indistinguishable from an empty catalogue.
  if (listed.error) {
    return NextResponse.json(
      { error: "could not read the catalogue", detail: listed.error.message },
      { status: 500 },
    );
  }

  const catalogue = (listed.data ?? []) as CatalogueRow[];

  const byId = new Map<string, Candidate>();
  for (const row of eligible(catalogue, sources)) {
    byId.set(row.id, {
      id: row.id,
      sourceType: row.source_type as SourceType,
      query: row.search_query as string,
    });
  }

  // Nothing to price is a legitimate state, but it has several distinct causes —
  // an empty catalogue, rows whose source this deployment has no key for, rows
  // with no query to send — and the bare count cannot tell them apart. The rows
  // are already in hand, so the breakdown costs nothing extra.
  if (byId.size === 0) {
    return NextResponse.json({
      ok: true,
      updated: 0,
      insufficient: 0,
      failed: 0,
      backfilled: 0,
      bySource: {},
      ebayConfigured,
      rakutenConfigured,
      fx: fx.rows.length > 0 ? "ok" : "failed",
      eurRate: fx.eurToUsd ? "ok" : "unavailable",
      candidates: 0,
      commit: commitRef(),
      catalogue: breakdown(catalogue),
    });
  }

  // Held items jump the queue; within each group the staleness ordering above
  // already puts the most out-of-date first.
  const queue = [...held.filter((id) => byId.has(id)), ...byId.keys()];
  const seen = new Set<string>();

  let updated = 0;
  let insufficient = 0;
  let failed = 0;
  let backfilled = 0;

  // Per-source tally. A run that returns all-zero totals is otherwise silent
  // about which upstream is at fault, and item-level logging is not an option
  // here (SPEC §8 keeps holdings out of the logs).
  const bySource: Record<string, { updated: number; insufficient: number; failed: number }> = {};
  const tally = (source: SourceType, key: "updated" | "insufficient" | "failed") => {
    bySource[source] ??= { updated: 0, insufficient: 0, failed: 0 };
    bySource[source][key] += 1;
  };

  let skipped = 0;

  const planned: Candidate[] = [];
  for (const id of queue) {
    if (seen.has(id)) continue;
    seen.add(id);
    if (seen.size > MAX_ITEMS_PER_RUN) break;
    const candidate = byId.get(id);
    if (candidate) planned.push(candidate);
  }

  async function priceOne(candidate: Candidate) {
    const id = candidate.id;
    try {
      const series = await fetchFor(candidate, fx);

      if (!series) {
        // Not an error: we refuse to publish a price we cannot support.
        await supabase
          .from("market_items")
          .update({
            data_confidence: "insufficient",
            price_updated_at: new Date().toISOString(),
          })
          .eq("id", id);
        insufficient += 1;
        tally(candidate.sourceType, "insufficient");
        return;
      }

      backfilled += await writeHistory(supabase, id, series);

      await supabase.from("price_snapshots").insert({
        market_item_id: id,
        price: series.current.price,
        currency: series.current.currency,
        sample_size: series.current.sampleSize,
        source: series.current.source,
      });

      await supabase
        .from("market_items")
        .update({
          current_price: series.current.price,
          currency: series.current.currency,
          data_confidence: confidenceOf(candidate.sourceType, series.current.sampleSize),
          price_updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      updated += 1;
      tally(candidate.sourceType, "updated");
    } catch {
      // One bad item must not abort the run. Nothing about the item is logged:
      // holdings are sensitive and logs are not (SPEC §8).
      failed += 1;
      tally(candidate.sourceType, "failed");
    }
  }

  /**
   * One source, worked through sequentially at that source's own pace.
   *
   * Lanes run concurrently because the rate limits are per-service: pacing eBay
   * against Rakuten's one-request-a-second only made the run longer without
   * being kinder to anyone. Sequential within a lane keeps each service's limit
   * intact.
   */
  async function runLane(source: SourceType, items: readonly Candidate[]) {
    const interval = REQUEST_INTERVAL_MS[source];

    async function worker(share: readonly Candidate[]) {
      for (const candidate of share) {
        // Returning a partial result beats being killed mid-write. Items are
        // ordered by staleness and held items come first, so whatever is dropped
        // here is the least urgent, and the next run starts with it.
        if (Date.now() - startedAt > TIME_BUDGET_MS) {
          skipped += 1;
          continue;
        }
        await priceOne(candidate);
        await sleep(interval);
      }
    }

    // Dealt round-robin so each worker gets a slice spanning the whole staleness
    // order; handing one worker the first third would make the budget cut fall
    // on an arbitrary source rather than on the freshest items.
    const width = Math.min(LANE_CONCURRENCY[source], items.length);
    const shares: Candidate[][] = Array.from({ length: width }, () => []);
    items.forEach((candidate, i) => shares[i % width].push(candidate));

    await Promise.all(shares.map(worker));
  }

  const lanes = new Map<SourceType, Candidate[]>();
  for (const candidate of planned) {
    const lane = lanes.get(candidate.sourceType);
    if (lane) lane.push(candidate);
    else lanes.set(candidate.sourceType, [candidate]);
  }

  await Promise.all([...lanes].map(([source, items]) => runLane(source, items)));

  return NextResponse.json({
    ok: true,
    updated,
    insufficient,
    failed,
    backfilled,
    bySource,
    // Surfaced because they are the two settings that silently halve what a
    // deployment can price: no eBay key removes watches, sneakers and Yu-Gi-Oh;
    // no EUR rate removes the Cardmarket history behind every Pokémon chart.
    ebayConfigured,
    rakutenConfigured,
    fx: fx.rows.length > 0 ? "ok" : "failed",
    eurRate: fx.eurToUsd ? "ok" : "unavailable",
    candidates: byId.size,
    // Non-zero means the run ran out of time. Not a failure — the dropped items
    // are the least stale ones and the next run begins with them — but it does
    // mean full coverage takes more than one run.
    skipped,
    elapsedMs: Date.now() - startedAt,
    commit: commitRef(),
  });
}

/**
 * Seed an item's chart with whatever history its source publishes, once.
 *
 * Guarded on the item having no snapshots at all rather than on a date range:
 * these anchors are timestamped relative to the run, so re-running would lay
 * down a second, slightly shifted copy of the same three points.
 */
async function writeHistory(
  supabase: ReturnType<typeof createAdminClient>,
  itemId: string,
  series: SourceSeries,
): Promise<number> {
  if (series.history.length === 0) return 0;

  const { count } = await supabase
    .from("price_snapshots")
    .select("id", { count: "exact", head: true })
    .eq("market_item_id", itemId);

  if ((count ?? 0) > 0) return 0;

  const { error } = await supabase.from("price_snapshots").insert(
    series.history.map((point) => ({
      market_item_id: itemId,
      price: point.price,
      currency: point.currency,
      sample_size: 1,
      source: point.source,
      observed_at: point.observedAt.toISOString(),
    })),
  );

  return error ? 0 : series.history.length;
}

/** Dispatch to whichever source this item is configured for. */
async function fetchFor(candidate: Candidate, fx: FxSnapshot): Promise<SourceSeries | null> {
  switch (candidate.sourceType) {
    case "scryfall": {
      const current = await fetchScryfallPrice(candidate.query);
      return current ? { current, history: [] } : null;
    }

    case "pokemontcg":
      return fetchPokemonTcgSeries(candidate.query, fx.eurToUsd);

    case "rakuten": {
      const current = await fetchRakutenPrice(candidate.query);
      return current ? { current, history: [] } : null;
    }

    case "ebay": {
      const observation = await fetchPrice(candidate.query);
      if (!observation) return null;
      return {
        current: {
          price: observation.price,
          currency: observation.currency as SourceSeries["current"]["currency"],
          sampleSize: observation.sampleSize,
          source: "ebay_browse",
        },
        history: [],
      };
    }

    default:
      return null; // curated items are priced by an admin, not fetched
  }
}

/**
 * Confidence label for a price.
 *
 * eBay is scored on how many listings backed the median. Scryfall and
 * pokemontcg.io each return one already-aggregated market figure, so counting
 * observations is meaningless there — they are "medium" by construction, which
 * is honest: a real market price, from a single upstream aggregate.
 */
function confidenceOf(sourceType: SourceType, sampleSize: number) {
  // eBay and Rakuten both reduce many listings to a median, so the number of
  // listings behind it is meaningful. The card APIs return one already-aggregated
  // figure, where counting observations would say nothing.
  if (sourceType === "ebay" || sourceType === "rakuten") return confidenceFor(sampleSize);
  return "medium" as const;
}

/**
 * Items this deployment can actually price, most out-of-date first.
 *
 * `curated` rows are excluded by carrying no `search_query`; eBay and Rakuten
 * rows are excluded when their credentials are absent, so a run spends its time
 * budget only on items that can return something.
 */
function eligible(catalogue: readonly CatalogueRow[], sources: readonly SourceType[]) {
  return catalogue
    .filter(
      (row): row is CatalogueRow & { search_query: string } =>
        typeof row.search_query === "string" &&
        row.search_query.length > 0 &&
        sources.includes(row.source_type as SourceType),
    )
    .sort((a, b) => staleness(a) - staleness(b));
}

/** Never-fetched items sort first; after that, oldest fetch first. */
function staleness(row: CatalogueRow): number {
  if (!row.price_updated_at) return 0;
  const parsed = Date.parse(row.price_updated_at);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Why the candidate list came back empty, in the shape that distinguishes the
 * causes: how many rows exist at all, how many carry a query to send, and which
 * sources they are assigned to. A catalogue seeded entirely onto `curated`, or
 * seeded with null queries, looks identical from the count alone and needs a
 * different fix in each case.
 */
function breakdown(catalogue: readonly CatalogueRow[]) {
  const bySource: Record<string, { items: number; withQuery: number }> = {};
  for (const row of catalogue) {
    const key = row.source_type ?? "(null)";
    bySource[key] ??= { items: 0, withQuery: 0 };
    bySource[key].items += 1;
    if (row.search_query) bySource[key].withQuery += 1;
  }
  return { total: catalogue.length, bySource };
}

/**
 * Which build answered. Vercel injects the commit; without it there is no way to
 * tell a deployment that has not picked up a change from one where the change
 * did not work, and the two were confused for a full round of debugging.
 */
function commitRef(): string {
  return (process.env.VERCEL_GIT_COMMIT_SHA ?? "unknown").slice(0, 7);
}

/** IDs of catalogue items at least one user actually holds. */
async function heldItemIds(
  supabase: ReturnType<typeof createAdminClient>,
): Promise<string[]> {
  const { data } = await supabase.from("holdings").select("market_item_id");
  return [...new Set((data ?? []).map((r) => r.market_item_id as string))];
}
