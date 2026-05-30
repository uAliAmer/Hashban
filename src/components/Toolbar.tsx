import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  AlignJustify,
  Download,
  Layers,
  MoreHorizontal,
  Redo2,
  Search,
  Share2,
  Trash,
  Undo2,
  Upload,
  X,
} from "lucide-react";
import { BoardSidebar } from "@/components/BoardSidebar";
import { ThemePicker } from "@/components/ThemePicker";
import { useAlert, useConfirm } from "@/components/ui/app-dialogs";
import { Board, defaultBoard, isBoard, SOFT_LIMIT } from "@/lib/board";
import { addLane as opAddLane, renameBoard } from "@/lib/ops";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Share button: copy + QR popover
function ShareButton() {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  async function copyUrl() {
    try { await navigator.clipboard.writeText(window.location.href); } catch { /* noop */ }
  }

  async function handleShare() {
    await copyUrl();
    setCopied(true); setTimeout(() => setCopied(false), 1500);
    setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000);
    if (!qrOpen) {
      QRCode.toDataURL(window.location.href, {
        width: 200, margin: 1, color: { dark: "#e4e4e7", light: "#18181b" },
      }).then(setQrDataUrl).catch(() => setQrDataUrl(""));
      setQrOpen(true);
    } else { setQrOpen(false); }
  }

  async function handleInlineCopy() {
    await copyUrl();
    setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000);
  }

  useEffect(() => {
    if (!qrOpen) return;
    const h = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setQrOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [qrOpen]);

  const url = window.location.href;

  return (
    <div ref={popoverRef} className="relative">
      <Button onClick={handleShare} size="sm" className="gap-1.5">
        <Share2 size={15} /> {copied ? "Copied!" : "Share"}
      </Button>
      {qrOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border border-zinc-700 bg-zinc-900 p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-300">Share board</span>
            <button onClick={() => setQrOpen(false)} className="rounded p-0.5 text-zinc-500 hover:text-zinc-200" aria-label="Close">
              <X size={13} />
            </button>
          </div>
          <div className={`mb-3 flex items-center gap-1.5 overflow-hidden rounded-lg border px-2 py-1.5 transition-all duration-300 ${linkCopied ? "border-green-500/60 bg-green-950/40" : "border-zinc-700 bg-zinc-800"}`}>
            <span className={`flex-1 truncate text-[11px] transition-colors duration-300 ${linkCopied ? "text-green-300" : "text-zinc-400"}`}>
              {url.length > 36 ? url.slice(0, 36) + "…" : url}
            </span>
            <button onClick={handleInlineCopy} className={`shrink-0 rounded p-1 transition-all duration-200 ${linkCopied ? "text-green-400 scale-110" : "text-zinc-500 hover:text-zinc-200"}`} aria-label="Copy link">
              {linkCopied
                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
              }
            </button>
          </div>
          {qrDataUrl
            ? <img src={qrDataUrl} alt="QR code" className="w-full rounded-lg" />
            : <div className="flex h-48 items-center justify-center text-xs text-zinc-600">Generating…</div>}
          <p className="mt-1.5 text-center text-[9px] text-zinc-600">Scan to open on another device</p>
        </div>
      )}
    </div>
  );
}

