import assert from "node:assert/strict";
import { test } from "node:test";
import { fetchRakutenPrice } from "./rakuten.ts";

/**
 * The live response shape cannot be reached from CI (see the §要検証 note in
 * rakuten.ts), so these tests pin the parser against recorded shapes. What they
 * protect is that a missing key, an unfamiliar envelope or too thin a sample all
 * end as "no price" rather than as a number nobody can defend.
 */

function respondWith(body: unknown, ok = true) {
  const original = globalThis.fetch;
  globalThis.fetch = (async () =>
    ({ ok, json: async () => body }) as unknown as Response) as typeof fetch;
  return () => {
    globalThis.fetch = original;
  };
}

function withAppId<T>(run: () => Promise<T>): Promise<T> {
  const original = process.env.RAKUTEN_APPLICATION_ID;
  process.env.RAKUTEN_APPLICATION_ID = "test-app-id";
  return run().finally(() => {
    if (original === undefined) delete process.env.RAKUTEN_APPLICATION_ID;
    else process.env.RAKUTEN_APPLICATION_ID = original;
  });
}

/** Rakuten's documented envelope: each hit wrapped as `{ Item: {...} }`. */
function wrapped(prices: number[]) {
  return { Items: prices.map((itemPrice) => ({ Item: { itemPrice } })) };
}

test("returns a JPY trimmed median from the documented envelope", async () => {
  const restore = respondWith(wrapped([100, 200, 300, 400, 500]));
  try {
    const { price: result, reason } = await withAppId(() => fetchRakutenPrice("Rolex Submariner"));
    assert.ok(result);
    assert.equal(result.currency, "JPY");
    assert.equal(result.price, 300);
    assert.equal(result.sampleSize, 5);
    assert.equal(result.source, "rakuten_ichiba");
  } finally {
    restore();
  }
});

test("accepts the unwrapped envelope older revisions return", async () => {
  const restore = respondWith({ Items: [10, 20, 30, 40, 50].map((itemPrice) => ({ itemPrice })) });
  try {
    const { price: result, reason } = await withAppId(() => fetchRakutenPrice("Nike Dunk Low"));
    assert.ok(result);
    assert.equal(result.price, 30);
  } finally {
    restore();
  }
});

test("returns null without an application id, before any request is made", async () => {
  const original = process.env.RAKUTEN_APPLICATION_ID;
  delete process.env.RAKUTEN_APPLICATION_ID;

  let called = false;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    called = true;
    return { ok: true, json: async () => wrapped([1, 2, 3, 4, 5]) } as unknown as Response;
  }) as typeof fetch;

  try {
    const result = await fetchRakutenPrice("anything");
    assert.equal(result.price, null);
    // The audit survives even here, so an unconfigured deployment says so in
    // the admin screen rather than looking like a thin market.
    assert.equal(result.reason, "not_configured");
    assert.equal(called, false);
  } finally {
    globalThis.fetch = originalFetch;
    if (original !== undefined) process.env.RAKUTEN_APPLICATION_ID = original;
  }
});

test("too few listings yields no price rather than a thin one", async () => {
  const restore = respondWith(wrapped([1000, 2000]));
  try {
    const result = await withAppId(() => fetchRakutenPrice("obscure item"));
    assert.equal(result.price, null);
    assert.equal(result.reason, "too_few");
    // Two listings came back and were counted, which is the fact that tells an
    // operator "the query works, the market is thin" rather than "the query is
    // broken". Reporting nothing at all could not distinguish the two.
    assert.equal(result.audit.used, 2);
  } finally {
    restore();
  }
});

test("an unexpected shape yields no price rather than throwing", async () => {
  const restore = respondWith({ error: "wrong_parameter" });
  try {
    const result = await withAppId(() => fetchRakutenPrice("anything"));
    assert.equal(result.price, null);
    assert.equal(result.reason, "no_listings");
  } finally {
    restore();
  }
});

test("non-numeric and non-positive prices are discarded, not coerced", async () => {
  const restore = respondWith({
    Items: [
      { Item: { itemPrice: "3000" } },
      { Item: { itemPrice: 0 } },
      { Item: { itemPrice: -100 } },
      { Item: { itemPrice: 1000 } },
      { Item: { itemPrice: 2000 } },
    ],
  });
  try {
    // Only two usable values survive, which is below the median's floor.
    const result = await withAppId(() => fetchRakutenPrice("anything"));
    assert.equal(result.price, null);
    assert.equal(result.reason, "too_few");
  } finally {
    restore();
  }
});

test("an HTTP error yields no price", async () => {
  const restore = respondWith(wrapped([1, 2, 3, 4, 5]), false);
  try {
    const result = await withAppId(() => fetchRakutenPrice("anything"));
    assert.equal(result.price, null);
    // Told apart from a thin market, because they call for opposite responses:
    // one wants the credentials checked, the other wants the query widened.
    assert.equal(result.reason, "http_error");
  } finally {
    restore();
  }
});

test("a validated band lowers the sample floor from five to three", async () => {
  // The regression that emptied the bag catalogue. Pushing a realistic floor
  // into the query removes most of a page before the median ever sees it, and
  // a five-listing minimum then rejected what survived. Three listings that
  // passed a floor, a ceiling and a model-specific keyword are better evidence
  // than five that passed none of them.
  const restore = respondWith(wrapped([420000, 450000, 480000]));
  try {
    const banded = await withAppId(() =>
      fetchRakutenPrice("シャネル 19 チェーンバッグ", { minPrice: 400000, maxPrice: 3000000 }),
    );
    assert.equal(banded.reason, "ok");
    assert.equal(banded.price?.price, 450000);

    // The same three listings without a band stay refused.
    const unbanded = await withAppId(() => fetchRakutenPrice("シャネル バッグ"));
    assert.equal(unbanded.price, null);
    assert.equal(unbanded.reason, "too_few");
  } finally {
    restore();
  }
});

test("a floor makes the accessory exclusions redundant, so they are dropped", async () => {
  const restore = respondWith(wrapped([420000, 450000, 480000]));
  try {
    const banded = await withAppId(() =>
      fetchRakutenPrice("ボッテガヴェネタ カセット", { minPrice: 130000, maxPrice: 1000000 }),
    );
    // Nothing costing ¥130,000 is a bag charm, so every surviving exclusion is
    // pure downside — it cannot remove an accessory the floor has not already
    // removed, and it can remove a real listing that merely mentions one.
    assert.equal(banded.audit.ngKeyword, "");

    const unbanded = await withAppId(() =>
      fetchRakutenPrice("ボッテガヴェネタ カセット", { category: "bag" }),
    );
    // Without a floor they are the only defence, so they stay.
    assert.ok(unbanded.audit.ngKeyword.includes("チャーム"));
  } finally {
    restore();
  }
});

test("keeps the words that describe a genuine pre-owned listing", async () => {
  const restore = respondWith(wrapped([1, 2, 3, 4, 5]));
  try {
    const { audit } = await withAppId(() =>
      fetchRakutenPrice("エルメス バーキン25", { category: "bag" }),
    );
    // Each of these was excluding the listings it was meant to protect:
    // Rakuten matches NGKeyword against the whole title, and Japanese titles
    // are descriptive sentences. 収納力抜群 and 持ち手に使用感あり appear in the
    // well-described, complete listings a median most wants.
    for (const trap of ["収納", "持ち手", "風", "似", "カバー", "保護", "ケース"]) {
      assert.ok(!audit.ngKeyword.includes(trap), `${trap} should not be excluded`);
    }
  } finally {
    restore();
  }
});
