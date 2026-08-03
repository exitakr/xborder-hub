import type { Currency } from "./money.ts";
import type { Confidence } from "./calc.ts";

export const CATEGORIES = ["pokemon", "tcg", "watch", "bag", "sneaker"] as const;
export type Category = (typeof CATEGORIES)[number];

export function isCategory(v: string | null | undefined): v is Category {
  return (CATEGORIES as readonly string[]).includes(v ?? "");
}

export const SOURCE_TYPES = ["ebay", "scryfall", "pokemontcg", "curated"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

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
} as const;
