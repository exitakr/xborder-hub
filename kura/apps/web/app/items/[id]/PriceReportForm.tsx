"use client";

import { useActionState, useState } from "react";
import type { getDict, Currency } from "@oma/core";
import { CONDITIONS, VENUES } from "@oma/core";
import { submitPriceReport, type ReportState } from "./actions";

const VENUE_KEY = {
  mercari: "cmVenueMercari",
  yahoo_auction: "cmVenueYahoo",
  store: "cmVenueStore",
  other: "cmVenueOther",
} as const;

const CONDITION_KEY = {
  new: "cmConditionNew",
  used: "cmConditionUsed",
  graded: "cmConditionGraded",
} as const;

/**
 * Contributing a realised price.
 *
 * Collapsed by default: this is a secondary action on a screen whose job is to
 * show a portfolio, and an always-open form would read as something the user is
 * required to fill in.
 */
export function PriceReportForm({
  t,
  marketItemId,
  defaultCurrency,
}: {
  t: ReturnType<typeof getDict>;
  marketItemId: string;
  defaultCurrency: Currency;
}) {
  const [state, action, pending] = useActionState<ReportState, FormData>(submitPriceReport, {});
  const [open, setOpen] = useState(false);

  if (state.ok && !open) {
    return (
      <p role="status" className="rounded-lg bg-gain/5 px-3 py-3 text-sm text-gain">
        {t.cmSubmitted}
      </p>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary w-full">
        {t.cmReport}
      </button>
    );
  }

  return (
    <div className="card space-y-4 p-4">
      <div>
        <h3 className="text-sm font-semibold">{t.cmReportTitle}</h3>
        <p className="mt-1 text-xs text-muted">{t.cmReportLead}</p>
      </div>

      {state.error && (
        <p role="alert" className="rounded-lg bg-loss/5 px-3 py-2 text-sm text-loss">
          {state.error === "future_date"
            ? t.txErrFuture
            : state.error === "price"
              ? t.txErrPrice
              : t.txErrGeneric}
        </p>
      )}

      <form action={action} className="space-y-3">
        <input type="hidden" name="marketItemId" value={marketItemId} />

        <div>
          <label className="label" htmlFor="report-kind">
            {t.cmKind}
          </label>
          <select id="report-kind" name="kind" defaultValue="sold" className="field">
            <option value="sold">{t.cmKindSold}</option>
            <option value="bought">{t.cmKindBought}</option>
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="report-price">
              {t.txUnitPrice}
            </label>
            <input
              id="report-price"
              name="price"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="any"
              required
              className="field tnum"
            />
          </div>
          <div>
            <label className="label" htmlFor="report-currency">
              {t.myCurrency}
            </label>
            <select
              id="report-currency"
              name="currency"
              defaultValue={defaultCurrency}
              className="field"
            >
              <option value="JPY">JPY</option>
              <option value="SGD">SGD</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="report-date">
            {t.txDate}
          </label>
          <input
            id="report-date"
            name="tradedOn"
            type="date"
            required
            max={new Date().toISOString().slice(0, 10)}
            className="field"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="report-venue">
              {t.cmVenue}
            </label>
            <select id="report-venue" name="venue" defaultValue="other" className="field">
              {VENUES.map((venue) => (
                <option key={venue} value={venue}>
                  {t[VENUE_KEY[venue]]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="report-condition">
              {t.cmCondition}
            </label>
            <select id="report-condition" name="condition" defaultValue="used" className="field">
              {CONDITIONS.map((condition) => (
                <option key={condition} value={condition}>
                  {t[CONDITION_KEY[condition]]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-xs text-muted">{t.cmPrivacyNote}</p>

        <div className="flex gap-2">
          <button type="submit" disabled={pending} className="btn-primary flex-1">
            {pending ? t.loading : t.cmSubmit}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
            {t.txCancel}
          </button>
        </div>
      </form>
    </div>
  );
}
