import { useRef, useState } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { ChevronLeft, Palette, Plus, Trash2 } from "lucide-react";
import { Col, Card } from "@/lib/board";
import { CardItem } from "./CardItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const COL_SWATCHES = [
  "",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
];

export function Column({
  col,
  cards,
  filtered,
  hiddenCount,
  focusedId,
  compact,
  collapsed,
  onToggleCollapse,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onRename,
  onSetWip,
  onSetColor,
  onFocusCard,
  onDelete,
}: {
  col: Col;
  cards: Card[];
  filtered: boolean;
  hiddenCount: number;
  focusedId: string | null;
  compact: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onAddCard: (txt: string) => void;
  onEditCard: (card: Card) => void;
  onDeleteCard: (cardId: string) => void;
  onRename: (name: string) => void;
  onSetWip: (wip?: number) => void;
  onSetColor: (color?: string) => void;
  onFocusCard: (id: string) => void;
  onDelete: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [editingWip, setEditingWip] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // §V.20 — column-level sortable (drag handle = grip icon)
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: col.id,
    data: { type: "column", colId: col.id },
  });

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // empty-column drop target §V.5
  const { setNodeRef: setDropRef } = useDroppable({
    id: `col-drop-${col.id}`,
    data: { type: "col", colId: col.id },
  });

  const overLimit = col.wip !== undefined && col.cards.length > col.wip;

  function commitAdd() {
    const t = draft.trim();
    if (t) onAddCard(t);
    setDraft("");
    setAdding(false);
  }

  // §V.20 — drag placeholder: show drop slot while this column is being dragged
  if (isDragging) {
    return (
      <div
        ref={setSortableRef}
        style={sortableStyle}
        className="w-72 shrink-0 rounded-lg border-2 border-dashed border-zinc-600 bg-zinc-800/20"
      />
    );
  }

  // §V.23 — collapsed: slim vertical bar
  if (collapsed) {
    return (
      <div
        ref={setSortableRef}
        style={sortableStyle}
        className="relative flex h-48 w-10 shrink-0 cursor-pointer select-none flex-col items-center justify-between rounded-lg bg-[var(--color-col-bg)] py-2"
        onClick={onToggleCollapse}
        title={`Expand "${col.name}"`}
      >
        {col.color && (
          <div className="absolute left-0 top-0 h-1 w-full rounded-t-lg" style={{ background: col.color }} />
        )}
        <ChevronLeft size={14} className="rotate-180 text-zinc-500" />
        <span
          className="flex-1 truncate text-[11px] font-medium text-zinc-400"
          style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
        >
          {col.name}
        </span>
        <span className="text-[10px] tabular-nums text-zinc-600">{col.cards.length}</span>
      </div>
    );
  }

  return (
    <div
      ref={setSortableRef}
      style={sortableStyle}
      className="relative flex w-72 shrink-0 flex-col rounded-lg bg-[var(--color-col-bg)] p-2"
    >
      {col.color && (
        <div className="absolute left-0 top-0 h-1 w-full rounded-t-lg" style={{ background: col.color }} />
      )}

      {/* §V.20 — drag from anywhere on header; activationConstraint distance:5 means clicks still fire */}
      <div
        className="mb-2 flex cursor-grab items-center gap-1 active:cursor-grabbing"
        style={{ marginTop: col.color ? "4px" : undefined }}
        {...attributes}
        {...listeners}
      >
        {editingName ? (
          <Input
            autoFocus
            defaultValue={col.name}
            dir="auto"
            onPointerDown={(e) => e.stopPropagation()}
            onBlur={(e) => { onRename(e.target.value.trim() || col.name); setEditingName(false); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") setEditingName(false);
            }}
            className="h-7"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            onPointerDown={(e) => e.stopPropagation()}
            dir="auto"
            className="flex-1 truncate text-left text-sm font-semibold text-zinc-200"
            title="Click to rename"
          >
            {col.name}
          </button>
        )}

        {/* WIP badge */}
        {editingWip ? (
          <Input
            autoFocus
            type="number"
            min={0}
            defaultValue={col.wip ?? ""}
            placeholder="∞"
            onPointerDown={(e) => e.stopPropagation()}
            onBlur={(e) => {
              const v = e.target.value.trim();
              onSetWip(v === "" ? undefined : Number(v));
              setEditingWip(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") setEditingWip(false);
            }}
            className="h-7 w-16"
          />
        ) : (
          <button
            onClick={() => setEditingWip(true)}
            onPointerDown={(e) => e.stopPropagation()}
            title="Set WIP limit"
            className={cn(
              "rounded px-1.5 py-0.5 text-xs tabular-nums",
              overLimit ? "bg-red-900/70 font-semibold text-red-200" : "text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"
            )}
          >
            {col.cards.length}{col.wip !== undefined ? `/${col.wip}` : ""}
          </button>
        )}

        {/* Color picker — stop pointer so header drag doesn't fire */}
        <div className="relative" onPointerDown={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" onClick={() => setShowColorPicker((v) => !v)} aria-label="Column color" title="Column color">
            <Palette size={14} style={{ color: col.color || undefined }} />
          </Button>
          {showColorPicker && (
            <div
              ref={colorPickerRef}
              className="absolute right-0 top-full z-20 mt-1 flex gap-1 rounded-md border border-zinc-700 bg-zinc-900 p-1.5 shadow-lg"
            >
              {COL_SWATCHES.map((c) => (
                <button
                  key={c || "none"}
                  onClick={() => { onSetColor(c || undefined); setShowColorPicker(false); }}
                  className={`h-5 w-5 rounded-full border-2 ${col.color === c ? "border-white" : "border-transparent"}`}
                  style={{ background: c || "transparent" }}
                  aria-label={c ? `color ${c}` : "no color"}
                >
                  {!c && <span className="text-[10px] text-zinc-500">∅</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* §V.23 — collapse button */}
        <Button variant="ghost" size="icon" onClick={onToggleCollapse} onPointerDown={(e) => e.stopPropagation()} aria-label="Collapse column" title="Collapse column">
          <ChevronLeft size={14} />
        </Button>

        <Button variant="ghost" size="icon" onClick={onDelete} onPointerDown={(e) => e.stopPropagation()} aria-label="Delete column">
          <Trash2 size={14} />
        </Button>
      </div>

      <div ref={setDropRef} className="flex min-h-2 flex-1 flex-col gap-2 overflow-y-auto">
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              colId={col.id}
              focused={card.id === focusedId}
              compact={compact}
              onFocus={() => onFocusCard(card.id)}
              onEdit={() => onEditCard(card)}
              onDelete={() => onDeleteCard(card.id)}
            />
          ))}
        </SortableContext>
        {filtered && hiddenCount > 0 && (
          <div className="px-1 text-[11px] text-zinc-500">{hiddenCount} hidden by filter</div>
        )}
      </div>

      {adding ? (
        <div className="mt-2">
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitAdd(); }
              if (e.key === "Escape") { setDraft(""); setAdding(false); }
            }}
            placeholder="Card text… (Enter to add)"
            className="w-full rounded-md border border-zinc-600 bg-zinc-800 p-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          />
          <div className="mt-1 flex gap-2">
            <Button size="sm" onClick={commitAdd}>Add</Button>
            <Button size="sm" variant="ghost" onClick={() => { setDraft(""); setAdding(false); }}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button variant="ghost" size="sm" className="mt-2 justify-start" onClick={() => setAdding(true)}>
          <Plus size={14} /> Add card
        </Button>
      )}
    </div>
  );
}
