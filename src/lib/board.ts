import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";

// §I — core data model
export type Card = {
  id: string;
  txt: string;
  desc?: string;
  color?: string;
  due?: string; // ISO date yyyy-mm-dd
};

export type Col = {
  id: string;
  name: string;
  cards: Card[];
  wip?: number; // §V.12 soft work-in-progress limit
};

export type Board = {
  t: string; // board title
  cols: Col[];
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

// §V.10 — first-visit seed. Showcases cards, colors, due dates, desc, WIP.
export function demoBoard(): Board {
  const today = new Date();
  const iso = (d: number) => {
    const t = new Date(today);
    t.setDate(t.getDate() + d);
    return t.toISOString().slice(0, 10);
  };
  return {
    t: "Hashban Demo",
    cols: [
      {
        id: genId(),
        name: "Backlog",
        cards: [
          { id: genId(), txt: "Drag me to another column →", color: "#3b82f6" },
          {
            id: genId(),
            txt: "Click a card to edit",
            desc: "Add a description, label color, or due date.",
            color: "#a855f7",
          },
          { id: genId(), txt: "Try the search box to filter cards" },
        ],
      },
      {
        id: genId(),
        name: "In Progress",
        wip: 2,
        cards: [
          {
            id: genId(),
            txt: "This column has a WIP limit of 2",
            color: "#f59e0b",
            due: iso(2),
          },
          { id: genId(), txt: "Overdue example", color: "#ef4444", due: iso(-1) },
        ],
      },
      {
        id: genId(),
        name: "Done",
        cards: [
          {
            id: genId(),
            txt: "Hit Share — the URL *is* the board",
            desc: "No backend. The whole board lives in the link.",
            color: "#10b981",
          },
        ],
      },
    ],
  };
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
  return b.cols.every((c) => {
    if (typeof c !== "object" || c === null) return false;
    const col = c as Record<string, unknown>;
    if (typeof col.id !== "string" || typeof col.name !== "string")
      return false;
    if (col.wip !== undefined && typeof col.wip !== "number") return false; // §V.13
    if (!Array.isArray(col.cards)) return false;
    return col.cards.every((cd) => {
      if (typeof cd !== "object" || cd === null) return false;
      const card = cd as Record<string, unknown>;
      return typeof card.id === "string" && typeof card.txt === "string";
    });
  });
}
