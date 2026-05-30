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
    bg: "#0f1115",
    preview: "#1e2128",   // slightly brighter so swatch is visible
  },
  {
    id: "void",
    label: "Void",
    bg: "#0a0a0a",
    preview: "#1a1a1a",
  },
  {
    id: "midnight",
    label: "Midnight",
    bg: "#080e1a",
    preview: "#0f1e3d",   // visible navy blue
  },
  {
    id: "nebula",
    label: "Nebula",
    bg: "#0d0a1e",
    preview: "#1e1540",   // visible deep purple
  },
  {
    id: "warm",
    label: "Warm",
    bg: "#110e0b",
    preview: "#2a1f14",   // visible warm brown
  },
  // ── Gradient ───────────────────────────────────────────────────
  {
    id: "aurora",
    label: "Aurora",
    bg: "linear-gradient(135deg, #1e1b4b 0%, #0f0f1a 55%, #0f172a 100%)",
    preview: "linear-gradient(135deg, #3730a3, #1e1b4b)",  // indigo → dark
  },
  {
    id: "ocean",
    label: "Ocean",
    bg: "linear-gradient(135deg, #0a1628 0%, #0d2137 50%, #051a14 100%)",
    preview: "linear-gradient(135deg, #1d4ed8, #0d2137)",  // blue → dark teal
  },
  {
    id: "cosmos",
    label: "Cosmos",
    bg: "linear-gradient(135deg, #0d001a 0%, #000d1a 50%, #1a0d33 100%)",
    preview: "linear-gradient(135deg, #6b21a8, #0d001a)",  // purple → black
  },
  {
    id: "ember",
    label: "Ember",
    bg: "linear-gradient(135deg, #1c0700 0%, #0f0f0f 45%, #140014 100%)",
    preview: "linear-gradient(135deg, #c2410c, #1c0700)",  // orange-red → dark
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
