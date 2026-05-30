import { useState, useEffect } from "react";
import { LayoutDashboard, Save, Trash2, X, CheckCircle2, Clock } from "lucide-react";
import { useConfirm } from "@/components/ui/app-dialogs";
import { Board, decode, encode } from "@/lib/board";
import { useBoardIndex, BoardEntry } from "@/hooks/useBoardIndex";
import { cn } from "@/lib/utils";

// §V.21 — board sidebar: IndexedDB index, hash = source of truth.

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function totalCards(board: Board): number {
  return board.cols.reduce((s, c) => s + c.cards.length, 0);
}

function BoardCard({ entry, isCurrent, onOpen, onDelete }: {
  entry: BoardEntry;
  isCurrent: boolean;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const decoded = decode(entry.hash);
  const cards = decoded ? totalCards(decoded) : 0;
  const cols = decoded?.cols.length ?? 0;

  return (
    <div className={cn(
      "group relative rounded-xl border p-3 transition-all",
      isCurrent
        ? "border-blue-500/60 bg-blue-950/30 ring-1 ring-blue-500/30"
        : "border-zinc-700/60 bg-zinc-800/40 hover:border-zinc-500 hover:bg-zinc-800/80 cursor-pointer"
    )}
      onClick={!isCurrent ? onOpen : undefined}
      role={!isCurrent ? "button" : undefined}
      title={isCurrent ? "Currently open" : `Open "${entry.name}"`}
    >
      {/* header row */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={cn("truncate text-sm font-semibold leading-tight", isCurrent ? "text-blue-200" : "text-zinc-100")}>
            {entry.name}
          </p>
          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-zinc-500">
            <span className="flex items-center gap-1"><Clock size={9} />{relativeDate(entry.updatedAt)}</span>
            <span>·</span>
            <span>{cols} col{cols !== 1 ? "s" : ""}</span>
            <span>·</span>
            <span>{cards} card{cards !== 1 ? "s" : ""}</span>
          </div>
        </div>
        {isCurrent && (
          <span className="shrink-0 rounded-md bg-blue-600/40 px-1.5 py-0.5 text-[10px] font-medium text-blue-300">
            open
          </span>
        )}
      </div>

      {/* column preview strip */}
      {decoded && (
        <div className="flex flex-wrap gap-1">
          {decoded.cols.map((col) => (
            <span key={col.id}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px]"
              style={{
                background: col.color ? `${col.color}22` : "#27272a55",
                border: `1px solid ${col.color ?? "#3f3f46"}66`,
                color: col.color ?? "#a1a1aa",
              }}
            >
              <span className="max-w-[72px] truncate">{col.name}</span>
              {col.cards.length > 0 && (
                <span className="tabular-nums opacity-60">{col.cards.length}</span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* delete */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute right-2 top-2 rounded p-1 text-zinc-700 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
        aria-label={`Delete "${entry.name}"`}
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

// The trigger button — exported so Toolbar can place it top-left
export function BoardSidebarTrigger({ onClick, active }: { onClick: () => void; active: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-label="Boards"
      title="Saved boards"
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-blue-900/40 text-blue-300"
          : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
      )}
    >
      <LayoutDashboard size={16} />
      <span className="hidden sm:inline">Boards</span>
    </button>
  );
}

export function BoardSidebar({ board }: { board: Board }) {
  const { index, loading, saveBoard, deleteBoard, switchBoard } = useBoardIndex();
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "uptodate">("idle");

  const currentHash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
  const encodedCurrent = encode(board);

  function isCurrent(entry: BoardEntry) {
    return entry.hash === currentHash || entry.hash === encodedCurrent;
  }

  const alreadySaved = index.some(isCurrent);

  async function handleSave() {
    if (alreadySaved) {
      setSaveStatus("uptodate");
      setTimeout(() => setSaveStatus("idle"), 2000);
      return;
    }
    await saveBoard(board);
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 1500);
  }

  useEffect(() => { if (!open) setSaveStatus("idle"); }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open]);

  return (
    <>
      <BoardSidebarTrigger onClick={() => setOpen(true)} active={open} />

      {/* backdrop */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      {/* panel */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-80 flex-col bg-zinc-950/95 shadow-2xl backdrop-blur-md transition-transform duration-200",
          "border-r border-zinc-800",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        aria-hidden={!open}
      >
        {/* panel header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <LayoutDashboard size={16} className="text-zinc-400" />
            <span className="text-sm font-semibold text-zinc-100">My Boards</span>
            {index.length > 0 && (
              <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] tabular-nums text-zinc-500">
                {index.length}
              </span>
            )}
          </div>
          <button onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* save current board */}
        <div className="border-b border-zinc-800 px-4 py-3">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-xs text-zinc-500">Current board</span>
            <span className="max-w-[160px] truncate text-xs font-medium text-zinc-300" dir="auto">{board.t}</span>
          </div>

          {saveStatus === "saved" && (
            <div className="mb-2 flex items-center gap-1.5 text-xs text-green-400">
              <CheckCircle2 size={12} /> Saved to your boards
            </div>
          )}
          {saveStatus === "uptodate" && (
            <div className="mb-2 flex items-center gap-1.5 text-xs text-zinc-500">
              <CheckCircle2 size={12} /> Already up to date
            </div>
          )}

          <button onClick={handleSave}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
              alreadySaved
                ? "border-zinc-700 bg-zinc-800/50 text-zinc-500 hover:text-zinc-300"
                : "border-zinc-600 bg-zinc-800 text-zinc-200 hover:border-zinc-400 hover:bg-zinc-700 hover:text-white"
            )}
          >
            <Save size={13} />
            {alreadySaved ? "Saved" : "Save current board"}
          </button>
        </div>

        {/* board list */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-800/50" />
              ))}
            </div>
          ) : index.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <LayoutDashboard size={32} className="mb-3 text-zinc-700" />
              <p className="text-sm font-medium text-zinc-500">No saved boards yet</p>
              <p className="mt-1 text-xs text-zinc-600 leading-relaxed">
                Save your current board above<br />to access it quickly later.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {index.map((entry) => (
                <BoardCard
                  key={entry.id}
                  entry={entry}
                  isCurrent={isCurrent(entry)}
                  onOpen={() => { switchBoard(entry); setOpen(false); }}
                  onDelete={async () => {
                    if (await confirm(`Remove "${entry.name}" from your boards?`, { danger: true }))
                      deleteBoard(entry.id);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* footer */}
        <div className="border-t border-zinc-800 px-4 py-2.5 text-[10px] leading-relaxed text-zinc-600">
          Saved in this browser · auto-saves after every edit · share via URL
        </div>
      </div>
    </>
  );
}
