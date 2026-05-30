import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  AlignJustify,
  Download,
  Layers,
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
import { Board, defaultBoard, isBoard, SOFT_LIMIT } from "@/lib/board";
import { addLane, renameBoard } from "@/lib/ops";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// §T25/§V.19 — Share button: copies URL on click + shows inline QR popover.
function ShareButton() {
  const [copied, setCopied] = useState(false);       // main button flash
  const [linkCopied, setLinkCopied] = useState(false); // inline copy animation
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      window.prompt("Copy this URL:", window.location.href);
    }
  }

  async function handleShare() {
    await copyUrl();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    // also animate the link row so user sees confirmation inside the popover
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);

    if (!qrOpen) {
      QRCode.toDataURL(window.location.href, {
        width: 200, margin: 1,
        color: { dark: "#e4e4e7", light: "#18181b" },
      }).then(setQrDataUrl).catch(() => setQrDataUrl(""));
      setQrOpen(true);
    } else {
      setQrOpen(false);
    }
  }

  async function handleInlineCopy() {
    await copyUrl();
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  // close on click outside
  useEffect(() => {
    if (!qrOpen) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node))
        setQrOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [qrOpen]);

  const url = window.location.href;

  return (
    <div ref={popoverRef} className="relative">
      <Button onClick={handleShare} size="sm">
        <Share2 size={15} /> {copied ? "Copied!" : "Share"}
      </Button>

      {qrOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border border-zinc-700 bg-zinc-900 p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-300">Share board</span>
            <button
              onClick={() => setQrOpen(false)}
              className="rounded p-0.5 text-zinc-500 hover:text-zinc-200"
              aria-label="Close"
            >
              <X size={13} />
            </button>
          </div>

          {/* link row with animated copy feedback */}
          <div
            className={`mb-3 flex items-center gap-1.5 overflow-hidden rounded-lg border px-2 py-1.5 transition-all duration-300 ${
              linkCopied
                ? "border-green-500/60 bg-green-950/40"
                : "border-zinc-700 bg-zinc-800"
            }`}
          >
            <span
              className={`flex-1 truncate text-[11px] transition-colors duration-300 ${
                linkCopied ? "text-green-300" : "text-zinc-400"
              }`}
            >
              {url.length > 36 ? url.slice(0, 36) + "…" : url}
            </span>
            <button
              onClick={handleInlineCopy}
              className={`shrink-0 rounded p-1 transition-all duration-200 ${
                linkCopied
                  ? "text-green-400 scale-110"
                  : "text-zinc-500 hover:text-zinc-200"
              }`}
              aria-label="Copy link"
              title="Copy link"
            >
              {linkCopied ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </div>

          {/* QR code */}
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR code" className="w-full rounded-lg" />
          ) : (
            <div className="flex h-48 items-center justify-center text-xs text-zinc-600">
              Generating…
            </div>
          )}
          <p className="mt-1.5 text-center text-[9px] text-zinc-600">Scan to open on another device</p>
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
  // compact and setCompact come from props (§V.22 ephemeral)
  const fileRef = useRef<HTMLInputElement>(null);
  const [editingTitle, setEditingTitle] = useState(false);

  // §T11 — export current board as JSON file
  function exportJson() {
    const blob = new Blob([JSON.stringify(board, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${board.t || "hashban"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // §T11 — import JSON file -> board (validated via isBoard, §V.3)
  function importJson(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (isBoard(parsed)) setBoard(parsed);
        else window.alert("Invalid board file.");
      } catch {
        window.alert("Could not parse JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <header className="flex flex-wrap items-center gap-2 border-b border-zinc-800 px-3 py-2">
      <span className="font-mono text-sm font-bold text-zinc-100">#</span>
      {editingTitle ? (
        <Input
          autoFocus
          defaultValue={board.t}
          onBlur={(e) => {
            setBoard((b) => renameBoard(b, e.target.value.trim() || "Board"));
            setEditingTitle(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") setEditingTitle(false);
          }}
          className="h-8 w-48"
        />
      ) : (
        <button
          onClick={() => setEditingTitle(true)}
          className="text-base font-semibold text-zinc-100 hover:underline"
          title="Rename board"
        >
          {board.t}
        </button>
      )}

      {/* §V.21 — board sidebar: save/load from localStorage index */}
      <BoardSidebar board={board} />

      {/* §V.11 — ephemeral search/filter, never persisted */}
      <div className="relative ml-2 hidden sm:block">
        <Search
          size={14}
          className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter cards…"
          className="h-8 w-44 pl-7 pr-7"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="Clear filter"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1">
        <ThemePicker />
        {/* §V.22 — compact view toggle */}
        <Button
          variant="ghost"
          size="icon"
          title={compact ? "Normal view" : "Compact view"}
          aria-label={compact ? "Normal view" : "Compact view"}
          onClick={() => setCompact(!compact)}
          className={compact ? "text-blue-400" : ""}
        >
          <AlignJustify size={16} />
        </Button>
        {/* §V.17 — swimlane toggle */}
        <Button
          variant="ghost"
          size="icon"
          title={board.lanes?.length ? "Exit swimlane mode" : "Enter swimlane mode"}
          aria-label={board.lanes?.length ? "Exit swimlane mode" : "Swimlanes"}
          onClick={() => {
            if (board.lanes?.length) {
              setBoard((b) => ({ ...b, lanes: [] }));
            } else {
              setBoard((b) => addLane(b, "Lane 1"));
            }
          }}
          className={board.lanes?.length ? "text-blue-400" : ""}
        >
          <Layers size={16} />
        </Button>
        {overLimit && (
          <span
            className="mr-1 rounded bg-amber-900/60 px-2 py-1 text-xs text-amber-200"
            title={`URL payload ${payloadLen} chars ≥ ${SOFT_LIMIT}. May exceed browser limits when sharing.`}
          >
            ⚠ URL long ({payloadLen})
          </span>
        )}
        <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo}
          aria-label="Undo" title="Undo">
          <Undo2 size={16} />
        </Button>
        <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo}
          aria-label="Redo" title="Redo">
          <Redo2 size={16} />
        </Button>
        <Button variant="ghost" size="icon" onClick={exportJson}
          aria-label="Export JSON" title="Export JSON">
          <Download size={16} />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => fileRef.current?.click()}
          aria-label="Import JSON" title="Import JSON">
          <Upload size={16} />
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={importJson}
        />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Clear board"
          title="Clear board"
          onClick={() => {
            if (window.confirm("Reset to a fresh empty board?"))
              setBoard(defaultBoard());
          }}
        >
          <Trash size={16} />
        </Button>
        {/* Share button: copies URL on click + shows QR popover */}
        <ShareButton />
      </div>
    </header>
  );
}
