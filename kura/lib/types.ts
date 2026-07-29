import type { Currency } from "./money";
import type { Confidence } from "./calc";

export const CATEGORIES = ["pokemon", "tcg", "watch", "bag", "sneaker"] as const;
export type Category = (typeof CATEGORIES)[number];

export function isCategory(v: string | null | undefined): v is Category {
  return (CATEGORIES as readonly string[]).includes(v ?? "");
}

export interface MarketItem {
  id: string;
  category: Category;
  name: string;
  detail: string | null;
  identifier: string | null;
  source_type: "ebay" | "curated";
  source_url: string | null;
  current_price: number | null;
  currency: Currency;
  price_updated_at: string | null;
  data_confidence: Confidence | null;
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
