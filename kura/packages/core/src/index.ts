/**
 * Public surface of the shared domain package.
 *
 * Anything exported here is used by BOTH the web app and the native app. Keep
 * platform-specific code (Next server helpers, React Native storage, DOM canvas)
 * out of this package — that is what makes it safe to import from either side.
 */
export { brand, wordmark } from "./brand.ts";

export {
  averageCost,
  confidenceFor,
  netQuantity,
  realizedProfit,
  summarize,
  totals,
  trimmedMedian,
  type Confidence,
  type HoldingSummary,
  type PortfolioTotals,
  type Transaction,
  type TxType,
} from "./calc.ts";

export { convertTransactions, unknownValueSummary } from "./holdings.ts";

export {
  CURRENCIES,
  convert,
  formatMoney,
  formatPercent,
  fractionDigits,
  isCurrency,
  type Currency,
  type FxTable,
} from "./money.ts";

export {
  CATEGORIES,
  CATEGORY_LABEL_KEY,
  SOURCE_TYPES,
  isCategory,
  sourceLabel,
  type Category,
  type SourceType,
  type HoldingRow,
  type MarketItem,
  type PriceSnapshot,
  type TransactionRow,
} from "./types.ts";

export {
  DEFAULT_LOCALE,
  LOCALES,
  getDict,
  isLocale,
  type Locale,
  type TranslationKey,
} from "./i18n/dict.ts";

export {
  curatedPriceSchema,
  newItemSchema,
  profileSchema,
  transactionSchema,
  type TransactionInput,
} from "./validation.ts";

export {
  heldItemIds,
  loadFxRates,
  loadItemDetail,
  loadPortfolio,
  searchItems,
  type HoldingView,
  type ItemDetail,
  type PortfolioView,
} from "./queries.ts";
