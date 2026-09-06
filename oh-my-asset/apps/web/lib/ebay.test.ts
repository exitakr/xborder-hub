import assert from "node:assert/strict";
import { test } from "node:test";
import { fetchPrice } from "./ebay.ts";

/**
 * What the request asks for is the whole ballgame.
 *
 * A BMW came back at roughly ¥10,000 and the median was not wrong — the sample
 * was. eBay's inventory for "BMW" is mostly die-cast models and wheel emblems,
 * and no statistic computed afterwards can separate a cheap listing that is the
 * item from a cheap listing that is a keyring, because both are internally
 * consistent. The only fix is to not ask for them.
 *
 * So these tests are about the URL, not the arithmetic. Each asserts one thing
 * the request must say for the answer to mean anything.
 */

interface Captured {
  url: string;
}

function capture(body: unknown): { captured: Captured; restore: () => void } {
  const original = globalThis.fetch;
  const captured: Captured = { url: "" };

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    // The OAuth call happens first and is not the request under test.
    if (url.includes("/identity/v1/oauth2/token")) {
      return {
        ok: true,
        json: async () => ({ access_token: "test-token", expires_in: 7200 }),
      } as unknown as Response;
    }
    captured.url = url;
    return { ok: true, json: async () => body } as unknown as Response;
  }) as typeof fetch;

  return {
    captured,
    restore: () => {
      globalThis.fetch = original;
    },
  };
}

function withCredentials<T>(run: () => Promise<T>): Promise<T> {
  const id = process.env.EBAY_CLIENT_ID;
  const secret = process.env.EBAY_CLIENT_SECRET;
  process.env.EBAY_CLIENT_ID = "test-id";
  process.env.EBAY_CLIENT_SECRET = "test-secret";
  return run().finally(() => {
    if (id === undefined) delete process.env.EBAY_CLIENT_ID;
    else process.env.EBAY_CLIENT_ID = id;
    if (secret === undefined) delete process.env.EBAY_CLIENT_SECRET;
    else process.env.EBAY_CLIENT_SECRET = secret;
  });
}

function listings(values: number[], currency = "USD") {
  return {
    itemSummaries: values.map((v) => ({ price: { value: String(v), currency } })),
  };
}

test("confines a car search to eBay's Cars & Trucks category", async () => {
  const { captured, restore } = capture(listings([20000, 21000, 22000, 23000, 24000]));
  try {
    await withCredentials(() => fetchPrice("BMW M3", { category: "car" }));
    const url = new URL(captured.url);
    // The single most important parameter on this request: a die-cast model is
    // listed under Toys and simply cannot appear in this category.
    assert.equal(url.searchParams.get("category_ids"), "6001");
  } finally {
    restore();
  }
});

test("excludes car-specific accessory terms that the generic list misses", async () => {
  const { captured, restore } = capture(listings([20000, 21000, 22000, 23000, 24000]));
  try {
    await withCredentials(() => fetchPrice("BMW M3", { category: "car" }));
    const q = new URL(captured.url).searchParams.get("q") ?? "";
    for (const term of ["-diecast", "-emblem", "-brochure", "-parts"]) {
      assert.ok(q.includes(term), `expected ${term} in q, got: ${q}`);
    }
    // The generic exclusions still apply alongside the category ones.
    assert.ok(q.includes("-replica"));
  } finally {
    restore();
  }
});

test("does not apply car exclusions to a watch", async () => {
  const { captured, restore } = capture(listings([5000, 5100, 5200, 5300, 5400]));
  try {
    await withCredentials(() => fetchPrice("Rolex Submariner", { category: "watch" }));
    const q = new URL(captured.url).searchParams.get("q") ?? "";
    assert.ok(!q.includes("-diecast"));
    // A watch has its own accessory economy, and "band" is the whole of it.
    assert.ok(q.includes("-band"));
    assert.equal(new URL(captured.url).searchParams.get("category_ids"), "31387");
  } finally {
    restore();
  }
});

