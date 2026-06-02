import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Slightly warm white — keeps brand identity but reads as SaaS.
        cream: "#FAFAF7",
        // Secondary surface tint, used for chip backgrounds and side rails.
        paper: "#F4F5F7",
        // Text tones
        ink: {
          DEFAULT: "#0A1F3D",
          soft: "#475569",
          faint: "#94A3B8",
        },
        // Accent palette stays — used sparingly now (links, key numbers).
        blue: {
          DEFAULT: "#0055A4",
          deep: "#003C7A",
          bright: "#2E7BE8",
          soft: "#E5EEF8",
        },
        jade: {
          DEFAULT: "#4ECDC4",
          deep: "#1FA89E",
        },
        mustard: "#FFC93C",
        plum: "#6B4F8E",
      },
      fontFamily: {
        sans: ["Manrope", "Zen Kaku Gothic New", "sans-serif"],
        display: ["Bricolage Grotesque", "Zen Kaku Gothic New", "sans-serif"],
        serif: ["Instrument Serif", "serif"],
      },
      boxShadow: {
        // Soft shadows replace the offset "pop" shadows — surfaces feel
        // floating without the sticker look.
        pop: "0 1px 2px rgba(10,31,61,0.06), 0 1px 3px rgba(10,31,61,0.04)",
        "pop-sm": "0 1px 2px rgba(10,31,61,0.05)",
        "pop-lg": "0 4px 14px rgba(10,31,61,0.08), 0 1px 3px rgba(10,31,61,0.04)",
        "pop-blue": "0 6px 18px rgba(0,85,164,0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
