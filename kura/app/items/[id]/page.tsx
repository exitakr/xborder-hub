import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDict } from "@/lib/i18n/dict";
import { requireProfile, signedPhotoUrl } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { loadFxRates } from "@/lib/portfolio";
import { convertTransactions, unknownValueSummary } from "@/lib/holdings";
import { convert, formatMoney, formatPercent } from "@/lib/money";
import { summarize } from "@/lib/calc";
import { CATEGORY_LABEL_KEY, type MarketItem, type TransactionRow } from "@/lib/types";
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

  const { data: itemRow } = await supabase
    .from("market_items")
    .select(
      "id, category, name, detail, identifier, source_type, source_url, current_price, currency, price_updated_at, data_confidence",
    )
    .eq("id", id)
    .maybeSingle();

  if (!itemRow) notFound();
  const item = itemRow as MarketItem;

  const [{ data: holding }, { data: snapshots }, fx] = await Promise.all([
    supabase
      .from("holdings")
      .select("id, photo_path")
      .eq("user_id", profile.userId)
      .eq("market_item_id", id)
      .maybeSingle(),
    supabase
      .from("price_snapshots")
      .select("price, currency, observed_at")
      .eq("market_item_id", id)
      .order("observed_at", { ascending: true })
      .limit(400),
    loadFxRates(),
  ]);

  const currency = profile.currency;

  const points: ChartPoint[] = (snapshots ?? [])
    .map((s) => ({
      ts: new Date(s.observed_at as string).getTime(),
      price: convert(Number(s.price), s.currency as never, currency, fx),
    }))
    .filter((p): p is ChartPoint => p.price !== null);

  let transactions: TransactionRow[] = [];
  if (holding) {
    const { data } = await supabase
      .from("transactions")
      .select("id, holding_id, type, traded_on, quantity, unit_price, currency")
      .eq("holding_id", holding.id)
      .eq("user_id", profile.userId)
      .order("traded_on", { ascending: false });
    transactions = (data ?? []) as TransactionRow[];
  }

  const { transactions: converted, complete } = convertTransactions(
    transactions,
    currency,
    fx,
  );

  const price = convert(item.current_price, item.currency, currency, fx);
  const rawSummary = summarize(converted, complete ? price : null);
  const summary = complete ? rawSummary : unknownValueSummary(rawSummary);

  const markers: TradeMarker[] = transactions.map((tx) => ({
    ts: new Date(`${tx.traded_on}T00:00:00Z`).getTime(),
    type: tx.type,
    quantity: tx.quantity,
    unitPrice: tx.unit_price,
  }));

  const photoUrl = await signedPhotoUrl(holding?.photo_path ?? null);

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
          {t.itSource}:{" "}
          {item.source_type === "ebay" ? (
            <span>eBay Browse API</span>
          ) : item.source_url ? (
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="rounded text-accent hover:underline"
            >
              {hostOf(item.source_url)}
            </a>
          ) : (
            t.noData
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

      {holding ? (
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
              holdingId={holding.id}
              defaultCurrency={currency}
              canSell={summary.quantity > 0}
            />
            <PhotoUploader
              t={t}
              holdingId={holding.id}
              marketItemId={item.id}
              hasPhoto={Boolean(holding.photo_path)}
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
