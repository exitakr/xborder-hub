"use client";

import { useMemo, useState } from "react";
import { CITIES, FLOWS, type City } from "./data";

const VIEW_W = 720;
const VIEW_H = 360;

/** Equirectangular projection from (lng, lat) to SVG coords. */
function project(lng: number, lat: number): [number, number] {
  // Center the map around lng=10 so Asia + Americas both visible.
  // Shift longitudes into [-180, 180) range relative to centerLng.
  const centerLng = 10;
  let l = lng - centerLng;
  if (l > 180) l -= 360;
  if (l < -180) l += 360;
  const x = ((l + 180) / 360) * VIEW_W;
  const y = ((90 - lat) / 180) * VIEW_H;
  return [x, y];
}

const TIER_RADIUS = { 1: 6, 2: 4.5, 3: 3.5 } as const;
const TIER_COLOR = { 1: "#0055A4", 2: "#0A1F3D", 3: "#3A4658" } as const;
const TIER_FONT = { 1: 12, 2: 10, 3: 9 } as const;

/**
 * Highly simplified continent silhouettes used purely as visual anchors
 * behind the city dots. Coordinates target the 720x360 equirectangular
 * canvas above. These are not geographically accurate — they exist to keep
 * the map from looking like a flat dot grid.
 */
const CONTINENTS: string[] = [
  // North America
  "M70 90 Q110 70 165 80 Q195 95 200 130 Q205 175 165 200 Q120 215 100 195 Q75 175 70 145 Z",
  // Central America
  "M180 200 Q205 210 215 230 Q205 240 195 235 Q185 225 180 215 Z",
  // South America
  "M205 215 Q235 215 245 240 Q250 280 230 315 Q210 335 195 320 Q185 290 195 250 Z",
  // Europe
  "M345 90 Q380 80 410 95 Q420 115 405 130 Q380 140 360 130 Q345 115 345 100 Z",
  // Africa
  "M360 145 Q400 145 420 175 Q425 220 405 255 Q380 275 365 260 Q345 220 350 175 Z",
  // Asia
  "M420 80 Q485 75 555 100 Q605 125 600 165 Q580 195 530 195 Q470 195 435 165 Q420 135 420 100 Z",
  // SE Asia archipelago
  "M540 210 Q570 210 585 225 Q580 240 555 235 Q535 230 535 220 Z",
  // Oceania
  "M585 270 Q625 270 645 290 Q635 310 605 310 Q585 305 580 290 Z",
];

type Props = {
  className?: string;
};

export function GlobalMap({ className }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  const positioned = useMemo<(City & { x: number; y: number })[]>(() => {
    return CITIES.map((c) => {
      const [x, y] = project(c.lng, c.lat);
      return { ...c, x, y };
    });
  }, []);

  const lookup = useMemo(
    () => Object.fromEntries(positioned.map((c) => [c.code, c] as const)),
    [positioned],
  );

  const maxFlow = useMemo(
    () => FLOWS.reduce((m, f) => Math.max(m, f.count), 0),
    [],
  );

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="flow-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0055A4" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#0055A4" stopOpacity="0.9" />
          </linearGradient>
          <marker
            id="flow-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M0 0 L10 5 L0 10 z" fill="#0055A4" />
          </marker>
        </defs>

        {/* Background grid: equator + tropics + a few meridians */}
        <g stroke="#0A1F3D" strokeWidth="0.4" opacity="0.07">
          <line x1="0" y1={VIEW_H / 2} x2={VIEW_W} y2={VIEW_H / 2} />
          <line x1={VIEW_W / 4} y1="0" x2={VIEW_W / 4} y2={VIEW_H} />
          <line x1={VIEW_W / 2} y1="0" x2={VIEW_W / 2} y2={VIEW_H} />
          <line
            x1={(VIEW_W * 3) / 4}
            y1="0"
            x2={(VIEW_W * 3) / 4}
            y2={VIEW_H}
          />
        </g>

        {/* Continents */}
        <g fill="#0A1F3D" opacity="0.06">
          {CONTINENTS.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>

        {/* Flows */}
        <g>
          {FLOWS.map((flow, i) => {
            const a = lookup[flow.from];
            const b = lookup[flow.to];
            if (!a || !b) return null;
            const active =
              hovered === null ||
              hovered === flow.from ||
              hovered === flow.to;
            const intensity = flow.count / maxFlow;
            const strokeWidth = 0.8 + intensity * 2.4;
            const opacity = active ? 0.5 + intensity * 0.4 : 0.08;

            // Quadratic bezier with perpendicular offset that scales with
            // distance so short flows curve less, long flows more.
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            const dist = Math.hypot(dx, dy);
            const lift = Math.min(0.22, 60 / Math.max(40, dist));
            const cx = mx - dy * lift;
            const cy = my + dx * lift - dist * 0.08;

            return (
              <path
                key={i}
                d={`M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`}
                fill="none"
                stroke="#0055A4"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                opacity={opacity}
              />
            );
          })}
        </g>

        {/* Cities */}
        <g>
          {positioned.map((c) => {
            const r = TIER_RADIUS[c.tier];
            const color = TIER_COLOR[c.tier];
            const isHover = hovered === c.code;
            return (
              <g
                key={c.code}
                onMouseEnter={() => setHovered(c.code)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "pointer" }}
              >
                {c.tier === 1 && (
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={r + 6}
                    fill={color}
                    opacity="0.12"
                  />
                )}
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={r + (isHover ? 2 : 0)}
                  fill={color}
                  style={{ transition: "r 120ms" }}
                />
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={Math.max(1.4, r - 2.4)}
                  fill="#FFF6E8"
                />
                <text
                  x={c.x}
                  y={c.y - r - 4}
                  fontFamily="Bricolage Grotesque, sans-serif"
                  fontSize={TIER_FONT[c.tier]}
                  fontWeight={800}
                  fill={color}
                  textAnchor="middle"
                  pointerEvents="none"
                >
                  {c.code}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
