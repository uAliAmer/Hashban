import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";

// §I — core data model
export type CheckItem = {
  id: string;
  txt: string;
  done: boolean;
};

export type Card = {
  id: string;
  txt: string;
  desc?: string;
  color?: string;
  due?: string; // ISO date yyyy-mm-dd
  checklist?: CheckItem[]; // §V.14
  priority?: "P1" | "P2" | "P3"; // §V.16
  laneId?: string; // §V.17
};

export type Lane = {
  id: string;
  name: string;
};

export type Col = {
  id: string;
  name: string;
  cards: Card[];
  wip?: number; // §V.12 soft work-in-progress limit
  color?: string; // §V.15 optional tint
};

export type Board = {
  t: string; // board title
  cols: Col[];
  lanes?: Lane[]; // §V.17 optional swimlanes
};

// soft URL-length limit; §V.7
export const SOFT_LIMIT = 8000;

// §V.4 — unique id. crypto.randomUUID when available, else fallback.
export function genId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  );
}

// §V.8 — default board for empty/missing hash
export function defaultBoard(): Board {
  return {
    t: "My Board",
    cols: [
      { id: genId(), name: "Todo", cards: [] },
      { id: genId(), name: "Doing", cards: [] },
      { id: genId(), name: "Done", cards: [] },
    ],
  };
}

// §V.10 — first-visit seed. Showcases all major features.
export function demoBoard(): Board {
  const today = new Date();
  const iso = (d: number) => {
    const t = new Date(today);
    t.setDate(t.getDate() + d);
    return t.toISOString().slice(0, 10);
  };
  return {
    t: "✨ Hashban Demo",
    cols: [
      {
        id: genId(),
        name: "🧠 Brainstorming",
        color: "#8b5cf6",
        cards: [
          { id: genId(), txt: "What if cards could have voice notes?", color: "#8b5cf6" },
          { id: genId(), txt: "Dark mode themes with custom accent colors", color: "#a855f7" },
          { id: genId(), txt: "Keyboard-only power user mode", color: "#7c3aed" },
          { id: genId(), txt: "Export board as image / screenshot" },
        ],
      },
      {
        id: genId(),
        name: "📋 To Do",
        color: "#3b82f6",
        cards: [
          { id: genId(), txt: "Write onboarding guide for new users", color: "#3b82f6", priority: "P2" },
          { id: genId(), txt: "Add card comments / notes field", color: "#60a5fa", priority: "P3" },
          { id: genId(), txt: "Improve mobile drag-and-drop feel", priority: "P2" },
        ],
      },
      {
        id: genId(),
        name: "📥 Backlog",
        color: "#6b7280",
        cards: [
          {
            id: genId(),
            txt: "Click me to edit this card",
            desc: "Single click opens edit — set title, description, priority, color, due date, and checklist.",
            color: "#3b82f6",
            priority: "P3",
          },
          {
            id: genId(),
            txt: "Drag me to another column",
            desc: "Click and hold, then drag anywhere on the card body.",
            color: "#a855f7",
          },
          {
            id: genId(),
            txt: "🚀 Ship the feature",
            checklist: [
              { id: genId(), txt: "Write spec", done: true },
              { id: genId(), txt: "Build & test", done: true },
              { id: genId(), txt: "Deploy to prod", done: false },
            ],
            color: "#f59e0b",
            priority: "P1",
            due: iso(3),
          },
          {
            id: genId(),
            txt: "Use ↑↓←→ keys to navigate, n to add a card",
          },
        ],
      },
      {
        id: genId(),
        name: "⚡ In Progress",
        color: "#f59e0b",
        wip: 2,
        cards: [
          {
            id: genId(),
            txt: "WIP limit is 2 — badge turns red when exceeded",
            color: "#f59e0b",
            due: iso(1),
          },
          {
            id: genId(),
            txt: "Overdue card",
            color: "#ef4444",
            priority: "P1",
            due: iso(-2),
          },
        ],
      },
      {
        id: genId(),
        name: "✅ Done",
        color: "#10b981",
        cards: [
          {
            id: genId(),
            txt: "Share button → copies URL + shows QR code",
            desc: "The URL is the board. Send it to anyone — no account needed.",
            color: "#10b981",
          },
          {
            id: genId(),
            txt: "Boards sidebar → auto-saves every edit to your browser",
            color: "#3b82f6",
          },
          {
            id: genId(),
            txt: "Pick a background theme via the 🎨 icon in the toolbar",
            color: "#a855f7",
          },
        ],
      },
    ],
  };
}

