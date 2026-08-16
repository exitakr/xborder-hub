import { CATEGORIES, CATEGORY_LABEL_KEY, type getDict, type Locale } from "@oma/core";
import { approveItem, rejectItem } from "./moderation-actions";

export interface PendingItem {
  id: string;
  category: string;
  name: string;
  detail: string | null;
  identifier: string | null;
  search_query: string | null;
  source_type: string | null;
  aliases: string | null;
  min_price: number | null;
  holders: number;
  current_price: number | null;
  currency: string | null;
  created_at: string;
}

/**
 * The review queue for user-added catalogue entries.
 *
 * Every field is editable in place, and approving submits the edits with it.
 * That is the whole point: the reason a row is here is almost always that it is
 * named "rolex" or "腕時計" rather than something a price source could match,
 * and a workflow that approved first and tidied later would publish the untidy
 * version. Fixing and publishing are one button.
 *
 * The holder count is shown because it decides the easy cases without thought:
 * an entry several people are already tracking is one worth having.
 */
export function PendingItems({
  t,
  locale,
  items,
}: {
  t: ReturnType<typeof getDict>;
  locale: Locale;
  items: PendingItem[];
}) {
  return (
    <section className="card p-5">
      <h2 className="text-sm font-semibold">
        {t.adPending} <span className="tnum text-muted">({items.length})</span>
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-muted">{t.adPendingLead}</p>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{t.adPendingNone}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-lg border border-line p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-muted">
                <span>
                  {t.adAddedBy}{" "}
                  {new Date(item.created_at).toLocaleDateString(
                    locale === "ja" ? "ja-JP" : "en-SG",
                  )}
                </span>
                <span className="tnum">
                  {/* The fetched price, in the queue, because an implausible one
                      is the clearest signal that the search query is wrong —
                      and this is the last moment to fix it before the number
                      reaches everybody. */}
                  {item.current_price !== null && (
                    <span className={item.min_price !== null && Number(item.current_price) < Number(item.min_price) ? "mr-3 text-loss" : "mr-3"}>
                      {t.adCurrentPrice} {Number(item.current_price).toLocaleString()}{" "}
                      {item.currency ?? ""}
                    </span>
                  )}
                  {t.adHolders} {Number(item.holders)}
                </span>
              </div>

              <form action={approveItem} className="mt-2 space-y-2">
                <input type="hidden" name="id" value={item.id} />

                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="block">
                    <span className="sr-only">{t.mkAddOwnName}</span>
                    <input
                      name="name"
                      defaultValue={item.name}
                      placeholder={t.mkAddOwnName}
                      className="field text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="sr-only">{t.mkCategory}</span>
                    <select name="category" defaultValue={item.category} className="field text-sm">
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {t[CATEGORY_LABEL_KEY[c]]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="sr-only">{t.mkAddOwnDetail}</span>
                    <input
                      name="detail"
                      defaultValue={item.detail ?? ""}
                      placeholder={t.mkAddOwnDetail}
                      className="field text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="sr-only">{t.mkAddOwnIdentifier}</span>
                    <input
                      name="identifier"
                      defaultValue={item.identifier ?? ""}
                      placeholder={t.mkAddOwnIdentifier}
                      className="field text-sm"
                    />
                  </label>
                </div>

                {/* The field that decides whether this row will ever have a
                    price. Editable here because tightening it is usually the
                    whole job. */}
                <label className="block">
                  <span className="sr-only">{t.adSearchQuery}</span>
                  <input
                    name="search_query"
                    defaultValue={item.search_query ?? ""}
                    placeholder={`${t.adSearchQuery} · ${item.source_type ?? "—"}`}
                    className="field font-mono text-xs"
                  />
                </label>

                <div className="grid gap-2 sm:grid-cols-2">
                  {/* Prefilled by the brand rules (migration 0020) where the
                      brand is known. Editable because the queue exists for the
                      brands that are not. */}
                  <label className="block">
                    <span className="sr-only">{t.adAliases}</span>
                    <input
                      name="aliases"
                      defaultValue={item.aliases ?? ""}
                      placeholder={t.adAliases}
                      className="field text-xs"
                    />
                  </label>
                  <label className="block">
                    <span className="sr-only">{t.adMinPrice}</span>
                    <input
                      name="min_price"
                      type="number"
                      min="0"
                      step="any"
                      defaultValue={item.min_price ?? ""}
                      placeholder={`${t.adMinPrice} (${item.currency ?? "JPY"})`}
                      className="field tnum text-xs"
                    />
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button type="submit" className="btn-primary px-3 py-1.5 text-xs">
                    {t.adApprove}
                  </button>
                  <button
                    type="submit"
                    formAction={rejectItem}
                    className="btn-secondary px-3 py-1.5 text-xs"
                  >
                    {t.adReject}
                  </button>
                </div>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
