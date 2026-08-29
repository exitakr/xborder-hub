/**
 * Collector levels.
 *
 * WHAT THIS IS FOR
 *
 * A portfolio tracker gives you a number that goes up and down for reasons you
 * did not choose. That is honest and it is not, on its own, a reason to open
 * the app on a day when nothing happened. A level is the other kind of number:
 * it moves only when YOU do something, it never goes backwards, and it is the
 * one thing on the screen you can be straightforwardly pleased about.
 *
 * TWO LADDERS, NOT ONE
 *
 * Somebody with three Patek Philippes and somebody with forty Pokémon cards are
 * both serious collectors, and a single ladder would have to insult one of
 * them. So there are two — count and value — and your level is the better of
 * the two. That is what makes it feel like a recognition of what you collect
 * rather than a scoreboard for how rich you are.
 *
 * WHY IT NEVER GOES DOWN
 *
 * Selling is a normal thing to do with a collection, and recording sales is
 * data this product wants. A level that dropped when you sold would punish
 * exactly the behaviour we are asking for — so the level is a high-water mark,
 * held in `profiles.level_peak`. You can sell everything and stay a 館長.
 *
 * WHERE THE THRESHOLDS COME FROM
 *
 * The count ladder is dense early (1, 3, 5) so the first session produces two
 * promotions, and level 4 sits at exactly the free-plan ceiling of ten items —
 * the moment you are asked to pay is the same moment you are told you have
 * levelled up, which is the honest version of a paywall: you have outgrown the
 * free tier rather than hit a wall in it.
 *
 * The value ladder is in JPY because the database stores one comparable
 * currency (see migration 0017), not because JPY is privileged — a Singaporean
 * collector's level is computed from the same converted figure.
 */

export interface LevelTier {
  level: number;
  /** Key into the locale dictionary. Names are never hardcoded English. */
  nameKey: LevelNameKey;
  /** Distinct items ever added. */
  minItems: number;
  /** Total holdings value converted to JPY. */
  minValueJpy: number;
}

export type LevelNameKey =
  | "lvName1" | "lvName2" | "lvName3" | "lvName4" | "lvName5"
  | "lvName6" | "lvName7" | "lvName8" | "lvName9" | "lvName10";

export const LEVELS: readonly LevelTier[] = [
  { level: 1,  nameKey: "lvName1",  minItems: 1,   minValueJpy: 0 },
  { level: 2,  nameKey: "lvName2",  minItems: 3,   minValueJpy: 300_000 },
  { level: 3,  nameKey: "lvName3",  minItems: 5,   minValueJpy: 1_000_000 },
  // Deliberately the free-plan ceiling. See the note above.
  { level: 4,  nameKey: "lvName4",  minItems: 10,  minValueJpy: 3_000_000 },
  { level: 5,  nameKey: "lvName5",  minItems: 20,  minValueJpy: 10_000_000 },
  { level: 6,  nameKey: "lvName6",  minItems: 35,  minValueJpy: 30_000_000 },
  { level: 7,  nameKey: "lvName7",  minItems: 50,  minValueJpy: 50_000_000 },
  { level: 8,  nameKey: "lvName8",  minItems: 75,  minValueJpy: 100_000_000 },
  { level: 9,  nameKey: "lvName9",  minItems: 100, minValueJpy: 300_000_000 },
  { level: 10, nameKey: "lvName10", minItems: 150, minValueJpy: 500_000_000 },
] as const;

export const MAX_LEVEL = LEVELS[LEVELS.length - 1].level;

export interface LevelStanding {
  /** What to display. Never lower than `peak`. */
  level: number;
  tier: LevelTier;
  /** The tier above, or null at the top of the ladder. */
  next: LevelTier | null;
  /** 0–1 toward `next`, by whichever ladder is closer. Null at the top. */
  progress: number | null;
  /** Items still needed for the next level, by the count ladder. Null at top. */
  itemsToNext: number | null;
  /** Value still needed for the next level, in JPY. Null at the top. */
  valueToNextJpy: number | null;
  /** Which ladder is currently carrying the level. */
  via: "items" | "value";
}

/**
 * Where a collection stands.
 *
 * `peak` is the stored high-water mark and wins whenever it is higher, so a
 * collection that has shrunk keeps its rank. Progress is still measured from
 * the CURRENT figures, because a bar that filled up months ago and cannot move
 * is worse than no bar — it would promise a promotion that will not come.
 */
export function levelFor(items: number, valueJpy: number, peak = 0): LevelStanding {
  const safeItems = Number.isFinite(items) ? Math.max(0, Math.floor(items)) : 0;
  const safeValue = Number.isFinite(valueJpy) ? Math.max(0, valueJpy) : 0;

  let earned = LEVELS[0];
  for (const tier of LEVELS) {
    if (safeItems >= tier.minItems || safeValue >= tier.minValueJpy) earned = tier;
  }

  const level = Math.min(MAX_LEVEL, Math.max(earned.level, peak));
  const tier = LEVELS.find((l) => l.level === level) ?? LEVELS[0];

  // Progress is measured from what was actually earned, not from the peak: at
  // the top of a restored peak there may be nothing to progress toward yet.
  const next = LEVELS.find((l) => l.level === level + 1) ?? null;

  // Which ladder got you here — the one to celebrate in the copy.
  const via: "items" | "value" =
    safeValue >= earned.minValueJpy && earned.minValueJpy > 0 && safeItems < earned.minItems
      ? "value"
      : "items";

  if (!next) {
    return {
      level, tier, next: null, progress: null,
      itemsToNext: null, valueToNextJpy: null, via,
    };
  }

  const byItems = ratio(safeItems - tier.minItems, next.minItems - tier.minItems);
  const byValue = ratio(safeValue - tier.minValueJpy, next.minValueJpy - tier.minValueJpy);

  return {
    level,
    tier,
    next,
    // The nearer ladder, because that is the one the person can actually
    // finish, and showing the further one would understate how close they are.
    progress: Math.max(byItems, byValue),
    itemsToNext: Math.max(0, next.minItems - safeItems),
    valueToNextJpy: Math.max(0, next.minValueJpy - safeValue),
    via,
  };
}

/** Clamped 0–1, and 0 rather than NaN when the span is degenerate. */
function ratio(gained: number, span: number): number {
  if (!(span > 0)) return 0;
  return Math.min(1, Math.max(0, gained / span));
}
