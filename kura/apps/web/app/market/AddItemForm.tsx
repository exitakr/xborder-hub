"use client";

import { useActionState, useState } from "react";
import { CATEGORIES, CATEGORY_LABEL_KEY, type getDict } from "@kura/core";
import { createAndHoldItem, type NewItemState } from "./actions";

/**
 * Add a catalogue item the seed data does not have.
 *
 * Collapsed by default at the top of Browse, and also reachable from the
 * empty-results state with the search term pre-filled — the two entry points
 * share this one component rather than drifting into two forms.
 */
export function AddItemForm({
  t,
  defaultName = "",
  defaultCategory,
  open: openProp,
}: {
  t: ReturnType<typeof getDict>;
  defaultName?: string;
  defaultCategory?: (typeof CATEGORIES)[number];
  open?: boolean;
}) {
  const [state, action, pending] = useActionState<NewItemState, FormData>(createAndHoldItem, {});
  const [open, setOpen] = useState(Boolean(openProp));

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary w-full">
        {t.mkAddOwn}
      </button>
    );
  }

  return (
    <div className="card space-y-3 p-4">
      <div>
        <h2 className="text-sm font-semibold">{t.mkAddOwnTitle}</h2>
        <p className="mt-1 text-xs text-muted">{t.mkAddOwnLead}</p>
      </div>

      {state.error && (
        <p role="alert" className="rounded-lg bg-loss/5 px-3 py-2 text-sm text-loss">
          {state.error === "name" ? t.mkAddOwnErrName : t.txErrGeneric}
        </p>
      )}

      <form action={action} className="space-y-3">
        <div>
          <label className="label" htmlFor="new-item-category">
            {t.mkCategory}
          </label>
          <select
            id="new-item-category"
            name="category"
            defaultValue={defaultCategory ?? "watch"}
            className="field"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t[CATEGORY_LABEL_KEY[c]]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="new-item-name">
            {t.mkAddOwnName}
          </label>
          <input
            id="new-item-name"
            name="name"
            type="text"
            required
            maxLength={120}
            defaultValue={defaultName}
            className="field"
          />
        </div>

        <div>
          <label className="label" htmlFor="new-item-detail">
            {t.mkAddOwnDetail}
          </label>
          <input
            id="new-item-detail"
            name="detail"
            type="text"
            maxLength={200}
            placeholder={t.mkAddOwnDetailPlaceholder}
            className="field"
          />
        </div>

        <div>
          <label className="label" htmlFor="new-item-identifier">
            {t.mkAddOwnIdentifier}
          </label>
          <input
            id="new-item-identifier"
            name="identifier"
            type="text"
            maxLength={80}
            className="field"
          />
        </div>

        <p className="text-xs text-muted">{t.mkAddOwnNote}</p>

        <div className="flex gap-2">
          <button type="submit" disabled={pending} className="btn-primary flex-1">
            {pending ? t.loading : t.mkAddOwnSubmit}
          </button>
          {!openProp && (
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
              {t.txCancel}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
