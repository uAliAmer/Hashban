import { useRef, useState } from "react";
import {
  AlignJustify,
  Download,
  Layers,
  QrCode,
  Redo2,
  Search,
  Share2,
  Trash,
  Undo2,
  Upload,
  X,
} from "lucide-react";
import { QRDialog } from "@/components/QRDialog";
import { BoardSwitcher } from "@/components/BoardSwitcher";
import { Board, defaultBoard, isBoard, SOFT_LIMIT } from "@/lib/board";
import { addLane, renameBoard } from "@/lib/ops";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  // compact and setCompact come from props (§V.22 ephemeral)
  const fileRef = useRef<HTMLInputElement>(null);
  const [editingTitle, setEditingTitle] = useState(false);

  // §T9 — copy share URL = location.href (hash holds full state)
  async function copyShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // fallback: select-less prompt
      window.prompt("Copy this URL:", window.location.href);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

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

      {/* §V.21 — board switcher: save/load from localStorage index */}
      <BoardSwitcher board={board} />

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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setQrOpen(true)}
          aria-label="Show QR code"
          title="QR code"
        >
          <QrCode size={16} />
        </Button>
        <Button onClick={copyShare} size="sm">
          <Share2 size={15} /> {copied ? "Copied!" : "Share"}
        </Button>
      </div>
      <QRDialog open={qrOpen} onClose={() => setQrOpen(false)} />
    </header>
  );
}
