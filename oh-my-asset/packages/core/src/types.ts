import type { Currency } from "./money.ts";
import type { Confidence } from "./calc.ts";

export const CATEGORIES = ["pokemon", "tcg", "watch", "bag", "sneaker", "car", "other"] as const;
export type Category = (typeof CATEGORIES)[number];

export function isCategory(v: string | null | undefined): v is Category {
  return (CATEGORIES as readonly string[]).includes(v ?? "");
}

export const SOURCE_TYPES = ["ebay", "scryfall", "pokemontcg", "rakuten", "curated"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

/**
 * A realised-price figure built from what users reported selling for.
 *
 * It is deliberately a separate type from `MarketItem.current_price` rather than
 * another `source_type`: this number answers a different question (what did it
 * actually sell for) with different provenance (the crowd, not a venue), and the
 * two are shown side by side rather than one silently standing in for the other.
 */
export interface CommunityPrice {
  /** Normalised to JPY by the database; convert for display like any other. */
  priceJpy: number;
  /** Distinct users behind the figure. Never below the database's floor of 3. */
  contributors: number;
  reports: number;
  firstTraded: string;
  lastTraded: string;
}

export interface CommunityPoint {
  /** First day of the month the reports fall in. */
  month: string;
  priceJpy: number;
  contributors: number;
}

/**
 * Confidence for a community figure.
 *
 * Capped at "medium" on purpose. However many people report a trade, this is
 * self-selected data about individual sales, and calling it "high" would put it
 * on the same footing as an aggregated market feed.
 */
export function communityConfidence(contributors: number): "medium" | "low" {
  return contributors >= 10 ? "medium" : "low";
}

export interface MarketItem {
  id: string;
  category: Category;
  name: string;
  detail: string | null;
  identifier: string | null;
  source_type: SourceType;
  source_url: string | null;
  current_price: number | null;
  currency: Currency;
  price_updated_at: string | null;
  data_confidence: Confidence | null;
  /**
   * Card artwork from the pricing source, or null.
   *
   * Only Scryfall and pokemontcg.io supply this; every other category is null
   * by design, since marketplace listing photos belong to their sellers. UI
   * that shows it must have a non-image fallback — see migration 0014.
   */
  image_url: string | null;
}

/**
 * Attribution shown next to a price.
 *
 * This is not decoration: Scryfall's licence requires attribution wherever its
 * data appears, and the eBay label has to say "listing" because those are
 * asking prices rather than realised sales. Both apps render this string.
 */
export function sourceLabel(sourceType: SourceType, locale: "ja" | "en"): string {
  switch (sourceType) {
    case "ebay":
      return locale === "ja" ? "eBay 出品価格（Browse API）" : "eBay listings (Browse API)";
    case "scryfall":
      return locale === "ja" ? "Scryfall（市場価格）" : "Scryfall (market price)";
    // Cardmarket is named first because it is what the chart is normally built
    // from; TCGplayer answers only for cards Cardmarket does not cover.
    case "pokemontcg":
      return locale === "ja"
        ? "Pokémon TCG API（Cardmarket / TCGplayer）"
        : "Pokémon TCG API (Cardmarket / TCGplayer)";
    // Rakuten's licence requires the service to be named wherever its data is
    // shown, in the same way Scryfall's does.
    case "rakuten":
      return locale === "ja"
        ? "楽天市場 出品価格（楽天ウェブサービス）"
        : "Rakuten Ichiba listings (Rakuten Web Service)";
    case "curated":
      return locale === "ja" ? "運営による手動登録" : "Recorded manually by the operator";
  }
}

export interface PriceSnapshot {
  price: number;
  currency: Currency;
  sample_size: number | null;
  observed_at: string;
}

export interface HoldingRow {
  id: string;
  market_item_id: string;
  photo_path: string | null;
  note: string | null;
  market_items: MarketItem;
}

export interface TransactionRow {
  id: string;
  holding_id: string;
  type: "buy" | "sell";
  traded_on: string;
  quantity: number;
  unit_price: number;
  currency: Currency;
}

/** Translation key for a category label, so the UI never hardcodes Japanese. */
export const CATEGORY_LABEL_KEY = {
  pokemon: "catPokemon",
  tcg: "catTcg",
  watch: "catWatch",
  bag: "catBag",
  sneaker: "catSneaker",
  car: "catCar",
  other: "catOther",
} as const;