// §V.18 — preset template boards seeded by ?template= URL param
export function templateBoard(name: string): Board | null {
  switch (name) {
    case "sprint":
      return {
        t: "Sprint Board",
        cols: [
          { id: genId(), name: "Backlog", color: "#6b7280", cards: [
            { id: genId(), txt: "Add your user stories here", color: "#6b7280" },
          ]},
          { id: genId(), name: "Sprint", color: "#3b82f6", cards: [], wip: 10 },
          { id: genId(), name: "In Progress", color: "#f59e0b", cards: [], wip: 3 },
          { id: genId(), name: "Review", color: "#a855f7", cards: [] },
          { id: genId(), name: "Done", color: "#10b981", cards: [] },
        ],
      };
    case "gtd":
      return {
        t: "GTD — Getting Things Done",
        cols: [
          { id: genId(), name: "Inbox", color: "#6b7280", cards: [
            { id: genId(), txt: "Capture everything here first" },
          ]},
          { id: genId(), name: "Next Actions", color: "#3b82f6", cards: [] },
          { id: genId(), name: "Waiting For", color: "#f59e0b", cards: [] },
          { id: genId(), name: "Someday / Maybe", color: "#a855f7", cards: [] },
          { id: genId(), name: "Done", color: "#10b981", cards: [] },
        ],
      };
    case "hiring":
      return {
        t: "Hiring Pipeline",
        cols: [
          { id: genId(), name: "Applied", color: "#6b7280", cards: [] },
          { id: genId(), name: "Phone Screen", color: "#3b82f6", cards: [] },
          { id: genId(), name: "Interview", color: "#f59e0b", cards: [] },
          { id: genId(), name: "Offer", color: "#10b981", cards: [] },
          { id: genId(), name: "Rejected", color: "#ef4444", cards: [] },
        ],
      };
    default:
      return null;
  }
}

// §I — encode(board) -> hash payload
export function encode(board: Board): string {
  return compressToEncodedURIComponent(JSON.stringify(board));
}

// §I — decode(payload) -> Board | null  (§V.3: null on any failure, never throw)
export function decode(payload: string): Board | null {
  if (!payload) return null;
  try {
    const json = decompressFromEncodedURIComponent(payload);
    if (!json) return null;
    const parsed = JSON.parse(json);
    if (!isBoard(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

// structural validation — guards §V.3 against malformed payloads
export function isBoard(x: unknown): x is Board {
  if (typeof x !== "object" || x === null) return false;
  const b = x as Record<string, unknown>;
  if (typeof b.t !== "string") return false;
  if (!Array.isArray(b.cols)) return false;
  // §V.17 — optional lanes array
  if (b.lanes !== undefined) {
    if (!Array.isArray(b.lanes)) return false;
    if (!b.lanes.every((l) => {
      if (typeof l !== "object" || l === null) return false;
      const lane = l as Record<string, unknown>;
      return typeof lane.id === "string" && typeof lane.name === "string";
    })) return false;
  }
  return b.cols.every((c) => {
    if (typeof c !== "object" || c === null) return false;
    const col = c as Record<string, unknown>;
    if (typeof col.id !== "string" || typeof col.name !== "string")
      return false;
    if (col.wip !== undefined && typeof col.wip !== "number") return false; // §V.13
    if (col.color !== undefined && typeof col.color !== "string") return false; // §V.15
    if (!Array.isArray(col.cards)) return false;
    return col.cards.every((cd) => {
      if (typeof cd !== "object" || cd === null) return false;
      const card = cd as Record<string, unknown>;
      if (typeof card.id !== "string" || typeof card.txt !== "string") return false;
      // §V.16 — priority optional enum
      if (card.priority !== undefined && !["P1", "P2", "P3"].includes(card.priority as string)) return false;
      // §V.14 — checklist optional array
      if (card.checklist !== undefined) {
        if (!Array.isArray(card.checklist)) return false;
        if (!card.checklist.every((item) => {
          if (typeof item !== "object" || item === null) return false;
          const ci = item as Record<string, unknown>;
          return typeof ci.id === "string" && typeof ci.txt === "string" && typeof ci.done === "boolean";
        })) return false;
      }
      return true;
    });
  });
}
