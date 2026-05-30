// §V.24 — board index backed by IndexedDB. localStorage migrated on first open.

import { useCallback, useEffect, useState } from "react";
import { encode } from "@/lib/board";
import type { Board } from "@/lib/board";
import { getAllBoards, putBoard, removeBoard } from "@/lib/db";

export type BoardEntry = {
  id: string;
  name: string;
  hash: string;
  updatedAt: string;
};

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function useBoardIndex() {
  const [index, setIndex] = useState<BoardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // load from IDB on mount (includes migration from localStorage)
  useEffect(() => {
    getAllBoards()
      .then(setIndex)
      .catch(() => {}) // IDB unavailable — degrade silently
      .finally(() => setLoading(false));
  }, []);

  const saveBoard = useCallback(async (board: Board) => {
    const hash = encode(board);
    const current = await getAllBoards().catch(() => [] as BoardEntry[]);
    const names = new Set(current.map((e) => e.name));

    // unique name: "My Board" → "My Board 2" → "My Board 3" …
    let name = board.t;
    if (names.has(name)) {
      let n = 2;
      while (names.has(`${board.t} ${n}`)) n++;
      name = `${board.t} ${n}`;
    }

    const entry: BoardEntry = {
      id: genId(),
      name,
      hash,
      updatedAt: new Date().toISOString(),
    };

    await putBoard(entry).catch(() => {});
    setIndex(await getAllBoards().catch(() => current));
  }, []);

  const deleteBoard = useCallback(async (id: string) => {
    await removeBoard(id).catch(() => {});
    setIndex((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const switchBoard = useCallback((entry: BoardEntry) => {
    window.location.hash = entry.hash;
  }, []);

  const renameEntry = useCallback(async (id: string, name: string) => {
    setIndex((prev) => {
      const updated = prev.map((e) => e.id === id ? { ...e, name } : e);
      const entry = updated.find((e) => e.id === id);
      if (entry) putBoard(entry).catch(() => {});
      return updated;
    });
  }, []);

  return { index, loading, saveBoard, deleteBoard, switchBoard, renameEntry };
}
