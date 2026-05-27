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
        bg: "#000000",
        "bg-elev": "#0a0a0a",
        "bg-card": "#0d0d0d",
        ink: "#f4f1ea",
        "ink-dim": "#8a8680",
        "ink-faint": "#4a4742",
        rule: "#1a1a1a",
        "rule-bright": "#2a2a2a",
        pass: "#c4b896",
        fail: "#b85c4a",
        warn: "#d4a574",
        gold: "#c4a572",
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
