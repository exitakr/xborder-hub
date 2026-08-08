import type { SupabaseClient } from "@supabase/supabase-js";
import { summarize, totals, type HoldingSummary } from "./calc.ts";
import { convertTransactions, unknownValueSummary } from "./holdings.ts";
import { convert, isCurrency, type Currency, type FxTable } from "./money.ts";
import type { Category, HoldingRow, MarketItem, TransactionRow } from "./types.ts";

/**
 * Data access shared by the web and native apps.
 *
 * Every function takes a `SupabaseClient` rather than creating one, because the
 * two platforms construct clients differently (cookie-based SSR vs AsyncStorage).
 * Keeping the queries here means the portfolio maths cannot drift between them —
 * a divergence users would experience as the two apps disagreeing about how much
 * their collection is worth.
 */

const ITEM_COLUMNS =
  "id, category, name, detail, identifier, source_type, source_url, current_price, currency, price_updated_at, data_confidence";

/**
 * A valuation the holder entered themselves, for an item with no automatic
 * feed. Private to its author and never aggregated — see migration 0007.
 */
export interface SelfReportedPrice {
  /** In the display currency, like every other figure that leaves this module. */
  price: number;
  source: string;
  asOf: string;
}

export interface HoldingView {
  holdingId: string;
  item: MarketItem;
  photoPath: string | null;
  summary: HoldingSummary;
  /** Recent price points for the row sparkline, in the display currency. */
  spark: number[];
  /**
   * Set when this holding's value came from the user rather than from a feed.
   * Carried per row so the UI can mark exactly which figures are self-reported
   * instead of disclaiming the whole screen.
   */
  selfReported: SelfReportedPrice | null;
}

export interface PortfolioView {
  currency: Currency;
  holdings: HoldingView[];
  totals: ReturnType<typeof totals>;
  byCategory: Array<{ category: Category; value: number; share: number }>;
  /**
   * How many open holdings are valued from the user's own figures. Non-zero
   * means the total is not entirely market-derived, which the screen has to say
   * out loud rather than presenting one number as if it had one provenance.
   */
  selfReportedCount: number;
}

/**
 * Load everything a portfolio screen needs.
 *
 * All money is normalised into the display currency once, here, so no screen has
 * to think about FX. Anything that cannot be converted stays `null` and is
 * excluded from totals rather than being coerced to 0 — see ./calc.ts.
 */
export async function loadPortfolio(
  supabase: SupabaseClient,
  userId: string,
  displayCurrency: Currency,
): Promise<PortfolioView> {
  const [holdingsRes, txRes, fx, ownRes] = await Promise.all([
    supabase
      .from("holdings")
      .select(`id, market_item_id, photo_path, note, market_items(${ITEM_COLUMNS})`)
      .eq("user_id", userId),
    supabase
      .from("transactions")
      .select("id, holding_id, type, traded_on, quantity, unit_price, currency")
      .eq("user_id", userId),
    loadFxRates(supabase),
    supabase
      .from("self_reported_prices")
      .select("market_item_id, price, currency, source, as_of")
      .eq("user_id", userId),
  ]);

  const holdingRows = (holdingsRes.data ?? []) as unknown as HoldingRow[];
  const txRows = (txRes.data ?? []) as TransactionRow[];
  const ownPrices = ownPriceMap(ownRes.data, displayCurrency, fx);

  const txByHolding = new Map<string, TransactionRow[]>();
  for (const tx of txRows) {
    const list = txByHolding.get(tx.holding_id);
    if (list) list.push(tx);
    else txByHolding.set(tx.holding_id, [tx]);
  }

  const sparks = await loadSparklines(
    supabase,
    holdingRows.map((h) => h.market_item_id),
  );

  const views: HoldingView[] = holdingRows.map((row) => {
    const item = row.market_items;

    const { transactions, complete } = convertTransactions(
      txByHolding.get(row.id) ?? [],
      displayCurrency,
      fx,
    );

    // The feed wins where it exists. A user's own figure is a fallback for items
    // nothing prices automatically, not an override of a live quote — otherwise
    // a stale entry would quietly outrank today's market and the total would
    // drift without anyone touching it.
    const feedPrice = convert(item.current_price, item.currency, displayCurrency, fx);
    const own = ownPrices.get(row.market_item_id) ?? null;
    const usingOwn = feedPrice === null && own !== null;
    const price = feedPrice ?? own?.price ?? null;

    const summary = summarize(transactions, complete ? price : null);

    return {
      holdingId: row.id,
      item,
      photoPath: row.photo_path,
      summary: complete ? summary : unknownValueSummary(summary),
      spark: (sparks.get(row.market_item_id) ?? [])
        .map((p) => convert(p.price, p.currency, displayCurrency, fx))
        .filter((n): n is number => n !== null),
      selfReported: usingOwn ? own : null,
    };
  });

  const open = views.filter((v) => v.summary.quantity > 0);

  return {
    currency: displayCurrency,
    holdings: open.sort(byValueDesc),
    totals: totals(views.map((v) => v.summary)),
    byCategory: categoryBreakdown(open),
    selfReportedCount: open.filter((v) => v.selfReported !== null).length,
  };
}

