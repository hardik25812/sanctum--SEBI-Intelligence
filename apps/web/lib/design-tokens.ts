export const tokens = {
  color: {
    bg: "#000000",
    bgElev: "#0a0a0a",
    bgCard: "#0d0d0d",
    ink: "#f4f1ea",
    inkDim: "#8a8680",
    inkFaint: "#4a4742",
    rule: "#1a1a1a",
    ruleBright: "#2a2a2a",
    pass: "#c4b896",
    fail: "#b85c4a",
    warn: "#d4a574",
    gold: "#c4a572",
  },
  font: {
    serif: '"Cormorant Garamond", "Times New Roman", serif',
    sans: '"Inter", -apple-system, sans-serif',
    mono: '"JetBrains Mono", monospace',
  },
} as const;

export const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"] as const;

export const STEP_NAMES = [
  "Intake",
  "Distribution check",
  "Reasoning",
  "Citation grounding",
  "SEBI compliance",
  "Client delivery",
] as const;
