import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CATEGORY_LABEL_KEY, brand, formatMoney, formatPercent, getDict, isCategory } from "@oma/core";
import { getLocale } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";
import { CategoryGlyph } from "@/components/CategoryGlyph";

interface Snapshot {
  display_name: string | null;
  total_jpy: number;
  cost_jpy: number;
  item_count: number;
  categories: string | null;
  shared_since: string;
}

async function load(token: string): Promise<Snapshot | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("shared_portfolio", { p_token: token });
  const row = Array.isArray(data) ? data[0] : null;
  return (row as Snapshot | undefined) ?? null;
}

/**
 * The link preview. This is the part that actually travels: most people who
 * encounter this page will only ever see the card, so the numbers have to be
 * in the metadata, not just on the page.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const snap = await load(token);
  if (!snap) return { title: brand.name, robots: { index: false } };

  const total = formatMoney(Number(snap.total_jpy), "JPY", "ja");
  const title = `${total} · ${brand.name}`;
  const description = `${snap.item_count} 点のコレクションを資産として記録中`;

  return {
    title,
    description,
    // Never indexed. A shared link is for the people it was sent to, and a
    // search engine turning someone's net worth into a public result is not
    // what "share" meant.
    robots: { index: false, follow: false },
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

/**
 * A portfolio someone chose to publish.
 *
 * Aggregates only — the database function returns nothing else (migration
 * 0019). No item names, no purchase prices, no photos, no email.
 */
export default async function SharedPortfolioPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const locale = await getLocale();
  const t = getDict(locale);
  const snap = await load(token);

  // A revoked or bogus token is a 404, not an error page: "this link no longer
  // works" is the whole message, and anything more would confirm that the
  // token had once been real.
  if (!snap) notFound();

  const total = Number(snap.total_jpy);
  const cost = Number(snap.cost_jpy);
  const gain = total - cost;
  const pct = cost > 0 ? gain / cost : null;
  const categories = (snap.categories ?? "").split(",").filter(isCategory);

  return (
    <div className="mx-auto max-w-md space-y-5 py-6">
      <section className="card p-6 text-center">
        <p className="text-xs text-muted">{t.pfTotalValue}</p>
        <p className="tnum mt-1 text-4xl font-bold tracking-tight sm:text-5xl">
          {formatMoney(total, "JPY", locale)}
        </p>
        <p
          className={`tnum mt-2 text-sm font-semibold ${gain > 0 ? "text-gain" : gain < 0 ? "text-loss" : "text-muted"}`}
        >
          {gain >= 0 ? "+" : ""}
          {formatMoney(gain, "JPY", locale)}
          {pct !== null && ` (${formatPercent(pct, locale)})`}
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {categories.map((c) => (
            <span key={c} className="chip gap-1.5">
              <CategoryGlyph category={c} className="h-3.5 w-3.5" />
              {t[CATEGORY_LABEL_KEY[c]]}
            </span>
          ))}
        </div>

        <p className="tnum mt-4 text-xs text-muted">
          {snap.item_count} {t.planUnitItems}
        </p>
      </section>

      {/* The reason this page exists commercially: a visitor who likes the look
          of it should be one tap from having their own. */}
      <section className="card p-5 text-center">
        <p className="text-sm font-semibold">{brand.tagline[locale]}</p>
        <Link href="/signup" className="btn-primary mt-4 w-full">
          {t.landingCta}
        </Link>
        <Link
          href="/"
          className="mt-3 block rounded text-xs text-muted hover:text-ink hover:underline"
        >
          {brand.name}
        </Link>
      </section>

      <p className="text-center text-xs text-muted">{t.shareNote}</p>
    </div>
  );
}
