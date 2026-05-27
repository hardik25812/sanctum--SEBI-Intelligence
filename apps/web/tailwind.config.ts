import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#09090b",
        "bg-elev": "#131316",
        "bg-card": "#18181b",
        ink: "#fafaf9",
        "ink-dim": "#a8a29e",
        "ink-faint": "#57534e",
        rule: "#27272a",
        "rule-bright": "#3f3f46",
        pass: "#86efac",
        fail: "#fca5a5",
        warn: "#fcd34d",
        gold: "#d4a96a",
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', '"Times New Roman"', "serif"],
        sans: ['"Inter"', "-apple-system", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
