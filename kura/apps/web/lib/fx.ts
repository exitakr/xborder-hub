/**
 * Foreign exchange rates for the daily refresh.
 *
 * Rates are stored as "units of X per 1 JPY" to match @oma/core's money module.
 * EUR is fetched but deliberately NOT stored: it is not a display currency, and
 * the only thing that needs it is converting Cardmarket quotes onto the USD axis
 * at ingest time.
 */

const DEFAULT_ENDPOINT = "https://open.er-api.com/v6/latest/JPY";

/** Currencies users can display totals in. Must match @oma/core's CURRENCIES. */
const STORED = ["SGD", "USD"] as const;

export interface FxSnapshot {
  rows: Array<{ currency: string; rate: number; updated_at: string }>;
  /** Units of USD per 1 EUR, or undefined when either leg is unavailable. */
  eurToUsd?: number;
}

export async function fetchFxRates(): Promise<FxSnapshot> {
  const endpoint = process.env.FX_RATES_URL ?? DEFAULT_ENDPOINT;

  try {
    const res = await fetch(endpoint, { cache: "no-store" });
    if (!res.ok) return { rows: [] };

    const json = (await res.json()) as { rates?: Record<string, number> };
    const rates = json.rates;
    if (!rates) return { rows: [] };

    const updated_at = new Date().toISOString();
    const rows = STORED.filter((c) => isPositive(rates[c])).map((c) => ({
      currency: c,
      rate: rates[c],
      updated_at,
    }));

    // Both legs are quoted per 1 JPY, so the cross rate is their ratio.
    const eurToUsd =
      isPositive(rates.EUR) && isPositive(rates.USD) ? rates.USD / rates.EUR : undefined;

    return { rows, eurToUsd };
  } catch {
    // Stale rates are better than no app; the previous values stay in place.
    return { rows: [] };
  }
}

function isPositive(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
