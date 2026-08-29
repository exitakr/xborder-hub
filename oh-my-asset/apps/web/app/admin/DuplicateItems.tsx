import type { getDict, Locale } from "@oma/core";
import { mergeItems, renameItem } from "./moderation-actions";

export interface DuplicateGroup {
  norm: string;
  category: string;
  ids: string[];
  names: string[];
  holders: number[];
  prices: (number | null)[];
  approved: boolean[];
}

/**
 * Catalogue rows that are the same thing spelled two ways.
 *
 * WHY THIS IS NOT AUTOMATIC
 *
 * The grouping is done on the name with case, spaces and punctuation removed,
 * which catches exactly the reported problem — "Bottega Veneta Cassette" beside
 * "bottega veneta cassette". It would be easy to merge those on sight and
 * wrong to: "Speedy 25" and "Speedy 30" differ by two characters and are two
 * different bags, and the case a machine cannot separate is precisely the case
 * a person can. So the queue proposes and a human decides.
 *
 * WHAT MERGING ACTUALLY BUYS
 *
 * Not tidiness. Three spellings mean three separate community price pools, each
 * sitting under the three-reporter threshold and therefore each publishing
 * nothing at all. Merged, they are one pool of six that clears it. The split
 * was quietly disabling the realised-price feature, and this is what turns it
 * back on.
 */
export function DuplicateItems({
  t,
  locale,
  groups,
}: {
  t: ReturnType<typeof getDict>;
  locale: Locale;
  groups: DuplicateGroup[];
}) {
  if (groups.length === 0) {
    return (
      <section className="card p-5">
        <h2 className="text-sm font-semibold">{t.adDupTitle}</h2>
        <p className="mt-2 text-sm text-muted">{t.adDupNone}</p>
      </section>
    );
  }

  return (
    <section className="card p-5">
      <h2 className="text-sm font-semibold">
        {t.adDupTitle} <span className="tnum text-muted">({groups.length})</span>
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-muted">{t.adDupLead}</p>

      <ul className="mt-4 space-y-4">
        {groups.map((g) => {
          // The row to keep, proposed rather than imposed: the one the most
          // people hold, because that is the one whose id is already in the
          // most portfolios and the one least disruptive to keep.
          const keepIndex = g.holders.reduce(
            (best, n, i) => (Number(n) > Number(g.holders[best]) ? i : best),
            0,
          );

          return (
            <li key={g.norm + g.category} className="rounded-lg border border-line p-3">
              <p className="text-xs text-muted">{g.category}</p>

              <ul className="mt-2 space-y-1.5">
                {g.names.map((name, i) => (
                  <li
                    key={g.ids[i]}
                    className="flex flex-wrap items-baseline justify-between gap-2 text-sm"
                  >
                    <span className="min-w-0">
                      <span className="break-all">{name}</span>
                      {i === keepIndex && (
                        <span className="ml-2 rounded bg-accent/15 px-1.5 py-0.5 text-[10px] text-accent">
                          {t.adDupKeep}
                        </span>
                      )}
                      {!g.approved[i] && (
                        <span className="ml-2 rounded bg-line px-1.5 py-0.5 text-[10px] text-muted">
                          {t.adDupUnapproved}
                        </span>
                      )}
                    </span>
                    <span className="tnum shrink-0 text-xs text-muted">
                      {t.adHolders} {Number(g.holders[i])}
                      {g.prices[i] !== null && ` · ${Number(g.prices[i]).toLocaleString()}`}
                    </span>
                  </li>
                ))}
              </ul>

              {/* One form per row to fold in, rather than a single "merge all":
                  a group of three is sometimes two duplicates and one genuinely
                  different item, and the destructive version of that mistake
                  cannot be undone. */}
              <div className="mt-3 space-y-2">
                {g.ids.map((id, i) =>
                  i === keepIndex ? null : (
                    <form key={id} action={mergeItems} className="flex flex-wrap gap-2">
                      <input type="hidden" name="from" value={id} />
                      <input type="hidden" name="into" value={g.ids[keepIndex]} />
                      <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">
                        {t.adDupMerge}: {g.names[i]} → {g.names[keepIndex]}
                      </button>
                    </form>
                  ),
                )}
              </div>

              {/* Renaming, because settling on one spelling is the other half
                  of the same job — and the old name is kept as an alias, so
                  whoever typed it still finds the row. */}
              <form action={renameItem} className="mt-3 flex flex-wrap gap-2">
                <input type="hidden" name="id" value={g.ids[keepIndex]} />
                <input
                  name="name"
                  defaultValue={g.names[keepIndex]}
                  aria-label={t.adDupRename}
                  className="field min-w-0 flex-1 text-sm"
                />
                <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">
                  {t.adDupRename}
                </button>
              </form>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
