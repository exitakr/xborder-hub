"use client";

import { useMemo } from "react";
import type { Region } from "./data";

type Props = {
  region: Region;
};

const SIZE_RADIUS: Record<string, number> = {
  major: 7,
  medium: 6,
  small: 4.5,
  mini: 3.5,
};

const SIZE_LABEL_FONT: Record<string, number> = {
  major: 12,
  medium: 11,
  small: 10,
  mini: 8.5,
};

/**
 * Renders the migration map: cities as dots, flows as dashed arcs with arrow
 * heads. Curves bend toward the midpoint perpendicular so two cities never
 * overlap straight lines.
 */
export function MigrationMap({ region }: Props) {
  const cityIndex = useMemo(
    () => Object.fromEntries(region.cities.map((c) => [c.code, c] as const)),
    [region],
  );

  const flowColors = useMemo(
    () => Array.from(new Set(region.flows.map((f) => f.color))),
    [region],
  );

  return (
    <svg
      viewBox="0 0 360 280"
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-full"
    >
      <defs>
        {flowColors.map((color) => (
          <marker
            key={color}
            id={`arrow-${color.replace("#", "")}`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
          </marker>
        ))}
      </defs>

      {/* halo behind major cities */}
      <g opacity="0.06">
        {region.cities
          .filter((c) => c.size === "major")
          .map((c) => (
            <circle key={c.code} cx={c.x} cy={c.y} r={28} fill="#0A1F3D" />
          ))}
      </g>

      {/* flows */}
      <g>
        {region.flows.map((flow, i) => {
          const from = cityIndex[flow.from];
          const to = cityIndex[flow.to];
          if (!from || !to) return null;
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          // perpendicular offset so each flow curves slightly
          const offset = 0.18 * Math.hypot(dx, dy);
          const cx = midX - dy * 0.18 * Math.sign(dx || 1);
          const cy = midY + dx * 0.18 * Math.sign(dy || 1);
          const width = Math.max(1.8, 1.4 + flow.volume * 0.18);
          return (
            <path
              key={i}
              d={`M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`}
              fill="none"
              stroke={flow.color}
              strokeWidth={width}
              strokeLinecap="round"
              className="arc-flow"
              markerEnd={`url(#arrow-${flow.color.replace("#", "")})`}
              opacity={0.85}
              data-vol={flow.volume}
              data-offset={offset}
            />
          );
        })}
      </g>

      {/* cities */}
      <g>
        {region.cities.map((city) => {
          const r = SIZE_RADIUS[city.size];
          const color = city.color ?? "#0A1F3D";
          const fontSize = SIZE_LABEL_FONT[city.size];
          const dy = city.size === "mini" ? -10 : -12;
          return (
            <g key={city.code} opacity={city.external ? 0.5 : 1}>
              {(city.size === "major" || city.size === "medium") && (
                <circle
                  cx={city.x}
                  cy={city.y}
                  r={r + 5}
                  fill="none"
                  stroke={color}
                  strokeWidth="0.7"
                  opacity="0.3"
                />
              )}
              {city.size === "major" && (
                <circle
                  cx={city.x}
                  cy={city.y}
                  r={r + 10}
                  fill="none"
                  stroke={color}
                  strokeWidth="1.2"
                  opacity="0.18"
                />
              )}
              <circle cx={city.x} cy={city.y} r={r} fill={color} />
              <circle
                cx={city.x}
                cy={city.y}
                r={Math.max(2, r - 3)}
                fill="#FFF6E8"
              />
              <text
                x={city.x}
                y={city.y + dy}
                fontFamily="Bricolage Grotesque"
                fontSize={fontSize}
                fontWeight={800}
                fill={color}
                textAnchor="middle"
              >
                {city.code}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
