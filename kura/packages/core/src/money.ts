import type { Locale } from "./i18n/dict.ts";

/**
 * Supported display currencies. JPY for Japan, SGD for Singapore, USD as the
 * global fallback — these are the launch markets.
 */
export const CURRENCIES = ["JPY", "SGD", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export function isCurrency(v: string | null | undefined): v is Currency {
  return v === "JPY" || v === "SGD" || v === "USD";
}

/** Currencies with no minor unit — never show decimals for these. */
const ZERO_DECIMAL: ReadonlySet<string> = new Set(["JPY"]);

export function fractionDigits(currency: Currency): number {
  return ZERO_DECIMAL.has(currency) ? 0 : 2;
}

/**
 * Format a monetary amount already expressed in `currency`.
 * `null` renders as an em dash — SPEC §5 forbids treating missing prices as 0.
 */
export function formatMoney(
  amount: number | null | undefined,
  currency: Currency,
  locale: Locale,
): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) return "—";
  const digits = fractionDigits(currency);
  return new Intl.NumberFormat(locale === "ja" ? "ja-JP" : "en-SG", {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
}

/** Signed percentage, e.g. "+12.4%". Returns "—" when undefined. */
export function formatPercent(pct: number | null | undefined, locale: Locale): string {
  if (pct === null || pct === undefined || !Number.isFinite(pct)) return "—";
  const formatted = new Intl.NumberFormat(locale === "ja" ? "ja-JP" : "en-SG", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Math.abs(pct));
  const sign = pct > 0 ? "+" : pct < 0 ? "−" : "";
  return `${sign}${formatted}%`;
}

/**
 * Convert between currencies using rates expressed as "units of X per 1 JPY".
 * Storing everything against a single pivot (JPY) keeps the rate table small
 * and makes every conversion two multiplications with no lookup fan-out.
 */
export type FxTable = Readonly<Partial<Record<Currency, number>>>;

export function convert(
  amount: number | null,
  from: Currency,
  to: Currency,
  fx: FxTable,
): number | null {
  if (amount === null || !Number.isFinite(amount)) return null;
  if (from === to) return amount;

  const fromRate = from === "JPY" ? 1 : fx[from];
  const toRate = to === "JPY" ? 1 : fx[to];
  // A missing rate must surface as "no data" rather than a silently wrong number.
  if (!fromRate || !toRate) return null;

  const inJpy = amount / fromRate;
  return inJpy * toRate;
}
