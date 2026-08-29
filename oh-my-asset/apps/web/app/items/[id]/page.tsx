import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { brand, getDict } from "@oma/core";
import { optionalProfile, signedPhotoUrl } from "@/lib/profile";
import { getLocale } from "@/lib/i18n-server";
import { site } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { loadItemDetail } from "@oma/core";
import { formatMoney, formatPercent } from "@oma/core";
import { CATEGORY_LABEL_KEY, sourceLabel, type MarketItem } from "@oma/core";
import { HoldingPhoto } from "@/components/HoldingPhoto";
import { PriceChart, type ChartPoint, type TradeMarker } from "./PriceChart";
import { TransactionForm } from "./TransactionForm";
import { PhotoUploader } from "./PhotoUploader";
import { TransactionList } from "./TransactionList";
import { PriceReportForm } from "./PriceReportForm";
import { ValuationForm } from "./ValuationForm";
import { SubmitButton } from "@/components/SubmitButton";
import { JsonLd } from "@/components/JsonLd";
import { addHolding, removeHolding } from "../../market/actions";
import { communityConfidence, fill } from "@oma/core";

/**
 * Per-item metadata, which is the point of these pages being public.
 *
 * A catalogue entry indexed under the model number someone is searching for is
 * how a person who owns that thing finds a tool for tracking it. A single
 * static "Item" title made all 80-odd pages identical to a crawler, so none of
 * them ranked for anything.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const locale = await getLocale();
  const t = getDict(locale);
  const supabase = await createClient();

  const { data } = await supabase
    .from("market_items")
    .select("name, detail, identifier, category")
    .eq("id", id)
    .maybeSingle();

  if (!data) return { title: t.mkTitle };

  const name = data.name as string;
  const detail = (data.detail as string | null) ?? (data.identifier as string | null);
  const category = t[CATEGORY_LABEL_KEY[data.category as keyof typeof CATEGORY_LABEL_KEY]];
  const description =
    locale === "ja"
      ? `${name}${detail ? `（${detail}）` : ""}の市場価格と推移。${category}を資産として記録・管理できます。`
      : `Market price and history for ${name}${detail ? ` (${detail})` : ""}. Track ${category.toLowerCase()} as part of a portfolio.`;

  const url = `${site.domain}/items/${id}`;

  return {
    title: name,
    description,
    alternates: { canonical: url },
    openGraph: { title: name, description, url, type: "website" },
    twitter: { card: "summary", title: name, description },
  };
}

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await optionalProfile();
  const locale = profile?.locale ?? (await getLocale());
  const t = getDict(locale);
  const supabase = await createClient();

  const currency = profile?.currency ?? "JPY";
  const detail = await loadItemDetail(supabase, id, profile?.userId ?? null, currency);
  if (!detail) notFound();

  const { item, price, holdingId, transactions, summary, community } = detail;

  const points: ChartPoint[] = detail.snapshots;

  const markers: TradeMarker[] = detail.trades;

  const photoUrl = await signedPhotoUrl(detail.photoPath);

  return (
    <div className="space-y-6">
      {/* Puts "Oh My Asset › Bags › Hermes Kelly 25" under the result instead
          of a bare URL. Structure only — see JsonLd for why there is no price
          in here. */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: brand.name, item: site.domain },
            {
              "@type": "ListItem",
              position: 2,
              name: t[CATEGORY_LABEL_KEY[item.category]],
              item: `${site.domain}/market?c=${item.category}`,
            },
            { "@type": "ListItem", position: 3, name: item.name },
          ],
        }}
      />

      <header className="flex items-start gap-4">
        <HoldingPhoto
          signedUrl={photoUrl}
          artUrl={item.image_url}
          category={item.category}
          alt={item.name}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">{t[CATEGORY_LABEL_KEY[item.category]]}</p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight sm:text-2xl">
            {item.name}
          </h1>
          {item.detail && <p className="mt-1 text-sm text-muted">{item.detail}</p>}

          <p className="tnum mt-3 text-2xl font-semibold">
            {price === null ? (
              <span className="text-base text-muted">{t.mkNoPrice}</span>
            ) : (
              formatMoney(price, currency, locale)
            )}
          </p>
          {/* A self-reported figure is labelled at the number itself, not only in
              a footnote: the badge is what stops it being read as a market quote. */}
          {detail.selfReported && (
            <p className="mt-1 text-xs text-muted">
              <span className="mr-1.5 rounded bg-line px-1.5 py-0.5 text-[10px]">
                {t.srBadge}
              </span>
              {fill(t.srNote, {
                asOf: formatDay(detail.selfReported.asOf, locale),
                source: detail.selfReported.source,
              })}
            </p>
          )}
        </div>
      </header>

      {/*
        * Provenance sits directly under the price: a number without a source is
        * exactly what this product refuses to show.
        *
        * Shown only when a feed has actually produced a price. An item created
        * by a user is assigned a source at creation, so an entry nothing has
        * ever priced was still captioned "Source: eBay" — crediting a venue
        * that had never been asked about it, under a valuation the holder had
        * typed themselves. No feed price, no attribution.
        */}
      <section className="card space-y-1.5 p-4 text-xs text-muted">
        {item.current_price !== null && (
        <p>
          {t.itSource}: {sourceLabel(item.source_type, locale)}
          {item.source_url && (
            <>
              {" · "}
              <a
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="rounded text-accent hover:underline"
              >
                {hostOf(item.source_url)}
              </a>
            </>
          )}
        </p>
        )}
        {item.current_price !== null && (
          <>
            <p>
              {t.itUpdatedAt}:{" "}
              {item.price_updated_at
                ? new Date(item.price_updated_at).toLocaleString(
                    locale === "ja" ? "ja-JP" : "en-SG",
                  )
                : t.noData}
            </p>
            <p>
              {t.itConfidence}: {confidenceLabel(t, item.data_confidence)}
            </p>
            {(item.data_confidence === "low" || item.data_confidence === "insufficient") && (
              <p className="mt-1 rounded-lg bg-canvas px-3 py-2 text-muted">
                {t.itLowConfidenceWarn}
              </p>
            )}
          </>
        )}
        {/* Says why there is no number, rather than leaving "insufficient" to
            be read as a failure of the app. For a brand-name-only entry the
            reason is actionable: name the model and the search narrows. */}
        {price === null && (
          <div className="mt-1 rounded-lg bg-canvas px-3 py-2 leading-relaxed text-muted">
            <p>{t.itNoPriceWhy}</p>
            {/* The way out, at the point the problem is stated.
                
                The valuation form is several sections down the page, past a
                chart that is hidden precisely because there is no price. A
                person who has just read "no data" should not have to scroll
                past the consequences of it to find the remedy. */}
            {profile && (
              <a
                href="#own-valuation"
                className="mt-2 inline-block font-medium text-accent underline underline-offset-2"
              >
                {t.itNoPriceOwnCta} →
              </a>
            )}
          </div>
        )}
      </section>

      {/*
        * Hidden when there is no price series to draw.
        *
        * Trade markers alone are not a chart. With no observations the line has
        * nothing to connect, the time axis collapses onto the trade dates, and
        * the result is two floating dots in an empty box — which reads as a
        * broken graph rather than as an item nothing prices automatically.
        * A self-reported valuation has one figure, not a history, so for those
        * items the trade list below is the honest presentation.
        */}
      {points.length + detail.communitySeries.length > 0 && (
      <section className="card p-4">
        <h2 className="mb-2 text-sm font-semibold">{t.itChart}</h2>
        <PriceChart
          points={points}
          community={detail.communitySeries}
          markers={markers}
          currency={currency}
          locale={locale}
          labels={{
            buy: t.itMarkerBuy,
            sell: t.itMarkerSell,
            empty: t.itNoChart,
            asking: t.cmAsking,
            realised: t.cmRealised,
          }}
        />
      </section>
      )}

      {/* Realised prices sit in their own card rather than beside the asking
          price: they answer a different question, from a different source, and
          blending the two would imply a single figure nobody actually quoted. */}
      <section className="card space-y-3 p-4">
        <div>
          <h2 className="text-sm font-semibold">{t.cmTitle}</h2>
          <p className="mt-1 text-xs text-muted">{t.cmLead}</p>
        </div>

        {community ? (
          <>
            <p className="tnum text-2xl font-semibold">
              {formatMoney(community.price, currency, locale)}
            </p>
            <dl className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
              <div className="flex gap-1.5">
                <dt>{t.cmContributors}</dt>
                <dd className="tnum font-medium text-ink">{community.contributors}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt>{t.cmReports}</dt>
                <dd className="tnum font-medium text-ink">{community.reports}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt>{t.itConfidence}</dt>
                <dd className="font-medium text-ink">
                  {communityConfidence(community.contributors) === "medium"
                    ? t.confidenceMedium
                    : t.confidenceLow}
                </dd>
              </div>
            </dl>
          </>
        ) : (
          <div className="space-y-1.5 text-sm text-muted">
            <p>{t.cmNone}</p>
            <p className="text-xs">{t.cmWhyThreshold}</p>
          </div>
        )}

        {profile ? (
          <PriceReportForm t={t} marketItemId={item.id} defaultCurrency={currency} />
        ) : (
          <Link href="/signup" className="btn-secondary w-full">
            {t.cmReport}
          </Link>
        )}
      </section>

      {/* Offered only where no feed answers. An item that already has a market
          price does not need a second one, and two figures side by side would
          just raise the question of which the portfolio total used. */}
      {/* Shown whenever the user has one, not only when the item lacks a feed
          price. A valuation that disappeared the moment a price arrived read
          as data loss — the row was still there, nothing displayed it. */}
      {(item.current_price === null || detail.ownValuation) && profile && (
        <section id="own-valuation" className="card space-y-3 p-4 scroll-mt-4">
          <div>
            <h2 className="text-sm font-semibold">{t.srTitle}</h2>
            <p className="mt-1 text-xs text-muted">{t.srLead}</p>
          </div>
          <ValuationForm
            t={t}
            marketItemId={item.id}
            defaultCurrency={currency}
            locale={locale}
            existing={detail.ownValuation}
          />
        </section>
      )}

      {holdingId ? (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            <Stat label={t.pfQty} value={String(summary.quantity)} />
            <Stat
              label={t.pfAvgCost}
              value={formatMoney(summary.avgCost, currency, locale)}
            />
            <Stat
              label={t.pfPl}
              value={`${formatMoney(summary.unrealized, currency, locale)} (${formatPercent(
                summary.unrealizedPct,
                locale,
              )})`}
              tone={
                summary.unrealized === null || summary.unrealized === 0
                  ? ""
                  : summary.unrealized > 0
                    ? "text-gain"
                    : "text-loss"
              }
            />
          </section>

          <section className="space-y-3">
            <TransactionForm
              t={t}
              holdingId={holdingId}
              defaultCurrency={currency}
              canSell={summary.quantity > 0}
            />
            <PhotoUploader
              t={t}
              holdingId={holdingId}
              marketItemId={item.id}
              hasPhoto={Boolean(detail.photoPath)}
            />
          </section>

          {/* Leaving is as much a part of holding something as arriving. Without
              this the holding row survived every attempt to clear it, and Browse
              went on calling the item held. */}
          <section className="flex justify-end">
            <form action={removeHolding}>
              <input type="hidden" name="marketItemId" value={item.id} />
              <SubmitButton
                pendingLabel={t.loading}
                className="btn-secondary px-3 py-1.5 text-xs text-loss"
              >
                {t.itRemoveHolding}
              </SubmitButton>
            </form>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold">{t.itTransactions}</h2>
            <TransactionList
              t={t}
              locale={locale}
              marketItemId={item.id}
              transactions={transactions}
            />
          </section>
        </>
      ) : profile ? (
        <form action={addHolding}>
          <input type="hidden" name="marketItemId" value={item.id} />
          <SubmitButton pendingLabel={t.loading} className="btn-primary w-full">
            {t.itAddToHoldings}
          </SubmitButton>
        </form>
      ) : (
        /* The page's whole job for a visitor: they came here from a search for
           something they own, and this is the step that turns reading a price
           into tracking one. */
        <section className="card space-y-3 p-5 text-center">
          <p className="text-sm text-muted">{t.itVisitorLead}</p>
          <Link href="/signup" className="btn-primary w-full">
            {t.itAddToHoldings}
          </Link>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={`tnum mt-1 text-sm font-medium ${tone}`}>{value}</p>
    </div>
  );
}

function confidenceLabel(
  t: ReturnType<typeof getDict>,
  confidence: MarketItem["data_confidence"],
): string {
  switch (confidence) {
    case "high":
      return t.confidenceHigh;
    case "medium":
      return t.confidenceMedium;
    case "low":
      return t.confidenceLow;
    case "insufficient":
      return t.confidenceInsufficient;
    default:
      return t.noData;
  }
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/**
 * A stored `YYYY-MM-DD` in the reader's conventions. Noon UTC so a timezone
 * west of the line cannot shift the calendar day backwards.
 */
function formatDay(day: string, locale: "ja" | "en"): string {
  const parsed = new Date(`${day}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return day;
  return new Intl.DateTimeFormat(locale === "ja" ? "ja-JP" : "en-SG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(parsed);
}
