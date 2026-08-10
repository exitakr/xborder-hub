/**
 * Shared shape for every price source.
 *
 * `history` exists because most sources cannot supply it: the daily cron builds
 * a chart forward one point at a time, which means a freshly seeded catalogue
 * has nothing to draw for weeks. Sources that publish trailing averages can
 * seed those weeks immediately, so the type carries them where they exist and
 * an empty array where they do not.
 */

export interface SourcePrice {
  price: number;
  currency: "USD" | "JPY" | "SGD";
  /** Observations behind the figure. Aggregated sources report one. */
  sampleSize: number;
  /**
   * Interquartile range over the median, for prices derived from listings.
   * Undefined for sources that publish one already-aggregated figure, where
   * there is no sample to disagree with itself.
   */
  spread?: number;
  source: string;
}

export interface HistoricalPrice {
  price: number;
  currency: SourcePrice["currency"];
  /** Identifies the exact statistic, e.g. `pokemontcg_cardmarket_avg30`. */
  source: string;
  observedAt: Date;
}

export interface SourceSeries {
  current: SourcePrice;
  /** Oldest first. Empty when the source publishes no history. */
  history: HistoricalPrice[];
}
