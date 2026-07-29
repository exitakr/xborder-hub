import { summarize, totals, type HoldingSummary } from "./calc";
import { convertTransactions, unknownValueSummary } from "./holdings";
import { convert, isCurrency, type Currency, type FxTable } from "./money";
import type { Category, HoldingRow, MarketItem, TransactionRow } from "./types";
import { createClient } from "./supabase/server";

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
 * Load everything the portfolio screen needs.
 *
 * All money is normalised into the user's display currency here, once, so no
 * component has to think about FX. Anything that cannot be converted (missing
 * rate, missing price) stays `null` and is excluded from totals rather than
 * being coerced to 0 — see lib/calc.ts.
 */
export async function loadPortfolio(
  userId: string,
  displayCurrency: Currency,
): Promise<PortfolioView> {
  const supabase = await createClient();

  const [holdingsRes, txRes, fx] = await Promise.all([
    supabase
      .from("holdings")
      .select(
        "id, market_item_id, photo_path, note, market_items(id, category, name, detail, identifier, source_type, source_url, current_price, currency, price_updated_at, data_confidence)",
      )
      .eq("user_id", userId),
    supabase
      .from("transactions")
      .select("id, holding_id, type, traded_on, quantity, unit_price, currency")
      .eq("user_id", userId),
    loadFxRates(),
  ]);

  const holdingRows = (holdingsRes.data ?? []) as unknown as HoldingRow[];
  const txRows = (txRes.data ?? []) as TransactionRow[];

  const txByHolding = new Map<string, TransactionRow[]>();
  for (const tx of txRows) {
    const list = txByHolding.get(tx.holding_id);
    if (list) list.push(tx);
    else txByHolding.set(tx.holding_id, [tx]);
  }

  const sparks = await loadSparklines(holdingRows.map((h) => h.market_item_id));

  const views: HoldingView[] = holdingRows.map((row) => {
    const item = row.market_items;

    // Transactions are recorded in whatever currency the user typed; convert
    // each one individually so a mixed-currency history still adds up.
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
    const current = sums.get(v.item.category) ?? 0;
    sums.set(v.item.category, current + v.summary.marketValue);
    total += v.summary.marketValue;
  }

  if (total === 0) return [];

  return [...sums.entries()]
    .map(([category, value]) => ({ category, value, share: (value / total) * 100 }))
    .sort((a, b) => b.value - a.value);
}

/** Latest snapshots per item, used for the row sparklines. */
async function loadSparklines(
  itemIds: readonly string[],
): Promise<Map<string, Array<{ price: number; currency: Currency }>>> {
  const out = new Map<string, Array<{ price: number; currency: Currency }>>();
  if (itemIds.length === 0) return out;

  const supabase = await createClient();
  const { data } = await supabase
    .from("price_snapshots")
    .select("market_item_id, price, currency, observed_at")
    .in("market_item_id", [...new Set(itemIds)])
    .order("observed_at", { ascending: true })
    .limit(1200);

  for (const row of data ?? []) {
    const id = row.market_item_id as string;
    const currency = row.currency as string;
    if (!isCurrency(currency)) continue;

    const list = out.get(id) ?? [];
    list.push({ price: Number(row.price), currency });
    out.set(id, list);
  }

  // Keep the tail — a sparkline is about the recent shape, not the full history.
  for (const [id, list] of out) {
    out.set(id, list.slice(-30));
  }
  return out;
}

/** FX rates as "units of X per 1 JPY". */
export async function loadFxRates(): Promise<FxTable> {
  const supabase = await createClient();
  const { data } = await supabase.from("fx_rates").select("currency, rate");

  const table: Record<string, number> = {};
  for (const row of data ?? []) {
    table[row.currency as string] = Number(row.rate);
  }
  return table as FxTable;
}
