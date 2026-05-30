import { useState, useEffect } from "react";
import { BookMarked, Save, Trash2, X, CheckCircle2 } from "lucide-react";
import { useConfirm } from "@/components/ui/app-dialogs";
import { Board, decode, encode } from "@/lib/board";
import { useBoardIndex, BoardEntry } from "@/hooks/useBoardIndex";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// §V.21 — board sidebar: localStorage index only, hash = source of truth.

function BoardPreview({ entry, isCurrent }: { entry: BoardEntry; isCurrent: boolean }) {
  const decoded = decode(entry.hash);

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-colors",
        isCurrent
          ? "border-blue-500 bg-blue-950/40"
          : "border-zinc-700 bg-zinc-800/60 group-hover:border-zinc-500"
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className={cn("truncate text-sm font-semibold", isCurrent ? "text-blue-300" : "text-zinc-200")}>
          {entry.name}
        </span>
        {isCurrent && (
          <span className="shrink-0 rounded bg-blue-600/50 px-1.5 py-0.5 text-[10px] font-medium text-blue-200">
            current
          </span>
        )}
      </div>

      {/* column strip preview */}
      {decoded ? (
        <div className="flex flex-wrap gap-1">
          {decoded.cols.map((col) => (
            <span
              key={col.id}
              className="flex items-center gap-1 rounded-sm py-0.5 pl-1.5 pr-1 text-[11px] text-zinc-400"
              style={{ borderLeft: `3px solid ${col.color ?? "#3f3f46"}` }}
            >
              <span className="max-w-[80px] truncate">{col.name}</span>
              <span className="tabular-nums text-zinc-600">{col.cards.length}</span>
            </span>
          ))}
        </div>
      ) : (
        <span className="text-[11px] text-zinc-600">Preview unavailable</span>
      )}

      <div className="mt-2 text-[10px] text-zinc-600">
        {new Date(entry.updatedAt).toLocaleDateString(undefined, {
          month: "short", day: "numeric", year: "numeric",
        })}
      </div>
    </div>
  );
}

export function BoardSidebar({ board }: { board: Board }) {
  const { index, loading, saveBoard, deleteBoard, switchBoard } = useBoardIndex();
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "uptodate">("idle");

  const currentHash = typeof window !== "undefined"
    ? window.location.hash.replace(/^#/, "")
    : "";
  const encodedCurrent = encode(board);

  function isCurrent(entry: BoardEntry) {
    return entry.hash === currentHash || entry.hash === encodedCurrent;
  }

  // already saved if any entry has this exact hash
  const alreadySaved = index.some(isCurrent);

  async function handleSaveClick() {
    if (alreadySaved) {
      setSaveStatus("uptodate");
      setTimeout(() => setSaveStatus("idle"), 2000);
      return;
    }
    await saveBoard(board);
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 1500);
  }

  // reset save status when sidebar closes
  useEffect(() => {
    if (!open) setSaveStatus("idle");
  }, [open]);

  // close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* toolbar trigger */}
      <Button
        variant="ghost"
        size="icon"
        title="Saved boards"
        aria-label="Saved boards"
        onClick={() => setOpen(true)}
        className={open ? "text-blue-400" : ""}
      >
        <BookMarked size={15} />
      </Button>

      {/* backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* sidebar panel — slides in from left */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-80 flex-col border-r border-zinc-700 bg-zinc-950 shadow-2xl transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        aria-hidden={!open}
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <BookMarked size={16} className="text-zinc-400" />
            <span className="text-sm font-semibold text-zinc-200">Saved Boards</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* save current board */}
        <div className="border-b border-zinc-800 px-4 py-3">
          <p className="mb-2 text-[11px] text-zinc-500">
            Current board:{" "}
            <span className="font-medium text-zinc-300">{board.t}</span>
          </p>

          {saveStatus === "saved" && (
            <div className="mb-2 flex items-center gap-1.5 text-xs text-green-400">
              <CheckCircle2 size={13} /> Saved!
            </div>
          )}

          {saveStatus === "uptodate" && (
            <div className="mb-2 flex items-center gap-1.5 text-xs text-zinc-500">
              <CheckCircle2 size={13} /> Already saved — no changes to save.
            </div>
          )}

          <button
              onClick={handleSaveClick}
              className="flex w-full items-center justify-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 transition-colors hover:bg-zinc-700 hover:text-white"
            >
              <Save size={14} />
              Save current board
            </button>
        </div>

        {/* board list */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="flex flex-col gap-2.5">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-zinc-800/60" />
              ))}
            </div>
          ) : index.length === 0 ? (
            <div className="mt-10 text-center">
              <p className="text-sm text-zinc-600">No saved boards yet.</p>
              <p className="mt-1 text-xs text-zinc-700">
                Save the current board above to start building your collection.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {index.map((entry) => (
                <div key={entry.id} className="group relative">
                  <button
                    className="w-full cursor-pointer text-left disabled:cursor-default"
                    onClick={() => {
                      if (!isCurrent(entry)) {
                        switchBoard(entry);
                        setOpen(false);
                      }
                    }}
                    disabled={isCurrent(entry)}
                    title={isCurrent(entry) ? "Currently open" : `Switch to "${entry.name}"`}
                  >
                    <BoardPreview entry={entry} isCurrent={isCurrent(entry)} />
                  </button>
                  <button
                    onClick={async () => {
                      if (await confirm(`Remove "${entry.name}" from saved boards?`, { danger: true }))
                        deleteBoard(entry.id);
                    }}
                    className="absolute right-2 top-2 rounded p-1 text-zinc-700 opacity-0 hover:text-red-400 group-hover:opacity-100"
                    aria-label={`Delete "${entry.name}"`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* footer */}
        <div className="border-t border-zinc-800 px-4 py-2.5 text-[10px] leading-relaxed text-zinc-600">
          Boards saved in this browser only. Share the URL to send a board to someone else.
        </div>
      </div>
    </>
  );
}
