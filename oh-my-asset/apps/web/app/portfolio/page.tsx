import Link from "next/link";
import type { Metadata } from "next";
import { getDict } from "@oma/core";
import { requireProfile, signedPhotoUrl } from "@/lib/profile";
import { loadPortfolio, loadPortfolioSeries, loadPortfolioTrades } from "@oma/core";
import { PortfolioChart } from "./PortfolioChart";
import { createClient } from "@/lib/supabase/server";
import { fill, formatMoney, formatPercent } from "@oma/core";
import { CATEGORY_LABEL_KEY } from "@oma/core";
import { HoldingPhoto } from "@/components/HoldingPhoto";
import { Sparkline } from "@/components/Sparkline";
import { CategoryGlyph } from "@/components/CategoryGlyph";
import { InfoTip } from "@/components/InfoTip";
import { LevelBadge } from "@/components/LevelBadge";

export const metadata: Metadata = { title: "Portfolio" };

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const profile = await requireProfile();
  // Layout in the URL rather than in state: it survives a reload, it can be
  // bookmarked, and it works with JavaScript off — all of which a client-side
  // toggle on a server-rendered list would give up for nothing.
  const { view: viewParam } = await searchParams;
  const gallery = viewParam === "grid";
  const t = getDict(profile.locale);
  const supabase = await createClient();
  const [view, series, trades, levelRes] = await Promise.all([
    loadPortfolio(supabase, profile.userId, profile.currency),
    loadPortfolioSeries(supabase, profile.userId, profile.currency),
    loadPortfolioTrades(supabase, profile.userId, profile.currency),
    // Migration 0025. Absent on a database that has not run it yet, in which
    // case the badge is simply not rendered rather than the page failing.
    supabase.rpc("my_level_metrics"),
  ]);

  const levelMetrics = (Array.isArray(levelRes.data) ? levelRes.data[0] : null) as {
    items_ever: number;
    value_jpy: number;
    level_peak: number;
  } | null;

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

      {/* Above the total, deliberately.
          
          The total is the number that moves for reasons its owner did not
          choose, and on a flat day it gives them nothing. The level only ever
          moves when they do something, so it is what makes the app worth
          opening on a day the market did nothing. */}
      {levelMetrics && (
        <LevelBadge
          locale={profile.locale}
          items={Number(levelMetrics.items_ever)}
          valueJpy={Number(levelMetrics.value_jpy)}
          peak={Number(levelMetrics.level_peak)}
        />
      )}

      {/*
        One card, not two.
        
        This is the screen people screenshot, and a total sitting in one box
        above a chart in another reads as two facts that happen to be adjacent
        rather than as one statement about a portfolio. Order follows what the
        eye should take first: the number, its move, the shape of that move,
        then the supporting figures, then the caveats — which belong at the
        bottom because they qualify the number rather than compete with it.
      */}
      <section className="card p-5 sm:p-6">
        <p className="text-sm text-muted">{t.pfTotalValue}</p>
        <p className="tnum mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">
          {formatMoney(totals.totalValue, view.currency, profile.locale)}
        </p>
        <p className={`tnum mt-1.5 text-base font-medium ${plTone}`}>
          {formatMoney(totals.unrealized, view.currency, profile.locale)} (
          {formatPercent(totals.unrealizedPct, profile.locale)})
        </p>

        <div className="mt-5">
          <PortfolioChart
            points={series}
            trades={trades}
            currency={view.currency}
            locale={profile.locale}
            emptyLabel={t.pfValueChartEmpty}
            rangeLabels={{
              "1w": t.pfRange1w,
              "1m": t.pfRange1m,
              ytd: t.pfRangeYtd,
              all: t.pfRangeAll,
            }}
          />
        </div>

        <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-line pt-4">
          <Stat label={t.pfCost}>
            {formatMoney(totals.totalCost, view.currency, profile.locale)}
          </Stat>
          <Stat label={t.pfRealized} tone={toneFor(totals.realized)}>
            {formatMoney(totals.realized, view.currency, profile.locale)}
          </Stat>
          <Stat label={t.myItemCount}>{view.holdings.length}</Stat>
        </dl>

        {/*
          * The caveats, behind an "i".
          *
          * The total is one number built from more than one kind of evidence,
          * and saying so beside the number rather than in a footer nobody reads
          * is what makes it a disclosure rather than a caveat. But at full
          * length it was four lines of grey text under the figure the screen
          * exists to show, competing with it and losing. A labelled control
          * keeps the admission one tap from the number without burying the
          * number underneath it.
          */}
        {(totals.excludedCount > 0 || view.selfReportedCount > 0) && (
          <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-muted">
            <span>{t.pfNotesShort}</span>
            <InfoTip label={t.pfNotesLabel}>
              <span className="block space-y-2">
                {totals.excludedCount > 0 && <span className="block">{t.pfExcluded}</span>}
                {view.selfReportedCount > 0 && (
                  <span className="block">
                    {fill(t.srPortfolioNotice, { count: view.selfReportedCount })}
                  </span>
                )}
              </span>
            </InfoTip>
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
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">{t.pfHoldings}</h2>

          <div className="flex gap-1" role="group" aria-label={t.pfViewLabel}>
            <LayoutLink href="/portfolio" active={!gallery}>
              {t.pfViewList}
            </LayoutLink>
            <LayoutLink href="/portfolio?view=grid" active={gallery}>
              {t.pfViewGrid}
            </LayoutLink>
          </div>
        </div>

        {gallery ? (
          /* Bigger pictures, fewer words. For a collection this is the view
             that reads as a collection rather than as a spreadsheet — and with
             card artwork now stored, it is finally worth having. */
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {view.holdings.map((h, i) => (
              <li key={h.holdingId}>
                <Link
                  href={`/items/${h.item.id}`}
                  className="card flex h-full flex-col gap-2 p-2.5 transition-colors hover:bg-canvas"
                >
                  <HoldingPhoto
                    signedUrl={photos[i]}
                    artUrl={h.item.image_url}
                    category={h.item.category}
                    alt={h.item.name}
                    size="tile"
                  />

                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{h.item.name}</p>
                    <p className="tnum truncate text-[11px] text-muted">
                      ×{h.summary.quantity}
                    </p>
                  </div>

                  <div className="mt-auto">
                    <p className="tnum text-sm font-semibold">
                      {formatMoney(h.summary.marketValue, view.currency, profile.locale)}
                    </p>
                    <p className={`tnum text-[11px] ${toneFor(h.summary.unrealized)}`}>
                      {h.summary.unrealizedPct === null
                        ? t.mkNoPrice
                        : formatPercent(h.summary.unrealizedPct, profile.locale)}
                      {h.selfReported && (
                        <span className="ml-1 text-muted">
                          {t.srBadge} · {formatDay(h.selfReported.asOf, profile.locale)}
                        </span>
                      )}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
        <ul className="space-y-2">
          {view.holdings.map((h, i) => (
            <li key={h.holdingId}>
              <Link
                href={`/items/${h.item.id}`}
                className="card flex items-center gap-3 p-3 transition-colors hover:bg-canvas"
              >
                <HoldingPhoto
                  signedUrl={photos[i]}
                  artUrl={h.item.image_url}
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
                      holdings rather than leaving the reader to guess which —
                      and dated, because a self-reported figure is only as good
                      as the day it was checked, and that day is the one fact
                      that tells the reader whether to trust it. */}
                  {h.selfReported && (
                    <p className="tnum text-[10px] text-muted">
                      {t.srBadge} · {formatDay(h.selfReported.asOf, profile.locale)}
                    </p>
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
        )}

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

/** Segmented control for the holdings layout. */
function LayoutLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
        active ? "bg-accent text-white" : "text-muted hover:bg-canvas hover:text-ink"
      }`}
    >
      {children}
    </Link>
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

/**
 * A stored `YYYY-MM-DD` in the reader's conventions. Noon UTC so a timezone
 * west of the line cannot shift the calendar day backwards.
 */
function formatDay(day: string, locale: "ja" | "en"): string {
  const parsed = new Date(`${day}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return day;
  return new Intl.DateTimeFormat(locale === "ja" ? "ja-JP" : "en-SG", {
    month: "short",
    day: "numeric",
  }).format(parsed);
}
