import type { Config } from "tailwindcss";

/**
 * Neutral, brand-agnostic tokens. The product name lives in lib/brand.ts and is
 * never hardcoded here, so a rename (or a buyer's rebrand) touches one file.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
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
