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
    const result = await withAppId(() => fetchRakutenPrice("Rolex Submariner"));
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
    const result = await withAppId(() => fetchRakutenPrice("Nike Dunk Low"));
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
    assert.equal(await fetchRakutenPrice("anything"), null);
    assert.equal(called, false);
  } finally {
    globalThis.fetch = originalFetch;
    if (original !== undefined) process.env.RAKUTEN_APPLICATION_ID = original;
  }
});

test("too few listings yields no price rather than a thin one", async () => {
  const restore = respondWith(wrapped([1000, 2000]));
  try {
    assert.equal(await withAppId(() => fetchRakutenPrice("obscure item")), null);
  } finally {
    restore();
  }
});

test("an unexpected shape yields no price rather than throwing", async () => {
  const restore = respondWith({ error: "wrong_parameter" });
  try {
    assert.equal(await withAppId(() => fetchRakutenPrice("anything")), null);
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
    assert.equal(await withAppId(() => fetchRakutenPrice("anything")), null);
  } finally {
    restore();
  }
});

test("an HTTP error yields no price", async () => {
  const restore = respondWith(wrapped([1, 2, 3, 4, 5]), false);
  try {
    assert.equal(await withAppId(() => fetchRakutenPrice("anything")), null);
  } finally {
    restore();
  }
});
