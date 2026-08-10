import assert from "node:assert/strict";
import { test } from "node:test";
import {
  averageCost,
  confidenceFor,
  netQuantity,
  realizedProfit,
  summarize,
  totals,
  trimmedMedian,
  type Transaction,
} from "./calc.ts";

const tx = (
  id: string,
  type: "buy" | "sell",
  tradedOn: string,
  quantity: number,
  unitPrice: number,
): Transaction => ({ id, type, tradedOn, quantity, unitPrice });

test("averageCost weights by quantity and ignores sells", () => {
  const txs = [
    tx("1", "buy", "2026-01-01", 1, 1000),
    tx("2", "buy", "2026-02-01", 3, 2000),
    tx("3", "sell", "2026-03-01", 1, 9999),
  ];
  // (1×1000 + 3×2000) / 4 = 1750
  assert.equal(averageCost(txs), 1750);
});

test("averageCost is null when nothing was ever bought", () => {
  assert.equal(averageCost([]), null);
});

test("netQuantity subtracts sells", () => {
  const txs = [
    tx("1", "buy", "2026-01-01", 5, 100),
    tx("2", "sell", "2026-02-01", 2, 150),
  ];
  assert.equal(netQuantity(txs), 3);
});

test("realizedProfit values sells at the average cost at that moment", () => {
  const txs = [
    tx("1", "buy", "2026-01-01", 1, 1000),
    tx("2", "sell", "2026-02-01", 1, 1500), // +500 against a basis of 1000
    tx("3", "buy", "2026-03-01", 1, 5000), // must not retroactively change the sell
  ];
  assert.equal(realizedProfit(txs), 500);
});

test("realizedProfit handles a same-day buy then sell", () => {
  const txs = [
    tx("2", "sell", "2026-01-01", 1, 1200),
    tx("1", "buy", "2026-01-01", 1, 1000),
  ];
  assert.equal(realizedProfit(txs), 200);
});

test("realizedProfit ignores a sell with no basis rather than inventing one", () => {
  assert.equal(realizedProfit([tx("1", "sell", "2026-01-01", 1, 1200)]), 0);
});

test("summarize computes value and percentage from cost basis", () => {
  const txs = [tx("1", "buy", "2026-01-01", 2, 1000)];
  const s = summarize(txs, 1500);
  assert.equal(s.quantity, 2);
  assert.equal(s.avgCost, 1000);
  assert.equal(s.costBasis, 2000);
  assert.equal(s.marketValue, 3000);
  assert.equal(s.unrealized, 1000);
  assert.equal(s.unrealizedPct, 50);
});

test("summarize yields a null valuation when price data is missing", () => {
  const s = summarize([tx("1", "buy", "2026-01-01", 2, 1000)], null);
  assert.equal(s.marketValue, null);
  assert.equal(s.unrealized, null);
  assert.equal(s.unrealizedPct, null);
  // Cost is still known even when the market price is not.
  assert.equal(s.costBasis, 2000);
});

test("totals exclude priceless holdings from both value and cost", () => {
  const priced = summarize([tx("1", "buy", "2026-01-01", 1, 1000)], 1500);
  const unpriced = summarize([tx("2", "buy", "2026-01-01", 1, 4000)], null);

  const t = totals([priced, unpriced]);
  assert.equal(t.totalValue, 1500);
  assert.equal(t.totalCost, 1000); // the 4000 cost must NOT leak in
  assert.equal(t.unrealized, 500);
  assert.equal(t.excludedCount, 1);
});

test("totals treat a fully sold holding as realised-only", () => {
  const closed = summarize(
    [tx("1", "buy", "2026-01-01", 1, 1000), tx("2", "sell", "2026-02-01", 1, 1400)],
    1500,
  );
  const t = totals([closed]);
  assert.equal(t.totalValue, 0);
  assert.equal(t.totalCost, 0);
  assert.equal(t.realized, 400);
  assert.equal(t.excludedCount, 0);
});

test("totals report a null percentage instead of dividing by zero", () => {
  assert.equal(totals([]).unrealizedPct, null);
});

test("trimmedMedian drops outliers at both ends", () => {
  // The 1 and the 100000 are trimmed before the median is taken.
  const values = [1, 100, 102, 104, 106, 108, 110, 112, 114, 100000];
  const result = trimmedMedian(values);
  assert.ok(result);
  assert.equal(result.sampleSize, 10);
  assert.equal(result.price, 107); // median of 100..114
});

test("trimmedMedian refuses to price on too few observations", () => {
  assert.equal(trimmedMedian([100, 200, 300, 400]), null);
});

test("trimmedMedian discards non-positive and non-finite values", () => {
  const result = trimmedMedian([100, 0, -5, Number.NaN, 110, 120, 130, 140, 150]);
  assert.ok(result);
  assert.equal(result.sampleSize, 6);
});

test("confidenceFor maps sample counts to labels", () => {
  assert.equal(confidenceFor(25), "high");
  assert.equal(confidenceFor(12), "medium");
  assert.equal(confidenceFor(6), "low");
  assert.equal(confidenceFor(3), "insufficient");
});

test("trimmedMedian refuses a price when the listings disagree", () => {
  // What a brand-name-only search returns: keychains around 2,000 alongside
  // handbags around 300,000. A median exists arithmetically and describes
  // nothing, so there is no price to publish.
  const mixed = [
    2_000, 2_400, 2_800, 3_200, 3_600,
    280_000, 300_000, 320_000, 340_000, 360_000,
  ];
  assert.equal(trimmedMedian(mixed), null);
});

test("trimmedMedian still prices one product across conditions", () => {
  // The same bag, used through new. Wide-ish, but coherent.
  const oneProduct = [240_000, 260_000, 280_000, 300_000, 310_000, 320_000, 340_000];
  const result = trimmedMedian(oneProduct);
  assert.ok(result, "a coherent sample must still produce a price");
  assert.ok(result.spread <= 1, "spread is reported alongside the price");
});

test("trimmedMedian reports the spread it measured", () => {
  const tight = [100, 101, 102, 103, 104, 105, 106];
  const result = trimmedMedian(tight);
  assert.ok(result);
  assert.ok(result.spread < 0.05, `expected a tight spread, got ${result.spread}`);
});

test("confidenceFor caps the label when the sample is loose", () => {
  // Plenty of listings, but they disagree: count alone would say "high".
  assert.equal(confidenceFor(25, 0.9), "low");
  assert.equal(confidenceFor(25, 0.4), "medium");
  assert.equal(confidenceFor(25, 0.1), "high");
  // A ceiling only ever lowers: few listings stay low however tight they are.
  assert.equal(confidenceFor(6, 0.05), "low");
  assert.equal(confidenceFor(3, 0.05), "insufficient");
});
