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
  /** What was actually paid. Markers are plotted here, not on the price line. */
  unitPrice: number;
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
  community = [],
  markers,
  currency,
  locale,
  labels,
  height = 200,
}: {
  points: ChartPoint[];
  /**
   * Monthly medians of what users reported selling for. Drawn as its own dashed
   * series rather than merged into `points`: those are asking prices from a
   * venue, these are realised prices from the crowd, and one line through both
   * would show a figure neither source ever quoted.
   */
  community?: ChartPoint[];
  markers: TradeMarker[];
  currency: Currency;
  locale: Locale;
  labels: { buy: string; sell: string; empty: string; asking: string; realised: string };
  height?: number;
}) {
  const [width, setWidth] = useState(0);

  if (points.length === 0 && community.length === 0 && markers.length === 0) {
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

  // Every plotted thing has to fit on both axes: the two price series and every
  // trade. Leaving trades out silently clips them off the edge.
  const all = [...points, ...community];
  const times = [...all.map((p) => p.ts), ...markers.map((m) => m.ts)];
  const prices = [...all.map((p) => p.price), ...markers.map((m) => m.unitPrice)];
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

  const toPath = (series: readonly ChartPoint[]) =>
    series
      .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.ts).toFixed(1)},${y(p.price).toFixed(1)}`)
      .join(" ");

  const path = toPath(points);
  const communityPath = toPath(community);

  // Each trade sits at the date it happened and the price that was paid — both
  // facts we hold exactly. Snapping them onto the nearest observation instead
  // put a trade from two years ago on last week's price, and with only days of
  // history every marker collapsed onto the same point.
  const snapped = markers.map((m) => ({
    cx: x(m.ts),
    cy: y(m.unitPrice),
    type: m.type,
  }));

  // The end labels describe the window actually drawn, which includes trades —
  // a holding with recorded trades but no observations yet has nothing in `all`
  // and would otherwise read these off an empty array.
  const ordered = [
    ...all,
    ...markers.map((m) => ({ ts: m.ts, price: m.unitPrice })),
  ].sort((a, b) => a.ts - b.ts);
  const first = ordered[0];
  const last = ordered[ordered.length - 1];

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

            {/* A short series has to show its points: one observation draws a
                zero-length path, which renders as an empty chart and reads as a
                bug rather than as "we have one day of data so far". */}
            {points.length <= 8 &&
              points.map((p) => (
                <Circle
                  key={p.ts}
                  cx={x(p.ts)}
                  cy={y(p.price)}
                  r={3}
                  fill={theme.color.accent}
                />
              ))}

            {/* Dashed, and always dotted: monthly aggregates are sparse by
                construction, so a solid line between two of them would imply
                observations on the days in between that nobody reported. */}
            {community.length > 0 && (
              <>
                <Path
                  d={communityPath}
                  fill="none"
                  stroke={theme.color.gain}
                  strokeWidth={2}
                  strokeDasharray="5,3"
                />
                {community.map((p) => (
                  <Circle
                    key={`c-${p.ts}`}
                    cx={x(p.ts)}
                    cy={y(p.price)}
                    r={3}
                    fill={theme.color.gain}
                  />
                ))}
              </>
            )}

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
          flexWrap: "wrap",
          justifyContent: "center",
          columnGap: 16,
          rowGap: 6,
          marginTop: theme.space(2),
        }}
      >
        <LegendLine color={theme.color.accent} label={labels.asking} />
        {community.length > 0 && (
          <LegendLine color={theme.color.gain} label={labels.realised} dashed />
        )}
        <LegendDot color={theme.color.buy} letter="B" label={labels.buy} />
        <LegendDot color={theme.color.sell} letter="S" label={labels.sell} />
      </View>
    </View>
  );
}

/**
 * Key for a plotted series. The dashed variant is drawn as three short segments
 * rather than with a border style, which React Native does not offer per-edge in
 * a way that survives a 20px-wide view.
 */
function LegendLine({
  color,
  label,
  dashed = false,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      {dashed ? (
        <View style={{ flexDirection: "row", gap: 2, alignItems: "center" }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ width: 5, height: 2, backgroundColor: color }} />
          ))}
        </View>
      ) : (
        <View style={{ width: 20, height: 2, backgroundColor: color }} />
      )}
      <Text style={{ fontSize: 11, color: theme.color.muted }}>{label}</Text>
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
