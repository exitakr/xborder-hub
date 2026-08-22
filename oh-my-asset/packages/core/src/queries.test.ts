import assert from "node:assert/strict";
import { test } from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { __resetSchemaProbe, searchItems } from "./queries.ts";

/**
 * The bug these exist to prevent.
 *
 * `image_url` was added to the shared column list and shipped before the
 * migration that creates it was run. PostgREST answered every catalogue query
 * with `column market_items.image_url does not exist`, the code did
 * `data ?? []`, and the catalogue and every portfolio rendered empty. To the
 * user this was indistinguishable from the app having deleted their
 * collection.
 *
 * The rule now: an optional column may cost us the column. It may never cost
 * us the rows.
 */

const ROW = {
  id: "i1",
  category: "watch",
  name: "Kelly 25",
  detail: null,
  identifier: null,
  source_type: "rakuten",
  source_url: null,
  current_price: 100,
  currency: "JPY",
  price_updated_at: null,
  data_confidence: "high",
};

const UNKNOWN_COLUMN = {
  code: "42703",
  message: 'column market_items.image_url does not exist',
};

/**
 * Minimal PostgREST double. Records the column list of each attempt so the
 * tests can assert on the retry, and is thenable because the real builder is.
 */
function fakeClient(behaviour: (columns: string) => { data: unknown; error: unknown }) {
  const attempts: string[] = [];

  const client = {
    from() {
      let columns = "";
      const builder = {
        select(cols: string) {
          columns = cols;
          attempts.push(cols);
          return builder;
        },
        order: () => builder,
        limit: () => builder,
        eq: () => builder,
        or: () => builder,
        then(resolve: (v: unknown) => unknown) {
          return Promise.resolve(behaviour(columns)).then(resolve);
        },
      };
      return builder;
    },
  };

  return { client: client as unknown as SupabaseClient, attempts };
}

test("a missing optional column costs the column, not the rows", async () => {
  __resetSchemaProbe();
  const { client, attempts } = fakeClient((columns) =>
    columns.includes("image_url")
      ? { data: null, error: UNKNOWN_COLUMN }
      : { data: [ROW], error: null },
  );

  const items = await searchItems(client, { term: "kelly" });

  assert.equal(items.length, 1, "the catalogue must still come back");
  assert.equal(items[0].name, "Kelly 25");
  // Callers read `image_url` unconditionally, so it has to be present and null
  // rather than undefined.
  assert.equal(items[0].image_url, null);

  assert.equal(attempts.length, 2, "one full attempt, then one degraded retry");
  assert.ok(attempts[0].includes("image_url"));
  assert.ok(!attempts[1].includes("image_url"));
});

test("a database that has the column returns it", async () => {
  __resetSchemaProbe();
  const { client } = fakeClient((columns) =>
    columns.includes("image_url")
      ? { data: [{ ...ROW, image_url: "https://img.example/1.png" }], error: null }
      : { data: [ROW], error: null },
  );

  const items = await searchItems(client, {});
  assert.equal(items[0].image_url, "https://img.example/1.png");
});

test("an unrelated failure is not retried into a wrong answer", async () => {
  __resetSchemaProbe();
  // A permissions or connection error must surface as no rows, not be mistaken
  // for a schema mismatch and retried until something comes back.
  const { client, attempts } = fakeClient(() => ({
    data: null,
    error: { code: "42501", message: "permission denied for table market_items" },
  }));

  const items = await searchItems(client, {});
  assert.deepEqual(items, []);
  assert.equal(attempts.length, 1, "no retry for an error that is not a missing column");
});
