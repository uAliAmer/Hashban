const LS_KEY = "hashban:theme";

export type Theme = {
  id: string;
  label: string;
  bg: string;      // applied to document.body
  preview: string; // swatch — must be visually distinct on a dark picker
};

export const THEMES: Theme[] = [
  // ── Solid ──────────────────────────────────────────────────────
  {
    id: "default",
    label: "Default",
    bg: "#1a1f2e",
    preview: "#1a1f2e",
  },
  {
    id: "void",
    label: "Void",
    bg: "#0f0f0f",
    preview: "#0f0f0f",
  },
  {
    id: "midnight",
    label: "Midnight",
    bg: "#0a1830",
    preview: "#0a1830",
  },
  {
    id: "nebula",
    label: "Nebula",
    bg: "#130e25",
    preview: "#130e25",
  },
  {
    id: "warm",
    label: "Warm",
    bg: "#1e1108",
    preview: "#1e1108",
  },
  // ── Gradient ───────────────────────────────────────────────────
  {
    id: "aurora",
    label: "Aurora",
    bg: "linear-gradient(135deg, #312e81 0%, #1e1b4b 50%, #0f172a 100%)",
    preview: "linear-gradient(135deg, #4f46e5, #1e1b4b)",
  },
  {
    id: "ocean",
    label: "Ocean",
    bg: "linear-gradient(135deg, #0c4a6e 0%, #0a2a48 50%, #042f2e 100%)",
    preview: "linear-gradient(135deg, #0ea5e9, #0c4a6e)",
  },
  {
    id: "cosmos",
    label: "Cosmos",
    bg: "linear-gradient(135deg, #4a1272 0%, #1e0a38 50%, #0c0520 100%)",
    preview: "linear-gradient(135deg, #9333ea, #4a1272)",
  },
  {
    id: "ember",
    label: "Ember",
    bg: "linear-gradient(135deg, #7c2d12 0%, #3a0a0a 50%, #1e0030 100%)",
    preview: "linear-gradient(135deg, #ea580c, #7c2d12)",
  },
];

export function getSavedThemeId(): string {
  try { return localStorage.getItem(LS_KEY) ?? "default"; } catch { return "default"; }
}

export function saveThemeId(id: string): void {
  try { localStorage.setItem(LS_KEY, id); } catch { /* ignore */ }
}

export function applyTheme(theme: Theme): void {
  document.body.style.background = theme.bg;
}