/**
 * Self-reported prices by item, normalised into the display currency.
 *
 * A row whose currency has no rate is dropped rather than carried at its face
 * value — the same rule the rest of this module applies to money it cannot
 * convert.
 */
function ownPriceMap(
  rows: unknown,
  displayCurrency: Currency,
  fx: FxTable,
): Map<string, SelfReportedPrice> {
  const map = new Map<string, SelfReportedPrice>();
  if (!Array.isArray(rows)) return map;

  for (const row of rows) {
    const price = convert(Number(row.price), row.currency as Currency, displayCurrency, fx);
    if (price === null) continue;
    map.set(row.market_item_id as string, {
      price,
      source: row.source as string,
      asOf: row.as_of as string,
    });
  }
  return map;
}

function byValueDesc(a: HoldingView, b: HoldingView): number {
  // Priced holdings sort above unpriced ones; within each, largest first.
  const av = a.summary.marketValue;
  const bv = b.summary.marketValue;
  if (av === null && bv === null) return a.item.name.localeCompare(b.item.name);
  if (av === null) return 1;
  if (bv === null) return -1;
  return bv - av;
}

function categoryBreakdown(
  views: readonly HoldingView[],
): Array<{ category: Category; value: number; share: number }> {
  const sums = new Map<Category, number>();
  let total = 0;

  for (const v of views) {
    if (v.summary.marketValue === null) continue;
    sums.set(v.item.category, (sums.get(v.item.category) ?? 0) + v.summary.marketValue);
    total += v.summary.marketValue;
  }

  if (total === 0) return [];

  return [...sums.entries()]
    .map(([category, value]) => ({ category, value, share: (value / total) * 100 }))
    .sort((a, b) => b.value - a.value);
}

/** Latest snapshots per item, used for row sparklines. */
async function loadSparklines(
  supabase: SupabaseClient,
  itemIds: readonly string[],
): Promise<Map<string, Array<{ price: number; currency: Currency }>>> {
  const out = new Map<string, Array<{ price: number; currency: Currency }>>();
  if (itemIds.length === 0) return out;

  const { data } = await supabase
    .from("price_snapshots")
    .select("market_item_id, price, currency, observed_at")
    .in("market_item_id", [...new Set(itemIds)])
    .order("observed_at", { ascending: true })
    .limit(1200);

  for (const row of data ?? []) {
    const currency = row.currency as string;
    if (!isCurrency(currency)) continue;

    const id = row.market_item_id as string;
    const list = out.get(id) ?? [];
    list.push({ price: Number(row.price), currency });
    out.set(id, list);
  }

  // Keep the tail — a sparkline shows recent shape, not the full history.
  for (const [id, list] of out) out.set(id, list.slice(-30));
  return out;
}

