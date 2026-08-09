"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import type { getDict } from "@oma/core";
import { CURRENCIES, formatMoney, type Currency } from "@oma/core";
import type { Locale } from "@oma/core";
import type { MarketItem } from "@oma/core";
import { setCuratedPrice, type CurationState } from "./actions";

export function CurationRow({
  t,
  locale,
  item,
}: {
  t: ReturnType<typeof getDict>;
  locale: Locale;
  item: MarketItem;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<CurationState, FormData>(
    setCuratedPrice,
    {},
  );

  return (
    <li className="card p-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="text-sm font-medium">{item.name}</p>
        <p className="text-xs text-muted">{item.detail}</p>
        <p className="tnum ml-auto text-xs text-muted">
          {item.current_price === null
            ? t.mkNoPrice
            : formatMoney(item.current_price, item.currency as Currency, locale)}
          {item.price_updated_at &&
            ` · ${new Date(item.price_updated_at).toLocaleDateString(
              locale === "ja" ? "ja-JP" : "en-SG",
            )}`}
        </p>
      </div>

      <form
        action={async (formData) => {
          await action(formData);
          router.refresh();
        }}
        className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_2fr_auto]"
      >
        <input type="hidden" name="marketItemId" value={item.id} />

        <input
          name="price"
          type="number"
          inputMode="decimal"
          required
          min={0.01}
          step="any"
          placeholder={t.adPrice}
          aria-label={`${t.adPrice} — ${item.name}`}
          className="field tnum"
        />

        <select
          name="currency"
          defaultValue={item.currency}
          aria-label={`${t.myCurrency} — ${item.name}`}
          className="field"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <input
          name="sourceUrl"
          type="url"
          required
          placeholder={t.adSourceUrl}
          aria-label={`${t.adSourceUrl} — ${item.name}`}
          defaultValue={item.source_url ?? ""}
          className="field"
        />

        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? t.loading : t.adSave}
        </button>
      </form>

      {state.ok && (
        <p role="status" className="mt-2 text-xs text-gain">
          {t.mySaved}
        </p>
      )}
      {state.error && (
        <p role="alert" className="mt-2 text-xs text-loss">
          {t.txErrGeneric}
        </p>
      )}
    </li>
  );
}
