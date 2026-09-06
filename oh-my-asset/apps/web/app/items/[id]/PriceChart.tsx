"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney, type Currency } from "@oma/core";
import type { Locale } from "@oma/core";

export interface ChartPoint {
  /** Epoch ms — a numeric axis keeps gaps in the daily series honest. */
  ts: number;
  price: number;
}

export interface TradeMarker {
  ts: number;
  type: "buy" | "sell";
  quantity: number;
  unitPrice: number;
}

interface Props {
  points: ChartPoint[];
  /**
   * Monthly medians of what users reported selling for. Kept as its own series
   * rather than merged into `points`: these are realised prices from the crowd,
   * where `points` are asking prices from a venue, and averaging the two
   * together would produce a figure neither source ever quoted.
   */
  community?: ChartPoint[];
  markers: TradeMarker[];
  currency: Currency;
  locale: Locale;
  labels: { buy: string; sell: string; empty: string; asking: string; realised: string };
}

/**
 * Recharts takes colours as props rather than classes, so the theme tokens are
 * read from the document instead of applied by Tailwind. Re-read on render, so
 * switching theme repaints the chart along with everything around it.
 */
function themeColor(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(`--c-${name}`).trim();
  return raw ? `rgb(${raw})` : fallback;
}

/**
 * Price history with the user's own trades overlaid (SPEC §6.3).
 *
 * The markers are the point of this screen: seeing where you bought against
 * where the price went is the reason to come back. Each one is plotted at the
 * date it happened and the price that was paid — both facts we hold exactly.
 * They used to be snapped onto the nearest snapshot instead, which put a trade
 * from two years ago on last week's price; with the catalogue only days old,
 * every marker collapsed onto the same point and the timing they exist to show
 * was the one thing they could not show.
 *
 * The axis therefore spans the trades as well as the observations. Market
 * history that predates this deployment cannot be bought back (docs/RESEARCH.md
 * §7.2.1), but the user's own history goes back as far as they have recorded,
 * and the window has to reach it for the position to be legible.
 */
