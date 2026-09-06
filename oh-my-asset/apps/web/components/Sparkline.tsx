/**
 * Tiny inline price-shape indicator. Pure SVG rather than a chart library —
 * a list of 30 of these must not cost 30 chart instances.
 */
export function Sparkline({ values, className = "" }: { values: number[]; className?: string }) {
  if (values.length < 2) {
    return <div className={`h-6 w-16 ${className}`} aria-hidden="true" />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 64;
  const h = 24;

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const rising = values[values.length - 1] >= values[0];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      className={className}
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke={rising ? "#0E9F6E" : "#E02424"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
