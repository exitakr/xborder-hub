"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { getDict, Locale } from "@/lib/i18n/dict";
import { formatMoney } from "@/lib/money";
import type { TransactionRow } from "@/lib/types";
import { deleteTransaction } from "./actions";
import { TxFields, type EditingTx } from "./TransactionForm";

/**
 * Transaction history with inline edit and delete (SPEC §6.3).
 * Rendered on the client because editing swaps a row for a form in place, which
 * keeps the user's position in the list instead of navigating away.
 */
export function TransactionList({
  t,
  locale,
  marketItemId,
  transactions,
}: {
  t: ReturnType<typeof getDict>;
  locale: Locale;
  marketItemId: string;
  transactions: TransactionRow[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);

  if (transactions.length === 0) {
    return <p className="card p-4 text-sm text-muted">{t.itNoTransactions}</p>;
  }

  return (
    <ul className="space-y-2">
      {transactions.map((tx) => {
        if (editing === tx.id) {
          const editingTx: EditingTx = {
            id: tx.id,
            type: tx.type,
            tradedOn: tx.traded_on,
            quantity: tx.quantity,
            unitPrice: tx.unit_price,
            currency: tx.currency,
          };

          return (
            <li key={tx.id}>
              <TxFields
                t={t}
                holdingId={tx.holding_id}
                type={tx.type}
                defaultCurrency={tx.currency}
                editing={editingTx}
                onDone={() => setEditing(null)}
              />
            </li>
          );
        }

        return (
          <li key={tx.id} className="card flex items-center gap-3 p-3">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${
                tx.type === "buy" ? "bg-buy" : "bg-sell"
              }`}
              aria-hidden="true"
            >
              {tx.type === "buy" ? "B" : "S"}
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {tx.type === "buy" ? t.txBuy : t.txSell}
                <span className="sr-only">, </span>
                <span className="tnum ml-2 font-normal text-muted">×{tx.quantity}</span>
              </p>
              <p className="tnum text-xs text-muted">
                {tx.traded_on} · {formatMoney(tx.unit_price, tx.currency, locale)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setEditing(tx.id)}
              className="rounded px-2 py-1 text-xs text-muted hover:text-ink"
            >
              {t.txEdit}
            </button>

            <form
              action={async (formData) => {
                if (!window.confirm(t.txDeleteConfirm)) return;
                await deleteTransaction(formData);
                router.refresh();
              }}
            >
              <input type="hidden" name="transactionId" value={tx.id} />
              <input type="hidden" name="marketItemId" value={marketItemId} />
              <button
                type="submit"
                className="rounded px-2 py-1 text-xs text-muted hover:text-loss"
              >
                {t.txDelete}
              </button>
            </form>
          </li>
        );
      })}
    </ul>
  );
}
