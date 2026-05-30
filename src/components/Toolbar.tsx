import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  AlignJustify,
  Download,
  Keyboard,
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
import { Dialog } from "@/components/ui/dialog";

const SHORTCUTS: { keys: string[]; action: string }[] = [
  { keys: ["↑", "↓"], action: "Move focus between cards" },
  { keys: ["←", "→"], action: "Jump to adjacent column" },
  { keys: ["Enter"], action: "Edit focused card" },
  { keys: ["Delete", "Backspace"], action: "Delete focused card" },
  { keys: ["n"], action: "Add card to focused column" },
  { keys: ["Ctrl/⌘", "Z"], action: "Undo" },
  { keys: ["Ctrl/⌘", "Shift", "Z"], action: "Redo" },
  { keys: ["Ctrl", "Y"], action: "Redo (alternate)" },
];

function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <div className="mb-4 flex items-center gap-2">
        <Keyboard size={16} className="text-zinc-400" />
        <h2 className="text-sm font-semibold text-zinc-200">Keyboard Shortcuts</h2>
      </div>
      <div className="flex flex-col gap-1.5">
        {SHORTCUTS.map((s) => (
          <div key={s.action} className="flex items-center justify-between gap-4">
            <span className="text-xs text-zinc-400">{s.action}</span>
            <div className="flex shrink-0 items-center gap-1">
              {s.keys.map((k) => (
                <kbd key={k} className="rounded border border-zinc-600 bg-zinc-800 px-1.5 py-0.5 text-[11px] font-mono text-zinc-300">
                  {k}
                </kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Dialog>
  );
}

// Share button: copy + QR popover
// QR level L (7% error correction) max capacity: ~4296 alphanumeric chars.
// Use 3500 as safe threshold to keep cells large enough to scan reliably.
const QR_MAX_URL = 3500;

// Worker URL — update after deploying hashban-short
const SHORTENER_URL = "https://hashban-short.ualiamer7.workers.dev";

function ShareButton() {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrTooLong, setQrTooLong] = useState(false);
  const [shortUrl, setShortUrl] = useState("");
  const [shortening, setShortening] = useState(false);
  const [shortCopied, setShortCopied] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  async function copyUrl(url?: string) {
    try { await navigator.clipboard.writeText(url ?? window.location.href); } catch { /* noop */ }
  }

  async function handleShorten() {
    setShortening(true);
    try {
      // encode # as %23 so the fragment survives HTTP redirect
      const encodedUrl = window.location.href.replace(/#/, "%23");
      const res = await fetch(`${SHORTENER_URL}/shorten`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: encodedUrl }),
      });
      if (!res.ok) throw new Error("shorten failed");
      const data = await res.json() as { short: string };
      setShortUrl(data.short);
    } catch {
      setShortUrl("");
    } finally {
      setShortening(false);
    }
  }

  async function copyShort() {
    await copyUrl(shortUrl);
    setShortCopied(true);
    setTimeout(() => setShortCopied(false), 1500);
  }

  async function handleShare() {
    await copyUrl();
    setCopied(true); setTimeout(() => setCopied(false), 1500);
    setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000);
    if (!qrOpen) {
      const urlLen = window.location.href.length;
      if (urlLen > QR_MAX_URL) {
        setQrTooLong(true);
        setQrDataUrl("");
      } else {
        setQrTooLong(false);
        QRCode.toDataURL(window.location.href, {
          width: 240,
          margin: 1,
          errorCorrectionLevel: "L",  // max capacity ~4296 chars
          color: { dark: "#e4e4e7", light: "#18181b" },
        }).then(setQrDataUrl).catch(() => setQrDataUrl(""));
      }
      setQrOpen(true);
    } else { setQrOpen(false); }
  }

  async function handleInlineCopy() {
    await copyUrl(undefined);
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
          {/* full URL row */}
          <div className={`mb-2 flex items-center gap-1.5 overflow-hidden rounded-lg border px-2 py-1.5 transition-all duration-300 ${linkCopied ? "border-green-500/60 bg-green-950/40" : "border-zinc-700 bg-zinc-800"}`}>
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

          {/* short URL row */}
          {shortUrl ? (
            <div className={`mb-2 flex items-center gap-1.5 overflow-hidden rounded-lg border px-2 py-1.5 transition-all duration-300 ${shortCopied ? "border-green-500/60 bg-green-950/40" : "border-blue-700/50 bg-blue-950/30"}`}>
              <span className={`flex-1 truncate text-[11px] font-medium transition-colors ${shortCopied ? "text-green-300" : "text-blue-300"}`}>
                {shortUrl}
              </span>
              <button onClick={copyShort} className={`shrink-0 rounded p-1 transition-all duration-200 ${shortCopied ? "text-green-400 scale-110" : "text-blue-400 hover:text-blue-200"}`} aria-label="Copy short link">
                {shortCopied
                  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                }
              </button>
            </div>
          ) : (
            <button
              onClick={handleShorten}
              disabled={shortening}
              className="mb-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-[11px] text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-50"
            >
              {shortening ? "Shortening…" : "✂ Shorten URL"}
            </button>
          )}
          {qrTooLong ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-6 text-center">
              <span className="text-2xl">📋</span>
              <p className="text-xs font-medium text-zinc-300">Board URL too long for QR</p>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Your board is very large. Use the copy button above to share the link directly.
              </p>
            </div>
          ) : qrDataUrl ? (
            <img src={qrDataUrl} alt="QR code" className="w-full rounded-lg" />
          ) : (
            <div className="flex h-48 items-center justify-center text-xs text-zinc-600">Generating…</div>
          )}
          {!qrTooLong && <p className="mt-1.5 text-center text-[9px] text-zinc-600">Scan to open on another device</p>}
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
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
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
          {item("Keyboard shortcuts", <Keyboard size={14} />, () => setShortcutsOpen(true))}
          <div className="my-1.5 border-t border-zinc-800" />
          {item("Clear board", <Trash size={14} />, onClear)}
        </div>
      )}
      <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
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

      {/* LEFT — sidebar trigger + logo + title */}
      <div className="flex items-center gap-1.5">
        <BoardSidebar board={board} />
        <span className="ml-1 font-mono text-xs font-bold text-zinc-600">#</span>
        {editingTitle ? (
          <Input
            autoFocus defaultValue={board.t} dir="auto"
            onBlur={(e) => { setBoard(b => renameBoard(b, e.target.value.trim() || "Board")); setEditingTitle(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") setEditingTitle(false); }}
            className="h-8 w-44"
          />
        ) : (
          <button onClick={() => setEditingTitle(true)} dir="auto"
            className="max-w-[160px] truncate text-sm font-semibold text-zinc-100 hover:text-white hover:underline"
            title="Rename board"
          >
            {board.t}
          </button>
        )}
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