test("pushes the floor into the request rather than only checking the answer", async () => {
  const { captured, restore } = capture(listings([20000, 21000, 22000, 23000, 24000]));
  try {
    await withCredentials(() =>
      fetchPrice("BMW M3", { category: "car", minPrice: 2000, minPriceCurrency: "USD" }),
    );
    const filter = new URL(captured.url).searchParams.get("filter") ?? "";
    // Narrowing the SAMPLE, not rejecting the RESULT: rejecting afterwards
    // throws the item away entirely and shows "no data", even when genuine
    // listings were sitting in the response underneath the junk.
    assert.ok(filter.includes("price:[2000..]"), filter);
    assert.ok(filter.includes("priceCurrency:USD"), filter);
    assert.ok(filter.includes("buyingOptions:{FIXED_PRICE}"), filter);
  } finally {
    restore();
  }
});

test("brackets the search when a ceiling is known too", async () => {
  const { captured, restore } = capture(listings([3000, 3200, 3400, 3600, 3800]));
  try {
    await withCredentials(() =>
      fetchPrice("Chanel 19 Medium", {
        category: "bag",
        minPrice: 2600,
        maxPrice: 20000,
        minPriceCurrency: "USD",
      }),
    );
    const filter = new URL(captured.url).searchParams.get("filter") ?? "";
    // The mirror of the floor: "Chanel 19" matches Classic Flap listings at
    // three times the price, and a portfolio inflated 3x is as wrong as one
    // deflated 10x.
    assert.ok(filter.includes("price:[2600..20000]"), filter);
  } finally {
    restore();
  }
});

test("writes an open-ended range when only one end is known", async () => {
  const { captured, restore } = capture(listings([100, 110, 120, 130, 140]));
  try {
    await withCredentials(() => fetchPrice("Something", { maxPrice: 5000 }));
    const filter = new URL(captured.url).searchParams.get("filter") ?? "";
    // eBay's filter takes an inclusive range, so a ceiling with no floor has
    // to be written with the low end empty rather than as a second filter.
    assert.ok(filter.includes("price:[..5000]"), filter);
  } finally {
    restore();
  }
});

test("omits the price filter when no floor is known", async () => {
  const { captured, restore } = capture(listings([100, 110, 120, 130, 140]));
  try {
    await withCredentials(() => fetchPrice("Something obscure", { category: "other" }));
    const url = new URL(captured.url);
    assert.ok(!(url.searchParams.get("filter") ?? "").includes("price:["));
    // "other" has no eBay category, and guessing one would be worse than none:
    // a wrong id returns nothing and reads as a thin market.
    assert.equal(url.searchParams.get("category_ids"), null);
  } finally {
    restore();
  }
});

test("reports how the number was reached, including a URL a person can open", async () => {
  const { restore } = capture(listings([20000, 21000, 22000, 23000, 25000]));
  try {
    const { observation: result } = await withCredentials(() =>
      fetchPrice("BMW M3", { category: "car", minPrice: 2000, maxPrice: 40000 }),
    );
    assert.ok(result);
    const a = result.audit;
    assert.equal(a.categoryId, "6001");
    assert.equal(a.minPrice, 2000);
    assert.equal(a.maxPrice, 40000);
    assert.equal(a.returned, 5);
    assert.equal(a.used, 5);
    assert.equal(a.low, 20000);
    assert.equal(a.high, 25000);
    // The link is the point of the whole record: it is what lets someone see
    // the listings instead of taking the median on trust.
    assert.ok(a.webUrl.startsWith("https://www.ebay.com/sch/i.html"));
    const web = new URL(a.webUrl);
    assert.equal(web.searchParams.get("_sacat"), "6001");
    assert.equal(web.searchParams.get("_udlo"), "2000");
    assert.equal(web.searchParams.get("_udhi"), "40000");
    assert.ok((web.searchParams.get("_nkw") ?? "").includes("BMW M3"));
  } finally {
    restore();
  }
});

test("counts only the dominant currency as used", async () => {
  const { restore } = capture({
    itemSummaries: [
      ...listings([100, 110, 120, 130, 140]).itemSummaries,
      { price: { value: "9999", currency: "EUR" } },
    ],
  });
  try {
    const { observation: result } = await withCredentials(() => fetchPrice("Whatever"));
    assert.ok(result);
    assert.equal(result.currency, "USD");
    assert.equal(result.audit.returned, 6);
    // The euro listing is counted as returned and not as used: mixing
    // currencies inside one median would produce a number in no currency.
    assert.equal(result.audit.used, 5);
  } finally {
    restore();
  }
});
