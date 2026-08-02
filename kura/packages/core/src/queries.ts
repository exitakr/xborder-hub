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

export interface HoldingView {
  holdingId: string;
  item: MarketItem;
  photoPath: string | null;
  summary: HoldingSummary;
  /** Recent price points for the row sparkline, in the display currency. */
  spark: number[];
}

export interface PortfolioView {
  currency: Currency;
  holdings: HoldingView[];
  totals: ReturnType<typeof totals>;
  byCategory: Array<{ category: Category; value: number; share: number }>;
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
  const [holdingsRes, txRes, fx] = await Promise.all([
    supabase
      .from("holdings")
      .select(`id, market_item_id, photo_path, note, market_items(${ITEM_COLUMNS})`)
      .eq("user_id", userId),
    supabase
      .from("transactions")
      .select("id, holding_id, type, traded_on, quantity, unit_price, currency")
      .eq("user_id", userId),
    loadFxRates(supabase),
  ]);

  const holdingRows = (holdingsRes.data ?? []) as unknown as HoldingRow[];
  const txRows = (txRes.data ?? []) as TransactionRow[];

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

    const price = convert(item.current_price, item.currency, displayCurrency, fx);
    const summary = summarize(transactions, complete ? price : null);

    return {
      holdingId: row.id,
      item,
      photoPath: row.photo_path,
      summary: complete ? summary : unknownValueSummary(summary),
      spark: (sparks.get(row.market_item_id) ?? [])
        .map((p) => convert(p.price, p.currency, displayCurrency, fx))
        .filter((n): n is number => n !== null),
    };
  });

  const open = views.filter((v) => v.summary.quantity > 0);

  return {
    currency: displayCurrency,
    holdings: open.sort(byValueDesc),
    totals: totals(views.map((v) => v.summary)),
    byCategory: categoryBreakdown(open),
  };
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

  const [{ data: holding }, { data: snapshotRows }, fx] = await Promise.all([
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
  const price = convert(item.current_price, item.currency, displayCurrency, fx);
  const raw = summarize(converted, complete ? price : null);

  return {
    item,
    price,
    holdingId: holding?.id ?? null,
    photoPath: holding?.photo_path ?? null,
    transactions,
    snapshots,
    summary: complete ? raw : unknownValueSummary(raw),
  };
}

/** Catalogue search, shared by the web market page and the native Browse tab. */
export async function searchItems(
  supabase: SupabaseClient,
  { term, category, limit = 60 }: { term?: string; category?: Category | null; limit?: number },
): Promise<MarketItem[]> {
  let query = supabase.from("market_items").select(ITEM_COLUMNS).order("name").limit(limit);

  if (category) query = query.eq("category", category);

  const trimmed = (term ?? "").trim().slice(0, 80);
  if (trimmed) {
    // Escape PostgREST's `or` delimiters so a comma or paren in the search box
    // cannot alter the filter expression.
    const safe = trimmed.replace(/[,()]/g, " ");
    query = query.or(`name.ilike.%${safe}%,detail.ilike.%${safe}%,identifier.ilike.%${safe}%`);
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
