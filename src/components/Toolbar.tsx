import { useRef, useState } from "react";
import {
  Download,
  Redo2,
  Share2,
  Trash,
  Undo2,
  Upload,
} from "lucide-react";
import { Board, defaultBoard, isBoard, SOFT_LIMIT } from "@/lib/board";
import { renameBoard } from "@/lib/ops";
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
}: {
  board: Board;
  setBoard: (next: Board | ((p: Board) => Board)) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  payloadLen: number;
  overLimit: boolean;
}) {
  const [copied, setCopied] = useState(false);
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

      <div className="ml-auto flex items-center gap-1">
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
        <Button onClick={copyShare} size="sm">
          <Share2 size={15} /> {copied ? "Copied!" : "Share"}
        </Button>
      </div>
    </header>
  );
}