export interface PortfolioPoint {
  ts: number;
  value: number;
}

/**
 * Total portfolio value over time, reconstructed from the same two ledgers the
 * rest of the app trusts: how many units were held on a given day, and the
 * price observed on a given day. Both are day-granular already (transactions
 * carry a date, the cron writes one snapshot a day), so state is advanced one
 * calendar day at a time rather than to an arbitrary timestamp.
 *
 * A day is only plotted once at least one held item has a known price — an
 * item with no snapshot yet is left out of that day's sum rather than priced
 * at 0, the same rule ./calc.ts applies to a single holding. Early in a
 * deployment's life, before the daily cron has run more than a few times, this
 * draws a short and mostly flat line; it lengthens as history accumulates.
 *
 * Every snapshot converts through TODAY's FX rate, not the rate on the day it
 * was observed — historical rates are not something this product stores. For a
 * JPY-denominated holding viewed in JPY this is exact; for a converted holding
 * it is the same approximation the rest of the app makes (see the Cardmarket
 * EUR note in docs/RESEARCH.md §8.2) and is small next to how much collectible
 * prices themselves move.
 */
export async function loadPortfolioSeries(
  supabase: SupabaseClient,
  userId: string,
  displayCurrency: Currency,
): Promise<PortfolioPoint[]> {
  const { data: holdingRows } = await supabase
    .from("holdings")
    .select("id, market_item_id")
    .eq("user_id", userId);

  const holdings = (holdingRows ?? []) as Array<{ id: string; market_item_id: string }>;
  if (holdings.length === 0) return [];

  const holdingToItem = new Map(holdings.map((h) => [h.id, h.market_item_id]));
  const itemIds = [...new Set(holdings.map((h) => h.market_item_id))];

  const [{ data: txRows }, { data: snapRows }, fx] = await Promise.all([
    supabase
      .from("transactions")
      .select("holding_id, type, traded_on, quantity")
      .eq("user_id", userId),
    supabase
      .from("price_snapshots")
      .select("market_item_id, price, currency, observed_at")
      .in("market_item_id", itemIds)
      .order("observed_at", { ascending: true })
      .limit(20_000),
    loadFxRates(supabase),
  ]);

  interface DayBucket {
    deltas: Array<[itemId: string, delta: number]>;
    prices: Map<string, number>;
  }
  const days = new Map<string, DayBucket>();
  const bucket = (day: string): DayBucket => {
    let b = days.get(day);
    if (!b) {
      b = { deltas: [], prices: new Map() };
      days.set(day, b);
    }
    return b;
  };

  for (const tx of (txRows ?? []) as Array<{
    holding_id: string;
    type: "buy" | "sell";
    traded_on: string;
    quantity: number;
  }>) {
    const itemId = holdingToItem.get(tx.holding_id);
    if (!itemId) continue;
    bucket(tx.traded_on).deltas.push([itemId, tx.type === "buy" ? tx.quantity : -tx.quantity]);
  }

  for (const snap of (snapRows ?? []) as Array<{
    market_item_id: string;
    price: number;
    currency: string;
    observed_at: string;
  }>) {
    if (!isCurrency(snap.currency)) continue;
    const price = convert(Number(snap.price), snap.currency, displayCurrency, fx);
    if (price === null) continue;
    // Ascending input order means a later snapshot the same day simply
    // overwrites an earlier one — the day's closing observation wins.
    bucket(snap.observed_at.slice(0, 10)).prices.set(snap.market_item_id, price);
  }

  const qty = new Map<string, number>();
  const lastPrice = new Map<string, number>();
  const series: PortfolioPoint[] = [];

  for (const day of [...days.keys()].sort()) {
    const b = days.get(day)!;
    for (const [itemId, delta] of b.deltas) qty.set(itemId, (qty.get(itemId) ?? 0) + delta);
    for (const [itemId, price] of b.prices) lastPrice.set(itemId, price);

    let value = 0;
    let priced = false;
    for (const [itemId, q] of qty) {
      if (q <= 0) continue;
      const p = lastPrice.get(itemId);
      if (p === undefined) continue;
      value += p * q;
      priced = true;
    }

    if (priced) series.push({ ts: new Date(`${day}T00:00:00Z`).getTime(), value });
  }

  return series;
}

