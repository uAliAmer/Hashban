const LS_KEY = "hashban:theme";

export type Theme = {
  id: string;
  label: string;
  bg: string;        // CSS background value (color or gradient)
  preview: string;   // same as bg — used for swatch rendering
};

export const THEMES: Theme[] = [
  // ── Solid ──────────────────────────────────────────────────────
  {
    id: "default",
    label: "Default",
    bg: "#0f1115",
    preview: "#0f1115",
  },
  {
    id: "void",
    label: "Void",
    bg: "#0a0a0a",
    preview: "#0a0a0a",
  },
  {
    id: "midnight",
    label: "Midnight",
    bg: "#080e1a",
    preview: "#080e1a",
  },
  {
    id: "nebula",
    label: "Nebula",
    bg: "#0d0a1e",
    preview: "#0d0a1e",
  },
  {
    id: "warm",
    label: "Warm Dark",
    bg: "#110e0b",
    preview: "#110e0b",
  },
  // ── Gradient ───────────────────────────────────────────────────
  {
    id: "aurora",
    label: "Aurora",
    bg: "linear-gradient(135deg, #1e1b4b 0%, #0f0f1a 55%, #0f172a 100%)",
    preview: "linear-gradient(135deg, #1e1b4b, #0f172a)",
  },
  {
    id: "ocean",
    label: "Ocean",
    bg: "linear-gradient(135deg, #0a1628 0%, #0d2137 50%, #051a14 100%)",
    preview: "linear-gradient(135deg, #0a1628, #0d2137)",
  },
  {
    id: "cosmos",
    label: "Cosmos",
    bg: "linear-gradient(135deg, #0d001a 0%, #000d1a 50%, #1a0d33 100%)",
    preview: "linear-gradient(135deg, #0d001a, #1a0d33)",
  },
  {
    id: "ember",
    label: "Ember",
    bg: "linear-gradient(135deg, #1c0700 0%, #0f0f0f 45%, #140014 100%)",
    preview: "linear-gradient(135deg, #1c0700, #140014)",
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
