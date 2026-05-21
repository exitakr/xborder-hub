import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FFF6E8",
        paper: "#FBF0DD",
        ink: {
          DEFAULT: "#0A1F3D",
          soft: "#3A4658",
          faint: "#7C8597",
        },
        blue: {
          DEFAULT: "#0055A4",
          deep: "#003C7A",
          bright: "#2E7BE8",
          soft: "#D6E4F5",
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
        pop: "4px 4px 0 #0A1F3D",
        "pop-sm": "2px 2px 0 #0A1F3D",
        "pop-lg": "6px 6px 0 #0A1F3D",
        "pop-blue": "4px 4px 0 #0055A4",
      },
    },
  },
  plugins: [],
};

export default config;