/** FX rates as "units of X per 1 JPY". */
export async function loadFxRates(supabase: SupabaseClient): Promise<FxTable> {
  const { data } = await supabase.from("fx_rates").select("currency, rate");

  const table: Record<string, number> = {};
  for (const row of data ?? []) table[row.currency as string] = Number(row.rate);
  return table as FxTable;
}

export interface ItemDetail {
  item: MarketItem;
  /** Current market price converted into the display currency, or null. */
  price: number | null;
  holdingId: string | null;
  photoPath: string | null;
  transactions: TransactionRow[];
  snapshots: Array<{ ts: number; price: number }>;
  summary: HoldingSummary;
  /**
   * What users reported selling this for, converted to the display currency.
   * Null until three separate people have reported inside the window — the
   * floor lives in the database so both apps inherit it.
   */
  community: { price: number; contributors: number; reports: number } | null;
  /** Monthly community points for the chart. Empty when none clear the floor. */
  communitySeries: Array<{ ts: number; price: number }>;
  /**
   * The user's own trades, ready to plot: real date, real price paid, in the
   * display currency. Converting here rather than in each chart is what stops
   * a JPY purchase from being drawn against a USD axis — the two apps would
   * otherwise each have to remember, and one of them eventually would not.
   * A trade whose currency has no rate is dropped rather than shown wrong.
   */
  trades: Array<{ ts: number; type: "buy" | "sell"; quantity: number; unitPrice: number }>;
  /** Set when `price` came from the user's own entry rather than from a feed. */
  selfReported: SelfReportedPrice | null;
}

