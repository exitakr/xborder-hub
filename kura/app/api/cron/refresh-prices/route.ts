import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { confidenceFor } from "@/lib/calc";
import { fetchPrice, sleep } from "@/lib/ebay";

/**
 * Daily price refresh (SPEC §3.3).
 *
 * Scheduled by vercel.json at 20:00 UTC = 05:00 JST. Vercel's Hobby plan allows
 * exactly one cron run per day and only guarantees the hour, which is why the
 * whole design assumes daily granularity rather than intraday quotes.
 *
 * Snapshots are INSERTed, never UPDATEd — the price history is the product.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Items held by at least one user are refreshed first, then the rest. */
const MAX_ITEMS_PER_RUN = 40;
/** eBay asks for courtesy pacing; one request per second is comfortably polite. */
const REQUEST_INTERVAL_MS = 1000;

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

  const [held, rest] = await Promise.all([
    heldItemIds(supabase),
    supabase
      .from("market_items")
      .select("id, search_query")
      .eq("source_type", "ebay")
      .not("search_query", "is", null)
      .order("price_updated_at", { ascending: true, nullsFirst: true })
      .limit(MAX_ITEMS_PER_RUN),
  ]);

  const byId = new Map<string, string>();
  for (const row of rest.data ?? []) {
    if (row.search_query) byId.set(row.id, row.search_query);
  }

  // Held items jump the queue; the ordering above already prefers stale rows.
  const queue = [...held.filter((id) => byId.has(id)), ...byId.keys()];
  const seen = new Set<string>();

  let updated = 0;
  let insufficient = 0;
  let failed = 0;

  for (const id of queue) {
    if (seen.has(id)) continue;
    seen.add(id);
    if (seen.size > MAX_ITEMS_PER_RUN) break;

    const query = byId.get(id);
    if (!query) continue;

    try {
      const observation = await fetchPrice(query);

      if (!observation) {
        // Not an error: we simply refuse to publish a price we cannot support.
        await supabase
          .from("market_items")
          .update({ data_confidence: "insufficient", price_updated_at: new Date().toISOString() })
          .eq("id", id);
        insufficient += 1;
        continue;
      }

      const confidence = confidenceFor(observation.sampleSize);

      await supabase.from("price_snapshots").insert({
        market_item_id: id,
        price: observation.price,
        currency: observation.currency,
        sample_size: observation.sampleSize,
        source: "ebay_browse",
      });

      await supabase
        .from("market_items")
        .update({
          current_price: observation.price,
          currency: observation.currency,
          data_confidence: confidence,
          price_updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      updated += 1;
    } catch {
      // One bad item must not abort the run. Nothing about the item is logged:
      // holdings are sensitive and logs are not (SPEC §8).
      failed += 1;
    }

    await sleep(REQUEST_INTERVAL_MS);
  }

  const fx = await refreshFxRates(supabase);

  return NextResponse.json({ ok: true, updated, insufficient, failed, fx });
}

/** IDs of catalogue items at least one user actually holds. */
async function heldItemIds(
  supabase: ReturnType<typeof createAdminClient>,
): Promise<string[]> {
  const { data } = await supabase.from("holdings").select("market_item_id");
  return [...new Set((data ?? []).map((r) => r.market_item_id as string))];
}

/**
 * Refresh FX rates so a Singapore user's totals are not stale.
 * Rates are stored as "units of X per 1 JPY" to match lib/money.ts.
 */
async function refreshFxRates(
  supabase: ReturnType<typeof createAdminClient>,
): Promise<"ok" | "skipped" | "failed"> {
  const endpoint = process.env.FX_RATES_URL ?? "https://open.er-api.com/v6/latest/JPY";

  try {
    const res = await fetch(endpoint, { cache: "no-store" });
    if (!res.ok) return "failed";

    const json = (await res.json()) as { rates?: Record<string, number> };
    const rates = json.rates;
    if (!rates) return "failed";

    const rows = (["SGD", "USD"] as const)
      .filter((c) => Number.isFinite(rates[c]) && rates[c] > 0)
      .map((c) => ({ currency: c, rate: rates[c], updated_at: new Date().toISOString() }));

    if (rows.length === 0) return "failed";

    await supabase.from("fx_rates").upsert(rows, { onConflict: "currency" });
    return "ok";
  } catch {
    // Stale rates are better than no app; the previous values stay in place.
    return "failed";
  }
}
