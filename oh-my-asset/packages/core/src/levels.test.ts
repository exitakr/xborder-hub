import assert from "node:assert/strict";
import test from "node:test";
import { LEVELS, MAX_LEVEL, levelFor } from "./levels.ts";

/**
 * The level is the one number on the screen a person is invited to feel good
 * about, so the failures that matter are the ones that would take it away or
 * hand it out unearned.
 */

test("the ladder is strictly ascending on both axes", () => {
  // A non-monotonic ladder would let a bigger collection score lower, which
  // the search in levelFor would silently paper over.
  for (let i = 1; i < LEVELS.length; i += 1) {
    assert.ok(LEVELS[i].minItems > LEVELS[i - 1].minItems, `items at ${i}`);
    assert.ok(LEVELS[i].minValueJpy > LEVELS[i - 1].minValueJpy, `value at ${i}`);
    assert.equal(LEVELS[i].level, LEVELS[i - 1].level + 1);
  }
});

test("level 4 sits exactly on the free-plan ceiling", () => {
  // Not decoration: the promotion and the paywall are meant to land in the
  // same moment. If free_holding_limit() moves, this should be revisited
  // rather than quietly drift apart.
  const tier4 = LEVELS.find((l) => l.level === 4);
  assert.equal(tier4?.minItems, 10);
});

test("either ladder alone earns the level", () => {
  // Forty cards worth very little.
  assert.equal(levelFor(40, 50_000).level, 6);
  // Three watches worth a great deal.
  assert.equal(levelFor(3, 60_000_000).level, 7);
});

test("reports which ladder carried the level", () => {
  assert.equal(levelFor(40, 50_000).via, "items");
  assert.equal(levelFor(3, 60_000_000).via, "value");
});

test("a shrunken collection keeps its rank", () => {
  // The whole point of the high-water mark: selling is normal, recording sales
  // is data we want, and a level that dropped would punish exactly that.
  const standing = levelFor(0, 0, 7);
  assert.equal(standing.level, 7);
});

test("the peak cannot exceed the top of the ladder", () => {
  // A stored peak is client-supplied in origin, so a corrupted or forged value
  // must not produce a tier lookup that does not exist.
  const standing = levelFor(0, 0, 9999);
  assert.equal(standing.level, MAX_LEVEL);
  assert.ok(standing.tier);
});

test("progress is measured from current figures, not from the peak", () => {
  // A bar that filled months ago and cannot move promises a promotion that
  // will never come.
  const standing = levelFor(1, 0, 5);
  assert.equal(standing.level, 5);
  assert.ok(standing.progress !== null);
  assert.equal(standing.progress, 0);
});

test("progress follows whichever ladder is nearer", () => {
  // 10 items (level 4, needs 20 for level 5) is halfway on count; the value
  // ladder is nowhere. Showing the further one would understate the distance
  // already covered.
  const standing = levelFor(15, 0);
  assert.equal(standing.level, 4);
  assert.equal(standing.progress, 0.5);
  assert.equal(standing.itemsToNext, 5);
});

test("the top of the ladder has no next tier and no progress", () => {
  const standing = levelFor(500, 900_000_000);
  assert.equal(standing.level, MAX_LEVEL);
  assert.equal(standing.next, null);
  assert.equal(standing.progress, null);
  assert.equal(standing.itemsToNext, null);
});

test("an empty collection is level 1, not level 0", () => {
  // There is no level 0 to fall to, and a "level 0" badge would read as a
  // failure state on a screen whose job is encouragement.
  assert.equal(levelFor(0, 0).level, 1);
});

test("nonsense input does not produce a nonsense level", () => {
  // These arrive from a database column and an FX conversion, either of which
  // can be null on a row nothing has priced.
  assert.equal(levelFor(Number.NaN, Number.NaN).level, 1);
  assert.equal(levelFor(-5, -100).level, 1);
  assert.equal(levelFor(Number.POSITIVE_INFINITY, 0).level, 1);
});
