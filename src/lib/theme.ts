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
    bg: "#1c1f26",
    preview: "#1c1f26",
  },
  {
    id: "void",
    label: "Void",
    bg: "#111111",
    preview: "#111111",
  },
  {
    id: "midnight",
    label: "Midnight",
    bg: "#111827",    // slate-900
    preview: "#111827",
  },
  {
    id: "nebula",
    label: "Nebula",
    bg: "#1a1333",
    preview: "#1a1333",
  },
  {
    id: "warm",
    label: "Warm",
    bg: "#1c1410",
    preview: "#1c1410",
  },
  // ── Gradient ───────────────────────────────────────────────────
  {
    id: "aurora",
    label: "Aurora",
    bg: "linear-gradient(135deg, #2d2a6e 0%, #1a1a2e 55%, #16213e 100%)",
    preview: "linear-gradient(135deg, #3730a3, #1a1a2e)",
  },
  {
    id: "ocean",
    label: "Ocean",
    bg: "linear-gradient(135deg, #0f2444 0%, #163048 50%, #0a2a1e 100%)",
    preview: "linear-gradient(135deg, #1d4ed8, #0f2444)",
  },
  {
    id: "cosmos",
    label: "Cosmos",
    bg: "linear-gradient(135deg, #1a0030 0%, #0a0f2a 50%, #200040 100%)",
    preview: "linear-gradient(135deg, #6b21a8, #1a0030)",
  },
  {
    id: "ember",
    label: "Ember",
    bg: "linear-gradient(135deg, #2d0e00 0%, #1a1010 45%, #1e001e 100%)",
    preview: "linear-gradient(135deg, #c2410c, #2d0e00)",
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
