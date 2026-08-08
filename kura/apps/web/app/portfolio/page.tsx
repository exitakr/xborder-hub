import Link from "next/link";
import type { Metadata } from "next";
import { getDict } from "@kura/core";
import { requireProfile, signedPhotoUrl } from "@/lib/profile";
import { loadPortfolio } from "@kura/core";
import { createClient } from "@/lib/supabase/server";
import { fill, formatMoney, formatPercent } from "@kura/core";
import { CATEGORY_LABEL_KEY } from "@kura/core";
import { HoldingPhoto } from "@/components/HoldingPhoto";
import { Sparkline } from "@/components/Sparkline";
import { CategoryGlyph } from "@/components/CategoryGlyph";

export const metadata: Metadata = { title: "Portfolio" };

export default async function PortfolioPage() {
  const profile = await requireProfile();
  const t = getDict(profile.locale);
  const view = await loadPortfolio(await createClient(), profile.userId, profile.currency);

  const photos = await Promise.all(
    view.holdings.map((h) => signedPhotoUrl(h.photoPath)),
  );

  if (view.holdings.length === 0 && view.totals.realized === 0) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-xl font-semibold">{t.pfEmptyTitle}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t.pfEmptyBody}</p>
        <Link href="/market" className="btn-primary mt-6">
          {t.pfEmptyCta}
        </Link>
      </div>
    );
  }

  const { totals } = view;
  const plTone = toneFor(totals.unrealized);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t.pfTitle}</h1>

      {/* Headline figures. Total value first — it is the reason to open the app. */}
      <section className="card p-5">
        <p className="text-sm text-muted">{t.pfTotalValue}</p>
        <p className="tnum mt-1 text-3xl font-semibold">
          {formatMoney(totals.totalValue, view.currency, profile.locale)}
        </p>
        <p className={`tnum mt-1 text-sm font-medium ${plTone}`}>
          {formatMoney(totals.unrealized, view.currency, profile.locale)} (
          {formatPercent(totals.unrealizedPct, profile.locale)})
        </p>

        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-3">
          <Stat label={t.pfCost}>
            {formatMoney(totals.totalCost, view.currency, profile.locale)}
          </Stat>
          <Stat label={t.pfRealized} tone={toneFor(totals.realized)}>
            {formatMoney(totals.realized, view.currency, profile.locale)}
          </Stat>
          <Stat label={t.myItemCount}>{view.holdings.length}</Stat>
        </dl>

        {(totals.excludedCount > 0 || view.selfReportedCount > 0) && (
          <div className="mt-4 space-y-1.5 border-t border-line pt-3 text-xs text-muted">
            {totals.excludedCount > 0 && <p>{t.pfExcluded}</p>}
            {/* The total is one number built from more than one kind of evidence.
                Saying so where the number is, rather than in a footer nobody
                reads, is the difference between a caveat and a disclosure. */}
            {view.selfReportedCount > 0 && (
              <p>{fill(t.srPortfolioNotice, { count: view.selfReportedCount })}</p>
            )}
          </div>
        )}
      </section>

      {view.byCategory.length > 0 && (
        <section className="card p-5">
          <h2 className="text-sm font-semibold">{t.pfBreakdown}</h2>

          <div
            className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-canvas"
            role="img"
            aria-label={view.byCategory
              .map((c) => `${t[CATEGORY_LABEL_KEY[c.category]]} ${c.share.toFixed(0)}%`)
              .join(", ")}
          >
            {view.byCategory.map((c, i) => (
              <span
                key={c.category}
                style={{ width: `${c.share}%`, background: BAR_COLORS[i % BAR_COLORS.length] }}
              />
            ))}
          </div>

          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {view.byCategory.map((c, i) => (
              <li key={c.category} className="flex items-center gap-1.5 text-xs text-muted">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: BAR_COLORS[i % BAR_COLORS.length] }}
                  aria-hidden="true"
                />
                {t[CATEGORY_LABEL_KEY[c.category]]}
                <span className="tnum">{c.share.toFixed(0)}%</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold">{t.pfHoldings}</h2>

        <ul className="space-y-2">
          {view.holdings.map((h, i) => (
            <li key={h.holdingId}>
              <Link
                href={`/items/${h.item.id}`}
                className="card flex items-center gap-3 p-3 transition-colors hover:bg-canvas"
              >
                <HoldingPhoto
                  signedUrl={photos[i]}
                  category={h.item.category}
                  alt={h.item.name}
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{h.item.name}</p>
                  <p className="truncate text-xs text-muted">
                    {h.item.detail ?? t[CATEGORY_LABEL_KEY[h.item.category]]} ·{" "}
                    <span className="tnum">×{h.summary.quantity}</span>
                  </p>
                </div>

                <Sparkline values={h.spark} className="hidden sm:block" />

                <div className="shrink-0 text-right">
                  <p className="tnum text-sm font-medium">
                    {formatMoney(h.summary.marketValue, view.currency, profile.locale)}
                  </p>
                  {/* Marked per row so the notice above resolves to specific
                      holdings rather than leaving the reader to guess which. */}
                  {h.selfReported && (
                    <p className="text-[10px] text-muted">{t.srBadge}</p>
                  )}
                  <p className={`tnum text-xs ${toneFor(h.summary.unrealized)}`}>
                    {h.summary.unrealizedPct === null
                      ? t.mkNoPrice
                      : formatPercent(h.summary.unrealizedPct, profile.locale)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/market"
          className="card mt-2 flex items-center justify-center gap-2 p-3 text-sm text-muted transition-colors hover:bg-canvas hover:text-ink"
        >
          <CategoryGlyph category="tcg" className="h-4 w-4" />
          {t.pfEmptyCta}
        </Link>
      </section>
    </div>
  );
}

const BAR_COLORS = ["#1F6FEB", "#0E9F6E", "#F59E0B", "#6B4F8E", "#E02424"];

function toneFor(value: number | null): string {
  if (value === null || value === 0) return "text-muted";
  return value > 0 ? "text-gain" : "text-loss";
}

function Stat({
  label,
  tone = "",
  children,
}: {
  label: string;
  tone?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={`tnum mt-0.5 text-sm font-medium ${tone}`}>{children}</dd>
    </div>
  );
}
