"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { getDict } from "@oma/core";
import { CURRENCIES, type Currency } from "@oma/core";
import { saveTransaction, type TxState } from "./actions";

type Dict = ReturnType<typeof getDict>;

export interface EditingTx {
  id: string;
  type: "buy" | "sell";
  tradedOn: string;
  quantity: number;
  unitPrice: number;
  currency: Currency;
}

interface Props {
  t: Dict;
  holdingId: string;
  defaultCurrency: Currency;
  /** Hides the sell button when there is nothing to sell. */
  canSell: boolean;
}

export function TransactionForm({ t, holdingId, defaultCurrency, canSell }: Props) {
  const [open, setOpen] = useState<"buy" | "sell" | null>(null);
  const [editing, setEditing] = useState<EditingTx | null>(null);

  if (!open) {
    return (
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen("buy")} className="btn-primary flex-1">
          {t.itRecordBuy}
        </button>
        {canSell && (
          <button type="button" onClick={() => setOpen("sell")} className="btn-secondary flex-1">
            {t.itRecordSell}
          </button>
        )}
      </div>
    );
  }

  return (
    <TxFields
      t={t}
      holdingId={holdingId}
      type={open}
      defaultCurrency={defaultCurrency}
      editing={editing}
      onDone={() => {
        setOpen(null);
        setEditing(null);
      }}
    />
  );
}

export function TxFields({
  t,
  holdingId,
  type,
  defaultCurrency,
  editing,
  onDone,
}: {
  t: Dict;
  holdingId: string;
  type: "buy" | "sell";
  defaultCurrency: Currency;
  editing: EditingTx | null;
  onDone: () => void;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<TxState, FormData>(saveTransaction, {});
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move focus into the form when it opens so keyboard users are not stranded
  // at the button they just pressed.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (state.ok) {
      router.refresh();
      onDone();
    }
  }, [state.ok, router, onDone]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="card space-y-4 p-4">
      <h3 ref={headingRef} tabIndex={-1} className="text-sm font-semibold">
        {type === "buy" ? t.itRecordBuy : t.itRecordSell}
      </h3>

      <input type="hidden" name="holdingId" value={holdingId} />
      <input type="hidden" name="type" value={type} />
      {editing && <input type="hidden" name="transactionId" value={editing.id} />}

      {state.error && (
        <p role="alert" className="rounded-lg bg-loss/5 px-3 py-2 text-sm text-loss">
          {errorMessage(t, state.error)}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="tradedOn">
            {t.txDate}
          </label>
          <input
            id="tradedOn"
            name="tradedOn"
            type="date"
            required
            max={today}
            defaultValue={editing?.tradedOn ?? today}
            className="field"
          />
        </div>

        <div>
          <label className="label" htmlFor="quantity">
            {t.txQty}
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            inputMode="numeric"
            required
            min={1}
            step={1}
            defaultValue={editing?.quantity ?? 1}
            className="field tnum"
          />
        </div>

        <div>
          <label className="label" htmlFor="unitPrice">
            {t.txUnitPrice}
          </label>
          <input
            id="unitPrice"
            name="unitPrice"
            type="number"
            inputMode="decimal"
            required
            min={0.01}
            step="any"
            defaultValue={editing?.unitPrice ?? ""}
            className="field tnum"
          />
        </div>

        <div>
          <label className="label" htmlFor="currency">
            {t.myCurrency}
          </label>
          <select
            id="currency"
            name="currency"
            defaultValue={editing?.currency ?? defaultCurrency}
            className="field"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn-primary flex-1">
          {pending ? t.loading : t.txSave}
        </button>
        <button type="button" onClick={onDone} className="btn-secondary">
          {t.txCancel}
        </button>
      </div>
    </form>
  );
}

function errorMessage(t: Dict, error: NonNullable<TxState["error"]>): string {
  switch (error) {
    case "future_date":
      return t.txErrFuture;
    case "quantity":
      return t.txErrQty;
    case "price":
      return t.txErrPrice;
    case "oversell":
      return t.txErrOversell;
    default:
      return t.txErrGeneric;
  }
}
