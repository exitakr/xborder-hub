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
/** Courtesy pacing. Scryfall asks for <10 req/s; 300ms is comfortably inside. */
const REQUEST_INTERVAL_MS = 300;

type SourceType = "ebay" | "scryfall" | "pokemontcg" | "rakuten" | "curated";

interface Candidate {
  id: string;
  sourceType: SourceType;
  query: string;
}

export async function GET(request: NextRequest) {
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

  const [held, listed] = await Promise.all([
    heldItemIds(supabase),
    supabase
      .from("market_items")
      .select("id, source_type, search_query")
      .in("source_type", sources)
      .not("search_query", "is", null)
      .order("price_updated_at", { ascending: true, nullsFirst: true })
      .limit(MAX_ITEMS_PER_RUN * 2),
  ]);

  const byId = new Map<string, Candidate>();
  for (const row of listed.data ?? []) {
    if (!row.search_query) continue;
    byId.set(row.id as string, {
      id: row.id as string,
      sourceType: row.source_type as SourceType,
      query: row.search_query as string,
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

  for (const id of queue) {
    if (seen.has(id)) continue;
    seen.add(id);
    if (seen.size > MAX_ITEMS_PER_RUN) break;

    const candidate = byId.get(id);
    if (!candidate) continue;

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
        continue;
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

    await sleep(REQUEST_INTERVAL_MS);
  }

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

/** IDs of catalogue items at least one user actually holds. */
async function heldItemIds(
  supabase: ReturnType<typeof createAdminClient>,
): Promise<string[]> {
  const { data } = await supabase.from("holdings").select("market_item_id");
  return [...new Set((data ?? []).map((r) => r.market_item_id as string))];
}
