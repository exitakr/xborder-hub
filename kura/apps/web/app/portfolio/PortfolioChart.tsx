"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney, formatPercent, type Currency, type Locale } from "@oma/core";

export interface ValuePoint {
  ts: number;
  value: number;
}

export const RANGES = ["1w", "1m", "ytd", "all"] as const;
export type Range = (typeof RANGES)[number];

/**
 * Earliest timestamp a range admits, or null for "everything".
 *
 * Year-to-date is anchored to 1 January in local time rather than "365 days
 * ago": those are different questions, and the one a brokerage screen answers
 * is the calendar one.
 */
function startOf(range: Range, now: Date): number | null {
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

const GAIN = "#0E9F6E";
const LOSS = "#E02424";
const FLAT = "#1F6FEB";

/**
 * Total portfolio value over time.
 *
 * A filled area rather than the bare line the item screen uses: this is the
 * first thing on the first screen, and the shape of the fill is what makes a
 * direction readable at a glance without reading either axis. Coloured by the
 * move over the whole window, so the chart agrees with the gain/loss figure
 * printed directly above it instead of quietly telling a different story.
 *
 * The empty state is rendered here rather than by the caller hiding the whole
 * section. A missing chart reads as a missing feature; a chart that says what
 * it is waiting for reads as a chart with nothing to draw yet — and until the
 * daily refresh has run more than once, that is the honest description.
 */
export function PortfolioChart({
  points,
  currency,
  locale,
  emptyLabel,
  rangeLabels,
}: {
  points: ValuePoint[];
  currency: Currency;
  locale: Locale;
  emptyLabel: string;
  rangeLabels: Record<Range, string>;
}) {
  const [range, setRange] = useState<Range>("1m");

  /**
   * The window, plus the last point before it.
   *
   * Without that leading point a 1-week view of a series whose most recent
   * observation is ten days old would be empty, and the reading would be "no
   * data" rather than "flat" — which is wrong, since the value is known and
   * simply has not moved.
   */
  const shown = useMemo(() => {
    const from = startOf(range, new Date());
    if (from === null) return points;

    const inWindow = points.filter((p) => p.ts >= from);
    const before = points.filter((p) => p.ts < from).at(-1);
    return before ? [{ ...before, ts: from }, ...inWindow] : inWindow;
  }, [points, range]);

  const selector = (
    <div className="mb-3 flex gap-1" role="group">
      {RANGES.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => setRange(r)}
          aria-pressed={range === r}
          className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
            range === r ? "bg-accent text-white" : "text-muted hover:bg-canvas hover:text-ink"
          }`}
        >
          {rangeLabels[r]}
        </button>
      ))}
    </div>
  );

  if (shown.length === 0) {
    return (
      <>
        {selector}
        <p className="flex h-48 items-center justify-center px-6 text-center text-sm text-muted">
          {emptyLabel}
        </p>
      </>
    );
  }

  const first = shown[0].value;
  const last = shown[shown.length - 1].value;
  const stroke = last > first ? GAIN : last < first ? LOSS : FLAT;
  const changePct = first > 0 ? (last - first) / first : null;

  const values = shown.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  // Anchor the fill near the data rather than at zero: a portfolio that moved
  // 2% would otherwise be a flat line at the top of an empty box.
  const pad = (max - min || max || 1) * 0.15;

  // A single observation has no line to draw, so the point itself has to be
  // visible or the chart looks broken rather than new.
  const dot = shown.length <= 8 ? { r: 3, fill: stroke, strokeWidth: 0 } : false;

  return (
    <>
      {selector}

      {/* The move over the selected window, not over all time — otherwise
          switching range would change the chart and leave the number stale. */}
      <div className="mb-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        {changePct !== null && (
          <p className="tnum text-sm font-medium" style={{ color: stroke }}>
            {last >= first ? "+" : ""}
            {formatMoney(last - first, currency, locale)} ({formatPercent(changePct, locale)})
          </p>
        )}
        {/* The window actually drawn. Early on, every range holds the same one
            or two points, so the selector appears to do nothing — saying which
            dates are on screen is what distinguishes "not working" from
            "there is only one day of history so far". */}
        <p className="tnum text-xs text-muted">
          {shown.length === 1
            ? longDate(shown[0].ts, locale)
            : `${shortDate(shown[0].ts, locale)} – ${shortDate(shown[shown.length - 1].ts, locale)}`}
          {` · ${shown.length}`}
        </p>
      </div>

      <div className="h-48 w-full sm:h-60">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={shown} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="pf-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.22} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="#E4E7EC" vertical={false} />
          <XAxis
            dataKey="ts"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(ts) => shortDate(ts, locale)}
            tick={{ fill: "#6B7480", fontSize: 11 }}
            stroke="#E4E7EC"
            minTickGap={40}
          />
          <YAxis
            domain={[Math.max(0, min - pad), max + pad]}
            tickFormatter={(v) => compact(v, locale)}
            tick={{ fill: "#6B7480", fontSize: 11 }}
            stroke="#E4E7EC"
            width={56}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid #E4E7EC", fontSize: 12 }}
            labelFormatter={(ts) => longDate(Number(ts), locale)}
            formatter={(value: number | string) => [
              formatMoney(Number(value), currency, locale),
              "",
            ]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={stroke}
            strokeWidth={2}
            fill="url(#pf-fill)"
            dot={dot}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
      </div>
    </>
  );
}

function intl(locale: Locale): string {
  return locale === "ja" ? "ja-JP" : "en-SG";
}

function shortDate(ts: number, locale: Locale): string {
  return new Intl.DateTimeFormat(intl(locale), { month: "short", day: "numeric" }).format(
    new Date(ts),
  );
}

function longDate(ts: number, locale: Locale): string {
  return new Intl.DateTimeFormat(intl(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(ts));
}

/** Axis labels stay short — 1.2M rather than the full figure. */
function compact(value: number, locale: Locale): string {
  return new Intl.NumberFormat(intl(locale), {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
