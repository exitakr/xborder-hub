import React, { useState } from "react";
import { Text, View } from "react-native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";
import { formatMoney, type Currency, type Locale } from "@kura/core";
import { theme } from "../theme";
import { intlLocale } from "../i18n";

export interface ChartPoint {
  ts: number;
  price: number;
}

export interface TradeMarker {
  ts: number;
  type: "buy" | "sell";
}

/**
 * Price history with the user's own trades overlaid (SPEC §6.3).
 *
 * Hand-drawn with react-native-svg rather than a charting library: the only
 * thing that matters here is the line plus the B/S markers, and a dedicated
 * implementation is both smaller and easier to keep visually identical to the
 * web app than configuring a general-purpose chart.
 */
export function PriceChart({
  points,
  markers,
  currency,
  locale,
  labels,
  height = 200,
}: {
  points: ChartPoint[];
  markers: TradeMarker[];
  currency: Currency;
  locale: Locale;
  labels: { buy: string; sell: string; empty: string };
  height?: number;
}) {
  const [width, setWidth] = useState(0);

  if (points.length === 0) {
    return (
      <View style={{ height, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: theme.color.muted, fontSize: 13, textAlign: "center" }}>
          {labels.empty}
        </Text>
      </View>
    );
  }

  const padLeft = 8;
  const padRight = 8;
  const padTop = 14;
  const padBottom = 22;
  const plotW = Math.max(width - padLeft - padRight, 1);
  const plotH = height - padTop - padBottom;

  const times = points.map((p) => p.ts);
  const prices = points.map((p) => p.price);
  const tMin = Math.min(...times);
  const tMax = Math.max(...times);
  const pMin = Math.min(...prices);
  const pMax = Math.max(...prices);

  // Pad the value axis so a flat series does not collapse onto one line.
  const spread = pMax - pMin || pMax || 1;
  const yMin = Math.max(0, pMin - spread * 0.12);
  const yMax = pMax + spread * 0.12;

  const x = (ts: number) =>
    padLeft + (tMax === tMin ? plotW / 2 : ((ts - tMin) / (tMax - tMin)) * plotW);
  const y = (price: number) =>
    padTop + plotH - ((price - yMin) / (yMax - yMin || 1)) * plotH;

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.ts).toFixed(1)},${y(p.price).toFixed(1)}`)
    .join(" ");

  // Snap each trade to the nearest observation so no marker floats off the line.
  const snapped = markers.map((m) => {
    let nearest = points[0];
    let best = Math.abs(points[0].ts - m.ts);
    for (const p of points) {
      const d = Math.abs(p.ts - m.ts);
      if (d < best) {
        best = d;
        nearest = p;
      }
    }
    return { cx: x(nearest.ts), cy: y(nearest.price), type: m.type };
  });

  const first = points[0];
  const last = points[points.length - 1];

  return (
    <View>
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={{ height }}
        accessible
        accessibilityRole="image"
        // A screen reader cannot read a line, so state the range and the latest
        // value — the two things the chart is actually communicating.
        accessibilityLabel={[
          `${shortDate(first.ts, locale)} – ${shortDate(last.ts, locale)}`,
          formatMoney(last.price, currency, locale),
          markers.length > 0 ? `${markers.length}` : "",
        ]
          .filter(Boolean)
          .join(", ")}
      >
        {width > 0 && (
          <Svg width={width} height={height}>
            <Line
              x1={padLeft}
              y1={padTop + plotH}
              x2={padLeft + plotW}
              y2={padTop + plotH}
              stroke={theme.color.line}
              strokeWidth={1}
            />
            <Path d={path} fill="none" stroke={theme.color.accent} strokeWidth={2} />

            {snapped.map((m, i) => (
              <React.Fragment key={`${m.cx}-${i}`}>
                <Circle
                  cx={m.cx}
                  cy={m.cy}
                  r={9}
                  fill={m.type === "buy" ? theme.color.buy : theme.color.sell}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
                <SvgText
                  x={m.cx}
                  y={m.cy + 3.5}
                  fontSize={10}
                  fontWeight="700"
                  fill="#FFFFFF"
                  textAnchor="middle"
                >
                  {m.type === "buy" ? "B" : "S"}
                </SvgText>
              </React.Fragment>
            ))}
          </Svg>
        )}
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 11, color: theme.color.muted }}>
          {shortDate(first.ts, locale)}
        </Text>
        <Text style={{ fontSize: 11, color: theme.color.muted }}>
          {shortDate(last.ts, locale)}
        </Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          gap: 16,
          marginTop: theme.space(2),
        }}
      >
        <LegendDot color={theme.color.buy} letter="B" label={labels.buy} />
        <LegendDot color={theme.color.sell} letter="S" label={labels.sell} />
      </View>
    </View>
  );
}

function LegendDot({
  color,
  letter,
  label,
}: {
  color: string;
  letter: string;
  label: string;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View
        style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: color,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 9, fontWeight: "700", color: "#FFFFFF" }}>{letter}</Text>
      </View>
      <Text style={{ fontSize: 11, color: theme.color.muted }}>{label}</Text>
    </View>
  );
}

function shortDate(ts: number, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(ts));
}
