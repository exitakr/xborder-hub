"use client";

import { useState } from "react";
import { formatMoney, getDict, isCurrency } from "@oma/core";
import type { Locale } from "@oma/core";

type Dict = ReturnType<typeof getDict>;

/**
 * One row's account of how its price was reached.
 *
 * Every field is either something we sent or something we computed from what
 * came back. Nothing here is inferred, so a row that says `returned: 84,
 * used: 3` is stating a fact about the response rather than a guess about it.
 */
export interface PriceDebug {
  source?: string;
  /** eBay: the text sent as `q`. Rakuten: the keyword. */
  query?: string;
  keyword?: string;
  ngKeyword?: string;
  apiUrl?: string;
  webUrl?: string;
  categoryId?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  returned?: number;
  used?: number;
  low?: number | null;
  high?: number | null;
  outcome?: "published" | "below_floor" | "above_ceiling" | "collapsed" | "no_result";
  median?: number | null;
  medianCurrency?: string | null;
  sampleSize?: number | null;
  spread?: number | null;
  floor?: number | null;
  ceiling?: number | null;
  floorCurrency?: string | null;
  previousPrice?: number | null;
  checkedAt?: string;
}

export interface PriceAuditRow {
  id: string;
  name: string;
  category: string;
  source_type: string | null;
  search_query: string | null;
  current_price: number | null;
  currency: string | null;
  min_price: number | null;
  max_price: number | null;
  data_confidence: string | null;
  price_updated_at: string | null;
  price_debug: PriceDebug | null;
  holders: number;
}

/**
 * Why a price is what it is.
 *
 * This panel exists because of one report: a BMW priced around ¥10,000, with
 * no way to see what eBay had been asked. That is two problems, and the second
 * is the worse one — a number nobody can check is a number nobody can correct,
 * so a wrong price stays wrong until a user happens to complain.
 *
 * What it shows, per item: the exact query including every exclusion term, the
 * eBay category the search was confined to, the floor that was pushed into the
 * request, how many listings came back, how many survived, the range the median
 * was taken over, and what was decided. The link opens the same search on the
 * source's own website — which is the step that turns "this looks wrong" into
 * "this is wrong, and here is the die-cast model that caused it".
 */
export function PriceAudit({
  t,
  locale,
  rows,
}: {
  t: Dict;
  locale: Locale;
  rows: PriceAuditRow[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <section className="card p-5">
        <h2 className="text-sm font-semibold">{t.adAuditTitle}</h2>
        <p className="mt-2 text-sm text-muted">{t.adAuditEmpty}</p>
      </section>
    );
  }

  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">{t.adAuditTitle}</h2>
        <span className="text-xs text-muted">{rows.length}</span>
      </div>
      <p className="mt-1 text-sm text-muted">{t.adAuditLead}</p>

      <ul className="mt-4 divide-y divide-line">
        {rows.map((row) => {
          const d = row.price_debug;
          const open = openId === row.id;
          return (
            <li key={row.id} className="py-3">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : row.id)}
                aria-expanded={open}
                className="flex w-full items-start justify-between gap-3 text-left"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{row.name}</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {row.source_type} · {row.category}
                    {row.holders > 0 && ` · ${row.holders}${t.adAuditHolders}`}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="tnum block text-sm">
                    {fmt(row.current_price, row.currency, locale, t.mkNoPrice)}
                  </span>
                  <Outcome t={t} outcome={d?.outcome} />
                </span>
              </button>

              {open && (
                <div className="mt-3 space-y-3 rounded-lg bg-canvas p-3 text-xs">
                  {!d ? (
                    <p className="text-muted">{t.adAuditNoRecord}</p>
                  ) : (
                    <>
                      {/* The link first: it is the only element here that lets
                          someone judge the answer rather than read about it. */}
                      {d.webUrl && (
                        <a
                          href={d.webUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="btn-secondary inline-flex text-xs"
                        >
                          {t.adAuditOpenSearch} ↗
                        </a>
                      )}

                      <Field label={t.adAuditQuery}>
                        <code className="block break-all">{d.query ?? d.keyword ?? "—"}</code>
                      </Field>

                      {d.ngKeyword && (
                        <Field label={t.adAuditExcluded}>
                          <code className="block break-all">{d.ngKeyword}</code>
                        </Field>
                      )}

                      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                        <Stat label={t.adAuditCategoryId} value={d.categoryId ?? "—"} />
                        <Stat
                          label={t.adAuditFloor}
                          value={fmt(d.floor, d.floorCurrency ?? row.currency, locale)}
                        />
                        <Stat
                          label={t.adAuditCeiling}
                          value={fmt(d.ceiling, d.floorCurrency ?? row.currency, locale)}
                        />
                        <Stat label={t.adAuditReturned} value={d.returned ?? "—"} />
                        <Stat label={t.adAuditUsed} value={d.used ?? "—"} />
                        <Stat label={t.adAuditSample} value={d.sampleSize ?? "—"} />
                        <Stat
                          label={t.adAuditSpread}
                          value={d.spread == null ? "—" : `${(Number(d.spread) * 100).toFixed(0)}%`}
                        />
                        <Stat
                          label={t.adAuditRange}
                          value={
                            d.low == null || d.high == null
                              ? "—"
                              : `${fmt(d.low, d.medianCurrency ?? row.currency, locale)} – ${fmt(
                                  d.high,
                                  d.medianCurrency ?? row.currency,
                                  locale,
                                )}`
                          }
                        />
                        <Stat
                          label={t.adAuditMedian}
                          value={fmt(d.median, d.medianCurrency ?? row.currency, locale)}
                        />
                        <Stat
                          label={t.adAuditPrevious}
                          value={fmt(d.previousPrice, row.currency, locale)}
                        />
                      </dl>

                      {/* Last, and in a smaller voice: it is the authoritative
                          record but nobody reads it first. */}
                      {d.apiUrl && (
                        <Field label={t.adAuditApiUrl}>
                          <code className="block break-all text-muted">{d.apiUrl}</code>
                        </Field>
                      )}
                    </>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * A figure with its currency, or a dash.
 *
 * `currency` arrives as a plain string from a jsonb column, so it is checked
 * rather than asserted: a row written by an older build, or by hand, must
 * render as "—" instead of throwing inside the formatter and taking the whole
 * admin page down with it.
 */
function fmt(
  v: number | null | undefined,
  currency: string | null | undefined,
  locale: Locale,
  fallback = "—",
) {
  if (v == null || !isCurrency(currency)) return fallback;
  return formatMoney(Number(v), currency, locale);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted">{label}</dt>
      <dd className="tnum mt-0.5">{value}</dd>
    </div>
  );
}

/**
 * What the run decided.
 *
 * Coloured, because the three failures mean different things and call for
 * different responses: a refused price wants the floor or the query checked, an
 * empty result wants the query widened, and a collapse wants a look at whether
 * the item changed rather than the market.
 */
function Outcome({ t, outcome }: { t: Dict; outcome?: PriceDebug["outcome"] }) {
  if (!outcome) return null;
  const label = {
    published: t.adAuditPublished,
    below_floor: t.adAuditBelowFloor,
    above_ceiling: t.adAuditAboveCeiling,
    collapsed: t.adAuditCollapsed,
    no_result: t.adAuditNoResult,
  }[outcome];
  const tone = outcome === "published" ? "text-gain" : "text-loss";
  return <span className={`mt-0.5 block text-[11px] ${tone}`}>{label}</span>;
}
