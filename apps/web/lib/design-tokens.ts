export const tokens = {
  color: {
    bg: "#09090b",
    bgElev: "#131316",
    bgCard: "#18181b",
    ink: "#fafaf9",
    inkDim: "#a8a29e",
    inkFaint: "#57534e",
    rule: "#27272a",
    ruleBright: "#3f3f46",
    pass: "#86efac",
    fail: "#fca5a5",
    warn: "#fcd34d",
    gold: "#d4a96a",
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
