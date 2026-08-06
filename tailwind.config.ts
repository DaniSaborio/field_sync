import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#F9F9F7",
        ink: "#000000",
        neon: "#00FF41",
        muted: "#6B6B6B",
        night: "#0B2545",
      },
      borderRadius: {
        none: "0px",
        DEFAULT: "0px",
      },
      boxShadow: {
        hard: "4px 4px 0px 0px rgba(0,0,0,1)",
        "hard-sm": "2px 2px 0px 0px rgba(0,0,0,1)",
      },
      fontFamily: {
        display: ["var(--font-playfair)", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      transitionTimingFunction: {
        pop: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
    },
  },
};

export default config;
