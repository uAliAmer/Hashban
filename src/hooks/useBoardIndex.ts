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
      // find entry by board title match or create new
      const existing = prev.find((e) => e.name === board.t);
      let next: BoardEntry[];
      if (existing) {
        next = prev.map((e) =>
          e.id === existing.id ? { ...e, hash, updatedAt: new Date().toISOString() } : e
        );
      } else {
        const entry: BoardEntry = {
          id: genId(),
          name: board.t,
          hash,
          updatedAt: new Date().toISOString(),
        };
        next = [entry, ...prev];
      }
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
