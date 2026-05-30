import { useCallback, useEffect, useRef, useState } from "react";
import {
  Board,
  decode,
  defaultBoard,
  demoBoard,
  encode,
  SOFT_LIMIT,
  templateBoard,
} from "@/lib/board";

const LS_KEY = "hashban:last";
const MAX_HISTORY = 50;

function readHash(): string {
  return window.location.hash.replace(/^#/, "");
}

// §V.18 — check ?template= param; if present + no hash, seed template and remove param.
function checkTemplateParam(): Board | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const name = params.get("template");
    if (!name || readHash()) return null; // existing hash wins (§V.18)
    const board = templateBoard(name);
    if (!board) return null;
    // remove the param so sharing the URL doesn't re-seed
    params.delete("template");
    const newSearch = params.toString();
    window.history.replaceState(
      null,
      "",
      window.location.pathname + (newSearch ? `?${newSearch}` : "") + window.location.hash
    );
    return board;
  } catch {
    return null;
  }
}

// §V.1+V.3+V.8 — resolve initial board: hash > localStorage cache > default.
function loadInitial(): Board {
  const fromHash = decode(readHash());
  if (fromHash) return fromHash;

  // §V.3 — invalid hash present: do NOT silently destroy it. Fall through to
  // cache/default for display only; next edit re-commits and replaces it.
  if (!readHash()) {
    // §V.18 — ?template= param takes priority over cache/demo
    const fromTemplate = checkTemplateParam();
    if (fromTemplate) return fromTemplate;

    try {
      const cached = window.localStorage.getItem(LS_KEY); // §C cache only
      if (cached) {
        const b = decode(cached);
        if (b) return b;
      }
    } catch {
      /* ignore storage errors */
    }
    // §V.10 — first visit (no hash & no cache): seed demo board.
    return demoBoard();
  }
  return defaultBoard(); // §V.8 (hash present but invalid)
}

export type BoardApi = {
  board: Board;
  setBoard: (next: Board | ((prev: Board) => Board)) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  payloadLen: number;
  overLimit: boolean;
};

export function useBoard(): BoardApi {
  const [board, setBoardState] = useState<Board>(loadInitial);

  // ref mirrors latest board so callbacks read current value without
  // doing side effects inside a setState updater (which React may re-run).
  const boardRef = useRef(board);
  boardRef.current = board;

  // §V.9 — undo/redo snapshot stacks
  const past = useRef<Board[]>([]);
  const future = useRef<Board[]>([]);

  // guard so our own hash writes don't loop back through hashchange
  const writing = useRef(false);

  // §V.1 — commit: write hash (source of truth) + localStorage cache
  const commit = useCallback((b: Board) => {
    const payload = encode(b);
    writing.current = true;
    window.location.hash = payload;
    setTimeout(() => (writing.current = false), 0);
    try {
      window.localStorage.setItem(LS_KEY, payload); // §C cache
    } catch {
      /* storage full/unavailable — hash still authoritative */
    }
  }, []);

  // apply a new board: update ref + state + commit hash. §V.1
  const apply = useCallback(
    (b: Board) => {
      boardRef.current = b;
      commit(b);
      setBoardState(b);
    },
    [commit]
  );

  // commit initial state so a freshly opened (hashless) board is shareable
  useEffect(() => {
    if (!readHash()) commit(boardRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setBoard = useCallback(
    (next: Board | ((prev: Board) => Board)) => {
      const prev = boardRef.current;
      const resolved =
        typeof next === "function"
          ? (next as (p: Board) => Board)(prev)
          : next;
      past.current.push(prev); // §V.9
      if (past.current.length > MAX_HISTORY) past.current.shift();
      future.current = [];
      apply(resolved);
    },
    [apply]
  );

  const undo = useCallback(() => {
    if (past.current.length === 0) return;
    const prev = past.current.pop()!;
    future.current.push(boardRef.current);
    apply(prev); // §V.9 each step re-commits hash
  }, [apply]);

  const redo = useCallback(() => {
    if (future.current.length === 0) return;
    const nxt = future.current.pop()!;
    past.current.push(boardRef.current);
    apply(nxt);
  }, [apply]);

  // §I — hashchange: cross-tab / back-button sync. §V.3 safe on bad hash.
  useEffect(() => {
    const onHash = () => {
      if (writing.current) return; // ignore our own writes
      const b = decode(readHash());
      if (b) {
        // external change — linear undo across foreign states undefined; reset.
        past.current = [];
        future.current = [];
        boardRef.current = b;
        setBoardState(b);
      }
      // §V.3 invalid external hash -> keep current state, no crash
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const payloadLen = encode(board).length;

  return {
    board,
    setBoard,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
    payloadLen,
    overLimit: payloadLen >= SOFT_LIMIT, // §V.7
  };
}
