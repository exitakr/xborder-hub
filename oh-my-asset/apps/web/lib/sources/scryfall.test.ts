import assert from "node:assert/strict";
import { test } from "node:test";
import { fetchScryfallSeries } from "./scryfall.ts";

/**
 * api.scryfall.com is unreachable from CI (see the §要検証 note in scryfall.ts),
 * so these pin the parser against recorded shapes. The rule they protect: an
 * image is a nice-to-have and a price is not, so a missing or malformed image
 * must never cost us the price.
 */

function respondWith(body: unknown, ok = true) {
  const original = globalThis.fetch;
  globalThis.fetch = (async () =>
    ({ ok, json: async () => body }) as unknown as Response) as typeof fetch;
  return () => {
    globalThis.fetch = original;
  };
}

test("reads the normal-size image alongside the price", async () => {
  const restore = respondWith({
    prices: { usd: "12.34" },
    image_uris: { normal: "https://cards.scryfall.io/normal/x.jpg", large: "https://x/l.jpg" },
  });
  try {
    const series = await fetchScryfallSeries("Black Lotus");
    assert.equal(series?.current.price, 12.34);
    assert.equal(series?.imageUrl, "https://cards.scryfall.io/normal/x.jpg");
    // Scryfall publishes no history; the chart builds forward from here.
    assert.deepEqual(series?.history, []);
  } finally {
    restore();
  }
});

test("falls back to the front face on a double-faced card", async () => {
  const restore = respondWith({
    prices: { usd: "5.00" },
    card_faces: [
      { image_uris: { normal: "https://cards.scryfall.io/normal/front.jpg" } },
      { image_uris: { normal: "https://cards.scryfall.io/normal/back.jpg" } },
    ],
  });
  try {
    const series = await fetchScryfallSeries("Delver of Secrets");
    assert.equal(series?.imageUrl, "https://cards.scryfall.io/normal/front.jpg");
  } finally {
    restore();
  }
});

test("keeps the price when the image is absent or not https", async () => {
  for (const extra of [
    {},
    { image_uris: {} },
    { image_uris: { normal: "http://insecure.example/x.jpg" } },
    { card_faces: [] },
  ]) {
    const restore = respondWith({ prices: { usd: "9.99" }, ...extra });
    try {
      const series = await fetchScryfallSeries("Some Card");
      assert.equal(series?.current.price, 9.99);
      assert.equal(series?.imageUrl, undefined);
    } finally {
      restore();
    }
  }
});

test("no usable price means no series, image or not", async () => {
  const restore = respondWith({
    prices: { usd: null },
    image_uris: { normal: "https://cards.scryfall.io/normal/x.jpg" },
  });
  try {
    assert.equal(await fetchScryfallSeries("Unpriced Card"), null);
  } finally {
    restore();
  }
});
