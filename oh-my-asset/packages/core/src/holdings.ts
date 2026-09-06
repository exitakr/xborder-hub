import { convert, type Currency, type FxTable } from "./money.ts";
import type { HoldingSummary, Transaction } from "./calc.ts";
import type { TransactionRow } from "./types.ts";

/**
 * Pure currency-normalisation helpers, kept free of any Next or Supabase import
 * so they can be unit-tested directly. Relative imports carry the `.ts`
 * extension for the same reason — Node's type-stripping test runner resolves
 * real file paths, and `allowImportingTsExtensions` keeps the compiler happy.
 */

/**
 * Convert a holding's transactions into one currency.
 *
 * `complete` is false when any row could not be converted (a missing FX rate).
 * Callers must treat an incomplete set as "value unknown" rather than using the
 * numbers: coercing an unconvertible price to 0 would report the holding as a
 * total gain, which is precisely the failure mode lib/calc.ts exists to prevent.
 */
export function convertTransactions(
  rows: readonly TransactionRow[],
  to: Currency,
  fx: FxTable,
): { transactions: Transaction[]; complete: boolean } {
  let complete = true;

  const transactions = rows.map((tx) => {
    const unitPrice = convert(tx.unit_price, tx.currency, to, fx);
    if (unitPrice === null) complete = false;

    return {
      id: tx.id,
      type: tx.type,
      tradedOn: tx.traded_on,
      quantity: tx.quantity,
      unitPrice: unitPrice ?? 0,
    };
  });

  return { transactions, complete };
}

/** Blank out every money field while keeping quantity, which needs no FX. */
export function unknownValueSummary(summary: HoldingSummary): HoldingSummary {
  return {
    ...summary,
    avgCost: null,
    costBasis: null,
    marketValue: null,
    unrealized: null,
    unrealizedPct: null,
    realized: 0,
  };
}
