"use client";

import { useMemo, useRef, useState } from "react";
import { CITIES, FLOWS, type City } from "./data";
import { WORLD_COASTLINES } from "./world-coastlines";

const VIEW_W = 720;
const VIEW_H = 360;
const MIN_W = VIEW_W / 5; // max zoom-in
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

/** Build an SVG path command string from a lng/lat polygon. */
function polygonToPath(poly: [number, number][]): string {
  let d = "";
  for (let i = 0; i < poly.length; i++) {
    const [lng, lat] = poly[i]!;
    const [x, y] = project(lng, lat);
    d += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d + "Z";
}

type Role = "hub" | "sender" | "receiver" | "quiet";
const ROLE_COLOR: Record<Role, string> = {
  hub: "#0055A4",
  sender: "#E89943",
  receiver: "#1FA89E",
  quiet: "#94A3B8",
};
const ROLE_LABEL: Record<Role, string> = {
  hub: "ハブ",
  sender: "送り手",
  receiver: "受け手",
  quiet: "静か",
};

type Props = {
  className?: string;
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

  /** Activity = in + out flow count for the city. Drives bubble size. */
  const activityByCity = useMemo(() => {
    const m: Record<string, { in: number; out: number }> = {};
    for (const c of CITIES) m[c.code] = { in: 0, out: 0 };
    for (const f of FLOWS) {
      if (m[f.from]) m[f.from]!.out += f.count;
      if (m[f.to]) m[f.to]!.in += f.count;
    }
    return m;
  }, []);

  const maxActivity = useMemo(() => {
    let m = 1;
    for (const code in activityByCity) {
      const a = activityByCity[code]!;
      m = Math.max(m, a.in + a.out);
    }
    return m;
  }, [activityByCity]);

  function radiusFor(code: string): number {
    const a = activityByCity[code];
    if (!a) return 3.5;
    const total = a.in + a.out;
    // sqrt scale for proper area perception
    return 4 + Math.sqrt(total / maxActivity) * 14;
  }

  function roleFor(code: string): Role {
    const a = activityByCity[code];
    if (!a) return "quiet";
    const total = a.in + a.out;
    if (total === 0) return "quiet";
    const net = (a.in - a.out) / total;
    if (Math.abs(net) < 0.2) return "hub";
    return net > 0 ? "receiver" : "sender";
  }

  // Pre-compute coastline paths once.
  const coastPaths = useMemo(
    () => WORLD_COASTLINES.map(polygonToPath),
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
    setVp((v) => ({
      ...v,
      x: drag.current!.vx - dx,
      y: drag.current!.vy - dy,
    }));
  }

  function onPointerUp(e: React.PointerEvent<SVGSVGElement>) {
    if (
      drag.current &&
      (e.currentTarget as SVGElement).hasPointerCapture(e.pointerId)
    ) {
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

  // Decide which city labels to draw — only big bubbles, plus the hovered
  // / highlighted city so the user can always read what they touched.
  function shouldLabel(code: string, r: number): boolean {
    if (hovered === code) return true;
    if (
      highlightedFlow &&
      (highlightedFlow.from === code || highlightedFlow.to === code)
    )
      return true;
    return r >= 10;
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
          <radialGradient id="bubble-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
            <stop offset="60%" stopColor="currentColor" stopOpacity="0.10" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Equator only — minimal reference line */}
        <line
          x1="0"
          y1={VIEW_H / 2}
          x2={VIEW_W}
          y2={VIEW_H / 2}
          stroke="#0A1F3D"
          strokeWidth="0.3"
          opacity="0.08"
          strokeDasharray="2 4"
        />

        {/* World coastlines */}
        <g
          fill="#0A1F3D"
          fillOpacity="0.05"
          stroke="#94A3B8"
          strokeWidth="0.5"
          strokeLinejoin="round"
        >
          {coastPaths.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>

        {/* Flows — subtle network in the background */}
        <g>
          {FLOWS.map((flow, i) => {
            const a = lookup[flow.from];
            const b = lookup[flow.to];
            if (!a || !b) return null;

            const isHighlighted =
              highlightedFlow &&
              flow.from === highlightedFlow.from &&
              flow.to === highlightedFlow.to;
            const intensity = flow.count / maxFlow;

            const hoverActive =
              hovered === null || hovered === flow.from || hovered === flow.to;

            let opacity: number;
            if (highlightedFlow) {
              opacity = isHighlighted ? 1 : 0.04;
            } else {
              opacity = hoverActive ? 0.18 + intensity * 0.35 : 0.06;
            }

            const baseWidth = 0.6 + intensity * 1.8;
            const strokeWidth = isHighlighted ? baseWidth * 1.8 : baseWidth;
            const stroke = isHighlighted ? "#0055A4" : "#475569";

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

        {/* City bubbles */}
        <g>
          {positioned.map((c) => {
            const r = radiusFor(c.code);
            const role = roleFor(c.code);
            const isInHighlight =
              highlightedFlow &&
              (c.code === highlightedFlow.from ||
                c.code === highlightedFlow.to);
            const isHover = hovered === c.code;
            const color = isInHighlight ? "#0055A4" : ROLE_COLOR[role];
            const dimmed = highlightedFlow && !isInHighlight;
            const opacity = dimmed ? 0.3 : 1;
            const drawR = r + (isHover || isInHighlight ? 1.5 : 0);

            return (
              <g
                key={c.code}
                onMouseEnter={() => setHovered(c.code)}
                onMouseLeave={() => setHovered(null)}
                opacity={opacity}
                style={{ cursor: "pointer", color }}
              >
                {/* Soft halo */}
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={drawR + 6}
                  fill="url(#bubble-halo)"
                  pointerEvents="none"
                />
                {/* Body */}
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={drawR}
                  fill={color}
                  fillOpacity="0.85"
                  stroke="#FFFFFF"
                  strokeWidth="1"
                  style={{ transition: "r 120ms" }}
                />
                {/* White inner dot for the largest bubbles */}
                {drawR >= 10 && (
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={Math.max(2, drawR - 6)}
                    fill="#FFFFFF"
                    opacity="0.55"
                    pointerEvents="none"
                  />
                )}
                {shouldLabel(c.code, drawR) && (
                  <text
                    x={c.x}
                    y={c.y - drawR - 4}
                    fontFamily="Bricolage Grotesque, sans-serif"
                    fontSize={drawR >= 12 ? 12 : 10}
                    fontWeight={800}
                    fill="#0A1F3D"
                    textAnchor="middle"
                    pointerEvents="none"
                  >
                    {c.code}
                  </text>
                )}
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

      {/* Legend */}
      <Legend />
    </div>
  );
}

function Legend() {
  return (
    <div className="absolute left-2 bottom-2 bg-white/90 backdrop-blur-sm border border-ink/10 rounded-lg shadow-pop-sm px-3 py-2 text-[10px] text-ink-soft">
      <p className="font-bold text-ink uppercase tracking-wider text-[9px] mb-1.5">
        都市の役割
      </p>
      <div className="flex flex-wrap gap-x-3 gap-y-1 max-w-[260px]">
        {(Object.keys(ROLE_COLOR) as Role[]).map((r) => (
          <div key={r} className="flex items-center gap-1">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ background: ROLE_COLOR[r] }}
            />
            <span className="font-bold text-ink">{ROLE_LABEL[r]}</span>
          </div>
        ))}
      </div>
      <p className="text-ink-faint mt-1.5 text-[9px]">
        ● 大きさ = 移動量(in + out)
      </p>
    </div>
  );
}
