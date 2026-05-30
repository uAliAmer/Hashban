// §V.21 — multi-board index in localStorage only. ⊥ authoritative.
// Each entry stores {id, name, hash}. Switching board = set location.hash.

import { useCallback, useState } from "react";
import { encode } from "@/lib/board";
import type { Board } from "@/lib/board";

const LS_INDEX_KEY = "hashban:boards";

export type BoardEntry = {
  id: string;
  name: string;
  hash: string;
  updatedAt: string;
};

function readIndex(): BoardEntry[] {
  try {
    const raw = localStorage.getItem(LS_INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeIndex(entries: BoardEntry[]) {
  try {
    localStorage.setItem(LS_INDEX_KEY, JSON.stringify(entries));
  } catch { /* quota */ }
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function useBoardIndex() {
  const [index, setIndex] = useState<BoardEntry[]>(readIndex);

  const saveBoard = useCallback((board: Board) => {
    const hash = encode(board);
    setIndex((prev) => {
      const names = new Set(prev.map((e) => e.name));
      // find unique name: "My Board" → "My Board 2" → "My Board 3" …
      let name = board.t;
      if (names.has(name)) {
        let n = 2;
        while (names.has(`${board.t} ${n}`)) n++;
        name = `${board.t} ${n}`;
      }
      const entry: BoardEntry = { id: genId(), name, hash, updatedAt: new Date().toISOString() };
      const next = [entry, ...prev];
      writeIndex(next);
      return next;
    });
  }, []);

  const deleteBoard = useCallback((id: string) => {
    setIndex((prev) => {
      const next = prev.filter((e) => e.id !== id);
      writeIndex(next);
      return next;
    });
  }, []);

  const switchBoard = useCallback((entry: BoardEntry) => {
    window.location.hash = entry.hash;
  }, []);

  const renameEntry = useCallback((id: string, name: string) => {
    setIndex((prev) => {
      const next = prev.map((e) => e.id === id ? { ...e, name } : e);
      writeIndex(next);
      return next;
    });
  }, []);

  return { index, saveBoard, deleteBoard, switchBoard, renameEntry };
}
