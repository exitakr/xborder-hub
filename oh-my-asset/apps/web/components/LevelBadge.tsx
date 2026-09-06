"use client";

import { useEffect } from "react";
import Link from "next/link";
import { fill, formatMoney, getDict, levelFor } from "@oma/core";
import type { Locale } from "@oma/core";
import { recordLevelPeak } from "@/app/portfolio/level-actions";

type Dict = ReturnType<typeof getDict>;

/**
 * Where a collection stands, at the top of the screen people open every day.
 *
 * The portfolio total answers "what am I worth", which moves for reasons the
 * owner did not choose and is as likely to be discouraging as not. This answers
 * "how far have I got", which only ever moves when they do something — and it
 * is the half of the screen worth coming back to on a flat day.
 *
 * The progress bar is the working part. A level with no visible distance to the
 * next one is a label; a level with "5 more items" under it is an invitation,
 * and it is the same invitation as the free-plan ceiling, which sits at exactly
 * level 4 on purpose.
 */
export function LevelBadge({
  locale,
  items,
  valueJpy,
  peak,
}: {
  locale: Locale;
  items: number;
  valueJpy: number;
  peak: number;
}) {
  const t = getDict(locale);
  const standing = levelFor(items, valueJpy, peak);

  /*
   * Persist a promotion the moment it is displayed.
   *
   * The peak exists so that selling never demotes anyone, which means it has to
   * be written at the moment the level is EARNED rather than the next time
   * something happens to update the profile. Fires only on an actual promotion,
   * so the ordinary render of an unchanged level costs nothing.
   */
  useEffect(() => {
    if (standing.level > peak) {
      // Deliberately unawaited and deliberately silent: a badge is not worth
      // interrupting anyone over, and the next render recomputes the same
      // level from the same metrics whether or not this landed.
      void recordLevelPeak(standing.level).catch(() => {});
    }
  }, [standing.level, peak]);

  return (
    <section className="card flex items-center gap-4 p-4 sm:p-5">
      {/* The numeral, at a size that reads as an achievement rather than as a
          field label. */}
      <div
        className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-accent/10 text-accent"
        aria-hidden="true"
      >
        <span className="text-[10px] font-medium leading-none opacity-70">
          {t.lvLabel}
        </span>
        <span className="tnum text-2xl font-semibold leading-tight">{standing.level}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <p className="text-base font-semibold tracking-tight">{t[standing.tier.nameKey]}</p>
          <span className="text-xs text-muted">
            {standing.via === "value" ? t.lvViaValue : t.lvViaItems}
          </span>
        </div>

        {standing.next ? (
          <>
            <div
              className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line"
              role="progressbar"
              aria-valuenow={Math.round((standing.progress ?? 0) * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t.lvNext}
            >
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-500"
                style={{ width: `${Math.round((standing.progress ?? 0) * 100)}%` }}
              />
            </div>
            {/* Both routes to the next level, because which one is reachable
                depends entirely on what someone collects — and a card collector
                told only about a yen figure would read it as unreachable. */}
            <p className="mt-1.5 text-xs text-muted">
              {t.lvNext}:{" "}
              {fill(t.lvNextItems, { n: standing.itemsToNext ?? 0 })}
              {" "}{t.lvOr}{" "}
              {fill(t.lvNextValue, {
                amount: formatMoney(standing.valueToNextJpy ?? 0, "JPY", locale),
              })}
            </p>
          </>
        ) : (
          <p className="mt-1.5 text-xs text-muted">{t.lvMax}</p>
        )}
      </div>

      {/* The definition is one tap away rather than in the badge: a rule nobody
          can look up feels arbitrary, and a rule spelled out in the badge
          crowds out the thing the badge is for. */}
      <Link
        href="/levels"
        className="shrink-0 self-start rounded text-xs text-muted underline hover:text-ink"
      >
        {t.lvSee}
      </Link>
    </section>
  );
}
