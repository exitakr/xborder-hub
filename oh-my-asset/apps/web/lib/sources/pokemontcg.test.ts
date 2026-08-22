import assert from "node:assert/strict";
import { test } from "node:test";
import { fetchPokemonTcgSeries } from "./pokemontcg.ts";

/**
 * The live response shape cannot be reached from CI (see the §要検証 note in
 * pokemontcg.ts), so these tests pin the parser against recorded shapes. What
 * they protect is the honesty rules: never mix average families, never publish
 * Cardmarket without a rate to convert it, and never place a trailing mean at
 * the edge of its window.
 */

const EUR_TO_USD = 1.1;
const DAY_MS = 86_400_000;

function respondWith(body: unknown, ok = true) {
  const original = globalThis.fetch;
  globalThis.fetch = (async () =>
    ({ ok, json: async () => body }) as unknown as Response) as typeof fetch;
  return () => {
    globalThis.fetch = original;
  };
}

function card(overrides: Record<string, unknown>) {
  return { data: [overrides] };
}

test("builds the series from one Cardmarket average family", async () => {
  const restore = respondWith(
    card({ cardmarket: { prices: { avg1: 100, avg7: 90, avg30: 80 } } }),
  );
  try {
    const series = await fetchPokemonTcgSeries("name:Pikachu", EUR_TO_USD);

    assert.ok(series);
    assert.ok(Math.abs(series.current.price - 110) < 1e-9); // 100 EUR at 1.1
    assert.equal(series.current.source, "pokemontcg_cardmarket_avg1");
    assert.deepEqual(
      series.history.map((h) => h.source),
      ["pokemontcg_cardmarket_avg30", "pokemontcg_cardmarket_avg7"],
    );
  } finally {
    restore();
  }
});

test("places each trailing mean at its window midpoint, not its edge", async () => {
  const restore = respondWith(
    card({ cardmarket: { prices: { avg1: 100, avg7: 90, avg30: 80 } } }),
  );
  try {
    const before = Date.now();
    const series = await fetchPokemonTcgSeries("name:Pikachu", EUR_TO_USD);
    assert.ok(series);

    const ageInDays = (iso: Date) => (before - iso.getTime()) / DAY_MS;
    const [avg30, avg7] = series.history;

    // 15 and 3.5, not 30 and 7 — the mean describes the middle of its window.
    assert.ok(Math.abs(ageInDays(avg30.observedAt) - 15) < 0.01);
    assert.ok(Math.abs(ageInDays(avg7.observedAt) - 3.5) < 0.01);
  } finally {
    restore();
  }
});

test("falls back to the reverse-holo family without mixing in base values", async () => {
  const restore = respondWith(
    card({
      cardmarket: {
        prices: { avg7: 90, reverseHoloAvg1: 200, reverseHoloAvg7: 180 },
      },
    }),
  );
  try {
    const series = await fetchPokemonTcgSeries("name:Pikachu", EUR_TO_USD);

    assert.ok(series);
    assert.equal(series.current.source, "pokemontcg_cardmarket_reverseholo_avg1");
    // The stray base avg7 must not be adopted into the reverse-holo series.
    assert.deepEqual(
      series.history.map((h) => h.source),
      ["pokemontcg_cardmarket_reverseholo_avg7"],
    );
  } finally {
    restore();
  }
});

test("skips Cardmarket entirely when no EUR rate is available", async () => {
  const restore = respondWith(
    card({
      cardmarket: { prices: { avg1: 100, avg7: 90 } },
      tcgplayer: { prices: { holofoil: { market: 42 } } },
    }),
  );
  try {
    const series = await fetchPokemonTcgSeries("name:Pikachu", undefined);

    // Reporting EUR as USD would be a silently wrong number; TCGplayer answers
    // instead, and the chart simply has no history.
    assert.ok(series);
    assert.equal(series.current.price, 42);
    assert.equal(series.current.source, "pokemontcg_tcgplayer");
    assert.deepEqual(series.history, []);
  } finally {
    restore();
  }
});

test("returns no history when Cardmarket has only a current average", async () => {
  const restore = respondWith(card({ cardmarket: { prices: { avg1: 100 } } }));
  try {
    const series = await fetchPokemonTcgSeries("name:Pikachu", EUR_TO_USD);

    assert.ok(series);
    assert.ok(Math.abs(series.current.price - 110) < 1e-9);
    assert.deepEqual(series.history, []);
  } finally {
    restore();
  }
});

test("reports no data rather than guessing when both venues are absent", async () => {
  const restore = respondWith(card({ name: "Pikachu" }));
  try {
    assert.equal(await fetchPokemonTcgSeries("name:Pikachu", EUR_TO_USD), null);
  } finally {
    restore();
  }
});

test("rejects non-positive prices instead of charting them", async () => {
  const restore = respondWith(
    card({ cardmarket: { prices: { avg1: 0, avg7: -5 } } }),
  );
  try {
    assert.equal(await fetchPokemonTcgSeries("name:Pikachu", EUR_TO_USD), null);
  } finally {
    restore();
  }
});

test("carries the small card image through", async () => {
  const restore = respondWith(
    card({
      images: { small: "https://images.pokemontcg.io/base1/4.png", large: "https://x/big.png" },
      tcgplayer: { prices: { holofoil: { market: 100 } } },
    }),
  );
  try {
    const series = await fetchPokemonTcgSeries('name:"Charizard"');
    // `small`, not `large`: this is drawn at thumbnail size.
    assert.equal(series?.imageUrl, "https://images.pokemontcg.io/base1/4.png");
  } finally {
    restore();
  }
});

test("a non-https or missing image is dropped, not passed on", async () => {
  for (const images of [
    { small: "http://insecure.example/1.png" },
    { small: 42 },
    {},
    undefined,
  ]) {
    const restore = respondWith(
      card({ images, tcgplayer: { prices: { holofoil: { market: 100 } } } }),
    );
    try {
      const series = await fetchPokemonTcgSeries('name:"Charizard"');
      // The price still stands on its own — a bad image must not lose it.
      assert.equal(series?.current.price, 100);
      assert.equal(series?.imageUrl, undefined);
    } finally {
      restore();
    }
  }
});
