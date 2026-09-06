import { z } from "zod";
import { CATEGORIES } from "./types.ts";
import { CURRENCIES } from "./money.ts";

/**
 * Server-side schemas (SPEC §8). Client validation is a convenience; these are
 * the rules that actually hold, and every Server Action parses through them.
 */

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "invalid_date")
  .refine((value) => !Number.isNaN(Date.parse(value)), "invalid_date");

/** Today in UTC. Compared as a plain string, which is safe for ISO dates. */
function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export const transactionSchema = z.object({
  holdingId: z.string().uuid(),
  type: z.enum(["buy", "sell"]),
  tradedOn: isoDate.refine((d) => d <= todayUtc(), { message: "future_date" }),
  quantity: z.coerce.number().int().min(1).max(100_000),
  unitPrice: z.coerce.number().positive().max(1_000_000_000),
  currency: z.enum(CURRENCIES),
});

export type TransactionInput = z.infer<typeof transactionSchema>;

export const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(60),
  baseCurrency: z.enum(CURRENCIES),
  locale: z.enum(["ja", "en"]),
});

export const curatedPriceSchema = z.object({
  marketItemId: z.string().uuid(),
  price: z.coerce.number().positive().max(1_000_000_000),
  currency: z.enum(CURRENCIES),
  // Requiring a real URL is what makes curated prices auditable.
  sourceUrl: z.string().url().max(2000),
});

export const VENUES = ["mercari", "yahoo_auction", "store", "other"] as const;
export const CONDITIONS = ["new", "used", "graded"] as const;

/**
 * A trade the user volunteers as market evidence.
 *
 * Separate from `transactionSchema` even though the fields overlap: a portfolio
 * entry is private bookkeeping, while this is a deliberate contribution to a
 * figure other people will read. Venue and condition exist only here, because
 * they are what let a reader judge whether the number applies to their copy.
 */
export const priceReportSchema = z.object({
  marketItemId: z.string().uuid(),
  kind: z.enum(["sold", "bought"]),
  price: z.coerce.number().positive().max(1_000_000_000),
  currency: z.enum(CURRENCIES),
  tradedOn: isoDate.refine((d) => d <= todayUtc(), { message: "future_date" }),
  venue: z.enum(VENUES),
  condition: z.enum(CONDITIONS),
});

export type PriceReportInput = z.infer<typeof priceReportSchema>;

/**
 * A valuation the holder supplies for an item nothing prices automatically.
 *
 * `source` is required and not merely encouraged: an unattributed number cannot
 * be judged later, and the portfolio disclaimer that explains where the total
 * came from has nothing to name without it.
 */
export const selfReportedPriceSchema = z.object({
  marketItemId: z.string().uuid(),
  price: z.coerce.number().positive().max(1_000_000_000),
  currency: z.enum(CURRENCIES),
  source: z.string().trim().min(1).max(120),
  asOf: isoDate.refine((d) => d <= todayUtc(), { message: "future_date" }),
});

export type SelfReportedPriceInput = z.infer<typeof selfReportedPriceSchema>;

export const newItemSchema = z.object({
  category: z.enum(CATEGORIES),
  name: z.string().trim().min(1).max(120),
  detail: z.string().trim().max(200).optional(),
  identifier: z.string().trim().max(80).optional(),
});
