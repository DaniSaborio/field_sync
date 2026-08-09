import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#EDEAE1",
        ink: "#1A1815",
        black: "#1A1815",
        neon: "#00FF41",
        muted: "#5C5B54",
        night: "#0B2545",
      },
      borderRadius: {
        none: "0px",
        DEFAULT: "0px",
      },
      boxShadow: {
        hard: "4px 4px 0px 0px rgba(26,24,21,1)",
        "hard-sm": "2px 2px 0px 0px rgba(26,24,21,1)",
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
