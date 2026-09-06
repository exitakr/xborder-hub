import type { Config } from "tailwindcss";

/**
 * Neutral, brand-agnostic tokens. The product name lives in packages/core's
 * brand.ts and is never hardcoded here, so a rename (or a buyer's rebrand)
 * touches one file.
 *
 * Every colour resolves through a CSS variable so the whole palette can be
 * swapped by putting `.dark` on <html>, without any component knowing there is
 * more than one theme. `<alpha-value>` keeps Tailwind's opacity modifiers
 * (`bg-accent/10`) working through the indirection.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        muted: "rgb(var(--c-muted) / <alpha-value>)",
        line: "rgb(var(--c-line) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        canvas: "rgb(var(--c-canvas) / <alpha-value>)",
        accent: "rgb(var(--c-accent) / <alpha-value>)",
        gain: "rgb(var(--c-gain) / <alpha-value>)",
        loss: "rgb(var(--c-loss) / <alpha-value>)",
        buy: "rgb(var(--c-buy) / <alpha-value>)",
        sell: "rgb(var(--c-sell) / <alpha-value>)",
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Hiragino Kaku Gothic ProN",
          "Noto Sans JP",
          "sans-serif",
        ],
        num: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      maxWidth: { app: "1120px" },
    },
  },
  plugins: [],
};

export default config;
