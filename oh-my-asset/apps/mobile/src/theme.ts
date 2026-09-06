import type { TextStyle } from "react-native";

/**
 * Design tokens, mirroring the web app's CSS variables so the two products look
 * like one product. Values live here rather than inline so a rebrand is a
 * single-file change on this side too.
 */
export interface Palette {
  ink: string;
  muted: string;
  line: string;
  surface: string;
  canvas: string;
  accent: string;
  gain: string;
  loss: string;
  buy: string;
  sell: string;
}

export type Scheme = "light" | "dark";

/**
 * Dark is not an inversion of light: the surface sits slightly *above* the
 * canvas the way a trading terminal separates a panel from its background, and
 * gain/loss are lifted rather than reused — the light values are too dark to
 * read against a near-black panel. These triples are the same ones the web app
 * declares in `globals.css`; the two must be changed together.
 */
export const palettes: Record<Scheme, Palette> = {
  light: {
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
  dark: {
    ink: "#E8ECF1",
    muted: "#949EAB",
    line: "#2A303A",
    surface: "#181C23",
    canvas: "#0F1217",
    accent: "#589BFF",
    gain: "#2DC48A",
    loss: "#F85C5C",
    buy: "#589BFF",
    sell: "#FAB234",
  },
};

/**
 * Layout tokens. Scheme-independent, so they stay a plain constant rather than
 * going through the theme context.
 */
export const theme = {
  radius: { sm: 8, md: 12, lg: 16, pill: 999 },
  space: (n: number) => n * 4,
} as const;

/**
 * Tabular figures stop columns of money jittering as values update.
 * Declared outside an `as const` object: React Native's TextStyle expects a
 * mutable `fontVariant` array, which `as const` would freeze.
 */
export const numericFont: TextStyle = { fontVariant: ["tabular-nums"] };

/** Colour for a gain/loss figure. Neutral when zero or unknown. */
export function toneColor(c: Palette, value: number | null | undefined): string {
  if (value === null || value === undefined || value === 0) return c.muted;
  return value > 0 ? c.gain : c.loss;
}