// ⋯ overflow menu — secondary actions
function MoreMenu({
  compact, setCompact, board, setBoard, onExport, onImport, onClear,
}: {
  compact: boolean;
  setCompact: (v: boolean) => void;
  board: Board;
  setBoard: (next: Board | ((p: Board) => Board)) => void;
  onExport: () => void;
  onImport: () => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const swimActive = !!(board.lanes?.length);

  function item(label: string, icon: React.ReactNode, onClick: () => void, active = false) {
    return (
      <button
        onClick={() => { onClick(); setOpen(false); }}
        className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors ${active ? "bg-blue-900/40 text-blue-300" : "text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"}`}
      >
        {icon} {label}
      </button>
    );
  }

  return (
    <div ref={ref} className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen(v => !v)} aria-label="More options" title="More">
        <MoreHorizontal size={16} />
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-52 rounded-xl border border-zinc-700 bg-zinc-900 p-1.5 shadow-2xl">
          <div className="mb-1 px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-600">View</div>
          {item(compact ? "Normal view" : "Compact view", <AlignJustify size={14} />, () => setCompact(!compact), compact)}
          {item(swimActive ? "Exit swimlanes" : "Swimlanes", <Layers size={14} />, () => {
            if (swimActive) setBoard(b => ({ ...b, lanes: [] }));
            else setBoard(b => opAddLane(b, "Lane 1"));
          }, swimActive)}

          <div className="my-1.5 border-t border-zinc-800" />
          <div className="mb-1 px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-600">Board</div>
          {item("Export JSON", <Download size={14} />, onExport)}
          {item("Import JSON", <Upload size={14} />, onImport)}
          <div className="my-1.5 border-t border-zinc-800" />
          {item("Clear board", <Trash size={14} />, onClear)}
        </div>
      )}
    </div>
  );
}

export function Toolbar({
  board,
  setBoard,
  undo,
  redo,
  canUndo,
  canRedo,
  payloadLen,
  overLimit,
  query,
  setQuery,
  compact,
  setCompact,
}: {
  board: Board;
  setBoard: (next: Board | ((p: Board) => Board)) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  payloadLen: number;
  overLimit: boolean;
  query: string;
  setQuery: (q: string) => void;
  compact: boolean;
  setCompact: (v: boolean) => void;
}) {
  const confirm = useConfirm();
  const alert = useAlert();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editingTitle, setEditingTitle] = useState(false);

  function exportJson() {
    const blob = new Blob([JSON.stringify(board, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${board.t || "hashban"}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  function importJson(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (isBoard(parsed)) setBoard(parsed);
        else await alert("Invalid board file — structure doesn't match a Hashban board.");
      } catch { await alert("Could not parse JSON. Make sure the file is a valid .json export."); }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function clearBoard() {
    if (await confirm("Reset to a fresh empty board? This cannot be undone.", { danger: true, requireTyped: "confirm" }))
      setBoard(defaultBoard());
  }

  return (
    <header className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-zinc-800 px-4 py-2">

      {/* LEFT — logo + title + sidebar */}
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-sm font-bold text-zinc-400">#</span>
        {editingTitle ? (
          <Input
            autoFocus defaultValue={board.t} dir="auto"
            onBlur={(e) => { setBoard(b => renameBoard(b, e.target.value.trim() || "Board")); setEditingTitle(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") setEditingTitle(false); }}
            className="h-8 w-44"
          />
        ) : (
          <button onClick={() => setEditingTitle(true)} dir="auto"
            className="max-w-[180px] truncate text-sm font-semibold text-zinc-100 hover:text-white hover:underline"
            title="Rename board"
          >
            {board.t}
          </button>
        )}
        <BoardSidebar board={board} />
      </div>

      {/* CENTER — search bar, always visible, full width */}
      <div className="flex justify-center">
        <div className="relative w-full max-w-md">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cards…"
            className="h-9 w-full rounded-lg pl-8 pr-8"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* RIGHT — primary actions only */}
      <div className="flex items-center gap-0.5">
        {overLimit && (
          <span className="mr-1 rounded bg-amber-900/60 px-2 py-1 text-xs text-amber-200"
            title={`URL payload ${payloadLen} chars ≥ ${SOFT_LIMIT}. May exceed browser limits.`}>
            ⚠ {payloadLen}
          </span>
        )}
        <ThemePicker />
        <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} aria-label="Undo" title="Undo (Ctrl+Z)">
          <Undo2 size={16} />
        </Button>
        <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} aria-label="Redo" title="Redo">
          <Redo2 size={16} />
        </Button>
        <MoreMenu
          compact={compact} setCompact={setCompact}
          board={board} setBoard={setBoard}
          onExport={exportJson}
          onImport={() => fileRef.current?.click()}
          onClear={clearBoard}
        />
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={importJson} />
        <div className="ml-1">
          <ShareButton />
        </div>
      </div>

    </header>
  );
}
