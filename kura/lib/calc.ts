/**
 * Portfolio arithmetic (SPEC §5).
 *
 * Every function here is pure so the rules can be unit-tested without a database.
 * The single most important invariant: a missing `currentPrice` is `null`, never
 * 0, and must be excluded from totals rather than dragging them down.
 */

export type TxType = "buy" | "sell";

export interface Transaction {
  id: string;
  type: TxType;
  /** ISO date (YYYY-MM-DD). */
  tradedOn: string;
  quantity: number;
  unitPrice: number;
}

export interface HoldingSummary {
  /** Net units held: buys − sells. */
  quantity: number;
  /** Weighted average price across buy transactions. `null` when never bought. */
  avgCost: number | null;
  /** Total spent on the units currently held. `null` when avgCost is unknown. */
  costBasis: number | null;
  /** currentPrice × quantity. `null` when price data is missing. */
  marketValue: number | null;
  /** marketValue − costBasis. `null` when either side is unknown. */
  unrealized: number | null;
  /** Unrealised gain as a percentage of cost basis. `null` when undefined. */
  unrealizedPct: number | null;
  /** Realised P/L from sells, valued at the average cost at time of sale. */
  realized: number;
}

/**
 * Weighted average purchase price: Σ(price × qty) / Σ(qty) over buys only.
 */
export function averageCost(transactions: readonly Transaction[]): number | null {
  let spend = 0;
  let units = 0;
  for (const tx of transactions) {
    if (tx.type !== "buy") continue;
    spend += tx.unitPrice * tx.quantity;
    units += tx.quantity;
  }
  if (units <= 0) return null;
  return spend / units;
}

/** Net quantity held. May be negative only if bad data slipped past validation. */
export function netQuantity(transactions: readonly Transaction[]): number {
  let qty = 0;
  for (const tx of transactions) {
    qty += tx.type === "buy" ? tx.quantity : -tx.quantity;
  }
  return qty;
}

/**
 * Realised P/L, walking transactions in chronological order so that each sell is
 * valued against the average cost as it stood at that moment. Computing this from
 * the final average cost instead would misstate results whenever a user buys more
 * after selling.
 */
export function realizedProfit(transactions: readonly Transaction[]): number {
  const ordered = [...transactions].sort(compareByDate);

  let units = 0;
  let spend = 0; // running cost of the units currently held
  let realized = 0;

  for (const tx of ordered) {
    if (tx.type === "buy") {
      units += tx.quantity;
      spend += tx.unitPrice * tx.quantity;
      continue;
    }

    // A sell with nothing held cannot be valued; validation rejects it, and we
    // ignore it here rather than inventing a cost basis of 0.
    if (units <= 0) continue;

    const sold = Math.min(tx.quantity, units);
    const avg = spend / units;
    realized += (tx.unitPrice - avg) * sold;
    units -= sold;
    spend -= avg * sold;
  }

  return realized;
}

function compareByDate(a: Transaction, b: Transaction): number {
  if (a.tradedOn !== b.tradedOn) return a.tradedOn < b.tradedOn ? -1 : 1;
  // Buys settle before sells on the same day so a same-day buy→sell has a basis.
  if (a.type !== b.type) return a.type === "buy" ? -1 : 1;
  return 0;
}

/**
 * Full per-holding summary.
 *
 * @param currentPrice Latest market price, or `null` when data is insufficient.
 */
export function summarize(
  transactions: readonly Transaction[],
  currentPrice: number | null,
): HoldingSummary {
  const quantity = netQuantity(transactions);
  const avgCost = averageCost(transactions);
  const realized = realizedProfit(transactions);

  const costBasis = avgCost === null ? null : avgCost * quantity;

  const marketValue =
    currentPrice === null || !Number.isFinite(currentPrice) ? null : currentPrice * quantity;

  const unrealized =
    marketValue === null || costBasis === null ? null : marketValue - costBasis;

  // Percentage is undefined when there is no capital at risk.
  const unrealizedPct =
    unrealized === null || costBasis === null || costBasis === 0
      ? null
      : (unrealized / costBasis) * 100;

  return { quantity, avgCost, costBasis, marketValue, unrealized, unrealizedPct, realized };
}

export interface PortfolioTotals {
  totalValue: number;
  totalCost: number;
  unrealized: number;
  unrealizedPct: number | null;
  realized: number;
  /** Holdings skipped because no price was available. Surfaced in the UI. */
  excludedCount: number;
}

/**
 * Aggregate summaries into portfolio-level figures.
 *
 * Holdings whose market value is unknown are excluded from BOTH sides of the
 * comparison — counting their cost while ignoring their value would invent a loss.
 */
export function totals(summaries: readonly HoldingSummary[]): PortfolioTotals {
  let totalValue = 0;
  let totalCost = 0;
  let realized = 0;
  let excludedCount = 0;

  for (const s of summaries) {
    realized += s.realized;

    if (s.quantity <= 0) continue; // fully sold: realised P/L only (SPEC §5)

    if (s.marketValue === null || s.costBasis === null) {
      excludedCount += 1;
      continue;
    }
    totalValue += s.marketValue;
    totalCost += s.costBasis;
  }

  const unrealized = totalValue - totalCost;
  const unrealizedPct = totalCost === 0 ? null : (unrealized / totalCost) * 100;

  return { totalValue, totalCost, unrealized, unrealizedPct, realized, excludedCount };
}

/**
 * Trimmed median used to turn a noisy list of marketplace prices into one number
 * (SPEC §3.2). Drops the top and bottom `trimRatio` of observations before taking
 * the median, which removes both mispriced listings and outright junk.
 *
 * Returns `null` below `minSamples` — showing a price derived from two listings
 * would be worse than showing nothing.
 */
export function trimmedMedian(
  values: readonly number[],
  { trimRatio = 0.1, minSamples = 5 }: { trimRatio?: number; minSamples?: number } = {},
): { price: number; sampleSize: number } | null {
  const clean = values.filter((v) => Number.isFinite(v) && v > 0).sort((a, b) => a - b);
  if (clean.length < minSamples) return null;

  const drop = Math.floor(clean.length * trimRatio);
  const kept = drop > 0 ? clean.slice(drop, clean.length - drop) : clean;
  if (kept.length === 0) return null;

  const mid = Math.floor(kept.length / 2);
  const price =
    kept.length % 2 === 0 ? (kept[mid - 1] + kept[mid]) / 2 : kept[mid];

  return { price, sampleSize: clean.length };
}

export type Confidence = "high" | "medium" | "low" | "insufficient";

/** Map an observation count onto the confidence label shown next to a price. */
export function confidenceFor(sampleSize: number): Confidence {
  if (sampleSize >= 20) return "high";
  if (sampleSize >= 10) return "medium";
  if (sampleSize >= 5) return "low";
  return "insufficient";
}
