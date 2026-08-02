import type { TextStyle } from "react-native";

/**
 * Design tokens, mirroring the web app's Tailwind config so the two products
 * look like one product. Values live here rather than inline so a rebrand is a
 * single-file change on this side too.
 */
export const theme = {
  color: {
    ink: "#0F1720",
    muted: "#6B7480",
    line: "#E4E7EC",
    surface: "#FFFFFF",
    canvas: "#F7F8FA",
    accent: "#1F6FEB",
    gain: "#0E9F6E",
    loss: "#E02424",
    buy: "#1F6FEB",
    sell: "#F59E0B",
  },
  radius: { sm: 8, md: 12, lg: 16, pill: 999 },
  space: (n: number) => n * 4,
} as const;

/**
 * Tabular figures stop columns of money jittering as values update.
 * Declared outside the `as const` object: React Native's TextStyle expects a
 * mutable `fontVariant` array, which `as const` would freeze.
 */
export const numericFont: TextStyle = { fontVariant: ["tabular-nums"] };

/** Colour for a gain/loss figure. Neutral when zero or unknown. */
export function toneColor(value: number | null | undefined): string {
  if (value === null || value === undefined || value === 0) return theme.color.muted;
  return value > 0 ? theme.color.gain : theme.color.loss;
}
