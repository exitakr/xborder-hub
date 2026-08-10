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
import {
  RANGES,
  formatMoney,
  formatPercent,
  windowSeries,
  type Currency,
  type Locale,
  type Range,
} from "@oma/core";

export interface ValuePoint {
  ts: number;
  value: number;
}

export { RANGES, type Range };

/**
 * Recharts takes colours as props, not classes, so the theme tokens have to be
 * read out of the document rather than applied by Tailwind. Resolved on every
 * render so a theme switch repaints the chart with everything else.
 */
function themeColor(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(`--c-${name}`).trim();
  return raw ? `rgb(${raw})` : fallback;
}

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

  const shown = useMemo(() => windowSeries(points, range), [points, range]);

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
  const stroke =
    last > first
      ? themeColor("gain", "#0E9F6E")
      : last < first
        ? themeColor("loss", "#E02424")
        : themeColor("accent", "#1F6FEB");
  const grid = themeColor("line", "#E4E7EC");
  const axis = themeColor("muted", "#6B7480");
  const panel = themeColor("surface", "#FFFFFF");
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

          <CartesianGrid stroke={grid} vertical={false} />
          <XAxis
            dataKey="ts"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(ts) => shortDate(ts, locale)}
            tick={{ fill: axis, fontSize: 11 }}
            stroke={grid}
            minTickGap={40}
          />
          <YAxis
            domain={[Math.max(0, min - pad), max + pad]}
            tickFormatter={(v) => compact(v, locale)}
            tick={{ fill: axis, fontSize: 11 }}
            stroke={grid}
            width={56}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: `1px solid ${grid}`,
              background: panel,
              fontSize: 12,
            }}
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