/** Everything the item-detail screen needs, in one round of queries. */
export async function loadItemDetail(
  supabase: SupabaseClient,
  itemId: string,
  userId: string,
  displayCurrency: Currency,
): Promise<ItemDetail | null> {
  const { data: itemRow } = await supabase
    .from("market_items")
    .select(ITEM_COLUMNS)
    .eq("id", itemId)
    .maybeSingle();

  if (!itemRow) return null;
  const item = itemRow as MarketItem;

  const [
    { data: holding },
    { data: snapshotRows },
    fx,
    { data: crowd },
    { data: crowdSeries },
    { data: ownRows },
  ] = await Promise.all([
      supabase
        .from("holdings")
        .select("id, photo_path")
        .eq("user_id", userId)
        .eq("market_item_id", itemId)
        .maybeSingle(),
      supabase
        .from("price_snapshots")
        .select("price, currency, observed_at")
        .eq("market_item_id", itemId)
        .order("observed_at", { ascending: true })
        .limit(400),
      loadFxRates(supabase),
      // Both functions apply the contributor floor themselves and return no rows
      // when it is not met, so "too thin to publish" arrives here as an empty
      // result rather than as something this layer has to re-check.
      supabase.rpc("community_price", { item: itemId }),
      supabase.rpc("community_price_series", { item: itemId }),
      supabase
        .from("self_reported_prices")
        .select("market_item_id, price, currency, source, as_of")
        .eq("user_id", userId)
        .eq("market_item_id", itemId),
    ]);

  let transactions: TransactionRow[] = [];
  if (holding) {
    const { data } = await supabase
      .from("transactions")
      .select("id, holding_id, type, traded_on, quantity, unit_price, currency")
      .eq("holding_id", holding.id)
      .eq("user_id", userId)
      .order("traded_on", { ascending: false });
    transactions = (data ?? []) as TransactionRow[];
  }

  const snapshots = (snapshotRows ?? [])
    .map((s) => ({
      ts: new Date(s.observed_at as string).getTime(),
      price: convert(Number(s.price), s.currency as Currency, displayCurrency, fx),
    }))
    .filter((p): p is { ts: number; price: number } => p.price !== null);

  const { transactions: converted, complete } = convertTransactions(
    transactions,
    displayCurrency,
    fx,
  );
  // Same precedence as the portfolio: the feed wins where it exists, and the
  // user's own figure fills in only for items nothing prices automatically.
  const feedPrice = convert(item.current_price, item.currency, displayCurrency, fx);
  const own = ownPriceMap(ownRows, displayCurrency, fx).get(itemId) ?? null;
  const usingOwn = feedPrice === null && own !== null;
  const price = feedPrice ?? own?.price ?? null;

  const raw = summarize(converted, complete ? price : null);

  const crowdRow = Array.isArray(crowd) ? crowd[0] : null;
  const crowdPrice = crowdRow
    ? convert(Number(crowdRow.price_jpy), "JPY", displayCurrency, fx)
    : null;

  return {
    item,
    price,
    holdingId: holding?.id ?? null,
    photoPath: holding?.photo_path ?? null,
    transactions,
    snapshots,
    summary: complete ? raw : unknownValueSummary(raw),
    community:
      crowdRow && crowdPrice !== null
        ? {
            price: crowdPrice,
            contributors: Number(crowdRow.contributors),
            reports: Number(crowdRow.reports),
          }
        : null,
    selfReported: usingOwn ? own : null,
    trades: transactions
      .map((tx) => ({
        ts: new Date(`${tx.traded_on}T00:00:00Z`).getTime(),
        type: tx.type,
        quantity: tx.quantity,
        unitPrice: convert(tx.unit_price, tx.currency, displayCurrency, fx),
      }))
      .filter((t): t is (typeof t & { unitPrice: number }) => t.unitPrice !== null)
      .sort((a, b) => a.ts - b.ts),
    communitySeries: (Array.isArray(crowdSeries) ? crowdSeries : [])
      .map((row) => ({
        ts: new Date(`${row.month}T00:00:00Z`).getTime(),
        price: convert(Number(row.price_jpy), "JPY", displayCurrency, fx),
      }))
      .filter((p): p is { ts: number; price: number } => p.price !== null),
  };
}

/** Catalogue search, shared by the web market page and the native Browse tab. */
export async function searchItems(
  supabase: SupabaseClient,
  { term, category, limit = 200 }: { term?: string; category?: Category | null; limit?: number },
): Promise<MarketItem[]> {
  let query = supabase.from("market_items").select(ITEM_COLUMNS).order("name").limit(limit);

  if (category) query = query.eq("category", category);

  const trimmed = (term ?? "").trim().slice(0, 80);
  if (trimmed) {
    // Escape PostgREST's `or` delimiters so a comma or paren in the search box
    // cannot alter the filter expression.
    const safe = trimmed.replace(/[,()]/g, " ");
    // `aliases` is what makes a Japanese-language search match a catalogue
    // named in English (エルメス against Hermès) — see migration 0008/0009.
    query = query.or(
      `name.ilike.%${safe}%,detail.ilike.%${safe}%,identifier.ilike.%${safe}%,aliases.ilike.%${safe}%`,
    );
  }

  const { data } = await query;
  return (data ?? []) as MarketItem[];
}

/** Catalogue ids the user already holds, for "in holdings" badges. */
export async function heldItemIds(
  supabase: SupabaseClient,
  userId: string,
): Promise<Set<string>> {
  const { data } = await supabase
    .from("holdings")
    .select("market_item_id")
    .eq("user_id", userId);
  return new Set((data ?? []).map((r) => r.market_item_id as string));
}
