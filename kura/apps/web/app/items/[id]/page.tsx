import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDict } from "@kura/core";
import { requireProfile, signedPhotoUrl } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { loadItemDetail } from "@kura/core";
import { formatMoney, formatPercent } from "@kura/core";
import { CATEGORY_LABEL_KEY, sourceLabel, type MarketItem } from "@kura/core";
import { HoldingPhoto } from "@/components/HoldingPhoto";
import { PriceChart, type ChartPoint, type TradeMarker } from "./PriceChart";
import { TransactionForm } from "./TransactionForm";
import { PhotoUploader } from "./PhotoUploader";
import { TransactionList } from "./TransactionList";
import { addHolding } from "../../market/actions";

export const metadata: Metadata = { title: "Item" };

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile();
  const t = getDict(profile.locale);
  const supabase = await createClient();

  const currency = profile.currency;
  const detail = await loadItemDetail(supabase, id, profile.userId, currency);
  if (!detail) notFound();

  const { item, price, holdingId, transactions, summary } = detail;

  const points: ChartPoint[] = detail.snapshots;

  const markers: TradeMarker[] = transactions.map((tx) => ({
    ts: new Date(`${tx.traded_on}T00:00:00Z`).getTime(),
    type: tx.type,
    quantity: tx.quantity,
    unitPrice: tx.unit_price,
  }));

  const photoUrl = await signedPhotoUrl(detail.photoPath);

  return (
    <div className="space-y-6">
      <header className="flex items-start gap-4">
        <HoldingPhoto
          signedUrl={photoUrl}
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
              formatMoney(price, currency, profile.locale)
            )}
          </p>
        </div>
      </header>

      {/* Provenance sits directly under the price: a number without a source is
          exactly what this product refuses to show. */}
      <section className="card space-y-1.5 p-4 text-xs text-muted">
        <p>
          {t.itSource}: {sourceLabel(item.source_type, profile.locale)}
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
        <p>
          {t.itUpdatedAt}:{" "}
          {item.price_updated_at
            ? new Date(item.price_updated_at).toLocaleString(
                profile.locale === "ja" ? "ja-JP" : "en-SG",
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
      </section>

      <section className="card p-4">
        <h2 className="mb-2 text-sm font-semibold">{t.itChart}</h2>
        <PriceChart
          points={points}
          markers={markers}
          currency={currency}
          locale={profile.locale}
          labels={{ buy: t.itMarkerBuy, sell: t.itMarkerSell, empty: t.itNoChart }}
        />
      </section>

      {holdingId ? (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            <Stat label={t.pfQty} value={String(summary.quantity)} />
            <Stat
              label={t.pfAvgCost}
              value={formatMoney(summary.avgCost, currency, profile.locale)}
            />
            <Stat
              label={t.pfPl}
              value={`${formatMoney(summary.unrealized, currency, profile.locale)} (${formatPercent(
                summary.unrealizedPct,
                profile.locale,
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

          <section>
            <h2 className="mb-2 text-sm font-semibold">{t.itTransactions}</h2>
            <TransactionList
              t={t}
              locale={profile.locale}
              marketItemId={item.id}
              transactions={transactions}
            />
          </section>
        </>
      ) : (
        <form action={addHolding}>
          <input type="hidden" name="marketItemId" value={item.id} />
          <button type="submit" className="btn-primary w-full">
            {t.itAddToHoldings}
          </button>
        </form>
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
