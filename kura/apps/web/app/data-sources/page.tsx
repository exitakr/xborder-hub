import type { Metadata } from "next";
import { getDict } from "@oma/core";
import { getLocale } from "@/lib/i18n-server";

export const metadata: Metadata = {
  title: "Data sources",
  description: "Where Oh My Asset's prices come from, how they are calculated, and their limits.",
};

/**
 * Public disclosure of where the numbers come from.
 *
 * Three jobs at once, which is why it is a page and not a footnote:
 *
 *  1. Trust. This app's argument is that its prices are honest. That claim is
 *     worth nothing unless a sceptical visitor can check the working, and the
 *     limits are stated as prominently as the sources.
 *  2. Licence compliance. Scryfall and Rakuten both require attribution. The
 *     item screen carries it per price; this collects it in one citable place.
 *  3. Diligence. A buyer of this business will ask exactly these questions —
 *     what are you dependent on, what are you licensed to do, what breaks if a
 *     source closes. Having answered them in public is worth more than
 *     answering them in a data room later.
 *
 * Indexable on purpose: "where does <app> get its prices" is a question people
 * genuinely search for before trusting a portfolio tool.
 */
export default async function DataSourcesPage() {
  const locale = await getLocale();
  const t = getDict(locale);

  const sources = [
    {
      name: "Scryfall",
      url: "https://scryfall.com",
      for: locale === "ja" ? "マジック：ザ・ギャザリング" : "Magic: The Gathering",
      kind: locale === "ja" ? "市場価格（USD）・カード画像" : "Market price (USD), card artwork",
    },
    {
      name: "Pokémon TCG API",
      url: "https://pokemontcg.io",
      for: locale === "ja" ? "ポケモンカード" : "Pokémon cards",
      kind:
        locale === "ja"
          ? "Cardmarket / TCGplayer 集計価格・過去平均・カード画像"
          : "Cardmarket / TCGplayer aggregates, trailing averages, artwork",
    },
    {
      name: "楽天市場 (Rakuten Ichiba)",
      url: "https://webservice.rakuten.co.jp",
      for:
        locale === "ja"
          ? "日本語で登録された時計・バッグ・スニーカー"
          : "Japanese-language watches, bags, sneakers",
      kind: locale === "ja" ? "出品価格（JPY）" : "Asking prices (JPY)",
    },
    {
      name: "eBay Browse API",
      url: "https://developer.ebay.com",
      for: locale === "ja" ? "英語圏の時計・バッグ・スニーカー・車" : "Watches, bags, sneakers, cars",
      kind: locale === "ja" ? "出品価格（USD）" : "Asking prices (USD)",
    },
    {
      name: locale === "ja" ? "利用者による売却実績の投稿" : "User-reported sale prices",
      url: null,
      for: locale === "ja" ? "全カテゴリ" : "All categories",
      kind:
        locale === "ja"
          ? "実売価格の中央値（投稿者3人以上の銘柄のみ公開）"
          : "Median realised price (published only at 3+ contributors)",
    },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t.dsTitle}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t.dsLead}</p>
      </div>

      <section>
        <h2 className="text-sm font-semibold">{t.dsSourcesTitle}</h2>
        <ul className="mt-3 space-y-2">
          {sources.map((s) => (
            <li key={s.name} className="card p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium">
                  {s.url ? (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded hover:underline"
                    >
                      {s.name}
                    </a>
                  ) : (
                    s.name
                  )}
                </p>
                <p className="text-xs text-muted">{s.for}</p>
              </div>
              <p className="mt-1 text-xs text-muted">{s.kind}</p>
            </li>
          ))}
        </ul>
      </section>

      <Block title={t.dsMethodTitle} body={t.dsMethodBody} />
      {/* The limits sit at the same weight as the sources rather than in
          smaller type below them. A disclosure that has to be hunted for is a
          disclaimer; one at full size is a disclosure. */}
      <Block title={t.dsLimitsTitle} body={t.dsLimitsBody} />
      <Block title={t.dsHistoryTitle} body={t.dsHistoryBody} />
      <Block title={t.dsImagesTitle} body={t.dsImagesBody} />

      <p className="text-xs leading-relaxed text-muted">{t.disclaimer}</p>
    </div>
  );
}

function Block({ title, body }: { title: string; body: string }) {
  return (
    <section>
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
    </section>
  );
}
