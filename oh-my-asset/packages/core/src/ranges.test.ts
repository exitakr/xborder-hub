import assert from "node:assert/strict";
import { test } from "node:test";
import { rangeStart, windowSeries } from "./ranges.ts";

const NOW = new Date("2026-08-10T12:00:00+09:00");
const day = (iso: string) => ({ ts: new Date(iso).getTime(), value: 1 });

test("year-to-date anchors to 1 January, not 365 days back", () => {
  const ytd = rangeStart("ytd", NOW);
  assert.notEqual(ytd, null);
  const d = new Date(ytd as number);
  assert.equal(d.getMonth(), 0);
  assert.equal(d.getDate(), 1);
  assert.equal(d.getFullYear(), 2026);
});

test("all-time has no lower bound", () => {
  assert.equal(rangeStart("all", NOW), null);
});

test("a short window keeps only what falls inside it", () => {
  const points = [
    day("2026-06-01T00:00:00Z"),
    day("2026-08-06T00:00:00Z"),
    day("2026-08-09T00:00:00Z"),
  ];
  const shown = windowSeries(points, "1w", NOW);

  // The June point is out of the window, but survives as the pinned opening
  // value; the two August points are inside it.
  assert.equal(shown.length, 3);
  assert.equal(shown[0].ts, rangeStart("1w", NOW));
});

test("a stale series reads as flat, not as missing", () => {
  // The only observation is older than the window. Dropping it would render an
  // empty chart, which says "no data" about a value we know perfectly well.
  const points = [{ ts: new Date("2026-01-15T00:00:00Z").getTime(), value: 42 }];
  const shown = windowSeries(points, "1w", NOW);

  assert.equal(shown.length, 1);
  assert.equal(shown[0].value, 42);
  assert.equal(shown[0].ts, rangeStart("1w", NOW));
});

test("windowing never mutates the input", () => {
  const points = [day("2026-01-15T00:00:00Z"), day("2026-08-09T00:00:00Z")];
  const before = points.map((p) => p.ts);
  windowSeries(points, "1w", NOW);
  assert.deepEqual(
    points.map((p) => p.ts),
    before,
  );
});

test("all-time returns every point, unpinned", () => {
  const points = [day("2020-01-01T00:00:00Z"), day("2026-08-09T00:00:00Z")];
  const shown = windowSeries(points, "all", NOW);
  assert.equal(shown.length, 2);
  assert.equal(shown[0].ts, points[0].ts);
});
