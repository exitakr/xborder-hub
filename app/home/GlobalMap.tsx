"use client";

import { useMemo, useState } from "react";
import { CITIES, FLOWS, type City } from "./data";

/**
 * Editorial world map for the home hero. Japan-centred Pacific projection so
 * Tokyo — the most common origin — sits at the heart of the frame, with
 * career flows arcing outward to the world. Light, brand-aligned styling.
 *
 * Props are unchanged from the previous implementation so HomeClient keeps
 * working as-is: `highlightedFlow` (driven by the 移動トレンド buttons) lights
 * up a single route; `className` is forwarded to the root element.
 */

const VIEW_W = 1200;
const VIEW_H = 600;
const CENTER_LNG = 139.69; // Tokyo — keeps Japan dead-centre

/** Equirectangular projection, centred on Japan. */
function project(lng: number, lat: number): [number, number] {
  let l = lng - CENTER_LNG;
  if (l > 180) l -= 360;
  if (l < -180) l += 360;
  const x = ((l + 180) / 360) * VIEW_W;
  const y = ((90 - lat) / 180) * VIEW_H;
  return [x, y];
}

/** Gentle quadratic arc that always bows upward/outward. */
function arcPath(a: Pt, b: Pt): string {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = -dy / dist;
  const ny = dx / dist;
  const k = dist * 0.16;
  let cx = mx + nx * k;
  let cy = my + ny * k;
  if (cy > my) {
    cx = mx - nx * k;
    cy = my - ny * k;
  }
  return `M${a.x.toFixed(1)},${a.y.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(
    1,
  )} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
}

type Pt = { x: number; y: number };
type Positioned = City & Pt;

const BLUE = new Set(["NYC", "SFO", "LAX", "LON", "DXB", "SEA"]);

/** Big editorial labels — country (bold ink) over city (faint caps). */
type LabelDef = {
  code: string;
  country?: string;
  city?: string;
  anchor: "start" | "middle" | "end";
  ccx?: number;
  ccy?: number;
  csize?: number;
  scx?: number;
  scy?: number;
};
const LABELS: LabelDef[] = [
  { code: "TYO", country: "Japan", city: "TOKYO", anchor: "middle", ccx: 0, ccy: -42, csize: 30, scx: 0, scy: 60 },
  { code: "SIN", country: "Singapore", city: "SIN", anchor: "end", ccx: -14, ccy: 6, csize: 21, scx: -14, scy: 24 },
  { code: "NYC", country: "USA", city: "NEW YORK", anchor: "end", ccx: -12, ccy: -22, csize: 21, scx: -12, scy: -6 },
  { code: "SFO", city: "SAN FRANCISCO", anchor: "end", scx: -10, scy: 4 },
  { code: "LAX", city: "LOS ANGELES", anchor: "start", scx: 8, scy: 18 },
  { code: "LON", country: "UK", city: "LONDON", anchor: "start", ccx: 10, ccy: -8, csize: 21, scx: 10, scy: 11 },
  { code: "BER", country: "Germany", city: "BERLIN", anchor: "start", ccx: 8, ccy: 20, csize: 17, scx: 8, scy: 36 },
  { code: "DXB", country: "UAE", city: "DUBAI", anchor: "start", ccx: 10, ccy: 5, csize: 17, scx: 10, scy: 22 },
  { code: "BKK", country: "Thailand", city: "BANGKOK", anchor: "end", ccx: -10, ccy: 2, csize: 17, scx: -10, scy: 18 },
  { code: "SYD", country: "Australia", city: "SYDNEY", anchor: "start", ccx: 10, ccy: 0, csize: 19, scx: 10, scy: 16 },
  { code: "HKG", country: "Hong Kong", anchor: "end", ccx: -9, ccy: 5, csize: 17 },
  { code: "SEL", city: "SEOUL", anchor: "end", scx: -8, scy: -6 },
];

const FONT = "Manrope, 'Zen Kaku Gothic New', sans-serif";

export function GlobalMap({
  className,
  highlightedFlow,
}: {
  className?: string;
  highlightedFlow?: { from: string; to: string } | null;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  const positioned = useMemo<Positioned[]>(
    () =>
      CITIES.map((c) => {
        const [x, y] = project(c.lng, c.lat);
        return { ...c, x, y };
      }),
    [],
  );

  const lookup = useMemo(
    () => Object.fromEntries(positioned.map((c) => [c.code, c] as const)),
    [positioned],
  );

  // Top outbound routes from Tokyo get an animated comet + draw-on accent.
  const comets = useMemo(() => {
    return FLOWS.filter((f) => f.from === "TYO")
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((f) => {
        const a = lookup[f.from];
        const b = lookup[f.to];
        return a && b ? { d: arcPath(a, b), to: f.to } : null;
      })
      .filter(Boolean) as { d: string; to: string }[];
  }, [lookup]);

  const tokyo = lookup["TYO"];

  return (
    <div
      className={`${className ?? ""} relative w-full overflow-hidden rounded-xl aspect-[1200/375]`}
      style={{
        backgroundImage:
          "radial-gradient(60% 80% at 50% 38%, rgba(255,201,60,.16), transparent 60%)," +
          "radial-gradient(90% 90% at 50% 120%, rgba(31,168,158,.10), transparent 60%)," +
          "linear-gradient(180deg,#FFFFFF 0%, #F7F9FC 100%)",
      }}
    >
      <svg
        viewBox="0 90 1200 375"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full block select-none"
      >
        <defs>
          <linearGradient id="gm-arc" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0055A4" />
            <stop offset="100%" stopColor="#1FA89E" stopOpacity="0.12" />
          </linearGradient>
          <radialGradient id="gm-jp" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFE9A8" />
            <stop offset="42%" stopColor="#FFC93C" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#FFC93C" stopOpacity="0" />
          </radialGradient>
          <marker
            id="gm-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M0 0 L10 5 L0 10 z" fill="#0055A4" />
          </marker>
        </defs>

        {/* Soft abstract land masses (decorative) */}
        <g fill="#DCE6F1" opacity="0.55">
          <ellipse cx="330" cy="150" rx="265" ry="82" />
          <ellipse cx="540" cy="200" rx="155" ry="70" />
          <ellipse cx="240" cy="330" rx="122" ry="118" />
          <ellipse cx="590" cy="392" rx="84" ry="44" />
          <ellipse cx="1000" cy="170" rx="172" ry="102" />
          <ellipse cx="1110" cy="385" rx="92" ry="115" />
        </g>

        {/* All flows — faint network */}
        <g fill="none" strokeLinecap="round">
          {FLOWS.map((f, i) => {
            const a = lookup[f.from];
            const b = lookup[f.to];
            if (!a || !b) return null;
            const isHi =
              highlightedFlow &&
              f.from === highlightedFlow.from &&
              f.to === highlightedFlow.to;
            const dim = highlightedFlow && !isHi;
            return (
              <path
                key={i}
                d={arcPath(a, b)}
                stroke={isHi ? "#0055A4" : "url(#gm-arc)"}
                strokeWidth={isHi ? 3.2 : 1.8}
                opacity={isHi ? 1 : dim ? 0.08 : 0.5}
                markerEnd={isHi ? "url(#gm-arrow)" : undefined}
              />
            );
          })}
        </g>

        {/* Animated draw-on accents + comets on the top Tokyo routes */}
        {!highlightedFlow &&
          comets.map((c, i) => (
            <g key={c.to}>
              <path
                d={c.d}
                fill="none"
                stroke={i % 2 === 0 ? "#0055A4" : "#1FA89E"}
                strokeWidth="2"
                strokeLinecap="round"
                pathLength={100}
                strokeDasharray="100"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  values="100;0;0"
                  keyTimes="0;0.7;1"
                  dur="5.5s"
                  begin={`${i * 1.1}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0;0.9;0"
                  keyTimes="0;0.5;1"
                  dur="5.5s"
                  begin={`${i * 1.1}s`}
                  repeatCount="indefinite"
                />
              </path>
              <circle r="3" fill={i % 2 === 0 ? "#0055A4" : "#1FA89E"}>
                <animateMotion
                  dur={`${2.8 + i * 0.3}s`}
                  begin={`${i * 0.5}s`}
                  repeatCount="indefinite"
                  path={c.d}
                />
              </circle>
            </g>
          ))}

        {/* City dots (Tokyo rendered separately as the glowing heart) */}
        <g>
          {positioned
            .filter((c) => c.code !== "TYO")
            .map((c) => {
              const r = c.tier === 1 ? 3.8 : c.tier === 2 ? 3 : 2.4;
              const isHi =
                highlightedFlow &&
                (c.code === highlightedFlow.from ||
                  c.code === highlightedFlow.to);
              const color = isHi
                ? "#0055A4"
                : BLUE.has(c.code)
                  ? "#0055A4"
                  : "#1FA89E";
              const dim = highlightedFlow && !isHi;
              return (
                <circle
                  key={c.code}
                  cx={c.x}
                  cy={c.y}
                  r={r + (isHi ? 1.4 : 0)}
                  fill={color}
                  opacity={dim ? 0.3 : 1}
                  stroke="#FFFFFF"
                  strokeWidth="1"
                  onMouseEnter={() => setHovered(c.code)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor: "pointer" }}
                />
              );
            })}
        </g>

        {/* Tokyo — glowing heart at the centre */}
        {tokyo && (
          <g>
            <circle cx={tokyo.x} cy={tokyo.y} r="16" fill="none" stroke="#FFC93C" strokeWidth="1.4">
              <animate attributeName="r" values="16;58" dur="3.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0" dur="3.6s" repeatCount="indefinite" />
            </circle>
            <circle cx={tokyo.x} cy={tokyo.y} r="16" fill="none" stroke="#FFC93C" strokeWidth="1">
              <animate attributeName="r" values="16;90" dur="3.6s" begin="0.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.38;0" dur="3.6s" begin="0.6s" repeatCount="indefinite" />
            </circle>
            <circle cx={tokyo.x} cy={tokyo.y} r="54" fill="url(#gm-jp)" />
            <circle cx={tokyo.x} cy={tokyo.y} r="8.5" fill="#0055A4" stroke="#FFFFFF" strokeWidth="2.5" />
          </g>
        )}

        {/* Big editorial labels */}
        <g>
          {LABELS.map((l) => {
            const c = lookup[l.code];
            if (!c) return null;
            const isHi =
              highlightedFlow &&
              (l.code === highlightedFlow.from ||
                l.code === highlightedFlow.to);
            const dim = highlightedFlow && !isHi && l.code !== "TYO";
            return (
              <g key={l.code} opacity={dim ? 0.3 : 1}>
                {l.country && (
                  <text
                    x={c.x + (l.ccx ?? 0)}
                    y={c.y + (l.ccy ?? 0)}
                    fontFamily={FONT}
                    fontSize={l.csize ?? 20}
                    fontWeight={700}
                    fill="#0A1F3D"
                    textAnchor={l.anchor}
                    paintOrder="stroke"
                    stroke="#FFFFFF"
                    strokeWidth={3.5}
                    pointerEvents="none"
                  >
                    {l.country}
                  </text>
                )}
                {l.city && (
                  <text
                    x={c.x + (l.scx ?? 0)}
                    y={c.y + (l.scy ?? 0)}
                    fontFamily={FONT}
                    fontSize={11}
                    fontWeight={600}
                    fill={l.code === "TYO" ? "#003C7A" : "#94A3B8"}
                    textAnchor={l.anchor}
                    letterSpacing="0.12em"
                    paintOrder="stroke"
                    stroke="#FFFFFF"
                    strokeWidth={2.5}
                    pointerEvents="none"
                  >
                    {l.city}
                  </text>
                )}
              </g>
            );
          })}

          {/* Hover label for any unlabelled city */}
          {hovered &&
            !LABELS.some((l) => l.code === hovered) &&
            lookup[hovered] && (
              <text
                x={lookup[hovered]!.x}
                y={lookup[hovered]!.y - 8}
                fontFamily={FONT}
                fontSize={12}
                fontWeight={700}
                fill="#0A1F3D"
                textAnchor="middle"
                paintOrder="stroke"
                stroke="#FFFFFF"
                strokeWidth={3}
                pointerEvents="none"
              >
                {lookup[hovered]!.name}
              </text>
            )}
        </g>
      </svg>
    </div>
  );
}
