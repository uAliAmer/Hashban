import { useEffect, useState } from "react";
import { useBoard } from "@/hooks/useBoard";
import { Board } from "@/components/Board";
import { SwimBoard } from "@/components/SwimBoard";
import { Toolbar } from "@/components/Toolbar";

export default function App() {
  const api = useBoard();
  // §V.11 — search/filter is ephemeral UI state: not in board, hash, or storage.
  const [query, setQuery] = useState("");

  // keyboard: Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z (or Ctrl+Y) redo (§T12)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        api.undo();
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        api.redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [api]);

  return (
    <div className="flex h-full flex-col">
      <Toolbar
        board={api.board}
        setBoard={api.setBoard}
        undo={api.undo}
        redo={api.redo}
        canUndo={api.canUndo}
        canRedo={api.canRedo}
        payloadLen={api.payloadLen}
        overLimit={api.overLimit}
        query={query}
        setQuery={setQuery}
      />
      <main className="min-h-0 flex-1 overflow-auto">
        {/* §V.17 — swimlane grid when board.lanes present; normal column view otherwise */}
        {api.board.lanes && api.board.lanes.length > 0 ? (
          <SwimBoard board={api.board} setBoard={api.setBoard} query={query} />
        ) : (
          <Board board={api.board} setBoard={api.setBoard} query={query} />
        )}
      </main>
    </div>
  );
}
