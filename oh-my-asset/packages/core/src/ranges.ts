/**
 * Chart windows, shared by the web and native portfolio screens.
 *
 * Lives in core rather than in either chart component because the two products
 * have to agree on what "1ヶ月" means. A user who checks the app on a phone and
 * then on a laptop is looking at the same portfolio; a range that quietly
 * spanned different days on each would make the two disagree about performance.
 */
export const RANGES = ["1w", "1m", "ytd", "all"] as const;
export type Range = (typeof RANGES)[number];

/**
 * Earliest timestamp a range admits, or null for "everything".
 *
 * Year-to-date is anchored to 1 January in local time rather than "365 days
 * ago": those are different questions, and the one a brokerage screen answers
 * is the calendar one.
 */
export function rangeStart(range: Range, now: Date = new Date()): number | null {
  switch (range) {
    case "1w":
      return now.getTime() - 7 * 86_400_000;
    case "1m":
      return now.getTime() - 30 * 86_400_000;
    case "ytd":
      return new Date(now.getFullYear(), 0, 1).getTime();
    case "all":
      return null;
  }
}

/**
 * The points inside a window, plus the last one before it, pinned to the window
 * start.
 *
 * Without that leading point, a one-week view of a series whose most recent
 * observation is ten days old would be empty, and the reading would be "no
 * data" rather than "flat" — which is wrong, since the value is known and has
 * simply not moved.
 */
export function windowSeries<T extends { ts: number }>(
  points: readonly T[],
  range: Range,
  now: Date = new Date(),
): T[] {
  const from = rangeStart(range, now);
  if (from === null) return [...points];

  const inWindow = points.filter((p) => p.ts >= from);
  const before = points.filter((p) => p.ts < from).at(-1);
  return before ? [{ ...before, ts: from }, ...inWindow] : inWindow;
}