export function PriceChart({
  points,
  community = [],
  markers,
  currency,
  locale,
  labels,
}: Props) {
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const data = useMemo(() => mergeSeries(points, community), [points, community]);

  const ASKING = themeColor("accent", "#1F6FEB");
  const REALISED = themeColor("gain", "#10B981");
  const SELL = themeColor("sell", "#F59E0B");
  const grid = themeColor("line", "#E4E7EC");
  const axis = themeColor("muted", "#6B7480");
  const panel = themeColor("surface", "#FFFFFF");

  if (data.length === 0 && markers.length === 0) {
    return (
      <p className="flex h-56 items-center justify-center text-center text-sm text-muted">
        {labels.empty}
      </p>
    );
  }

  // Every plotted thing has to fit: both price series and every trade, on both
  // axes. Leaving trades out of the domain silently clips them off the edge.
  const prices = [
    ...points.map((p) => p.price),
    ...community.map((p) => p.price),
    ...markers.map((m) => m.unitPrice),
  ];
  const times = [
    ...points.map((p) => p.ts),
    ...community.map((p) => p.ts),
    ...markers.map((m) => m.ts),
  ];

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const pad = (max - min || max || 1) * 0.12;

  // A single instant gives a zero-width axis, which Recharts renders as an empty
  // plot. Widen it to a day so the point has somewhere to sit.
  const tMin = Math.min(...times);
  const tMax = Math.max(...times);
  const tPad = tMax === tMin ? 43_200_000 : 0;

  return (
    <div className="h-56 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 12, bottom: 4, left: 4 }}>
          <CartesianGrid stroke={grid} vertical={false} />
          <XAxis
            dataKey="ts"
            type="number"
            scale="time"
            domain={[tMin - tPad, tMax + tPad]}
            tickFormatter={(ts) => shortDate(ts, locale)}
            tick={{ fill: axis, fontSize: 11 }}
            stroke={grid}
            minTickGap={32}
          />
          <YAxis
            domain={[Math.max(0, min - pad), max + pad]}
            tickFormatter={(v) => compact(v, locale)}
            tick={{ fill: axis, fontSize: 11 }}
            stroke={grid}
            width={52}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: `1px solid ${grid}`,
              background: panel,
              fontSize: 12,
            }}
            labelFormatter={(ts) => shortDate(Number(ts), locale)}
            formatter={(value: number | string, key: number | string) => [
              formatMoney(Number(value), currency, locale),
              key === "community" ? labels.realised : labels.asking,
            ]}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke={ASKING}
            strokeWidth={2}
            // A short series has to show its points: one observation draws a
            // zero-length line, which renders as an empty chart and reads as a
            // bug rather than as "we have one day of data so far".
            dot={points.length <= 8 ? { r: 3, fill: ASKING } : false}
            connectNulls
            isAnimationActive={!prefersReducedMotion}
          />
          {community.length > 0 && (
            <Line
              type="monotone"
              dataKey="community"
              stroke={REALISED}
              strokeWidth={2}
              // Dashed and always dotted: monthly aggregates are sparse by
              // construction, and a solid line between two of them would imply
              // observations on the days in between that nobody reported.
              strokeDasharray="5 3"
              dot={{ r: 3, fill: REALISED }}
              connectNulls
              isAnimationActive={!prefersReducedMotion}
            />
          )}

          {markers.map((m, i) => (
            <ReferenceDot
              key={`${m.ts}-${i}`}
              x={m.ts}
              y={m.unitPrice}
              r={9}
              fill={m.type === "buy" ? ASKING : SELL}
              stroke={panel}
              strokeWidth={2}
              isFront
              label={{
                value: m.type === "buy" ? "B" : "S",
                fill: "#FFFFFF",
                fontSize: 10,
                fontWeight: 700,
                position: "center",
              }}
            />
          ))}

          {/*
            * The price beside the dot, drawn rather than revealed on hover.
            *
            * Recharts' tooltip follows the data series; a ReferenceDot is an
            * annotation and never triggers it, so hovering a marker showed
            * nothing at all. Rebuilding the trades as a real series to inherit
            * the tooltip would put them on the price line, which is the one
            * thing they must not be confused with. And half the readers are on
            * a phone, where there is no hover to reveal anything with — so the
            * figure is simply always on screen.
            */}
          {markers.map((m, i) => (
            <ReferenceDot
              key={`label-${m.ts}-${i}`}
              x={m.ts}
              y={m.unitPrice}
              r={0}
              isFront
              label={{
                value: `${compact(m.unitPrice, locale)} · ${shortDate(m.ts, locale)}`,
                fill: axis,
                fontSize: 10,
                position: "top",
                offset: 12,
              }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-muted">
        <SeriesKey color={ASKING} label={labels.asking} />
        {community.length > 0 && <SeriesKey color={REALISED} label={labels.realised} dashed />}
        <Legend color={ASKING} letter="B" label={labels.buy} />
        <Legend color={SELL} letter="S" label={labels.sell} />
      </div>
    </div>
  );
}

function SeriesKey({
  color,
  label,
  dashed = false,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="h-0.5 w-5 rounded-full"
        style={
          dashed
            ? { backgroundImage: `repeating-linear-gradient(to right, ${color} 0 5px, transparent 5px 8px)` }
            : { background: color }
        }
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

/**
 * One row per timestamp across both series.
 *
 * Recharts needs a single dataset, and the two series rarely share dates: the
 * asking price lands daily, community medians land monthly. Missing values stay
 * `undefined` so `connectNulls` bridges them instead of a gap being read as a
 * price of zero.
 */
function mergeSeries(
  points: readonly ChartPoint[],
  community: readonly ChartPoint[],
): Array<{ ts: number; price?: number; community?: number }> {
  const byTs = new Map<number, { ts: number; price?: number; community?: number }>();

  for (const p of points) {
    byTs.set(p.ts, { ...(byTs.get(p.ts) ?? { ts: p.ts }), price: p.price });
  }
  for (const c of community) {
    byTs.set(c.ts, { ...(byTs.get(c.ts) ?? { ts: c.ts }), community: c.price });
  }

  return [...byTs.values()].sort((a, b) => a.ts - b.ts);
}

function Legend({ color, letter, label }: { color: string; letter: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
        style={{ background: color }}
        aria-hidden="true"
      >
        {letter}
      </span>
      {label}
    </span>
  );
}

function shortDate(ts: number, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ja" ? "ja-JP" : "en-SG", {
    month: "short",
    day: "numeric",
  }).format(new Date(ts));
}

function compact(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ja" ? "ja-JP" : "en-SG", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
