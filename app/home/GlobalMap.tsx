"use client";

import { useMemo, useRef, useState } from "react";
import { CITIES, FLOWS, type City } from "./data";

const VIEW_W = 720;
const VIEW_H = 360;
const MIN_W = VIEW_W / 5;   // max zoom-in
const MAX_W = VIEW_W * 1.5; // max zoom-out

/** Equirectangular projection from (lng, lat) to SVG coords. */
function project(lng: number, lat: number): [number, number] {
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

const CONTINENTS: string[] = [
  "M70 90 Q110 70 165 80 Q195 95 200 130 Q205 175 165 200 Q120 215 100 195 Q75 175 70 145 Z",
  "M180 200 Q205 210 215 230 Q205 240 195 235 Q185 225 180 215 Z",
  "M205 215 Q235 215 245 240 Q250 280 230 315 Q210 335 195 320 Q185 290 195 250 Z",
  "M345 90 Q380 80 410 95 Q420 115 405 130 Q380 140 360 130 Q345 115 345 100 Z",
  "M360 145 Q400 145 420 175 Q425 220 405 255 Q380 275 365 260 Q345 220 350 175 Z",
  "M420 80 Q485 75 555 100 Q605 125 600 165 Q580 195 530 195 Q470 195 435 165 Q420 135 420 100 Z",
  "M540 210 Q570 210 585 225 Q580 240 555 235 Q535 230 535 220 Z",
  "M585 270 Q625 270 645 290 Q635 310 605 310 Q585 305 580 290 Z",
];

type Props = {
  className?: string;
  /** When set, dims every other flow and emphasises just this one. */
  highlightedFlow?: { from: string; to: string } | null;
};

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

export function GlobalMap({ className, highlightedFlow }: Props) {
  const [vp, setVp] = useState({ x: 0, y: 0, w: VIEW_W, h: VIEW_H });
  const [hovered, setHovered] = useState<string | null>(null);
  const drag = useRef<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    scale: number;
    moved: boolean;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const positioned = useMemo<(City & { x: number; y: number })[]>(
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

  const maxFlow = useMemo(
    () => FLOWS.reduce((m, f) => Math.max(m, f.count), 0),
    [],
  );

  function zoomBy(factor: number, focusX?: number, focusY?: number) {
    setVp((v) => {
      const newW = clamp(v.w / factor, MIN_W, MAX_W);
      const newH = newW * (VIEW_H / VIEW_W);
      const fx = focusX ?? v.x + v.w / 2;
      const fy = focusY ?? v.y + v.h / 2;
      const newX = fx - (fx - v.x) * (newW / v.w);
      const newY = fy - (fy - v.y) * (newH / v.h);
      return { x: newX, y: newY, w: newW, h: newH };
    });
  }

  function reset() {
    setVp({ x: 0, y: 0, w: VIEW_W, h: VIEW_H });
  }

  function screenToView(clientX: number, clientY: number) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: vp.x + ((clientX - rect.left) / rect.width) * vp.w,
      y: vp.y + ((clientY - rect.top) / rect.height) * vp.h,
    };
  }

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scale = vp.w / rect.width;
    drag.current = {
      x: e.clientX,
      y: e.clientY,
      vx: vp.x,
      vy: vp.y,
      scale,
      moved: false,
    };
    (e.currentTarget as SVGElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!drag.current) return;
    const dx = (e.clientX - drag.current.x) * drag.current.scale;
    const dy = (e.clientY - drag.current.y) * drag.current.scale;
    if (Math.abs(dx) + Math.abs(dy) > 1) drag.current.moved = true;
    setVp((v) => ({ ...v, x: drag.current!.vx - dx, y: drag.current!.vy - dy }));
  }

  function onPointerUp(e: React.PointerEvent<SVGSVGElement>) {
    if (drag.current && (e.currentTarget as SVGElement).hasPointerCapture(e.pointerId)) {
      (e.currentTarget as SVGElement).releasePointerCapture(e.pointerId);
    }
    drag.current = null;
  }

  function onWheel(e: React.WheelEvent<SVGSVGElement>) {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.85 : 1.18;
    const pt = screenToView(e.clientX, e.clientY);
    zoomBy(factor, pt.x, pt.y);
  }

  return (
    <div className={`${className ?? ""} relative`}>
      <svg
        ref={svgRef}
        viewBox={`${vp.x} ${vp.y} ${vp.w} ${vp.h}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full select-none touch-none cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <defs>
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

        {/* Background grid */}
        <g stroke="#0A1F3D" strokeWidth="0.4" opacity="0.06">
          <line x1="0" y1={VIEW_H / 2} x2={VIEW_W} y2={VIEW_H / 2} />
          <line x1={VIEW_W / 4} y1="0" x2={VIEW_W / 4} y2={VIEW_H} />
          <line x1={VIEW_W / 2} y1="0" x2={VIEW_W / 2} y2={VIEW_H} />
          <line x1={(VIEW_W * 3) / 4} y1="0" x2={(VIEW_W * 3) / 4} y2={VIEW_H} />
        </g>

        {/* Continents */}
        <g fill="#0A1F3D" opacity="0.05">
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

            const isHighlighted =
              highlightedFlow &&
              flow.from === highlightedFlow.from &&
              flow.to === highlightedFlow.to;
            const isDimmedByHighlight = highlightedFlow && !isHighlighted;
            const intensity = flow.count / maxFlow;

            const hoverActive =
              hovered === null || hovered === flow.from || hovered === flow.to;

            let opacity: number;
            if (highlightedFlow) {
              opacity = isHighlighted ? 1 : 0.06;
            } else {
              opacity = hoverActive ? 0.5 + intensity * 0.4 : 0.1;
            }

            const baseWidth = 0.9 + intensity * 2.5;
            const strokeWidth = isHighlighted ? baseWidth * 1.5 : baseWidth;
            const stroke = isHighlighted ? "#0055A4" : "#0A1F3D";

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
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                opacity={opacity}
                markerEnd={isHighlighted ? "url(#flow-arrow)" : undefined}
              />
            );
          })}
        </g>

        {/* Cities */}
        <g>
          {positioned.map((c) => {
            const r = TIER_RADIUS[c.tier];
            const isInHighlight =
              highlightedFlow &&
              (c.code === highlightedFlow.from ||
                c.code === highlightedFlow.to);
            const color = isInHighlight ? "#0055A4" : TIER_COLOR[c.tier];
            const isHover = hovered === c.code;
            const cityOpacity =
              highlightedFlow && !isInHighlight ? 0.35 : 1;

            return (
              <g
                key={c.code}
                onMouseEnter={() => setHovered(c.code)}
                onMouseLeave={() => setHovered(null)}
                opacity={cityOpacity}
                style={{ cursor: "pointer" }}
              >
                {(c.tier === 1 || isInHighlight) && (
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={r + (isInHighlight ? 9 : 6)}
                    fill={color}
                    opacity="0.14"
                  />
                )}
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={r + (isHover || isInHighlight ? 2 : 0)}
                  fill={color}
                  style={{ transition: "r 120ms" }}
                />
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={Math.max(1.4, r - 2.4)}
                  fill="#FFFFFF"
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

      {/* Zoom controls */}
      <div className="absolute right-2 top-2 flex flex-col gap-1">
        <button
          type="button"
          onClick={() => zoomBy(1.6)}
          aria-label="拡大"
          className="w-8 h-8 rounded-lg bg-white/90 border border-ink/15 text-ink font-bold shadow-pop-sm hover:border-ink active:translate-y-px"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => zoomBy(1 / 1.6)}
          aria-label="縮小"
          className="w-8 h-8 rounded-lg bg-white/90 border border-ink/15 text-ink font-bold shadow-pop-sm hover:border-ink active:translate-y-px"
        >
          −
        </button>
        <button
          type="button"
          onClick={reset}
          aria-label="リセット"
          title="リセット"
          className="w-8 h-8 rounded-lg bg-white/90 border border-ink/15 text-ink-soft text-[11px] font-bold shadow-pop-sm hover:border-ink hover:text-ink active:translate-y-px"
        >
          ⟲
        </button>
      </div>
    </div>
  );
}
