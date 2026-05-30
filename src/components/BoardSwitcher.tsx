import { useState } from "react";
import { BookMarked, Save, Trash2 } from "lucide-react";
import { Board } from "@/lib/board";
import { useBoardIndex } from "@/hooks/useBoardIndex";
import { Button } from "@/components/ui/button";

// §V.21 — board switcher: localStorage index only, hash = source of truth.
export function BoardSwitcher({ board }: { board: Board }) {
  const { index, saveBoard, deleteBoard, switchBoard } = useBoardIndex();
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    saveBoard(board);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          title="Save board to index"
          aria-label="Save board"
          onClick={handleSave}
          className={saved ? "text-green-400" : ""}
        >
          <Save size={15} />
        </Button>
        {index.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            title="Saved boards"
            aria-label="Saved boards"
            onClick={() => setOpen((v) => !v)}
            className={open ? "text-blue-400" : ""}
          >
            <BookMarked size={15} />
          </Button>
        )}
      </div>

      {open && index.length > 0 && (
        <>
          {/* backdrop */}
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-40 mt-1 w-64 rounded-lg border border-zinc-700 bg-zinc-900 p-1 shadow-xl">
            <div className="mb-1 px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-500">
              Saved boards
            </div>
            <div className="max-h-64 overflow-y-auto">
              {index.map((entry) => (
                <div
                  key={entry.id}
                  className="group flex items-center gap-1 rounded px-2 py-1.5 hover:bg-zinc-800"
                >
                  <button
                    className="flex-1 truncate text-left text-sm text-zinc-200"
                    onClick={() => { switchBoard(entry); setOpen(false); }}
                  >
                    {entry.name}
                  </button>
                  <span className="shrink-0 text-[10px] text-zinc-600">
                    {new Date(entry.updatedAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => deleteBoard(entry.id)}
                    className="shrink-0 text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100"
                    aria-label="Delete saved board"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-1 border-t border-zinc-800 px-2 pt-1 text-[10px] text-zinc-600">
              Switching loads that board's URL hash into the current tab.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
