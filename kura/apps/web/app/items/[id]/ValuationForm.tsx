"use client";

import { useActionState, useState } from "react";
import { fill, formatMoney, type Currency, type getDict, type SelfReportedPrice } from "@oma/core";
import {
  deleteSelfReportedPrice,
  saveSelfReportedPrice,
  type ValuationState,
} from "./actions";

/**
 * The holder's own valuation, for items nothing prices automatically.
 *
 * Only offered when there is no feed price: an item that already has one does
 * not need a second, and letting a stale entry sit alongside a live quote would
 * only raise the question of which the total used.
 */
export function ValuationForm({
  t,
  marketItemId,
  defaultCurrency,
  locale,
  existing,
}: {
  t: ReturnType<typeof getDict>;
  marketItemId: string;
  defaultCurrency: Currency;
  locale: "ja" | "en";
  existing: SelfReportedPrice | null;
}) {
  const [state, action, pending] = useActionState<ValuationState, FormData>(
    saveSelfReportedPrice,
    {},
  );
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div className="space-y-2">
        {existing && (
          <div className="rounded-lg bg-canvas px-3 py-2 text-xs text-muted">
            <p className="tnum text-sm font-medium text-ink">
              {formatMoney(existing.price, defaultCurrency, locale)}
              <span className="ml-2 rounded bg-line px-1.5 py-0.5 text-[10px] font-normal text-muted">
                {t.srBadge}
              </span>
            </p>
            <p className="mt-0.5">
              {fill(t.srNote, { asOf: existing.asOf, source: existing.source })}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <button type="button" onClick={() => setOpen(true)} className="btn-secondary flex-1">
            {existing ? t.srEdit : t.srAdd}
          </button>
          {existing && (
            <form action={deleteSelfReportedPrice}>
              <input type="hidden" name="marketItemId" value={marketItemId} />
              <button
                type="submit"
                className="btn-secondary text-loss"
                onClick={(e) => {
                  if (!confirm(t.srRemoveConfirm)) e.preventDefault();
                }}
              >
                {t.srRemove}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {state.error && (
        <p role="alert" className="rounded-lg bg-loss/5 px-3 py-2 text-sm text-loss">
          {state.error === "future_date"
            ? t.txErrFuture
            : state.error === "price"
              ? t.txErrPrice
              : state.error === "source"
                ? t.srErrSource
                : t.txErrGeneric}
        </p>
      )}

      <form action={action} className="space-y-3">
        <input type="hidden" name="marketItemId" value={marketItemId} />

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="valuation-price">
              {t.srPrice}
            </label>
            <input
              id="valuation-price"
              name="price"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="any"
              required
              defaultValue={existing?.price ?? ""}
              className="field tnum"
            />
          </div>
          <div>
            <label className="label" htmlFor="valuation-currency">
              {t.myCurrency}
            </label>
            <select
              id="valuation-currency"
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
          <label className="label" htmlFor="valuation-source">
            {t.srSource}
          </label>
          <input
            id="valuation-source"
            name="source"
            type="text"
            required
            maxLength={120}
            defaultValue={existing?.source ?? ""}
            placeholder={t.srSourcePlaceholder}
            aria-describedby="valuation-source-help"
            className="field"
          />
          <p id="valuation-source-help" className="mt-1 text-xs text-muted">
            {t.srSourceHelp}
          </p>
        </div>

        <div>
          <label className="label" htmlFor="valuation-as-of">
            {t.srAsOf}
          </label>
          <input
            id="valuation-as-of"
            name="asOf"
            type="date"
            required
            max={new Date().toISOString().slice(0, 10)}
            defaultValue={existing?.asOf ?? new Date().toISOString().slice(0, 10)}
            className="field"
          />
        </div>

        <p className="text-xs text-muted">{t.srPrivate}</p>

        <div className="flex gap-2">
          <button type="submit" disabled={pending} className="btn-primary flex-1">
            {pending ? t.loading : t.srSave}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
            {t.txCancel}
          </button>
        </div>
      </form>
    </div>
  );
}
