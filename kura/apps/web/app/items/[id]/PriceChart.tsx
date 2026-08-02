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
import { formatMoney, type Currency } from "@kura/core";
import type { Locale } from "@kura/core";

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
  markers: TradeMarker[];
  currency: Currency;
  locale: Locale;
  labels: { buy: string; sell: string; empty: string };
}

/**
 * Price history with the user's own trades overlaid (SPEC §6.3).
 *
 * The markers are the point of this screen: seeing where you bought against
 * where the price went is the reason to come back. Each trade snaps to the
 * nearest snapshot, since a trade on a day we have no observation for still has
 * to land somewhere sensible on the line.
 */
export function PriceChart({ points, markers, currency, locale, labels }: Props) {
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const snapped = useMemo(() => snapMarkers(points, markers), [points, markers]);

  if (points.length === 0) {
    return (
      <p className="flex h-56 items-center justify-center text-center text-sm text-muted">
        {labels.empty}
      </p>
    );
  }

  const prices = points.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const pad = (max - min || max || 1) * 0.12;

  return (
    <div className="h-56 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 12, right: 12, bottom: 4, left: 4 }}>
          <CartesianGrid stroke="#E4E7EC" vertical={false} />
          <XAxis
            dataKey="ts"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(ts) => shortDate(ts, locale)}
            tick={{ fill: "#6B7480", fontSize: 11 }}
            stroke="#E4E7EC"
            minTickGap={32}
          />
          <YAxis
            domain={[Math.max(0, min - pad), max + pad]}
            tickFormatter={(v) => compact(v, locale)}
            tick={{ fill: "#6B7480", fontSize: 11 }}
            stroke="#E4E7EC"
            width={52}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #E4E7EC",
              fontSize: 12,
            }}
            labelFormatter={(ts) => shortDate(Number(ts), locale)}
            formatter={(value: number | string) => [
              formatMoney(Number(value), currency, locale),
              "",
            ]}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#1F6FEB"
            strokeWidth={2}
            dot={false}
            isAnimationActive={!prefersReducedMotion}
          />

          {snapped.map((m, i) => (
            <ReferenceDot
              key={`${m.ts}-${i}`}
              x={m.ts}
              y={m.y}
              r={9}
              fill={m.type === "buy" ? "#1F6FEB" : "#F59E0B"}
              stroke="#FFFFFF"
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
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted">
        <Legend color="#1F6FEB" letter="B" label={labels.buy} />
        <Legend color="#F59E0B" letter="S" label={labels.sell} />
      </div>
    </div>
  );
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

/** Place each trade on the nearest snapshot so no marker floats off the line. */
function snapMarkers(
  points: readonly ChartPoint[],
  markers: readonly TradeMarker[],
): Array<{ ts: number; y: number; type: "buy" | "sell" }> {
  if (points.length === 0) return [];

  return markers.map((m) => {
    let nearest = points[0];
    let best = Math.abs(points[0].ts - m.ts);

    for (const p of points) {
      const distance = Math.abs(p.ts - m.ts);
      if (distance < best) {
        best = distance;
        nearest = p;
      }
    }
    return { ts: nearest.ts, y: nearest.price, type: m.type };
  });
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
