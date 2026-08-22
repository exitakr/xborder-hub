import assert from "node:assert/strict";
import { test } from "node:test";
import { convertTransactions, unknownValueSummary } from "./holdings.ts";
import { summarize } from "./calc.ts";
import type { TransactionRow } from "./types.ts";

const row = (
  id: string,
  unitPrice: number,
  currency: "JPY" | "SGD" | "USD",
): TransactionRow => ({
  id,
  holding_id: "h1",
  type: "buy",
  traded_on: "2026-01-01",
  quantity: 1,
  unit_price: unitPrice,
  currency,
});

// Units of X per 1 JPY.
const fx = { SGD: 0.0086, USD: 0.0064 };

test("convertTransactions converts a mixed-currency history into one currency", () => {
  const { transactions, complete } = convertTransactions(
    [row("1", 10000, "JPY"), row("2", 86, "SGD")],
    "JPY",
    fx,
  );

  assert.equal(complete, true);
  assert.equal(transactions[0].unitPrice, 10000);
  // 86 SGD ÷ 0.0086 = 10,000 JPY
  assert.equal(Math.round(transactions[1].unitPrice), 10000);
});

test("convertTransactions reports incomplete when a rate is missing", () => {
  const { complete } = convertTransactions([row("1", 100, "USD")], "JPY", { SGD: 0.0086 });
  assert.equal(complete, false);
});

test("an unconvertible history reports unknown value, never a fake gain", () => {
  // Without this guard the unconvertible price collapses to a cost of 0, and
  // the holding renders as an infinite gain.
  const { transactions, complete } = convertTransactions(
    [row("1", 100, "USD")],
    "JPY",
    { SGD: 0.0086 },
  );
  assert.equal(complete, false);

  const naive = summarize(transactions, 5000);
  assert.equal(naive.costBasis, 0); // the failure mode we are guarding against

  const guarded = unknownValueSummary(naive);
  assert.equal(guarded.costBasis, null);
  assert.equal(guarded.avgCost, null);
  assert.equal(guarded.marketValue, null);
  assert.equal(guarded.unrealizedPct, null);
  // Quantity needs no FX, so it stays trustworthy.
  assert.equal(guarded.quantity, 1);
});
