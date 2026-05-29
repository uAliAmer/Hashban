import { useEffect } from "react";
import { useBoard } from "@/hooks/useBoard";
import { Board } from "@/components/Board";
import { Toolbar } from "@/components/Toolbar";

export default function App() {
  const api = useBoard();

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
      />
      <main className="min-h-0 flex-1">
        <Board board={api.board} setBoard={api.setBoard} />
      </main>
    </div>
  );
}
