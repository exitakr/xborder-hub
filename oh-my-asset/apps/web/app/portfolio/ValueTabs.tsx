"use client";

import { useMemo, useState } from "react";
import { formatMoney, formatPercent } from "@oma/core";
import type { Currency, Locale, PortfolioTrade, Range } from "@oma/core";
import { PortfolioChart, type ValuePoint } from "./PortfolioChart";

type Tab = "value" | "cost";

/**
 * The headline number, and which number it is.
 *
 * WHY THIS EXISTS
 *
 * A portfolio where several items have no market price yet shows a valuation
 * that is quietly incomplete — the total is real, but it is the total of the
 * items that happen to be priced, and nothing on the screen says which ones
 * those are. The invested amount has no such gap: every item has a cost,
 * because the owner typed it in. On the days when the valuation is thin, that
 * is the honest headline, and it is also the one a person can verify.
 *
 * So the two live behind a tab rather than one being derived from the other in
 * a supporting stat. Switching is cheap, both series come from the same walk
 * over the same ledgers, and the choice is the reader's rather than ours.
 */
export function ValueTabs({
  points,
  trades,
  currency,
  locale,
  totalValue,
  totalCost,
  unrealized,
  unrealizedPct,
  pricedCount,
  holdingCount,
  labels,
}: {
  points: Array<{ ts: number; value: number; cost: number }>;
  trades: PortfolioTrade[];
  currency: Currency;
  locale: Locale;
  totalValue: number;
  totalCost: number;
  unrealized: number;
  /** Null when there is no cost to measure against — a gift, or an import. */
  unrealizedPct: number | null;
  /** Holdings with a usable price. The valuation's real denominator. */
  pricedCount: number;
  holdingCount: number;
  labels: {
    value: string;
    cost: string;
    partial: string;
    rangeLabels: Record<Range, string>;
    emptyLabel: string;
  };
}) {
  const [tab, setTab] = useState<Tab>("value");

  // The chart plots one number, so the tab picks which one it is rather than
  // the chart learning about tabs.
  const series: ValuePoint[] = useMemo(
    () => points.map((p) => ({ ts: p.ts, value: tab === "value" ? p.value : p.cost })),
    [points, tab],
  );

  const headline = tab === "value" ? totalValue : totalCost;
  const tone = unrealized > 0 ? "text-gain" : unrealized < 0 ? "text-loss" : "text-muted";

  return (
    <>
      {/* Radio semantics rather than buttons: these are two views of one
          figure, exactly one of which is showing. */}
      <div className="flex gap-1" role="tablist" aria-label={labels.value}>
        {(["value", "cost"] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              tab === key
                ? "bg-accent/10 font-medium text-accent"
                : "text-muted hover:text-ink"
            }`}
          >
            {key === "value" ? labels.value : labels.cost}
          </button>
        ))}
      </div>

      <p className="tnum mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
        {formatMoney(headline, currency, locale)}
      </p>

      {tab === "value" ? (
        <>
          <p className={`tnum mt-1.5 text-base font-medium ${tone}`}>
            {formatMoney(unrealized, currency, locale)}
            {unrealizedPct !== null && ` (${formatPercent(unrealizedPct, locale)})`}
          </p>
          {/* Says how much of the portfolio the valuation actually covers.
              Without it, a total built from three of eleven items looks exactly
              like a total built from all eleven — and the gap is the single
              most misleading thing this screen can do. */}
          {pricedCount < holdingCount && (
            <p className="mt-1 text-xs text-muted">
              {labels.partial
                .replace("{priced}", String(pricedCount))
                .replace("{total}", String(holdingCount))}
            </p>
          )}
        </>
      ) : (
        // No gain figure here: against cost, the gain IS the valuation, and
        // repeating it under a number the reader switched away from would
        // undo the point of switching.
        <p className="mt-1.5 text-base text-muted">&nbsp;</p>
      )}

      <div className="mt-5">
        <PortfolioChart
          points={series}
          trades={trades}
          currency={currency}
          locale={locale}
          emptyLabel={labels.emptyLabel}
          rangeLabels={labels.rangeLabels}
        />
      </div>
    </>
  );
}
