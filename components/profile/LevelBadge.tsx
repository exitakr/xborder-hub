/**
 * Small "Lv.N" pill shown next to a member's display name everywhere they
 * appear in the UI (profile / mypage / search). The level itself is
 * derived from career diversity — see lib/profile/level.ts.
 *
 * Visual language mirrors the existing .status-badge in public/styles.css
 * (uppercase, 999px radius, 1px border) but uses a distinct blue palette
 * so it never collides with status-pending / status-approved chips.
 */
export function LevelBadge({
  level,
  size = "md",
  withTooltip = true,
  className = "",
}: {
  /** Computed career level (≥ 1). Falsy / nullish → render nothing. */
  level: number | null | undefined;
  size?: "sm" | "md";
  withTooltip?: boolean;
  className?: string;
}) {
  if (!level || level < 1) return null;
  const padding = size === "sm" ? "px-1.5 py-0.5" : "px-2 py-0.5";
  const font = size === "sm" ? "text-[9px]" : "text-[10px]";
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full border border-blue/40 bg-blue-soft text-blue-deep font-bold uppercase tracking-[0.06em] ${padding} ${font} ${className}`}
      title={
        withTooltip
          ? "経歴の多様性で上がるレベル(国・業界・企業・職種)"
          : undefined
      }
    >
      <span className="opacity-70">Lv.</span>
      <span className="tabular-nums">{level}</span>
    </span>
  );
}
